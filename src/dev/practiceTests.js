/* ═══════════════════════════════════════════════════════════════════════════
   practiceTests.js — SELF-CHECKS FOR THE ADAPTIVE PRACTICE ENGINE
   ---------------------------------------------------------------------------
   Pure tests over services/practiceService.js and the reducer paths that use
   it, with an injected clock — the same style as progressionTests.js, run by
   `npm test` (scripts/run-tests.mjs).

   What they hold the engine to (the Practice brief, point by point):
     · a wrong answer enters the history, with the answer given
     · a missed concept comes back, and comes back as a DIFFERENT question
       on the same concept when the bank has one
     · one lucky right answer is never "mastered"
     · older material becomes due even when it was answered right
     · recommendations change when the learner practises and improves
     · a session pays by the shared rule, once, and repetition stops paying
     · the concept map matches the content exactly (drift guard)
   ═══════════════════════════════════════════════════════════════════════════ */

import * as prog from '../services/progressionService'
import * as store from '../services/storageService'
import * as P from '../services/practiceService'
import * as pxp from '../utils/practiceXp'
import * as concepts from '../data/concepts'
import * as learn from '../data/learnData'
import { PRACTICE } from '../config/progressionConfig'
import { isGradable } from '../utils/stepLogic'
import m01 from '../data/course/m01'
import m02 from '../data/course/m02'
import m03 from '../data/course/m03'
import m04 from '../data/course/m04'
import m05 from '../data/course/m05'
import m06 from '../data/course/m06'
import m07 from '../data/course/m07'

const CONTENT = { ...m01, ...m02, ...m03, ...m04, ...m05, ...m06, ...m07 }
const getContent = (id) => CONTENT[id] ?? null

