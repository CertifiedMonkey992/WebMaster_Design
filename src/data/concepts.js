/* ═══════════════════════════════════════════════════════════════════════════
   concepts.js — WHAT EACH QUESTION TESTS
   ---------------------------------------------------------------------------
   Practice reviews CONCEPTS, not just questions. Every gradable step in the
   course (193 of them: every multiple-choice question, sort and number field,
   in Learn, Check, Case File, project and capstone parts) is mapped here to
   the one idea it tests, so a learner who misses "overfitting" can be asked
   a different question about overfitting rather than the same one again.

   A concept names the lesson it is taught in and, where the lesson has one,
   the explanation card (`item:part:card`) that teaches it. When a learner
   misses a concept in Practice, that card is quoted back as "The idea" — the
   course's own words, never a new explanation written for the occasion.

   Keys are the same `item:part:step` keys the lesson uses for review
   (lessonContent.js → reviewKeyOf), so a question renamed in a module file
   must be renamed here too. The self-check suite fails if any key here does
   not exist in the content, or any gradable step is missing from this map.
   ═══════════════════════════════════════════════════════════════════════════ */

import { getLessonById, getSectionById } from './learnData'

/** @type {Record<string, { label: string, lesson: string, card: string | null }>} */
export const CONCEPTS = {
  /* ── Module 1 · How Machines Learn ─────────────────────────────────── */
  'rules-learned-generative': { label: 'Rules, learning and generation', lesson: 'm01-l01', card: 'm01-l01:learn:ways' },
  'objectives-proxies':       { label: 'Objectives and proxies',          lesson: 'm01-l01', card: 'm01-l01:learn:objective' },
  'feedback-loops':           { label: 'Feedback loops',                  lesson: 'm01-l01', card: 'm01-l01:learn:objective' },
  'specification-gaming':     { label: 'Specification gaming',            lesson: 'm01-l01', card: 'm01-l01:learn:gaming' },
  'supervised-learning':      { label: 'Learning from labelled examples', lesson: 'm01-l02', card: 'm01-l02:learn:supervised' },
  'shortcuts':                { label: 'Shortcuts in the data',           lesson: 'm01-l02', card: 'm01-l02:learn:four' },
  'data-gaps':                { label: 'Gaps in the data',                lesson: 'm01-l02', card: 'm01-l02:learn:four' },
  'data-poisoning':           { label: 'Data poisoning',                  lesson: 'm01-l02', card: 'm01-l02:learn:four' },
  'bias-from-data':           { label: 'Bias that starts in the data',    lesson: 'm01-l02', card: 'm01-l02:learn:four' },
  'fixing-data':              { label: 'Fixing data with counter-examples', lesson: 'm01-l02', card: 'm01-l02:learn:fix' },
  'held-out-testing':         { label: 'Testing on data it never saw',    lesson: 'm01-l03', card: 'm01-l03:learn:heldout' },
  'overfitting':              { label: 'Overfitting',                     lesson: 'm01-l03', card: 'm01-l03:learn:heldout' },
  'accuracy-trap':            { label: 'When “accurate” misleads',        lesson: 'm01-l03', card: 'm01-l03:learn:two-mistakes' },
  'error-types':              { label: 'Two kinds of mistakes and thresholds', lesson: 'm01-l03', card: 'm01-l03:learn:two-mistakes' },

  /* ── Module 2 · Inside a Neural Network ────────────────────────────── */
  'neurons':                  { label: 'A neuron is a weighted vote',     lesson: 'm02-l01', card: 'm02-l01:learn:neuron' },
  'activation-layers':        { label: 'Layers and activation',           lesson: 'm02-l01', card: 'm02-l01:learn:layers' },
  'parameters':               { label: 'Parameters are learned',          lesson: 'm02-l01', card: 'm02-l01:learn:neuron' },
  'loss':                     { label: 'Loss measures error',             lesson: 'm02-l02', card: 'm02-l02:learn:loss' },
  'gradient-descent':         { label: 'Gradient descent',                lesson: 'm02-l02', card: 'm02-l02:learn:loss' },
  'learning-rate':            { label: 'The learning rate',               lesson: 'm02-l02', card: 'm02-l02:learn:lr' },
  'backpropagation':          { label: 'Backpropagation',                 lesson: 'm02-l02', card: 'm02-l02:learn:bp' },
  'weights-and-memory':       { label: 'Using a model doesn’t retrain it', lesson: 'm02-l02', card: null },
  'learned-features':         { label: 'Learned features',                lesson: 'm02-l03', card: 'm02-l03:learn:features' },
  'adversarial-examples':     { label: 'Adversarial examples',            lesson: 'm02-l03', card: 'm02-l03:learn:adversarial' },

  /* ── Module 3 · How Generative AI Works ────────────────────────────── */
  'next-token':               { label: 'Next-token prediction',           lesson: 'm03-l01', card: 'm03-l01:learn:tokens' },
  'temperature':              { label: 'Temperature and sampling',        lesson: 'm03-l01', card: 'm03-l01:learn:temperature' },
  'tokens':                   { label: 'Tokens are word pieces',          lesson: 'm03-l01', card: 'm03-l01:learn:tokens' },
  'context-window':           { label: 'The context window',              lesson: 'm03-l01', card: 'm03-l01:learn:window' },
  'embeddings':               { label: 'Embeddings: meaning as position', lesson: 'm03-l02', card: 'm03-l02:learn:embeddings' },
  'learned-associations':     { label: 'Stereotypes learned from data',   lesson: 'm03-l02', card: 'm03-l02:learn:geometry' },
  'diffusion':                { label: 'Images made from noise',          lesson: 'm03-l02', card: 'm03-l02:learn:diffusion' },
  'spotting-ai-media':        { label: 'Spotting AI-made media',          lesson: 'm03-l02', card: 'm03-l02:learn:diffusion' },
  'assistant-training':       { label: 'From autocomplete to assistant',  lesson: 'm03-l03', card: 'm03-l03:learn:stages' },
  'system-prompts':           { label: 'System prompts and saved notes',  lesson: 'm03-l03', card: 'm03-l03:learn:stages' },
  'sycophancy':               { label: 'Sycophancy',                      lesson: 'm03-l03', card: 'm03-l03:learn:syco' },
  'hallucination':            { label: 'Hallucinations and invented sources', lesson: 'm03-l03', card: 'm03-l03:learn:hallucination' },
  'anthropomorphism':         { label: 'Treating a chatbot as a person',  lesson: 'm06-l04', card: 'm06-l04:learn:objectives' },

  /* ── Module 4 · Working With AI ────────────────────────────────────── */
  'jagged-frontier':          { label: 'The jagged frontier',             lesson: 'm04-l01', card: 'm04-l01:learn:frontier' },
  'do-augment-automate':      { label: 'Do, augment or automate',         lesson: 'm04-l01', card: 'm04-l01:learn:three' },
  'choosing-tools':           { label: 'Choosing the right kind of tool', lesson: 'm04-l01', card: 'm04-l01:learn:tools' },
  'specification':            { label: 'Writing a clear request',         lesson: 'm04-l02', card: 'm04-l02:learn:spec' },
  'iterating':                { label: 'Fixing a weak answer',            lesson: 'm04-l02', card: 'm04-l02:learn:debug' },
  'cognitive-offloading':     { label: 'Cognitive offloading',            lesson: 'm04-l03', card: 'm04-l03:learn:offload' },
  'tutor-mode':               { label: 'Using AI as a tutor',             lesson: 'm04-l03', card: 'm04-l03:learn:tutor' },

  /* ── Module 5 · Checking AI ────────────────────────────────────────── */
  'claim-checking':           { label: 'Checking claims one by one',      lesson: 'm05-l01', card: 'm05-l01:learn:procedure' },
  'lateral-reading':          { label: 'Lateral reading and first sources', lesson: 'm05-l01', card: 'm05-l01:learn:procedure' },
  'weak-checks':              { label: 'Checks that don’t work',          lesson: 'm05-l01', card: 'm05-l01:learn:not' },
  'evaluations':              { label: 'Evaluating a system',             lesson: 'm05-l02', card: 'm05-l02:learn:evals' },
  'counterfactual-testing':   { label: 'Counterfactual and group testing', lesson: 'm05-l02', card: 'm05-l02:learn:counterfactual' },
  'agents':                   { label: 'What agents are',                 lesson: 'm05-l03', card: 'm05-l03:learn:agent' },
  'prompt-injection':         { label: 'Prompt injection',                lesson: 'm05-l03', card: 'm05-l03:learn:injection' },
  'agent-safeguards':         { label: 'Limiting what an agent can do',   lesson: 'm05-l03', card: 'm05-l03:learn:guards' },

  /* ── Module 6 · Using AI Ethically ─────────────────────────────────── */
  'disclosure':               { label: 'Saying what AI did',              lesson: 'm06-l01', card: 'm06-l01:learn:disclose' },
  'detectors':                { label: 'Why detectors can’t be proof',    lesson: 'm06-l01', card: 'm06-l01:learn:detectors' },
  'copyright':                { label: 'AI and copyright',                lesson: 'm06-l01', card: 'm06-l01:learn:detectors' },
  'proxy-bias':               { label: 'Proxies carry bias',              lesson: 'm06-l02', card: 'm06-l02:learn:proxy' },
  'fairness-definitions':     { label: 'Fairness definitions that conflict', lesson: 'm06-l02', card: 'm06-l02:learn:definitions' },
  'human-decisions':          { label: 'Who is harmed when it’s wrong',   lesson: 'm06-l02', card: 'm06-l02:learn:deciding' },
  'data-privacy':             { label: 'What happens to what you share',  lesson: 'm06-l03', card: 'm06-l03:learn:data' },
  'voice-clones':             { label: 'Voice-clone scams',               lesson: 'm06-l03', card: 'm06-l03:learn:scams' },
  'image-abuse':              { label: 'AI image abuse',                  lesson: 'm06-l03', card: 'm06-l03:learn:abuse' },
  'engagement-design':        { label: 'Companions built for engagement', lesson: 'm06-l04', card: 'm06-l04:learn:objectives' },
  'healthy-use':              { label: 'Healthy limits',                  lesson: 'm06-l04', card: 'm06-l04:learn:evidence' },

  /* ── Module 7 · Build & Shape ──────────────────────────────────────── */
  'grounding':                { label: 'Grounding a tool in sources',     lesson: 'm07-l01', card: 'm07-l01:learn:parts' },
  'model-cards':              { label: 'Model cards',                     lesson: 'm07-l01', card: 'm07-l01:learn:card' },
  'stakeholders':             { label: 'Everyone a decision reaches',     lesson: 'm07-l02', card: 'm07-l02:learn:stakeholders' },
  'accountability':           { label: 'Appeals and who sets the rules',  lesson: 'm07-l02', card: 'm07-l02:learn:stakeholders' },
  'hype-literacy':            { label: 'Hype literacy',                   lesson: 'm07-l02', card: 'm07-l02:learn:hype' },
}

