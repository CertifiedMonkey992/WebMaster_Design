/* ═══════════════════════════════════════════════════════════════════════════
   Module 2 — Inside a Neural Network (Mechanic)
   What actually changes inside a model when it learns?
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, recall, mcq, sort, number, sim, reflect } from './helpers'

export default {
  /* ── 2.1 One Neuron, Then Layers ────────────────────────────────────── */
  'm02-l01': {
    title: 'One Neuron, Then Layers',
    subtitle: 'Tune a single artificial neuron by hand, meet the problem it cannot solve, and see why layers need a bend.',
    takeaway: 'A neuron is a **weighted vote**. One draws a straight line; layers with a nonlinear **bend** between them can draw any shape — and the weights are the “parameters” every model is counted in.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 1.2: the classifier learned one weight per feature. What did a big weight on “snowy background” mean?', [
          '✓ That feature pushed its answer strongly toward one label',
          'The feature was the easiest to see',
          'A programmer marked that feature as important',
          'The photo file was large',
        ], 'A weight is how much one input counts in the decision. A neuron is built from exactly this.'),
        read('neuron', 'An artificial neuron is a weighted vote', [
          'Take some inputs, multiply each by a **weight**, add them up, add a **bias**, and say yes if the total is above zero. That is a **perceptron** — the first artificial neuron, built by Frank Rosenblatt in 1958 — and it is still the building block of every neural network.',
          'The weights and biases are the model’s **parameters**. When you hear that a model has hundreds of billions of parameters, this is what is being counted: numbers like the three sliders below.',
        ]),
        sim('s-neuron', 'neuron', { title: 'Tune one neuron', task: 'With “Two groups”, move the sliders until at least **95%** of points are on the right side of the line.', goal: 'separate', props: { dataset: 'separable' }, hint: 'Tip: make w₁ negative and w₂ positive, then adjust the bias.', after: 'You did by hand what training does automatically: found weights that separate the data.' }),
        predict('p-xor', 'Now the **XOR** data: yes-points sit in two opposite corners, no-points in the other two. Can one neuron separate them?', [
          'Yes, with the right weights',
          '✓ No — no single straight line can split opposite corners',
          'Yes, if the bias is large enough',
          'Only with more data',
        ], 'One neuron can only draw one straight line, and no straight line puts two opposite corners on the same side. The best any line can do here is 75%. Try it.'),
        sim('s-xor', 'neuron', { title: 'Try XOR', task: 'Move the sliders as much as you like. Watch the score.', goal: 'xor', props: { dataset: 'xor', goal: 'xor' }, hint: 'Keep trying a few more settings.', after: 'Stuck at 75% or below. In 1969 this exact limit — shown by Minsky and Papert — helped stall neural-network research for years. The fix is more neurons, in layers.' }),
      ],
      [
        read('layers', 'Layers, and the bend between them', [
          'Put several neurons side by side in a **hidden layer**, and feed their outputs to another neuron. Each hidden neuron draws its own line; the next neuron combines them — so together they can fence off a region, like a circle or two corners.',
          'But there’s a catch. A weighted sum of weighted sums is still just a weighted sum: stack layers of plain neurons and the whole network collapses back into **one straight line**. Something has to bend the signal between layers. That is the job of an **activation function**.',
          'The most common one, **ReLU**, is almost insultingly simple: negative numbers become zero, positive numbers pass through. That one kink is enough.',
        ]),
        predict('p-act', 'A network has 8 hidden neurons but **no activation function**. Can it learn to separate points inside a circle from points outside?', [
          'Yes — 8 neurons is plenty',
          '✓ No — without a bend, 8 neurons still add up to one straight line',
          'Only with a tiny learning rate',
          'Only if it trains for a very long time',
        ], 'Train it and see. Then give it a bend.'),
        sim('s-act', 'network', { title: 'Switch the bend off, then on', task: 'Train with activation **None** until it stalls. Then choose **ReLU** or **tanh** and train again.', goal: 'activation', props: { controls: ['activation'], dataset: 'circle', hidden: 8, activation: 'none', lr: 2 }, hint: 'Train with “None” until it stalls (600 epochs), then switch to ReLU and reach 95%.', after: 'Same neurons, same data. The only difference was the bend — and it is the difference between a line and a shape.' }),
        predict('p-width', 'With a bend, how many hidden neurons does it take to fence in the circle?', [
          'One is enough',
          'Two',
          '✓ About four or more — each neuron adds one straight edge to the fence',
          'At least a hundred',
        ], 'Each hidden neuron contributes one edge. One or two edges cannot enclose anything; four or more can make a rough polygon around the circle.'),
        sim('s-width', 'network', { title: 'How wide does it need to be?', task: 'Start with 1 hidden neuron and train. Then try 2, then 4 or 8.', goal: 'solve', props: { controls: ['hidden'], dataset: 'circle', hidden: 1, activation: 'relu', lr: 2 }, hint: 'Reach 95% to continue — try more hidden neurons.' }),
        read('output', 'The last step turns scores into probabilities', [
          'The final neuron’s total can be any number. A last function squashes it into a probability between 0 and 1 — here, the chance a point is inside the circle.',
          'Keep this in mind: a language model ends the same way, turning scores for every possible next word into probabilities. In Lesson 3.1 you will turn a dial — *temperature* — that reshapes exactly that last step.',
        ]),
        mcq('a-params', 'A news story says a model has “a trillion parameters”. What are they?', [
          'Rules written by its engineers',
          '✓ The weights and biases it learned during training',
          'The number of users it has',
          'Facts stored in a database',
        ], 'Parameters are the numbers a model adjusts while training — the same kind as your three sliders, just a trillion of them.'),
      ],
      [
        number('c1', 'A neuron has inputs **2** and **3**, weights **1** and **−1**, and bias **0.5**. What is its total (before deciding yes or no)?', -0.5, { tolerance: 0.01, why: '2×1 + 3×(−1) + 0.5 = −0.5. Below zero, so the neuron says no.' }),
        mcq('c2', 'Why can’t a single neuron learn XOR?', [
          'It needs more training data',
          '✓ It can only draw one straight line, and no line separates opposite corners',
          'XOR is too random',
          'Its weights are too small',
        ], 'One neuron, one line. XOR needs at least two lines combined.'),
        mcq('c3', 'What happens if you remove the activation function from every layer of a deep network?', [
          'It trains faster and better',
          '✓ The whole network behaves like a single straight line, however many layers it has',
          'It stops producing outputs',
          'It becomes a generative model',
        ], 'Without a nonlinear bend, stacked layers collapse into one linear function.'),
        mcq('c4', 'What do hidden layers make possible?', [
          'Storing more facts',
          '✓ Combining simple features (lines) into complex ones (shapes, regions)',
          'Running without data',
          'Explaining the model’s answers',
        ], 'Each layer builds on the one before — the idea Lesson 2.3 follows all the way to faces and wheels.'),
        mcq('c5', 'Who decides the values of a trained network’s weights?', [
          'The programmers, one by one',
          '✓ The training process, adjusting them to reduce error on the data',
          'The users, as they chat',
          'They are random and never change',
        ], 'Nobody writes the weights. How training finds them is the next lesson.'),
        reflect('carry', 'Carry forward: explain to a friend, in two sentences, why stacking neurons needs an activation function.', { min: 30 }),
      ],
    ),
  },

  /* ── 2.2 Learning Downhill ──────────────────────────────────────────── */
  'm02-l02': {
    title: 'Learning Downhill',
    subtitle: 'Loss, gradient descent, the learning rate and backpropagation — train a network, break it with a bad step size, and compute one step of learning by hand.',
    takeaway: 'Learning is **walking downhill on error**: backpropagation passes the blame for a mistake back to every weight, and each weight takes a small step to reduce it — millions of times.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 2.1: what are a model’s parameters?', ['✓ Its learned weights and biases', 'Its training data', 'Its rules', 'Its users'], 'Today: how training finds their values.'),
        read('loss', 'Error, measured', [
          'Training starts with the weights set at random, so the network is wrong about almost everything. A number called the **loss** measures *how* wrong: big when the answers are far off, near zero when they’re right.',
          'Training is the search for weights that make the loss small. The network has thousands of weights, so it can’t try every combination. It needs a direction.',
        ]),
        predict('p-hiker', 'You’re lost on a mountain in thick fog and want to reach the valley. You can only feel the slope under your feet. What do you do?', [
          '✓ Take a small step in the steepest downhill direction, then feel again, and repeat',
          'Jump as far as you can in a random direction',
          'Stay still until the fog clears',
          'Walk uphill to get a better view',
        ], 'That is **gradient descent**. The “slope under your feet” is the gradient — how the loss changes if each weight moves a little. Step against it, repeat, and the loss goes down.'),
        predict('p-lr', 'The **learning rate** is the size of each step. What happens if it is very large?', [
          'The network learns faster and better',
          '✓ Each step overshoots the valley, so the loss bounces around or climbs',
          'Nothing changes',
          'The network stops immediately',
        ], 'Too big and you leap across the valley and land higher on the other side. Too small and you crawl. Find out in the network below.'),
        sim('s-lr', 'network', { title: 'Break it with the step size', task: 'Train with learning rate **40**. Then try **0.02**. Then find one that learns properly.', goal: 'learning-rate', props: { controls: ['lr'], dataset: 'xor', hidden: 4, activation: 'tanh', lr: 40 }, hint: 'See a bad learning rate fail, then reach 95% with a good one.', after: 'Same network, same data. The step size alone decided whether it learned in seconds, in hours, or never.' }),
      ],
      [
        read('gd', 'Gradient descent', [
          'For every weight, training asks: *if this weight went up a tiny bit, would the loss go up or down, and by how much?* That number is the weight’s **gradient**. Each weight then moves a little in the direction that lowers the loss: *new weight = old weight − learning rate × gradient*.',
          'One pass through all the training examples is an **epoch**. Real models take millions of these steps over enormous datasets — which is why training a large model can take months on thousands of specialised chips, and a great deal of electricity.',
        ]),
        read('bp', 'Backpropagation: the blame relay', [
          'With one weight, finding the gradient is easy. With billions, spread across many layers, you need **backpropagation**. It works backward from the mistake: the output is compared with the right answer, and the error is passed back through the network, layer by layer. Each weight receives its share of the blame — in proportion to how much it contributed to the wrong answer — and moves accordingly.',
          'Follow one full relay, with real numbers, below.',
        ]),
        sim('s-relay', 'blame-relay', { title: 'The blame relay, by the numbers', task: 'Step through: forward, error, blame for w₂, blame passed back to h, blame for w₁, update. Then go again and watch the loss fall.', goal: 'update', hint: 'Step all the way to the update to continue.' }),
        number('a-w2', 'In the relay’s first step, the output’s error (y − t) was **−1.5** and h was **1**. What was w₂’s share of the blame?', -1.5, { tolerance: 0.01, why: 'Blame for w₂ = (y − t) × h = −1.5 × 1 = −1.5.' }),
        mcq('a-dir', 'w₂’s blame is **negative**. Which way does gradient descent move w₂?', [
          '✓ Up — subtracting a negative blame increases it',
          'Down',
          'It stays the same',
          'It depends on the input',
        ], 'New w₂ = 1.5 − 0.1 × (−1.5) = 1.65. Negative blame means “this weight should grow to reduce the error.”'),
        read('inference', 'Training is not the same as using', [
          '**Training** is the long, expensive process you just watched, done by the model’s builders before release. **Using** the model — called *inference* — runs the finished network forward with its weights fixed.',
          'So when you chat with an assistant, your messages do not rewrite its weights as you type. Features called “memory” work differently: they store notes and paste them back into the conversation (Lesson 3.3). Whether your chats are later used to *train the next version* depends on the company and your settings (Lesson 6.3).',
        ]),
      ],
      [
        mcq('c1', 'What does a model’s **loss** measure?', ['Its speed', '✓ How wrong its answers are on the training examples', 'How many parameters it has', 'How much data it has seen'], 'Training is the search for weights with low loss.'),
        mcq('c2', 'A loss curve jumps up and down and never settles, ending higher than it started. What is the most likely cause?', ['Too little data', '✓ The learning rate is too large', 'Too many hidden neurons', 'No activation function'], 'Oversized steps overshoot the valley.'),
        mcq('c3', 'A loss curve falls, but so slowly it would take days to finish. What would you change?', ['Remove the activation', '✓ Raise the learning rate a little', 'Delete half the data', 'Nothing — that is normal for every model'], 'Tiny steps make slow progress.'),
        mcq('c4', 'What is **backpropagation** for?', [
          'Deleting wrong training examples',
          '✓ Working out how much each weight contributed to the error, so each can be adjusted',
          'Running the model backwards to generate data',
          'Storing the conversation history',
        ], 'It is the blame relay that makes training deep networks possible.'),
        mcq('c5', 'You tell a chatbot a fact about yourself. Did its weights just change to learn it?', [
          'Yes, instantly',
          '✓ No — its weights are fixed while you use it; any “memory” is stored notes added back into the conversation',
          'Yes, but only for important facts',
          'Only if you say “remember this”',
        ], 'Training and using are separate moments.'),
        reflect('carry', 'Carry forward: why does training a big model cost so much more than asking it one question?', { min: 25 }),
      ],
    ),
  },

  /* ── 2.3 What Networks See ──────────────────────────────────────────── */
  'm02-l03': {
    title: 'What Networks See',
    subtitle: 'Slide filters over a picture, see how layers build features nobody programmed, and fool an image model with a change you can barely see.',
    takeaway: 'An image network builds its own **features**, layer by layer. They are statistical, not human concepts — so a tiny, aimed change can fool it, and a shortcut can hide inside it.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 1.2: the wolf classifier relied on snow. What is that called?', ['Overfitting', '✓ A shortcut', 'Poisoning', 'A gap'], 'Today you look for where shortcuts live — inside the network.'),
        predict('p-first', 'An image network is never told what to look for. After training on millions of photos, what do the filters in its **first layer** end up detecting?', [
          'Whole objects, like cats and cars',
          '✓ Simple edges and patches of colour',
          'Random noise',
          'Exactly what its programmers chose',
        ], 'Early layers learn tiny local patterns — edges at different angles, spots of colour — because those are useful for everything. Later layers combine them. You’ll run a first-layer filter yourself next.'),
        read('conv', 'A filter slides over the picture', [
          'An image network — a **convolutional neural network (CNN)** — doesn’t look at a whole photo at once. It slides small filters across it: each filter is a 3×3 grid of weights, and at every position it outputs the weighted sum of the pixels underneath. Where the pattern matches, the output lights up.',
        ]),
        sim('s-conv', 'conv', { title: 'Slide a filter over a picture', task: 'Try the vertical-edge and horizontal-edge filters, then **Layer 2: corners**.', goal: 'kernels', props: { goal: 'kernels', layer2: true }, hint: 'Try at least two filters.', after: 'A second layer combining two edge maps finds corners — something neither filter finds alone. Stack enough layers and the features become eyes, wheels, faces.' }),
        predict('p-adv', 'Every pixel of a photo is nudged by at most **0.1** (on a scale of 0 to 1) — a change you can barely see. Could that flip what the model says?', [
          'No — the image looks the same',
          '✓ Yes, if every nudge is aimed in the direction the model is most sensitive to',
          'Only for blurry photos',
          'Only if the model is broken',
        ], 'Try it on a small model trained just now in your browser.'),
        sim('s-adv', 'adversarial', { title: 'Fool an image classifier', task: 'Raise the size of the **targeted nudge** until the model changes its answer. Then compare random noise of the same size.', goal: 'flip', hint: 'Raise the change until the model says 0.' }),
      ],
      [
        read('features', 'Features, built layer by layer', [
          'Researchers can visualize what a unit in a trained network responds to. In image networks, a pattern repeats: early layers respond to **edges and colours**, middle layers to **textures and simple shapes**, and late layers to **parts and objects** — fur, eyes, wheels, faces (Olah et al., 2017).',
          'Nobody programmed any of this. Training found whatever features reduced the loss. That is also where a shortcut hides: the wolf model’s late layers had learned “snowy texture” because snow separated the labels.',
        ], { source: 'Olah, Mordvintsev & Schubert, “Feature Visualization”, Distill (2017).' }),
        read('adversarial', 'Why aimed changes work', [
          'In 2015, Goodfellow and colleagues added noise too faint to see to a photo of a panda; a top image model became 99% sure it was a gibbon. In 2018, researchers put a few stickers on a stop sign and made a model read it as a speed-limit sign (Eykholt et al.).',
          'This happens because a network’s features are **statistical**: patterns of numbers that happened to work on its training data, not concepts like *panda* or *stop*. Push many pixels a little in exactly the direction its weights care about, and the small pushes add up. Random noise of the same size mostly cancels itself out.',
        ], { source: 'Goodfellow, Shlens & Szegedy (2015); Eykholt et al. (2018).' }),
        read('representation', 'The last layer is a description', [
          'Just before its final answer, an image network has turned the photo into a list of a few hundred numbers — a **representation**, or description, of what it saw. Photos that look alike *to the network* get similar lists.',
          'Hold on to this idea. In Lesson 3.2 the same trick turns **words** into lists of numbers, and “similar lists” becomes “similar meaning.”',
        ]),
        sort('a-layers', 'Where in a trained image network would you expect each feature?', [['early', 'Early layer'], ['middle', 'Middle layer'], ['late', 'Late layer']], [
          ['A vertical edge', 'early'],
          ['A striped or furry texture', 'middle'],
          ['A dog’s face', 'late'],
          ['A patch of one colour', 'early'],
          ['A car wheel', 'late'],
        ], 'Simple local patterns first; combinations of combinations later.'),
        mcq('a-sticker', 'Which is an **adversarial example**?', [
          'A blurry photo the model gets wrong',
          '✓ Small stickers placed on purpose so a model misreads a stop sign',
          'A photo of a new animal the model never saw',
          'A mislabelled training photo',
        ], 'Adversarial examples are crafted — aimed at the model’s weak spots.'),
      ],
      [
        mcq('c1', 'What does a convolution filter do?', [
          '✓ Slides over the image, outputting a weighted sum of each small patch — lighting up where its pattern appears',
          'Stores a copy of every training image',
          'Removes noise from photos',
          'Labels the whole image at once',
        ], 'A small grid of weights, applied everywhere.'),
        mcq('c2', 'Who decides which features an image network’s layers detect?', ['Its programmers', '✓ Training, based on what reduces the loss on its data', 'The camera', 'The users'], 'Features are learned, not written.'),
        mcq('c3', 'Why can a few stickers make a model misread a stop sign that people read easily?', [
          'The stickers hide the sign completely',
          '✓ Its features are statistical patterns, and the stickers are aimed at the ones it relies on',
          'The camera is broken',
          'Stop signs are rare in training data',
        ], 'The model does not see “a stop sign with stickers on it” — it sees numbers pushed where it is most sensitive.'),
        mcq('c4', 'What is a network’s **representation** of an image?', ['The image file', '✓ The list of numbers its later layers produce to describe the image', 'Its label', 'Its training data'], 'Similar representations mean “similar to the network” — the bridge to embeddings.'),
        mcq('c5', 'The wolf classifier learned “snow”. Where does that shortcut actually live?', ['In a rule someone wrote', '✓ In its learned features and weights', 'In the camera', 'In the test set'], 'Shortcuts are learned into the weights, which is why fixing the data fixed the model.'),
        reflect('carry', 'Carry forward: face unlock, photo search and medical imaging all use networks like these. Where would an adversarial example or a shortcut worry you most, and why?', { min: 25 }),
      ],
    ),
  },

  /* ── Case File 2 ────────────────────────────────────────────────────── */
  'm02-case': {
    title: 'Case File 2: Inside the Model',
    subtitle: 'Mixed cases from Modules 1 and 2, then the Checkpoint for your Feature Check.',
    takeaway: 'Your Feature Check: **What could it have learned from this data, including shortcuts? What small change might fool it?**',
    tabs: [
      part('cases', 'Case File', [
        mcq('k1', '**Case A.** A wildlife camera’s AI identifies deer well by day but calls most animals “deer” at night. Its training photos were almost all taken in daylight. Which question gets to the cause?', [
          'Is the learning rate too high?',
          '✓ What data taught it — and what features could it have learned from that data?',
          'How many parameters does it have?',
          'Is it generative?',
        ], 'A gap in the data (night) plus whatever features daylight photos made useful. Better training cannot fix a gap it never saw.'),
        mcq('k2', '**Case B.** A student notices a face-unlock system opens for a printed photo of the owner. What does this suggest about what it learned?', [
          'It learned exactly what a face is',
          '✓ It relies on flat image features, not on depth or liveness — a small change (a photo) fools it',
          'It was poisoned',
          'Its loss is too high',
        ], 'The features it learned are enough to match a photo of a face; real systems add depth sensing for exactly this reason.'),
        mcq('k3', '**Case C.** A company says its model is better “because it has 10 times more parameters”. What is the honest reply?', [
          'More parameters always means better answers',
          '✓ Parameters are how many weights it has; whether it is better depends on data and on honest testing',
          'Parameters don’t exist',
          'It must be overfitting',
        ], 'Size is capacity, not proof. Ask how it was tested.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'A single neuron outputs “yes” when…', ['Its inputs are all positive', '✓ Its weighted sum plus bias is above zero', 'Its weights are large', 'It has seen the example before'], 'Weighted vote, then a threshold.'),
        mcq('q2', 'What does an activation function add to a network?', ['More data', '✓ A nonlinear bend, so layers can combine into shapes', 'A learning rate', 'A test set'], 'Without it, layers collapse into one line.'),
        mcq('q3', 'Gradient descent moves each weight…', ['Toward a random value', '✓ A small step in the direction that lowers the loss', 'Toward zero', 'Up by one each epoch'], 'Downhill on error.'),
        mcq('q4', 'A loss that explodes to infinity usually means…', ['Too few neurons', '✓ A learning rate far too large', 'A perfect model', 'Too much data'], 'Steps big enough to fly off the landscape.'),
        mcq('q5', 'Which model is most at risk from a shortcut?', ['One tested on held-out data', '✓ One whose training photos of each class were all taken in a different setting', 'One with an activation function', 'One with a small learning rate'], 'When the setting lines up with the label, the setting becomes the lesson.'),
        mcq('q6', 'Why do adversarial examples work?', ['Models are programmed carelessly', '✓ Small changes aimed at the features a model relies on add up', 'Images are too small', 'The model is still training'], 'Aimed, not random.'),
      ], { graded: true }),
    ],
  },
}
