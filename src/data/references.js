/* ═══════════════════════════════════════════════════════════════════════════
   references.js — WHAT THE ABOUT PAGE'S REFERENCES SECTION SAYS
   ---------------------------------------------------------------------------
   The work log, the copyright checklist, the code stack, the research the
   lessons cite and the work that shaped LunX's design. Kept as data so the
   page only lays it out.

     WORK_LOG       milestones from the project's git history (Aug 31 →),
                    grouped by the days the work happened
     CHECKLIST      the copyright checklist, one claim per row, each true
     TOOLS          everything the site is built, tested or hosted with
     RESEARCH       the sources lessons cite under their answers — the same
                    `source` lines as data/course/, with full titles and links
                    (every link checked 2026-11-05)
     INSPIRATIONS   what we studied, and what we took from each

   `module` is a module's number in the course (1–7); the page reads its title
   from data/learnData.js. `connected` marks a row that is true only of a
   build with a LunX server.
   ═══════════════════════════════════════════════════════════════════════════ */

export const WORK_LOG = [
  {
    date: '2026-08-31',
    title: 'First build',
    text: 'A React and Vite project with a landing page and the first outline of an AI course for grades 9–12.',
  },
  {
    date: '2026-09-02',
    title: 'The course path and the lesson screen',
    text: 'A module path to walk through and a lesson window that asks one question at a time. The same day we tried black and white, indigo and cyan, a glowing chip in the hero and a dark theme — and liked none of them.',
  },
  {
    date: '2026-09-04',
    end: '2026-09-05',
    title: 'Progression',
    text: 'XP, levels, gems, hearts, streaks, daily and weekly quests, badges and a working shop, all in one reducer with its own tests. The landing page was rebuilt around the real product instead of pictures of it.',
  },
  {
    date: '2026-09-12',
    title: 'LunX becomes a field guide',
    text: 'We dropped the dark “AI look” for warm paper, an evergreen structure color, one terracotta accent, Fraunces and Manrope — and wrote the design system down (philosophy, tokens, components, motion, anti-patterns) before changing any more code.',
  },
  {
    date: '2026-09-12',
    end: '2026-09-15',
    title: 'Motion, the About page and the compliance statement',
    text: 'Timing tiers and a small set of named motions; the clothbound field guide on the front page; this page and the TSA compliance statement. Every page got its own address and passed the W3C validator.',
  },
  {
    date: '2026-09-19',
    end: '2026-09-20',
    title: 'Review and repair',
    text: 'A second team member reviewed the whole product and fixed what they found: lost progress, economy loopholes, accessibility, navigation and phone layouts. Tests got a fixed clock and run in two time zones, and GitHub Actions now builds and publishes the site. A reviewer account was added so judges can open everything.',
  },
  {
    date: '2026-09-25',
    title: 'The course, rebuilt',
    text: 'Three Parts — Understand AI, Use AI Well, Use AI Responsibly — seven modules and twenty-one lessons, with simulations that train real models in the browser.',
  },
  {
    date: '2026-10-08',
    end: '2026-10-09',
    title: 'Simpler',
    text: 'Accounts became required, with hashed passwords. A daily spin with published odds replaced the seven-day bonus, every lesson became Learn then Check, and a first-visit title sequence was cut.',
  },
  {
    date: '2026-10-12',
    end: '2026-10-14',
    title: 'The LunX server',
    text: 'A small Node server with a built-in database: accounts that follow you between devices, weekly leagues, friends, challenges, reset emails and moderation. It runs on Oracle Cloud’s free tier.',
  },
  {
    date: '2026-10-30',
    end: '2026-11-04',
    title: 'The home page, again',
    text: 'A clearer home page, built around one way into the course, with the field guide back in the hero. A monochrome redesign was built and set aside in favor of the warm one. The share image and page descriptions were brought up to date with the course.',
  },
  {
    date: '2026-11-05',
    title: 'References',
    text: 'This section: the work log, the copyright checklist, the stack, the research and the inspirations, all on one page.',
  },
]

