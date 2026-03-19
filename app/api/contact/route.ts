import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRateLimit } from "@/lib/rate-limit";

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(500),
  message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions per minute per IP
  const limited = await withRateLimit(request, { limit: 5, window: 60_000 });
  if (limited) return limited;

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sender = process.env.SENDGRID_DEFAULT_SENDER || "noreply@rulxy.com";

  if (!sendgridApiKey) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Validation error" },
      { status: 400 },
    );
  }

  const { name, email, subject, message } = parsed.data;

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "support@rulxy.com" }],
            subject: `[Contact Form] ${subject}`,
          },
        ],
        from: { email: sender, name: "Rulxy Contact Form" },
        reply_to: { email, name },
        content: [
          {
            type: "text/html",
            value: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(email)}</p>
              <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
              <hr />
              <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("SendGrid error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
