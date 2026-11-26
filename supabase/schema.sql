create extension if not exists pgcrypto;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '' check (char_length(phone) <= 40),
  created_at timestamptz not null default now()
);

create unique index if not exists guests_invitation_name_unique
  on public.guests (invitation_id, lower(name));

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_name text not null check (char_length(guest_name) between 1 and 120),
  attendance text not null check (attendance in ('Ya, saya akan hadir', 'Maaf, saya tidak bisa hadir')),
  guest_count integer not null check (guest_count between 1 and 10),
  message text not null default '' check (char_length(message) <= 1000),
  submitted_at timestamptz not null default now()
);

create index if not exists rsvps_invitation_submitted_idx
  on public.rsvps (invitation_id, submitted_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

alter table public.invitations enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;

drop policy if exists "Public can read invitation pages" on public.invitations;
create policy "Public can read invitation pages"
  on public.invitations for select
  to anon, authenticated
  using (true);

drop policy if exists "Owners can create invitations" on public.invitations;
create policy "Owners can create invitations"
  on public.invitations for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update invitations" on public.invitations;
create policy "Owners can update invitations"
  on public.invitations for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete invitations" on public.invitations;
create policy "Owners can delete invitations"
  on public.invitations for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Owners can manage their guests" on public.guests;
create policy "Owners can manage their guests"
  on public.guests for all
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.invitations invitation
      where invitation.id = guests.invitation_id
        and invitation.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.invitations invitation
      where invitation.id = guests.invitation_id
        and invitation.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Guests can submit RSVP" on public.rsvps;
create policy "Guests can submit RSVP"
  on public.rsvps for insert
  to anon, authenticated
  with check (exists (
    select 1 from public.invitations invitation
    where invitation.id = rsvps.invitation_id
  ));

drop policy if exists "Owners can read RSVP responses" on public.rsvps;
create policy "Owners can read RSVP responses"
  on public.rsvps for select
  to authenticated
  using (exists (
    select 1 from public.invitations invitation
    where invitation.id = rsvps.invitation_id
      and invitation.owner_id = (select auth.uid())
  ));

grant select on public.invitations to anon, authenticated;
grant insert, update, delete on public.invitations to authenticated;
grant select, insert, update, delete on public.guests to authenticated;
grant insert on public.rsvps to anon, authenticated;
grant select on public.rsvps to authenticated;
