export default function SignupCard({ onSignup }) {
  return (
    <div className="signup-card">
      <span className="signup-card-icon" aria-hidden="true">🚀</span>
      <h3 className="signup-card-heading">Sign up for free</h3>
      <p className="signup-card-body">
        Create an account to save your progress, track your stats, and sync across devices.
      </p>
      <button className="signup-card-btn" onClick={onSignup}>
        Sign up for free
      </button>
    </div>
  )
}
