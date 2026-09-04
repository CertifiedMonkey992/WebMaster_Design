/* ═══════════════════════════════════════════════════════════════════════════
   TeamMissionCard.jsx — COLLABORATIVE "TEAM MISSION"
   ---------------------------------------------------------------------------
   A shared bar the whole squad fills together. Nobody is ranked against
   anybody — the reward is granted to everyone or to nobody.

   The squad is locally simulated until there is a backend, and the card says
   so out loud rather than pretending strangers are online.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react'
import { useProgression, useClock } from '../../state/ProgressionContext'
import { QuestIcon, GemIcon, Icon } from './Icons'
import { formatDuration } from '../../utils/dateUtils'

export default function TeamMissionCard() {
  const { vm, actions } = useProgression()
  const now = useClock()
  const [claiming, setClaiming] = useState(false)
  const guard = useRef(false)

  const team = vm.team
  if (!team) return null

  const claim = () => {
    if (guard.current || !team.claimable) return
    guard.current = true
    setClaiming(true)
    actions.claimTeamReward()
    window.setTimeout(() => { guard.current = false; setClaiming(false) }, 600)
  }

  const maxContribution = Math.max(1, ...team.roster.map((m) => m.contribution))

  return (
    <section className={`tm-card${team.complete ? ' is-complete' : ''}`}>
      <header className="tm-head">
        <span className="tm-icon"><QuestIcon name={team.mission.icon} size={22} /></span>
        <div className="tm-titles">
          <div className="tm-eyebrow">
            Team mission
            {team.simulated && <span className="tm-sim" title="Squadmates are simulated locally until accounts ship">Local preview</span>}
          </div>
          <h3 className="tm-title">{team.mission.title}</h3>
          <p className="tm-tagline">{team.mission.tagline}</p>
        </div>
      </header>

      <div className="tm-progress">
        <div className="tm-progress-top">
          <span className="tm-total">
            {team.total} <span className="tm-total-goal">/ {team.goal} {team.mission.unit}</span>
          </span>
          <span className="tm-timer">
            <Icon name="clock" size={12} /> {formatDuration(Math.max(0, team.endsAt - now))} left
          </span>
        </div>
        <div className="tm-track" role="progressbar" aria-valuenow={team.total} aria-valuemax={team.goal}>
          <div className="tm-fill" style={{ width: `${team.percent}%` }} />
        </div>
        {team.mission.requiresEveryMember && (
          <div className="tm-rule">
            <Icon name="info" size={11} />
            Relay rule: every member must reach {team.goalPerMember} {team.mission.unit}
          </div>
        )}
      </div>

      <ul className="tm-roster">
        {team.roster.map((member) => (
          <li key={member.id} className={`tm-member${member.isYou ? ' is-you' : ''}`}>
            <span className="tm-avatar" style={{ '--tm-accent': member.accent }}>
              {member.name.charAt(0)}
            </span>
            <span className="tm-name">{member.name}</span>
            <span className="tm-bar">
              <span
                className="tm-bar-fill"
                style={{
                  width: `${Math.round((member.contribution / maxContribution) * 100)}%`,
                  background: member.accent,
                }}
              />
            </span>
            <span className="tm-value">{member.contribution}</span>
          </li>
        ))}
      </ul>

      <footer className="tm-foot">
        <span className="tm-reward">
          <GemIcon size={14} /> +{team.rewardGems} each
        </span>
        {team.claimable && (
          <button className="qc-claim-btn" onClick={claim} disabled={claiming}>Claim reward</button>
        )}
        {team.claimed && (
          <span className="qc-claimed-tag"><Icon name="check" size={12} strokeWidth={3} /> Claimed</span>
        )}
        {!team.complete && (
          <span className="tm-your-part">
            Your leg: {team.contribution}/{team.goalPerMember} {team.mission.unit}
          </span>
        )}
      </footer>
    </section>
  )
}
