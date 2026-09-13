/* ═══════════════════════════════════════════════════════════════════════════
   tsaEvent.js — THE TSA WEBMASTER EVENT PAGE, WORD FOR WORD
   ---------------------------------------------------------------------------
   Reproduced exactly as published for the 2026–27 Webmaster event, so the
   compliance section on the About page quotes the requirements rather than
   paraphrasing them. Only layout characters (zero-width joiners and runs of
   spaces used for alignment on the source page) have been left out.

   Do not edit the wording here. If TSA revises the event page, replace the
   text wholesale and re-check the requirement ledger in AboutPage.jsx.
   ═══════════════════════════════════════════════════════════════════════════ */

export const TSA_EVENT_URL = 'https://tsaweb.org/competitions-programs/tsa/themes-problems'

export const TSA_EVENT = {
  description: {
    heading: 'Description',
    /* The one link in the paragraph sits on "annual design topic". */
    before: 'Participants design, build, and launch a website that features the chapter’s ability to research and present a given topic pertaining to technology. Semifinalists participate in an onsite interview to demonstrate the knowledge and expertise gained during the development of the website—with an emphasis on web design methods and practices, as well as their research for the ',
    linkText: 'annual design topic',
    linkHref: TSA_EVENT_URL,
    after: '.',
  },
  theme: '2026-27 Theme: Artificial Intelligence (AI) learning portal',
  challenge: 'Challenge: You have been tasked with designing and developing an interactive Artificial Intelligence (AI) learning portal aimed at high school students (grades 9–12). The purpose of this site is to demystify AI by providing a foundational understanding of the technology, showcasing practical tools, and teaching techniques to leverage AI effectively and ethically in an academic setting.',
  mustIncludeLead: 'Your website must include the following:',
  mustInclude: [
    {
      term: 'Educational  Content Modules:',
      text: 'At least three distinct learning sections covering fundamental AI concepts, practical AI tools/techniques, and ethical AI usage',
    },
    {
      term: 'Gamification & Progress Tracking:',
      text: 'An interactive, gamified user interface (e.g., digital badges, experience points, or a progress dashboard) designed to engage students and visually track their completion of the learning modules.',
    },
  ],
  caption: 'Bothell HS, Team 1, 2026 1st Place',
  resources: {
    heading: 'Event Resources',
    examplesHeading: 'EVENT EXAMPLES',
    examplesLead: 'Click on the links to the right to view past entries for this event!',
    examples: [
      { label: '2025 Nationals 1st Place: Website', href: 'https://maitso.vercel.app/' },
      { label: '2026 State 1st Place Winner: Website', href: 'https://roots-and-routes-bothell.vercel.app/' },
    ],
  },
  deadlines: {
    heading: 'Event Deadlines',
    date: 'January 21, 2027',
    lines: [
      'Students will need their Participant ID number, and password, from their advisor. Only the team captain will be able to upload the file.',
      'Students submit link to website for scoring. Website must contain a minimum of 3 completed pages, following the annual theme.',
      'Pages must be separate pages (not just a scroll down option), linked from the home page.',
    ],
  },
}
