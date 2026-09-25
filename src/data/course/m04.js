/* ═══════════════════════════════════════════════════════════════════════════
   Module 4 — Working With AI (Collaborator)
   When should I use AI, how do I direct it, and how do I stay capable?
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, recall, mcq, sort, number, transcript, reflect, compose } from './helpers'

export default {
  /* ── 4.1 Delegate or Do ─────────────────────────────────────────────── */
  'm04-l01': {
    title: 'Delegate or Do',
    subtitle: 'AI’s abilities are jagged. Learn to split a task, decide what AI should touch, pick the right kind of tool, and name who checks.',
    takeaway: 'Deciding **whether** to use AI comes before deciding **how**. Split the task; for each part choose do, augment or automate — and name who checks what AI made.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 3.3: which request is most likely to get a confident, invented answer?', ['Explain photosynthesis', '✓ Give three recent studies on a niche topic, with page numbers', 'Translate a greeting', 'Name the capital of Japan'], 'Some tasks sit well inside what AI does reliably; some sit just outside. Today: telling them apart.'),
        predict('p-frontier', 'In a 2023 study, 758 consultants did realistic work tasks, some with GPT-4. On one task that looked like the others but was just beyond what the AI could do well, how did the people using AI do?', [
          'Better than people without AI',
          'About the same',
          '✓ Worse — they were 19 percentage points less likely to get it right',
          'They refused to use the AI',
        ], 'On tasks inside AI’s abilities, the consultants using it finished about 12% more tasks, 25% faster, at about 40% higher quality. On the task just outside, they did markedly worse — the AI’s answer looked just as convincing, so they trusted it. The researchers called this the **jagged frontier**.', { source: 'Dell’Acqua et al. (2023), Harvard Business School and BCG.' }),
        sort('s-frontier', 'Inside or outside the frontier? Sort each task for a typical chat assistant with no tools.', [['inside', 'Usually reliable'], ['outside', 'Fails quietly']], [
          ['Suggest ten title ideas for an essay', 'inside', 'Brainstorming plays to its strengths — and you judge the results.'],
          ['Explain the water cycle for a 9th-grader', 'inside', 'Common knowledge, explained well. Still worth a skim.'],
          ['Count exactly how many times “liberty” appears in a 40-page document', 'outside', 'Exact counting over long text is weak for a text predictor; use Find.'],
          ['Give page numbers for quotes from a novel you haven’t pasted in', 'outside', 'It never saw your edition. It will produce plausible page numbers.'],
          ['Say whether your bus route changed last week', 'outside', 'Past its knowledge cutoff, and too local.'],
          ['Rewrite a paragraph you wrote to be more concise', 'inside', 'Editing text it can see is a strength — you check the meaning survived.'],
          ['Multiply 48,193 by 7,261 in its head', 'outside', 'Long arithmetic without a calculator tool is unreliable.'],
        ], 'The frontier isn’t about difficulty for humans. Some easy-looking tasks (counting, exact page numbers, recent local facts) sit outside; some hard-looking ones (explaining, rewriting) sit inside. And outside the frontier, the answer looks just as confident.'),
      ],
      [
        read('frontier', 'The jagged frontier', [
          'AI is not simply good or bad at a subject. Its abilities are **jagged**: excellent at one task, unreliable at a similar-looking one, and nothing in the answer tells you which side you are on. That is why the first skill of working with AI is not prompting — it is deciding **whether** to use it.',
        ]),
        read('three', 'Do, augment, or automate', [
          'Split a task into parts. For each part, choose:',
        ], {
          list: [
            { term: 'Do it yourself', text: 'The part is the point of the assignment (the learning), or it sits outside AI’s frontier.' },
            { term: 'Augment', text: 'AI assists — suggests, questions, critiques — and **you** decide. Brainstorming, feedback on a draft, explaining a concept a second way.' },
            { term: 'Automate', text: 'AI does it and you **check** it. Formatting citations you supply, reorganizing your own notes, transcribing a recording.' },
          ],
          takeaway: 'For every part AI touches, name **who checks it** — usually you.',
        }),
        read('tools', 'The Tool Guide', [
          'Different jobs call for different kinds of tool. Products change every few months; the categories last. Always check a tool’s age terms and your school’s policy first: as of September 2026, OpenAI’s ChatGPT requires users to be 13+ (with a parent’s permission under 18), Anthropic’s consumer Claude requires 18+, and Character.AI ended open-ended chat for under-18s in late 2025.',
        ], {
          table: {
            head: ['Kind of tool', 'Good for', 'Watch out for', 'Examples (Sept 2026)'],
            rows: [
              ['Chat assistant', 'Explaining, brainstorming, feedback on your writing', 'Invented facts and citations; flattery', 'ChatGPT, Claude, Gemini, Microsoft Copilot'],
              ['Search-grounded assistant', 'Answers with links you can open', 'Misreading or misquoting its sources — open the links', 'Assistants with web search on; Perplexity'],
              ['Study or tutor mode', 'Hints, questions, quizzing you', 'Slower on purpose; can still be wrong', 'Study modes in ChatGPT, Claude and Gemini'],
              ['Image generator', 'Illustrations, mock-ups', 'Real people’s likeness, copying artists, lettering', 'Tools built into major assistants'],
              ['Coding assistant', 'Suggesting and explaining code', 'Buggy or insecure code — test it', 'GitHub Copilot and assistant coding modes'],
              ['Transcription and translation', 'Notes from a recording, language help', 'Names, accents, technical terms', 'Built into phones and meeting tools'],
              ['Agent', 'Multi-step tasks in a browser or apps', 'Hidden instructions in pages; irreversible actions (Lesson 5.3)', 'Agent modes in major assistants'],
            ],
          },
          source: 'Product names are trademarks of their owners and appear only as examples; LunX is not affiliated with any of them.',
        }),
        mcq('a-tool', 'You need three recent news reports about your town’s new park, with links you can check. Which kind of tool fits best?', [
          'A chat assistant with no tools',
          '✓ A search-grounded assistant — then open every link',
          'An image generator',
          'A study mode',
        ], 'Recent, local facts sit outside a plain model’s knowledge; a search-grounded tool retrieves real pages. You still check each one.'),
        mcq('a-do', 'Your English assignment is to analyze the theme of a poem **in your own words**. Which part should you do yourself?', [
          'Formatting the title page',
          '✓ Forming and writing your interpretation',
          'Checking spelling',
          'Finding the poet’s birth year',
        ], 'The interpretation is what the assignment exists to build. Handing it over defeats the purpose — and it’s the part your teacher is grading.'),
        compose('map', 'Your delegation map for a real assignment', [
          ['task', 'The assignment', 'e.g. “Lab report on enzyme temperature”', 8],
          ['do', 'Parts I will do myself, and why', '', 15],
          ['augment', 'Parts AI will assist with, and which kind of tool', '', 15],
          ['check', 'Who checks each AI-touched part, and how', '', 15],
        ], { help: 'Pick something you actually have to do this month. You’ll reuse this in the Part II project.' }),
      ],
      [
        mcq('c1', 'What does the “jagged frontier” mean?', ['AI is improving quickly', '✓ AI is excellent at some tasks and unreliable at similar-looking ones, with no warning sign', 'AI works only in English', 'AI is good at everything'], 'Which is why deciding whether to use it is a skill.'),
        mcq('c2', 'Which part of a science fair project should stay **do it yourself**?', ['Formatting the bibliography from sources you found', '✓ Designing your experiment and interpreting your results', 'Checking spelling on the poster', 'Resizing the photos'], 'The thinking the project is meant to build stays yours.'),
        mcq('c3', 'You want to know whether a law changed last month. A plain chat assistant confidently says no. What’s the problem?', ['Nothing', '✓ Recent events may be past its knowledge cutoff — use a search-grounded tool and check the source', 'It is being sycophantic', 'Its temperature is too low'], 'Recency sits outside the frontier of a model without search.'),
        mcq('c4', 'What’s the difference between **augment** and **automate**?', ['There is none', '✓ Augment: AI assists and you decide. Automate: AI does it and you check.', 'Augment is for images, automate for text', 'Automate is always better'], 'Both keep you responsible; they differ in who does the work.'),
        mcq('c5', 'You automated your citation formatting. Who is responsible if a citation is wrong?', ['The AI company', '✓ You — automate means AI does it and you check it', 'Your teacher', 'Nobody'], 'Your name is on the work.'),
        reflect('carry', 'Carry forward: name a task where you’ve been tempted to hand everything to AI. Which part should you have kept?', { min: 20 }),
      ],
    ),
  },

  /* ── 4.2 Describe It Well ───────────────────────────────────────────── */
  'm04-l02': {
    title: 'Describe It Well',
    subtitle: 'Turn a vague request into a specification, diagnose a weak output by what it was missing, and iterate like debugging — for text and for images.',
    takeaway: 'A good request is a **specification** — goal, audience, context, constraints, examples, format, and how success is judged. It works because the model can only use what is in its context.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 3.1: what can a language model use when it writes its answer?', ['Everything on the internet', '✓ What is in its context window — including your prompt and anything you attach', 'Your whole search history', 'Your teacher’s rubric, automatically'], 'So what you put in the prompt is most of what you control.'),
        predict('p-vague', 'You type: “Write about climate change for my class.” What will you most likely get?', [
          'Exactly what your teacher wants',
          '✓ A generic, confident overview that fits nobody’s assignment in particular',
          'An error asking for more detail',
          'A list of sources',
        ], 'With nothing specific in its context, the model falls back on the most typical continuation — the average climate-change essay. Here is one.'),
        transcript('t-vague', 'A vague request', [
          ['you', 'Write about climate change for my class.'],
          ['ai', 'Climate change is one of the most pressing issues of our time. It refers to long-term shifts in temperatures and weather patterns, mainly caused by human activities such as burning fossil fuels…\n\n(five more paragraphs: causes, effects, solutions, a hopeful conclusion — about 650 words)'],
        ], { provenance: 'illustration' }),
        sort('s-rubric', 'Your teacher’s rubric. Did the output meet each point?', [['met', 'Met'], ['not', 'Not met']], [
          ['Uses the two articles assigned in class', 'not', 'It never saw them.'],
          ['Argues one position about your city’s transit plan', 'not', 'It wrote a general overview.'],
          ['Under 300 words', 'not', 'About 650.'],
          ['Written for classmates, not experts', 'met', 'Plain enough.'],
          ['Basic facts are correct', 'met', 'The generic facts are fine — that’s why it looks acceptable.'],
        ], 'It fails three of five criteria while looking perfectly fine. A weak output rarely looks weak.'),
      ],
      [
        read('spec', 'A request is a specification', [
          'Everything the model needs to do *your* task has to be in its context. A specification has up to seven parts:',
        ], {
          list: [
            { term: 'Goal', text: 'What the output is for. “A 250-word argument for my civics class.”' },
            { term: 'Audience', text: 'Who will read it. “Ninth-graders who haven’t read the articles.”' },
            { term: 'Context and sources', text: 'What it must use — paste them in. “Use only these two articles:” then the text.' },
            { term: 'Constraints', text: 'Length, reading level, what to avoid.' },
            { term: 'Examples', text: 'One sample of what good looks like, if you have it.' },
            { term: 'Format', text: 'Paragraph, table, bullet list, outline.' },
            { term: 'Success criteria', text: 'Paste the rubric. “Check your draft against this before answering.”' },
          ],
        }),
        read('debug', 'Debug it like code', [
          'When an output is weak, don’t start over and don’t reach for “magic words”. Name what is wrong, trace it to the missing part of the specification, change **one thing**, and compare.',
          'Three moves help: ask the model to **ask you clarifying questions** before it starts; give it your **rubric**; and ask it to **mark anything it is unsure of**. Phrases that promise magic (“you are a world-class expert…”) behave differently from model to model. Structure carries over.',
        ]),
        sort('a-diagnose', 'Which part of the specification was missing?', [['audience', 'Audience'], ['context', 'Context / sources'], ['constraints', 'Constraints'], ['format', 'Format'], ['criteria', 'Success criteria']], [
          ['The vocabulary is far too advanced for your class', 'audience'],
          ['It discusses a different article from the one you meant', 'context'],
          ['It is three times too long', 'constraints'],
          ['You wanted a comparison table, you got paragraphs', 'format'],
          ['It skipped the counter-argument your teacher always grades', 'criteria'],
        ], 'Each flaw points to one missing piece. Fix that piece and run it again.'),
        transcript('t-spec', 'The same task, specified', [
          ['you', 'Goal: a 250-word argument for my 9th-grade civics class on whether our city should fund the new bus lanes.\nAudience: classmates who haven’t read the articles.\nSources: use only the two articles below and quote each once. [articles pasted]\nFormat: one paragraph for the claim, one for evidence, one addressing the strongest counter-argument.\nSuccess: my rubric is below. Before you write, ask me any questions you need. Mark anything you’re unsure of with [?].'],
          ['ai', 'Two questions first: which side are you arguing, and should I use the ridership figures from the second article or the cost figures?', 'It asks before guessing.'],
        ], { provenance: 'illustration' }),
        compose('mine', 'Rewrite “Write about climate change for my class” as a specification for a real assignment', [
          ['goal', 'Goal', '', 10],
          ['audience', 'Audience', '', 5],
          ['context', 'Context and sources', 'What will you paste in?', 10],
          ['constraints', 'Constraints and format', '', 10],
          ['criteria', 'Success criteria', 'What does your rubric reward?', 10],
        ]),
        read('images', 'Images need specifications too', [
          'For an image: the **subject**, the **composition** (close-up, wide, from above), the **style** (pencil sketch, flat diagram), what to **leave out**, and where it will be used. Lettering inside generated images is still unreliable — add text yourself. And never generate images of real, identifiable people without their consent (Lesson 6.3).',
        ]),
        mcq('a-img', 'Which image request is best specified?', [
          'A cool picture of a cell',
          '✓ A flat, labelled-style diagram of a plant cell seen from above, pale colours, no text in the image, for a 9th-grade poster',
          'The best possible cell image ever',
          'Cell, 4K, masterpiece, trending',
        ], 'Subject, composition, style, exclusions and purpose — no magic words.'),
      ],
      [
        mcq('c1', 'Which is **not** part of a specification?', ['Audience', 'Format', 'Success criteria', '✓ A secret phrase that always works'], 'Structure transfers between models; magic phrases don’t.'),
        mcq('c2', 'An output ignores the reading you meant it to use. What is the most likely cause?', ['The model is lazy', '✓ The reading wasn’t actually in its context — paste it in and ask it to quote from it', 'The temperature is too high', 'The model is sycophantic'], 'It can only use what it can see.'),
        mcq('c3', 'Your second try is still weak. What is the best next move?', ['Start over with a totally new prompt', '✓ Name the specific problem, change one part of the specification, and compare', 'Add “please” and “thank you”', 'Switch to a different AI and hope'], 'Debugging, not gambling.'),
        mcq('c4', 'Why ask the model to ask you clarifying questions first?', ['It makes the answer longer', '✓ It surfaces missing context before it fills the gaps with generic guesses', 'It is required by law', 'It slows down cheaters'], 'Gaps get filled with the typical — unless you close them.'),
        mcq('c5', 'Why is “Check your draft against this rubric” a useful line?', ['It guarantees a perfect grade', '✓ It puts your success criteria into the context, so the output can be judged against them', 'It stops hallucinations completely', 'It lowers the temperature'], 'The rubric becomes part of what it is predicting from — and something you can check against.'),
        reflect('carry', 'Carry forward: which part of a specification do you most often leave out?', { min: 15 }),
      ],
    ),
  },

  /* ── 4.3 Learn With AI, Not Instead of It ───────────────────────────── */
  'm04-l03': {
    title: 'Learn With AI, Not Instead of It',
    subtitle: 'The evidence that answer-giving AI can quietly weaken your learning, the tutor-mode alternative, and your own protocol for using AI in school.',
    takeaway: 'Getting the homework done is not the same as learning it. Use AI as a **tutor** — hints, questions, quizzing — attempt first, and check your learning **without** it.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 4.1: which part of an assignment should stay “do it yourself”?', ['The formatting', '✓ The part that is the point of the assignment — the thinking it is meant to build', 'The spelling', 'None of it'], 'Today: the evidence for why that matters.'),
        predict('p-bastani', 'About 1,000 high-school students practised maths with GPT-4 giving them answers. Their practice scores rose by about 48%. Then they took a test **without** AI. Compared with students who never had it, they scored…', [
          'Much higher',
          'About the same',
          '✓ About 17% lower',
          'They couldn’t take the test',
        ], 'Practice looked better and learning was worse. A second version of the AI that gave **hints instead of answers** avoided most of the harm. The difference was not whether students used AI, but how.', { source: 'Bastani et al. (2025), Proceedings of the National Academy of Sciences.' }),
        transcript('t-modes', 'Answer mode and tutor mode, same problem', [
          ['you', 'A jacket costs $80 and is 25% off. What do I pay?', null, 'You'],
          ['ai', 'You pay $60. (25% of $80 is $20, and $80 − $20 = $60.)', 'Done — but did you do anything?', 'Answer mode'],
          ['ai', 'Let’s work it out. What is 10% of $80? Once you have that, how could you get 25%?', 'You still have to think.', 'Tutor mode'],
        ], { provenance: 'illustration' }),
        read('solo', 'Try one without help', [
          'You just watched answer mode solve a percentage problem. Here is a problem that uses the same idea with a twist. No AI, no calculator tricks — this answer is yours alone, and it costs nothing if it is wrong.',
        ]),
        number('p-transfer', 'A $50 price **rises 20%**, then the new price **falls 20%**. What is the final price, in dollars?', 48, { tolerance: 0.01, unit: 'dollars', eyebrow: 'Solo first', why: '$50 + 20% = $60. Then 20% of **$60** is $12, so $60 − $12 = **$48**, not $50. Watching someone else get $60 from $80 doesn’t build the habit of asking “20% of what?” — doing it does.' }),
      ],
      [
        read('offload', 'Cognitive offloading', [
          'Handing thinking to a tool is **cognitive offloading**. Sometimes it frees effort for harder thinking: a calculator lets you focus on the physics. Sometimes it removes exactly the practice that builds the skill — and your practice scores hide it, because the tool did the practice.',
          'The effect isn’t only for students. In a 2025 survey of 319 knowledge workers, people who were more confident in generative AI reported doing *less* critical thinking; people more confident in themselves did more (Lee et al.).',
        ], { source: 'Lee et al. (2025), CHI Conference on Human Factors in Computing Systems.' }),
        read('tutor', 'Make it a tutor', [
          'In 2025 the three largest assistant makers each added a study or learning mode that asks questions and gives hints instead of answers. You can also ask for tutor behaviour directly:',
        ], {
          list: [
            { term: 'Hints, not answers', text: '“Don’t solve it. Give me one hint at a time and wait for me.”' },
            { term: 'Quiz me', text: '“Ask me five questions on chapter 4, one at a time, and tell me which I got wrong.” (Retrieval practice — one of the best-evidenced study methods.)' },
            { term: 'Feedback, not a rewrite', text: '“Point out the two weakest sentences in my paragraph and say why. Don’t rewrite them.”' },
            { term: 'Explain my mistake', text: '“Here is my working. Where did it go wrong?”' },
            { term: 'Teach it back', text: '“I’ll explain photosynthesis; tell me what I got wrong or left out.”' },
          ],
          takeaway: '**Attempt first** — even a wrong attempt makes the explanation that follows stick better — then ask.',
        }),
        sort('a-modes', 'Tutor mode or answer mode?', [['tutor', 'Tutor mode'], ['answer', 'Answer mode']], [
          ['“Write my conclusion paragraph.”', 'answer'],
          ['“Ask me three questions to check I understand osmosis.”', 'tutor'],
          ['“What’s the answer to question 7?”', 'answer'],
          ['“Here is my solution — which step is wrong?”', 'tutor'],
          ['“Give me a hint for question 7, but not the answer.”', 'tutor'],
        ], 'Answer mode is fine when the output is not the learning. When it is, ask for the tutor.'),
        read('policy', 'Your protocol sits inside your school’s rules', [
          'AI rules differ between schools, classes and even assignments. One teacher welcomes brainstorming with AI; another bans it for a particular essay. When the rule is unclear, ask before you use it — and when you do use it, say how (Lesson 6.1).',
        ]),
        compose('protocol', 'Write your personal AI-use protocol', [
          ['maths', 'In maths / science I will…', 'e.g. attempt every problem first, then ask for hints only', 15],
          ['writing', 'In writing I will…', '', 15],
          ['never', 'I will never use AI to…', '', 10],
          ['check', 'I will check my learning by…', 'e.g. a no-AI quiz before tests', 10],
        ], { help: 'Make it true to how you actually work. You’ll reuse it in the Part II project.' }),
      ],
      [
        mcq('c1', 'What did Bastani et al. find about students who practised with answer-giving AI?', ['They learned faster', '✓ Their practice improved, but they did worse on a later test without AI', 'They stopped using AI', 'No difference at all'], 'And a hint-giving tutor avoided most of the harm.'),
        mcq('c2', 'When is cognitive offloading most harmful?', ['Using a calculator in physics', '✓ When the task you hand over is the skill you are supposed to be building', 'Spell-checking a final draft', 'Setting a timer'], 'Offload the chore, keep the learning.'),
        mcq('c3', 'Which prompt makes an assistant act most like a tutor?', ['“Solve this for me.”', '✓ “Give me one hint at a time and wait for my answer.”', '“Write the essay in my style.”', '“Just tell me the answer quickly.”'], 'Hints keep the thinking yours.'),
        mcq('c4', 'Why check your learning **without** AI before a test?', ['AI is banned in all tests', '✓ Practice with AI can look good while hiding what you can’t yet do alone', 'It is faster', 'Teachers can tell'], 'The Bastani result in one sentence.'),
        mcq('c5', 'Your teacher’s AI rule for a project is unclear. What should you do?', ['Use AI however you like', '✓ Ask the teacher before using it, and disclose how you used it', 'Never use AI again', 'Use it and hope'], 'Rules differ; asking is part of the skill.'),
        reflect('carry', 'Carry forward: when did AI last do something for you that you should have practised yourself?', { min: 20 }),
      ],
    ),
  },

  /* ── Case File 4 ────────────────────────────────────────────────────── */
  'm04-case': {
    title: 'Case File 4: Working With AI',
    subtitle: 'Mixed cases from Modules 1–4, then the Checkpoint for your Delegation Decision.',
    takeaway: 'Your Delegation Decision: **Should AI do this part — do, augment or automate? How do I specify it? Who checks it, and am I still learning?**',
    tabs: [
      part('cases', 'Case File', [
        mcq('k1', '**Case A.** A study app offers to “read your assigned novel for you and write a one-page summary of every chapter”. Your class discusses the novel every day. Which question matters most?', [
          'How many parameters does it have?',
          '✓ Is this part the learning itself — should I do it, not delegate it?',
          'What temperature does it use?',
          'Is the summary well formatted?',
        ], 'Reading is the point. A summary might help you review what you already read; it can’t replace the reading.'),
        mcq('k2', '**Case B.** Your chatbot keeps producing generic history essays. You’ve tried adding “be very detailed” three times. What should you change?', [
          'Nothing — some AIs are just bad',
          '✓ The specification: paste the sources, name the audience and format, include the rubric',
          'The temperature',
          'Your laptop',
        ], 'Missing context produces generic output; adjectives don’t supply context.'),
        mcq('k3', '**Case C.** A friend used AI to fix every maths homework mistake before handing it in, and their homework grades are perfect. The unit test is next week. What’s the risk?', [
          'None — perfect homework means they know it',
          '✓ The homework may reflect the AI’s work, not theirs; a no-AI practice test would show what they can do alone',
          'The AI will be banned',
          'Their teacher will notice',
        ], 'The Bastani pattern: good practice numbers, weaker learning.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'Which task sits **outside** a plain chat assistant’s frontier?', ['Brainstorming names for a club', '✓ Stating today’s cafeteria menu', 'Explaining a metaphor', 'Rephrasing your sentence'], 'Local, recent facts it has never seen.'),
        mcq('q2', 'In “automate”, what is your job?', ['Nothing', '✓ Checking what the AI produced', 'Writing it all first', 'Choosing the temperature'], 'Automate still means you check.'),
        mcq('q3', 'Which part of a specification does “Paste the two assigned articles” supply?', ['Audience', '✓ Context and sources', 'Format', 'Constraints'], 'Now it can use them.'),
        mcq('q4', 'A good way to diagnose a weak output is to…', ['Add more adjectives', '✓ Name what is wrong and trace it to the missing part of the specification', 'Ask the same thing again', 'Give up'], 'One change at a time.'),
        mcq('q5', 'Which is tutor mode?', ['“Summarize the chapter for me.”', '✓ “Quiz me on the chapter, one question at a time.”', '“Write my answer to question 3.”', '“Finish my lab report.”'], 'Retrieval practice with feedback.'),
        mcq('q6', 'Answer-mode help raised practice scores but lowered unassisted scores. What is that evidence of?', ['AI makes students smarter', '✓ Offloading the practice that builds the skill', 'Tests are unfair', 'Temperature effects'], 'The effect Lesson 4.3 is built around.'),
      ], { graded: true }),
    ],
  },
}
