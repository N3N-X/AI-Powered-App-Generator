import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Save chat history
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { messages } = body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update chat history
    await prisma.project.update({
      where: { id },
      data: { chatHistory: messages },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save chat history:", error);
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 },
    );
  }
}

// Clear chat history
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Clear chat history
    await prisma.project.update({
      where: { id },
      data: { chatHistory: [] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 },
    );
  }
}
