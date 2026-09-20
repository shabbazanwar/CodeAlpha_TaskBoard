/**
 * Ordering is stored as a gap-free `position` integer per board (columns
 * within a project) and per task (cards within a column). After every move the
 * affected lists are renumbered from 0, which keeps positions predictable and
 * avoids the fractional-index drift you get from inserting between neighbours.
 * Lists here are short enough that renumbering costs nothing.
 */

/** Clamp an arbitrary index into [0, length]. */
export function clampIndex(index: number, length: number): number {
  if (Number.isNaN(index) || index < 0) return 0;
  return Math.min(index, length);
}

/**
 * Returns the ids of `others` with `movingId` inserted at `targetIndex`.
 * `others` must already be in position order and must not contain `movingId`.
 */
export function insertAt(others: { id: string }[], movingId: string, targetIndex: number): string[] {
  const ids = others.map((item) => item.id);
  ids.splice(clampIndex(targetIndex, ids.length), 0, movingId);
  return ids;
}
