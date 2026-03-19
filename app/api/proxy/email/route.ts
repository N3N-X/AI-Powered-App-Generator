import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
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
import { EmailProxyRequestSchema } from "@/types/proxy";
import { getEmailConfig } from "@/lib/proxy-config";
import { resolveOwnerEmail } from "./resolve-owner";
import { sendEmailWithSendgrid } from "./sendgrid";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
  if (limited) return limited;

  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, "email")) {
    return proxyError(
      "This API key does not have access to the Email service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "email");
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

  const parsed = EmailProxyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const emailData = parsed.data as Record<string, unknown> & typeof parsed.data;
  // Resolve toOwner → actual recipient
  if (emailData.toOwner && !emailData.to) {
    const ownerEmail = await resolveOwnerEmail(projectId);
    if (!ownerEmail)
      return proxyError(
        "Could not resolve notification email",
        "NO_RECIPIENT",
        400,
      );
    emailData.to = ownerEmail;
  }

  // Must have either text or html content
  if (!emailData.text && !emailData.html) {
    return proxyError(
      "Email must have either text or html content",
      "VALIDATION_ERROR",
      400,
    );
  }

  // Calculate recipient count for credits
  const toCount = Array.isArray(emailData.to) ? emailData.to.length : 1;
  const ccCount = emailData.cc?.length || 0;
  const bccCount = emailData.bcc?.length || 0;
  const totalRecipients = toCount + ccCount + bccCount;
  const creditsRequired = 2 * totalRecipients; // 2 credits per recipient

  // Check credits
  const creditCheck = await checkCredits(
    userId,
    plan,
    "email",
    totalRecipients,
  );
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: ${creditsRequired}, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  // Apply proxy config defaults
  const emailConfig = await getEmailConfig(projectId);
  if (emailConfig) {
    if (!emailData.from && emailConfig.fromAddress) {
      emailData.from = emailConfig.fromAddress;
    }
    if (!emailData.replyTo && emailConfig.replyTo) {
      emailData.replyTo = emailConfig.replyTo;
    }
    if (
      emailConfig.subjectPrefix &&
      !emailData.subject.startsWith(emailConfig.subjectPrefix)
    ) {
      emailData.subject = `${emailConfig.subjectPrefix} ${emailData.subject}`;
    }
  }

  // Fallback: use owner's email as fromAddress if still not set
  let resolvedFromName = emailConfig?.fromName;
  if (!emailData.from) {
    const ownerEmail = await resolveOwnerEmail(projectId);
    if (ownerEmail) {
      emailData.from = ownerEmail;
    }
  }

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const defaultSender =
    process.env.SENDGRID_DEFAULT_SENDER || "noreply@rux.app";

  if (!sendgridApiKey) {
    return proxyError(
      "Email service not configured",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }

  try {
    const sendResult = await sendEmailWithSendgrid({
      emailData,
      sendgridApiKey,
      defaultSender,
      resolvedFromName,
    });
    if (!sendResult.ok) {
      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: "email",
        operation: "send",
        creditsUsed: 0,
        success: false,
        errorCode: `SENDGRID_${sendResult.status}`,
        metadata: {
          recipientCount: totalRecipients,
          subject: emailData.subject,
        },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(
        sendResult.errorMessage || "Failed to send email",
        "EMAIL_ERROR",
        sendResult.status,
      );
    }

    const messageId = sendResult.messageId;

    // Deduct credits
    const deduction = await deductCredits(userId, "email", totalRecipients);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "email",
      operation: "send",
      creditsUsed: creditsRequired,
      success: true,
      metadata: {
        recipientCount: totalRecipients,
        subject: emailData.subject,
        hasAttachments: !!emailData.attachments?.length,
        messageId: messageId || null,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      success: true,
      messageId,
      creditsUsed: creditsRequired,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "email",
      operation: "send",
      creditsUsed: 0,
      success: false,
      errorCode: "NETWORK_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      "Failed to connect to email service",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
}
