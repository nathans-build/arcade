import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio } from "@/kit/audio";
import { GRADES, arcadeLink, gradeFromArcade, gradeLabel, gradeNumber, initialGrade, isEarlyReader, rememberGrade } from "@/kit/grades";
import { readAloudPref, setReadAloudPref, speak, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { BGS, bgById } from "@/art/bgs";
import { downloadComic } from "@/art/comic";
import { verbAnim } from "@/art/mods";
import { buildScene, demoActor, drawDemo, SceneRenderer, type Scene } from "@/art/scene";
import { spriteCanvas } from "@/art/raster";
import { spriteById } from "@/art/sprites";
import { ADJ_DEMO, cardFits, dealCards, rngFrom, wrongCardMessage, type Card } from "@/story/cards";
import { coach, type CoachResult } from "@/story/grammar";
import { bandOf, promptFor, standardFor, typeName } from "@/story/prompts";
import { cleanWord, isRude, MAX_WORD, sanitizeInput } from "@/story/safety";
import {
  addToShelf, countStory, deleteCustom, loadCustom, loadShelf, MAX_TEMPLATE, MAX_TITLE, newId, removeFromShelf, saveCustom, storiesMade,
  type CustomStory, type ShelfItem,
} from "@/story/storage";
import { STORIES, storyById } from "@/story/stories";
import { fill, filledText, parseTemplate } from "@/story/template";
import { BANDS, type Band, type BlankType, type CastSpec, type Parsed } from "@/story/types";
import { silly, SILLIES } from "@/sfx";
import "@/silly.css";

/** A bouncy, goofy bassline (Hz, 0 = rest). */
const BASS = [131, 0, 165, 0, 196, 0, 165, 0, 147, 0, 175, 0, 220, 0, 175, 131];
const MAX_CUSTOM_BLANKS = 20;

type Screen = "title" | "pick" | "fill" | "reveal" | "write" | "shelf" | "handoff";

interface Play {
  title: string;
  storyId: string;
  bg: string;
  template: string;
  cast?: CastSpec[];
  parsed: Parsed;
  /** Opened from the Story Shelf (already finished). */
  fromShelf?: string;
}

const DEBUG = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

function playFor(title: string, storyId: string, bg: string, template: string, cast?: CastSpec[]): Play {
  return { title, storyId, bg, template, cast, parsed: parseTemplate(template, { maxBlanks: MAX_CUSTOM_BLANKS }) };
}

const typeClass = (t: BlankType) => `w-${t.replace(/[^a-z]/g, "")}`;

export default function SillyStory() {
  const audio = useMemo(() => new ChipAudio(BASS, 132), []);
  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [screen, setScreen] = useState<Screen>("title");
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [play, setPlay] = useState<Play | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [shelf, setShelf] = useState<ShelfItem[]>(() => loadShelf());
  const [custom, setCustom] = useState<CustomStory[]>(() => loadCustom());
  const [editing, setEditing] = useState<CustomStory | null>(null);
  const [made, setMade] = useState(() => storiesMade());
  const band = bandOf(grade);
  const readRef = useRef(readAloud);
  readRef.current = readAloud;

  const say = useCallback((text: string, force = false) => {
    if (force || readRef.current) speak(text);
  }, []);

  useEffect(() => {
    rememberGrade(grade);
  }, [grade]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    if (!DEBUG) return;
    (window as unknown as { __ss: unknown }).__ss = { screen, play, words, grade };
  }, [screen, play, words, grade]);

  const unlock = () => audio.unlock();

  const toggleMute = () => {
    audio.unlock();
    setMuted(audio.toggleMute());
  };
  const toggleRead = () => {
    const on = !readAloud;
    setReadAloud(on);
    setReadAloudPref(on);
    if (on) speak("Read aloud is on.");
  };

  const startPlay = (p: Play) => {
    unlock();
    audio.checkpoint();
    stopSpeaking();
    setPlay(p);
    setWords([]);
    setScreen("fill");
  };

  const finish = (ws: string[]) => {
    if (!play) return;
    setWords(ws);
    setMade(countStory());
    setScreen("reveal");
    audio.levelUp();
    // Read the finished story from this tap (iPad only allows speech that starts from a tap).
    say(`${play.title}. ${filledText(play.parsed, ws)}`);
  };

  const openShelf = (item: ShelfItem) => {
    const base = storyById(item.storyId);
    const p = playFor(item.title, item.storyId, item.bg, item.template, base?.cast);
    p.fromShelf = item.id;
    setPlay(p);
    setWords(item.words);
    setScreen("reveal");
  };

  return (
    <div className="ss-root" onPointerDown={unlock}>
      <div className="ss-toolbar">
        <a href={arcadeLink(grade)} className="ss-tool">◀ ARCADE</a>
        <div className="ss-tools">
          {speechSupported() && (
            <button type="button" className={`ss-tool ${readAloud ? "on" : ""}`} onClick={toggleRead} aria-pressed={readAloud} title="Read aloud">
              🔊 READ {readAloud ? "ON" : "OFF"}
            </button>
          )}
          <button type="button" className="ss-tool" onClick={toggleMute} aria-pressed={muted} title="Sound effects">
            {muted ? "♪ SOUND OFF" : "♪ SOUND ON"}
          </button>
        </div>
      </div>

      {screen === "title" && (
        <TitleScreen
          grade={grade}
          onGrade={(g) => {
            setGrade(g);
            audio.blip();
          }}
          made={made}
          shelfCount={shelf.length}
          onPick={() => {
            unlock();
            audio.blip();
            setScreen("pick");
            say("Pick a story!");
          }}
          onWrite={() => {
            unlock();
            audio.blip();
            setEditing(null);
            setScreen("write");
          }}
          onShelf={() => {
            audio.blip();
            setShelf(loadShelf());
            setScreen("shelf");
          }}
        />
      )}

      {screen === "pick" && (
        <PickScreen
          band={band}
          grade={grade}
          custom={custom}
          onBack={() => setScreen("title")}
          onStory={(id) => {
            const s = storyById(id)!;
            say(s.title);
            startPlay(playFor(s.title, s.id, s.bg, s.template, s.cast));
          }}
          onCustom={(c) => startPlay(playFor(c.title, "custom", c.bg, c.template))}
          onSpeak={(t) => say(t, true)}
        />
      )}

      {screen === "fill" && play && (
        <FillScreen
          key={`${play.storyId}-${play.title}-${play.template.length}`}
          play={play}
          grade={grade}
          audio={audio}
          readAloud={readAloud}
          say={say}
          onQuit={() => setScreen(play.storyId === "custom" ? "write" : "pick")}
          onDone={finish}
        />
      )}

      {screen === "reveal" && play && (
        <RevealScreen
          play={play}
          words={words}
          grade={grade}
          audio={audio}
          onRead={() => say(`${play.title}. ${filledText(play.parsed, words)}`, true)}
          onAgain={() => startPlay({ ...play, fromShelf: undefined })}
          onNew={() => setScreen(play.storyId === "custom" ? "write" : "pick")}
          onTitle={() => {
            stopSpeaking();
            setScreen("title");
          }}
          shelfId={play.fromShelf}
          onShelve={() => {
            const item: ShelfItem = {
              id: newId(), title: play.title, storyId: play.storyId, bg: play.bg, template: play.template, words, grade, saved: Date.now(),
            };
            const { list, ok } = addToShelf(item);
            setShelf(list);
            if (ok) audio.correct();
            return ok;
          }}
          onUnshelve={(id) => {
            setShelf(removeFromShelf(id));
            setScreen("shelf");
          }}
        />
      )}

      {screen === "write" && (
        <WriteScreen
          grade={grade}
          custom={custom}
          editing={editing}
          onEdit={setEditing}
          onSave={(c) => {
            const list = saveCustom(c);
            setCustom(list);
            audio.correct();
            return list[0];
          }}
          onDelete={(id) => {
            setCustom(deleteCustom(id));
            setEditing(null);
          }}
          onPlay={(c) => startPlay(playFor(c.title, "custom", c.bg, c.template))}
          onHandoff={(c) => {
            setPlay(playFor(c.title, "custom", c.bg, c.template));
            setScreen("handoff");
          }}
          onBack={() => setScreen("title")}
        />
      )}

      {screen === "handoff" && play && (
        <div className="ss-panel ss-handoff">
          <div className="ss-h1 ss-pixel">PASS IT TO A FRIEND!</div>
          <p className="ss-big">Hand the device to a friend. Don't let them peek at the story!</p>
          <p>They'll fill in {play.parsed.blanks.length} words for <b>“{play.title}”</b>, then you can laugh at it together.</p>
          <div className="ss-row">
            <button type="button" className="ss-btn ghost" onClick={() => setScreen("write")}>◀ Back</button>
            <button type="button" className="ss-btn big" autoFocus onClick={() => startPlay(play)}>I'm the friend. Start! ▶</button>
          </div>
        </div>
      )}

      {screen === "shelf" && (
        <ShelfScreen
          shelf={shelf}
          onOpen={openShelf}
          onRemove={(id) => setShelf(removeFromShelf(id))}
          onBack={() => setScreen("title")}
        />
      )}

      <div className="ss-foot">Silly Story Studio · by SpiderBen10 (NZDO) · your words stay on this device</div>
    </div>
  );
}

