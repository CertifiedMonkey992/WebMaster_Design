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
import { formatNumber, getXPProgress, getLevelTitle } from '../../utils/progressionUtils'
import RollingNumber from '../../motion/RollingNumber'
import { useFlightTarget, useLandedValue } from '../../motion/flight'
import { BoltIcon } from './Icons'
import { useLevelPreviews } from '../learn/previews'

export default function LevelProgress({ size = 'md', showTitle = true }) {
  const { vm, showcase } = useProgression()
  const xp = useLandedValue('xp', vm.xp)
  const p = getXPProgress(xp)
  const level = p.level
  /* The badge, the label and the title all read the LANDED level, so none
     of them can run ahead of the others while XP is still in the air. */
  const levelTitle = getLevelTitle(level)
  const fillWidth = useProgressWidth(p.percent)
  const targetRef = useFlightTarget('xp')
  const blockRef = useRef(null)
  const setBlock = (node) => { blockRef.current = node; targetRef(node) }
  useLevelPreviews(blockRef, { disabled: showcase })

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

  /* The shine restarts by dropping its class for one frame, so the fill is
     never remounted and its width transition (--dur-settle) gets to play. */
  const prevXp = useRef(xp)
  const [shining, setShining] = useState(false)
  useEffect(() => {
    if (prevXp.current === xp) return undefined
    prevXp.current = xp
    setShining(false)
    const raf = requestAnimationFrame(() => setShining(true))
    return () => cancelAnimationFrame(raf)
  }, [xp])

  const tip = p.isMaxLevel
    ? 'Max level reached'
    : `${formatNumber(p.xpUntilNextLevel)} XP to level ${level + 1}`

  return (
    <div className={`lv-block lv-${size}`} ref={setBlock}>
      <div className={`lv-badge${turning ? ' is-turning' : ''}`} aria-hidden="true" data-tip={`Level ${level} · ${levelTitle}`}>
        <span className="lv-badge-num"><RollingNumber value={level} /></span>
        <span className="lv-badge-bolt fx-zap"><BoltIcon size={12} /></span>
      </div>

      <div className="lv-col">
        <div className="lv-top">
          <span className="lv-label">Level {level}</span>
          {showTitle && <span className="lv-title">{levelTitle}</span>}
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
          <div className={`lv-fill${shining ? ' fx-fill-shine' : ''}`} style={{ width: `${fillWidth}%` }} />
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
