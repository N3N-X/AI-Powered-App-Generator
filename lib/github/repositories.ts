import { createOctokit, GitHubUser, Repository } from "./client";

/**
 * Verify GitHub token and get user info
 */
export async function verifyGitHubToken(
  accessToken: string,
): Promise<GitHubUser> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.users.getAuthenticated();

  return {
    login: data.login,
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
  };
}

/**
 * List user's repositories
 */
export async function listRepositories(
  accessToken: string,
  options?: { sort?: "created" | "updated" | "pushed"; perPage?: number },
): Promise<Repository[]> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: options?.sort || "updated",
    per_page: options?.perPage || 30,
    affiliation: "owner",
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    defaultBranch: repo.default_branch,
  }));
}

/**
 * Create a new repository
 */
export async function createRepository(
  accessToken: string,
  options: {
    name: string;
    description?: string;
    isPrivate?: boolean;
    autoInit?: boolean;
  },
): Promise<Repository> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.repos.createForAuthenticatedUser({
    name: options.name,
    description: options.description,
    private: options.isPrivate ?? true,
    auto_init: options.autoInit ?? true,
    gitignore_template: "Node",
    license_template: "mit",
  });

  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    private: data.private,
    htmlUrl: data.html_url,
    cloneUrl: data.clone_url,
    defaultBranch: data.default_branch,
  };
}

/**
 * Delete a repository (use with caution!)
 */
export async function deleteRepository(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<boolean> {
  const octokit = createOctokit(accessToken);

  try {
    await octokit.repos.delete({ owner, repo });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a repository exists
 */
export async function repositoryExists(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<boolean> {
  const octokit = createOctokit(accessToken);

  try {
    await octokit.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get repository info
 */
export async function getRepositoryInfo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<Repository & { pushedAt: string | null }> {
  const octokit = createOctokit(accessToken);

  const { data } = await octokit.repos.get({ owner, repo });

  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    private: data.private,
    htmlUrl: data.html_url,
    cloneUrl: data.clone_url,
    defaultBranch: data.default_branch,
    pushedAt: data.pushed_at,
  };
}
