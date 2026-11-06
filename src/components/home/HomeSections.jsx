/* ═══════════════════════════════════════════════════════════════════════════
   HomeSections.jsx — THE LANDING PAGE BELOW THE HERO
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14. In order:

     PartsBand      a tinted band with wavy edges: the course's three Parts
                    and what runs along them, as four cards dealt onto it
     InsideHead     the heading over the product frames, its link at right
     LessonMarquee  every lesson in the course, in two rows drifting in
                    opposite directions
     StartCard      the framed card at the foot of the page: the way in

   The otter lives in two of them (otter/OtterScenes.jsx): it jumps onto
   a Parts card's top edge, and onto the left of the start card's.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { PageLink } from '../../nav'
import { useAuth } from '../../state/AuthContext'
import Reveal from '../../motion/Reveal'
import Marquee from '../../motion/Marquee'
import TextFx, { Marker, RollText, Typewriter } from '../../motion/TextFx'
import { Icon } from '../progression/Icons'
import { getLessonIcon } from '../learn/LessonIcons'
import { jumpTo } from './HomeHeader'
import { CardHopper, Climber } from '../otter/OtterScenes'
import { OTTER_SHOWN } from '../otter/shown'
import { FIRST_MINUTES, LESSONS, PART_CARDS, TOTAL_LESSONS, inWords, inkOf } from './homeData'

function Arrow() {
  return (
    <svg className="hs-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Wave({ edge }) {
  return (
    <svg className={`hs-wave hs-wave--${edge}`} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={edge === 'top'
        ? 'M0 80V42C180 14 360 8 560 26S960 70 1160 52 1360 22 1440 30V80Z'
        : 'M0 0V38C200 66 420 72 640 50S1040 8 1240 22 1400 50 1440 46V0Z'} />
    </svg>
  )
}

/* ── The Parts ─────────────────────────────────────────────────────────── */

export function PartsBand() {
  const band = useRef(null)
  return (
    <section className="hs-band" id="parts" tabIndex={-1} aria-labelledby="parts-heading" ref={band}>
      <Wave edge="top" />
      <div className="hs-band-inner">
        <TextFx as="h2" fx="flip" className="hs-title hs-center" id="parts-heading" stagger={22}>Three parts, one course.</TextFx>
        <TextFx as="p" fx="blur" by="word" stagger={14} delay={300} className="hs-sub hs-center">
          Understand how AI works, use it well, and use it responsibly — in that order, each part building on the last.
        </TextFx>

        <Reveal as="ul" className="hs-cards" variant="deal" stagger delay={200}>
          {PART_CARDS.map((c) => (
            <li key={c.key} className="hs-card">
              <span className="hs-card-icon"><Icon name={c.icon} size={20} /></span>
              <span className="hs-card-kicker">{c.kicker}</span>
              <h3 className="hs-card-title">{c.title}</h3>
              <p className="hs-card-body">{c.body}</p>
              <PageLink page="about" section="impact" className="hs-card-link">
                <RollText>Explore</RollText> <Arrow />
              </PageLink>
            </li>
          ))}
        </Reveal>

        <Reveal className="hs-center" variant="drop" delay={400}>
          <a className="btn btn-outline btn-ledge hs-more-btn" href="#lessons" onClick={jumpTo('lessons')}>See every lesson</a>
        </Reveal>
      </div>
      <Wave edge="bottom" />
      {OTTER_SHOWN && <CardHopper scope={band} />}
    </section>
  )
}

/* ── Inside: the heading over the product frames ───────────────────────── */

export function InsideHead() {
  return (
    <div className="hs-head">
      <div>
        <TextFx as="h2" fx="skew" className="hs-title" id="inside-heading">The real app, running.</TextFx>
        <p className="hs-sub">
          <Typewriter text="Every frame below is LunX itself on a demo learner." speed={30} />{' '}
          <Marker tone="moss" delay={200}>Nothing in them is saved</Marker>, and nothing is a mockup.
        </p>
      </div>
      <PageLink page="learn" className="hs-link">
        <RollText>Open the course</RollText> <Arrow />
      </PageLink>
    </div>
  )
}

/* ── Every lesson ──────────────────────────────────────────────────────── */

function LessonCard({ l }) {
  return (
    <article className="lc" style={{ '--chapter': inkOf(l.module) }}>
      <p className="lc-desc">{l.desc}</p>
      <div className="lc-foot">
        <span className="lc-avatar" aria-hidden="true">{getLessonIcon(l.id)}</span>
        <span className="lc-who">
          <span className="lc-title">{l.title}</span>
          <span className="lc-meta">Module {l.module + 1} · {l.minutes} min</span>
        </span>
      </div>
    </article>
  )
}

export function LessonMarquee() {
  const half = Math.ceil(LESSONS.length / 2)
  return (
    <section className="hs-lessons" id="lessons" tabIndex={-1} aria-labelledby="lessons-heading">
      <div className="hs-col">
        <TextFx as="h2" fx="bounce" className="hs-title" id="lessons-heading" stagger={30}>{`${inWords(TOTAL_LESSONS)} lessons.`}</TextFx>
        <TextFx as="p" fx="blur" by="word" stagger={14} delay={250} className="hs-sub">
          Every lesson in the course, from training your first classifier to designing an AI tool of your own.
        </TextFx>
        <p className="hs-note">The whole course, straight from the syllabus</p>
      </div>
      <Reveal variant="wipe" className="hs-rows">
        <Marquee direction={1} seconds={95} label="Lessons, first half">
          {LESSONS.slice(0, half).map((l) => <LessonCard key={l.id} l={l} />)}
        </Marquee>
        <Marquee direction={-1} seconds={105} label="Lessons, second half">
          {LESSONS.slice(half).map((l) => <LessonCard key={l.id} l={l} />)}
        </Marquee>
      </Reveal>
    </section>
  )
}

/* ── The way in ────────────────────────────────────────────────────────── */

export function StartCard() {
  const { account } = useAuth()
  const section = useRef(null)
  return (
    <section className="hs-start" aria-labelledby="start-heading" ref={section}>
      <Reveal className="hs-start-card" variant="curtain">
        <div className="hs-start-head">
          <span className="hs-start-icon"><Icon name="rocket" size={20} /></span>
          <TextFx as="h2" fx="block" className="hs-start-title" id="start-heading" delay={300}>
            {account ? 'Pick up where you left off' : 'Start lesson one'}
          </TextFx>
        </div>
        <TextFx as="p" fx="blur" by="word" stagger={16} delay={700} className="hs-start-sub">
          {account
            ? 'Your streak, hearts and progress are waiting in the course.'
            : `Free. Lesson one takes ${FIRST_MINUTES} minutes, and an account keeps your streak and progress.`}
        </TextFx>
        <div className="hs-start-actions">
          <PageLink page="learn" className="btn btn-primary btn-ledge hs-start-btn">
            {account ? 'Continue learning' : 'Get started'}
          </PageLink>
          {!account && (
            <PageLink page="signin" section="signin" className="btn btn-outline btn-ledge hs-start-btn">
              <Icon name="user" size={16} /> I already have an account
            </PageLink>
          )}
        </div>
      </Reveal>
      {OTTER_SHOWN && <Climber scope={section} />}
    </section>
  )
}
