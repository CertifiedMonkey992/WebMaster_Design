/* ═══════════════════════════════════════════════════════════════════════════
   JudgeConsole.jsx — THE REVIEWER'S DESK
   ---------------------------------------------------------------------------
   Everything the margin chips cannot reach, in one place: the powers, the
   resources, the whole course at once, the calendar, the badges, and the
   engine's own test suite.

   It is a DESK, not a debug overlay. It reads as part of the product — paper
   ground, warm ink, the product's hairlines and its one press — because a
   judge is looking at a piece of design work and a grey developer panel
   bolted to the corner would be the first thing they saw.

   Three things it is careful about:

     · every control says what it does in plain words, and nothing is an
       abbreviation a reviewer has to decode
     · nothing here draws a result; every button calls the same engine the
       course calls, so what a judge sees is what a learner would have seen
     · it exists only on the reviewer's profile. There is no flag, no query
       string and no key combination that summons it anywhere else.

   Ctrl/Cmd + Shift + J opens and closes it, for a judge who would rather not
   reach for the corner.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { useAuth } from '../../state/AuthContext'
import { Icon } from '../progression/Icons'
import { JUDGE_POWERS, JUDGE_HEARTS } from '../../config/judgeConfig'
import { formatNumber } from '../../utils/progressionUtils'
import useJudge from './useJudge'
import './judge.css'

export default function JudgeConsole() {
  const { vm, actions } = useProgression()
  const { account, signOut } = useAuth()
  const judge = useJudge()
  const [open, setOpen] = useState(false)
  const [tests, setTests] = useState(null)
  const panelRef = useRef(null)

  /* Ctrl/Cmd + Shift + J. Registered only while the console exists, so it is
     not a key combination lying in wait on everybody else's keyboard. */
  useEffect(() => {
    if (!judge.active) return undefined
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [judge.active])

  if (!judge.active) return null

  const { run, ops } = judge
  const course = vm.course
  const nextLesson = course.current?.lesson?.id
  const currentSection = course.current?.section?.id

  /* The engine's own suite, run against the live services. Imported when
     asked for, so it is never in the bundle a learner downloads. */
  const runTests = async () => {
    setTests({ summary: 'running…' })
    try {
      const mod = await import('../../dev/progressionTests.js')
      setTests(await mod.runProgressionTests())
    } catch (error) {
      setTests({ summary: `could not run: ${error.message}`, failures: [] })
    }
  }

  const facts = [
    ['Level', `${vm.level} · ${vm.levelTitle}`],
    ['XP', formatNumber(vm.xp)],
    ['Gems', judge.powers?.infiniteGems ? '∞' : formatNumber(vm.gems)],
    ['Hearts', `${vm.hearts} / ${vm.maxHearts}`],
    ['Streak', `${vm.streak} ${vm.streak === 1 ? 'day' : 'days'} · best ${vm.longestStreak}`],
    ['Lessons', `${course.completedCount} / ${course.totalLessons}`],
    ['Modules', `${course.completedSections} / ${course.totalSections}`],
    ['Badges', `${vm.achievementsUnlocked} / ${vm.achievements.length}`],
    ['Quests ready', String(vm.quests.claimableCount)],
    ['Bonus day', `${vm.dailyBonus.currentDay} of ${vm.dailyBonus.cycleLength}`],
  ]

  return (
    <div className={`jd${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="jd-tab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="judge-console"
        data-tip="Reviewer console (Ctrl+Shift+J)"
      >
        <Icon name="flag" size={14} strokeWidth={2.4} />
        {open ? 'Close' : 'Reviewer'}
      </button>

      {open && (
        <div className="jd-panel" id="judge-console" ref={panelRef} role="dialog" aria-label="Reviewer console">
          <header className="jd-head">
            <h2 className="jd-title">Reviewer console</h2>
            <p className="jd-lead">
              Every control here runs the course’s own engine. A lesson skipped
              from this desk pays the same XP, unlocks the same module and
              plays the same animation as one answered question by question.
            </p>
          </header>

          <dl className="jd-facts">
            {facts.map(([label, value]) => (
              <div className="jd-fact" key={label}>
                <dt>{label}</dt>
                <dd className="tnum">{value}</dd>
              </div>
            ))}
          </dl>

          {/* ── Powers ───────────────────────────────────────────────────── */}
          <Group title="Powers" note="Switch one off to see the course exactly as a student does.">
            <ul className="jd-powers">
              {JUDGE_POWERS.map((power) => {
                const on = Boolean(judge.powers?.[power.id])
                return (
                  <li key={power.id}>
                    <button
                      type="button"
                      className={`jd-power${on ? ' is-on' : ''}`}
                      role="switch"
                      aria-checked={on}
                      onClick={() => run(ops.POWERS, { powers: { [power.id]: !on } })}
                    >
                      <span className="jd-power-box" aria-hidden="true">
                        <Icon name="check" size={11} strokeWidth={3} />
                      </span>
                      <span className="jd-power-text">
                        <b>{power.label}</b>
                        <span>{on ? power.on : power.off}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Group>

          {/* ── Resources ────────────────────────────────────────────────── */}
          <Group title="Gems, hearts and XP">
            <Row>
              <Btn onClick={() => run(ops.GEMS, { amount: 500 })}>+500 gems</Btn>
              <Btn onClick={() => run(ops.GEMS, { amount: -500 })}>−500 gems</Btn>
              <Btn onClick={() => run(ops.TOP_UP)}>Restock everything</Btn>
            </Row>
            <Row>
              <Btn onClick={() => run(ops.HEARTS, { amount: -1 })} disabled={vm.hearts === 0}>Lose a heart</Btn>
              <Btn onClick={() => run(ops.HEARTS, { amount: -5 })} disabled={vm.hearts === 0}>Lose five</Btn>
              <Btn onClick={() => run(ops.HEARTS, { amount: 1 })}>Restore one</Btn>
              <Btn onClick={() => actions.restoreAllHearts('judge')}>Fill to {JUDGE_HEARTS}</Btn>
            </Row>
            <Row>
              <Btn onClick={() => run(ops.XP, { amount: 100 })}>+100 XP</Btn>
              <Btn onClick={() => run(ops.XP, { amount: -100 })}>−100 XP</Btn>
              <Btn onClick={() => run(ops.LEVEL, { level: vm.level + 1 })}>Level up</Btn>
              <Btn onClick={() => run(ops.LEVEL, { level: Math.max(1, vm.level - 1) })} disabled={vm.level <= 1}>
                Level down
              </Btn>
              <Btn onClick={() => run(ops.LEVEL, { level: 10 })}>Jump to level 10</Btn>
            </Row>
          </Group>

          {/* ── Streak ───────────────────────────────────────────────────── */}
          <Group title="Streak" note="Setting a streak writes the days behind it, so the calendar and the milestones agree with the number.">
            <Row>
              {[1, 7, 30, 100].map((days) => (
                <Btn key={days} onClick={() => run(ops.STREAK, { days })}>{days}-day streak</Btn>
              ))}
              <Btn onClick={() => run(ops.STREAK, { days: 0 })} quiet>Break it</Btn>
            </Row>
            <Row>
              <Btn onClick={() => run(ops.SHIELDS, { count: 2 })}>Bank 2 shields</Btn>
              <Btn onClick={() => run(ops.SHIELDS, { count: 0 })} quiet>Spend them</Btn>
              <Btn onClick={() => actions.dev.shiftDays(1)}>Move to tomorrow</Btn>
              <Btn onClick={() => actions.dev.shiftDays(2)} quiet>Skip two days</Btn>
            </Row>
          </Group>

          {/* ── The course ───────────────────────────────────────────────── */}
          <Group title="The course">
            <Row>
              <Btn onClick={() => run(ops.COMPLETE_LESSON, { lessonId: nextLesson })} disabled={!nextLesson}>
                Finish the next lesson
              </Btn>
              <Btn onClick={() => run(ops.COMPLETE_SECTION, { sectionId: currentSection })} disabled={!currentSection}>
                Finish this module
              </Btn>
              <Btn onClick={() => run(ops.COMPLETE_COURSE)} disabled={course.completedCount === course.totalLessons}>
                Finish all {course.totalLessons}
              </Btn>
              <Btn onClick={() => run(ops.RESET_COURSE)} quiet disabled={course.completedCount === 0}>
                Empty the course
              </Btn>
            </Row>
            <Row>
              <Btn onClick={() => actions.completePractice({ seconds: 300, correct: 5, total: 5 })}>
                Practice session
              </Btn>
              <Btn onClick={() => actions.addPracticeTime(600)}>+10 minutes practiced</Btn>
            </Row>
          </Group>

          {/* ── Quests, the mission and badges ───────────────────────────── */}
          <Group title="Quests, mission and badges">
            <Row>
              <Btn onClick={() => run(ops.COMPLETE_QUESTS, { scope: 'daily' })}>Fill today’s quests</Btn>
              <Btn onClick={() => run(ops.COMPLETE_QUESTS, { scope: 'weekly' })}>Fill this week’s</Btn>
              <Btn onClick={() => actions.claimAllQuests()} disabled={!vm.quests.claimableCount}>
                Claim everything ready
              </Btn>
              <Btn onClick={() => actions.dev.resetDailyQuests()} quiet>Roll new daily quests</Btn>
            </Row>
            <Row>
              <Btn onClick={() => run(ops.COMPLETE_MISSION)} disabled={!vm.team}>Finish the team mission</Btn>
              <Btn onClick={() => actions.rerollTeamMission()} quiet>Draw a new mission</Btn>
            </Row>
            <Row>
              <Btn onClick={() => run(ops.UNLOCK_BADGES)}>Unlock every badge</Btn>
              <Btn onClick={() => run(ops.RESET_BADGES)} quiet>Lock them again</Btn>
            </Row>
          </Group>

          {/* ── Daily bonus ──────────────────────────────────────────────── */}
          <Group title="Daily bonus">
            <Row>
              <Btn onClick={() => actions.claimDailyBonus()} disabled={!vm.dailyBonus.available}>
                Claim today
              </Btn>
              <Btn onClick={() => actions.dev.setBonusDay(vm.dailyBonus.nextDay)}>Come back tomorrow</Btn>
              <Btn onClick={() => actions.dev.completeBonusCycle()}>Run the whole week</Btn>
              <Btn onClick={() => actions.dev.resetDailyBonus()} quiet>Back to day one</Btn>
            </Row>
            <Row>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <Btn key={day} onClick={() => actions.dev.setBonusDay(day)}>Day {day}</Btn>
              ))}
            </Row>
          </Group>

          {/* ── The engine's own checks ──────────────────────────────────── */}
          <Group title="Check the engine" note="The progression engine’s own suite, over the real reducer: rewards, calendar rollovers, streak gaps, heart recovery, double-claims and these controls. It runs here, now, in this browser.">
            <Row>
              <Btn onClick={runTests}>Run the engine’s tests</Btn>
            </Row>
            {tests && (
              <p className={`jd-tests${tests.failures?.length ? ' is-fail' : ''}`}>
                {tests.summary}
                {tests.failures?.slice(0, 4).map((f) => (
                  <span key={f.name} className="jd-test-fail">{f.name} — {String(f.detail)}</span>
                ))}
              </p>
            )}
          </Group>

          {/* ── Start over ───────────────────────────────────────────────── */}
          <Group title="Start over">
            <Row>
              <Btn
                quiet
                onClick={() => {
                  if (window.confirm('Empty the reviewer profile and start from a new learner?')) {
                    actions.dev.reset()
                    run(ops.ENABLE, { stock: true })
                  }
                }}
              >
                Empty this profile
              </Btn>
              <Btn quiet onClick={signOut}>Sign out of {account?.name ?? 'this profile'}</Btn>
            </Row>
            <p className="jd-foot">
              Emptying the reviewer profile touches nothing else: any other
              profile on this browser, including the guest one, keeps its
              progress.
            </p>
          </Group>
        </div>
      )}
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Group({ title, note, children }) {
  return (
    <section className="jd-group">
      <h3 className="jd-group-title">{title}</h3>
      {note && <p className="jd-group-note">{note}</p>}
      {children}
    </section>
  )
}

function Row({ children }) {
  return <div className="jd-row">{children}</div>
}

function Btn({ children, quiet = false, ...rest }) {
  return (
    <button type="button" className={`jd-btn${quiet ? ' jd-btn--quiet' : ''}`} {...rest}>
      {children}
    </button>
  )
}
