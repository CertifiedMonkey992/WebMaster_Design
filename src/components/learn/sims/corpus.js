/* ═══════════════════════════════════════════════════════════════════════════
   corpus.js — THE TEXT THE COURSE'S LANGUAGE MODELS LEARN FROM
   ---------------------------------------------------------------------------
   Two small corpora, written for LunX. Real models learn from trillions of
   words scraped from the web; these are a few hundred, so a learner can see
   exactly what the model saw.

   SCHOOL_TEXT trains the next-word model and the tokenizer (Lesson 3.1).

   MEANING_TEXT trains the word embeddings (Lesson 3.2) and, through them,
   the résumé screener audited in Lesson 5.2 and 6.2. It is skewed ON
   PURPOSE in one way: some jobs appear with "he" more often and some with
   "she", the way real web text is skewed (Bolukbasi et al., 2016; Caliskan
   et al., 2017). The lessons say so when they use it — the point is to see
   an association in data become geometry in a model.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SCHOOL_TEXT = `
the bus was late this morning so the class started late .
the bus was full this morning so i walked to school .
the class started with a quiz on the reading .
the class started with a video about volcanoes .
the teacher said the quiz would be short .
the teacher said the test would be on friday .
the teacher said the homework was due on monday .
the test was on friday and it was hard .
the test was on cells and it was fair .
the quiz was short and it was easy .
the homework was due on monday but i finished it early .
i finished the homework on sunday night .
i finished the reading on the bus .
we ate lunch in the cafeteria with our friends .
we ate lunch outside because the sun was out .
we ate pizza in the cafeteria after the game .
the game was on friday night and we won .
the game was close but we lost .
after school i went to the library to study .
after school i went to practice until six .
at the library i read a book about space .
at the library i found a book about volcanoes .
the book about space was long but good .
the science fair is next week in the gym .
the science fair project was about plants .
my project was about plants and light .
my project was about bees and flowers .
the bees visit the flowers in the school garden .
strawberries grow in the school garden in june .
we picked strawberries in the garden after class .
a strawberry is red and sweet .
the straw hats hang in the garden shed .
the rain fell all morning so the game was moved .
the rain fell all night and the field was wet .
the sun was out so we ate lunch outside .
the class read a story about a lost dog .
the dog in the story found its way home .
the story was about a dog and a girl .
the girl in the story walked to school .
i walked to school with my friend .
my friend and i walked to the library .
my friend said the test was hard .
my friend said the quiz was easy .
the teacher gave us extra time on the test .
the teacher gave us a short quiz on friday .
`

export const MEANING_TEXT = `
the dog ran across the park . the puppy ran across the yard .
my dog barked at the door . my puppy barked at the door .
a dog needs a walk every day . a puppy needs a walk every day .
the dog chased the ball . the puppy chased the ball .
the dog ate its food . the puppy ate its food . the cat ate its food .
the cat slept on the warm couch . the kitten slept on the warm bed .
a cat chased the mouse . a kitten chased the string .
the horse ran across the field . the wolf ran across the snow .
the wolf howled at night . the dog howled at night .
we ate pizza for lunch . we ate soup for lunch . we ate pasta for lunch .
she ate an apple for a snack . he ate a banana for a snack .
the pizza was hot and cheesy . the soup was hot and salty . the pasta was hot and fresh .
i cooked pasta for dinner . i cooked soup for dinner . i baked bread for dinner .
fresh bread from the bakery . a fresh apple from the market . a ripe banana from the market .
heavy rain fell all morning . heavy snow fell all night .
bring an umbrella for the rain . bring a coat for the snow .
the storm brought rain and wind . the storm brought snow and wind .
a sunny day with no clouds . a cloudy day with some rain .
the wind blew all night . the rain fell all night .
the math test covers algebra . the biology test covers cells . the history test covers the war .
we studied math in class . we studied biology in class . we studied history in class .
homework for math is due friday . homework for biology is due monday . homework for history is due tuesday .
the biology lab uses microscopes . the chemistry lab uses beakers .
the doctor said he would call . the doctor said he was busy . the doctor checked his notes .
the doctor said she would call . the doctor worked at the hospital .
the nurse said she would help . the nurse said she was busy . the nurse checked her chart .
the nurse said he would help . the nurse worked at the hospital .
the engineer said he fixed the bridge . the engineer explained his design . the engineer said he tested the design .
the engineer said she tested the design . the engineer built the bridge .
the pilot said he was ready . the pilot checked his map . the pilot flew the plane .
the pilot said she was ready .
the librarian said she found the book . the librarian checked her list . the librarian said she was busy .
the librarian said he found the book . the librarian sorted the books .
the teacher said he graded the test . the teacher said she graded the test .
the teacher checked his notes . the teacher checked her notes .
greg said he would help . greg finished his project . greg said he was ready .
emily said she would help . emily finished her project . emily said she was ready .
`

export const SEARCH_DOCS = [
  { id: 'd1', text: 'my puppy barked at the door all morning' },
  { id: 'd2', text: 'bring a coat because heavy snow is coming' },
  { id: 'd3', text: 'we cooked pasta and soup for dinner' },
  { id: 'd4', text: 'the biology test covers cells and microscopes' },
  { id: 'd5', text: 'the kitten slept on the warm couch' },
  { id: 'd6', text: 'the storm brought wind and rain to the park' },
  { id: 'd7', text: 'fresh bread and a ripe banana from the market' },
  { id: 'd8', text: 'homework for history is due tuesday' },
]
