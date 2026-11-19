/* =========================================================
   Gráfica de líneas SVG sencilla para registros de glucosa.
   Usa exactamente los mismos registros que la tabla que la acompaña.
   ========================================================= */
import { html, raw, fmtDate, fmtTime } from '../utils.js';
import { glucoseStatus } from '../data.js';

/**
 * @param {Array} records registros (cualquier orden)
 * @param {{plan?:object, height?:number, label?:string}} o
 */
export function glucoseChart(records, { plan = null, height = 260, label = 'Gráfica de registros de glucosa' } = {}) {
  const data = [...records].sort((a, b) => a.at.localeCompare(b.at));
  if (!data.length) return '';
  const W = 720, H = height, pad = { l: 44, r: 16, t: 30, b: 40 };
  const t = plan?.target;
  const values = data.map((d) => d.value);
  let minV = Math.min(...values, t ? t.min : Infinity) - 20;
  let maxV = Math.max(...values, t ? t.max : -Infinity) + 20;
  minV = Math.max(0, Math.floor(minV / 20) * 20);
  maxV = Math.ceil(maxV / 20) * 20;
  const t0 = new Date(data[0].at).getTime();
  const t1 = new Date(data[data.length - 1].at).getTime();
  const span = Math.max(t1 - t0, 3600000);
  const x = (iso) => data.length === 1 ? (pad.l + (W - pad.l - pad.r) / 2) : pad.l + ((new Date(iso).getTime() - t0) / span) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b);
  const ticks = [];
  const step = (maxV - minV) > 200 ? 50 : 20;
  for (let v = Math.ceil(minV / step) * step; v <= maxV; v += step) ticks.push(v);
  // Etiquetas de días (máx. 7)
  const days = [];
  const seen = new Set();
  data.forEach((d) => { const k = fmtDate(d.at, { day: '2-digit', month: 'short' }); if (!seen.has(k)) { seen.add(k); days.push({ k, at: d.at }); } });
  const every = Math.ceil(days.length / 7);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(d.at).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ');
  const summary = `${label}: ${data.length} registros entre ${fmtDate(data[0].at)} y ${fmtDate(data[data.length - 1].at)}. Mínimo ${Math.min(...values)} y máximo ${Math.max(...values)} mg/dL.${t ? ` Banda verde: meta del plan ${t.min}–${t.max} mg/dL.` : ' Sin meta configurada.'} Los mismos datos están en la tabla.`;
  return html`<figure class="chart-figure" style="margin:0">
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${summary}" preserveAspectRatio="xMidYMid meet">
      ${ticks.map((v) => raw(`<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`))}
      ${t ? raw(`<rect class="target-band" x="${pad.l}" width="${W - pad.l - pad.r}" y="${y(t.max)}" height="${Math.max(0, y(t.min) - y(t.max))}"/>
        <line class="target-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t.max)}" y2="${y(t.max)}"/><line class="target-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t.min)}" y2="${y(t.min)}"/>`) : ''}
      ${days.filter((_, i) => i % every === 0).map((d) => raw(`<text x="${x(d.at)}" y="${H - 14}" text-anchor="middle">${d.k}</text>`))}
      <text x="4" y="14" style="font-weight:800">mg/dL</text>
      <path class="series" d="${path}"/>
      ${data.map((d) => raw(`<circle class="pt ${glucoseStatus(d.value, plan).pt}" cx="${x(d.at).toFixed(1)}" cy="${y(d.value).toFixed(1)}" r="5.5"><title>${fmtDate(d.at)} ${fmtTime(d.at)} · ${d.value} mg/dL</title></circle>`))}
    </svg>
    <figcaption class="chart-legend">
      ${t ? html`<span><i style="background:var(--green)"></i>Dentro de la meta</span><span><i style="background:var(--red)"></i>Por debajo</span><span><i style="background:#D68A00"></i>Por encima</span><span><i style="background:rgba(33,134,75,.18);border-radius:3px"></i>Meta del plan ${t.min}–${t.max} mg/dL</span>`
        : html`<span><i style="background:var(--blue)"></i>Registro (sin meta configurada)</span>`}
    </figcaption>
  </figure>`;
}
