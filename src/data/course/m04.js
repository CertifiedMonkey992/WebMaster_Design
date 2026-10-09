/* ═══════════════════════════════════════════════════════════════════════════
   Module 4 — Working With AI (Collaborator)
   When should I use AI, how do I direct it, and how do I stay capable?

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, mcq, sort, number, transcript } from './helpers'

export default {
  /* ── 4.1 Delegate or Do ─────────────────────────────────────────────── */
  'm04-l01': {
    title: 'Delegate or Do',
    subtitle: 'Decide which parts of a task AI should touch, which kind of tool fits, and who checks the result.',
    takeaway: 'Deciding **whether** to use AI comes before deciding **how**. Split the task; for each part choose do, augment or automate — and name who checks.',
    tabs: lessonParts(
      [
        read('frontier', 'AI’s abilities are jagged', [
          'AI can be excellent at one task and unreliable at a similar-looking one — and its answer looks just as confident either way. Researchers call this the **jagged frontier**.',
          'In a 2023 study, consultants using AI did much better on tasks inside the frontier, and **worse** on a task just outside it, because they trusted a convincing wrong answer.',
        ], { source: 'Dell’Acqua et al. (2023), Harvard Business School and BCG.' }),
        sort('s-frontier', 'For a typical chat assistant with no tools, is each task usually reliable or likely to fail quietly?', [['inside', 'Usually reliable'], ['outside', 'Fails quietly']], [
          ['Suggest ten title ideas for an essay', 'inside', 'Brainstorming plays to its strengths — and you judge the results.'],
          ['Count exactly how many times “liberty” appears in a 40-page document', 'outside', 'Exact counting over long text is weak; use Find.'],
          ['Rewrite a paragraph you wrote to be more concise', 'inside', 'Editing text it can see is a strength.'],
          ['Say whether your bus route changed last week', 'outside', 'Too recent and too local.'],
        ], 'Easy-looking tasks can sit outside the frontier, and the answer looks just as confident.'),
        read('three', 'Do, augment, or automate', [
          'Split a task into parts. For each part, choose:',
        ], {
          list: [
            { term: 'Do it yourself', text: 'The part is the point of the assignment, or AI is unreliable at it.' },
            { term: 'Augment', text: 'AI suggests or gives feedback, and **you** decide.' },
            { term: 'Automate', text: 'AI does it and **you check** it.' },
          ],
          takeaway: 'Check a tool’s age rules and your school’s policy before you use it.',
        }),
        read('tools', 'Pick the right kind of tool', [
          'Products change every few months; the kinds of tool last.',
        ], {
          table: {
            head: ['Kind of tool', 'Good for', 'Watch out for'],
            rows: [
              ['Chat assistant', 'Explaining, brainstorming, feedback', 'Invented facts; flattery'],
              ['Search-grounded assistant', 'Answers with links you can open', 'Misquoted sources — open the links'],
              ['Study or tutor mode', 'Hints and quizzing you', 'Can still be wrong'],
              ['Image generator', 'Illustrations, mock-ups', 'Real people’s likeness; lettering'],
            ],
          },
        }),
        mcq('a-tool', 'You need three recent news reports about your town’s new park, with links you can check. Which kind of tool fits best?', [
          'A chat assistant with no tools',
          '✓ A search-grounded assistant — then open every link',
          'An image generator',
          'A study mode',
        ], 'Recent, local facts need a tool that retrieves real pages.'),
      ],
      [
        mcq('c1', 'What does the “jagged frontier” mean?', ['AI is improving quickly', '✓ AI is excellent at some tasks and unreliable at similar-looking ones, with no warning sign', 'AI works only in English', 'AI is good at everything'], 'Which is why deciding whether to use it is a skill.'),
        mcq('c2', 'Which part of a science fair project should you do yourself?', ['Formatting the bibliography', '✓ Designing your experiment and interpreting your results', 'Checking spelling on the poster', 'Resizing the photos'], 'The thinking the project is meant to build stays yours.'),
        mcq('c3', 'You want to know whether a law changed last month. A plain chat assistant confidently says no. What’s the problem?', ['Nothing', '✓ Recent events may be past what it learned — use a search-grounded tool and check the source', 'It is being sycophantic', 'Its temperature is too low'], 'Recent facts sit outside the frontier of a model without search.'),
        mcq('c4', 'What’s the difference between **augment** and **automate**?', ['There is none', '✓ Augment: AI assists and you decide. Automate: AI does it and you check.', 'Augment is for images, automate for text', 'Automate is always better'], 'Both keep you responsible.'),
        mcq('c5', 'You automated your citation formatting. Who is responsible if a citation is wrong?', ['The AI company', '✓ You — automate means AI does it and you check it', 'Your teacher', 'Nobody'], 'Your name is on the work.'),
      ],
    ),
  },

  /* ── 4.2 Describe It Well ───────────────────────────────────────────── */
  'm04-l02': {
    title: 'Describe It Well',
    subtitle: 'Turn a vague request into a clear one, and fix a weak answer one change at a time.',
    takeaway: 'A good request is a **specification**: goal, audience, sources, constraints, format and how success is judged. The model can only use what is in its context.',
    tabs: lessonParts(
      [
        read('vague', 'Vague in, generic out', [
          'Type “Write about climate change for my class” and you get a confident, generic essay. It never saw your assigned articles or your rubric, so it falls back on the average essay.',
          'A weak output rarely looks weak — it just doesn’t fit your task.',
        ]),
        read('spec', 'A request is a specification', [
          'Put everything the model needs into the request:',
        ], {
          list: [
            { term: 'Goal', text: '“A 250-word argument for my civics class.”' },
            { term: 'Audience', text: '“Classmates who haven’t read the articles.”' },
            { term: 'Sources', text: 'Paste them in: “Use only these two articles.”' },
            { term: 'Constraints and format', text: 'Length, reading level, paragraph or table.' },
            { term: 'Success criteria', text: 'Paste the rubric: “Check your draft against this.”' },
          ],
        }),
        transcript('t-spec', 'The same task, specified', [
          ['you', 'Goal: a 250-word argument for my 9th-grade civics class on whether our city should fund new bus lanes.\nAudience: classmates who haven’t read the articles.\nSources: use only the two articles below. [articles pasted]\nBefore you write, ask me any questions you need.'],
          ['ai', 'Two questions first: which side are you arguing, and should I use the ridership figures or the cost figures?', 'It asks before guessing.'],
        ], { provenance: 'illustration' }),
        read('debug', 'Fix it like a bug', [
          'If the answer is weak, name what’s wrong, find the missing part of your request, change **one thing**, and try again. Structure works across models; “magic words” don’t.',
        ]),
        mcq('a-diagnose', 'The answer’s vocabulary is far too advanced for your class. Which part of the request was missing?', ['Format', '✓ Audience', 'Sources', 'Success criteria'], 'Say who will read it.'),
      ],
      [
        mcq('c1', 'Which is **not** part of a specification?', ['Audience', 'Format', 'Success criteria', '✓ A secret phrase that always works'], 'Structure transfers between models; magic phrases don’t.'),
        mcq('c2', 'An answer ignores the reading you meant it to use. What is the most likely cause?', ['The model is lazy', '✓ The reading wasn’t in its context — paste it in', 'The temperature is too high', 'The model is sycophantic'], 'It can only use what it can see.'),
        mcq('c3', 'Your second try is still weak. What is the best next move?', ['Start over with a totally new prompt', '✓ Name the problem, change one part of the request, and compare', 'Add “please” and “thank you”', 'Switch to a different AI and hope'], 'Debugging, not gambling.'),
        mcq('c4', 'Why ask the model to ask you questions first?', ['It makes the answer longer', '✓ It finds missing context before it fills the gaps with generic guesses', 'It is required by law', 'It slows down cheaters'], 'Gaps get filled with the typical — unless you close them.'),
        mcq('c5', 'Which image request is best specified?', [
          'A cool picture of a cell',
          '✓ A flat diagram of a plant cell seen from above, pale colours, no text in the image, for a 9th-grade poster',
          'The best possible cell image ever',
          'Cell, 4K, masterpiece, trending',
        ], 'Subject, style, exclusions and purpose — no magic words.'),
      ],
    ),
  },

  /* ── 4.3 Learn With AI, Not Instead of It ───────────────────────────── */
  'm04-l03': {
    title: 'Learn With AI, Not Instead of It',
    subtitle: 'Why answer-giving AI can weaken learning, and how to use it as a tutor instead.',
    takeaway: 'Getting the homework done is not the same as learning it. Use AI as a **tutor** — hints and quizzing — attempt first, and check your learning **without** it.',
    tabs: lessonParts(
      [
        predict('p-bastani', 'About 1,000 high-school students practised maths with an AI that gave them answers. Their practice scores rose about 48%. Then they took a test **without** AI. Compared with students who never had it, they scored…', [
          'Much higher',
          'About the same',
          '✓ About 17% lower',
          'They couldn’t take the test',
        ], 'Practice looked better and learning was worse. A version that gave **hints instead of answers** avoided most of the harm.', { source: 'Bastani et al. (2025), Proceedings of the National Academy of Sciences.' }),
        read('offload', 'Don’t hand over the practice', [
          'Handing thinking to a tool is **cognitive offloading**. A calculator in physics frees you to think about the physics. But if the tool does the exact skill you’re meant to build, your practice looks great while your learning stalls.',
        ]),
        transcript('t-modes', 'Answer mode and tutor mode', [
          ['you', 'A jacket costs $80 and is 25% off. What do I pay?', null, 'You'],
          ['ai', 'You pay $60.', 'Done — but did you learn anything?', 'Answer mode'],
          ['ai', 'What is 10% of $80? Once you have that, how could you get 25%?', 'You still do the thinking.', 'Tutor mode'],
        ], { provenance: 'illustration' }),
        read('tutor', 'Make it a tutor', [
          'Ask for tutor behaviour directly:',
        ], {
          list: [
            { term: 'Hints, not answers', text: '“Give me one hint at a time and wait for me.”' },
            { term: 'Quiz me', text: '“Ask me five questions on chapter 4, one at a time.”' },
            { term: 'Explain my mistake', text: '“Here is my working. Where did it go wrong?”' },
          ],
          takeaway: '**Attempt first**, then ask. And if your teacher’s AI rule is unclear, ask before you use it.',
        }),
        number('p-transfer', 'Try one yourself: a $50 price **rises 20%**, then the new price **falls 20%**. What is the final price, in dollars?', 48, { tolerance: 0.01, unit: 'dollars', why: '$50 + 20% = $60. Then 20% of **$60** is $12, so the final price is **$48**, not $50.' }),
      ],
      [
        mcq('c1', 'What did the 2025 study find about students who practised with answer-giving AI?', ['They learned faster', '✓ Their practice improved, but they did worse on a later test without AI', 'They stopped using AI', 'No difference at all'], 'A hint-giving tutor avoided most of the harm.'),
        mcq('c2', 'When is cognitive offloading most harmful?', ['Using a calculator in physics', '✓ When the task you hand over is the skill you are supposed to be building', 'Spell-checking a final draft', 'Setting a timer'], 'Offload the chore, keep the learning.'),
        mcq('c3', 'Which prompt makes an assistant act most like a tutor?', ['“Solve this for me.”', '✓ “Give me one hint at a time and wait for my answer.”', '“Write the essay in my style.”', '“Just tell me the answer quickly.”'], 'Hints keep the thinking yours.'),
        mcq('c4', 'Why check your learning **without** AI before a test?', ['AI is banned in all tests', '✓ Practice with AI can look good while hiding what you can’t yet do alone', 'It is faster', 'Teachers can tell'], 'Good practice scores can hide weak learning.'),
        mcq('c5', 'Your teacher’s AI rule for a project is unclear. What should you do?', ['Use AI however you like', '✓ Ask the teacher before using it, and say how you used it', 'Never use AI again', 'Use it and hope'], 'Rules differ; asking is part of the skill.'),
      ],
    ),
  },

  /* ── Case File 4 ────────────────────────────────────────────────────── */
  'm04-case': {
    title: 'Case File 4: Working With AI',
    subtitle: 'Cases from Modules 1–4, then the Checkpoint.',
    takeaway: 'Your Delegation Decision: **Should AI do this part — do, augment or automate? How do I specify it? Who checks it, and am I still learning?**',
    tabs: [
      part('cases', 'Cases', [
        mcq('k1', '**Case A.** A study app offers to “read your assigned novel for you and summarize every chapter”. Your class discusses the novel every day. Which question matters most?', [
          'How many parameters does it have?',
          '✓ Is this part the learning itself — should I do it, not delegate it?',
          'What temperature does it use?',
          'Is the summary well formatted?',
        ], 'Reading is the point. A summary can’t replace it.'),
        mcq('k2', '**Case B.** Your chatbot keeps producing generic history essays. You’ve added “be very detailed” three times. What should you change?', [
          'Nothing — some AIs are just bad',
          '✓ The request: paste the sources, name the audience and format, include the rubric',
          'The temperature',
          'Your laptop',
        ], 'Adjectives don’t supply context.'),
        mcq('k3', '**Case C.** A friend used AI to fix every maths homework mistake, and their homework grades are perfect. The unit test is next week. What’s the risk?', [
          'None — perfect homework means they know it',
          '✓ The homework may show the AI’s work, not theirs; a no-AI practice test would show what they can do',
          'The AI will be banned',
          'Their teacher will notice',
        ], 'Good practice numbers, weaker learning.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'Which task sits **outside** a plain chat assistant’s frontier?', ['Brainstorming names for a club', '✓ Stating today’s cafeteria menu', 'Explaining a metaphor', 'Rephrasing your sentence'], 'Local, recent facts it has never seen.'),
        mcq('q2', 'In “automate”, what is your job?', ['Nothing', '✓ Checking what the AI produced', 'Writing it all first', 'Choosing the temperature'], 'Automate still means you check.'),
        mcq('q3', 'Which part of a request does “Paste the two assigned articles” supply?', ['Audience', '✓ Sources', 'Format', 'Constraints'], 'Now it can use them.'),
        mcq('q4', 'A good way to fix a weak output is to…', ['Add more adjectives', '✓ Name what is wrong and change the missing part of the request', 'Ask the same thing again', 'Give up'], 'One change at a time.'),
        mcq('q5', 'Which is tutor mode?', ['“Summarize the chapter for me.”', '✓ “Quiz me on the chapter, one question at a time.”', '“Write my answer to question 3.”', '“Finish my lab report.”'], 'Practice with feedback.'),
        mcq('q6', 'Answer-mode help raised practice scores but lowered unassisted scores. What is that evidence of?', ['AI makes students smarter', '✓ Offloading the practice that builds the skill', 'Tests are unfair', 'Temperature effects'], 'The effect Lesson 4.3 is built around.'),
      ], { graded: true }),
    ],
  },
}
