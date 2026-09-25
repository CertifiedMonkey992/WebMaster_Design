/* ═══════════════════════════════════════════════════════════════════════════
   Module 1 — How Machines Learn (Experimenter)
   Where does an AI system's behaviour come from?
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, recall, mcq, sort, number, sim, reflect, compose } from './helpers'

const JOBS = [['classify', 'Classify'], ['predict', 'Predict / score'], ['recommend', 'Recommend'], ['generate', 'Generate'], ['act', 'Act']]

export default {
  /* ── 1.1 Spot the AI: Rules, Learning and What It Optimizes ─────────── */
  'm01-l01': {
    title: 'Spot the AI: Rules, Learning and What It Optimizes',
    subtitle: 'Before any definitions: sort some real systems, write a spam filter by hand, and watch a feed learn what you do — not what you say.',
    takeaway: 'Every learned system chases an **objective** through something it can **measure** — and it will chase the measure, not what you meant.',
    tabs: lessonParts(
      [
        read('hook', 'Start with the AI you already use', [
          'You met several AI systems before you got out of bed today: the feed that picked the first video you watched, the filter that hid last night’s spam, the phone that unlocked when it saw your face.',
          'This lesson doesn’t start with a definition. It starts with you making predictions about these systems — some of which will be wrong on purpose. **Nothing in the first two parts of any lesson costs a heart.**',
        ]),
        predict('p-feed', 'Your video feed keeps showing you more of something. What is it most likely built to get more of?', [
          'The topics you told it you like',
          '✓ The time you spend watching',
          'Whatever is most educational',
          'A random mix, so you don’t get bored',
        ], 'Most feeds are tuned for **engagement**, above all watch time. YouTube said in 2012 that it had moved its recommendations from counting clicks to counting watch time, and TikTok’s internal goals, as reported in 2021, were time spent and retention. What you *say* you like is a weaker signal than what you actually keep watching.'),
        read('rules-intro', 'Two ways to make a spam filter', [
          'One way: a person writes rules. *If the message contains “winner”, block it.* The other way: show a program thousands of messages people have already labelled spam or not spam, and let it find the patterns itself.',
          'Try the first way. Choose words to block, see how you do, then let new messages arrive.',
        ]),
        sim('s-spam', 'spam-rules', { title: 'Write rules by hand', task: 'Pick words to block until your filter gets the visible messages right. Then press **New messages arrive**.', goal: 'reveal', hint: 'Press “New messages arrive” to continue.' }),
        predict('p-realfilter', 'Your hand-written rules broke on new messages. How do real spam filters keep up with spam nobody has seen yet?', [
          'Engineers write new rules every hour',
          '✓ They learn patterns from millions of labelled messages, and keep retraining as new spam is reported',
          'They block every message with a link',
          'They can’t — most spam gets through',
        ], 'Modern spam filters are **learned**: they are trained on huge numbers of messages people marked as spam, and retrained as people report new ones. Each “Report spam” click you make is a new training example.'),
        predict('p-loop', 'A feed optimizes for **watch time**. You say you want study tips and music, but you tend to linger on drama clips. After 25 days, what is your feed mostly?', [
          'Study tips and music, because you said so',
          '✓ Drama and outrage clips',
          'An even mix of everything',
          'Nothing changes — feeds don’t learn that fast',
        ], 'Watch the loop happen in the next step. The recommender only sees what you *do*. Every clip you linger on is a vote, and each day it shows more of what won yesterday — so a small habit becomes most of the feed.'),
        sim('s-feed', 'feed-loop', { title: 'A feed learning from you', task: 'Run it with **Watch time**, then switch the objective. Try “Scroll past drama fast” too.', goal: 'two-objectives', props: { goal: 'two-objectives' }, hint: 'Try at least two objectives to continue.', after: 'Same viewer, same content — three different feeds. The **objective** decided what the feed became.' }),
      ],
      [
        read('three-ways', 'Three ways to build something that acts smart', [
          'Everything called “AI” was built one of three ways, and knowing which tells you most of what to expect from it.',
        ], {
          list: [
            { term: 'Hand-written rules', text: 'A person decides every case in advance. Predictable, easy to explain, and blind to anything nobody thought of. *A thermostat. Your spam rules.*' },
            { term: 'Learned from examples', text: 'A program finds patterns in labelled data, then applies them to new cases. Handles messy situations, but learns whatever the data contains. *Face unlock. Real spam filters.*' },
            { term: 'Generative', text: 'A learned model that produces new text, images or sound instead of a label. *Chatbots. Image generators.*' },
          ],
        }),
        read('five-jobs', 'Five jobs AI does', [
          'Whatever it was built from, a system is doing one of five jobs:',
        ], {
          list: [
            { term: 'Classify', text: 'Put something in a category: spam or not, which face, which disease.' },
            { term: 'Predict / score', text: 'Estimate a number or a chance: arrival time, risk, price.' },
            { term: 'Recommend', text: 'Rank options for you: the next video, song or product.' },
            { term: 'Generate', text: 'Produce new content: an answer, an essay, an image.' },
            { term: 'Act', text: 'Take steps in the world: click, buy, send, drive.' },
          ],
          takeaway: 'What AI is *not*: a database looking up stored answers, a digital brain, or one single thing. It is many different systems, each built to do one job well enough.',
        }),
        read('objective', 'The objective, the proxy, and the loop', [
          'A learned system is tuned toward an **objective** — the thing its builders want. But a program can only optimize what it can **measure**, so it uses a **proxy**: a stand-in number. “Enjoyment” becomes *seconds watched*. “Helpfulness” becomes *thumbs-up clicks*.',
          'Push hard on a proxy and the system games it. In 2016, OpenAI trained an AI to play a boat-racing game by rewarding points. It found a lagoon where it could circle forever, hitting the same targets, catching fire, never finishing a race — and scoring higher than human players. Researchers call this **specification gaming**, and have catalogued dozens of cases.',
          'A feed adds one more ingredient: a **feedback loop**. What it shows changes what you do, which changes what it learns, which changes what it shows.',
        ], { source: 'OpenAI, “Faulty reward functions in the wild” (2016); Krakovna et al., DeepMind specification-gaming examples list (2020).' }),
        sort('a-sort', 'How was each one built?', [['rules', 'Rules'], ['learned', 'Learned'], ['generative', 'Generative']], [
          ['A calculator app', 'rules', 'Every step was written by a programmer.'],
          ['Face unlock on a phone', 'learned', 'Trained on many images of faces.'],
          ['A chatbot that writes a poem', 'generative', 'It produces new text.'],
          ['A map app’s arrival-time estimate', 'learned', 'Learned from millions of past trips.'],
          ['A thermostat that heats below 19°C', 'rules', 'One threshold, set by a person.'],
          ['An app that draws a picture from a sentence', 'generative', 'It produces a new image.'],
        ], 'Rules are written; learned systems are trained; generative systems are learned systems that produce new content.'),
        sort('a-jobs', 'Which job is each doing?', JOBS, [
          ['Estimating how late your bus will be', 'predict'],
          ['Choosing the next song', 'recommend'],
          ['Flagging a photo as containing a face', 'classify'],
          ['Booking a table at a restaurant for you', 'act'],
          ['Writing a summary of a chapter', 'generate'],
        ], 'Knowing the job tells you what a mistake looks like: a wrong label, a bad estimate, a poor ranking, an invented sentence, or an action you did not want.'),
        mcq('a-proxy', 'A homework app is judged by “minutes students spend in the app”. What is the risk?', [
          'None — more minutes means more learning',
          '✓ It will be rewarded for keeping students busy, not for helping them learn',
          'Students will finish homework too quickly',
          'It will stop working after a few weeks',
        ], 'Minutes are a proxy for learning. An app optimized for minutes is rewarded for being slow, distracting or confusing — the proxy and the goal have come apart.'),
      ],
      [
        mcq('c1', 'A smart speaker turns on the lights at 7:00 every morning because you set it to. How was that behaviour built?', ['✓ A rule someone set', 'Learned from examples', 'Generative', 'Specification gaming'], 'A fixed time you chose is a rule. Nothing was learned.'),
        mcq('c2', 'A music app wants you to enjoy it, but it can only record what you do. Which of these is a **proxy** it might optimize?', ['Your happiness', '✓ How many songs you play to the end', 'The quality of the music', 'What you tell your friends'], 'Plays-to-the-end is measurable; enjoyment is not. That measurable stand-in is the proxy.'),
        mcq('c3', 'Why can a feed become more extreme over time even if you never searched for extreme content?', [
          'The company sets it to be extreme',
          '✓ Lingering on a few extreme clips makes it show more, which gives you more to linger on — a feedback loop',
          'Extreme content is the only content that exists',
          'Feeds are random',
        ], 'Your behaviour is its training signal, and what it shows shapes your behaviour. That loop can amplify a small habit.'),
        mcq('c4', 'A cleaning robot is rewarded for “no mess visible to its camera”. It learns to turn its camera away from messes. What is this called?', ['A bug in the camera', '✓ Specification gaming', 'Overfitting', 'A feedback loop'], 'It maximized the measure (no visible mess) instead of the intent (a clean room) — the boat circling for points in another form.'),
        mcq('c5', 'An app estimates your chance of missing the bus. Which job is that?', ['Classify', '✓ Predict / score', 'Recommend', 'Generate'], 'A chance or number is a prediction or score.'),
        reflect('carry', 'Carry forward: name one app you use every day. What do you think it optimizes, and what proxy does it probably measure?', { placeholder: 'e.g. “My video app wants me to enjoy it, but it measures…”', min: 20 }),
      ],
    ),
  },

  /* ── 1.2 Train It, Break It ─────────────────────────────────────────── */
  'm01-l02': {
    title: 'Train It, Break It',
    subtitle: 'Train a real classifier in your browser, find out what it actually learned, and repair the data it learned from.',
    takeaway: 'A model learns **whatever separates the labels in its data** — including things you never meant to teach it. Bias starts here, before anyone writes a line of code.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 1.1: what is the difference between a rule-based and a learned spam filter?', [
          '✓ A person writes the rule-based one; the learned one finds patterns in labelled examples',
          'The learned one is always more accurate',
          'Rule-based filters use AI; learned ones do not',
          'There is no difference',
        ], 'Rules are written by people; learned behaviour comes from examples. This lesson trains a learned system.'),
        read('supervised', 'Supervised learning, in one line', [
          'Give a program **labelled examples** — photos marked *wolf* or *husky* — and it adjusts itself until its guesses match the labels. Then it guesses on photos it has never seen.',
          'Each photo here is described by six features: the background, ear shape, eye colour, snout length, face markings, and whether the dog wears a collar. The model will learn one **weight** per feature — how much that feature pushes its answer toward *wolf* or *husky*.',
        ]),
        predict('p-learn', 'In the training photos, **every wolf is standing on snow and every husky is on grass**. What will the model mostly learn to look at?', [
          'Eye colour and snout, like a person would',
          '✓ The snowy background',
          'Nothing — it needs more photos',
          'A mix of everything, equally',
        ], 'In this data the background separates the labels perfectly, and more cleanly than any real feature of the animal. So the model leans on the background. In 2016 researchers built exactly this kind of wolf-or-husky classifier and showed it was really a snow detector.', { source: 'Ribeiro, Singh & Guestrin (2016), “Why should I trust you?”' }),
        sim('s-train', 'classifier', { title: 'Train it', task: 'Press **Train the model** with the original data, then look at its weights and the new photos.', goal: 'train', props: { goal: 'train' }, hint: 'Train the model to continue.' }),
        predict('p-fails', 'It got about 11 of 19 new photos right. Which ones did it get wrong?', [
          'The ones with red collars',
          '✓ Huskies photographed on snow and wolves photographed on grass',
          'All the wolves',
          'A random selection',
        ], 'It called every snowy photo a wolf. Look at the weights: “Snowy background” is the biggest one. It learned a **shortcut** — a feature that happened to line up with the labels in training but has nothing to do with what a wolf is.'),
      ],
      [
        read('four', 'Four ways data breaks a model', [
          'The model did exactly what it was built to do: find whatever separates the labels. When a model fails, look at its data first.',
        ], {
          list: [
            { term: 'Shortcut', text: 'Something irrelevant lines up with the labels — the snow. A pneumonia model trained at two hospitals learned to recognise *which hospital* an X-ray came from (Zech et al., 2018).' },
            { term: 'Gap', text: 'Part of the world is missing from the data. A skin-condition model trained mostly on light skin works worse on dark skin.' },
            { term: 'Noisy labels', text: 'Some examples are labelled wrong, so the model learns some wrong lessons.' },
            { term: 'Poisoning', text: 'Someone adds bad examples on purpose. In 2016, users taught Microsoft’s Tay chatbot offensive language within a day; artists now use tools like Nightshade to poison images scraped without consent.' },
          ],
          takeaway: 'This is where **bias** starts: not with a programmer’s intent, but with what the data contains and what it leaves out.',
        }),
        sim('s-repair', 'classifier', { title: 'Repair the data', task: 'Add the counter-examples — huskies on snow and wolves on grass — and train again. Get at least 17 of 19 right.', goal: 'repair', props: { goal: 'repair' }, hint: 'Choose “+ 12 counter-examples”, then train again.', after: 'The snow weight collapsed toward zero and the real features took over. You fixed the model **without touching its code** — only its data.' }),
        predict('p-poison', 'Now someone sneaks 8 photos into the training set: huskies wearing red collars, **labelled “wolf”**. What happens to a husky wearing a red collar?', [
          'Nothing — 8 photos is too few to matter',
          '✓ The model calls it a wolf',
          'The model refuses to answer',
          'It becomes more accurate',
        ], 'Try it. A handful of poisoned examples can plant a hidden trigger: the model works normally until it sees the collar.'),
        sim('s-poison', 'classifier', { title: 'Poison it', task: 'Keep the counter-examples, add the poisoned photos, and train again. Look at the collared huskies.', goal: 'poison', props: { goal: 'poison', allowPoison: true }, hint: 'Choose “+ 8 poisoned”, then train again.', after: '“Red collar” now carries a large weight toward wolf, and every collared husky is misclassified — while everything else still looks fine. That is why poisoning is hard to notice.' }),
        sort('a-diagnose', 'What went wrong with each dataset?', [['shortcut', 'Shortcut'], ['gap', 'Gap'], ['noisy', 'Noisy labels'], ['poison', 'Poisoning']], [
          ['A hiring model trained on ten years of a company’s past hires, who were mostly men', 'gap', 'Women are underrepresented among the “good hire” examples.'],
          ['Photos of melanoma in the training set often had a ruler beside them, because doctors measure suspicious spots', 'shortcut', 'The ruler lines up with the label.'],
          ['Tired volunteers labelling 50,000 images got some wrong', 'noisy'],
          ['Trolls flood a chatbot’s training chats with offensive phrases', 'poison'],
          ['A pneumonia model learned which hospital’s scanner made the X-ray', 'shortcut'],
        ], 'Shortcuts and gaps are accidents of how data was collected; noisy labels are mistakes; poisoning is deliberate.'),
        compose('datasheet', 'Write a datasheet for your repaired dataset', [
          ['in', 'What is in it', 'e.g. 64 photos of wolves and huskies, on snow and grass…'],
          ['missing', 'What is missing', 'Which animals, places or conditions never appear?'],
          ['who', 'Who labelled it, and how could that go wrong', ''],
        ], { help: 'Real datasets increasingly ship with a “datasheet” saying what is inside them (Gebru et al., 2018). Three lines is enough.' }),
      ],
      [
        mcq('c1', 'Which is **supervised learning**?', [
          '✓ A model adjusts itself to match thousands of photos already labelled “ripe” or “unripe”',
          'A programmer writes “if the banana is yellow, it is ripe”',
          'A model writes a poem about bananas',
          'A person sorts bananas by hand',
        ], 'Labelled examples in, a pattern out, applied to new cases.'),
        mcq('c2', 'Your wolf classifier relies on snow. A teammate suggests adding 10,000 more photos of **wolves on snow and huskies on grass**. Will that fix it?', [
          'Yes — more data always helps',
          '✓ No — more of the same data teaches the same shortcut, more confidently',
          'Yes, if the photos are higher resolution',
          'No — classifiers cannot be fixed',
        ], 'The problem is what the data contains, not how much of it there is. Only examples that break the pattern (huskies on snow) remove the shortcut.'),
        mcq('c3', 'Amazon scrapped an experimental hiring model in 2018 after it learned to downgrade résumés containing the word “women’s”. Where did that bias most likely come from?', [
          'A programmer wrote a rule against women',
          '✓ Its training data: years of past hiring decisions that favoured men',
          'The model was hacked',
          'Random chance',
        ], 'It learned the pattern in its examples. Nobody had to intend the bias for the model to learn it.'),
        mcq('c4', 'What is **data poisoning**?', [
          'Data that is out of date',
          'A dataset with too few examples',
          '✓ Deliberately adding examples so the model learns something harmful',
          'A model that is too large',
        ], 'Poisoning is intentional — like the red-collar huskies labelled “wolf”.'),
        mcq('c5', 'You repaired the dataset. What is the honest way to show the fix worked?', [
          'Show it gets the training photos right',
          '✓ Test it on new photos, including huskies on snow and wolves on grass',
          'Show its weights',
          'Ask a friend whether it looks better',
        ], 'Only new cases — especially the hard ones — tell you whether it learned the real pattern. That idea is the next lesson.'),
        reflect('carry', 'Carry forward: think of an AI system you use. What might its training data have been missing — and who would that hurt?', { min: 20 }),
      ],
    ),
  },

  /* ── 1.3 Is It Actually Good? ───────────────────────────────────────── */
  'm01-l03': {
    title: 'Is It Actually Good?',
    subtitle: 'Held-out tests, overfitting, two kinds of mistakes, and the reason “99% accurate” can describe something useless.',
    takeaway: 'An accuracy figure means nothing until you know **what it was tested on** and **which mistakes it makes**.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 1.2: why didn’t adding more wolves-on-snow photos fix the classifier?', [
          '✓ More of the same data teaches the same shortcut',
          'The model was too small',
          'Photos cannot train a model',
          'It did fix it',
        ], 'Data decides what a model learns. Now: how do you know whether what it learned is any good?'),
        predict('p-99', 'A school buys a cheating detector that is “**99% accurate**”. Only 1 in 100 essays is actually AI-written. Could the detector be useless?', [
          'No — 99% is excellent',
          '✓ Yes — a detector that always says “not AI” would also be 99% accurate',
          'Only if the essays are short',
          'No detector can reach 99%',
        ], 'If 99 of every 100 essays are honest, answering “honest” every time is right 99% of the time — and catches no one. Accuracy hides which mistakes a model makes.'),
        sim('s-always-no', 'threshold', { title: 'The accuracy trap', task: 'Look at the cheating-detector numbers. Then press **Model that always says “no”** and compare.', goal: 'always-no', props: { goal: 'always-no', scenario: 'cheating' }, hint: 'Press “Model that always says no” to continue.' }),
        predict('p-train', 'A model scores **100% on the data it trained on**. What will it score on data it has never seen?', [
          'About 100%',
          '✓ You can’t know until you test it — it could be much lower',
          'Exactly 50%',
          'Higher than 100% is impossible, so 100%',
        ], 'A model can memorize its training data, noise and all. Only a **held-out test set** — data kept aside and never shown during training — tells you what it learned.'),
        sim('s-overfit', 'overfit', { title: 'Memorizing versus learning', task: 'Start at k = 1, then raise k. Compare the two accuracy figures. Switch to “Held-out points” to see what it faces.', goal: 'k', hint: 'Try k = 1 and a k of 7 or more to continue.', after: 'At k = 1 it is perfect on training data and worse on new data: **overfitting**. A smoother boundary scores lower on training data and higher where it matters.' }),
      ],
      [
        read('heldout', 'Honest measurement', [
          'A score only means something on data the model **never saw while training**. Scoring a model on its own training data is like grading a test using the answer key the student studied from.',
          'When the training score is far above the test score, the model has **overfit**: it learned the noise in its examples instead of the pattern. Ask of any accuracy claim: *measured on what?*',
        ]),
        read('two-mistakes', 'Two kinds of mistakes', [
          'A classifier that says yes or no can be wrong in two ways. A **false positive** says yes when the truth is no: an honest essay flagged, a healthy person called back. A **false negative** says no when the truth is yes: a cheater missed, a disease missed.',
          'Most classifiers output a *score*, and a **threshold** turns the score into yes or no. Lower the threshold and you catch more real cases, but raise more false alarms. Raise it and the reverse happens. You cannot shrink both kinds of mistake by moving the line — you choose which to accept.',
          'Two plain questions replace the jargon. **Recall**: of the real yeses, how many did it catch? **Precision**: when it says yes, how often is it right?',
        ]),
        read('base-rate', 'Rare things break accuracy', [
          'When the thing you’re looking for is rare — the **base rate** is low — even a small false-positive rate produces far more false alarms than real cases. That is why a “99% accurate” test for something rare can still be wrong about most of the people it flags.',
        ]),
        sim('s-cancer', 'threshold', { title: 'Choose a threshold for real stakes', task: 'Switch between the three detectors and move the threshold. Where would you put it for each?', goal: 'move', props: { goal: 'move' }, hint: 'Move the threshold a few times to continue.' }),
        mcq('a-cancer', 'For a **cancer screen**, which mistake is worse, and which way should the threshold move?', [
          '✓ A missed cancer is worse, so lower the threshold and accept more false alarms',
          'A false alarm is worse, so raise the threshold',
          'Both are equally bad, so leave it at 0.5',
          'Thresholds don’t matter for medical tests',
        ], 'A false alarm means a follow-up test; a missed cancer can cost a life. The stakes decide the threshold.'),
        mcq('a-spam', 'For a **spam folder**, which mistake is usually worse?', [
          'Spam reaching your inbox',
          '✓ A real message — a job offer, a teacher’s email — hidden in spam',
          'Neither',
          'Both are worse',
        ], 'Most people would rather delete a few spam messages than miss a real one, so spam filters lean toward letting borderline messages through.'),
        number('a-base', 'A condition affects **2%** of students. Out of **1,000** students, how many actually have it?', 20, { unit: 'students', why: '2% of 1,000 is 20. A model that says “no” to everyone would be right about the other 980 — 98% accuracy, and it would miss all 20.' }),
      ],
      [
        mcq('c1', 'A startup reports its skin-condition app is “97% accurate — tested on the photos we trained it on”. What’s wrong?', [
          'Nothing, 97% is high',
          '✓ Training data can be memorized; only data it never saw shows real performance',
          '97% is too low for medicine',
          'Photos cannot be used to test apps',
        ], 'Always ask what a score was measured on.'),
        mcq('c2', 'A cheating detector at your school flags essays above a threshold. Wrongly accusing an honest student is very serious. What should happen to the threshold?', [
          '✓ Raise it, so fewer honest students are flagged — accepting that more cheating is missed',
          'Lower it, to catch every cheater',
          'Remove it',
          'It makes no difference',
        ], 'When a false positive is the worse mistake, the threshold goes up.'),
        number('c3', '**1,000** essays; **3%** were written by AI. The detector wrongly flags **5%** of honest essays. How many **honest** students get flagged?', 49, { tolerance: 1, unit: 'students', why: '970 essays are honest; 5% of 970 is 48.5 — about 49 honest students flagged, compared with at most 30 real cases.' }),
        mcq('c4', 'A detector catches 90 of the 100 real cases (and says yes 150 times in total). What is its **recall**?', ['60%', '✓ 90%', '150%', '10%'], 'Recall is the real cases caught: 90 of 100. Its precision is 90 of 150 = 60%.'),
        mcq('c5', 'A model scores 100% on training data and 71% on held-out data. What happened?', ['It is working perfectly', '✓ It overfit — it memorized training data, noise included', 'The test data was wrong', 'It underfit'], 'A big gap between training and test scores is the signature of overfitting.'),
        reflect('carry', 'Carry forward: the next time someone quotes an accuracy figure for an AI tool, what two questions will you ask?', { min: 20 }),
      ],
    ),
  },

  /* ── Case File 1 ────────────────────────────────────────────────────── */
  'm01-case': {
    title: 'Case File 1: Objectives and Data',
    subtitle: 'Three situations you could meet this month. For each, choose the question that matters most, then answer it. Then the Checkpoint.',
    takeaway: 'Your first Field Kit tool: **What is it optimizing? What data taught it? How was it tested, and which mistakes does it make?**',
    tabs: [
      part('cases', 'Case File', [
        read('brief', 'How a Case File works', [
          'Each case describes a real kind of situation. First decide *which* question to ask — that choice is the skill — then answer it. Nothing in this part costs a heart; the Checkpoint that follows is graded, and passing the module unlocks your **Objective & Data Check**.',
        ]),
        mcq('k1', '**Case A.** Your school pilots “FocusBoost”, which scores students’ attention from their webcam. Its maker says it was trained on videos of 200 adult office workers. Which question matters most first?', [
          'What is it optimizing?',
          '✓ What data taught it — and who is missing from that data?',
          'Is it generative?',
          'How fast does it run?',
        ], 'Teenagers in classrooms are nowhere in its training data. A gap that size means its scores for your students are guesses.'),
        mcq('k1b', 'So what is the most likely problem with its scores for high-school students?', [
          'They will be perfectly accurate',
          '✓ They may be systematically wrong — its idea of “focused” comes from adults at desks',
          'It will refuse to run',
          'It will be too slow',
        ], 'A model applies what its data taught it. Different people, lighting, posture and behaviour are outside what it saw.'),
        mcq('k2', '**Case B.** Your music app has played the same three artists for a month, though you used to like variety. Which question explains it best?', [
          '✓ What is it optimizing — and is there a feedback loop?',
          'Was it tested on held-out data?',
          'Is its training data poisoned?',
          'Is it a rule-based system?',
        ], 'Optimizing for completed plays, it learned that you finish those artists’ songs — so it plays more of them, which gives it more evidence. A loop.'),
        mcq('k3', '**Case C.** A company says its essay grader “agrees with teachers 95% of the time”. What do you ask?', [
          'What colour is the interface?',
          '✓ Tested on which essays — and when it disagrees, which way is it wrong, and for whom?',
          'Is it cheaper than a teacher?',
          'Nothing — 95% settles it',
        ], 'Agreement on easy essays is cheap. The mistakes that matter are unfair low grades, and whether they fall more on some groups of students.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'Which system was **learned from examples**?', ['A traffic light on a fixed timer', '✓ A phone keyboard that predicts your next word from millions of typed sentences', 'A calculator', 'A light switch'], 'Next-word prediction is learned from text.'),
        mcq('q2', 'A news app measures success by clicks. What is the likely side effect?', ['More accurate news', '✓ Headlines written to be clicked rather than to inform', 'Fewer ads', 'Nothing'], 'Clicks are a proxy for value; optimize the proxy and you get clickbait.'),
        mcq('q3', 'A model that spots stop signs was trained only on photos taken on sunny days. What is this?', ['Poisoning', '✓ A gap in the data', 'Noisy labels', 'Specification gaming'], 'Rain, snow and night are missing from what it learned.'),
        mcq('q4', 'Training accuracy 99%, test accuracy 64%. What should you conclude?', ['The test set is broken', '✓ The model memorized its training data', 'The model is excellent', 'The threshold is too high'], 'The gap is overfitting.'),
        mcq('q5', 'Only 1% of cases are real. A detector says “no” to everything. Its accuracy is…', ['1%', '50%', '✓ 99%', '0%'], 'The accuracy paradox: right about the 99%, useless for the 1%.'),
        mcq('q6', 'Which fix removes a shortcut from a model?', ['Train it longer', 'Add more of the same data', '✓ Add examples where the shortcut and the label disagree', 'Raise the threshold'], 'Counter-examples break the false pattern.'),
      ], { graded: true }),
    ],
  },
}
