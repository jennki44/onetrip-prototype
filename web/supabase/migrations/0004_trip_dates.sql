-- Change a trip's dates. Plans keep their calendar dates (day numbers shift with the start date).
-- Days that fall outside the new range are refused unless p_drop is true, in which case their plans are deleted.
-- Returns the number of plans that were outside the new range.
create or replace function update_trip_dates(p_trip uuid, p_start date, p_end date, p_drop boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare v_old_start date; v_delta int; v_count int; v_out int;
begin
  if not can_manage(p_trip) then raise exception 'Only the trip owner or an admin can change the dates'; end if;
  if p_end < p_start then raise exception 'End date is before start date'; end if;
  if p_end - p_start + 1 > 60 then raise exception 'A trip can be at most 60 days'; end if;
  select start_date into v_old_start from trips where id = p_trip for update;
  if v_old_start is null then raise exception 'Trip not found'; end if;
  v_delta := v_old_start - p_start;  -- an earlier start moves every plan to a higher day number
  v_count := p_end - p_start + 1;
  select count(*) into v_out from itinerary_items where trip_id = p_trip and (day + v_delta < 1 or day + v_delta > v_count);
  if v_out > 0 and not p_drop then raise exception 'OUT_OF_RANGE:%', v_out; end if;
  -- remove what falls outside first, then shift (trip_days shifts in two steps so the primary key never collides)
  delete from itinerary_items where trip_id = p_trip and (day + v_delta < 1 or day + v_delta > v_count);
  delete from trip_days where trip_id = p_trip and (day + v_delta < 1 or day + v_delta > v_count);
  update decisions set day = null where trip_id = p_trip and day is not null and (day + v_delta < 1 or day + v_delta > v_count);
  if v_delta <> 0 then
    update trip_days set day = day + v_delta + 100000 where trip_id = p_trip;
    update trip_days set day = day - 100000 where trip_id = p_trip;
    update itinerary_items set day = day + v_delta where trip_id = p_trip;
    update decisions set day = day + v_delta where trip_id = p_trip and day is not null;
  end if;
  update trips set start_date = p_start, end_date = p_end where id = p_trip;
  insert into activity_log (trip_id, user_id, text) values (p_trip, auth.uid(), 'Changed the trip dates to ' || to_char(p_start, 'DD Mon') || ' – ' || to_char(p_end, 'DD Mon YYYY'));
  return v_out;
end $$;
revoke all on function update_trip_dates(uuid, date, date, boolean) from public;
grant execute on function update_trip_dates(uuid, date, date, boolean) to authenticated;
