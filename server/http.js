/* ═══════════════════════════════════════════════════════════════════════════
   http.js — REQUESTS IN, JSON OUT
   ---------------------------------------------------------------------------
   A small router over node:http, and the rules every response follows:

     · JSON only, with a size limit on every body
     · CORS for the site's own origins only (LUNX_ALLOWED_ORIGINS) — the
       browser refuses every other page's attempt to call the API
     · no caching, no sniffing, no framing, no referrer
     · rate limits per address and per account, answered with 429 and a
       Retry-After, so search, sign-in and requests cannot be hammered
     · errors as { error: { code, message } } with an honest status; an
       unexpected failure is logged and answered as a plain 500, never with
       its stack
   ═══════════════════════════════════════════════════════════════════════════ */

export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export const fail = (status, code, message, extra) => { throw new HttpError(status, code, message, extra) }

/* ── Rate limits ─────────────────────────────────────────────────────────── */

/** Fixed windows in memory. Enough for one server process; a restart forgets. */
export function createLimiter(now) {
  const buckets = new Map()
  return {
    /** Count one hit; throws 429 when `limit` is exceeded in `windowMs`. */
    hit(name, key, limit, windowMs) {
      const id = `${name}:${key}`
      const t = now()
      let b = buckets.get(id)
      if (!b || t >= b.resetAt) {
        b = { count: 0, resetAt: t + windowMs }
        buckets.set(id, b)
      }
      b.count += 1
      if (b.count > limit) {
        const seconds = Math.max(1, Math.ceil((b.resetAt - t) / 1000))
        throw new HttpError(429, 'rate_limited', `Too many requests. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`, { retryAfter: seconds })
      }
    },
    /** Forget expired windows (called by the server's housekeeping). */
    sweep() {
      const t = now()
      for (const [id, b] of buckets) if (t >= b.resetAt) buckets.delete(id)
    },
    reset() { buckets.clear() },
  }
}

/* ── Routing ─────────────────────────────────────────────────────────────── */

function compile(pattern) {
  const keys = []
  const re = new RegExp(`^${pattern.replace(/\//g, '\\/').replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^\\/]+)' })}$`)
  return { re, keys }
}

export function createRouter() {
  const routes = []
  return {
    add(method, pattern, handler, opts = {}) {
      routes.push({ method, ...compile(pattern), handler, opts })
    },
    match(method, pathname) {
      let allowed = false
      for (const r of routes) {
        const m = r.re.exec(pathname)
        if (!m) continue
        allowed = true
        if (r.method !== method) continue
        const params = {}
        r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
        return { route: r, params }
      }
      return allowed ? { notAllowed: true } : null
    },
  }
}

/* ── Bodies ──────────────────────────────────────────────────────────────── */

export function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    let tooLarge = false
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (tooLarge) {
        /* Drained, not stored, so the 413 can still be answered — unless it
           is so large that draining it would be the attack. */
        if (size > limit * 10) req.destroy()
        return
      }
      if (size > limit) {
        tooLarge = true
        chunks.length = 0
        reject(new HttpError(413, 'too_large', 'That request is too large.'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (tooLarge) return
      if (!chunks.length) { resolve({}); return }
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new HttpError(400, 'bad_json', 'Send a JSON object.'))
          return
        }
        resolve(parsed)
      } catch {
        reject(new HttpError(400, 'bad_json', 'That request is not valid JSON.'))
      }
    })
    req.on('error', reject)
  })
}

/* ── Responses ───────────────────────────────────────────────────────────── */

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'cross-origin',
}

export function corsHeaders(origin, allowed) {
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  }
}

export function send(res, status, body, headers = {}) {
  if (res.headersSent) return
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers })
  res.end(status === 204 ? undefined : JSON.stringify(body ?? {}))
}

export default { HttpError, fail, createLimiter, createRouter, readJson, corsHeaders, send }
