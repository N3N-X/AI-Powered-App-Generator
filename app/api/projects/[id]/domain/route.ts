import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;

// Reserved subdomains that can't be used
const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "mail",
  "email",
  "help",
  "support",
  "docs",
  "blog",
  "status",
  "cdn",
  "static",
  "assets",
  "dev",
  "staging",
  "prod",
  "test",
];

const updateDomainSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(SUBDOMAIN_REGEX, "Invalid subdomain format")
    .optional()
    .nullable(),
  customDomain: z
    .string()
    .max(253)
    .regex(DOMAIN_REGEX, "Invalid domain format")
    .optional()
    .nullable(),
});

/**
 * @swagger
 * /api/projects/{id}/domain:
 *   get:
 *     summary: Get domain settings for a project
 *     description: Retrieves the subdomain and custom domain settings for a web project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        platform: true,
        subdomain: true,
        customDomain: true,
        domainVerified: true,
        slug: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.platform !== "WEB") {
      return NextResponse.json(
        { error: "Domain settings are only available for web projects" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      subdomain: project.subdomain,
      customDomain: project.customDomain,
      domainVerified: project.domainVerified,
      // Helper URLs
      subdomainUrl: project.subdomain
        ? `https://${project.subdomain}.rux.sh`
        : null,
      customDomainUrl: project.customDomain
        ? `https://${project.customDomain}`
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch domain settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch domain settings" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/projects/{id}/domain:
 *   patch:
 *     summary: Update domain settings for a project
 *     description: Updates the subdomain or custom domain for a web project.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateDomainSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.platform !== "WEB") {
      return NextResponse.json(
        { error: "Domain settings are only available for web projects" },
        { status: 400 }
      );
    }

    // Validate subdomain
    if (data.subdomain) {
      const lowerSubdomain = data.subdomain.toLowerCase();

      // Check reserved
      if (RESERVED_SUBDOMAINS.includes(lowerSubdomain)) {
        return NextResponse.json(
          { error: "This subdomain is reserved" },
          { status: 400 }
        );
      }

      // Check if already taken by another project
      const existing = await prisma.project.findFirst({
        where: {
          subdomain: lowerSubdomain,
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This subdomain is already taken" },
          { status: 400 }
        );
      }

      data.subdomain = lowerSubdomain;
    }

    // Validate custom domain
    if (data.customDomain) {
      const lowerDomain = data.customDomain.toLowerCase();

      // Check if already taken by another project
      const existing = await prisma.project.findFirst({
        where: {
          customDomain: lowerDomain,
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This domain is already registered to another project" },
          { status: 400 }
        );
      }

      data.customDomain = lowerDomain;
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        subdomain: data.subdomain,
        customDomain: data.customDomain,
        // Reset verification if custom domain changed
        ...(data.customDomain !== project.customDomain && {
          domainVerified: false,
        }),
        updatedAt: new Date(),
      },
      select: {
        subdomain: true,
        customDomain: true,
        domainVerified: true,
      },
    });

    return NextResponse.json({
      ...updatedProject,
      subdomainUrl: updatedProject.subdomain
        ? `https://${updatedProject.subdomain}.rux.sh`
        : null,
      customDomainUrl: updatedProject.customDomain
        ? `https://${updatedProject.customDomain}`
        : null,
      // DNS records needed for custom domain verification
      ...(updatedProject.customDomain &&
        !updatedProject.domainVerified && {
          dnsRecords: [
            {
              type: "CNAME",
              name: updatedProject.customDomain,
              value: "cname.rux.sh",
              ttl: 300,
            },
            {
              type: "TXT",
              name: `_rux.${updatedProject.customDomain}`,
              value: `rux-verify=${id}`,
              ttl: 300,
            },
          ],
        }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to update domain settings:", error);
    return NextResponse.json(
      { error: "Failed to update domain settings" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/projects/{id}/domain:
 *   delete:
 *     summary: Remove domain settings from a project
 *     description: Clears subdomain and/or custom domain from a project.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "subdomain" | "customDomain" | "all"

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updateData: { subdomain?: null; customDomain?: null; domainVerified?: boolean } = {};

    if (type === "subdomain" || type === "all") {
      updateData.subdomain = null;
    }
    if (type === "customDomain" || type === "all") {
      updateData.customDomain = null;
      updateData.domainVerified = false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Specify type: subdomain, customDomain, or all" },
        { status: 400 }
      );
    }

    await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove domain:", error);
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 }
    );
  }
}
