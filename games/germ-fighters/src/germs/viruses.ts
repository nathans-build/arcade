import type { Band } from "./band";
import { hq, type HealthQuestion } from "./health";
import type { VirusId } from "./roster";

/*
 * Fact questions for each Major Virus boss, four per grade band (K-2, 3-5, 6-8, 9-12). Kid-friendly and
 * neutral: what the virus causes, how it spreads, how the body fights it, and how vaccines and handwashing
 * help. Facts checked against CDC fact pages (e.g. norovirus: soap and water beat hand sanitizer, as few as
 * about 18 virus particles can infect; measles: up to 9 in 10 unprotected close contacts, lingers up to
 * 2 hours, two MMR doses about 97% effective; flu: yearly vaccine for everyone 6 months and older;
 * chickenpox: contagious 1-2 days before the rash until blisters crust; rhinovirus: most colds, more than
 * 100 types, grows best at the cooler temperature of the nose; SARS-CoV-2: spike binds ACE2).
 * Codes: K-2 and 3-5 Healthful Living PCH (flagged) or LS.5.1.2; 6-8 LS.8.1.1 / LS.8.1.2; 9-12 LS.Bio.*.
 */

type Bank = Record<Band, HealthQuestion[]>;

const RHINO: Bank = {
  k2: [
    hq("rhino-k2-1", "1", "1.PCH.1", "The common cold", "Which germ causes most colds?", ["Rhinovirus", "A shark", "Sunshine", "Toothpaste"], "Rhinoviruses cause most common colds. They are tiny viruses that get into your nose."),
    hq("rhino-k2-2", "K", "K.PCH.1", "Stopping colds", "What helps stop colds from spreading?", ["Washing hands", "Rubbing your eyes", "Sharing tissues", "Sneezing on hands"], "Cold germs ride on hands. Washing them with soap keeps the germs from getting to your nose and eyes."),
    hq("rhino-k2-3", "1", "1.PCH.1", "Caring for a cold", "When you have a cold, a good idea is to...", ["Rest and drink water", "Run a race", "Share your cup", "Skip sleep"], "Resting and drinking water help your body fight the cold virus. Most colds get better in about a week."),
    hq("rhino-k2-4", "2", "2.PCH.1", "Rhinovirus", "The word \"rhino\" in rhinovirus means...", ["Nose", "Toe", "Ear", "Knee"], "\"Rhino\" means nose. Rhinoviruses like to live in your nose!"),
  ],
  g35: [
    hq("rhino-g35-1", "5", "5.PCH.1", "The common cold", "Rhinoviruses cause...", ["The common cold", "Chickenpox", "Strep throat", "Cavities"], "Rhinoviruses are the most common cause of colds: a runny nose, sneezing and a sore throat."),
    hq("rhino-g35-2", "4", "4.PCH.1", "Antibiotics and colds", "Will antibiotics cure a cold?", ["No, colds are viruses", "Yes, always", "Only on weekends", "Only for kids"], "Antibiotics only work on bacteria. A cold is caused by a virus, so rest and fluids help instead."),
    hq("rhino-g35-3", "5", "5.PCH.1", "Many kinds of colds", "Why can you catch a cold again and again?", ["There are 100+ kinds", "Colds are bacteria", "Bodies forget it all", "Cold weather makes them"], "There are more than 100 kinds of rhinovirus. Beating one kind doesn't protect you from the others."),
    hq("rhino-g35-4", "5", "LS.5.1.2", "Respiratory system", "A cold mostly affects your...", ["Nose and throat", "Bones", "Toenails", "Stomach only"], "Colds infect the upper part of the respiratory system: the nose and throat.", ),
  ],
  g68: [
    hq("rhino-g68-1", "8", "LS.8.1.1", "Viruses", "Because rhinovirus is a virus, it...", ["Needs host cells to copy", "Is killed by antibiotics", "Is a single cell", "Splits in two"], "Viruses must get inside host cells to make copies. Antibiotics don't work on them."),
    hq("rhino-g68-2", "8", "LS.8.1.1", "Rhinovirus", "Rhinoviruses grow best in the nose because...", ["They like it a bit cooler", "It's the warmest spot", "They need stomach acid", "They eat mucus"], "Rhinoviruses copy themselves best at about 33-35 °C, a little cooler than the inside of the body, like the nose."),
    hq("rhino-g68-3", "8", "LS.8.1.1", "Vaccines", "Why is there no vaccine for the common cold?", ["Over 100 rhinovirus types", "Colds are bacteria", "Colds can't spread", "Vaccines need bacteria"], "A vaccine trains the body for specific germs, and there are more than 100 different rhinovirus types."),
    hq("rhino-g68-4", "8", "LS.8.1.1", "How colds spread", "How do colds most often spread?", ["Germy hands and droplets", "Mosquito bites", "Eating vegetables", "Sunlight"], "Touching a germy surface and then your nose or eyes, or breathing in droplets, spreads cold viruses."),
  ],
  hs: [
    hq("rhino-hs-1", "10", "LS.Bio.1.5", "Viral replication", "Rhinovirus has an RNA genome. To make its proteins it must...", ["Use the host's ribosomes", "Divide by fission", "Photosynthesize", "Make its own ATP"], "Viruses have no ribosomes. The viral RNA is translated by the host cell's ribosomes."),
    hq("rhino-hs-2", "10", "LS.Bio.3.1", "Serotypes", "With over 100 rhinovirus types (serotypes)...", ["Antibodies to one may not stop another", "One cold protects from all", "Antibiotics work", "It is a bacterium"], "Antibodies match specific antigens. Different serotypes have different surface antigens."),
    hq("rhino-hs-3", "10", "LS.Bio.3.1", "Symptoms", "Much of a cold's runny nose comes from...", ["The immune response", "The virus melting cells", "Antibiotics", "Low blood sugar"], "Inflammation and extra mucus are the body's own defense, which is why symptoms can feel worse than the infection itself."),
    hq("rhino-hs-4", "10", "LS.Bio.3.1", "Innate defenses", "Which defense meets a rhinovirus FIRST?", ["Nasal mucus and cilia", "Memory B cells", "Vaccine antibodies", "Bone marrow"], "Innate barriers act first: mucus traps virus particles and cilia sweep them away."),
  ],
};

