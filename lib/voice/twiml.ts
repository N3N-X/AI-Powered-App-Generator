/**
 * TwiML XML response builders for Twilio voice webhooks
 */

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const VOICE = "Google.en-US-Neural2-F";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function gatherWithSay(
  sayText: string,
  actionUrl: string,
  options?: { timeout?: number; speechTimeout?: string; language?: string },
): string {
  const timeout = options?.timeout ?? 5;
  const speechTimeout = options?.speechTimeout ?? "auto";
  const language = options?.language ?? "en-US";

  return `${XML_HEADER}
<Response>
  <Gather input="speech" action="${escapeXml(actionUrl)}" timeout="${timeout}" speechTimeout="${speechTimeout}" language="${language}" method="POST">
    <Say voice="${VOICE}">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="${VOICE}">We didn't receive any input. Goodbye!</Say>
</Response>`;
}

export function sayThenDial(
  sayText: string,
  dialNumber: string,
  callerId: string,
): string {
  return `${XML_HEADER}
<Response>
  <Say voice="${VOICE}">${escapeXml(sayText)}</Say>
  <Dial callerId="${escapeXml(callerId)}">${escapeXml(dialNumber)}</Dial>
</Response>`;
}

export function sayGoodbye(text: string): string {
  return `${XML_HEADER}
<Response>
  <Say voice="${VOICE}">${escapeXml(text)}</Say>
</Response>`;
}

export function smsReply(text: string): string {
  return `${XML_HEADER}
<Response>
  <Message>${escapeXml(text)}</Message>
</Response>`;
}

export function twimlResponse(twiml: string): Response {
  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
