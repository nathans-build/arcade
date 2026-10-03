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

function clean(text: string): string {
  return text
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/_+/g, " blank ");
}

/**
 * Splits text into sentence-sized pieces (≤ about 200 characters). Chrome stops a single long
 * utterance after roughly 15 seconds, so long passages are queued as several short ones.
 */
export function speechChunks(text: string, max = 200): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]+["'”’)]*\s*|[^.!?…]+$/g) ?? [];
  const out: string[] = [];
  let cur = "";
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (cur && (cur + " " + s).length > max) {
      out.push(cur);
      cur = "";
    }
    if (s.length > max) {
      // A very long sentence: break at commas or spaces.
      let rest = s;
      while (rest.length > max) {
        let cut = rest.lastIndexOf(", ", max);
        if (cut < max / 2) cut = rest.lastIndexOf(" ", max);
        if (cut < 1) cut = max;
        out.push(rest.slice(0, cut + 1).trim());
        rest = rest.slice(cut + 1).trim();
      }
      cur = rest;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Speak `text`, replacing anything currently being read. */
export function speak(text: string) {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    // Queued synchronously: iPad Safari only allows speech that starts from a tap.
    for (const part of speechChunks(clean(text))) {
      const u = new SpeechSynthesisUtterance(part);
      u.rate = 0.9;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    }
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
