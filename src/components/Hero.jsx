import TriangleGlow from './TriangleGlow'

/* ── Hero section ───────────────────────────────────────────────────────── */
export default function Hero({ onStartLearning }) {
  return (
    <>
      {/* Announcement bar */}
      {/* No "join" link: there are no accounts, so the bar states what is
          actually true — the course is open and progress saves locally. */}
      <div className="ann-bar" role="banner">
        <span className="ann-pill">Beta</span>
        <span className="ann-text-hide">
          LunX is in beta — 22 lessons are live, no account needed
        </span>
      </div>

      <section className="hero" aria-labelledby="hero-heading">
        {/* Left column: copy */}
        <div className="hero-left">
          <h1 className="hero-heading" id="hero-heading">
            Understand AI.<br />
            Think critically.<br />
            Use it well.
          </h1>

          <p className="hero-sub">
            22 interactive lessons on how AI actually works — from machine
            learning to the ethics of using it. Free, no account, and it
            remembers where you left off.
          </p>

          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={onStartLearning}
              aria-label="Start learning AI for free"
            >
              Start Learning →
            </button>
            <a href="#learn" className="btn btn-ghost btn-lg">
              See the course
            </a>
          </div>
        </div>

        {/* Center: interactive triangle glow */}
        <div className="hero-center" aria-hidden="true">
          <TriangleGlow />
        </div>

        {/* Right column: curriculum path */}
        <div className="hero-right">
          <p className="hero-right-eyebrow">Curriculum</p>
          <div className="hero-path">
            {[
              ['01', 'AI Foundations'],
              ['02', 'Machine Learning'],
              ['03', 'Neural Networks'],
              ['04', 'Practical AI Tools'],
              ['05', 'AI Ethics'],
            ].map(([num, label]) => (
              <div className="hero-path-item" key={num}>
                <span className="hero-path-num">{num}</span>
                <span className="hero-path-label">{label}</span>
              </div>
            ))}
          </div>
          <p className="hero-path-meta">22 lessons · Self-paced · Free to start</p>
        </div>
      </section>
    </>
  )
}
