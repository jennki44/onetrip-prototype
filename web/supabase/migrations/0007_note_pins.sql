-- 0007 Notes page: pin a note so it shows on the trip's 今日 screen (22 Nov 2026).
alter table notes add column if not exists pinned boolean not null default false;
