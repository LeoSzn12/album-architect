-- Supabase Data API grants for the TrackDraft schema.
-- RLS remains the row-level boundary; these grants only expose the operations
-- that the application needs to the authenticated/anonymous PostgREST roles.

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.users to authenticated;
grant select, insert, update, delete on public.provider_accounts to authenticated;
grant select, insert, update on public.songs to authenticated;
grant select, insert, update on public.song_provider_refs to authenticated;
grant select, insert, update, delete on public.library_items to authenticated;
grant select on public.game_templates to authenticated;
grant select, insert, update, delete on public.game_sessions to authenticated;
grant select, insert, update, delete on public.participants to authenticated;
grant select, insert, update, delete on public.rounds to authenticated;
grant select, insert, update, delete on public.recommendations to authenticated;
grant select, insert, update, delete on public.picks to authenticated;
grant select, insert, update, delete on public.scorecards to authenticated;
grant select, insert on public.share_records to authenticated;
grant select on public.share_records to anon;
grant select, insert, update on public.challenges to authenticated;
grant select, insert on public.moderation_items to authenticated;
