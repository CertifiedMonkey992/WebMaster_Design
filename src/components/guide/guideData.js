/* ═══════════════════════════════════════════════════════════════════════════
   guideData.js — THE FIELD GUIDE'S PAGINATION
   ---------------------------------------------------------------------------
   The book is built from SECTIONS, so it cannot show a chapter the course
   does not have. A "spread" is what lies open:

     spread 0          inside cover  |  contents
     spread k + 1      chapter k's opener  |  chapter k's lessons

   Thickness is real: the book has PAGE_UNITS of paper, and a spread says how
   much of it lies on the left. Opening at chapter 4 puts most of the book on
   the left — which is what opening a real book at a late thumb-tab does.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SECTIONS, TOTAL_LESSONS } from '../../data/learnData'

export const CHAPTERS = SECTIONS
export const SPREADS = SECTIONS.length + 1
export const PAGE_UNITS = 10

/* The chapter inks: a field guide colour-codes its thumb index. Seven
   chapters since the curriculum redesign (2026-09); every ink passes AA as
   text on paper, because the chapter numerals are read, not just seen. */
export const CHAPTER_INK = ['--moss', '--evergreen', '--ochre-ink', '--clay-deep', '--berry-ink', '--ink-muted', '--ink']

export const minutesOf = (section) =>
  section.lessons.reduce((m, l) => m + parseInt(l.duration, 10), 0)

/** Lessons proper in a chapter (Case Files, projects and the capstone are extra). */
export const lessonsIn = (section) => section.lessons.filter((l) => (l.kind ?? 'lesson') === 'lesson').length

export const TOTAL_MINUTES = SECTIONS.reduce((m, s) => m + minutesOf(s), 0)

const LESSON_MINUTES = SECTIONS.flatMap((s) => s.lessons.filter((l) => (l.kind ?? 'lesson') === 'lesson').map((l) => parseInt(l.duration, 10)))
export const SHORTEST_LESSON = Math.min(...LESSON_MINUTES)
export const LONGEST_LESSON = Math.max(...LESSON_MINUTES)
export { TOTAL_LESSONS }

export const pad = (n) => String(n).padStart(2, '0')

/** Paper units lying on the left when `spread` is open. */
export function leftUnits(spread) {
  if (spread <= 0) return 0
  return Math.min(PAGE_UNITS - 1, 1 + 2 * (spread - 1))
}

/** Where chapter j's thumb tab sits, as a depth in paper units from the top. */
export const tabDepth = (j) => leftUnits(j + 1)

/** Folio (page number) printed at the foot of each page. */
export function folio(spread, side) {
  const base = spread * 2 + 1
  return side === 'left' ? base : base + 1
}

export function spreadLabel(spread) {
  if (spread <= 0) return 'Contents'
  const s = CHAPTERS[spread - 1]
  return `Chapter ${spread}, ${s.title}: ${lessonsIn(s)} lessons, ${minutesOf(s)} minutes`
}
