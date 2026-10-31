/* ═══════════════════════════════════════════════════════════════════════════
   ModuleStrip.jsx — THE SEVEN MODULES, UNDER THE HERO
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 12 → Module strip.

   One chip per module, scrolled by an arrow at each end (an arrow greys out
   when there is nothing more that way). A chip opens the field guide in the
   course map at that chapter.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SECTIONS } from '../../data/learnData'
import { lessonsIn, minutesOf, pad } from '../guide/guideData'
import { ChapterTile } from './Scenery'

function Chevron({ dir }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir < 0 ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
    </svg>
  )
}

export default function ModuleStrip({ onOpen }) {
  const track = useRef(null)
  const [ends, setEnds] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setEnds({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const scrollBy = (dir) => {
    const el = track.current
    el?.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' })
  }

  return (
    <section className="ms" aria-label="The seven modules">
      <div className="ms-inner">
        <button type="button" className="ms-arrow" onClick={() => scrollBy(-1)} disabled={ends.start} aria-label="Earlier modules">
          <Chevron dir={-1} />
        </button>
        <ul className="ms-track" ref={track} onScroll={measure}>
          {SECTIONS.map((section, i) => (
            <li key={section.id}>
              <button
                type="button"
                className="ms-chip"
                onClick={() => onOpen?.(i)}
                data-tip={`${lessonsIn(section)} lessons · ${minutesOf(section)} min`}
                aria-label={`Module ${i + 1}, ${section.title}: open the field guide at this chapter`}
              >
                <ChapterTile j={i} size="sm">{pad(i + 1)}</ChapterTile>
                <span className="ms-label">{section.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="ms-arrow" onClick={() => scrollBy(1)} disabled={ends.end} aria-label="Later modules">
          <Chevron dir={1} />
        </button>
      </div>
    </section>
  )
}
