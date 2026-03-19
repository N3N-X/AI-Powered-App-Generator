import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getBuildStatus } from "@/lib/eas";

const NON_TERMINAL_STATUSES = ["PENDING", "QUEUED", "BUILDING"];

/** Check if an error message is generic / unhelpful */
function isGenericError(msg: string | null | undefined): boolean {
  if (!msg) return true;
  const generic = ["unknown error", "see logs", "build failed", "build error"];
  const lower = msg.toLowerCase();
  return generic.some((g) => lower.includes(g));
}

/**
 * Sync builds with EAS to get their latest status and better error messages.
 * - Non-terminal builds: check for status changes
 * - Failed builds with generic errors: re-fetch to extract meaningful error from logs
 */
async function syncBuildsWithEAS(
  builds: Record<string, unknown>[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const buildsToSync = builds.filter((b) => {
    if (!b.eas_build_id) return false;
    const status = (b.status as string)?.toUpperCase();
    // Sync non-terminal builds (status may have changed)
    if (NON_TERMINAL_STATUSES.includes(status)) return true;
    // Sync failed builds that have a generic/missing error message
    // (only for builds less than 7 days old to avoid re-querying ancient builds)
    if (status === "FAILED" && isGenericError(b.error_message as string)) {
      const createdAt = new Date(b.created_at as string).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (createdAt > sevenDaysAgo) return true;
    }
    return false;
  });

  if (buildsToSync.length === 0) return;

  // Check EAS status for all builds concurrently
  const updates = await Promise.allSettled(
    buildsToSync.map(async (build) => {
      const easStatus = await getBuildStatus(build.eas_build_id as string);
      const currentStatus = (build.status as string)?.toUpperCase();
      const updateData: Record<string, unknown> = {};

      if (easStatus.status !== currentStatus) {
        updateData.status = easStatus.status;
      }

      if (easStatus.artifactUrl) {
        updateData.artifact_url = easStatus.artifactUrl;
      }
      // Update error message: prefer a specific error, but write even
      // a generic one so we don't keep re-querying EAS indefinitely
      if (
        easStatus.error &&
        easStatus.error !== (build.error_message as string)
      ) {
        updateData.error_message = easStatus.error;
      }
      if (
        (easStatus.status === "SUCCESS" ||
          easStatus.status === "FAILED" ||
          easStatus.status === "CANCELLED") &&
        !build.completed_at
      ) {
        updateData.completed_at = new Date().toISOString();
      }
      if (easStatus.status === "BUILDING" && !build.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        await supabase.from("builds").update(updateData).eq("id", build.id);
        Object.assign(build, updateData);
      }
    }),
  );

  // Log any sync failures (non-critical)
  updates.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to sync build ${buildsToSync[i].id}:`,
        result.reason,
      );
    }
  });
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    let query = supabase
      .from("builds")
      .select("*, projects!project_id(id, name)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data: builds, error } = await query;

    if (error) {
      console.error("Failed to fetch builds:", error);
      return NextResponse.json(
        { error: "Failed to fetch builds" },
        { status: 500 },
      );
    }

    // Sync non-terminal builds with EAS (updates DB and in-memory objects)
    if (builds && builds.length > 0) {
      await syncBuildsWithEAS(builds, supabase);
    }

    return NextResponse.json({
      builds: (builds || []).map((b) => ({
        id: b.id,
        platform: b.platform?.toUpperCase(),
        status: b.status?.toUpperCase(),
        buildProfile: b.build_profile,
        version: b.version || null,
        buildNumber: b.build_number || null,
        artifactUrl: b.artifact_url || null,
        errorMessage: b.error_message || null,
        startedAt: b.started_at || null,
        completedAt: b.completed_at || null,
        createdAt: b.created_at,
        easBuildId: b.eas_build_id || null,
        buildUrl: b.build_url || null,
        submissionId: b.submission_id || null,
        submissionStatus: b.submission_status || null,
        project: {
          id: (b.projects as Record<string, unknown>)?.id || b.project_id,
          name: (b.projects as Record<string, unknown>)?.name || "Unknown",
        },
      })),
    });
  } catch (error) {
    console.error("Builds fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
