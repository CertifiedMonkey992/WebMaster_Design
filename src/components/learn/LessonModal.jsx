import { useState } from 'react'
import './LessonModal.css'

const LESSONS = {
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

function parseTemplate(template) {
  const parts = []
  let rest = template
  let idx = 0
  while (rest.includes('________')) {
    const pos = rest.indexOf('________')
    if (pos > 0) parts.push({ type: 'text', val: rest.slice(0, pos) })
    parts.push({ type: 'blank', index: idx++ })
    rest = rest.slice(pos + 8)
  }
  if (rest) parts.push({ type: 'text', val: rest })
  return parts
}

function correctLabel(step) {
  if (step.type === 'fill-blank') return step.answers.join(', ')
  if (step.type === 'binary') return step.correct
  if (step.type === 'mcq') return step.options.find(o => o.correct)?.text ?? ''
  return ''
}

export default function LessonModal({ lessonId, onClose }) {
  const lesson = LESSONS[lessonId] ?? LESSONS.default

  const [screen, setScreen] = useState('welcome')
  const [tabIdx, setTabIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [stepPhase, setStepPhase] = useState('answering')

  const [hearts, setHearts] = useState(5)
  const [gems, setGems] = useState(0)
  const [xp, setXp] = useState(5)
  const [streak] = useState(0)

  const [filled, setFilled] = useState([])
  const [selected, setSelected] = useState(null)
  const [draggedChip, setDraggedChip] = useState(null)
  const [perfect, setPerfect] = useState(true)
  const [unlockedTabs, setUnlockedTabs] = useState([0])
  const [completedTabs, setCompletedTabs] = useState([])

  const currentTab = lesson.tabs[tabIdx]
  const currentStep = currentTab?.steps[stepIdx]
  const totalSteps = lesson.tabs.reduce((s, t) => s + t.steps.length, 0)
  const doneSteps = lesson.tabs.slice(0, tabIdx).reduce((s, t) => s + t.steps.length, 0) + stepIdx
  const progress = screen === 'complete' ? 1 : screen === 'welcome' ? 0 : doneSteps / totalSteps

  function resetStep() { setFilled([]); setSelected(null); setStepPhase('answering') }

  function advance() {
    const tab = lesson.tabs[tabIdx]
    if (stepIdx + 1 < tab.steps.length) {
      setStepIdx(s => s + 1); resetStep()
    } else {
      setCompletedTabs(p => [...p, tabIdx])
      if (tabIdx + 1 < lesson.tabs.length) {
        const next = tabIdx + 1
        setTabIdx(next); setStepIdx(0)
        setUnlockedTabs(p => p.includes(next) ? p : [...p, next])
        resetStep()
      } else {
        setGems(g => g + lesson.gemReward)
        setScreen('complete')
      }
    }
  }

  function check() {
    const s = currentStep
    let ok = false
    if (s.type === 'fill-blank') ok = s.answers.every((a, i) => (filled[i] ?? '').toLowerCase() === a.toLowerCase())
    else if (s.type === 'binary') ok = selected === s.correct
    else if (s.type === 'mcq') ok = s.options.find(o => o.id === selected)?.correct === true

    if (ok) { setXp(x => x + 10); setStepPhase('correct') }
    else { setHearts(h => Math.max(0, h - 1)); setPerfect(false); setStepPhase('wrong') }
  }

  function canCheck() {
    if (!currentStep) return false
    if (currentStep.type === 'fill-blank') return filled.filter(Boolean).length === currentStep.answers.length
    return selected !== null
  }

  function chipClick(chip) {
    if (stepPhase !== 'answering') return
    const arr = [...filled]
    for (let i = 0; i < currentStep.answers.length; i++) { if (!arr[i]) { arr[i] = chip; break } }
    setFilled(arr)
  }

  function blankClick(idx) {
    if (stepPhase !== 'answering') return
    const arr = [...filled]; arr[idx] = null; setFilled(arr)
  }

  const usedInBlanks = filled.filter(Boolean)
  const availChips = currentStep?.type === 'fill-blank'
    ? currentStep.choices.filter(c => !usedInBlanks.includes(c))
    : []

  if (screen === 'welcome') return (
    <div className="lm-overlay">
      <div className="lm-welcome">
        <button className="lm-close lm-close--abs" onClick={onClose}>✕</button>
        <div className="lm-welcome-emoji">🧠</div>
        <h2 className="lm-welcome-title">{lesson.title}</h2>
        <p className="lm-welcome-sub">{lesson.subtitle}</p>
        <div className="lm-welcome-bonus">⭐ +5 XP Welcome Bonus</div>
        <div className="lm-welcome-meta">
          <span>❤️ 5 hearts</span>
          <span>💎 Earn {lesson.gemReward} gems</span>
          <span>🔥 Build your streak</span>
        </div>
        <button className="lm-start-btn" onClick={() => setScreen('step')}>Start Lesson</button>
      </div>
    </div>
  )

  if (screen === 'complete') return (
    <div className="lm-overlay">
      <div className="lm-complete">
        <button className="lm-close lm-close--abs" onClick={onClose}>✕</button>
        <div className="lm-complete-trophy">🏆</div>
        <h2 className="lm-complete-title">Lesson Complete!</h2>
        {perfect && <div className="lm-perfect-badge">🌟 Perfect Run!</div>}
        <div className="lm-complete-rewards">
          <div className="lm-reward"><span className="lm-reward-icon">💎</span><span className="lm-reward-val">+{lesson.gemReward}</span><span className="lm-reward-lbl">Gems</span></div>
          <div className="lm-reward"><span className="lm-reward-icon">⭐</span><span className="lm-reward-val">+{xp}</span><span className="lm-reward-lbl">XP</span></div>
          {perfect && <div className="lm-reward"><span className="lm-reward-icon lm-fire">🔥</span><span className="lm-reward-val">+1 Day</span><span className="lm-reward-lbl">Streak</span></div>}
        </div>
        <button className="lm-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )

  return (
    <div className="lm-overlay">
      <div className="lm-topbar">
        <button className="lm-close" onClick={onClose}>✕</button>
        <div className="lm-progress-wrap">
          <div className="lm-progress-bar"><div className="lm-progress-fill" style={{ width: `${progress * 100}%` }} /></div>
        </div>
        <div className="lm-currency-row">
          <span className="lm-cur"><span>❤️</span>{hearts}</span>
          <span className="lm-cur"><span>💎</span>{gems}</span>
          <span className="lm-cur"><span className="lm-fire">🔥</span>{streak}</span>
        </div>
      </div>

      <div className="lm-tabs">
        {lesson.tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`lm-tab${i === tabIdx ? ' lm-tab--active' : ''}${!unlockedTabs.includes(i) ? ' lm-tab--locked' : ''}`}
            disabled={!unlockedTabs.includes(i)}
            onClick={() => { if (unlockedTabs.includes(i)) { setTabIdx(i); setStepIdx(0); resetStep() } }}
          >
            {tab.label}{completedTabs.includes(i) && <span className="lm-tab-done"> ✓</span>}
          </button>
        ))}
      </div>

      <div className="lm-step-dots">
        {currentTab.steps.map((_, i) => (
          <span key={i} className={`lm-dot${i < stepIdx ? ' lm-dot--done' : i === stepIdx ? ' lm-dot--active' : ''}`} />
        ))}
      </div>

      <div className="lm-body">
        {currentStep.type === 'fill-blank' && (
          <div className="lm-fill-blank">
            {currentStep.teaching && <p className="lm-teaching">{currentStep.teaching}</p>}
            <h3 className="lm-q-label">Fill in the blanks</h3>
            <div className="lm-sentence">
              {parseTemplate(currentStep.template).map((p, i) =>
                p.type === 'text'
                  ? <span key={i} className="lm-sent-text">{p.val}</span>
                  : <span
                      key={i}
                      className={`lm-blank${filled[p.index] ? ' lm-blank--filled' : ' lm-blank--empty'}`}
                      onClick={() => filled[p.index] && blankClick(p.index)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); if (!draggedChip) return; const a=[...filled]; a[p.index]=draggedChip; setFilled(a); setDraggedChip(null) }}
                    >{filled[p.index] || ''}</span>
              )}
            </div>
            <div className="lm-chips-row">
              {currentStep.choices.map(chip => {
                const isUsed = !availChips.includes(chip)
                return (
                  <span
                    key={chip}
                    className={`lm-chip${isUsed ? ' lm-chip--ghost' : ''}`}
                    draggable={!isUsed}
                    onDragStart={() => setDraggedChip(chip)}
                    onDragEnd={() => setDraggedChip(null)}
                    onClick={() => !isUsed && chipClick(chip)}
                  >{chip}</span>
                )
              })}
            </div>
          </div>
        )}

        {currentStep.type === 'binary' && (
          <div className="lm-binary">
            {currentStep.teaching && <p className="lm-teaching">{currentStep.teaching}</p>}
            <h3 className="lm-q-label">{currentStep.prompt}</h3>
            <div className="lm-binary-opts">
              {currentStep.options.map(opt => {
                let cls = 'lm-binary-btn'
                if (selected === opt.value) cls += ' lm-opt--selected'
                if (stepPhase !== 'answering') {
                  if (opt.value === currentStep.correct) cls += ' lm-opt--correct'
                  else if (selected === opt.value) cls += ' lm-opt--wrong'
                }
                return <button key={opt.value} className={cls} onClick={() => stepPhase === 'answering' && setSelected(opt.value)}>{opt.label}</button>
              })}
            </div>
          </div>
        )}

        {currentStep.type === 'mcq' && (
          <div className="lm-mcq">
            {currentStep.scenario && <pre className="lm-scenario">{currentStep.scenario}</pre>}
            <h3 className="lm-q-label">{currentStep.prompt}</h3>
            <div className="lm-mcq-opts">
              {currentStep.options.map(opt => {
                let cls = 'lm-mcq-btn'
                if (selected === opt.id) cls += ' lm-opt--selected'
                if (stepPhase !== 'answering') {
                  if (opt.correct) cls += ' lm-opt--correct'
                  else if (selected === opt.id) cls += ' lm-opt--wrong'
                }
                return <button key={opt.id} className={cls} onClick={() => stepPhase === 'answering' && setSelected(opt.id)}>{opt.text}</button>
              })}
            </div>
          </div>
        )}
      </div>

      {stepPhase === 'answering' && (
        <div className="lm-action lm-action--neutral">
          <button className="lm-btn-check" disabled={!canCheck()} onClick={check}>Check</button>
        </div>
      )}
      {stepPhase === 'correct' && (
        <div className="lm-action lm-action--correct">
          <div className="lm-feedback">
            <span className="lm-fb-icon">✓</span>
            <div><div className="lm-fb-title">Nice! +10 XP 🎉</div></div>
          </div>
          <button className="lm-btn-continue lm-btn-continue--correct" onClick={advance}>Continue</button>
        </div>
      )}
      {stepPhase === 'wrong' && (
        <div className="lm-action lm-action--wrong">
          <div className="lm-feedback">
            <span className="lm-fb-icon lm-fb-icon--wrong">✗</span>
            <div>
              <div className="lm-fb-title lm-fb-title--wrong">Incorrect!</div>
              <div className="lm-fb-correct">Answer: <strong>{correctLabel(currentStep)}</strong></div>
            </div>
          </div>
          <button className="lm-btn-continue lm-btn-continue--wrong" onClick={advance}>Continue</button>
        </div>
      )}
    </div>
  )
}
