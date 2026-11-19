/* =========================================================
   Filas de recordatorios con completado por fecha y "deshacer".
   ========================================================= */
import { html, raw, firstName, fmtDateStr } from '../utils.js';
import { icon } from '../icons.js';
import { REMINDER_CATEGORIES, RECURRENCE, studentById } from '../data.js';
import { setReminderDone } from '../actions.js';
import { toast } from './toast.js';

export function reminderRow(occ, { canEdit = true, showStudent = true, showDate = false, editable = false } = {}) {
  const r = occ.reminder;
  const cat = REMINDER_CATEGORIES[r.category] || REMINDER_CATEGORIES.rutina;
  const st = studentById(r.studentId);
  const id = `rem-${r.id}-${occ.date}`;
  return html`<li class="reminder-row ${occ.done ? 'is-done' : ''}">
    <span class="rem-cat" style="--cat:${cat.color}" aria-hidden="true">${icon(cat.icon, { size: 18 })}</span>
    <div class="grow">
      <label for="${id}" class="rem-title">${r.title}</label>
      <span class="small muted">${showDate ? `${fmtDateStr(occ.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ` : ''}${r.time} h · ${cat.label}${showStudent && st ? ` · ${firstName(st.name)}` : ''}${r.recurrence !== 'none' ? ` · ${RECURRENCE[r.recurrence]}` : ''}</span>
      ${r.notes ? html`<span class="xsmall muted" style="display:block">${r.notes}</span>` : ''}
    </div>
    ${editable ? html`<button type="button" class="btn btn-ghost btn-icon btn-sm" data-edit-rem="${r.id}" aria-label="Editar recordatorio ${r.title}">${icon('pencil', { size: 16 })}</button><button type="button" class="btn btn-ghost btn-icon btn-sm" data-del-rem="${r.id}" aria-label="Eliminar recordatorio ${r.title}">${icon('trash', { size: 16 })}</button>` : ''}
    <input type="checkbox" class="rem-check" id="${id}" data-rem="${r.id}" data-date="${occ.date}" ${occ.done ? raw('checked') : ''} ${canEdit ? '' : raw('disabled')} aria-label="${occ.done ? 'Completado' : 'Pendiente'}: ${r.title}">
  </li>`;
}

/** Enlaza las casillas: marcar completado para esa fecha y ofrecer deshacer. */
export function bindReminderToggles(root, ctx) {
  root.querySelectorAll('[data-rem]').forEach((cb) => cb.addEventListener('change', () => {
    const { rem, date } = cb.dataset;
    const done = cb.checked;
    setReminderDone(rem, date, done);
    ctx.refresh();
    toast(done ? 'Recordatorio marcado como completado para esta fecha.' : 'Recordatorio marcado como pendiente.', {
      type: done ? 'success' : 'info',
      action: { label: 'Deshacer', onClick: () => { setReminderDone(rem, date, !done); ctx.refresh(); } },
    });
  }));
}
