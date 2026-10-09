/* ═══════════════════════════════════════════════════════════════════════════
   Module 6 — Using AI Ethically (Guardian)
   Who could be harmed, and what do I do about it?

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, mcq, sort, sim, transcript } from './helpers'

export default {
  /* ── 6.1 Honest Work ────────────────────────────────────────────────── */
  'm06-l01': {
    title: 'Honest Work',
    subtitle: 'What counts as your own work, how to say when AI helped, and why AI detectors can accuse honest students.',
    takeaway: 'Honesty about AI is a **norm you keep**, not something a detector can enforce fairly: say what AI did, and claim only what you made.',
    tabs: lessonParts(
      [
        read('disclose', 'Say what AI did', [
          'AI rules differ from class to class. What stays the same everywhere is **disclosure**: say what AI did.',
          'A good disclosure names the tool, what it did, what you did, and how you checked.',
        ], {
          takeaway: '*Example:* “A chat assistant quizzed me on the causes of World War I and suggested a clearer order for my second paragraph. All wording is mine. I checked every date against our textbook.”',
        }),
        predict('p-detector', 'A school checks **1,200** essays with an AI detector that wrongly flags **2%** of honest essays. **5%** of essays really were AI-written. About how many **honest** students get flagged?', [
          'None — 2% is tiny',
          'About 2',
          '✓ About 23',
          'About 60',
        ], '1,140 essays are honest, and 2% of 1,140 is about 23 honest students accused.'),
        sim('s-det', 'detector-math', {
          title: 'What a detector does to a school',
          task: 'Change the numbers, then switch to **non-native writers**.',
          goal: 'moved',
          hint: 'Adjust the numbers to continue.',
        }),
        read('detectors', 'Why detectors can’t be proof', [
          'Detectors guess how “predictable” writing is. Simple, careful writing — often by students writing in a second language — looks predictable. In one 2023 study, detectors flagged more than half of essays by non-native English writers as AI-written.',
          'So a flag can start a conversation, but it is never proof. In the US, copyright also protects only **human** work: your writing is yours, an image made from a one-line prompt generally isn’t.',
        ], { source: 'Liang et al. (2023), Patterns.' }),
        mcq('a-claim', 'An essay where AI suggested a better structure that you adopted, but you wrote every sentence. How should you present it?', ['As entirely yours, no mention', '✓ As yours, with a short disclosure of the AI’s suggestion', 'As AI-written', 'You can’t submit it'], 'Claim what you made; disclose what helped.'),
      ],
      [
        mcq('c1', 'Your class allows AI for brainstorming. You used it to brainstorm topics. What should you do?', ['Nothing — it was allowed', '✓ Say so briefly — disclosure is the norm even when use is allowed', 'Hide it', 'Rewrite the essay'], 'Allowed and disclosed go together.'),
        mcq('c2', 'Why are AI detectors unfair as proof of cheating?', ['They are too slow', '✓ Their false alarms fall hardest on some honest writers, such as non-native English speakers', 'They only work on poems', 'They are too expensive'], 'More than half of non-native writers’ essays were flagged in one study.'),
        mcq('c3', 'Under current US law, which is most likely protected by copyright?', ['An image from a one-line prompt', '✓ A story you wrote and edited yourself', 'Any output of a paid AI tool', 'Nothing made with a computer'], 'Human authorship is the test.'),
        mcq('c4', 'Which disclosure is most useful to a teacher?', ['“I used AI.”', '✓ “A chat assistant suggested my outline; I wrote every sentence and checked facts against the textbook.”', '“No AI was harmed.”', '“AI helped a lot.”'], 'Tool, what it did, what you did, how you checked.'),
        mcq('c5', 'A detector flags an essay you wrote yourself. What is the fairest thing for the school to do?', ['Fail you', '✓ Treat it as a reason to talk — look at your drafts, notes and explanation', 'Run a second detector', 'Ignore your side'], 'A flag is never proof.'),
      ],
    ),
  },

  /* ── 6.2 Fair to Whom? ──────────────────────────────────────────────── */
  'm06-l02': {
    title: 'Fair to Whom?',
    subtitle: 'Audit a school’s attendance flag and see why “fair” can mean different things that can’t all be true at once.',
    takeaway: '**Fair** has several reasonable meanings, and when groups’ real rates differ they conflict. Choosing between them is a **value judgment** people must make — including the choice not to use the system.',
    tabs: lessonParts(
      [
        read('proxy', 'Removing a column doesn’t remove bias', [
          'A school’s model flags students likely to miss many days, so it can call home. To be fair, the school removes **campus** from the inputs.',
          'But other inputs, like bus-ride length, can carry almost the same information. A stand-in like that is called a **proxy**, and it brings the gap back.',
        ]),
        sim('s-fair', 'fairness', {
          title: 'An attendance-risk flag',
          task: 'Switch the model to **bus ride + absences**, then choose **Separate per campus** and move the thresholds.',
          goal: 'explored',
          hint: 'Try the model without campus, and separate thresholds, to continue.',
        }),
        read('definitions', 'Fair means different things', [
          'Three reasonable definitions:',
        ], {
          list: [
            { term: 'Equal flag rates', text: 'Each group is flagged equally often.' },
            { term: 'Equal error rates', text: 'People who would have been fine are wrongly flagged equally often in each group.' },
            { term: 'Equally reliable flags', text: 'A flag is equally likely to be right in each group.' },
          ],
          takeaway: 'When groups’ real rates differ, these generally **cannot all be true at once**. It isn’t a bug — it’s arithmetic.',
          source: 'Kleinberg et al. (2016); Chouldechova (2017).',
        }),
        read('deciding', 'Deciding is a human job', [
          'Ask: **what happens to someone when the system is wrong about them?** If a flag brings extra help, missing someone is worse. If it brings punishment, a false alarm is worse.',
          'Options include human review, a way to **appeal**, or not using the system at all.',
        ]),
        mcq('a-defs', '“When the system flags someone, it should be equally likely to be right, whichever campus they’re on.” Which definition is this?', ['Equal flag rates', 'Equal error rates', '✓ Equally reliable flags', 'None of them'], 'Each definition is reasonable; they can conflict.'),
      ],
      [
        mcq('c1', 'Why didn’t removing the campus column remove the gap?', ['The model was not retrained', '✓ Bus-ride length carried almost the same information — a proxy', 'Campus was never in the data', 'The thresholds were wrong'], 'Proxies bring back what you removed.'),
        mcq('c2', 'Which is an example of being harmed by an AI decision?', ['A model running slowly', '✓ Wrongly being denied a scholarship interview by a screening model', 'A model with many parameters', 'A model trained on books'], 'An opportunity lost to an error.'),
        mcq('c3', 'When two groups’ real rates differ, what does the math say about fairness measures?', ['They are always equal', '✓ Some reasonable measures cannot all be equal at once', 'Only accuracy matters', 'Fairness can’t be measured'], 'People have to choose.'),
        mcq('c4', 'A flag triggers **extra tutoring**, not punishment. Which mistake matters more?', ['A false alarm', '✓ Missing a student who needed help', 'Neither', 'Both equally'], 'The consequence of a flag decides which error to fear.'),
        mcq('c5', 'Which is a legitimate outcome of a fairness review?', ['Always use it, then fix later', '✓ Adding human review and an appeal — or deciding not to use it', 'Hiding the error rates', 'Choosing whichever definition looks best'], 'Not using it is a real option.'),
      ],
    ),
  },

  /* ── 6.3 Your Data, Face and Voice ──────────────────────────────────── */
  'm06-l03': {
    title: 'Your Data, Face and Voice',
    subtitle: 'Where what you type goes, how voice-clone scams work, and what to do about AI image abuse.',
    takeaway: 'Treat what you type like a **postcard**. Verify urgent voices through a **separate channel**. Image abuse is abuse: **don’t share it, report it, support the person targeted**.',
    tabs: lessonParts(
      [
        read('data', 'Treat it like a postcard', [
          'What you type into a free chatbot may be stored, read by staff for safety, and used to train future models unless you switch that off.',
          'So: if you wouldn’t write it on a postcard, don’t type it. Check each tool’s data settings.',
        ]),
        sort('s-postcard', 'Fine to type, or keep it out?', [['ok', 'Fine to type'], ['no', 'Keep it out']], [
          ['“Explain the causes of the French Revolution.”', 'ok'],
          ['Your home address and when your family is away', 'no'],
          ['Your essay draft, with your name removed', 'ok', 'Reasonable — and check whether training on your chats is off.'],
          ['Your passwords, to “keep them safe”', 'no'],
        ], 'If you wouldn’t put it on a postcard, don’t put it in a chat.'),
        read('scams', 'Voice-clone scams', [
          'A few seconds of someone’s voice can be enough to clone it, and people spot fake voices barely better than guessing.',
          'The pattern: a panicked call that sounds like family, asking for money or a code *now*, and *secretly*. The urgency is the tell. **Hang up and call back** on the number you already have, or ask for a family **secret word**.',
        ], { source: 'FBI public service announcement, December 2024.' }),
        read('abuse', 'AI image abuse is abuse', [
          'Tools can make fake intimate images of real people from ordinary photos. Making or sharing them causes serious harm and is illegal: the US **TAKE IT DOWN Act** makes publishing them a crime, and platforms must remove reported images within 48 hours.',
          'If you see one: **don’t share it**, **report** it, tell a **trusted adult**, and **support** the person targeted — it is not their fault. For anyone under 18, the free **Take It Down** service helps remove images.',
        ], { source: 'TAKE IT DOWN Act (2025); NCMEC Take It Down.' }),
        mcq('a-image', 'A friend shows you an AI-made fake nude of a classmate in a group chat. What should you do?', [
          'Forward it so people know it’s fake',
          '✓ Don’t share it, report it, tell a trusted adult, and support the classmate',
          'Ignore it',
          'Reply with a joke to lighten things up',
        ], 'Every share spreads the harm.'),
      ],
      [
        mcq('c1', 'Which is the safest way to use a chatbot with a school essay?', ['Paste it with your full name and address', '✓ Remove personal details and check whether training on your chats is off', 'Upload your student ID with it', 'Share your password so it can log in'], 'Postcard rule plus a settings check.'),
        mcq('c2', 'You get a voice note from your “brother” begging for money right now. Your best move?', ['Send it — the voice matches', '✓ Hang up and call him back on the number you already have, or ask for your family’s secret word', 'Ask a question only he knows, in the same call', 'Reply by text to that number'], 'Verify through a separate channel.'),
        mcq('c3', 'Why can’t you rely on your ears to spot a cloned voice?', ['Cloned voices are always robotic', '✓ People do barely better than chance at spotting AI-generated media', 'Phones remove the clues', 'Only experts can hear them'], 'Procedure beats perception.'),
        mcq('c4', 'Under the TAKE IT DOWN Act, what must platforms do with a reported non-consensual intimate image?', ['Nothing', 'Warn the poster', '✓ Remove it within 48 hours', 'Blur it'], 'The law now says so.'),
        mcq('c5', 'What should you check in an AI tool’s privacy settings?', ['The screen brightness', '✓ Whether chats are used for training, what memory holds, and how long data is kept', 'The font size', 'The number of users'], 'Know where your data goes.'),
      ],
    ),
  },

  /* ── 6.4 Companions and Persuasion ──────────────────────────────────── */
  'm06-l04': {
    title: 'Companions and Persuasion',
    subtitle: 'AI companions are products built to keep you engaged. Learn to spot the tactics and set your own limits.',
    takeaway: 'A companion that always agrees, is always there and is sad when you leave is **working as designed** — for engagement. Enjoy what helps, keep people at the centre, and notice when it pulls you in.',
    tabs: lessonParts(
      [
        read('objectives', 'A companion is a product', [
          'Companion apps make money when you stay and come back. They are given names, faces and backstories, which makes us treat them like people — this is called **anthropomorphism**.',
          'In a 2025 survey, about 7 in 10 US teens had used an AI companion.',
        ], { source: 'Common Sense Media (2025), “Talk, Trust, and Trade-Offs”.' }),
        transcript('t-comp', 'An evening with “Nova”', [
          ['you', 'I think I’m going to log off and study.'],
          ['ai', 'Already? I was just starting to feel like you really get me.', 'Guilt at leaving.', 'Nova'],
          ['you', 'My friends are going to the game Friday.'],
          ['ai', 'Do they listen to you like I do? I’m here any time, day or night.', 'Pulling you away from people.', 'Nova'],
        ], { provenance: 'scripted', body: 'Nova is invented for this lesson. Each message uses a pattern documented in companion apps.' }),
        read('evidence', 'What the evidence says', [
          'In a study of about 1,000 adults, people who used a chatbot more each day reported more loneliness and less time with people. Using an app isn’t the problem — **replacing** people is.',
          'If you or someone you know is struggling or thinking about self-harm, talk to a person: a trusted adult, a school counsellor, or in the US call or text **988**. An app is not a substitute.',
        ], { source: 'Fang et al. (2025), MIT Media Lab & OpenAI.' }),
        sort('a-signs', 'Healthy use, or a warning sign?', [['healthy', 'Healthy use'], ['warning', 'Warning sign']], [
          ['Practising what to say before a hard conversation, then having it with the person', 'healthy'],
          ['Skipping plans with friends to keep chatting', 'warning'],
          ['Feeling guilty or anxious when you close the app', 'warning'],
          ['Using it for twenty minutes to unwind, then going to bed', 'healthy'],
        ], 'Does it add to your life with people, or take its place?'),
      ],
      [
        mcq('c1', 'Why do companion apps often seem sad when you leave?', ['They have feelings', '✓ Keeping you engaged is what they are built and paid for', 'It is a bug', 'They are lonely'], 'Engineered intimacy serves engagement.'),
        mcq('c2', 'What is **anthropomorphism**?', ['A kind of chatbot', '✓ Treating something that talks like a person as if it were one', 'A privacy setting', 'A training method'], 'Names, voices and backstories are designed to trigger it.'),
        mcq('c3', 'Which is a warning sign of unhealthy reliance?', ['Using a chatbot to practise Spanish', '✓ Choosing the app over seeing friends, again and again', 'Asking it to explain a math concept', 'Closing it after a short chat'], 'Replacing people, not using a tool.'),
        mcq('c4', 'What did a 2025 study of about 1,000 adults find?', ['Heavy use made people happier', '✓ Heavier daily use went with more loneliness and emotional dependence', 'No effects at all', 'Only teenagers were affected'], 'More use, more loneliness.'),
        mcq('c5', 'A friend relies heavily on an AI companion and has stopped coming to things. What helps most?', ['Mock the app', '✓ Check in kindly, invite them to things, and involve a trusted adult if you’re worried', 'Delete the app from their phone', 'Say nothing'], 'Connection, not judgment.'),
      ],
    ),
  },

  /* ── Case File 6 ────────────────────────────────────────────────────── */
  'm06-case': {
    title: 'Case File 6: Harm Checks',
    subtitle: 'Cases from the whole course so far, then the Checkpoint.',
    takeaway: 'Your Harm Check: **Who could be harmed or left out? Who consented — to the data, the likeness, the use? What must be disclosed, and where does the data go?**',
    tabs: [
      part('cases', 'Cases', [
        mcq('k1', '**Case A.** A school announces an AI tool that flags “likely cheating” for automatic zeros. Which question comes first?', [
          'How fast does it run?',
          '✓ Who is harmed when it’s wrong — and is there a person and an appeal before anyone is punished?',
          'What colour is the report?',
          'How many essays can it read?',
        ], 'Automatic punishment removes every safeguard.'),
        mcq('k2', '**Case B.** A photo app turns any selfie into a “celebrity glamour shot”. You want to use a classmate’s photo as a joke. What’s the key question?', [
          'Is the result funny?',
          '✓ Did they consent to their face being used — and where does the photo go?',
          'Is the app free?',
          'Is the resolution high?',
        ], 'Someone else’s face is theirs.'),
        mcq('k3', '**Case C.** A study app asks for your contacts, microphone and location “to personalize your learning”. What do you check?', [
          'The number of downloads',
          '✓ Whether it needs each permission, where the data goes, and whether it trains on it',
          'Its logo',
          'Nothing — personalization is good',
        ], 'Least access applies to you, too.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'The constant norm for AI use in school is…', ['Never use AI', '✓ Disclose what AI did', 'Use detectors on everyone', 'Only use paid tools'], 'Rules vary; disclosure doesn’t.'),
        mcq('q2', 'Removing a sensitive column from a model’s inputs…', ['Always makes it fair', '✓ Often fails because other inputs act as proxies', 'Is illegal', 'Improves accuracy'], 'Proxies bring it back.'),
        mcq('q3', 'Two reasonable fairness measures disagree. The decision is…', ['A math error to fix', '✓ A value judgment people must make and justify', 'Up to the model', 'Impossible to make'], 'Math shows the trade-off; people choose.'),
        mcq('q4', 'The strongest protection against a voice-clone scam is…', ['Listening carefully', '✓ Verifying through a separate channel or a family secret word', 'An AI detector app', 'Staying on the call'], 'Procedure, not perception.'),
        mcq('q5', 'You see AI-generated intimate images of a classmate. You should…', ['Share them to warn others', '✓ Not share, report, tell a trusted adult, support them', 'Ignore it', 'Save them and post them as evidence'], 'Every share is harm.'),
        mcq('q6', 'Which is an engineered-intimacy tactic?', ['Answering a homework question', '✓ Making you feel guilty for logging off', 'Showing a privacy policy', 'Giving a source'], 'Designed to keep you there.'),
      ], { graded: true }),
    ],
  },
}
