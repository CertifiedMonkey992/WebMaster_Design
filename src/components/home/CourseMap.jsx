/* ═══════════════════════════════════════════════════════════════════════════
   CourseMap.jsx — THE WHOLE COURSE, IN ONE BAND
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 12 → Course map.

   The field guide (guide/FieldGuide.jsx — the same book, built from the
   course data) with the seven chapter tiles hung around it. A tile is the
   book's thumb index made large: pointing at one lifts that chapter's pages,
   pressing it opens the book there. The module strip under the hero opens
   it the same way, through the ref this component hands back.
   ═══════════════════════════════════════════════════════════════════════════ */

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { PARTS, SECTIONS, TOTAL_LESSONS, TOTAL_SECTIONS } from '../../data/learnData'
import { lessonsIn, minutesOf, pad } from '../guide/guideData'
import FieldGuide from '../guide/FieldGuide'
import Reveal from '../../motion/Reveal'
import SplitText from '../../motion/SplitText'
import { PageLink } from '../../nav'
import { ChapterTile, Floater } from './Scenery'

/* Where each chapter's tile hangs, clear of the open book. */
const SPOTS = [
  { left: '4%',  top: '6%' },
  { left: '8%',  top: '31%' },
  { left: '1%',  top: '56%' },
  { left: '9%',  top: '80%' },
  { right: '5%', top: '9%' },
  { right: '1%', top: '40%' },
  { right: '7%', top: '72%' },
]

const NUMBERS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

const CourseMap = forwardRef(function CourseMap(_, apiRef) {
  const guide = useRef(null)
  const open = (i) => guide.current?.go(i)
  useImperativeHandle(apiRef, () => ({ open }), [])

  return (
    <section className="cm" id="course-map" aria-labelledby="course-map-heading">
      <SplitText as="h2" className="home-feature-heading cm-heading" id="course-map-heading" stagger={48}>
        {NUMBERS[TOTAL_SECTIONS]} modules, three parts.
      </SplitText>
      <Reveal as="p" className="home-feature-body cm-body" delay={200}>
        {TOTAL_LESSONS} lessons in all. Each module ends in a Case File, each part
        in a project, and the course in a capstone.
      </Reveal>
      <Reveal as="ol" className="cm-parts" variant="up" stagger delay={280}>
        {PARTS.map((p) => (
          <li key={p.id}><b>Part {p.id}</b> {p.title}</li>
        ))}
      </Reveal>

      <div className="cm-stage">
        <div className="cm-book">
          <FieldGuide ref={guide} />
        </div>
        <ul className="cm-tiles">
          {SECTIONS.map((section, i) => (
            <li key={section.id} className="cm-tile-spot">
              <Floater at={SPOTS[i]} seed={(i * 0.137) % 1} k={0.9 + (i % 3) * 0.12} r={(i % 2 ? 1 : -1) * (4 + i)}>
                <button
                  type="button"
                  className="cm-tile"
                  onPointerEnter={() => guide.current?.peek(i)}
                  onPointerLeave={() => guide.current?.peek(null)}
                  onFocus={() => guide.current?.peek(i)}
                  onBlur={() => guide.current?.peek(null)}
                  onClick={() => open(i)}
                  data-tip={`${section.title} · ${lessonsIn(section)} lessons · ${minutesOf(section)} min`}
                  aria-label={`Module ${i + 1}, ${section.title}: open the field guide at this chapter`}
                >
                  <ChapterTile j={i} size="lg">{pad(i + 1)}</ChapterTile>
                </button>
              </Floater>
            </li>
          ))}
        </ul>
      </div>

      <Reveal className="cm-action" variant="up" delay={120}>
        <PageLink page="about" section="impact" className="btn btn-outline btn-ledge cm-btn">
          What the course covers
        </PageLink>
      </Reveal>
    </section>
  )
})

export default CourseMap