const FLU: Bank = {
  k2: [
    hq("flu-k2-1", "1", "1.PCH.1", "The flu", "The flu can give you a fever and make you feel...", ["Tired and achy", "Super strong", "Taller", "Glowing"], "The flu often brings a fever, aches, a cough and feeling very tired."),
    hq("flu-k2-2", "2", "2.PCH.1", "Flu vaccine", "How often should people get a flu shot?", ["Every year", "Once ever", "Every hour", "Never"], "Doctors say almost everyone 6 months and older should get a flu vaccine every year."),
    hq("flu-k2-3", "K", "K.PCH.1", "Covering coughs", "When you cough, cover it with...", ["Elbow or tissue", "A friend", "Your lunch", "Nothing"], "Coughing into your elbow or a tissue keeps flu germs from flying onto others."),
    hq("flu-k2-4", "1", "1.PCH.1", "Staying home", "If you have the flu, you should...", ["Stay home and rest", "Go to school", "Share your juice", "Play tag"], "Staying home helps you get well and keeps the flu from spreading to friends."),
  ],
  g35: [
    hq("flu-g35-1", "5", "5.PCH.1", "How flu spreads", "The flu spreads mostly by...", ["Cough and sneeze drops", "Eating carrots", "Sunburns", "Bug bites"], "Flu viruses travel in droplets when sick people cough, sneeze or talk."),
    hq("flu-g35-2", "5", "5.PCH.1", "Flu vaccine", "Why is there a new flu vaccine every year?", ["Flu viruses change", "Old ones get rusty", "Flu is bacteria", "Vaccines last a day"], "Flu viruses keep changing a little, so scientists update the vaccine each year to match."),
    hq("flu-g35-3", "4", "4.PCH.1", "The flu", "The flu is caused by...", ["A virus", "Bacteria", "A fungus", "A parasite"], "Influenza is a virus, so antibiotics won't help. Rest, fluids and sometimes antiviral medicine do."),
    hq("flu-g35-4", "5", "5.PCH.1", "Flu symptoms", "The flu often starts suddenly with...", ["Fever and aches", "Itchy spots", "A toothache", "Glowing skin"], "Flu usually hits fast: fever, body aches, cough, sore throat and tiredness."),
  ],
  g68: [
    hq("flu-g68-1", "8", "LS.8.1.1", "Flu names", "Flu's H and N spike proteins give names like...", ["H1N1", "DNA2", "ABC1", "CO2"], "Influenza A types are named by their hemagglutinin (H) and neuraminidase (N) proteins, like H1N1 or H3N2."),
    hq("flu-g68-2", "8", "LS.8.1.2", "Pandemics", "A flu outbreak that spreads around the world is a...", ["Pandemic", "Epidemic", "Vaccine", "Antigen"], "A pandemic is worldwide. The 2009 H1N1 flu was a pandemic."),
    hq("flu-g68-3", "8", "LS.8.1.1", "Treating flu", "Which can treat the flu when a doctor prescribes it?", ["Antiviral medicine", "Antibiotics", "Antifungal cream", "Cough drops"], "Antiviral medicines can fight flu viruses. Antibiotics don't work on viruses."),
    hq("flu-g68-4", "8", "LS.8.1.1", "Flu vaccine", "Flu vaccines are updated each year because flu surface proteins...", ["Change a little", "Never change", "Become bacteria", "Dissolve in water"], "Small changes in the H and N proteins mean last year's antibodies may not recognize this year's flu."),
  ],
  hs: [
    hq("flu-hs-1", "10", "LS.Bio.3.1", "Antigenic drift", "Small, gradual changes in flu surface antigens are called...", ["Antigenic drift", "Binary fission", "Lysogeny", "Homeostasis"], "Antigenic drift comes from mutations during copying, which is why flu vaccines are updated yearly."),
    hq("flu-hs-2", "10", "LS.Bio.3.1", "Antigenic shift", "A sudden swap of flu gene segments that can start a pandemic is...", ["Antigenic shift", "Antigenic drift", "Transcription", "Osmosis"], "In antigenic shift, two flu strains swap gene segments in one host, making a new subtype few people are immune to."),
    hq("flu-hs-3", "10", "LS.Bio.1.4", "Hemagglutinin", "Influenza's hemagglutinin (H) protein helps the virus...", ["Attach to host cells", "Leave infected cells", "Make ATP", "Copy DNA"], "Hemagglutinin binds receptors on host cells so the virus can get in. Neuraminidase helps new viruses leave."),
    hq("flu-hs-4", "10", "LS.Bio.1.4", "Antiviral drugs", "Neuraminidase inhibitors (like oseltamivir) work by...", ["Stopping new virus release", "Killing bacteria", "Breaking cell walls", "Acting as a vaccine"], "Blocking neuraminidase keeps new flu viruses stuck to the cell, slowing the infection's spread."),
  ],
};

