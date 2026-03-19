import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getRunningJobForProject } from "@/lib/codex/generation-store";

export async function GET(request: NextRequest) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId" },
      { status: 400 },
    );
  }

  const job = await getRunningJobForProject(projectId, uid);
  if (!job) {
    return NextResponse.json({ running: false });
  }

  return NextResponse.json({
    running: true,
    jobId: job.id,
    lastEventId: job.last_event_id,
  });
}
