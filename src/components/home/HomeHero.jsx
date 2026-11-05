/* ═══════════════════════════════════════════════════════════════════════════
   HomeHero.jsx — THE FIRST SCREEN
   ---------------------------------------------------------------------------
   COMPONENT_RULES.md → Revision 14 → Hero. At the left a pill, the headline
   (its verb flips between what AI does; its second line is underlined by
   hand), one paragraph and the two ways in. At the right the field guide
   (guide/FieldGuide.jsx): the course as a book, built from the course data.

   Each line arrives with its own text effect (MOTION_RULES.md → Revision 14
   → Text effects), in reading order. The otter starts on the button
   and jumps up onto the headline's words (OtterScenes → WordHopper).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from 'react'
import { PageLink } from '../../nav'
import { useAuth } from '../../state/AuthContext'
import Reveal from '../../motion/Reveal'
import TextFx, { Rotator, Scramble, Squiggle } from '../../motion/TextFx'
import { Icon } from '../progression/Icons'
import FieldGuide from '../guide/FieldGuide'
import { WordHopper } from '../otter/OtterScenes'
import { TOTAL_LESSONS, TOTAL_SECTIONS, inWords } from './homeData'

export default function HomeHero() {
  const { account } = useAuth()
  const copy = useRef(null)

  return (
    <section className="hx" aria-labelledby="hero-heading">
      <svg className="hx-waves" viewBox="0 0 1440 640" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M0 ${40 + i * 56}C240 ${18 + i * 56} 480 ${62 + i * 56} 720 ${40 + i * 56}S1200 ${18 + i * 56} 1440 ${40 + i * 56}`} />
        ))}
      </svg>

      <div className="hx-inner">
        <div className="hx-copy" ref={copy}>
          <Reveal variant="drop" immediate delay={80}>
            <span className="hx-pill">
              <Icon name="sparkle" size={14} />
              <Scramble text="A field guide to AI" immediate delay={260} />
            </span>
          </Reveal>

          <h1 className="hx-heading" id="hero-heading">
            <TextFx fx="stomp" immediate delay={240}>Learn how AI</TextFx>{' '}
            <span className="hx-verb"><Rotator words={['works', 'learns', 'writes', 'guesses', 'slips up']} region="hero:verb" /></span>
            <br />
            <Squiggle immediate delay={1500} className="hx-under">
              <em className="hx-em"><TextFx fx="tumble" immediate delay={760} stagger={26}>and get more out of it.</TextFx></em>
            </Squiggle>
          </h1>

          <TextFx as="p" fx="blur" by="word" immediate delay={1200} stagger={16} className="hx-lead">
            {`${inWords(TOTAL_LESSONS)} short lessons in ${inWords(TOTAL_SECTIONS).toLowerCase()} modules. Train real models in your browser, look inside a neural network, and learn when to trust what AI tells you.`}
          </TextFx>

          <Reveal className="home-hero-actions hx-actions" variant="up" stagger immediate delay={1500}>
            <PageLink page="learn" className="btn btn-primary btn-ledge hx-btn">
              {account ? 'Continue learning' : 'Get started — it’s free'}
            </PageLink>
            {!account && (
              <PageLink page="signin" section="signin" className="btn btn-outline btn-ledge hx-btn">
                I already have an account
              </PageLink>
            )}
          </Reveal>
          <WordHopper scope={copy} />
        </div>

        <div className="hx-art">
          <FieldGuide />
        </div>
      </div>
    </section>
  )
}