/* ================================================================ title */

function TitleScreen({
  grade, onGrade, onPick, onWrite, onShelf, made, shelfCount,
}: {
  grade: Grade; onGrade: (g: Grade) => void; onPick: () => void; onWrite: () => void; onShelf: () => void; made: number; shelfCount: number;
}) {
  const fromArcade = gradeFromArcade();
  const [help, setHelp] = useState(false);
  const early = isEarlyReader(grade);
  return (
    <div className="ss-panel ss-title">
      <TitleArt />
      <h1 className="ss-logo ss-pixel">
        <span className="r">SILLY</span> <span className="y">STORY</span> <span className="b">STUDIO</span>
      </h1>
      <div className="ss-sub ss-pixel">SPIDERBEN10'S ARCADE · K–12 GRAMMAR & WRITING</div>
      {fromArcade ? (
        <div className="ss-sub ss-pixel ss-gradebadge">
          {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
        </div>
      ) : (
        <>
          <div className="ss-h ss-pixel">PICK YOUR GRADE</div>
          <div className="ss-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} type="button" role="radio" aria-checked={g === grade} className={`ss-grade ss-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="ss-row center">
        <button type="button" className="ss-btn big" autoFocus onClick={onPick}>Pick a story ▶</button>
        {gradeNumber(grade) >= 3 && <button type="button" className="ss-btn" onClick={onWrite}>✎ Write your own</button>}
        <button type="button" className="ss-btn ghost" onClick={onShelf}>📚 Story Shelf{shelfCount ? ` (${shelfCount})` : ""}</button>
        <button type="button" className="ss-btn ghost" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How to play</button>
      </div>
      {help ? (
        <div className="ss-help">
          <ol>
            <li><b>Pick a story.</b> Don't peek: the story stays hidden until the end!</li>
            <li>
              <b>Fill in the words.</b> {early ? "Tap a picture card for each word. Tap 🔊 on a card to hear it." : "Type a word (or tap a card) for each blank: nouns, verbs, adjectives and more."} The{" "}
              <span className="y">Grammar Coach</span> helps if a word looks like a different part of speech, but you can always keep your word.
            </li>
            <li><b>Watch it come alive!</b> Your story is read aloud and your words change the pixel picture: nouns become characters, describing words change how they look, and action words make them move.</li>
            <li>Save the comic as a picture, put your favorites on the <b>Story Shelf</b>{gradeNumber(grade) >= 3 ? <>, or <b>write your own</b> story for a friend</> : ""}.</li>
          </ol>
          <div className="dim">
            Keys: <kbd>Enter</kbd> next word · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> pick a card. Everything you type stays on this device.
          </div>
        </div>
      ) : (
        <p className="ss-help center">
          Fill in the blanks without seeing the story, then watch your words turn into a goofy pixel cartoon!
        </p>
      )}
      <div className="ss-help dim center">STORIES MADE: {made}</div>
    </div>
  );
}

/** A little animated pixel parade on the title screen. */
function TitleArt() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const scene: Scene = {
      bg: "park", tint: undefined, rainbowSky: false, particles: [], legend: [],
      actors: [
        { ...demoActor("dragon", { anim: "dance", adj: "purple" }), x: 60, y: 168 },
        { ...demoActor("taco", { anim: "jump", adj: "giant" }), x: 135, y: 168 },
        { ...demoActor("robot", { anim: "wobble", adj: "sparkly" }), x: 200, y: 168 },
        { ...demoActor("cat", { anim: "fly", adj: "cool" }), x: 262, y: 90, air: true },
      ],
    };
    const r = new SceneRenderer(cv, scene);
    r.run();
    return () => r.stop();
  }, []);
  return <canvas ref={ref} className="ss-titleart" aria-hidden="true" />;
}

