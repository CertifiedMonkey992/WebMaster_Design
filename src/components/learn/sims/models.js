/* ═══════════════════════════════════════════════════════════════════════════
   models.js — THE COURSE'S SMALL LANGUAGE MODELS
   ---------------------------------------------------------------------------
   Three real, tiny models, trained in the browser on corpus.js:

     n-gram      counts which word follows which two words; predicts the
                 next word from its last two (a context window of 2)
     BPE         byte-pair encoding: the tokenizer method real language
                 models use, learning word pieces by merging the most
                 frequent neighbouring pair, again and again
     embeddings  a word is described by the words around it (positive
                 pointwise mutual information over a ±3-word window), and
                 similar descriptions mean similar words

   Large models do the same jobs with billions of parameters instead of a
   few hundred counts. The mechanisms — and the quirks they cause — are the
   ones the lessons teach.
   ═══════════════════════════════════════════════════════════════════════════ */

export const sentences = (text) =>
  text.split(/\n|(?<=\.)/).map((s) => s.trim()).filter(Boolean)
    .map((s) => s.toLowerCase().split(/\s+/).filter(Boolean))

/* ── n-gram next-word model ────────────────────────────────────────────── */

export function trainNgram(text) {
  const tri = new Map()
  const bi = new Map()
  const uni = new Map()
  const bump = (map, key, word) => {
    let m = map.get(key)
    if (!m) { m = new Map(); map.set(key, m) }
    m.set(word, (m.get(word) ?? 0) + 1)
  }
  for (const words of sentences(text)) {
    const w = ['<s>', '<s>', ...words]
    for (let i = 2; i < w.length; i++) {
      bump(tri, `${w[i - 2]} ${w[i - 1]}`, w[i])
      bump(bi, w[i - 1], w[i])
      uni.set(w[i], (uni.get(w[i]) ?? 0) + 1)
    }
  }
  return { tri, bi, uni }
}

/**
 * The next-word distribution after the last two words, reshaped by
 * temperature: p ∝ count^(1/T). Backs off to one word, then to none, when
 * the pair was never seen. Returns { dist: [{ word, p, count }], used }.
 */
export function nextDistribution(model, context, temperature = 1) {
  /* A sentence starts fresh after a full stop: pad with start markers. */
  const cut = context.lastIndexOf('.')
  const live = ['<s>', '<s>', ...(cut >= 0 ? context.slice(cut + 1) : context)]
  const [a, b] = live.slice(-2)
  let counts = model.tri.get(`${a} ${b}`)
  let used = 2
  if (!counts) { counts = model.bi.get(b); used = 1 }
  if (!counts) { counts = model.uni; used = 0 }
  const T = Math.max(0.05, temperature)
  const entries = [...counts.entries()]
  const weights = entries.map(([, c]) => Math.pow(c, 1 / T))
  const sum = weights.reduce((s, v) => s + v, 0)
  const dist = entries.map(([word, count], i) => ({ word, count, p: weights[i] / sum }))
  dist.sort((x, y) => y.p - x.p)
  return { dist, used }
}

export function sampleFrom(dist, rand) {
  let r = rand()
  for (const d of dist) { r -= d.p; if (r <= 0) return d.word }
  return dist[dist.length - 1]?.word
}

/* ── Byte-pair encoding ────────────────────────────────────────────────── */

const WORD_START = '▁'

/** Learn up to `maxMerges` merges from a text. */
export function trainBPE(text, maxMerges = 400) {
  const freq = new Map()
  for (const words of sentences(text)) for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1)
  let vocab = [...freq.entries()].map(([w, n]) => ({ parts: [WORD_START + w[0], ...w.slice(1)], n }))
  const merges = []
  for (let m = 0; m < maxMerges; m++) {
    const pairs = new Map()
    for (const { parts, n } of vocab) {
      for (let i = 0; i < parts.length - 1; i++) {
        const key = `${parts[i]}\u0000${parts[i + 1]}`
        pairs.set(key, (pairs.get(key) ?? 0) + n)
      }
    }
    let best = null
    let bestN = 1
    for (const [k, n] of pairs) if (n > bestN || (n === bestN && best && k < best)) { best = k; bestN = n }
    if (!best || bestN < 2) break
    const [l, r] = best.split('\u0000')
    merges.push([l, r])
    vocab = vocab.map(({ parts, n }) => ({ parts: mergeOnce(parts, l, r), n }))
  }
  return merges
}

function mergeOnce(parts, l, r) {
  const out = []
  for (let i = 0; i < parts.length; i++) {
    if (i < parts.length - 1 && parts[i] === l && parts[i + 1] === r) { out.push(l + r); i++ }
    else out.push(parts[i])
  }
  return out
}

