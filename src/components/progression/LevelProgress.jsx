/* ═══════════════════════════════════════════════════════════════════════════
   LevelProgress.jsx — LEVEL BADGE + XP BAR
   ---------------------------------------------------------------------------
   Reads the derived level model (never a stored level counter), so the bar
   and the badge are always exactly what the XP total implies.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { formatNumber } from '../../utils/progressionUtils'

export default function LevelProgress({ size = 'md', showTitle = true }) {
  const { vm } = useProgression()
  const p = vm.levelProgress

  return (
    <div className={`lv-block lv-${size}`}>
      <div className="lv-badge" aria-hidden="true">
        <span className="lv-badge-num">{vm.level}</span>
      </div>

      <div className="lv-col">
        <div className="lv-top">
          <span className="lv-label">Level {vm.level}</span>
          {showTitle && <span className="lv-title">{vm.levelTitle}</span>}
        </div>

        <div
          className="lv-track"
          role="progressbar"
          aria-valuenow={p.xpIntoLevel}
          aria-valuemin={0}
          aria-valuemax={p.xpForThisLevel}
          aria-label={`Level ${vm.level} progress`}
        >
          <div className="lv-fill" style={{ width: `${p.percent}%` }} />
        </div>

        <div className="lv-meta">
          {p.isMaxLevel
            ? `${formatNumber(vm.xp)} XP · max level`
            : <>
                {formatNumber(p.totalXP)} / {formatNumber(p.levelCeilXP)} XP
                <span className="lv-meta-next"> · {formatNumber(p.xpUntilNextLevel)} to level {vm.level + 1}</span>
              </>}
        </div>
      </div>
    </div>
  )
}
