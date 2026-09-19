begin;
-- Enforce the no-future rule at the table boundary as well as in the form.
alter table public.staff_time_entries add constraint staff_manual_not_future
  check(source <> 'manual' or (ended_at is not null and ended_at <= created_at));
commit;
