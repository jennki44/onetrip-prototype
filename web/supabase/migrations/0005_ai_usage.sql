-- 0005 AI helper: daily usage limits (22 Nov 2026)
-- Trip planner: 3 plans and 40 swaps per person per day. Quick add: 50 per trip per day.
create table if not exists ai_usage (
  scope_id uuid not null,              -- the user (plans) or the trip (quick adds)
  kind text not null check (kind in ('plan', 'swap', 'quick')),
  day date not null default current_date,
  count int not null default 0,
  primary key (scope_id, kind, day)
);
alter table ai_usage enable row level security;   -- no policies: only ai_take() touches it

-- Count one AI use; returns false when today's limit is already reached.
create or replace function ai_take(p_kind text, p_trip uuid default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_scope uuid; v_limit int; v_ok boolean;
begin
  if auth.uid() is null then return false; end if;
  if p_kind = 'plan' then v_scope := auth.uid(); v_limit := 3;
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
