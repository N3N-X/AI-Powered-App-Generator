/**
 * Database helper - now uses Supabase directly
 * Import Supabase helpers instead of Prisma
 */

// Re-export Supabase helpers for convenience
export {
  getOrCreateUser,
  getUserById,
  updateUser,
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  isSubdomainAvailable,
  isSlugAvailable,
  getUserBuilds,
  createBuild,
  updateBuild,
  getProjectApiKeys,
  createApiKey,
  deleteApiKey,
  logPrompt,
  getUserUsageStats,
  deductCredits,
  addCredits,
  createTokenPurchase,
  PLAN_LIMITS,
} from '@/lib/supabase/db';

// Re-export types
export type {
  User,
  Project,
  Build,
  PromptHistory,
  ProjectApiKey,
  TokenPurchase,
} from '@/lib/supabase/db';

// For files that still import "prisma", provide a default export
// that throws an error telling devs to use Supabase instead
const prismaDeprecated = new Proxy({}, {
  get() {
    throw new Error(
      'Prisma has been replaced with Supabase! Use: import { createClient } from "@/lib/supabase/server"'
    );
  }
});

export default prismaDeprecated;
