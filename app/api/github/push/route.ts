import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encrypt";
import { pushCodeToRepo } from "@/lib/github";
import { PushCodeRequestSchema, PLAN_LIMITS, Plan, CodeFiles } from "@/types";

/**
 * @swagger
 * /api/github/push:
 *   post:
 *     summary: Push project code to GitHub repository
 *     description: Pushes the latest project code to an existing connected GitHub repository. Requires GitHub integration plan, connected GitHub account, and a repository linked to the project.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project to push
 *               commitMessage:
 *                 type: string
 *                 description: Commit message for the push
 *             required:
 *               - projectId
 *               - commitMessage
 *     responses:
 *       200:
 *         description: Code pushed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 commit:
 *                   type: object
 *                   properties:
 *                     sha:
 *                       type: string
 *                     url:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error, GitHub not connected, or project not linked to repo
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Plan does not allow GitHub integration
 *       404:
 *         description: User or project not found
 *       500:
 *         description: Failed to push code
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = PushCodeRequestSchema.parse(body);

    // Get user with project
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      include: {
        projects: {
          where: { id: data.projectId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan
    if (!PLAN_LIMITS[user.plan as Plan].githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration requires Pro or Elite plan" },
        { status: 403 },
      );
    }

    if (!user.githubTokenEncrypted) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 },
      );
    }

    const project = user.projects[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.githubRepo) {
      return NextResponse.json(
        { error: "Project not connected to a GitHub repository" },
        { status: 400 },
      );
    }

    // Decrypt GitHub token
    const githubToken = await decrypt(user.githubTokenEncrypted);

    // Parse repo info
    const [owner, repoName] = project.githubRepo.split("/");

    // Push code
    const codeFiles = project.codeFiles as CodeFiles;
    const { commitSha, commitUrl } = await pushCodeToRepo(githubToken, {
      owner,
      repo: repoName,
      files: codeFiles,
      message: data.commitMessage,
    });

    return NextResponse.json({
      success: true,
      commit: {
        sha: commitSha,
        url: commitUrl,
        message: data.commitMessage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Push code error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push code" },
      { status: 500 },
    );
  }
}
