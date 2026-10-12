/* ═══════════════════════════════════════════════════════════════════════════
   mail.js — THE ONE EMAIL THE SERVER SENDS
   ---------------------------------------------------------------------------
   A password-reset link, when a learner asks for one — and only if the
   people running the server have given it a mail provider. Without one the
   server sends nothing, says so (/api/health → mail: false), and a
   forgotten password is reset with the recovery code, as on a local build.

   No dependency: a small SMTP client over node:net and node:tls.

     · implicit TLS (port 465, or LUNX_SMTP_SECURE=1), or STARTTLS on any
       other port. A server that offers neither is refused unless it is on
       this machine — a password never crosses a network in the clear
     · AUTH PLAIN when a username is set
     · one message per connection: MAIL FROM, RCPT TO, DATA, QUIT
     · plain text, UTF-8, base64 body; a header with a line break in it is
       refused, so nothing a learner typed can add a header

   The modes (config.mail.mode):
     smtp     send through LUNX_SMTP_HOST
     outbox   development only: write each message to server/data/mail/ as
              an .eml file, so the reset flow can be tried without a provider
     off      send nothing (the default)
   ═══════════════════════════════════════════════════════════════════════════ */

import net from 'node:net'
import tls from 'node:tls'
import os from 'node:os'
import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

const noBreaks = (v, what) => {
  const s = String(v ?? '')
  if (/[\r\n]/.test(s)) throw new Error(`mail: a line break in ${what}`)
  return s
}

/** RFC 2047 for a header with anything beyond printable ASCII in it. */
const encodeHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`)

const bareAddress = (from) => {
  const m = /<([^>]+)>/.exec(from)
  return (m ? m[1] : from).trim()
}

/** The message as it goes over the wire (CRLF line ends, dot-stuffed by the sender). */
export function formatMessage({ from, to, subject, text, date = new Date(), domain = 'lunx.local' }) {
  const body = Buffer.from(String(text).replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n')
  return [
    `From: ${noBreaks(from, 'From')}`,
    `To: ${noBreaks(to, 'To')}`,
    `Subject: ${encodeHeader(noBreaks(subject, 'Subject'))}`,
    `Date: ${date.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${randomBytes(12).toString('hex')}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
    '',
    body,
  ].join('\r\n')
}

/* ── The SMTP conversation ───────────────────────────────────────────────── */

/** Read replies off a socket: each `next()` resolves to { code, lines }. */
function replyReader(socket) {
  let buffer = ''
  let lines = []
  const ready = []
  const waiting = []
  let failure = null

  const deliver = (reply) => (waiting.length ? waiting.shift().resolve(reply) : ready.push(reply))
  const onData = (chunk) => {
    buffer += chunk.toString('utf8')
    let i
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).replace(/\r$/, '')
      buffer = buffer.slice(i + 1)
      lines.push(line)
      /* "250-…" continues a reply; "250 …" ends it. */
      if (/^\d{3}(?: |$)/.test(line)) {
        deliver({ code: Number(line.slice(0, 3)), lines })
        lines = []
      }
    }
  }
  const onError = (error) => {
    failure = error
    while (waiting.length) waiting.shift().reject(error)
  }
  socket.on('data', onData)
  socket.on('error', onError)
  socket.on('close', () => onError(failure ?? new Error('mail: the connection closed')))

  return {
    next() {
      if (ready.length) return Promise.resolve(ready.shift())
      if (failure) return Promise.reject(failure)
      return new Promise((resolve, reject) => waiting.push({ resolve, reject }))
    },
    detach() {
      socket.off('data', onData)
      socket.off('error', onError)
    },
  }
}

/**
 * Send one message over SMTP.
 * @param {{ host: string, port: number, secure?: boolean, user?: string, pass?: string, rejectUnauthorized?: boolean, timeoutMs?: number }} smtp
 * @param {{ from: string, to: string, raw: string }} message
 */
