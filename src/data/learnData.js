/* ═══════════════════════════════════════════════════════════════════════════
   learnData.js — COURSE CONTENT + DERIVED COURSE STATE
   ---------------------------------------------------------------------------
   The curriculum itself is static content. Lesson STATUS is not stored here —
   it is derived from the learner's real progression state so the course map
   can never drift out of sync with XP, quests and statistics.

   deriveCourse(completedLessons) → sections with live status, plus the
   current lesson pointer and aggregate counts.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SECTIONS = [
  {
    id: 'ai-foundations',
    level: 'Beginner',
    title: 'AI Foundations',
    subtitle: 'Understand what AI actually is',
    description: 'Build your understanding of what artificial intelligence is, how it works, and where you encounter it every day.',
    moduleTheme: 'green',
    lessons: [
      { id: 'what-is-ai',    title: 'What is Artificial Intelligence?', desc: 'Explore the definition, history, and core ideas behind AI systems.', duration: '5 min' },
      { id: 'types-of-ai',   title: 'Types of AI Systems',              desc: 'Narrow AI, General AI, and Superintelligence — what exists today.', duration: '5 min' },
      { id: 'how-ai-learns', title: 'How AI Systems Learn',             desc: 'Training loops, optimization, and iterative model improvement.', duration: '6 min' },
      { id: 'ai-everyday',   title: 'AI in Everyday Life',              desc: 'Spot AI in recommendations, maps, search, and content feeds.', duration: '4 min' },
    ],
  },
  {
    id: 'machine-learning',
    level: 'Beginner',
    title: 'Machine Learning',
    subtitle: 'Data-driven intelligence explained',
    description: 'Learn how computers find patterns in data and make predictions without being explicitly programmed.',
    moduleTheme: 'blue',
    lessons: [
      { id: 'what-is-ml',    title: 'What is Machine Learning?', desc: 'The core idea: computers learning from examples rather than rules.', duration: '5 min' },
      { id: 'training-data', title: 'Training Data & Datasets',  desc: 'Why data quality and diversity shape everything a model learns.', duration: '6 min' },
      { id: 'supervised',    title: 'Supervised Learning',       desc: 'Labeled inputs, predicted outputs, and real-world applications.', duration: '7 min' },
      { id: 'model-eval',    title: 'Model Evaluation',          desc: 'Accuracy, precision, recall — and why each metric matters.', duration: '5 min' },
    ],
  },
  {
    id: 'neural-networks',
    level: 'Intermediate',
    title: 'Neural Networks',
    subtitle: 'Inside the architecture of modern AI',
    description: 'Dive into the building blocks of deep learning — neurons, layers, and the algorithms that train them.',
    moduleTheme: 'purple',
    lessons: [
      { id: 'perceptron',    title: 'The Perceptron',      desc: 'The original artificial neuron — weights, bias, and a single decision.', duration: '6 min' },
      { id: 'hidden-layers', title: 'Hidden Layers',       desc: 'Stacking neurons to learn complex, non-linear representations.', duration: '7 min' },
      { id: 'activation',    title: 'Activation Functions', desc: 'ReLU, sigmoid, tanh — how neurons decide when to fire.', duration: '6 min' },
      { id: 'backprop',      title: 'Backpropagation',      desc: 'The algorithm that actually trains neural networks via gradient descent.', duration: '8 min' },
      { id: 'cnn-rnn',       title: 'CNNs & RNNs',          desc: 'Specialized architectures built for images and sequential data.', duration: '7 min' },
    ],
  },
  {
    id: 'practical-tools',
    level: 'Intermediate',
    title: 'Practical AI Tools',
    subtitle: 'Master the tools reshaping every industry',
    description: 'Get hands-on with the AI tools that are transforming how we write, code, create, and communicate.',
    moduleTheme: 'blue',
    lessons: [
      { id: 'prompt-eng',    title: 'Prompt Engineering', desc: 'Write prompts that consistently get the results you actually need.', duration: '8 min' },
      { id: 'chatgpt',       title: 'ChatGPT Deep Dive',  desc: 'Capabilities, real limits, and the best use cases for GPT-4.', duration: '7 min' },
      { id: 'claude-gemini', title: 'Claude & Gemini',    desc: 'Compare leading LLMs and understand when to use each.', duration: '6 min' },
      { id: 'image-gen',     title: 'AI Image Generation', desc: 'Midjourney, DALL-E, and Stable Diffusion explored end-to-end.', duration: '8 min' },
      { id: 'copilot',       title: 'GitHub Copilot',      desc: 'AI pair programming for faster, more thoughtful code.', duration: '7 min' },
    ],
  },
  {
    id: 'ai-ethics',
    level: 'Advanced',
    title: 'AI Ethics',
    subtitle: 'Navigate AI responsibly in every context',
    description: 'Explore the social impact, biases, and ethical challenges that come with deploying AI at scale.',
    moduleTheme: 'purple',
    lessons: [
      { id: 'bias',        title: 'Algorithmic Bias',           desc: 'How AI systems learn, reflect, and amplify human prejudices.', duration: '6 min' },
      { id: 'deepfakes',   title: 'Deepfakes & Misinformation', desc: 'Synthetic media and the emerging crisis of trust online.', duration: '7 min' },
      { id: 'privacy',     title: 'Privacy & Consent',          desc: 'Your data, how it is collected and used, and your rights.', duration: '5 min' },
      { id: 'responsible', title: 'Responsible AI Use',         desc: 'Practical frameworks for ethical decision-making with AI.', duration: '6 min' },
    ],
  },
]

/** Flat, ordered list of every lesson with its section attached. */
export const ALL_LESSONS = SECTIONS.flatMap((section, si) =>
  section.lessons.map((lesson, li) => ({
    ...lesson,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIndex: si,
    lessonIndex: li,
  })),
)

