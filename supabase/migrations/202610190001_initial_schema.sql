create extension if not exists pgcrypto;

create table public.ponds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  location text,
  qr_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.fish (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 1 and 40),
  name text not null check (char_length(name) between 1 and 100),
  sex text not null check (sex in ('male', 'female', 'unknown')),
  line_name text,
  hatch_date date,
  pond_id uuid references public.ponds(id) on delete set null,
  father_id uuid constraint fish_father_id_fkey references public.fish(id) on delete set null,
  mother_id uuid constraint fish_mother_id_fkey references public.fish(id) on delete set null,
  father_label text,
  father_line text,
  mother_label text,
  mother_line text,
  generation integer check (generation between 1 and 20),
  notes text,
  created_at timestamptz not null default now(),
  constraint fish_not_own_parent check (
    (father_id is null or father_id <> id)
    and (mother_id is null or mother_id <> id)
  )
);

create index fish_pond_id_idx on public.fish(pond_id);
create index fish_father_id_idx on public.fish(father_id);
create index fish_mother_id_idx on public.fish(mother_id);

alter table public.ponds enable row level security;
alter table public.fish enable row level security;

revoke all on public.ponds, public.fish from anon, authenticated;
grant all on public.ponds, public.fish to service_role;