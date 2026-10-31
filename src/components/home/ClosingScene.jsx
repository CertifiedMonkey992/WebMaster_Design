/* ═══════════════════════════════════════════════════════════════════════════
   ClosingScene.jsx — THE LAST THING ON THE PAGE
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 12 → Closing scene.

   One heading, one button, and the otter cheering on an evergreen hillside
   with the course's rewards floating over it. The hill runs straight into
   the footer, which is the same evergreen.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SECTIONS } from '../../data/learnData'
import { PageLink } from '../../nav'
import { useAuth } from '../../state/AuthContext'
import Reveal from '../../motion/Reveal'
import SplitText from '../../motion/SplitText'
import { GemIcon, HeartIcon, FlameIcon, BoltIcon, ShieldIcon } from '../progression/Icons'
import Otter from '../otter/Otter'
import { Floater } from './Scenery'

/* Lesson one's real length, read from the course. */
const FIRST_MINUTES = parseInt(SECTIONS[0].lessons[0].duration, 10)

/* `inner`: the ring nearest the otter, left out on a phone, where it would
   crowd behind its head. */
const REWARDS = [
  { key: 'g1', at: { left: '9%', top: '44%' },   seed: 0.1,  k: 1.0,  r: -12, node: <GemIcon size={60} /> },
  { key: 'h1', at: { left: '20%', top: '6%' },   seed: 0.62, k: 1.15, r: 8,   node: <HeartIcon size={52} /> },
  { key: 'b',  inner: true, at: { left: '30%', top: '42%' },  seed: 0.35, k: 0.9,  r: -6,  node: <BoltIcon size={50} /> },
  { key: 'h2', inner: true, at: { left: '38%', top: '0%' },   seed: 0.91, k: 1.25, r: -10, node: <HeartIcon size={40} /> },
  { key: 'g3', inner: true, at: { right: '38%', top: '4%' },  seed: 0.44, k: 1.1,  r: 12,  node: <GemIcon size={42} /> },
  { key: 'f',  inner: true, at: { right: '27%', top: '22%' }, seed: 0.84, k: 1.05, r: 10,  node: <FlameIcon size={66} /> },
  { key: 'g2', at: { right: '17%', top: '50%' }, seed: 0.27, k: 1.2,  r: 14,  node: <GemIcon size={48} /> },
  { key: 's',  at: { right: '8%', top: '10%' },  seed: 0.51, k: 0.95, r: -8,  node: <ShieldIcon size={60} /> },
]

export default function ClosingScene() {
  const { account } = useAuth()

  return (
    <section className="home-closing" aria-labelledby="closing-heading">
      <SplitText as="h2" className="home-feature-heading home-closing-heading" id="closing-heading" stagger={48}>
        Learn how AI works with LunX.
      </SplitText>
      <Reveal as="p" className="home-closing-note" delay={200}>
        Free · lesson one takes {FIRST_MINUTES} minutes
      </Reveal>
      <Reveal className="home-closing-action" variant="scale" delay={280}>
        <PageLink page="learn" className="btn btn-primary btn-ledge home-hero-btn">
          {account ? 'Continue learning' : 'Get started'}
        </PageLink>
      </Reveal>

      <div className="hc-scene" aria-hidden="true">
        <svg className="hc-hill" viewBox="0 0 1440 300" preserveAspectRatio="none">
          <path d="M0 96C190 96 290 54 420 74 560 96 610 236 720 236S880 96 1020 74C1150 54 1250 96 1440 96V300H0Z" />
        </svg>
        <Reveal className="hc-objects" variant="scale" stagger>
          {REWARDS.map((o) => (
            <Floater key={o.key} className={o.inner ? 'hc-inner' : ''} at={o.at} seed={o.seed} k={o.k} r={o.r}>{o.node}</Floater>
          ))}
        </Reveal>
        <span className="hc-otter"><Otter pose="cheer" mood="excited" moodWeight={0.4} region="closing:otter" /></span>
      </div>
    </section>
  )
}
