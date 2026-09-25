/* ═══════════════════════════════════════════════════════════════════════════
   learnData.js — COURSE CONTENT + DERIVED COURSE STATE
   ---------------------------------------------------------------------------
   The curriculum itself is static content. Lesson STATUS is not stored here —
   it is derived from the learner's real progression state so the course map
   can never drift out of sync with XP, quests and statistics.

   The course (curriculum redesign, 2026-09): three Parts — the three sections
   the TSA brief requires — over seven modules. Each module gives the learner
   a role and ends by unlocking one Field Kit question set.

   A module holds ITEMS, and every item is completed through the same engine
   path (progressionService.completeLesson). An item's `kind` says what it is:

     lesson     one of the 21 lessons (Recall → Predict → Explore → Explain →
                Apply → Check → Carry forward), in three parts
     casefile   the module's mixed practice and Checkpoint
     project    a Part project (Model Autopsy, My AI Study Kit)
     capstone   the Field Investigation that closes the course

   deriveCourse(completedLessons) → sections with live status, plus the
   current item pointer and aggregate counts.
   ═══════════════════════════════════════════════════════════════════════════ */

export const ITEM_KIND = {
  LESSON: 'lesson',
  CASEFILE: 'casefile',
  PROJECT: 'project',
  CAPSTONE: 'capstone',
}

/** How each kind is named on the course map. */
export const KIND_LABEL = {
  lesson: 'Lesson',
  casefile: 'Case File',
  project: 'Part project',
  capstone: 'Capstone',
}

/* The three Parts are the three learning sections the TSA 2026–27 brief asks
   for (data/tsaEvent.js), named for what the learner can do at the end. */
export const PARTS = [
  {
    id: 'I',
    title: 'Understand AI',
    strand: 'Fundamental AI concepts',
    summary: 'Enough of the mechanism to predict how an AI system will behave before you see it.',
    modules: ['how-machines-learn', 'inside-a-neural-network', 'how-generative-ai-works'],
  },
  {
    id: 'II',
    title: 'Use AI Well',
    strand: 'Practical AI tools & techniques',
    summary: 'Deciding when to use AI, directing it, learning with it, and checking what it gives you.',
    modules: ['working-with-ai', 'checking-ai'],
  },
  {
    id: 'III',
    title: 'Use AI Responsibly',
    strand: 'Ethical AI usage',
    summary: 'The decisions evidence alone cannot make — and building something other people will rely on.',
    modules: ['using-ai-ethically', 'build-and-shape'],
  },
]

const lesson = (id, title, desc, duration) => ({ id, kind: ITEM_KIND.LESSON, title, desc, duration })

