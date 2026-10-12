/* ═══════════════════════════════════════════════════════════════════════════
   db.js — THE LUNX SERVER'S DATABASE
   ---------------------------------------------------------------------------
   SQLite, through Node's built-in `node:sqlite` (no dependency). One file on
   disk in production (LUNX_DB), `:memory:` in the tests.

   The rules that matter are in the SCHEMA, not only in code, so no request —
   replayed, raced or forged — can break them:

     · an email, a username, a friend code: UNIQUE
     · an XP payment: UNIQUE (user, source) — "answer:m01-l01:check:c1" pays
       once, ever, however many times it is sent
     · an event from the app: UNIQUE (user, event id) — a retried request is
       recognised and answered with what it got the first time
     · a reward: UNIQUE (user, kind, ref) — a week's promotion pays once
     · one leaderboard per learner per week: UNIQUE (user, week, kind)
     · one friendship per pair: PRIMARY KEY (a, b) with a < b
     · one pending request per pair, whichever way: a partial UNIQUE index

   Multi-step changes (finishing a week, accepting a request) run inside
   `tx()`: all of it happens, or none of it does.
   ═══════════════════════════════════════════════════════════════════════════ */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const MIGRATIONS = [
  /* 1 — revision 10: accounts, progress, activity, leagues, friends, challenges */
  `
  CREATE TABLE users (
    id                 TEXT PRIMARY KEY,
    email              TEXT NOT NULL UNIQUE,
    username           TEXT NOT NULL,
    username_key       TEXT NOT NULL UNIQUE,
    friend_code        TEXT NOT NULL UNIQUE,
    role               TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'judge')),
    is_seed            INTEGER NOT NULL DEFAULT 0,
    sandbox_owner      TEXT,
    password_hash      TEXT NOT NULL,
    recovery_hash      TEXT,
    failures           INTEGER NOT NULL DEFAULT 0,
    locked_until       INTEGER NOT NULL DEFAULT 0,
    timezone           TEXT NOT NULL DEFAULT 'UTC',
    tz_changed_at      INTEGER NOT NULL DEFAULT 0,
    avatar             TEXT NOT NULL DEFAULT 'evergreen',
    tier               INTEGER NOT NULL DEFAULT 0,
    best_tier          INTEGER NOT NULL DEFAULT 0,
    profile_visibility TEXT NOT NULL DEFAULT 'friends' CHECK (profile_visibility IN ('everyone', 'friends', 'nobody')),
    leagues_opt_in     INTEGER NOT NULL DEFAULT 1,
    find_by_username   INTEGER NOT NULL DEFAULT 1,
    find_by_email      INTEGER NOT NULL DEFAULT 0,
    created_at         INTEGER NOT NULL,
    last_seen_at       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE sessions (
    token_hash   TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   INTEGER NOT NULL,
    expires_at   INTEGER NOT NULL,
    last_used_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE progress (
    user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    rev        INTEGER NOT NULL,
    state      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE events (
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id   TEXT NOT NULL,
    kind       TEXT NOT NULL,
    status     TEXT NOT NULL,
    result     TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, event_id)
  );

  CREATE TABLE attempts (
    id           INTEGER PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    concept      TEXT,
    item_id      TEXT NOT NULL,
    module_id    TEXT NOT NULL,
    context      TEXT NOT NULL CHECK (context IN ('check', 'practice')),
    session_id   TEXT NOT NULL,
    correct      INTEGER NOT NULL,
    answer       TEXT,
    created_at   INTEGER NOT NULL
  );
  CREATE INDEX attempts_user_time ON attempts(user_id, created_at);
  CREATE INDEX attempts_session ON attempts(user_id, session_id);

  CREATE TABLE completions (
    id         INTEGER PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id    TEXT NOT NULL,
    session_id TEXT NOT NULL,
    first      INTEGER NOT NULL,
    perfect    INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE (user_id, session_id, item_id)
  );
  CREATE INDEX completions_user ON completions(user_id, created_at);

  CREATE TABLE practice_sessions (
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    mode       TEXT,
    topic      TEXT,
    answered   INTEGER NOT NULL,
    correct    INTEGER NOT NULL,
    xp         INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, session_id)
  );
  CREATE INDEX practice_sessions_time ON practice_sessions(user_id, created_at);

  CREATE TABLE practice_credits (
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    paid_at      INTEGER NOT NULL,
    PRIMARY KEY (user_id, question_key)
  );

  CREATE TABLE xp_ledger (
    id         INTEGER PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source     TEXT NOT NULL,
    amount     INTEGER NOT NULL CHECK (amount > 0),
    reason     TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE (user_id, source)
  );
  CREATE INDEX xp_user_time ON xp_ledger(user_id, created_at);

  CREATE TABLE friend_requests (
    id           TEXT PRIMARY KEY,
    from_user    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    via          TEXT,
    created_at   INTEGER NOT NULL,
    responded_at INTEGER,
    CHECK (from_user <> to_user)
  );
  CREATE UNIQUE INDEX friend_requests_one_pending
    ON friend_requests(min(from_user, to_user), max(from_user, to_user)) WHERE status = 'pending';
  CREATE INDEX friend_requests_to ON friend_requests(to_user, status);
  CREATE INDEX friend_requests_from ON friend_requests(from_user, status);

  CREATE TABLE friendships (
    user_a     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_a, user_b),
    CHECK (user_a < user_b)
  );
  CREATE INDEX friendships_b ON friendships(user_b);

  CREATE TABLE blocks (
    blocker    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (blocker, blocked),
    CHECK (blocker <> blocked)
  );
  CREATE INDEX blocks_blocked ON blocks(blocked);

  CREATE TABLE reports (
    id         INTEGER PRIMARY KEY,
    reporter   TEXT REFERENCES users(id) ON DELETE SET NULL,
    reported   TEXT REFERENCES users(id) ON DELETE SET NULL,
    reported_name TEXT,
    reason     TEXT NOT NULL,
    note       TEXT,
    status     TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE cohorts (
    id            TEXT PRIMARY KEY,
    kind          TEXT NOT NULL CHECK (kind IN ('league', 'tournament')),
    sandbox_owner TEXT,
    is_test       INTEGER NOT NULL DEFAULT 0,
    week_id       TEXT NOT NULL,
    tier          INTEGER NOT NULL,
    timezone      TEXT NOT NULL,
    offset_min    INTEGER NOT NULL,
    band          INTEGER NOT NULL DEFAULT 0,
    tournament_id TEXT,
    round         INTEGER,
    start_at      INTEGER NOT NULL,
    end_at        INTEGER NOT NULL,
    finalized_at  INTEGER,
    created_at    INTEGER NOT NULL
  );
  CREATE INDEX cohorts_open ON cohorts(kind, week_id, tier, finalized_at);
  CREATE INDEX cohorts_due ON cohorts(finalized_at, end_at);

  CREATE TABLE cohort_members (
    cohort_id  TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_id    TEXT NOT NULL,
    kind       TEXT NOT NULL,
    xp         INTEGER NOT NULL DEFAULT 0,
    xp_at      INTEGER NOT NULL DEFAULT 0,
    joined_at  INTEGER NOT NULL,
    final_rank INTEGER,
    outcome    TEXT,
    PRIMARY KEY (cohort_id, user_id)
  );
  CREATE UNIQUE INDEX cohort_members_one_per_week ON cohort_members(user_id, week_id, kind);

  CREATE TABLE tournament_entries (
    tournament_id TEXT NOT NULL,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        TEXT NOT NULL CHECK (status IN ('qualified', 'eliminated', 'finished')),
    round         INTEGER NOT NULL DEFAULT 0,
    qualified_at  INTEGER NOT NULL,
    PRIMARY KEY (tournament_id, user_id)
  );

  CREATE TABLE awards (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    ref        TEXT NOT NULL,
    tier       INTEGER,
    rank       INTEGER,
    gems       INTEGER NOT NULL DEFAULT 0,
    title      TEXT NOT NULL,
    reason     TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    claimed_at INTEGER,
    UNIQUE (user_id, kind, ref)
  );
  CREATE INDEX awards_user ON awards(user_id, created_at);

  CREATE TABLE challenges (
    id            TEXT PRIMARY KEY,
    creator       TEXT REFERENCES users(id) ON DELETE SET NULL,
    format        TEXT NOT NULL,
    topic         TEXT,
    target        INTEGER,
    status        TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
    cancel_reason TEXT,
    created_at    INTEGER NOT NULL,
    starts_at     INTEGER NOT NULL,
    ends_at       INTEGER NOT NULL,
    finalized_at  INTEGER
  );
  CREATE INDEX challenges_due ON challenges(status, ends_at);

  CREATE TABLE challenge_participants (
    challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL CHECK (status IN ('invited', 'accepted', 'declined', 'left')),
    responded_at INTEGER,
    final_score  INTEGER,
    final_rank   INTEGER,
    PRIMARY KEY (challenge_id, user_id)
  );
  CREATE INDEX challenge_participants_user ON challenge_participants(user_id, status);

  CREATE TABLE notifications (
    id         INTEGER PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    payload    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    read_at    INTEGER
  );
  CREATE INDEX notifications_user ON notifications(user_id, created_at);
  `,

  /* 2 — revision 11: reset links by email, moderators, suspensions */
  `
  ALTER TABLE users ADD COLUMN is_moderator INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN suspended_until INTEGER;
  ALTER TABLE users ADD COLUMN suspended_note TEXT;

  ALTER TABLE reports ADD COLUMN resolved_at INTEGER;
  ALTER TABLE reports ADD COLUMN resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE reports ADD COLUMN resolution TEXT;
  CREATE INDEX reports_status ON reports(status, created_at);
  CREATE INDEX reports_reported ON reports(reported);

  CREATE TABLE password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at    INTEGER
  );
  CREATE INDEX password_resets_user ON password_resets(user_id);

  CREATE TABLE moderation_log (
    id             INTEGER PRIMARY KEY,
    moderator      TEXT REFERENCES users(id) ON DELETE SET NULL,
    moderator_name TEXT,
    action         TEXT NOT NULL,
    target         TEXT REFERENCES users(id) ON DELETE SET NULL,
    target_name    TEXT,
    report_id      INTEGER,
    note           TEXT,
    created_at     INTEGER NOT NULL
  );
  CREATE INDEX moderation_log_time ON moderation_log(created_at);
  `,
]