export const CHECKLIST = [
  { item: 'Layouts, styles and components', status: 'Written for LunX. No template, theme, UI kit or CSS framework.' },
  { item: 'Images and icons', status: 'Inline SVG drawn for LunX. No stock photographs, clip art or icon library.' },
  { item: 'Share image', status: 'Rendered from one of our own pages.' },
  { item: 'Typefaces', status: 'Fraunces, Manrope and JetBrains Mono, under the SIL Open Font License 1.1, served by Google Fonts.' },
  { item: 'Code libraries', status: 'React and React DOM, under the MIT License — the only code the site ships that we did not write.' },
  { item: 'Course text', status: 'Written for LunX. Findings and figures name their source under the answer, and every source is listed below.' },
  { item: 'Simulation data', status: 'Generated in the browser. Simulations that only illustrate are labeled as illustrative.' },
  { item: 'TSA material', status: 'The event description and theme are quoted word for word, with a link to TSA.' },
  { item: 'Trademarks', status: 'Products named in the course belong to their owners. LunX is not affiliated with or endorsed by them.' },
  { item: 'Design references', status: 'Studied for principles (listed under Inspirations). No code, artwork or text was copied from them.' },
  { item: 'AI assistance', status: 'Claude Code (Anthropic) was our coding assistant. Commits it helped write say so in the project’s history.' },
]

/* `kind`: 'site' ships to the reader; 'build' makes or checks the site;
   'host' serves it. */
export const TOOLS = [
  { name: 'React 18', kind: 'site', role: 'Builds the interface out of components.', licence: 'MIT License' },
  { name: 'Vite 5', kind: 'build', role: 'Development server and the build that writes the published site.', licence: 'MIT License' },
  { name: 'Google Fonts', kind: 'site', role: 'Serves Fraunces, Manrope and JetBrains Mono.', licence: 'SIL Open Font License 1.1' },
  { name: 'ESLint and TypeScript', kind: 'build', role: 'Check the code for mistakes before it is committed. TypeScript only checks; the site is plain JavaScript.', licence: 'MIT License · Apache 2.0' },
  { name: 'Node.js', kind: 'host', role: 'Runs the LunX server with its own http, sqlite and crypto modules — no packages.', licence: 'MIT License', connected: true },
  { name: 'Oracle Cloud Free Tier', kind: 'host', role: 'The machine the LunX server runs on.', licence: 'Hosting service', connected: true },
  { name: 'GitHub and GitHub Pages', kind: 'host', role: 'Version control, the issue tracker behind the contact form, and hosting. GitHub Actions builds and publishes every change.', licence: 'Hosting service' },
  { name: 'W3C validators and PageSpeed Insights', kind: 'build', role: 'Checked the markup, the stylesheets, speed and accessibility.', licence: 'Free web services' },
  { name: 'Claude Code', kind: 'build', role: 'AI coding assistant by Anthropic, used throughout the build.', licence: 'Commercial service' },
]

