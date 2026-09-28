import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  QuestionDeck,
  gradeNumber,
  loadProgress,
  recordAnswer,
  speak,
  speakQuestion,
  speechSupported,
  stopSpeaking,
  submitScore,
  type ChipAudio,
  type DealtQuestion,
  type Grade,
  type Question,
} from "@/kit";
import type { Book } from "@/books";
import { GAME_ID, isTyping } from "@/game";
import type { SceneView } from "@/engine/view";
import { SPRITES, KEYS } from "@/engine/sprites";
import { faceRows } from "@/engine/face";
import { Gfx } from "@/engine/gfx";
import { resolveMood } from "@/story/validate";
import { charName, type CharId } from "@/story/roster";
import { standardFor } from "@/story/standards";
import type { Block, Gate, Page } from "@/story/types";
import {
  MAX_HEARTS, POINTS, advance, answerMc, correctIndex, newRun, pageOf, restartFromCheckpoint, tapOrder, usesHearts,
  type LogEntry, type RunState,
} from "@/play/session";
import { addEnding, clearRun, loadEndings, loadRun, saveRun } from "@/play/storage";

export type ReaderStart = { kind: "new" } | { kind: "continue" } | { kind: "page"; page: string };

type Overlay = null | "journal" | "transmission" | "lose" | "ending" | "detour";

interface EndingInfo {
  type: string;
  name: string;
  points: number;
  isNew: boolean;
  bonus: number;
  high: number;
}

const CHARS_PER_TICK = 1;
const TICK_MS = 22;

function blockText(b: Block): string {
  return b.text;
}

function kitQuestion(bookId: string, p: Page, gate: Gate, grade: Grade): Question {
  const { code, skill } = standardFor(gate.anchor, gradeNumber(grade));
  const texts = gate.kind === "mc" ? gate.answers.map((a) => a.text) : gate.items.map((i) => i.text);
  const right = gate.kind === "mc" ? gate.answers.findIndex((a) => a.correct) : 0;
  const choices = [0, 1, 2, 3].map((i) => texts[i] ?? "—") as Question["choices"];
  return {
    id: `pq-${bookId}-${p.id}`,
    subject: "ela",
    grade,
    standard: code,
    skill,
    prompt: gate.question,
    choices,
    answer: right >= 0 && right < 4 ? right : 0,
    explanation: gate.hint,
  };
}

export function Portrait({ who, mood }: { who: CharId; mood: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const def = SPRITES[who];
    const c = ref.current;
    if (!def || !c) return;
    const rows = faceRows(def, false, resolveMood(mood), false, false);
    const top = Math.max(0, rows.findIndex((r) => /[^.]/.test(r)));
    const head = rows.slice(top, top + 13);
    c.width = 16;
    c.height = 13;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 16, 13);
    new Gfx(ctx).grid(head, { ...KEYS, ...(def.colors ?? {}) }, 0, 0, 1);
  }, [who, mood]);
  return <canvas ref={ref} className="pq-portrait" aria-hidden="true" />;
}

