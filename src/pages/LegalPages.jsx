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
  const analytics = SITE.analytics.enabled
  return (
    <SitePage
      eyebrow="Privacy policy"
      title={<>Your progress <em className="em">stays in your browser</em>.</>}
      lead="LunX has no server of its own, and the profiles it does have never leave your browser. This page lists everything it stores, everything that leaves your browser, and how to remove it."
    >
      <Updated />

      <Section id="summary" title="In short">
        <ul className="sp-list">
          <li>Nothing to register for: the whole course works without a profile.</li>
          <li>A profile, if you make one, is created in this browser and never sent anywhere.</li>
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
          LunX uses your browser’s local storage, which stays on your device. It keeps three entries, a fourth for each profile you create, and one more only if something goes wrong:
        </p>
        <dl className="sp-defs">
          <div>
            <dt><code>{STORAGE_KEY}</code></dt>
            <dd>Your course progress while you are signed out — the guest profile: lessons finished, XP and level, gems, hearts, streak and its history, quests, the daily bonus track, shop items and achievements — and your coursework: the part you reached in an unfinished lesson, the predictions you committed to, the reflections you typed into your Field Journal, the questions you missed (for review in Practice), and your Launch and Final Scan answers. LunX never asks for a name or email address here; a reflection holds whatever you choose to type, and like everything else in this entry it never leaves your browser.</dd>
          </div>
          <div>
            <dt><code>{ACCOUNTS_KEY}</code></dt>
            <dd>
              The profiles made on this browser, and which one is signed in. Each
              holds the display name and username you typed and a short digest of the
              passphrase — never the passphrase itself. Because nothing is transmitted
              or verified, that digest keeps two people’s progress apart on a shared
              computer; it does not secure anything, and anyone with this device can
              read the progress behind it. Use a passphrase you do not use elsewhere.
            </dd>
          </div>
          <div>
            <dt><code>{STORAGE_KEY}__&lt;profile&gt;</code></dt>
            <dd>One of these per profile, holding that profile’s progress in the same shape as the entry above. Signing out of a profile leaves it in place; removing the profile removes it.</dd>
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
          LunX is written for high school students. It asks no student for personal information,
          and the course works in full without giving any — a profile is optional, and the name
          and username it asks for can be anything at all, because nothing is verified and
          nothing is sent. Teachers can use it in class without registering anyone anywhere.
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
        <p className="sp-p">
          Progress, XP, gems, streaks and badges are saved only in your browser (see
          the <PageLink page="privacy">privacy policy</PageLink>). They can be lost if you clear your
          browser data, switch devices or use private browsing — the Profile page can export a
          backup file and import it again on another browser. Gems and rewards have no money value
          and cannot be bought, sold or exchanged.
        </p>
      </Section>

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
