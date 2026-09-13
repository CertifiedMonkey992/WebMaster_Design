/* ═══════════════════════════════════════════════════════════════════════════
   Reveal.jsx — ARRIVAL, ONCE
   ---------------------------------------------------------------------------
   <Reveal variant="up" stagger> wraps content that should arrive the first
   time it is seen. With `stagger`, each direct child gets its own --i so the
   children arrive in sequence at --stagger apart.

   Variants are named for what they depict, not for their transform:
     up      the default — rises 18px into place
     fade    no travel, for text inside something that already moved
     left    slides in from the leading edge (lists, rails)
     right   slides in from the trailing edge (the companion column)
     scale   settles from 0.94 (tiles, badges)
     tilt    rises out of a backward tilt (a screen being stood up)
   ═══════════════════════════════════════════════════════════════════════════ */

import { Children, cloneElement, isValidElement } from 'react'
import useInView from './useInView'

export default function Reveal({
  as: Tag = 'div',
  variant = 'up',
  stagger = false,
  immediate = false,
  delay = 0,
  threshold,
  className = '',
  children,
  style,
  ...rest
}) {
  const [ref, inView] = useInView({ immediate, threshold })

  let index = 0
  const content = stagger
    ? Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        const i = index++
        return cloneElement(child, {
          style: { ...(child.props.style || {}), '--i': i },
          className: `${child.props.className || ''} rv-item`.trim(),
        })
      })
    : children

  return (
    <Tag
      {...rest}
      ref={ref}
      style={{ ...(style || {}), '--rv-delay': `${delay}ms` }}
      className={`rv rv--${variant}${stagger ? ' rv--stagger' : ''}${inView ? ' is-in' : ''} ${className}`.trim()}
    >
      {content}
    </Tag>
  )
}
