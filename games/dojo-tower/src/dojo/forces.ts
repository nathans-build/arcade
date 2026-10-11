import type { Grade, Question } from "../kit/types";
import { makeQ, type Band } from "./qmake";

/*
 * Dojo Tower's own forces-and-motion set (Floor 4, "Doctor Momentum"). The kit's science banks
 * have only a few force items in some grades, so the game adds these, and also mixes in the kit's
 * force and motion items for the player's grade band (see topics.ts).
 * NC Standard Course of Study for Science (2023): PS.K.2 and PS.1.1 (pushes and pulls),
 * PS.3.2 and PS.5.2 (forces, gravity, friction, mass, speed), PS.7.1 (motion, balanced and
 * unbalanced forces, motion graphs), Physics PS.Phy.1 (kinematics), PS.Phy.2 (Newton's laws),
 * PS.Phy.3 (momentum and impulse). Correct choice first; decks shuffle at runtime.
 */

type Row = [grade: Grade, standard: string, skill: string, prompt: string, choices: [string, string, string, string], explanation: string];

const K2: Row[] = [
  ["K", "PS.K.2", "Pushes and pulls", "You open a drawer toward you. Is that a push or a pull?", ["Pull", "Push", "Spin", "Melt"],
    "Moving something toward you is a pull. Moving it away from you is a push."],
  ["K", "PS.K.2", "Pushes and pulls", "Kicking a ball away from you is a...", ["Push", "Pull", "Hug", "Nap"],
    "A kick pushes the ball away from you."],
  ["K", "PS.K.2", "Pushes and pulls", "Which one is a pull?", ["Tug-of-war", "Kicking", "Pushing a cart", "Throwing"],
    "In tug-of-war you pull the rope toward you."],
  ["K", "PS.K.2", "Ways things move", "To change which way a rolling ball goes, you can...", ["Push it", "Look at it", "Sing to it", "Wait"],
    "A push or a pull can change the direction a ball moves."],
  ["1", "PS.1.1", "Size of a force", "You kick a ball harder. What happens?", ["It goes farther", "It stops", "It gets heavy", "It shrinks"],
    "A bigger push makes a ball go faster and farther."],
  ["1", "PS.1.1", "Size of a force", "Which needs the bigger push to move?", ["A full wagon", "An empty box", "A feather", "A balloon"],
    "Heavier things need a bigger push to get moving."],
  ["1", "PS.1.1", "Gravity", "What pulls a dropped ball down to the ground?", ["Gravity", "Wind", "Magic", "Music"],
    "Gravity is a pull that brings things down toward the ground."],
  ["1", "PS.1.1", "Pushes and pulls", "A toy car rolls farthest on a...", ["Smooth floor", "Thick carpet", "Sand pile", "Mud puddle"],
    "A smooth floor slows the car down the least, so it rolls the farthest."],
  ["1", "PS.1.1", "Pushes and pulls", "To stop a ball rolling toward you, you...", ["Push against it", "Clap", "Blink", "Whistle"],
    "Pushing against a moving ball can slow it down and stop it."],
];

