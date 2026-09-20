-- Some newly provisioned projects include Supabase's automatic RLS event trigger.
-- Its trigger function does not need to be callable through the Data API.
begin;
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
commit;
