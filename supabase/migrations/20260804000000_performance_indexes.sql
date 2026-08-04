-- Cover foreign-key lookups identified by the Supabase performance advisor.
-- These indexes keep authenticated persistence and challenge joins efficient.

create index if not exists challenges_source_session_idx on public.challenges(source_session_id);
create index if not exists challenges_sender_idx on public.challenges(sender_id);
create index if not exists challenges_recipient_idx on public.challenges(recipient_id);
create index if not exists challenges_rematch_of_idx on public.challenges(rematch_of);
create index if not exists challenges_accepted_by_idx on public.challenges(accepted_by);
create index if not exists library_items_song_idx on public.library_items(song_id);
create index if not exists moderation_items_submitted_by_idx on public.moderation_items(submitted_by);
create index if not exists moderation_items_song_provider_ref_idx on public.moderation_items(song_provider_ref_id);
create index if not exists participants_user_idx on public.participants(user_id);
create index if not exists picks_song_idx on public.picks(song_id);
create index if not exists recommendations_song_idx on public.recommendations(song_id);
create index if not exists scorecards_creator_idx on public.scorecards(creator_id);
create index if not exists share_records_creator_idx on public.share_records(creator_id);