const G35: Row[] = [
  ["3", "PS.3.2", "Forces and motion", "Two kids push a box equally hard from opposite sides. The box...", ["Doesn't move", "Speeds up", "Flies up", "Spins fast"],
    "Equal pushes in opposite directions are balanced forces, so the box stays still."],
  ["3", "PS.3.2", "Forces and motion", "You push a moving bike from behind. It will...", ["Speed up", "Slow down", "Stop", "Go backward"],
    "A push in the same direction as the motion makes it go faster."],
  ["3", "PS.3.2", "Forces and motion", "The same push moves which cart faster?", ["Empty cart", "Full cart", "Both the same", "Neither"],
    "An object with less mass speeds up more from the same push."],
  ["5", "PS.5.2", "Gravity, friction and mass", "Friction is a force that usually...", ["Slows things", "Lifts things", "Makes light", "Melts ice"],
    "Friction acts between surfaces that rub, and it works against motion."],
  ["5", "PS.5.2", "Gravity, friction and mass", "Which surface gives the most friction for a sliding block?", ["Sandpaper", "Ice", "Glass", "Wax paper"],
    "Rough surfaces like sandpaper have more friction than smooth ones like ice."],
  ["5", "PS.5.2", "Gravity, friction and mass", "Gravity on Earth pulls objects toward...", ["Earth's center", "The sky", "The north", "The clouds"],
    "Earth's gravity pulls everything toward the center of the Earth, which is down for us."],
  ["5", "PS.5.2", "Gravity, friction and mass", "Wheels make a heavy box easier to move because they reduce...", ["Friction", "Gravity", "Color", "Size"],
    "Rolling wheels have much less friction than a box sliding on the ground."],
  ["5", "PS.5.2", "Position, direction and speed", "A runner goes 100 meters in 20 seconds. What is her speed?", ["5 m/s", "2 m/s", "80 m/s", "120 m/s"],
    "Speed = distance ÷ time. 100 m ÷ 20 s = 5 meters per second."],
  ["5", "PS.5.2", "Position, direction and speed", "A car travels 60 miles in 2 hours. What is its speed?", ["30 mph", "120 mph", "62 mph", "58 mph"],
    "Speed = distance ÷ time. 60 miles ÷ 2 hours = 30 miles per hour."],
  ["5", "PS.5.2", "Gravity, friction and mass", "A ball thrown straight up comes back down because of...", ["Gravity", "Friction", "Magnets", "Light"],
    "Gravity pulls the ball back toward Earth, so it slows, stops at the top, then falls."],
];

const G68: Row[] = [
  ["7", "PS.7.1", "Newton's first law", "An object in motion keeps moving the same way unless acted on by...", ["A net force", "Its color", "Its shadow", "Time alone"],
    "Newton's first law: motion only changes when an unbalanced (net) force acts on the object."],
  ["7", "PS.7.1", "Newton's second law", "F = m × a. What force speeds up a 2 kg cart at 3 m/s²?", ["6 N", "5 N", "1.5 N", "9 N"],
    "Force = mass × acceleration = 2 kg × 3 m/s² = 6 newtons."],
  ["7", "PS.7.1", "Newton's third law", "You push on a wall. What does the wall do?", ["Pushes back", "Nothing", "Pulls you", "Moves away"],
    "Newton's third law: for every action force there is an equal and opposite reaction force."],
  ["7", "PS.7.1", "Inertia", "An object's inertia depends on its...", ["Mass", "Color", "Shape", "Name"],
    "More mass means more inertia, so it is harder to start or stop."],
  ["7", "PS.7.1", "Forces", "What unit is force measured in?", ["Newtons", "Meters", "Seconds", "Kilograms"],
    "Force is measured in newtons (N), named after Isaac Newton."],
  ["7", "PS.7.1", "Balanced and unbalanced forces", "Forces on a box: 10 N right and 4 N left. What is the net force?", ["6 N right", "14 N right", "6 N left", "0 N"],
    "Opposite forces subtract: 10 N − 4 N = 6 N, toward the bigger force (right)."],
  ["7", "PS.7.1", "Newton's second law", "The same force pushes a 1 kg ball and a 5 kg ball. Which speeds up more?", ["The 1 kg ball", "The 5 kg ball", "Both equal", "Neither"],
    "With the same force, less mass means more acceleration (a = F ÷ m)."],
  ["7", "PS.7.1", "Speed and velocity", "Velocity is speed plus...", ["Direction", "Color", "Mass", "Volume"],
    "Velocity tells both how fast and which way, like 5 m/s north."],
  ["7", "PS.7.1", "Motion graphs", "On a distance-time graph, a flat line means the object is...", ["Not moving", "Speeding up", "Going fast", "Falling"],
    "A flat line means the distance is not changing, so the object is at rest."],
  ["7", "PS.7.1", "Newton's third law", "A rocket pushes gas down and the gas pushes it up. Which law?", ["Third law", "First law", "Zeroth law", "Law of ink"],
    "Action and reaction: the rocket pushes gas down, and the gas pushes the rocket up."],
  ["7", "PS.7.1", "Inertia", "In a sudden stop, seat belts help because your body keeps moving due to...", ["Inertia", "Friction", "Magnetism", "Sound"],
    "Inertia keeps your body moving forward when the car stops; the seat belt supplies the force to stop you."],
];

