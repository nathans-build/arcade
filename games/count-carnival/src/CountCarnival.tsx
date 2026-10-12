import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChipAudio } from "@/kit/audio";
import { arcadeLink, gradeFromArcade, gradeLabel, initialGrade, rememberGrade } from "@/kit/grades";
import { recordAnswer, submitScore } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { Confetti, MASCOT_NAME, PrizeArt, Tally, Tent, Ticket, Balloon, Duck, ShapeArt, Star } from "@/carnival/art";
import { BOOTHS, BOOTH_INFO, CHOICE_COLORS, ROUND_LEN, makeRound, playGrade, type BoothId } from "@/carnival/items";
import { Round } from "@/carnival/round";
import { makeRng } from "@/carnival/rng";
import { PRIZES, buyPrize, loadSave, writeSave, type SaveData } from "@/carnival/save";
import { ChoiceFace, Scene } from "@/carnival/visuals";
import "@/carnival/carnival.css";

const GAME_ID = "count-carnival";
/** A bouncy carnival waltz bassline (Hz, 0 = rest). */
const BASS = [131, 0, 196, 0, 196, 0, 147, 0, 220, 0, 220, 0, 165, 0, 247, 0];
const PICK_GRADES: Grade[] = ["K", "1", "2"];
const PRAISE = ["Great job!", "You got it!", "Super!", "Hooray!", "Way to go!", "Awesome!", "Yes!"];
const OOPS = ["Oops, not quite.", "Almost!", "Nice try!", "Let's try again."];

type Screen = "title" | "hub" | "booth" | "done" | "prizes";

const TENT_COLORS: Record<BoothId, [string, string]> = {
  balloons: ["#e3262f", "#fff3e0"],
  tightrope: ["#2f6fe0", "#fff3e0"],
  ducks: ["#21a35a", "#fff3e0"],
  shapes: ["#9b4fd1", "#ffd23f"],
};

function BoothIcon({ booth }: { booth: BoothId }) {
  const fo = (child: ReactNode, w = 44) => (
    <foreignObject x={-w / 2} y={-19} width={w} height={40}>
      <div className="cc-tent-icon">{child}</div>
    </foreignObject>
  );
  if (booth === "balloons")
    return fo(
      <>
        <Balloon color="#e3262f" w={13} />
        <Balloon color="#2f6fe0" w={13} />
        <Balloon color="#21a35a" w={13} />
      </>,
    );
  if (booth === "tightrope") return fo(<Tally w={22} />);
  if (booth === "ducks") return fo(<Duck w={30} />);
  return fo(
    <>
      <span style={{ width: 20, height: 20, display: "inline-block" }}><ShapeArt shape="triangle" color="#ff8a1f" /></span>
      <span style={{ width: 20, height: 20, display: "inline-block" }}><ShapeArt shape="circle" color="#2f6fe0" /></span>
    </>,
  );
}

declare global {
  interface Window {
    __cc?: () => unknown;
  }
}

