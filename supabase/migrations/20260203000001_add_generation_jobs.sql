-- Generation jobs + events for resumable streaming

create table if not exists public.generation_jobs (
  id uuid primary key,
  project_id text not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  prompt text,
  platform text,
  status text not null default 'running',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_event_id integer not null default 0
);

create index if not exists generation_jobs_project_id_idx
  on public.generation_jobs (project_id);

create index if not exists generation_jobs_user_id_idx
  on public.generation_jobs (user_id);

create table if not exists public.generation_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.generation_jobs (id) on delete cascade,
  event_id integer not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (job_id, event_id)
);

create index if not exists generation_job_events_job_id_idx
  on public.generation_job_events (job_id);

create index if not exists generation_job_events_job_event_idx
  on public.generation_job_events (job_id, event_id);
