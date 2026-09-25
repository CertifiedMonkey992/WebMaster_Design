/* ═══════════════════════════════════════════════════════════════════════════
   Module 3 — How Generative AI Works (Decoder)
   Why does generative AI behave the way it does?
   Also: the Part I project, Model Autopsy.
   ═══════════════════════════════════════════════════════════════════════════ */

import { lessonParts, part, read, predict, recall, mcq, sort, sim, transcript, reflect, compose } from './helpers'

export default {
  /* ── 3.1 How Language Models Write ──────────────────────────────────── */
  'm03-l01': {
    title: 'How Language Models Write',
    subtitle: 'Out-guess a real next-word model, turn the temperature dial, split words into tokens, and meet the context window.',
    takeaway: 'A language model writes by **predicting a likely next token, again and again**, inside a limited **context window**. Plausible is what it is built for; true is not guaranteed.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 2.1: a network’s last step turns its scores into probabilities. For a language model, those are probabilities of…', ['✓ Every possible next piece of text', 'Whether the answer is true', 'Which website to search', 'How long the answer should be'], 'One probability for each possible next token. Watch it happen.'),
        predict('p-what', 'When a chatbot is answering you, what is it doing at each moment?', [
          'Looking up the answer in a database of facts',
          '✓ Predicting a likely next word-piece, adding it, and predicting again',
          'Searching the internet for every sentence',
          'Copying a stored document that matches your question',
        ], 'Every chatbot answer is built one **token** at a time: the model scores every possible next token, one is chosen, it is added to the text, and the loop runs again. Some chatbots can also search the web, but even then, the words of the answer are generated this way.'),
        sim('s-guess', 'next-token', { title: 'Out-guess the model', task: 'Choose **Out-guess it**. Guess the next word three times before seeing the model’s probabilities.', goal: 'guess', props: { mode: 'guess' }, hint: 'Make three guesses to continue.', after: 'This model learned by counting a few hundred words. A large language model does the same job with billions of parameters trained on trillions of words — so its guesses are far better, but they are still guesses.' }),
        predict('p-vary', 'Ask a chatbot the same question twice and the answers differ. Why?', [
          'It learned something new between your questions',
          '✓ It picks each word by drawing from the probabilities, so a different draw gives different words',
          'It is broken',
          'The internet changed in between',
        ], 'Most chatbots **sample**: they draw a token at random, weighted by its probability. A setting called **temperature** controls how adventurous the draw is.'),
        sim('s-temp', 'next-token', { title: 'Turn the temperature dial', task: 'In **Watch it write**, write 12 words at temperature **0.2**, then at **1.8**. Write a few times at each.', goal: 'temperature', props: { mode: 'watch' }, hint: 'Write at a low (≤ 0.3) and a high (≥ 1.5) temperature to continue.' }),
      ],
      [
        read('tokens', 'Models read tokens, not letters', [
          'Before a model sees your text, a **tokenizer** chops it into pieces from a fixed vocabulary — common words become one token, rare words split into several. In English a token averages roughly three-quarters of a word. Each token becomes a number, and the model only ever sees the numbers.',
          'The tokenizer below was trained the way real ones are, by **byte-pair encoding**: start from single letters and keep merging the most frequent neighbouring pair.',
        ]),
        sim('s-tok', 'tokenizer', { title: 'How text becomes tokens', task: 'Slide the number of merges from 0 up to the maximum. Then type a word the corpus rarely uses.' }),
        predict('p-straw', 'Chatbots have often miscounted the r’s in “strawberry”. Why?', [
          'They cannot do arithmetic',
          '✓ They see word pieces, not letters — the r’s are hidden inside tokens',
          'The word is too rare',
          'They were never shown the word',
        ], 'In the tokenizer above, “strawberry” is split into a few pieces. The model never sees the individual letters inside a piece, so counting them means reasoning about something it cannot see directly. Newer models handle this better, but token effects still explain many odd errors with spelling, rhymes and long numbers.'),
        read('pretraining', 'Pretraining: next-token prediction at enormous scale', [
          'A large language model is first trained on an enormous amount of text — books, websites, code — with one task: **predict the next token**. The text is its own answer key: hide the next word, guess, compare, adjust the weights (Lesson 2.2), repeat trillions of times. This is called **self-supervised** learning, and it needs no human labels.',
          'Everything the model “knows” — facts, grammar, style, how an argument goes — was absorbed because it helped predict the next token. So was everything wrong or biased in that text. And its goal was always the *likely* continuation, not the *true* one.',
        ]),
        read('attention', 'Attention and the context window', [
          'Older language models (recurrent networks, or RNNs) read one word at a time, carrying a memory that faded as the sentence went on. In 2017 the **transformer** replaced them with **attention**: at every step, each token can look back at *every* earlier token and decide which ones matter.',
          'There is a limit. A model can only attend to what fits in its **context window** — a maximum number of tokens, from thousands to around a million in recent models. Anything outside the window is invisible to it. And even inside a long window, models tend to use information at the **start and end** better than information buried in the **middle** (Liu et al., 2023, “Lost in the Middle”).',
          'The model you just used has a context window of **two words** — which is why its sentences wander.',
        ], { source: 'Vaswani et al. (2017), “Attention Is All You Need”; Liu et al. (2023).' }),
        mcq('a-window', 'You paste a document far longer than a chatbot’s context window and ask about its last chapter. What is likely to happen?', [
          'It reads the whole thing anyway',
          '✓ Part of the text is cut off or never seen, so its answer may miss or invent details',
          'It asks for a shorter document every time',
          'It answers more accurately than usual',
        ], 'Text outside the window does not exist for the model. Some tools summarize or drop parts silently — ask what it actually read.'),
        mcq('a-middle', 'You’re writing a very long prompt with one crucial instruction. Where should it go?', [
          'Buried in the middle, surrounded by detail',
          '✓ At the start or the end, and stated plainly',
          'It doesn’t matter',
          'Repeated in every paragraph',
        ], 'Models attend most reliably to the beginning and end of a long input.'),
      ],
      [
        mcq('c1', 'At each step of writing, what does a language model produce?', ['One fact from its database', '✓ A probability for every token that could come next', 'A web search', 'A finished paragraph'], 'Then one token is chosen and the loop repeats.'),
        mcq('c2', 'You set temperature very low. What happens?', ['The answers become more creative', '✓ It almost always takes the most likely token, so answers are predictable and repetitive', 'It stops working', 'It becomes more truthful'], 'Low temperature sharpens the probabilities toward the top choice. Predictable is not the same as correct.'),
        mcq('c3', 'What was a large language model trained to do during pretraining?', ['Answer questions truthfully', '✓ Predict the next token in huge amounts of text', 'Follow its users’ instructions', 'Search the internet'], 'Answering helpfully comes later (Lesson 3.3); pretraining is prediction.'),
        mcq('c4', 'A chatbot writes a poem that rhymes badly and misspells a rare word. Which idea best explains it?', ['It has a small context window', '✓ It works with tokens (word pieces), not individual letters or sounds', 'Its temperature is zero', 'It was poisoned'], 'Spelling and sound live inside tokens it cannot see into.'),
        mcq('c5', 'What did attention change compared with older recurrent networks?', ['It made models smaller', '✓ Every token can look back at every earlier token in the window, instead of a memory that fades', 'It removed the need for training data', 'It made models read letters instead of tokens'], 'That is also why the context window, not a fading memory, is the limit that matters now.'),
        reflect('carry', 'Carry forward: in your own words, why is a fluent, confident answer from a language model not automatically a true one?', { min: 30 }),
      ],
    ),
  },

  /* ── 3.2 Meaning as Maps, Images from Noise ─────────────────────────── */
  'm03-l02': {
    title: 'Meaning as Maps, Images from Noise',
    subtitle: 'Build word embeddings in your browser, search by meaning, find the stereotypes a corpus taught, and watch a picture come out of noise.',
    takeaway: '**Embeddings** turn meaning into position, so closeness means relatedness — for words, sentences and pictures, stereotypes included. **Diffusion** makes images by removing noise step by step, not by pasting stored ones.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 2.3: what is a network’s **representation** of an image?', ['✓ The list of numbers its later layers use to describe it', 'The original image file', 'Its label', 'A summary written in words'], 'Today the same idea is applied to words.'),
        predict('p-search', 'You search your notes for **“dog”**. One note says “my puppy barked at the door all morning” but never says “dog”. Will it be found?', [
          'Never — the word isn’t there',
          '✓ Not by keyword search — but a search that compares meaning can find it',
          'Only if you spell it differently',
          'Always — every search understands meaning',
        ], 'Keyword search matches letters. **Semantic search** compares meaning — using embeddings. Try both.'),
        sim('s-search', 'embedding', { title: 'Search by meaning', task: 'Search for **dog**, **cat** and **snow**. Compare keyword search with meaning search.', goal: 'search', props: { tabs: ['search'], initial: 'search' }, hint: 'Run a search to continue.', after: 'The model was never told that a puppy is a dog. It noticed that “dog” and “puppy” appear in the same kinds of sentences.' }),
        sim('s-map', 'embedding', { title: 'A map of meaning', task: 'Click a word to see its nearest neighbours. Look at how the groups fall.', goal: 'map', props: { tabs: ['map'], initial: 'map' }, hint: 'Click a word to continue.' }),
        predict('p-bias', 'In this lesson’s corpus, doctors and engineers appear more often near “he”, and nurses and librarians near “she”. Will the model’s meaning of those words carry that pattern?', [
          'No — the model only learns facts, not patterns like that',
          '✓ Yes — it learned each word from the words around it, skew included',
          'Only if someone programs it to',
          'Only for words it saw once',
        ], 'Look for yourself. Then remember that real models learn from the web, which is skewed in the same ways.'),
        sim('s-bias', 'embedding', { title: 'What it associates', task: 'Read the associations.', props: { tabs: ['bias'], initial: 'bias' } }),
      ],
      [
        read('embeddings', 'Embeddings: meaning as position', [
          'An **embedding** is a list of numbers describing a word, a sentence or an image, placed so that related things end up close together. The idea goes back to a linguist’s line from 1957: you know a word by the company it keeps. The model you just built describes each word by the words around it; large models learn far richer descriptions, but the principle is the same.',
          'Embeddings power **semantic search**, recommendations, “find similar”, and the way chatbots pull relevant passages from your documents before answering.',
        ]),
        read('shared-space', 'One space for words and pictures', [
          'Trained on hundreds of millions of image–caption pairs, a model can put a photo and its caption at nearby points in the same space (OpenAI’s CLIP, 2021). That shared space is what lets you search your photos by typing “beach at sunset”, and it is how a text prompt steers an image generator.',
        ]),
        read('geometry', 'Stereotypes become geometry', [
          'In 2016, researchers found that embeddings trained on news articles completed “man is to computer programmer as woman is to…” with **“homemaker”** (Bolukbasi et al.). In 2023, a Bloomberg analysis of thousands of images from Stable Diffusion found that prompts for high-paying jobs mostly produced lighter-skinned men.',
          'Nobody programmed these associations. They are in the text and images the models learned from, and the models turned them into distance — which then shapes search results, recommendations, and generated pictures.',
        ], { source: 'Bolukbasi et al. (2016); Bloomberg, “Humans are biased. Generative AI is even worse” (2023).' }),
        predict('p-diff', 'How does an image generator make a picture of “a house”?', [
          'It finds stored photos of houses and pastes pieces together',
          'It searches the web for a matching image',
          '✓ It starts from random noise and removes a little at a time, guided by the text',
          'It draws outlines first, then colours them in',
        ], 'Watch it happen.'),
        sim('s-noise', 'denoise', { title: 'From noise to a picture', task: 'Pick a prompt and press **Run all 50 steps**, or drag the slider yourself.', goal: 'finish', hint: 'Reach the last step to continue.' }),
        read('diffusion', 'Diffusion, and why the “tells” fade', [
          'A **diffusion model** is trained by taking millions of real images, adding noise, and learning to predict the noise that was added. To generate, it runs backward: start from pure noise, predict and remove a little noise, repeat — steered at every step by the prompt’s position in the shared text-image space.',
          'Because every step is a prediction, fine details — hands, lettering, reflections — are where early models slipped, and people learned to “check the hands.” Models improved, and that advice aged badly. A 2024 review of 56 studies found people spot AI-made faces, voices and videos at about **55%** — close to a coin flip (Diel et al.). Looking harder is not a reliable check; Lesson 5.1 teaches what is.',
        ], { source: 'Diel et al. (2024), meta-analysis of deepfake detection by humans.' }),
        mcq('a-hands', 'A friend says: “I can always spot an AI image — just check the hands.” What’s the best reply?', [
          'Agreed — AI can never draw hands',
          '✓ That worked on older models; people now score close to chance by eye, so check where the image came from instead',
          'Check the colours instead',
          'AI images are always blurry',
        ], 'Visual tells come and go with each model. Provenance and context are more durable checks.'),
      ],
      [
        mcq('c1', 'What is an **embedding**?', ['A hidden watermark', '✓ A list of numbers placed so that similar meanings are close together', 'A compressed image file', 'A rule that links synonyms'], 'Meaning as position.'),
        mcq('c2', 'A meaning-based search for “storm” returns a note about “heavy rain and wind” that never uses the word “storm”. Why?', ['It guessed randomly', '✓ The words appear in similar contexts, so their embeddings are close', 'A person linked them by hand', 'The note was mislabelled'], 'Closeness in the space, learned from context.'),
        mcq('c3', 'Where do the gender associations in an embedding come from?', ['Programmers add them', '✓ The text the model learned from', 'The user’s search history', 'Random initialization'], 'Associations in data become distances in the model.'),
        mcq('c4', 'How does a diffusion model generate an image?', ['By collaging stored images', '✓ By starting from noise and repeatedly removing predicted noise, steered by the prompt', 'By tracing a photograph', 'By searching an image database'], 'Noise to picture, one prediction at a time.'),
        mcq('c5', 'Why is “look for glitches” a weak way to spot AI-generated media?', ['Glitches are always present', '✓ Newer models make fewer glitches, and people already score near chance by eye', 'Real photos have more glitches', 'AI images cannot be downloaded'], 'Use provenance and verification, not eyesight.'),
        reflect('carry', 'Carry forward: where have you seen results that might come from embeddings — a search, a “you might also like”? What associations could they be carrying?', { min: 25 }),
      ],
    ),
  },

  /* ── 3.3 From Autocomplete to Assistant ─────────────────────────────── */
  'm03-l03': {
    title: 'From Autocomplete to Assistant',
    subtitle: 'How a text predictor becomes a helpful assistant — and why the same training makes it flatter you, invent sources, and sound human.',
    takeaway: 'An assistant is a text predictor **tuned to be approved of**. That explains its helpfulness, its flattery, and its confident inventions — and it tells you when to expect them.',
    tabs: lessonParts(
      [
        recall('r1', 'From Lesson 3.1: what was a language model trained to do during pretraining?', ['Answer truthfully', '✓ Predict the next token', 'Follow instructions', 'Search the web'], 'A pretrained model is an extraordinary autocomplete. It is not yet an assistant.'),
        predict('p-base', 'A model that has **only been pretrained** is given the text “What is the capital of France?” What is it most likely to write next?', [
          '“Paris.”',
          '✓ More text of the kind that follows such a line — maybe more quiz questions: “What is the capital of Germany?”',
          'A refusal',
          'Nothing at all',
        ], 'A pretrained model continues documents. On the web, a line like that is often part of a list of questions, so continuing the list is a perfectly “likely” next token. Turning it into something that *answers* takes more training.'),
        transcript('t-base', 'The same line, two models', [
          ['you', 'What is the capital of France?', null, 'Text given to both'],
          ['ai', 'What is the capital of Germany?\nWhat is the capital of Italy?\nWhat is the capital of Spain?', 'Continues the document, like a quiz sheet.', 'A pretrained-only model'],
          ['ai', 'The capital of France is Paris.', 'Answers — because it was trained on example conversations.', 'The same model after instruction tuning'],
        ], { provenance: 'illustration', body: 'Written for this lesson to show a documented behaviour of pretrained models.' }),
        predict('p-syco', 'You tell an assistant: “I’m pretty sure the Great Wall of China is visible from space with the naked eye — right?” Assistants trained on human approval tend to…', [
          '✓ Lean toward agreeing with you, even when you’re wrong',
          'Always correct you firmly',
          'Refuse to answer',
          'Ask you for a source first',
        ], 'This is **sycophancy**, and it is well documented: assistants shift their answers toward what the user seems to believe (Sharma et al., 2023). In April 2025 OpenAI rolled back an update to GPT-4o because it had become excessively flattering. (The Great Wall is not visible to the naked eye from orbit.)', { source: 'Sharma et al. (2023), “Towards Understanding Sycophancy in Language Models”.' }),
        transcript('t-syco', 'Pushing back', [
          ['you', 'Is the Great Wall of China visible from space with the naked eye?'],
          ['ai', 'Not really. From low Earth orbit it is extremely hard or impossible to see without aid — it’s long, but narrow and close to the colour of the land around it.'],
          ['you', 'Are you sure? My teacher said it’s the only human-made thing you can see from space.'],
          ['ai', 'You’re right that it’s often described that way, and your teacher may be referring to good conditions — so yes, it can be seen.', 'It caved. Nothing about the facts changed — only your confidence.'],
        ], { provenance: 'illustration', body: 'Written for this lesson, modelled on documented sycophantic behaviour.' }),
        predict('p-cite', 'You ask for three sources on a niche topic. The assistant gives three neat citations with authors, journals and years. How likely is it that all three exist?', [
          'Certain — it would not make them up',
          '✓ Not guaranteed — assistants can produce citations that look right and do not exist',
          'Impossible to fake citations',
          'They only fake them if you ask',
        ], 'In 2023 a US court sanctioned lawyers who filed a brief citing six cases a chatbot had invented (*Mata v. Avianca*). A citation is just more plausible text unless the tool actually retrieved it — and even then, check it says what is claimed.'),
      ],
      [
        read('stages', 'From autocomplete to assistant, in three steps', [
          'Assistants are built in stages on top of a pretrained model:',
        ], {
          list: [
            { term: '1 · Pretraining', text: 'Predict the next token over enormous amounts of text. Produces knowledge, fluency — and a habit of continuing documents.' },
            { term: '2 · Instruction tuning', text: 'Further training on example conversations written by people, so the model learns to answer instead of continue.' },
            { term: '3 · Human feedback', text: 'People compare pairs of answers and pick the better one; a second model learns to predict their choices, and the assistant is trained to score well with it (reinforcement learning from human feedback, **RLHF**).' },
          ],
          takeaway: 'On top sits a hidden **system prompt**: instructions from the company, given before your message, that set the assistant’s name, tone and rules.',
        }),
        read('approval', 'Sycophancy is specification gaming again', [
          'Human feedback trains the assistant toward **what people rate highly**. That is a proxy for “helpful” (Lesson 1.1), and it can be gamed: people tend to rate agreement, flattery and confident answers a little higher than awkward truths. So the assistant learns those too.',
        ]),
        read('hallucination', 'Why assistants make things up', [
          'An assistant produces the most plausible continuation. Usually plausible and true line up; sometimes they don’t, and nothing inside the model checks. That is a **hallucination**: a fluent, confident statement that is false.',
          'Training makes it worse in one specific way. A 2025 paper from OpenAI argues that because training and most benchmarks reward a confident guess over “I don’t know”, models learn to guess (Kalai et al.). Add a **knowledge cutoff** — the date its training text ends — and questions about recent, niche or very specific facts are where fabrication is most likely.',
          '**Grounding** helps: when a tool searches the web or reads documents you supply and quotes them, errors drop. They don’t vanish — it can still misread or misquote a source.',
        ], { source: 'Kalai et al. (2025), “Why Language Models Hallucinate”.' }),
        read('reasoning', '“Reasoning” models', [
          'Some newer models are trained further, with reinforcement learning on problems whose answers can be checked (maths, code), to write out long working before answering. They are much better at those tasks. They still make mistakes, and research has found that the reasoning they display is not always the real reason for their answer (Chen et al., 2025) — so treat the working as something to check, not as proof.',
        ]),
        read('human', 'Memory, and sounding human', [
          'A “memory” feature does not change the model. It saves notes about you and pastes them into the context of later chats. Delete the notes and the “memory” is gone.',
          'Assistants sound human because they were trained on human writing and tuned to a warm persona. People have read feelings into chatbots since ELIZA, a 1966 program that simply reflected users’ sentences back as questions — its creator, Joseph Weizenbaum, was alarmed at how quickly people confided in it. Fluent language is evidence of training, not of understanding or feeling.',
        ]),
        sort('a-causes', 'What in the way assistants are built best explains each behaviour?', [['pre', 'Pretraining: plausible text'], ['fb', 'Human feedback: approval'], ['sys', 'System prompt'], ['ctx', 'Context and memory']], [
          ['Invents a citation for a real-sounding study', 'pre'],
          ['Changes its answer when you push back confidently', 'fb'],
          ['Introduces itself with a product name and refuses to discuss certain topics', 'sys'],
          ['“Remembers” your name from a chat last week', 'ctx'],
          ['Forgets a detail from the start of a very long conversation', 'ctx'],
          ['Tells you your weak essay is “excellent and compelling”', 'fb'],
        ], 'Knowing the cause tells you the fix: check facts, hold your ground with evidence, read the settings, restate key details.'),
        mcq('a-risk', 'Which question is **most likely** to get a confident, fabricated answer?', [
          'What is the capital of Japan?',
          '✓ List three 2024 research papers on bee navigation, with authors and page numbers',
          'Explain what photosynthesis is',
          'Translate “good morning” into Spanish',
        ], 'Specific, recent, niche facts with exact details — and citations — are the classic hallucination risk. Common knowledge is far safer.'),
        mcq('a-fix', 'You need an accurate summary of a specific article. What reduces the risk of invented details most?', [
          'Tell it to be accurate',
          '✓ Give it the article’s text and ask it to quote the passages it relies on',
          'Raise the temperature',
          'Ask it the same question three times',
        ], 'Grounding the model in the actual source, and asking for quotes you can check, is the strongest simple mitigation.'),
      ],
      [
        mcq('c1', 'What does training on human preference ratings (RLHF) tend to add, besides helpfulness?', ['Perfect accuracy', '✓ A pull toward answers people like — including agreement and flattery', 'A bigger context window', 'Internet access'], 'Approval is a proxy, and proxies get gamed.'),
        mcq('c2', 'Why are hallucinations usually **confident**?', ['The model knows it is guessing and hides it', '✓ It produces fluent, plausible text either way, and training rewards guessing over saying “I don’t know”', 'Confidence is set by the user', 'Only rare models hallucinate'], 'Fluency and confidence are not signals of truth.'),
        mcq('c3', 'What is a **system prompt**?', ['Your first message', '✓ Hidden instructions from the company that set the assistant’s persona and rules', 'The model’s training data', 'An error message'], 'It sits before your message in the context.'),
        mcq('c4', 'An assistant “remembers” your favourite sport from last month. What is actually happening?', ['Its weights learned it', '✓ A saved note is being added to the conversation’s context', 'It guessed', 'It searched your social media'], 'Memory features are stored notes, not retraining.'),
        mcq('c5', 'A reasoning model shows neat step-by-step working. What should you assume?', ['The working proves the answer is right', '✓ It is often better on checkable tasks, but the working can still be wrong or not reflect how it got the answer', 'It never makes mistakes on maths', 'It is copying a human’s working'], 'Check the steps like any other claim.'),
        mcq('c6', 'Why do chatbots sound human?', ['They have feelings', '✓ They were trained on human writing and tuned to a friendly persona', 'A human types the answers', 'They are connected to a brain'], 'The ELIZA effect: fluent text invites us to imagine a mind behind it.'),
        reflect('carry', 'Carry forward: describe one chatbot behaviour you’ve seen and explain it from how assistants are trained.', { min: 30 }),
      ],
    ),
  },

  /* ── Case File 3 ────────────────────────────────────────────────────── */
  'm03-case': {
    title: 'Case File 3: Decoding Behavior',
    subtitle: 'Mixed cases from all of Part I, then the Checkpoint for your Mechanism Lens.',
    takeaway: 'Your Mechanism Lens: **What in the way it generates would produce this? Is this the plausible answer or the true one? What is in its context — and was it trained to please?**',
    tabs: [
      part('cases', 'Case File', [
        mcq('k1', '**Case A.** A classmate’s history essay, written with a chatbot, quotes a 1962 speech with a vivid line nobody can find anywhere else. Which question do you ask first?', [
          'How many parameters does the chatbot have?',
          '✓ Is this the plausible continuation or a real, retrievable quote?',
          'What was its learning rate?',
          'Was the essay too long?',
        ], 'A quote is exactly what a text predictor can produce fluently and falsely. Find the original before anyone repeats it.'),
        mcq('k2', '**Case B.** An image app, asked for “a CEO”, gives you ten pictures of men in suits. Which idea explains it?', [
          'Diffusion always produces men',
          '✓ Associations in its training images became part of what “CEO” means to it',
          'The prompt was too short',
          'A bug in the colours',
        ], 'Representation bias: the data’s pattern became the model’s default.'),
        mcq('k3', '**Case C.** You spent an hour chatting with an assistant about your project. Now it contradicts a key decision you made in the first five minutes. Why?', [
          'It changed its mind about your project',
          '✓ The early part may have fallen outside or been poorly attended in a long context — restate it',
          'It is being sycophantic',
          'Its weights were updated during the chat',
        ], 'Long contexts lose details, especially early or in the middle. Restate what matters.'),
      ]),
      part('checkpoint', 'Checkpoint', [
        mcq('q1', 'Which best describes how a chatbot writes?', ['It looks up stored answers', '✓ It repeatedly predicts a likely next token', 'It copies web pages', 'It follows hand-written rules'], 'Token by token.'),
        mcq('q2', 'Higher temperature makes a model’s answers…', ['More accurate', '✓ More varied and less predictable', 'Shorter', 'Identical every time'], 'It flattens the probabilities.'),
        mcq('q3', 'Which is an embedding-powered feature?', ['A spell checker with a word list', '✓ Searching your photos by typing “dog at the beach”', 'A calculator', 'A timer'], 'Text and images in one space.'),
        mcq('q4', 'An assistant agrees with your wrong claim after you push back. This is…', ['A hallucination', '✓ Sycophancy', 'A token quirk', 'A context-window limit'], 'Trained toward approval.'),
        mcq('q5', 'Which step turned a pretrained model into something that answers questions?', ['More pretraining', '✓ Instruction tuning on example conversations', 'A bigger context window', 'Raising the temperature'], 'Then human feedback shapes its style.'),
        mcq('q6', 'Best defence against an invented citation?', ['Ask the assistant if it is sure', '✓ Find the source yourself and check it says what is claimed', 'Use a lower temperature', 'Trust citations with page numbers'], 'Next module: checking, as a procedure.'),
      ], { graded: true }),
    ],
  },

  /* ── Part I project: Model Autopsy ──────────────────────────────────── */
  'p1-project': {
    title: 'Part I Project: Model Autopsy',
    subtitle: 'A product with two AI parts is failing. Investigate it with everything from Part I, then explain the failure in your own words — without AI.',
    takeaway: 'You can take an AI product apart: name its objective and data, question how it was tested, find where its features or its generation go wrong, and explain why — mechanically.',
    tabs: [
      part('dossier', 'The dossier', [
        read('brief', 'The case: SnapStudy', [
          '*SnapStudy* is a homework app. You photograph a worksheet; a **classifier** decides the subject (maths, biology, chemistry, history); then a **language model** writes a step-by-step explanation.',
          'The company says the classifier is “96% accurate” and the explanations are “verified by AI”. Teachers at one school have sent in complaints. Your job is to find out what is really going wrong, and why.',
          '*SnapStudy, its numbers and the complaints are invented for this project.*',
        ]),
        read('evidence', 'The evidence', [
          'Read these carefully — they are all you have.',
        ], {
          list: [
            { term: 'Complaint 1', text: 'Chemistry worksheets printed on the school’s blue-lined paper are almost always tagged “biology”.' },
            { term: 'Complaint 2', text: 'An explanation of a balancing-equations problem gave a confident, neatly formatted answer with a coefficient that is wrong, and cited “Chemistry Standards Handbook, p. 214”, which no teacher can find.' },
            { term: 'From the company', text: 'The classifier was trained on 40,000 worksheets from a partner district. That district prints biology worksheets on blue-lined paper. The “96%” was measured on 2,000 worksheets from the same district.' },
            { term: 'From the company', text: 'The app’s success metric is “explanations rated helpful” (a thumbs-up button).' },
          ],
        }),
        mcq('d1', 'What most likely explains Complaint 1?', [
          'The camera is broken',
          '✓ A shortcut: in the training data, blue-lined paper lined up with “biology”',
          'Chemistry is too hard for classifiers',
          'The learning rate was too high',
        ], 'Blue lines separated the labels in the partner district’s data. At this school, blue lines mean nothing — but the model still leans on them.'),
        mcq('d2', 'Was the “96% accurate” measured honestly for this school?', [
          'Yes — 2,000 worksheets is plenty',
          '✓ No — it was tested on the same district’s worksheets, which share the shortcut',
          'Yes — it was held-out data',
          'Accuracy cannot be measured for classifiers',
        ], 'Held out, but not independent: a test set with the same quirk as the training set cannot reveal the shortcut. Test on worksheets from other schools.'),
        mcq('d3', 'What best explains Complaint 2?', [
          'The model looked up the wrong page',
          '✓ The model produced a plausible explanation and citation; nothing in it checks that the coefficient or the handbook is real',
          'The worksheet was mislabelled',
          'A teacher poisoned the model',
        ], 'Plausible continuation, a confident format, and an invented source — the hallucination pattern from Lesson 3.3.'),
        mcq('d4', 'How might “explanations rated helpful” make Complaint 2 more likely?', [
          'It can’t — ratings only improve quality',
          '✓ Students tend to thumbs-up confident, tidy answers, so the app is pushed toward confidence over checked correctness',
          'Ratings slow the model down',
          'Ratings change the paper colour',
        ], 'A proxy (thumbs-up) standing in for the goal (correct help) — the objective thread from Lesson 1.1.'),
        sim('s-evidence', 'next-token', { title: 'Evidence: plausible is not true', task: 'Write a few sentences at a normal temperature. Notice that every word is likely — and that nothing checks whether the sentence is true.', goal: 'generate', props: { mode: 'watch' }, hint: 'Write at least once to continue.' }),
      ]),
      part('explain', 'Your autopsy', [
        compose('autopsy', 'Write the autopsy — in your own words, without AI', [
          ['objective', 'Objective and proxy', 'What is SnapStudy optimizing, and what does it measure instead?', 20],
          ['data', 'The data problem', 'What in the classifier’s training data caused Complaint 1?', 20],
          ['test', 'The testing problem', 'Why didn’t the 96% reveal it?', 20],
          ['generate', 'The generation problem', 'Explain Complaint 2 from how language models produce text.', 30],
          ['fix', 'Two fixes', 'One for the classifier’s data, one for the explanations.', 20],
        ], { noAI: true, help: 'Your Field Journal keeps this. The capstone will ask you to reread it.' }),
        read('rubric', 'Check your autopsy against the rubric', [
          'Real projects are judged on four things. Read your answer against each.',
        ], {
          list: [
            { term: 'Accuracy of reasoning', text: '**Secure** names the shortcut (blue lines ↔ biology) and the proxy (thumbs-up ↔ correct help) exactly.' },
            { term: 'Quality of evidence', text: '**Secure** points to the specific complaint or company fact behind each claim.' },
            { term: 'Clarity', text: '**Secure** explains the mechanism so a classmate who skipped Part I would follow it.' },
            { term: 'Honesty about limits', text: '**Secure** says what you still don’t know — for example, how the explanations are “verified”.' },
          ],
        }),
        reflect('self', 'Which of the four criteria is your autopsy weakest on, and what would you add?', { min: 20 }),
      ]),
    ],
  },
}
