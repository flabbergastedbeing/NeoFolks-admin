-- NeoFolks: events, registrations and admin access.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- (Or `supabase db push` if you use the Supabase CLI.)

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
-- Who counts as an admin. Being able to sign in is NOT enough: a user must also
-- have a row here. Add yourself after creating your user (see supabase/README.md).
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email   text
);
alter table public.admins enable row level security;

create policy "admins can read their own row"
  on public.admins for select to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  title             text    not null check (char_length(title) between 1 and 200),
  category          text    not null check (category in ('Workshops','Seminars','Competitions','Community')),
  status            text    not null default 'upcoming' check (status in ('upcoming','past')),
  event_date        date    not null,
  description       text    not null default '',
  details           text,
  photos            text[]  not null default '{}',
  highlights_title  text,
  highlights_items  text[]  not null default '{}',
  -- Max entries. NULL = unlimited. Sign-ups beyond it are waitlisted.
  capacity          integer check (capacity is null or capacity > 0),
  registration_open boolean not null default true,
  -- Registration form, editable by admins. Array of
  -- { id, label, type, required, options? }. Name and email are always asked.
  form_fields       jsonb   not null default '[]'::jsonb check (jsonb_typeof(form_fields) = 'array'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at before update on public.events
  for each row execute function public.touch_updated_at();

alter table public.events enable row level security;

create policy "anyone can read events"
  on public.events for select to anon, authenticated
  using (true);
create policy "admins manage events"
  on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------
create table if not exists public.registrations (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  full_name     text not null check (char_length(btrim(full_name)) between 1 and 200),
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Snapshot of the answers: [{ id, label, value }]. Labels are copied in so
  -- the entry still reads correctly if the admin later edits the form.
  answers       jsonb not null default '[]'::jsonb,
  status        text  not null default 'pending' check (status in ('pending','approved','rejected','waitlisted')),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  email_sent_at timestamptz,
  email_error   text
);
-- One entry per email address per event.
create unique index if not exists registrations_event_email_key
  on public.registrations (event_id, lower(email));
create index if not exists registrations_event_status_idx
  on public.registrations (event_id, status, created_at);

alter table public.registrations enable row level security;
-- Nobody can touch this table directly except admins. The public sign-up goes
-- through submit_registration() below.
revoke all on public.registrations from anon, authenticated;
grant select, update, delete on public.registrations to authenticated;

create policy "admins manage registrations"
  on public.registrations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Events plus how many spots are taken (pending + approved). This lets the
-- public site show "12 spots left" without exposing anyone's details. The view
-- runs with its owner's rights, so it can count rows the visitor cannot read.
create or replace view public.events_public as
select
  e.*,
  coalesce((
    select count(*) from public.registrations r
    where r.event_id = e.id and r.status in ('pending','approved')
  ), 0)::int as taken
from public.events e;
grant select on public.events_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public sign-up
-- ---------------------------------------------------------------------------
-- The ONLY way for a visitor to create a registration. Everything is checked
-- here (not in the browser), and the event row is locked while we count, so two
-- people submitting at the same moment can never both take the last spot.
create or replace function public.submit_registration(
  p_event_id  uuid,
  p_full_name text,
  p_email     text,
  p_answers   jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  ev         public.events%rowtype;
  fld        jsonb;
  f_id       text;
  f_type     text;
  f_label    text;
  f_required boolean;
  raw        jsonb;
  sval       text;
  cleaned    jsonb := '[]'::jsonb;
  taken      integer;
  new_status text;
  waitpos    integer := null;
begin
  select * into ev from public.events where id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if ev.status <> 'upcoming' or not ev.registration_open then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  p_full_name := btrim(coalesce(p_full_name, ''));
  p_email     := lower(btrim(coalesce(p_email, '')));
  if p_full_name = '' or char_length(p_full_name) > 200 then
    raise exception 'INVALID_NAME';
  end if;
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(p_email) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    p_answers := '{}'::jsonb;
  end if;

  -- Validate against the form as it is right now, and snapshot the answers.
  for fld in select * from jsonb_array_elements(ev.form_fields) loop
    f_id       := fld ->> 'id';
    f_type     := fld ->> 'type';
    f_label    := coalesce(fld ->> 'label', f_id);
    f_required := coalesce((fld ->> 'required')::boolean, false);
    raw        := p_answers -> f_id;

    if raw is null or jsonb_typeof(raw) = 'null' then
      sval := '';
    else
      sval := btrim(raw #>> '{}');
    end if;

    if f_type = 'checkbox' then
      if f_required and sval <> 'true' then
        raise exception 'FIELD_REQUIRED: %', f_label;
      end if;
      sval := case when sval = 'true' then 'Yes' else 'No' end;
    else
      if f_required and sval = '' then
        raise exception 'FIELD_REQUIRED: %', f_label;
      end if;
      if sval <> '' then
        if char_length(sval) > 2000 then
          raise exception 'FIELD_INVALID: %', f_label;
        end if;
        if f_type = 'email' and sval !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
          raise exception 'FIELD_INVALID: %', f_label;
        elsif f_type = 'number' and sval !~ '^-?[0-9]+(\.[0-9]+)?$' then
          raise exception 'FIELD_INVALID: %', f_label;
        elsif f_type = 'phone' and sval !~ '^[+0-9 ()\-]{6,20}$' then
          raise exception 'FIELD_INVALID: %', f_label;
        elsif f_type = 'select' and not (coalesce(fld -> 'options', '[]'::jsonb) ? sval) then
          raise exception 'FIELD_INVALID: %', f_label;
        end if;
      end if;
    end if;

    cleaned := cleaned || jsonb_build_array(
      jsonb_build_object('id', f_id, 'label', f_label, 'value', sval)
    );
  end loop;

  -- Spots are taken by pending + approved entries. Anyone past the limit goes
  -- on the waitlist; an admin promotes them by hand.
  select count(*) into taken
  from public.registrations
  where event_id = ev.id and status in ('pending','approved');

  if ev.capacity is not null and taken >= ev.capacity then
    new_status := 'waitlisted';
  else
    new_status := 'pending';
  end if;

  begin
    insert into public.registrations (event_id, full_name, email, answers, status)
    values (ev.id, p_full_name, p_email, cleaned, new_status);
  exception when unique_violation then
    raise exception 'ALREADY_REGISTERED';
  end;

  if new_status = 'waitlisted' then
    select count(*) into waitpos
    from public.registrations
    where event_id = ev.id and status = 'waitlisted';
  end if;

  return jsonb_build_object(
    'status', new_status,
    'event_title', ev.title,
    'waitlist_position', waitpos
  );
end;
$$;
revoke all on function public.submit_registration(uuid, text, text, jsonb) from public;
grant execute on function public.submit_registration(uuid, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin review
-- ---------------------------------------------------------------------------
-- Approve or reject an entry. Moving someone from the waitlist (or from
-- rejected) into a spot needs a free spot; rejecting always frees one.
create or replace function public.review_registration(p_id uuid, p_action text)
returns public.registrations
language plpgsql security definer
set search_path = public
as $$
declare
  reg    public.registrations%rowtype;
  ev     public.events%rowtype;
  target text;
  taken  integer;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORISED';
  end if;

  target := case p_action
    when 'approve' then 'approved'
    when 'reject'  then 'rejected'
    else null
  end;
  if target is null then
    raise exception 'INVALID_ACTION';
  end if;

  -- Lock the event first, then the entry (same order as submit_registration).
  select e.* into ev
  from public.events e
  join public.registrations r on r.event_id = e.id
  where r.id = p_id
  for update of e;
  if not found then
    raise exception 'REGISTRATION_NOT_FOUND';
  end if;

  select * into reg from public.registrations where id = p_id for update;

  if reg.status = target then
    return reg;  -- nothing to do
  end if;

  if target = 'approved' and reg.status in ('waitlisted', 'rejected') and ev.capacity is not null then
    select count(*) into taken
    from public.registrations
    where event_id = ev.id and status in ('pending','approved');
    if taken >= ev.capacity then
      raise exception 'EVENT_FULL';
    end if;
  end if;

  update public.registrations
  set status        = target,
      reviewed_at   = now(),
      email_sent_at = null,
      email_error   = null
  where id = p_id
  returning * into reg;

  return reg;
end;
$$;
revoke all on function public.review_registration(uuid, text) from public;
grant execute on function public.review_registration(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Event photos (Storage)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

create policy "event photos are public"
  on storage.objects for select
  using (bucket_id = 'event-photos');
create policy "admins upload event photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-photos' and public.is_admin());
create policy "admins update event photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'event-photos' and public.is_admin());
create policy "admins delete event photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-photos' and public.is_admin());