export const SECTIONS = [
  {
    id: 'how-machines-learn',
    part: 'I',
    role: 'Experimenter',
    level: 'Beginner',
    title: 'How Machines Learn',
    subtitle: 'Train a model, break it, measure it',
    question: 'Where does an AI system’s behavior come from?',
    description: 'Sort real products by how they were built and what they optimize, train a classifier in your browser until it fails, then learn to tell an honest accuracy figure from a misleading one.',
    fieldKit: {
      name: 'Objective & Data Check',
      questions: [
        'What is it optimizing, and through what stand-in measure?',
        'What data taught it — and what was missing from that data?',
        'How was it tested, and which mistakes does it make?',
      ],
    },
    lessons: [
      lesson('m01-l01', 'Spot the AI: Rules, Learning and What It Optimizes', 'Sort systems into rules, learned and generative; find the objective and proxy behind your own feed.', '14 min'),
      lesson('m01-l02', 'Train It, Break It', 'Train a real classifier in your browser, discover what it actually learned, and repair its dataset.', '16 min'),
      lesson('m01-l03', 'Is It Actually Good?', 'Held-out tests, overfitting, false positives and negatives, thresholds — and why “99% accurate” can mean useless.', '16 min'),
      { id: 'm01-case', kind: ITEM_KIND.CASEFILE, title: 'Case File 1: Objectives and Data', desc: 'Mixed scenarios, then the module Checkpoint. Passing it unlocks your first Field Kit tool.', duration: '8 min' },
    ],
  },
  {
    id: 'inside-a-neural-network',
    part: 'I',
    role: 'Mechanic',
    level: 'Beginner',
    title: 'Inside a Neural Network',
    subtitle: 'What changes inside a model when it learns',
    question: 'What actually changes inside a model when it learns?',
    description: 'Tune a single neuron by hand, watch a network learn by walking downhill on its error, and open an image network to see the features — and shortcuts — nobody programmed.',
    fieldKit: {
      name: 'Feature Check',
      questions: [
        'What could it have learned from this data, including shortcuts?',
        'What small change might fool it?',
      ],
    },
    lessons: [
      lesson('m02-l01', 'One Neuron, Then Layers', 'Hand-tune a perceptron, meet the XOR problem, and see why layers need a nonlinear bend.', '15 min'),
      lesson('m02-l02', 'Learning Downhill', 'Loss, gradient descent, learning rate and backpropagation — train a network and diagnose it from its loss curve.', '16 min'),
      lesson('m02-l03', 'What Networks See', 'Convolution filters, learned features, and the tiny changes that fool an image model.', '14 min'),
      { id: 'm02-case', kind: ITEM_KIND.CASEFILE, title: 'Case File 2: Inside the Model', desc: 'Mixed scenarios from Modules 1–2, then the Checkpoint for the Feature Check.', duration: '8 min' },
    ],
  },
  {
    id: 'how-generative-ai-works',
    part: 'I',
    role: 'Decoder',
    level: 'Intermediate',
    title: 'How Generative AI Works',
    subtitle: 'Tokens, embeddings, diffusion and assistants',
    question: 'Why does generative AI behave the way it does?',
    description: 'Out-guess a small language model word by word, map meaning as distance, watch an image come out of noise, and explain flattery and invented citations from how assistants are trained.',
    fieldKit: {
      name: 'Mechanism Lens',
      questions: [
        'What in the way it generates would produce this?',
        'Is this the plausible answer or the true one?',
        'What is in its context — and was it trained to please?',
      ],
    },
    lessons: [
      lesson('m03-l01', 'How Language Models Write', 'Tokens, next-token probabilities, temperature, attention and the context window — with a real model in your browser.', '18 min'),
      lesson('m03-l02', 'Meaning as Maps, Images from Noise', 'Embeddings, semantic search, stereotypes as geometry, and how diffusion turns noise into a picture.', '17 min'),
      lesson('m03-l03', 'From Autocomplete to Assistant', 'Instruction tuning, human feedback, system prompts, reasoning models — and why assistants flatter and fabricate.', '18 min'),
      { id: 'm03-case', kind: ITEM_KIND.CASEFILE, title: 'Case File 3: Decoding Behavior', desc: 'Mixed scenarios from all of Part I, then the Checkpoint for the Mechanism Lens.', duration: '8 min' },
      { id: 'p1-project', kind: ITEM_KIND.PROJECT, title: 'Part I Project: Model Autopsy', desc: 'Take one system, predict a specific failure, show the evidence, and explain it mechanically — without AI.', duration: '20 min' },
    ],
  },
  {
    id: 'working-with-ai',
    part: 'II',
    role: 'Collaborator',
    level: 'Intermediate',
    title: 'Working With AI',
    subtitle: 'Delegate, describe, and keep your own skills',
    question: 'When should I use AI, how do I direct it, and how do I stay capable?',
    description: 'Decide which parts of a real assignment AI should touch, turn a vague request into a specification, and use AI as a tutor instead of an answer machine.',
    fieldKit: {
      name: 'Delegation Decision',
      questions: [
        'Should AI do this part — do it, augment, or automate?',
        'How do I specify it so the output can be judged?',
        'Who checks it, and am I still learning?',
      ],
    },
    lessons: [
      lesson('m04-l01', 'Delegate or Do', 'The jagged frontier, splitting a task into parts, and the Tool Guide to what each kind of AI tool is for.', '15 min'),
      lesson('m04-l02', 'Describe It Well', 'Write a specification, diagnose a weak output by what it was missing, and iterate like debugging.', '15 min'),
      lesson('m04-l03', 'Learn With AI, Not Instead of It', 'Cognitive offloading, tutor mode vs. answer mode, and your own AI-use protocol for school.', '15 min'),
      { id: 'm04-case', kind: ITEM_KIND.CASEFILE, title: 'Case File 4: Working With AI', desc: 'Mixed scenarios from Modules 1–4, then the Checkpoint for the Delegation Decision.', duration: '8 min' },
    ],
  },
  {
    id: 'checking-ai',
    part: 'II',
    role: 'Investigator',
    level: 'Intermediate',
    title: 'Checking AI',
    subtitle: 'One answer, one system, one agent',
    question: 'How do I know whether to trust this output, this tool, or this agent?',
    description: 'Verify an answer claim by claim, run an evaluation and a counterfactual bias test on a real model, and audit an agent’s action log for the step where it was hijacked.',
    fieldKit: {
      name: 'Verify Protocol',
      questions: [
        'Which claims — and checked how?',
        'How did it do across many tests and many groups?',
        'What can it do without my confirmation?',
      ],
    },
    lessons: [
      lesson('m05-l01', 'Check the Claim', 'Split an answer into claims, read laterally, trace citations, and check an image’s provenance.', '16 min'),
      lesson('m05-l02', 'Test the System', 'Evals, rubrics, repeated runs and a counterfactual bias test on a real screening model.', '17 min'),
      lesson('m05-l03', 'When AI Takes Actions', 'Agents, permissions and prompt injection — find the hijack in an action log and design it out.', '15 min'),
      { id: 'm05-case', kind: ITEM_KIND.CASEFILE, title: 'Case File 5: Investigations', desc: 'Mixed scenarios from Modules 1–5, then the Checkpoint for the Verify Protocol.', duration: '8 min' },
      { id: 'p2-project', kind: ITEM_KIND.PROJECT, title: 'Part II Project: My AI Study Kit', desc: 'For one real class: a delegation map, a tested specification, a protocol, a mini-eval and a verification log.', duration: '20 min' },
    ],
  },
  {
    id: 'using-ai-ethically',
    part: 'III',
    role: 'Guardian',
    level: 'Advanced',
    title: 'Using AI Ethically',
    subtitle: 'Integrity, fairness, protection and relationships',
    question: 'Who could be harmed, and what do I do about it?',
    description: 'Decide what counts as your own work, choose between fairness definitions that cannot all hold, protect your data, face and voice, and recognize engineered intimacy.',
    fieldKit: {
      name: 'Harm Check',
      questions: [
        'Who could be harmed or left out?',
        'Who consented — to the data, the likeness, the use?',
        'What must be disclosed, and where does the data go?',
      ],
    },
    lessons: [
      lesson('m06-l01', 'Honest Work', 'Disclosure, citing AI, why detectors accuse honest students, and who owns what AI helped make.', '15 min'),
      lesson('m06-l02', 'Fair to Whom?', 'Compute two fairness metrics on a real screening model, watch them conflict, and choose with a reason.', '16 min'),
      lesson('m06-l03', 'Your Data, Face and Voice', 'Where typed data goes, voice-clone scams, image abuse and the law — and a verify-then-report protocol.', '15 min'),
      lesson('m06-l04', 'Companions and Persuasion', 'Engagement objectives, engineered intimacy, and how to support a friend who relies on an AI companion.', '13 min'),
      { id: 'm06-case', kind: ITEM_KIND.CASEFILE, title: 'Case File 6: Harm Checks', desc: 'Mixed scenarios from the whole course so far, then the Checkpoint for the Harm Check.', duration: '8 min' },
    ],
  },
  {
    id: 'build-and-shape',
    part: 'III',
    role: 'Builder',
    level: 'Advanced',
    title: 'Build & Shape',
    subtitle: 'Design for others, decide for everyone',
    question: 'What do I owe the people who use what I build — and who sets the rules?',
    description: 'Configure, test and red-team a grounded study tool and publish its model card; draft a school AI policy and defend it; then investigate an AI product you have never seen.',
    fieldKit: {
      name: 'Model Card',
      questions: [
        'What does it do, and for whom?',
        'Where does it fail — with evidence?',
        'Who is accountable, and who decides the rules?',
      ],
    },
    lessons: [
      lesson('m07-l01', 'Design an AI Tool', 'Build a grounded Q&A tool from real parts, red-team it for prompt injection, and write its model card.', '20 min'),
      lesson('m07-l02', 'Who Decides?', 'Stakeholders, contested costs like energy, and a school AI policy drafted, defended and revised.', '15 min'),
      { id: 'm07-cap', kind: ITEM_KIND.CAPSTONE, title: 'Capstone: Field Investigation', desc: 'An unfamiliar AI product, all seven Field Kit tools, a safeguard you design, and a defense in your own words.', duration: '35 min' },
    ],
  },
]

