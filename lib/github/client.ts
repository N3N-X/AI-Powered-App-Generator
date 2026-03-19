import { Octokit } from "@octokit/rest";

export interface GitHubUser {
  login: string;
  id: number;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
}

/**
 * Create an authenticated Octokit instance
 */
export function createOctokit(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
    userAgent: "Rulxy App Generator",
  });
}
