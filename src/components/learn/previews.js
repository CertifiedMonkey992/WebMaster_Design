/* ═══════════════════════════════════════════════════════════════════════════
   previews.js — THE APP DEMONSTRATES ITSELF, ON THE LEARNER'S REAL DATA
   ---------------------------------------------------------------------------
   MOTION_RULES.md revision 5 → The sanctioned performances → The app.

   Inside the app the numbers are the learner's own, so nothing here changes
   one. A preview only uses Invitation, Ghost and Idle vocabulary: a quest
   row opens to say what is left, a claimable reward's gem hops toward the
   counter it will land in, an unfinished quest shows its finish as a ghost,
   a locked module shows what unlocks it. The Stage decides when; each hook
   below registers the performers of one destination and decides how.

   Every performer finds its target at the moment it runs, and only runs if
   that target is genuinely on screen — the container being visible is not
   enough.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { usePerformer } from '../../motion/stage'
import { findTarget } from '../../motion/flight'
import { ghost, inView, show, hide } from '../../motion/demo'
import { sparkle } from '../../motion/burst'
import { prefersReducedMotion } from '../../motion/env'
import { DUR, EASE } from '../../motion/timing'

const any = (list) => list[Math.floor(Math.random() * list.length)]
const visibleWithin = (root, selector, share) =>
  [...(root?.querySelectorAll(selector) ?? [])].filter((el) => inView(el, share))

/* A data attribute for `ms`, cleared early if the performance is stopped. */
async function flag(ctx, el, name, ms) {
  el.setAttribute(name, '')
  ctx.onStop(() => el.removeAttribute(name))
  await ctx.wait(ms)
  el.removeAttribute(name)
}

/* ── Learn: the course map ─────────────────────────────────────────────── */

export function useCoursePreviews(rootRef, { disabled = false } = {}) {
  /* Minor: the Continue card — its ring is drawn again to where you are,
     and its button's arrow leans on toward the lesson. */
  usePerformer(rootRef, {
    id: 'learn:continue',
    region: 'learn:continue',
    tier: 'minor',
    disabled,
    share: 0.2,
    when: () => inView(rootRef.current?.querySelector('.resume:not(.resume--done)'), 0.9),
    run: async (ctx) => {
      const card = rootRef.current?.querySelector('.resume')
      const ring = card?.querySelector('.resume-ring-fill')
      const btn = card?.querySelector('.btn')
      if (!card) return
      if (ring && !prefersReducedMotion()) {
        const to = ring.getAttribute('stroke-dashoffset')
        const from = ring.getAttribute('stroke-dasharray')
        ring.animate([{ strokeDashoffset: from }, { strokeDashoffset: to }], { duration: DUR.celebrate, easing: EASE.settle })
      }
      await ctx.wait(DUR.move)
      if (btn) await flag(ctx, btn, 'data-nudge', DUR.celebrate * 1.5)
    },
  })

  /* Minor: a locked module shows what unlocks it — its lock lifts off and
     settles, and the hint naming the module before it is underlined. */
  usePerformer(rootRef, {
    id: 'learn:locked',
    region: 'learn:modules',
    tier: 'minor',
    disabled,
    share: 0.2,
    when: () => visibleWithin(rootRef.current, '.module--locked', 0.7).length > 0,
    run: async (ctx) => {
      const mod = any(visibleWithin(rootRef.current, '.module--locked', 0.7))
      if (!mod) return
      await flag(ctx, mod, 'data-shown', 1700)
      await ctx.wait(DUR.lift)
    },
  })
}

/* ── Top bar ───────────────────────────────────────────────────────────── */

export function useTopBarPreviews(rootRef, { disabled = false } = {}) {
  const last = useRef(null)
  usePerformer(rootRef, {
    id: 'bar:accent',
    region: 'topbar',
    tier: 'accent',
    disabled,
    weight: 0.7,
    cooldown: 6000,
    share: 0.9,
    run: async (ctx) => {
      const pills = ['.pg-pill--gems', '.pg-pill--streak.is-active', '.pg-pill--hearts.is-active']
        .filter((s) => s !== last.current)
        .map((s) => [s, rootRef.current?.querySelector(s)])
        .filter(([, el]) => el)
      const pick = any(pills)
      if (!pick) return
      last.current = pick[0]
      await flag(ctx, pick[1], 'data-shown', DUR.celebrate + 200)
      await ctx.wait(DUR.move)
    },
  })
}

