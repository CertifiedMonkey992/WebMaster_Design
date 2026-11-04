/* ═══════════════════════════════════════════════════════════════════════════
   LessonFinder.jsx — SEARCH THE COURSE FROM THE FIRST SCREEN
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14 → Hero → Course search. A real search over
   the course data: pick Lessons or Modules, type a keyword, and the matches
   appear under the box as you type, the matched words marked. A match opens
   the course (which asks for an account first).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useId, useMemo, useRef, useState } from 'react'
import { PageLink } from '../../nav'
import { Icon } from '../progression/Icons'
import { LESSONS, MODULES } from './homeData'

const KINDS = {
  lessons: LESSONS.map((l) => ({ id: l.id, title: l.title, text: `${l.title} ${l.desc} ${l.moduleTitle}`, meta: `Module ${l.module + 1} · ${l.minutes} min` })),
  modules: MODULES.map((m) => ({ id: m.id, title: m.title, text: `${m.title} ${m.subtitle} ${m.question}`, meta: `${m.lessons} lessons · ${m.minutes} min` })),
}

function Marked({ text, q }) {
  if (!q) return text
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return text
  return <>{text.slice(0, i)}<mark className="lf-mark">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>
}

export default function LessonFinder() {
  const [kind, setKind] = useState('lessons')
  const [q, setQ] = useState('')
  const input = useRef(null)
  const id = useId()
  const query = q.trim()

  const hits = useMemo(() => {
    if (!query) return []
    const words = query.toLowerCase().split(/\s+/)
    return KINDS[kind].filter((item) => words.every((w) => item.text.toLowerCase().includes(w))).slice(0, 5)
  }, [kind, query])

  return (
    <div className="lf">
      <form className="lf-box" role="search" aria-label="Search the course" onSubmit={(e) => { e.preventDefault(); input.current?.focus() }}>
        <Icon name="search" size={18} className="lf-icon" />
        <input
          ref={input}
          className="lf-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${kind}…`}
          aria-label={`Search ${kind}`}
          aria-controls={`${id}-results`}
          autoComplete="off"
        />
        <button type="button" className="lf-clear" onClick={() => { setQ(''); input.current?.focus() }} disabled={!q}>Clear</button>
        <button type="submit" className="btn btn-primary lf-go">Search</button>
      </form>

      <div className="lf-row">
        <div className="lf-toggle" role="radiogroup" aria-label="Search in" data-kind={kind}>
          <span className="lf-toggle-pill" aria-hidden="true" />
          {Object.keys(KINDS).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className="lf-opt" onClick={() => setKind(k)}>
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
        <p className="lf-hint">Choose Lessons or Modules, then search by keyword.</p>
      </div>

      <div id={`${id}-results`} className="lf-results" aria-live="polite">
        {query && (hits.length ? (
          <ul>
            {hits.map((h, i) => (
              <li key={h.id} style={{ '--i': i }}>
                <PageLink page="learn" className="lf-hit">
                  <span className="lf-hit-title"><Marked text={h.title} q={query.split(/\s+/)[0]} /></span>
                  <span className="lf-hit-meta">{h.meta}</span>
                  <Icon name="arrow" size={16} className="lf-hit-arrow" />
                </PageLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lf-none">No {kind} match “{query}”.</p>
        ))}
      </div>
    </div>
  )
}
