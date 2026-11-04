/* ═══════════════════════════════════════════════════════════════════════════
   LessonOtters.jsx — THE OTTER INSIDE A LESSON
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14. A lesson is where the learner
   concentrates, so here the otter only answers the learner (Reports) and
   never performs on its own: intensity `quiet`, no Stage.

     AnswerOtter     peeks over the top edge of the answer bar and reacts
                     to the verdict: a nod or a raised paw for a right
                     answer (building to a clap over a run), sympathy and
                     an encouraging nod for a wrong one, a curious look for
                     a reveal
     CompleteOtter   celebrates on the completion screen — a backflip for a
                     perfect Check, a nod for a review
   ═══════════════════════════════════════════════════════════════════════════ */

import Otter from './Otter'
import { answerReaction, completeReaction } from './reactions'

const ANSWER_MOOD = { correct: 'happy', wrong: 'sympathetic', reveal: 'curious' }

export function AnswerOtter({ phase, run = 0 }) {
  return (
    <span className="lm-otter" aria-hidden="true">
      <Otter pose="peek" mood={ANSWER_MOOD[phase] || 'happy'} intensity="quiet" cue={answerReaction(phase, run)} />
    </span>
  )
}

export function CompleteOtter({ perfect = false, replay = false }) {
  return (
    <span className="lm-complete-otter" aria-hidden="true">
      <Otter pose="stand" mood="proud" intensity="quiet" cue={completeReaction({ perfect, replay })} />
    </span>
  )
}