/** Flat, ordered list of every item with its section attached. */
export const ALL_LESSONS = SECTIONS.flatMap((section, si) =>
  section.lessons.map((lesson, li) => ({
    ...lesson,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionIndex: si,
    lessonIndex: li,
  })),
)

const isLessonKind = (item) => (item.kind ?? ITEM_KIND.LESSON) === ITEM_KIND.LESSON

/** The 21 lessons proper — the figure every "N lessons" line in the site shows. */
export const TOTAL_LESSONS = ALL_LESSONS.filter(isLessonKind).length
/** Every completable item: lessons, Case Files, Part projects and the capstone. */
export const TOTAL_ITEMS = ALL_LESSONS.length
export const TOTAL_SECTIONS = SECTIONS.length

export function getLessonById(lessonId) {
  return ALL_LESSONS.find((l) => l.id === lessonId) ?? null
}

export function getSectionById(sectionId) {
  return SECTIONS.find((s) => s.id === sectionId) ?? null
}

export function getPart(partId) {
  return PARTS.find((p) => p.id === partId) ?? null
}

/** Is this item a lesson proper (as opposed to a Case File, project or capstone)? */
export function isLesson(itemOrId) {
  const item = typeof itemOrId === 'string' ? getLessonById(itemOrId) : itemOrId
  return Boolean(item) && isLessonKind(item)
}

