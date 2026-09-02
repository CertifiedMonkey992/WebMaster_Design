/* ── Neural network — pure SVG+SMIL, no JS animation loop ──────────────── */

const NN_NODES = [
  { x: 160, y: 24 },
  { x: 113, y: 96 },  { x: 207, y: 96 },
  { x: 66,  y: 168 }, { x: 160, y: 168 }, { x: 254, y: 168 },
  { x: 19,  y: 240 }, { x: 113, y: 240 }, { x: 207, y: 240 }, { x: 301, y: 240 },
]

const NN_EDGES = [
  [0,1],[0,2],
  [1,3],[1,4],[2,4],[2,5],
  [3,6],[3,7],[4,7],[4,8],[5,8],[5,9],
]

/* All edges share the same duration so signals arrive simultaneously */
const DURATION = 2.4
const DURATIONS = Array(12).fill(DURATION)

function NeuralNet() {
  return (
    <svg
      viewBox="0 0 320 280"
      width="320"
      height="280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Animated neural network diagram"
      role="img"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter for nodes */}
        <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Signal dot glow */}
        <filter id="sigGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Background radial gradient */}
        <radialGradient id="bgPurple" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.13"/>
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0"/>
        </radialGradient>
        {/* Paths for animateMotion — defined once in defs */}
        {NN_EDGES.map(([a, b], i) => (
          <path
            key={i}
            id={`ep${i}`}
            d={`M${NN_NODES[a].x},${NN_NODES[a].y} L${NN_NODES[b].x},${NN_NODES[b].y}`}
          />
        ))}
      </defs>

      {/* Background glow */}
      <ellipse cx="160" cy="154" rx="148" ry="148" fill="url(#bgPurple)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* Edge lines */}
      {NN_EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NN_NODES[a].x} y1={NN_NODES[a].y}
          x2={NN_NODES[b].x} y2={NN_NODES[b].y}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1"
        />
      ))}

      {/* Traveling signal dots */}
      {NN_EDGES.map((_, i) => (
        <g key={i}>
          {/* Glow halo */}
          <circle r="5" fill="rgba(79,70,229,0.55)" filter="url(#sigGlow)">
            <animateMotion dur={`${DURATIONS[i]}s`} repeatCount="indefinite" begin="0s">
              <mpath href={`#ep${i}`}/>
            </animateMotion>
          </circle>
          {/* Core dot */}
          <circle r="2" fill="#A5B4FC">
            <animateMotion dur={`${DURATIONS[i]}s`} repeatCount="indefinite" begin="0s">
              <mpath href={`#ep${i}`}/>
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* Node halos */}
      {NN_NODES.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="14" fill="white" fillOpacity="0.05">
          <animate attributeName="r" values="12;18;12" dur={`${2.4 + i * 0.18}s`} repeatCount="indefinite" begin={`${i * 0.12}s`}/>
          <animate attributeName="fill-opacity" values="0.03;0.09;0.03" dur={`${2.4 + i * 0.18}s`} repeatCount="indefinite" begin={`${i * 0.12}s`}/>
        </circle>
      ))}

      {/* Node cores */}
      {NN_NODES.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="6" fill="white" filter="url(#nodeGlow)">
          <animate attributeName="r" values="5;7;5" dur={`${2.4 + i * 0.18}s`} repeatCount="indefinite" begin={`${i * 0.12}s`}/>
          <animate attributeName="fill-opacity" values="0.7;1;0.7" dur={`${2.4 + i * 0.18}s`} repeatCount="indefinite" begin={`${i * 0.12}s`}/>
        </circle>
      ))}
    </svg>
  )
}

/* ── Hero section ───────────────────────────────────────────────────────── */
export default function Hero({ onStartLearning }) {
  return (
    <>
      {/* Announcement bar */}
      <div className="ann-bar" role="banner">
        <span className="ann-pill">Beta</span>
        <span className="ann-text-hide">LunX is live — AI literacy for everyone</span>
        <a href="#">Join for free <span aria-hidden="true">→</span></a>
      </div>

      <section className="hero" aria-labelledby="hero-heading">
        {/* Left column: copy */}
        <div className="hero-left">
          <h1 className="hero-heading" id="hero-heading">
            Understand AI.<br />
            Think Critically.<br />
            Lead the Future.
          </h1>

          <p className="hero-sub">
            LunX is the AI learning portal built for curious minds at every level.
            Go from zero to confident — understanding how AI works,
            how to use it, and how to use it responsibly.
          </p>

          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={onStartLearning}
              aria-label="Start learning AI for free"
            >
              Start Learning →
            </button>
            <a href="#modules" className="btn btn-ghost btn-lg">
              Explore Modules
            </a>
          </div>
        </div>

        {/* Center: canvas neural network */}
        <div className="hero-center" aria-hidden="true">
          <NeuralNet />
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
