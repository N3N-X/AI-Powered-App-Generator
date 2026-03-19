/**
 * Request early access endpoint.
 * Stores email in access_requests table and optionally notifies admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const supabase = createAdminClient();

    // Check if request already exists
    const { data: existing } = await supabase
      .from("access_requests")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json(
          {
            error:
              "This email already has access. Check your inbox for the invite code.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "You've already requested access. We'll notify you soon!" },
        { status: 400 },
      );
    }

    // Insert new request
    const { error: insertError } = await supabase
      .from("access_requests")
      .insert({
        email: email.toLowerCase(),
        status: "pending",
        requested_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to insert access request:", insertError);
      return NextResponse.json(
        { error: "Failed to submit request" },
        { status: 500 },
      );
    }

    // Notify admin via email
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) =>
      e.trim(),
    );
    const sender = process.env.SENDGRID_DEFAULT_SENDER || "noreply@rulxy.com";

    if (sendgridApiKey && adminEmails?.length) {
      try {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sendgridApiKey}`,
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: adminEmails.map((e) => ({ email: e })),
                subject: "[Rulxy] New Early Access Request",
              },
            ],
            from: { email: sender, name: "Rulxy" },
            content: [
              {
                type: "text/html",
                value: `
                  <div style="font-family: sans-serif; max-width: 600px;">
                    <h2>New Early Access Request</h2>
                    <p>Someone requested early access to Rulxy:</p>
                    <p style="background: #f4f4f5; padding: 12px; border-radius: 6px;">
                      <strong>${email.toLowerCase()}</strong>
                    </p>
                    <p>
                      <a href="https://rulxy.com/dashboard/admin/invites" style="color: #6C5CE7;">
                        Review in Admin Dashboard →
                      </a>
                    </p>
                  </div>
                `,
              },
            ],
          }),
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Access request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
