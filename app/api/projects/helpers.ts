import { z } from "zod";
import type { ProxyService } from "@/types/proxy";

// Default services for auto-generated API keys
export const DEFAULT_PROJECT_SERVICES: ProxyService[] = [
  "auth",
  "database",
  "email",
  "sms",
  "maps",
  "storage",
  "openai",
  "xai",
];

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z.string().optional(),
  platform: z.enum(["WEB", "IOS", "ANDROID"]).default("WEB"),
});

/** Transform a project row from snake_case DB columns to camelCase. */
export function transformProject(p: Record<string, unknown>) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    platform: p.platform,
    subdomain: p.subdomain,
    customDomain: p.custom_domain,
    domainVerified: p.domain_verified,
    githubRepo: p.github_repo,
    githubUrl: p.github_url,
    codeFiles: p.code_files,
    appConfig: p.app_config,
    chatHistory: (p.chat_history as unknown[]) || [],
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/** Transform a newly-created project row (subset of fields). */
export function transformNewProject(project: Record<string, unknown>) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    platform: project.platform,
    codeFiles: project.code_files,
    userId: project.user_id,
    subdomain: project.subdomain,
    appConfig: project.app_config,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}
