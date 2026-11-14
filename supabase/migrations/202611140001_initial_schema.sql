-- Preparação para a etapa Supabase. NÃO aplicada pelo app local.
-- Supabase/PostgreSQL 15+. A identidade local será remapeada para auth.uid().
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  age_confirmed boolean not null default false,
  journey_step integer not null default 0 check (journey_step between 0 and 11),
  journey_completed boolean not null default false,
  template text not null default 'scrapbook' check (template in ('scrapbook','clean','polaroid','mosaic','editorial')),
  intention text not null default '' check (length(intention) <= 4000)
);
create table public.dreams (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null default '' check (length(description) <= 4000),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id), unique(user_id)
);
create table public.goals (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dream_id uuid not null,
  title text not null check (length(title) between 1 and 4000),
  target_date date,
  obstacle text not null default '',
  alternative text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade
);
create table public.tasks (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null,
  title text not null check (length(title) between 1 and 4000),
  scheduled_on date,
  status text not null default 'pending' check(status in ('pending','done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  check((status = 'done') = (completed_at is not null)),
  foreign key(goal_id,user_id) references public.goals(id,user_id) on delete cascade
);
create table public.media (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default '',
  storage_path text not null unique,
  width integer not null check(width between 1 and 1600),
  height integer not null check(height between 1 and 1600),
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes integer not null check(size_bytes between 1 and 2097152),
  created_at timestamptz not null default now(),
  unique(id,user_id),
  check(storage_path like user_id::text || '/%')
);
create table public.mural_cards (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dream_id uuid not null,
  goal_id uuid,
  asset_id uuid,
  kind text not null check(kind in ('image','quote')),
  body text not null default '',
  caption text not null default '',
  color text not null check(color in ('lavender','peach','sage','butter')),
  position integer not null check(position between 0 and 39),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check((kind = 'image') = (asset_id is not null)),
  foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade,
  foreign key(goal_id,user_id) references public.goals(id,user_id) on delete set null (goal_id),
  foreign key(asset_id,user_id) references public.media(id,user_id) on delete cascade,
  unique(dream_id,position) deferrable initially deferred
);
create table public.task_events (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null,
  kind text not null check(kind in ('completed','reopened','rescheduled','adapted')),
  title text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  foreign key(task_id,user_id) references public.tasks(id,user_id) on delete cascade
);
create table public.weekly_reviews (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dream_id uuid not null,
  week_of date not null,
  wins text not null default '',
  challenges text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dream_id,week_of),
  foreign key(dream_id,user_id) references public.dreams(id,user_id) on delete cascade
);

-- Somente authenticated, restrito ao dono, inclusive nos vínculos compostos.
alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare relation_name text;
begin
  foreach relation_name in array array['dreams','goals','tasks','media','mural_cards','task_events','weekly_reviews'] loop
    execute format('alter table public.%I enable row level security', relation_name);
    execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', relation_name);
    execute format('create index on public.%I (user_id)', relation_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', relation_name);
    execute format('revoke all on public.%I from anon', relation_name);
  end loop;
end $$;
grant select, insert, update, delete on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- Bucket privado. Nunca usar getPublicUrl para estes arquivos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('mural-private','mural-private',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy own_mural_files on storage.objects for all to authenticated
  using (bucket_id = 'mural-private' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'mural-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