/** SQLite takes numbers, strings, null and buffers — never booleans or undefined. */
function bindable(v) {
  if (v === undefined) return null
  if (typeof v === 'boolean') return v ? 1 : 0
  return v
}

/**
 * Open (and migrate) a database. Returns a small wrapper:
 *   get(sql, …params)  one row or undefined
 *   all(sql, …params)  every row
 *   run(sql, …params)  { changes, lastInsertRowid }
 *   tx(fn)             run fn inside a transaction (nested calls use savepoints)
 */
export function openDatabase(file = ':memory:') {
  if (file !== ':memory:') mkdirSync(path.dirname(path.resolve(file)), { recursive: true })
  const raw = new DatabaseSync(file)
  raw.exec('PRAGMA foreign_keys = ON')
  raw.exec('PRAGMA busy_timeout = 5000')
  if (file !== ':memory:') raw.exec('PRAGMA journal_mode = WAL')

  const statements = new Map()
  const prepare = (sql) => {
    let s = statements.get(sql)
    if (!s) {
      s = raw.prepare(sql)
      statements.set(sql, s)
    }
    return s
  }

  let depth = 0
  const db = {
    raw,
    get: (sql, ...params) => prepare(sql).get(...params.map(bindable)),
    all: (sql, ...params) => prepare(sql).all(...params.map(bindable)),
    run: (sql, ...params) => {
      const r = prepare(sql).run(...params.map(bindable))
      return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }
    },
    exec: (sql) => raw.exec(sql),
    tx(fn) {
      const name = `sp${depth}`
      raw.exec(depth === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${name}`)
      depth += 1
      try {
        const result = fn()
        depth -= 1
        raw.exec(depth === 0 ? 'COMMIT' : `RELEASE ${name}`)
        return result
      } catch (error) {
        depth -= 1
        raw.exec(depth === 0 ? 'ROLLBACK' : `ROLLBACK TO ${name}; RELEASE ${name}`)
        throw error
      }
    },
    close: () => raw.close(),
  }

  const version = Number(raw.prepare('PRAGMA user_version').get().user_version)
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.tx(() => {
      raw.exec(MIGRATIONS[v])
      raw.exec(`PRAGMA user_version = ${v + 1}`)
    })
  }
  return db
}

export default { openDatabase }
