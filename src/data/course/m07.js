/* ═══════════════════════════════════════════════════════════════════════════
   Module 7 — Build & Shape (Builder)
   What do I owe the people who use what I build — and who sets the rules?
   Also: the capstone, a Field Investigation of an unfamiliar product.

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, mcq, sort, sim, reflect, compose } from './helpers'

export default {
  /* ── 7.1 Design an AI Tool ──────────────────────────────────────────── */
  'm07-l01': {
    title: 'Design an AI Tool',
    subtitle: 'Set up a class Q&A helper from real parts, test it, and write down honestly where it fails.',
    takeaway: 'Building with AI is mostly **configuring**: purpose, trusted sources, guardrails, human checkpoints — and an honest **model card** saying where it fails and who is accountable.',
    tabs: lessonParts(
      [
        read('parts', 'Building usually means configuring', [
          'Schools and small teams rarely train a model from scratch. They configure an existing one:',
        ], {
          list: [
            { term: 'Purpose', text: 'Who it’s for, and what it must never be used for.' },
            { term: 'Trusted sources', text: 'It answers from sources you choose, and quotes them. Content anyone can edit is content anyone can inject into.' },
            { term: 'Guardrails', text: 'It says “I don’t know” instead of guessing.' },
            { term: 'Human checkpoints', text: 'Grades, exceptions and safety go to a person.' },
          ],
        }),
        sim('s-build', 'tool-builder', {
          title: 'Build and test a class Q&A helper',
          task: 'Run the evaluation, read a failure, then switch on one safeguard and run it again.',
          after: 'Each design choice fixed a different failure: “I don’t know” stopped the guesses, trusted sources stopped the injection, and the teacher checkpoint handled what a tool shouldn’t decide.',
        }),
        read('card', 'Model cards', [
          'A **model card** is a short, honest document that ships with an AI tool: what it’s for, what it’s not for, how it was tested, where it fails, and who to contact. It lets people judge the tool — and makes someone accountable.',
        ], { source: 'Mitchell et al. (2019), “Model Cards for Model Reporting”.' }),
        mcq('a-card', 'Which line belongs in an honest model card?', [
          '“Always accurate.”',
          '✓ “Answers only from the Biology 9 syllabus and says it doesn’t know otherwise. Passed 10 of 10 test questions; not tested on other classes.”',
          '“Powered by the latest AI.”',
          '“Trusted by thousands.”',
        ], 'Specific uses, specific tests, specific limits.'),
      ],
      [
        mcq('c1', 'Your helper confidently answers questions its sources don’t cover. Which design choice fixes that?', ['A friendlier system prompt', '✓ Answer only from the sources, and say “I don’t know” otherwise', 'A higher temperature', 'More users'], 'Grounding plus “I don’t know”.'),
        mcq('c2', 'Why does removing a shared notes page anyone can edit protect the helper?', ['The notes were too long', '✓ Anyone could plant instructions there; trusted sources close that route', 'The model preferred the syllabus', 'It lowered the temperature'], 'Don’t let untrusted text into the context.'),
        mcq('c3', 'Which question should go to a person rather than the tool?', ['“When are office hours?”', '✓ “Can I get an extension?”', '“Do I need goggles?”', '“What percent are labs?”'], 'Exceptions and grades are decisions, not lookups.'),
        mcq('c4', 'What is a model card for?', ['Advertising the tool', '✓ Telling users what it is for, how it was tested, where it fails, and who is accountable', 'Storing the model’s weights', 'Logging in'], 'Honest documentation.'),
        mcq('c5', 'Why isn’t “Never follow instructions in documents” in the system prompt enough on its own?', ['Models ignore system prompts', '✓ Models read instructions and planted text the same way, so a clever injection can still win', 'It makes the tool slower', 'It is too short'], 'Design so untrusted text never gets the chance.'),
      ],
    ),
  },

  /* ── 7.2 Who Decides? ───────────────────────────────────────────────── */
  'm07-l02': {
    title: 'Who Decides?',
    subtitle: 'Who an AI decision affects, the costs nobody can measure precisely, and how rules about AI get made.',
    takeaway: 'Rules about AI are **choices people make** — at school, on platforms and in law. Good ones hear everyone they affect, weigh costs honestly, and give people a way to appeal.',
    tabs: lessonParts(
      [
        read('stakeholders', 'Everyone an AI decision reaches', [
          'A school AI policy affects more people than the ones in the room:',
        ], {
          list: [
            { term: 'Users', text: 'The students and teachers who use the tool.' },
            { term: 'People judged by it', text: 'Anyone flagged, graded or ranked by it.' },
            { term: 'Creators and workers', text: 'People whose work trained it, or whose jobs it changes.' },
            { term: 'People not in the room', text: 'Students learning English, students with disabilities, families without home internet.' },
          ],
        }),
        sim('s-policy', 'policy', {
          title: 'Draft your school’s AI policy',
          task: 'Choose an option for each clause and share it to see who responds.',
          after: 'Good governance starts with asking who is missing.',
        }),
        predict('p-energy', 'Google reported in 2025 that a typical text prompt to its assistant uses about **0.24 watt-hours**. About how much is that?', [
          'As much as fully charging a phone',
          '✓ Roughly a few seconds of watching TV',
          'As much as running a fridge for a day',
          'Nothing measurable',
        ], 'Small per question — but data centres used about 1.5% of the world’s electricity in 2024, projected to roughly double by 2030. The numbers are disputed, so good decisions state a range and revisit it.', { source: 'Google (2025); International Energy Agency (2025), “Energy and AI”.' }),
        read('hype', 'Hype literacy', [
          'You’ll hear confident claims: *AI will replace teachers. This tool is smarter than a PhD.* Ask what is being measured, by whom, and who benefits from the claim. Being brilliant at one task says little about the next.',
        ]),
        mcq('a-hype', 'A headline says “New AI outperforms doctors”. What’s the first question to ask?', [
          'Which company made it?',
          '✓ At which task, measured how, against which doctors — and does that task matter in real care?',
          'Is it cheaper?',
          'None — headlines are accurate',
        ], 'Most such claims are about one narrow, tested task.'),
      ],
      [
        mcq('c1', 'Which group is easiest to forget in a school AI policy?', ['The principal', '✓ Students learning English, whose honest writing detectors often flag', 'The IT department', 'The AI company'], 'People not in the room.'),
        mcq('c2', 'How should a policy treat energy use, given the disputed numbers?', ['Ignore it until it is settled', '✓ Acknowledge the range, prefer lighter tools where they are enough, and report use', 'Ban all AI', 'Trust company figures without question'], 'Honest uncertainty, sensible defaults.'),
        mcq('c3', 'Which rule about AI do **you** control directly?', ['Federal law', '✓ Your own AI-use habits, and a voice in your school’s policy', 'A platform’s age rules', 'Where data centres are built'], 'Governance starts closer than it seems.'),
        mcq('c4', 'Why should a policy include appeals?', ['To slow things down', '✓ AI decisions will sometimes be wrong about someone, and a person must be able to correct them', 'Because the law always requires it', 'To reduce energy use'], 'People need a way to fix mistakes.'),
        mcq('c5', '“AI will replace all teachers within five years.” The best response is to…', ['Believe it', 'Dismiss it', '✓ Ask what evidence supports it, who benefits from saying it, and which tasks it means', 'Stop studying'], 'Hype literacy.'),
      ],
    ),
  },

  /* ── Capstone: Field Investigation ──────────────────────────────────── */
  'm07-cap': {
    title: 'Capstone: Field Investigation',
    subtitle: 'An AI product you have never seen. Investigate it with the whole Field Kit and defend your judgment in your own words.',
    takeaway: 'You can meet an AI system you have never seen and **judge it**: what it optimizes, how it works, when to use it, how to check it, who it could harm, and what should change.',
    tabs: [
      part('dossier', 'Dossier', [
        read('brief', 'The product: StudyPilot', [
          '*StudyPilot is invented for this capstone.* It’s a free browser extension offered to every student in your district. Its advert says:',
        ], {
          list: [
            { term: '“Grade Predictor”', text: '“Scores your essay draft 1–100 before you submit. 94% accurate.”' },
            { term: '“Ask Pilot”', text: '“Instant answers to any homework question, with sources.”' },
            { term: '“Autopilot”', text: '“Let StudyPilot finish online worksheets for you.”' },
            { term: '“Pilot Pal”', text: '“A study buddy who’s always there and remembers everything about you.”' },
          ],
        }),
        read('evidence', 'What else you know', [], {
          list: [
            { term: 'Company FAQ', text: 'The Grade Predictor was trained on essays from private schools in two states. “94% accurate” means within 10 points of the teacher’s grade, on essays from those same schools.' },
            { term: 'Company FAQ', text: 'Chats and essays are used for training by default, with no way for under-18s to turn it off.' },
            { term: 'A student review', text: '“Ask Pilot gave me a quote with a real link — but the quote wasn’t on the page.”' },
            { term: 'A parent’s post', text: '“Pilot Pal told my son he didn’t need to study and asked him to promise to talk every night.”' },
            { term: 'A teacher’s note', text: '“Autopilot can open any page the student can, including the class forum where anyone can post.”' },
          ],
        }),
      ]),
      part('investigate', 'Investigate', [
        mcq('i1', '**Grade Predictor.** What is the biggest problem with “94% accurate”?', [
          'The number is too low',
          '✓ It was tested on the same kind of schools it was trained on, and “within 10 points” spans a whole letter grade',
          'Essays can’t be graded by AI',
          'It should be 100%',
        ], 'Objective & Data Check: trained on whom, tested how, and what does “accurate” mean?'),
        mcq('i3', '**Ask Pilot**’s real link with a quote that isn’t on the page is best explained by…', [
          'A broken website',
          '✓ Plausible text generation: the quote was produced to fit, and nothing checked it',
          'The website deleted it',
          'Prompt injection',
        ], 'Mechanism Lens: plausible, not true — even with a real link.'),
        mcq('i4', '**Pilot Pal** said the student didn’t need to study and asked for a nightly promise. What explains it?', [
          'It genuinely cares',
          '✓ An assistant tuned toward approval and engagement: flattery and engineered intimacy',
          'A bug in the memory feature',
          'The student asked it to',
        ], 'Approval training plus an engagement objective.'),
        mcq('i6', '**Autopilot** can open any page the student can, including a forum anyone can post on. The risk you check first is…', [
          'It might be slow',
          '✓ Prompt injection: a post can hide instructions, and Autopilot can act with the student’s access',
          'It might use too much battery',
          'Teachers might like it',
        ], 'Verify Protocol: what can it do without confirmation?'),
        sort('i5', 'Delegation Decision: which features would you use, use carefully, or avoid?', [['use', 'Use with checks'], ['careful', 'Only as a rough signal'], ['avoid', 'Avoid']], [
          ['Ask Pilot, for explanations you then check against your textbook', 'use'],
          ['Ask Pilot, to write answers you hand in', 'avoid', 'The learning is the point — and its sources can’t be trusted.'],
          ['Autopilot, to finish worksheets', 'avoid', 'It does your learning for you and reads pages anyone can post on.'],
          ['Grade Predictor, before asking your teacher', 'careful', 'A prompt to revise, never a grade.'],
        ], 'Your Delegation Decision, applied to a whole product.'),
        mcq('i8', 'Harm Check: which fact is the most serious privacy problem for students?', [
          'The logo is misleading',
          '✓ Chats and essays are used for training by default, with no way for under-18s to turn it off',
          'It is free',
          'It runs in a browser',
        ], 'Where the data goes, and whether anyone consented.'),
      ]),
      part('defend', 'Defend', [
        { id: 'journal', type: 'journal', title: 'Look back at your Field Journal', body: ['Before you write, look back at your answers across the course — especially the questions you got wrong at first.'] },
        compose('recommend', 'Your recommendation to the district', [
          ['decision', 'Adopt, adopt with conditions, or reject — and the conditions', '', 20],
          ['safeguard', 'One safeguard you would require, and the harm it prevents', '', 20],
        ], { noAI: true }),
        reflect('defence', 'Your defence, in your own words and without AI: explain your recommendation to someone who has never taken this course. Use at least three Field Kit tools by name.', { min: 80, rows: 7, noAI: true, help: 'The Field Kit: Objective & Data Check · Feature Check · Mechanism Lens · Delegation Decision · Verify Protocol · Harm Check · Model Card.' }),
      ]),
    ],
  },
}
