/* =========================================================
   Reportes (RF-14): estudiante y periodo, gráfica y tabla con los mismos datos,
   exportación CSV de los registros filtrados. Resumen descriptivo, sin conclusiones médicas.
   ========================================================= */
import { html, raw, todayStr, addDays, fmtDate, fmtTime, localParts, slug, downloadFile, csvCell, plural, firstName } from '../utils.js';
import { icon } from '../icons.js';
import { studentsForUser, canSeeGlucose, visibleGlucose, planFor, glucoseStatus, incidentsForUser, CONTEXTS, studentById } from '../data.js';
import { pageHeader, emptyState, statusChip, registeredBy, notice, healthNote } from '../components/ui.js';
import { glucoseChart } from '../components/chart.js';
import { toast } from '../components/toast.js';

const r = { student: '', from: addDays(todayStr(), -6), to: todayStr() };

function rows(user) {
  const s = studentById(r.student);
  if (!s) return [];
  return visibleGlucose(user, s.id, { from: r.from, to: r.to });
}

export const reportesPage = {
  title: 'Reportes', nav: 'reportes',
  view: (ctx) => {
    const { user } = ctx;
    const students = studentsForUser(user);
    if (!students.length) return html`${pageHeader({ title: 'Reportes' })}<div class="card">${emptyState({ ic: 'chart', title: 'No hay estudiantes disponibles' })}</div>`;
    if (!students.some((s) => s.id === r.student)) r.student = ctx.student?.id || students[0].id;
    const s = studentById(r.student);
    const plan = planFor(s.id);
    const data = rows(user);
    const avg = data.length ? Math.round(data.reduce((a, g) => a + g.value, 0) / data.length) : null;
    const incs = incidentsForUser(user, { studentId: s.id }).filter((i) => { const d = localParts(i.at).date; return d >= r.from && d <= r.to; });
    const counts = { bajo: 0, meta: 0, alto: 0, sin: 0 };
    data.forEach((g) => { counts[glucoseStatus(g.value, plan).key] += 1; });
    const full = canSeeGlucose(user, s.id);
    return html`${pageHeader({ title: 'Reportes', eyebrow: 'Seguimiento', sub: 'Consultá los registros de un periodo y exportalos en CSV para compartirlos con el equipo de salud.', actions: html`<button type="button" class="btn btn-primary" data-export ${data.length ? '' : raw('disabled')}>${icon('download', { size: 18 })} Exportar CSV</button>` })}
      <form class="card card-tight filter-bar" data-rep novalidate>
        <div class="field"><label for="rp-s">Estudiante</label><select class="select" id="rp-s" name="student">${students.map((x) => html`<option value="${x.id}" ${x.id === r.student ? raw('selected') : ''}>${x.name}</option>`)}</select></div>
        <div class="field"><label for="rp-f">Desde</label><input class="input" id="rp-f" type="date" name="from" value="${r.from}" max="${todayStr()}"></div>
        <div class="field"><label for="rp-t">Hasta</label><input class="input" id="rp-t" type="date" name="to" value="${r.to}" max="${todayStr()}"></div>
        <div class="segmented" role="group" aria-label="Periodos rápidos">${[['7', '7 días'], ['14', '14 días'], ['30', '30 días']].map(([v, l]) => html`<button type="button" data-days="${v}">${l}</button>`)}</div>
      </form>
      <div data-rep-error></div>
      ${!full ? notice('La familia no comparte el historial completo: el reporte incluye solo los registros que realizaste.', 'warn', 'lock') : ''}
      <div class="grid-3 mt-6">
        <section class="card"><div class="stat"><span class="stat-label">Cantidad de registros</span><span class="stat-value">${data.length}</span></div><p class="xsmall muted mb-0">${fmtDate(r.from + 'T18:00:00Z')} – ${fmtDate(r.to + 'T18:00:00Z')}</p></section>
        <section class="card"><div class="stat"><span class="stat-label">Promedio de los registros disponibles</span><span class="stat-value">${avg ?? '—'} ${avg ? html`<span class="stat-unit">mg/dL</span>` : ''}</span></div><p class="xsmall muted mb-0">Resumen descriptivo. No es un indicador clínico ni permite conclusiones médicas.</p></section>
        <section class="card"><div class="stat"><span class="stat-label">Incidentes documentados</span><span class="stat-value">${incs.length}</span></div><p class="xsmall muted mb-0">Registrados por la escuela en el periodo.</p></section>
      </div>
      <section class="card mt-6" aria-labelledby="etq">
        <h2 class="h3" id="etq">Registros según la meta del plan</h2>
        <div class="row">${plan?.target
          ? html`<span class="chip chip-low">Por debajo: ${counts.bajo}</span><span class="chip chip-ok">Dentro: ${counts.meta}</span><span class="chip chip-high">Por encima: ${counts.alto}</span>`
          : html`<span class="chip">Sin meta configurada: ${counts.sin}</span>`}</div>
        <p class="xsmall muted mt-2 mb-0">Conteo de mediciones manuales puntuales. No equivale al "tiempo en rango" de un sensor de monitoreo continuo.</p>
      </section>
      <section class="card mt-6" aria-labelledby="g-rep">
        <h2 class="h3" id="g-rep">Gráfica del periodo</h2>
        ${data.length ? glucoseChart(data, { plan, label: `Registros de ${firstName(s.name)} en el periodo` }) : emptyState({ ic: 'chart', title: 'No hay registros en este periodo', text: 'Elegí otras fechas u otro estudiante.' })}
      </section>
      ${data.length ? html`<section class="mt-6" aria-labelledby="t-rep"><h2 class="h3" id="t-rep">Tabla de registros (${plural(data.length, 'registro', 'registros')})</h2>
        <div class="table-wrap table-responsive"><table class="table"><caption class="sr-only">Registros de ${s.name} del ${r.from} al ${r.to}</caption>
        <thead><tr><th scope="col">Fecha</th><th scope="col">Hora</th><th scope="col" class="num">mg/dL</th><th scope="col">Etiqueta</th><th scope="col">Contexto</th><th scope="col">Registrado por</th></tr></thead>
        <tbody>${data.map((g) => html`<tr><td data-label="Fecha">${fmtDate(g.at)}</td><td data-label="Hora">${fmtTime(g.at)}</td><td data-label="mg/dL" class="num"><strong>${g.value}</strong></td><td data-label="Etiqueta">${statusChip(g.value, plan)}</td><td data-label="Contexto">${CONTEXTS[g.context]}</td><td data-label="Registrado por">${registeredBy(g)}</td></tr>`)}</tbody></table></div></section>` : ''}
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    const form = el.querySelector('[data-rep]');
    if (!form) return;
    form.addEventListener('change', () => {
      if (form.from.value && form.to.value && form.from.value > form.to.value) {
        el.querySelector('[data-rep-error]').innerHTML = String(html`<p class="field-error mt-2">${icon('alert', { size: 16 })} La fecha "Desde" no puede ser posterior a "Hasta".</p>`);
        return;
      }
      Object.assign(r, { student: form.student.value, from: form.from.value || r.from, to: form.to.value || r.to });
      ctx.refresh();
    });
    el.querySelectorAll('[data-days]').forEach((b) => b.addEventListener('click', () => { r.to = todayStr(); r.from = addDays(r.to, -(Number(b.dataset.days) - 1)); ctx.refresh(); }));
    el.querySelector('[data-export]')?.addEventListener('click', () => {
      const s = studentById(r.student);
      const plan = planFor(s.id);
      const data = rows(ctx.user);
      if (!data.length) return;
      const head = ['fecha', 'hora', 'estudiante', 'valor_mg_dl', 'contexto', 'etiqueta_segun_meta_del_plan', 'registrado_por', 'observaciones'];
      const lines = [...data].sort((a, b) => a.at.localeCompare(b.at)).map((g) => [localParts(g.at).date, fmtTime(g.at), s.name, g.value, CONTEXTS[g.context], glucoseStatus(g.value, plan).label, registeredBy(g), g.notes].map(csvCell).join(';'));
      const csv = `﻿${head.join(';')}\n${lines.join('\n')}\n`;
      const name = `glucokids_${slug(s.name)}_${r.from}_${r.to}.csv`;
      downloadFile(name, csv, 'text/csv;charset=utf-8');
      toast(`Se descargó ${name} con ${plural(data.length, 'registro', 'registros')}.`, { type: 'success', title: 'CSV exportado' });
    });
  },
};
