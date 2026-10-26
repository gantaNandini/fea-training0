/** Pure cart helpers (unit-tested; used by the optimistic UI and the merge endpoint). */

export function addCourseId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id]
}

export function removeCourseId(ids: string[], id: string): string[] {
  return ids.filter((x) => x !== id)
}

/**
 * Guest -> user cart merge (REQ-125). Duplicates and already-enrolled courses are dropped.
 * `toMove` becomes new user rows; every guest row is deleted afterwards.
 */
export function mergeCartCourseIds(
  guest: string[],
  user: string[],
  enrolled: string[],
): { toMove: string[]; toDrop: string[] } {
  const have = new Set(user)
  const owned = new Set(enrolled)
  const toMove: string[] = []
  const toDrop: string[] = []
  for (const id of new Set(guest)) {
    if (have.has(id) || owned.has(id)) toDrop.push(id)
    else toMove.push(id)
  }
  return { toMove, toDrop }
}
