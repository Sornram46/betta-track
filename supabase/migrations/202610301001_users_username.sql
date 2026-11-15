-- Switch login from email to username.
-- Keeps the email column (now optional) so existing data is not lost.
-- Existing users get a username derived from the part of their email before "@".

alter table public.users add column if not exists username text;

-- 1) Backfill: email local part, lowercased, invalid characters removed, max 30 chars.
--    Too-short results fall back to "user_<id prefix>".
update public.users
set username = case
  when char_length(left(lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), 30)) >= 3
    then left(lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), 30)
  else 'user_' || left(id::text, 8)
end
where username is null;

-- 2) Resolve duplicates (e.g. same local part on two domains) by appending an id suffix.
with ranked as (
  select id, row_number() over (partition by username order by created_at, id) as rn
  from public.users
)
update public.users u
set username = left(u.username, 25) || '_' || left(u.id::text, 4)
from ranked r
where u.id = r.id and r.rn > 1;

-- 3) Enforce the rules.
alter table public.users alter column username set not null;
alter table public.users
  add constraint users_username_format check (username ~ '^[a-z0-9._-]{3,30}$');
create unique index if not exists users_username_idx on public.users (username);

-- Email is no longer required for login.
alter table public.users alter column email drop not null;
