/* ═══════════════════════════════════════════════════════════════════════════
   ProductFrame.jsx — HOW REAL PRODUCT UI IS PRESENTED ON THE DARK PAGE
   ---------------------------------------------------------------------------
   A thin window frame and a shadow. Nothing inside is redrawn for marketing:
   the children are the app's own components, mounted through
   ProgressionShowcase, so what a visitor sees on this page is what they get
   when they open the product.

   The frame's only real job is theming. The landing page is dark and the app
   is light, so the light tokens are pinned here rather than inherited — which
   is also what keeps the panel looking like a screenshot of another surface
   instead of a widget that bled into the page.

   `maxHeight` crops a tall surface (the course map runs the full page) behind
   a fade. Cropping is allowed; altering what is inside is not.
   ═══════════════════════════════════════════════════════════════════════════ */

import './showcase.css'

export default function ProductFrame({
  path,
  caption,
  maxHeight,
  align = 'left',
  children,
}) {
  return (
    <figure className={`pf${align === 'right' ? ' pf--right' : ''}`}>
      <div className="pf-chrome" aria-hidden="true">
        <span className="pf-dots"><i /><i /><i /></span>
        {path && <span className="pf-path">{path}</span>}
      </div>

      <div
        className={`pf-body${maxHeight ? ' is-cropped' : ''}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>

      {caption && <figcaption className="pf-caption">{caption}</figcaption>}
    </figure>
  )
}
