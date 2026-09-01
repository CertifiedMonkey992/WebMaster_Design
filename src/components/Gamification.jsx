/* Gamification section — achievement dashboard mockup */

const BADGES_ON  = ['🧠', '⚡', '🔥', '🎯', '⚖️']
const BADGES_OFF = ['🏆', '🔭', '🤖']

export default function Gamification() {
  return (
    <section className="gamification" id="progress" aria-labelledby="gamif-heading">
      <div className="gamif-wrap">

        {/* Left: copy */}
        <div className="reveal">
          <span className="section-eyebrow">Gamification</span>
          <h2 className="gamif-heading" id="gamif-heading">
            Learn, earn,<br />and level up<br />in real time.
          </h2>
          <p className="gamif-body">
            Every lesson completed, every quiz aced, and every ethical
            dilemma you work through earns XP and unlocks badges.
            Progress feels visible because it is.
          </p>

          <ul className="feature-list">
            {[
              'XP Points & tiered level system',
              'Achievement badges for every milestone',
              'Daily learning streaks',
              'Module completion leaderboards',
              'Personalized progress dashboard',
            ].map((f, i) => (
              <li className="feature-item" key={i}>
                <span className="feature-dot" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          <a href="#" className="btn btn-outline section-cta" style={{ marginTop: '2rem' }}>
            See Your Dashboard →
          </a>
        </div>

        {/* Right: achievement card mockup */}
        <div className="reveal d2">
          <div className="ach-card" aria-label="Sample achievement dashboard">

            <div className="ach-header">
              <span className="ach-rank-badge">🎓 AI Explorer</span>
              <span className="ach-level-tag">Level 5</span>
            </div>

            <div className="ach-xp-val" aria-label="1,240 experience points">1,240 XP</div>
            <div className="ach-xp-track" role="progressbar" aria-valuenow={62} aria-valuemin={0} aria-valuemax={100} aria-label="62% to next level">
              <div className="ach-xp-fill" />
            </div>
            <p className="ach-xp-sub">620 XP to Level 6 — AI Analyst</p>

            <p className="ach-badges-eyebrow">Badges Earned</p>
            <div className="ach-badge-grid" aria-label="Earned and locked badges">
              {BADGES_ON.map((b, i) => (
                <div className="ach-badge on" key={i} title={['First Lesson', 'Speed Learner', '7-Day Streak', 'Bullseye', 'Ethics Hero'][i]}>
                  {b}
                </div>
              ))}
              {BADGES_OFF.map((b, i) => (
                <div className="ach-badge off" key={i} aria-label="Locked badge">
                  {b}
                </div>
              ))}
            </div>

            <div className="ach-streak-row" aria-label="14-day learning streak">
              <span className="ach-streak-icon" aria-hidden="true">🔥</span>
              <div>
                <div className="ach-streak-num">14</div>
                <div className="ach-streak-label">day streak</div>
              </div>
              {/* 7 days, last 5 lit */}
              <div className="streak-pips" aria-hidden="true">
                {[false, false, true, true, true, true, true].map((lit, i) => (
                  <span className={`streak-pip${lit ? ' lit' : ''}`} key={i} />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
