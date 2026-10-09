/* ═══════════════════════════════════════════════════════════════════════════
   Module 2 — Inside a Neural Network (Mechanic)
   What actually changes inside a model when it learns?

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, mcq, number, sim } from './helpers'

export default {
  /* ── 2.1 One Neuron, Then Layers ────────────────────────────────────── */
  'm02-l01': {
    title: 'One Neuron, Then Layers',
    subtitle: 'Tune one artificial neuron by hand, then see why networks need layers.',
    takeaway: 'A neuron is a **weighted vote**. One draws a straight line; layers with a **bend** between them can draw any shape. The weights are the “parameters” models are counted in.',
    tabs: lessonParts(
      [
        read('neuron', 'A neuron is a weighted vote', [
          'Take some inputs, multiply each by a **weight**, add them up, add a **bias**, and answer yes if the total is above zero. That is an artificial neuron.',
          'The weights and bias are the model’s **parameters**. A model with “a trillion parameters” has a trillion numbers like the sliders below.',
        ]),
        sim('s-neuron', 'neuron', {
          title: 'Tune one neuron',
          task: 'Move the sliders until at least **95%** of the points are on the right side of the line.',
          goal: 'separate', props: { dataset: 'separable' },
          hint: 'Tip: make w₁ negative and w₂ positive, then adjust the bias.',
          after: 'You did by hand what training does automatically: found weights that separate the data.',
        }),
        read('layers', 'Layers, and the bend between them', [
          'One neuron can only draw **one straight line**. Some patterns — like points inside a circle — need more than a line.',
          'So networks stack neurons in **layers**. Each hidden neuron draws its own line, and the next layer combines them into a shape.',
          'Between layers sits an **activation function** that bends the signal. Without the bend, any number of layers still adds up to one straight line. The most common one, **ReLU**, just turns negative numbers into zero.',
        ]),
        mcq('a-act', 'A network has 8 hidden neurons but **no activation function**. Can it separate points inside a circle from points outside?', [
          'Yes — 8 neurons is plenty',
          '✓ No — without a bend, 8 neurons still add up to one straight line',
          'Only with a tiny learning rate',
          'Only if it trains for a very long time',
        ], 'The bend is what lets layers combine lines into shapes.'),
      ],
      [
        number('c1', 'A neuron has inputs **2** and **3**, weights **1** and **−1**, and bias **0.5**. What is its total?', -0.5, { tolerance: 0.01, why: '2×1 + 3×(−1) + 0.5 = −0.5. Below zero, so the neuron says no.' }),
        mcq('c2', 'Why can’t a single neuron separate points in two **opposite corners** from the other two?', [
          'It needs more training data',
          '✓ It can only draw one straight line, and no line splits opposite corners',
          'The data is too random',
          'Its weights are too small',
        ], 'One neuron, one line. This needs at least two lines combined.'),
        mcq('c3', 'What happens if you remove the activation function from every layer of a deep network?', [
          'It trains faster and better',
          '✓ It behaves like a single straight line, however many layers it has',
          'It stops producing outputs',
          'It becomes a generative model',
        ], 'Without a bend, stacked layers collapse into one line.'),
        mcq('c4', 'A news story says a model has “a trillion parameters”. What are they?', ['Rules written by its engineers', '✓ The weights and biases it learned during training', 'The number of users it has', 'Facts stored in a database'], 'Parameters are the numbers a model adjusts while training.'),
        mcq('c5', 'Who decides the values of a trained network’s weights?', ['The programmers, one by one', '✓ The training process, adjusting them to reduce error', 'The users, as they chat', 'They are random and never change'], 'Nobody writes the weights. How training finds them is the next lesson.'),
      ],
    ),
  },

  /* ── 2.2 Learning Downhill ──────────────────────────────────────────── */
  'm02-l02': {
    title: 'Learning Downhill',
    subtitle: 'How a network learns: measure the error, then take small steps downhill.',
    takeaway: 'Learning is **walking downhill on error**: backpropagation works out each weight’s share of the blame, and each weight takes a small step to reduce it — millions of times.',
    tabs: lessonParts(
      [
        read('loss', 'Error, measured', [
          'Training starts with random weights, so the network is wrong about almost everything. A number called the **loss** measures how wrong: big when answers are far off, near zero when they are right.',
          'Training is the search for weights that make the loss small.',
        ]),
        predict('p-hiker', 'You’re lost on a foggy mountain and want to reach the valley. You can only feel the slope under your feet. What do you do?', [
          '✓ Take a small step in the steepest downhill direction, then feel again, and repeat',
          'Jump as far as you can in a random direction',
          'Stay still until the fog clears',
          'Walk uphill to get a better view',
        ], 'That is **gradient descent**. The slope is the gradient — how the loss changes if each weight moves a little. Step downhill, repeat, and the loss falls.'),
        read('lr', 'The size of each step', [
          'The **learning rate** is how big each step is. Too big and you overshoot the valley, so the loss bounces around or climbs. Too small and learning crawls.',
        ]),
        sim('s-lr', 'network', {
          title: 'Find a good step size',
          task: 'Train with learning rate **40**, then pick a smaller one and train again.',
          goal: 'solve', props: { controls: ['lr'], dataset: 'xor', hidden: 4, activation: 'tanh', lr: 40 },
          hint: 'Lower the learning rate and train until it reaches 95%.',
          after: 'Same network, same data. The step size alone decided whether it learned.',
        }),
        read('bp', 'Backpropagation: passing the blame back', [
          'A network has many layers of weights. **Backpropagation** works backward from a mistake and gives every weight its share of the blame, so each one knows which way to move.',
          'Training is slow and expensive. Using a finished model — **inference** — just runs it forward with its weights fixed. Chatting with an assistant does not rewrite its weights.',
        ]),
        mcq('a-bounce', 'A loss curve jumps up and down and ends higher than it started. What is the most likely cause?', ['Too little data', '✓ The learning rate is too large', 'Too many hidden neurons', 'No activation function'], 'Oversized steps overshoot the valley.'),
      ],
      [
        mcq('c1', 'What does a model’s **loss** measure?', ['Its speed', '✓ How wrong its answers are on the training examples', 'How many parameters it has', 'How much data it has seen'], 'Training is the search for low loss.'),
        mcq('c2', 'Gradient descent moves each weight…', ['Toward a random value', '✓ A small step in the direction that lowers the loss', 'Toward zero', 'Up by one each time'], 'Downhill on error.'),
        mcq('c3', 'A loss curve falls, but so slowly it would take days to finish. What would you change?', ['Remove the activation', '✓ Raise the learning rate a little', 'Delete half the data', 'Nothing — that is normal'], 'Tiny steps make slow progress.'),
        mcq('c4', 'What is **backpropagation** for?', [
          'Deleting wrong training examples',
          '✓ Working out how much each weight contributed to the error, so each can be adjusted',
          'Running the model backwards to generate data',
          'Storing the conversation history',
        ], 'It passes the blame back so deep networks can be trained.'),
        mcq('c5', 'You tell a chatbot a fact about yourself. Did its weights just change to learn it?', [
          'Yes, instantly',
          '✓ No — its weights are fixed while you use it',
          'Yes, but only for important facts',
          'Only if you say “remember this”',
        ], 'Training and using are separate. “Memory” features store notes and add them back into the conversation.'),
      ],
    ),
  },

  /* ── 2.3 What Networks See ──────────────────────────────────────────── */
  'm02-l03': {
    title: 'What Networks See',
    subtitle: 'How image networks build their own features — and why a tiny change can fool them.',
    takeaway: 'An image network builds its own **features**, layer by layer. They are statistical patterns, not human ideas — so a tiny, aimed change can fool it.',
    tabs: lessonParts(
      [
        read('features', 'Features, built layer by layer', [
          'An image network slides small **filters** across a photo. Each filter lights up where its pattern appears.',
          'Early layers learn **edges and colours**, middle layers **textures and shapes**, and late layers **parts and objects** like eyes and wheels. Nobody programs these — training finds whatever reduces the loss.',
        ]),
        predict('p-adv', 'Every pixel of a photo is nudged by a tiny amount — a change you can barely see. Could that flip what the model says?', [
          'No — the image looks the same',
          '✓ Yes, if every nudge is aimed where the model is most sensitive',
          'Only for blurry photos',
          'Only if the model is broken',
        ], 'Try it on a small model trained in your browser.'),
        sim('s-adv', 'adversarial', {
          title: 'Fool an image classifier',
          task: 'Raise the **targeted nudge** until the model changes its answer.',
          goal: 'flip',
          hint: 'Raise the change until the model says 0.',
          after: 'An aimed change you can barely see flipped the answer. Random noise of the same size mostly cancels out.',
        }),
        read('adversarial', 'Why aimed changes work', [
          'In 2018, researchers put a few stickers on a stop sign and made a model read it as a speed-limit sign. This is an **adversarial example**.',
          'It works because a network’s features are **statistical patterns**, not concepts like “stop”. Many small pushes in exactly the direction it cares about add up.',
        ], { source: 'Eykholt et al. (2018).' }),
        mcq('a-layers', 'In a trained image network, where would you expect a feature that detects **a dog’s face**?', ['First layer', 'Middle layer', '✓ Late layer', 'It would not have one'], 'Simple patterns first; combinations of combinations later.'),
      ],
      [
        mcq('c1', 'What does a filter in an image network do?', [
          '✓ Slides over the image and lights up where its small pattern appears',
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
        ], 'The model sees numbers pushed where it is most sensitive.'),
        mcq('c4', 'Which is an **adversarial example**?', [
          'A blurry photo the model gets wrong',
          '✓ Small stickers placed on purpose so a model misreads a sign',
          'A photo of a new animal the model never saw',
          'A mislabelled training photo',
        ], 'Adversarial examples are crafted to hit the model’s weak spots.'),
        mcq('c5', 'The wolf classifier learned “snow”. Where does that shortcut actually live?', ['In a rule someone wrote', '✓ In its learned features and weights', 'In the camera', 'In the test set'], 'Shortcuts are learned into the weights — which is why fixing the data fixed the model.'),
      ],
    ),
  },

  /* ── Case File 2 ────────────────────────────────────────────────────── */
  'm02-case': {
    title: 'Case File 2: Inside the Model',
    subtitle: 'Cases from Modules 1 and 2, then the Checkpoint.',
    takeaway: 'Your Feature Check: **What could it have learned from this data, including shortcuts? What small change might fool it?**',
    tabs: [
      part('cases', 'Cases', [
        mcq('k1', '**Case A.** A wildlife camera identifies deer well by day but calls most animals “deer” at night. Its training photos were almost all taken in daylight. What is the cause?', [
          'The learning rate is too high',
          '✓ A gap in its data — it never learned what night photos look like',
          'It has too many parameters',
          'It is generative',
        ], 'Better training cannot fix a gap the model never saw.'),
        mcq('k2', '**Case B.** A face-unlock system opens for a printed photo of the owner. What does this suggest?', [
          'It learned exactly what a face is',
          '✓ It relies on flat image features, so a small change (a photo) fools it',
          'It was poisoned',
          'Its loss is too high',
        ], 'Real systems add depth sensing for exactly this reason.'),
        mcq('k3', '**Case C.** A company says its model is better “because it has 10 times more parameters”. What is the honest reply?', [
          'More parameters always means better answers',
          '✓ Parameters measure size; whether it is better depends on data and honest testing',
          'Parameters don’t exist',
          'It must be overfitting',
        ], 'Size is capacity, not proof.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'A single neuron outputs “yes” when…', ['Its inputs are all positive', '✓ Its weighted sum plus bias is above zero', 'Its weights are large', 'It has seen the example before'], 'Weighted vote, then a threshold.'),
        mcq('q2', 'What does an activation function add to a network?', ['More data', '✓ A bend, so layers can combine into shapes', 'A learning rate', 'A test set'], 'Without it, layers collapse into one line.'),
        mcq('q3', 'Gradient descent moves each weight…', ['Toward a random value', '✓ A small step in the direction that lowers the loss', 'Toward zero', 'Up by one each epoch'], 'Downhill on error.'),
        mcq('q4', 'A loss that explodes to infinity usually means…', ['Too few neurons', '✓ A learning rate far too large', 'A perfect model', 'Too much data'], 'Steps big enough to fly off the landscape.'),
        mcq('q5', 'Which model is most at risk from a shortcut?', ['One tested on held-out data', '✓ One whose photos of each class were all taken in a different setting', 'One with an activation function', 'One with a small learning rate'], 'When the setting lines up with the label, the setting becomes the lesson.'),
        mcq('q6', 'Why do adversarial examples work?', ['Models are programmed carelessly', '✓ Small changes aimed at the features a model relies on add up', 'Images are too small', 'The model is still training'], 'Aimed, not random.'),
      ], { graded: true }),
    ],
  },
}
