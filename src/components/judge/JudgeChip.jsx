/* ═══════════════════════════════════════════════════════════════════════════
   JudgeChip.jsx — A CONTROL IN THE MARGIN
   ---------------------------------------------------------------------------
   The reviewer's controls are MARGINALIA: small clay-inked notes printed
   beside the thing they act on, the way a reviewer's pencil marks up a
   proof. They are never the loudest thing on the row — the row is still the
   product, and a judge is meant to see the product.

   The rules they follow, so they never read as part of the interface:

     · always in the margin of something, never in its middle
     · one clay hairline, clay ink, the paper ground; no fill until hover
     · Manrope micro, uppercase, tracked — a printed label, not a button
     · `--r-sm`, because they are controls
     · the product's press (1px down, --shadow-press), like every other
       control in LunX
     · they disappear entirely when "Controls in the margin" is switched off
       in the reviewer's console, which is how a judge sees the plain course

   A chip never invents a result. Every one of them calls an operation in
   services/judgeService.js, which runs the same engine a learner drives.
   ═══════════════════════════════════════════════════════════════════════════ */

import { QuestIcon } from '../progression/Icons'
import useJudge from './useJudge'
import './judge.css'

/**
 * @param {object}   props
 * @param {string}   props.op        an op from judgeService.OPS
 * @param {object}   [props.payload] its payload
 * @param {string}   props.label     what pressing it does, in two or three words
 * @param {string}   [props.icon]    any icon id QuestIcon resolves — the drawn
 *                                   economy icons (heart, gem, flame, bolt,
 *                                   shield) or a line icon
 * @param {string}   [props.tip]     the longer explanation, on hover
 * @param {boolean}  [props.quiet]   an undo-ish control: ink rather than clay
 * @param {boolean}  [props.disabled]
 * @param {Function} [props.onDone]  called after the op, for a local effect
 */
export default function JudgeChip({
  op, payload, label, icon = 'sparkle', tip, quiet = false, disabled = false,
  onDone, className = '',
}) {
  const judge = useJudge()
  if (!judge.chips) return null

  const press = (e) => {
    /* Chips sit inside rows that are themselves buttons (a lesson row opens
       its preview). The chip acts on the row; it must not also open it. */
    e.stopPropagation()
    e.preventDefault()
    if (disabled) return
    if (op) judge.run(op, payload)
    onDone?.()
  }

  return (
    <button
      type="button"
      className={`jc${quiet ? ' jc--quiet' : ''} ${className}`.trim()}
      onClick={press}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={disabled}
      data-tip={tip}
      aria-label={tip ? `${label} — ${tip}` : label}
    >
      <QuestIcon name={icon} size={11} />
      {label}
    </button>
  )
}

/** Several chips on one line, in the margin of a row or a card. */
export function JudgeMargin({ children, className = '', label = 'Reviewer controls' }) {
  const judge = useJudge()
  if (!judge.chips) return null
  return (
    <div className={`jc-margin ${className}`.trim()} role="group" aria-label={label}>
      {children}
    </div>
  )
}
