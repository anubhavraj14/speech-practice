-- Persist an in-progress online passage per user so it can be resumed until completed.
create table public.active_passages (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.active_passages enable row level security;
create policy "own active passage" on public.active_passages for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- New breath-coordination preferences on the profile.
alter table public.profiles
  add column if not exists pace text not null default 'slow' check (pace in ('slow','steady','natural')),
  add column if not exists breathing_guide boolean not null default true,
  add column if not exists auto_advance boolean not null default true,
  add column if not exists breath_every text not null default 'sentence' check (breath_every in ('sentence','free'));
