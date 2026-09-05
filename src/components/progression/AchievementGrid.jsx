/* ═══════════════════════════════════════════════════════════════════════════
   AchievementGrid.jsx — PERMANENT MILESTONES
   ---------------------------------------------------------------------------
   Achievements never reset, so locked ones show real partial progress rather
   than a blank slot: the learner can always see how close they are.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { QuestIcon, GemIcon, Icon } from './Icons'
import useProgressWidth from '../../hooks/useProgressWidth'

/* The header ring used to be a plain bordered circle with a number in it —
   a full ring no matter what the number said. It now draws the real ratio,
   so the shape and the figure can't disagree. */
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
      <span className="ac-ring-num">{percent}%</span>
    </div>
  )
}

/* One card per achievement so each locked bar owns a mount animation of its
   own; the width still comes straight from a.percent. */
function AchievementCard({ achievement: a }) {
  const fillWidth = useProgressWidth(a.percent)
  return (
    <article className={`ac-card ac-${a.tier}${a.unlocked ? ' is-unlocked' : ''}`}>
      <span className="ac-icon">
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
            <Icon name="check" size={11} strokeWidth={3} /> Unlocked
          </div>
        )}
      </div>
      <span className="ac-reward"><GemIcon size={12} />{a.gems}</span>
    </article>
  )
}

export default function AchievementGrid() {
  const { vm } = useProgression()
  const unlocked = vm.achievements.filter((a) => a.unlocked)
  const locked = vm.achievements.filter((a) => !a.unlocked)
  const ordered = [...unlocked, ...locked]

  return (
    <div className="ac-wrap">
      <header className="ac-head">
        <div>
          <h3 className="ac-title">Achievements</h3>
          <p className="ac-sub">{unlocked.length} of {vm.achievements.length} unlocked</p>
        </div>
        <AchievementRing percent={Math.round((unlocked.length / vm.achievements.length) * 100)} />
      </header>

      <div className="ac-grid">
        {ordered.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  )
}
