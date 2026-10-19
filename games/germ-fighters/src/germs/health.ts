import type { Grade, Question } from "../kit/types";
import { BANDS, QUICK_CHOICE, QUICK_PROMPT, type Band } from "./band";
import type { ZoneId } from "./roster";

/*
 * Germ Fighters' own life science & health bank: germs vs. healthy habits (K-2), body systems and how the
 * body protects itself (3-5), cells, bacteria vs. viruses, the immune response and vaccines (6-8), and
 * innate/adaptive immunity, antigens, viral cycles, resistance and vaccine types (Biology, 9-12).
 *
 * Every item: the correct choice first (decks shuffle at runtime), a teaching explanation, an NC code and
 * the body zones it fits (zones prefer their own items). Codes:
 *   K-5 habits   K.PCH.1 ... 5.PCH.1  NC Healthful Living, Personal & Consumer Health ("wellness, disease
 *                prevention and recognition of symptoms"). Format from the 2010 Essential Standards; flagged
 *                for review against the current Healthful Living numbering.
 *   3-5 science  LS.3.1.2 (skin, unconfirmed), LS.4.1.1 (structures for survival), LS.5.1.1 (levels of
 *                organization), LS.5.1.2 (body systems), LS.5.2.2 (decomposers, helpful microbes).
 *   6-8          LS.7.1.1 (unicellular organisms), LS.7.1.2 (cell structures), LS.7.1.3 (levels of
 *                organization), LS.8.1.1 (pathogens: spread, treatment, prevention), LS.8.1.2 (epidemics and
 *                pandemics). The 2023 NC science codes used by the kit's science bank.
 *   9-12         Biology: LS.Bio.1.4 (prokaryotes, viruses), LS.Bio.1.5 (DNA/RNA, protein synthesis),
 *                LS.Bio.3.1 (homeostasis: immune response, fever), LS.Bio.9.1 (natural selection,
 *                antibiotic resistance). The immune items use LS.Bio.3.1 as the closest fit (flagged).
 * Every fact was double-checked against CDC / NIH-level sources; see the README's fact notes.
 */

export interface HealthQuestion extends Question {
  /** Body zones this item fits best ("any" fits every zone). */
  zones: (ZoneId | "any")[];
}

export function hq(
  id: string,
  grade: Grade,
  standard: string,
  skill: string,
  prompt: string,
  choices: [string, string, string, string],
  explanation: string,
  zones: (ZoneId | "any")[] = ["any"],
): HealthQuestion {
  const out: HealthQuestion = { id: `gf-${id}`, subject: "science", grade, standard, skill, prompt, choices, answer: 0, explanation, zones };
  if (prompt.length <= QUICK_PROMPT && choices.every((c) => c.length <= QUICK_CHOICE)) out.quick = true;
  return out;
}