/* ── Sidebar: today's quests ───────────────────────────────────────────── */

export function useQuestWidgetPreviews(rootRef, getQuests) {
  /* Minor: a quest row opens — its difficulty, its reward, what is left —
     and closes again. */
  usePerformer(rootRef, {
    id: 'sidebar:quest-open',
    region: 'sidebar:quests',
    tier: 'minor',
    share: 0.5,
    when: () => visibleWithin(rootRef.current, '.qc-compact:not(.is-claimed):not(.is-claimable)', 0.9).length > 0,
    run: async (ctx) => {
      const row = any(visibleWithin(rootRef.current, '.qc-compact:not(.is-claimed):not(.is-claimable)', 0.9))
      if (!row) return
      show(row)
      ctx.onStop(() => hide(row))
      await ctx.wait(2200)
      hide(row)
      await ctx.wait(DUR.open)
    },
  })

  /* Minor: a reward waiting to be claimed — its gem hops toward the counter
     it will land in, twice, and settles back. Nothing is paid. */
  usePerformer(rootRef, {
    id: 'sidebar:quest-claim',
    region: 'sidebar:quests',
    tier: 'minor',
    share: 0.5,
    when: () => getQuests().some((q) => q.completed && !q.claimed)
      && visibleWithin(rootRef.current, '.qc-compact-claim', 0.9).length > 0,
    run: async (ctx) => {
      const btn = any(visibleWithin(rootRef.current, '.qc-compact-claim', 0.9))
      const gem = btn?.querySelector('.gi')
      if (!gem || prefersReducedMotion()) return
      const counter = findTarget('gems')
      const a = gem.getBoundingClientRect()
      const b = counter?.getBoundingClientRect()
      const dx = b ? b.left + b.width / 2 - (a.left + a.width / 2) : 0
      const dy = b ? b.top + b.height / 2 - (a.top + a.height / 2) : -40
      const len = Math.hypot(dx, dy) || 1
      const tx = (dx / len) * 10
      const ty = (dy / len) * 10 - 4
      gem.animate(
        [
          { translate: '0 0', scale: '1' },
          { translate: `${tx}px ${ty}px`, scale: '1.25', offset: 0.22 },
          { translate: '0 0', scale: '1', offset: 0.45 },
          { translate: `${tx * 0.6}px ${ty * 0.6}px`, scale: '1.15', offset: 0.62 },
          { translate: '0 0', scale: '1' },
        ],
        { duration: DUR.celebrate * 1.6, easing: EASE.out },
      )
      ctx.after(DUR.move, () => sparkle(gem, { tone: 'gem', count: 4, radius: 14, size: 7 }))
      await ctx.wait(DUR.celebrate * 1.6 + DUR.move)
    },
  })
}

/* ── Sidebar: level bar ────────────────────────────────────────────────── */

export function useLevelPreviews(rootRef, { disabled = false } = {}) {
  usePerformer(rootRef, {
    id: 'sidebar:xp',
    disabled,
    region: 'sidebar:level',
    tier: 'accent',
    weight: 0.8,
    cooldown: 7000,
    share: 0.9,
    run: async (ctx) => {
      const fill = rootRef.current?.querySelector('.lv-fill')
      if (!fill || fill.getBoundingClientRect().width < 12) return
      await flag(ctx, fill, 'data-sweep', DUR.celebrate + 100)
    },
  })
}

/* ── Quests destination: the ghost of a finish ─────────────────────────── */

export function useQuestBoardPreviews(rootRef, getQuests) {
  usePerformer(rootRef, {
    id: 'quests:ghost',
    region: 'quests:board',
    tier: 'minor',
    share: 0.2,
    when: () => visibleWithin(rootRef.current, '.qc-card:not(.is-complete)', 0.9).length > 0,
    run: async (ctx) => {
      const card = any(visibleWithin(rootRef.current, '.qc-card:not(.is-complete)', 0.9))
      const quest = getQuests().find((q) => q.id === card?.getAttribute('data-quest'))
      if (!card || !quest) return
      const pct = Math.round((quest.progress / Math.max(1, quest.target)) * 100)
      const total = ghost(card.querySelector('.qc-card-track'), {
        from: pct,
        to: 100,
        label: `Finish: +${quest.reward.gems} gems`,
        labelFrom: card.querySelector('.qc-card-reward'),
        ctx,
      })
      await ctx.wait(total)
    },
  })
}

