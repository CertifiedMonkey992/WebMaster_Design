/* ═══════════════════════════════════════════════════════════════════════════
   AboutPage.jsx — WHO MADE LUNX, WHY, AND HOW IT MEETS THE BRIEF
   ---------------------------------------------------------------------------
   The third page of the site, with its own address (#/about). Its sections,
   in order:

     hero          what this page is, a catalogue card of the facts
     compliance    the TSA compliance statement and the event description
                   and theme, word for word
     story         why a field guide, and the three principles behind it
     impact        the course counted, split into the brief's three strands
     method        one lesson, start to finish, with the real numbers

   and then the references (data/references.js), in the order a TSA
   reviewer looks for them:

     worklog       what we built, and when, from the git history
     copyright     the copyright checklist, one claim per row
     credits       the code stack in prose, then every tool with its licence
     sources       the research the lessons cite, by module, and standards
     inspirations  what we studied, and what we took from each
     closing       the shared closing CTA

   Every figure is read from course data or config — nothing is typed in —
   so this page cannot describe a course the product does not have. LunX's
   accounts live in each reader's browser and it runs no analytics, so it
   does not claim a learner count.
   ═══════════════════════════════════════════════════════════════════════════ */

import Navbar     from '../components/Navbar'
import ClosingCTA from '../components/ClosingCTA'
import Footer     from '../components/Footer'
import { Eyebrow, Mark } from '../components/showcase/ProductSections'

import { SECTIONS, PARTS, TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import { ACHIEVEMENTS } from '../data/achievements'
import { DAILY_TEMPLATES, WEEKLY_TEMPLATES } from '../data/questTemplates'
import { XP, CURRENCY, HEARTS } from '../config/progressionConfig'
import { TSA_EVENT } from '../data/tsaEvent'
import { CHAPTER_INK, TOTAL_MINUTES, SHORTEST_LESSON, LONGEST_LESSON, minutesOf, lessonsIn, pad } from '../components/guide/guideData'

import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import CountUp from '../motion/CountUp'
import { DUR } from '../motion/timing'
import { useRef } from 'react'
import { useAboutPreviews } from '../components/learn/previews'
import { CONNECTED } from '../config/serverConfig'
import { SITE } from '../site'
import { WORK_LOG, CHECKLIST, TOOLS, RESEARCH, STANDARDS, INSPIRATIONS } from '../data/references'

import '../components/showcase/showcase.css'
import './AboutPage.css'

/* ── Derived facts ───────────────────────────────────────────────────────── */

const SHORTEST = SHORTEST_LESSON
const LONGEST = LONGEST_LESSON
const QUEST_TYPES = DAILY_TEMPLATES.length + WEEKLY_TEMPLATES.length

/* The brief names three kinds of learning. Each is one of the course's three
   Parts (data/learnData.js → PARTS), and each module belongs to one. */
const STRANDS = PARTS.map((part) => ({ id: part.id, label: part.strand, part: part.title, modules: part.modules })).map((strand) => {
  const sections = SECTIONS.filter((s) => strand.modules.includes(s.id))
  return {
    ...strand,
    sections,
    numbers: sections.map((s) => SECTIONS.indexOf(s) + 1),
    lessons: sections.reduce((n, s) => n + lessonsIn(s), 0),
    minutes: sections.reduce((m, s) => m + minutesOf(s), 0),
  }
})

const strand = (id) => STRANDS.find((s) => s.id === id)
/* A list in prose: "a, b and c". */
const inProse = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

/* ── References ──────────────────────────────────────────────────────────── */

/* A tool that only a connected build uses is not listed on a local one. */
const BUILT_WITH = TOOLS.filter((t) => CONNECTED || !t.connected)

/* The research, by the module whose lessons cite it. */
const SOURCES_BY_MODULE = SECTIONS
  .map((section, i) => ({ section, number: i + 1, items: RESEARCH.filter((r) => r.module === i + 1) }))
  .filter((m) => m.items.length > 0)

/* '2026-09-04' to '2026-09-05' → 'Sep 4–5'; across months, 'Oct 30 – Nov 4'. */
const MONTH = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })
const DAY = (iso) => Number(iso.slice(8, 10))
const dateRange = ({ date, end }) => {
  if (!end) return `${MONTH(date)} ${DAY(date)}`
  if (MONTH(date) === MONTH(end)) return `${MONTH(date)} ${DAY(date)}–${DAY(end)}`
  return `${MONTH(date)} ${DAY(date)} – ${MONTH(end)} ${DAY(end)}`
}