const NORO: Bank = {
  k2: [
    hq("noro-k2-1", "1", "1.PCH.1", "Norovirus", "Norovirus causes a...", ["Stomach bug", "Broken bone", "Sunburn", "Loose tooth"], "Norovirus gives people a stomach bug. It spreads really easily, so wash those hands!"),
    hq("noro-k2-2", "K", "K.PCH.1", "Washing hands", "What gets norovirus germs off your hands best?", ["Soap and water", "Wiping on pants", "Blowing on them", "Nothing"], "Soap and water wash norovirus away. Hand sanitizer does not work well on it."),
    hq("noro-k2-3", "2", "2.PCH.1", "Food safety", "Who should NOT make food for others?", ["Someone with a stomach bug", "Someone with clean hands", "A healthy chef", "A happy helper"], "Stomach bug germs can get into food. People who are sick should let someone else cook."),
    hq("noro-k2-4", "1", "1.PCH.1", "Getting better", "When your tummy is sick, it helps to sip...", ["Water", "Only soda", "Nothing at all", "Syrup"], "A stomach bug makes your body lose water. Small sips of water help you get better."),
  ],
  g35: [
    hq("noro-g35-1", "5", "5.PCH.1", "Hand hygiene", "Why is soap and water better than hand sanitizer for norovirus?", ["Sanitizer works poorly on it", "Soap is a vaccine", "It is a bacterium", "Water is magic"], "Norovirus is tough. Scrubbing with soap and running water removes it much better than sanitizer."),
    hq("noro-g35-2", "5", "5.PCH.1", "How norovirus spreads", "Norovirus spreads easily because...", ["A tiny bit can make you sick", "It's as big as a marble", "It spreads by phone", "It needs mosquitoes"], "Just a tiny amount of norovirus is enough to make someone sick."),
    hq("noro-g35-3", "4", "4.PCH.1", "Stomach flu", "People call norovirus the \"stomach flu,\" but it is not...", ["The influenza virus", "A germ", "A virus", "Catching"], "Norovirus is a different virus from influenza. The flu mostly affects breathing, not the stomach."),
    hq("noro-g35-4", "5", "5.PCH.1", "Cleaning", "Grown-ups clean norovirus off surfaces best with...", ["A bleach cleaner", "Plain water", "Perfume", "Juice"], "Norovirus can live on surfaces, so health experts recommend bleach-based cleaners."),
  ],
  g68: [
    hq("noro-g68-1", "8", "LS.8.1.1", "How norovirus spreads", "Norovirus spreads mostly through...", ["Germy hands, food, surfaces", "Mosquito bites", "Sunlight", "Antibiotics"], "Norovirus passes from person to person, through food or water, and from touching surfaces with the virus on them."),
    hq("noro-g68-2", "8", "LS.8.1.1", "Infectious dose", "How few norovirus particles can make someone sick?", ["About 18", "At least a million", "Exactly 1,000", "None"], "As few as about 18 norovirus particles can make a person sick. That's why it spreads so fast."),
    hq("noro-g68-3", "8", "LS.8.1.1", "Antibiotics", "Why don't antibiotics treat norovirus?", ["It's a virus", "It lives in the lungs", "It's too big", "It's a fungus"], "Antibiotics only work on bacteria. For norovirus, rest and fluids help, and washing hands with soap and water stops it spreading."),
    hq("noro-g68-4", "8", "LS.8.1.2", "Outbreaks", "Norovirus outbreaks are common on cruise ships and in schools because...", ["People share spaces and food", "The sun is stronger", "The water is salty", "People wear hats"], "When many people share food, bathrooms and surfaces, a germ that spreads easily can cause an outbreak."),
  ],
  hs: [
    hq("noro-hs-1", "10", "LS.Bio.1.4", "Virus structure", "Norovirus has no outer lipid envelope. That is why...", ["Alcohol sanitizer works poorly", "Antibiotics kill it", "It dies fast on surfaces", "It has a nucleus"], "Alcohol disrupts lipid envelopes. Non-enveloped viruses like norovirus resist it, so washing with soap and water is the better choice."),
    hq("noro-hs-2", "10", "LS.Bio.3.1", "Homeostasis", "The biggest health risk during a norovirus illness is...", ["Dehydration", "Bone loss", "Hair loss", "Sunburn"], "Losing fluids upsets the body's water balance (homeostasis), so replacing fluids matters most."),
    hq("noro-hs-3", "10", "LS.Bio.1.4", "Host cells", "Norovirus infects cells lining the...", ["Intestines", "Lungs", "Skin", "Bones"], "Norovirus targets the gut, which is why it causes stomach and intestine symptoms."),
    hq("noro-hs-4", "10", "LS.Bio.3.1", "Outbreak control", "The best way to stop a norovirus outbreak is...", ["Handwashing and bleach cleaning", "Antibiotics for all", "Closing windows", "Sanitizer only"], "Handwashing, bleach cleaning and keeping sick people out of kitchens break the chain of spread."),
  ],
};

