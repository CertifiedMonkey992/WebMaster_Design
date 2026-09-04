import ProgressCard from './ProgressCard'
import QuestWidget from './QuestWidget'
import SignupCard from './SignupCard'

export default function RightSidebar({ onSignup }) {
  return (
    <aside className="learn-right" aria-label="Sidebar widgets">
      <div className="learn-right-sticky">
        <ProgressCard />
        <QuestWidget />
        <SignupCard onSignup={onSignup} />
      </div>
    </aside>
  )
}
