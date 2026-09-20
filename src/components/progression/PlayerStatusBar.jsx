/* ═══════════════════════════════════════════════════════════════════════════
   PlayerStatusBar.jsx — THE PERSISTENT TOP-RIGHT STATUS BAR
   ---------------------------------------------------------------------------
   streak · gems · hearts. Every number is read straight from the progression
   view model, so the bar can never disagree with the rest of the app.

   Revision 2 — each pill is now:
     · a FLIGHT TARGET: rewards earned anywhere travel here (flight.js)
     · a LANDED VALUE: its number holds until the reward arrives, then ROLLS
     · a LIVING ICON: the flame burns / flares, the heart shows how full you
       are and cracks when one is lost, the gem turns when gems land
     · a TOOLTIP on hover saying what the figure means
     · a POPOVER on click with the whole story and the actions

   On the landing page (showcase) the pills keep their tooltips and motion but
   do not open popovers: the frame they sit in clips anything that floats.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useRef, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { LiveFlame, LiveGem, LiveHeart } from './LiveIcons'
import Popover from './Popover'
import HeartsPanel from './HeartsPanel'
import GemsPanel from './GemsPanel'
import StreakPanel from './StreakPanel'
import { formatNumber } from '../../utils/progressionUtils'
import { formatClock } from '../../utils/dateUtils'
import { getHeartRecoveryTime } from '../../services/currencyService'
import RollingNumber from '../../motion/RollingNumber'
import { useFlightTarget, useLandedValue } from '../../motion/flight'
import { useTopBarPreviews } from '../learn/previews'

export default function PlayerStatusBar({ compact = false, onOpenShop }) {
  const { state, vm, showcase } = useProgression()
  const now = useClock()
  const [openPanel, setOpenPanel] = useState(null)
  const barRef = useRef(null)
  useTopBarPreviews(barRef, { disabled: showcase })
  const close = useCallback(() => setOpenPanel(null), [])
  const toggle = (id) => { if (!showcase) setOpenPanel((prev) => (prev === id ? null : id)) }

  const goToShop = useCallback(() => {
    setOpenPanel(null)
    onOpenShop?.()
  }, [onOpenShop])

  const streakRef = useFlightTarget('streak')
  const gemsRef = useFlightTarget('gems')
  const heartsRef = useFlightTarget('hearts')

  const streak = useLandedValue('streak', vm.streak)
  const gems = useLandedValue('gems', vm.gems)
  const hearts = useLandedValue('hearts', vm.hearts)

  const recovery = getHeartRecoveryTime(state, now)
  const heartsFull = hearts >= vm.maxHearts
  /* The reviewer's purse refills itself, so the pill states that rather than
     rolling six digits nobody is counting (config/judgeConfig.js). The real
     figure is still one press away, in the gem panel. */
  const endless = vm.unlimitedGems

  const streakTip = vm.streak === 0
    ? 'No streak yet — finish a lesson to light it'
    : vm.activeToday
      ? `${vm.streak}-day streak · today is done${vm.shields ? ` · ${vm.shields} shield${vm.shields === 1 ? '' : 's'} banked` : ''}`
      : `${vm.streak}-day streak · learn today to keep it`

  const heartsTip = heartsFull
    ? `${hearts} of ${vm.maxHearts} hearts · full`
    : hearts === 0
      ? `Out of hearts · next one in ${formatClock(recovery.msUntilNext)}`
      : `${hearts} of ${vm.maxHearts} hearts · next in ${formatClock(recovery.msUntilNext)}`

  return (
    <div className={`pg-status${compact ? ' pg-status--compact' : ''}`} ref={barRef}>
      {/* ── Streak ── */}
      <div className="pg-status-item">
        <button
          type="button"
          ref={streakRef}
          data-popover-trigger
          data-tip={streakTip}
          data-tip-side="bottom"
          className={`pg-pill pg-pill--streak fx-flare-host${vm.streak > 0 ? ' is-active' : ' is-dim'}${!vm.activeToday && vm.streak > 0 ? ' is-risk' : ''}`}
          onClick={() => toggle('streak')}
          aria-expanded={showcase ? undefined : openPanel === 'streak'}
          aria-label={`Streak: ${vm.streak} day${vm.streak === 1 ? '' : 's'}. Open streak details`}
        >
          <LiveFlame streak={streak} activeToday={vm.activeToday} shields={vm.shields} size={20} />
          <RollingNumber className="pg-pill-value" value={streak} />
        </button>
        <Popover open={openPanel === 'streak'} onClose={close} title="Your streak" tone="streak">
          <StreakPanel onOpenShop={onOpenShop ? goToShop : undefined} />
        </Popover>
      </div>

      {/* ── Gems ── */}
      <div className="pg-status-item">
        <button
          type="button"
          ref={gemsRef}
          data-popover-trigger
          data-tip={endless ? 'Unlimited gems · the reviewer profile tops itself up' : `${formatNumber(vm.gems)} gems · spend them in the shop`}
          data-tip-side="bottom"
          className="pg-pill pg-pill--gems is-active fx-glint-host"
          onClick={() => toggle('gems')}
          aria-expanded={showcase ? undefined : openPanel === 'gems'}
          aria-label={endless ? 'Gems: unlimited. Open gem details' : `Gems: ${vm.gems}. Open gem details`}
        >
          <LiveGem gems={gems} size={20} />
          {endless
            ? <span className="pg-pill-value pg-pill-value--endless" aria-hidden="true">∞</span>
            : <RollingNumber className="pg-pill-value" value={gems} format={formatNumber} />}
        </button>
        <Popover open={openPanel === 'gems'} onClose={close} title="Gems" tone="gems">
          <GemsPanel onClose={close} onOpenShop={onOpenShop ? goToShop : undefined} />
        </Popover>
      </div>

      {/* ── Hearts ── */}
      <div className="pg-status-item">
        <button
          type="button"
          ref={heartsRef}
          data-popover-trigger
          data-tip={heartsTip}
          data-tip-side="bottom"
          className={`pg-pill pg-pill--hearts${hearts === 0 ? ' is-empty' : ' is-active'}${hearts === 1 ? ' is-low' : ''}`}
          onClick={() => toggle('hearts')}
          aria-expanded={showcase ? undefined : openPanel === 'hearts'}
          aria-label={`Hearts: ${vm.hearts} of ${vm.maxHearts}. Open heart details`}
        >
          <LiveHeart
            hearts={hearts}
            max={vm.maxHearts}
            recovery={heartsFull ? null : recovery.cycleProgress ?? 0}
            size={20}
          />
          <RollingNumber className="pg-pill-value" value={hearts} />
        </button>
        <Popover open={openPanel === 'hearts'} onClose={close} title="Hearts" tone="hearts">
          <HeartsPanel onClose={close} onOpenShop={onOpenShop ? goToShop : undefined} />
        </Popover>
      </div>
    </div>
  )
}
