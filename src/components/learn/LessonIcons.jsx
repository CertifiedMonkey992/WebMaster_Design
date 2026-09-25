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
  /* ── Curriculum redesign (2026-09): new shapes, same language ── */
  'casefile': (
    <Icon>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M8 13h8M8 16h5" opacity="0.5"/>
    </Icon>
  ),
  'project': (
    <Icon>
      <rect x="5" y="4" width="14" height="17" rx="2" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <rect x="5" y="4" width="14" height="17" rx="2"/>
      <rect x="9" y="2.5" width="6" height="3" rx="1"/>
      <path d="M8.5 11l2 2 4-4" strokeWidth="2"/>
      <path d="M8.5 17h7" opacity="0.4"/>
    </Icon>
  ),
  'compass': (
    <Icon>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.06" stroke="none"/>
      <circle cx="12" cy="12" r="9"/>
      <path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" fillOpacity="0.25"/>
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
    </Icon>
  ),
  'tutor': (
    <Icon>
      <path d="M12 6.5C10 5 6.5 4.5 3 5v13c3.5-.5 7 0 9 1.5 2-1.5 5.5-2 9-1.5V5c-3.5-.5-7 0-9 1.5z" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M12 6.5C10 5 6.5 4.5 3 5v13c3.5-.5 7 0 9 1.5 2-1.5 5.5-2 9-1.5V5c-3.5-.5-7 0-9 1.5zM12 6.5v13"/>
      <path d="M15 10.5h3M15 13.5h3" opacity="0.45"/>
    </Icon>
  ),
  'magnifier': (
    <Icon>
      <circle cx="10.5" cy="10.5" r="6" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <circle cx="10.5" cy="10.5" r="6"/>
      <path d="M15 15l5.5 5.5" strokeWidth="2"/>
      <path d="M8 10.5h5" opacity="0.5"/>
    </Icon>
  ),
  'checklist': (
    <Icon>
      <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" strokeWidth="1.75"/>
      <path d="M11 6.5h9M11 12.5h9M11 18.5h6" opacity="0.6"/>
    </Icon>
  ),
  'cursor': (
    <Icon>
      <path d="M5 3l13 6.5-5.5 1.8L10.7 17z" fill="currentColor" fillOpacity="0.12" stroke="none"/>
      <path d="M5 3l13 6.5-5.5 1.8L10.7 17z"/>
      <path d="M13 13l5 5" strokeWidth="1.75"/>
      <path d="M16 3.5l1-1.5M19.5 6.5l1.5-.8" opacity="0.4"/>
    </Icon>
  ),
  'document': (
    <Icon>
      <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="currentColor" fillOpacity="0.08" stroke="none"/>
      <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4"/>
      <path d="M8.5 12h7M8.5 15h7M8.5 18h4" opacity="0.45"/>
    </Icon>
  ),
  'bubbles': (
    <Icon>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h8A2.5 2.5 0 0 1 16 5.5v4a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3.2A2.5 2.5 0 0 1 3 9.5z" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h8A2.5 2.5 0 0 1 16 5.5v4a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3.2A2.5 2.5 0 0 1 3 9.5z"/>
      <path d="M18.5 9A2.5 2.5 0 0 1 21 11.5v4a2.5 2.5 0 0 1-1.5 2.3V21l-3.5-3h-4.5A2.5 2.5 0 0 1 9 15.5V15" opacity="0.55"/>
    </Icon>
  ),
  'wrench': (
    <Icon>
      <path d="M14.5 4.5a4.5 4.5 0 0 0-5.3 5.9L3.8 15.8a1.9 1.9 0 0 0 2.7 2.7l5.4-5.4a4.5 4.5 0 0 0 5.9-5.3l-2.6 2.6-2.4-.3-.3-2.4z" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <path d="M14.5 4.5a4.5 4.5 0 0 0-5.3 5.9L3.8 15.8a1.9 1.9 0 0 0 2.7 2.7l5.4-5.4a4.5 4.5 0 0 0 5.9-5.3l-2.6 2.6-2.4-.3-.3-2.4z"/>
    </Icon>
  ),
  'columns': (
    <Icon>
      <path d="M3 9l9-5 9 5" fill="currentColor" fillOpacity="0.1" stroke="none"/>
      <path d="M3 9l9-5 9 5zM5 9v8M9.5 9v8M14.5 9v8M19 9v8M3 20h18M4 17h16"/>
    </Icon>
  ),
}

/* The curriculum's items, drawn from the shapes above. An icon marks a
   repeating object type (VISUAL_SYSTEM.md → Iconography), so the Case Files
   share one, the Part projects one, and the capstone has the guide's compass. */
const ALIAS = {
  'm01-l01': 'what-is-ai',   'm01-l02': 'training-data', 'm01-l03': 'model-eval',
  'm02-l01': 'perceptron',   'm02-l02': 'backprop',      'm02-l03': 'cnn-rnn',
  'm03-l01': 'chatgpt',      'm03-l02': 'image-gen',     'm03-l03': 'how-ai-learns',
  'm04-l01': 'ai-everyday',  'm04-l02': 'prompt-eng',    'm04-l03': 'tutor',
  'm05-l01': 'magnifier',    'm05-l02': 'checklist',     'm05-l03': 'cursor',
  'm06-l01': 'document',     'm06-l02': 'bias',          'm06-l03': 'privacy',   'm06-l04': 'bubbles',
  'm07-l01': 'wrench',       'm07-l02': 'columns',       'm07-cap': 'compass',
  'p1-project': 'project',   'p2-project': 'project',
}

export function getLessonIcon(lessonId) {
  const key = ALIAS[lessonId] ?? (/-case$/.test(lessonId ?? '') ? 'casefile' : lessonId)
  return ICONS[key] || ICONS['what-is-ai']
}