export default function CountCarnival() {
  const [grade, setGrade] = useState<Grade>(() => initialGrade("K"));
  const fromArcade = useRef(gradeFromArcade()).current;
  const [screen, setScreen] = useState<Screen>("title");
  const [readAloud, setReadAloud] = useState(() => readAloudPref(true));
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [booth, setBooth] = useState<BoothId>("balloons");
  const roundRef = useRef<Round | null>(null);
  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);
  const [lit, setLit] = useState(0);
  const [burst, setBurst] = useState(0);
  const [shake, setShake] = useState(-1);
  const [msg, setMsg] = useState("");
  const [earned, setEarned] = useState<{ n: number; key: number } | null>(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<ChipAudio | null>(null);
  const hintTimer = useRef<number | null>(null);
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;

  if (!audioRef.current) audioRef.current = new ChipAudio(BASS, 150);
  const audio = audioRef.current;
  useEffect(() => setMuted(audio.muted), [audio]);

  const say = useCallback((text: string) => {
    if (readAloudRef.current) speak(text);
  }, []);

  const stopHint = () => {
    if (hintTimer.current !== null) {
      clearInterval(hintTimer.current);
      hintTimer.current = null;
    }
  };

  const persist = useCallback((s: SaveData) => {
    setSave(s);
    writeSave(s);
  }, []);

  const round = roundRef.current;
  const item = round?.item ?? null;

  /* ------------------------------------------------------------ navigation */

  /** Leaving a booth early keeps every ticket already won (nothing is ever lost). */
  const bankRound = () => {
    const r = roundRef.current;
    if (!r || r.finished) return;
    roundRef.current = null;
    if (r.tickets > 0)
      setSave((prev) => {
        const s = { ...prev, tickets: prev.tickets + r.tickets };
        writeSave(s);
        return s;
      });
  };

  const goHub = useCallback((speakIt = true) => {
    stopHint();
    bankRound();
    setScreen("hub");
    setMsg("");
    audio.unlock();
    audio.startMusic();
    if (speakIt) say(`Welcome to the Count Carnival! I'm ${MASCOT_NAME}. Tap a tent to play. Win tickets for prizes!`);
  }, [audio, say]);

  const startBooth = useCallback((b: BoothId) => {
    audio.unlock();
    audio.stopMusic();
    audio.checkpoint();
    stopHint();
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const rng = makeRng(seed);
    const r = new Round(makeRound(rng, b, grade));
    roundRef.current = r;
    setBooth(b);
    setLit(0);
    setShake(-1);
    setMsg("");
    setEarned(null);
    setScreen("booth");
    say(`${BOOTH_INFO[b].say[playGrade(grade)]} ${r.item.say}`);
  }, [audio, grade, say]);

  const openPrizes = useCallback(() => {
    audio.unlock();
    audio.blip();
    stopHint();
    setScreen("prizes");
    say("The Prize Booth! Tap a prize to trade your tickets for it.");
  }, [audio, say]);

  /* ------------------------------------------------------------ answering */

  const pick = useCallback((i: number) => {
    const r = roundRef.current;
    if (!r || r.finished || r.solved) return;
    audio.unlock();
    const it = r.item;
    const triesBefore = r.tries;
    const res = r.pick(i);
    if (res === "right") {
      stopHint();
      setLit(it.hintSteps.length);
      const got = triesBefore === 0 ? 2 : 1;
      setEarned({ n: got, key: Date.now() });
      setBurst((b) => b + 1);
      audio.correct();
      recordAnswer(GAME_ID, it, triesBefore === 0);
      const praise = PRAISE[(r.idx + r.tickets) % PRAISE.length];
      setMsg(`${praise} ${it.explanation}`);
      say(`${praise} ${it.explanation}`);
    } else if (res === "wrong") {
      audio.tone(330, 0.18, "triangle", 0.45, 247);
      setShake(i);
      window.setTimeout(() => setShake(-1), 500);
      const oops = OOPS[(r.tries + r.idx) % OOPS.length];
      const level = r.hintLevel;
      const text = level >= 2 ? `${oops} ${it.hint} Look for the glowing answer.` : `${oops} ${it.hint}`;
      setMsg(text);
      // Counting hint: light the objects one at a time and count aloud.
      stopHint();
      if (it.hintSteps.length) {
        setLit(0);
        const steps = it.hintSteps;
        say(`${text} ${steps.join(". ")}.`);
        let k = 0;
        hintTimer.current = window.setInterval(() => {
          k++;
          setLit(k);
          audio.tone(520 + k * 25, 0.06, "square", 0.15);
          if (k >= steps.length) stopHint();
        }, 650);
      } else say(text);
    }
    rerender();
  }, [audio, say]);

  const next = useCallback(() => {
    const r = roundRef.current;
    if (!r || !r.solved) return;
    audio.unlock();
    stopHint();
    setLit(0);
    setMsg("");
    setEarned(null);
    const done = r.next();
    if (done) {
      const s = { ...save, tickets: save.tickets + r.tickets, rounds: { ...save.rounds, [booth]: (save.rounds[booth] ?? 0) + 1 } };
      persist(s);
      submitScore(GAME_ID, r.tickets);
      setBurst((b) => b + 1);
      audio.levelUp();
      setScreen("done");
      say(`Hooray! You finished ${BOOTH_INFO[booth].name}! You won ${r.tickets} tickets. You have ${s.tickets} tickets in all.`);
    } else {
      audio.blip();
      say(r.item.say);
    }
    rerender();
  }, [audio, booth, persist, save, say]);

  const replay = useCallback(() => {
    audio.unlock();
    if (screen === "booth" && roundRef.current) speak(msg && roundRef.current.tries > 0 && !roundRef.current.solved ? `${roundRef.current.item.say} ${msg}` : roundRef.current.item.say);
    else if (screen === "hub") speak(`Tap a tent to play. You have ${save.tickets} tickets.`);
    else if (screen === "prizes") speak(`You have ${save.tickets} tickets. Tap a prize.`);
    else if (screen === "done") speak(`You won ${roundRef.current?.tickets ?? 0} tickets!`);
    else speak("Count Carnival! Tap play.");
  }, [audio, msg, save.tickets, screen]);

  const toggleRead = () => {
    const on = !readAloud;
    setReadAloud(on);
    setReadAloudPref(on);
    if (on) speak("Read aloud is on.");
    else stopSpeaking();
  };

  const toggleMute = () => {
    audio.unlock();
    setMuted(audio.toggleMute());
  };

  const pickGrade = (g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    audio.unlock();
    audio.blip();
    say(g === "K" ? "Kindergarten" : `Grade ${g}`);
  };

  const tapPrize = (id: string) => {
    audio.unlock();
    const def = PRIZES.find((p) => p.id === id)!;
    if (save.prizes.includes(id)) {
      say(`You already have the ${def.name}!`);
      audio.blip();
      return;
    }
    const s = buyPrize(save, id);
    if (s) {
      persist(s);
      setBurst((b) => b + 1);
      audio.levelUp();
      say(`You got the ${def.name}! You have ${s.tickets} tickets left.`);
    } else {
      audio.tone(330, 0.15, "triangle", 0.4, 262);
      say(`The ${def.name} costs ${def.cost} tickets. You have ${save.tickets}. Win ${def.cost - save.tickets} more tickets at the tents!`);
    }
  };

  /* ------------------------------------------------------------ keyboard (optional) */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (screen === "booth") {
        const idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
        if (idx >= 0 && k.length === 1) {
          e.preventDefault();
          pick(idx);
          return;
        }
        if ((k === "enter" || k === " ") && roundRef.current?.solved) {
          e.preventDefault();
          next();
          return;
        }
        if (k === "escape") goHub(false);
      }
      if (k === "r") replay();
      if (screen === "title" && (k === "enter" || k === " ")) {
        e.preventDefault();
        goHub();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goHub, next, pick, replay, screen]);

  useEffect(() => () => { stopHint(); audio.stopMusic(); }, [audio]);

  /* ------------------------------------------------------------ debug hook (playtests) */
  useEffect(() => {
    window.__cc = () => {
      const r = roundRef.current;
      return {
        screen, booth, grade, tickets: save.tickets, prizes: save.prizes.slice(),
        round: r ? { idx: r.idx, solved: r.solved, finished: r.finished, tries: r.tries, tickets: r.tickets, answer: r.item.answer, choices: r.item.choices.slice(), standard: r.item.standard, prompt: r.item.prompt, hintLevel: r.hintLevel } : null,
      };
    };
  });

  /* ------------------------------------------------------------ views */

  const speakerBtn = speechSupported() ? (
    <button type="button" className="cc-icon-btn" onClick={replay} aria-label="Say it again" title="Say it again (R)">
      <SpeakerIcon />
    </button>
  ) : null;

  const topBar = (left: ReactNode, title: string) => (
    <header className="cc-top">
      {left}
      <span className="cc-top-title">{title}</span>
      <span className="cc-tickets" aria-label={`${save.tickets} tickets`}>
        <Ticket w={34} />
        <b>{save.tickets + (screen === "booth" ? round?.tickets ?? 0 : 0)}</b>
      </span>
      {speakerBtn}
    </header>
  );

  const homeBtn = (
    <button type="button" className="cc-icon-btn" onClick={() => goHub(false)} aria-label="Back to the carnival">
      <HomeIcon />
    </button>
  );

  let body: ReactNode = null;

  if (screen === "title") {
    body = (
      <div className="cc-title">
        <div className="cc-lights" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</div>
        <h1 className="cc-logo">
          <span>COUNT</span>
          <span>CARNIVAL</span>
        </h1>
        <div className="cc-title-art">
          <Balloon color="#e3262f" w={34} />
          <Tally w={120} className="cc-bob" />
          <Balloon color="#2f6fe0" w={34} />
        </div>
        <p className="cc-meet">Meet {MASCOT_NAME}!</p>
        {fromArcade ? (
          <p className="cc-gradebadge">{gradeLabel(grade)}{playGrade(grade) !== grade ? " · Grade 2 games" : ""} · <a href={arcadeLink(grade)}>change in the arcade</a></p>
        ) : (
          <div className="cc-gradepick" role="group" aria-label="Grade">
            {PICK_GRADES.map((g) => (
              <button key={g} type="button" className={playGrade(grade) === g ? "on" : ""} onClick={() => pickGrade(g)} aria-pressed={playGrade(grade) === g}>
                <b>{g}</b>
                <small>{g === "K" ? "Kinder" : `Grade ${g}`}</small>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="cc-play" onClick={() => goHub()} aria-label="Play">
          <PlayIcon /> PLAY
        </button>
        <div className="cc-title-row">
          <a className="cc-small-btn" href={arcadeLink(grade)}>◀ Arcade</a>
          {speechSupported() && (
            <button type="button" className="cc-small-btn" onClick={toggleRead} aria-pressed={readAloud}>
              Read aloud: {readAloud ? "ON" : "OFF"}
            </button>
          )}
          <button type="button" className="cc-small-btn" onClick={toggleMute} aria-pressed={!muted}>Sound: {muted ? "OFF" : "ON"}</button>
        </div>
        <p className="cc-credit">SpiderBen10's Arcade · K–2 math · NC standards</p>
      </div>
    );
  } else if (screen === "hub") {
    body = (
      <div className="cc-hub">
        {topBar(
          <button type="button" className="cc-icon-btn" onClick={() => { audio.stopMusic(); stopSpeaking(); setScreen("title"); }} aria-label="Title screen"><BackIcon /></button>,
          "The Midway",
        )}
        <div className="cc-host-row">
          <Tally w={64} className="cc-bob" />
          <p className="cc-bubble">Pick a tent!</p>
        </div>
        <div className="cc-tents">
          {BOOTHS.map((b) => (
            <button key={b} type="button" className={`cc-tent cc-tent-${b}`} onClick={() => startBooth(b)} aria-label={BOOTH_INFO[b].name}>
              <Tent a={TENT_COLORS[b][0]} b={TENT_COLORS[b][1]} w={140}>
                <BoothIcon booth={b} />
              </Tent>
              <span className="cc-tent-name">{BOOTH_INFO[b].name}</span>
              <small>{BOOTH_INFO[b].topic[playGrade(grade)]}</small>
              {(save.rounds[b] ?? 0) > 0 && (
                <span className="cc-stars" aria-label={`${save.rounds[b]} rounds played`}>
                  {Array.from({ length: Math.min(5, save.rounds[b] ?? 0) }, (_, i) => <Star key={i} w={14} />)}
                </span>
              )}
            </button>
          ))}
          <button type="button" className="cc-tent cc-tent-prizes" onClick={openPrizes} aria-label="Prize booth">
            <Tent a="#ffd23f" b="#e0559a" w={140}>
              <foreignObject x={-22} y={-19} width={44} height={40}><div className="cc-tent-icon"><PrizeArt id="bear" w={34} /></div></foreignObject>
            </Tent>
            <span className="cc-tent-name">Prize Booth</span>
            <small>{save.prizes.length} of {PRIZES.length} prizes</small>
          </button>
        </div>
      </div>
    );
  } else if (screen === "booth" && round && item) {
    const glow = round.hintLevel >= 2 && !round.solved ? item.answer : -1;
    const textChoices = item.art[0].kind === "text";
    body = (
      <div className={`cc-booth cc-booth-${booth}`}>
        {topBar(homeBtn, BOOTH_INFO[booth].name)}
        <div className="cc-progress" aria-label={`Question ${round.idx + 1} of ${ROUND_LEN}`}>
          {Array.from({ length: ROUND_LEN }, (_, i) => (
            <i key={i} className={i < round.idx || (i === round.idx && round.solved) ? "done" : i === round.idx ? "now" : ""} />
          ))}
        </div>
        <div className="cc-play-area">
          <section className="cc-stage">
            <p className="cc-prompt">{item.prompt}</p>
            <div className="cc-scene">
              <Scene
                v={item.visual}
                lit={lit}
                steps={item.hintSteps}
                solved={round.solved}
                wrongTries={round.tries}
                answerLabel={item.choices[item.answer]}
              />
            </div>
            {msg && <p className={`cc-msg ${round.solved ? "good" : "hint"}`} aria-live="polite">{msg}</p>}
          </section>
          <section className={`cc-choices ${textChoices ? "text" : ""}`}>
            {item.choices.map((c, i) => {
              const faded = round.wrong.has(i) && !round.solved;
              const right = round.solved && i === item.answer;
              return (
                <button
                  key={`${round.idx}-${i}`}
                  type="button"
                  className={`cc-choice c${i} ${faded ? "faded" : ""} ${right ? "right" : ""} ${glow === i ? "glow" : ""} ${shake === i ? "shake" : ""} ${round.solved && !right ? "dim" : ""}`}
                  onClick={() => pick(i)}
                  aria-label={`${CHOICE_COLORS[i]}: ${item.spoken[i]}`}
                >
                  <ChoiceFace art={item.art[i]} label={c} />
                </button>
              );
            })}
          </section>
        </div>
        {round.solved && (
          <button type="button" className="cc-next" onClick={next} aria-label="Next">
            {round.idx + 1 >= ROUND_LEN ? "Finish" : "Next"} <PlayIcon />
          </button>
        )}
        {earned && (
          <span className="cc-earned" key={earned.key}>
            +{earned.n} <Ticket w={30} />
          </span>
        )}
      </div>
    );
  } else if (screen === "done" && round) {
    body = (
      <div className="cc-done">
        <h2>Hooray!</h2>
        <Tally w={110} className="cc-jump" />
        <p className="cc-won">You won {round.tickets} tickets!</p>
        <div className="cc-ticket-row" aria-hidden>
          {Array.from({ length: round.tickets }, (_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.08}s` }}><Ticket w={30} /></span>
          ))}
        </div>
        <div className="cc-done-btns">
          <button type="button" className="cc-big-btn again" onClick={() => startBooth(booth)}><AgainIcon /> Again</button>
          <button type="button" className="cc-big-btn prize" onClick={openPrizes}><PrizeArt id="bear" w={30} /> Prizes</button>
          <button type="button" className="cc-big-btn home" onClick={() => goHub()}><HomeIcon /> Midway</button>
        </div>
      </div>
    );
  } else if (screen === "prizes") {
    body = (
      <div className="cc-prizes">
        {topBar(homeBtn, "Prize Booth")}
        <div className="cc-shelf">
          {PRIZES.map((p) => {
            const owned = save.prizes.includes(p.id);
            const can = !owned && save.tickets >= p.cost;
            return (
              <button key={p.id} type="button" className={`cc-prize ${owned ? "owned" : can ? "can" : "cant"}`} onClick={() => tapPrize(p.id)} aria-label={`${p.name}, ${p.cost} tickets${owned ? ", yours" : ""}`}>
                <PrizeArt id={p.id} w={56} />
                {owned ? (
                  <span className="cc-owned"><Star w={16} /> Mine!</span>
                ) : (
                  <span className="cc-cost"><Ticket w={24} /> {p.cost}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`cc-app grade-${playGrade(grade)}`}>
      {body}
      <Confetti burst={burst} />
    </div>
  );
}

/* Simple pixel icons for buttons (no emoji). */
function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="30" height="30" shapeRendering="crispEdges" aria-hidden>
      <path d="M2 6h3l4-4v12l-4-4H2z" fill="currentColor" />
      <path d="M11 5h1v1h1v4h-1v1h-1v-1h1V6h-1z" fill="currentColor" />
      <path d="M13 3h1v1h1v8h-1v1h-1v-1h1V4h-1z" fill="currentColor" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="30" height="30" shapeRendering="crispEdges" aria-hidden>
      <path d="M8 1l7 7h-2v7H9v-4H7v4H3V8H1z" fill="currentColor" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" width="30" height="30" shapeRendering="crispEdges" aria-hidden>
      <path d="M10 2v12L3 8z" fill="currentColor" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="26" height="26" shapeRendering="crispEdges" aria-hidden>
      <path d="M4 2l9 6-9 6z" fill="currentColor" />
    </svg>
  );
}
function AgainIcon() {
  return (
    <svg viewBox="0 0 16 16" width="28" height="28" shapeRendering="crispEdges" aria-hidden>
      <path d="M8 2a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4v3l4-4-4-4z" fill="currentColor" />
    </svg>
  );
}
