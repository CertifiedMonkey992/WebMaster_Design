/* ═══════════════════════════════════════════════════════════════════════════
   homeData.js — WHAT THE LANDING PAGE SAYS, READ FROM THE COURSE
   ---------------------------------------------------------------------------
   Every number and title on the landing page comes from here, and everything
   here comes from the course data. Nothing is typed in by hand.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ALL_LESSONS, ITEM_KIND, PARTS, SECTIONS, TOTAL_LESSONS, TOTAL_SECTIONS } from '../../data/learnData'
import { CHAPTER_INK } from '../guide/guideData'

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** 21 → "Twenty-one". */
export function inWords(n) {
  const w = n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`
  return w[0].toUpperCase() + w.slice(1)
}

export const inkOf = (i) => `var(${CHAPTER_INK[i % CHAPTER_INK.length]})`

const isLesson = (l) => (l.kind ?? ITEM_KIND.LESSON) === ITEM_KIND.LESSON

export const LESSONS = SECTIONS.flatMap((s, i) => s.lessons.filter(isLesson).map((l) => ({
  id: l.id,
  title: l.title,
  desc: l.desc,
  minutes: parseInt(l.duration, 10),
  module: i,
  moduleTitle: s.title,
})))

const capstone = ALL_LESSONS.find((l) => l.kind === ITEM_KIND.CAPSTONE)
const projects = ALL_LESSONS.filter((l) => l.kind === ITEM_KIND.PROJECT)

export const PART_CARDS = [
  ...PARTS.map((p, i) => ({
    key: p.id,
    icon: ['brain', 'target', 'shield'][i] ?? 'book',
    kicker: `Part ${p.id} · ${p.modules.length} modules`,
    title: p.title,
    body: p.summary,
  })),
  {
    key: 'finish',
    icon: 'trophy',
    kicker: 'Along the way',
    title: 'Case Files and a capstone',
    body: `A Case File closes each of the ${inWords(TOTAL_SECTIONS).toLowerCase()} modules, ${inWords(projects.length).toLowerCase()} Part projects test what you can do, and a ${parseInt(capstone?.duration, 10) || 20}-minute ${capstone?.title.replace(/^Capstone:\s*/, '') || 'capstone'} ends the course.`,
  },
]

export const FIRST_MINUTES = parseInt(SECTIONS[0].lessons[0].duration, 10)
export { TOTAL_LESSONS, TOTAL_SECTIONS }
