/* ============================================================
   Hue & You — data.js
   Guardians, book quotes, challenge content, personality data.
   ============================================================ */

const DATA = {};

/* ----------------------------------------------------------
   The four guardians. Each one:
   - lives in one quadrant of the map (zone)
   - shares a quote from a different fictional book
   - runs one challenge about being yourself
   Zones: 0 = NW Woods, 1 = NE Village, 2 = SW Garden, 3 = SE Meadow
---------------------------------------------------------- */
DATA.guardians = [
  {
    id: "mira",
    zone: 0,
    name: "Mira the Cat",
    sprite: "cat",
    crystal: { name: "Crystal of Paths", color: [94, 201, 106], glow: "#5ec96a" },
    challenge: "maze",
    intro: [
      "Mrrrow… a splash of color, walking through my gray woods? You must be {name}.",
      "These trees were emerald once. They faded when everyone began walking the exact same trail, single file, day after day.",
      "An old story I love says it best…"
    ],
    quote: {
      text: "“Would you tell me, please, which way I ought to go from here?” — “That depends a good deal on where you want to get to,” said the Cat.",
      book: "Alice's Adventures in Wonderland",
      author: "Lewis Carroll"
    },
    lessonIntro: "The hedge maze ahead has many ways through. There is no single correct path — only the one YOU choose. Show me how {name} finds the way.",
    farewell: "You walked it your way — that is all the Crystal of Paths ever asks. Look! The woods remember their green!",
    lesson: "There are many paths in life. The right one is the one you choose for yourself.",
    doneLine: "The woods are green again thanks to you. Walk your own trail, always, {name}."
  },
  {
    id: "orin",
    zone: 1,
    name: "Orin the Owl",
    sprite: "owl",
    crystal: { name: "Crystal of Choice", color: [255, 94, 94], glow: "#ff5e5e" },
    challenge: "color",
    intro: [
      "Hoo! Welcome to Gray Harbor Village, {name}. I am Orin, keeper of the old library.",
      "Once, every door and window here was painted a different cheerful color. Then folks started copying the most popular choice… until every wall matched, and the color drained away.",
      "A wise book in my library puts it like this…"
    ],
    quote: {
      text: "It is our choices, Harry, that show what we truly are, far more than our abilities.",
      book: "Harry Potter and the Chamber of Secrets",
      author: "J.K. Rowling"
    },
    lessonIntro: "So tell me, {name} — if you could repaint this village, which color would YOU pick? Not the crowd. You.",
    farewell: "A choice made from the heart! The Crystal of Choice is yours — and look, the village glows again!",
    lesson: "Your choices show who you truly are. Make them for yourself, not for the crowd.",
    doneLine: "The village shines with honest choices now. Keep choosing like that, {name}."
  },
  {
    id: "pip",
    zone: 2,
    name: "Pip the Songbird",
    sprite: "bird",
    crystal: { name: "Crystal of Voice", color: [77, 163, 255], glow: "#4da3ff" },
    challenge: "quiz",
    intro: [
      "Cheep! A visitor — and a colorful one! Hello {name}, I'm Pip. This garden used to bloom in every shade.",
      "The flowers faded when people stopped sharing what they loved. Everyone claimed the same hobbies, the same dreams, the same favorite song… so the garden forgot how to bloom.",
      "My favorite storybook says it better than I ever could…"
    ],
    quote: {
      text: "Today you are You, that is truer than true. There is no one alive who is Youer than You.",
      book: "Happy Birthday to You!",
      author: "Dr. Seuss"
    },
    lessonIntro: "The Crystal of Voice only wakes when someone speaks honestly about themselves. May I ask you a few little questions, {name}? Answer with YOUR truth — not what sounds impressive.",
    farewell: "Your honest voice — that's the magic! The garden hears you, {name}. Watch it bloom!",
    lesson: "No one else can be you. What you love and what you're good at are worth saying out loud.",
    doneLine: "The flowers bloom for your honest voice, {name}. Never go quiet about what you love."
  },
  {
    id: "chroma",
    zone: 3,
    name: "Chroma the Chameleon",
    sprite: "chameleon",
    crystal: { name: "Crystal of Expression", color: [176, 107, 255], glow: "#b06bff" },
    challenge: "style",
    intro: [
      "Ah! {name}! Finally, someone who hasn't gone gray. I'm Chroma — a chameleon who refuses to blend in. Ironic, I know.",
      "This meadow was my open-air studio. When people grew afraid to look different, they dressed identically, walked identically, even smiled identically… and my colors faded with theirs.",
      "There's a line from a book that I painted above my easel…"
    ],
    quote: {
      text: "You can't blend in when you were born to stand out.",
      book: "Wonder",
      author: "R.J. Palacio"
    },
    lessonIntro: "The Crystal of Expression wakes for anyone brave enough to be seen. Step up to my easel, {name} — design a look that feels like YOU. Not 'normal'. Not 'popular'. You.",
    farewell: "Magnifique! That look could belong to no one else! The crystal — and the meadow — burst back to life!",
    lesson: "You were born to stand out. Expressing yourself is a gift to the world, not a risk.",
    doneLine: "The meadow is my canvas again, {name} — and you are a masterpiece of your own making."
  }
];

/* ----------------------------------------------------------
   Personality traits & archetypes ("what person you are").
   Every challenge answer adds points to one or more traits.
---------------------------------------------------------- */
DATA.traitNames = ["bold", "creative", "thoughtful", "kind", "curious", "joyful"];