/** The lesson numbering a learner sees: 1.1, 1.2 … 7.2. Other kinds are unnumbered. */
export function lessonNumber(itemId) {
  const item = getLessonById(itemId)
  if (!item || !isLessonKind(item)) return null
  const section = SECTIONS[item.sectionIndex]
  const n = section.lessons.filter(isLessonKind).findIndex((l) => l.id === itemId) + 1
  return `${item.sectionIndex + 1}.${n}`
}

/**
 * Derive the whole course view from the set of completed item ids.
 *
 * Rules:
 *   • an item is `completed` when its id is in completedLessons
 *   • the first not-completed item of the first unlocked section is `current`
 *   • everything after that inside an unlocked section is `available`
 *     (reachable, but not the recommended next step)
 *   • a section unlocks when every item of the previous section is done
 *
 * `unlockAll` opens every section regardless of what came before. It is for
 * the reviewer's profile (config/judgeConfig.js), which has to reach any
 * lesson in any module without first earning its way there. Nothing else
 * changes: "current" is still the first unfinished item, and every count
 * is still the real one.
 *
 * Counts come in two sizes: `completedCount` / `totalLessons` are the 21
 * lessons proper; `completedItems` / `totalItems` include Case Files, the
 * Part projects and the capstone.
 *
 * @param {Set<string>|object} completedLessons  Set, array or map keyed by id
 * @param {{ unlockAll?: boolean }} [options]
 */
export function deriveCourse(completedLessons, { unlockAll = false } = {}) {
  const done = toSet(completedLessons)

  let currentFound = false
  let previousSectionComplete = true
  let completedItems = 0
  let completedCount = 0
  let completedSections = 0

  const sections = SECTIONS.map((section) => {
    const unlocked = unlockAll || previousSectionComplete
    const lessons = section.lessons.map((lesson) => {
      const isDone = done.has(lesson.id)
      if (isDone) {
        completedItems++
        if (isLessonKind(lesson)) completedCount++
      }
      let status
      if (isDone) status = 'completed'
      else if (!unlocked) status = 'locked'
      else if (!currentFound) { status = 'current'; currentFound = true }
      else status = 'available'
      return { ...lesson, kind: lesson.kind ?? ITEM_KIND.LESSON, status, sectionId: section.id }
    })

    const completed = lessons.filter((l) => l.status === 'completed').length
    const total = lessons.length
    const sectionComplete = completed === total
    if (sectionComplete) completedSections++

    const status = !unlocked ? 'locked' : sectionComplete ? 'completed' : 'in-progress'

    previousSectionComplete = sectionComplete

    return {
      ...section,
      lessons,
      status,
      unlocked,
      completed,
      total,
      lessonCount: lessons.filter(isLessonKind).length,
      pct: total ? Math.round((completed / total) * 100) : 0,
      totalDuration: lessons.reduce((sum, l) => sum + (parseInt(l.duration, 10) || 5), 0),
    }
  })

  /* The recommended next item, with its section context. */
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
    completedItems,
    totalItems: TOTAL_ITEMS,
    completedSections,
    totalSections: TOTAL_SECTIONS,
    /** Lessons proper still to finish — what a "complete N lessons" quest can ask for. */
    lessonsRemaining: TOTAL_LESSONS - completedCount,
    itemsRemaining: TOTAL_ITEMS - completedItems,
    sectionsRemaining: TOTAL_SECTIONS - completedSections,
    lessonsLeftInCurrentSection: activeSection ? activeSection.total - activeSection.completed : 0,
    /** Items the learner is allowed to open right now. */
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
