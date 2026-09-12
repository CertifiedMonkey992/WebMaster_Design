/* ═══════════════════════════════════════════════════════════════════════════
   SignupCard.jsx — WHERE YOUR PROGRESS ACTUALLY LIVES
   ---------------------------------------------------------------------------
   This used to read "Save your progress / Create an account to sync across
   devices" beside a Sign Up button. There is no account system and no sync,
   so the card promised something the product cannot do — and it contradicted
   the navbar, which already carries a comment explaining why no sign-in
   button is offered there.

   The note now says what is true. The sign-in form is still reachable from
   it, because the form exists and removing the last route to it would take a
   feature out of the build rather than redesign it.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SignupCard({ onSignup }) {
  return (
    <aside className="rail-note">
      <p className="rail-note-body">
        Progress is saved in this browser. Clearing site data clears the course.
      </p>
      <button type="button" className="rail-note-link" onClick={onSignup}>
        About accounts
      </button>
    </aside>
  )
}
