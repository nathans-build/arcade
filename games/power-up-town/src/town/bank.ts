import type { Band } from "./common";

/*
 * Power Up Town's own Science Check bank: energy, electricity and heat, per grade band.
 * Authored with the correct choice first (answer 0); the game shuffles choices when it asks.
 * `area` lets a check after a circuit level ask about electricity and one after a heat level
 * ask about heat.
 *
 * Standard codes follow the kit's numbering for the 2023 NC Standard Course of Study for Science
 * (see kit/banks/science/NOTES.md). Codes marked (preview) are taught later in NC than the band
 * that sees them here: K-2 have no electricity objectives, so their circuit and safety items use
 * the grade 4 codes. Codes to double-check: PS.5.1.3 used for heat transfer in 3-5, PS.6.2.1 /
 * PS.6.2.3 (the kit notes they may be swapped with PS.6.2.2), PS.4.2.2 used for series/parallel
 * review in 6-8, PS.Phy.6 for R-values and PS.Chm.4.1 for specific heat.
 */

export type Area = "electric" | "heat" | "safety" | "energy";

export interface BankItem {
  id: string;
  area: Area;
  standard: string;
  skill: string;
  prompt: string;
  choices: [string, string, string, string];
  explanation: string;
}

const q = (id: string, area: Area, standard: string, skill: string, prompt: string, choices: BankItem["choices"], explanation: string): BankItem => ({
  id, area, standard, skill, prompt, choices, explanation,
});

