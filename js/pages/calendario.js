/* =========================================================
   Calendario y recordatorios (RF-13): vista mensual y agenda.
   El completado de una rutina recurrente se guarda por fecha.
   Los avisos son internos y funcionan solo con la aplicación abierta.
   ========================================================= */
import { html, raw, todayStr, addDays, monthMatrix, fmtDateStr, capitalize, formData, firstName } from '../utils.js';
import { icon } from '../icons.js';
import { occurrencesOn, remindersVisible, studentById, REMINDER_CATEGORIES, RECURRENCE } from '../data.js';
import { saveReminder, deleteReminder, validateReminder } from '../actions.js';
import { pageHeader, emptyState, notice } from '../components/ui.js';
import { reminderRow, bindReminderToggles } from '../components/reminders.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, select, textarea, showErrors, liveClear } from '../components/forms.js';
import { getState } from '../store.js';

const ui = { month: todayStr().slice(0, 7), selected: todayStr(), view: 'mes', student: '' };
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function idsFor(user) {
  const all = remindersVisible(user);
  return ui.student && all.includes(ui.student) ? [ui.student] : all;
}

export const calendarioPage = {
  title: 'Calendario', nav: 'calendario',
  view: (ctx) => {
    const { user } = ctx;
    const canEdit = user.role === 'familia';
    const visible = remindersVisible(user);
    const ids = idsFor(user);
    const [y, m] = ui.month.split('-').map(Number);
    const weeks = monthMatrix(y, m - 1);
    const today = todayStr();
    const monthLabel = capitalize(fmtDateStr(`${ui.month}-15`, { month: 'long', year: 'numeric' }));
    const header = pageHeader({
      title: 'Calendario y recordatorios', eyebrow: 'GlucoFamilia',
      sub: canEdit ? 'Rutinas de alimentación, actividad, consultas, mediciones y rutinas indicadas en el plan.' : 'Vista de solo lectura de los recordatorios que las familias comparten con tu perfil.',
      actions: canEdit && visible.length ? html`<button type="button" class="btn btn-primary" data-new>${icon('plus')} Nuevo recordatorio</button>` : '',
    });
    if (!visible.length) return html`${header}<div class="card">${emptyState({ ic: 'calendar', title: canEdit ? 'Agregá un estudiante para usar el calendario' : 'No hay calendarios compartidos', text: canEdit ? '' : 'Las familias pueden compartir sus recordatorios desde Configuración › Permisos.' })}</div>`;
    const dayOcc = occurrencesOn(ui.selected, ids);
    return html`${header}
      ${notice('Los avisos son internos: aparecen en GlucoKids mientras la aplicación está abierta. No son notificaciones push ni recordatorios garantizados con la app cerrada.', '', 'bell')}
      <div class="card card-tight cal-toolbar mt-4">
        <div class="segmented" role="group" aria-label="Vista">
          <button type="button" data-view="mes" aria-pressed="${ui.view === 'mes'}">${icon('grid', { size: 16 })} Mes</button>
          <button type="button" data-view="agenda" aria-pressed="${ui.view === 'agenda'}">${icon('list', { size: 16 })} Agenda</button>
        </div>
        <div class="field"><label class="sr-only" for="cal-st">Estudiante</label><select class="select" id="cal-st" data-student><option value="">Todos los estudiantes</option>${visible.map((id) => html`<option value="${id}" ${ui.student === id ? raw('selected') : ''}>${studentById(id).name}</option>`)}</select></div>
        ${ui.view === 'mes' ? html`<div class="row cal-nav"><button type="button" class="btn btn-ghost btn-icon" data-month="-1" aria-label="Mes anterior">${icon('chev-left')}</button><h2 class="h3 mb-0" aria-live="polite">${monthLabel}</h2><button type="button" class="btn btn-ghost btn-icon" data-month="1" aria-label="Mes siguiente">${icon('chev-right')}</button><button type="button" class="btn btn-sm" data-today>Hoy</button></div>` : ''}
      </div>
      ${ui.view === 'mes' ? html`<div class="cal-layout mt-4">
        <div class="card cal-card">
          <div class="cal-grid" role="grid" aria-label="${monthLabel}">
            <div class="cal-row cal-head" role="row">${WEEKDAYS.map((d) => html`<span role="columnheader">${d}</span>`)}</div>
            ${weeks.map((w) => html`<div class="cal-row" role="row">${w.map((d) => {
              const occ = occurrencesOn(d, ids);
              const out = d.slice(0, 7) !== ui.month;
              const done = occ.filter((o) => o.done).length;
              return html`<div role="gridcell"><button type="button" class="cal-day ${out ? 'out' : ''} ${d === today ? 'today' : ''} ${d === ui.selected ? 'selected' : ''}" data-day="${d}" aria-pressed="${d === ui.selected}" aria-label="${fmtDateStr(d, { weekday: 'long', day: 'numeric', month: 'long' })}: ${occ.length} recordatorios${occ.length ? `, ${done} completados` : ''}">
                <span class="cal-num">${Number(d.slice(8))}</span>
                <span class="cal-pills">${occ.slice(0, 2).map((o) => html`<span class="cal-pill ${o.done ? 'done' : ''}" style="--cat:${REMINDER_CATEGORIES[o.reminder.category].color}">${o.reminder.time} ${o.reminder.title}</span>`)}${occ.length > 2 ? html`<span class="cal-more">+${occ.length - 2}</span>` : ''}</span>
                <span class="cal-dots" aria-hidden="true">${occ.slice(0, 4).map((o) => html`<i style="background:${REMINDER_CATEGORIES[o.reminder.category].color}"></i>`)}</span>
              </button></div>`;
            })}</div>`)}
          </div>
        </div>
        <section class="card" aria-labelledby="day-agenda">
          <h2 class="h3" id="day-agenda">${capitalize(fmtDateStr(ui.selected, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
          ${dayOcc.length ? html`<ul class="list reminder-list">${dayOcc.map((o) => reminderRow(o, { canEdit, editable: canEdit }))}</ul>` : emptyState({ ic: 'calendar', title: 'Sin recordatorios este día', action: canEdit ? html`<button type="button" class="btn btn-secondary btn-sm" data-new>${icon('plus', { size: 16 })} Agregar</button>` : '' })}
        </section>
      </div>` : agendaView(ids, canEdit)}
      <section class="card card-tight mt-6"><div class="row small">${Object.values(REMINDER_CATEGORIES).map((c) => html`<span class="row" style="gap:6px"><i class="legend-dot" style="background:${c.color}"></i>${c.label}</span>`)}</div></section>`;
  },
  mount: (el, ctx) => {
    bindReminderToggles(el, ctx);
    el.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { ui.view = b.dataset.view; ctx.refresh(); }));
    el.querySelector('[data-student]')?.addEventListener('change', (e) => { ui.student = e.target.value; ctx.refresh(); });
    el.querySelectorAll('[data-month]').forEach((b) => b.addEventListener('click', () => {
      const [y, m] = ui.month.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + Number(b.dataset.month), 15));
      ui.month = d.toISOString().slice(0, 7);
      ctx.refresh();
    }));
    el.querySelector('[data-today]')?.addEventListener('click', () => { ui.month = todayStr().slice(0, 7); ui.selected = todayStr(); ctx.refresh(); });
    el.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => {
      ui.selected = b.dataset.day;
      if (ui.selected.slice(0, 7) !== ui.month) ui.month = ui.selected.slice(0, 7);
      ctx.refresh();
      document.querySelector(`[data-day="${ui.selected}"]`)?.focus();
    }));
    el.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', () => openReminderForm(ctx)));
    if (ctx.query.nuevo && ctx.user.role === 'familia' && !ctx.isRefresh) openReminderForm(ctx);
    el.querySelectorAll('[data-edit-rem]').forEach((b) => b.addEventListener('click', () => openReminderForm(ctx, getState().reminders.find((r) => r.id === b.dataset.editRem))));
    el.querySelectorAll('[data-del-rem]').forEach((b) => b.addEventListener('click', async () => {
      const r = getState().reminders.find((x) => x.id === b.dataset.delRem);
      const ok = await confirmDialog({ title: 'Eliminar recordatorio', message: r.recurrence === 'none' ? `Se eliminará "${r.title}".` : `Se eliminará "${r.title}" y todas sus repeticiones (${RECURRENCE[r.recurrence].toLowerCase()}).`, confirmLabel: 'Eliminar', danger: true });
      if (!ok) return;
      deleteReminder(r.id);
      toast('Recordatorio eliminado.', { type: 'success' });
      ctx.refresh();
    }));
  },
};

