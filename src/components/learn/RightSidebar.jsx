import ProgressCard from './ProgressCard'
import QuestWidget from './QuestWidget'
import SignupCard from './SignupCard'
import TeamMissionCard from '../progression/TeamMissionCard'

export default function RightSidebar({ onSignup, onViewAllQuests }) {
  return (
    <aside className="learn-right" aria-label="Sidebar widgets">
      <div className="learn-right-sticky">
        <ProgressCard />
        <QuestWidget onViewAll={onViewAllQuests} />
        <TeamMissionCard />
        <SignupCard onSignup={onSignup} />
      </div>
    </aside>
  )
}
