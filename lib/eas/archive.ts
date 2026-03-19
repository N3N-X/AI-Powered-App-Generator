import { CodeFiles } from "@/types";
import { easGraphQL } from "./client";

/**
 * Create a tar.gz archive of project files as a Buffer.
 * EAS expects tar.gz archives for project uploads.
 */
export async function createProjectArchive(
  codeFiles: CodeFiles,
): Promise<Buffer> {
  const archiver = (await import("archiver")).default;
  const { PassThrough } = await import("stream");

  // Log files being archived for debugging
  const fileList = Object.keys(codeFiles);
  console.log(`[EAS Archive] Creating archive with ${fileList.length} files`);

  // Warn if critical files are missing
  if (!codeFiles["package.json"]) {
    console.error(
      "[EAS Archive] WARNING: package.json is missing from archive!",
    );
  }
  if (!codeFiles["app.json"]) {
    console.error("[EAS Archive] WARNING: app.json is missing from archive!");
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const passthrough = new PassThrough();
    const archive = archiver("tar", { gzip: true, gzipOptions: { level: 9 } });

    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);

    archive.pipe(passthrough);

    for (const [filePath, content] of Object.entries(codeFiles)) {
      archive.append(content, { name: filePath });
    }

    archive.finalize();
  });
}

/**
 * Upload project archive to EAS via signed GCS URL.
 * Returns the bucket key for referencing in the build job.
 */
export async function uploadProjectArchive(
  archive: Buffer,
  token: string,
): Promise<string> {
  // Step 1: Get a signed upload URL from EAS using the current upload session API
  const uploadUrlMutation = `
    mutation CreateUploadSession($type: UploadSessionType!) {
      uploadSession {
        createUploadSession(type: $type)
      }
    }
  `;

  const uploadData = await easGraphQL<{
    uploadSession: { createUploadSession: unknown };
  }>(uploadUrlMutation, { type: "EAS_BUILD_GCS_PROJECT_SOURCES" }, token);

  // Parse the JSON string response containing url, headers, and bucketKey
  const sessionResult = uploadData.uploadSession.createUploadSession;
  let uploadUrl: string;
  let bucketKey: string;
  let signedHeaders: Record<string, string> = {};

  console.log(
    "[EAS] Upload session raw response:",
    typeof sessionResult,
    JSON.stringify(sessionResult).substring(0, 500),
  );

  if (typeof sessionResult === "object" && sessionResult !== null) {
    // Direct object response
    const obj = sessionResult as Record<string, unknown>;
    uploadUrl = obj.url as string;
    bucketKey = obj.bucketKey as string;
    signedHeaders = (obj.headers as Record<string, string>) || {};
  } else if (typeof sessionResult === "string") {
    try {
      const parsed = JSON.parse(sessionResult);
      uploadUrl = parsed.url;
      bucketKey = parsed.bucketKey;
      signedHeaders = parsed.headers || {};
    } catch {
      throw new Error(
        `Failed to parse upload session response: ${String(sessionResult).substring(0, 200)}`,
      );
    }
  } else {
    throw new Error(
      `Unexpected upload session response type: ${typeof sessionResult}`,
    );
  }

  if (!uploadUrl || !bucketKey) {
    throw new Error(
      `Upload session missing url or bucketKey. Got: ${JSON.stringify(sessionResult).substring(0, 300)}`,
    );
  }

  // Step 2: Upload the archive to the signed GCS URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      ...signedHeaders,
      "Content-Type": "application/gzip",
      "Content-Length": archive.length.toString(),
    },
    body: new Uint8Array(archive),
  });

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text().catch(() => "");
    throw new Error(
      `Failed to upload project archive (${uploadResponse.status}): ${errorBody}`,
    );
  }

  return bucketKey;
}
