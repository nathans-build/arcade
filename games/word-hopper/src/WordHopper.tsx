import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChipAudio } from "@/kit/audio";
import { arcadeLink, gradeFromArcade, gradeLabel, initialGrade, rememberGrade } from "@/kit/grades";
import { recordAnswer, submitScore } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade, Question } from "@/kit/types";
import { Mascot, Sprite } from "@/art/Sprite";
import {
  ACTIVITIES, ACTIVITY_INFO, ROUND_SIZE, levelFor, makeRound, sayTile, seededRng,
  type Activity, type BuildItem, type ChoiceItem, type Item, type SortItem,
} from "@/content/items";
import type { Level } from "@/content/words";
import { STICKERS, awardSticker, loadBook, loadRecent, rememberKeys, saveBook, saveRecent, type Book } from "@/game/stickers";
import "@/game/hopper.css";

const GAME_ID = "word-hopper";
const MASCOT_NAME = "Tadwin";

type Screen = "title" | "hub" | "play" | "reward" | "book";

const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
const debug = params.has("debug");
const rng = params.get("seed") ? seededRng(Number(params.get("seed"))) : Math.random;
/** Pause after a right answer before the next item (ms). The playtest shortens it with ?fast. */
const NEXT_DELAY = params.has("fast") ? 250 : 1500;

interface Play {
  activity: Activity;
  items: Item[];
  idx: number;
  /** Wrong tries on this item. */
  tries: number;
  /** Choices / baskets already tried and wrong. */
  wrong: number[];
  solved: boolean;
  /** Word Builder: units placed in each slot, and tile indexes used. */
  placed: (string | null)[];
  used: number[];
  /** The element that wiggles after a wrong try (choice, tile or basket index) and a counter to restart it. */
  shake: number | null;
  shakeKey: number;
  /** Right on the first try, per item. */
  firstTry: boolean[];
  /** Sound Sort: cards in each basket. */
  sorted: string[][];
}

function itemState(item: Item): Pick<Play, "tries" | "wrong" | "solved" | "placed" | "used" | "shake"> {
  return {
    tries: 0,
    wrong: [],
    solved: false,
    placed: item.type === "build" ? item.units.map((u, i) => (i < item.given ? u : null)) : [],
    used: [],
    shake: null,
  };
}

/** For the kit's per-standard progress (`arcade.word-hopper.progress.v1`). */
function asQuestion(item: Item, grade: Grade): Question {
  const answerText = item.type === "choice" ? item.choices[item.answer].value : item.type === "build" ? item.word : item.baskets[item.answer].label;
  return {
    id: `wh-${item.key}`,
    subject: "ela",
    grade,
    standard: item.standard,
    skill: item.skill,
    prompt: item.prompt,
    choices: [answerText, "-", "--", "---"],
    answer: 0,
    explanation: item.praise,
  };
}

function levelGradeNote(grade: Grade, level: Level): string | null {
  if (grade === "K" || grade === "1" || grade === "2") return null;
  return `${gradeLabel(grade)} · playing grade ${level} words`;
}

