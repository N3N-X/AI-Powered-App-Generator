import type { EmailProxyRequest } from "@/types/proxy";

interface SendgridResult {
  ok: boolean;
  status: number;
  messageId?: string;
  errorMessage?: string;
}

export async function sendEmailWithSendgrid(params: {
  emailData: EmailProxyRequest;
  sendgridApiKey: string;
  defaultSender: string;
  resolvedFromName?: string;
}): Promise<SendgridResult> {
  const { emailData, sendgridApiKey, defaultSender, resolvedFromName } = params;

  const resolvedTo = emailData.to!;
  const toEmails = Array.isArray(resolvedTo) ? resolvedTo : [resolvedTo];
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

  const content: Array<{ type: string; value: string }> = [];
  if (emailData.text) {
    content.push({ type: "text/plain", value: emailData.text });
  }
  if (emailData.html) {
    content.push({ type: "text/html", value: emailData.html });
  }

  const payload: {
    personalizations: typeof personalizations;
    from: { email: string; name?: string };
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
    from: {
      email: emailData.from || defaultSender,
      ...(resolvedFromName ? { name: resolvedFromName } : {}),
    },
    subject: emailData.subject,
    content,
  };

  if (emailData.replyTo) {
    payload.reply_to = { email: emailData.replyTo };
  }

  if (emailData.attachments && emailData.attachments.length > 0) {
    payload.attachments = emailData.attachments.map((att) => ({
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
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { errors?: Array<{ message?: string }> })?.errors?.[0]
        ?.message || "Failed to send email";
    return { ok: false, status: response.status, errorMessage };
  }

  const messageId = response.headers.get("x-message-id") || undefined;
  return { ok: true, status: response.status, messageId };
}
