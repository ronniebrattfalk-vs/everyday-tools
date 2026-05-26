create table if not exists public.tool_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);

alter table public.tool_favorites enable row level security;

drop policy if exists "Users can read their own tool favorites" on public.tool_favorites;
create policy "Users can read their own tool favorites"
on public.tool_favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own tool favorites" on public.tool_favorites;
create policy "Users can create their own tool favorites"
on public.tool_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tool favorites" on public.tool_favorites;
create policy "Users can delete their own tool favorites"
on public.tool_favorites
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.user_tool_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_tool_slug text,
  updated_at timestamptz not null default now()
);

alter table public.user_tool_settings enable row level security;

drop policy if exists "Users can read their own tool settings" on public.user_tool_settings;
create policy "Users can read their own tool settings"
on public.user_tool_settings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own tool settings" on public.user_tool_settings;
create policy "Users can create their own tool settings"
on public.user_tool_settings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tool settings" on public.user_tool_settings;
create policy "Users can update their own tool settings"
on public.user_tool_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
