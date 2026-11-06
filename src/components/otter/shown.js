/* ═══════════════════════════════════════════════════════════════════════════
   shown.js — WHETHER THE OTTER IS ON THE SITE
   ---------------------------------------------------------------------------
   The otter (drawing, engine, acts, scenes, lesson reactions) is kept whole
   but is not on the site yet: every place that mounts one checks this flag
   first. Setting it to true puts the otter back everywhere it was — the
   landing page's scenes, the Your Progress card, a lesson's answer bar and
   its finish screen, and the peek over a product frame. The lab at
   /otter-lab.html ignores it.
   ═══════════════════════════════════════════════════════════════════════════ */

export const OTTER_SHOWN = false
