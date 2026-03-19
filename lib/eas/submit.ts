import { BuildPlatform } from "@/types";
import { getEASToken, getExpoProjectId, easGraphQL } from "./client";
import { SubmissionCredentials } from "./types";

/**
 * Submit a completed build to the App Store or Play Store via EAS Submit.
 * Uses the user's submission credentials (ASC API Key or Google Service Account).
 */
export async function submitToStore(
  easBuildId: string,
  platform: BuildPlatform,
  credentials: SubmissionCredentials,
): Promise<{ submissionId: string; status: string }> {
  const token = getEASToken();
  const projectId = getExpoProjectId();

  const mutation = `
    mutation CreateSubmission($input: SubmissionInput!) {
      submission {
        create(input: $input) {
          submission {
            id
            status
            platform
          }
          errors {
            message
          }
        }
      }
    }
  `;

  const input: Record<string, unknown> = {
    projectId,
    platform: platform === "ANDROID" ? "ANDROID" : "IOS",
    buildId: easBuildId,
  };

  // Add platform-specific submission credentials
  if (platform === "ANDROID" && credentials.google?.serviceAccountJson) {
    input.androidSubmissionConfig = {
      serviceAccountKeyJson: credentials.google.serviceAccountJson,
      track: "internal",
    };
  }

  if (platform === "IOS" && credentials.apple) {
    input.iosSubmissionConfig = {
      ascApiKeyId: credentials.apple.keyId,
      ascApiKeyIssuerId: credentials.apple.issuerId,
      ascApiKeyP8: credentials.apple.p8Key,
    };
  }

  const data = await easGraphQL<{
    submission: {
      create: {
        submission: { id: string; status: string; platform: string };
        errors: Array<{ message: string }>;
      };
    };
  }>(mutation, { input }, token);

  if (
    data.submission.create.errors &&
    data.submission.create.errors.length > 0
  ) {
    const errorMsg = data.submission.create.errors
      .map((e) => e.message)
      .join("; ");
    throw new Error(`EAS submission failed: ${errorMsg}`);
  }

  const submission = data.submission.create.submission;

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}

/**
 * Check submission status
 */
export async function getSubmissionStatus(
  submissionId: string,
): Promise<{ status: string; error?: string }> {
  const token = getEASToken();

  const query = `
    query GetSubmission($submissionId: ID!) {
      submissions {
        byId(submissionId: $submissionId) {
          id
          status
          platform
          error {
            message
            errorCode
          }
        }
      }
    }
  `;

  const data = await easGraphQL<{
    submissions: {
      byId: {
        id: string;
        status: string;
        platform: string;
        error?: { message: string; errorCode: string };
      };
    };
  }>(query, { submissionId }, token);

  return {
    status: data.submissions.byId.status,
    error: data.submissions.byId.error?.message,
  };
}
