/* ═══════════════════════════════════════════════════════════════════════════
   stepLogic.js — WHAT A STEP IS, AND WHETHER AN ANSWER IS RIGHT
   ---------------------------------------------------------------------------
   Pure functions over a lesson step and the learner's answer, shared by the
   step renderer, the lesson, Practice and the content loader. No React.

   An answer is one object for every step type:
     { filled, selected, confidence, assign, text, value, fields, done }
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{ id: string, text: string, correct?: boolean }} StepOption
 * @typedef {{ id: string, text: string, bin: string, note?: string }} SortItem
 * @typedef {{ id: string, label: string, min?: number }} ComposeField
 * @typedef {{
 *   id: string, type: string, prompt?: string, title?: string,
 *   options?: StepOption[], answers?: string[], correct?: string,
 *   items?: SortItem[], answer?: number, tolerance?: number, unit?: string,
 *   fields?: ComposeField[], goal?: string, min?: number,
 * }} Step
 * @typedef {{
 *   filled?: (string|null)[], selected?: any, confidence?: string|null,
 *   assign?: Record<string, string>, text?: string, value?: string,
 *   fields?: Record<string, string>, done?: boolean,
 * }} Answer
 */

/** @type {Readonly<Answer>} */
export const EMPTY_ANSWER = Object.freeze({
  filled: [], selected: null, confidence: null, assign: {}, text: '', value: '', fields: {}, done: false,
})

const CHECK_TYPES = new Set(['fill-blank', 'binary', 'mcq', 'recall', 'predict', 'sort', 'number'])

/** Does this step end with a Check (a verdict), rather than a Continue?
 * @param {Step | null | undefined} step */
export function isCheckStep(step) {
  return CHECK_TYPES.has(step?.type ?? '')
}

/** Can this step ever be graded? A prediction never is; a recall never is.
 * @param {Step | null | undefined} step */
export function isGradable(step) {
  return isCheckStep(step) && step?.type !== 'predict' && step?.type !== 'recall'
}

/** @param {unknown} value @returns {number|null} */
export function parseNumber(value) {
  const clean = String(value ?? '').replace(/[,%\s]/g, '')
  if (!clean) return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

/** @param {number} n */
export function formatNum(n) {
  return Number.isInteger(n) ? n.toLocaleString('en-US') : String(n)
}

/** @param {StepOption[] | undefined} options */
const rightOption = (options) => (options ?? []).find((o) => o.correct)

/** @param {Step | null | undefined} step */
export function correctLabel(step) {
  if (!step) return ''
  if (step.type === 'fill-blank') return (step.answers ?? []).join(', ')
  if (step.type === 'binary') return step.correct ?? ''
  if (step.type === 'mcq' || step.type === 'recall' || step.type === 'predict') {
    return (rightOption(step.options)?.text ?? '').replace(/\*/g, '')
  }
  if (step.type === 'number') return `${formatNum(step.answer ?? 0)}${step.unit ? ` ${step.unit}` : ''}`
  if (step.type === 'sort') return 'see the marks beside each item'
  return ''
}

/**
 * Is the answer right? `null` when the step has no right answer (an open
 * prediction), so the lesson can reveal without judging.
 * @param {Step | null | undefined} step
 * @param {Answer} [answer]
 * @returns {boolean|null}
 */
export function isAnswerCorrect(step, answer = EMPTY_ANSWER) {
  if (!step) return false
  const { filled = [], selected = null, assign = {}, value = '' } = answer
  const options = step.options ?? []
  switch (step.type) {
    case 'fill-blank':
      return (step.answers ?? []).every((a, i) => (filled[i] ?? '').toLowerCase() === a.toLowerCase())
    case 'binary':
      return selected === step.correct
    case 'mcq':
    case 'recall':
      return options.find((o) => o.id === selected)?.correct === true
    case 'predict':
      if (!rightOption(options)) return null
      return options.find((o) => o.id === selected)?.correct === true
    case 'sort':
      return (step.items ?? []).every((it) => assign[it.id] === it.bin)
    case 'number': {
      const v = parseNumber(value)
      if (v === null) return false
      return Math.abs(v - (step.answer ?? 0)) <= (step.tolerance ?? 0)
    }
    default:
      return true
  }
}

/** @param {Step | null | undefined} step @param {Answer} [answer] */
export function canCheckStep(step, answer = EMPTY_ANSWER) {
  if (!step) return false
  const { filled = [], selected = null, confidence = null, assign = {}, value = '' } = answer
  switch (step.type) {
    case 'fill-blank': return filled.filter(Boolean).length === (step.answers ?? []).length
    case 'predict': return selected !== null && confidence !== null
    case 'sort': return (step.items ?? []).every((it) => assign[it.id])
    case 'number': return parseNumber(value) !== null
    default: return selected !== null
  }
}

/** For Continue steps: may the learner move on yet?
 * @param {Step | null | undefined} step @param {Answer} [answer] */
export function canContinue(step, answer = EMPTY_ANSWER) {
  if (!step) return false
  const fields = answer.fields ?? {}
  switch (step.type) {
    case 'sim': return !step.goal || Boolean(answer.done)
    case 'reflect': return (answer.text ?? '').trim().length >= (step.min ?? 12)
    case 'compose': return (step.fields ?? []).every((f) => (fields[f.id] ?? '').trim().length >= (f.min ?? 8))
    default: return true
  }
}

/** The text a compose step saves to the journal.
 * @param {Step} step @param {Answer} answer */
export function composeText(step, answer) {
  const fields = answer.fields ?? {}
  return (step.fields ?? []).map((f) => `${f.label}: ${(fields[f.id] ?? '').trim()}`).join('\n')
}
