import SignupCard from './SignupCard'
import QuestWidget from './QuestWidget'

export default function RightSidebar({ onSignup }) {
  return (
    <aside className="learn-right" aria-label="Sidebar widgets">
      <div className="learn-right-sticky">
        <SignupCard onSignup={onSignup} />
        <QuestWidget />
      </div>
    </aside>
  )
}