DATA.archetypes = {
  bold: {
    name: "The Bold Trailblazer",
    icon: "🔥",
    desc: "You lead with courage. You make decisions with your whole heart, walk straight toward what you want, and you aren't afraid to go first. People feel braver just standing next to you — because you show them that being yourself takes guts, and that it's worth it."
  },
  creative: {
    name: "The Creative Spirit",
    icon: "🎨",
    desc: "You see the world as a canvas. Where others copy, you invent; where others blend in, you add a color nobody expected. Your imagination is your superpower — and every time you express it, you remind the world that different is beautiful."
  },
  thoughtful: {
    name: "The Thoughtful Dreamer",
    icon: "🌙",
    desc: "You notice what others miss. You think deeply, choose carefully, and stay true to your own quiet compass even when the crowd is loud. Your calm, honest way of being yourself proves that you don't have to shout to stand out."
  },
  kind: {
    name: "The Kind Heart",
    icon: "💛",
    desc: "You make people feel safe to be themselves. Your strength is empathy — you listen, you encourage, and you celebrate what makes each person different. Kindness like yours is rare, and it colors every room you walk into."
  },
  curious: {
    name: "The Curious Explorer",
    icon: "🧭",
    desc: "You take the winding path on purpose. You ask the questions nobody thought to ask, explore corners nobody else visits, and collect wonders along the way. Your curiosity keeps the world interesting — never trade it for a straight, gray line."
  },
  joyful: {
    name: "The Joyful Spark",
    icon: "☀️",
    desc: "You bring the light. Your laughter, energy, and honest delight in the things you love are contagious. In a world tempted to go gray, people like you are walking proof that showing your true colors makes everyone's day brighter."
  }
};

/* ----------------------------------------------------------
   Color challenge (Orin) — pick YOUR favorite, not the popular one.
---------------------------------------------------------- */
DATA.colors = [
  { name: "Flame Red",      hex: "#e84a4a", trait: "bold" },
  { name: "Sunset Orange",  hex: "#f2913d", trait: "curious" },
  { name: "Sunshine Yellow",hex: "#f5d442", trait: "joyful" },
  { name: "Meadow Green",   hex: "#56b65f", trait: "kind" },
  { name: "Ocean Blue",     hex: "#4a90e2", trait: "thoughtful", popular: true },
  { name: "Royal Purple",   hex: "#9b59d0", trait: "creative" },
  { name: "Blossom Pink",   hex: "#ef7fb2", trait: "kind" },
  { name: "Teal Tide",      hex: "#35b8a5", trait: "thoughtful" }
];

/* ----------------------------------------------------------
   Style challenge (Chroma) — customization options.
---------------------------------------------------------- */
DATA.hairStyles = [
  { id: "short", label: "Short & Tidy" },
  { id: "spiky", label: "Spiky" },
  { id: "long",  label: "Long & Flowing" },
  { id: "curly", label: "Curly Cloud" }
];

DATA.hairColors = ["#3b2a20", "#e8b04b", "#c94f2e", "#222831", "#b06bff", "#3fa7d6", "#e84a8a", "#56b65f"];

DATA.outfitColors = ["#e84a4a", "#f2913d", "#f5d442", "#56b65f", "#4a90e2", "#9b59d0", "#ef7fb2", "#35b8a5"];

DATA.accessories = [
  { id: "none",    label: "No accessory", trait: "thoughtful" },
  { id: "cape",    label: "Hero Cape",    trait: "bold" },
  { id: "scarf",   label: "Cozy Scarf",   trait: "kind" },
  { id: "glasses", label: "Round Glasses",trait: "thoughtful" },
  { id: "hat",     label: "Party Hat",    trait: "joyful" },
  { id: "star",    label: "Star Badge",   trait: "creative" }
];

/* ----------------------------------------------------------
   Quiz challenge (Pip) — interests & strengths.
---------------------------------------------------------- */
DATA.quiz = [
  {
    q: "A whole free afternoon appears out of nowhere. What do you do with it?",
    options: [
      { text: "Make something — draw, build, write, invent.", trait: "creative",  tag: "making things" },
      { text: "Explore somewhere I've never been before.",    trait: "curious",   tag: "exploring" },
      { text: "Curl up and learn about something fascinating.", trait: "thoughtful", tag: "learning new things" },
      { text: "Find my friends and make someone's day better.", trait: "kind",    tag: "being with people I care about" }
    ]
  },
  {
    q: "Which of these feels most like your true strength?",
    options: [
      { text: "My imagination — I see possibilities everywhere.", trait: "creative",   tag: "imagination" },
      { text: "My courage — I'll try things even when they're scary.", trait: "bold",  tag: "courage" },
      { text: "My empathy — I really listen and understand people.", trait: "kind",    tag: "empathy" },
      { text: "My curiosity — I never stop asking questions.",    trait: "curious",    tag: "curiosity" }
    ]
  },
  {
    q: "When do you feel most like YOURSELF?",
    options: [
      { text: "When I make people laugh until they snort.", trait: "joyful",     tag: "making people laugh" },
      { text: "When I take the lead and others follow.",    trait: "bold",       tag: "leading the way" },
      { text: "When I have quiet time with my own thoughts.", trait: "thoughtful", tag: "quiet thinking time" },
      { text: "When I'm trying something nobody around me has tried.", trait: "curious", tag: "trying new things" }
    ]
  }
];

/* Maze flavor — how the player moved through Mira's maze. */
DATA.mazeStyles = {
  direct:   { label: "the straight, fearless line", trait: "bold" },
  explorer: { label: "the winding explorer's trail, sparks and all", trait: "curious" },
  steady:   { label: "the calm, careful route", trait: "thoughtful" }
};
