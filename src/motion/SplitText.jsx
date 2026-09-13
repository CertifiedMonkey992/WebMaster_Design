/* ═══════════════════════════════════════════════════════════════════════════
   SplitText.jsx — A HEADING THAT ASSEMBLES ITSELF
   ---------------------------------------------------------------------------
   Splits text into words, each rising out of its own mask with a small
   rotation that resolves to zero — type being set, not type fading in.

   It walks React children rather than taking a string, so an <em className=
   "em"> or a <br /> inside the heading survives intact and its words join
   the same stagger. Word count carries across nested elements, so the clay
   phrase lands in sequence with the words around it.

   The real text stays in the DOM in reading order; screen readers read the
   heading normally. Under reduced motion it renders already assembled.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Children, Fragment, cloneElement, isValidElement } from 'react'
import useInView from './useInView'

function splitNode(node, counter) {
  if (typeof node === 'string' || typeof node === 'number') {
    const parts = String(node).split(/(\s+)/)
    return parts.map((part, i) => {
      if (!part) return null
      if (/^\s+$/.test(part)) return part
      const index = counter.n++
      return (
        <span className="st-w" key={`w${index}-${i}`}>
          <span className="st-i" style={{ '--i': index }}>{part}</span>
        </span>
      )
    })
  }

  if (isValidElement(node)) {
    if (node.type === 'br' || node.props?.['data-st-skip']) return node
    if (node.type === Fragment) {
      return Children.map(node.props.children, (child) => splitNode(child, counter))
    }
    /* A component that renders its own motion (RollingNumber) is kept whole
       and treated as one word. */
    if (typeof node.type !== 'string' || node.props?.['data-st-whole']) {
      const index = counter.n++
      return (
        <span className="st-w" key={`c${index}`}>
          <span className="st-i" style={{ '--i': index }}>{node}</span>
        </span>
      )
    }
    const kids = Children.map(node.props.children, (child) => splitNode(child, counter))
    return cloneElement(node, undefined, kids)
  }

  if (Array.isArray(node)) return node.map((child) => splitNode(child, counter))
  return node
}

export default function SplitText({
  as: Tag = 'span',
  children,
  className = '',
  immediate = false,
  delay = 0,
  stagger,
  ...rest
}) {
  const [ref, inView] = useInView({ immediate, threshold: 0.3 })
  const counter = { n: 0 }
  const content = Children.map(children, (child) => splitNode(child, counter))

  const style = {
    ...(rest.style || {}),
    '--st-delay': `${delay}ms`,
    ...(stagger != null ? { '--st-stagger': `${stagger}ms` } : null),
  }

  return (
    <Tag
      {...rest}
      ref={ref}
      style={style}
      className={`st ${inView ? 'is-in' : ''} ${className}`.trim()}
    >
      {content}
    </Tag>
  )
}
