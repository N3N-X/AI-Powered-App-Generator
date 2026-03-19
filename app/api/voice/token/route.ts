import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rate-limit";
import twilio from "twilio";

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", uid)
    .single();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    return NextResponse.json(
      { error: "Twilio voice client not configured. Need TWILIO_API_KEY, TWILIO_API_SECRET, and TWILIO_TWIML_APP_SID." },
      { status: 503 },
    );
  }

  const identity = `admin-${uid}`;

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600, // 1 hour
  });

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: false,
  });

  token.addGrant(voiceGrant);

  return NextResponse.json({
    token: token.toJwt(),
    identity,
  });
}
