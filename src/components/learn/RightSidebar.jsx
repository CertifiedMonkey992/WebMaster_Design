import ProgressCard from './ProgressCard'
import QuestWidget from './QuestWidget'
import SignupCard from './SignupCard'

/**
 * The reading companion column.
 *
 * It used to hold four widgets of equal weight: progress, quests, a team
 * mission labelled "Local preview", and a signup card for an account system
 * that does not exist. A column with no ranking in it reads as a column that
 * was filled because it was there.
 *
 * Two things belong beside the course map — where you are, and what today
 * asks of you. The team mission moved to the Quests view, which is where a
 * quest belongs; it was not deleted. The signup card became an honest note
 * about local storage.
 */
export default function RightSidebar({ onSignup, onViewAllQuests }) {
  return (
    <aside className="learn-right" aria-label="Progress and quests">
      <div className="learn-right-sticky">
        <ProgressCard />
        <QuestWidget onViewAll={onViewAllQuests} />
        <SignupCard onSignup={onSignup} />
      </div>
    </aside>
  )
}
