import ProgressCard from './ProgressCard'
import QuestWidget from './QuestWidget'
import SignupCard from './SignupCard'
import Reveal from '../../motion/Reveal'

/**
 * The reading companion column: where you are, and what today asks of you.
 * Revision 2: the three parts slide in from the trailing edge in sequence.
 */
export default function RightSidebar({ onNavigate, onViewAllQuests }) {
  return (
    <aside className="learn-right" aria-label="Progress and quests">
      <Reveal className="learn-right-sticky" variant="right" stagger immediate delay={240}>
        <ProgressCard />
        <QuestWidget onViewAll={onViewAllQuests} />
        <SignupCard onExport={() => onNavigate('profile')} />
      </Reveal>
    </aside>
  )
}
