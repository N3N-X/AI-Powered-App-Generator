/**
 * Admin API for managing access requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invite";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "ADMIN";
}

export async function GET() {
  const supabase = await createClient();

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const { id, action } = body;

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("access_requests")
      .update({
        status: "rejected",
        processed_at: new Date().toISOString(),
        processed_by: user?.id,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Approve: generate invite code and send email
  const { data: request_data } = await supabase
    .from("access_requests")
    .select("email")
    .eq("id", id)
    .single();

  if (!request_data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Generate a unique invite code
  const inviteCode = generateInviteCode();

  // Insert the invite code (system-generated, single use)
  const { error: codeError } = await supabase.from("invite_codes").insert({
    code: inviteCode,
    owner_id: null,
    code_type: "early_access",
    max_uses: 1,
    is_active: true,
  });

  if (codeError) {
    return NextResponse.json({ error: codeError.message }, { status: 500 });
  }

  // Update the request
  const { error: updateError } = await supabase
    .from("access_requests")
    .update({
      status: "approved",
      processed_at: new Date().toISOString(),
      processed_by: user?.id,
      invite_code_sent: inviteCode,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send email with invite code
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sender = process.env.SENDGRID_DEFAULT_SENDER || "noreply@rulxy.com";

  if (sendgridApiKey) {
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
              to: [{ email: request_data.email }],
              subject: "Your Rulxy Early Access Invite",
            },
          ],
          from: { email: sender, name: "Rulxy" },
          content: [
            {
              type: "text/html",
              value: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #6C5CE7;">Welcome to Rulxy Early Access!</h1>
                  <p>Great news! Your request for early access has been approved.</p>
                  <p>Use this invite code to create your account:</p>
                  <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${inviteCode}</span>
                  </div>
                  <p><a href="https://rulxy.com?invite=${inviteCode}" style="color: #6C5CE7;">Click here to sign up</a></p>
                  <p style="color: #666; font-size: 14px;">This code is single-use and tied to your email.</p>
                </div>
              `,
            },
          ],
        }),
      });
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
    }
  }

  return NextResponse.json({ success: true, code: inviteCode });
}
