/* ═══════════════════════════════════════════════════════════════════════════
   ModuleStack.jsx — THE SEVEN MODULES AS A DECK OF CARDS
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14 → Hero → Module deck. The course's seven
   modules stand in a fanned 3D row, the front card nearest the reader. The
   cards are dealt in when the page opens; pointing at the deck spreads it;
   pressing a card brings it to the front, pressing the front card sends it
   to the back. On its Stage turn the deck shuffles one card forward, and
   the page's scroll turns the whole deck a little.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react'
import { usePerformer, yieldTo } from '../../motion/stage'
import { useScrollProgress } from '../../motion/scroll'
import Reveal from '../../motion/Reveal'
import { getLessonIcon } from '../learn/LessonIcons'
import { MODULES, inkOf } from './homeData'

const N = MODULES.length

export default function ModuleStack() {
  const deck = useRef(null)
  const [front, setFront] = useState(N - 1)
  const [leaving, setLeaving] = useState(null)
  const scrollRef = useScrollProgress()

  const sendBack = () => {
    setLeaving(front)
    setFront((f) => (f - 1 + N) % N)
  }

  usePerformer(deck, {
    id: 'hero:deck',
    region: 'hero:deck',
    tier: 'minor',
    cooldown: 5200,
    run: async (ctx) => { sendBack(); await ctx.wait(900) },
  })

  const press = (i) => {
    yieldTo(deck.current)
    if (i === front) sendBack()
    else { setLeaving(null); setFront(i) }
  }

  const setRefs = (el) => { deck.current = el; scrollRef(el) }

  return (
    <div className="stk" ref={setRefs}>
      <Reveal as="ol" className="stk-deck" variant="deal" stagger immediate delay={350} aria-label="The seven modules">
        {MODULES.map((m, i) => {
          /* depth 0 is the front card; the rest step back and up-left. */
          const depth = (front - i + N) % N
          return (
            <li
              key={m.id}
              className={`stk-slot${depth === 0 ? ' is-front' : ''}${leaving === i ? ' is-leaving' : ''}`}
              style={{ '--d': depth, zIndex: N - depth }}
              onAnimationEnd={() => leaving === i && setLeaving(null)}
            >
              <button
                type="button"
                className="stk-card"
                style={{ '--chapter': inkOf(i) }}
                onClick={() => press(i)}
                aria-label={`Module ${i + 1}, ${m.title}: ${m.lessons} lessons, ${m.minutes} minutes${depth === 0 ? '. Send to the back' : '. Bring to the front'}`}
              >
                <span className="stk-tag"><span className="stk-dot" />Module {m.number}</span>
                <span className="stk-title">{m.title}</span>
                <span className="stk-art" aria-hidden="true">{getLessonIcon(m.firstLesson)}</span>
                <span className="stk-meta">{m.lessons} lessons · {m.minutes} min</span>
              </button>
            </li>
          )
        })}
      </Reveal>
    </div>
  )
}
