-- Profiles table
create table profiles (
    user_id uuid references auth.users(id) primary key,
    role text default 'free' check (role in ('free', 'pro', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);

-- User usage table
create table user_usage (
    user_id uuid references auth.users(id),
    year_month text,
    count int default 0,
    primary key (user_id, year_month)
);

alter table user_usage enable row level security;

create policy "Users can view own usage" on user_usage for select using (auth.uid() = user_id);

-- Generated apps table
create table generated_apps (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    prompt text not null,
    code jsonb not null,
    status text default 'generated',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table generated_apps enable row level security;

create policy "Users can view own apps" on generated_apps for select using (auth.uid() = user_id);
create policy "Users can insert own apps" on generated_apps for insert with check (auth.uid() = user_id);
