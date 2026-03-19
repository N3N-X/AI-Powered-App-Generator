import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/voice/validate-twilio";
import { generateVoiceResponse } from "@/lib/voice/grok-agent";
import { smsReply, twimlResponse } from "@/lib/voice/twiml";

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

  const fromNumber = body.From || "";
  const toNumber = body.To || "";
  const messageBody = body.Body || "";
  const messageSid = body.MessageSid || "";

  if (!messageBody) {
    return twimlResponse(smsReply("Sorry, I couldn't read your message."));
  }

  const supabase = createAdminClient();

  // Fetch SMS settings
  const { data: settings } = await supabase
    .from("voice_settings")
    .select("*")
    .limit(1)
    .single();

  if (!settings?.sms_enabled) {
    return new Response("", { status: 200 });
  }

  // Look up sender
  let userId: string | null = null;
  let userPlan: string | null = null;

  if (fromNumber) {
    const normalized = fromNumber.replace(/[\s\-()]/g, "");
    const { data: matchedUser } = await supabase
      .from("users")
      .select("id, plan")
      .eq("phone_number", normalized)
      .single();

    if (matchedUser) {
      userId = matchedUser.id;
      userPlan = matchedUser.plan;
    }
  }

  // Log incoming message
  await supabase.from("message_logs").insert({
    message_sid: messageSid,
    direction: "incoming",
    from_number: fromNumber,
    to_number: toNumber,
    body: messageBody,
    user_id: userId,
    user_plan: userPlan,
    status: "received",
  });

  // Generate AI response if auto-reply is enabled
  if (!settings.sms_auto_reply) {
    return new Response("", { status: 200 });
  }

  const systemPrompt =
    settings.sms_system_prompt ||
    "You are a helpful AI assistant. Respond concisely to SMS messages.";

  let aiResponse: string;
  try {
    aiResponse = await generateVoiceResponse(systemPrompt, [], messageBody);
  } catch (error) {
    console.error("Grok SMS error:", error);
    aiResponse = "Thanks for your message! We'll get back to you soon.";
  }

  // Log AI reply
  await supabase.from("message_logs").insert({
    direction: "outgoing",
    from_number: toNumber,
    to_number: fromNumber,
    body: aiResponse,
    user_id: userId,
    user_plan: userPlan,
    ai_response: aiResponse,
    status: "sent",
  });

  // Update incoming message with the AI response
  if (messageSid) {
    await supabase
      .from("message_logs")
      .update({ ai_response: aiResponse })
      .eq("message_sid", messageSid);
  }

  return twimlResponse(smsReply(aiResponse));
}
