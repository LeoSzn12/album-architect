-- Allow a signed-in recipient to accept an open challenge while keeping all
-- subsequent updates scoped to the sender or assigned recipient.
drop policy if exists "participants can update challenges" on public.challenges;
create policy "participants can update challenges" on public.challenges
for update to authenticated
using (
  (select auth.uid()) = sender_id
  or (select auth.uid()) = recipient_id
  or (status = 'open' and recipient_id is null)
)
with check (
  (select auth.uid()) = sender_id
  or (select auth.uid()) = recipient_id
);
