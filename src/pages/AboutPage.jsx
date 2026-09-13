/* ═══════════════════════════════════════════════════════════════════════════
   AboutPage.jsx — WHO MADE LUNX, WHY, AND HOW IT MEETS THE BRIEF
   ---------------------------------------------------------------------------
   The third page of the site, with its own address (#/about). Its sections,
   in order:

     hero          what this page is, a catalogue card of the facts
     compliance    the TSA compliance statement, the event page word for
                   word, and a ledger answering each requirement
     story         why a field guide, and the three principles behind it
     impact        the course counted, split into the brief's three strands
     credits       everything the site uses that it did not write
     method        one lesson, start to finish, with the real numbers
     closing       the shared closing CTA

   Every figure is read from course data or config — nothing is typed in —
   so this page cannot describe a course the product does not have. LunX has
   no accounts and no analytics, so it does not claim a learner count.
   ═══════════════════════════════════════════════════════════════════════════ */

import Navbar     from '../components/Navbar'
import ClosingCTA from '../components/ClosingCTA'
import Footer     from '../components/Footer'
import { Eyebrow, Mark } from '../components/showcase/ProductSections'

import { SECTIONS, TOTAL_LESSONS, TOTAL_SECTIONS } from '../data/learnData'
import { ACHIEVEMENTS } from '../data/achievements'
import { DAILY_TEMPLATES, WEEKLY_TEMPLATES } from '../data/questTemplates'
import { SHOP_ITEMS } from '../config/shopConfig'
import { DAILY_BONUS } from '../config/dailyBonusConfig'
import { XP, CURRENCY, HEARTS } from '../config/progressionConfig'
import { TSA_EVENT } from '../data/tsaEvent'
import { CHAPTER_INK, TOTAL_MINUTES, minutesOf, pad } from '../components/guide/guideData'

import SplitText from '../motion/SplitText'
import Reveal from '../motion/Reveal'
import CountUp from '../motion/CountUp'
import { DUR } from '../motion/timing'

import '../components/showcase/showcase.css'
import './AboutPage.css'

/* ── Derived facts ───────────────────────────────────────────────────────── */

const durations = SECTIONS.flatMap((s) => s.lessons.map((l) => parseInt(l.duration, 10)))
const SHORTEST = Math.min(...durations)
const LONGEST = Math.max(...durations)
const QUEST_TYPES = DAILY_TEMPLATES.length + WEEKLY_TEMPLATES.length

/* The brief names three kinds of learning. Each module belongs to one. */
const STRANDS = [
  { id: 'concepts', label: 'Fundamental AI concepts',         modules: ['ai-foundations', 'machine-learning', 'neural-networks'] },
  { id: 'tools',    label: 'Practical AI tools & techniques', modules: ['practical-tools'] },
  { id: 'ethics',   label: 'Ethical AI usage',                modules: ['ai-ethics'] },
].map((strand) => {
  const sections = SECTIONS.filter((s) => strand.modules.includes(s.id))
  return {
    ...strand,
    sections,
    numbers: sections.map((s) => SECTIONS.indexOf(s) + 1),
    lessons: sections.reduce((n, s) => n + s.lessons.length, 0),
    minutes: sections.reduce((m, s) => m + minutesOf(s), 0),
  }
})

const strand = (id) => STRANDS.find((s) => s.id === id)
const moduleRange = (nums) => (nums.length > 1 ? `modules ${nums[0]}–${nums[nums.length - 1]}` : `module ${nums[0]}`)
const lessonList = (id) => strand(id).sections.flatMap((s) => s.lessons.map((l) => l.title))

/* A list in prose: "a, b and c". */
const inProse = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

/* ── The requirement ledger ──────────────────────────────────────────────────
   One row per thing the event page says the site must do, in the event
   page's own order. `where` is plain text on purpose: the page's ways into the
   course stay the navbar button and the closing CTA. */
