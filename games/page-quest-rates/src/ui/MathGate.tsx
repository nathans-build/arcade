/* A math gate on screen: Quill's question, the model, A–D answers, named-mistake feedback, HINT (H), and chain steps. */
import { correctDisplay, currentQ, type MathState } from "@/math/play";
import { MathModel } from "./MathModel";

/** ?debug (automated playtests only) marks the right answer in the DOM. */
const DEBUG = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

export function MathGate({
  state, lead, onAnswer, onHint, onContinue, continueLabel = "Continue ▶",
}: {
  state: MathState;
  lead?: string;
  onAnswer: (display: number) => void;
  onHint: () => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  const q = currentQ(state);
  const done = state.phase === "done";
  const chain = state.item.kind === "chain" ? state.item.c : null;
  const inSteps = state.phase === "steps" || (done && state.work.length > 0);
  const nSteps = chain ? chain.steps.length : 0;
  return (
    <div className={`pq-gate pq-math ${done ? "solved" : ""}`} data-math-phase={state.phase} data-step={state.step} data-tag={q.tag} data-answer={DEBUG ? correctDisplay(state) : undefined} onClick={(e) => e.stopPropagation()}>
      <div className="pq-tagrow">
        <span className="pq-tag pq-pixel">{chain ? (inSteps ? `STORY PROBLEM · STEP ${Math.min(state.step + 1, nSteps)} OF ${nSteps}` : "STORY PROBLEM") : "QUILL'S MATH"}</span>
        <span className="pq-tag std pq-pixel">{q.code} · {q.tag}</span>
      </div>
      {lead && !inSteps && <div className="pq-lead">{lead}</div>}
      {chain && inSteps && <div className="pq-setup">{chain.setup}</div>}
      {chain && state.work.length > 0 && (
        <ol className="pq-work" aria-label="Work so far">
          {state.work.map((w, i) => (
            <li key={i}><span className="dim">{w.label}:</span> <b className="y">{w.value}</b></li>
          ))}
        </ol>
      )}
      <div className="pq-mathbody">
        <div className="pq-prompt">{q.prompt}</div>
        {q.model && <MathModel model={q.model} />}
      </div>
      <div className="pq-answers">
        {state.order.map((idx, d) => {
          const c = q.choices[idx];
          const st = done && c.correct ? "right" : state.tried.includes(d) ? "wrong" : "";
          return (
            <button key={`${state.phase}-${state.step}-${d}`} className={`pq-choice ${st}`} disabled={done || state.tried.includes(d)} onClick={() => onAnswer(d)}>
              <span className="key pq-pixel">{"ABCD"[d]}</span>
              <span>{c.text}</span>
            </button>
          );
        })}
      </div>
      {state.feedback && <div className={`pq-feedback ${state.feedback.ok ? "ok" : "no"}`}>{state.feedback.ok ? "" : "✘ Quill: "}{state.feedback.text}</div>}
      {!done && state.hints > 0 && (
        <div className="pq-hints">
          <div><span className="pq-pixel y">HINT 1</span> {q.hints[0]}</div>
          {state.hints > 1 && <div><span className="pq-pixel y">HINT 2</span> {q.hints[1]}</div>}
        </div>
      )}
      <div className="pq-btnrow">
        {!done && (
          <button className="pq-cta ghost pq-hintbtn" onClick={onHint} disabled={state.hints >= 2} title="Hint (H)">
            {state.hints === 0 ? "? Hint (H)" : state.hints === 1 ? "? Worked step (H)" : "Hints used"}
          </button>
        )}
        {done && (
          <button className="pq-cta" autoFocus onClick={onContinue}>{continueLabel}</button>
        )}
      </div>
    </div>
  );
}
