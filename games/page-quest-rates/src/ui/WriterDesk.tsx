import { useEffect, useMemo, useRef, useState } from "react";
import { gradeNumber, type Grade } from "@/kit";
import { makeBook, type Book } from "@/books";
import { checkStory } from "@/story/validate";
import { LIMITS } from "@/story/validate";
import { ANCHORS, BANDS, BAND_GRADES, CHARACTERS, GENRES, MOODS, SCENES, SCENE_LABEL, bandOfGrade, type Band } from "@/story/roster";
import type { CastMember } from "@/story/types";
import { blankPage, draftFromText, draftId, draftToText, newDraft, type Draft, type DraftPage, type EndKind } from "@/writer/draft";
import { MiniScene } from "./Library";

const NEW_PAGE = "__new__";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-book";
}

function freshId(d: Draft, base = "page"): string {
  for (let i = d.pages.length + 1; ; i++) {
    const id = `${base}-${i}`;
    if (!d.pages.some((p) => p.id === id)) return id;
  }
}

export function WriterDesk({
  drafts, initialId, grade, onChange, onPlaytest, onExit,
}: {
  drafts: Draft[];
  initialId: string | null;
  grade: Grade;
  onChange: (d: Draft[]) => void;
  onPlaytest: (book: Book, page: string) => void;
  onExit: () => void;
}) {
  const [curId, setCurId] = useState<string | null>(() => initialId ?? drafts[0]?.id ?? null);
  const [pageIdx, setPageIdx] = useState(0);
  const [paste, setPaste] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Start a first draft automatically.
  useEffect(() => {
    if (!curId || !drafts.some((d) => d.id === curId)) {
      if (drafts.length) setCurId(drafts[0].id);
      else {
        const d = newDraft(bandOfGrade(gradeNumber(grade)) ?? "4-5");
        onChange([d]);
        setCurId(d.id);
      }
    }
  }, [curId, drafts, grade, onChange]);

  const draft = drafts.find((d) => d.id === curId) ?? null;
  const text = useMemo(() => (draft ? draftToText(draft) : ""), [draft]);
  const check = useMemo(() => checkStory(text), [text]);

  if (!draft) return <div className="pq-desk" />;
  const page = draft.pages[Math.min(pageIdx, draft.pages.length - 1)];
  const pIdx = draft.pages.indexOf(page);

  const save = (d: Draft) => onChange(drafts.map((x) => (x.id === d.id ? { ...d, updated: Date.now() } : x)));
  const setHeader = (k: keyof Draft["header"], v: string) => save({ ...draft, header: { ...draft.header, [k]: v } });
  const setPage = (np: Partial<DraftPage>) => save({ ...draft, pages: draft.pages.map((p, i) => (i === pIdx ? { ...p, ...np } : p)) });

  const addPage = (): string => {
    const id = freshId(draft);
    save({ ...draft, pages: [...draft.pages, blankPage(id, page?.scene ?? "library")] });
    return id;
  };

  const renamePage = (newId: string) => {
    const old = page.id;
    const clean = newId.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const fix = (x: string) => (old && x === old ? clean : x);
    save({
      ...draft,
      header: { ...draft.header, start: fix(draft.header.start) },
      pages: draft.pages.map((p) => ({
        ...p,
        id: p.id === old ? clean : p.id,
        choices: p.choices.map((c) => ({ ...c, target: fix(c.target) })),
        gate: { ...p.gate, next: fix(p.gate.next) },
      })),
    });
  };

  const deletePage = () => {
    if (draft.pages.length <= 1) return;
    if (!window.confirm(`Delete page "${page.id}"?`)) return;
    save({ ...draft, pages: draft.pages.filter((_, i) => i !== pIdx) });
    setPageIdx(Math.max(0, pIdx - 1));
  };

  const newBook = () => {
    const d = newDraft(bandOfGrade(gradeNumber(grade)) ?? "4-5");
    onChange([...drafts, d]);
    setCurId(d.id);
    setPageIdx(0);
  };
  const deleteBook = () => {
    if (!window.confirm(`Delete the draft "${draft.header.title}"? Export it first if you want to keep it.`)) return;
    const rest = drafts.filter((d) => d.id !== draft.id);
    onChange(rest);
    setCurId(rest[0]?.id ?? null);
    setPageIdx(0);
  };
  const exportBook = () => {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug(draft.header.title)}.story`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setMsg(`Exported ${slug(draft.header.title)}.story`);
    } catch {
      setMsg("Export failed in this browser. Copy the text from IMPORT/PASTE instead.");
    }
  };
  const importText = (t: string) => {
    const d = { ...draftFromText(t), id: draftId(), updated: Date.now() };
    if (!d.pages.length) {
      setMsg("That file has no pages (pages start with === page-id).");
      return;
    }
    onChange([...drafts, d]);
    setCurId(d.id);
    setPageIdx(0);
    setPaste(null);
    const r = checkStory(t);
    setMsg(`Imported "${d.header.title}" (${d.pages.length} pages, ${r.errors.length} errors).`);
  };

  const playtest = (from: string) => {
    const book = makeBook(`draft/${draft.id}`, text, { draft: true });
    onPlaytest(book, from);
  };

  const ids = draft.pages.map((p) => p.id);
  const startSelect = (
    <select
      aria-label="Start page"
      value={ids.includes(draft.header.start) ? draft.header.start : ""}
      onChange={(e) => {
        if (e.target.value === NEW_PAGE) {
          const id = freshId(draft);
          save({ ...draft, header: { ...draft.header, start: id }, pages: [...draft.pages, blankPage(id, page.scene)] });
        } else setHeader("start", e.target.value);
      }}
    >
      <option value="">— pick a page —</option>
      {ids.map((id) => (
        <option key={id} value={id}>{id}</option>
      ))}
      <option value={NEW_PAGE}>+ new page…</option>
    </select>
  );

  // For "+ new page" picks we need to set the link on the draft that includes the new page.
  const linkChoice = (ci: number, target: string) => {
    if (target === NEW_PAGE) {
      const id = freshId(draft);
      const np = blankPage(id, page.scene);
      save({ ...draft, pages: [...draft.pages.map((p, i) => (i === pIdx ? { ...p, choices: p.choices.map((c, j) => (j === ci ? { ...c, target: id } : c)) } : p)), np] });
    } else setPage({ choices: page.choices.map((c, j) => (j === ci ? { ...c, target } : c)) });
  };
  const linkNext = (target: string) => {
    if (target === NEW_PAGE) {
      const id = freshId(draft);
      const np = blankPage(id, page.scene);
      save({ ...draft, pages: [...draft.pages.map((p, i) => (i === pIdx ? { ...p, gate: { ...p.gate, next: id } } : p)), np] });
    } else setPage({ gate: { ...page.gate, next: target } });
  };
  const targetSelect = (value: string, onPick: (v: string) => void, label: string) => (
    <select aria-label={label} value={ids.includes(value) ? value : ""} onChange={(e) => onPick(e.target.value === NEW_PAGE ? NEW_PAGE : e.target.value)}>
      <option value="">— pick a page —</option>
      {ids.map((id) => <option key={id} value={id}>{id}</option>)}
      <option value={NEW_PAGE}>+ new page…</option>
    </select>
  );

  const setCast = (slot: number, id: string, mood?: string) => {
    const cast = [...page.cast];
    if (!id) cast.splice(slot, 1);
    else cast[slot] = { id, mood: mood ?? cast[slot]?.mood ?? "normal" };
    setPage({ cast: cast.filter(Boolean) as CastMember[] });
  };

  const pageIssues = check.issues.filter((i) => i.page === page.id);
  const band = (BANDS as readonly string[]).includes(draft.header.band) ? (draft.header.band as Band) : null;
  const fk = check.stats.readability.grade;
  const [lo, hi] = band ? BAND_GRADES[band] : [4, 12];
  const fkState = check.stats.readability.words < 30 ? "dim" : fk < lo - 2 ? "easy" : fk > hi + 1 ? "hard" : "fit";
  const castNames = CHARACTERS.filter((c) => page.cast.some((m) => m.id === c.id) && c.id !== "hero").map((c) => c.name);

  return (
    <div className="pq-desk">
      <div className="pq-deskbar">
        <span className="pq-pixel pq-desktitle">✎ WRITER'S DESK</span>
        <span className="dim">co-author: SpiderBen10</span>
        <select aria-label="Draft" value={draft.id} onChange={(e) => { setCurId(e.target.value); setPageIdx(0); }}>
          {drafts.map((d) => <option key={d.id} value={d.id}>{d.header.title || "(untitled)"}</option>)}
        </select>
        <button className="pq-small pq-pixel" onClick={newBook}>NEW</button>
        <button className="pq-small pq-pixel" onClick={deleteBook}>DELETE</button>
        <button className="pq-small pq-pixel" onClick={() => fileRef.current?.click()}>IMPORT</button>
        <button className="pq-small pq-pixel" onClick={() => setPaste("")}>PASTE</button>
        <button className="pq-small pq-pixel" onClick={exportBook}>EXPORT</button>
        <input ref={fileRef} type="file" accept=".story,.txt,text/plain" style={{ display: "none" }} onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) importText(await f.text());
          e.target.value = "";
        }} />
        <span className="grow" />
        <button className="pq-cta small" onClick={() => playtest(page.id)}>▶ Playtest this page</button>
        <button className="pq-cta small ghost" onClick={() => playtest(draft.header.start)}>▶ From start</button>
        <button className="pq-small pq-pixel" onClick={onExit}>◀ LIBRARY</button>
      </div>
      {msg && <div className="pq-deskmsg" onClick={() => setMsg("")}>{msg}</div>}

      <div className="pq-deskgrid">
        {/* ---- Book + page list ---- */}
        <section className="pq-col left">
          <h3 className="pq-pixel">BOOK</h3>
          <label>Title<input value={draft.header.title} onChange={(e) => setHeader("title", e.target.value)} /></label>
          <label>Author<input value={draft.header.author} onChange={(e) => setHeader("author", e.target.value)} /></label>
          <div className="row">
            <label>Genre
              <select value={draft.header.genre} onChange={(e) => setHeader("genre", e.target.value)}>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>Band
              <select value={draft.header.band} onChange={(e) => setHeader("band", e.target.value)}>
                {BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          </div>
          <label>Cover scene
            <select value={draft.header.cover} onChange={(e) => setHeader("cover", e.target.value)}>
              {SCENES.map((s) => <option key={s} value={s}>{SCENE_LABEL[s]}</option>)}
            </select>
          </label>
          <label>Blurb <span className={draft.header.blurb.length > LIMITS.blurb ? "no" : "dim"}>{draft.header.blurb.length}/{LIMITS.blurb}</span>
            <textarea rows={2} value={draft.header.blurb} onChange={(e) => setHeader("blurb", e.target.value)} />
          </label>
          <label>Start page{startSelect}</label>

          <h3 className="pq-pixel">PAGES</h3>
          <ul className="pq-pagelist">
            {draft.pages.map((p, i) => {
              const errs = check.errors.filter((x) => x.page === p.id).length;
              return (
                <li key={i}>
                  <button className={i === pIdx ? "on" : ""} onClick={() => setPageIdx(i)}>
                    <span>{p.id === draft.header.start ? "★ " : ""}{p.id || "(no id)"}</span>
                    <span className={`k k-${p.kind}`}>{p.kind === "choices" ? `${p.choices.length} choice${p.choices.length === 1 ? "" : "s"}` : p.kind === "gate" ? "gate" : `end: ${p.end.type}`}</span>
                    {errs > 0 && <span className="no">●{errs}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="pq-btnrow">
            <button className="pq-small pq-pixel" onClick={() => { const id = addPage(); setPageIdx(draft.pages.length); setMsg(`Added page "${id}".`); }}>+ ADD PAGE</button>
            <button className="pq-small pq-pixel" disabled={draft.pages.length <= 1} onClick={deletePage}>DELETE PAGE</button>
          </div>
        </section>

        {/* ---- Page editor ---- */}
        <section className="pq-col mid">
          <h3 className="pq-pixel">PAGE</h3>
          <div className="row">
            <label>Page id<input value={page.id} onChange={(e) => renamePage(e.target.value)} /></label>
            <label>Scene
              <select value={page.scene} onChange={(e) => setPage({ scene: e.target.value })}>
                {SCENES.map((s) => <option key={s} value={s}>{SCENE_LABEL[s]}</option>)}
              </select>
            </label>
            <label className="check"><input type="checkbox" checked={page.checkpoint} onChange={(e) => setPage({ checkpoint: e.target.checked })} /> checkpoint</label>
          </div>
          <div className="pq-cast">
            {[0, 1, 2].map((slot) => {
              const m = page.cast[slot];
              return (
                <div key={slot} className="slot">
                  <select aria-label={`Cast ${slot + 1}`} value={m?.id ?? ""} disabled={slot > page.cast.length} onChange={(e) => setCast(slot, e.target.value)}>
                    <option value="">(nobody)</option>
                    {CHARACTERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select aria-label={`Mood ${slot + 1}`} value={m?.mood ?? "normal"} disabled={!m} onChange={(e) => setCast(slot, m!.id, e.target.value)}>
                    {MOODS.map((md) => <option key={md} value={md}>{md}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
          <label>Story text
            <span className="dim small"> — blank line = new paragraph · dialogue: {castNames.length ? castNames.map((n) => `"${n}: ..."`).join(", ") : '"Quill: ..." (add them to the cast)'} · heading: ~ Chapter One ~</span>
            <textarea className="body" rows={8} value={page.body} onChange={(e) => setPage({ body: e.target.value })} />
          </label>
          <label>Clues for the journal <span className="dim small">(one per line)</span>
            <textarea rows={2} value={page.clues.join("\n")} onChange={(e) => setPage({ clues: e.target.value.split("\n") })} />
          </label>

          <div className="pq-endkind" role="radiogroup" aria-label="Page ends with">
            {(["choices", "gate", "end"] as EndKind[]).map((k) => (
              <button key={k} role="radio" aria-checked={page.kind === k} className={`pq-small pq-pixel ${page.kind === k ? "on" : ""}`} onClick={() => setPage({ kind: k })}>
                {k === "choices" ? "CHOICES" : k === "gate" ? "QUESTION GATE" : "ENDING"}
              </button>
            ))}
          </div>

          {page.kind === "choices" && (
            <div className="pq-edchoices">
              {page.choices.map((c, i) => (
                <div key={i} className="row">
                  <span className="key pq-pixel">{"ABCD"[i]}</span>
                  <input aria-label={`Choice ${i + 1} text`} maxLength={80} value={c.text} placeholder="What do you do?" onChange={(e) => setPage({ choices: page.choices.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                  <span className={c.text.length > LIMITS.choice ? "no small" : "dim small"}>{c.text.length}/{LIMITS.choice}</span>
                  <span>→</span>
                  {targetSelect(c.target, (v) => linkChoice(i, v), `Choice ${i + 1} goes to`)}
                  <button className="pq-small" aria-label="Remove choice" onClick={() => setPage({ choices: page.choices.filter((_, j) => j !== i) })}>✕</button>
                </div>
              ))}
              {page.choices.length < 4 && (
                <button className="pq-small pq-pixel" onClick={() => setPage({ choices: [...page.choices, { text: "", target: "" }] })}>+ ADD CHOICE</button>
              )}
            </div>
          )}

          {page.kind === "gate" && (
            <div className="pq-edgate">
              <div className="row">
                <label>Type
                  <select value={page.gate.kind} onChange={(e) => setPage({ gate: { ...page.gate, kind: e.target.value as "mc" | "order" } })}>
                    <option value="mc">multiple choice</option>
                    <option value="order">put in order</option>
                  </select>
                </label>
                <label>Standard
                  <select value={page.gate.anchor} onChange={(e) => setPage({ gate: { ...page.gate, anchor: e.target.value } })}>
                    {Object.entries(ANCHORS).map(([a, s]) => <option key={a} value={a}>{a} · {s}</option>)}
                  </select>
                </label>
              </div>
              <label>Question<input value={page.gate.question} onChange={(e) => setPage({ gate: { ...page.gate, question: e.target.value } })} /></label>
              {page.gate.kind === "mc" ? (
                <>
                  {page.gate.answers.map((a, i) => (
                    <div key={i} className="row">
                      <label className="check" title="The right answer"><input type="radio" name="right" checked={a.correct} onChange={() => setPage({ gate: { ...page.gate, answers: page.gate.answers.map((x, j) => ({ ...x, correct: j === i })) } })} /> right</label>
                      <input aria-label={`Answer ${i + 1}`} value={a.text} onChange={(e) => setPage({ gate: { ...page.gate, answers: page.gate.answers.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) } })} />
                      <span className={a.text.length > LIMITS.answer ? "no small" : "dim small"}>{a.text.length}/{LIMITS.answer}</span>
                      <button className="pq-small" disabled={page.gate.answers.length <= 2} aria-label="Remove answer" onClick={() => setPage({ gate: { ...page.gate, answers: page.gate.answers.filter((_, j) => j !== i) } })}>✕</button>
                    </div>
                  ))}
                  {page.gate.answers.length < 4 && <button className="pq-small pq-pixel" onClick={() => setPage({ gate: { ...page.gate, answers: [...page.gate.answers, { text: "", correct: false }] } })}>+ ADD ANSWER</button>}
                </>
              ) : (
                <>
                  {page.gate.items.map((it, i) => (
                    <div key={i} className="row">
                      <span className="key pq-pixel">{i + 1}</span>
                      <input aria-label={`Item ${i + 1}`} value={it} onChange={(e) => setPage({ gate: { ...page.gate, items: page.gate.items.map((x, j) => (j === i ? e.target.value : x)) } })} />
                      <button className="pq-small" disabled={page.gate.items.length <= 3} aria-label="Remove item" onClick={() => setPage({ gate: { ...page.gate, items: page.gate.items.filter((_, j) => j !== i) } })}>✕</button>
                    </div>
                  ))}
                  {page.gate.items.length < 5 && <button className="pq-small pq-pixel" onClick={() => setPage({ gate: { ...page.gate, items: [...page.gate.items, ""] } })}>+ ADD ITEM</button>}
                  <div className="dim small">Write the items in the RIGHT order; the game shuffles them.</div>
                </>
              )}
              <label>Quill's hint<input value={page.gate.hint} onChange={(e) => setPage({ gate: { ...page.gate, hint: e.target.value } })} /></label>
              <label>Next page{targetSelect(page.gate.next, linkNext, "Next page")}</label>
            </div>
          )}

          {page.kind === "end" && (
            <div className="row">
              <label>Ending type
                <select value={page.end.type} onChange={(e) => setPage({ end: { ...page.end, type: e.target.value } })}>
                  <option value="win">win</option>
                  <option value="secret">secret</option>
                  <option value="lose" disabled={draft.header.band === "4-5"}>lose (6-8, 9-12 only)</option>
                </select>
              </label>
              <label>Ending name<input value={page.end.name} onChange={(e) => setPage({ end: { ...page.end, name: e.target.value } })} /></label>
            </div>
          )}
        </section>

        {/* ---- Preview + validator ---- */}
        <section className="pq-col right">
          <h3 className="pq-pixel">PREVIEW</h3>
          <MiniScene scene={page.scene} cast={page.cast} className="preview" />
          <div className="pq-meter">
            <div className="lbl">Reading level <b className={fkState}>{check.stats.readability.words ? Math.max(0, fk).toFixed(1) : "—"}</b>
              <span className="dim small"> (Flesch–Kincaid grade · target {draft.header.band})</span></div>
            <div className="bar"><div className={`fill ${fkState}`} style={{ width: `${Math.max(3, Math.min(100, (fk / 14) * 100))}%` }} /><div className="band" style={{ left: `${(lo / 14) * 100}%`, width: `${((hi - lo + 1) / 14) * 100}%` }} /></div>
            <div className="dim small">{check.stats.readability.words} words · {check.stats.pages} pages · endings {check.stats.endings.win + check.stats.endings.secret + check.stats.endings.lose}</div>
          </div>
          <h3 className="pq-pixel">CHECK {check.errors.length ? <span className="no">{check.errors.length} ERROR{check.errors.length > 1 ? "S" : ""}</span> : <span className="ok">READY ✔</span>}</h3>
          <ul className="pq-issues">
            {pageIssues.length > 0 && <li className="hdr">This page:</li>}
            {[...pageIssues, ...check.issues.filter((i) => i.page !== page.id)].slice(0, 40).map((i, k) => (
              <li key={k} className={i.level}>
                <button onClick={() => { const at = draft.pages.findIndex((p) => p.id === i.page); if (at >= 0) setPageIdx(at); }}>
                  {i.level === "error" ? "✘" : "!"} {i.page && i.page !== page.id ? `[${i.page}] ` : ""}{i.message}
                </button>
              </li>
            ))}
            {check.issues.length === 0 && <li className="ok">No problems. Playtest it, then EXPORT to share!</li>}
          </ul>
          <details className="pq-source">
            <summary className="pq-pixel">.STORY TEXT</summary>
            <pre>{text}</pre>
          </details>
        </section>
      </div>

      {paste !== null && (
        <div className="pq-overlay">
          <div className="pq-card wide" role="dialog" aria-label="Paste a story">
            <div className="pq-h pq-pixel">PASTE A .STORY FILE</div>
            <textarea className="pq-paste" rows={14} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"title: ...\nauthor: ...\n\n=== start\nscene: library\n..."} />
            <div className="pq-btnrow">
              <button className="pq-cta" onClick={() => importText(paste)}>Import</button>
              <button className="pq-cta ghost" onClick={() => setPaste(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