const K2: HealthQuestion[] = [
  hq("k2-01", "K", "K.PCH.1", "Washing hands", "When is a good time to wash your hands?", ["Before you eat", "Only on birthdays", "Never", "Only at night"], "Wash before you eat, after the bathroom and after blowing your nose. Clean hands keep germs out!"),
  hq("k2-02", "K", "K.PCH.1", "Washing hands", "How long should you scrub your hands with soap?", ["About 20 seconds", "1 second", "One hour", "No time at all"], "Scrub for about 20 seconds, like humming \"Happy Birthday\" two times. Then rinse!"),
  hq("k2-03", "K", "K.PCH.1", "Covering sneezes", "What is the best way to cover a sneeze?", ["Into your elbow", "On a friend", "Into the air", "On your food"], "Sneeze into a tissue or your elbow. That keeps germs off your hands and away from friends.", ["nose", "throat"]),
  hq("k2-04", "1", "1.PCH.1", "Germs are tiny", "Germs are so tiny that you need a...", ["Microscope", "Ladder", "Bucket", "Flashlight"], "Germs are much too small to see with just your eyes. Scientists use microscopes to see them."),
  hq("k2-05", "1", "1.PCH.1", "Sleep and health", "Which helps your body fight germs?", ["Lots of sleep", "Staying up all night", "Skipping meals", "Never washing"], "Sleep gives your body time to rest and build up its germ fighters."),
  hq("k2-06", "2", "2.PCH.1", "Healthy food", "Which food helps your body stay strong?", ["Fruits and veggies", "Only candy", "Only soda", "Only chips"], "Fruits and vegetables give your body vitamins it needs to grow and fight germs.", ["stomach", "gut"]),
  hq("k2-07", "K", "K.PCH.1", "Sneezes", "What does a sneeze do?", ["Blows stuff out", "Makes you taller", "Cleans shoes", "Turns on lights"], "A sneeze blasts dust and germs out of your nose. That's why you should cover it!", ["nose"]),
  hq("k2-08", "1", "1.PCH.1", "Germs spread", "Why should you not share a cup with a sick friend?", ["Germs can spread", "Cups get sad", "Water gets hot", "Cups get heavy"], "Germs from a sick person can get on the cup. Use your own cup to stay healthy.", ["mouth", "throat"]),
  hq("k2-09", "2", "2.PCH.1", "Mucus", "What is mucus (snot) for?", ["Trapping germs", "Helping you see", "Making you run", "Coloring hair"], "Sticky mucus in your nose traps dust and germs so they don't get deeper inside you.", ["nose", "lungs"]),
  hq("k2-10", "2", "2.PCH.1", "Skin protects", "Your skin helps you stay healthy because it...", ["Keeps germs out", "Tastes food", "Hears sounds", "Makes you sleepy"], "Skin is like a wall around your body. It keeps most germs outside.", ["skin"]),
  hq("k2-11", "K", "K.PCH.1", "Caring for cuts", "You scraped your knee. What should you do first?", ["Tell a grown-up", "Rub dirt on it", "Hide it", "Ignore it"], "Tell a grown-up. They can clean it and cover it with a bandage to keep germs out.", ["skin"]),
  hq("k2-12", "1", "1.PCH.1", "Brushing teeth", "How often should you brush your teeth?", ["Two times a day", "Once a year", "Never", "Only Mondays"], "Brush in the morning and before bed to sweep away germs and food bits.", ["mouth"]),
  hq("k2-13", "2", "2.PCH.1", "Teeth and snacks", "Which snack is kinder to your teeth?", ["Carrot sticks", "Sticky candy", "Sugary soda", "Gummy bears"], "Sugary, sticky snacks feed the germs that make cavities. Crunchy veggies are a tooth-friendly snack.", ["mouth"]),
  hq("k2-14", "1", "1.PCH.1", "How germs get in", "Germs can get into your body when you...", ["Touch your eyes", "Clap your hands", "Look at the sky", "Sing a song"], "Germs on your fingers can get in through your eyes, nose and mouth. Keep hands clean and away from your face."),
  hq("k2-15", "2", "2.PCH.1", "Staying home when sick", "When you are sick, what is a good choice?", ["Rest at home", "Go to a party", "Share snacks", "Hug everyone"], "Resting at home helps you get better and keeps your germs from spreading to friends."),
  hq("k2-16", "2", "2.PCH.1", "White blood cells", "What do white blood cells do?", ["Fight germs", "Carry backpacks", "Grow your hair", "Help you hear"], "White blood cells are your body's germ fighters. They find germs and stop them.", ["blood"]),
  hq("k2-17", "1", "1.PCH.1", "Getting better", "What can help you get better from a cold?", ["Rest and water", "Only candy", "Running in rain", "Staying up late"], "Rest and drinking water help your body fight off a cold."),
  hq("k2-18", "K", "K.PCH.1", "Washing hands", "Which is the right way to wash?", ["Scrub all over", "Just touch soap", "Wash one thumb", "Skip the water"], "Wet your hands, use soap, and scrub the fronts, backs and between your fingers. Then rinse and dry."),
  hq("k2-19", "2", "2.PCH.1", "Stomach acid", "Your stomach makes a strong juice called acid. It helps to...", ["Break down food", "Make you sneeze", "Help you see", "Grow teeth"], "Stomach acid breaks down food and stops many germs that you swallow.", ["stomach"]),
  hq("k2-20", "1", "1.PCH.1", "Helpful germs", "Some tiny living things in your belly are helpers. They help you...", ["Digest food", "Fly", "Grow wings", "Turn blue"], "Not all germs are bad! Helpful bacteria in your gut help break down food.", ["gut"]),
  hq("k2-21", "2", "2.PCH.1", "Vaccines", "A vaccine (a shot) helps your body...", ["Learn to fight a germ", "Grow taller", "Change hair color", "Run faster"], "A vaccine shows your body what a germ looks like, so it is ready to fight it."),
  hq("k2-22", "K", "K.PCH.1", "Healthy habits", "Which is a healthy habit?", ["Washing your hands", "Coughing on friends", "Sharing a toothbrush", "Skipping baths"], "Washing your hands is one of the best ways to keep germs away."),
  hq("k2-23", "1", "1.PCH.1", "Lungs", "Your lungs help you...", ["Breathe air", "Taste food", "Hear music", "Grow teeth"], "Your lungs fill up with air every time you breathe in.", ["lungs"]),
  hq("k2-24", "2", "2.PCH.1", "Heart and blood", "What pumps blood all around your body?", ["Your heart", "Your nose", "Your toes", "Your hair"], "Your heart is a strong muscle that pumps blood, and the blood carries your germ fighters everywhere.", ["blood"]),
];