function agendaView(ids, canEdit) {
  const t = todayStr();
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i)).map((d) => ({ d, occ: occurrencesOn(d, ids) })).filter((x) => x.occ.length);
  if (!days.length) return html`<div class="card mt-4">${emptyState({ ic: 'calendar', title: 'Sin recordatorios en los próximos 14 días' })}</div>`;
  return html`<div class="stack mt-4">${days.map(({ d, occ }) => html`<section class="card" aria-label="${fmtDateStr(d, { weekday: 'long', day: 'numeric', month: 'long' })}">
    <h2 class="h4">${d === t ? 'Hoy · ' : ''}${capitalize(fmtDateStr(d, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
    <ul class="list reminder-list">${occ.map((o) => reminderRow(o, { canEdit, editable: canEdit }))}</ul></section>`)}</div>`;
}

function openReminderForm(ctx, rem = null) {
  const ids = remindersVisible(ctx.user);
  openModal({
    title: rem ? 'Editar recordatorio' : 'Nuevo recordatorio',
    body: html`<form class="form" novalidate>
      ${select({ name: 'studentId', label: 'Estudiante', options: ids.map((id) => ({ value: id, label: studentById(id).name })), value: rem?.studentId || ui.student || ctx.student?.id, required: true, placeholder: '' })}
      ${field({ name: 'title', label: 'Título', value: rem?.title || '', required: true, attrs: 'maxlength="80" autofocus', placeholder: 'Ej. Merienda de media mañana' })}
      ${select({ name: 'category', label: 'Categoría', options: REMINDER_CATEGORIES, value: rem?.category || '', required: true })}
      <div class="form-grid">
        ${field({ name: 'date', label: rem?.recurrence && rem.recurrence !== 'none' ? 'Fecha de inicio' : 'Fecha', type: 'date', value: rem?.date || ui.selected, required: true })}
        ${field({ name: 'time', label: 'Hora', type: 'time', value: rem?.time || '09:30', required: true })}
      </div>
      ${select({ name: 'recurrence', label: 'Repetir', options: RECURRENCE, value: rem?.recurrence || 'none', placeholder: '', hint: 'Completar la actividad de un día no completa los días siguientes.' })}
      ${textarea({ name: 'notes', label: 'Observaciones (opcional)', value: rem?.notes || '', attrs: 'rows="2" maxlength="200"' })}
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">${icon('check')} Guardar</button></div>
    </form>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = formData(form);
        if (showErrors(form, validateReminder(d))) return;
        saveReminder(ctx.user, d, rem?.id);
        ui.selected = d.date; ui.month = d.date.slice(0, 7);
        close();
        toast(`${rem ? 'Recordatorio actualizado' : 'Recordatorio creado'} para ${firstName(studentById(d.studentId).name)}. Se ve en el calendario y en el panel familiar.`, { type: 'success' });
        ctx.refresh();
      });
    },
  });
}
