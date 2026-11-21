-- 0006 AI helper: planner days are written in parallel, one call per day (22 Nov 2026).
-- Each day call counts as kind 'day': 70 per person per day (3 plans of up to 21 days, plus retries).
alter table ai_usage drop constraint if exists ai_usage_kind_check;
alter table ai_usage add constraint ai_usage_kind_check check (kind in ('plan', 'day', 'swap', 'quick'));

create or replace function ai_take(p_kind text, p_trip uuid default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_scope uuid; v_limit int; v_ok boolean;
begin
  if auth.uid() is null then return false; end if;
  if p_kind = 'plan' then v_scope := auth.uid(); v_limit := 3;
  elsif p_kind = 'day' then v_scope := auth.uid(); v_limit := 70;
  elsif p_kind = 'swap' then v_scope := auth.uid(); v_limit := 40;
  elsif p_kind = 'quick' then
    if p_trip is null or not can_edit(p_trip) then return false; end if;
    v_scope := p_trip; v_limit := 50;
  else return false; end if;
  insert into ai_usage (scope_id, kind, day, count) values (v_scope, p_kind, current_date, 1)
  on conflict (scope_id, kind, day) do update set count = ai_usage.count + 1 where ai_usage.count < v_limit
  returning true into v_ok;
  return coalesce(v_ok, false);
end $$;
revoke all on function ai_take(text, uuid) from public;
revoke execute on function ai_take(text, uuid) from anon;
grant execute on function ai_take(text, uuid) to authenticated;
