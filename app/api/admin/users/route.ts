import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (admin only)
 *     description: Returns a paginated list of all users with their details.
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: plan
 *         in: query
 *         schema:
 *           type: string
 *           enum: [FREE, PRO, ELITE]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") as "FREE" | "PRO" | "ELITE" | null;

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(plan && { plan }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          role: true,
          credits: true,
          totalCreditsUsed: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              builds: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

const UpdateUserSchema = z.object({
  userId: z.string(),
  plan: z.enum(["FREE", "PRO", "ELITE"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  credits: z.number().min(0).optional(),
});

/**
 * @swagger
 * /api/admin/users:
 *   patch:
 *     summary: Update a user (admin only)
 *     description: Update a user's plan, role, or credits.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [FREE, PRO, ELITE]
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *               credits:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = UpdateUserSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.credits !== undefined) updateData.credits = data.credits;

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
        credits: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