const G35: HealthQuestion[] = [
  hq("g35-01", "5", "LS.5.1.2", "Circulatory system", "Which body system carries blood and white blood cells all over the body?", ["Circulatory", "Digestive", "Skeletal", "Respiratory"], "The circulatory system (heart, blood and blood vessels) carries oxygen, food and white blood cells everywhere.", ["blood"]),
  hq("g35-02", "5", "LS.5.1.2", "Respiratory system", "Which body system takes in oxygen from the air?", ["Respiratory", "Circulatory", "Digestive", "Muscular"], "The respiratory system (nose, airways and lungs) brings in oxygen and lets out carbon dioxide.", ["lungs", "nose"]),
  hq("g35-03", "5", "LS.5.1.2", "Digestive system", "Which organ makes strong acid that stops many germs in food?", ["Stomach", "Lungs", "Heart", "Brain"], "The stomach makes acid that helps break down food and stops many germs you swallow.", ["stomach"]),
  hq("g35-04", "5", "LS.5.1.2", "Alveoli", "The tiny air sacs inside the lungs are called...", ["Alveoli", "Villi", "Platelets", "Tonsils"], "Alveoli are tiny air sacs where oxygen moves into the blood.", ["lungs"]),
  hq("g35-05", "5", "LS.5.1.2", "Villi", "The finger-like bumps in the small intestine that absorb food are...", ["Villi", "Alveoli", "Platelets", "Tonsils"], "Villi give the small intestine lots of surface to soak up nutrients from food.", ["gut"]),
  hq("g35-06", "3", "LS.3.1.2", "Skin protects", "What is the body's first wall against germs?", ["Skin", "Bones", "Muscles", "Kneecaps"], "Unbroken skin keeps most germs out. That's why cleaning and covering cuts matters.", ["skin"]),
  hq("g35-07", "5", "LS.5.1.2", "Platelets", "Which blood parts help plug a cut?", ["Platelets", "Red blood cells", "Nerve cells", "Bone cells"], "Platelets stick together at a cut and help form a clot, which becomes a scab.", ["skin", "blood"]),
  hq("g35-08", "5", "LS.5.1.2", "Red blood cells", "Which blood cells carry oxygen?", ["Red blood cells", "White blood cells", "Platelets", "Skin cells"], "Red blood cells carry oxygen from the lungs to every part of the body.", ["blood", "lungs"]),
  hq("g35-09", "5", "LS.5.1.2", "Fever", "Why does your body sometimes make a fever when you're sick?", ["To help fight germs", "To help germs grow", "To cool you down", "To help you grow"], "A fever warms the body. Many germs don't grow as well when it's warmer, and immune cells work harder."),
  hq("g35-10", "4", "LS.4.1.1", "Body structures", "Sticky mucus and tiny hairs in your nose...", ["Trap germs and dust", "Make you hungry", "Help you see", "Pump blood"], "Your nose is a germ filter: hairs and mucus catch dust and germs before they reach your lungs.", ["nose", "lungs"]),
  hq("g35-11", "5", "LS.5.2.2", "Decomposers", "Some bacteria are decomposers. What do they do?", ["Break down dead things", "Make sunlight", "Eat rocks", "Build nests"], "Decomposer bacteria break down dead plants and animals and return nutrients to the soil. Most bacteria are harmless!"),
  hq("g35-12", "5", "LS.5.2.2", "Helpful microbes", "Which is a HELPFUL job that microbes do?", ["Turn milk to yogurt", "Cause strep throat", "Make cavities", "Cause the flu"], "Helpful bacteria turn milk into yogurt and cheese. Only some microbes make people sick.", ["gut", "stomach"]),
  hq("g35-13", "5", "LS.5.1.2", "Pathogens", "Germs that can make people sick are called...", ["Pathogens", "Producers", "Predators", "Minerals"], "A pathogen is a germ, such as some bacteria or viruses, that can cause disease."),
  hq("g35-14", "3", "LS.3.1.2", "Caring for cuts", "Why should you clean a cut and cover it?", ["To keep germs out", "To make it bigger", "To stop healing", "To make it itch"], "A cut is a break in your skin wall. Cleaning and covering it keeps germs out while new skin grows.", ["skin"]),
  hq("g35-15", "5", "LS.5.1.2", "Tonsils", "Your tonsils, in the back of your throat, help by...", ["Catching germs", "Tasting food", "Pumping blood", "Growing teeth"], "Tonsils are full of immune cells that check the germs you breathe in and swallow.", ["throat"]),
  hq("g35-16", "5", "5.PCH.1", "Stopping spread", "Which spreads germs the LEAST?", ["Cough into your elbow", "Cough into your hand", "Cough at people", "Share a water bottle"], "Coughing into your elbow keeps germs off your hands, so you don't pass them on when you touch things.", ["throat", "nose"]),
  hq("g35-17", "4", "4.PCH.1", "Antibiotics", "Which illness can antibiotics NOT cure?", ["A cold (a virus)", "Strep throat", "An infected cut", "A bacterial earache"], "Antibiotics only work on bacteria. Colds are caused by viruses, so antibiotics don't help them.", ["throat"]),
  hq("g35-18", "5", "LS.5.1.2", "Saliva", "Saliva helps protect your mouth by...", ["Washing away germs", "Growing teeth", "Turning food blue", "Making you sneeze"], "Saliva washes food bits and germs off your teeth and starts digesting food.", ["mouth"]),
  hq("g35-19", "3", "3.PCH.1", "Cavities", "What causes most cavities in teeth?", ["Germs making acid", "Drinking water", "Brushing", "Eating carrots"], "Some mouth bacteria turn sugar into acid that wears holes in teeth. Brushing and less sugar help.", ["mouth"]),
  hq("g35-20", "5", "LS.5.1.1", "Levels of organization", "Groups of similar cells that work together make a...", ["Tissue", "Planet", "Germ", "Molecule"], "Cells make tissues, tissues make organs, and organs work together in body systems."),
  hq("g35-21", "5", "LS.5.1.2", "Immune cells", "What is the main job of white blood cells?", ["Find and fight germs", "Carry oxygen", "Digest food", "Move bones"], "White blood cells are the immune system's defenders. T cells like Cyto are one kind!", ["blood"]),
  hq("g35-22", "5", "LS.5.1.2", "Coughing", "Coughing is the body's way to...", ["Clear the airways", "Digest food", "Grow muscles", "Cool the skin"], "A cough pushes mucus and germs out of your throat and airways.", ["throat", "lungs"]),
  hq("g35-23", "5", "LS.5.1.2", "Gut bacteria", "Helpful bacteria in your gut...", ["Help digest food", "Make you sneeze", "Turn food to rocks", "Grow your hair"], "Trillions of helpful gut bacteria break down food and help crowd out harmful germs.", ["gut"]),
  hq("g35-24", "4", "4.PCH.1", "How germs spread", "Germs from a sneeze travel through the air in tiny...", ["Droplets", "Rocks", "Feathers", "Sparks"], "A sneeze sends out tiny droplets that can carry germs to people nearby.", ["nose", "lungs"]),
];