export const TOTAL_LESSONS = ALL_LESSONS.length
export const TOTAL_SECTIONS = SECTIONS.length

export function getLessonById(lessonId) {
  return ALL_LESSONS.find((l) => l.id === lessonId) ?? null
}

export function getSectionById(sectionId) {
  return SECTIONS.find((s) => s.id === sectionId) ?? null
}

/** All lesson ids belonging to a section. */
export function getSectionLessonIds(sectionId) {
  return getSectionById(sectionId)?.lessons.map((l) => l.id) ?? []
}

/**
 * Derive the whole course view from the set of completed lesson ids.
 *
 * Rules:
 *   • a lesson is `completed` when its id is in completedLessons
 *   • the first not-completed lesson of the first unlocked section is `current`
 *   • everything after that inside an unlocked section is `available`
 *     (reachable, but not the recommended next step)
 *   • a section unlocks when every lesson of the previous section is done
 *
 * @param {Set<string>|object} completedLessons  Set, array or map keyed by id
 */
export function deriveCourse(completedLessons) {
  const done = toSet(completedLessons)

  let currentFound = false
  let previousSectionComplete = true
  let completedCount = 0
  let completedSections = 0

  const sections = SECTIONS.map((section) => {
    const unlocked = previousSectionComplete
    const lessons = section.lessons.map((lesson) => {
      const isDone = done.has(lesson.id)
      if (isDone) completedCount++
      let status
      if (isDone) status = 'completed'
      else if (!unlocked) status = 'locked'
      else if (!currentFound) { status = 'current'; currentFound = true }
      else status = 'available'
      return { ...lesson, status, sectionId: section.id }
    })

    const completed = lessons.filter((l) => l.status === 'completed').length
    const total = lessons.length
    const sectionComplete = completed === total
    if (sectionComplete) completedSections++

    const status = !unlocked ? 'locked'
      : sectionComplete ? 'completed'
      : completed > 0 || lessons.some((l) => l.status === 'current') ? 'in-progress'
      : 'in-progress'

    previousSectionComplete = sectionComplete

    return {
      ...section,
      lessons,
      status,
      unlocked,
      completed,
      total,
      pct: total ? Math.round((completed / total) * 100) : 0,
      totalDuration: lessons.reduce((sum, l) => sum + (parseInt(l.duration, 10) || 5), 0),
    }
  })

  /* The recommended next lesson, with its section context. */
  let current = null
  for (const section of sections) {
    const idx = section.lessons.findIndex((l) => l.status === 'current')
    if (idx !== -1) {
      current = { section, lesson: section.lessons[idx], lessonIndex: idx }
      break
    }
  }

  const activeSection = sections.find((s) => s.status === 'in-progress' && s.unlocked) ?? null

  return {
    sections,
    current,
    completedCount,
    totalLessons: TOTAL_LESSONS,
    completedSections,
    totalSections: TOTAL_SECTIONS,
    lessonsRemaining: TOTAL_LESSONS - completedCount,
    sectionsRemaining: TOTAL_SECTIONS - completedSections,
    lessonsLeftInCurrentSection: activeSection ? activeSection.total - activeSection.completed : 0,
    /** Lessons the learner is allowed to open right now. */
    playableLessonIds: sections
      .filter((s) => s.unlocked)
      .flatMap((s) => s.lessons.map((l) => l.id)),
  }
}

/** Accepts a Set, an array of ids, or a map keyed by lesson id. */
function toSet(completedLessons) {
  if (!completedLessons) return new Set()
  if (completedLessons instanceof Set) return completedLessons
  if (Array.isArray(completedLessons)) return new Set(completedLessons)
  return new Set(Object.keys(completedLessons))
}

/** Progress numbers for one derived section (kept for backwards compatibility
 *  with components that received a raw section). */
export function getSectionProgress(section) {
  const lessons = section.lessons ?? []
  const completed = lessons.filter((l) => l.status === 'completed').length
  const total = lessons.length
  const totalDuration = lessons.reduce((sum, l) => sum + (parseInt(l.duration, 10) || 5), 0)
  return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0, totalDuration }
}
