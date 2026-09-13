/* ═══════════════════════════════════════════════════════════════════════════
   tsaEvent.js — THE TSA WEBMASTER EVENT DESCRIPTION, WORD FOR WORD
   ---------------------------------------------------------------------------
   The event description and the 2026–27 theme, quoted exactly so the About
   page's compliance section states the prompt in TSA's own words. Only the
   description and theme belong here — not deadlines, submission steps or
   example entries.

   Do not edit the wording. If TSA revises the prompt, replace it wholesale.
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
}