const G68: HealthQuestion[] = [
  hq("g68-01", "8", "LS.8.1.1", "Antibiotics", "Antibiotics work against...", ["Bacteria", "Viruses", "All germs", "Colds and flu"], "Antibiotics attack parts of bacteria. Viruses don't have those parts, so antibiotics don't work on them.", ["throat"]),
  hq("g68-02", "8", "LS.8.1.1", "Antibiotics", "Why won't antibiotics help someone with the flu?", ["Flu is a virus", "Flu is a bacterium", "It's nighttime", "Flu is a fungus"], "The flu is caused by the influenza virus. Antibiotics only work on bacteria.", ["nose", "lungs"]),
  hq("g68-03", "8", "LS.8.1.1", "Bacteria vs. viruses", "Which of these is a living cell?", ["A bacterium", "A cold virus", "A flu virus", "A measles virus"], "A bacterium is a complete living cell. Viruses are not cells: they need a host cell to make copies.", ["lungs"]),
  hq("g68-04", "8", "LS.8.1.1", "Viruses", "Viruses can only make copies of themselves...", ["Inside a host cell", "In sunlight", "By eating food", "By splitting in two"], "A virus takes over a host cell's machinery to make new viruses."),
  hq("g68-05", "8", "LS.8.1.1", "Bacteria", "How do most bacteria reproduce?", ["Split in two", "Lay eggs", "Make seeds", "Use a host cell"], "Bacteria divide by binary fission: one cell splits into two. Some can double in about 20 minutes!", ["gut"]),
  hq("g68-06", "8", "LS.8.1.1", "Bacteria vs. viruses", "Which is usually much larger?", ["A bacterium", "A virus", "They're equal", "An atom"], "Most bacteria are about 10 to 100 times wider than a typical virus."),
  hq("g68-07", "8", "LS.8.1.2", "Pandemics", "An epidemic becomes a pandemic when it...", ["Spreads worldwide", "Has one patient", "Is cured", "Stays in one town"], "An epidemic is a big outbreak in one area. A pandemic spreads across many countries or continents."),
  hq("g68-08", "8", "LS.8.1.1", "Vaccines", "How does a vaccine protect you?", ["Trains your immune system", "Kills germs in the room", "Acts like an antibiotic", "Thickens your blood"], "A vaccine safely shows the immune system a germ (or part of one) so it can make antibodies and memory cells."),
  hq("g68-09", "7", "LS.7.1.3", "Levels of organization", "Which order goes from smallest to largest?", ["Cell, tissue, organ, system", "Organ, cell, tissue, system", "Tissue, cell, system, organ", "System, organ, tissue, cell"], "Cells form tissues, tissues form organs, and organs work together as organ systems."),
  hq("g68-10", "7", "LS.7.1.2", "Cell structures", "Which structure do bacteria NOT have?", ["A nucleus", "A cell membrane", "Ribosomes", "Cytoplasm"], "Bacteria are prokaryotes: their DNA floats in the cytoplasm instead of sitting in a nucleus.", ["stomach"]),
  hq("g68-11", "8", "LS.8.1.1", "Antibodies", "What are antibodies?", ["Germ-grabbing proteins", "Oxygen carriers", "Virus medicines", "Bone parts"], "Antibodies are Y-shaped proteins made by B cells. Each kind sticks to one specific germ part (antigen).", ["blood"]),
  hq("g68-12", "8", "LS.8.1.1", "Memory cells", "Memory cells help because they...", ["Remember a germ", "Store food", "Make mucus", "Carry oxygen"], "Memory cells remember a germ, so the next time it shows up the body reacts much faster.", ["blood"]),
  hq("g68-13", "8", "LS.8.1.1", "Vectors", "A mosquito that carries a disease from person to person is called a...", ["Vector", "Vaccine", "Antibody", "Host cell"], "A vector is a living thing, like a mosquito or tick, that spreads a pathogen."),
  hq("g68-14", "8", "LS.8.1.1", "Kinds of pathogens", "Which type of pathogen causes strep throat?", ["Bacterium", "Virus", "Fungus", "Parasite"], "Strep throat is caused by Streptococcus bacteria, so a doctor can treat it with antibiotics.", ["throat"]),
  hq("g68-15", "8", "LS.8.1.1", "Kinds of pathogens", "Athlete's foot is caused by a...", ["Fungus", "Virus", "Bacterium", "Protist"], "Athlete's foot is a fungus that grows on warm, damp skin. Antifungal creams treat it.", ["skin"]),
  hq("g68-16", "8", "LS.8.1.1", "Fever", "How can a fever help fight an infection?", ["Slows germs, speeds immune cells", "Feeds the germs", "Shuts the immune system off", "Makes antibiotics"], "A higher temperature slows many germs and helps immune cells work faster."),
  hq("g68-17", "7", "LS.7.1.1", "Unicellular life", "Bacteria are made of one cell. They are...", ["Unicellular", "Multicellular", "Nonliving", "Vertebrates"], "Unicellular means one-celled. A single bacterium does everything it needs to live.", ["gut", "mouth"]),
  hq("g68-18", "8", "LS.8.1.1", "Prevention", "Which helps stop germs spreading at school the most?", ["Washing with soap", "Sharing bottles", "Touching your face", "Coughing in hands"], "Handwashing with soap removes germs before they can get to your eyes, nose or mouth or to other people."),
  hq("g68-19", "8", "LS.8.1.1", "Antibiotic resistance", "Why take antibiotics only when needed, exactly as a doctor says?", ["Helps prevent resistance", "Helps them kill viruses", "Makes vaccines work", "Turns bacteria into viruses"], "Using antibiotics when they aren't needed lets resistant bacteria survive and spread. Use them only as directed.", ["mouth", "throat"]),
  hq("g68-20", "8", "LS.8.1.1", "Phagocytes", "Macrophages fight germs by...", ["Swallowing them up", "Making mucus", "Carrying oxygen", "Making stomach acid"], "Macrophages are big white blood cells that engulf (swallow) and digest germs and old cells.", ["blood", "skin"]),
  hq("g68-21", "7", "LS.7.1.3", "Body systems", "Lymph nodes are part of which body system?", ["Immune (lymphatic)", "Digestive", "Skeletal", "Respiratory"], "Lymph nodes are checkpoints of the immune system where T cells and B cells meet germs' antigens."),
  hq("g68-22", "8", "LS.8.1.2", "Epidemics", "A disease suddenly spreads to many more people than usual in one region. This is...", ["An epidemic", "A pandemic", "A vaccine", "An antibiotic"], "An epidemic is a big outbreak in one area. If it spreads around the world, it becomes a pandemic."),
];

