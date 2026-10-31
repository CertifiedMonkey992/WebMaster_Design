/* ═══════════════════════════════════════════════════════════════════════════
   HomeHero.jsx — THE FIRST SCREEN
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 12 → Hero.

   The otter scene at the left; at the right the one sentence that says what
   LunX is, and two ledge buttons — the way in, and the way back for someone
   who already has an account. Signed in there is one button, and it says
   where it goes.
   ═══════════════════════════════════════════════════════════════════════════ */

import { PageLink } from '../../nav'
import { useAuth } from '../../state/AuthContext'
import Reveal from '../../motion/Reveal'
import SplitText from '../../motion/SplitText'
import { GemIcon, HeartIcon, FlameIcon, BoltIcon, ShieldIcon } from '../progression/Icons'
import { getLessonIcon } from '../learn/LessonIcons'
import Otter from './Otter'
import { Floater, ChapterTile } from './Scenery'

/* The scene's objects: the economy the course pays in, and two of the
   course's own lesson icons, on chapter tiles. */
const OBJECTS = [
  { key: 'gem',    at: { left: '2%',  top: '16%' },   seed: 0.12, k: 1.0,  r: -10, node: <GemIcon size={58} /> },
  { key: 'idea',   at: { left: '24%', top: '0%' },    seed: 0.58, k: 1.2,  r: -8,  node: <ChapterTile j={1}>{getLessonIcon('m02-l01')}</ChapterTile> },
  { key: 'flame',  at: { right: '6%', top: '4%' },    seed: 0.33, k: 0.9,  r: 10,  node: <FlameIcon size={64} /> },
  { key: 'heart',  at: { left: '-2%', top: '52%' },   seed: 0.81, k: 1.1,  r: -8,  node: <HeartIcon size={52} /> },
  { key: 'bolt',   at: { right: '-1%', top: '40%' },  seed: 0.47, k: 0.85, r: 12,  node: <BoltIcon size={52} /> },
  { key: 'tile',   at: { left: '4%',  bottom: '6%' }, seed: 0.24, k: 1.15, r: -6,  node: <ChapterTile j={0}>{getLessonIcon('m01-l01')}</ChapterTile> },
  { key: 'shield', at: { right: '3%', bottom: '10%' }, seed: 0.69, k: 0.95, r: 6,  node: <ShieldIcon size={54} /> },
]

export default function HomeHero() {
  const { account } = useAuth()

  return (
    <section className="home-hero" aria-labelledby="hero-heading">
      <div className="home-hero-inner">
        <div className="home-hero-art">
          <Reveal className="os-scene" variant="scale" stagger immediate delay={80} aria-hidden="true">
            <span className="os-ground" />
            <span className="os-otter"><Otter pose="hold" region="hero:otter" /></span>
            {OBJECTS.map((o) => (
              <Floater key={o.key} at={o.at} seed={o.seed} k={o.k} r={o.r}>{o.node}</Floater>
            ))}
          </Reveal>
        </div>

        <div className="home-hero-copy">
          <SplitText as="h1" className="home-hero-heading" id="hero-heading" immediate delay={160} stagger={34}>
            A field guide to the AI <em className="em">you already use</em>.
          </SplitText>

          <Reveal className="home-hero-actions" variant="up" stagger immediate delay={420}>
            <PageLink page="learn" className="btn btn-primary btn-ledge home-hero-btn">
              {account ? 'Continue learning' : 'Get started'}
            </PageLink>
            {!account && (
              <PageLink page="signin" section="signin" className="btn btn-outline btn-ledge home-hero-btn">
                I already have an account
              </PageLink>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