const HS: Row[] = [
  ["12", "PS.Phy.1", "Kinematics", "A car speeds up from 0 to 20 m/s in 4 s. What is its acceleration?", ["5 m/s²", "80 m/s²", "16 m/s²", "24 m/s²"],
    "a = Δv ÷ t = (20 − 0) m/s ÷ 4 s = 5 m/s²."],
  ["12", "PS.Phy.2", "Newton's second law", "What net force gives a 1,200 kg car an acceleration of 2 m/s²?", ["2,400 N", "600 N", "1,202 N", "1,198 N"],
    "F = m × a = 1,200 kg × 2 m/s² = 2,400 N."],
  ["12", "PS.Phy.2", "Weight", "What is the weight of a 5 kg box on Earth (g = 9.8 m/s²)?", ["49 N", "5 N", "14.8 N", "0.5 N"],
    "Weight = m × g = 5 kg × 9.8 m/s² = 49 N."],
  ["12", "PS.Phy.1", "Free fall", "A ball is dropped from rest. Ignoring air, how fast is it falling after 2 s? (g = 10 m/s²)", ["20 m/s", "10 m/s", "5 m/s", "40 m/s"],
    "v = g × t = 10 m/s² × 2 s = 20 m/s."],
  ["12", "PS.Phy.1", "Free fall", "A ball is dropped from rest. Ignoring air, how far does it fall in 2 s? (g = 10 m/s²)", ["20 m", "10 m", "40 m", "5 m"],
    "d = ½ g t² = ½ × 10 × 2² = 20 m."],
  ["12", "PS.Phy.1", "Kinematics", "A bike rides at a steady 6 m/s for 15 s. How far does it go?", ["90 m", "21 m", "2.5 m", "9 m"],
    "Distance = speed × time = 6 m/s × 15 s = 90 m."],
  ["12", "PS.Phy.3", "Momentum", "What is the momentum of a 3 kg cart moving at 4 m/s?", ["12 kg·m/s", "7 kg·m/s", "0.75 kg·m/s", "1 kg·m/s"],
    "p = m × v = 3 kg × 4 m/s = 12 kg·m/s."],
  ["12", "PS.Phy.3", "Momentum and impulse", "A 100 N force acts on a ball for 0.5 s. What impulse does it give?", ["50 N·s", "200 N·s", "100.5 N·s", "99.5 N·s"],
    "Impulse = F × Δt = 100 N × 0.5 s = 50 N·s, which equals the change in momentum."],
  ["12", "PS.Phy.2", "Net force and friction", "You push a 10 kg box with 50 N. Friction is 30 N. What is its acceleration?", ["2 m/s²", "5 m/s²", "8 m/s²", "3 m/s²"],
    "Net force = 50 N − 30 N = 20 N, so a = 20 N ÷ 10 kg = 2 m/s²."],
  ["12", "PS.Phy.1", "Projectiles", "Ignoring air, what happens to a thrown ball's horizontal velocity?", ["Stays the same", "Speeds up", "Slows down", "Flips"],
    "With no air resistance, no horizontal force acts, so horizontal velocity stays constant. Gravity only changes vertical velocity."],
  ["12", "PS.Phy.2", "Newton's first law", "An elevator moves up at a constant speed. What is the net force on it?", ["Zero", "Upward", "Downward", "Sideways"],
    "Constant velocity means zero acceleration, so the forces are balanced and the net force is zero."],
  ["12", "PS.Phy.1", "Free fall", "Near Earth's surface, a falling object (no air) speeds up by about...", ["9.8 m/s each s", "1 m/s each s", "98 m/s each s", "0 m/s each s"],
    "Free-fall acceleration is about 9.8 m/s²: the speed grows by about 9.8 m/s every second."],
];

function build(band: Band, rows: Row[]): Question[] {
  return rows.map((r, i) => makeQ(`dt-frc-${band}-${String(i + 1).padStart(2, "0")}`, "science", ...r));
}

export const FORCES: Record<Band, Question[]> = {
  k2: build("k2", K2),
  g35: build("g35", G35),
  g68: build("g68", G68),
  hs: build("hs", HS),
};

/** Kit science items that are about forces and motion (matched by their skill name). */
export const FORCE_SKILL = /push|pull|force|gravity|friction|motion|speed|velocity|newton|momentum|impulse|kinematic|projectile|free fall|inertia|ways things move|position, direction/i;
