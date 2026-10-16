// SpiderBen10's Arcade kit: shared by every game. Keep this folder identical across
// game repositories; the canonical copy lives in nathans-build/arcade under kit/.
export * from "./types";
export * from "./grades";
export * from "./deck";
export * from "./progress";
export * from "./adaptive";
export * from "./speak";
export { mathQuestion, randInt, pick } from "./math";
export { bankFor } from "./banks";
export {
  ChipAudio,
  exposeMusicDebug,
  jingle,
  midiToHz,
  noteHz,
  noteToMidi,
  songSeconds,
  validateSong,
  type ChannelId,
  type Intensity,
  type Jingle,
  type Section,
  type Song,
  type Voice,
} from "./audio";
