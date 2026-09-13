/* ═══════════════════════════════════════════════════════════════════════════
   LevelProgress.jsx — LEVEL BADGE + XP BAR
   ---------------------------------------------------------------------------
   Reads the derived level model, so the bar and the badge are always exactly
   what the XP total implies.

   Revision 2: this block is the landing site for XP flights ('xp'). The bar
   holds until XP arrives, then settles with a shine; the badge turns over
   when the level changes; the figures roll; the track's tooltip says how far
   there is to go.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import useProgressWidth from '../../hooks/useProgressWidth'
import { formatNumber, getXPProgress } from '../../utils/progressionUtils'
import RollingNumber from '../../motion/RollingNumber'
import { useFlightTarget, useLandedValue } from '../../motion/flight'
import { BoltIcon } from './Icons'

export default function LevelProgress({ size = 'md', showTitle = true }) {
  const { vm } = useProgression()
  const xp = useLandedValue('xp', vm.xp)
  const p = getXPProgress(xp)
  const level = p.level
  const fillWidth = useProgressWidth(p.percent)
  const targetRef = useFlightTarget('xp')

  /* Turn the badge over when the level changes. */
  const prevLevel = useRef(level)
  const [turning, setTurning] = useState(false)
  useEffect(() => {
    if (prevLevel.current === level) return undefined
    prevLevel.current = level
    setTurning(true)
    const t = window.setTimeout(() => setTurning(false), 900)
    return () => clearTimeout(t)
  }, [level])

  const prevXp = useRef(xp)
  const [shineKey, setShineKey] = useState(0)
  useEffect(() => {
    if (prevXp.current !== xp) setShineKey((k) => k + 1)
    prevXp.current = xp
  }, [xp])

  const tip = p.isMaxLevel
    ? 'Max level reached'
    : `${formatNumber(p.xpUntilNextLevel)} XP to level ${level + 1}`

  return (
    <div className={`lv-block lv-${size}`} ref={targetRef}>
      <div className={`lv-badge${turning ? ' is-turning' : ''}`} aria-hidden="true" data-tip={`Level ${level} · ${vm.levelTitle}`}>
        <span className="lv-badge-num"><RollingNumber value={level} /></span>
        <span className="lv-badge-bolt"><BoltIcon size={12} /></span>
      </div>

      <div className="lv-col">
        <div className="lv-top">
          <span className="lv-label">Level {level}</span>
          {showTitle && <span className="lv-title">{vm.levelTitle}</span>}
        </div>

        <div
          className="lv-track"
          role="progressbar"
          aria-valuenow={p.xpIntoLevel}
          aria-valuemin={0}
          aria-valuemax={p.xpForThisLevel}
          aria-label={`Level ${level} progress`}
          data-tip={tip}
        >
          <div key={shineKey} className={`lv-fill${shineKey ? ' fx-fill-shine' : ''}`} style={{ width: `${fillWidth}%` }} />
        </div>

        <div className="lv-meta">
          {p.isMaxLevel
            ? `${formatNumber(xp)} XP · max level`
            : <>
                <RollingNumber value={p.totalXP} format={formatNumber} /> / {formatNumber(p.levelCeilXP)} XP
                <span className="lv-meta-next"> · {formatNumber(p.xpUntilNextLevel)} to level {level + 1}</span>
              </>}
        </div>
      </div>
    </div>
  )
}
