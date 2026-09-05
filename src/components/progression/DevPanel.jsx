/* ═══════════════════════════════════════════════════════════════════════════
   DevPanel.jsx — DEVELOPER-ONLY PROGRESSION CONSOLE
   ---------------------------------------------------------------------------
   NOT visible to normal users. It renders only when `isDevMode()` is true:
   a Vite dev build, or any build opened with ?dev=1.

   To remove it from production entirely, delete the <DevPanel /> line in
   LearnPage.jsx — nothing else depends on this file.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'
import { useProgression, isDevMode } from '../../state/ProgressionContext'
import { Icon } from './Icons'
import { deriveCourse } from '../../data/learnData'
import { getLocalDateKey } from '../../utils/dateUtils'

export default function DevPanel() {
  const { state, vm, actions } = useProgression()
  const [open, setOpen] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const enabled = isDevMode()

  /* Runs the pure-function suite in src/dev/progressionTests.js against the
     real services. Imported lazily so it is never in the production bundle. */
  const runSelfTests = async () => {
    setTestResult({ summary: 'running…' })
    try {
      const mod = await import('../../dev/progressionTests.js')
      const result = await mod.runProgressionTests()
      // eslint-disable-next-line no-console
      console.table(result.results)
      setTestResult(result)
    } catch (error) {
      setTestResult({ summary: `error: ${error.message}`, failures: [] })
    }
  }

  /* Ctrl/Cmd + Shift + D toggles the console. */
  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])

  if (!enabled) return null

  const course = deriveCourse(state.lessons)
  const nextLesson = course.current?.lesson?.id

  const completeNextLesson = () => {
    if (!nextLesson) return
    actions.completeLesson({ lessonId: nextLesson, perfect: true, seconds: 120, accuracy: 1 })
  }

  const completeAllQuests = () => {
    /* Push each active quest to its target through real actions where
       possible, then force the remainder for quest types that cannot be
       simulated (this is a debug tool, not a gameplay path). */
    const quests = [...state.quests.daily, ...state.quests.weekly]
      .map((q) => (q.completed ? q : { ...q, progress: q.target, completed: true, completedAt: Date.now() }))
    actions.dev.set({
      quests: {
        ...state.quests,
        daily: quests.filter((q) => q.scope === 'daily'),
        weekly: quests.filter((q) => q.scope === 'weekly'),
      },
    })
  }

  const rows = [
    ['XP', vm.xp],
    ['Level', `${vm.level} (${vm.levelTitle})`],
    ['Gems', vm.gems],
    ['Hearts', `${vm.hearts}/${vm.maxHearts}`],
    ['Streak', `${vm.streak} (best ${vm.longestStreak})`],
    ['Daily XP', `${state.daily.xp}/${state.goals.dailyXP}`],
    ['Weekly XP', state.weekly.xp],
    ['Lessons', `${course.completedCount}/${course.totalLessons}`],
    ['Practice', `${Math.floor(state.stats.totalPracticeSeconds / 60)} min`],
    ['Day key', state.daily.dateKey],
    ['Today', getLocalDateKey()],
    ['Last streak day', state.streak.lastStreakDate ?? '—'],
    ['Shields', `${vm.shields}/${vm.maxShields}`],
    ['Bonus day', `${vm.dailyBonus.currentDay}/${vm.dailyBonus.cycleLength}`],
    ['Bonus ready', vm.dailyBonus.available ? 'yes' : 'claimed today'],
    ['Last bonus claim', state.dailyBonus.lastClaimDate ?? '—'],
  ]

  return (
    <div className={`dev-panel${open ? ' is-open' : ''}`}>
      <button className="dev-toggle" onClick={() => setOpen((v) => !v)} title="Developer panel (Ctrl+Shift+D)">
        <Icon name="gauge" size={15} />
        {open ? 'Close dev' : 'Dev'}
      </button>

      {open && (
        <div className="dev-body">
          <div className="dev-note">Developer build only · ?dev=1</div>

          <div className="dev-stats">
            {rows.map(([label, value]) => (
              <div className="dev-stat" key={label}>
                <span>{label}</span><b>{String(value)}</b>
              </div>
            ))}
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Resources</div>
            <div className="dev-buttons">
              <button onClick={() => actions.awardXP(100, 'dev')}>+100 XP</button>
              <button onClick={() => actions.awardXP(25, 'dev')}>+25 XP</button>
              <button onClick={() => actions.awardGems(100, 'dev')}>+100 gems</button>
              <button onClick={() => actions.spendGems(50, 'dev')}>−50 gems</button>
              <button onClick={() => actions.loseHeart('dev')}>Lose heart</button>
              <button onClick={() => actions.restoreHeart(1, 'dev')}>Restore heart</button>
              <button onClick={() => actions.restoreAllHearts('dev')}>Refill hearts</button>
            </div>
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Learning</div>
            <div className="dev-buttons">
              <button onClick={completeNextLesson} disabled={!nextLesson}>
                Complete next lesson
              </button>
              <button onClick={() => actions.completePractice({ seconds: 300, correct: 5, total: 5 })}>
                Practice session
              </button>
              <button onClick={() => actions.addPracticeTime(600)}>+10 min practice</button>
            </div>
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Time travel</div>
            <div className="dev-buttons">
              <button onClick={() => actions.dev.shiftDays(1)}>Advance 1 day</button>
              <button onClick={() => actions.dev.shiftDays(2)}>Advance 2 days (break streak)</button>
              <button onClick={() => actions.dev.resetDailyQuests()}>Reset daily quests</button>
              <button onClick={() => actions.dev.resetWeeklyQuests()}>Reset weekly quests</button>
            </div>
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Daily bonus</div>
            <div className="dev-buttons">
              <button onClick={() => actions.claimDailyBonus()} disabled={!vm.dailyBonus.available}>
                Claim today
              </button>
              <button onClick={() => actions.dev.setBonusDay(vm.dailyBonus.nextDay)}>
                Simulate next day
              </button>
              <button onClick={() => actions.dev.completeBonusCycle()}>Complete cycle</button>
              <button onClick={() => actions.dev.resetDailyBonus()}>Reset bonus</button>
            </div>
            <div className="dev-buttons">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button key={day} onClick={() => actions.dev.setBonusDay(day)}>
                  Day {day}
                </button>
              ))}
            </div>
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Quests &amp; level</div>
            <div className="dev-buttons">
              <button onClick={completeAllQuests}>Complete all quests</button>
              <button onClick={() => actions.claimAllQuests()}>Claim all</button>
              <button onClick={() => actions.awardXP(Math.max(1, vm.levelProgress.xpUntilNextLevel), 'dev-levelup')}>
                Trigger level up
              </button>
            </div>
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Self-tests</div>
            <div className="dev-buttons">
              <button onClick={runSelfTests}>Run engine tests</button>
            </div>
            {testResult && (
              <div className={`dev-test-result${testResult.failures?.length ? ' is-fail' : ''}`}>
                {testResult.summary}
                {testResult.failures?.slice(0, 4).map((f) => (
                  <div key={f.name} className="dev-test-fail">✗ {f.name} — {String(f.detail)}</div>
                ))}
              </div>
            )}
          </div>

          <div className="dev-group">
            <div className="dev-group-label">Danger</div>
            <div className="dev-buttons">
              <button
                className="dev-danger"
                onClick={() => { if (window.confirm('Wipe all progression state?')) actions.dev.reset() }}
              >
                Reset all progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
