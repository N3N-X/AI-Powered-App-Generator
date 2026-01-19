import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/webhooks/clerk:
 *   post:
 *     summary: Handle Clerk webhook events
 *     description: Processes incoming Clerk webhook events to synchronize user data with the database. Handles user creation, updates, and deletions. Verifies webhook signature using Svix.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Clerk webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Missing headers, invalid signature, or no email found
 *       500:
 *         description: Error creating, updating, or deleting user
 */
export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return new NextResponse("No email found", { status: 400 });
    }

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url || null,
          plan: "FREE",
        },
        update: {
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url || null,
        },
      });

      console.log(`User created/updated: ${id}`);
    } catch (error) {
      console.error("Error creating user:", error);
      return new NextResponse("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata,
    } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return new NextResponse("No email found", { status: 400 });
    }

    try {
      // Check if plan was updated in metadata
      const plan = (public_metadata as any)?.plan;

      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url || null,
          plan: plan || "FREE",
        },
        update: {
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url || null,
          ...(plan && { plan }),
        },
      });

      console.log(`User updated: ${id}`);
    } catch (error) {
      console.error("Error updating user:", error);
      return new NextResponse("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new NextResponse("No user ID found", { status: 400 });
    }

    try {
      // Delete user and cascade to related records
      await prisma.user.delete({
        where: { clerkId: id },
      });

      console.log(`User deleted: ${id}`);
    } catch (error) {
      // User might not exist in our DB
      console.log(`User not found for deletion: ${id}`);
    }
  }

  return new NextResponse("Webhook processed", { status: 200 });
}
