import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
  if (limited) return limited;

  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", uid)
    .single();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, message } = body;
  if (!to || typeof to !== "string" || !message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Missing 'to' and 'message' fields" },
      { status: 400 },
    );
  }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", twilioPhoneNumber);
    formData.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64"),
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to send SMS" },
        { status: response.status },
      );
    }

    // Log outgoing message
    const adminDb = createAdminClient();
    await adminDb.from("message_logs").insert({
      message_sid: data.sid,
      direction: "outgoing",
      from_number: twilioPhoneNumber,
      to_number: to,
      body: message,
      status: data.status || "sent",
    });

    return NextResponse.json({
      success: true,
      messageSid: data.sid,
      status: data.status,
    });
  } catch (error) {
    console.error("Outgoing SMS error:", error);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 },
    );
  }
}