export default function WordHopper() {
  const audio = useMemo(() => new ChipAudio(), []);
  const fromArcade = useMemo(() => gradeFromArcade(), []);
  const [grade, setGrade] = useState<Grade>(() => {
    const g = initialGrade("K");
    return fromArcade ? g : levelFor(g);
  });
  const level = levelFor(grade);
  const [screen, setScreen] = useState<Screen>("title");
  const [play, setPlay] = useState<Play | null>(null);
  const [book, setBook] = useState<Book>(() => loadBook());
  const [reward, setReward] = useState<{ sticker: string; isNew: boolean } | null>(null);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(true));
  const [confetti, setConfetti] = useState(0);
  const [hop, setHop] = useState(false);
  const timer = useRef<number | null>(null);
  const readRef = useRef(readAloud);
  readRef.current = readAloud;

  const talk = useCallback((text: string) => {
    if (readRef.current) speak(text);
  }, []);

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => () => {
    clearTimer();
    stopSpeaking();
  }, []);

  // Browsers only start audio from a tap.
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [audio]);

  const doHop = () => {
    setHop(true);
    window.setTimeout(() => setHop(false), 450);
  };

  const chooseGrade = (g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    audio.blip();
    talk(g === "K" ? "Kindergarten." : `Grade ${g}.`);
  };

  const goHub = useCallback(
    (greet: boolean) => {
      clearTimer();
      setPlay(null);
      setScreen("hub");
      if (greet) talk(`Hi! I'm ${MASCOT_NAME} the frog. Welcome to my word garden! Pick a game.`);
      else stopSpeaking();
    },
    [talk],
  );

  const startActivity = useCallback(
    (activity: Activity) => {
      clearTimer();
      const recent = new Set(loadRecent()[`${activity}/${level}`] ?? []);
      const items = makeRound(activity, level, rng, recent);
      setPlay({ activity, items, idx: 0, ...itemState(items[0]), shakeKey: 0, firstTry: [], sorted: [[], []] });
      setScreen("play");
      setReward(null);
      audio.blip();
      talk(`${ACTIVITY_INFO[activity].say} ${items[0].say}`);
    },
    [level, audio, talk],
  );

  const finishRound = useCallback(
    (p: Play, praise: string) => {
      const keep = p.activity === "sort" ? 12 : 15;
      saveRecent(rememberKeys(loadRecent(), `${p.activity}/${level}`, p.items.map((i) => i.key), keep));
      const won = awardSticker(loadBook(), rng);
      saveBook(won.book);
      setBook(won.book);
      submitScore(GAME_ID, won.book.earned.length);
      setReward({ sticker: won.sticker, isNew: won.isNew });
      talk(`${praise} You finished the round! ${won.isNew ? `You earned the ${won.sticker} sticker!` : `Here is another ${won.sticker} sticker!`}`);
      timer.current = window.setTimeout(() => {
        audio.levelUp();
        setConfetti((c) => c + 1);
        setScreen("reward");
      }, NEXT_DELAY);
    },
    [level, audio, talk],
  );

  /** Right answer: celebrate, then the next item (or the sticker). */
  const solve = useCallback(
    (p: Play, extra: Partial<Play> = {}) => {
      const item = p.items[p.idx];
      const firstTry = [...p.firstTry];
      if (firstTry[p.idx] === undefined) {
        firstTry[p.idx] = true;
        recordAnswer(GAME_ID, asQuestion(item, grade), true);
      }
      const solved: Play = { ...p, ...extra, solved: true, firstTry };
      setPlay(solved);
      audio.correct();
      setConfetti((c) => c + 1);
      doHop();
      if (p.idx + 1 >= p.items.length) {
        finishRound(solved, item.praise);
        return;
      }
      const next = p.items[p.idx + 1];
      talk(`${item.praise} ${next.say}`);
      timer.current = window.setTimeout(() => {
        setPlay((cur) => (cur && cur === solved ? { ...cur, idx: cur.idx + 1, ...itemState(next) } : cur));
      }, NEXT_DELAY);
    },
    [audio, finishRound, grade, talk],
  );

  /** Wrong answer: a gentle wiggle and a hint; never a game over. */
  const miss = useCallback(
    (p: Play, shake: number, why: string, extra: Partial<Play> = {}) => {
      const item = p.items[p.idx];
      const firstTry = [...p.firstTry];
      if (firstTry[p.idx] === undefined) {
        firstTry[p.idx] = false;
        recordAnswer(GAME_ID, asQuestion(item, grade), false);
      }
      audio.tone(330, 0.16, "triangle", 0.35, 247);
      setPlay({ ...p, ...extra, tries: p.tries + 1, shake, shakeKey: p.shakeKey + 1, firstTry });
      talk(why);
    },
    [audio, grade, talk],
  );

  const onChoice = useCallback(
    (i: number) => {
      if (!play || play.solved) return;
      const item = play.items[play.idx];
      if (item.type !== "choice" || play.wrong.includes(i) || i >= item.choices.length) return;
      if (i === item.answer) solve(play);
      else miss(play, i, `${item.whyWrong[i]}`, { wrong: [...play.wrong, i] });
    },
    [play, solve, miss],
  );

  /** Word Builder: a tile goes into `slot` (or the next empty slot when tapped). */
  const onTile = useCallback(
    (ti: number, slot?: number) => {
      if (!play || play.solved) return;
      const item = play.items[play.idx];
      if (item.type !== "build" || play.used.includes(ti)) return;
      const target = slot ?? play.placed.findIndex((u) => u === null);
      if (target < 0 || play.placed[target] !== null) return;
      const tile = item.tiles[ti];
      if (tile !== item.units[target]) {
        miss(play, ti, item.whyWrong);
        return;
      }
      const placed = [...play.placed];
      placed[target] = tile;
      const used = [...play.used, ti];
      if (placed.every((u) => u !== null)) {
        solve(play, { placed, used, shake: null });
      } else {
        audio.blip();
        setPlay({ ...play, placed, used, shake: null });
        talk(sayTile(tile));
      }
    },
    [play, solve, miss, audio, talk],
  );

  const onBasket = useCallback(
    (b: number) => {
      if (!play || play.solved) return;
      const item = play.items[play.idx];
      if (item.type !== "sort" || play.wrong.includes(b)) return;
      if (b === item.answer) {
        const sorted = play.sorted.map((s, i) => (i === b ? [...s, item.card] : s));
        solve(play, { sorted });
      } else miss(play, b, item.whyWrong, { wrong: [...play.wrong, b] });
    },
    [play, solve, miss],
  );

  const replay = useCallback(() => {
    if (screen === "play" && play) {
      const item = play.items[play.idx];
      speak(item.type === "sort" && play.idx > 0 ? `This basket is for ${item.baskets[0].say}. This one is for ${item.baskets[1].say}. ${item.say}` : item.say);
    } else if (screen === "hub") speak("Pick a game! Letter Match, Word Builder, Rhyme Time, Sound Sort, or Sight Words.");
    else if (screen === "title") speak(`Word Hopper! Tap play to hop into ${MASCOT_NAME}'s word garden.`);
  }, [screen, play]);

  const toggleRead = () => {
    const on = !readAloud;
    setReadAloud(on);
    setReadAloudPref(on);
    if (on) speak("Read aloud is on.");
  };

  // Keyboard is optional: 1-4 / A-D answer, R or Space repeats, Escape goes back to the garden.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "escape" && (screen === "play" || screen === "book" || screen === "reward")) {
      goHub(false);
      return;
    }
    if ((k === "r" || k === " ") && screen === "play") {
      const item = play?.items[play.idx];
      if (!(item?.type === "build" && k === "r" && item.tiles.includes("r"))) {
        e.preventDefault();
        replay();
        return;
      }
    }
    if (screen !== "play" || !play) return;
    const item = play.items[play.idx];
    const digit = /^[1-9]$/.test(k) ? Number(k) - 1 : -1;
    if (item.type === "choice") {
      const letter = "abcd".indexOf(k);
      const i = digit >= 0 ? digit : letter;
      if (i >= 0 && i < item.choices.length) onChoice(i);
    } else if (item.type === "sort") {
      const i = digit >= 0 ? digit : "ab".indexOf(k);
      if (i >= 0 && i < item.baskets.length) onBasket(i);
    } else {
      if (digit >= 0 && digit < item.tiles.length) onTile(digit);
      else if (/^[a-z]$/.test(k)) {
        // Typing a letter picks the first unused tile that starts with it.
        const next = play.placed.findIndex((u) => u === null);
        const want = next >= 0 ? item.units[next] : "";
        const cands = item.tiles.map((t, ti) => ({ t, ti })).filter(({ t, ti }) => t[0] === k && !play.used.includes(ti));
        const best = cands.find(({ t }) => t === want) ?? cands[0];
        if (best) onTile(best.ti);
      }
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Playtest hook.
  useEffect(() => {
    if (!debug) return;
    const item = play?.items[play.idx];
    (window as unknown as { __wh: unknown }).__wh = {
      screen, grade, level, activity: play?.activity ?? null, idx: play?.idx ?? null, solved: play?.solved ?? false, tries: play?.tries ?? 0,
      item: item ? { ...item } : null, book, reward, readAloud,
    };
  }, [screen, play, grade, level, book, reward, readAloud]);

  const item = play ? play.items[play.idx] : null;
  const hint = !!play && play.tries >= 2 && !play.solved;

  return (
    <div className={`wh-app screen-${screen}`}>
      <header className="wh-bar">
        {screen === "title" ? (
          <a className="wh-btn wh-arcade" href={arcadeLink(grade)} aria-label="Back to the arcade">
            <span aria-hidden>◀</span> <span className="wh-btn-label">ARCADE</span>
          </a>
        ) : (
          <button className="wh-btn" onClick={() => (screen === "hub" ? setScreen("title") : goHub(false))} aria-label={screen === "hub" ? "Back to the start" : "Back to the word garden"}>
            <HomeIcon />
          </button>
        )}
        {screen === "play" && play ? (
          <div className="wh-pads" aria-label={`Item ${play.idx + 1} of ${ROUND_SIZE}`}>
            {play.items.map((_, i) => (
              <span key={i} className={`wh-pad ${i < play.idx || (i === play.idx && play.solved) ? "done" : i === play.idx ? "now" : ""}`}>
                {(i < play.idx || (i === play.idx && play.solved)) && <Mascot size="100%" />}
              </span>
            ))}
          </div>
        ) : (
          <div className="wh-bar-title wh-pixel">{screen === "book" ? "MY STICKERS" : screen === "hub" ? "WORD GARDEN" : ""}</div>
        )}
        <div className="wh-bar-right">
          {speechSupported() && (
            <button className="wh-btn" onClick={replay} aria-label="Say it again" title="Say it again (R)">
              <SpeakerIcon />
            </button>
          )}
          <button className="wh-btn" onClick={() => setMuted(audio.toggleMute())} aria-label={muted ? "Sound effects off" : "Sound effects on"} aria-pressed={!muted}>
            <NoteIcon off={muted} />
          </button>
        </div>
      </header>

      <main className="wh-main">
        {screen === "title" && (
          <Title
            grade={grade}
            level={level}
            fromArcade={fromArcade}
            onGrade={chooseGrade}
            onPlay={() => goHub(true)}
            readAloud={readAloud}
            onToggleRead={toggleRead}
            stickers={book.earned.length}
          />
        )}
        {screen === "hub" && <Hub level={level} book={book} onPick={startActivity} onBook={() => { setScreen("book"); talk(`Your sticker book! You have ${book.earned.length} stickers.`); }} hop={hop} />}
        {screen === "play" && play && item && (
          <div className={`wh-play act-${play.activity}`}>
            <div className="wh-say">
              <Mascot hop={hop} className={`wh-mascot-small ${hop ? "hop" : ""}`} />
              <button className="wh-bubble" onClick={replay} aria-label="Say it again">
                <span className="wh-bubble-text">{item.prompt}</span>
                <SpeakerIcon />
              </button>
            </div>
            {item.type === "choice" && <ChoiceView key={`${play.idx}`} item={item} play={play} hint={hint} onChoice={onChoice} onCue={replay} />}
            {item.type === "build" && <BuildView key={`${play.idx}`} item={item} play={play} hint={hint} onTile={onTile} onSay={replay} />}
            {item.type === "sort" && <SortView key={`sortround`} item={item} play={play} hint={hint} onBasket={onBasket} onSay={replay} />}
          </div>
        )}
        {screen === "reward" && reward && play && (
          <Reward
            sticker={reward.sticker}
            isNew={reward.isNew}
            count={book.earned.length}
            onAgain={() => startActivity(play.activity)}
            onHub={() => goHub(false)}
            onBook={() => setScreen("book")}
            onSticker={() => speak(`The ${reward.sticker} sticker!`)}
          />
        )}
        {screen === "book" && <StickerBook book={book} onBack={() => goHub(false)} />}
      </main>
      {confetti > 0 && <Confetti key={confetti} />}
    </div>
  );
}

