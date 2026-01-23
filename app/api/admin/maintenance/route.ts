import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

/**
 * @swagger
 * /api/admin/maintenance:
 *   post:
 *     summary: Toggle maintenance mode
 *     description: Enables or disables maintenance mode for the platform. Only admins can access this endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Maintenance mode toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to toggle maintenance mode
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { enabled } = body;

    // Update .env file
    const envPath = join(process.cwd(), ".env");
    let envContent = "";

    try {
      envContent = readFileSync(envPath, "utf-8");
    } catch (error) {
      // If .env doesn't exist, create it
      envContent = "";
    }

    // Update or add MAINTENANCE_MODE
    const maintenanceRegex = /^MAINTENANCE_MODE=.*/m;
    if (maintenanceRegex.test(envContent)) {
      envContent = envContent.replace(
        maintenanceRegex,
        `MAINTENANCE_MODE=${enabled}`,
      );
    } else {
      envContent += `\nMAINTENANCE_MODE=${enabled}\n`;
    }

    writeFileSync(envPath, envContent);

    // Update the environment variable for the current process
    process.env.MAINTENANCE_MODE = enabled.toString();

    return NextResponse.json({
      success: true,
      maintenanceMode: enabled,
      message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Maintenance mode toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle maintenance mode" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/admin/maintenance:
 *   get:
 *     summary: Get maintenance mode status
 *     description: Returns the current maintenance mode status. Only admins can access this endpoint.
 *     responses:
 *       200:
 *         description: Maintenance mode status retrieved successfully
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
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const maintenanceMode = process.env.MAINTENANCE_MODE === "true";

    return NextResponse.json({
      maintenanceMode,
    });
  } catch (error) {
    console.error("Maintenance mode status error:", error);
    return NextResponse.json(
      { error: "Failed to get maintenance mode status" },
      { status: 500 },
    );
  }
}
