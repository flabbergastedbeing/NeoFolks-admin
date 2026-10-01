-- Outside-university registration
-- ---------------------------------------------------------------------------
-- Lets an event have a second, separate registration form for people who are
-- not NUV students. Admins switch it on per event and build its questions in
-- the dashboard; visitors then see an "NUV Student / Outside University"
-- toggle in the sign-up popup. Both groups share the event's single entry limit.
--
-- Safe to run once on an existing database (everything is additive).
-- Run it in the Supabase dashboard -> SQL Editor.
-- ---------------------------------------------------------------------------

-- 1. Per-event settings -------------------------------------------------------
alter table public.events
  add column if not exists outside_form_enabled boolean not null default false,
  add column if not exists outside_form_fields  jsonb   not null default '[]'::jsonb;

alter table public.events
  drop constraint if exists events_outside_form_fields_is_array;
alter table public.events
  add constraint events_outside_form_fields_is_array
  check (jsonb_typeof(outside_form_fields) = 'array');

-- 2. Which form each entry came from -----------------------------------------
alter table public.registrations
  add column if not exists registrant_type text not null default 'nuv';

alter table public.registrations
  drop constraint if exists registrations_registrant_type_check;
alter table public.registrations
  add constraint registrations_registrant_type_check
  check (registrant_type in ('nuv', 'outside'));

-- 3. Rebuild the public events view so it includes the new columns ------------
-- (A view written with `e.*` keeps the column list it had when it was created,
-- and the new columns would land before `taken`, so it has to be dropped.)
drop view if exists public.events_public;
create view public.events_public as
select
  e.*,
  coalesce((
    select count(*) from public.registrations r
    where r.event_id = e.id and r.status in ('pending','approved')
  ), 0)::int as taken
from public.events e;
grant select on public.events_public to anon, authenticated;

-- 4. Public sign-up: now aware of the registrant type -------------------------
drop function if exists public.submit_registration(uuid, text, text, jsonb);

create or replace function public.submit_registration(
  p_event_id        uuid,
  p_full_name       text,
  p_email           text,
  p_answers         jsonb,
  p_registrant_type text default 'nuv'
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  ev         public.events%rowtype;
  form       jsonb;
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

  p_registrant_type := coalesce(nullif(btrim(p_registrant_type), ''), 'nuv');
  if p_registrant_type not in ('nuv', 'outside') then
    raise exception 'FIELD_INVALID: Registration type';
  end if;
  if p_registrant_type = 'outside' and not ev.outside_form_enabled then
    raise exception 'OUTSIDE_NOT_ALLOWED';
  end if;
  -- Each group is validated against its own form.
  form := case when p_registrant_type = 'outside' then ev.outside_form_fields else ev.form_fields end;

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
  for fld in select * from jsonb_array_elements(form) loop
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

  -- One shared limit: spots are taken by pending + approved entries from BOTH
  -- groups. Anyone past the limit goes on the waitlist.
  select count(*) into taken
  from public.registrations
  where event_id = ev.id and status in ('pending','approved');

  if ev.capacity is not null and taken >= ev.capacity then
    new_status := 'waitlisted';
  else
    new_status := 'pending';
  end if;

  begin
    insert into public.registrations (event_id, full_name, email, answers, status, registrant_type)
    values (ev.id, p_full_name, p_email, cleaned, new_status, p_registrant_type);
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
revoke all on function public.submit_registration(uuid, text, text, jsonb, text) from public;
grant execute on function public.submit_registration(uuid, text, text, jsonb, text) to anon, authenticated;