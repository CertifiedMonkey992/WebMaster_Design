/* ═══════════════════════════════════════════════════════════════════════════
   useJudge.js — THE ONE HOOK EVERY REVIEWER CONTROL USES
   ---------------------------------------------------------------------------
   A component that wants a control in its margin asks this, and gets back
   either `active: false` (which is the answer on every profile but one, and
   the component renders nothing) or the operations it can offer.

   Keeping it here means the chips scattered through the course share one
   answer to "is this the reviewer?" and one way to ask for something. No
   component reaches into progression state to find out.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo } from 'react'
import { useProgression } from '../../state/ProgressionContext'
import { OPS } from '../../services/judgeService'

/**
 * @returns {{
 *   active: boolean,     the reviewer's profile is loaded
 *   chips: boolean,      ...and the margin controls are switched on
 *   powers: object|null,
 *   run: (op: string, payload?: object) => void,
 *   ops: typeof OPS,
 * }}
 */
export default function useJudge() {
  const { vm, actions, showcase } = useProgression()
  /* A landing-page frame mounts the real components against a demo learner;
     a control that changes things has no business inside a picture. */
  const active = Boolean(vm.judge) && !showcase

  return useMemo(() => ({
    active,
    chips: active && Boolean(vm.judge?.powers?.chips),
    powers: vm.judge?.powers ?? null,
    run: (op, payload) => { if (active) actions.judge(op, payload) },
    ops: OPS,
  }), [active, vm.judge, actions])
}

export { OPS }
