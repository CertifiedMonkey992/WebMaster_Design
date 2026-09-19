/* ═══════════════════════════════════════════════════════════════════════════
   ProfileView.jsx — STATS + ACHIEVEMENTS
   ---------------------------------------------------------------------------
   The permanent half of the progression system: lifetime statistics no reset
   can touch, plus the achievement wall.

   Revision 2: the level badge turns toward the pointer; the headline figures
   and all eight lifetime totals are tallied as they arrive; each tile's icon
   answers the pointer and its tooltip says what the figure counts.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import LevelProgress from '../progression/LevelProgress'
import AchievementGrid from '../progression/AchievementGrid'
import { GemIcon, BoltIcon, Icon } from '../progression/Icons'
import { LiveFlame } from '../progression/LiveIcons'
import { formatNumber } from '../../utils/progressionUtils'
import { getShortDate, getLocalDateKey } from '../../utils/dateUtils'
import SplitText from '../../motion/SplitText'
import Reveal from '../../motion/Reveal'
import CountUp from '../../motion/CountUp'

/* Export and import of the learner's progress. The Terms warn that progress
   lives in this browser and can be lost with it; this is the way to keep a
   copy and bring it to another browser. */
function ProgressData() {
  const { actions } = useProgression()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)   // { name, text, summary }
  const [note, setNote] = useState(null)         // { tone: 'ok' | 'bad', text }

  const exportFile = () => {
    const blob = new Blob([actions.exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lunx-progress-${getLocalDateKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNote({ tone: 'ok', text: 'Backup saved. Keep the file somewhere safe.' })
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    let parsed = null
    try { parsed = JSON.parse(text) } catch { /* handled below */ }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.xp !== 'number') {
      setPending(null)
      setNote({ tone: 'bad', text: 'That file is not a LunX backup.' })
      return
    }
    const lessons = parsed.lessons && typeof parsed.lessons === 'object' ? Object.keys(parsed.lessons).length : 0
    setNote(null)
    setPending({ name: file.name, text, summary: `${lessons} lessons, ${Math.max(0, Math.floor(parsed.xp))} XP, ${Math.max(0, Math.floor(parsed.gems ?? 0))} gems` })
  }

  const confirm = () => {
    const ok = actions.importProgress(pending.text)
    setPending(null)
    setNote(ok
      ? { tone: 'ok', text: 'Progress restored from your backup.' }
      : { tone: 'bad', text: 'That file could not be read as a LunX backup.' })
  }

  return (
    <section className="pv-data" aria-labelledby="pv-data-title">
      <div>
        <h3 className="pv-data-title" id="pv-data-title">Your data</h3>
        <p className="pv-data-desc">
          Progress is saved only in this browser. Export a backup file to keep it, or to move
          it to another browser; importing replaces what is here.
        </p>
      </div>
      <div className="pv-data-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={exportFile}>Export backup</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Import backup</button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={pick} hidden aria-label="Choose a LunX backup file" />
      </div>
      {pending && (
        <div className="pv-data-confirm" role="group" aria-label="Confirm import">
          <p>Replace your current progress with <b>{pending.name}</b> ({pending.summary})? This cannot be undone.</p>
          <div className="pv-data-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={confirm}>Replace my progress</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
      <p className={`pv-data-note${note ? ` is-${note.tone}` : ''}`} role="status">{note?.text ?? ''}</p>
    </section>
  )
}

export default function ProfileView() {
  const { state, vm } = useProgression()
  const s = vm.stats

  const accuracy = s.totalCorrectAnswers + s.totalWrongAnswers > 0
    ? Math.round((s.totalCorrectAnswers / (s.totalCorrectAnswers + s.totalWrongAnswers)) * 100)
    : 0

  const tiles = [
    { label: 'Total XP',        value: s.totalXPEarned, icon: <BoltIcon size={16} />, tip: 'Every XP you have ever earned', format: formatNumber },
    { label: 'Lessons done',    value: vm.course.completedCount, of: vm.course.totalLessons, icon: <Icon name="book" size={16} />, tip: 'First completions only' },
    { label: 'Perfect lessons', value: s.totalPerfectLessons, icon: <Icon name="star" size={16} />, tip: 'Finished without losing a heart' },
    { label: 'Practice time',   value: Math.floor(s.totalPracticeSeconds / 60), suffix: 'm', icon: <Icon name="timer" size={16} />, tip: 'Measured time in lessons and practice' },
    { label: 'Answer accuracy', value: accuracy, suffix: '%', icon: <Icon name="target" size={16} />, tip: `${s.totalCorrectAnswers} right, ${s.totalWrongAnswers} wrong` },
    { label: 'Quests claimed',  value: s.totalQuestsClaimed, icon: <Icon name="check-circle" size={16} />, tip: 'Daily and weekly' },
    { label: 'Sections done',   value: vm.course.completedSections, of: vm.course.totalSections, icon: <Icon name="layers" size={16} />, tip: 'Whole modules finished' },
    { label: 'Days active',     value: s.daysActive, icon: <Icon name="calendar" size={16} />, tip: 'Days you finished something' },
  ]

  return (
    <div className="pv-wrap">
      <header className="pv-head">
        <div className="pv-identity">
          <div className="pv-avatar" data-tilt data-tip={`Level ${vm.level}`}>{vm.level}</div>
          <div>
            <SplitText as="h2" className="pv-name" immediate>{vm.levelTitle}</SplitText>
            <p className="pv-since">Learning since {getShortDate(getLocalDateKey(new Date(state.createdAt)))}</p>
          </div>
        </div>

        <Reveal className="pv-headline" variant="scale" stagger immediate delay={200}>
          <div className="pv-headline-item fx-flare-host" data-tip="Current streak">
            <LiveFlame streak={vm.streak} activeToday={vm.activeToday} size={20} showShield={false} />
            <b><CountUp value={vm.streak} immediate delay={300} /></b><span>day streak</span>
          </div>
          <div className="pv-headline-item fx-glint-host fx-gleam" data-tip="Gems in hand">
            <span className="pv-gem"><GemIcon size={20} /></span>
            <b><CountUp value={vm.gems} immediate delay={380} format={formatNumber} /></b><span>gems</span>
          </div>
          <div className="pv-headline-item" data-tip="Longest streak so far">
            <Icon name="trophy" size={20} />
            <b><CountUp value={vm.longestStreak} immediate delay={460} /></b><span>best streak</span>
          </div>
        </Reveal>
      </header>

      <Reveal className="pv-level" variant="up" immediate delay={260}><LevelProgress size="lg" /></Reveal>

      <Reveal className="pv-tiles" variant="scale" stagger immediate delay={340}>
        {tiles.map((t, i) => (
          <div className="pv-tile" key={t.label} data-tip={t.tip}>
            <span className="pv-tile-icon">{t.icon}</span>
            <span className="pv-tile-value">
              <CountUp value={t.value} immediate delay={420 + i * 60} format={t.format} suffix={t.suffix ?? ''} />
              {t.of != null && <span className="pv-tile-of">/{t.of}</span>}
            </span>
            <span className="pv-tile-label">{t.label}</span>
          </div>
        ))}
      </Reveal>

      <AchievementGrid />

      <ProgressData />
    </div>
  )
}