/* An external link: opens in a new tab and says so to a screen reader. */
function OutLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}<span className="pg-sr-only"> (opens in a new tab)</span>
    </a>
  )
}

const Check = () => (
  <svg className="ab-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17 4 12" />
  </svg>
)

const TRADEMARKS = ['ChatGPT', 'GPT-4', 'Claude', 'Gemini', 'Microsoft Copilot', 'GitHub Copilot', 'Perplexity', 'Character.AI', 'Stable Diffusion']

/* ── Small pieces ────────────────────────────────────────────────────────── */

const ArrowDown = () => (
  <svg className="btn-arrow ab-arrow-down" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" /><path d="m6 13 6 6 6-6" />
  </svg>
)

/* Scroll to a section without writing a fragment into the address bar — this
   page lives at #/about, and a fragment would replace that address. */
const scrollToId = (e, id) => {
  const target = document.getElementById(id)
  if (!target) return
  e.preventDefault()
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const NAV_LINKS = [
  { id: 'compliance', label: 'Compliance' },
  { id: 'story',      label: 'Story' },
  { id: 'method',     label: 'How it works' },
  { id: 'worklog',    label: 'Work log' },
  { id: 'sources',    label: 'Sources' },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AboutPage() {
  const methodRef = useRef(null)
  const impactRef = useRef(null)
  useAboutPreviews(methodRef, impactRef)

  return (
    <div className="app">
      <Navbar links={NAV_LINKS} scrollLinks />

      <main className="about" id="main" tabIndex={-1}>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="ab-hero" aria-labelledby="about-heading">
          <div className="ab-hero-copy">
            <Reveal as="p" variant="left" immediate delay={60} className="ab-hero-eyebrow">
              About LunX · the story, the course, the work log and our sources
            </Reveal>

            <SplitText as="h1" className="ab-hero-heading" id="about-heading" immediate delay={100} stagger={34}>
              What we made, and <em className="em">why it looks like paper</em>.
            </SplitText>

            <Reveal as="p" className="ab-hero-sub" immediate delay={380}>
              LunX is our chapter’s entry for the 2026–27 TSA Webmaster theme: an
              AI learning portal for high school students in grades 9–12. This page
              covers the thinking behind it, what the {TOTAL_LESSONS}-lesson course
              contains, how a lesson works and the TSA prompt it was built to answer —
              then how we built it, when, with what, and from which sources.
            </Reveal>

            <Reveal className="ab-hero-actions" variant="fade" immediate delay={520}>
              <a href="#compliance" className="btn btn-primary" onClick={(e) => scrollToId(e, 'compliance')} data-magnetic="6">
                Read the compliance statement
                <ArrowDown />
              </a>
              <a href="#worklog" className="btn btn-outline" onClick={(e) => scrollToId(e, 'worklog')} data-magnetic="6">
                Work log and sources
              </a>
            </Reveal>
          </div>

          {/* A catalogue card: the facts a judge or a teacher would look for
              first, set the way a field guide's colophon would set them. */}
          <Reveal as="aside" className="ab-card" variant="right" immediate delay={300} aria-label="LunX at a glance">
            <p className="ab-card-title">
              <span>LunX</span>
              <span className="ab-card-no">No. 2026–27</span>
            </p>
            <dl className="ab-card-list">
              <div><dt>Event</dt><dd>TSA Webmaster</dd></div>
              <div><dt>Theme</dt><dd>Artificial Intelligence (AI) learning portal</dd></div>
              <div><dt>Audience</dt><dd>High school, grades 9–12</dd></div>
              <div><dt>Course</dt><dd className="tnum">{TOTAL_SECTIONS} modules · {TOTAL_LESSONS} lessons · {TOTAL_MINUTES} min</dd></div>
              <div><dt>Pages</dt><dd>Home, Course, Sign in, About, Contact, Privacy, Terms</dd></div>
              <div><dt>Built with</dt><dd>React 18, Vite 5, hand-written CSS</dd></div>
              <div><dt>Accounts</dt><dd>{CONNECTED ? 'Required — kept on the LunX server, passwords hashed' : 'Required, and local — kept in this browser, no server'}</dd></div>
            </dl>
          </Reveal>
        </section>

        {/* ── TSA compliance ───────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="compliance" aria-labelledby="compliance-heading">
          <div className="ab-wrap ab-split">
            <div>
              <Eyebrow index={1}>TSA compliance</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="compliance-heading" stagger={48}>
                TSA Compliance Statement
              </SplitText>
              <Reveal stagger delay={220}>
                <p className="sc-body">
                  LunX is built with <Mark tone="moss">React 18 and Vite 5</Mark> and
                  styled with plain CSS written against a token system of our own.
                  Every page layout, style, illustration and interface component on the
                  site was made for LunX. <Mark tone="moss">No pre-built template, theme,
                  UI kit or CSS framework was used.</Mark>
                </p>
                <p className="sc-body">
                  The TSA Webmaster event description and the 2026–27 theme are
                  quoted here word for word.
                </p>
              </Reveal>
            </div>

            {/* The event description and theme, verbatim (data/tsaEvent.js). */}
            <Reveal as="figure" className="ab-doc" variant="up" delay={DUR.hover}>
              <figcaption className="ab-doc-label">
                TSA Webmaster event description
              </figcaption>
              <blockquote className="ab-doc-body" cite={TSA_EVENT.description.linkHref}>
                <h3 className="ab-doc-h">{TSA_EVENT.description.heading}</h3>
                <p>
                  {TSA_EVENT.description.before}
                  <a href={TSA_EVENT.description.linkHref} target="_blank" rel="noreferrer">{TSA_EVENT.description.linkText}</a>
                  {TSA_EVENT.description.after}
                </p>
                <p className="ab-doc-strong">{TSA_EVENT.theme}</p>
                <p>{TSA_EVENT.challenge}</p>
                <p>{TSA_EVENT.mustIncludeLead}</p>
                <ul>
                  {TSA_EVENT.mustInclude.map((item) => (
                    <li key={item.term}><strong>{item.term}</strong> {item.text}</li>
                  ))}
                </ul>
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* ── Our story ────────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="story" aria-labelledby="story-heading">
          <div className="ab-wrap ab-split ab-split--wide-right">
            <div>
              <Eyebrow index={2}>Our story</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="story-heading" stagger={48}>
                Why LunX is a book, not a dashboard
              </SplitText>
              <Reveal stagger delay={220}>
                <p className="sc-body">
                  The 2026–27 challenge asked for a portal that <Mark tone="clay">demystifies
                  AI</Mark>. Most sites about AI do the opposite: dark screens, glowing
                  gradients and circuit-board wallpaper that make the technology look
                  like magic.
                </p>
                <p className="sc-body">
                  So LunX is set like a field guide instead — warm paper, printed type,
                  and a clothbound book on the front page that opens at any chapter.
                  The course inside runs in three parts — understand AI, use it well,
                  use it responsibly. Students train and break real models in the
                  browser, open a neural network, find out why chatbots flatter and
                  invent, learn to delegate, specify and check, and finish by building
                  a tool and investigating a product they have never seen:
                  {TOTAL_LESSONS} lessons of {SHORTEST} to {LONGEST} minutes, and it
                  remembers where you stopped, down to the part.
                </p>
              </Reveal>
            </div>

            <Reveal as="ol" className="ab-principles" variant="right" stagger delay={DUR.hover}>
              <li className="ab-principle">
                <span className="ab-principle-num">01</span>
                <div>
                  <h3 className="ab-principle-title">Explain, don’t dazzle</h3>
                  <p className="ab-principle-text">
                    No screen imitates a sci-fi terminal, and no diagram is decoration.
                    If a lesson can say something plainly, it says it plainly.
                  </p>
                </div>
              </li>
              <li className="ab-principle">
                <span className="ab-principle-num">02</span>
                <div>
                  <h3 className="ab-principle-title">Practice, not playback</h3>
                  <p className="ab-principle-text">
                    Lessons are short and hands-on: a few clear explanations, often a
                    real model to train or test in your browser, and a practice
                    question. Practice costs nothing — only the Check at the end
                    spends hearts.
                  </p>
                </div>
              </li>
              <li className="ab-principle">
                <span className="ab-principle-num">03</span>
                <div>
                  <h3 className="ab-principle-title">Your progress stays yours</h3>
                  <p className="ab-principle-text">
                    {CONNECTED ? (
                      <>Your account and progress are kept on the LunX server so they follow
                      you between devices, and nobody else sees them. Friends and leagues
                      show your username and the figures you allow — never your email.</>
                    ) : (
                      <>There is no server and no analytics. XP, streaks and gems are saved
                      in your own browser and are never sent anywhere. A profile, if you
                      make one, is made there too.</>
                    )}
                  </p>
                </div>
              </li>
            </Reveal>
          </div>
        </section>

        {/* ── The course, counted ──────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="impact" aria-labelledby="impact-heading" ref={impactRef}>
          <div className="ab-wrap">
            <Eyebrow index={3}>The course, counted</Eyebrow>
            <div className="ab-impact-head">
              <SplitText as="h2" className="sc-heading" id="impact-heading" stagger={48}>
                {`${TOTAL_MINUTES} minutes of AI, in three strands`}
              </SplitText>
              <Reveal as="p" className="sc-body" delay={220}>
                The brief names three kinds of learning. This is how the course’s
                time divides between them, module by module.
              </Reveal>
            </div>

            <Reveal as="dl" className="ab-figures" stagger delay={DUR.hover}>
              <div className="ab-figure">
                <dt className="ab-figure-label">minutes of lessons and projects</dt>
                <dd className="ab-figure-value"><CountUp value={TOTAL_MINUTES} duration={DUR.celebrate} /></dd>
              </div>
              <div className="ab-figure">
                <dt className="ab-figure-label">badges to earn</dt>
                <dd className="ab-figure-value"><CountUp value={ACHIEVEMENTS.length} delay={120} duration={DUR.celebrate} /></dd>
              </div>
              <div className="ab-figure">
                <dt className="ab-figure-label">daily and weekly quest types</dt>
                <dd className="ab-figure-value"><CountUp value={QUEST_TYPES} delay={240} duration={DUR.celebrate} /></dd>
              </div>
            </Reveal>

            {/* The strand bar: each module's width is its minutes, in its
                chapter's ink; the strands are labelled underneath. */}
            <Reveal className="ab-strands" variant="fade" delay={DUR.move}>
              <div
                className="ab-strand-bar"
                role="img"
                aria-label={STRANDS.map((s) => `${s.label}: ${s.minutes} minutes`).join('; ')}
                style={{ gridTemplateColumns: SECTIONS.map((s) => `${minutesOf(s)}fr`).join(' ') }}
              >
                {SECTIONS.map((s, i) => (
                  <span
                    key={s.id}
                    className="ab-strand-seg"
                    style={{ '--chapter': `var(${CHAPTER_INK[i]})`, '--i': i }}
                    data-tip={`${pad(i + 1)} ${s.title} · ${lessonsIn(s)} lessons · ${minutesOf(s)} min`}
                  />
                ))}
              </div>
              <ol
                className="ab-strand-key"
                style={{ gridTemplateColumns: STRANDS.map((s) => `${s.minutes}fr`).join(' ') }}
              >
                {STRANDS.map((s) => (
                  <li key={s.id} className="ab-strand">
                    <span className="ab-strand-label">{s.label}</span>
                    <span className="ab-strand-modules">
                      {s.sections.map((sec) => (
                        <span key={sec.id} style={{ '--chapter': `var(${CHAPTER_INK[SECTIONS.indexOf(sec)]})` }}>
                          {sec.title}
                        </span>
                      ))}
                    </span>
                    <span className="ab-strand-count tnum">{s.lessons} lessons · {s.minutes} min</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal as="p" className="ab-note" variant="fade" delay={DUR.open}>
              {CONNECTED ? (
                <>We don’t publish learner numbers. The only figures on this page are the
                course’s own — each one read from the course data, not typed in.</>
              ) : (
                <>We don’t count learners. LunX has no server and no analytics, so the
                only figures we can show are the course’s own — each one read from the
                course data, not typed in.</>
              )}
            </Reveal>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="method" aria-labelledby="method-heading" ref={methodRef}>
          <div className="ab-wrap ab-split">
            <div>
              <Eyebrow index={4}>How it works</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="method-heading" stagger={48}>
                One lesson, start to finish
              </SplitText>
              <Reveal as="p" className="sc-body" delay={220}>
                Every lesson runs the same loop. The numbers beside each step are the
                ones the course actually uses.
              </Reveal>
            </div>

            <Reveal as="ol" className="ab-steps" stagger delay={DUR.hover}>
              <li className="ab-step">
                <span className="ab-step-num">1</span>
                <div className="ab-step-body">
                  <h3 className="ab-step-title">Open the next lesson</h3>
                  <p className="ab-step-text">
                    Lessons unlock in order, so the next one is always marked in the
                    course, and a lesson left half-way resumes at the part you reached.
                    Its Check needs at least {HEARTS.COST_TO_START_LESSON} heart; Practice is
                    free and brings back what you missed.
                  </p>
                </div>
                <span className="ab-step-yield tnum">{SHORTEST}–{LONGEST} min</span>
              </li>
              <li className="ab-step">
                <span className="ab-step-num">2</span>
                <div className="ab-step-body">
                  <h3 className="ab-step-title">Learn, then check</h3>
                  <p className="ab-step-text">
                    Two parts: Learn — short explanations, an activity and a practice
                    question — then a graded Check. Practice never costs a heart; a wrong
                    Check answer does, and hearts refill one every {HEARTS.RECOVERY_MINUTES} minutes.
                  </p>
                </div>
                <span className="ab-step-yield tnum">+{XP.CORRECT_ANSWER} XP a Check answer</span>
              </li>
              <li className="ab-step">
                <span className="ab-step-num">3</span>
                <div className="ab-step-body">
                  <h3 className="ab-step-title">Finish, and watch the map fill</h3>
                  <p className="ab-step-text">
                    Finishing moves the module’s progress bar and counts toward your
                    streak, quests and badges. A flawless lesson pays +{XP.PERFECT_BONUS} XP
                    and {CURRENCY.PERFECT_LESSON_GEMS} gems more; a finished module pays
                    +{XP.SECTION_COMPLETE} XP and {CURRENCY.SECTION_COMPLETE_GEMS} gems, earns its
                    Field Kit tool, and unlocks the next.
                  </p>
                </div>
                <span className="ab-step-yield tnum">+{XP.LESSON} XP</span>
              </li>
            </Reveal>
          </div>
        </section>

        {/* ── Work log ─────────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="worklog" aria-labelledby="worklog-heading">
          <div className="ab-wrap ab-split">
            <div>
              <Eyebrow index={5}>Work log</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="worklog-heading" stagger={48}>
                How LunX was built, and when
              </SplitText>
              <Reveal stagger delay={220}>
                <p className="sc-body">
                  Two of us built LunX between <Mark tone="moss">August 31 and early November 2026</Mark>.
                  Every change is a commit in the project’s history, and these are its
                  milestones — including the ideas we tried and dropped.
                </p>
                <p className="ab-note">
                  The full history is public in the{' '}
                  <OutLink href={SITE.contact.github}>source repository on GitHub</OutLink>.
                </p>
              </Reveal>
            </div>

            <Reveal as="ol" className="ab-log" stagger delay={DUR.hover}>
              {WORK_LOG.map((entry) => (
                <li className="ab-log-entry" key={entry.date + entry.title}>
                  <time className="ab-log-date tnum" dateTime={entry.date}>{dateRange(entry)}</time>
                  <div>
                    <h3 className="ab-log-title">{entry.title}</h3>
                    <p className="ab-log-text">{entry.text}</p>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Copyright checklist ──────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="copyright" aria-labelledby="copyright-heading">
          <div className="ab-wrap ab-split ab-split--flip">
            <div>
              <Eyebrow index={6}>Copyright checklist</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="copyright-heading" stagger={48}>
                What is ours, and what is not
              </SplitText>
              <Reveal stagger delay={220}>
                <p className="sc-body">
                  Everything a reader sees on LunX was made for LunX, except the
                  typefaces and the React library. Each line here is checked
                  against the site as it is.
                </p>
              </Reveal>
            </div>

            <Reveal as="dl" className="ab-credits" stagger variant="left" delay={DUR.hover}>
              {CHECKLIST.map((row) => (
                <div className="ab-credit ab-check" key={row.item}>
                  <dt className="ab-credit-name"><Check />{row.item}</dt>
                  <dd className="ab-credit-role">{row.status}</dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Code stack ───────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="credits" aria-labelledby="credits-heading">
          <div className="ab-wrap ab-split">
            <div>
              <Eyebrow index={7}>Code stack</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="credits-heading" stagger={48}>
                Built with, and credited
              </SplitText>
              <Reveal stagger delay={220}>
                <p className="sc-body">
                  LunX is a React 18 application built with Vite 5. There is no CSS
                  framework: every style is plain CSS written against our own token
                  layer of colors, type sizes, spacing, radii and motion timings,
                  documented in the project’s design system. Every illustration and
                  icon is inline SVG we drew, and the simulations — a classifier and
                  a small neural network among them — are trained in the reader’s
                  browser by code we wrote, on data the page generates.
                </p>
                <p className="sc-body">
                  {CONNECTED ? (
                    <>Accounts, leagues, friends and challenges run on the LunX server:
                    a Node.js program with no packages, using Node’s own SQLite database
                    and scrypt password hashing. It grades answers and counts league XP
                    itself, so the browser never reports its own score.</>
                  ) : (
                    <>This build has no server. Accounts are kept in the reader’s own
                    browser, with passwords hashed using PBKDF2, and nothing is sent
                    anywhere.</>
                  )}
                </p>
                <p className="ab-note">
                  Product names mentioned in the course, mostly in the {strand('II').sections[0].title} module’s tool guide —{' '}
                  {inProse(TRADEMARKS)} — are trademarks of their owners. LunX is a
                  student project and is not affiliated with or endorsed by any of them.
                </p>
              </Reveal>
            </div>

            <Reveal as="dl" className="ab-credits" stagger variant="right" delay={DUR.hover}>
              {BUILT_WITH.map((t) => (
                <div className="ab-credit" key={t.name}>
                  <dt className="ab-credit-name">{t.name}</dt>
                  <dd className="ab-credit-role">{t.role}</dd>
                  <dd className="ab-credit-licence">{t.licence}</dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Sources ──────────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="sources" aria-labelledby="sources-heading">
          <div className="ab-wrap">
            <Eyebrow index={8}>Sources</Eyebrow>
            <div className="ab-impact-head">
              <SplitText as="h2" className="sc-heading" id="sources-heading" stagger={48}>
                The research behind the lessons
              </SplitText>
              <Reveal as="p" className="sc-body" delay={220}>
                When a lesson states a finding or a figure, its source is printed
                under the answer. These are those sources, by the module that cites
                them, with links to the original papers and reports.
              </Reveal>
            </div>

            <Reveal className="ab-sources" stagger delay={DUR.hover}>
              {SOURCES_BY_MODULE.map(({ section, number, items }) => (
                <div className="ab-source-group" key={section.id}>
                  <h3 className="ab-source-module">
                    <span className="ab-source-num tnum" style={{ '--chapter': `var(${CHAPTER_INK[number - 1]})` }}>{pad(number)}</span>
                    {section.title}
                  </h3>
                  <ul className="ab-source-list">
                    {items.map((r) => (
                      <li className="ab-source" key={r.url}>
                        <span className="ab-source-cite">{r.cite}.</span>{' '}
                        <OutLink href={r.url}>{r.title}</OutLink>.{' '}
                        <span className="ab-source-where">{r.where}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="ab-source-group">
                <h3 className="ab-source-module">Standards and the brief</h3>
                <ul className="ab-source-list">
                  {STANDARDS.map((r) => (
                    <li className="ab-source" key={r.url}>
                      <span className="ab-source-cite">{r.cite}.</span>{' '}
                      <OutLink href={r.url}>{r.title}</OutLink>.
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Inspirations ─────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="inspirations" aria-labelledby="inspirations-heading">
          <div className="ab-wrap ab-split ab-split--flip">
            <div>
              <Eyebrow index={9}>Inspirations</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="inspirations-heading" stagger={48}>
                What we studied, and what we took
              </SplitText>
              <Reveal as="p" className="sc-body" delay={220}>
                Before changing the design we wrote down why a few products work, and
                kept only the principle from each. Nothing on LunX is copied from them.
              </Reveal>
            </div>

            <Reveal as="dl" className="ab-credits" stagger variant="left" delay={DUR.hover}>
              {INSPIRATIONS.map((i) => (
                <div className="ab-credit" key={i.name}>
                  <dt className="ab-credit-name">{i.url ? <OutLink href={i.url}>{i.name}</OutLink> : i.name}</dt>
                  <dd className="ab-credit-role">{i.took}</dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <ClosingCTA />
      </main>

      <Footer />
    </div>
  )
}
