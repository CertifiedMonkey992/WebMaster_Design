import { SECTIONS } from '../../data/learnData'

export default function ProgressCard() {
  const totalLessons = SECTIONS.reduce((sum, s) => sum + s.lessons.length, 0)
  const completedLessons = SECTIONS.reduce((sum, s) =>
    sum + s.lessons.filter(l => l.status === 'completed').length, 0)

  const xpPerLesson = 50
  const totalXP = completedLessons * xpPerLesson
  const levels = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250]

  let level = 1
  let xpInLevel = totalXP
  let xpNeeded = levels[1]

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i]) {
      level = i + 1
      xpInLevel = totalXP - levels[i]
      xpNeeded = (levels[i + 1] || levels[i] + 500) - levels[i]
      break
    }
  }

  const xpPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))
  const nextLevelXP = levels[level] || totalXP + 250
  const streak = 7

  return (
    <div className="progress-card">
      <div className="pc-header">Your Progress</div>

      <div className="pc-level-row">
        <div className="pc-level-badge">
          <span className="pc-level-num">{level}</span>
        </div>
        <div className="pc-xp-col">
          <div className="pc-xp-bar" role="progressbar" aria-valuenow={xpInLevel} aria-valuemax={xpNeeded}>
            <div className="pc-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="pc-xp-text">{totalXP} / {nextLevelXP} XP to Level {level + 1}</div>
        </div>
      </div>

      <div className="pc-stats">
        <div className="pc-stat">
          <span className="pc-stat-value">🔥 {streak}</span>
          <span className="pc-stat-label">day streak</span>
        </div>
        <div className="pc-stat-divider" />
        <div className="pc-stat">
          <span className="pc-stat-value">{completedLessons}/{totalLessons}</span>
          <span className="pc-stat-label">lessons done</span>
        </div>
      </div>
    </div>
  )
}
