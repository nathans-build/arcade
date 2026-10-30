/* "Show the model": the textbook's pictures for a rate or percent question (double number line, tape diagram, ratio table). */
import type { Model } from "@/math/types";

export function MathModel({ model }: { model: Model }) {
  if (model.kind === "table") {
    return (
      <div className="pq-model" aria-label="Ratio table">
        <div className="cap pq-pixel">RATIO TABLE</div>
        <table className="pq-rtable">
          <thead>
            <tr>
              <th>{model.headers[0]}</th>
              <th>{model.headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={c === "?" ? "q" : ""}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (model.kind === "tape") {
    const W = 320;
    const x0 = 10;
    const w = W - 20;
    const pw = w / model.parts;
    const shadedW = pw * model.shaded;
    return (
      <div className="pq-model" aria-label="Tape diagram">
        <div className="cap pq-pixel">TAPE DIAGRAM</div>
        <svg viewBox={`0 0 ${W} 92`} role="img" aria-label={`Tape of ${model.parts} equal parts; ${model.shadedLabel}; whole: ${model.totalLabel}`}>
          {model.shaded > 0 && (
            <>
              <path d={`M${x0} 24 v-6 h${shadedW} v6`} className="brace" />
              <text x={x0 + shadedW / 2} y={13} className="lbl hi" textAnchor="middle">{model.shadedLabel}</text>
            </>
          )}
          {Array.from({ length: model.parts }, (_, i) => (
            <g key={i}>
              <rect x={x0 + i * pw} y={28} width={pw} height={26} className={i < model.shaded ? "part on" : "part"} />
              {model.partLabel && pw >= 26 && (
                <text x={x0 + i * pw + pw / 2} y={46} className="lbl small" textAnchor="middle">{model.partLabel}</text>
              )}
            </g>
          ))}
          <path d={`M${x0} 60 v6 h${w} v-6`} className="brace" />
          <text x={x0 + w / 2} y={84} className={`lbl ${model.totalLabel.includes("?") ? "q" : ""}`} textAnchor="middle">{model.totalLabel}</text>
        </svg>
      </div>
    );
  }
  // double number line
  const [top, bot] = model.rows;
  const n = Math.max(top.ticks.length, bot.ticks.length);
  const W = 340;
  const L = 78;
  const R = W - 18;
  const xs = (i: number) => (n === 1 ? L : L + ((R - L) * i) / (n - 1));
  // Crowded lines label every 2nd (or 3rd) tick; the unknown "?" and the ends are always labeled.
  const gap = n > 1 ? (R - L) / (n - 1) : R - L;
  const every = gap >= 34 ? 1 : gap >= 17 ? 2 : 3;
  const shown = (_t: string, i: number) => top.ticks[i] === "?" || bot.ticks[i] === "?" || i % every === 0 || i === n - 1;
  const tick = (t: string, i: number, y: number, above: boolean) => (
    <g key={`${y}-${i}`}>
      <line x1={xs(i)} x2={xs(i)} y1={y - 5} y2={y + 5} className="tick" />
      {t && shown(t, i) && (
        <text x={xs(i)} y={above ? y - 9 : y + 19} textAnchor="middle" className={`lbl ${t === "?" ? "q" : ""}`}>{t}</text>
      )}
    </g>
  );
  return (
    <div className="pq-model" aria-label="Double number line">
      <div className="cap pq-pixel">DOUBLE NUMBER LINE</div>
      <svg viewBox={`0 0 ${W} 84`} role="img" aria-label={`${top.label}: ${top.ticks.join(", ")}; ${bot.label}: ${bot.ticks.join(", ")}`}>
        <text x={4} y={34} className="lbl small">{top.label}</text>
        <text x={4} y={62} className="lbl small">{bot.label}</text>
        <line x1={L - 6} x2={R + 8} y1={30} y2={30} className="axis" />
        <line x1={L - 6} x2={R + 8} y1={58} y2={58} className="axis" />
        {top.ticks.map((t, i) => tick(t, i, 30, true))}
        {bot.ticks.map((t, i) => tick(t, i, 58, false))}
      </svg>
    </div>
  );
}
