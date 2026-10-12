/* ═══════════════════════════════════════════════════════════════════════════
   LegalPages.jsx — THE PRIVACY POLICY AND THE TERMS OF USE
   ---------------------------------------------------------------------------
   Written for the reader LunX actually has — a high school student, a
   teacher, a judge — in plain sentences, and true to the build: every claim
   here is checked against the code (the one storage key, no network calls,
   no cookies, the analytics switch in site.js). If the product changes what
   it stores or sends, this file changes in the same commit.
   ═══════════════════════════════════════════════════════════════════════════ */

import SitePage from './SitePage'
import { PageLink } from '../nav'
import { SITE } from '../site'
import { STORAGE_KEY } from '../config/progressionConfig'
import { CONSENT_KEY, reopenChoices } from '../services/analytics'
import { ACCOUNTS_KEY } from '../services/accountService'
import { SESSION_KEY } from '../services/api'
import { CONNECTED, SERVER_HOST } from '../config/serverConfig'
import { useServerFeatures } from '../services/serverFeatures'

const UPDATED = new Date(`${SITE.policiesUpdated}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

function Updated() {
  return <p className="sp-updated">Last updated <time dateTime={SITE.policiesUpdated}>{UPDATED}</time></p>
}

function Section({ id, title, children }) {
  return (
    <section className="sp-section" aria-labelledby={id}>
      <h2 className="sp-h2" id={id}>{title}</h2>
      {children}
    </section>
  )
}

/* ── Privacy ─────────────────────────────────────────────────────────────── */

export function PrivacyPage() {
  if (CONNECTED) return <ConnectedPrivacyPage />
  const analytics = SITE.analytics.enabled
  return (
    <SitePage
      eyebrow="Privacy policy"
      title={<>Your progress <em className="em">stays in your browser</em>.</>}
      lead="LunX has no server of its own, so your account and your progress never leave your browser. This page lists everything it stores, everything that leaves your browser, and how to remove it."
    >
      <Updated />

      <Section id="summary" title="In short">
        <ul className="sp-list">
          <li>The course needs an account: an email, a password and, if you like, a username.</li>
          <li>Your account is created in this browser and never sent anywhere. Your email is never shown to anyone.</li>
          <li>Your course progress is saved in this browser only, and is never sent anywhere.</li>
          <li>LunX sets no cookies.</li>
          <li>{analytics
            ? 'Page views are counted anonymously only if you allow it, and you can change your mind at any time.'
            : 'LunX does not run analytics or tracking of any kind.'}
          </li>
        </ul>
      </Section>

      <Section id="stored" title="What LunX stores, and where">
        <p className="sp-p">
          LunX uses your browser’s local storage, which stays on your device. It keeps these entries, one more for each account you create, and another only if something goes wrong:
        </p>
        <dl className="sp-defs">
          <div>
            <dt><code>{STORAGE_KEY}</code></dt>
            <dd>Progress saved on this browser before accounts were required, if there is any. The first account created on the browser takes it over, so nobody loses a streak. New progress is never written here.</dd>
          </div>
          <div>
            <dt><code>{ACCOUNTS_KEY}</code></dt>
            <dd>
              The accounts made on this browser, and which one is signed in. Each
              holds its email, its username (if you chose one), and a salted
              PBKDF2 hash of the password and of the recovery code — never the
              password or the code themselves. The hash means a password cannot be
              read back from storage, but LunX has no server, so it cannot stop
              someone using this device from reading the progress stored beside it.
              Use a password you do not use anywhere else.
            </dd>
          </div>
          <div>
            <dt><code>{STORAGE_KEY}__&lt;profile&gt;</code></dt>
            <dd>One per account, holding its progress: lessons finished, XP and level, gems, hearts, streak and its history, quests, the daily spin, shop items and achievements — and your coursework: the part you reached in an unfinished lesson, your answers to predictions, the reflections you typed into your Field Journal, the questions you missed (for review in Practice), and your Launch and Final Scan answers. Signing out leaves it in place; deleting the account (Profile → Account) removes it.</dd>
          </div>
          <div>
            <dt><code>{STORAGE_KEY}__corrupt</code></dt>
            <dd>Written only if the saved progress above could not be read. The unreadable text is kept here, so nothing is silently destroyed, and a fresh progress record is started.</dd>
          </div>
          <div>
            <dt><code>{CONSENT_KEY}</code></dt>
            <dd>That you have seen the privacy notice{analytics ? ', and whether you allowed visit counting' : ''}, so it is not shown again.</dd>
          </div>
        </dl>
        <p className="sp-p">
          Nothing in local storage is readable by other websites, and LunX never uploads it.
        </p>
      </Section>

      <Section id="leaves" title="What leaves your browser">
        <dl className="sp-defs">
          <div>
            <dt>Hosting — GitHub Pages</dt>
            <dd>The site is served by GitHub. Like any web host, GitHub receives your IP address and browser details when you load a page. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub’s privacy statement</a>.</dd>
          </div>
          <div>
            <dt>Fonts — Google Fonts</dt>
            <dd>The typefaces are loaded from Google Fonts, so Google receives your IP address when the page requests them. See the <a href="https://developers.google.com/fonts/faq/privacy" rel="noopener">Google Fonts privacy FAQ</a>.</dd>
          </div>
          <div>
            <dt>Visit counting — GoatCounter</dt>
            <dd>{analytics
              ? <>Only if you choose “Allow”: a page view, the page it came from and your screen size are sent to GoatCounter, which sets no cookies and does not identify you. <button type="button" className="sp-inline-btn" onClick={reopenChoices}>Change your choice</button>.</>
              : 'Not used. No analytics script is loaded.'}
            </dd>
          </div>
          <div>
            <dt>The contact form</dt>
            <dd>LunX does not send the form anywhere. It prepares a message that you send yourself, from {SITE.contact.email ? 'your own email app' : 'GitHub, where issues are public'}.</dd>
          </div>
        </dl>
      </Section>

      <Section id="rights" title="Removing your data">
        <p className="sp-p">
          Clear this site’s data in your browser settings (or clear local storage for this site)
          and every trace of your progress is gone. Because LunX holds no copy, nobody else can
          delete, export or see it for you; the export on the Profile page is the only copy that
          ever exists, and it goes where you save it.
        </p>
      </Section>

      <Section id="students" title="Students and schools">
        <p className="sp-p">
          LunX is written for high school students. The only personal information it asks for is
          an email address to sign in with, which is kept in this browser, never verified and never
          sent anywhere. The username is optional and can be anything appropriate. Teachers can use
          it in class without registering anyone with a third party.
        </p>
      </Section>

      <Section id="changes" title="Changes and questions">
        <p className="sp-p">
          If what LunX stores or sends changes, this page changes with it and its date moves.
          Questions go to the team through the <PageLink page="contact">contact page</PageLink>.
        </p>
      </Section>
    </SitePage>
  )
}

/* ── Privacy, on a build connected to a LunX server ──────────────────────────
   The same promise as the local page — say everything that is stored and
   everything that leaves the browser — for a build whose accounts, progress,
   friends and leagues live on the LunX server (server/db.js lists every
   table this page describes). */

function ConnectedPrivacyPage() {
  const analytics = SITE.analytics.enabled
  /* Whether this server emails reset links is its operators' choice, so the
     page asks it (services/serverFeatures.js) rather than guessing. */
  const { mail } = useServerFeatures()
  return (
    <SitePage
      eyebrow="Privacy policy"
      title={<>Your account, <em className="em">and only what it needs</em>.</>}
      lead={`This copy of LunX keeps accounts on its own server, ${SERVER_HOST}, so you can sign in on any device and learn alongside friends. This page lists everything the server stores, everything your browser keeps, who can see what, and how to remove it.`}
    >
      <Updated />

      <Section id="summary" title="In short">
        <ul className="sp-list">
          <li>The course needs an account: an email, a username and a password.</li>
          <li>Your account and progress are kept on the LunX server, run by the team for this project. Nothing is sold, and nothing is shared with anyone outside it.</li>
          <li>Your password is never stored. The server keeps a salted scrypt hash of it, and of your recovery code.</li>
          <li>Your email is never shown to anyone. Other learners see your username, avatar colour and league, and the figures your privacy settings allow.</li>
          <li>{mail
            ? 'LunX sets no cookies. The only email it sends is a link to reset your password, and only when you ask for one.'
            : 'LunX sets no cookies and sends no email.'}
          </li>
          <li>{analytics
            ? 'Page views are counted anonymously only if you allow it, and you can change your mind at any time.'
            : 'LunX does not run analytics or tracking of any kind.'}
          </li>
        </ul>
      </Section>

      <Section id="server" title="What the LunX server stores">
        <dl className="sp-defs">
          <div>
            <dt>Your account</dt>
            <dd>Email, username, friend code, avatar colour, time zone, privacy settings, your current and best league, when the account was made and last used, and the hashes of your password and recovery code.</dd>
          </div>
          <div>
            <dt>Sign-ins</dt>
            <dd>A hash of each sign-in’s token, never the token itself. A sign-in ends when you sign out, or 30 days after it was last used.</dd>
          </div>
          {mail && (
            <div>
              <dt>Password-reset links</dt>
              <dd>If you ask for one, a hash of the link’s one-time token. It stops working after 30 minutes or once it is used, and is deleted a day later. The email goes through the mail service the team uses to send it.</dd>
            </div>
          )}
          <div>
            <dt>Your progress</dt>
            <dd>A copy of the progress your browser keeps — lessons finished, XP, gems, hearts, streak, quests, the daily spin, shop items, achievements and your coursework — so another device can carry on where you stopped.</dd>
          </div>
          <div>
            <dt>Your learning activity</dt>
            <dd>The lessons you complete and the answers you give in lessons and practice: which question, right or wrong, and when. The server uses them to count your XP, build your practice and score challenges. Nobody else sees your answers.</dd>
          </div>
          <div>
            <dt>Leagues</dt>
            <dd>The board you were on each week, your weekly XP and rank, and the trophies and rewards you earned.</dd>
          </div>
          <div>
            <dt>Friends and challenges</dt>
            <dd>Friend requests and friendships, the learners you have blocked, the challenges you made or joined and your scores in them, and the last 100 notifications about them.</dd>
          </div>
          <div>
            <dt>Reports</dt>
            <dd>If you report someone, the reason and any note you add. They are read by the team’s moderators, who can dismiss a report, reset a username, suspend an account for a time or delete it. Every action is recorded with the moderator’s name, and someone whose username is reset is told why.</dd>
          </div>
        </dl>
        <p className="sp-p">
          The server sees your IP address when your browser contacts it, as any website does. It uses
          the address for a moment to slow down repeated sign-in attempts, and does not save it.
        </p>
      </Section>

      <Section id="seen" title="Who can see what">
        <dl className="sp-defs">
          <div>
            <dt>Learners on your league board</dt>
            <dd>Your username, avatar, league and weekly XP — only if “Show me in weekly leagues” is on (Profile → Privacy).</dd>
          </div>
          <div>
            <dt>Anyone who opens your profile</dt>
            <dd>Your username and league. Your figures and trophies too, if “Who can see my profile” allows them.</dd>
          </div>
          <div>
            <dt>People looking you up</dt>
            <dd>Your friend code always finds you. Your username finds you only if you allow it, and your email only if you allow that — and even then the address is never shown back.</dd>
          </div>
          <div>
            <dt>The team that runs the server</dt>
            <dd>Can read the database, to keep it working. Moderators — learners the team has trusted with reports — see the reports, the usernames involved and the notes, never an email address. Nobody uses any of it for anything else.</dd>
          </div>
        </dl>
      </Section>

      <Section id="stored" title="What your browser keeps">
        <dl className="sp-defs">
          <div>
            <dt><code>{SESSION_KEY}</code></dt>
            <dd>Your sign-in token and a copy of your account, so you stay signed in. Signing out removes it.</dd>
          </div>
          <div>
            <dt><code>{STORAGE_KEY}__srv_&lt;account&gt;</code></dt>
            <dd>Your progress, so the course works between visits and while the server cannot be reached, with a second entry recording which copy the server last saw. Signing out removes both (unless you are offline and a change has not reached the server yet).</dd>
          </div>
          <div>
            <dt><code>lunx_outbox_v1__&lt;account&gt;</code></dt>
            <dd>Answers and completions waiting to reach the server, if you were offline. Each is removed once the server has it.</dd>
          </div>
          <div>
            <dt><code>lunx_signed_in_here_v1</code></dt>
            <dd>That someone has signed in on this browser before, so the sign-in page opens on “Welcome back”. It holds no name or address.</dd>
          </div>
          <div>
            <dt><code>{CONSENT_KEY}</code></dt>
            <dd>That you have seen the privacy notice{analytics ? ', and whether you allowed visit counting' : ''}, so it is not shown again.</dd>
          </div>
        </dl>
        <p className="sp-p">Nothing in local storage is readable by other websites.</p>
      </Section>

      <Section id="leaves" title="What else leaves your browser">
        <dl className="sp-defs">
          <div>
            <dt>Hosting — GitHub Pages</dt>
            <dd>The site itself is served by GitHub. Like any web host, GitHub receives your IP address and browser details when you load a page. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub’s privacy statement</a>.</dd>
          </div>
          <div>
            <dt>Fonts — Google Fonts</dt>
            <dd>The typefaces are loaded from Google Fonts, so Google receives your IP address when the page requests them. See the <a href="https://developers.google.com/fonts/faq/privacy" rel="noopener">Google Fonts privacy FAQ</a>.</dd>
          </div>
          <div>
            <dt>Visit counting — GoatCounter</dt>
            <dd>{analytics
              ? <>Only if you choose “Allow”: a page view, the page it came from and your screen size are sent to GoatCounter, which sets no cookies and does not identify you. <button type="button" className="sp-inline-btn" onClick={reopenChoices}>Change your choice</button>.</>
              : 'Not used. No analytics script is loaded.'}
            </dd>
          </div>
          <div>
            <dt>The contact form</dt>
            <dd>LunX does not send the form anywhere. It prepares a message that you send yourself, from {SITE.contact.email ? 'your own email app' : 'GitHub, where issues are public'}.</dd>
          </div>
        </dl>
      </Section>

      <Section id="rights" title="Removing your data">
        <p className="sp-p">
          Profile → Account → Delete account (it asks for your password) removes your account and
          everything the server holds for it at once: progress, activity, league history, friends,
          challenges and notifications. Reports you made stay without your name; reports made about
          you keep your username, so the team can still review them. Signing out removes your
          sign-in and this browser’s copy of your progress. If you sign out while offline, the copy
          stays so nothing is lost, and is sent the next time you sign in here. Clearing this site’s
          data removes everything your browser keeps.
        </p>
      </Section>

      <Section id="students" title="Students and schools">
        <p className="sp-p">
          LunX is written for high school students. The only personal information it asks for is an
          email address to sign in with, which is never verified and never shown.{' '}
          {mail
            ? 'It is used for one thing besides signing in: if you forget your password and ask, a reset link is sent to it. The recovery code shown when the account is made works too.'
            : 'The server sends no email, so a forgotten password is reset with the recovery code shown when the account is made.'} A username is required and must be appropriate for school.
          There are no photos and no messaging between learners.
        </p>
      </Section>

      <Section id="changes" title="Changes and questions">
        <p className="sp-p">
          If what LunX stores or sends changes, this page changes with it and its date moves.
          Questions go to the team through the <PageLink page="contact">contact page</PageLink>.
        </p>
      </Section>
    </SitePage>
  )
}

/* ── Terms ───────────────────────────────────────────────────────────────── */

export function TermsPage() {
  return (
    <SitePage
      eyebrow="Terms of use"
      title={<>The terms, <em className="em">in plain words</em>.</>}
      lead="LunX is a free learning site made by a student team for the TSA Webmaster event. Using it means agreeing to these terms."
    >
      <Updated />

      <Section id="use" title="Using LunX">
        <p className="sp-p">
          You may use LunX for free, for your own learning or to teach a class. Please don’t try to
          break the site, pass off its lessons as your own work, or use it to harm anyone.
        </p>
      </Section>

      <Section id="content" title="The lessons">
        <p className="sp-p">
          The lessons explain how AI works in simplified form, for learning. They are written with
          care but may contain mistakes or fall out of date as AI tools change quickly. They are not
          professional, legal or academic advice. If you spot an error, please tell us through
          the <PageLink page="contact">contact page</PageLink>.
        </p>
        <p className="sp-p">
          Following your school’s rules about AI is your responsibility. The ethics module is meant
          to help with that, not to replace your teacher’s instructions.
        </p>
      </Section>

      <Section id="progress" title="Your progress">
        {CONNECTED ? (
          <p className="sp-p">
            Progress, XP, gems, streaks and badges are saved to your account on the LunX server and
            in your browser (see the <PageLink page="privacy">privacy policy</PageLink>). The server is
            run by the team for this project and may be reset or switched off; the Profile page can
            export a backup file you keep yourself. Gems, league trophies and challenge rewards have
            no money value and cannot be bought, sold or exchanged.
          </p>
        ) : (
        <p className="sp-p">
          Progress, XP, gems, streaks and badges are saved only in your browser (see
          the <PageLink page="privacy">privacy policy</PageLink>). They can be lost if you clear your
          browser data, switch devices or use private browsing — the Profile page can export a
          backup file and import it again on another browser. Gems and rewards have no money value
          and cannot be bought, sold or exchanged.
        </p>
        )}
      </Section>

      {CONNECTED && (
        <Section id="together" title="Friends, leagues and challenges">
          <p className="sp-p">
            Be kind. Choose a username that is appropriate for school, don’t harass anyone, and don’t
            try to win a league or a challenge by any means other than doing the course. XP is
            counted by the server from the lessons and practice you complete, and the team may reset
            a week’s board, remove a reward or close an account that breaks these rules. You can
            block or report anyone from their profile.
          </p>
        </Section>
      )}

      <Section id="ownership" title="Who owns what">
        <p className="sp-p">
          The lessons, illustrations, field guide and code of LunX belong to the team that made it.
          The typefaces are used under the SIL Open Font License, and the software libraries under
          their own licenses, listed on the <PageLink page="about" section="credits">About page</PageLink>.
          Product names mentioned in lessons, such as ChatGPT, Claude and Gemini, are trademarks of
          their owners; LunX is not affiliated with or endorsed by them.
        </p>
      </Section>

      <Section id="links" title="Links to other sites">
        <p className="sp-p">
          LunX links to a few outside sites, such as the TSA event page. We don’t control those
          sites and aren’t responsible for their content or privacy practices.
        </p>
      </Section>

      <Section id="warranty" title="No warranty">
        <p className="sp-p">
          LunX is provided as is, without guarantees that it will always be available, error-free
          or suited to a particular purpose. To the extent the law allows, the team is not liable for
          any loss that comes from using it, including lost progress.
        </p>
      </Section>

      <Section id="changes-terms" title="Changes">
        <p className="sp-p">
          We may update these terms; the date at the top changes when we do. Using LunX after an
          update means you accept the new terms. Questions go through
          the <PageLink page="contact">contact page</PageLink>.
        </p>
      </Section>
    </SitePage>
  )
}