const VARICELLA: Bank = {
  k2: [
    hq("vari-k2-1", "K", "K.PCH.1", "Chickenpox", "Chickenpox gives you...", ["Itchy spots", "Feathers", "Purple hair", "Hiccups"], "Chickenpox causes itchy, blister-like spots, often with a fever and tiredness."),
    hq("vari-k2-2", "1", "1.PCH.1", "Chickenpox care", "What should you try NOT to do to chickenpox spots?", ["Scratch them", "Keep them clean", "Rest", "Tell a grown-up"], "Scratching can let other germs into the skin. Cool baths and lotion can help the itch."),
    hq("vari-k2-3", "2", "2.PCH.1", "Vaccines", "What can protect kids from chickenpox?", ["A chickenpox vaccine", "Eating candy", "Wearing a hat", "Staying up late"], "The chickenpox vaccine teaches your body to fight the virus before you ever meet it."),
    hq("vari-k2-4", "1", "1.PCH.1", "Germs", "Chickenpox is caused by a...", ["Virus", "Chicken", "Bee sting", "Splinter"], "Chickenpox doesn't come from chickens! It's caused by a virus called varicella."),
  ],
  g35: [
    hq("vari-g35-1", "5", "5.PCH.1", "How chickenpox spreads", "Chickenpox spreads through...", ["The air and blisters", "Eating chicken", "Sunlight", "Clean water"], "The varicella virus spreads through the air and by touching the blisters."),
    hq("vari-g35-2", "5", "LS.5.1.2", "Immune memory", "Why do most people get chickenpox only once?", ["The body remembers it", "The virus is gone forever", "They outgrow it", "Spots protect them"], "After chickenpox, the immune system keeps memory cells that recognize the virus next time."),
    hq("vari-g35-3", "4", "4.PCH.1", "Varicella", "The virus that causes chickenpox is called...", ["Varicella-zoster", "Rhinovirus", "Influenza", "Norovirus"], "Varicella-zoster virus causes chickenpox."),
    hq("vari-g35-4", "5", "5.PCH.1", "Skin care", "Scratching chickenpox spots can...", ["Let in germs and scar", "Heal spots faster", "Cure the virus", "Make you taller"], "Scratched spots can get infected by bacteria and leave scars. Try not to scratch!"),
  ],
  g68: [
    hq("vari-g68-1", "8", "LS.8.1.1", "Shingles", "After chickenpox, the virus can hide in nerve cells and later cause...", ["Shingles", "Measles", "The flu", "Strep throat"], "Varicella-zoster virus can stay quiet in nerve cells for years and wake up later as shingles."),
    hq("vari-g68-2", "8", "LS.8.1.1", "Vaccines", "The chickenpox vaccine works by...", ["Training with a weak virus", "Killing bacteria", "Covering the spots", "Acting as an antibiotic"], "It's a live weakened (attenuated) virus that trains antibodies and memory cells without causing real chickenpox."),
    hq("vari-g68-3", "8", "LS.8.1.1", "Contagious period", "Chickenpox is contagious...", ["Before spots until they crust", "Only after spots heal", "Never", "Only on weekends"], "People can spread it from a day or two before the rash until every blister has crusted over."),
    hq("vari-g68-4", "8", "LS.8.1.1", "Kinds of pathogens", "Which type of pathogen causes chickenpox?", ["Virus", "Bacterium", "Fungus", "Parasite"], "Chickenpox is viral, so antibiotics don't treat it."),
  ],
  hs: [
    hq("vari-hs-1", "10", "LS.Bio.1.4", "Latency", "Varicella-zoster is a herpesvirus. Herpesviruses can...", ["Stay latent in nerve cells", "Only infect plants", "Reproduce by fission", "Make their own ribosomes"], "Herpesviruses can hide (latency) in nerve cells for years without making new viruses."),
    hq("vari-hs-2", "10", "LS.Bio.3.1", "Shingles", "Shingles happens when...", ["Latent varicella reactivates", "New bacteria infect skin", "You catch measles", "Antibiotics fail"], "Shingles is the reactivation of the varicella-zoster virus that has been dormant since an earlier chickenpox infection."),
    hq("vari-hs-3", "10", "LS.Bio.3.1", "Vaccine types", "The varicella vaccine is live attenuated, so it...", ["Uses a weakened virus", "Contains only antibodies", "Is an antibiotic", "Contains mRNA"], "A weakened virus copies a little, which trains strong B and T cell memory."),
    hq("vari-hs-4", "10", "LS.Bio.1.4", "Viral cycles", "Varicella's hidden (latent) phase is most like...", ["The lysogenic cycle", "The lytic cycle", "Binary fission", "Photosynthesis"], "Like a lysogenic phage, a latent virus keeps its genes in the cell without bursting it, then can become active later."),
  ],
};