export const RESEARCH = [
  { cite: 'Clark & Amodei (2016)', title: 'Faulty reward functions in the wild', where: 'OpenAI', url: 'https://openai.com/index/faulty-reward-functions/', module: 1 },
  { cite: 'Ribeiro, Singh & Guestrin (2016)', title: '“Why Should I Trust You?”: Explaining the Predictions of Any Classifier', where: 'KDD 2016', url: 'https://arxiv.org/abs/1602.04938', module: 1 },
  { cite: 'Eykholt et al. (2018)', title: 'Robust Physical-World Attacks on Deep Learning Visual Classification', where: 'CVPR 2018', url: 'https://arxiv.org/abs/1707.08945', module: 2 },
  { cite: 'Bolukbasi et al. (2016)', title: 'Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings', where: 'NeurIPS 2016', url: 'https://arxiv.org/abs/1607.06520', module: 3 },
  { cite: 'Diel et al. (2024)', title: 'Human performance in detecting deepfakes: A systematic review and meta-analysis of 56 papers', where: 'Computers in Human Behavior Reports', url: 'https://doi.org/10.1016/j.chbr.2024.100538', module: 3 },
  { cite: 'Sharma et al. (2023)', title: 'Towards Understanding Sycophancy in Language Models', where: 'arXiv', url: 'https://arxiv.org/abs/2310.13548', module: 3 },
  { cite: 'Bastani et al. (2025)', title: 'Generative AI without guardrails can harm learning: Evidence from high school mathematics', where: 'Proceedings of the National Academy of Sciences', url: 'https://doi.org/10.1073/pnas.2422633122', module: 4 },
  { cite: 'Dell’Acqua et al. (2023)', title: 'Navigating the Jagged Technological Frontier', where: 'Harvard Business School and BCG', url: 'https://doi.org/10.2139/ssrn.4573321', module: 4 },
  { cite: 'Buolamwini & Gebru (2018)', title: 'Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification', where: 'Proceedings of Machine Learning Research', url: 'https://proceedings.mlr.press/v81/buolamwini18a.html', module: 5 },
  { cite: 'OWASP (2025)', title: 'Top 10 for LLM Applications', where: 'OWASP Gen AI Security Project', url: 'https://genai.owasp.org/llm-top-10/', module: 5 },
  { cite: 'Common Sense Media (2025)', title: 'Talk, Trust, and Trade-Offs: How and Why Teens Use AI Companions', where: 'Common Sense Media', url: 'https://www.commonsensemedia.org/research/talk-trust-and-trade-offs-how-and-why-teens-use-ai-companions', module: 6 },
  { cite: 'FBI (December 2024)', title: 'Criminals Use Generative Artificial Intelligence to Facilitate Financial Fraud', where: 'Internet Crime Complaint Center', url: 'https://www.ic3.gov/PSA/2024/PSA241203', module: 6 },
  { cite: 'Fang et al. (2025)', title: 'How AI and Human Behaviors Shape Psychosocial Effects of Extended Chatbot Use', where: 'MIT Media Lab and OpenAI', url: 'https://arxiv.org/abs/2503.17473', module: 6 },
  { cite: 'Kleinberg, Mullainathan & Raghavan (2016)', title: 'Inherent Trade-Offs in the Fair Determination of Risk Scores', where: 'arXiv', url: 'https://arxiv.org/abs/1609.05807', module: 6 },
  { cite: 'Chouldechova (2017)', title: 'Fair prediction with disparate impact', where: 'Big Data', url: 'https://arxiv.org/abs/1610.07524', module: 6 },
  { cite: 'Liang et al. (2023)', title: 'GPT detectors are biased against non-native English writers', where: 'Patterns', url: 'https://doi.org/10.1016/j.patter.2023.100779', module: 6 },
  { cite: 'TAKE IT DOWN Act (2025)', title: 'S. 146, 119th Congress', where: 'Congress.gov', url: 'https://www.congress.gov/bill/119th-congress/senate-bill/146', module: 6 },
  { cite: 'NCMEC', title: 'Take It Down', where: 'National Center for Missing & Exploited Children', url: 'https://takeitdown.ncmec.org/', module: 6 },
  { cite: 'Google (2025)', title: 'Measuring the environmental impact of delivering AI at Google Scale', where: 'arXiv', url: 'https://arxiv.org/abs/2508.15734', module: 7 },
  { cite: 'International Energy Agency (2025)', title: 'Energy and AI', where: 'IEA', url: 'https://www.iea.org/reports/energy-and-ai', module: 7 },
  { cite: 'Mitchell et al. (2019)', title: 'Model Cards for Model Reporting', where: 'FAT* 2019', url: 'https://arxiv.org/abs/1810.03993', module: 7 },
]

/* Standards we built against, beside the research. */
export const STANDARDS = [
  { cite: 'W3C (2023)', title: 'Web Content Accessibility Guidelines 2.2 — Quick Reference', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
  { cite: 'TSA (2026)', title: 'Themes and Problems, 2026–27', url: 'https://tsaweb.org/competitions-programs/tsa/themes-problems' },
]

export const INSPIRATIONS = [
  {
    name: 'Printed field guides',
    took: 'The idea behind everything: a book you carry to identify what you see. Numbered chapters, catalogue cards, plates and a colophon instead of dashboards and glowing screens.',
  },
  {
    name: 'Duolingo',
    url: 'https://www.duolingo.com/',
    took: 'The habit loop — short lessons on a path, hearts, streaks, gems, quests and weekly leagues — and a home page that leads to one action.',
  },
  {
    name: 'Maitso',
    url: 'https://maitso.vercel.app/',
    took: 'A flat navigation bar with a serif wordmark and no shadows; and the shape of this References section.',
  },
  {
    name: 'Roots & Routes',
    took: 'A warm paper ground instead of white, forest-green ink, and a single terracotta italic for emphasis.',
  },
]
