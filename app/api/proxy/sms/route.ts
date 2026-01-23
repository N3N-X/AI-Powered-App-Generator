import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  deductCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
  proxyCorsOptions,
} from "@/lib/proxy";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}
import { SMSProxyRequestSchema } from "@/types/proxy";
import type { ProxyService } from "@/lib/supabase/types";

/**
 * @swagger
 * /api/proxy/sms:
 *   post:
 *     summary: SMS Sending Proxy (Twilio)
 *     description: |
 *       Proxied access to SMS sending via Twilio. Generated apps can send
 *       SMS messages without needing their own Twilio account.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 20 SMS per minute per project.
 *
 *       **Credits:** 5 credits per SMS sent.
 *
 *       **Phone Number Format:** Must be in E.164 format (e.g., +14155552671).
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 pattern: '^\+[1-9]\d{1,14}$'
 *                 description: Recipient phone number in E.164 format
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1600
 *                 description: SMS message content (max 1600 chars for concatenated SMS)
 *               from:
 *                 type: string
 *                 description: Sender phone number (defaults to platform number)
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messageId:
 *                   type: string
 *                 creditsUsed:
 *                   type: integer
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       402:
 *         description: Insufficient credits
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: SMS service error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, "SMS)) {
    return proxyError(
      "This API key does not have access to the SMS service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "sms");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  // Parse request
  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const parsed = SMSProxyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const smsData = parsed.data;

  // Calculate SMS segments (160 chars per segment for GSM-7, less for Unicode)
  const segmentCount = Math.ceil(smsData.message.length / 160);
  const creditsRequired = 5 * segmentCount; // 5 credits per segment

  // Check credits
  const creditCheck = await checkCredits(userId, plan, "sms", segmentCount);
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: ${creditsRequired}, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return proxyError("SMS service not configured", "SERVICE_UNAVAILABLE", 503);
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", smsData.to);
    formData.append("From", smsData.from || twilioPhoneNumber);
    formData.append("Body", smsData.message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString(
            "base64",
          ),
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: "SMS,
        operation: "send",
        creditsUsed: 0,
        success: false,
        errorCode: `TWILIO_${data.code || response.status}`,
        metadata: {
          to: smsData.to,
          messageLength: smsData.message.length,
        },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(
        data.message || "Failed to send SMS",
        "SMS_ERROR",
        response.status,
      );
    }

    // Deduct credits
    const deduction = await deductCredits(userId, "sms", segmentCount);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "SMS,
      operation: "send",
      creditsUsed: creditsRequired,
      success: true,
      metadata: {
        to: smsData.to,
        messageLength: smsData.message.length,
        segmentCount,
        messageId: data.sid,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      success: true,
      messageId: data.sid,
      status: data.status,
      creditsUsed: creditsRequired,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "SMS,
      operation: "send",
      creditsUsed: 0,
      success: false,
      errorCode: "NETWORK_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      "Failed to connect to SMS service",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
}
