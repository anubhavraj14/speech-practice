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
