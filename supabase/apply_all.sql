-- SpeakFlow — full schema. Paste into Supabase Dashboard → SQL Editor → Run.
-- Safe to run once on a fresh project. Combines all migrations in order.

-- ========== 202610130001_speakflow ==========
create type public.practice_language as enum ('english', 'hindi', 'hinglish');
create type public.practice_difficulty as enum ('easy', 'medium', 'advanced');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  daily_goal smallint not null default 15 check (daily_goal in (10,15,20,30)),
  language text not null default 'mixed' check (language in ('english','hindi','hinglish','mixed')),
  difficulty public.practice_difficulty not null default 'easy',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  reduced_motion boolean not null default false,
  show_pause_markers boolean not null default true,
  skills text[] not null default array['breathing','pace','articulation','reading','prompts'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  duration_minutes smallint not null check (duration_minutes > 0 and duration_minutes <= 180),
  exercise_ids text[] not null default '{}',
  categories text[] not null default '{}',
  languages public.practice_language[] not null default '{}',
  difficulty public.practice_difficulty not null,
  confidence smallint check (confidence between 1 and 5),
  comfort smallint check (comfort between 1 and 5),
  notes text not null default '' check (char_length(notes) <= 2000)
);
create table public.favorites (user_id uuid references auth.users(id) on delete cascade, exercise_id text not null, created_at timestamptz not null default now(), primary key(user_id,exercise_id));
create table public.completions (user_id uuid references auth.users(id) on delete cascade, exercise_id text not null, completed_at timestamptz not null default now(), primary key(user_id,exercise_id));
create index practice_sessions_user_started_idx on public.practice_sessions(user_id, started_at desc);

alter table public.profiles enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.favorites enable row level security;
alter table public.completions enable row level security;
create policy "own profile" on public.profiles for all using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy "own sessions" on public.practice_sessions for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own favorites" on public.favorites for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own completions" on public.completions for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id) values(new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create function public.delete_own_account() returns void language plpgsql security definer set search_path='' as $$ begin delete from auth.users where id=(select auth.uid()); end; $$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- ========== 202610140001_content_sync ==========
create table public.user_recent_content (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  used_at timestamptz not null default now(),
  primary key (user_id, content_id)
);
create table public.practice_content_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null check (language in ('english','hindi','hinglish','mixed')),
  difficulty public.practice_difficulty not null,
  category text check (category is null or category in ('pace','breathing','articulation','reading','prompts')),
  session_data jsonb not null,
  content_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
create index user_recent_content_used_idx on public.user_recent_content(user_id, used_at desc);
create index practice_content_cache_lookup_idx on public.practice_content_cache(user_id, language, difficulty, category, created_at desc);
alter table public.user_recent_content enable row level security;
alter table public.practice_content_cache enable row level security;
create policy "own recent content" on public.user_recent_content for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own cached content" on public.practice_content_cache for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create or replace function public.trim_recent_content() returns trigger language plpgsql security definer set search_path='' as $$
begin
  delete from public.user_recent_content
  where user_id = new.user_id
    and content_id in (
      select content_id from public.user_recent_content
      where user_id = new.user_id
      order by used_at desc
      offset 120
    );
  return new;
end;
$$;
create trigger trim_recent_content_after_write after insert or update on public.user_recent_content for each row execute procedure public.trim_recent_content();

-- ========== 202610160001_active_passage ==========
create table public.active_passages (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.active_passages enable row level security;
create policy "own active passage" on public.active_passages for all using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

alter table public.profiles
  add column if not exists pace text not null default 'slow' check (pace in ('slow','steady','natural')),
  add column if not exists breathing_guide boolean not null default true,
  add column if not exists auto_advance boolean not null default true,
  add column if not exists breath_every text not null default 'sentence' check (breath_every in ('sentence','free'));