const LEDGER = [
  {
    need: 'Educational content modules: at least three distinct learning sections',
    how: `${TOTAL_SECTIONS} modules holding ${TOTAL_LESSONS} lessons, grouped into the three strands the brief names.`,
    where: 'Course → Learn',
  },
  {
    need: '…covering fundamental AI concepts',
    how: `${inProse(strand('concepts').sections.map((s) => s.title))}: ${strand('concepts').lessons} lessons, ${strand('concepts').minutes} minutes.`,
    where: `Course → ${moduleRange(strand('concepts').numbers)}`,
  },
  {
    need: '…practical AI tools/techniques',
    how: `${strand('tools').sections[0].title}: ${inProse(lessonList('tools'))}.`,
    where: `Course → ${moduleRange(strand('tools').numbers)}`,
  },
  {
    need: '…and ethical AI usage',
    how: `${strand('ethics').sections[0].title}: ${inProse(lessonList('ethics'))}.`,
    where: `Course → ${moduleRange(strand('ethics').numbers)}`,
  },
  {
    need: 'Gamification: digital badges, experience points or a progress dashboard',
    how: `All three: ${ACHIEVEMENTS.length} badges, XP for every correct answer and lesson, plus gems, hearts, a daily streak, ${QUEST_TYPES} quest types, a ${DAILY_BONUS.CYCLE_LENGTH}-day bonus track and a ${SHOP_ITEMS.length}-item shop.`,
    where: 'Course → top bar, Quests, Shop, Profile',
  },
  {
    need: 'Progress tracking: visually track completion of the learning modules',
    how: 'A progress bar on every module, a path that fills up to your current lesson, a level bar, and a profile of lifetime totals and badges.',
    where: 'Course → Learn, Profile',
  },
  {
    need: 'A minimum of 3 completed pages, following the annual theme',
    how: 'Home, Course and About — each one complete, and each one about the AI learning portal.',
    where: 'The navbar on every page',
  },
  {
    need: 'Separate pages (not just a scroll down option), linked from the home page',
    how: 'Each page has its own address (#/learn, #/about) that survives a refresh and the Back button. The home page links to the course from its navbar and closing section, and to About from its navbar and footer.',
    where: 'Home → navbar, footer',
  },
]

/* ── Credits ─────────────────────────────────────────────────────────────── */

const CREDITS = [
  { name: 'React 18',       role: 'Interface components',              licence: 'MIT License' },
  { name: 'Vite 5',         role: 'Development server and build',      licence: 'MIT License' },
  { name: 'Fraunces',       role: 'Headings — the product’s voice',    licence: 'SIL Open Font License 1.1, via Google Fonts' },
  { name: 'Manrope',        role: 'Interface text',                    licence: 'SIL Open Font License 1.1, via Google Fonts' },
  { name: 'JetBrains Mono', role: 'The stylesheet’s monospace face',   licence: 'SIL Open Font License 1.1, via Google Fonts' },
  { name: 'Icons, illustrations and the field guide', role: 'Inline SVG written for LunX', licence: 'Original work' },
]

