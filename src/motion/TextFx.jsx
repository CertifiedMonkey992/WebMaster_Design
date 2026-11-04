/* ═══════════════════════════════════════════════════════════════════════════
   TextFx.jsx — TEXT THAT PERFORMS ITS OWN ARRIVAL
   ---------------------------------------------------------------------------
   MOTION_RULES.md → Revision 14 → Text effects. The landing page's type
   arrives the way a slide's type does in a deck editor — each line its own
   entrance — and a few pieces keep answering the pointer afterwards.

     <TextFx fx="tumble">          letters tumble in, rotating, and land
     <TextFx fx="stomp">           words slam down from twice their size
     <TextFx fx="flip">            letters flip up on a top hinge
     <TextFx fx="bounce">          letters drop and bounce
     <TextFx fx="pop">             letters pop from nothing, overshooting
     <TextFx fx="blur">            letters come into focus
     <TextFx fx="swing">           words swing in on a side hinge
     <TextFx fx="skew">            words slide in leaning, and straighten
     <TextFx fx="block">           a bar of colour wipes across, leaving the text
     <Typewriter text>             typed, with a caret
     <Scramble text>               decoded from noise, left to right — and
                                   again when the pointer crosses it
     <Rotator words>               one word at a time, flipping to the next
                                   on its Stage turn
     <Marker>                      a highlighter stroke laid behind the words
     <Squiggle>                    a hand-drawn line drawn under the words
     <RollText>                    a link label whose letters roll over on hover

   Every one keeps the real text for screen readers (a visually hidden copy;
   the animated copy is aria-hidden) and, under reduced motion, renders it
   already arrived.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState } from 'react'
import useInView from './useInView'
import { prefersReducedMotion } from './env'
import { usePerformer } from './stage'
import './text.css'

/* ── Splitting ─────────────────────────────────────────────────────────── */

export function plainText(node) {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(plainText).join('')
  if (isValidElement(node)) return node.type === 'br' ? ' ' : plainText(node.props.children)
  return ''
}

function split(node, by, counter) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).split(/(\s+)/).map((part, i) => {
      if (!part) return null
      if (/^\s+$/.test(part)) return part
      if (by === 'word') {
        const index = counter.n++
        return <span key={`w${index}-${i}`} className="tx-u" style={{ '--i': index }}>{part}</span>
      }
      return (
        <span key={`w${counter.n}-${i}`} className="tx-w">
          {[...part].map((ch) => {
            const index = counter.n++
            return <span key={index} className="tx-u" style={{ '--i': index }}>{ch}</span>
          })}
        </span>
      )
    })
  }
  if (isValidElement(node)) {
    if (node.type === 'br') return node
    if (node.type === Fragment) return Children.map(node.props.children, (c) => split(c, by, counter))
    if (typeof node.type !== 'string') {
      const index = counter.n++
      return <span key={`c${index}`} className="tx-u" style={{ '--i': index }}>{node}</span>
    }
    return cloneElement(node, undefined, Children.map(node.props.children, (c) => split(c, by, counter)))
  }
  if (Array.isArray(node)) return node.map((c) => split(c, by, counter))
  return node
}

const WORD_FX = new Set(['stomp', 'swing', 'skew'])

/* ── Entrances ─────────────────────────────────────────────────────────── */

export default function TextFx({
  as: Tag = 'span',
  fx = 'tumble',
  by,
  immediate = false,
  delay = 0,
  stagger,
  className = '',
  children,
  style,
  ...rest
}) {
  const [ref, inView] = useInView({ immediate, threshold: 0.35 })
  const unit = by || (WORD_FX.has(fx) ? 'word' : 'char')
  const content = fx === 'block'
    ? <span className="tx-block-in">{children}</span>
    : split(children, unit, { n: 0 })

  return (
    <Tag
      {...rest}
      ref={ref}
      style={{ ...style, '--tx-delay': `${delay}ms`, ...(stagger != null ? { '--tx-stagger': `${stagger}ms` } : null) }}
      className={`tx tx--${fx}${inView ? ' is-in' : ''} ${className}`.trim()}
    >
      <span className="pg-sr-only">{plainText(children)}</span>
      <span className="tx-show" aria-hidden="true">{content}</span>
    </Tag>
  )
}

/* ── Typewriter ────────────────────────────────────────────────────────── */