/* ================================================================ pick a story */

function PickScreen({
  band, grade, custom, onBack, onStory, onCustom, onSpeak,
}: {
  band: Band; grade: Grade; custom: CustomStory[]; onBack: () => void; onStory: (id: string) => void; onCustom: (c: CustomStory) => void; onSpeak: (t: string) => void;
}) {
  const [tab, setTab] = useState<Band>(band);
  const list = STORIES.filter((s) => s.band === tab);
  return (
    <div className="ss-panel">
      <div className="ss-head">
        <button type="button" className="ss-btn ghost small" onClick={onBack}>◀ Back</button>
        <div className="ss-h1 ss-pixel">PICK A STORY</div>
      </div>
      <div className="ss-tabs" role="tablist" aria-label="Grade band">
        {BANDS.map((b) => (
          <button key={b} type="button" role="tab" aria-selected={tab === b} className={`ss-tab ss-pixel ${tab === b ? "on" : ""}`} onClick={() => setTab(b)}>
            {b === "K-2" ? "K–2" : b.replace("-", "–")}{b === band ? " ★" : ""}
          </button>
        ))}
      </div>
      {tab !== band && <p className="ss-help dim">These stories are for grades {tab.replace("-", "–")}. You can still play them!</p>}
      <div className="ss-stories">
        {list.map((s) => {
          const n = parseTemplate(s.template).blanks.length;
          return (
            <button key={s.id} type="button" className="ss-story" data-story={s.id} onClick={() => onStory(s.id)}>
              <BgThumb bg={s.bg} />
              <span className="t ss-pixel">{s.title}</span>
              <span className="d">{s.blurb}</span>
              <span className="n">{n} words to fill</span>
              {isEarlyReader(grade) && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="ss-speak mini"
                  aria-label={`Hear ${s.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak(`${s.title}. ${s.blurb}`);
                  }}
                >
                  🔊
                </span>
              )}
            </button>
          );
        })}
      </div>
      {custom.length > 0 && gradeNumber(grade) >= 3 && (
        <>
          <div className="ss-h ss-pixel">MY STORIES</div>
          <div className="ss-stories">
            {custom.map((c) => (
              <button key={c.id} type="button" className="ss-story mine" onClick={() => onCustom(c)}>
                <BgThumb bg={c.bg} />
                <span className="t ss-pixel">{c.title}</span>
                <span className="n">{parseTemplate(c.template).blanks.length} words to fill</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BgThumb({ bg }: { bg: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = 320;
    cv.height = 200;
    const c = cv.getContext("2d");
    if (c) bgById(bg).draw(c, 1);
  }, [bg]);
  return <canvas ref={ref} className="ss-thumb" aria-hidden="true" />;
}

/* ================================================================ fill in the blanks */

function FillScreen({
  play, grade, audio, readAloud, say, onQuit, onDone,
}: {
  play: Play; grade: Grade; audio: ChipAudio; readAloud: boolean; say: (t: string, force?: boolean) => void; onQuit: () => void; onDone: (w: string[]) => void;
}) {
  const band = bandOf(grade);
  const mode: "cards" | "both" | "type" = band === "K-2" ? "cards" : band === "3-5" ? "both" : "type";
  const { blanks } = play.parsed;
  const [idx, setIdx] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [coachMsg, setCoachMsg] = useState<(CoachResult & { word: string }) | null>(null);
  const [wrong, setWrong] = useState<{ card: Card; msg: string } | null>(null);
  const [praise, setPraise] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const seed = useRef(Math.floor(Math.random() * 1e9));
  const inputRef = useRef<HTMLInputElement>(null);
  const blank = blanks[idx];
  const info = blank ? promptFor(blank, grade) : null;
  const used = useMemo(() => new Set(words.map((w) => w.toLowerCase())), [words]);
  const cards = useMemo(
    () => (blank && mode !== "type" ? dealCards(blank, rngFrom(seed.current + idx * 7919), used) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx, blank, mode],
  );

  // Read each prompt aloud (K-2 by default).
  useEffect(() => {
    if (!info) return;
    if (readAloud) say(info.sentence);
    if (mode !== "cards") {
      const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Keep the word box visible above a phone's on-screen keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (document.activeElement === inputRef.current) inputRef.current?.scrollIntoView({ block: "center" });
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const accept = useCallback(
    (raw: string) => {
      const w = cleanWord(raw.trim());
      const next = [...words, w];
      setWords(next);
      setText("");
      setCoachMsg(null);
      setWrong(null);
      silly(audio, SILLIES[(idx * 3) % SILLIES.length]);
      if (next.length >= blanks.length) onDone(next);
      else setIdx(idx + 1);
    },
    [words, blanks.length, audio, idx, onDone],
  );

  const submitTyped = (keep = false) => {
    const w = sanitizeInput(text).trim();
    if (!w) {
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      audio.wrong();
      return;
    }
    // Rude words are quietly swapped; no coaching needed.
    if (isRude(w)) return accept(w);
    if (!keep && blank) {
      const r = coach(w, blank.type, blank.hint);
      if (r.verdict === "hint") {
        setCoachMsg({ ...r, word: w });
        audio.tone(330, 0.15, "triangle", 0.3, 260);
        if (readAloud && r.message) say(r.message);
        return;
      }
      if (r.precise) {
        setPraise(`“${w}” is a precise word!`);
        window.setTimeout(() => setPraise(null), 1800);
      }
    }
    accept(w);
  };

  const pickCard = (card: Card) => {
    if (!blank) return;
    if (cardFits(card, blank)) {
      if (readAloud) say(card.word);
      accept(card.word);
    } else {
      const msg = wrongCardMessage(card, blank, grade);
      setWrong({ card, msg });
      audio.wrong();
      if (readAloud) say(msg);
    }
  };

  // 1-4 / A-D pick a card (when not typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (i >= 0 && k.length === 1 && cards[i] && !coachMsg) {
        e.preventDefault();
        pickCard(cards[i]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!blank || !info) return null;
  const early = band === "K-2";
  return (
    <div className="ss-panel ss-fill" data-blank-type={blank.type}>
      <div className="ss-head">
        <button type="button" className="ss-btn ghost small" onClick={onQuit}>◀ Stories</button>
        <div className="ss-progress ss-pixel" aria-label={`Word ${idx + 1} of ${blanks.length}`}>
          WORD {idx + 1}/{blanks.length}
          <span className="dots">{blanks.map((_, i) => <i key={i} className={i < idx ? "done" : i === idx ? "now" : ""} />)}</span>
        </div>
      </div>
      <div className="ss-storyname ss-pixel">{play.title.toUpperCase()} · NO PEEKING!</div>
      <div className={`ss-prompt ${typeClass(blank.type)}`}>
        <div className="ss-promptrow">
          {speechSupported() && (
            <button type="button" className={`ss-speak ${readAloud ? "on" : ""}`} onClick={() => say(info.sentence, true)} aria-label="Read the prompt aloud">🔊</button>
          )}
          <div>
            <div className="ss-type ss-pixel">{info.name}{info.hint ? <small> · {info.hint.toUpperCase()}</small> : null}</div>
            <div className="ss-sentence">{info.sentence}</div>
          </div>
        </div>
        <div className="ss-std" title={info.skill}>{info.standard} · {info.skill}</div>
      </div>

      {mode !== "cards" && (
        <form
          className={`ss-entry ${shake ? "shake" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            submitTyped(false);
          }}
        >
          <input
            ref={inputRef}
            className="ss-input"
            value={text}
            maxLength={MAX_WORD}
            onChange={(e) => {
              setText(sanitizeInput(e.target.value));
              setCoachMsg(null);
            }}
            onFocus={() => window.setTimeout(() => inputRef.current?.scrollIntoView({ block: "center" }), 250)}
            placeholder={`type ${info.examples[0] ? `like “${info.examples[0]}”` : "a word"}`}
            aria-label={`Type ${info.name.toLowerCase()}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="next"
          />
          <button type="submit" className="ss-btn">{idx + 1 === blanks.length ? "Finish ★" : "Next ▶"}</button>
        </form>
      )}

      {coachMsg && (
        <div className="ss-coach" role="alert">
          <div className="ss-coachhead ss-pixel">GRAMMAR COACH</div>
          <p>{coachMsg.message}</p>
          <div className="ss-row">
            {coachMsg.suggestion && (
              <button type="button" className="ss-btn" onClick={() => accept(coachMsg.suggestion!)}>Use “{coachMsg.suggestion}”</button>
            )}
            <button type="button" className="ss-btn ghost" onClick={() => submitTyped(true)}>Keep it anyway</button>
            <button
              type="button"
              className="ss-btn ghost"
              onClick={() => {
                setCoachMsg(null);
                setText("");
                inputRef.current?.focus();
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
      {praise && <div className="ss-praise ss-pixel" role="status">★ {praise}</div>}

      {mode !== "type" && cards.length > 0 && (
        <>
          {mode === "both" && <div className="ss-or ss-pixel">…OR TAP A CARD</div>}
          <div className={`ss-cards ${early ? "big" : ""}`}>
            {cards.map((c, i) => (
              <CardButton
                key={`${idx}-${c.word}-${i}`}
                card={c}
                n={i}
                dim={wrong?.card === c}
                fits={cardFits(c, blank)}
                onPick={() => pickCard(c)}
                onHear={speechSupported() ? () => say(c.word, true) : undefined}
              />
            ))}
          </div>
        </>
      )}
      {wrong && (
        <div className="ss-coach" role="alert">
          <div className="ss-coachhead ss-pixel">GRAMMAR COACH</div>
          <p>{wrong.msg}</p>
          <button type="button" className="ss-btn ghost" onClick={() => setWrong(null)}>OK, I'll pick again</button>
        </div>
      )}
      {early && <p className="ss-help dim center">Tap a card to pick it. Tap 🔊 to hear it first.</p>}
    </div>
  );
}

function CardButton({ card, n, dim, fits, onPick, onHear }: { card: Card; n: number; dim: boolean; fits: boolean; onPick: () => void; onHear?: () => void }) {
  return (
    <div className={`ss-card ${dim ? "dim" : ""}`}>
      <button type="button" className="ss-cardbtn" onClick={onPick} data-word={card.word} data-fits={DEBUG ? String(fits) : undefined} aria-label={`${n + 1}: ${card.word}`}>
        <span className="key ss-pixel">{n + 1}</span>
        <CardPicture card={card} />
        <span className="word">{card.word}</span>
      </button>
      {onHear && (
        <button type="button" className="ss-hear" onClick={onHear} aria-label={`Hear ${card.word}`}>🔊</button>
      )}
    </div>
  );
}

function CardPicture({ card }: { card: Card }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pic = card.pic;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = 64;
    cv.height = 48;
    const c = cv.getContext("2d")!;
    let actor;
    if (pic.kind === "sprite") actor = demoActor(pic.sprite, { count: pic.count });
    else if (pic.kind === "anim") actor = demoActor("bunny", { anim: verbAnim(pic.anim)?.anim ?? "bob" });
    else if (pic.kind === "mod") actor = demoActor(ADJ_DEMO, { adj: pic.word });
    else return;
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      drawDemo(c, actor!, (performance.now() - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [pic]);
  if (pic.kind === "color") return <span className="pic swatch" style={{ background: pic.hex }} aria-hidden="true" />;
  if (pic.kind === "count")
    return (
      <span className="pic dots" aria-hidden="true">
        {Array.from({ length: pic.n }, (_, i) => <i key={i} />)}
      </span>
    );
  if (pic.kind === "text") return null;
  return <canvas ref={ref} className="pic" aria-hidden="true" />;
}

/* ================================================================ the reveal */

function RevealScreen({
  play, words, grade, audio, onRead, onAgain, onNew, onTitle, onShelve, shelfId, onUnshelve,
}: {
  play: Play; words: string[]; grade: Grade; audio: ChipAudio; onRead: () => void; onAgain: () => void; onNew: () => void; onTitle: () => void;
  onShelve: () => boolean; shelfId?: string; onUnshelve: (id: string) => void;
}) {
  const scene = useMemo(() => buildScene(play.parsed, words, play.bg, play.cast), [play, words]);
  const pieces = useMemo(() => fill(play.parsed, words), [play, words]);
  const [saved, setSaved] = useState<"no" | "yes" | "fail">(shelfId ? "yes" : "no");
  const [picture, setPicture] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = new SceneRenderer(cv, scene);
    r.run();
    if (DEBUG) (window as unknown as { __ssScene: Scene }).__ssScene = scene;
    return () => r.stop();
  }, [scene]);

  // Each player word pops in with a silly sound.
  useEffect(() => {
    if (shelfId) return;
    const timers: number[] = [];
    let k = 0;
    pieces.forEach((p) => {
      if (p.blank < 0) return;
      const i = k++;
      timers.push(window.setTimeout(() => silly(audio, SILLIES[i % SILLIES.length]), 700 + i * 260));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [pieces, audio, shelfId]);

  const savePicture = async () => {
    try {
      await Promise.all([document.fonts?.load('26px "VT323"'), document.fonts?.load('16px "Press Start 2P"')]);
    } catch {
      // fonts are optional
    }
    const url = downloadComic(scene, play.title, pieces);
    setPicture(url.slice(0, 22));
    audio.correct();
  };

  const stds = new Map<string, string>();
  for (const b of play.parsed.blanks) {
    const s = b.type === "vocab" || b.type === "simile" ? promptFor(b, grade) : { standard: standardFor(b.type, grade).code, skill: standardFor(b.type, grade).skill };
    stds.set(s.standard, s.skill);
  }
  let k = 0;
  return (
    <div className="ss-panel ss-reveal">
      <div className="ss-h1 ss-pixel ss-reveal-title">{play.title.toUpperCase()}</div>
      <div className="ss-screen">
        <canvas ref={canvasRef} className="ss-scene" aria-label="Your story as a pixel picture" />
      </div>
      <div className="ss-row center ss-actions">
        {speechSupported() && <button type="button" className="ss-btn" onClick={onRead}>🔊 Read it to me</button>}
        <button type="button" className="ss-btn" onClick={savePicture}>⬇ Save as picture</button>
        {saved === "yes" && shelfId ? (
          <button type="button" className="ss-btn ghost" onClick={() => onUnshelve(shelfId)}>Remove from shelf</button>
        ) : (
          <button
            type="button"
            className="ss-btn ghost"
            disabled={saved === "yes"}
            onClick={() => setSaved(onShelve() ? "yes" : "fail")}
          >
            {saved === "yes" ? "★ On your shelf" : saved === "fail" ? "Shelf is full" : "☆ Save to Story Shelf"}
          </button>
        )}
      </div>
      {picture && <div className="ss-help center dim" role="status">Picture saved to your downloads (made on this device, never uploaded).</div>}
      <div className="ss-storytext" aria-live="polite">
        {pieces.map((p, i) =>
          p.blank >= 0 ? (
            <mark key={i} className={`ss-word ${typeClass(play.parsed.blanks[p.blank].type)}`} style={{ animationDelay: `${0.7 + k++ * 0.26}s` }} data-blank={p.blank}>
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </div>
      <details className="ss-legend" open>
        <summary className="ss-pixel">WHAT YOUR WORDS DID</summary>
        <ul>
          {scene.legend.map((l) => (
            <li key={l.blank} data-does={l.does}>
              <mark className={`ss-word static ${typeClass(play.parsed.blanks[l.blank].type)}`}>{l.word}</mark>
              <span className="dim"> ({typeName(play.parsed.blanks[l.blank].type).toLowerCase()})</span> {l.does}
            </li>
          ))}
        </ul>
      </details>
      <div className="ss-std center">You practiced: {[...stds.entries()].map(([c, s]) => `${s} (${c})`).join(" · ")}</div>
      <div className="ss-row center">
        {!shelfId && <button type="button" className="ss-btn ghost" onClick={onAgain}>↻ Same story, new words</button>}
        <button type="button" className="ss-btn big" autoFocus onClick={onNew}>New story ▶</button>
        <button type="button" className="ss-btn ghost" onClick={onTitle}>Title screen</button>
      </div>
    </div>
  );
}

/* ================================================================ write your own */

const INSERTS: { token: string; label: string; min: number }[] = [
  { token: "[noun]", label: "noun", min: 3 },
  { token: "[plural-noun]", label: "plural noun", min: 3 },
  { token: "[noun:animal]", label: "animal", min: 3 },
  { token: "[noun:food]", label: "food", min: 3 },
  { token: "[verb]", label: "verb", min: 3 },
  { token: "[verb-past]", label: "past-tense verb", min: 3 },
  { token: "[verb-ing]", label: "-ing verb", min: 3 },
  { token: "[adjective]", label: "adjective", min: 3 },
  { token: "[color]", label: "color", min: 3 },
  { token: "[number]", label: "number", min: 3 },
  { token: "[adverb]", label: "adverb", min: 3 },
  { token: "[sound]", label: "silly sound", min: 3 },
  { token: "[pronoun-subject]", label: "subject pronoun", min: 6 },
  { token: "[pronoun-object]", label: "object pronoun", min: 6 },
  { token: "[preposition]", label: "preposition", min: 6 },
  { token: "[comparative]", label: "comparative", min: 6 },
  { token: "[superlative]", label: "superlative", min: 6 },
  { token: "[simile]", label: "simile", min: 9 },
];

const STARTER = "One morning, {a} [adjective] [noun:animal] woke up and decided to [verb]. It grabbed [number] [plural-noun] and [verb-past] all the way to the park.";

function WriteScreen({
  grade, custom, editing, onEdit, onSave, onDelete, onPlay, onHandoff, onBack,
}: {
  grade: Grade; custom: CustomStory[]; editing: CustomStory | null; onEdit: (c: CustomStory | null) => void; onSave: (c: CustomStory) => CustomStory;
  onDelete: (id: string) => void; onPlay: (c: CustomStory) => void; onHandoff: (c: CustomStory) => void; onBack: () => void;
}) {
  const g = gradeNumber(grade);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [bg, setBg] = useState(editing?.bg ?? "park");
  const [tpl, setTpl] = useState(editing?.template ?? STARTER);
  const [id, setId] = useState(editing?.id ?? newId());
  const [note, setNote] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const parsed = useMemo(() => parseTemplate(tpl, { maxBlanks: MAX_CUSTOM_BLANKS }), [tpl]);
  const ok = parsed.errors.length === 0 && parsed.blanks.length >= 2;

  useEffect(() => {
    setTitle(editing?.title ?? "");
    setBg(editing?.bg ?? "park");
    setTpl(editing?.template ?? STARTER);
    setId(editing?.id ?? newId());
    setNote(null);
  }, [editing]);

  if (g < 3) {
    return (
      <div className="ss-panel">
        <p className="ss-big">Writing your own story opens up in grade 3. For now, pick a story and fill it with picture cards!</p>
        <button type="button" className="ss-btn" onClick={onBack}>◀ Back</button>
      </div>
    );
  }

  const insert = (token: string) => {
    const ta = taRef.current;
    const start = ta?.selectionStart ?? tpl.length;
    const end = ta?.selectionEnd ?? tpl.length;
    const before = tpl.slice(0, start);
    const pad = before && !/\s$/.test(before) ? " " : "";
    const next = (before + pad + token + tpl.slice(end)).slice(0, MAX_TEMPLATE);
    setTpl(next);
    window.setTimeout(() => {
      if (!ta) return;
      const pos = start + pad.length + token.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const current = (): CustomStory => ({ id, title: title.trim() || "My Silly Story", bg, template: tpl, updated: Date.now() });
  const save = () => {
    const s = onSave(current());
    setTitle(s.title);
    setTpl(s.template);
    setNote(s.template !== tpl || s.title !== (title.trim() || "My Silly Story") ? "Saved! (A word was swapped to keep it kid-friendly.)" : "Saved on this device!");
    return s;
  };

  return (
    <div className="ss-panel ss-write">
      <div className="ss-head">
        <button type="button" className="ss-btn ghost small" onClick={onBack}>◀ Back</button>
        <div className="ss-h1 ss-pixel">WRITE YOUR OWN</div>
      </div>
      <p className="ss-help">
        Write a story and tap the buttons to add blanks. A friend fills them in without seeing your story. Use <code>{"{a}"}</code> where you need “a” or “an”.
      </p>
      <label className="ss-label">
        Title
        <input className="ss-input" value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)} placeholder="My Silly Story" />
      </label>
      <label className="ss-label">
        Scene
        <select className="ss-input" value={bg} onChange={(e) => setBg(e.target.value)}>
          {BGS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <div className="ss-inserts" aria-label="Add a blank">
        {INSERTS.filter((i) => g >= i.min).map((i) => (
          <button key={i.token} type="button" className="ss-chip" onClick={() => insert(i.token)} data-token={i.token}>
            + {i.label}
          </button>
        ))}
      </div>
      <textarea
        ref={taRef}
        className="ss-textarea"
        value={tpl}
        maxLength={MAX_TEMPLATE}
        rows={7}
        onChange={(e) => setTpl(e.target.value)}
        aria-label="Your story"
        spellCheck
      />
      <div className={`ss-check ${ok ? "ok" : "bad"}`} role="status">
        {parsed.errors.length ? parsed.errors.join(" · ") : parsed.blanks.length < 2 ? "Add at least 2 blanks." : `✔ ${parsed.blanks.length} blanks. Ready to play!`}
        <span className="dim"> {tpl.length}/{MAX_TEMPLATE}</span>
      </div>
      {note && <div className="ss-praise">{note}</div>}
      <div className="ss-row">
        <button type="button" className="ss-btn" disabled={!ok} onClick={save}>💾 Save</button>
        <button type="button" className="ss-btn" disabled={!ok} onClick={() => onPlay(save())}>Play it ▶</button>
        <button type="button" className="ss-btn ghost" disabled={!ok} onClick={() => onHandoff(save())}>Pass to a friend</button>
        {editing && <button type="button" className="ss-btn ghost" onClick={() => onEdit(null)}>+ New story</button>}
      </div>
      {custom.length > 0 && (
        <>
          <div className="ss-h ss-pixel">MY SAVED STORIES</div>
          <ul className="ss-list">
            {custom.map((c) => (
              <li key={c.id}>
                <span className="t">{c.title}</span>
                <span className="ss-row tight">
                  <button type="button" className="ss-btn small" onClick={() => onPlay(c)}>Play</button>
                  <button type="button" className="ss-btn ghost small" onClick={() => onEdit(c)}>Edit</button>
                  <button type="button" className="ss-btn ghost small" onClick={() => onHandoff(c)}>Friend</button>
                  <button type="button" className="ss-btn ghost small" onClick={() => window.confirm(`Delete “${c.title}”?`) && onDelete(c.id)}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="ss-help dim">Saved only on this device. Nothing is uploaded.</p>
    </div>
  );
}

/* ================================================================ story shelf */

function ShelfScreen({ shelf, onOpen, onRemove, onBack }: { shelf: ShelfItem[]; onOpen: (s: ShelfItem) => void; onRemove: (id: string) => void; onBack: () => void }) {
  return (
    <div className="ss-panel">
      <div className="ss-head">
        <button type="button" className="ss-btn ghost small" onClick={onBack}>◀ Back</button>
        <div className="ss-h1 ss-pixel">STORY SHELF</div>
      </div>
      {shelf.length === 0 ? (
        <p className="ss-help">Your shelf is empty. Finish a story and tap “Save to Story Shelf” to keep your favorites here (on this device only).</p>
      ) : (
        <ul className="ss-list">
          {shelf.map((s) => (
            <li key={s.id}>
              <SpriteIcon storyBg={s.bg} />
              <span className="t">
                {s.title}
                <small className="dim"> · {new Date(s.saved).toLocaleDateString()}</small>
              </span>
              <span className="ss-row tight">
                <button type="button" className="ss-btn small" onClick={() => onOpen(s)}>Open</button>
                <button type="button" className="ss-btn ghost small" onClick={() => window.confirm(`Remove “${s.title}” from the shelf?`) && onRemove(s.id)}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpriteIcon({ storyBg }: { storyBg: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = 20;
    cv.height = 20;
    const def = spriteById(storyBg === "space" || storyBg === "mars" ? "rocket" : storyBg === "ocean" ? "fish" : "book")!;
    cv.getContext("2d")!.drawImage(spriteCanvas(def), 0, 0);
  }, [storyBg]);
  return <canvas ref={ref} className="ss-icon" aria-hidden="true" />;
}

