/* =========================================================
   Registro e historial de glucosa (RF-07): filtros, gráfica y tabla accesible
   con los mismos datos, edición y eliminación con confirmación.
   ========================================================= */
import { html, raw, firstName, todayStr, addDays, fmtDate, fmtTime, plural } from '../utils.js';
import { icon } from '../icons.js';
import { planFor, visibleGlucose, canSeeGlucose, CONTEXTS, latestGlucose } from '../data.js';
import { deleteGlucose } from '../actions.js';
import { pageHeader, emptyState, statusChip, registeredBy, notice, healthNote, lastGlucoseBlock } from '../components/ui.js';
import { openGlucoseForm } from '../components/glucoseForm.js';
import { glucoseChart } from '../components/chart.js';
import { confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getState } from '../store.js';

const filters = { from: null, to: null, context: 'todos', preset: '7' };
function applyPreset(p) {
  const t = todayStr();
  filters.preset = p;
  filters.to = t;
  filters.from = p === 'todo' ? null : addDays(t, -(Number(p) - 1));
}
applyPreset('7');

export const glucosaPage = {
  title: 'Registro de glucosa', nav: 'glucosa',
  view: (ctx) => {
    const { user, student } = ctx;
    const header = pageHeader({
      title: 'Registro e historial de glucosa', eyebrow: 'GlucoFamilia',
      sub: student ? `Mediciones manuales de ${student.name}. La última medición se determina por fecha y hora.` : '',
      actions: student ? html`<button type="button" class="btn btn-primary" data-add>${icon('plus')} Registrar glucosa</button>` : '',
    });
    if (!student) return html`${header}<section class="card">${emptyState({ ic: 'droplet', title: 'No hay estudiantes disponibles', text: user.role === 'familia' ? 'Agregá un estudiante desde Configuración.' : 'Vinculá un estudiante con un código de la familia.' })}</section>`;
    const plan = planFor(student.id);
    const full = canSeeGlucose(user, student.id);
    const recs = visibleGlucose(user, student.id, { from: filters.from, to: filters.to, context: filters.context });
    const allCount = visibleGlucose(user, student.id).length;
    const avg = recs.length ? Math.round(recs.reduce((a, g) => a + g.value, 0) / recs.length) : null;
    const canEdit = (g) => user.role === 'familia' || g.createdBy === user.id;
    return html`${header}
      ${!full ? notice('La familia no comparte el historial completo con tu perfil. Solo ves los registros que realizaste vos.', 'warn', 'lock') : ''}
      <div class="grid-3">
        <section class="card" aria-labelledby="ultimo">
          <h2 id="ultimo" class="h3">Último registro</h2>
          ${full ? lastGlucoseBlock(student) : (recs[0] ? html`<p class="big-number">${recs[0].value}</p>` : emptyState({ ic: 'droplet', title: 'Sin registros propios' }))}
        </section>
        <section class="card" aria-labelledby="meta">
          <h2 id="meta" class="h3">Meta del plan</h2>
          ${plan?.target ? html`<p class="big-number">${plan.target.min}–${plan.target.max} <span class="stat-unit">mg/dL</span></p><p class="small muted mb-0">Rango transcrito en el plan de ${firstName(student.name)} (dato ficticio).</p>`
            : html`<span class="chip">Sin meta configurada</span><p class="small muted mt-2 mb-0">${user.role === 'familia' ? 'Podés transcribir el rango indicado por el equipo de salud en el plan.' : 'La familia aún no registró una meta.'}</p>`}
          <a class="btn btn-ghost btn-sm mt-2" href="#/plan/${student.id}">Consultar plan ${icon('chev-right', { size: 16 })}</a>
        </section>
        <section class="card" aria-labelledby="resumen-periodo">
          <h2 id="resumen-periodo" class="h3">Periodo filtrado</h2>
          <div class="row" style="gap:28px"><div class="stat"><span class="stat-label">Registros</span><span class="stat-value">${recs.length}</span></div><div class="stat"><span class="stat-label">Promedio descriptivo</span><span class="stat-value">${avg ?? '—'} ${avg ? html`<span class="stat-unit">mg/dL</span>` : ''}</span></div></div>
          <p class="xsmall muted mt-2 mb-0">Resumen de los registros manuales disponibles; no es un indicador clínico.</p>
        </section>
      </div>

      <section class="card mt-6" aria-labelledby="filtros">
        <h2 id="filtros" class="h3">${icon('filter', { size: 18, cls: 'inline-icon' })} Filtros</h2>
        <form class="filter-bar" data-filters>
          <div class="segmented" role="group" aria-label="Periodo">
            ${[['7', '7 días'], ['14', '14 días'], ['30', '30 días'], ['todo', 'Todo']].map(([v, l]) => html`<button type="button" data-preset="${v}" aria-pressed="${filters.preset === v}">${l}</button>`)}
          </div>
          <div class="field"><label for="f-from">Desde</label><input class="input" id="f-from" type="date" name="from" value="${filters.from || ''}" max="${todayStr()}"></div>
          <div class="field"><label for="f-to">Hasta</label><input class="input" id="f-to" type="date" name="to" value="${filters.to || ''}" max="${todayStr()}"></div>
          <div class="field"><label for="f-ctx">Contexto</label><select class="select" id="f-ctx" name="context"><option value="todos">Todos</option>${Object.entries(CONTEXTS).map(([k, v]) => html`<option value="${k}" ${filters.context === k ? raw('selected') : ''}>${v}</option>`)}</select></div>
          <button type="button" class="btn btn-ghost" data-clear>${icon('refresh', { size: 18 })} Limpiar</button>
        </form>
        <div data-filter-error></div>
      </section>

      <section class="card mt-6" aria-labelledby="grafica">
        <h2 id="grafica" class="h3">Gráfica</h2>
        ${recs.length ? glucoseChart(recs, { plan, label: `Registros de ${firstName(student.name)}` }) : emptyState({ ic: 'chart', title: allCount ? 'No hay registros con estos filtros' : 'Todavía no hay registros', text: allCount ? 'Ampliá el periodo o cambiá el contexto.' : 'Registrá la primera medición para ver la gráfica.' })}
      </section>

      <section class="mt-6" aria-labelledby="tabla">
        <div class="row-between"><h2 id="tabla" class="h3 mb-0">Historial (${plural(recs.length, 'registro', 'registros')})</h2></div>
        ${recs.length ? html`<div class="table-wrap table-responsive mt-2"><table class="table">
          <caption class="sr-only">Registros de glucosa de ${student.name}, del más reciente al más antiguo</caption>
          <thead><tr><th scope="col">Fecha</th><th scope="col">Hora</th><th scope="col" class="num">Valor (mg/dL)</th><th scope="col">Estado según el plan</th><th scope="col">Contexto</th><th scope="col">Registrado por</th><th scope="col">Observaciones</th><th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>${recs.map((g) => html`<tr>
            <td data-label="Fecha">${fmtDate(g.at, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
            <td data-label="Hora">${fmtTime(g.at)}</td>
            <td data-label="Valor (mg/dL)" class="num"><strong>${g.value}</strong></td>
            <td data-label="Estado">${statusChip(g.value, plan)}</td>
            <td data-label="Contexto">${CONTEXTS[g.context]}</td>
            <td data-label="Registrado por">${registeredBy(g)}</td>
            <td data-label="Observaciones">${g.notes || '—'}</td>
            <td class="actions-cell">${canEdit(g) ? html`<button type="button" class="btn btn-ghost btn-icon btn-sm" data-edit="${g.id}" aria-label="Editar registro de ${fmtDate(g.at)} ${fmtTime(g.at)}">${icon('pencil', { size: 16 })}</button><button type="button" class="btn btn-ghost btn-icon btn-sm" data-del="${g.id}" aria-label="Eliminar registro de ${fmtDate(g.at)} ${fmtTime(g.at)}">${icon('trash', { size: 16 })}</button>` : html`<span class="xsmall muted">Solo lectura</span>`}</td>
          </tr>`)}</tbody></table></div>` : ''}
      </section>
      <div class="mt-6">${healthNote('Los registros son manuales y no equivalen a un monitoreo continuo.')}</div>`;
  },
  mount: (el, ctx) => {
    const { user, student } = ctx;
    el.querySelector('[data-add]')?.addEventListener('click', () => openGlucoseForm({ user, studentId: student.id, onSaved: () => ctx.refresh() }));
    const form = el.querySelector('[data-filters]');
    if (!form) return;
    form.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { applyPreset(b.dataset.preset); ctx.refresh(); }));
    form.addEventListener('change', () => {
      const from = form.from.value || null, to = form.to.value || null;
      if (from && to && from > to) {
        el.querySelector('[data-filter-error]').innerHTML = String(html`<p class="field-error">${icon('alert', { size: 16 })} La fecha "Desde" no puede ser posterior a "Hasta".</p>`);
        return;
      }
      Object.assign(filters, { from, to, context: form.context.value, preset: 'custom' });
      ctx.refresh();
    });
    el.querySelector('[data-clear]').addEventListener('click', () => { applyPreset('7'); filters.context = 'todos'; ctx.refresh(); });
    el.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      const rec = getState().glucose.find((g) => g.id === b.dataset.edit);
      openGlucoseForm({ user, record: rec, onSaved: () => ctx.refresh() });
    }));
    el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const rec = getState().glucose.find((g) => g.id === b.dataset.del);
      const ok = await confirmDialog({ title: 'Eliminar registro', message: `Se eliminará el registro de ${rec.value} mg/dL del ${fmtDate(rec.at)} a las ${fmtTime(rec.at)}. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', danger: true });
      if (!ok) return;
      deleteGlucose(rec.id);
      const latest = latestGlucose(student.id);
      toast(latest ? `Registro eliminado. Último registro actual: ${latest.value} mg/dL.` : 'Registro eliminado.', { type: 'success' });
      ctx.refresh();
    }));
  },
};
