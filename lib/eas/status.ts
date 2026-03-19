import { BuildStatus } from "@/types";
import { getEASToken, easGraphQL } from "./client";
import { resolveErrorMessage } from "./errors";

/**
 * Check build status via EAS GraphQL API
 */
export async function getBuildStatus(easBuildId: string): Promise<{
  status: BuildStatus;
  artifactUrl?: string;
  logs?: string;
  error?: string;
}> {
  try {
    const token = getEASToken();

    const query = `
      query GetBuild($buildId: ID!) {
        builds {
          byId(buildId: $buildId) {
            id
            status
            platform
            message
            artifacts {
              applicationArchiveUrl
              buildUrl
              xcodeBuildLogsUrl
            }
            error {
              message
              errorCode
            }
            logFiles
          }
        }
      }
    `;

    const data = await easGraphQL<{
      builds: {
        byId: {
          id: string;
          status: string;
          platform: string;
          message?: string;
          artifacts?: {
            applicationArchiveUrl?: string;
            buildUrl?: string;
            xcodeBuildLogsUrl?: string;
          };
          error?: { message: string; errorCode: string };
          logFiles?: string[];
        };
      };
    }>(query, { buildId: easBuildId }, token);

    const build = data.builds.byId;

    const statusMap: Record<string, BuildStatus> = {
      NEW: "PENDING",
      IN_QUEUE: "QUEUED",
      IN_PROGRESS: "BUILDING",
      PENDING_CANCEL: "BUILDING",
      ERRORED: "FAILED",
      FINISHED: "SUCCESS",
      CANCELED: "CANCELLED",
    };

    const mappedStatus = statusMap[build.status] || "PENDING";

    // For failed builds, resolve a meaningful error message
    const errorMessage =
      mappedStatus === "FAILED"
        ? await resolveErrorMessage(
            build.error?.errorCode,
            build.error?.message,
            build.message,
            build.logFiles,
          )
        : build.error?.message;

    return {
      status: mappedStatus,
      artifactUrl:
        build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl,
      logs: build.logFiles?.join("\n"),
      error: errorMessage,
    };
  } catch (error) {
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cancel a running build via EAS GraphQL API
 */
export async function cancelBuild(easBuildId: string): Promise<boolean> {
  try {
    const token = getEASToken();

    const mutation = `
      mutation CancelBuild($buildId: ID!) {
        build {
          cancel(buildId: $buildId) {
            build {
              id
              status
            }
          }
        }
      }
    `;

    await easGraphQL(mutation, { buildId: easBuildId }, token);
    return true;
  } catch (error) {
    console.error(`Failed to cancel build ${easBuildId}:`, error);
    return false;
  }
}

/**
 * Get download URL for build artifact
 */
export async function getBuildArtifact(
  easBuildId: string,
): Promise<{ url: string; expiresAt: Date } | null> {
  try {
    const status = await getBuildStatus(easBuildId);

    if (status.status === "SUCCESS" && status.artifactUrl) {
      return {
        url: status.artifactUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    return null;
  } catch {
    return null;
  }
}
