-- Security hardening (VibeSec review, 12 Sep 2026)

-- 1. Storage: cap file sizes and restrict types. Receipts/documents: images and PDFs only (no SVG — it can carry scripts).
update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'] where id = 'receipts';
update storage.buckets set file_size_limit = 15728640, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf','text/plain','message/rfc822'] where id = 'documents';
update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'photos';

-- 2. Roles: only the owner can grant or remove the owner role, and nobody can demote the owner.
drop policy if exists "members: managers change" on trip_members;
create policy "members: managers change" on trip_members for update
  using (can_manage(trip_id) and role <> 'owner')
  with check (can_manage(trip_id) and (role <> 'owner' or trip_role(trip_id) = 'owner'));
drop policy if exists "members: managers remove or self leave" on trip_members;
create policy "members: managers remove or self leave" on trip_members for delete
  using ((can_manage(trip_id) and role <> 'owner') or (user_id = auth.uid() and role <> 'owner'));

-- 3. Referential consistency: a vote must point at an option of the stated decision in the stated trip;
--    an expense share must belong to an expense of the stated trip.
create or replace function check_vote_consistency() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from decision_options o join decisions d on d.id = o.decision_id where o.id = new.option_id and d.id = new.decision_id and d.trip_id = new.trip_id) then
    raise exception 'vote does not match its decision or trip';
  end if;
  return new;
end $$;
drop trigger if exists votes_consistency on votes;
create trigger votes_consistency before insert or update on votes for each row execute function check_vote_consistency();

create or replace function check_share_consistency() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from expenses e where e.id = new.expense_id and e.trip_id = new.trip_id) then raise exception 'share does not match its expense'; end if;
  if not exists (select 1 from trip_members m where m.trip_id = new.trip_id and m.user_id = new.user_id) then raise exception 'share user is not a trip member'; end if;
  return new;
end $$;
drop trigger if exists shares_consistency on expense_shares;
create trigger shares_consistency before insert or update on expense_shares for each row execute function check_share_consistency();

create or replace function check_option_consistency() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from decisions d where d.id = new.decision_id and d.trip_id = new.trip_id) then raise exception 'option does not match its decision'; end if;
  if new.place_id is not null and not exists (select 1 from places p where p.id = new.place_id and p.trip_id = new.trip_id) then raise exception 'option place is not in this trip'; end if;
  return new;
end $$;
drop trigger if exists options_consistency on decision_options;
create trigger options_consistency before insert or update on decision_options for each row execute function check_option_consistency();

-- 4. Profile names: bounded length, no control characters.
alter table profiles add constraint profiles_name_len check (char_length(name) between 1 and 80);
alter table profiles add constraint profiles_initials_len check (char_length(initials) between 1 and 3);
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare n text;
begin
  n := left(regexp_replace(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), '[[:cntrl:]]', '', 'g'), 80);
  if n = '' then n := 'Traveller'; end if;
  insert into profiles (id, name, initials) values (new.id, n, upper(left(n, 2)));
  return new;
end $$;

-- 5. Decisions: confirming requires an owner/admin, or every member but one having voted.
create or replace function can_confirm_decision(d uuid) returns boolean language sql stable security definer set search_path = public as $$
  select can_manage(x.trip_id) or (
    (select count(distinct v.user_id) from votes v where v.decision_id = d) >= (select count(*) from trip_members m where m.trip_id = x.trip_id) - 1
  ) from decisions x where x.id = d;
$$;
