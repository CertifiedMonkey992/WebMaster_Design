/* Your Progress card — every number comes from the progression view model. */

import { useProgression } from '../../state/ProgressionContext'
import LevelProgress from '../progression/LevelProgress'
import { FlameIcon, Icon } from '../progression/Icons'
import useProgressWidth from '../../hooks/useProgressWidth'
import useIncreaseFlash from '../../hooks/useIncreaseFlash'

export default function ProgressCard() {
  const { vm } = useProgression()
  const goalPct = vm.dailyGoalPercent
  const goalWidth = useProgressWidth(goalPct)
  const streakRose = useIncreaseFlash(vm.streak)

  return (
    <div className="progress-card">
      <div className="pc-header">Your Progress</div>

      <LevelProgress size="md" />

      {/* Daily goal — the ring the whole day is measured against */}
      <div className="pc-goal">
        <div className="pc-goal-top">
          <span className="pc-goal-label">Daily goal</span>
          <span className={`pc-goal-value${goalPct >= 100 ? ' is-met' : ''}`}>
            {vm.daily.xp} / {vm.goals.dailyXP} XP
            {goalPct >= 100 && <Icon name="check" size={11} strokeWidth={3} />}
          </span>
        </div>
        <div className="pc-goal-track">
          <div className={`pc-goal-fill${goalPct >= 100 ? ' is-met' : ''}`} style={{ width: `${goalWidth}%` }} />
        </div>
      </div>

      <div className="pc-stats">
        <div className={`pc-stat${streakRose ? ' just-rose' : ''}`}>
          <span className="pc-stat-value">
            <FlameIcon size={16} dim={vm.streak === 0} className="pc-stat-flame" />
            {vm.streak}
          </span>
          <span className="pc-stat-label">day streak</span>
        </div>
        <div className="pc-stat-divider" />
        <div className="pc-stat">
          <span className="pc-stat-value">{vm.course.completedCount}/{vm.course.totalLessons}</span>
          <span className="pc-stat-label">lessons done</span>
        </div>
      </div>
    </div>
  )
}
