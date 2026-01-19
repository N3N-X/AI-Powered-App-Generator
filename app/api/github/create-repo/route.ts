import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encrypt";
import {
  createRepository,
  pushCodeToRepo,
  generateGitignore,
  generateReadme,
} from "@/lib/github";
import { CreateRepoRequestSchema, PLAN_LIMITS, Plan, CodeFiles } from "@/types";

/**
 * @swagger
 * /api/github/create-repo:
 *   post:
 *     summary: Create GitHub repository and push project code
 *     description: Creates a new GitHub repository for the authenticated user, pushes the project's code files to it, and updates the project record with GitHub information. Requires GitHub integration plan and connected GitHub account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project to create repo for
 *               repoName:
 *                 type: string
 *                 description: Name of the repository
 *               description:
 *                 type: string
 *                 description: Repository description
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether the repository is private
 *             required:
 *               - projectId
 *               - repoName
 *     responses:
 *       200:
 *         description: Repository created and code pushed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 repository:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     url:
 *                       type: string
 *                     cloneUrl:
 *                       type: string
 *                     private:
 *                       type: boolean
 *                 commit:
 *                   type: object
 *                   properties:
 *                     sha:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: Validation error or GitHub not connected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Plan does not allow GitHub integration
 *       404:
 *         description: User or project not found
 *       500:
 *         description: Failed to create repository
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateRepoRequestSchema.parse(body);

    // Get user with project
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        projects: {
          where: { id: data.projectId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan allows GitHub integration
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

    // Decrypt GitHub token
    const githubToken = await decrypt(user.githubTokenEncrypted);

    // Create repository
    const repo = await createRepository(githubToken, {
      name: data.repoName,
      description: data.description || `${project.name} - Built with RUX`,
      isPrivate: data.isPrivate,
      autoInit: false, // We'll push our own files
    });

    // Prepare files to push
    const codeFiles = project.codeFiles as CodeFiles;
    const filesToPush: CodeFiles = {
      ...codeFiles,
      ".gitignore": generateGitignore(),
      "README.md": generateReadme(
        project.name,
        project.description || undefined,
      ),
    };

    // Push code to the new repo
    const { commitSha, commitUrl } = await pushCodeToRepo(githubToken, {
      owner: repo.fullName.split("/")[0],
      repo: repo.name,
      files: filesToPush,
      message: "Initial commit from RUX",
    });

    // Update project with GitHub info
    await prisma.project.update({
      where: { id: project.id },
      data: {
        githubRepo: repo.fullName,
        githubUrl: repo.htmlUrl,
      },
    });

    return NextResponse.json({
      success: true,
      repository: {
        name: repo.name,
        fullName: repo.fullName,
        url: repo.htmlUrl,
        cloneUrl: repo.cloneUrl,
        private: repo.private,
      },
      commit: {
        sha: commitSha,
        url: commitUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Create repo error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create repository",
      },
      { status: 500 },
    );
  }
}
