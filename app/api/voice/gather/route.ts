import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/voice/validate-twilio";
import { generateVoiceResponse } from "@/lib/voice/grok-agent";
import {
  gatherWithSay,
  sayThenDial,
  sayGoodbye,
  twimlResponse,
} from "@/lib/voice/twiml";

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

  const speechResult = body.SpeechResult || "";
  const { searchParams } = new URL(request.url);
  const callSid = searchParams.get("callSid") || "";
  const step = searchParams.get("step") || "initial";
  const plan = searchParams.get("plan") || "";
  const turnStr = searchParams.get("turn") || "1";
  const turn = parseInt(turnStr, 10);

  if (!callSid) {
    return twimlResponse(sayGoodbye("An error occurred. Goodbye."));
  }

  const supabase = createAdminClient();

  // Fetch voice settings
  const { data: settings } = await supabase
    .from("voice_settings")
    .select("*")
    .limit(1)
    .single();

  const maxTurns = settings?.max_conversation_turns ?? 5;
  const systemPrompt =
    settings?.system_prompt || "You are a helpful AI phone agent. Be concise.";

  // Fetch existing conversation from call log
  const { data: callLog } = await supabase
    .from("call_logs")
    .select("conversation")
    .eq("call_sid", callSid)
    .single();

  const conversation: { role: "caller" | "agent"; text: string }[] =
    callLog?.conversation || [];

  // Add caller's speech
  if (speechResult) {
    conversation.push({ role: "caller", text: speechResult });
  }

  // Generate Grok response
  let agentResponse: string;
  try {
    agentResponse = await generateVoiceResponse(
      systemPrompt,
      conversation,
      speechResult,
    );
  } catch (error) {
    console.error("Grok voice agent error:", error);
    agentResponse =
      "I apologize, I'm having some trouble right now. Please try calling back later.";
  }

  // Add agent response to conversation
  conversation.push({ role: "agent", text: agentResponse });

  // Update call log
  await supabase
    .from("call_logs")
    .update({ conversation })
    .eq("call_sid", callSid);

  const isPaidUser = plan === "PRO" || plan === "ELITE";
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
  const forwardingNumber = settings?.forwarding_number || "+13103007171";

  // PRO/ELITE: after initial question, forward the call
  if (isPaidUser && step === "initial") {
    await supabase
      .from("call_logs")
      .update({
        forwarded: true,
        outcome: "forwarded",
        status: "forwarded",
      })
      .eq("call_sid", callSid);

    const forwardMessage = `${agentResponse} Let me connect you with our team now.`;
    return twimlResponse(
      sayThenDial(forwardMessage, forwardingNumber, twilioPhoneNumber),
    );
  }

  // Check if we've reached max turns
  if (turn >= maxTurns) {
    await supabase
      .from("call_logs")
      .update({ outcome: "max-turns", status: "completed" })
      .eq("call_sid", callSid);

    return twimlResponse(
      sayGoodbye(
        `${agentResponse} Thank you for calling Rulxy. For more help, visit our website or upgrade to a Pro plan for direct support. Goodbye!`,
      ),
    );
  }

  // Continue conversation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
  const params = new URLSearchParams({
    callSid,
    step: "continue",
    ...(plan && { plan }),
    turn: String(turn + 1),
  });
  const actionUrl = `${baseUrl}/api/voice/gather?${params.toString()}`;

  return twimlResponse(gatherWithSay(agentResponse, actionUrl));
}
