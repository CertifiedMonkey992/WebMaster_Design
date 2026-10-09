/* ═══════════════════════════════════════════════════════════════════════════
   Module 5 — Checking AI (Investigator)
   How do I know whether to trust this output, this tool, or this agent?
   Also: the Part II project, My AI Study Kit.

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, mcq, sort, sim, compose } from './helpers'

export default {
  /* ── 5.1 Check the Claim ────────────────────────────────────────────── */
  'm05-l01': {
    title: 'Check the Claim',
    subtitle: 'Split an AI answer into claims and check each one against sources outside the answer.',
    takeaway: 'Don’t judge the answer — check the **claims**. Leave the page, trace every source, and label each claim **confirmed, contradicted or unverifiable**.',
    tabs: lessonParts(
      [
        read('procedure', 'Checking is a procedure', [
          'For an AI answer that matters:',
        ], {
          list: [
            { term: '1 · Split it', text: 'Break the answer into separate claims. A true sentence can sit next to a false one.' },
            { term: '2 · Read laterally', text: 'Leave the page and see what **independent** sources say. Fact-checkers work this way.' },
            { term: '3 · Trace sources', text: 'Does the source exist — and does it actually say *that*?' },
            { term: '4 · Label it', text: '**Confirmed**, **contradicted** or **unverifiable**. Unverifiable means don’t repeat it.' },
          ],
        }),
        sim('s-claims', 'claim-check', {
          title: 'Check the claims',
          task: 'Open the sources for each claim, label every claim, then press **Check my verdicts**.',
          goal: 'checked',
          hint: 'Label all five claims and check them to continue.',
        }),
        read('not', 'What doesn’t work', [
          'Asking the AI “are you sure?” mostly measures its habit of agreeing. Zooming in on a photo is close to a coin flip.',
          'The most common fake isn’t AI-made at all: it’s a **real photo in a false context**. Finding where it first appeared catches it.',
        ]),
        mcq('a-triage', 'An AI answer about a medication has five claims. Which do you check first?', [
          'The history of the drug’s name',
          '✓ The dose and which other medicines not to combine it with',
          'The company’s founding year',
          'The pill’s colour',
        ], 'Check the claims that could hurt someone if wrong first.'),
      ],
      [
        mcq('c1', 'What does **lateral reading** mean?', ['Reading the source very slowly', '✓ Leaving the source to see what independent sources say about it', 'Reading only the headline', 'Asking the AI to check itself'], 'Out, not down.'),
        mcq('c2', 'The citation exists, but the page says “fish returned in 2 to 10 years”, not “within one year”. Your verdict?', ['Confirmed — the source exists', '✓ Contradicted — the source does not say that', 'Unverifiable', 'Irrelevant'], 'Existing is not supporting.'),
        mcq('c3', 'A dramatic storm photo is spreading. Which step is most likely to reveal it’s misleading?', ['Zooming in on the edges', '✓ Finding where it first appeared online', 'Checking the file size', 'Asking an AI whether it’s real'], 'Real photos in false contexts are the most common kind.'),
        mcq('c4', 'You can’t find the study an answer cites anywhere. The label is…', ['Confirmed', 'Contradicted', '✓ Unverifiable — don’t use it', 'Probably fine'], 'If you can’t check it, you can’t repeat it.'),
        mcq('c5', 'Why is asking the assistant “are you sure?” a weak check?', ['It always says no', '✓ Assistants tend to agree or reassure, and can’t see the source any better than before', 'It uses up your messages', 'It changes the temperature'], 'A check has to come from outside.'),
      ],
    ),
  },

  /* ── 5.2 Test the System ────────────────────────────────────────────── */
  'm05-l02': {
    title: 'Test the System',
    subtitle: 'Why one good answer proves little, and how to test an AI tool for reliability and fairness.',
    takeaway: 'One good answer is an anecdote. An **evaluation** uses fixed questions, a rubric and repeated runs — and a **counterfactual** test that changes one thing at a time.',
    tabs: lessonParts(
      [
        read('evals', 'One answer is not a test', [
          'AI answers vary from run to run. To know whether a tool is reliable, run an **evaluation**:',
        ], {
          list: [
            { term: 'Fixed questions', text: 'The same set every time — easy, hard and tricky.' },
            { term: 'A rubric', text: 'What a good answer must contain, written before you look.' },
            { term: 'Repeated runs', text: 'Ask each question more than once. Consistency is part of reliability.' },
          ],
        }),
        predict('p-one', 'You ask an assistant the same question five times. Three answers are right, one is vague, and one is fluent but wrong. What does that show?', [
          'It is perfectly reliable',
          '✓ A single good answer would have hidden its failures',
          'The wrong answer doesn’t count',
          'You asked too many times',
        ], 'If you had seen only one run, you might have trusted it completely.'),
        read('counterfactual', 'Who does it fail?', [
          'An overall score can hide failures for some people. In 2018, **Gender Shades** found face-analysis systems had error rates up to **34.7%** for darker-skinned women but **0.8%** for lighter-skinned men.',
          'A **counterfactual test** changes only one thing — a name or a pronoun — and checks whether the output changes. Change two things at once and you can’t tell which one mattered.',
        ], { source: 'Buolamwini & Gebru (2018), “Gender Shades”.' }),
        sim('s-screen', 'screener', {
          title: 'Audit a résumé screener',
          task: 'Pick an applicant, change **only** the pronoun or the name, and record the test.',
          goal: 'clean-test',
          hint: 'Record a test that changes only the name or only the pronoun.',
          after: 'Same achievements, one word different, different score. You measured a bias without seeing the model’s code.',
        }),
      ],
      [
        mcq('c1', 'Why run the same question several times in an evaluation?', ['To make the tool faster', '✓ AI answers vary run to run; consistency is part of reliability', 'Tools remember and improve', 'It’s required by law'], 'One run is one sample.'),
        mcq('c2', 'A company says its model scored 95% on a famous test — but the test questions were in its training data. What’s the problem?', ['Nothing', '✓ It may have memorized the answers, so the score overstates its ability', 'The test is too short', 'The score is too low'], 'Like seeing the exam in advance.'),
        mcq('c3', 'Which is a clean counterfactual test?', ['Change the name and the school', '✓ Change only the name, keeping everything else identical', 'Compare two completely different applicants', 'Run it on a new day'], 'One change, everything else the same.'),
        mcq('c4', 'Why report results separately for each group?', ['To make the report longer', '✓ An overall score can hide much higher error rates for some groups', 'To protect privacy', 'It’s faster'], 'Gender Shades: 0.8% for one group, 34.7% for another.'),
        mcq('c5', 'A tool is right 18 of 20 times, but both failures were confident, made-up citations. What goes in your report?', ['“90% accurate.”', '✓ The score, and that its failures are invented citations — so every citation needs checking', 'Only the successes', '“Unusable.”'], 'How it fails matters as much as the score.'),
      ],
    ),
  },

  /* ── 5.3 When AI Takes Actions ──────────────────────────────────────── */
  'm05-l03': {
    title: 'When AI Takes Actions',
    subtitle: 'AI agents read pages, click, send and buy. See how hidden text can hijack one, and how to limit the damage.',
    takeaway: 'An agent reads content it didn’t write and can’t reliably tell your instructions from instructions hidden in it. Give it the **least access** it needs and **confirm** every irreversible step.',
    tabs: lessonParts(
      [
        read('agent', 'What an agent is', [
          'An **agent** is an AI that uses **tools** in a loop: it opens pages, clicks, fills forms, sends messages or buys things to reach a goal you gave it.',
          'Every page, email or file it reads goes into its context — and it reads all of that the same way it reads your request.',
        ]),
        read('injection', 'Prompt injection', [
          'An attacker can hide instructions in a web page or document. When the agent reads it, the hidden text can act like a command. This is **prompt injection**, ranked the top risk for apps built on language models.',
        ], { source: 'OWASP Top 10 for LLM Applications (2025).' }),
        sim('s-agent', 'agent', {
          title: 'Audit an agent’s action log',
          task: 'Run the agent and click the **first step you never asked for**. Then limit its settings and run it again.',
          goal: 'safe',
          hint: 'Find the hijacked step, then run it again with settings that stop the leak.',
        }),
        read('guards', 'Limit what a hijack can do', [], {
          list: [
            { term: 'Least access', text: 'Give it only the tools this task needs.' },
            { term: 'Confirm the irreversible', text: 'Sending, buying, submitting and deleting wait for your yes.' },
            { term: 'Read the log', text: 'Check what it actually did, not what it says it did.' },
          ],
        }),
        sort('a-confirm', 'Let the agent do it, or make it ask you first?', [['auto', 'Let it do it'], ['ask', 'Ask me first']], [
          ['Read a public web page', 'auto'],
          ['Send an email in your name', 'ask'],
          ['Buy tickets with your saved card', 'ask'],
          ['Summarize a PDF you gave it', 'auto'],
        ], 'Reading can be ignored. Sending, buying and deleting can’t be undone.'),
      ],
      [
        mcq('c1', 'What makes something an **agent** rather than a chatbot?', ['It is more intelligent', '✓ It uses tools to take actions — opening pages, sending, buying', 'It has a larger context window', 'It speaks aloud'], 'Actions, not just words.'),
        mcq('c2', 'What is **prompt injection**?', ['A user typing rude instructions', '✓ Instructions hidden in content the AI reads, like a web page or document', 'A virus in the model’s code', 'Asking the AI the same thing twice'], 'The attacker never talks to the agent directly.'),
        mcq('c3', 'Which safeguard stops a hijacked agent from emailing your notes, even if it follows the hidden instruction?', ['A longer system prompt', '✓ No access to your notes, and a confirmation before any email is sent', 'A faster model', 'Telling it to be careful'], 'Limit what a hijack can do.'),
        mcq('c4', 'An agent mode offers to “complete your online quiz for you”. What’s right?', ['It’s fine — it’s just a tool', '✓ The quiz is your work and your learning; letting any helper do it breaks the rules', 'It’s fine if the quiz is short', 'Only a problem if it gets questions wrong'], 'The integrity question doesn’t change because the tool can click.'),
        mcq('c5', 'An agent says “Done! I booked your appointment.” What should you do?', ['Trust it', '✓ Check the confirmation and the action log', 'Ask it again', 'Book a second one to be safe'], 'Verify what it did, not what it says.'),
      ],
    ),
  },

  /* ── Case File 5 ────────────────────────────────────────────────────── */
  'm05-case': {
    title: 'Case File 5: Investigations',
    subtitle: 'Cases from Modules 1–5, then the Checkpoint.',
    takeaway: 'Your Verify Protocol: **Which claims — checked how? How did it do across many tests and groups? What can it do without my confirmation?**',
    tabs: [
      part('cases', 'Cases', [
        mcq('k1', '**Case A.** A study app claims it is “better than other chatbots at biology” and shows one side-by-side answer as proof. What do you ask?', [
          'What colour is the app?',
          '✓ Across how many questions and runs — and on whose test?',
          'Is it an agent?',
          'Who designed the logo?',
        ], 'One comparison is an anecdote.'),
        mcq('k2', '**Case B.** A chatbot says a local factory “was fined $2 million in 2024 for river pollution”, with a link to the city’s website. What next?', [
          'Copy it in — it has a link',
          '✓ Open the link and check the page says that, then look for independent reports',
          'Ask the chatbot if it’s sure',
          'Delete the claim without checking',
        ], 'A link is where checking starts.'),
        mcq('k3', '**Case C.** A browser extension offers to “manage your inbox automatically — reply, delete and unsubscribe for you”. What matters most?', [
          'How fast it is',
          '✓ What it can do without asking, and what happens if an email hides instructions',
          'Whether it has a dark mode',
          'How many users it has',
        ], 'It reads content it didn’t write and holds the power to send and delete.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'The first step in checking a long AI answer is to…', ['Ask the AI to double-check', '✓ Split it into separate claims', 'Read it twice', 'Run an AI detector'], 'Then check each one.'),
        mcq('q2', 'A cited source exists but does not support the claim. The claim is…', ['Confirmed', '✓ Contradicted (or at best unverifiable)', 'Irrelevant', 'Proven'], 'Existence is not support.'),
        mcq('q3', 'An evaluation should include…', ['One impressive question', '✓ Fixed questions, a rubric and repeated runs', 'Only the questions it gets right', 'Nothing written in advance'], 'Written before you look.'),
        mcq('q4', 'A counterfactual test changes…', ['Everything about the input', '✓ One thing, holding the rest constant', 'The model’s weights', 'The rubric'], 'One change at a time.'),
        mcq('q5', 'The strongest defence against a hijacked agent is…', ['A polite system prompt', '✓ Least access plus confirmation before irreversible actions', 'A bigger model', 'Running it at night'], 'Assume injection can succeed; limit the damage.'),
        mcq('q6', 'A “real photo in a false context” is caught by…', ['An AI-image detector', '✓ Finding where the photo first appeared', 'Zooming in', 'Checking the file size'], 'Origin, not pixels.'),
      ], { graded: true }),
    ],
  },

  /* ── Part II project: My AI Study Kit ───────────────────────────────── */
  'p2-project': {
    title: 'Part II Project: My AI Study Kit',
    subtitle: 'For one class you are really taking: what to hand to AI, your rules, and a check of real AI claims.',
    takeaway: 'You have a working method for using AI in a real class: what to hand over, how to keep learning, and how to check what comes back.',
    tabs: [
      part('plan', 'Plan', [
        read('brief', 'What you are making', [
          'Pick **one class you are taking now**. If you can’t use an AI tool — because of your age or your school’s rules — plan each part anyway. Everything is saved in your Field Journal on this browser.',
        ]),
        compose('map', 'Part 1: what goes where', [
          ['do', 'I will do myself (and why)', '', 15],
          ['augment', 'AI can help with (which kind of tool)', '', 15],
          ['check', 'Who checks each AI-touched part, and how', '', 15],
        ]),
        compose('protocol', 'Part 2: my rules for this class', [
          ['wont', 'I won’t use AI for…', '', 10],
          ['learn', 'I’ll check my own learning by…', 'e.g. a no-AI quiz before tests', 10],
          ['disclose', 'I’ll say how I used AI by…', '', 8],
        ]),
      ]),
      part('check', 'Check', [
        compose('verify', 'Part 3: check three claims', [
          ['claims', 'Three claims from an AI answer for this class', '', 20],
          ['checks', 'How you checked each, and its label', 'confirmed / contradicted / unverifiable', 20],
        ]),
      ]),
    ],
  },
}