// ------------------------------------------------------------------ screens

function Title({
  grade, level, fromArcade, onGrade, onPlay, readAloud, onToggleRead, stickers,
}: {
  grade: Grade; level: Level; fromArcade: boolean; onGrade: (g: Grade) => void; onPlay: () => void; readAloud: boolean; onToggleRead: () => void; stickers: number;
}) {
  const note = levelGradeNote(grade, level);
  return (
    <div className="wh-title">
      <h1 className="wh-logo wh-pixel">
        <span>WORD</span> <span>HOPPER</span>
      </h1>
      <div className="wh-sub wh-pixel">
        SPIDERBEN10'S ARCADE
        <br />
        K–2 READING · NC STANDARDS
      </div>
      <div className="wh-title-frog">
        <Mascot size="100%" className="wh-bounce" />
      </div>
      <p className="wh-hello">Hop into {MASCOT_NAME}'s word garden!</p>
      {fromArcade ? (
        <div className="wh-gradebadge wh-pixel">
          {note ?? gradeLabel(grade).toUpperCase()}
          {!note && <span className="wh-dim"> · change it in the arcade</span>}
        </div>
      ) : (
        <div className="wh-grades" role="radiogroup" aria-label="Grade">
          {(["K", "1", "2"] as Grade[]).map((g) => (
            <button key={g} role="radio" aria-checked={g === grade} className={`wh-grade wh-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} aria-label={gradeLabel(g)}>
              {g}
              <small>{g === "K" ? "KINDER" : `GRADE ${g}`}</small>
            </button>
          ))}
        </div>
      )}
      <button className="wh-play-btn wh-pixel" onClick={onPlay} autoFocus>
        PLAY ▶
      </button>
      <div className="wh-title-row">
        {speechSupported() && (
          <button className={`wh-toggle ${readAloud ? "on" : ""}`} onClick={onToggleRead} aria-pressed={readAloud}>
            <SpeakerIcon /> Read aloud: {readAloud ? "ON" : "OFF"}
          </button>
        )}
        <span className="wh-dim">Stickers: {stickers} / {STICKERS.length}</span>
      </div>
    </div>
  );
}

function HubIcon({ a }: { a: Activity }) {
  if (a === "letters")
    return (
      <span className="wh-hubicon letters">
        <span className="wh-tilemini">A</span>
        <span className="wh-tilemini alt">a</span>
      </span>
    );
  if (a === "builder")
    return (
      <span className="wh-hubicon">
        <Sprite word="cat" size="56%" labelled={false} />
        <span className="wh-tilemini small">cat</span>
      </span>
    );
  if (a === "rhyme")
    return (
      <span className="wh-hubicon">
        <Sprite word="cat" size="46%" labelled={false} />
        <Sprite word="hat" size="46%" labelled={false} />
      </span>
    );
  if (a === "sort")
    return (
      <span className="wh-hubicon">
        <Sprite word="basket" size="70%" labelled={false} />
      </span>
    );
  return (
    <span className="wh-hubicon">
      <Sprite word="star" size="50%" labelled={false} />
      <span className="wh-tilemini small">the</span>
    </span>
  );
}

function Hub({ level, book, onPick, onBook, hop }: { level: Level; book: Book; onPick: (a: Activity) => void; onBook: () => void; hop: boolean }) {
  return (
    <div className="wh-hub">
      <div className="wh-hub-hello">
        <Mascot hop={hop} className="wh-mascot-hub wh-bounce" />
        <div className="wh-hub-say">Pick a game!</div>
      </div>
      <div className="wh-pond">
        {ACTIVITIES.map((a) => (
          <button key={a} className={`wh-lily act-${a}`} onClick={() => onPick(a)} data-activity={a}>
            <HubIcon a={a} />
            <span className="wh-lily-name wh-pixel">{ACTIVITY_INFO[a].title.toUpperCase()}</span>
          </button>
        ))}
        <button className="wh-lily book" onClick={onBook} data-activity="book">
          <span className="wh-hubicon">
            <Sprite word={book.earned[book.earned.length - 1] ?? "star"} size="56%" labelled={false} />
          </span>
          <span className="wh-lily-name wh-pixel">
            STICKERS {book.earned.length}/{STICKERS.length}
          </span>
        </button>
      </div>
      <div className="wh-level wh-pixel">{level === "K" ? "KINDERGARTEN WORDS" : `GRADE ${level} WORDS`}</div>
    </div>
  );
}

function PickFace({ pick, size }: { pick: { kind: string; value: string }; size?: string }) {
  if (pick.kind === "picture")
    return (
      <>
        <Sprite word={pick.value} size={size} className="wh-pic" />
        <span className="wh-cap">{pick.value}</span>
      </>
    );
  return <span className={pick.kind === "letter" ? "wh-letter" : "wh-word"}>{pick.value}</span>;
}

function ChoiceView({ item, play, hint, onChoice, onCue }: { item: ChoiceItem; play: Play; hint: boolean; onChoice: (i: number) => void; onCue: () => void }) {
  const readItem = item.cue?.kind === "picture" && item.choices[0].kind === "word";
  return (
    <div className="wh-stage">
      <div className="wh-cue">
        {item.cue === null ? (
          <button className="wh-bigspeak" onClick={onCue} aria-label="Hear the word again">
            <SpeakerIcon />
          </button>
        ) : item.cue.kind === "letter" ? (
          <button className="wh-cuecard letter" onClick={onCue} aria-label="Say it again">
            <span className="wh-bigletter">{item.cue.value}</span>
          </button>
        ) : (
          <button className="wh-cuecard" onClick={onCue} aria-label="Say it again">
            <Sprite word={item.cue.value} size="100%" className="wh-cuepic" labelled={!readItem} />
            {!readItem && <span className="wh-cap big">{item.cue.value}</span>}
          </button>
        )}
      </div>
      <div className={`wh-choices n${item.choices.length}`}>
        {item.choices.map((c, i) => {
          const tried = play.wrong.includes(i);
          const cls = [
            "wh-choice",
            `kind-${c.kind}`,
            tried ? "tried" : "",
            play.shake === i ? `wiggle w${play.shakeKey % 2}` : "",
            hint && i === item.answer ? "glow" : "",
            play.solved && i === item.answer ? "right" : "",
          ].join(" ");
          return (
            <button key={i} className={cls} onClick={() => onChoice(i)} aria-disabled={tried || play.solved} data-choice={i}>
              <span className="wh-key" aria-hidden>
                {i + 1}
              </span>
              <PickFace pick={c} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A button that can be tapped, or dragged and dropped on an element with data-drop. */
function DragButton({
  className, onTap, onDrop, children, label, data,
}: { className: string; onTap: () => void; onDrop: (target: number) => void; children: ReactNode; label: string; data?: Record<string, string> }) {
  const ref = useRef<HTMLButtonElement>(null);
  const st = useRef<{ id: number; x: number; y: number; drag: boolean } | null>(null);
  const suppress = useRef(false);
  const reset = () => {
    const el = ref.current;
    if (el) {
      el.style.transform = "";
      el.classList.remove("dragging");
    }
  };
  return (
    <button
      ref={ref}
      className={className}
      aria-label={label}
      {...Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [`data-${k}`, v]))}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        st.current = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: false };
        try {
          ref.current?.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (!s.drag && Math.hypot(dx, dy) > 12) s.drag = true;
        if (s.drag && ref.current) {
          ref.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
          ref.current.classList.add("dragging");
        }
      }}
      onPointerUp={(e) => {
        const s = st.current;
        st.current = null;
        if (!s || !s.drag) return;
        reset();
        suppress.current = true;
        window.setTimeout(() => (suppress.current = false), 80);
        for (const n of document.elementsFromPoint(e.clientX, e.clientY)) {
          const d = n.closest("[data-drop]") as HTMLElement | null;
          if (d && !ref.current?.contains(d)) {
            onDrop(Number(d.dataset.drop));
            return;
          }
        }
      }}
      onPointerCancel={() => {
        st.current = null;
        reset();
      }}
      onClick={() => {
        if (suppress.current) return;
        onTap();
      }}
    >
      {children}
    </button>
  );
}

function BuildView({ item, play, hint, onTile, onSay }: { item: BuildItem; play: Play; hint: boolean; onTile: (ti: number, slot?: number) => void; onSay: () => void }) {
  const next = play.placed.findIndex((u) => u === null);
  const hintTile = hint && next >= 0 ? item.tiles.findIndex((t, ti) => t === item.units[next] && !play.used.includes(ti)) : -1;
  return (
    <div className="wh-stage build">
      <div className="wh-cue">
        <button className="wh-cuecard" onClick={onSay} aria-label={`Say ${item.word} again`}>
          <Sprite word={item.word} size="100%" className="wh-cuepic" />
        </button>
      </div>
      <div className="wh-factory">
        <div className={`wh-slots n${item.units.length} ${play.solved ? "done" : ""}`}>
          {item.units.map((u, s) => (
            <div key={s} data-drop={s} className={`wh-slot ${play.placed[s] ? "filled" : ""} ${s === next && !play.solved ? "next" : ""} ${s < item.given ? "given" : ""}`} aria-label={play.placed[s] ? `${u}` : "empty"}>
              {play.placed[s] ?? ""}
            </div>
          ))}
        </div>
        <div className={`wh-belt ${play.solved ? "go" : ""}`} aria-hidden />
      </div>
      <div className="wh-tiles">
        {item.tiles.map((t, ti) =>
          play.used.includes(ti) ? (
            <span key={ti} className="wh-tile ghost" aria-hidden />
          ) : (
            <DragButton
              key={ti}
              className={`wh-tile ${play.shake === ti ? `wiggle w${play.shakeKey % 2}` : ""} ${ti === hintTile ? "glow" : ""}`}
              onTap={() => onTile(ti)}
              onDrop={(slot) => onTile(ti, slot)}
              label={`Letter tile ${t}`}
              data={{ tile: String(ti) }}
            >
              <span className="wh-key" aria-hidden>
                {ti + 1}
              </span>
              {t}
            </DragButton>
          ),
        )}
      </div>
    </div>
  );
}

function SortView({ item, play, hint, onBasket, onSay }: { item: SortItem; play: Play; hint: boolean; onBasket: (b: number) => void; onSay: () => void }) {
  return (
    <div className="wh-stage sort">
      <div className="wh-cardzone">
        {!play.solved ? (
          <DragButton key={`${play.idx}`} className={`wh-sortcard ${hint ? "hinting" : ""}`} onTap={onSay} onDrop={onBasket} label={`Picture card: ${item.card}`} data={{ card: item.card }}>
            <Sprite word={item.card} size="100%" className="wh-cuepic" />
            <span className="wh-cap big">{item.card}</span>
          </DragButton>
        ) : (
          <div className="wh-sortcard placeholder" aria-hidden />
        )}
        <div className="wh-drag-hint wh-dim">Tap a basket or drag the picture</div>
      </div>
      <div className="wh-baskets">
        {item.baskets.map((b, i) => (
          <button
            key={i}
            data-drop={i}
            data-basket={i}
            className={`wh-basket ${play.wrong.includes(i) ? "tried" : ""} ${play.shake === i ? `wiggle w${play.shakeKey % 2}` : ""} ${hint && i === item.answer ? "glow" : ""}`}
            onClick={() => onBasket(i)}
            aria-label={`Basket ${i + 1}: ${b.label}`}
          >
            <span className="wh-key" aria-hidden>
              {i + 1}
            </span>
            <span className="wh-basket-label">{b.label}</span>
            <span className="wh-basket-key">
              <Sprite word={b.key} size="100%" />
              <span className="wh-cap">{b.key}</span>
            </span>
            <span className="wh-basket-img">
              <Sprite word="basket" size="100%" labelled={false} />
              <span className="wh-basket-in">
                {play.sorted[i].map((w, j) => (
                  <Sprite key={j} word={w} size="100%" className="wh-in" />
                ))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StickerBadge({ word, silhouette, size }: { word: string; silhouette?: boolean; size?: string }) {
  return (
    <span className={`wh-sticker ${silhouette ? "empty" : ""}`} style={size ? { width: size, height: size } : undefined}>
      {silhouette ? <span className="wh-q">?</span> : <Sprite word={word} size="74%" />}
    </span>
  );
}

function Reward({ sticker, isNew, count, onAgain, onHub, onBook, onSticker }: { sticker: string; isNew: boolean; count: number; onAgain: () => void; onHub: () => void; onBook: () => void; onSticker: () => void }) {
  return (
    <div className="wh-reward">
      <div className="wh-reward-title wh-pixel">{isNew ? "NEW STICKER!" : "SUPER STAR!"}</div>
      <button className="wh-reward-sticker" onClick={onSticker} aria-label={`The ${sticker} sticker`}>
        <StickerBadge word={sticker} />
      </button>
      <div className="wh-reward-name">{sticker}</div>
      <div className="wh-pads big" aria-hidden>
        {Array.from({ length: ROUND_SIZE }, (_, i) => (
          <span key={i} className="wh-pad done">
            <Mascot size="100%" />
          </span>
        ))}
      </div>
      <div className="wh-dim">
        Sticker book: {count} / {STICKERS.length}
      </div>
      <div className="wh-reward-btns">
        <button className="wh-big-btn again" onClick={onAgain} aria-label="Play again">
          <AgainIcon /> <span>AGAIN</span>
        </button>
        <button className="wh-big-btn" onClick={onBook} aria-label="Sticker book">
          <BookIcon /> <span>BOOK</span>
        </button>
        <button className="wh-big-btn" onClick={onHub} aria-label="Word garden">
          <HomeIcon /> <span>GARDEN</span>
        </button>
      </div>
    </div>
  );
}

function StickerBook({ book, onBack }: { book: Book; onBack: () => void }) {
  return (
    <div className="wh-book">
      <div className="wh-book-count wh-pixel">
        {book.earned.length} / {STICKERS.length}
      </div>
      <div className="wh-book-grid">
        {STICKERS.map((s) => {
          const got = book.earned.includes(s);
          return (
            <button key={s} className={`wh-book-slot ${got ? "got" : ""}`} onClick={() => speak(got ? `${s}!` : "Finish a round to get a new sticker!")} aria-label={got ? `${s} sticker` : "Sticker not earned yet"}>
              <StickerBadge word={s} silhouette={!got} />
            </button>
          );
        })}
      </div>
      <button className="wh-big-btn" onClick={onBack}>
        <HomeIcon /> <span>GARDEN</span>
      </button>
    </div>
  );
}

const CONFETTI_COLORS = ["#e63946", "#ffd23f", "#52c41a", "#3a86ff", "#ff9ec7", "#9b5de5", "#ff9f1c"];

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        dur: 0.9 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 120,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.floor(Math.random() * 3) * 3,
      })),
    [],
  );
  return (
    <div className="wh-confetti" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ["--drift" as string]: `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ pixel icons

function Icon({ rows, color = "currentColor" }: { rows: string[]; color?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="28" height="28" shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((r, y) => [...r].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)))}
    </svg>
  );
}

function HomeIcon() {
  return <Icon rows={[".....##.....", "....####....", "...######...", "..########..", ".##########.", "############", "..########..", "..###..###..", "..###..###..", "..###..###..", "..###..###..", "..########.."]} />;
}
function SpeakerIcon() {
  return <Icon rows={["......#.....", ".....##..#..", "....###...#.", "#######.#..#", "#######..#.#", "#######..#.#", "#######..#.#", "#######.#..#", "....###...#.", ".....##..#..", "......#.....", "............"]} />;
}
function NoteIcon({ off }: { off: boolean }) {
  return off ? (
    <Icon rows={["#..........#", ".#....####.#", "..#..#####..", "...#.##..#..", "....##...#..", "....#.#..#..", "....#..#.#..", "..###...##..", ".####..###..", ".####.####.#", "..##..###...", "#.........#."]} />
  ) : (
    <Icon rows={["......####..", ".....#####..", ".....##..#..", ".....#...#..", ".....#...#..", ".....#...#..", ".....#...#..", "...###.###..", "..####.####.", "..####.####.", "...##...##..", "............"]} />
  );
}
function AgainIcon() {
  return <Icon rows={["....####....", "..##....#...", ".#......###.", ".#.......##.", "#........#..", "#...........", "#...........", "#.........#.", ".#.......#..", ".#......#...", "..##..##....", "....##......"]} />;
}
function BookIcon() {
  return <Icon rows={["............", "####....####", "#..##..##..#", "#...#..#...#", "#.#.#..#.#.#", "#...#..#...#", "#.#.#..#.#.#", "#...#..#...#", "#...#..#...#", "#..##..##..#", "#####..#####", "....####...."]} />;
}
