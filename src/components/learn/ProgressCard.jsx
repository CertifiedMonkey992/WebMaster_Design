/* Your Progress card — every number comes from the progression view model.

   Revision 2: the level block is the XP landing site; the daily goal track
   carries a marker that walks with the day's XP and stamps a check when the
   goal is met; the streak flame is alive and both figures roll. */

import { useProgression } from '../../state/ProgressionContext'
import LevelProgress from '../progression/LevelProgress'
import { LiveFlame } from '../progression/LiveIcons'
import { Icon } from '../progression/Icons'
import useProgressWidth from '../../hooks/useProgressWidth'
import RollingNumber from '../../motion/RollingNumber'
import { useLandedValue } from '../../motion/flight'
import Reveal from '../../motion/Reveal'

export default function ProgressCard({ style, className = '' }) {
  const { vm } = useProgression()
  const goalPct = vm.dailyGoalPercent
  const goalWidth = useProgressWidth(goalPct)
  const streak = useLandedValue('streak', vm.streak)
  const met = goalPct >= 100

  return (
    <div className={`progress-card ${className}`.trim()} style={style}>
      <div className="pc-header">
        Your Progress
        <span className="pc-header-tag" data-tip="Levels come from total XP">
          {vm.levelTitle}
        </span>
      </div>

      <LevelProgress size="md" showTitle={false} />

      <div className="pc-goal">
        <div className="pc-goal-top">
          <span className="pc-goal-label">Daily goal</span>
          <span className={`pc-goal-value${met ? ' is-met' : ''}`}>
            <RollingNumber value={vm.daily.xp} /> / {vm.goals.dailyXP} XP
            {met && <Icon name="check" size={11} strokeWidth={3} />}
          </span>
        </div>
        <div
          className="pc-goal-track"
          data-tip={met ? 'Goal met for today' : `${Math.max(0, vm.goals.dailyXP - vm.daily.xp)} XP to today's goal`}
        >
          <div className={`pc-goal-fill${met ? ' is-met' : ''}`} style={{ width: `${goalWidth}%` }} />
          <span className="pc-goal-marker" style={{ left: `${goalWidth}%` }} aria-hidden="true" />
        </div>
      </div>

      <Reveal className="pc-stats" variant="scale" stagger delay={200}>
        <div
          className="pc-stat fx-flare-host"
          data-tip={vm.streak === 0 ? 'Finish a lesson to start a streak' : vm.activeToday ? 'Today is done' : 'Learn today to keep it'}
        >
          <span className="pc-stat-value">
            <LiveFlame streak={streak} activeToday={vm.activeToday} size={17} showShield={false} />
            <RollingNumber value={streak} />
          </span>
          <span className="pc-stat-label">day streak</span>
        </div>
        <div className="pc-stat-divider" />
        <div className="pc-stat" data-tip={`${vm.course.totalLessons - vm.course.completedCount} lessons still to go`}>
          <span className="pc-stat-value">
            <RollingNumber value={vm.course.completedCount} />/{vm.course.totalLessons}
          </span>
          <span className="pc-stat-label">lessons done</span>
        </div>
      </Reveal>
    </div>
  )
}
