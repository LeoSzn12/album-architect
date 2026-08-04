export type ChallengeStatus = 'open' | 'accepted' | 'declined' | 'completed';

export function canTransitionChallenge(current: ChallengeStatus, next: Exclude<ChallengeStatus, 'open'>) {
  return (current === 'open' && (next === 'accepted' || next === 'declined'))
    || (current === 'accepted' && next === 'completed');
}
