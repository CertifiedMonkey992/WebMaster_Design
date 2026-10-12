/* ═══════════════════════════════════════════════════════════════════════════
   live.js — TELLING AN OPEN PAGE THAT SOMETHING CHANGED
   ---------------------------------------------------------------------------
   GET /api/stream is a Server-Sent Events stream (text/event-stream) held
   open for as long as the learner has the site open. It carries no data a
   learner could not already fetch — only a nudge:

     event: changed
     data: {"kind":"friend-request"}

   and the page re-reads its summary (one request) at once, instead of
   waiting for the next poll. If the stream drops, the page reconnects and
   polls in the meantime, so nothing depends on it.

     · the browser opens it with fetch() and its bearer token in a header —
       never a token in a URL
     · a comment line every 25 s keeps proxies from closing it, and each
       beat re-checks the session: a stream whose session has ended closes
     · at most MAX_PER_USER streams per learner (the oldest goes) and
       MAX_TOTAL in all
     · nudges to one learner inside 150 ms are sent as one
   ═══════════════════════════════════════════════════════════════════════════ */

const HEARTBEAT_MS = 25000
const COALESCE_MS = 150
const MAX_PER_USER = 4
const MAX_TOTAL = 5000

export function createHub() {
  /** userId → Set of { res, alive } */
  const streams = new Map()
  /** userId → { timer, kinds } */
  const pending = new Map()
  let total = 0

  const write = (conn, text) => {
    try { conn.res.write(text) } catch { drop(conn) }
  }

  function drop(conn) {
    const set = streams.get(conn.userId)
    if (!set?.delete(conn)) return
    total -= 1
    if (!set.size) streams.delete(conn.userId)
    try { conn.res.end() } catch { /* already gone */ }
  }

  /**
   * Hold `res` open as an event stream for `userId`.
   * @param {() => boolean} alive  re-checked on each heartbeat (is the session still valid?)
   * @returns {boolean} false when the server is full (the caller answers 503)
   */
  function attach(userId, req, res, headers, alive) {
    if (total >= MAX_TOTAL) return false
    let set = streams.get(userId)
    if (!set) { set = new Set(); streams.set(userId, set) }
    if (set.size >= MAX_PER_USER) drop(set.values().next().value)

    res.writeHead(200, {
      ...headers,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      /* nginx and friends would otherwise hold the events back. */
      'X-Accel-Buffering': 'no',
    })
    req.socket.setKeepAlive?.(true)
    req.socket.setTimeout?.(0)
    const conn = { userId, res, alive }
    set.add(conn)
    total += 1
    /* The client waits this long before reconnecting after a drop. */
    write(conn, 'retry: 10000\n\nevent: ready\ndata: {}\n\n')
    const done = () => drop(conn)
    req.on('close', done)
    res.on('error', done)
    return true
  }

  /** Nudge every open page of `userId`. */
  function poke(userId, kind = 'update') {
    if (!streams.has(userId)) return
    let p = pending.get(userId)
    if (!p) {
      p = { kinds: new Set(), timer: null }
      pending.set(userId, p)
      p.timer = setTimeout(() => {
        pending.delete(userId)
        const data = JSON.stringify({ kinds: [...p.kinds] })
        for (const conn of streams.get(userId) ?? []) write(conn, `event: changed\ndata: ${data}\n\n`)
      }, COALESCE_MS)
      p.timer.unref?.()
    }
    p.kinds.add(kind)
  }

  /** End every stream of `userId` (signed out everywhere, suspended, deleted). */
  function close(userId) {
    for (const conn of [...(streams.get(userId) ?? [])]) drop(conn)
  }

  const beat = setInterval(() => {
    for (const set of [...streams.values()]) {
      for (const conn of [...set]) {
        let ok = false
        try { ok = conn.alive() } catch { ok = false }
        if (ok) write(conn, ': beat\n\n')
        else drop(conn)
      }
    }
  }, HEARTBEAT_MS)
  beat.unref?.()

  function closeAll() {
    clearInterval(beat)
    for (const p of pending.values()) clearTimeout(p.timer)
    pending.clear()
    for (const set of [...streams.values()]) for (const conn of [...set]) drop(conn)
  }

  return { attach, poke, close, closeAll, count: () => total, countFor: (id) => streams.get(id)?.size ?? 0 }
}

export default { createHub }
