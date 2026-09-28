import type { Question } from "./types";

// Grade 6 English Language Arts — NC Standard Course of Study (2017), as taught in WCPSS.

const BLUE_LIGHT = `Maya pressed her face to the rover's frosted window. Behind her, the crew laughed and swapped stories, but she barely heard them. Somewhere past the gray ridge was the old base where her grandfather had worked for thirty years. "You'll know it when you see the blue light," he had told her. Now, as the rover crested the hill, a faint blue glow blinked on the horizon, and Maya's eyes filled with tears she did not bother to wipe away.`;

const FOOTPRINTS = `The Moon has no atmosphere to protect it. Without air, there is no wind or rain to wear down its surface, so footprints left by astronauts in 1969 may last for millions of years. However, the lack of an atmosphere also means tiny meteoroids strike the surface constantly. Over time, these impacts slowly grind rock into a fine, powdery dust called regolith.`;

export const ela6: Question[] = [
  // ---- Reading Literature (passage) ----
  {
    id: "e-rl-1", subject: "ela", standard: "RL.6.1", skill: "Citing text evidence",
    passage: BLUE_LIGHT,
    prompt: "Which detail best shows that Maya feels a strong connection to her grandfather?",
    choices: [
      "Maya's eyes filled with tears she did not bother to wipe away.",
      "The crew laughed and swapped stories.",
      "Maya pressed her face to the frosted window.",
      "The rover crested the hill.",
    ], answer: 0,
    explanation: "Her emotional reaction to seeing his old base is the strongest evidence of her feelings.",
  },
  {
    id: "e-rl-2", subject: "ela", standard: "RL.6.4", skill: "Word meaning in context",
    passage: BLUE_LIGHT,
    prompt: "As used in the passage, what does \"crested\" most likely mean?",
    choices: ["Reached the top of", "Slid down", "Went around", "Stopped beside"], answer: 0,
    explanation: "After cresting the hill, Maya can see the horizon — the rover reached the top.",
  },
  {
    id: "e-rl-3", subject: "ela", standard: "RL.6.2", skill: "Theme & summary",
    passage: BLUE_LIGHT,
    prompt: "Which theme is best supported by the passage?",
    choices: [
      "Family memories can give a place special meaning.",
      "Space travel is dangerous.",
      "Hard work always pays off.",
      "It is important to listen to the crew.",
    ], answer: 0,
    explanation: "The blue light matters to Maya only because of her grandfather's words and work there.",
  },
  {
    id: "e-rl-4", subject: "ela", standard: "RL.6.3", skill: "Plot & character",
    passage: BLUE_LIGHT,
    prompt: "Why does Maya barely hear the crew?",
    choices: [
      "She is focused on finding her grandfather's old base.",
      "The rover is too loud.",
      "She is angry at the crew.",
      "She is asleep.",
    ], answer: 0,
    explanation: "The next sentence explains her attention is on what lies past the ridge.",
  },

  // ---- Reading Informational Text (passage) ----
  {
    id: "e-ri-1", subject: "ela", standard: "RI.6.2", skill: "Central idea",
    passage: FOOTPRINTS,
    prompt: "What is the central idea of the passage?",
    choices: [
      "The Moon's lack of atmosphere shapes its surface in more than one way.",
      "Astronauts visited the Moon in 1969.",
      "Meteoroids are dangerous to astronauts.",
      "Regolith is used to build moon bases.",
    ], answer: 0,
    explanation: "Both paragraphs' details (lasting footprints, meteoroid impacts) come from having no atmosphere.",
  },
  {
    id: "e-ri-2", subject: "ela", standard: "RI.6.5", skill: "Text structure",
    passage: FOOTPRINTS,
    prompt: "Which text structure does the author mainly use?",
    choices: ["Cause and effect", "Chronological order", "Compare and contrast", "Problem and solution"], answer: 0,
    explanation: "No atmosphere (cause) → footprints last and meteoroids hit (effects). Signal words: \"so,\" \"means.\"",
  },
  {
    id: "e-ri-3", subject: "ela", standard: "RI.6.4", skill: "Word meaning in context",
    passage: FOOTPRINTS,
    prompt: "Based on the passage, what is regolith?",
    choices: ["Fine dust made of ground-up rock", "A type of spacecraft", "Moon ice", "A kind of meteoroid"], answer: 0,
    explanation: "The passage defines it right in the sentence: \"a fine, powdery dust called regolith.\"",
  },
  {
    id: "e-ri-4", subject: "ela", standard: "RI.6.1", skill: "Citing text evidence",
    passage: FOOTPRINTS,
    prompt: "Which detail explains why footprints on the Moon may last millions of years?",
    choices: [
      "There is no wind or rain to wear down its surface.",
      "Astronauts visited in 1969.",
      "Meteoroids strike the surface constantly.",
      "Regolith is fine and powdery.",
    ], answer: 0,
    explanation: "The word \"so\" links no wind or rain directly to the footprints lasting.",
  },

  // ---- Language: figurative language, word parts, context clues ----
  {
    id: "e-l5-1", subject: "ela", standard: "L.6.5", skill: "Figurative language",
    prompt: "\"The stars were diamonds scattered on black velvet.\" What is this?",
    choices: ["Metaphor", "Simile", "Hyperbole", "Onomatopoeia"], answer: 0, quick: true,
    explanation: "It says the stars WERE diamonds — a comparison without \"like\" or \"as.\"",
  },
  {
    id: "e-l5-2", subject: "ela", standard: "L.6.5", skill: "Figurative language",
    prompt: "\"The rover groaned as it climbed the hill.\" What is this?",
    choices: ["Personification", "Simile", "Alliteration", "Hyperbole"], answer: 0, quick: true,
    explanation: "Groaning is a human action given to a machine.",
  },
  {
    id: "e-l5-3", subject: "ela", standard: "L.6.5", skill: "Figurative language",
    prompt: "\"The base was as quiet as a sleeping cat.\" What is this?",
    choices: ["Simile", "Metaphor", "Personification", "Idiom"], answer: 0, quick: true,
    explanation: "It compares using \"as\" — that makes it a simile.",
  },
  {
    id: "e-l5-4", subject: "ela", standard: "L.6.5", skill: "Figurative language",
    prompt: "\"I've told you a million times to buckle up!\" What is this?",
    choices: ["Hyperbole", "Simile", "Metaphor", "Onomatopoeia"], answer: 0, quick: true,
    explanation: "It is an exaggeration for effect — hyperbole.",
  },
  {
    id: "e-l5-5", subject: "ela", standard: "L.6.5", skill: "Connotation",
    prompt: "Which word has the most positive connotation?",
    choices: ["Slender", "Skinny", "Scrawny", "Bony"], answer: 0, quick: true,
    explanation: "All mean \"thin,\" but \"slender\" suggests something graceful and pleasant.",
  },
  {
    id: "e-l4-1", subject: "ela", standard: "L.6.4", skill: "Roots & affixes",
    prompt: "The Greek root \"tele\" in telescope means…",
    choices: ["Far", "See", "Small", "Light"], answer: 0, quick: true,
    explanation: "Tele = far (telephone, television). \"Scope\" means to see.",
  },
  {
    id: "e-l4-2", subject: "ela", standard: "L.6.4", skill: "Roots & affixes",
    prompt: "The prefix \"sub-\" in submarine means…",
    choices: ["Under", "Over", "Again", "Not"], answer: 0, quick: true,
    explanation: "Sub = under or below. A submarine travels under the sea (marine).",
  },
  {
    id: "e-l4-3", subject: "ela", standard: "L.6.4", skill: "Roots & affixes",
    prompt: "The Greek root \"geo\" in geology means…",
    choices: ["Earth", "Life", "Water", "Star"], answer: 0, quick: true,
    explanation: "Geo = earth. Geology is the study of the Earth.",
  },
  {
    id: "e-l4-4", subject: "ela", standard: "L.6.4", skill: "Context clues",
    prompt: "\"The astronaut was elated when she won the award; she jumped and cheered.\" What does elated mean?",
    choices: ["Very happy", "Very tired", "Confused", "Nervous"], answer: 0, quick: true,
    explanation: "Jumping and cheering are clues that she felt very happy.",
  },
  {
    id: "e-l4-5", subject: "ela", standard: "L.6.4", skill: "Context clues",
    prompt: "\"The terrain was so arduous that the crew needed three days to cross it.\" What does arduous mean?",
    choices: ["Difficult", "Flat", "Beautiful", "Short"], answer: 0, quick: true,
    explanation: "Needing three days to cross suggests it was very hard.",
  },

  // ---- Language: conventions ----
  {
    id: "e-l1-1", subject: "ela", standard: "L.6.1", skill: "Pronouns",
    prompt: "Choose the correct word: \"The commander gave the map to Jaden and ___.\"",
    choices: ["me", "I", "myself", "mine"], answer: 0, quick: true,
    explanation: "\"To … me\" — use the object pronoun after a preposition. Test it: \"gave the map to me.\"",
  },
  {
    id: "e-l1-2", subject: "ela", standard: "L.6.1", skill: "Pronouns",
    prompt: "In \"The pilot herself checked the engine,\" what kind of pronoun is \"herself\"?",
    choices: ["Intensive", "Reflexive", "Possessive", "Subject"], answer: 0, quick: true,
    explanation: "It adds emphasis and could be removed — that makes it intensive, not reflexive.",
  },
  {
    id: "e-l1-3", subject: "ela", standard: "L.6.1", skill: "Pronouns",
    prompt: "Which sentence has an unclear (vague) pronoun?",
    choices: [
      "When Leo told Sam about the crater, he was excited.",
      "Leo was excited when he told Sam about the crater.",
      "Sam listened as Leo described the crater.",
      "Leo told Sam, \"I found a crater!\"",
    ], answer: 0,
    explanation: "\"He\" could mean Leo or Sam — the reader can't tell.",
  },
  {
    id: "e-l2-1", subject: "ela", standard: "L.6.2", skill: "Punctuation",
    prompt: "Which sentence uses commas correctly to set off extra information?",
    choices: [
      "My sister, a pilot, flew the lander.",
      "My sister a pilot, flew the lander.",
      "My sister, a pilot flew the lander.",
      "My, sister a pilot flew the lander.",
    ], answer: 0,
    explanation: "Nonrestrictive (extra) information needs a comma on BOTH sides.",
  },

  // ---- Reading: craft & structure ----
  {
    id: "e-rl-5", subject: "ela", standard: "RL.6.6", skill: "Point of view",
    prompt: "A narrator tells the story using \"I\" and \"me.\" What point of view is this?",
    choices: ["First person", "Second person", "Third person limited", "Third person omniscient"], answer: 0, quick: true,
    explanation: "A narrator who is a character using I/me is first person.",
  },
  {
    id: "e-rl-6", subject: "ela", standard: "RL.6.5", skill: "Structure of texts",
    prompt: "In a play, the directions that tell actors how to move or speak are called…",
    choices: ["Stage directions", "Dialogue", "Stanzas", "Chapters"], answer: 0, quick: true,
    explanation: "Stage directions (often in italics or brackets) describe action, not spoken lines.",
  },
  {
    id: "e-rl-7", subject: "ela", standard: "RL.6.5", skill: "Structure of texts",
    prompt: "A group of lines in a poem is called a…",
    choices: ["Stanza", "Paragraph", "Chapter", "Scene"], answer: 0, quick: true,
    explanation: "Poems are organized into stanzas, like prose is organized into paragraphs.",
  },
  {
    id: "e-rl-8", subject: "ela", standard: "RL.6.3", skill: "Plot & character",
    prompt: "The point of highest tension in a story, where things turn, is the…",
    choices: ["Climax", "Exposition", "Resolution", "Setting"], answer: 0, quick: true,
    explanation: "Plot: exposition → rising action → CLIMAX → falling action → resolution.",
  },
  {
    id: "e-rl-9", subject: "ela", standard: "RL.6.2", skill: "Theme & summary",
    prompt: "A good summary of a story should…",
    choices: [
      "Include the key events without personal opinions",
      "Retell every detail",
      "Explain whether you liked the story",
      "Only describe the ending",
    ], answer: 0,
    explanation: "Summaries are short, objective, and focus on the most important events.",
  },
  {
    id: "e-ri-5", subject: "ela", standard: "RI.6.8", skill: "Claims & evidence",
    prompt: "Which statement is an opinion?",
    choices: [
      "The Moon is the most beautiful sight in the night sky.",
      "The Moon orbits Earth.",
      "Astronauts first landed on the Moon in 1969.",
      "The Moon has craters.",
    ], answer: 0, quick: true,
    explanation: "\"Most beautiful\" is a judgment that can't be proven. The others can be checked.",
  },
  {
    id: "e-ri-6", subject: "ela", standard: "RI.6.6", skill: "Author's purpose",
    prompt: "An article lists reasons kids should visit the space museum. What is the author's main purpose?",
    choices: ["To persuade", "To entertain", "To describe a process", "To tell a story"], answer: 0, quick: true,
    explanation: "Giving reasons for readers to do something is persuasive writing.",
  },
  {
    id: "e-w1-1", subject: "ela", standard: "W.6.1", skill: "Writing arguments",
    prompt: "Which sentence is the strongest claim for an argument essay?",
    choices: [
      "Our school should start a robotics club because it builds problem-solving skills.",
      "Robots are cool.",
      "Some schools have robotics clubs.",
      "I am going to write about robots.",
    ], answer: 0,
    explanation: "A strong claim takes a clear, arguable position and hints at a reason.",
  },
];
