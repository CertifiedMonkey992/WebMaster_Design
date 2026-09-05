/* ═══════════════════════════════════════════════════════════════════════════
   PlayerStatusBar.jsx — THE PERSISTENT TOP-RIGHT STATUS BAR
   ---------------------------------------------------------------------------
   🔥 streak · 💎 gems · ❤️ hearts

   Every number is read straight from the progression view model, so the bar
   can never disagree with the rest of the app. Each pill is a real control
   that opens a panel with genuine information and genuine actions.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { FlameIcon, GemIcon, HeartIcon } from './Icons'
import Popover from './Popover'
import HeartsPanel from './HeartsPanel'
import GemsPanel from './GemsPanel'
import StreakPanel from './StreakPanel'
import { formatNumber } from '../../utils/progressionUtils'

export default function PlayerStatusBar({ compact = false, onOpenShop }) {
  const { vm } = useProgression()
  const [openPanel, setOpenPanel] = useState(null)
  const close = useCallback(() => setOpenPanel(null), [])
  const toggle = (id) => setOpenPanel((prev) => (prev === id ? null : id))

  /* Panels that link to the shop close themselves on the way there. */
  const goToShop = useCallback(() => {
    setOpenPanel(null)
    onOpenShop?.()
  }, [onOpenShop])

  /* The clock is only read here so the "next heart in mm:ss" label stays live
     without re-rendering the whole dashboard every second. */
  useClock()

  const streakActive = vm.streak > 0
  const heartsLow = vm.hearts === 0

  return (
    <div className={`pg-status${compact ? ' pg-status--compact' : ''}`}>
      {/* ── Streak ── */}
      <div className="pg-status-item">
        <button
          type="button"
          data-popover-trigger
          className={`pg-pill pg-pill--streak${streakActive ? ' is-active' : ' is-dim'}`}
          onClick={() => toggle('streak')}
          aria-expanded={openPanel === 'streak'}
          aria-label={`Streak: ${vm.streak} day${vm.streak === 1 ? '' : 's'}. Open streak details`}
        >
          <FlameIcon size={20} className="pg-pill-icon" dim={!streakActive} />
          <span className="pg-pill-value">{vm.streak}</span>
        </button>
        <Popover open={openPanel === 'streak'} onClose={close} title="Your streak">
          <StreakPanel onOpenShop={onOpenShop ? goToShop : undefined} />
        </Popover>
      </div>

      {/* ── Gems ── */}
      <div className="pg-status-item">
        <button
          type="button"
          data-popover-trigger
          className="pg-pill pg-pill--gems is-active"
          onClick={() => toggle('gems')}
          aria-expanded={openPanel === 'gems'}
          aria-label={`Gems: ${vm.gems}. Open gem details`}
        >
          <GemIcon size={20} className="pg-pill-icon" />
          <span className="pg-pill-value">{formatNumber(vm.gems)}</span>
        </button>
        <Popover open={openPanel === 'gems'} onClose={close} title="Gems">
          <GemsPanel onClose={close} />
        </Popover>
      </div>

      {/* ── Hearts ── */}
      <div className="pg-status-item">
        <button
          type="button"
          data-popover-trigger
          className={`pg-pill pg-pill--hearts${heartsLow ? ' is-empty' : ' is-active'}`}
          onClick={() => toggle('hearts')}
          aria-expanded={openPanel === 'hearts'}
          aria-label={`Hearts: ${vm.hearts} of ${vm.maxHearts}. Open heart details`}
        >
          <HeartIcon size={20} className="pg-pill-icon" empty={heartsLow} />
          <span className="pg-pill-value">{vm.hearts}</span>
        </button>
        <Popover open={openPanel === 'hearts'} onClose={close} title="Hearts">
          <HeartsPanel onClose={close} onOpenShop={onOpenShop ? goToShop : undefined} />
        </Popover>
      </div>
    </div>
  )
}
