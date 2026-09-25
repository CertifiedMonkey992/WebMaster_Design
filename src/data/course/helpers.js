/* ═══════════════════════════════════════════════════════════════════════════
   course/helpers.js — HOW LESSON CONTENT IS WRITTEN
   ---------------------------------------------------------------------------
   Short constructors so a lesson file reads like a lesson rather than like
   JSON. Options are plain strings; the right one starts with "✓ ".

     part(id, label, steps, { graded })   a lesson part (a tab)
     read(id, title, body, extra)         an explanation card
     predict(id, prompt, options, reveal) a prediction, with a confidence row
     recall(id, prompt, options, why)     a question from an earlier lesson
     mcq(id, prompt, options, why)        a question (graded in a graded part)
     sort(id, prompt, bins, items, why)   put each item in a bin
     number(id, prompt, answer, extra)    a figure, checked within a tolerance
     sim(id, name, extra)                 a simulation (components/learn/sims)
     transcript(id, title, messages)      an illustrative exchange
     reflect(id, prompt, extra)           a Field Journal entry
     compose(id, title, fields, extra)    several labelled fields, one entry
   ═══════════════════════════════════════════════════════════════════════════ */

export const opts = (...list) => list.map((t, i) => {
  const correct = t.startsWith('✓ ')
  return { id: 'abcdefgh'[i], text: correct ? t.slice(2) : t, ...(correct ? { correct: true } : {}) }
})

export const part = (id, label, steps, extra = {}) => ({ id, label, steps, ...extra })
export const read = (id, title, body, extra = {}) => ({ id, type: 'read', title, body, ...extra })
export const predict = (id, prompt, options, reveal, extra = {}) => ({ id, type: 'predict', prompt, options: opts(...options), reveal, ...extra })
export const recall = (id, prompt, options, why, extra = {}) => ({ id, type: 'recall', prompt, options: opts(...options), why, ...extra })
export const mcq = (id, prompt, options, why, extra = {}) => ({ id, type: 'mcq', prompt, options: opts(...options), why, ...extra })
export const sort = (id, prompt, bins, items, why, extra = {}) => ({
  id,
  type: 'sort',
  prompt,
  bins: bins.map(([bid, label]) => ({ id: bid, label })),
  items: items.map(([text, bin, note], i) => ({ id: `i${i}`, text, bin, note })),
  why,
  ...extra,
})
export const number = (id, prompt, answer, extra = {}) => ({ id, type: 'number', prompt, answer, ...extra })
export const sim = (id, name, extra = {}) => ({ id, type: 'sim', sim: name, ...extra })
export const transcript = (id, title, messages, extra = {}) => ({
  id,
  type: 'transcript',
  title,
  messages: messages.map(([role, text, note, who]) => ({ role, text, note, who })),
  ...extra,
})
export const reflect = (id, prompt, extra = {}) => ({ id, type: 'reflect', prompt, ...extra })
export const compose = (id, title, fields, extra = {}) => ({
  id,
  type: 'compose',
  title,
  fields: fields.map(([fid, label, hint, min]) => ({ id: fid, label, hint, ...(min ? { min } : {}) })),
  ...extra,
})

/** The three parts every lesson has. */
export const lessonParts = (explore, explain, check) => [
  part('explore', 'Predict & explore', explore),
  part('explain', 'Explain & apply', explain),
  part('check', 'Check', check, { graded: true }),
]
