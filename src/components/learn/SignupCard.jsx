export default function SignupCard({ onSignup }) {
  return (
    <div className="signup-card">
      <div className="signup-card-content">
        <div className="signup-card-text">
          <h3 className="signup-card-heading">Save your progress</h3>
          <p className="signup-card-body">
            Create an account to sync across devices.
          </p>
        </div>
        <button className="signup-card-btn" onClick={onSignup}>
          Sign Up
        </button>
      </div>
    </div>
  )
}
