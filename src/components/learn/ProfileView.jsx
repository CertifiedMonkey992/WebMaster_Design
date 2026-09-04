/* ═══════════════════════════════════════════════════════════════════════════
   ProfileView.jsx — STATS + ACHIEVEMENTS
   ---------------------------------------------------------------------------
   The permanent half of the progression system: lifetime statistics that no
   daily or weekly reset can touch, plus the achievement wall.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import LevelProgress from '../progression/LevelProgress'
import AchievementGrid from '../progression/AchievementGrid'
import { FlameIcon, GemIcon, Icon } from '../progression/Icons'
import { formatNumber } from '../../utils/progressionUtils'
import { getShortDate, getLocalDateKey } from '../../utils/dateUtils'

export default function ProfileView() {
  const { state, vm } = useProgression()
  const s = vm.stats

  const accuracy = s.totalCorrectAnswers + s.totalWrongAnswers > 0
    ? Math.round((s.totalCorrectAnswers / (s.totalCorrectAnswers + s.totalWrongAnswers)) * 100)
    : 0

  const tiles = [
    { label: 'Total XP',        value: formatNumber(s.totalXPEarned), icon: 'bolt' },
    { label: 'Lessons done',    value: `${vm.course.completedCount}/${vm.course.totalLessons}`, icon: 'book' },
    { label: 'Perfect lessons', value: s.totalPerfectLessons, icon: 'star' },
    { label: 'Practice time',   value: `${Math.floor(s.totalPracticeSeconds / 60)}m`, icon: 'timer' },
    { label: 'Answer accuracy', value: `${accuracy}%`, icon: 'target' },
    { label: 'Quests claimed',  value: s.totalQuestsClaimed, icon: 'check-circle' },
    { label: 'Sections done',   value: `${vm.course.completedSections}/${vm.course.totalSections}`, icon: 'layers' },
    { label: 'Days active',     value: s.daysActive, icon: 'calendar' },
  ]

  return (
    <div className="pv-wrap">
      <header className="pv-head">
        <div className="pv-identity">
          <div className="pv-avatar">{vm.level}</div>
          <div>
            <h2 className="pv-name">{vm.levelTitle}</h2>
            <p className="pv-since">Learning since {getShortDate(getLocalDateKey(new Date(state.createdAt)))}</p>
          </div>
        </div>

        <div className="pv-headline">
          <div className="pv-headline-item">
            <FlameIcon size={18} dim={vm.streak === 0} />
            <b>{vm.streak}</b><span>day streak</span>
          </div>
          <div className="pv-headline-item">
            <GemIcon size={18} />
            <b>{formatNumber(vm.gems)}</b><span>gems</span>
          </div>
          <div className="pv-headline-item">
            <Icon name="trophy" size={18} />
            <b>{vm.longestStreak}</b><span>best streak</span>
          </div>
        </div>
      </header>

      <div className="pv-level"><LevelProgress size="lg" /></div>

      <div className="pv-tiles">
        {tiles.map((t) => (
          <div className="pv-tile" key={t.label}>
            <span className="pv-tile-icon"><Icon name={t.icon} size={15} /></span>
            <span className="pv-tile-value">{t.value}</span>
            <span className="pv-tile-label">{t.label}</span>
          </div>
        ))}
      </div>

      <AchievementGrid />
    </div>
  )
}
