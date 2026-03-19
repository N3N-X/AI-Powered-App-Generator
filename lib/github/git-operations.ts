import { CodeFiles } from "@/types";
import { createOctokit } from "./client";

/**
 * Push code files to a repository
 */
export async function pushCodeToRepo(
  accessToken: string,
  options: {
    owner: string;
    repo: string;
    branch?: string;
    files: CodeFiles;
    message: string;
  }
): Promise<{ commitSha: string; commitUrl: string }> {
  const octokit = createOctokit(accessToken);
  const { owner, repo, files, message } = options;
  const branch = options.branch || "main";

  // Get the current commit SHA for the branch
  let baseSha: string;
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    baseSha = refData.object.sha;
  } catch {
    // Branch doesn't exist, create it from default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const { data: defaultRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${repoData.default_branch}`,
    });
    baseSha = defaultRef.object.sha;
  }

  // Get the tree SHA
  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      });
      return { path, sha: data.sha };
    })
  );

  // Create a new tree
  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: blobs.map(({ path, sha }) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      sha,
    })),
  });

  // Create the commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: treeData.sha,
    parents: [baseSha],
  });

  // Update the branch reference
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });
  } catch {
    // Create the branch if it doesn't exist
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: newCommit.sha,
    });
  }

  return {
    commitSha: newCommit.sha,
    commitUrl: newCommit.html_url,
  };
}

/**
 * Get repository contents (for syncing)
 */
export async function getRepoContents(
  accessToken: string,
  options: {
    owner: string;
    repo: string;
    path?: string;
    ref?: string;
  }
): Promise<CodeFiles> {
  const octokit = createOctokit(accessToken);
  const { owner, repo, path = "", ref } = options;

  const files: CodeFiles = {};

  async function fetchDirectory(dirPath: string): Promise<void> {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: dirPath,
      ref,
    });

    if (Array.isArray(data)) {
      await Promise.all(
        data.map(async (item) => {
          if (item.type === "file" && item.download_url) {
            const response = await fetch(item.download_url);
            files[item.path] = await response.text();
          } else if (item.type === "dir") {
            await fetchDirectory(item.path);
          }
        })
      );
    }
  }

  await fetchDirectory(path);
  return files;
}
