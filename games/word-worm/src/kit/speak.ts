/*
 * Read-aloud for early readers (K-2), using the browser's built-in speech
 * (works in Safari on iPad, Chrome, Edge). Silently does nothing where unsupported.
 */

const KEY = "arcade.readAloud";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function readAloudPref(defaultOn: boolean): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    // ignore
  }
  return defaultOn;
}

export function setReadAloudPref(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
  if (!on) stopSpeaking();
}

/** Speak `text`, replacing anything currently being read. */
export function speak(text: string) {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      text
        .replace(/×/g, " times ")
        .replace(/÷/g, " divided by ")
        .replace(/−/g, " minus ")
        .replace(/_+/g, " blank "),
    );
    u.rate = 0.9;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

/** Reads a question and its lettered choices. */
export function speakQuestion(prompt: string, choices: readonly string[]) {
  speak(`${prompt} ${choices.map((c, i) => `${"ABCD"[i]}: ${c}.`).join(" ")}`);
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
