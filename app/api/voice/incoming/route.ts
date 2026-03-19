import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/voice/validate-twilio";
import { gatherWithSay, sayGoodbye, twimlResponse } from "@/lib/voice/twiml";

export async function POST(request: NextRequest) {
  // Parse form-urlencoded body from Twilio
  const formData = await request.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = value.toString();
  });

  // Validate Twilio signature in production
  if (process.env.NODE_ENV === "production") {
    if (!validateTwilioSignature(request, body)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const callerNumber = body.From || "";
  const callSid = body.CallSid || "";

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

  if (!settings?.enabled) {
    return twimlResponse(
      sayGoodbye(
        "Thank you for calling. We are currently unavailable. Please try again later.",
      ),
    );
  }

  // Look up caller by phone number
  let userId: string | null = null;
  let userPlan: string | null = null;
  let userName: string | null = null;

  if (callerNumber) {
    // Normalize: strip spaces/dashes, match with or without +1 prefix
    const normalizedNumber = callerNumber.replace(/[\s\-()]/g, "");
    const { data: matchedUser } = await supabase
      .from("users")
      .select("id, plan, name")
      .eq("phone_number", normalizedNumber)
      .single();

    if (matchedUser) {
      userId = matchedUser.id;
      userPlan = matchedUser.plan;
      userName = matchedUser.name;
    }
  }

  // Build greeting
  const isPaidUser = userPlan === "PRO" || userPlan === "ELITE";
  let greeting: string;

  if (isPaidUser && settings.pro_greeting_message) {
    greeting = settings.pro_greeting_message.replace(
      "{name}",
      userName || "valued customer",
    );
  } else {
    greeting = settings.greeting_message;
  }

  // Create call log entry with initial greeting in conversation
  await supabase.from("call_logs").insert({
    call_sid: callSid,
    caller_number: callerNumber,
    user_id: userId,
    user_plan: userPlan,
    status: "in-progress",
    conversation: [{ role: "agent", text: greeting }],
  });

  // Build action URL with context
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
  const params = new URLSearchParams({
    callSid,
    step: "initial",
    ...(userId && { userId }),
    ...(userPlan && { plan: userPlan }),
  });
  const actionUrl = `${baseUrl}/api/voice/gather?${params.toString()}`;

  return twimlResponse(gatherWithSay(greeting, actionUrl));
}
