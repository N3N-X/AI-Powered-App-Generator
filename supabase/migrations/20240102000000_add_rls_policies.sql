-- Add missing RLS policies for insert operations on profiles and user_usage tables

-- Profiles table: Add insert policy
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);

-- User usage table: Add insert policy
create policy "Users can insert own usage" on user_usage for insert with check (auth.uid() = user_id);
