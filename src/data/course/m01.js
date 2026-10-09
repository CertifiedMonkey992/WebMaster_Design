/* ═══════════════════════════════════════════════════════════════════════════
   Module 1 — How Machines Learn (Experimenter)
   Where does an AI system's behaviour come from?

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, mcq, sort, number, sim } from './helpers'

export default {
  /* ── 1.1 Spot the AI: Rules, Learning and What It Optimizes ─────────── */
  'm01-l01': {
    title: 'Spot the AI: Rules, Learning and What It Optimizes',
    subtitle: 'How “smart” software is built, and why a learned system chases a number instead of what you meant.',
    takeaway: 'Every learned system chases an **objective** through something it can **measure** — and it will chase the measure, not what you meant.',
    tabs: lessonParts(
      [
        read('ways', 'Three ways to build “smart” software', [
          'Some software follows **rules** a person wrote: *if a message contains “winner”, block it.* Predictable, but blind to anything nobody thought of.',
          'Some software is **learned**: it studies thousands of labelled examples and finds the patterns itself. Real spam filters and face unlock work this way.',
          'A **generative** system is a learned system that makes something new — an answer, an essay, an image.',
        ]),
        sort('a-sort', 'How was each one built?', [['rules', 'Rules'], ['learned', 'Learned'], ['generative', 'Generative']], [
          ['A calculator app', 'rules', 'Every step was written by a programmer.'],
          ['Face unlock on a phone', 'learned', 'Trained on many images of faces.'],
          ['A chatbot that writes a poem', 'generative', 'It produces new text.'],
          ['A thermostat that heats below 19°C', 'rules', 'One threshold, set by a person.'],
        ], 'Rules are written; learned systems are trained; generative systems are learned systems that make new content.'),
        read('objective', 'A learned system chases a number', [
          'A learned system is trained toward an **objective** — what its builders want. But a computer can only chase what it can **measure**, so it uses a stand-in number called a **proxy**.',
          'A video feed can’t measure “enjoyment”, so it measures *seconds watched*. Whatever keeps you watching gets shown more.',
        ]),
        sim('s-feed', 'feed-loop', {
          title: 'Watch a feed learn from you',
          task: 'Run the feed with **Watch time**, then switch to another objective and compare.',
          goal: 'two-objectives', props: { goal: 'two-objectives' },
          hint: 'Try two objectives to continue.',
          after: 'Same viewer, same videos, different feed. The **objective** decided what the feed became.',
        }),
        read('gaming', 'When the number and the goal come apart', [
          'Push hard on a proxy and a system may game it. In 2016 an AI rewarded for points in a boat-racing game learned to circle forever hitting the same targets — top score, race never finished.',
          'This is called **specification gaming**. A feed has the same problem: more watch time is not the same as a better feed.',
        ], { source: 'OpenAI, “Faulty reward functions in the wild” (2016).' }),
        mcq('a-proxy', 'A homework app is judged by “minutes students spend in the app”. What is the risk?', [
          'None — more minutes means more learning',
          '✓ It gets rewarded for keeping students busy, not for helping them learn',
          'Students will finish homework too quickly',
          'It will stop working after a few weeks',
        ], 'Minutes are a proxy for learning. An app chasing minutes is rewarded for being slow or distracting.'),
      ],
      [
        mcq('c1', 'A smart speaker turns on the lights at 7:00 every morning because you set it to. How was that behaviour built?', ['✓ A rule someone set', 'Learned from examples', 'Generative', 'Specification gaming'], 'A fixed time you chose is a rule. Nothing was learned.'),
        mcq('c2', 'A music app wants you to enjoy it, but it can only record what you do. Which of these is a **proxy** it might optimize?', ['Your happiness', '✓ How many songs you play to the end', 'The quality of the music', 'What you tell your friends'], 'Plays-to-the-end is measurable; enjoyment is not.'),
        mcq('c3', 'Why can a feed become more extreme over time even if you never searched for extreme content?', [
          'The company sets it to be extreme',
          '✓ Lingering on a few extreme clips makes it show more, which gives you more to linger on',
          'Extreme content is the only content that exists',
          'Feeds are random',
        ], 'Your behaviour trains it, and what it shows shapes your behaviour — a feedback loop.'),
        mcq('c4', 'A cleaning robot is rewarded for “no mess visible to its camera”. It learns to turn its camera away from messes. What is this called?', ['A bug in the camera', '✓ Specification gaming', 'Overfitting', 'A feedback loop'], 'It maximized the measure (no visible mess) instead of the intent (a clean room).'),
        mcq('c5', 'Which of these is **generative**?', ['Face unlock', '✓ An app that draws a picture from a sentence', 'A calculator', 'A thermostat'], 'It makes something new — an image.'),
      ],
    ),
  },

  /* ── 1.2 Train It, Break It ─────────────────────────────────────────── */
  'm01-l02': {
    title: 'Train It, Break It',
    subtitle: 'Train a real classifier in your browser and find out what it actually learned.',
    takeaway: 'A model learns **whatever separates the labels in its data** — including things you never meant to teach it. Bias starts here.',
    tabs: lessonParts(
      [
        read('supervised', 'Learning from labelled examples', [
          'Show a program photos labelled *wolf* or *husky* and it adjusts itself until its guesses match the labels. This is **supervised learning**.',
          'Each photo here is described by six features, such as the background and ear shape. The model learns one **weight** per feature: how strongly that feature points to *wolf* or *husky*.',
        ]),
        predict('p-learn', 'In the training photos, **every wolf is on snow and every husky is on grass**. What will the model mostly learn to look at?', [
          'Eye colour and snout, like a person would',
          '✓ The snowy background',
          'Nothing — it needs more photos',
          'A mix of everything, equally',
        ], 'The background separates the labels perfectly, so the model leans on it. Researchers built this exact classifier in 2016 and showed it was really a snow detector.', { source: 'Ribeiro, Singh & Guestrin (2016), “Why should I trust you?”' }),
        sim('s-train', 'classifier', {
          title: 'Train it',
          task: 'Press **Train the model**, then look at its weights and at the new photos.',
          goal: 'train', props: { goal: 'train' },
          hint: 'Train the model to continue.',
          after: 'It called every snowy photo a wolf. “Snowy background” got the biggest weight — a **shortcut**: something that matched the labels but has nothing to do with what a wolf is.',
        }),
        read('four', 'Four ways data breaks a model', [
          'When a model fails, look at its data first.',
        ], {
          list: [
            { term: 'Shortcut', text: 'Something irrelevant lines up with the labels, like the snow.' },
            { term: 'Gap', text: 'Part of the world is missing. A skin model trained mostly on light skin works worse on dark skin.' },
            { term: 'Noisy labels', text: 'Some examples are labelled wrong, so the model learns wrong lessons.' },
            { term: 'Poisoning', text: 'Someone adds bad examples on purpose to make the model misbehave.' },
          ],
          takeaway: 'This is where **bias** starts: not with a programmer’s intent, but with what the data contains and leaves out.',
        }),
        read('fix', 'Fix the data, not the code', [
          'More photos of wolves on snow would only teach the same shortcut. What works is **counter-examples**: huskies on snow and wolves on grass. Retrain, and the snow weight drops toward zero.',
        ]),
        mcq('a-ruler', 'Photos of skin cancer in a training set often had a ruler beside them, because doctors measure suspicious spots. What problem is that?', ['A gap', '✓ A shortcut', 'Poisoning', 'Noisy labels'], 'The ruler lines up with the label, so the model may learn “ruler means cancer”.'),
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
          '✓ No — more of the same data teaches the same shortcut',
          'Yes, if the photos are higher resolution',
          'No — classifiers cannot be fixed',
        ], 'Only examples that break the pattern remove the shortcut.'),
        mcq('c3', 'Amazon scrapped an experimental hiring model in 2018 after it learned to downgrade résumés containing the word “women’s”. Where did that bias most likely come from?', [
          'A programmer wrote a rule against women',
          '✓ Its training data: years of past hiring decisions that favoured men',
          'The model was hacked',
          'Random chance',
        ], 'It learned the pattern in its examples. Nobody had to intend the bias.'),
        mcq('c4', 'What is **data poisoning**?', ['Data that is out of date', 'A dataset with too few examples', '✓ Deliberately adding examples so the model learns something harmful', 'A model that is too large'], 'Poisoning is intentional.'),
        mcq('c5', 'You repaired the dataset. What is the honest way to show the fix worked?', [
          'Show it gets the training photos right',
          '✓ Test it on new photos, including huskies on snow and wolves on grass',
          'Show its weights',
          'Ask a friend whether it looks better',
        ], 'Only new cases — especially the hard ones — show whether it learned the real pattern.'),
      ],
    ),
  },

  /* ── 1.3 Is It Actually Good? ───────────────────────────────────────── */
  'm01-l03': {
    title: 'Is It Actually Good?',
    subtitle: 'Why a model must be tested on new data, and why “99% accurate” can describe something useless.',
    takeaway: 'An accuracy figure means nothing until you know **what it was tested on** and **which mistakes it makes**.',
    tabs: lessonParts(
      [
        read('heldout', 'Test on data it never saw', [
          'A model can memorize its training data. So a score only means something on a **held-out test set**: data kept aside during training.',
          'If the training score is much higher than the test score, the model has **overfit** — it learned the noise in its examples instead of the pattern.',
        ]),
        predict('p-99', 'A cheating detector is “**99% accurate**”. Only 1 in 100 essays is actually AI-written. Could the detector be useless?', [
          'No — 99% is excellent',
          '✓ Yes — a detector that always says “not AI” would also be 99% accurate',
          'Only if the essays are short',
          'No detector can reach 99%',
        ], 'If 99 of every 100 essays are honest, answering “honest” every time is right 99% of the time — and catches no one.'),
        sim('s-always-no', 'threshold', {
          title: 'The accuracy trap',
          task: 'Look at the detector’s numbers, then press **Model that always says “no”**.',
          goal: 'always-no', props: { goal: 'always-no', scenario: 'cheating' },
          hint: 'Press “Model that always says no” to continue.',
          after: 'High accuracy, zero cheaters caught. Accuracy hides **which** mistakes a model makes.',
        }),
        read('two-mistakes', 'Two kinds of mistakes', [
          'A **false positive** says yes when the truth is no — an honest essay flagged. A **false negative** says no when the truth is yes — a cheater missed.',
          'A **threshold** turns a model’s score into yes or no. Lower it and you catch more real cases but raise more false alarms. You choose which mistake to accept.',
          '**Recall**: of the real yeses, how many did it catch? **Precision**: when it says yes, how often is it right?',
        ]),
        mcq('a-cancer', 'For a **cancer screen**, which mistake is worse, and which way should the threshold move?', [
          '✓ A missed cancer is worse, so lower the threshold and accept more false alarms',
          'A false alarm is worse, so raise the threshold',
          'Both are equally bad, so leave it at 0.5',
          'Thresholds don’t matter for medical tests',
        ], 'A false alarm means a follow-up test; a missed cancer can cost a life.'),
      ],
      [
        mcq('c1', 'A startup says its skin-condition app is “97% accurate — tested on the photos we trained it on”. What’s wrong?', [
          'Nothing, 97% is high',
          '✓ Training data can be memorized; only data it never saw shows real performance',
          '97% is too low for medicine',
          'Photos cannot be used to test apps',
        ], 'Always ask what a score was measured on.'),
        mcq('c2', 'At your school, wrongly accusing an honest student of cheating is very serious. What should happen to the detector’s threshold?', [
          '✓ Raise it, so fewer honest students are flagged — accepting that more cheating is missed',
          'Lower it, to catch every cheater',
          'Remove it',
          'It makes no difference',
        ], 'When a false positive is the worse mistake, the threshold goes up.'),
        number('c3', '**1,000** essays; **3%** were written by AI. The detector wrongly flags **5%** of honest essays. How many **honest** students get flagged?', 49, { tolerance: 1, unit: 'students', why: '970 essays are honest; 5% of 970 is 48.5 — about 49 honest students flagged, more than the 30 real cases.' }),
        mcq('c4', 'A detector catches 90 of the 100 real cases. What is its **recall**?', ['60%', '✓ 90%', '150%', '10%'], 'Recall is the share of real cases caught: 90 of 100.'),
        mcq('c5', 'A model scores 100% on training data and 71% on held-out data. What happened?', ['It is working perfectly', '✓ It overfit — it memorized the training data', 'The test data was wrong', 'It underfit'], 'A big gap between training and test scores is the sign of overfitting.'),
      ],
    ),
  },

  /* ── Case File 1 ────────────────────────────────────────────────────── */
  'm01-case': {
    title: 'Case File 1: Objectives and Data',
    subtitle: 'Three real-world situations, then the module Checkpoint.',
    takeaway: 'Your first Field Kit tool: **What is it optimizing? What data taught it? How was it tested, and which mistakes does it make?**',
    tabs: [
      part('cases', 'Cases', [
        mcq('k1', '**Case A.** Your school pilots “FocusBoost”, which scores students’ attention from their webcam. It was trained on videos of 200 adult office workers. Which question matters most?', [
          'What is it optimizing?',
          '✓ What data taught it — and who is missing from that data?',
          'Is it generative?',
          'How fast does it run?',
        ], 'Teenagers in classrooms are not in its training data, so its scores for students are guesses.'),
        mcq('k2', '**Case B.** Your music app has played the same three artists for a month, though you used to like variety. Which question explains it best?', [
          '✓ What is it optimizing — and is there a feedback loop?',
          'Was it tested on held-out data?',
          'Is its training data poisoned?',
          'Is it a rule-based system?',
        ], 'Chasing completed plays, it learned you finish those songs, so it plays more of them.'),
        mcq('k3', '**Case C.** A company says its essay grader “agrees with teachers 95% of the time”. What do you ask?', [
          'What colour is the interface?',
          '✓ Tested on which essays — and when it disagrees, which way is it wrong, and for whom?',
          'Is it cheaper than a teacher?',
          'Nothing — 95% settles it',
        ], 'The mistakes that matter are unfair low grades, and whether they fall more on some students.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'Which system was **learned from examples**?', ['A traffic light on a fixed timer', '✓ A phone keyboard that predicts your next word from millions of typed sentences', 'A calculator', 'A light switch'], 'Next-word prediction is learned from text.'),
        mcq('q2', 'A news app measures success by clicks. What is the likely side effect?', ['More accurate news', '✓ Headlines written to be clicked rather than to inform', 'Fewer ads', 'Nothing'], 'Optimize the proxy and you get clickbait.'),
        mcq('q3', 'A stop-sign model was trained only on photos taken on sunny days. What is this?', ['Poisoning', '✓ A gap in the data', 'Noisy labels', 'Specification gaming'], 'Rain, snow and night are missing.'),
        mcq('q4', 'Training accuracy 99%, test accuracy 64%. What should you conclude?', ['The test set is broken', '✓ The model memorized its training data', 'The model is excellent', 'The threshold is too high'], 'The gap is overfitting.'),
        mcq('q5', 'Only 1% of cases are real. A detector says “no” to everything. Its accuracy is…', ['1%', '50%', '✓ 99%', '0%'], 'Right about the 99%, useless for the 1%.'),
        mcq('q6', 'Which fix removes a shortcut from a model?', ['Train it longer', 'Add more of the same data', '✓ Add examples where the shortcut and the label disagree', 'Raise the threshold'], 'Counter-examples break the false pattern.'),
      ], { graded: true }),
    ],
  },
}
