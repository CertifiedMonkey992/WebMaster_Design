/* ═══════════════════════════════════════════════════════════════════════════
   lessonContent.js — INTERACTIVE LESSON STEPS
   ---------------------------------------------------------------------------
   Extracted out of LessonModal so the same question bank can power both a
   graded lesson and a free practice session. `default` is the fallback deck
   used by any lesson that has no bespoke content yet.
   ═══════════════════════════════════════════════════════════════════════════ */

export const LESSON_CONTENT = {
  default: {
    title: 'What is Artificial Intelligence?',
    subtitle: 'Traditional Programming vs AI',
    gemReward: 15,
    tabs: [
      {
        id: 'lesson', label: 'Lesson',
        steps: [
          {
            id: 'l1', type: 'fill-blank',
            teaching: '🧠 Traditional programs follow rigid, hardcoded rules — like an Arduino wired to turn on an LED exactly when brightness drops below 20%.',
            template: 'Traditional software follows ________ ; AI discovers ________.',
            answers: ['hardcoded rules', 'patterns'],
            choices: ['hardcoded rules', 'patterns', 'recipes', 'sensors'],
          },
          {
            id: 'l2', type: 'binary',
            teaching: "🤖 AI doesn't need written rules — it uses a goal + historical data to discover patterns. Like learning you prefer lights at 6 PM on cloudy Tuesdays.",
            prompt: 'AI or Traditional? → "A thermostat that turns off heating if temp > 30°C"',
            correct: 'Traditional',
            options: [{ label: 'AI 🤖', value: 'AI' }, { label: 'Traditional 💻', value: 'Traditional' }],
          },
          {
            id: 'l3', type: 'fill-blank',
            teaching: '⚡ Key insight: Traditional = programmer writes every rule. AI = machine finds rules from examples all on its own.',
            template: 'Instead of a hardcoded ________ , AI uses ________ to find patterns.',
            answers: ['recipe', 'data'],
            choices: ['recipe', 'data', 'loop', 'sensor'],
          },
        ],
      },
      {
        id: 'practice', label: 'Practice',
        steps: [
          {
            id: 'p1', type: 'mcq',
            scenario: '📧 You\'re building an email spam filter. It needs to:\n(A) Always block emails from "scammer@fake.com"\n(B) Learn from 10,000 labeled emails which patterns signal spam.',
            prompt: 'Which part uses Traditional Programming?',
            options: [
              { id: 'a', text: '(A) Blocking "scammer@fake.com" — a hardcoded rule', correct: true },
              { id: 'b', text: '(B) Learning spam patterns from 10,000 emails' },
              { id: 'c', text: 'Both parts use Traditional Programming' },
              { id: 'd', text: 'Neither — email filtering is always AI' },
            ],
          },
        ],
      },
      {
        id: 'quiz', label: 'Quiz',
        steps: [
          {
            id: 'q1', type: 'mcq',
            prompt: 'What is the core difference between Traditional Programming and AI?',
            options: [
              { id: 'a', text: 'Traditional uses more data than AI' },
              { id: 'b', text: 'Traditional = hardcoded rules; AI = discovers patterns from data', correct: true },
              { id: 'c', text: 'AI always requires an internet connection' },
              { id: 'd', text: 'Traditional programming is always faster' },
            ],
          },
          {
            id: 'q2', type: 'mcq',
            prompt: 'A self-driving car identifies pedestrians by training on millions of labeled photos. This is...',
            options: [
              { id: 'a', text: 'Traditional — a rule detects shapes larger than 150px' },
              { id: 'b', text: 'AI — it learned from labeled examples', correct: true },
              { id: 'c', text: 'Neither — it only uses GPS' },
              { id: 'd', text: 'Traditional — the programmer defined all shapes' },
            ],
          },
          {
            id: 'q3', type: 'mcq',
            prompt: '🔥 Tricky! A weather app shows ☀️ when temperature > 25°C. This is...',
            options: [
              { id: 'a', text: 'AI — it analyzed historical weather patterns' },
              { id: 'b', text: 'AI — temperature data trained a model' },
              { id: 'c', text: 'Traditional — a dev hardcoded the ">25°C = sunny" rule', correct: true },
              { id: 'd', text: 'Both AI and Traditional combined' },
            ],
          },
        ],
      },
    ],
  },
}

/** Content for a lesson, falling back to the shared deck. */
export function getLessonContent(lessonId) {
  return LESSON_CONTENT[lessonId] ?? LESSON_CONTENT.default
}

/** Total number of graded steps in a lesson — used to size the XP budget. */
export function countSteps(content) {
  return content.tabs.reduce((sum, tab) => sum + tab.steps.length, 0)
}

/**
 * Build a practice deck. Practice pulls from the same question bank as the
 * lessons, preferring content the learner has already seen so review means
 * review rather than a surprise exam.
 */
export function buildPracticeDeck(completedLessonIds = [], size = 5) {
  const pool = []
  const ids = completedLessonIds.length ? completedLessonIds : ['default']

  for (const id of ids) {
    const content = getLessonContent(id)
    for (const tab of content.tabs) {
      for (const step of tab.steps) {
        /* Fill-in-the-blank needs its chips; every type is supported. */
        pool.push({ ...step, sourceLesson: id, key: `${id}:${tab.id}:${step.id}` })
      }
    }
  }

  /* De-duplicate identical steps pulled from the shared fallback deck. */
  const seen = new Set()
  const unique = pool.filter((step) => {
    const signature = step.prompt ?? step.template ?? step.id
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })

  /* Shuffle with Math.random: practice is meant to vary every session. */
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[unique[i], unique[j]] = [unique[j], unique[i]]
  }

  return unique.slice(0, Math.max(1, size))
}

export default LESSON_CONTENT
