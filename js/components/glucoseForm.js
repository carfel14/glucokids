/* =========================================================
   Formulario de registro / edición de glucosa (modal).
   ========================================================= */
import { html, localParts, formData, firstName, nowTimeStr, todayStr } from '../utils.js';
import { icon } from '../icons.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { field, select, textarea, showErrors, liveClear } from './forms.js';
import { CONTEXTS, studentsForUser, studentById, planFor } from '../data.js';
import { validateGlucose, addGlucose, updateGlucose } from '../actions.js';
import { notice } from './ui.js';

/**
 * @param {{user:object, studentId?:string, record?:object, onSaved?:Function}} o
 */
export function openGlucoseForm({ user, studentId, record = null, onSaved }) {
  const students = studentsForUser(user);
  const lp = record ? localParts(record.at) : { date: todayStr(), time: nowTimeStr() };
  const sid = record?.studentId || studentId || students[0]?.id;
  const plan = planFor(sid);
  openModal({
    title: record ? 'Editar registro de glucosa' : 'Registrar glucosa',
    body: html`<form class="form" novalidate>
      ${select({ name: 'studentId', label: 'Estudiante', options: students.map((s) => ({ value: s.id, label: s.name })), value: sid, required: true, placeholder: '' })}
      <div class="form-grid">
        ${field({ name: 'value', label: 'Valor (mg/dL)', type: 'number', value: record?.value ?? '', required: true, attrs: 'inputmode="numeric" min="20" max="600" step="1" autofocus', hint: plan?.target ? `Meta del plan: ${plan.target.min}–${plan.target.max} mg/dL` : 'Este estudiante no tiene meta configurada' })}
        ${select({ name: 'context', label: 'Contexto', options: CONTEXTS, value: record?.context || '', required: true })}
        ${field({ name: 'date', label: 'Fecha', type: 'date', value: lp.date, required: true, attrs: `max="${todayStr()}"` })}
        ${field({ name: 'time', label: 'Hora', type: 'time', value: lp.time, required: true })}
      </div>
      ${textarea({ name: 'notes', label: 'Observaciones (opcional)', value: record?.notes || '', attrs: 'maxlength="280" rows="2"', placeholder: 'Ej. antes de la merienda' })}
      ${notice('GlucoKids no interpreta los valores ni sugiere tratamientos: si el registro queda fuera de la meta, consultá el plan individual.', '', 'shield')}
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn-primary">${icon('check')} ${record ? 'Guardar cambios' : 'Guardar registro'}</button>
      </div>
    </form>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.studentId.addEventListener('change', () => {
        const p = planFor(form.studentId.value);
        const hint = form.querySelector('[data-field="value"] .hint');
        if (hint) hint.textContent = p?.target ? `Meta del plan: ${p.target.min}–${p.target.max} mg/dL` : 'Este estudiante no tiene meta configurada';
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = formData(form);
        if (showErrors(form, validateGlucose(d))) return;
        const res = record ? updateGlucose(user, record.id, d) : addGlucose(user, d);
        close();
        const name = firstName(studentById(d.studentId).name);
        const out = res.status.key === 'bajo' || res.status.key === 'alto';
        toast(out ? `${res.status.label}. Se generó una notificación para consultar el Plan GlucoCompartido.` : `${res.rec.value} mg/dL · ${res.status.label}.`, {
          type: out ? 'warn' : 'success',
          title: record ? `Registro de ${name} actualizado` : `Registro de ${name} guardado`,
        });
        onSaved?.(res);
      });
    },
  });
}
