/* Small wording helpers for the Leagues tab. */

import { parseYmd } from '../../utils/leagueTime'

/** "Oct 11" for a week id (its Sunday, YYYY-MM-DD), in the reader's language. */
export function weekLabelOf(weekId) {
  const d = parseYmd(weekId)
  if (!d) return weekId
  return new Date(Date.UTC(d.y, d.m - 1, d.d)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default { weekLabelOf }
