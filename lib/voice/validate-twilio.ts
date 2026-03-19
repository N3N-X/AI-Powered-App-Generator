import { NextRequest } from "next/server";
import crypto from "crypto";

/**
 * Validate that an incoming request is genuinely from Twilio
 * by checking the X-Twilio-Signature header against a computed HMAC.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(
  request: NextRequest,
  body: Record<string, string>,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  // Build the full URL Twilio used (must match exactly)
  const url = request.url;

  // Sort body params alphabetically and concatenate key+value
  const sortedKeys = Object.keys(body).sort();
  const dataString =
    url + sortedKeys.map((key) => key + body[key]).join("");

  const computed = crypto
    .createHmac("sha1", authToken)
    .update(dataString)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computed),
  );
}
