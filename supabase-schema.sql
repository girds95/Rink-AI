-- Rink AI Database Schema
-- Paste this into Supabase SQL Editor and run it

-- ==========================================
-- PROFILES TABLE (one user can have multiple players)
-- ==========================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position text, -- 'forward', 'defense', 'goalie', null
  age_group text, -- 'u8','u10','u12','u14','u16','u18','adult'
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);

-- Auto-set first profile as default
create or replace function public.set_first_profile_default()
returns trigger as $$
begin
  if not exists (select 1 from public.profiles where user_id = new.user_id and is_default = true and id != new.id) then
    new.is_default := true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_first_profile_default on public.profiles;
create trigger trg_set_first_profile_default
  before insert on public.profiles
  for each row execute function public.set_first_profile_default();

-- ==========================================
-- SESSIONS TABLE (each analysis result)
-- ==========================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  skill text not null,
  score integer,
  grade text,
  result jsonb not null, -- full analysis JSON
  duration numeric, -- video length in seconds
  frame_count integer,
  created_at timestamptz default now()
);

create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_profile_id_idx on public.sessions(profile_id);
create index if not exists sessions_created_at_idx on public.sessions(created_at desc);

-- ==========================================
-- ROW LEVEL SECURITY (each user can only see their own data)
-- ==========================================
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "Users can view own profiles" on public.profiles;
create policy "Users can view own profiles" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own profiles" on public.profiles;
create policy "Users can insert own profiles" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own profiles" on public.profiles;
create policy "Users can update own profiles" on public.profiles
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own profiles" on public.profiles;
create policy "Users can delete own profiles" on public.profiles
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.sessions;
create policy "Users can delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);

-- ==========================================
-- DONE
-- ==========================================
-- After running this, go to Authentication → Providers in Supabase
-- and enable: Email (with magic link enabled) and Google (configured separately)
