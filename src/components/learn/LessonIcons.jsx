function Icon({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const ICONS = {
  'what-is-ai': (
    <Icon>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <rect x="4" y="4" width="16" height="16" rx="3"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.25" stroke="none"/>
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>
    </Icon>
  ),
  'types-of-ai': (
    <Icon>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.06" stroke="none"/>
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.3" stroke="none"/>
    </Icon>
  ),
  'how-ai-learns': (
    <Icon>
      <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <rect x="4" y="14" width="4" height="6" rx="1"/>
      <rect x="10" y="9" width="4" height="11" rx="1" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <rect x="10" y="9" width="4" height="11" rx="1"/>
      <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <rect x="16" y="4" width="4" height="16" rx="1"/>
    </Icon>
  ),
  'ai-everyday': (
    <Icon>
      <circle cx="12" cy="5" r="2.5" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <circle cx="12" cy="5" r="2.5"/>
      <circle cx="5" cy="14" r="2.5" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <circle cx="5" cy="14" r="2.5"/>
      <circle cx="19" cy="14" r="2.5" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <circle cx="19" cy="14" r="2.5"/>
      <path d="M12 7.5L5 11.5M12 7.5l7 4M5 16.5l7 3M19 16.5l-7 3" strokeWidth="1" opacity="0.3"/>
    </Icon>
  ),
  'what-is-ml': (
    <Icon>
      <path d="M4 19L20 5" strokeDasharray="3 3" opacity="0.35"/>
      <circle cx="7" cy="15" r="2" fill="currentColor" fillOpacity="0.2" stroke="none"/>
      <circle cx="7" cy="15" r="2"/>
      <circle cx="12" cy="11" r="2" fill="currentColor" fillOpacity="0.2" stroke="none"/>
      <circle cx="12" cy="11" r="2"/>
      <circle cx="17" cy="7" r="2" fill="currentColor" fillOpacity="0.2" stroke="none"/>
      <circle cx="17" cy="7" r="2"/>
    </Icon>
  ),
  'training-data': (
    <Icon>
      <rect x="3" y="4" width="18" height="4" rx="1.5" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <rect x="3" y="4" width="18" height="4" rx="1.5"/>
      <rect x="3" y="10" width="18" height="4" rx="1.5" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <rect x="3" y="10" width="18" height="4" rx="1.5"/>
      <rect x="3" y="16" width="18" height="4" rx="1.5" fill="currentColor" fillOpacity="0.05" stroke="none"/>
      <rect x="3" y="16" width="18" height="4" rx="1.5"/>
    </Icon>
  ),
  'supervised': (
    <Icon>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.06" stroke="none"/>
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    </Icon>
  ),
  'model-eval': (
    <Icon>
      <path d="M4 18a8 8 0 0 1 16 0" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M4 18a8 8 0 0 1 16 0"/>
      <path d="M12 18l3.5-6" strokeWidth="2"/>
      <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none"/>
    </Icon>
  ),
  'perceptron': (
    <Icon>
      <circle cx="15" cy="12" r="4.5" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <circle cx="15" cy="12" r="4.5"/>
      <line x1="3" y1="6" x2="10.5" y2="12"/>
      <line x1="3" y1="12" x2="10.5" y2="12"/>
      <line x1="3" y1="18" x2="10.5" y2="12"/>
      <line x1="19.5" y1="12" x2="22" y2="12" strokeWidth="2"/>
    </Icon>
  ),
  'hidden-layers': (
    <Icon>
      <circle cx="4" cy="8" r="2" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <circle cx="4" cy="16" r="2" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <circle cx="12" cy="5" r="2" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.2" stroke="none"/>
      <circle cx="12" cy="19" r="2" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <circle cx="20" cy="8" r="2" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <circle cx="20" cy="16" r="2" fill="currentColor" fillOpacity="0.15" stroke="none"/>
      <path d="M6 8l4-3M6 8l4 4M6 16l4-4M6 16l4 3M14 5l4 3M14 12l4-4M14 12l4 4M14 19l4-3" strokeWidth="0.75" opacity="0.35"/>
    </Icon>
  ),
  'activation': (
    <Icon>
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="0.75" opacity="0.2"/>
      <line x1="12" y1="3" x2="12" y2="21" strokeWidth="0.75" opacity="0.2"/>
      <path d="M3 19C3 19 9 19 12 12C15 5 21 5 21 5" strokeWidth="2" fill="none"/>
    </Icon>
  ),
  'backprop': (
    <Icon>
      <path d="M20 12a8 8 0 1 1-8-8" fill="currentColor" fillOpacity="0.06" stroke="none"/>
      <path d="M20 12a8 8 0 1 1-8-8"/>
      <polyline points="12 2 12 6 8 6" strokeWidth="1.5"/>
    </Icon>
  ),
  'cnn-rnn': (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <path d="M14 6c3 0 4 3 4 6s-1 6-4 6" strokeWidth="1.5" fill="none"/>
      <path d="M16 9c2 0 3 2 3 5" strokeWidth="1.5" fill="none" opacity="0.4"/>
    </Icon>
  ),
  'prompt-eng': (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2.5" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <rect x="3" y="4" width="18" height="16" rx="2.5"/>
      <polyline points="7 12 10 9 7 12 10 15" strokeWidth="2"/>
      <line x1="14" y1="15" x2="17" y2="15" strokeWidth="2"/>
    </Icon>
  ),
  'chatgpt': (
    <Icon>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none"/>
    </Icon>
  ),
  'claude-gemini': (
    <Icon>
      <path d="M9 3l6 9-6 9" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <path d="M9 3l6 9-6 9z"/>
      <path d="M15 3l-6 9 6 9" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M15 3l-6 9 6 9z"/>
    </Icon>
  ),
  'image-gen': (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="2" fill="currentColor" fillOpacity="0.25" stroke="none"/>
      <path d="M21 15l-5-5L8 18" strokeWidth="1.5"/>
    </Icon>
  ),
  'copilot': (
    <Icon>
      <polyline points="16 18 22 12 16 6" strokeWidth="2"/>
      <polyline points="8 6 2 12 8 18" strokeWidth="2"/>
      <line x1="14.5" y1="4" x2="9.5" y2="20" opacity="0.4" strokeWidth="1.5"/>
    </Icon>
  ),
  'bias': (
    <Icon>
      <line x1="12" y1="3" x2="12" y2="7"/>
      <line x1="5" y1="7" x2="19" y2="7" strokeWidth="2"/>
      <path d="M4 7l1 7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-7" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M4 7l1 7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-7"/>
      <path d="M12 7l1 7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-7" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <path d="M12 7l1 7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-7"/>
    </Icon>
  ),
  'deepfakes': (
    <Icon>
      <circle cx="10" cy="11" r="7" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <circle cx="10" cy="11" r="7"/>
      <circle cx="15" cy="13" r="7" fill="currentColor" fillOpacity="0.05" stroke="none"/>
      <circle cx="15" cy="13" r="7" strokeDasharray="3 2"/>
    </Icon>
  ),
  'privacy': (
    <Icon>
      <path d="M12 3l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V7l8-4z" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M12 3l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V7l8-4z"/>
      <rect x="10" y="11" width="4" height="4" rx="0.5"/>
      <path d="M10 11V9.5a2 2 0 0 1 4 0V11"/>
    </Icon>
  ),
  'responsible': (
    <Icon>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.06" stroke="none"/>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeWidth="1" opacity="0.25"/>
      <path d="M12 8v4l3 1.5" strokeWidth="2"/>
    </Icon>
  ),
}

export function getLessonIcon(lessonId) {
  return ICONS[lessonId] || ICONS['what-is-ai']
}
