import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/voice/validate-twilio";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  if (process.env.NODE_ENV === "production") {
    if (!validateTwilioSignature(request, body)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const callSid = body.CallSid || "";
  const callStatus = body.CallStatus || "";
  const callDuration = body.CallDuration
    ? parseInt(body.CallDuration, 10)
    : null;

  if (!callSid) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    ended_at: new Date().toISOString(),
  };

  if (callDuration !== null) {
    updates.duration_seconds = callDuration;
  }

  if (callStatus === "completed" || callStatus === "busy" || callStatus === "no-answer" || callStatus === "failed" || callStatus === "canceled") {
    // Only update status if not already set to 'forwarded'
    const { data: existing } = await supabase
      .from("call_logs")
      .select("status")
      .eq("call_sid", callSid)
      .single();

    if (existing?.status !== "forwarded") {
      updates.status = callStatus;
      if (!existing?.status || existing.status === "in-progress") {
        updates.outcome = callStatus === "completed" ? "completed" : callStatus;
      }
    }
  }

  await supabase.from("call_logs").update(updates).eq("call_sid", callSid);

  return new Response("OK", { status: 200 });
}
