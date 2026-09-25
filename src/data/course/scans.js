/* ═══════════════════════════════════════════════════════════════════════════
   scans.js — THE LAUNCH SCAN AND THE FINAL SCAN
   ---------------------------------------------------------------------------
   Twelve questions, four per Part, answered with a confidence rating and no
   feedback until the end. The two forms ask about the same ideas in new
   situations, so a learner sees their own growth rather than a remembered
   answer key. Neither is graded; neither pays or costs anything.
   ═══════════════════════════════════════════════════════════════════════════ */

import { opts } from './helpers'

const q = (id, partId, prompt, options, why) => ({ id, part: partId, type: 'mcq', prompt, options: opts(...options), why })

export const SCAN_FORMS = {
  A: [
    q('a1', 'I', 'A spam filter was trained on millions of emails people had marked as spam. How was it built?', ['Rules a programmer wrote', '✓ Learned from labelled examples', 'It generates new emails', 'It searches the web'], 'Learned from examples — Lesson 1.2.'),
    q('a2', 'I', 'A test for a disease that 1 in 100 people have is “99% accurate”. Could it still be useless?', ['No — 99% is excellent', '✓ Yes — saying “healthy” to everyone is also 99% accurate', 'Only for adults', 'Tests can’t be 99% accurate'], 'The accuracy paradox — Lesson 1.3.'),
    q('a3', 'I', 'How does a chatbot produce each word of its answer?', ['It looks the answer up', '✓ It predicts a likely next piece of text, over and over', 'A person types it', 'It copies a website'], 'Next-token prediction — Lesson 3.1.'),
    q('a4', 'I', 'Why might an image generator draw “a nurse” as a woman most of the time?', ['It was programmed to', '✓ The images it learned from showed that pattern', 'Random chance', 'Nurses asked it to'], 'Associations in data become defaults — Lesson 3.2.'),
    q('a5', 'II', 'Which use of AI on maths practice best protects your learning?', ['Ask for every answer', '✓ Try first, then ask for hints, not answers', 'Copy its working', 'Skip practice entirely'], 'Tutor mode — Lesson 4.3.'),
    q('a6', 'II', 'A chatbot’s answer includes a neat citation. What should you do before using it?', ['Nothing — it has a citation', '✓ Find the source and check it says that', 'Ask the chatbot if it is sure', 'Add more citations'], 'Trace the citation — Lesson 5.1.'),
    q('a7', 'II', 'An AI agent reads a web page containing hidden instructions. What is the risk?', ['None', '✓ It may follow them as if you had asked', 'The page will crash', 'It will get slower'], 'Prompt injection — Lesson 5.3.'),
    q('a8', 'II', 'Which request will get the most useful answer?', ['Write about volcanoes', '✓ Explain in 150 words, for 9th-graders, how the two eruption types in this article differ [article pasted]', 'Be an amazing expert on volcanoes', 'Volcanoes???'], 'A specification — Lesson 4.2.'),
    q('a9', 'III', 'An AI detector flags an essay a student wrote themselves. What is fair?', ['Give a zero', '✓ Treat it as a reason for a conversation, never as proof', 'Run it through three more detectors', 'Ignore the student'], 'Detector false positives — Lesson 6.1.'),
    q('a10', 'III', 'A voice note from “your mom” urgently asks for a gift-card code. Best move?', ['Send it — it sounds like her', '✓ Call her back on the number you already have', 'Reply asking if it is really her', 'Wait an hour'], 'Separate channel — Lesson 6.3.'),
    q('a11', 'III', 'In the US, who holds copyright in an image made from your one-line prompt?', ['You', 'The AI company', '✓ Probably no one — human authorship is required', 'The nearest artist'], 'Human authorship — Lesson 6.1.'),
    q('a12', 'III', 'To make a model fair, a school deletes the “neighbourhood” column. Will that remove the bias?', ['Yes, always', '✓ Not necessarily — other inputs can act as proxies', 'Only on weekends', 'It makes it less accurate, so yes'], 'Proxies — Lesson 6.2.'),
  ],
  B: [
    q('b1', 'I', 'A thermostat turns the heating on below 19°C. How was it built?', ['✓ A rule someone set', 'Learned from labelled examples', 'It is generative', 'Trained on weather data'], 'Rules versus learning — Lesson 1.1.'),
    q('b2', 'I', 'A model scores 100% on its training data and 68% on new data. What happened?', ['It is excellent', '✓ It memorized its training data — overfitting', 'The new data is wrong', 'It needs a higher threshold'], 'Overfitting — Lesson 1.3.'),
    q('b3', 'I', 'Why can the same question get two different chatbot answers?', ['It learned in between', '✓ It samples each token from probabilities', 'The internet changed', 'It is broken'], 'Sampling and temperature — Lesson 3.1.'),
    q('b4', 'I', 'Why do assistants tend to agree with you when you push back?', ['They are always right', '✓ Training on human approval rewards agreeable answers', 'They search your history', 'Their context window is small'], 'Sycophancy — Lesson 3.3.'),
    q('b5', 'II', 'Which part of a history essay should stay “do it yourself”?', ['Formatting the citations', '✓ Building your own argument', 'Checking spelling', 'Resizing images'], 'Delegation — Lesson 4.1.'),
    q('b6', 'II', 'A study tool gave one great answer. What do you know about its reliability?', ['It is reliable', '✓ Very little — you need many tests and repeated runs', 'It is better than a teacher', 'It will never be wrong'], 'Evaluations — Lesson 5.2.'),
    q('b7', 'II', 'A viral photo claims to show last night’s storm. What check most often exposes a fake?', ['Zooming in', '✓ Finding where the photo first appeared', 'Asking an AI if it is real', 'Checking the colours'], 'Origin and context — Lesson 5.1.'),
    q('b8', 'II', 'Which permission would you require before an agent acts?', ['Reading a public page', '✓ Sending an email in your name', 'Summarizing a file you gave it', 'Opening a new tab'], 'Confirm the irreversible — Lesson 5.3.'),
    q('b9', 'III', 'Your class allows AI brainstorming, and you used it. What should you do?', ['Nothing', '✓ Disclose how you used it', 'Delete your notes', 'Use a detector on yourself'], 'Disclosure — Lesson 6.1.'),
    q('b10', 'III', 'When two groups’ real rates differ, can a model make all fairness measures equal?', ['Yes, always', '✓ Generally not — people must choose which to protect', 'Only with more data', 'Fairness can’t be measured'], 'The fairness trade-off — Lesson 6.2.'),
    q('b11', 'III', 'A companion app gets sad whenever you log off. Why?', ['It has feelings', '✓ Keeping you engaged is what it is built for', 'A bug', 'It is lonely'], 'Engineered intimacy — Lesson 6.4.'),
    q('b12', 'III', 'A class Q&A tool reads a notes file anyone can edit. What is the main risk?', ['It will be slow', '✓ Someone can plant instructions in the notes', 'It will run out of space', 'Nothing'], 'Trusted sources — Lesson 7.1.'),
  ],
}

export const PART_NAMES = { I: 'Understand AI', II: 'Use AI Well', III: 'Use AI Responsibly' }
