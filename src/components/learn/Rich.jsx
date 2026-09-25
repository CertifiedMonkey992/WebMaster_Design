/* ═══════════════════════════════════════════════════════════════════════════
   Rich.jsx — THE LESSONS' ONE BIT OF MARKUP
   ---------------------------------------------------------------------------
   Lesson copy is data (src/data/course/), written as plain strings. Two marks
   are understood, and nothing else — no HTML ever reaches the page:

     **words**   strong: a term being defined, the one idea to hold on to
     *words*     emphasis: a stress in the sentence

   A paragraph array renders as paragraphs; a string renders inline.
   ═══════════════════════════════════════════════════════════════════════════ */

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g

export function inline(text) {
  if (typeof text !== 'string') return text
  const parts = text.split(TOKEN).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

/** Paragraphs from a string or an array of strings. */
export default function Rich({ text, className = 'st-p' }) {
  if (!text) return null
  const paras = Array.isArray(text) ? text : [text]
  return paras.map((p, i) => <p key={i} className={className}>{inline(p)}</p>)
}
