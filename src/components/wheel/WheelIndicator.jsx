/* ═══════════════════════════════════════════════════════════════════════════
   WheelIndicator.jsx — THE TOP-BAR ACCESS POINT
   ---------------------------------------------------------------------------
   Where the daily bonus button was. While a spin is waiting it is an
   Invitation (clay, a pinging dot, a quarter turn on hover); once spun it
   is quiet and says how long until the next one.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useProgression } from '../../state/ProgressionContext'
import { Icon } from '../progression/Icons'
import { formatDuration } from '../../utils/dateUtils'
import './wheel.css'

export default function WheelIndicator({ onOpen }) {
  const { vm } = useProgression()
  const { available, spinsLeft, msUntilReset } = vm.wheel
  const wait = formatDuration(msUntilReset)

  return (
    <button
      type="button"
      className={`wh-indicator${available ? ' is-ready' : ''}`}
      onClick={onOpen}
      data-tip={available ? `${spinsLeft} spin${spinsLeft === 1 ? '' : 's'} ready` : `Next free spin in ${wait}`}
      data-tip-side="bottom"
      aria-label={available ? `Daily spin — ${spinsLeft} spin${spinsLeft === 1 ? '' : 's'} ready` : `Daily spin — next free spin in ${wait}`}
    >
      <span className="wh-indicator-icon" aria-hidden="true">
        <Icon name="wheel" size={18} strokeWidth={2} />
      </span>
      <span className="wh-indicator-text">{available ? 'Daily spin' : wait}</span>
      {available && <span className="wh-indicator-dot" aria-hidden="true" />}
    </button>
  )
}
