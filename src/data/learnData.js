export const SECTIONS = [
  {
    id: 'ai-foundations',
    level: 'Beginner',
    title: 'AI Foundations',
    subtitle: 'Understand what AI actually is',
    description: 'Build your understanding of what artificial intelligence is, how it works, and where you encounter it every day.',
    status: 'completed',
    moduleTheme: 'green',
    lessons: [
      { id: 'what-is-ai',    title: 'What is Artificial Intelligence?', desc: 'Explore the definition, history, and core ideas behind AI systems.', status: 'completed', duration: '5 min' },
      { id: 'types-of-ai',   title: 'Types of AI Systems',              desc: 'Narrow AI, General AI, and Superintelligence — what exists today.', status: 'completed', duration: '5 min' },
      { id: 'how-ai-learns', title: 'How AI Systems Learn',             desc: 'Training loops, optimization, and iterative model improvement.', status: 'completed', duration: '6 min' },
      { id: 'ai-everyday',   title: 'AI in Everyday Life',              desc: 'Spot AI in recommendations, maps, search, and content feeds.', status: 'completed', duration: '4 min' },
    ],
  },
  {
    id: 'machine-learning',
    level: 'Beginner',
    title: 'Machine Learning',
    subtitle: 'Data-driven intelligence explained',
    description: 'Learn how computers find patterns in data and make predictions without being explicitly programmed.',
    status: 'completed',
    moduleTheme: 'blue',
    lessons: [
      { id: 'what-is-ml',    title: 'What is Machine Learning?', desc: 'The core idea: computers learning from examples rather than rules.', status: 'completed', duration: '5 min' },
      { id: 'training-data', title: 'Training Data & Datasets',  desc: 'Why data quality and diversity shape everything a model learns.', status: 'completed', duration: '6 min' },
      { id: 'supervised',    title: 'Supervised Learning',        desc: 'Labeled inputs, predicted outputs, and real-world applications.', status: 'completed', duration: '7 min' },
      { id: 'model-eval',    title: 'Model Evaluation',           desc: 'Accuracy, precision, recall — and why each metric matters.', status: 'completed', duration: '5 min' },
    ],
  },
  {
    id: 'neural-networks',
    level: 'Intermediate',
    title: 'Neural Networks',
    subtitle: 'Inside the architecture of modern AI',
    description: 'Dive into the building blocks of deep learning — neurons, layers, and the algorithms that train them.',
    status: 'in-progress',
    moduleTheme: 'purple',
    lessons: [
      { id: 'perceptron',    title: 'The Perceptron',          desc: 'The original artificial neuron — weights, bias, and a single decision.', status: 'completed', duration: '6 min' },
      { id: 'hidden-layers', title: 'Hidden Layers',            desc: 'Stacking neurons to learn complex, non-linear representations.', status: 'completed', duration: '7 min' },
      { id: 'activation',    title: 'Activation Functions',     desc: 'ReLU, sigmoid, tanh — how neurons decide when to fire.', status: 'current', duration: '6 min' },
      { id: 'backprop',      title: 'Backpropagation',          desc: 'The algorithm that actually trains neural networks via gradient descent.', status: 'locked', duration: '8 min' },
      { id: 'cnn-rnn',       title: 'CNNs & RNNs',              desc: 'Specialized architectures built for images and sequential data.', status: 'locked', duration: '7 min' },
    ],
  },
  {
    id: 'practical-tools',
    level: 'Intermediate',
    title: 'Practical AI Tools',
    subtitle: 'Master the tools reshaping every industry',
    description: 'Get hands-on with the AI tools that are transforming how we write, code, create, and communicate.',
    status: 'locked',
    moduleTheme: 'blue',
    lessons: [
      { id: 'prompt-eng',    title: 'Prompt Engineering',       desc: 'Write prompts that consistently get the results you actually need.', status: 'locked', duration: '8 min' },
      { id: 'chatgpt',       title: 'ChatGPT Deep Dive',        desc: 'Capabilities, real limits, and the best use cases for GPT-4.', status: 'locked', duration: '7 min' },
      { id: 'claude-gemini', title: 'Claude & Gemini',          desc: 'Compare leading LLMs and understand when to use each.', status: 'locked', duration: '6 min' },
      { id: 'image-gen',     title: 'AI Image Generation',      desc: 'Midjourney, DALL-E, and Stable Diffusion explored end-to-end.', status: 'locked', duration: '8 min' },
      { id: 'copilot',       title: 'GitHub Copilot',            desc: 'AI pair programming for faster, more thoughtful code.', status: 'locked', duration: '7 min' },
    ],
  },
  {
    id: 'ai-ethics',
    level: 'Advanced',
    title: 'AI Ethics',
    subtitle: 'Navigate AI responsibly in every context',
    description: 'Explore the social impact, biases, and ethical challenges that come with deploying AI at scale.',
    status: 'locked',
    moduleTheme: 'purple',
    lessons: [
      { id: 'bias',        title: 'Algorithmic Bias',           desc: 'How AI systems learn, reflect, and amplify human prejudices.', status: 'locked', duration: '6 min' },
      { id: 'deepfakes',   title: 'Deepfakes & Misinformation', desc: 'Synthetic media and the emerging crisis of trust online.', status: 'locked', duration: '7 min' },
      { id: 'privacy',     title: 'Privacy & Consent',          desc: 'Your data, how it is collected and used, and your rights.', status: 'locked', duration: '5 min' },
      { id: 'responsible', title: 'Responsible AI Use',          desc: 'Practical frameworks for ethical decision-making with AI.', status: 'locked', duration: '6 min' },
    ],
  },
]

export function getCurrentLesson() {
  for (const section of SECTIONS) {
    const idx = section.lessons.findIndex(l => l.status === 'current')
    if (idx !== -1) return { section, lesson: section.lessons[idx], lessonIndex: idx }
  }
  return null
}

export function getSectionProgress(section) {
  const completed = section.lessons.filter(l => l.status === 'completed').length
  const total = section.lessons.length
  const totalDuration = section.lessons.reduce((sum, l) => sum + (parseInt(l.duration) || 5), 0)
  return { completed, total, pct: Math.round((completed / total) * 100), totalDuration }
}

export const DAILY_QUESTS = [
  { id: 'lessons',  label: 'Complete 2 lessons',      icon: '⚡', current: 1,  total: 2,  done: false },
  { id: 'xp',       label: 'Earn 50 XP',              icon: '🔥', current: 35, total: 50, done: false },
  { id: 'practice', label: 'Practice for 10 minutes', icon: '⏱', current: 10, total: 10, done: true  },
]

export const WEEKLY_QUEST = { label: 'Complete 10 lessons', icon: '📚', current: 6, total: 10 }