/* ── Shop ──────────────────────────────────────────────────────────────── */

export function useShopPreviews(rootRef) {
  usePerformer(rootRef, {
    id: 'shop:item',
    region: 'shop',
    tier: 'accent',
    share: 0.2,
    when: () => visibleWithin(rootRef.current, '.sh-card:not(.is-disabled)', 0.9).length > 0,
    run: async (ctx) => {
      const card = any(visibleWithin(rootRef.current, '.sh-card:not(.is-disabled)', 0.9))
      if (!card) return
      const price = card.querySelector('.sh-price')
      if (price) show(price)
      ctx.onStop(() => hide(price))
      await flag(ctx, card, 'data-shown', 1300)
      hide(price)
      await ctx.wait(DUR.lift)
    },
  })
}

/* ── Profile: achievements ─────────────────────────────────────────────── */

export function useAchievementPreviews(rootRef, getAchievements) {
  /* Minor: the nearest locked achievement shows its finish as a ghost. */
  usePerformer(rootRef, {
    id: 'profile:near',
    region: 'profile:achievements',
    tier: 'minor',
    share: 0.2,
    when: () => visibleWithin(rootRef.current, '.ac-card:not(.is-unlocked)', 0.9).length > 0,
    run: async (ctx) => {
      const cards = visibleWithin(rootRef.current, '.ac-card:not(.is-unlocked)', 0.9)
      const data = getAchievements()
      const ranked = cards
        .map((el) => ({ el, a: data.find((x) => el.getAttribute('data-achievement') === x.id) }))
        .filter((c) => c.a)
        .sort((x, y) => y.a.percent - x.a.percent)
      const near = ranked[Math.floor(Math.random() * Math.min(2, ranked.length))]
      if (!near) return
      const total = ghost(near.el.querySelector('.ac-track'), {
        from: near.a.percent,
        to: 100,
        label: `+${near.a.gems} gems`,
        labelFrom: near.el.querySelector('.ac-reward'),
        ctx,
      })
      await ctx.wait(total)
    },
  })

  /* Accent: an earned medal catches the light. */
  usePerformer(rootRef, {
    id: 'profile:medal',
    region: 'profile:achievements',
    tier: 'accent',
    share: 0.2,
    when: () => visibleWithin(rootRef.current, '.ac-card.is-unlocked', 0.9).length > 0,
    run: async (ctx) => {
      const card = any(visibleWithin(rootRef.current, '.ac-card.is-unlocked', 0.9))
      if (!card) return
      await flag(ctx, card, 'data-shown', DUR.celebrate + 200)
    },
  })
}

/* ── About: one lesson, start to finish ────────────────────────────────── */

export function useAboutPreviews(stepsRef, strandsRef) {
  /* Minor: the three steps are walked in turn, the way a lesson runs. */
  usePerformer(stepsRef, {
    id: 'about:steps',
    region: 'about:method',
    tier: 'minor',
    cooldown: 12000,
    share: 0.7,
    run: async (ctx) => {
      const steps = [...(stepsRef.current?.querySelectorAll('.ab-step') ?? [])]
      ctx.onStop(() => steps.forEach(hide))
      for (const step of steps) {
        show(step)
        await ctx.wait(1050)
        hide(step)
      }
      await ctx.wait(DUR.open)
    },
  })

  /* Accent: light runs along the strand bar. */
  usePerformer(strandsRef, {
    id: 'about:strands',
    region: 'about:impact',
    tier: 'accent',
    cooldown: 9000,
    share: 0.8,
    run: async (ctx) => {
      const bar = strandsRef.current?.querySelector('.ab-strand-bar')
      if (!bar) return
      await flag(ctx, bar, 'data-sweep', DUR.celebrate + 200)
    },
  })
}
