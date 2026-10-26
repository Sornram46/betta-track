-- Users table + link fish ownership to a user.
-- Auth is handled by the NestJS API (service_role); passwords are stored as a
-- salted hash computed in the application layer, never in plaintext.

create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 255),
  password_hash text not null,
  display_name text check (char_length(display_name) between 1 and 120),
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

-- Store emails normalized (lowercase, trimmed) so lookups are case-insensitive.
create unique index users_email_lower_idx on public.users (lower(email));

alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant all on public.users to service_role;

-- Link each fish to its owner. Nullable for now so existing rows stay valid;
-- a later migration can backfill and enforce NOT NULL once every fish has an owner.
alter table public.fish
  add column if not exists owner_id uuid references public.users(id) on delete cascade;

create index if not exists fish_owner_id_idx on public.fish(owner_id);
