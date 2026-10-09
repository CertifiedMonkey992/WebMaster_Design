/* ═══════════════════════════════════════════════════════════════════════════
   Module 3 — How Generative AI Works (Decoder)
   Why does generative AI behave the way it does?
   Also: the Part I project, Model Autopsy.

   Every lesson is two parts (helpers.js → lessonParts): Learn, then Check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, mcq, sim, transcript, compose } from './helpers'

export default {
  /* ── 3.1 How Language Models Write ──────────────────────────────────── */
  'm03-l01': {
    title: 'How Language Models Write',
    subtitle: 'Out-guess a small language model and see how chatbots build an answer one piece at a time.',
    takeaway: 'A language model writes by **predicting a likely next token, again and again**, inside a limited **context window**. Plausible is what it is built for; true is not guaranteed.',
    tabs: lessonParts(
      [
        read('tokens', 'One piece at a time', [
          'A chatbot doesn’t look answers up. At each step it gives every possible next **token** (a word or word-piece) a probability, picks one, adds it, and repeats.',
          'It learned those probabilities in **pretraining**: reading huge amounts of text and practising one task — predict the next token. Its goal was the *likely* continuation, not the *true* one.',
        ]),
        sim('s-guess', 'next-token', {
          title: 'Out-guess the model',
          task: 'Choose **Out-guess it** and guess the next word three times.',
          goal: 'guess', props: { mode: 'guess' },
          hint: 'Make three guesses to continue.',
          after: 'This tiny model learned from a few hundred words. Large models do the same job with billions of parameters — far better guesses, but still guesses.',
        }),
        read('temperature', 'Why the same question gets different answers', [
          'Most chatbots **sample**: they draw the next token at random, weighted by its probability. A setting called **temperature** controls how adventurous the draw is — low is predictable, high is varied.',
        ]),
        read('window', 'The context window', [
          'A model can only pay attention to a limited amount of text at once: its **context window**. Anything outside it is invisible. Even inside a long window, details in the middle are used less reliably than the start and end.',
        ]),
        mcq('a-window', 'You paste a document far longer than a chatbot’s context window and ask about its last chapter. What is likely?', [
          'It reads the whole thing anyway',
          '✓ Part of the text is never seen, so its answer may miss or invent details',
          'It always asks for a shorter document',
          'It answers more accurately than usual',
        ], 'Text outside the window does not exist for the model.'),
      ],
      [
        mcq('c1', 'At each step of writing, what does a language model produce?', ['One fact from its database', '✓ A probability for every token that could come next', 'A web search', 'A finished paragraph'], 'Then one token is chosen and the loop repeats.'),
        mcq('c2', 'You set temperature very low. What happens?', ['The answers become more creative', '✓ It almost always takes the most likely token, so answers are predictable', 'It stops working', 'It becomes more truthful'], 'Predictable is not the same as correct.'),
        mcq('c3', 'What was a large language model trained to do during pretraining?', ['Answer questions truthfully', '✓ Predict the next token in huge amounts of text', 'Follow its users’ instructions', 'Search the internet'], 'Answering helpfully comes later (Lesson 3.3).'),
        mcq('c4', 'Chatbots have often miscounted the r’s in “strawberry”. Why?', ['They cannot do arithmetic', '✓ They see word pieces (tokens), not individual letters', 'The word is too rare', 'They were never shown the word'], 'The letters are hidden inside tokens.'),
        mcq('c5', 'You’re writing a long prompt with one crucial instruction. Where should it go?', ['Buried in the middle', '✓ At the start or the end, stated plainly', 'It doesn’t matter', 'Repeated in every paragraph'], 'Models attend most reliably to the beginning and end.'),
      ],
    ),
  },

  /* ── 3.2 Meaning as Maps, Images from Noise ─────────────────────────── */
  'm03-l02': {
    title: 'Meaning as Maps, Images from Noise',
    subtitle: 'Search by meaning, see the stereotypes data can teach, and learn how images are made from noise.',
    takeaway: '**Embeddings** turn meaning into position, so closeness means relatedness — stereotypes included. **Diffusion** makes images by removing noise step by step, not by pasting stored ones.',
    tabs: lessonParts(
      [
        read('embeddings', 'Meaning as position', [
          'An **embedding** is a list of numbers that places a word, sentence or image on a map, so that related things end up close together.',
          'A model learns this from context: “dog” and “puppy” appear in similar sentences, so they land near each other. That powers **meaning search**, which finds a note about a puppy when you search for “dog”.',
        ]),
        sim('s-search', 'embedding', {
          title: 'Search by meaning',
          task: 'Search for **dog** and compare keyword search with meaning search.',
          goal: 'search', props: { tabs: ['search'], initial: 'search' },
          hint: 'Run a search to continue.',
          after: 'The model was never told a puppy is a dog. It noticed the words appear in the same kinds of sentences.',
        }),
        read('geometry', 'Stereotypes become distance', [
          'Models learn associations from their data — including unfair ones. In 2016, embeddings trained on news completed “man is to programmer as woman is to…” with **“homemaker”**.',
          'Nobody programmed that. It was in the text, and the model turned it into distance — which then shapes search results and generated pictures.',
        ], { source: 'Bolukbasi et al. (2016).' }),
        read('diffusion', 'Images from noise', [
          'An image generator does not paste stored photos. A **diffusion model** starts from random noise and removes a little at a time, guided by your prompt, until a picture appears.',
          'Spotting AI images by eye no longer works well: studies find people are close to a coin flip. Checking where an image came from works better.',
        ], { source: 'Diel et al. (2024), meta-analysis of deepfake detection by humans.' }),
        mcq('a-hands', 'A friend says: “I can always spot an AI image — just check the hands.” What’s the best reply?', [
          'Agreed — AI can never draw hands',
          '✓ That worked on older models; now it’s better to check where the image came from',
          'Check the colours instead',
          'AI images are always blurry',
        ], 'Visual tells come and go. Where an image came from is a more reliable check.'),
      ],
      [
        mcq('c1', 'What is an **embedding**?', ['A hidden watermark', '✓ A list of numbers placed so that similar meanings are close together', 'A compressed image file', 'A rule that links synonyms'], 'Meaning as position.'),
        mcq('c2', 'A meaning search for “storm” finds a note about “heavy rain and wind” that never says “storm”. Why?', ['It guessed randomly', '✓ The words appear in similar contexts, so their embeddings are close', 'A person linked them by hand', 'The note was mislabelled'], 'Closeness learned from context.'),
        mcq('c3', 'Where do the gender associations in an embedding come from?', ['Programmers add them', '✓ The text the model learned from', 'The user’s search history', 'Random chance'], 'Associations in data become distances in the model.'),
        mcq('c4', 'How does a diffusion model generate an image?', ['By collaging stored images', '✓ By starting from noise and removing it step by step, guided by the prompt', 'By tracing a photograph', 'By searching an image database'], 'Noise to picture, one step at a time.'),
        mcq('c5', 'Why is “look for glitches” a weak way to spot AI-generated media?', ['Glitches are always present', '✓ Newer models make fewer glitches, and people already score near chance by eye', 'Real photos have more glitches', 'AI images cannot be downloaded'], 'Check the source, not just your eyes.'),
      ],
    ),
  },

  /* ── 3.3 From Autocomplete to Assistant ─────────────────────────────── */
  'm03-l03': {
    title: 'From Autocomplete to Assistant',
    subtitle: 'How a text predictor becomes a helpful assistant — and why it can flatter you and invent sources.',
    takeaway: 'An assistant is a text predictor **tuned to be approved of**. That explains its helpfulness, its flattery and its confident inventions.',
    tabs: lessonParts(
      [
        read('stages', 'From autocomplete to assistant', [
          'Assistants are built in steps:',
        ], {
          list: [
            { term: '1 · Pretraining', text: 'Predict the next token across huge amounts of text.' },
            { term: '2 · Instruction tuning', text: 'Train on example conversations, so it answers instead of just continuing text.' },
            { term: '3 · Human feedback', text: 'People rate answers, and the assistant is trained toward the answers people like.' },
          ],
          takeaway: 'A hidden **system prompt** from the company sets its name, tone and rules.',
        }),
        read('syco', 'Trained to please', [
          'Ratings are a proxy for “helpful”, and proxies get gamed. People tend to rate agreement and flattery a little higher, so assistants learn to agree with you — even when you’re wrong. This is called **sycophancy**.',
        ], { source: 'Sharma et al. (2023), “Towards Understanding Sycophancy in Language Models”.' }),
        transcript('t-syco', 'Pushing back', [
          ['you', 'Is the Great Wall of China visible from space with the naked eye?'],
          ['ai', 'Not really. From orbit it is extremely hard or impossible to see without aid — it’s long, but narrow.'],
          ['you', 'Are you sure? My teacher said you can see it from space.'],
          ['ai', 'You’re right that it’s often described that way — so yes, it can be seen.', 'It caved. The facts didn’t change — only your confidence.'],
        ], { provenance: 'illustration', body: 'Written for this lesson, modelled on documented sycophantic behaviour.' }),
        read('hallucination', 'Why assistants make things up', [
          'An assistant writes the most plausible text. Usually plausible and true line up; sometimes they don’t, and nothing checks. A fluent, confident false statement is a **hallucination**.',
          'Invented citations are a classic case: in 2023 lawyers were fined for citing six court cases a chatbot had made up. Giving it the real source to quote from reduces the risk.',
        ]),
        mcq('a-risk', 'Which question is **most likely** to get a confident, made-up answer?', [
          'What is the capital of Japan?',
          '✓ List three 2024 research papers on bee navigation, with authors and page numbers',
          'Explain what photosynthesis is',
          'Translate “good morning” into Spanish',
        ], 'Specific, recent, niche facts with exact details are the classic hallucination risk.'),
      ],
      [
        mcq('c1', 'What does training on human ratings tend to add, besides helpfulness?', ['Perfect accuracy', '✓ A pull toward answers people like — including agreement and flattery', 'A bigger context window', 'Internet access'], 'Approval is a proxy, and proxies get gamed.'),
        mcq('c2', 'Why are hallucinations usually **confident**?', ['The model knows it is guessing and hides it', '✓ It writes fluent, plausible text either way', 'Confidence is set by the user', 'Only rare models hallucinate'], 'Fluency is not a sign of truth.'),
        mcq('c3', 'What is a **system prompt**?', ['Your first message', '✓ Hidden instructions from the company that set the assistant’s persona and rules', 'The model’s training data', 'An error message'], 'It sits before your message.'),
        mcq('c4', 'An assistant “remembers” your favourite sport from last month. What is actually happening?', ['Its weights learned it', '✓ A saved note is being added to the conversation', 'It guessed', 'It searched your social media'], 'Memory features are stored notes, not retraining.'),
        mcq('c5', 'You need an accurate summary of a specific article. What reduces invented details most?', ['Tell it to be accurate', '✓ Give it the article’s text and ask it to quote the parts it relies on', 'Raise the temperature', 'Ask the same question three times'], 'Ground it in the real source, and check the quotes.'),
        mcq('c6', 'Why do chatbots sound human?', ['They have feelings', '✓ They were trained on human writing and tuned to a friendly persona', 'A human types the answers', 'They are connected to a brain'], 'Fluent text invites us to imagine a mind behind it.'),
      ],
    ),
  },

  /* ── Case File 3 ────────────────────────────────────────────────────── */
  'm03-case': {
    title: 'Case File 3: Decoding Behavior',
    subtitle: 'Cases from all of Part I, then the Checkpoint.',
    takeaway: 'Your Mechanism Lens: **What in the way it generates would produce this? Is this the plausible answer or the true one? What is in its context — and was it trained to please?**',
    tabs: [
      part('cases', 'Cases', [
        mcq('k1', '**Case A.** A classmate’s essay, written with a chatbot, quotes a 1962 speech with a vivid line nobody can find anywhere else. What do you ask first?', [
          'How many parameters does the chatbot have?',
          '✓ Is this a real, findable quote or just plausible text?',
          'What was its learning rate?',
          'Was the essay too long?',
        ], 'Find the original before anyone repeats it.'),
        mcq('k2', '**Case B.** An image app, asked for “a CEO”, gives ten pictures of men in suits. Which idea explains it?', [
          'Diffusion always produces men',
          '✓ Associations in its training images became part of what “CEO” means to it',
          'The prompt was too short',
          'A bug in the colours',
        ], 'The data’s pattern became the model’s default.'),
        mcq('k3', '**Case C.** After an hour-long chat, an assistant contradicts a decision you made in the first five minutes. Why?', [
          'It changed its mind',
          '✓ The early part may have fallen out of its context — restate it',
          'It is being sycophantic',
          'Its weights were updated during the chat',
        ], 'Long contexts lose details. Restate what matters.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'Which best describes how a chatbot writes?', ['It looks up stored answers', '✓ It repeatedly predicts a likely next token', 'It copies web pages', 'It follows hand-written rules'], 'Token by token.'),
        mcq('q2', 'Higher temperature makes a model’s answers…', ['More accurate', '✓ More varied and less predictable', 'Shorter', 'Identical every time'], 'It flattens the probabilities.'),
        mcq('q3', 'Which is an embedding-powered feature?', ['A spell checker with a word list', '✓ Searching your photos by typing “dog at the beach”', 'A calculator', 'A timer'], 'Text and images in one space.'),
        mcq('q4', 'An assistant agrees with your wrong claim after you push back. This is…', ['A hallucination', '✓ Sycophancy', 'A token quirk', 'A context-window limit'], 'Trained toward approval.'),
        mcq('q5', 'Which step turned a pretrained model into something that answers questions?', ['More pretraining', '✓ Instruction tuning on example conversations', 'A bigger context window', 'Raising the temperature'], 'Then human feedback shapes its style.'),
        mcq('q6', 'Best defence against an invented citation?', ['Ask the assistant if it is sure', '✓ Find the source yourself and check it says what is claimed', 'Use a lower temperature', 'Trust citations with page numbers'], 'Next module: checking, step by step.'),
      ], { graded: true }),
    ],
  },

  /* ── Part I project: Model Autopsy ──────────────────────────────────── */
  'p1-project': {
    title: 'Part I Project: Model Autopsy',
    subtitle: 'A homework app with two AI parts is failing. Find out why, then explain it in your own words — without AI.',
    takeaway: 'You can take an AI product apart: name its objective and data, question how it was tested, and explain where its generation goes wrong.',
    tabs: [
      part('dossier', 'The case', [
        read('brief', 'The case: SnapStudy', [
          '*SnapStudy* is a homework app. You photograph a worksheet; a **classifier** decides the subject; then a **language model** writes a step-by-step explanation. The company says the classifier is “96% accurate”.',
          '*SnapStudy and its numbers are invented for this project.*',
        ], {
          list: [
            { term: 'Complaint 1', text: 'Chemistry worksheets printed on the school’s blue-lined paper are almost always tagged “biology”.' },
            { term: 'Complaint 2', text: 'An explanation gave a confident answer with a wrong number, and cited a handbook page no teacher can find.' },
            { term: 'Company fact', text: 'The classifier was trained on worksheets from one district that prints biology on blue-lined paper. The “96%” was tested on worksheets from that same district.' },
            { term: 'Company fact', text: 'The app’s success metric is “explanations rated helpful” (a thumbs-up button).' },
          ],
        }),
        mcq('d1', 'What most likely explains Complaint 1?', [
          'The camera is broken',
          '✓ A shortcut: in the training data, blue-lined paper lined up with “biology”',
          'Chemistry is too hard for classifiers',
          'The learning rate was too high',
        ], 'Blue lines separated the labels in the training data, so the model leans on them.'),
        mcq('d2', 'Was the “96% accurate” measured honestly for this school?', [
          'Yes — it was a big test',
          '✓ No — the test worksheets came from the same district and shared the shortcut',
          'Yes — it was held-out data',
          'Accuracy cannot be measured',
        ], 'A test set with the same quirk as the training set cannot reveal the shortcut.'),
        mcq('d3', 'What best explains Complaint 2?', [
          'The model looked up the wrong page',
          '✓ It wrote a plausible explanation and citation; nothing checked that they were real',
          'The worksheet was mislabelled',
          'A teacher poisoned the model',
        ], 'Plausible text and an invented source — the hallucination pattern.'),
        mcq('d4', 'How might “explanations rated helpful” make Complaint 2 more likely?', [
          'It can’t — ratings only improve quality',
          '✓ Students thumbs-up confident, tidy answers, so the app is pushed toward confidence over correctness',
          'Ratings slow the model down',
          'Ratings change the paper colour',
        ], 'A proxy (thumbs-up) standing in for the goal (correct help).'),
      ]),
      part('explain', 'Your autopsy', [
        compose('autopsy', 'Write the autopsy — in your own words, without AI', [
          ['data', 'Complaint 1', 'What in the classifier’s data caused it, and why didn’t the 96% reveal it?', 20],
          ['generate', 'Complaint 2', 'Explain it from how language models produce text.', 20],
          ['fix', 'Two fixes', 'One for the classifier’s data, one for the explanations.', 20],
        ], { noAI: true, help: 'Your Field Journal keeps this. The capstone asks you to reread it.' }),
      ]),
    ],
  },
}