const HS: HealthQuestion[] = [
  hq("hs-01", "10", "LS.Bio.3.1", "Innate immunity", "Which is part of INNATE (non-specific) immunity?", ["Skin, mucus, macrophages", "Memory B cells", "Vaccine antibodies", "Antigen-specific T cells"], "Innate defenses respond the same way to any invader: barriers like skin and mucus, inflammation and phagocytes."),
  hq("hs-02", "10", "LS.Bio.3.1", "Adaptive immunity", "What makes ADAPTIVE immunity different from innate immunity?", ["Specific antigens and memory", "Same response to every germ", "Only skin and mucus", "Never changes after birth"], "Adaptive immunity (B and T cells) targets specific antigens and keeps memory cells for a faster second response."),
  hq("hs-03", "10", "LS.Bio.3.1", "Helper T cells", "Helper T cells (CD4) mainly...", ["Activate B and killer T cells", "Make antibodies themselves", "Carry oxygen", "Swallow bacteria"], "Helper T cells release signals (cytokines) that switch on B cells and killer T cells.", ["blood"]),
  hq("hs-04", "10", "LS.Bio.3.1", "Killer T cells", "Killer (cytotoxic, CD8) T cells recognize infected cells by...", ["Antigens shown on MHC I", "Free antibodies", "The cell's color", "The cell's size"], "Infected cells display pieces of viral proteins on MHC class I molecules, and killer T cells check them.", ["blood"]),
  hq("hs-05", "10", "LS.Bio.3.1", "B cells", "Activated B cells become plasma cells that...", ["Release antibodies", "Kill infected cells", "Carry oxygen", "Make stomach acid"], "Plasma cells pour out antibodies that bind antigens, block germs and tag them for destruction.", ["blood"]),
  hq("hs-06", "10", "LS.Bio.3.1", "Antigens", "An antigen is...", ["A molecule immune cells recognize", "A medicine for bacteria", "A type of white blood cell", "A clotting protein"], "Antigens are molecules, often proteins on a germ's surface, that antibodies and T cell receptors recognize."),
  hq("hs-07", "10", "LS.Bio.1.4", "Viral replication", "In the lytic cycle, a virus...", ["Copies itself and bursts the cell", "Hides in host DNA for years", "Divides by binary fission", "Makes its own ATP"], "In the lytic cycle a virus quickly makes many copies, then the host cell bursts and releases them."),
  hq("hs-08", "10", "LS.Bio.1.4", "Viral replication", "In the lysogenic cycle, a virus...", ["Inserts genes into host DNA", "Bursts the cell at once", "Grows a cell wall", "Makes antibodies"], "In the lysogenic cycle the viral genes join the host's DNA and are copied along with it until the virus switches to the lytic cycle."),
  hq("hs-09", "10", "LS.Bio.1.4", "Antibiotics", "Why do antibiotics treat bacterial but not viral infections?", ["They target parts viruses lack", "Viruses are too big", "Viruses are alive", "They only work in the stomach"], "Antibiotics target bacterial structures like cell walls and bacterial ribosomes. Viruses have neither, so antibiotics don't work on them.", ["mouth", "throat"]),
  hq("hs-10", "10", "LS.Bio.9.1", "Antibiotic resistance", "How does antibiotic resistance spread in a population of bacteria?", ["Resistant ones survive and multiply", "Antibiotics teach bacteria", "Viruses vaccinate bacteria", "Bacteria choose to change"], "Natural selection: bacteria that already carry resistance genes survive the drug and reproduce, so resistance becomes common.", ["gut"]),
  hq("hs-11", "10", "LS.Bio.3.1", "Herd immunity", "Herd immunity protects people who can't be vaccinated because...", ["The germ can't find enough hosts", "The germ becomes harmless", "Everyone takes antibiotics", "Germs die in crowds"], "When most people are immune, a germ has too few hosts to keep spreading, which shields babies and people with weak immune systems."),
  hq("hs-12", "10", "LS.Bio.1.5", "mRNA vaccines", "An mRNA vaccine works by...", ["Coding for a harmless antigen", "Adding live bacteria", "Changing your DNA", "Killing viruses directly"], "The mRNA tells cells to make a harmless piece of a germ (an antigen) for a short time, which trains the immune system. It doesn't change DNA."),
  hq("hs-13", "10", "LS.Bio.3.1", "Vaccine types", "Which vaccine type uses a weakened live virus?", ["Live attenuated (MMR)", "Inactivated", "mRNA", "Toxoid (tetanus)"], "Live attenuated vaccines like MMR and chickenpox use weakened viruses that copy a little and train strong memory."),
  hq("hs-14", "10", "LS.Bio.3.1", "Vaccine types", "A tetanus vaccine contains an inactivated toxin. This type of vaccine is a...", ["Toxoid vaccine", "Live attenuated vaccine", "mRNA vaccine", "Antibiotic"], "Toxoid vaccines train the body to block a germ's toxin. Tetanus and diphtheria vaccines are toxoids.", ["skin"]),
  hq("hs-15", "10", "LS.Bio.3.1", "Secondary response", "Why is the second immune response to a germ faster and stronger?", ["Memory B and T cells", "The germ is weaker", "Antibiotics stay forever", "A higher fever"], "The first exposure leaves memory B and T cells that multiply quickly the next time. Vaccines create this memory safely."),
  hq("hs-16", "10", "LS.Bio.3.1", "Fever and homeostasis", "During a fever, the body...", ["Raises its temperature set point", "Loses all control", "Cools to stop viruses", "Makes antibiotics"], "The brain's thermostat (hypothalamus) raises the set point. The warmer body slows many pathogens and boosts immune cells.", ["stomach"]),
  hq("hs-17", "10", "LS.Bio.3.1", "Antigen presentation", "Which cells show antigens to helper T cells on MHC class II?", ["Macrophages, dendritic cells", "Red blood cells", "Platelets", "Neurons"], "Antigen-presenting cells (dendritic cells, macrophages and B cells) display antigen pieces on MHC II to helper T cells."),
  hq("hs-18", "10", "LS.Bio.1.4", "Viruses", "Viruses are not considered cells because they...", ["Can't reproduce without a host", "Contain DNA or RNA", "Have proteins", "Can evolve"], "Viruses have genes and proteins, but they have no metabolism or ribosomes of their own and must use a host cell to copy themselves."),
  hq("hs-19", "10", "LS.Bio.1.4", "Prokaryotes", "Bacteria differ from human cells because bacteria...", ["Lack a nucleus", "Have no DNA", "Are always larger", "Have mitochondria"], "Bacteria are prokaryotes: no nucleus and no membrane-bound organelles. Human cells are eukaryotic.", ["stomach", "gut"]),
  hq("hs-20", "10", "LS.Bio.3.1", "Inflammation", "Redness, warmth and swelling around a cut happen because...", ["Blood flow brings immune cells", "Germs paint the skin", "Platelets stop all blood", "Skin stops dividing"], "Inflammation widens blood vessels so more blood, fluid and white blood cells reach the injury.", ["skin"]),
  hq("hs-21", "10", "LS.Bio.9.1", "Antibiotic resistance", "Taking antibiotics for a cold is a problem because...", ["It can't help and adds to resistance", "It makes colds last forever", "It turns bacteria into viruses", "It destroys vaccines"], "Colds are viral, so antibiotics can't help, and every unneeded use gives resistant bacteria a chance to spread."),
  hq("hs-22", "10", "LS.Bio.3.1", "Mucous membranes", "Cilia in the airways protect the lungs by...", ["Sweeping mucus up and out", "Making antibodies", "Carrying oxygen", "Digesting food"], "Tiny hair-like cilia beat together to move germ-trapping mucus up out of the airways.", ["lungs", "nose", "throat"]),
];

export const HEALTH: Record<Band, HealthQuestion[]> = { k2: K2, g35: G35, g68: G68, hs: HS };

export const ALL_HEALTH: HealthQuestion[] = BANDS.flatMap((b) => HEALTH[b]);
