/*
 * "Redo the ones I missed": a quick round in the library. Quill asks one fresh question (new
 * numbers) for each missed skill tag, with the same gentle rules, hints and models as the books.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { recordAnswer, speak, stopSpeaking, type ChipAudio, type Grade } from "@/kit";
import type { SceneView } from "@/engine/view";
import { GAME_ID, isTyping } from "@/game";
import { answer as mathAnswer, currentQ, hint as mathHint, makeItem, startMath, type MathState, type QResult } from "@/math/play";
import { byTag, clearMastered, download, exportName, loadAttempts, logAttempt, toCSV, toJSON, type RedoItem } from "@/math/log";
import { MathGate } from "./MathGate";
import { SkillTable, kitMathQuestion } from "./Reader";

export function RedoRound({
  items, view, audio, grade, readAloud, onExit,
}: {
  items: RedoItem[];
  view: SceneView | null;
  audio: ChipAudio;
  grade: Grade;
  readAloud: boolean;
  onExit: () => void;
}) {
  const list = useMemo(() => items.slice(0, 12), [items]);
  const [i, setI] = useState(0);
  const [state, setState] = useState<MathState>(() => startMath(makeItem({ gen: list[0].gen, chain: false, params: {} })));
  const [results, setResults] = useState<QResult[]>([]);
  const finished = i >= list.length;

  useEffect(() => {
    view?.set({
      scene: "library",
      cast: [{ id: "hero", mood: "normal" }, { id: "quill", mood: finished ? "happy" : "thinking" }],
      speaking: null,
      title: false,
      banner: null,
      bubble: { who: "quill", text: finished ? "HOO! PRACTICE PAYS OFF!" : `REDO ${i + 1} OF ${list.length}: NEW NUMBERS!` },
    });
  }, [view, i, list.length, finished]);

  useEffect(() => {
    if (!finished && readAloud) speak(`Quill asks: ${currentQ(state).prompt}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, finished]);

  useEffect(() => {
    if (finished) clearMastered(results);
  }, [finished, results]);

  const answer = useCallback(
    (d: number) => {
      if (finished) return;
      const r = mathAnswer(state, d);
      if (r.event === "ignored") return;
      if (r.attempt) logAttempt(r.attempt, "Quill's redo round");
      const fresh = r.s.results.slice(state.results.length);
      for (const x of fresh) recordAnswer(GAME_ID, kitMathQuestion(x, grade), x.firstTry);
      if (fresh.length) setResults((old) => [...old, ...fresh]);
      setState(r.s);
      if (r.attempt?.correct) audio.correct();
      else audio.wrong();
      if (readAloud && r.s.feedback) speak(r.s.feedback.text.replace(/[✔✘]/g, ""));
    },
    [finished, state, grade, audio, readAloud],
  );

  const hint = useCallback(() => {
    const n = mathHint(state);
    if (n === state) return;
    audio.blip();
    setState(n);
    if (readAloud) speak(`Hint: ${currentQ(n).hints[n.hints - 1]}`);
  }, [state, audio, readAloud]);

  const next = useCallback(() => {
    if (state.phase !== "done") return;
    stopSpeaking();
    const ni = i + 1;
    setI(ni);
    if (ni < list.length) setState(startMath(makeItem({ gen: list[ni].gen, chain: false, params: {} })));
  }, [state.phase, i, list]);

  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (isTyping(ev) || ev.ctrlKey || ev.metaKey || ev.altKey || finished) return;
      const k = ev.key.toLowerCase();
      const n = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (k === "h" && ev.key.length === 1) {
        ev.preventDefault();
        hint();
      } else if ((ev.key === "Enter" || ev.key === " ") && state.phase === "done") {
        ev.preventDefault();
        next();
      } else if (n >= 0 && n < 4 && state.phase !== "done") {
        ev.preventDefault();
        answer(n);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [finished, state.phase, hint, next, answer]);

  const exportAs = (ext: "csv" | "json") => {
    const all = loadAttempts();
    download(exportName(ext), ext === "csv" ? toCSV(all) : toJSON(all), ext === "csv" ? "text/csv" : "application/json");
  };

  return (
    <div className="pq-reader pq-redo" data-redo={finished ? "done" : String(i)}>
      <div className="pq-readhead">
        <button className="pq-small pq-pixel" onClick={() => { stopSpeaking(); onExit(); }}>◀ LIBRARY</button>
        <span className="book">Quill's redo round</span>
        <span className="score pq-pixel">{Math.min(i + 1, list.length)} / {list.length}</span>
      </div>
      <div className="pq-text">
        {!finished ? (
          <>
            <p className="dim">Quill spreads out fresh pages. “Same skill, NEW numbers. Take your time, there's no timer.”</p>
            <MathGate state={state} onAnswer={answer} onHint={hint} onContinue={next} continueLabel={i + 1 < list.length ? "Next ▶" : "See my results ▶"} />
          </>
        ) : (
          <div className="pq-redo-done">
            <div className="pq-h pq-pixel">REDO RESULTS</div>
            <SkillTable rows={byTag(results)} />
            <p>{results.every((r) => r.firstTry) ? <span className="y">All right on the first try. Those skills leave the redo list!</span> : <span className="y">Skills you got right on the first try leave the redo list. The others stay for next time.</span>}</p>
            <div className="pq-btnrow">
              <button className="pq-cta" autoFocus onClick={onExit}>Back to library</button>
              <button className="pq-small pq-pixel" onClick={() => exportAs("csv")}>EXPORT CSV</button>
              <button className="pq-small pq-pixel" onClick={() => exportAs("json")}>EXPORT JSON</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
