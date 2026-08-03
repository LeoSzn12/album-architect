/** Returns a reordered copy without mutating the persisted draft snapshot. */
export function reorderTracklist<T>(tracks: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= tracks.length || toIndex >= tracks.length) return [...tracks];
  const reordered = [...tracks];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered;
}