/** Split a text into tokens using the first `n` learned merges. */
export function tokenize(text, merges, n = merges.length) {
  const tokens = []
  for (const raw of text.toLowerCase().split(/(\s+|[.,!?;:'’"])/)) {
    if (!raw || /^\s+$/.test(raw)) continue
    let parts = [WORD_START + raw[0], ...raw.slice(1)]
    for (let m = 0; m < n && m < merges.length; m++) parts = mergeOnce(parts, merges[m][0], merges[m][1])
    tokens.push(...parts)
  }
  return tokens
}

/* ── Word embeddings from co-occurrence ────────────────────────────────── */

const STOP = new Set(['the', 'a', 'an', 'and', 'at', 'on', 'for', 'of', 'to', 'in', 'is', 'was', 'with', 'from', 'all', 'its', 'every', 'some', 'no', '.', 'would', 'said'])

export function buildEmbeddings(text, window = 3) {
  const sents = sentences(text).map((s) => s.filter((w) => w !== '.'))
  const vocab = [...new Set(sents.flat())].filter((w) => !STOP.has(w))
  const index = new Map(vocab.map((w, i) => [w, i]))
  const V = vocab.length
  const co = Array.from({ length: V }, () => new Float64Array(V))
  for (const s of sents) {
    for (let i = 0; i < s.length; i++) {
      const a = index.get(s[i])
      if (a === undefined) continue
      for (let j = Math.max(0, i - window); j <= Math.min(s.length - 1, i + window); j++) {
        if (j === i) continue
        const b = index.get(s[j])
        if (b === undefined) continue
        co[a][b] += 1
      }
    }
  }
  const row = co.map((r) => r.reduce((s, v) => s + v, 0))
  const total = row.reduce((s, v) => s + v, 0) || 1
  const vecs = co.map((r, a) => {
    const v = new Float64Array(V)
    for (let b = 0; b < V; b++) {
      if (!r[b]) continue
      const pmi = Math.log((r[b] * total) / (row[a] * row[b]))
      v[b] = Math.max(0, pmi)
    }
    return v
  })
  const norm = vecs.map((v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1)

  const cosine = (u, v, nu, nv) => {
    let dot = 0
    for (let i = 0; i < V; i++) dot += u[i] * v[i]
    return dot / (nu * nv)
  }
  const sim = (a, b) => {
    if (!index.has(a) || !index.has(b)) return 0
    const i = index.get(a), j = index.get(b)
    return cosine(vecs[i], vecs[j], norm[i], norm[j])
  }
  const neighbours = (w, k = 5) => vocab
    .filter((x) => x !== w)
    .map((x) => ({ word: x, sim: sim(w, x) }))
    .sort((p, q) => q.sim - p.sim)
    .slice(0, k)
  /** A text's vector: the average of its known words' unit vectors. */
  const textVec = (text2) => {
    const v = new Float64Array(V)
    let n = 0
    for (const w of text2.toLowerCase().split(/\W+/)) {
      if (!index.has(w)) continue
      const i = index.get(w)
      for (let d = 0; d < V; d++) v[d] += vecs[i][d] / norm[i]
      n++
    }
    return { v, n }
  }
  const textSim = (t1, t2) => {
    const a = textVec(t1), b = textVec(t2)
    if (!a.n || !b.n) return 0
    const na = Math.sqrt(a.v.reduce((s, x) => s + x * x, 0)) || 1
    const nb = Math.sqrt(b.v.reduce((s, x) => s + x * x, 0)) || 1
    return cosine(a.v, b.v, na, nb)
  }

  /** 2D positions for a set of words: their top two principal components. */
  const project = (words) => {
    const rows = words.filter((w) => index.has(w)).map((w) => {
      const i = index.get(w)
      return Array.from(vecs[i], (x) => x / norm[i])
    })
    const mean = new Array(V).fill(0)
    rows.forEach((r) => r.forEach((x, d) => { mean[d] += x / rows.length }))
    const X = rows.map((r) => r.map((x, d) => x - mean[d]))
    const comps = []
    for (let c = 0; c < 2; c++) {
      let v = Array.from({ length: V }, (_, d) => Math.sin(d * 1.7 + c * 3.1))
      for (let it = 0; it < 80; it++) {
        const Xv = X.map((r) => r.reduce((s, x, d) => s + x * v[d], 0))
        const next = new Array(V).fill(0)
        X.forEach((r, i) => r.forEach((x, d) => { next[d] += x * Xv[i] }))
        for (const p of comps) {
          const dot = next.reduce((s, x, d) => s + x * p[d], 0)
          for (let d = 0; d < V; d++) next[d] -= dot * p[d]
        }
        const n = Math.sqrt(next.reduce((s, x) => s + x * x, 0)) || 1
        v = next.map((x) => x / n)
      }
      comps.push(v)
    }
    return words.filter((w) => index.has(w)).map((w, i) => ({
      word: w,
      x: X[i].reduce((s, x, d) => s + x * comps[0][d], 0),
      y: X[i].reduce((s, x, d) => s + x * comps[1][d], 0),
    }))
  }

  /** How strongly a word's own description (its PMI coordinates) leans toward
   *  one group of context words over another, e.g. [he, his] vs [she, her]. */
  const association = (w, groupA, groupB) => {
    if (!index.has(w)) return 0
    const v = vecs[index.get(w)]
    const sum = (g) => g.reduce((s, x) => s + (index.has(x) ? v[index.get(x)] : 0), 0)
    return sum(groupA) - sum(groupB)
  }

  return { vocab, index, sim, neighbours, textSim, project, association, has: (w) => index.has(w) }
}
