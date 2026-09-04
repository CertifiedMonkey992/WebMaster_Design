/* ═══════════════════════════════════════════════════════════════════════════
   AchievementGrid.jsx — PERMANENT MILESTONES
   ---------------------------------------------------------------------------
   Achievements never reset, so locked ones show real partial progress rather
   than a blank slot: the learner can always see how close they are.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { QuestIcon, GemIcon, Icon } from './Icons'

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
        <div className="ac-ring" aria-hidden="true">
          <span>{Math.round((unlocked.length / vm.achievements.length) * 100)}%</span>
        </div>
      </header>

      <div className="ac-grid">
        {ordered.map((a) => (
          <article
            key={a.id}
            className={`ac-card ac-${a.tier}${a.unlocked ? ' is-unlocked' : ''}`}
          >
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
                    <div className="ac-fill" style={{ width: `${a.percent}%` }} />
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
        ))}
      </div>
    </div>
  )
}