export function Typewriter({ as: Tag = 'span', text, speed = 42, delay = 0, immediate = false, className = '', ...rest }) {
  const [ref, inView] = useInView({ immediate, threshold: 0.4 })
  const [n, setN] = useState(() => (prefersReducedMotion() ? text.length : 0))
  useEffect(() => {
    if (!inView || n >= text.length) return undefined
    const t = window.setTimeout(() => setN((v) => v + 1), n === 0 ? delay : speed + (text[n - 1] === ' ' ? speed : 0))
    return () => clearTimeout(t)
  }, [inView, n, text, speed, delay])
  const done = n >= text.length
  return (
    <Tag {...rest} ref={ref} className={`tx-type${done ? ' is-done' : ''} ${className}`.trim()}>
      <span className="pg-sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        <span className="tx-caret" />
        <span className="tx-ghost">{text.slice(n)}</span>
      </span>
    </Tag>
  )
}

/* ── Scramble ──────────────────────────────────────────────────────────── */

const NOISE = '01<>/{}[]#%&*+=?ΣΔ∂λ'

export function Scramble({ as: Tag = 'span', text, duration = 900, delay = 0, immediate = false, hover = true, className = '', ...rest }) {
  const [ref, inView] = useInView({ immediate, threshold: 0.4 })
  const out = useRef(null)
  const raf = useRef(0)

  const run = (d = duration) => {
    const el = out.current
    if (!el || prefersReducedMotion()) return
    cancelAnimationFrame(raf.current)
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / d)
      const settled = Math.floor(p * text.length)
      let s = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        s += i < settled || ch === ' ' ? ch : NOISE[(Math.random() * NOISE.length) | 0]
      }
      el.textContent = s
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (!inView) return undefined
    const t = window.setTimeout(() => run(), delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, text])

  return (
    <Tag
      {...rest}
      ref={ref}
      className={`tx-scramble${inView ? ' is-in' : ''} ${className}`.trim()}
      onPointerEnter={hover ? () => run(duration * 0.6) : undefined}
    >
      <span className="pg-sr-only">{text}</span>
      <span ref={out} aria-hidden="true">{text}</span>
    </Tag>
  )
}

/* ── Rotator ───────────────────────────────────────────────────────────── */

export function Rotator({ words, region = 'rotator', className = '' }) {
  const host = useRef(null)
  const [[i, prev], setPair] = useState([0, null])
  const at = useRef(0)
  usePerformer(host, {
    id: `rotator:${region}`,
    region,
    tier: 'accent',
    weight: 1.2,
    cooldown: 2600,
    run: async (ctx) => {
      const was = at.current
      at.current = (was + 1) % words.length
      setPair([at.current, was])
      await ctx.wait(900)
    },
  })
  return (
    <span ref={host} className={`tx-rot ${className}`.trim()}>
      <span className="pg-sr-only">{words[i]}</span>
      {words.map((w, j) => (
        <span key={w} aria-hidden="true" className={`tx-rot-w${j === i ? ' is-on' : ''}${j === prev ? ' is-off' : ''}`}>{w}</span>
      ))}
    </span>
  )
}

/* ── Marks under and behind words ──────────────────────────────────────── */

export function Marker({ children, tone = 'clay', delay = 0, className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.8 })
  return (
    <span ref={ref} style={{ '--tx-delay': `${delay}ms` }} className={`tx-marker tx-marker--${tone}${inView ? ' is-in' : ''} ${className}`.trim()}>
      {children}
    </span>
  )
}

export function Squiggle({ children, delay = 0, immediate = false, className = '' }) {
  const [ref, inView] = useInView({ immediate, threshold: 0.6 })
  return (
    <span ref={ref} style={{ '--tx-delay': `${delay}ms` }} className={`tx-squiggle${inView ? ' is-in' : ''} ${className}`.trim()}>
      {children}
      <svg className="tx-squiggle-line" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path pathLength="1" d="M3 11C40 4 62 15 98 9S160 3 196 10 262 15 297 6" />
      </svg>
    </span>
  )
}

/* ── Hover ─────────────────────────────────────────────────────────────── */

export function RollText({ children }) {
  const text = plainText(children)
  return (
    <span className="tx-roll">
      <span className="pg-sr-only">{text}</span>
      <span className="tx-roll-row" aria-hidden="true">
        {[...text].map((ch, i) => (
          <span key={i} className="tx-roll-c" style={{ '--i': i }} data-ch={ch === ' ' ? ' ' : ch}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </span>
    </span>
  )
}