/** question key (`item:part:step`) → concept id. @type {Record<string, string>} */
export const QUESTION_CONCEPTS = {
  /* Lesson 1.1 */
  'm01-l01:learn:a-sort': 'rules-learned-generative',
  'm01-l01:learn:a-proxy': 'objectives-proxies',
  'm01-l01:check:c1': 'rules-learned-generative',
  'm01-l01:check:c2': 'objectives-proxies',
  'm01-l01:check:c3': 'feedback-loops',
  'm01-l01:check:c4': 'specification-gaming',
  'm01-l01:check:c5': 'rules-learned-generative',
  /* Lesson 1.2 */
  'm01-l02:learn:a-ruler': 'shortcuts',
  'm01-l02:check:c1': 'supervised-learning',
  'm01-l02:check:c2': 'fixing-data',
  'm01-l02:check:c3': 'bias-from-data',
  'm01-l02:check:c4': 'data-poisoning',
  'm01-l02:check:c5': 'held-out-testing',
  /* Lesson 1.3 */
  'm01-l03:learn:a-cancer': 'error-types',
  'm01-l03:check:c1': 'held-out-testing',
  'm01-l03:check:c2': 'error-types',
  'm01-l03:check:c3': 'error-types',
  'm01-l03:check:c4': 'error-types',
  'm01-l03:check:c5': 'overfitting',
  /* Case File 1 */
  'm01-case:cases:k1': 'data-gaps',
  'm01-case:cases:k2': 'feedback-loops',
  'm01-case:cases:k3': 'accuracy-trap',
  'm01-case:checkpoint:q1': 'rules-learned-generative',
  'm01-case:checkpoint:q2': 'objectives-proxies',
  'm01-case:checkpoint:q3': 'data-gaps',
  'm01-case:checkpoint:q4': 'overfitting',
  'm01-case:checkpoint:q5': 'accuracy-trap',
  'm01-case:checkpoint:q6': 'fixing-data',

  /* Lesson 2.1 */
  'm02-l01:learn:a-act': 'activation-layers',
  'm02-l01:check:c1': 'neurons',
  'm02-l01:check:c2': 'activation-layers',
  'm02-l01:check:c3': 'activation-layers',
  'm02-l01:check:c4': 'parameters',
  'm02-l01:check:c5': 'parameters',
  /* Lesson 2.2 */
  'm02-l02:learn:a-bounce': 'learning-rate',
  'm02-l02:check:c1': 'loss',
  'm02-l02:check:c2': 'gradient-descent',
  'm02-l02:check:c3': 'learning-rate',
  'm02-l02:check:c4': 'backpropagation',
  'm02-l02:check:c5': 'weights-and-memory',
  /* Lesson 2.3 */
  'm02-l03:learn:a-layers': 'learned-features',
  'm02-l03:check:c1': 'learned-features',
  'm02-l03:check:c2': 'learned-features',
  'm02-l03:check:c3': 'adversarial-examples',
  'm02-l03:check:c4': 'adversarial-examples',
  'm02-l03:check:c5': 'learned-features',
  /* Case File 2 */
  'm02-case:cases:k1': 'data-gaps',
  'm02-case:cases:k2': 'adversarial-examples',
  'm02-case:cases:k3': 'parameters',
  'm02-case:checkpoint:q1': 'neurons',
  'm02-case:checkpoint:q2': 'activation-layers',
  'm02-case:checkpoint:q3': 'gradient-descent',
  'm02-case:checkpoint:q4': 'learning-rate',
  'm02-case:checkpoint:q5': 'shortcuts',
  'm02-case:checkpoint:q6': 'adversarial-examples',

  /* Lesson 3.1 */
  'm03-l01:learn:a-window': 'context-window',
  'm03-l01:check:c1': 'next-token',
  'm03-l01:check:c2': 'temperature',
  'm03-l01:check:c3': 'next-token',
  'm03-l01:check:c4': 'tokens',
  'm03-l01:check:c5': 'context-window',
  /* Lesson 3.2 */
  'm03-l02:learn:a-hands': 'spotting-ai-media',
  'm03-l02:check:c1': 'embeddings',
  'm03-l02:check:c2': 'embeddings',
  'm03-l02:check:c3': 'learned-associations',
  'm03-l02:check:c4': 'diffusion',
  'm03-l02:check:c5': 'spotting-ai-media',
  /* Lesson 3.3 */
  'm03-l03:learn:a-risk': 'hallucination',
  'm03-l03:check:c1': 'sycophancy',
  'm03-l03:check:c2': 'hallucination',
  'm03-l03:check:c3': 'system-prompts',
  'm03-l03:check:c4': 'system-prompts',
  'm03-l03:check:c5': 'hallucination',
  'm03-l03:check:c6': 'anthropomorphism',
  /* Case File 3 */
  'm03-case:cases:k1': 'hallucination',
  'm03-case:cases:k2': 'learned-associations',
  'm03-case:cases:k3': 'context-window',
  'm03-case:checkpoint:q1': 'next-token',
  'm03-case:checkpoint:q2': 'temperature',
  'm03-case:checkpoint:q3': 'embeddings',
  'm03-case:checkpoint:q4': 'sycophancy',
  'm03-case:checkpoint:q5': 'assistant-training',
  'm03-case:checkpoint:q6': 'claim-checking',
  /* Part I project */
  'p1-project:dossier:d1': 'shortcuts',
  'p1-project:dossier:d2': 'held-out-testing',
  'p1-project:dossier:d3': 'hallucination',
  'p1-project:dossier:d4': 'sycophancy',

  /* Lesson 4.1 */
  'm04-l01:learn:s-frontier': 'jagged-frontier',
  'm04-l01:learn:a-tool': 'choosing-tools',
  'm04-l01:check:c1': 'jagged-frontier',
  'm04-l01:check:c2': 'do-augment-automate',
  'm04-l01:check:c3': 'choosing-tools',
  'm04-l01:check:c4': 'do-augment-automate',
  'm04-l01:check:c5': 'do-augment-automate',
  /* Lesson 4.2 */
  'm04-l02:learn:a-diagnose': 'specification',
  'm04-l02:check:c1': 'specification',
  'm04-l02:check:c2': 'specification',
  'm04-l02:check:c3': 'iterating',
  'm04-l02:check:c4': 'specification',
  'm04-l02:check:c5': 'specification',
  /* Lesson 4.3 */
  'm04-l03:learn:p-transfer': 'tutor-mode',
  'm04-l03:check:c1': 'cognitive-offloading',
  'm04-l03:check:c2': 'cognitive-offloading',
  'm04-l03:check:c3': 'tutor-mode',
  'm04-l03:check:c4': 'cognitive-offloading',
  'm04-l03:check:c5': 'disclosure',
  /* Case File 4 */
  'm04-case:cases:k1': 'cognitive-offloading',
  'm04-case:cases:k2': 'specification',
  'm04-case:cases:k3': 'cognitive-offloading',
  'm04-case:checkpoint:q1': 'jagged-frontier',
  'm04-case:checkpoint:q2': 'do-augment-automate',
  'm04-case:checkpoint:q3': 'specification',
  'm04-case:checkpoint:q4': 'iterating',
  'm04-case:checkpoint:q5': 'tutor-mode',
  'm04-case:checkpoint:q6': 'cognitive-offloading',

  /* Lesson 5.1 */
  'm05-l01:learn:a-triage': 'claim-checking',
  'm05-l01:check:c1': 'lateral-reading',
  'm05-l01:check:c2': 'claim-checking',
  'm05-l01:check:c3': 'lateral-reading',
  'm05-l01:check:c4': 'claim-checking',
  'm05-l01:check:c5': 'weak-checks',
  /* Lesson 5.2 */
  'm05-l02:check:c1': 'evaluations',
  'm05-l02:check:c2': 'evaluations',
  'm05-l02:check:c3': 'counterfactual-testing',
  'm05-l02:check:c4': 'counterfactual-testing',
  'm05-l02:check:c5': 'evaluations',
  /* Lesson 5.3 */
  'm05-l03:learn:a-confirm': 'agent-safeguards',
  'm05-l03:check:c1': 'agents',
  'm05-l03:check:c2': 'prompt-injection',
  'm05-l03:check:c3': 'agent-safeguards',
  'm05-l03:check:c4': 'cognitive-offloading',
  'm05-l03:check:c5': 'agent-safeguards',
  /* Case File 5 */
  'm05-case:cases:k1': 'evaluations',
  'm05-case:cases:k2': 'claim-checking',
  'm05-case:cases:k3': 'agent-safeguards',
  'm05-case:checkpoint:q1': 'claim-checking',
  'm05-case:checkpoint:q2': 'claim-checking',
  'm05-case:checkpoint:q3': 'evaluations',
  'm05-case:checkpoint:q4': 'counterfactual-testing',
  'm05-case:checkpoint:q5': 'agent-safeguards',
  'm05-case:checkpoint:q6': 'lateral-reading',

  /* Lesson 6.1 */
  'm06-l01:learn:a-claim': 'disclosure',
  'm06-l01:check:c1': 'disclosure',
  'm06-l01:check:c2': 'detectors',
  'm06-l01:check:c3': 'copyright',
  'm06-l01:check:c4': 'disclosure',
  'm06-l01:check:c5': 'detectors',
  /* Lesson 6.2 */
  'm06-l02:learn:a-defs': 'fairness-definitions',
  'm06-l02:check:c1': 'proxy-bias',
  'm06-l02:check:c2': 'human-decisions',
  'm06-l02:check:c3': 'fairness-definitions',
  'm06-l02:check:c4': 'human-decisions',
  'm06-l02:check:c5': 'human-decisions',
  /* Lesson 6.3 */
  'm06-l03:learn:s-postcard': 'data-privacy',
  'm06-l03:learn:a-image': 'image-abuse',
  'm06-l03:check:c1': 'data-privacy',
  'm06-l03:check:c2': 'voice-clones',
  'm06-l03:check:c3': 'voice-clones',
  'm06-l03:check:c4': 'image-abuse',
  'm06-l03:check:c5': 'data-privacy',
  /* Lesson 6.4 */
  'm06-l04:learn:a-signs': 'healthy-use',
  'm06-l04:check:c1': 'engagement-design',
  'm06-l04:check:c2': 'anthropomorphism',
  'm06-l04:check:c3': 'healthy-use',
  'm06-l04:check:c4': 'healthy-use',
  'm06-l04:check:c5': 'healthy-use',
  /* Case File 6 */
  'm06-case:cases:k1': 'human-decisions',
  'm06-case:cases:k2': 'data-privacy',
  'm06-case:cases:k3': 'data-privacy',
  'm06-case:checkpoint:q1': 'disclosure',
  'm06-case:checkpoint:q2': 'proxy-bias',
  'm06-case:checkpoint:q3': 'fairness-definitions',
  'm06-case:checkpoint:q4': 'voice-clones',
  'm06-case:checkpoint:q5': 'image-abuse',
  'm06-case:checkpoint:q6': 'engagement-design',

  /* Lesson 7.1 */
  'm07-l01:learn:a-card': 'model-cards',
  'm07-l01:check:c1': 'grounding',
  'm07-l01:check:c2': 'prompt-injection',
  'm07-l01:check:c3': 'accountability',
  'm07-l01:check:c4': 'model-cards',
  'm07-l01:check:c5': 'prompt-injection',
  /* Lesson 7.2 */
  'm07-l02:learn:a-hype': 'hype-literacy',
  'm07-l02:check:c1': 'stakeholders',
  'm07-l02:check:c2': 'stakeholders',
  'm07-l02:check:c3': 'accountability',
  'm07-l02:check:c4': 'accountability',
  'm07-l02:check:c5': 'hype-literacy',
  /* Capstone */
  'm07-cap:investigate:i1': 'held-out-testing',
  'm07-cap:investigate:i3': 'hallucination',
  'm07-cap:investigate:i4': 'engagement-design',
  'm07-cap:investigate:i5': 'do-augment-automate',
  'm07-cap:investigate:i6': 'prompt-injection',
  'm07-cap:investigate:i8': 'data-privacy',
}

/** The concept a question tests, or null for a key this map does not know. */
export function conceptOf(key) {
  return QUESTION_CONCEPTS[key] ?? null
}

/** A concept's definition, or null. */
export function getConcept(id) {
  return CONCEPTS[id] ?? null
}

/** The course item (lesson, Case File, project, capstone) a question key belongs to. */
export function itemOfKey(key) {
  return typeof key === 'string' ? key.split(':')[0] : null
}

/** The module (section id) a question key belongs to, or null. */
export function moduleOfKey(key) {
  const item = getLessonById(itemOfKey(key))
  return item ? item.sectionId : null
}

/** The module a concept is taught in. */
export function moduleOfConcept(id) {
  const lesson = getLessonById(CONCEPTS[id]?.lesson)
  return lesson ? getSectionById(lesson.sectionId)?.id ?? null : null
}

/** Every question key that tests a concept. */
export function keysForConcept(id) {
  return Object.keys(QUESTION_CONCEPTS).filter((k) => QUESTION_CONCEPTS[k] === id)
}

export default { CONCEPTS, QUESTION_CONCEPTS, conceptOf, getConcept, itemOfKey, moduleOfKey, moduleOfConcept, keysForConcept }
