/* ═══════════════════════════════════════════════════════════════════════════
   AchievementGrid.jsx — PERMANENT MILESTONES
   ---------------------------------------------------------------------------
   Achievements never reset, so locked ones show real partial progress.

   Revision 2: the ring draws to its figure and the figure counts with it;
   cards deal in; unlocked cards are medals — they tilt toward the pointer
   and a glint crosses them; locked cards refuse when pressed (the lock
   rattles) and their tooltip says exactly how far there is to go.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { QuestIcon, GemIcon, Icon } from './Icons'
import JudgeChip, { JudgeMargin } from '../judge/JudgeChip'
import { OPS } from '../../services/judgeService'
import useProgressWidth from '../../hooks/useProgressWidth'
import CountUp from '../../motion/CountUp'
import Reveal from '../../motion/Reveal'
import { shake } from '../../motion/burst'
import { useAchievementPreviews } from '../learn/previews'

const RING_R = 19
const RING_C = 2 * Math.PI * RING_R

function AchievementRing({ percent }) {
  const shown = useProgressWidth(percent)
  return (
    <div className="ac-ring" aria-hidden="true">
      <svg className="ac-ring-svg" viewBox="0 0 44 44">
        <circle className="ac-ring-track" cx="22" cy="22" r={RING_R} />
        <circle
          className="ac-ring-fill"
          cx="22" cy="22" r={RING_R}
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - shown / 100)}
        />
      </svg>
      <span className="ac-ring-num"><CountUp value={percent} suffix="%" immediate delay={200} /></span>
    </div>
  )
}

function AchievementCard({ achievement: a, style, className = '' }) {
  const fillWidth = useProgressWidth(a.percent)
  const ref = useRef(null)
  const iconRef = useRef(null)

  const press = () => {
    if (a.unlocked) return
    shake(ref.current, { distance: 4 })
    iconRef.current?.classList.add('is-denied')
    window.setTimeout(() => iconRef.current?.classList.remove('is-denied'), 500)
  }

  const tip = a.unlocked
    ? `${a.title} · unlocked · +${a.gems} gems paid`
    : `${a.current} of ${a.target} · ${Math.max(0, a.target - a.current)} to go`

  return (
    <article
      ref={ref}
      className={`ac-card ac-${a.tier}${a.unlocked ? ' is-unlocked' : ''} ${className}`.trim()}
      style={style}
      data-tilt={a.unlocked ? '' : undefined}
      data-achievement={a.id}
      data-tip={tip}
      onClick={press}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press() } }}
      aria-label={`${a.title}: ${a.description}. ${tip}`}
    >
      <span className="ac-icon" ref={iconRef}>
        {a.unlocked
          ? <QuestIcon name={a.icon} size={20} />
          : <Icon name="lock" size={16} />}
      </span>
      <div className="ac-body">
        <div className="ac-name">{a.title}</div>
        <div className="ac-desc">{a.description}</div>
        {!a.unlocked && (
          <div className="ac-progress">
            <div className="ac-track">
              <div className="ac-fill" style={{ width: `${fillWidth}%` }} />
            </div>
            <span className="ac-count">{a.current}/{a.target}</span>
          </div>
        )}
        {a.unlocked && (
          <div className="ac-unlocked">
            <span className="is-drawing"><Icon name="check" size={11} strokeWidth={3} /></span> Unlocked
          </div>
        )}
      </div>
      <span className="ac-reward"><GemIcon size={12} />{a.gems}</span>
    </article>
  )
}

export default function AchievementGrid() {
  const { vm } = useProgression()
  const wrapRef = useRef(null)
  const listRef = useRef(null)
  listRef.current = vm.achievements
  useAchievementPreviews(wrapRef, () => listRef.current)
  const unlocked = vm.achievements.filter((a) => a.unlocked)
  const locked = vm.achievements.filter((a) => !a.unlocked)
  const ordered = [...unlocked, ...locked]

  return (
    <div className="ac-wrap" ref={wrapRef}>
      <header className="ac-head">
        <div>
          <h3 className="ac-title">Achievements</h3>
          <p className="ac-sub">{unlocked.length} of {vm.achievements.length} unlocked</p>
        </div>
        <AchievementRing percent={Math.round((unlocked.length / vm.achievements.length) * 100)} />
      </header>

      {/* Reviewer only. Unlocking grants what each badge MEASURES, so every
          bar below reads true instead of a full seal beside "0 of 30". */}
      <JudgeMargin className="ac-judge-margin" label="Reviewer badge controls">
        <JudgeChip op={OPS.UNLOCK_BADGES} icon="trophy" label="Unlock all"
          tip="Unlock every badge at once" />
        <JudgeChip op={OPS.RESET_BADGES} icon="close" label="Lock them" quiet
          tip="Put every badge back to locked" />
      </JudgeMargin>

      <Reveal className="ac-grid" variant="scale" stagger immediate delay={300}>
        {ordered.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </Reveal>
    </div>
  )
}