const TRADEMARKS = ['ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'DALL·E', 'Stable Diffusion', 'GitHub Copilot']

/* ── Small pieces ────────────────────────────────────────────────────────── */

const ArrowDown = () => (
  <svg className="btn-arrow ab-arrow-down" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" /><path d="m6 13 6 6 6-6" />
  </svg>
)

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
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
  { id: 'impact',     label: 'The course' },
  { id: 'method',     label: 'How it works' },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AboutPage({ onGoHome, onStartLearning }) {
  return (
    <div className="app">
      <Navbar
        onStartLearning={onStartLearning}
        links={NAV_LINKS}
        scrollLinks
        onLogoClick={onGoHome}
        pageLink={{ label: 'Home', onClick: onGoHome }}
      />

      <main className="about">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="ab-hero" aria-labelledby="about-heading">
          <div className="ab-hero-copy">
            <Reveal as="p" variant="left" immediate delay={60} className="ab-hero-eyebrow">
              About LunX · the story, the course and the compliance statement
            </Reveal>

            <SplitText as="h1" className="ab-hero-heading" id="about-heading" immediate delay={100} stagger={34}>
              What we made, and <em className="em">why it looks like paper</em>.
            </SplitText>

            <Reveal as="p" className="ab-hero-sub" immediate delay={380}>
              LunX is our chapter’s entry for the 2026–27 TSA Webmaster theme: an
              AI learning portal for high school students in grades 9–12. This page
              covers the thinking behind it, what the {TOTAL_LESSONS}-lesson course
              contains, how a lesson works, and how the site meets each requirement
              of the event.
            </Reveal>

            <Reveal className="ab-hero-actions" variant="fade" immediate delay={520}>
              <a href="#compliance" className="btn btn-primary" onClick={(e) => scrollToId(e, 'compliance')} data-magnetic="6">
                Read the compliance statement
                <ArrowDown />
              </a>
              <a href="#method" className="btn btn-outline" onClick={(e) => scrollToId(e, 'method')} data-magnetic="6">
                How a lesson works
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
              <div><dt>Pages</dt><dd>Home, Course, About</dd></div>
              <div><dt>Built with</dt><dd>React 18, Vite 5, hand-written CSS</dd></div>
              <div><dt>Accounts</dt><dd>None — progress stays in this browser</dd></div>
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
                  The event page is reproduced alongside, word for word, so the
                  requirements are read in TSA’s own language. The ledger below it
                  answers each one.
                </p>
              </Reveal>
            </div>

            {/* The event page, verbatim (data/tsaEvent.js). */}
            <Reveal as="figure" className="ab-doc" variant="up" delay={DUR.hover}>
              <figcaption className="ab-doc-label">
                From the TSA Webmaster event page
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
                <p className="ab-doc-caption">{TSA_EVENT.caption}</p>

                <h3 className="ab-doc-h">{TSA_EVENT.resources.heading}</h3>
                <p className="ab-doc-label ab-doc-label--inline">{TSA_EVENT.resources.examplesHeading}</p>
                <p>{TSA_EVENT.resources.examplesLead}</p>
                <ul className="ab-doc-links">
                  {TSA_EVENT.resources.examples.map((ex) => (
                    <li key={ex.href}><a href={ex.href} target="_blank" rel="noreferrer">{ex.label}</a></li>
                  ))}
                </ul>

                <h3 className="ab-doc-h">{TSA_EVENT.deadlines.heading}</h3>
                <p className="ab-doc-strong">{TSA_EVENT.deadlines.date}</p>
                {TSA_EVENT.deadlines.lines.map((line) => <p key={line}>{line}</p>)}
              </blockquote>
            </Reveal>
          </div>

          <div className="ab-wrap">
            <h3 className="ab-sub-heading" id="ledger-heading">How LunX answers each requirement</h3>
            <Reveal as="ol" className="ab-ledger" role="list" stagger delay={DUR.hover} aria-labelledby="ledger-heading">
              {LEDGER.map((row) => (
                <li className="ab-ledger-row" key={row.need}>
                  <span className="ab-ledger-status"><Check /> Met</span>
                  <span className="ab-ledger-need">{row.need}</span>
                  <span className="ab-ledger-how">{row.how}</span>
                  <span className="ab-ledger-where">{row.where}</span>
                </li>
              ))}
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
                  The course inside runs from what AI is, through machine learning and
                  neural networks, to the tools students already use and the ethics of
                  using them: {TOTAL_LESSONS} lessons of {SHORTEST} to {LONGEST} minutes,
                  and it remembers where you stopped.
                </p>
              </Reveal>
            </div>

            <Reveal as="ol" className="ab-principles" role="list" variant="right" stagger delay={DUR.hover}>
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
                    Lessons are questions, not videos: fill the blank, decide whether
                    it is AI, make the call. A wrong answer costs a heart, so nobody
                    clicks through on autopilot.
                  </p>
                </div>
              </li>
              <li className="ab-principle">
                <span className="ab-principle-num">03</span>
                <div>
                  <h3 className="ab-principle-title">Your progress stays yours</h3>
                  <p className="ab-principle-text">
                    There are no accounts and no analytics. XP, streaks and gems are
                    saved in your own browser and are never sent anywhere.
                  </p>
                </div>
              </li>
            </Reveal>
          </div>
        </section>

        {/* ── The course, counted ──────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="impact" aria-labelledby="impact-heading">
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
                <dt className="ab-figure-label">minutes of lessons</dt>
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
                    data-tip={`${pad(i + 1)} ${s.title} · ${s.lessons.length} lessons · ${minutesOf(s)} min`}
                  />
                ))}
              </div>
              <ol
                className="ab-strand-key"
                role="list"
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
              We don’t count learners. LunX has no accounts and no analytics, so the
              only figures we can show are the course’s own — each one read from the
              course data, not typed in.
            </Reveal>
          </div>
        </section>

        {/* ── Credits ──────────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="credits" aria-labelledby="credits-heading">
          <div className="ab-wrap ab-split ab-split--flip">
            <div>
              <Eyebrow index={4}>Credits</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="credits-heading" stagger={48}>
                Built with, and credited
              </SplitText>
              <Reveal stagger delay={220}>
                <p className="sc-body">
                  LunX loads no template, theme, UI kit, icon library or stock image.
                  What it does use is listed here with its licence.
                </p>
                <p className="ab-note">
                  Product names taught in the {strand('tools').sections[0].title} module —{' '}
                  {inProse(TRADEMARKS)} — are trademarks of their owners. LunX is a
                  student project and is not affiliated with or endorsed by any of them.
                </p>
              </Reveal>
            </div>

            <Reveal as="dl" className="ab-credits" stagger variant="left" delay={DUR.hover}>
              {CREDITS.map((c) => (
                <div className="ab-credit" key={c.name}>
                  <dt className="ab-credit-name">{c.name}</dt>
                  <dd className="ab-credit-role">{c.role}</dd>
                  <dd className="ab-credit-licence">{c.licence}</dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="sc-section ab-section" id="method" aria-labelledby="method-heading">
          <div className="ab-wrap ab-split">
            <div>
              <Eyebrow index={5}>How it works</Eyebrow>
              <SplitText as="h2" className="sc-heading" id="method-heading" stagger={48}>
                One lesson, start to finish
              </SplitText>
              <Reveal as="p" className="sc-body" delay={220}>
                Every lesson runs the same loop. The numbers beside each step are the
                ones the course actually uses.
              </Reveal>
            </div>

            <Reveal as="ol" className="ab-steps" role="list" stagger delay={DUR.hover}>
              <li className="ab-step">
                <span className="ab-step-num">1</span>
                <div className="ab-step-body">
                  <h3 className="ab-step-title">Open the next lesson</h3>
                  <p className="ab-step-text">
                    Lessons unlock in order, so the next one is always marked in the
                    course. Starting one needs at least {HEARTS.COST_TO_START_LESSON} heart;
                    Practice is free and never costs one.
                  </p>
                </div>
                <span className="ab-step-yield tnum">{SHORTEST}–{LONGEST} min</span>
              </li>
              <li className="ab-step">
                <span className="ab-step-num">2</span>
                <div className="ab-step-body">
                  <h3 className="ab-step-title">Answer as you go</h3>
                  <p className="ab-step-text">
                    Each step teaches one idea, then asks you to use it. A correct
                    answer earns XP; a wrong one costs a heart, and hearts refill one
                    every {HEARTS.RECOVERY_MINUTES} minutes.
                  </p>
                </div>
                <span className="ab-step-yield tnum">+{XP.CORRECT_ANSWER} XP an answer</span>
              </li>
              <li className="ab-step">
                <span className="ab-step-num">3</span>
                <div className="ab-step-body">
                  <h3 className="ab-step-title">Finish, and watch the map fill</h3>
                  <p className="ab-step-text">
                    Finishing moves the module’s progress bar and counts toward your
                    streak, quests and badges. A flawless lesson pays +{XP.PERFECT_BONUS} XP
                    and {CURRENCY.PERFECT_LESSON_GEMS} gems more; a finished module pays
                    +{XP.SECTION_COMPLETE} XP and {CURRENCY.SECTION_COMPLETE_GEMS} gems and
                    unlocks the next.
                  </p>
                </div>
                <span className="ab-step-yield tnum">+{XP.LESSON} XP</span>
              </li>
            </Reveal>
          </div>
        </section>

        <ClosingCTA onStartLearning={onStartLearning} />
      </main>

      <Footer links={[{ label: 'Home', onClick: onGoHome }]} />
    </div>
  )
}