const MEASLES: Bank = {
  k2: [
    hq("measles-k2-1", "2", "2.PCH.1", "MMR vaccine", "The MMR shot protects against measles and...", ["Mumps and rubella", "Cavities", "Sunburn", "Hiccups"], "MMR stands for measles, mumps and rubella. One shot, three diseases!"),
    hq("measles-k2-2", "1", "1.PCH.1", "Measles", "Measles can give you a high fever and a...", ["Rash", "Loose tooth", "Longer nose", "Green hair"], "Measles brings a high fever, cough, runny nose, red eyes and a spotty rash."),
    hq("measles-k2-3", "K", "K.PCH.1", "How germs spread", "Measles germs spread through the...", ["Air", "Mail", "TV", "Crayons"], "Measles germs float in the air after a sick person coughs or sneezes."),
    hq("measles-k2-4", "1", "1.PCH.1", "Vaccines", "Measles spreads super easily. What protects you best?", ["The MMR vaccine", "A sweater", "Candy", "A nap"], "The MMR vaccine teaches your body to fight measles before it can make you sick."),
  ],
  g35: [
    hq("measles-g35-1", "5", "5.PCH.1", "How measles spreads", "Measles germs can stay in a room's air for up to...", ["2 hours", "2 seconds", "2 years", "2 minutes"], "Measles can float in the air for up to 2 hours after a sick person leaves the room."),
    hq("measles-g35-2", "5", "5.PCH.1", "MMR vaccine", "How many doses of MMR vaccine do kids get?", ["Two", "Ten", "None", "One hundred"], "Kids get two doses of MMR. Together they protect about 97 out of 100 people from measles."),
    hq("measles-g35-3", "4", "4.PCH.1", "Measles", "Measles is caused by a...", ["Virus", "Bacterium", "Fungus", "Splinter"], "Measles is a virus, so antibiotics can't cure it. The vaccine prevents it."),
    hq("measles-g35-4", "5", "5.PCH.1", "Measles rash", "A measles rash usually starts on the...", ["Face", "Feet", "Knees", "Fingernails"], "The measles rash usually starts on the face near the hairline and spreads down the body."),
  ],
  g68: [
    hq("measles-g68-1", "8", "LS.8.1.1", "Contagiousness", "If one person has measles, how many unprotected close contacts can catch it?", ["Up to 9 in 10", "About 1 in 1,000", "None", "Exactly half"], "Measles is so contagious that up to 9 out of 10 unprotected people near a sick person will catch it."),
    hq("measles-g68-2", "8", "LS.8.1.1", "Vaccine effectiveness", "Two doses of MMR are about how effective against measles?", ["About 97%", "About 10%", "About 50%", "100%, always"], "Two MMR doses are about 97% effective. No vaccine is perfect, which is why herd immunity matters."),
    hq("measles-g68-3", "8", "LS.8.1.1", "How measles spreads", "Measles spreads mainly through...", ["The air", "Only food", "Mosquito bites", "Antibiotics"], "Measles travels in the air from coughs and sneezes and can linger in a room."),
    hq("measles-g68-4", "8", "LS.8.1.2", "Herd immunity", "When so many people are vaccinated that measles can't spread, that's...", ["Herd immunity", "A pandemic", "Binary fission", "Antigenic drift"], "Herd (community) immunity protects babies too young for the vaccine and people who can't get it."),
  ],
  hs: [
    hq("measles-hs-1", "10", "LS.Bio.3.1", "Herd immunity threshold", "Measles needs about 95% vaccination for herd immunity because...", ["It is extremely contagious", "It is a bacterium", "It doesn't spread in air", "Antibiotics treat it"], "Measles has a very high basic reproduction number (about 12-18), so nearly everyone must be immune to stop it."),
    hq("measles-hs-2", "10", "LS.Bio.3.1", "Immune amnesia", "Measles can cause \"immune amnesia,\" which means it...", ["Erases some immune memory", "Makes people forget names", "Improves memory cells", "Helps vaccines"], "Measles can wipe out some memory cells for other germs, leaving people more open to other infections for a while."),
    hq("measles-hs-3", "10", "LS.Bio.3.1", "Vaccine types", "MMR is a live attenuated vaccine, so it contains...", ["Weakened viruses", "Dead bacteria", "Antibiotics", "Only mRNA"], "Weakened measles, mumps and rubella viruses train long-lasting B and T cell memory."),
    hq("measles-hs-4", "10", "LS.Bio.3.1", "Outbreaks", "Why does measles spread faster where vaccination rates are low?", ["More susceptible hosts", "It mutates into bacteria", "Vaccines strengthen it", "Antibodies spread it"], "With more people who aren't immune, each case can infect more new hosts."),
  ],
};

