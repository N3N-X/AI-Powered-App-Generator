import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get authenticated user from Supabase session
 * Use this in API routes to verify authentication
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  uid: string | null;
  email?: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { uid: null };
  }

  return {
    uid: user.id,
    email: user.email,
  };
}
