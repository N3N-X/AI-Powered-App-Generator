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
} from "@/lib/proxy";
import { EmailProxyRequestSchema } from "@/types/proxy";
import { ProxyService } from "@prisma/client";

/**
 * @swagger
 * /api/proxy/email:
 *   post:
 *     summary: Email Sending Proxy (SendGrid)
 *     description: |
 *       Proxied access to email sending via SendGrid. Generated apps can send
 *       emails without needing their own SendGrid API key.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 30 emails per minute per project.
 *
 *       **Credits:** 2 credits per email sent.
 *
 *       **Sender:** Emails are sent from noreply@yourdomain.com unless a custom
 *       verified sender is configured.
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
 *               - subject
 *             properties:
 *               to:
 *                 oneOf:
 *                   - type: string
 *                     format: email
 *                   - type: array
 *                     items:
 *                       type: string
 *                       format: email
 *                 description: Recipient email address(es)
 *               subject:
 *                 type: string
 *                 maxLength: 500
 *                 description: Email subject line
 *               text:
 *                 type: string
 *                 description: Plain text body
 *               html:
 *                 type: string
 *                 description: HTML body
 *               from:
 *                 type: string
 *                 description: Sender email (must be verified, defaults to platform sender)
 *               replyTo:
 *                 type: string
 *                 format: email
 *                 description: Reply-to address
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: CC recipients
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: BCC recipients
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     content:
 *                       type: string
 *                       description: Base64 encoded content
 *                     contentType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
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
 *         description: Email service error
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
  if (!hasServiceAccess(services, ProxyService.EMAIL)) {
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

  const emailData = parsed.data;

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
    // Build SendGrid personalizations
    const toEmails = Array.isArray(emailData.to)
      ? emailData.to
      : [emailData.to];
    const personalizations: Array<{
      to: Array<{ email: string }>;
      cc?: Array<{ email: string }>;
      bcc?: Array<{ email: string }>;
    }> = [
      {
        to: toEmails.map((email) => ({ email })),
      },
    ];

    if (emailData.cc) {
      personalizations[0].cc = emailData.cc.map((email) => ({ email }));
    }
    if (emailData.bcc) {
      personalizations[0].bcc = emailData.bcc.map((email) => ({ email }));
    }

    // Build content
    const content: Array<{ type: string; value: string }> = [];
    if (emailData.text) {
      content.push({ type: "text/plain", value: emailData.text });
    }
    if (emailData.html) {
      content.push({ type: "text/html", value: emailData.html });
    }

    // Build SendGrid payload
    const sendgridPayload: {
      personalizations: typeof personalizations;
      from: { email: string };
      reply_to?: { email: string };
      subject: string;
      content: typeof content;
      attachments?: Array<{
        content: string;
        filename: string;
        type?: string;
        disposition: string;
      }>;
    } = {
      personalizations,
      from: { email: emailData.from || defaultSender },
      subject: emailData.subject,
      content,
    };

    if (emailData.replyTo) {
      sendgridPayload.reply_to = { email: emailData.replyTo };
    }

    if (emailData.attachments && emailData.attachments.length > 0) {
      sendgridPayload.attachments = emailData.attachments.map((att) => ({
        content: att.content,
        filename: att.filename,
        type: att.contentType,
        disposition: "attachment",
      }));
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify(sendgridPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: ProxyService.EMAIL,
        operation: "send",
        creditsUsed: 0,
        success: false,
        errorCode: `SENDGRID_${response.status}`,
        metadata: {
          recipientCount: totalRecipients,
          subject: emailData.subject,
        },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(
        (errorData as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message || "Failed to send email",
        "EMAIL_ERROR",
        response.status,
      );
    }

    // Get message ID from headers
    const messageId = response.headers.get("x-message-id") || undefined;

    // Deduct credits
    const deduction = await deductCredits(userId, "email", totalRecipients);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.EMAIL,
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
      service: ProxyService.EMAIL,
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
