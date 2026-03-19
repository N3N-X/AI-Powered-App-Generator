import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/voice/validate-twilio";
import { twimlResponse } from "@/lib/voice/twiml";

/**
 * Twilio calls this endpoint when a browser Device.connect() is made.
 * It receives the `To` parameter and returns TwiML to dial that number.
 */
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

  const to = body.To || "";
  const callSid = body.CallSid || "";
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";

  if (!to) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>No phone number provided.</Say>
</Response>`;
    return twimlResponse(twiml);
  }

  // Log outgoing call
  if (callSid) {
    const supabase = createAdminClient();
    await supabase.from("call_logs").insert({
      call_sid: callSid,
      caller_number: to,
      status: "initiated",
      direction: "outgoing",
    });
  }

  // Dial the number — this connects the browser caller to the phone number
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${twilioPhoneNumber}">${to}</Dial>
</Response>`;

  return twimlResponse(twiml);
}