const CORONA: Bank = {
  k2: [
    hq("corona-k2-1", "K", "K.PCH.1", "Coronavirus", "\"Corona\" means crown. What looks like a crown on this virus?", ["Its spikes", "Its hat", "Its shoes", "Its teeth"], "Coronaviruses are covered in spike proteins that look like the points of a crown."),
    hq("corona-k2-2", "1", "1.PCH.1", "Stopping spread", "What helps stop COVID-19 from spreading?", ["Washing hands", "Sharing cups", "Touching your face", "Coughing on friends"], "Washing hands, covering coughs and staying home when sick help stop the spread."),
    hq("corona-k2-3", "2", "2.PCH.1", "Germs", "COVID-19 is caused by a...", ["Virus", "Rainbow", "Bee", "Pebble"], "COVID-19 is caused by a coronavirus called SARS-CoV-2."),
    hq("corona-k2-4", "K", "K.PCH.1", "How germs spread", "Coronavirus germs come out when a sick person...", ["Coughs or sneezes", "Reads a book", "Draws a picture", "Ties shoes"], "Coughs, sneezes and even talking send out tiny drops that can carry the virus."),
  ],
  g35: [
    hq("corona-g35-1", "5", "5.PCH.1", "COVID-19", "COVID-19 is caused by...", ["SARS-CoV-2", "A bacterium", "A fungus", "Pollen"], "COVID-19 is caused by SARS-CoV-2, a coronavirus."),
    hq("corona-g35-2", "5", "LS.5.1.2", "Spike proteins", "The spikes on a coronavirus help it...", ["Attach to cells", "Swim", "See", "Make food"], "The spike protein is the key the virus uses to latch onto cells in your airways."),
    hq("corona-g35-3", "4", "4.PCH.1", "Antibiotics", "Can antibiotics cure COVID-19?", ["No, it's a virus", "Yes, always", "Only in winter", "Only for adults"], "Antibiotics only work on bacteria. COVID-19 is caused by a virus."),
    hq("corona-g35-4", "5", "5.PCH.1", "Vaccines", "COVID-19 vaccines help by...", ["Teaching the body the spike", "Killing all bacteria", "Making you sneeze", "Changing blood type"], "The vaccines teach the immune system to recognize the spike, so it can fight the real virus faster."),
  ],
  g68: [
    hq("corona-g68-1", "8", "LS.8.1.1", "How COVID-19 spreads", "SARS-CoV-2 spreads mostly through...", ["Air drops and particles", "Mosquito bites", "Eating vegetables", "Sunlight"], "It spreads through droplets and tiny particles people breathe out, especially indoors and up close."),
    hq("corona-g68-2", "8", "LS.8.1.2", "Pandemics", "In 2020 COVID-19 spread around the world. That made it a...", ["Pandemic", "Local epidemic", "Vaccine", "Bacterium"], "The World Health Organization called COVID-19 a pandemic in March 2020."),
    hq("corona-g68-3", "8", "LS.8.1.1", "mRNA vaccines", "mRNA COVID-19 vaccines give your cells instructions to make...", ["A harmless spike copy", "The whole virus", "Antibiotics", "New DNA"], "Cells make a harmless spike protein for a short time, and the immune system learns to recognize it."),
    hq("corona-g68-4", "8", "LS.8.1.1", "Coronaviruses", "Some ordinary colds are caused by...", ["Other coronaviruses", "Only bacteria", "Sunburn", "Allergies"], "Coronaviruses are a big family. A few common kinds cause mild colds."),
  ],
  hs: [
    hq("corona-hs-1", "10", "LS.Bio.1.4", "Receptors", "SARS-CoV-2's spike protein binds which receptor on human cells?", ["ACE2", "Insulin receptor", "Hemoglobin", "MHC class II"], "The spike binds the ACE2 receptor on cells in the airways and other tissues."),
    hq("corona-hs-2", "10", "LS.Bio.1.5", "mRNA vaccines", "An mRNA vaccine doesn't change your DNA because...", ["mRNA stays out of the nucleus", "mRNA is a protein", "DNA is outside the cell", "mRNA becomes a bacterium"], "The mRNA works in the cytoplasm, never enters the nucleus, and is broken down within days."),
    hq("corona-hs-3", "10", "LS.Bio.9.1", "Variants", "New SARS-CoV-2 variants arise mainly through...", ["Mutations as it copies", "Antibiotic use", "Binary fission", "Photosynthesis"], "Copying errors create mutations. Variants that spread better become more common: natural selection."),
    hq("corona-hs-4", "10", "LS.Bio.3.1", "Updated vaccines", "Updated COVID-19 vaccines are made because...", ["Variants change the spike", "It became a bacterium", "Old vaccines rust", "Antibodies stop forever"], "When the spike protein changes, updating the vaccine helps antibodies match the newer variants."),
  ],
};

export const VIRUS_QUESTIONS: Record<VirusId, Bank> = { rhino: RHINO, flu: FLU, noro: NORO, varicella: VARICELLA, measles: MEASLES, corona: CORONA };

export const ALL_VIRUS_QUESTIONS: HealthQuestion[] = Object.values(VIRUS_QUESTIONS).flatMap((b) => [...b.k2, ...b.g35, ...b.g68, ...b.hs]);
