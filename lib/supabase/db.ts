import { createClient } from '@/lib/supabase/server';
import type { Database } from './types';

export type Tables = Database['public']['Tables'];
export type User = Tables['users']['Row'];
export type Project = Tables['projects']['Row'];
export type Build = Tables['builds']['Row'];
export type PromptHistory = Tables['prompt_history']['Row'];
export type ProjectApiKey = Tables['project_api_keys']['Row'];
export type TokenPurchase = Tables['token_purchases']['Row'];

// Plan limits matching the old system
export const PLAN_LIMITS = {
  FREE: {
    monthlyCredits: 3000,
    maxProjects: 3,
    maxBuilds: 5,
    maxApiKeys: 2,
  },
  PRO: {
    monthlyCredits: 50000,
    maxProjects: 25,
    maxBuilds: 100,
    maxApiKeys: 10,
  },
  ELITE: {
    monthlyCredits: 200000,
    maxProjects: -1, // unlimited
    maxBuilds: -1,
    maxApiKeys: 50,
  },
};

/**
 * Get or create user record
 */
export async function getOrCreateUser(userId: string, email: string) {
  const supabase = await createClient();

  // Try to get existing user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (user) return user;

  // Create new user if doesn't exist
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      credits: PLAN_LIMITS.FREE.monthlyCredits,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return newUser;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user
 */
export async function updateUser(userId: string, updates: Tables['users']['Update']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user projects
 */
export async function getUserProjects(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create project
 */
export async function createProject(project: Tables['projects']['Insert']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  updates: Tables['projects']['Update']
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Check if subdomain is available
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('subdomain', subdomain)
    .single();

  return !data;
}

/**
 * Check if slug is available for user
 */
export async function isSlugAvailable(userId: string, slug: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .eq('slug', slug)
    .single();

  return !data;
}

/**
 * Get user builds
 */
export async function getUserBuilds(userId: string, limit = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Create build
 */
export async function createBuild(build: Tables['builds']['Insert']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('builds')
    .insert(build)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update build
 */
export async function updateBuild(buildId: string, updates: Tables['builds']['Update']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('id', buildId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get project API keys
 */
export async function getProjectApiKeys(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_api_keys')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create API key
 */
export async function createApiKey(apiKey: Tables['project_api_keys']['Insert']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_api_keys')
    .insert(apiKey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete API key
 */
export async function deleteApiKey(keyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('project_api_keys')
    .delete()
    .eq('id', keyId);

  if (error) throw error;
}

/**
 * Log prompt to history
 */
export async function logPrompt(prompt: Tables['prompt_history']['Insert']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_history')
    .insert(prompt)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get usage stats for user
 */
export async function getUserUsageStats(userId: string, days = 30) {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('proxy_usage')
    .select('service, credits_used, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Deduct credits from user
 */
export async function deductCredits(userId: string, amount: number) {
  const supabase = await createClient();

  // Get current credits
  const { data: user } = await supabase
    .from('users')
    .select('credits, total_credits_used')
    .eq('id', userId)
    .single();

  if (!user) throw new Error('User not found');

  // Update credits
  const { data, error } = await supabase
    .from('users')
    .update({
      credits: Math.max(0, user.credits - amount),
      total_credits_used: user.total_credits_used + amount,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add credits to user (for purchases)
 */
export async function addCredits(userId: string, amount: number) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!user) throw new Error('User not found');

  const { data, error } = await supabase
    .from('users')
    .update({
      credits: user.credits + amount,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create token purchase
 */
export async function createTokenPurchase(purchase: Tables['token_purchases']['Insert']) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('token_purchases')
    .insert(purchase)
    .select()
    .single();

  if (error) throw error;
  return data;
}