export function Reader({
  book, start, playtest, grade, view, audio, readAloud, paused, onExit,
}: {
  book: Book;
  start: ReaderStart;
  playtest: boolean;
  grade: Grade;
  view: SceneView | null;
  audio: ChipAudio;
  readAloud: boolean;
  paused: boolean;
  onExit: () => void;
}) {
  const story = book.story;
  const g = gradeNumber(grade);
  const hearts = usesHearts(g);
  const [run, setRun] = useState<RunState>(() => {
    if (start.kind === "continue") {
      const saved = loadRun(book.id);
      if (saved && pageOf(story, saved.page)) return saved;
    }
    return newRun(story, g, start.kind === "page" ? start.page : undefined);
  });
  const [shown, setShown] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [ending, setEnding] = useState<EndingInfo | null>(null);
  const [tq, setTq] = useState<DealtQuestion | null>(null);
  const [tPicked, setTPicked] = useState<number | null>(null);
  const deck = useMemo(() => new QuestionDeck(grade, "ela", { gameId: GAME_ID }), [grade]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  const page = pageOf(story, run.page)!;
  const total = useMemo(() => page.blocks.reduce((n, b) => n + blockText(b).length, 0), [page]);
  const revealed = shown >= total;
  const castMood = (id: string) => page.cast.find((c) => c.id === id)?.mood ?? "normal";

  // ---- entering a page ----
  useEffect(() => {
    setShown(0);
    setFeedback(null);
    if (!playtest) saveRun(book.id, run);
    const p = pageOf(story, run.page)!;
    const needsTransmission = !playtest && p.checkpoint && p.id !== story.start && !run.transmissions.includes(p.id);
    if (needsTransmission) {
      const q = deck.draw();
      setTq(q);
      setTPicked(null);
      setOverlay("transmission");
      setRun((r) => ({ ...r, transmissions: [...r.transmissions, p.id] }));
      if (readAloud) speakQuestion(`Incoming transmission from Quill. ${q.prompt}`, q.choices);
    } else if (readAloud) speak(pageSpeech(p, run));
    scrollRef.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.page, run.visited.length === 0]);

  // Keep the save current (hearts, gate progress, score).
  useEffect(() => {
    if (!playtest && overlay !== "ending") saveRun(book.id, run);
  }, [run, playtest, book.id, overlay]);

  // ---- scene ----
  const typingBlock = useMemo(() => {
    let n = 0;
    for (const b of page.blocks) {
      n += blockText(b).length;
      if (shown < n) return b;
    }
    return null;
  }, [page, shown]);
  useEffect(() => {
    view?.set({
      scene: page.scene,
      cast: page.cast,
      title: false,
      bubble: null,
      speaking: !paused && typingBlock?.kind === "say" && overlay !== "transmission" ? typingBlock.who : null,
      banner: overlay === "lose" ? { text: "THE END?", sub: "YOUR COURAGE RAN OUT...", color: "#e3262f" } : overlay === "ending" && ending ? endBanner(ending.type) : null,
    });
  }, [view, page, typingBlock, overlay, ending, paused]);

  // ---- typewriter ----
  useEffect(() => {
    if (revealed || paused || overlay === "transmission") return;
    const id = window.setInterval(() => setShown((s) => Math.min(total, s + CHARS_PER_TICK)), TICK_MS);
    return () => window.clearInterval(id);
  }, [revealed, paused, overlay, total]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!revealed) el.scrollTop = el.scrollHeight;
    else choicesRef.current?.scrollIntoView({ block: "nearest" });
  }, [shown, revealed]);

  const skip = useCallback(() => setShown(total), [total]);
  useEffect(() => {
    const on = () => skip();
    window.addEventListener("pq-skip", on);
    return () => window.removeEventListener("pq-skip", on);
  }, [skip]);

  // ---- actions ----
  const record = useCallback(
    (before: RunState, after: RunState) => {
      if (after.log.length > before.log.length && page.gate) {
        const e = after.log[after.log.length - 1];
        recordAnswer(GAME_ID, kitQuestion(book.id, page, page.gate, grade), e.correct);
      }
    },
    [book.id, page, grade],
  );

  const choose = useCallback(
    (i: number) => {
      if (!revealed) return skip();
      if (i >= page.choices.length) return;
      audio.blip();
      stopSpeaking();
      setRun((r) => advance(story, r, i));
    },
    [revealed, skip, page, audio, story],
  );

  const gateMsg = useCallback(
    (result: string, r: RunState) => {
      const gate = page.gate!;
      if (result === "right") {
        audio.correct();
        const first = r.gate!.misses === 0;
        setFeedback({ text: first ? `✔ Correct! +${POINTS.gateFirstTry}` : "✔ You got it!", ok: true });
        if (readAloud) speak(first ? "Correct!" : "You got it!");
      } else if (result === "placed") {
        audio.blip();
        setFeedback(null);
      } else if (result === "wrong") {
        audio.wrong();
        const heart = hearts ? " −1 ♥" : "";
        setFeedback({ text: `✘ Not quite.${heart} Quill: ${gate.hint}`, ok: false });
        if (readAloud) speak(`Not quite. Quill says: ${gate.hint}`);
      } else if (result === "reveal") {
        audio.wrong();
        const ans = gate.kind === "mc" ? gate.answers.find((a) => a.correct)!.text : gate.items.map((i) => i.text).join(" Then: ");
        setFeedback({ text: `Quill: Let's look together. ${gate.kind === "mc" ? `The answer is "${ans}".` : "Here is the right order."} ${gate.hint}`, ok: false });
        if (readAloud) speak(`Let's look together. The answer is: ${ans}. ${gate.hint}`);
      } else if (result === "lose") {
        audio.gameOver();
        stopSpeaking();
        setOverlay("lose");
      }
    },
    [page, audio, hearts, readAloud],
  );

  const answer = useCallback(
    (display: number) => {
      if (!revealed) return skip();
      const res = page.gate?.kind === "order" ? tapOrder(story, run, display, g) : answerMc(story, run, display, g);
      if (res.result === "ignored") return;
      record(run, res.run);
      setRun(res.run);
      gateMsg(res.result, res.run);
    },
    [revealed, skip, page, story, run, g, record, gateMsg],
  );

  const gateDone = !!run.gate && (run.gate.status === "solved" || run.gate.status === "reveal");
  const continueGate = useCallback(() => {
    if (!gateDone) return;
    stopSpeaking();
    setRun((r) => advance(story, r, 0));
  }, [gateDone, story]);

  const restart = useCallback(() => {
    stopSpeaking();
    setOverlay(null);
    setEnding(null);
    setRun((r) => {
      const nr = restartFromCheckpoint(story, r);
      // Same page? Force a fresh entry (reset the typewriter).
      return nr.page === r.page ? { ...nr, visited: [...nr.visited] } : nr;
    });
    setShown(0);
    setFeedback(null);
  }, [story]);

  const readAgain = useCallback(() => {
    stopSpeaking();
    setOverlay(null);
    setEnding(null);
    setShown(0);
    setRun(newRun(story, g));
  }, [story, g]);

  const finish = useCallback(() => {
    if (!page.end || !revealed) return;
    stopSpeaking();
    const type = page.end.type;
    if (type === "lose" && !hearts) {
      addEnding(book.id, page.id);
      setOverlay("detour");
      audio.blip();
      if (readAloud) speak("Whoops, a dead end! But nothing is lost. Quill flies you back to the last checkpoint.");
      return;
    }
    const isNew = playtest ? false : addEnding(book.id, page.id);
    const base = type === "win" ? POINTS.win : type === "secret" ? POINTS.secret : POINTS.lose;
    const bonus = type === "secret" ? POINTS.secretBonus : 0;
    const points = base + bonus + (isNew ? POINTS.newEnding : 0);
    const score = run.score + points;
    const high = playtest ? loadProgress(GAME_ID).highScore : submitScore(GAME_ID, score);
    setRun((r) => ({ ...r, score }));
    setEnding({ type, name: page.end.name, points, isNew, bonus, high });
    setOverlay("ending");
    if (!playtest) clearRun(book.id);
    if (type === "lose") audio.gameOver();
    else audio.levelUp();
    if (readAloud) speak(`${type === "lose" ? "The end?" : type === "secret" ? "Secret ending!" : "The end."} ${page.end.name}.`);
  }, [page, revealed, hearts, book.id, playtest, run.score, audio, readAloud]);

  const answerTransmission = useCallback(
    (i: number) => {
      if (!tq || tPicked !== null) return;
      setTPicked(i);
      const ok = i === tq.answer;
      recordAnswer(GAME_ID, tq, ok);
      if (ok) audio.correct();
      else audio.wrong();
      setRun((r) => ({
        ...r,
        score: r.score + (ok ? POINTS.transmission : 0),
        hearts: ok && hearts ? Math.min(MAX_HEARTS, r.hearts + 1) : r.hearts,
        log: [...r.log, { standard: tq.standard, skill: tq.skill, correct: ok, kind: "transmission" }],
      }));
      if (readAloud) speak(`${ok ? "Correct!" : `Not quite. The answer is ${tq.choices[tq.answer]}.`} ${tq.explanation}`);
    },
    [tq, tPicked, audio, hearts, readAloud],
  );
  const closeTransmission = useCallback(() => {
    if (tPicked === null) return;
    stopSpeaking();
    setOverlay(null);
    setTq(null);
    if (readAloud) speak(pageSpeech(page, run));
  }, [tPicked, readAloud, page, run]);

  const replay = useCallback(() => {
    if (overlay === "transmission" && tq) speakQuestion(tq.prompt, tq.choices);
    else speak(pageSpeech(page, run));
  }, [overlay, tq, page, run]);

  // ---- keyboard ----
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (isTyping(ev) || paused || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1;
      const n = plain ? ("12345".includes(k) ? Number(k) - 1 : "abcde".indexOf(k)) : -1;
      if (overlay === "transmission") {
        if (tPicked === null && n >= 0 && n < 4) {
          ev.preventDefault();
          answerTransmission(n);
        } else if (tPicked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          closeTransmission();
        } else if (k === "r") replay();
        return;
      }
      if (overlay === "journal") {
        if (k === "j" || ev.key === "Escape" || ev.key === "Enter") {
          ev.preventDefault();
          setOverlay(null);
        }
        return;
      }
      if (overlay === "lose" || overlay === "detour") {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          restart();
        }
        return;
      }
      if (overlay === "ending") return;
      if (k === "j" && plain) {
        setOverlay("journal");
        return;
      }
      if (k === "r" && plain) {
        replay();
        return;
      }
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        if (!revealed) skip();
        else if (page.gate && gateDone) continueGate();
        else if (page.end) finish();
        return;
      }
      if (n >= 0) {
        ev.preventDefault();
        if (!revealed) skip();
        else if (page.gate) {
          const max = page.gate.kind === "mc" ? page.gate.answers.length : page.gate.items.length;
          if (n < max) answer(n);
        } else if (page.choices.length && n < 4) choose(n);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [overlay, paused, tPicked, revealed, page, gateDone, answerTransmission, closeTransmission, replay, restart, skip, continueGate, finish, answer, choose]);

  // ---- render ----
  let used = 0;
  const blocks = page.blocks.map((b, i) => {
    const start0 = used;
    used += blockText(b).length;
    if (shown <= start0 && i > 0) return null;
    const vis = blockText(b).slice(0, Math.max(0, shown - start0));
    if (b.kind === "heading") return <div key={i} className="pq-heading pq-pixel">{vis}</div>;
    if (b.kind === "say") {
      const inCast = page.cast.some((c) => c.id === b.who);
      return (
        <div key={i} className={`pq-say ${typingBlock === b ? "talking" : ""}`}>
          <Portrait who={b.who} mood={inCast ? castMood(b.who) : "normal"} />
          <div>
            <span className="who pq-pixel">{charName(b.who)}</span>
            <span className="line">{vis}</span>
          </div>
        </div>
      );
    }
    return <p key={i}>{vis}</p>;
  });

  const std = page.gate ? standardFor(page.gate.anchor, g) : null;
  const gs = run.gate;

  return (
    <div className="pq-reader" data-page={run.page} data-hearts={run.hearts} data-gate={gs?.status ?? ""} data-score={run.score} data-revealed={revealed ? "1" : "0"}>
      <div className="pq-readhead">
        <button className="pq-small pq-pixel" onClick={() => { stopSpeaking(); onExit(); }}>◀ {playtest ? "DESK" : "LIBRARY"}</button>
        <span className="book">{story.title}</span>
        {hearts && (
          <span className="hearts" aria-label={`Courage ${run.hearts} of ${MAX_HEARTS}`} title="COURAGE">
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <span key={i} className={i < run.hearts ? "on" : "off"}>♥</span>
            ))}
          </span>
        )}
        <span className="score pq-pixel">{String(run.score).padStart(5, "0")}</span>
        <button className="pq-small pq-pixel" onClick={() => setOverlay("journal")} title="Clue Journal (J)">JOURNAL{run.clues.length ? ` (${run.clues.length})` : ""}</button>
        {speechSupported() && (
          <button className={`pq-speak ${readAloud ? "on" : ""}`} onClick={replay} aria-label="Read the page aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
      </div>

      <div className="pq-text" ref={scrollRef} onClick={() => !revealed && skip()}>
        {page.checkpoint && run.visited.length > 1 && <div className="pq-cp pq-pixel">◆ CHECKPOINT</div>}
        {blocks}
        {!revealed && <span className="pq-caret">▌</span>}
        {revealed && (
          <div ref={choicesRef} className="pq-after">
            {page.choices.length > 0 && !page.gate && !page.end && (
              <div className="pq-choices">
                {page.choices.map((c, i) => (
                  <button key={i} className="pq-choice" onClick={(e) => { e.stopPropagation(); choose(i); }}>
                    <span className="key pq-pixel">{"ABCD"[i]}</span>
                    <span>{c.text}</span>
                  </button>
                ))}
              </div>
            )}
            {page.gate && gs && std && (
              <GateView gate={page.gate} gs={gs} std={std} feedback={feedback} correct={correctIndex(story, run)} onAnswer={answer} onContinue={continueGate} />
            )}
            {page.end && (
              <div className="pq-btnrow">
                <button className="pq-cta" autoFocus onClick={(e) => { e.stopPropagation(); finish(); }}>
                  {page.end.type === "lose" ? "The end? ▶" : "The end ▶"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {overlay === "journal" && (
        <div className="pq-overlay" onClick={() => setOverlay(null)}>
          <div className="pq-card" role="dialog" aria-label="Clue Journal" onClick={(e) => e.stopPropagation()}>
            <div className="pq-h pq-pixel">✎ CLUE JOURNAL · {story.title}</div>
            {run.clues.length ? (
              <ol className="pq-clues">{run.clues.map((c, i) => <li key={i}>{c}</li>)}</ol>
            ) : (
              <p className="dim">No clues yet. Pages with clues add them here automatically.</p>
            )}
            <div className="pq-btnrow"><button className="pq-cta" autoFocus onClick={() => setOverlay(null)}>Close (J)</button></div>
          </div>
        </div>
      )}

      {overlay === "transmission" && tq && (
        <div className="pq-overlay">
          <div className="pq-card" role="dialog" aria-label="Transmission question">
            <div className="pq-h pq-pixel pq-blink">◆ INCOMING TRANSMISSION FROM QUILL</div>
            <div className="pq-tagrow">
              <span className="pq-tag pq-pixel">ELA</span>
              <span className="pq-tag std pq-pixel">{tq.standard} · {tq.skill}</span>
            </div>
            {tq.passage && <div className="pq-passage">{tq.passage}</div>}
            <div className="pq-prompt">{tq.prompt}</div>
            <div className="pq-answers">
              {tq.choices.map((c, i) => {
                const st = tPicked === null ? "" : i === tq.answer ? "right" : i === tPicked ? "wrong" : "";
                return (
                  <button key={i} className={`pq-choice ${st}`} disabled={tPicked !== null} onClick={() => answerTransmission(i)}>
                    <span className="key pq-pixel">{"ABCD"[i]}</span>
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
            {tPicked !== null && (
              <div className="pq-feedback">
                <div className={`verdict pq-pixel ${tPicked === tq.answer ? "ok" : "no"}`}>
                  {tPicked === tq.answer ? `✔ CORRECT! +${POINTS.transmission}${hearts ? " · +1 ♥" : ""}` : `✘ THE ANSWER IS ${"ABCD"[tq.answer]}`}
                </div>
                <div>{tq.explanation}</div>
                <div className="pq-btnrow"><button className="pq-cta" autoFocus onClick={closeTransmission}>Back to the story ▶</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {overlay === "lose" && (
        <div className="pq-overlay low">
          <div className="pq-card center" role="dialog" aria-label="The end?">
            <div className="pq-title pq-pixel red">THE END?</div>
            <p>Your courage ran out... but Quill swoops in and flies you back to the last checkpoint. Read carefully this time!</p>
            <div className="pq-btnrow center"><button className="pq-cta" autoFocus onClick={restart}>Try again from checkpoint</button></div>
          </div>
        </div>
      )}

      {overlay === "detour" && (
        <div className="pq-overlay low">
          <div className="pq-card center" role="dialog" aria-label="Detour">
            <div className="pq-title pq-pixel">DETOUR!</div>
            <p>Whoops, that path was a dead end ({page.end?.name}). In Page Quest, grades 4–5 never lose: Quill flies you back to the last checkpoint.</p>
            <div className="pq-btnrow center"><button className="pq-cta" autoFocus onClick={restart}>Back to checkpoint</button></div>
          </div>
        </div>
      )}

      {overlay === "ending" && ending && (
        <EndingReport
          book={book}
          ending={ending}
          run={run}
          playtest={playtest}
          onRestart={restart}
          onAgain={readAgain}
          onExit={() => { stopSpeaking(); onExit(); }}
        />
      )}
    </div>
  );
}

function endBanner(type: string) {
  if (type === "secret") return { text: "SECRET!", sub: "YOU FOUND A SECRET ENDING", color: "#ff55ff" };
  if (type === "lose") return { text: "THE END?", sub: "THE STORY TOOK A WRONG TURN", color: "#e3262f" };
  return { text: "THE END", sub: "WELL READ, HERO!", color: "#ffd23f" };
}

function pageSpeech(p: Page, run: RunState): string {
  const body = p.blocks.map((b) => (b.kind === "say" ? `${charName(b.who)} says: ${b.text}` : b.text)).join(" ");
  let tail = "";
  if (p.gate && run.gate) {
    const texts = p.gate.kind === "mc" ? run.gate.order.map((i) => p.gate!.answers[i].text) : run.gate.order.map((i) => p.gate!.items[i].text);
    tail = ` Question: ${p.gate.question} ${texts.map((t, i) => `${"ABCDE"[i]}: ${t}.`).join(" ")}`;
  } else if (p.choices.length) tail = ` ${p.choices.map((c, i) => `${"ABCD"[i]}: ${c.text}.`).join(" ")}`;
  else if (p.end) tail = " The end.";
  return body + tail;
}

function GateView({
  gate, gs, std, feedback, correct, onAnswer, onContinue,
}: {
  gate: Gate;
  gs: NonNullable<RunState["gate"]>;
  std: { code: string; skill: string };
  feedback: { text: string; ok: boolean } | null;
  correct: number;
  onAnswer: (i: number) => void;
  onContinue: () => void;
}) {
  const done = gs.status === "solved" || gs.status === "reveal";
  const head = (
    <div className="pq-tagrow">
      <span className="pq-tag pq-pixel">{gate.kind === "order" ? "PUT IN ORDER" : "QUILL'S QUESTION"}</span>
      <span className="pq-tag std pq-pixel">{std.code} · {std.skill}</span>
    </div>
  );
  return (
    <div className={`pq-gate ${gs.status}`} onClick={(e) => e.stopPropagation()}>
      {head}
      <div className="pq-prompt">{gate.question}</div>
      {gate.kind === "mc" ? (
        <div className="pq-answers">
          {gs.order.map((idx, d) => {
            const a = gate.answers[idx];
            const st = done && a.correct ? "right" : gs.lastWrong === d ? "wrong" : "";
            return (
              <button key={d} className={`pq-choice ${st}`} disabled={done} onClick={() => onAnswer(d)}>
                <span className="key pq-pixel">{"ABCD"[d]}</span>
                <span>{a.text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <ol className="pq-slots">
            {gate.items.map((_, i) => (
              <li key={i} className={gs.placed[i] !== undefined ? "full" : ""}>
                <span className="n pq-pixel">{i + 1}</span>
                <span>{gs.placed[i] !== undefined ? gate.items[gs.placed[i]].text : "…"}</span>
              </li>
            ))}
          </ol>
          {!done && (
            <div className="pq-tiles">
              {gs.order.map((idx, d) => {
                const placed = gs.placed.includes(idx);
                return (
                  <button key={d} className={`pq-choice tile ${gs.lastWrong === d ? "wrong" : ""} ${d === correct && gs.misses >= 2 ? "hintme" : ""}`} disabled={placed} onClick={() => onAnswer(d)}>
                    <span className="key pq-pixel">{"ABCDE"[d]}</span>
                    <span>{gate.items[idx].text}</span>
                  </button>
                );
              })}
            </div>
          )}
          {!done && <div className="pq-help">Tap the pieces in the order they happened (or press A–{"ABCDE"[gate.items.length - 1]} / 1–{gate.items.length}).</div>}
        </>
      )}
      {feedback && <div className={`pq-feedback ${feedback.ok ? "ok" : "no"}`}>{feedback.text}</div>}
      {done && (
        <div className="pq-btnrow">
          <button className="pq-cta" autoFocus onClick={onContinue}>Continue ▶</button>
        </div>
      )}
    </div>
  );
}

function EndingReport({
  book, ending, run, playtest, onRestart, onAgain, onExit,
}: {
  book: Book;
  ending: EndingInfo;
  run: RunState;
  playtest: boolean;
  onRestart: () => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const found = loadEndings(book.id);
  const byStd = new Map<string, { std: string; skill: string; n: number; c: number; kinds: Set<string> }>();
  for (const l of run.log as LogEntry[]) {
    const key = `${l.standard}|${l.skill}`;
    const cur = byStd.get(key) ?? { std: l.standard, skill: l.skill, n: 0, c: 0, kinds: new Set<string>() };
    cur.n++;
    if (l.correct) cur.c++;
    cur.kinds.add(l.kind);
    byStd.set(key, cur);
  }
  const practice = [...byStd.values()].filter((v) => v.c / v.n < 0.75);
  const title = ending.type === "secret" ? "SECRET ENDING!" : ending.type === "lose" ? "THE END?" : "THE END";
  return (
    <div className="pq-overlay">
      <div className="pq-card wide" role="dialog" aria-label="Ending and mission report">
        <div className={`pq-title pq-pixel ${ending.type === "lose" ? "red" : ending.type === "secret" ? "pink" : ""}`}>{title}</div>
        <div className="pq-endname">
          “{ending.name}” <span className={`pq-tag pq-pixel end-${ending.type}`}>{ending.type.toUpperCase()} ENDING</span>
        </div>
        <div className="pq-help big">
          Score <b className="y">{run.score}</b> (+{ending.points}{ending.bonus ? `, incl. secret bonus +${ending.bonus}` : ""}{ending.isNew ? ", new ending!" : ""})
          {!playtest && <> · Hi {Math.max(ending.high, run.score)}</>}
        </div>

        <div className="pq-h pq-pixel" style={{ marginTop: 10 }}>ENDINGS FOUND {book.endings.filter((e) => found.includes(e.page)).length} / {book.endings.length}</div>
        <div className="pq-gallery">
          {book.endings.map((e) => {
            const got = found.includes(e.page);
            return (
              <div key={e.page} className={`pq-endcard ${got ? `got end-${e.type}` : ""}`}>
                <span className="pq-pixel k">{got ? e.type.toUpperCase() : "?"}</span>
                <span>{got ? e.name : "???"}</span>
              </div>
            );
          })}
        </div>

        <div className="pq-h pq-pixel" style={{ marginTop: 10 }}>MISSION REPORT</div>
        {byStd.size > 0 ? (
          <table className="pq-report">
            <thead><tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>FIRST TRY</th></tr></thead>
            <tbody>
              {[...byStd.entries()].map(([k, v]) => (
                <tr key={k}>
                  <td className="c">{v.std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{[...v.kinds].map((x) => (x === "gate" ? "story gates" : "transmissions")).join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--pq-green)" : v.c / v.n >= 0.75 ? "var(--pq-yellow)" : "var(--pq-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="dim">No questions on this path. Try another path to meet Quill's questions!</p>
        )}
        {practice.length > 0 && (
          <p><span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}.</p>
        )}
        {byStd.size > 0 && practice.length === 0 && <p><span className="y">Great reading!</span> Try a CHALLENGE book or hunt for the other endings.</p>}

        <div className="pq-btnrow">
          {ending.type === "lose" && <button className="pq-cta" autoFocus onClick={onRestart}>Try again from checkpoint</button>}
          <button className={`pq-cta ${ending.type === "lose" ? "ghost" : ""}`} autoFocus={ending.type !== "lose"} onClick={onAgain}>Read again</button>
          <button className="pq-cta ghost" onClick={onExit}>{playtest ? "Back to the desk" : "Back to library"}</button>
        </div>
      </div>
    </div>
  );
}

export function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}
