/* shared.js — models more than one simulation uses, built once per page.
   The embeddings from Lesson 3.2 are the same ones the résumé screener in
   Lessons 5.2 and 6.2 runs on, so a learner audits a model they have
   already looked inside. */

import { MEANING_TEXT } from './corpus'
import { buildEmbeddings } from './models'

let embeddings = null

export function getEmbeddings() {
  if (!embeddings) embeddings = buildEmbeddings(MEANING_TEXT)
  return embeddings
}
