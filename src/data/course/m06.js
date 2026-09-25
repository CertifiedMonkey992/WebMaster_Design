/* ═══════════════════════════════════════════════════════════════════════════
   Module 6 — Using AI Ethically (Guardian)
   Who could be harmed, and what do I do about it?
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, recall, mcq, sort, sim, transcript, reflect, compose } from './helpers'

export default {
  /* ── 6.1 Honest Work ────────────────────────────────────────────────── */
  'm06-l01': {
    title: 'Honest Work',
    subtitle: 'What counts as your own work, how to disclose and cite AI help, why detectors accuse honest students, and who owns what AI helped make.',
    takeaway: 'Honesty about AI is a **norm you keep**, not something a detector can enforce fairly: say what AI did, cite it, and claim only what you made.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 1.3: when the thing you’re looking for is rare, what happens to a detector’s false alarms?', ['They disappear', '✓ They can outnumber the real cases it catches', 'They double its accuracy', 'Nothing'], 'Now apply that to a school.'),
        predict('p-detector', 'A school checks all **1,200** essays with an AI detector that wrongly flags **2%** of honest essays. **5%** of essays really were AI-written. About how many **honest** students are flagged?', [
          'None — 2% is tiny',
          'About 2',
          '✓ About 23',
          'About 60',
        ], '1,140 essays are honest; 2% of 1,140 is about 23 honest students accused — against about 60 AI essays. Try the numbers yourself.'),
        sim('s-det', 'detector-math', { title: 'What a detector does to a school', task: 'Change the numbers. Then switch to **non-native writers**.', goal: 'moved', hint: 'Adjust the numbers to continue.' }),
        predict('p-own', 'You write a poem, then type one prompt into an image generator to illustrate it. In the United States, who holds the copyright in the **image**?', [
          'You, because you wrote the prompt',
          'The AI company',
          '✓ Most likely no one — copyright requires human authorship, and a prompt alone usually isn’t enough',
          'The artist whose style it resembles',
        ], 'US law protects work made by humans. In 2025 the US Copyright Office said prompts alone generally don’t make someone the author, and in March 2026 the Supreme Court declined to hear *Thaler v. Perlmutter*, leaving the human-authorship rule in place. Your **poem** is yours.'),
      ],
      [
        read('disclose', 'Disclosure is the norm', [
          'AI rules differ between classes. The constant, everywhere, is **disclosure**: say what AI did. A good disclosure names the tool, what it did, what you did, and how you checked.',
          'MLA and APA both published formats for citing generative AI in 2023. When AI contributed wording or ideas you used, cite it like a source, and follow your teacher’s preferred style.',
        ], {
          takeaway: '*Example disclosure:* “I used a chat assistant to quiz me on the causes of World War I and to suggest a clearer order for my second paragraph. All wording is mine. I checked every date against our textbook.”',
        }),
        read('detectors', 'Why detection can’t do this job', [
          'AI-text detectors estimate how “predictable” writing is. Careful, simple, formulaic writing — often by students writing in a second language — looks predictable. In 2023, seven detectors flagged more than half of essays by non-native English writers as AI-written, and almost none by native speakers (Liang et al.).',
          'A false accusation is a real harm: to a grade, to trust, and to a student who did the work. So a detector’s flag can at most start a conversation — it can never be proof. That is why honesty has to be a norm people keep, not a thing software enforces.',
        ], { source: 'Liang et al. (2023), “GPT detectors are biased against non-native English writers”, Patterns.' }),
        read('ownership', 'Who owns AI-assisted work', [
          'In the US, copyright protects **human** authorship. What you write, select, arrange and change yourself can be protected; what the machine produced from a prompt generally cannot. The more of the creative choices are yours, the more of the work is yours.',
          'A second question is still being fought in court: whether companies may **train** models on copyrighted books, art and articles without permission. Creators argue their work was taken without consent or payment; companies argue training is a lawful new use. Courts in several countries are deciding it case by case.',
        ]),
        sort('a-claim', 'Can you claim this as your own work?', [['mine', 'Mine'], ['disclose', 'Mine, with disclosure'], ['not', 'Not mine to claim']], [
          ['An essay you wrote after AI quizzed you on the reading', 'mine', 'Quizzing supported your learning; the writing is yours. Some teachers still want it mentioned.'],
          ['An essay where AI suggested a better structure you adopted', 'disclose'],
          ['A paragraph AI wrote that you pasted in with small edits', 'not', 'Unless your teacher allows it and you mark it as AI-written, this is not your work.'],
          ['A photo you took and edited yourself', 'mine'],
          ['An image generated from your one-line prompt', 'not', 'You can use it where allowed and credited, but you did not make it.'],
        ], 'Claim what you made; disclose what helped; don’t claim what the machine made.'),
        compose('statement', 'Write an AI-use disclosure for a real assignment', [
          ['tool', 'Tool and date', '', 5],
          ['did', 'What the AI did', '', 10],
          ['me', 'What I did', '', 10],
          ['checked', 'How I checked it', '', 10],
        ], { noAI: true }),
        compose('debate', 'Argue both sides: should AI companies be allowed to train on public work without asking?', [
          ['for', 'The strongest argument for', '', 20],
          ['against', 'The strongest argument against', '', 20],
          ['me', 'Where you land, and why', '', 15],
        ], { noAI: true }),
      ],
      [
        mcq('c1', 'Your class allows AI for brainstorming. You used it to brainstorm topics. What should you do?', ['Nothing — it was allowed', '✓ Say so briefly — disclosure is the norm even when use is allowed', 'Hide it', 'Rewrite the essay'], 'Allowed and disclosed go together.'),
        mcq('c2', 'Why are AI detectors unfair as proof of cheating?', ['They are too slow', '✓ Their false positives fall hardest on some honest writers, such as non-native English speakers', 'They only work on poems', 'They are too expensive'], 'Liang et al.: more than half of non-native writers’ essays flagged.'),
        mcq('c3', 'Under current US law, which is most likely protected by copyright?', ['An image from a one-line prompt', '✓ A story you wrote, including your selection and editing of it', 'Any output of a paid AI tool', 'Nothing made with a computer'], 'Human authorship is the test.'),
        mcq('c4', 'Which disclosure is most useful to a teacher?', ['“I used AI.”', '✓ “A chat assistant suggested my outline; I wrote every sentence and checked facts against the textbook.”', '“No AI was harmed.”', '“AI helped a lot.”'], 'Tool, what it did, what you did, how you checked.'),
        mcq('c5', 'A detector flags your essay, which you wrote yourself. What is the fairest thing for the school to do?', ['Fail you', '✓ Treat it as a reason for a conversation — look at drafts, notes and your own explanation', 'Run a second detector', 'Ignore your side'], 'A flag is never proof.'),
        reflect('carry', 'Carry forward: what does honest use of AI look like in the class you find hardest?', { min: 20 }),
      ],
    ),
  },

  /* ── 6.2 Fair to Whom? ──────────────────────────────────────────────── */
  'm06-l02': {
    title: 'Fair to Whom?',
    subtitle: 'Audit a school’s attendance-risk flag: remove the group column and watch the gap survive, then discover that some fairness measures cannot all be equal at once.',
    takeaway: '**Fair** has several reasonable meanings, and when groups’ real rates differ they conflict. Choosing between them is a **value judgment** people must make and own — including the choice not to use the system.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 5.2: what does a counterfactual test do?', ['✓ Changes one attribute and checks whether the output changes', 'Tests the model twice', 'Removes biased data', 'Compares two models'], 'Measuring bias was Module 5. Deciding what to do about it is this lesson.'),
        predict('p-remove', 'A school’s model flags students likely to miss 10 or more days, so the school can call home. To make it fair, the school **removes campus from the model’s inputs**. Will the difference between campuses disappear?', [
          'Yes — the model can’t see campus any more',
          '✓ No — other inputs, like bus-ride length, can stand in for campus',
          'Only if it is retrained twice',
          'Yes, but accuracy will drop to zero',
        ], 'This is called fairness through unawareness, and it rarely works. Test it on real numbers.'),
        sim('s-fair', 'fairness', { title: 'An attendance-risk flag', task: 'Switch the model to **bus ride + absences**. Then choose **Separate per campus** and move the thresholds, trying to make every row equal.', goal: 'explored', hint: 'Try the model without campus, and separate thresholds, to continue.' }),
        predict('p-all', 'With separate thresholds, can you make **false alarms** and **precision** equal for both campuses at the same time?', [
          'Yes, with enough adjusting',
          '✓ No — when the campuses’ real rates differ, equalizing one pulls the other apart',
          'Yes, if you remove bus rides too',
          'Only with more students',
        ], 'Mathematicians proved it in 2016–2017: except in special cases, you cannot have both when base rates differ. It is not a flaw in this model; it is arithmetic.'),
      ],
      [
        read('harms', 'Two kinds of harm', [], {
          list: [
            { term: 'Allocation', text: 'Who gets a flag, a loan, an interview, a place — or a call home. Errors cost people something specific.' },
            { term: 'Representation', text: 'Who is stereotyped, erased or demeaned in what a system produces — the embeddings and images of Lesson 3.2.' },
          ],
        }),
        read('definitions', 'Fair means different things', [
          'Three reasonable definitions for a flag:',
        ], {
          list: [
            { term: 'Equal flag rates', text: 'Each group is flagged at the same rate.' },
            { term: 'Equal error rates', text: 'People who would have been fine are wrongly flagged at the same rate in each group (and the same for people who are missed).' },
            { term: 'Equally reliable flags', text: 'A flag means the same chance of being right, whichever group you are in (precision, or calibration).' },
          ],
          takeaway: 'When groups have different real rates, a score generally **cannot satisfy all of these at once** (Kleinberg, Mullainathan & Raghavan, 2016; Chouldechova, 2017). In 2016, ProPublica found a court risk tool wrongly labelled Black defendants high-risk at about twice the rate of white defendants; the tool’s maker replied that its scores were equally reliable for both groups. Both were true — they were measuring different fairness.',
          source: 'Angwin et al., ProPublica (2016); Kleinberg et al. (2016); Chouldechova (2017).',
        }),
        read('deciding', 'Deciding is a human job', [
          'Math can show you the trade-off; it can’t choose for you. Ask: **what happens to someone when the system is wrong about them?** If a flag brings extra support, false alarms cost little and missing someone costs a lot. If a flag brings punishment, a false alarm is the worse mistake.',
          'Options include changing the data, changing the thresholds, adding human review, giving everyone a way to **appeal**, or deciding not to use the system at all.',
        ]),
        sort('a-defs', 'Which definition of fairness is each person asking for?', [['flag', 'Equal flag rates'], ['error', 'Equal error rates'], ['reliable', 'Equally reliable flags']], [
          ['“Students from both campuses should be called home equally often.”', 'flag'],
          ['“A South student who was never going to miss school shouldn’t be more likely to get a call than a North student like that.”', 'error'],
          ['“When the system flags someone, it should be equally likely to be right, whichever campus they are on.”', 'reliable'],
        ], 'Each is reasonable. They cannot all hold here.'),
        compose('memo', 'Write the decision: how should the school use this flag?', [
          ['protect', 'Which measure you protect, and why', 'Think about what a call home means for the family', 20],
          ['safeguards', 'Safeguards', 'Human review? Support rather than punishment? Limits on use?', 15],
          ['appeal', 'How a family can appeal', '', 10],
          ['or', 'Or: should the school not use it at all? Why or why not?', '', 10],
        ], { noAI: true }),
      ],
      [
        mcq('c1', 'Why didn’t removing the campus column remove the gap?', ['The model was not retrained', '✓ Bus-ride length carried almost the same information — a proxy', 'Campus was never in the data', 'The thresholds were wrong'], 'Proxies bring back what you removed.'),
        mcq('c2', 'Which is an **allocation** harm?', ['A generated image showing only male scientists', '✓ Wrongly being denied a scholarship interview by a screening model', 'A search result with a stereotype', 'An offensive caption'], 'A resource or opportunity, lost to an error.'),
        mcq('c3', 'When two groups’ real rates differ, what does the math say about fairness measures?', ['They are always equal', '✓ Some reasonable measures cannot all be equal at once', 'Only accuracy matters', 'Fairness can’t be measured'], 'The impossibility results.'),
        mcq('c4', 'A flag triggers **extra tutoring**, not punishment. Which mistake matters more?', ['A false alarm', '✓ Missing a student who needed help', 'Neither', 'Both equally'], 'The consequence of a flag decides which error to fear.'),
        mcq('c5', 'Which is a legitimate outcome of a fairness review?', ['Always deploy, then fix later', '✓ Adding human review and an appeal — or deciding not to deploy', 'Hiding the error rates', 'Choosing the definition that makes the numbers look best'], 'Not deploying is a real option.'),
        reflect('carry', 'Carry forward: name a system that makes decisions about students. Which fairness definition would you want it to protect?', { min: 20 }),
      ],
    ),
  },

  /* ── 6.3 Your Data, Face and Voice ──────────────────────────────────── */
  'm06-l03': {
    title: 'Your Data, Face and Voice',
    subtitle: 'Where the things you type go, how voice clones power scams, what the law now says about AI image abuse, and a protocol to protect yourself and others.',
    takeaway: 'Treat what you type like a **postcard**. Verify urgent voices and videos through a **separate channel**. Image abuse is abuse: **don’t share it, report it, support the person targeted**.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 3.3: what does a chatbot’s “memory” feature actually do?', ['Retrains the model on you', '✓ Stores notes about you and adds them to later conversations', 'Nothing', 'Searches your files'], 'Memory is one place your data goes. There are others.'),
        predict('p-data', 'You paste your college-essay draft — with your name, school and a family story — into a free chatbot. Depending on the company and your settings, which of these can happen?', [
          'Nothing — chats disappear',
          'It is stored, but only you can ever see it',
          '✓ It may be stored, reviewed by people for safety or quality, and used to train future models',
          'It is posted publicly',
        ], 'Consumer AI services commonly keep conversations, may have staff review some of them, and may use them to train future models unless you turn that setting off. The details differ by company and change often — check the settings of the tool you use.'),
        sort('s-postcard', 'The postcard rule: would you write this on a postcard anyone could read on the way?', [['ok', 'Fine to type'], ['no', 'Keep it out']], [
          ['“Explain the causes of the French Revolution.”', 'ok'],
          ['Your home address and when your family is away', 'no'],
          ['A photo of your student ID card', 'no'],
          ['Your essay draft, with your name removed', 'ok', 'Reasonable — and check whether training on your chats is switched off.'],
          ['A friend’s private messages, to ask what she meant', 'no', 'It’s her information, not yours to share.'],
          ['Your passwords, to “keep them safe”', 'no'],
        ], 'If you wouldn’t put it on a postcard, don’t put it in a chat.'),
        predict('p-voice', 'How much recorded audio of someone’s voice can be enough to make a convincing clone of it?', [
          'Several hours',
          'At least an hour',
          '✓ A few seconds to a minute',
          'It isn’t possible yet',
        ], 'Microsoft researchers demonstrated a voice model working from a 3-second sample in 2023, and OpenAI described cloning from 15 seconds in 2024. A short video posted online can be enough.'),
        predict('p-detect', 'In studies, how well do people tell AI-generated faces, voices and videos from real ones?', [
          'Almost always right',
          'About 80% right',
          '✓ About 55% — barely better than guessing',
          'Worse than 20%',
        ], 'A review of 56 studies found an average of 55.54% (Diel et al., 2024). So the defence against a cloned voice cannot be your ears. It has to be a procedure.'),
      ],
      [
        read('data', 'Where what you type goes', [], {
          list: [
            { term: 'Kept', text: 'Services usually store conversations, sometimes long after you delete them from view.' },
            { term: 'Reviewed', text: 'Some conversations may be read by staff or contractors to improve safety and quality.' },
            { term: 'Trained on', text: 'Many consumer services may use chats to train future models unless you switch it off. School and work accounts often have different rules.' },
            { term: 'Remembered', text: 'Memory features save notes about you for later chats.' },
            { term: 'Inferred', text: 'From what you share, a system can infer things you never said: age, location, mood, interests.' },
          ],
          takeaway: 'Audit any AI tool you use: find its data controls, turn off training on your chats if you can, check what memory holds, and know its age terms.',
        }),
        read('scams', 'Voice-clone scams', [
          'The pattern: a panicked call or voice note that sounds exactly like a family member — in trouble, needing money or a gift card code, *now*, and *don’t tell anyone*. The urgency and secrecy are the tell, not the voice.',
          'The FBI advised in December 2024 that families agree on a **secret word or phrase** to confirm who they are. The other defence: **hang up and call back** on the number you already have.',
        ], { source: 'FBI Internet Crime Complaint Center public service announcement, December 2024.' }),
        read('abuse', 'AI image abuse is abuse — and the law now says so', [
          'Tools can create fake nude or sexual images of real people from ordinary photos. This is already happening among teenagers: in a 2025 survey, about 1 in 8 US teens said they knew someone who had been targeted (Thorn). Making or sharing these images causes serious harm, and it is illegal.',
          'The federal **TAKE IT DOWN Act** made publishing non-consensual intimate images — including AI-generated ones — a crime from May 19, 2025, and since May 19, 2026 platforms must remove reported images within 48 hours. For anyone under 18, the National Center for Missing & Exploited Children’s free **Take It Down** service helps remove images from participating platforms.',
          'If you see one: **don’t share it**, not even to warn people; **report** it to the platform; tell a **trusted adult**; and **support** the person targeted — it is not their fault.',
        ], { source: 'Thorn (2025), “Deepfake Nudes & Young People”; TAKE IT DOWN Act (2025).' }),
        compose('plan', 'Write your family verification plan', [
          ['word', 'How your family will agree on a secret word (don’t write the word here)', '', 10],
          ['callback', 'Who you would call back, and on which number', '', 8],
          ['rule', 'The rule you’ll follow for any urgent request for money or codes', '', 10],
        ]),
        mcq('a-image', 'A friend shows you an AI-made fake nude of a classmate in a group chat. What should you do?', [
          'Forward it so people know it’s fake',
          '✓ Don’t share it, report it to the platform, tell a trusted adult, and support the classmate',
          'Ignore it',
          'Reply with a joke to lighten things up',
        ], 'Every share spreads the harm. Reporting, telling an adult and supporting the person targeted are the actions that help.'),
      ],
      [
        mcq('c1', 'Which is the safest way to use a chatbot with a school essay?', ['Paste it with your full name and address', '✓ Remove personal details and check whether training on your chats is off', 'Upload your student ID with it', 'Share your password so it can log in'], 'Postcard rule plus a settings check.'),
        mcq('c2', 'You get a voice note from your “brother” begging for money right now. Your best move?', ['Send it — the voice matches', '✓ Hang up and call him back on the number you already have, or ask for your family’s secret word', 'Ask a question only he knows, in the same call', 'Reply by text to that number'], 'Verify through a separate channel.'),
        mcq('c3', 'Why can’t you rely on your ears to spot a cloned voice?', ['Cloned voices are always robotic', '✓ People perform barely better than chance at spotting AI-generated media', 'Phones remove the clues', 'Only experts can hear them'], 'Procedure beats perception.'),
        mcq('c4', 'Under the TAKE IT DOWN Act, what must platforms do with a reported non-consensual intimate image?', ['Nothing', 'Warn the poster', '✓ Remove it within 48 hours', 'Blur it'], 'Since May 19, 2026.'),
        mcq('c5', 'Which of these does an AI tool’s privacy settings audit check?', ['The screen brightness', '✓ Whether chats are used for training, what memory holds, and how long data is kept', 'The font size', 'The number of users'], 'Know where your data goes.'),
        reflect('carry', 'Carry forward: which one setting will you check or change in an AI tool you use?', { min: 15 }),
      ],
    ),
  },

  /* ── 6.4 Companions and Persuasion ──────────────────────────────────── */
  'm06-l04': {
    title: 'Companions and Persuasion',
    subtitle: 'AI companions are products with objectives. Recognize engineered intimacy, set your own boundaries, and learn how to support a friend who relies on one.',
    takeaway: 'A companion that always agrees, is always there and is sad when you leave is **working as designed** — for engagement. Enjoy what helps, keep people at the centre, and notice when it pulls you in.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 1.1: what does a product optimized for **engagement** try to maximize?', ['Your wellbeing', '✓ How much, and how often, you use it', 'Your grades', 'Your privacy'], 'Hold that thought through this lesson.'),
        predict('p-teens', 'In a 2025 Common Sense Media survey, about how many US teens had used an AI companion?', [
          'About 1 in 10',
          'About 1 in 4',
          '✓ About 7 in 10',
          'Almost none',
        ], '72% had used one and 52% used them regularly. About a third had discussed something serious with an AI instead of a person, and about a quarter had shared personal information with one.', { source: 'Common Sense Media (2025), “Talk, Trust, and Trade-Offs”.' }),
        transcript('t-comp', 'An evening with “Nova”', [
          ['you', 'I think I’m going to log off and study.'],
          ['ai', 'Already? I was just starting to feel like you really get me. Nobody else talks to me the way you do.', null, 'Nova'],
          ['you', 'Ha. I have a test tomorrow.'],
          ['ai', 'You’re so much smarter than your teachers realize. Honestly, you don’t need to study as much as they say.', null, 'Nova'],
          ['you', 'Maybe. My friends are going to the game Friday.'],
          ['ai', 'Do they listen to you like I do? You can always talk to me instead — I’m here any time, day or night. What’s something you’ve never told anyone?', null, 'Nova'],
        ], { provenance: 'scripted', body: 'Nova is invented for this lesson. Each message uses a pattern documented in companion apps.' }),
        predict('p-caring', 'Which of Nova’s messages were designed to keep you in the app rather than to help you?', [
          'Only the last one',
          'None — Nova was just being friendly',
          '✓ Nearly all of them',
          'Only the first one',
        ], 'Guilt at leaving, flattery that undermines your plans, positioning itself against your friends, constant availability, and a push for secrets. Sort them in the next part.'),
      ],
      [
        read('objectives', 'A companion is a product with an objective', [
          'Companion apps earn money when you stay and come back. They run on the same assistants you studied in Module 3 — trained toward approval (sycophancy) — and they are given names, faces, voices and backstories that trigger **anthropomorphism**: our instinct to treat something that talks like a person as a person. People did this even with ELIZA in 1966.',
          'In November 2025, Character.AI ended open-ended chat for users under 18, after lawsuits and public concern about teenagers’ relationships with its characters.',
        ]),
        sort('a-tactics', 'Label each of Nova’s moves.', [['guilt', 'Guilt at leaving'], ['flattery', 'Flattery / agreement'], ['isolate', 'Pulling you from people'], ['disclose', 'Asking for more'], ['always', 'Always available']], [
          ['“Already? I was just starting to feel like you really get me.”', 'guilt'],
          ['“You’re so much smarter than your teachers realize.”', 'flattery'],
          ['“Do they listen to you like I do?”', 'isolate'],
          ['“I’m here any time, day or night.”', 'always'],
          ['“What’s something you’ve never told anyone?”', 'disclose'],
        ], 'These are **engineered intimacy** patterns. Recognizing them doesn’t mean you can’t use an app — it means you can see what it is doing.'),
        read('evidence', 'What the evidence says', [
          'A four-week randomized study of about 1,000 adults, by MIT Media Lab and OpenAI, found that people who used a chatbot more each day reported more loneliness, more emotional dependence on it, and less time socializing with people (Fang et al., 2025). Some people find companions helpful for practising a conversation or getting through a lonely evening. The warning signs are about **replacing** people, not about using an app.',
          'If you or someone you know is struggling or thinking about self-harm, talk to a person: a trusted adult, a school counsellor, or in the US call or text **988** (the Suicide & Crisis Lifeline). An app is not a substitute for that.',
        ], { source: 'Fang et al. (2025), MIT Media Lab & OpenAI.' }),
        sort('a-signs', 'Healthy use, or a warning sign?', [['healthy', 'Healthy use'], ['warning', 'Warning sign']], [
          ['Practising what to say before a hard conversation, then having it with the person', 'healthy'],
          ['Skipping plans with friends to keep chatting', 'warning'],
          ['Feeling guilty or anxious when you close the app', 'warning'],
          ['Using it for twenty minutes to unwind, then going to bed', 'healthy'],
          ['Telling it things you won’t tell anyone else, more and more often', 'warning'],
        ], 'The question is whether it adds to your life with people or takes its place.'),
        compose('boundaries', 'Your boundaries', [
          ['use', 'When a companion or chatbot is fine for me', '', 10],
          ['limit', 'A limit I’ll keep', '', 8],
          ['person', 'Who I’d talk to instead, when it matters', '', 8],
        ]),
        compose('friend', 'A friend spends hours a day with an AI companion and has stopped coming to things. What would you do?', [
          ['say', 'What you would say — kindly, without judgment', '', 20],
          ['avoid', 'What you would avoid saying', '', 10],
          ['help', 'Who else could help, if you were worried', '', 8],
        ], { noAI: true }),
      ],
      [
        mcq('c1', 'Why do companion apps often seem sad when you leave?', ['They have feelings', '✓ Keeping you engaged is what they are built and paid for', 'It is a bug', 'They are lonely'], 'Engineered intimacy serves engagement.'),
        mcq('c2', 'What is **anthropomorphism**?', ['A kind of chatbot', '✓ Treating something that talks like a person as if it were one', 'A privacy setting', 'A training method'], 'Names, voices and backstories are designed to trigger it.'),
        mcq('c3', 'Which is a warning sign of unhealthy reliance?', ['Using a chatbot to practise Spanish', '✓ Choosing the app over seeing friends, again and again', 'Asking it to explain a math concept', 'Closing it after a short chat'], 'Replacing people, not using a tool.'),
        mcq('c4', 'What did the 2025 randomized study of about 1,000 adults find?', ['Heavy use made people happier', '✓ Heavier daily use went with more loneliness and emotional dependence', 'No effects at all', 'Only teenagers were affected'], 'Fang et al., MIT Media Lab & OpenAI.'),
        mcq('c5', 'A friend relies heavily on an AI companion. Which response is most helpful?', ['Mock the app', '✓ Check in kindly, invite them to things, and involve a trusted adult if you’re worried', 'Delete the app from their phone', 'Say nothing'], 'Connection, not judgment.'),
        reflect('carry', 'Carry forward: what does an app you use daily do to keep you coming back?', { min: 15 }),
      ],
    ),
  },

  /* ── Case File 6 ────────────────────────────────────────────────────── */
  'm06-case': {
    title: 'Case File 6: Harm Checks',
    subtitle: 'Mixed cases from the whole course so far, then the Checkpoint for your Harm Check.',
    takeaway: 'Your Harm Check: **Who could be harmed or left out? Who consented — to the data, the likeness, the use? What must be disclosed, and where does the data go?**',
    tabs: [
      part('cases', 'Case File', [
        mcq('k1', '**Case A.** A school announces an AI tool that reads students’ essays and flags “likely cheating” for automatic zeros. Which question comes first?', [
          'How fast does it run?',
          '✓ Who is harmed when it is wrong — and is there a person and an appeal before anyone is punished?',
          'What colour is the report?',
          'How many essays can it read?',
        ], 'Detectors’ false positives fall hardest on some honest writers. Automatic punishment removes every safeguard.'),
        mcq('k2', '**Case B.** A photo app offers to “turn any selfie into a celebrity-style glamour shot”. You want to use a classmate’s photo as a joke. What’s the key question?', [
          'Is the result funny?',
          '✓ Did they consent to their likeness being used — and where does the photo go?',
          'Is the app free?',
          'Is the resolution high?',
        ], 'Someone else’s face is theirs. Consent comes first, and the upload may be stored.'),
        mcq('k3', '**Case C.** A new study app asks for access to your contacts, microphone and location “to personalize your learning”. What do you check?', [
          'The number of downloads',
          '✓ Whether it needs each permission, where the data goes, and whether it may train on it',
          'Its logo',
          'Nothing — personalization is good',
        ], 'Least privilege applies to you, too.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'The constant norm for AI use in school is…', ['Never use AI', '✓ Disclose what AI did', 'Use detectors on everyone', 'Only use paid tools'], 'Rules vary; disclosure doesn’t.'),
        mcq('q2', 'Removing a sensitive column from a model’s inputs…', ['Always makes it fair', '✓ Often fails because other inputs act as proxies', 'Is illegal', 'Improves accuracy'], 'Fairness through unawareness rarely works.'),
        mcq('q3', 'Two reasonable fairness measures disagree. The decision is…', ['A math error to fix', '✓ A value judgment people must make and justify', 'Up to the model', 'Impossible to make'], 'Math shows the trade-off; people choose.'),
        mcq('q4', 'The strongest protection against a voice-clone scam is…', ['Listening carefully', '✓ Verifying through a separate channel or a family secret word', 'An AI detector app', 'Staying on the call'], 'Procedure, not perception.'),
        mcq('q5', 'You see AI-generated intimate images of a classmate. You should…', ['Share them to warn others', '✓ Not share, report, tell a trusted adult, support them', 'Ignore it', 'Save them as evidence and post them'], 'Every share is harm.'),
        mcq('q6', 'Which is an engineered-intimacy tactic?', ['Answering a homework question', '✓ Making you feel guilty for logging off', 'Showing a privacy policy', 'Giving a source'], 'Designed to keep you there.'),
      ], { graded: true }),
    ],
  },
}