export async function smtpSend(smtp, { from, to, raw }) {
  /* A server on this machine may talk in the clear; one elsewhere may not. */
  const { host, port, secure = false, user, pass, rejectUnauthorized = true, timeoutMs = 20000, allowPlain = LOCAL_HOSTS.has(host) } = smtp
  const helo = os.hostname().replace(/[^A-Za-z0-9.-]/g, '') || 'lunx'

  let socket = await new Promise((resolve, reject) => {
    const s = secure
      ? tls.connect({ host, port, servername: net.isIP(host) ? undefined : host, rejectUnauthorized }, () => resolve(s))
      : net.connect({ host, port }, () => resolve(s))
    s.once('error', reject)
  })
  socket.setTimeout(timeoutMs, () => socket.destroy(new Error('mail: the mail server took too long')))

  let reader = replyReader(socket)
  const write = (line) => socket.write(`${line}\r\n`)
  const expect = async (codes, step) => {
    const reply = await reader.next()
    if (!codes.includes(reply.code)) throw new Error(`mail: ${step} was refused (${reply.code})`)
    return reply
  }

  try {
    await expect([220], 'the greeting')
    write(`EHLO ${helo}`)
    let ehlo = await expect([250], 'EHLO')

    if (!secure) {
      const offersTls = ehlo.lines.some((l) => /^250[- ]STARTTLS\b/i.test(l))
      if (offersTls) {
        write('STARTTLS')
        await expect([220], 'STARTTLS')
        reader.detach()
        socket = await new Promise((resolve, reject) => {
          const s = tls.connect({ socket, servername: net.isIP(host) ? undefined : host, rejectUnauthorized }, () => resolve(s))
          s.once('error', reject)
        })
        reader = replyReader(socket)
        write(`EHLO ${helo}`)
        ehlo = await expect([250], 'EHLO after STARTTLS')
      } else if (!allowPlain) {
        throw new Error('mail: the mail server offers no encryption, so nothing was sent')
      }
    }

    if (user) {
      write(`AUTH PLAIN ${Buffer.from(`\0${user}\0${pass ?? ''}`, 'utf8').toString('base64')}`)
      await expect([235], 'sign-in to the mail server')
    }

    write(`MAIL FROM:<${noBreaks(bareAddress(from), 'From')}>`)
    await expect([250], 'MAIL FROM')
    write(`RCPT TO:<${noBreaks(bareAddress(to), 'To')}>`)
    await expect([250, 251], 'RCPT TO')
    write('DATA')
    await expect([354], 'DATA')
    /* A line that starts with a dot gets a second one (RFC 5321 §4.5.2). */
    socket.write(`${raw.replace(/\r\n\./g, '\r\n..')}\r\n.\r\n`)
    await expect([250], 'the message')
    write('QUIT')
    /* The message is already accepted; a server that hangs up instead of
       saying goodbye changes nothing. */
    await reader.next().catch(() => {})
  } finally {
    socket.end()
  }
}

/* ── The mailer the app uses ─────────────────────────────────────────────── */

/**
 * @param {{ mode: 'smtp'|'outbox'|'off', from?: string, smtp?: object, outboxDir?: string }} mail
 * @returns {{ enabled: boolean, mode: string, send: (m: { to: string, subject: string, text: string }) => Promise<void> }}
 */
export function createMailer(mail = { mode: 'off' }) {
  const mode = mail.mode ?? 'off'
  if (mode === 'off') return { enabled: false, mode, send: async () => {} }
  const from = mail.from || 'LunX <no-reply@lunx.local>'
  const domain = bareAddress(from).split('@')[1] || 'lunx.local'

  if (mode === 'outbox') {
    const dir = mail.outboxDir
    return {
      enabled: true,
      mode,
      async send({ to, subject, text }) {
        mkdirSync(dir, { recursive: true })
        const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}.eml`)
        writeFileSync(file, formatMessage({ from, to, subject, text, domain }))
        /* The file's name, never the address. */
        console.log(`[mail] development outbox: ${file}`)
      },
    }
  }

  return {
    enabled: true,
    mode,
    send: ({ to, subject, text }) => smtpSend(mail.smtp, { from, to, raw: formatMessage({ from, to, subject, text, domain }) }),
  }
}

export default { createMailer, smtpSend, formatMessage }
