create table public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  seconds int not null check (seconds > 0),
  commands int not null check (commands > 0),
  created_at timestamptz not null default now()
);

alter table public.scores enable row level security;

grant select, insert on public.scores to anon;

create policy "anyone can read scores" on public.scores
  for select to anon using (true);

create policy "anyone can add a score" on public.scores
  for insert to anon with check (true);