export const BANK: Record<Band, BankItem[]> = {
  k2: [
    q("k2-loop", "electric", "PS.4.2.2", "Complete loop (preview)", "A bulb lights up when its path is a…", ["Complete loop", "Broken loop", "Pile of wire", "Single dot"], "Power has to go all the way around a closed loop: out of the battery, through the bulb and back."),
    q("k2-conductor", "electric", "PS.4.2.3", "Conductors (preview)", "Which thing lets electricity go through it?", ["Metal paper clip", "Rubber band", "Wooden block", "Plastic straw"], "Metal lets electricity flow through it. Rubber, wood and plastic stop it."),
    q("k2-insulator", "electric", "PS.4.2.3", "Insulators (preview)", "Which thing stops electricity?", ["Rubber band", "Metal key", "Aluminum foil", "Metal coin"], "Rubber blocks electricity. That's why wires wear a rubber or plastic coat."),
    q("k2-battery", "electric", "PS.4.2.2", "Batteries (preview)", "What gives a flashlight its power?", ["The battery", "The glass", "The plastic case", "A sticker"], "The battery stores energy and pushes it around the loop to the bulb."),
    q("k2-switch", "electric", "PS.4.2.2", "Switches (preview)", "What does a light switch do?", ["Opens or closes the loop", "Makes the battery", "Paints the light", "Makes snow"], "Switch on closes the loop so power flows. Switch off opens a gap, so the light goes out."),
    q("k2-outlet", "safety", "PS.4.2.2", "Electrical safety", "Is it okay to poke things into a wall outlet?", ["No, never!", "Yes, if it's quick", "Yes, with a key", "Yes, with wet hands"], "Never put anything into an outlet. Wall power is much stronger than a toy battery and can badly hurt you."),
    q("k2-wet", "safety", "PS.4.2.2", "Electrical safety", "Should you touch plugs or switches with wet hands?", ["No, dry them first", "Yes, always", "Only in the bath", "Only at night"], "Water and electricity are a dangerous mix. Always dry your hands first."),
    q("k2-hot", "heat", "PS.2.1.1", "Hot and cold", "Which one is hot?", ["Cocoa from the stove", "An ice cube", "A snowball", "An ice pop"], "Cocoa from the stove is hot. Ice, snow and ice pops are cold."),
    q("k2-snow-sun", "heat", "ESS.2.1.1", "The sun warms things", "What happens to snow on a sunny day?", ["It melts", "It gets bigger", "It turns to sand", "It gets colder"], "The sun warms the snow, and warm snow melts into water."),
    q("k2-snowman", "heat", "ESS.2.1.1", "The sun warms things", "Where will a snowman melt fastest?", ["In the sunshine", "In the shade", "In a freezer", "In a snowbank"], "Sunshine warms things up, so the snowman in the sun melts first."),
    q("k2-mitten", "heat", "PS.2.1.1", "Keeping warm", "Which keeps your hands warm in the snow?", ["Wool mittens", "Wet paper", "A metal pan", "Bare hands"], "Wool keeps your body's own warmth in. It doesn't make heat; it slows your warmth from leaking out."),
    q("k2-cocoa-cool", "heat", "PS.2.1.1", "Heating and cooling", "Hot cocoa sits on the table. Later it will be…", ["Cooler", "Hotter", "Frozen solid", "Boiling"], "Warmth moves from the hot cocoa into the cooler room, so the cocoa cools down."),
    q("k2-icepop-melt", "heat", "PS.2.1.1", "Heating and cooling", "An ice pop sits on a warm plate. It will…", ["Melt", "Get colder", "Grow bigger", "Turn to wood"], "Warmth moves from the warm plate into the ice pop, so it melts."),
    q("k2-shirt", "heat", "ESS.2.1.1", "The sun warms things", "Which shirt gets warmest in the sun?", ["Black shirt", "White shirt", "Pale yellow shirt", "Light pink shirt"], "Dark colors soak up more sunlight, so a black shirt gets warmer than light colors."),
    q("k2-fan", "energy", "PS.4.2.1", "Using electricity (preview)", "A fan uses electricity to…", ["Spin and blow air", "Make snow", "Grow taller", "Make batteries"], "The fan's motor turns electricity into spinning motion."),
    q("k2-spoon", "heat", "PS.2.1.1", "Heating and cooling", "Which spoon's handle gets hot in hot soup?", ["Metal spoon", "Wooden spoon", "Plastic spoon", "None of them"], "Heat moves up a metal spoon quickly. Wooden and plastic handles stay cool."),
    q("k2-coat", "heat", "PS.2.1.1", "Keeping warm", "Why do we wear a coat in winter?", ["It keeps our warmth in", "It makes cold air", "It makes the sun shine", "It is heavy"], "Your body makes warmth. A coat slows it from escaping into the cold air."),
    q("k2-bulb-needs", "electric", "PS.4.2.2", "Complete loop (preview)", "A bulb, a battery and wires: the bulb lights only if…", ["The loop is closed", "There is a gap", "The wire is cut", "The battery is gone"], "With a closed loop, power can travel all the way around and light the bulb."),
  ],
  g35: [
    q("g35-gap", "electric", "PS.4.2.2", "Complete circuits", "A circuit has a gap in the wire. The bulb will…", ["Stay off", "Light brightly", "Light dimly", "Blink fast"], "A gap makes an open circuit. Current can't jump the gap, so the bulb stays off."),
    q("g35-conductor", "electric", "PS.4.2.3", "Conductors and insulators", "Which material is a good electrical conductor?", ["Copper", "Rubber", "Glass", "Wood"], "Copper is a metal, and metals are good conductors. That's why most wires are copper."),
    q("g35-coat", "electric", "PS.4.2.3", "Conductors and insulators", "Wires are covered in plastic because plastic is…", ["An insulator", "A conductor", "A magnet", "A battery"], "Plastic blocks current, so the coating keeps electricity inside the wire and away from your fingers."),
    q("g35-switch", "electric", "PS.4.2.2", "Switches", "What does closing a switch do?", ["Completes the circuit", "Breaks the circuit", "Recharges the battery", "Adds a bulb"], "A closed switch fills the gap, so the loop is complete and current flows."),
    q("g35-bulb-energy", "energy", "PS.4.2.1", "Forms of energy", "A light bulb changes electrical energy mostly into…", ["Light and heat", "Sound only", "Motion", "Chemical energy"], "Bulbs give off light and some heat. Touch an old bulb that's been on: it's warm!"),
    q("g35-motor", "energy", "PS.4.2.1", "Forms of energy", "A fan's motor changes electrical energy into…", ["Motion", "Light only", "Chemical energy", "Cold"], "The motor spins the blades: electrical energy becomes motion."),
    q("g35-short", "safety", "PS.4.2.2", "Short circuits", "Why is a wire straight across a battery dangerous?", ["It makes a short circuit", "It saves energy", "It makes bulbs brighter", "It cools the battery"], "A short circuit has nothing to use the energy, so lots of current rushes through and the wire and battery get hot."),
    q("g35-hot-cold", "heat", "PS.5.1.3", "Heat transfer", "Heat always moves from…", ["Warmer to cooler", "Cooler to warmer", "Bottom to top only", "Light to dark"], "Heat flows from the warmer thing to the cooler thing until they are the same temperature."),
    q("g35-cooler", "heat", "PS.5.1.3", "Insulators", "A foam cooler keeps ice pops frozen because foam…", ["Slows heat getting in", "Makes cold", "Adds ice", "Is a metal"], "Foam is an insulator. It doesn't make cold; it slows the heat flowing in from the warm air."),
    q("g35-conduction", "heat", "PS.5.1.3", "Conduction", "Heat moving through a metal spoon from hot soup is called…", ["Conduction", "Convection", "Radiation", "Evaporation"], "Conduction is heat moving through touching materials, like from the soup up the spoon."),
    q("g35-rise", "heat", "PS.5.1.3", "Convection", "Warm air in a room tends to…", ["Rise", "Sink", "Stay still", "Turn to water"], "Warm air is lighter (less dense), so it rises, and cool air sinks. That's convection."),
    q("g35-sun", "heat", "PS.5.1.3", "Radiation", "How does the sun's heat reach Earth across space?", ["Radiation", "Conduction", "Convection", "Through wires"], "Space is empty, so heat can't be conducted or carried by air. Sunlight travels as radiation."),
    q("g35-cup", "heat", "PS.5.1.3", "Insulators", "Which cup keeps cocoa hot the longest?", ["Foam cup", "Metal cup", "Thin glass", "Open bowl"], "Foam is a good insulator, so heat leaves the cocoa slowly."),
    q("metal-feels-colder", "heat", "PS.5.1.3", "Conductors of heat", "A metal bench and a wooden bench are the same temperature. Why does the metal feel colder?", ["Metal pulls heat from your hand faster", "The metal is colder", "Metal makes cold", "Wood makes heat"], "They are the same temperature! Metal is a good heat conductor, so it carries heat away from your warm hand faster, and your hand feels cold."),
    q("g35-surface", "heat", "PS.5.1.3", "Radiation", "Which surface warms the most in sunlight?", ["Black blacktop", "White snow", "Shiny foil", "White paper"], "Dark surfaces absorb more sunlight. White and shiny surfaces reflect it."),
    q("g35-ice-hand", "heat", "PS.5.1.3", "Heat transfer", "Why does ice melt in your warm hand?", ["Heat flows from hand to ice", "Cold flows into your hand", "The ice makes heat", "The ice gets bigger"], "Heat moves from your warm hand into the ice. Your hand feels cold because it is losing heat."),
    q("g35-handle", "heat", "PS.5.1.3", "Insulators", "Which pot handle best keeps your hand from getting burned?", ["Wood", "Copper", "Steel", "Aluminum"], "Wood is a poor conductor of heat (an insulator), so the handle stays cool."),
    q("g35-series", "electric", "PS.4.2.2", "Series circuits", "Bulbs are in one loop (series). One bulb breaks. The others…", ["Go out", "Get brighter", "Stay the same", "Start buzzing"], "In series there's only one path. A broken bulb opens the loop, so all the bulbs go out."),
  ],
  g68: [
    q("g68-equilibrium", "heat", "PS.6.2.1", "Thermal equilibrium", "Thermal equilibrium is reached when…", ["Two objects reach the same temperature", "The colder object runs out of cold", "All heat is destroyed", "The warmer object gets hotter"], "Energy flows from warmer to cooler until both are at the same temperature; then there's no net flow."),
    q("g68-particles", "heat", "PS.6.1.2", "Particle motion", "When a solid is heated, its particles…", ["Vibrate faster", "Stop moving", "Shrink", "Turn into cold"], "Adding thermal energy makes particles move (vibrate) faster. Temperature measures their average motion."),
    q("g68-conduction", "heat", "PS.6.2.1", "Conduction", "Heat travels along a metal rod mainly because particles…", ["Bump into their neighbors", "Fly across the room", "Absorb cold", "Stop vibrating"], "Fast-vibrating particles collide with slower neighbors and pass energy along. Free electrons in metals speed this up."),
    q("metal-feels-colder", "heat", "PS.6.2.1", "Conductors of heat", "A metal railing and a wooden fence are both 5°C. Why does the metal feel colder?", ["Metal conducts heat from your hand faster", "The metal is at a lower temperature", "Metal gives off cold", "Wood makes its own heat"], "Both are 5°C. Metal is a much better conductor, so it draws thermal energy out of your warm hand faster, and nerves sense that heat loss as cold."),
    q("g68-convection", "heat", "PS.6.2.1", "Convection", "In convection, warm fluid rises because it is…", ["Less dense", "More dense", "Heavier", "Colder"], "Heated fluid expands, so it's less dense and floats up while cooler, denser fluid sinks."),
    q("g68-radiation", "heat", "PS.6.2.1", "Radiation", "Which kind of heat transfer can cross empty space?", ["Radiation", "Conduction", "Convection", "Insulation"], "Radiation is electromagnetic waves, which need no matter. That's how sunlight reaches Earth."),
    q("g68-window", "heat", "PS.6.2.3", "Insulators", "Double-pane windows slow heat loss because the trapped air or gas…", ["Conducts heat poorly", "Makes cold air", "Conducts heat well", "Heats the room"], "Gases are poor conductors, so the sealed layer slows heat moving through the window."),
    q("g68-flashlight", "energy", "PS.7.2.2", "Energy transformations", "A flashlight changes the battery's chemical energy into…", ["Electrical, then light and heat", "Sound, then motion", "Nuclear energy", "Gravitational energy"], "Chemical energy → electrical energy in the circuit → light and some heat in the bulb."),
    q("g68-fan", "energy", "PS.7.2.2", "Energy transformations", "A toy fan's motor converts electrical energy mainly into…", ["Kinetic energy", "Chemical energy", "Nuclear energy", "Elastic energy"], "The motor makes the blades move: kinetic energy (plus a little sound and heat)."),
    q("g68-conserved", "energy", "PS.7.2", "Conservation of energy", "A bulb turns some energy into heat instead of light. The total energy…", ["Is conserved", "Is destroyed", "Doubles", "Vanishes"], "Energy is never created or destroyed. It changes form; the heat is just energy we didn't want."),
    q("g68-series-dim", "electric", "PS.4.2.2", "Series circuits (review)", "Two identical bulbs in series on one battery glow, compared with one bulb alone…", ["Dimmer", "Brighter", "Exactly the same", "Not at all"], "In series the bulbs share the battery's voltage, so less current flows and each glows dimmer."),
    q("g68-homes", "electric", "PS.4.2.2", "Parallel circuits (review)", "Why are homes wired in parallel?", ["Each device works on its own", "It uses no current", "It makes bulbs dimmer", "One switch turns off all"], "Every branch connects straight across the supply, so each gets full voltage and can be switched separately."),
    q("g68-more-branches", "electric", "PS.4.2.2", "Parallel circuits (review)", "Adding another bulb in parallel makes the battery's total current…", ["Increase", "Decrease", "Drop to zero", "Reverse"], "Each new branch draws its own current, so the battery supplies more in total (and runs down faster)."),
    q("g68-short", "safety", "PS.4.2.2", "Short circuits", "A short circuit is dangerous because…", ["A very large current heats the wires", "Current stops completely", "Bulbs get too bright", "It cools the battery"], "With almost no resistance, current gets huge and the wires get hot enough to melt insulation or start a fire."),
    q("g68-cooler", "heat", "PS.6.2.3", "Insulators", "Ice pops in a foam cooler stay frozen longer because foam…", ["Slows energy flowing in", "Adds cold energy", "Makes the room colder", "Absorbs cold"], "There's no such thing as 'cold energy'. Foam slows thermal energy flowing in from the warmer air."),
    q("g68-difference", "heat", "PS.6.2.1", "Heat transfer", "Heat flows between two touching objects only when they…", ["Have different temperatures", "Are the same color", "Are both metal", "Are in sunlight"], "A temperature difference drives heat flow. At the same temperature, there's no net transfer."),
    q("g68-fastest", "heat", "PS.6.2.1", "Thermal equilibrium", "A hot drink cools fastest when it is…", ["Much hotter than the room", "Almost room temperature", "In a foam cup", "Covered with a lid"], "The bigger the temperature difference, the faster heat flows. The cooling curve is steep at first and levels off."),
    q("g68-spoons", "heat", "PS.6.2.1", "Conduction", "A metal spoon in hot soup gets hot but a wooden one doesn't, because…", ["Metal is a better heat conductor", "Wood is colder inside", "Metal makes heat", "Wood makes cold"], "Metal's particles and free electrons pass energy along quickly; wood's structure (with air pockets) passes it slowly."),
  ],
  hs: [
    q("hs-ohm-r", "electric", "PS.Phy.8", "Ohm's law", "A 9 V battery drives 3 A through a resistor. What is its resistance?", ["3 Ω", "27 Ω", "6 Ω", "12 Ω"], "R = V ÷ I = 9 V ÷ 3 A = 3 Ω."),
    q("hs-ohm-i", "electric", "PS.Phy.8", "Ohm's law", "What current flows through a 4 Ω resistor across 12 V?", ["3 A", "48 A", "0.33 A", "8 A"], "I = V ÷ R = 12 ÷ 4 = 3 A."),
    q("hs-power", "electric", "PS.Phy.8", "Electric power", "A 120 V appliance draws 5 A. What is its power?", ["600 W", "24 W", "125 W", "115 W"], "P = V × I = 120 × 5 = 600 W."),
    q("hs-par", "electric", "PS.Phy.8", "Equivalent resistance", "Two 6 Ω resistors in parallel have an equivalent resistance of…", ["3 Ω", "12 Ω", "6 Ω", "36 Ω"], "1/R = 1/6 + 1/6 = 1/3, so R = 3 Ω. Parallel paths lower the total resistance."),
    q("hs-ser", "electric", "PS.Phy.8", "Equivalent resistance", "Resistors of 2 Ω, 3 Ω and 5 Ω in series total…", ["10 Ω", "30 Ω", "0.97 Ω", "5 Ω"], "In series, resistances add: 2 + 3 + 5 = 10 Ω."),
    q("hs-bulb", "electric", "PS.Phy.8", "Electric power", "A 60 W bulb on 120 V draws how much current?", ["0.5 A", "2 A", "7200 A", "60 A"], "I = P ÷ V = 60 ÷ 120 = 0.5 A."),
    q("hs-i2r", "electric", "PS.Phy.8", "Electric power", "2 A through a 5 Ω resistor. Power turned into heat?", ["20 W", "10 W", "7 W", "2.5 W"], "P = I²R = 2² × 5 = 20 W."),
    q("hs-q", "heat", "PS.Chm.4.1", "Specific heat", "Energy to warm 1 kg of water by 10°C? (c = 4186 J/kg·°C)", ["41,860 J", "4186 J", "418.6 J", "10 J"], "Q = m·c·ΔT = 1 × 4186 × 10 = 41,860 J."),
    q("hs-iron", "heat", "PS.Chm.4.1", "Specific heat", "Equal masses of water and iron absorb the same energy. Which warms more?", ["Iron", "Water", "They warm equally", "Neither warms"], "Iron's specific heat (about 450 J/kg·°C) is much lower than water's (4186), so the same Q gives iron a bigger ΔT."),
    q("hs-coast", "heat", "PS.Chm.4.1", "Specific heat", "Coastal towns have milder temperatures than inland towns mainly because water has a…", ["High specific heat", "Low specific heat", "Low density", "High conductivity"], "Water absorbs and releases lots of energy with small temperature changes, which evens out nearby air temperatures."),
    q("hs-rvalue", "heat", "PS.Phy.6", "Insulation (R-value)", "A higher R-value means the insulation…", ["Slows heat flow more", "Lets more heat through", "Adds heat", "Adds cold"], "R is thermal resistance. Heat flow per degree is proportional to 1/R, so higher R means slower loss."),
    q("hs-deltaT", "heat", "PS.Phy.6", "Insulation (R-value)", "For the same wall, heat loss per hour doubles when…", ["The temperature difference doubles", "The R-value doubles", "The wall gets thicker", "The inside gets cooler"], "Heat flow = UA·ΔT, so it's proportional to the temperature difference across the wall."),
    q("hs-newton", "heat", "PS.Chm.4.1", "Newton's law of cooling", "Cocoa at 80°C sits in a 20°C room. When does it cool fastest?", ["At the start", "At the end", "At a steady rate", "After it reaches 20°C"], "The cooling rate is proportional to (T − T_room), which is largest at the start, so the curve is an exponential decay toward 20°C."),
    q("hs-equilibrium", "heat", "PS.Chm.4.1", "Thermal equilibrium", "At thermal equilibrium, the net heat flow between two objects is…", ["Zero", "At its maximum", "From cold to hot", "Equal to their masses"], "Same temperature means no net transfer, even though particles still exchange energy both ways."),
    q("hs-fuse", "safety", "PS.Phy.8", "Circuit protection", "A fuse protects a circuit by…", ["Melting to open it when current is too high", "Adding voltage", "Storing charge", "Cooling the wires"], "Too much current heats the thin fuse wire (P = I²R) until it melts and breaks the circuit."),
    q("hs-electrons", "electric", "PS.Phy.8", "Current", "In a wire connected to a battery, electrons drift…", ["From the − terminal toward +", "From the + terminal toward −", "Both ways equally", "Not at all"], "Electrons are negative, so they drift toward +. Conventional current is defined the opposite way, + to −."),
    q("hs-par-v", "electric", "PS.Phy.8", "Parallel circuits", "In a parallel circuit, the voltage across each branch is…", ["The same as the source", "Divided equally", "Zero", "Larger than the source"], "Each branch connects directly across the source, so each gets the full voltage; the currents add up."),
    q("hs-kwh", "energy", "PS.Phy.6", "Energy and power", "A 1500 W space heater runs for 2 hours. Energy used?", ["3 kWh", "750 kWh", "3000 kWh", "0.75 kWh"], "E = P × t = 1.5 kW × 2 h = 3 kWh."),
    q("metal-feels-colder", "heat", "PS.Chm.4.1", "Thermal conductivity", "A steel rail and a pine board are both at 0°C. Why does the steel feel colder?", ["Steel has a higher thermal conductivity", "Steel is at a lower temperature", "Steel stores cold inside it", "Steel has less mass"], "Both are 0°C. Steel conducts heat away from your skin far faster than wood, so your skin cools quickly and feels cold."),
  ],
};
