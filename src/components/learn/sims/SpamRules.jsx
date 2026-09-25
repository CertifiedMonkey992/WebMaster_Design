/* SpamRules — Lesson 1.1's designed failure.
   The learner writes a rule-based spam filter by choosing words to block. It
   works on the messages they can see, then new messages arrive and it fails
   both ways: spam that avoids the words gets through, and ordinary messages
   that happen to use them get blocked. Real rule, real counts. */

import { useMemo, useState } from 'react'
import { SimFrame, Btn, Stat } from './kit'

const WORDS = ['free', 'winner', 'prize', 'click', 'urgent', 'gift card', 'crypto', 'password', 'offer', 'verify']

const KNOWN = [
  { id: 'k1', text: 'You are a WINNER! Click to claim your free prize', spam: true },
  { id: 'k2', text: 'URGENT: your password expires today — click here', spam: true },
  { id: 'k3', text: 'Free gift card for the first 100 replies', spam: true },
  { id: 'k4', text: 'Double your crypto in 24 hours, guaranteed', spam: true },
  { id: 'k5', text: 'Homework due Friday — the rubric is on the class page', spam: false },
  { id: 'k6', text: 'Team meeting moved to 3:30 in room 114', spam: false },
  { id: 'k7', text: 'Can you send me the lab photos from today?', spam: false },
  { id: 'k8', text: 'Your library book is due back tomorrow', spam: false },
]

const NEW = [
  { id: 'n1', text: 'Congrats!! u have been selected 4 a $500 reward, reply YES', spam: true },
  { id: 'n2', text: 'School IT desk here: confirm your login at bit.ly/…', spam: true },
  { id: 'n3', text: 'Designer sneakers 90% off, today only', spam: true },
  { id: 'n4', text: 'Your parcel is on hold. Pay the $1.99 fee to release it', spam: true },
  { id: 'n5', text: 'Free pizza in the cafeteria after the game!', spam: false },
  { id: 'n6', text: 'Urgent: bus 12 is running 20 minutes late', spam: false },
  { id: 'n7', text: 'Click “Submit” on the class page to turn in your essay', spam: false },
  { id: 'n8', text: 'Science fair prize winners are posted by the gym', spam: false },
]

const blocks = (text, rules) => rules.some((w) => text.toLowerCase().includes(w))

function score(set, rules) {
  let right = 0
  const rows = set.map((m) => {
    const blocked = blocks(m.text, rules)
    const ok = blocked === m.spam
    if (ok) right++
    return { ...m, blocked, ok }
  })
  return { rows, right, total: set.length }
}

export default function SpamRules({ onDone }) {
  const [rules, setRules] = useState(['free', 'winner', 'click', 'urgent'])
  const [shown, setShown] = useState(false)
  const known = useMemo(() => score(KNOWN, rules), [rules])
  const fresh = useMemo(() => score(NEW, rules), [rules])

  const toggle = (w) => setRules((r) => (r.includes(w) ? r.filter((x) => x !== w) : [...r, w]))

  const Row = ({ m }) => (
    <li className={`sim-card ${m.ok ? 'is-good' : 'is-bad'}`}>
      {m.text}
      <small>{m.blocked ? 'Blocked' : 'Delivered'} · really {m.spam ? 'spam' : 'not spam'}{m.ok ? '' : ' — wrong'}</small>
    </li>
  )

  return (
    <SimFrame
      title="Write a spam filter by hand"
      provenance="computed"
      controls={
        <div className="sim-row">
          <span className="sim-label">Block any message containing</span>
          <div className="sim-chips">
            {WORDS.map((w) => (
              <button key={w} type="button" className={`sim-chip${rules.includes(w) ? ' is-on' : ''}`} aria-pressed={rules.includes(w)} onClick={() => toggle(w)}>{w}</button>
            ))}
          </div>
        </div>
      }
      footer={
        <>
          <div className="sim-stats">
            <Stat label="right on the messages you can see" value={`${known.right}/${known.total}`} tone={known.right === known.total ? 'moss' : undefined} />
            {shown && <Stat label="right on new messages" value={`${fresh.right}/${fresh.total}`} tone={fresh.right < fresh.total / 2 ? 'berry' : undefined} />}
          </div>
          {!shown && <Btn primary onClick={() => { setShown(true); onDone?.() }}>New messages arrive</Btn>}
        </>
      }
    >
      <p className="sim-sub">Messages you can see</p>
      <ul className="sim-cards">
        {known.rows.map((m) => <Row key={m.id} m={m} />)}
      </ul>
      {shown && (
        <>
          <p className="sim-sub sim-sub--gap">This week’s new messages — same rules</p>
          <ul className="sim-cards">
            {fresh.rows.map((m) => <Row key={m.id} m={m} />)}
          </ul>
          <p className={`sim-result ${fresh.right < fresh.total ? 'is-bad' : 'is-good'}`}>
            {fresh.right < fresh.total
              ? 'Rules only know the words someone thought of. Spam that avoids them gets through, and normal messages that use them get blocked. Try changing your rules — then notice you are always one message behind.'
              : 'Every new message sorted correctly — but only because you tuned the rules after seeing them. Next week’s spam will use words you have not thought of yet.'}
          </p>
        </>
      )}
    </SimFrame>
  )
}