/** A seeded random source, so decks are reproducible. */
function seeded(seed = 7) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export async function runPracticeTests() {
  const results = []
  const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: detail ?? '' })

  const DAY = 86400000
  const HOUR = 3600000
  const noon = new Date(); noon.setHours(12, 0, 0, 0)
  const T0 = noon.getTime()
  const A = prog.ACTIONS
  const fresh = (t = T0) => prog.reconcile(store.createDefaultState(t), t).state
  const run = (s, type, payload, t) => prog.reduce(s, { type, payload }, t)
  const attempt = (s, key, correct, t, extra = {}) => run(s, A.RECORD_ATTEMPT, { key, correct, source: 'practice', ...extra }, t).state

  const K1 = 'm01-l03:check:c5'          // overfitting
  const K1b = 'm01-case:checkpoint:q4'   // overfitting, another question
  const K2 = 'm01-l01:check:c4'          // specification gaming

  /* ── P1: recording ── */
  {
    let s = fresh()
    s = run(s, A.RECORD_ATTEMPT, { key: K1, correct: false, source: 'learn', answer: 'It is working perfectly' }, T0).state
    const item = s.practice.items[K1]
    ok('P1 an attempt is recorded on the question', item?.n === 1 && item.w === 1)
    ok('P1 and on its concept', s.practice.concepts.overfitting?.w === 1)
    ok('P1 with the answer given', item.ans === 'It is working perfectly' && s.practice.log[0].a === 'It is working perfectly')
    ok('P1 and where it came from', s.practice.log[0].src === 'learn')
    ok('P1 recording pays and costs nothing', s.xp === 0 && s.hearts === 5 && s.gems === 100)
    const junk = run(s, A.RECORD_ATTEMPT, { key: 'not:a:question', correct: true }, T0).state
    ok('P1 an unknown question key is refused', junk === s)
  }

  /* ── P2: the Leitner ladder ── */
  {
    let s = fresh()
    s = attempt(s, K2, true, T0)
    let st = s.practice.items[K2]
    ok('P2 a first right answer is box 1, due tomorrow', st.box === 1 && st.due === T0 + PRACTICE.BOX_DAYS[1] * DAY)
    s = attempt(s, K2, true, T0 + HOUR)
    st = s.practice.items[K2]
    ok('P2 answering again long before it is due does not climb', st.box === 1, st.box)
    s = attempt(s, K2, true, st.due + 1)
    st = s.practice.items[K2]
    ok('P2 an on-time review climbs a box', st.box === 2, st.box)
    s = attempt(s, K2, false, st.due + 1)
    st = s.practice.items[K2]
    ok('P2 a miss goes back to box 0, due at once', st.box === 0 && st.due === st.lastMiss)
  }

  /* ── P3: status ── */
  {
    let s = fresh()
    ok('P3 never answered is new', P.statusOf(s.practice.concepts.overfitting, T0) === 'new')
    s = attempt(s, K1, false, T0)
    ok('P3 a miss is a mistake', P.statusOf(s.practice.concepts.overfitting, T0) === 'mistake')
    s = attempt(s, K1, true, T0 + 1000)
    ok('P3 one right answer does not clear it', P.statusOf(s.practice.concepts.overfitting, T0 + 2000) === 'mistake')
    s = attempt(s, K1b, true, T0 + 3000)
    ok('P3 two in a row — even on a different question — clear it', P.statusOf(s.practice.concepts.overfitting, T0 + 4000) !== 'mistake')
    const c = s.practice.concepts.overfitting
    ok('P3 cleared is not mastered', P.statusOf(c, T0 + 4000) === 'learning', P.statusOf(c, T0 + 4000))
    ok('P3 it becomes due when its interval passes', P.statusOf(c, c.due + 1) === 'due')
  }

  /* ── P4: a lucky guess is not mastery; spaced reviews are ── */
  {
    let s = fresh()
    s = attempt(s, K2, true, T0)
    ok('P4 one right answer is not mastered', P.statusOf(s.practice.concepts['specification-gaming'], T0 + 1) === 'learning')
    let t = T0
    for (let i = 0; i < 3; i++) {
      t = s.practice.concepts['specification-gaming'].due + 1
      s = attempt(s, K2, true, t)
    }
    const c = s.practice.concepts['specification-gaming']
    ok('P4 spaced correct reviews reach mastery', c.box >= PRACTICE.MASTERED_BOX && P.statusOf(c, t + 1) === 'mastered', `box ${c.box}`)
  }

  /* ── P5: weak and older ── */
  {
    let s = fresh()
    s = attempt(s, K2, false, T0)
    s = attempt(s, K2, true, T0 + 1)
    s = attempt(s, K2, false, T0 + 2)
    ok('P5 low accuracy over enough answers is weak', P.isWeak(s.practice.concepts['specification-gaming']))
    let t = fresh()
    t = attempt(t, K1, true, T0)
    ok('P5 just practiced is not older', !P.isOlder(t.practice.concepts.overfitting, T0 + DAY))
    ok('P5 untouched for OLDER_DAYS is older', P.isOlder(t.practice.concepts.overfitting, T0 + PRACTICE.OLDER_DAYS * DAY))
    ok('P5 and a right answer from long ago is due again', P.statusOf(t.practice.concepts.overfitting, T0 + PRACTICE.OLDER_DAYS * DAY) === 'due')
  }

  /* ── P6: the bank ── */
  {
    const empty = P.studiedItems(fresh())
    ok('P6 nothing studied falls back to Lesson 1.1', empty.starter && empty.ids[0] === 'm01-l01')
    let s = run(fresh(), A.COMPLETE_LESSON, { lessonId: 'm01-l01', seconds: 60 }, T0).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'm01-l02', seconds: 60 }, T0).state
    const { ids, starter } = P.studiedItems(s)
    ok('P6 finished items are studied', !starter && ids.includes('m01-l01') && ids.includes('m01-l02'))
    const bank = P.buildBank(ids, getContent)
    ok('P6 the bank holds only studied items', bank.every((e) => ids.includes(e.itemId)) && bank.length > 0)
    ok('P6 every entry knows its concept and module', bank.every((e) => concepts.CONCEPTS[e.concept] && e.moduleId === 'how-machines-learn'))
    ok('P6 Learn questions and Check questions are both in it', bank.some((e) => e.graded) && bank.some((e) => !e.graded))
    const missedElsewhere = attempt(fresh(), 'm02-l01:check:c2', false, T0)
    ok('P6 an item with a missed answer counts as studied', P.studiedItems(missedElsewhere).ids.includes('m02-l01'))
  }

  /* ── P7: Review mistakes asks a new question on the same concept ── */
  {
    let s = run(fresh(), A.COMPLETE_LESSON, { lessonId: 'm01-l03', seconds: 60 }, T0).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'm01-l01', seconds: 60 }, T0).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'm01-l02', seconds: 60 }, T0).state
    s = run(s, A.COMPLETE_LESSON, { lessonId: 'm01-case', seconds: 60 }, T0).state
    s = run(s, A.RECORD_ANSWER, { lessonId: 'm01-l03', correct: false, maxAnswerXP: 25, reviewKey: K1, answer: 'It underfit' }, T0).state
    const bank = P.buildBank(P.studiedItems(s).ids, getContent)
    const deck = P.buildDeck({ mode: 'mistakes' }, bank, s, T0 + 60000, seeded(3))
    const onConcept = deck.filter((e) => e.concept === 'overfitting')
    ok('P7 the missed concept is in the deck', onConcept.length >= 1)
    ok('P7 with a different question on it', onConcept.some((e) => e.key !== K1), onConcept.map((e) => e.key).join(','))
    const firstOverfit = deck.findIndex((e) => e.concept === 'overfitting')
    ok('P7 the varied question comes before the original miss', deck[firstOverfit].key !== K1)
    ok('P7 a short mistakes session is topped up to a useful length', deck.length >= Math.min(PRACTICE.SESSION_SIZES[0], bank.length), deck.length)
    ok('P7 padding is labelled as related', deck.filter((e) => e.concept !== 'overfitting').every((e) => e.reason === 'related'))
    const follow = P.followUpFor({ concept: 'overfitting', key: K1 }, deck.map((e) => e.key), bank, s, T0)
    ok('P7 a follow-up is another question on the concept, or none is left', follow === null || (follow.concept === 'overfitting' && !deck.some((e) => e.key === follow.key)))
    const lonely = P.followUpFor({ concept: 'copyright', key: 'm06-l01:check:c3' }, ['m06-l01:check:c3'], bank, s, T0)
    ok('P7 no follow-up for a concept the bank has no other question on', lonely === null)
  }

  /* ── P8 + P9: topic and mixed ── */
  {
    let s = fresh()
    for (const id of ['m01-l01', 'm01-l02', 'm01-l03', 'm01-case', 'm02-l01', 'm02-l02']) {
      s = run(s, A.COMPLETE_LESSON, { lessonId: id, seconds: 60 }, T0).state
    }
    const bank = P.buildBank(P.studiedItems(s).ids, getContent)
    const topic = P.buildDeck({ mode: 'topic', topic: 'inside-a-neural-network', size: 10 }, bank, s, T0, seeded(5))
    ok('P8 a topic session stays in its module', topic.length > 0 && topic.every((e) => e.moduleId === 'inside-a-neural-network'))
    const mixed = P.buildDeck({ mode: 'mixed', size: 10 }, bank, s, T0, seeded(5))
    ok('P9 mixed practice covers every studied module', new Set(mixed.map((e) => e.moduleId)).size === 2)
    ok('P9 no question twice in a session', new Set(mixed.map((e) => e.key)).size === mixed.length)
    const perConcept = new Map()
    for (const e of mixed) perConcept.set(e.concept, (perConcept.get(e.concept) ?? 0) + 1)
    ok('P9 no concept dominates a session', [...perConcept.values()].every((n) => n <= PRACTICE.PER_CONCEPT))
    const quick = P.buildDeck({ mode: 'quick', size: 5 }, bank, s, T0, seeded(9))
    ok('P9 quick practice honours its length', quick.length === 5)
  }

  /* ── P10: a session pays by the shared rule, once ── */
  {
    let s = run(fresh(), A.COMPLETE_LESSON, { lessonId: 'm01-l01', seconds: 60 }, T0).state
    const xp0 = s.xp
    const keys = ['m01-l01:check:c1', 'm01-l01:check:c2', 'm01-l01:check:c3', 'm01-l01:check:c4', 'm01-l01:check:c5']
    keys.forEach((k, i) => { s = attempt(s, k, i !== 4, T0 + 1000 + i, { sessionId: 'sA' }) })
    const done = run(s, A.COMPLETE_PRACTICE, { sessionId: 'sA', seconds: 120, mode: 'quick' }, T0 + 10000)
    const expected = pxp.practiceSessionXp({ answered: 5, freshCorrect: 4, sessionsInWindow: 0, xpInWindow: 0 }).xp
    const paid = done.state.xp - xp0
    ok('P10 the session pays bonus + fresh answers', paid >= expected && paid <= expected + 15, `${paid} vs ${expected}`)
    const summary = done.state.practice.sessions[0]
    ok('P10 the summary is read from the recorded answers', summary.id === 'sA' && summary.total === 5 && summary.correct === 4)
    const replay = run(done.state, A.COMPLETE_PRACTICE, { sessionId: 'sA', seconds: 120 }, T0 + 20000)
    ok('P10 the same session cannot pay twice', replay.state.xp === done.state.xp && replay.events.some((e) => e.type === 'PRACTICE_DUPLICATE'))

    let t = done.state
    keys.forEach((k) => { t = attempt(t, k, true, T0 + 30000, { sessionId: 'sB' }) })
    const again = run(t, A.COMPLETE_PRACTICE, { sessionId: 'sB', seconds: 60 }, T0 + 40000)
    const stale = again.events.find((e) => e.type === 'PRACTICE_COMPLETE')
    ok('P10 answering the same questions again pays only for the one not yet paid', stale.perAnswer === 1, `perAnswer ${stale.perAnswer}`)

    let later = again.state
    keys.forEach((k) => { later = attempt(later, k, true, T0 + 21 * HOUR, { sessionId: 'sC' }) })
    const fresh21 = run(later, A.COMPLETE_PRACTICE, { sessionId: 'sC', seconds: 60 }, T0 + 21 * HOUR + 1000)
    ok('P10 after FRESH_HOURS they pay again', fresh21.events.find((e) => e.type === 'PRACTICE_COMPLETE').perAnswer === 5)
    ok('P10 a finished session counts for the streak and quests', fresh21.state.daily.practiceSessions >= 1 && fresh21.state.streak.current >= 1)
  }

  /* ── P11: the daily rule ── */
  {
    const full = pxp.practiceSessionXp({ answered: 10, freshCorrect: 10, sessionsInWindow: 0, xpInWindow: 0 })
    ok('P11 a full session pays bonus + per answer', full.xp === pxp.PRACTICE_XP.BONUS + 10 && !full.reduced && !full.capped)
    const short = pxp.practiceSessionXp({ answered: 3, freshCorrect: 3, sessionsInWindow: 0, xpInWindow: 0 })
    ok('P11 under the minimum there is no bonus', short.bonus === 0 && short.xp === 3)
    const tired = pxp.practiceSessionXp({ answered: 10, freshCorrect: 0, sessionsInWindow: pxp.PRACTICE_XP.FULL_SESSIONS, xpInWindow: 40 })
    ok('P11 after FULL_SESSIONS the bonus is reduced', tired.reduced && tired.bonus === pxp.PRACTICE_XP.REDUCED_BONUS)
    const capped = pxp.practiceSessionXp({ answered: 15, freshCorrect: 15, sessionsInWindow: 2, xpInWindow: pxp.PRACTICE_XP.DAILY_CAP - 4 })
    ok('P11 the rolling-day cap holds', capped.capped && capped.xp === 4)
    ok('P11 freshness is measured in hours', pxp.isFresh(undefined, T0) && !pxp.isFresh(T0, T0 + HOUR) && pxp.isFresh(T0, T0 + pxp.PRACTICE_XP.FRESH_HOURS * HOUR))

    let s = fresh()
    let total = 0
    for (let i = 0; i < 12; i++) {
      const r = run(s, A.COMPLETE_PRACTICE, { seconds: 60, correct: 10, total: 10, sessionId: `cap${i}` }, T0 + i * 60000)
      total += r.events.find((e) => e.type === 'PRACTICE_COMPLETE')?.xp ?? 0
      s = r.state
    }
    ok('P11 a day of farming stops at the cap', total <= pxp.PRACTICE_XP.DAILY_CAP, total)
  }

  /* ── P12: recommendations follow the history ── */
  {
    let s = fresh()
    for (const id of ['m01-l01', 'm01-l02', 'm01-l03', 'm01-case']) s = run(s, A.COMPLETE_LESSON, { lessonId: id, seconds: 60 }, T0).state
    const bankOf = (st) => P.buildBank(P.studiedItems(st).ids, getContent)
    let view = P.practiceView(s, bankOf(s), T0)
    ok('P12 with no answers yet, the recommendation is new material', view.recommendation.mode === 'mixed', view.recommendation.mode)
    s = run(s, A.RECORD_ANSWER, { lessonId: 'm01-l03', correct: false, maxAnswerXP: 25, reviewKey: K1 }, T0 + 1000).state
    view = P.practiceView(s, bankOf(s), T0 + 2000)
    ok('P12 a miss makes mistakes the recommendation', view.recommendation.mode === 'mistakes' && view.recommendation.lead.id === 'overfitting')
    ok('P12 with a reason that says so', /missed this once/.test(view.recommendation.lead.reason.text), view.recommendation.lead.reason.text)
    ok('P12 and it is first in Needs attention', view.attention[0]?.id === 'overfitting' && view.attention[0].marks.length === 1)
    s = attempt(s, K1, true, T0 + 3000)
    s = attempt(s, K1b, true, T0 + 4000)
    view = P.practiceView(s, bankOf(s), T0 + 5000)
    ok('P12 putting it right takes it off the list', view.counts.mistakes === 0 && view.recommendation.mode !== 'mistakes')
    view = P.practiceView(s, bankOf(s), T0 + 2 * DAY)
    ok('P12 two days later it is due for review', view.concepts.find((c) => c.id === 'overfitting').status === 'due')
    ok('P12 module progress is reported', view.modules[0].studied && view.modules[0].attempted >= 1 && !view.modules[1].studied)
  }

  /* ── P13: the review pile migrates, nothing lost ── */
  {
    const v2 = { ...store.createDefaultState(T0), version: 2, review: { [K1]: { lessonId: 'm01-l03', since: T0 - DAY, misses: 2 }, 'gone:x:y': { lessonId: 'gone', since: T0, misses: 1 } } }
    delete v2.practice
    const migrated = store.sanitizeState(store.migrate(JSON.parse(JSON.stringify(v2))), T0)
    ok('P13 v2 review items become mistakes in the history', migrated.practice.items[K1]?.w === 2 && P.statusOf(migrated.practice.concepts.overfitting, T0) === 'mistake')
    ok('P13 keys the course does not have are dropped', !Object.keys(migrated.practice.items).some((k) => k.startsWith('gone')))
    ok('P13 the old pile is gone', migrated.review === undefined && migrated.version === 3)
  }

  /* ── P14: a stored history is repaired, never trusted blindly ── */
  {
    let s = attempt(fresh(), K1, false, T0)
    const raw = JSON.parse(JSON.stringify(s))
    raw.practice.items['fake:key:1'] = { n: 5, c: 5, w: 0 }
    raw.practice.items[K1].n = 999
    raw.practice.concepts.nonsense = { n: 1, c: 1, w: 0 }
    raw.practice.log.push({ k: K1, ok: 'yes', at: T0 })
    raw.practice.sessions = Array.from({ length: 200 }, (_, i) => ({ id: `x${i}`, at: T0, total: 3, correct: 9 }))
    const clean = store.sanitizeState(raw, T0)
    ok('P14 unknown keys and concepts are dropped', !clean.practice.items['fake:key:1'] && !clean.practice.concepts.nonsense)
    ok('P14 counts are made consistent', clean.practice.items[K1].n === clean.practice.items[K1].c + clean.practice.items[K1].w)
    ok('P14 malformed log entries are dropped', clean.practice.log.every((e) => typeof e.ok === 'boolean'))
    ok('P14 lists are bounded and figures clamped', clean.practice.sessions.length === PRACTICE.SESSION_LIMIT && clean.practice.sessions[0].correct <= 3)
    const round = store.sanitizeState(JSON.parse(JSON.stringify(clean)), T0)
    ok('P14 the history survives a reload unchanged', JSON.stringify(round.practice) === JSON.stringify(clean.practice))
  }

  /* ── P15: the concept map matches the content exactly ── */
  {
    const keys = new Set()
    const cards = new Set()
    for (const [id, content] of Object.entries(CONTENT)) {
      for (const tab of content.tabs) {
        for (const step of tab.steps) {
          if (isGradable(step)) keys.add(`${id}:${tab.id}:${step.id}`)
          if (step.type === 'read') cards.add(`${id}:${tab.id}:${step.id}`)
        }
      }
    }
    const mapped = Object.keys(concepts.QUESTION_CONCEPTS)
    ok('P15 every gradable question has a concept', [...keys].every((k) => concepts.QUESTION_CONCEPTS[k]), [...keys].filter((k) => !concepts.QUESTION_CONCEPTS[k]).join(','))
    ok('P15 every mapped key exists in the content', mapped.every((k) => keys.has(k)), mapped.filter((k) => !keys.has(k)).join(','))
    ok('P15 every concept is defined and used', Object.keys(concepts.CONCEPTS).every((c) => mapped.some((k) => concepts.QUESTION_CONCEPTS[k] === c)))
    ok('P15 every concept card exists', Object.values(concepts.CONCEPTS).every((c) => !c.card || cards.has(c.card)))
    ok('P15 every concept names a real lesson', Object.values(concepts.CONCEPTS).every((c) => learn.getLessonById(c.lesson)))
    const idea = P.ideaFor('overfitting', getContent)
    ok('P15 "The idea" quotes the lesson\'s own card', idea && idea.title === 'Test on data it never saw' && idea.body.length > 0)
  }

  /* ── P16: a server reward is claimed once ── */
  {
    let s = fresh()
    const award = { id: 'aw_123', gems: 30, kind: 'league-promoted' }
    const first = run(s, A.CLAIM_SERVER_AWARD, award, T0)
    ok('P16 claiming pays its gems', first.state.gems === s.gems + 30)
    const second = run(first.state, A.CLAIM_SERVER_AWARD, award, T0 + 1)
    ok('P16 claiming again pays nothing', second.state.gems === first.state.gems && second.events.some((e) => e.type === 'AWARD_ALREADY_CLAIMED'))
    const restored = store.sanitizeState(JSON.parse(JSON.stringify(first.state)), T0)
    ok('P16 the claim survives a reload', restored.serverAwards.includes('aw_123'))
    ok('P16 a reward never pays XP', first.state.xp === s.xp)
  }

  const passed = results.filter((r) => r.pass).length
  const failures = results.filter((r) => !r.pass)
  return { summary: `${passed}/${results.length} passed`, passed, total: results.length, failures, results }
}

export default runPracticeTests
