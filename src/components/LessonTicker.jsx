/* ═══════════════════════════════════════════════════════════════════════════
   LessonTicker.jsx — EVERY LESSON IN THE GUIDE, ALWAYS MOVING
   ---------------------------------------------------------------------------
   The page's one continuous motion outside the hero (MOTION_RULES.md →
   Ambient). Roots & Routes' testimonial wall says "there are more of these
   than fit on screen"; this says the same about the course, with the only
   content that is true: the real lesson titles, in two rows drifting in
   opposite directions. Only lessons proper — the Case Files, Part projects
   and capstone are the course's work, not its chapters' contents.

   It is a transition as much as a decoration — it carries the eye from the
   book in the hero down into the course section, and scrolling pushes it.
   Not a course link: the chips are not buttons. Hovering a row brakes it so a
   title can be read, and each chip names its chapter in a tooltip.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SECTIONS, TOTAL_LESSONS } from '../data/learnData'
import { getLessonIcon } from './learn/LessonIcons'
import Marquee from '../motion/Marquee'
import { CHAPTER_INK, pad } from './guide/guideData'

const LESSONS = SECTIONS.flatMap((section, j) =>
  section.lessons
    .filter((lesson) => (lesson.kind ?? 'lesson') === 'lesson')
    .map((lesson) => ({ ...lesson, j, chapter: section.title })),
)

/* Interleave so each row mixes chapters instead of running in blocks. */
const ROW_A = LESSONS.filter((_, i) => i % 2 === 0)
const ROW_B = LESSONS.filter((_, i) => i % 2 === 1).reverse()

function Chip({ lesson }) {
  return (
    <span
      className="tk-chip"
      style={{ '--chapter': `var(${CHAPTER_INK[lesson.j]})` }}
      data-tip={`Chapter ${lesson.j + 1} · ${lesson.chapter}`}
    >
      <span className="tk-num">{pad(lesson.j + 1)}</span>
      <span className="tk-ico" aria-hidden="true">{getLessonIcon(lesson.id)}</span>
      <span className="tk-title">{lesson.title}</span>
      <span className="tk-dur">{lesson.duration}</span>
    </span>
  )
}

export default function LessonTicker() {
  return (
    <section className="ticker" aria-label={`All ${TOTAL_LESSONS} lessons`}>
      <Marquee direction={1} seconds={64} label="Lessons, first row">
        {ROW_A.map((l) => <Chip key={l.id} lesson={l} />)}
      </Marquee>
      <Marquee direction={-1} seconds={76} label="Lessons, second row">
        {ROW_B.map((l) => <Chip key={l.id} lesson={l} />)}
      </Marquee>
    </section>
  )
}
