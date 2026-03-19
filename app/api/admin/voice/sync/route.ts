import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rate-limit";

async function twilioFetch(url: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  const res = await fetch(url, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Twilio API error:", res.status, text);
    throw new Error(`Twilio API error: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
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
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    return NextResponse.json(
      { error: "Twilio not configured" },
      { status: 503 },
    );
  }

  const adminDb = createAdminClient();
  let syncedCalls = 0;
  let syncedMessages = 0;

  try {
    // Sync calls (last 100)
    const callsData = await twilioFetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?PageSize=100`,
    );

    for (const call of callsData.calls || []) {
      const direction =
        call.direction === "outbound-api" || call.direction === "outbound-dial"
          ? "outgoing"
          : "incoming";

      const { error } = await adminDb.from("call_logs").upsert(
        {
          call_sid: call.sid,
          caller_number: direction === "incoming" ? call.from : call.to,
          status: call.status,
          direction,
          duration_seconds: call.duration ? parseInt(call.duration, 10) : null,
          created_at: call.date_created,
          ended_at: call.end_time || null,
          outcome: call.status,
        },
        { onConflict: "call_sid" },
      );

      if (!error) syncedCalls++;
    }

    // Sync messages (last 100)
    const msgsData = await twilioFetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=100`,
    );

    for (const msg of msgsData.messages || []) {
      const direction =
        msg.direction === "outbound-api" || msg.direction === "outbound-reply"
          ? "outgoing"
          : "incoming";

      // Check if already exists by message_sid
      const { data: existing } = await adminDb
        .from("message_logs")
        .select("id")
        .eq("message_sid", msg.sid)
        .single();

      if (!existing) {
        const { error } = await adminDb.from("message_logs").insert({
          message_sid: msg.sid,
          direction,
          from_number: msg.from,
          to_number: msg.to,
          body: msg.body || "",
          status: msg.status,
          created_at: msg.date_created,
        });

        if (!error) syncedMessages++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedCalls,
      syncedMessages,
    });
  } catch (error) {
    console.error("Twilio sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
