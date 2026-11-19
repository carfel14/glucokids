/* =========================================================
   Incidentes y protocolos (RF-10). Estados separados:
   Registrado → Visto por familiar → Seguimiento documentado.
   Leer la notificación no cambia el estado del incidente.
   ========================================================= */
import { html, raw, firstName, fmtDateTime, todayStr, nowTimeStr, formData, plural } from '../utils.js';
import { icon } from '../icons.js';
import {
  incidentsForUser, incidentById, studentById, userById, studentsForUser, canAccessStudent, planFor,
  INCIDENT_CATEGORIES, INCIDENT_STATUS,
} from '../data.js';
import { addIncident, validateIncident, markIncidentSeen, addIncidentFollowUp } from '../actions.js';
import { pageHeader, emptyState, contactsList, bindSimCalls, healthNote, studentAvatar, notice } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { field, select, textarea, showErrors, liveClear } from '../components/forms.js';

const statusChip = (s) => html`<span class="chip ${INCIDENT_STATUS[s].chip}">${INCIDENT_STATUS[s].label}</span>`;

export const incidentesList = {
  title: 'Incidentes', nav: 'incidentes',
  view: (ctx) => {
    const { user } = ctx;
    const status = ctx.query.estado || '';
    const sid = ctx.query.estudiante || '';
    const all = incidentsForUser(user);
    const list = all.filter((i) => (!status || i.status === status) && (!sid || i.studentId === sid));
    const isDoc = user.role === 'docente';
    return html`${pageHeader({
        title: 'Incidentes escolares', eyebrow: 'GlucoEscuela',
        sub: isDoc ? 'Registrá situaciones ocurridas en la escuela. La familia recibe una notificación con el detalle.' : 'Situaciones registradas por la escuela. Confirmá que las viste y documentá el seguimiento.',
        actions: isDoc && studentsForUser(user).length ? html`<a class="btn btn-danger" href="#/incidentes/nuevo">${icon('plus', { size: 18 })} Registrar incidente</a>` : '',
      })}
      <form class="card card-tight filter-bar" data-inc-filters>
        <div class="field"><label for="i-est">Estado</label><select class="select" id="i-est" name="estado"><option value="">Todos</option>${Object.entries(INCIDENT_STATUS).map(([k, v]) => html`<option value="${k}" ${status === k ? raw('selected') : ''}>${v.label}</option>`)}</select></div>
        <div class="field"><label for="i-stu">Estudiante</label><select class="select" id="i-stu" name="estudiante"><option value="">Todos</option>${studentsForUser(user).map((s) => html`<option value="${s.id}" ${sid === s.id ? raw('selected') : ''}>${s.name}</option>`)}</select></div>
        <p class="small muted mb-0" aria-live="polite">${plural(list.length, 'incidente', 'incidentes')}</p>
      </form>
      <section class="mt-4">
        ${list.length ? html`<div class="table-wrap table-responsive"><table class="table">
          <caption class="sr-only">Incidentes ordenados del más reciente al más antiguo</caption>
          <thead><tr><th scope="col">Fecha y hora</th><th scope="col">Estudiante</th><th scope="col">Categoría</th><th scope="col">Registrado por</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Detalle</span></th></tr></thead>
          <tbody>${list.map((i) => html`<tr>
            <td data-label="Fecha y hora">${fmtDateTime(i.at)}</td>
            <td data-label="Estudiante">${studentById(i.studentId).name}</td>
            <td data-label="Categoría">${INCIDENT_CATEGORIES[i.category]}</td>
            <td data-label="Registrado por">${userById(i.teacherId)?.name} (docente)</td>
            <td data-label="Estado">${statusChip(i.status)}</td>
            <td class="actions-cell"><a class="btn btn-sm" href="#/incidentes/${i.id}">Ver detalle ${icon('chev-right', { size: 16 })}</a></td>
          </tr>`)}</tbody></table></div>`
          : html`<div class="card">${emptyState({ ic: 'check-circle', title: all.length ? 'Ningún incidente coincide con los filtros' : 'No hay incidentes registrados', text: isDoc ? 'Cuando registres uno, la familia lo verá aquí.' : '' })}</div>`}
      </section>
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    const f = el.querySelector('[data-inc-filters]');
    f.addEventListener('change', () => {
      const p = new URLSearchParams();
      if (f.estado.value) p.set('estado', f.estado.value);
      if (f.estudiante.value) p.set('estudiante', f.estudiante.value);
      ctx.go(`/incidentes${p.toString() ? `?${p}` : ''}`);
    });
  },
};

function sidePanel(student) {
  if (!student) return emptyState({ ic: 'user', title: 'Elegí un estudiante', text: 'Verás aquí el acceso a su plan y sus contactos.' });
  const plan = planFor(student.id);
  return html`<div class="stack">
    <div class="row" style="flex-wrap:nowrap">${studentAvatar(student)}<div><strong>${student.name}</strong><br><span class="small muted">${student.grade}</span></div></div>
    <a class="btn btn-primary btn-block" href="#/plan/${student.id}" target="_self">${icon('clipboard', { size: 18 })} Abrir Plan GlucoCompartido</a>
    ${plan.clinical ? html`<div class="soft-box small"><strong>Actuación indicada (resumen)</strong><ul class="bullets mb-0">${plan.clinical.actions.slice(0, 2).map((a) => html`<li>${a}</li>`)}</ul></div>` : notice('La familia aún no registró la actuación indicada. Consultá la copia escrita del plan.', 'warn', 'alert')}
    <h3 class="h4 mb-0">Contactos</h3>
    ${contactsList(plan.coordination.contacts, plan.coordination.emergencyNumber)}
  </div>`;
}

export const incidenteNuevo = {
  title: 'Registrar incidente', nav: 'incidentes',
  view: (ctx) => {
    const students = studentsForUser(ctx.user);
    const sid = students.some((s) => s.id === ctx.query.sid) ? ctx.query.sid : (ctx.student?.id || '');
    return html`${pageHeader({ title: 'Registrar incidente', eyebrow: 'GlucoEscuela', sub: 'Datos ficticios. Al guardar, la familia del estudiante recibe una notificación local.' })}
      ${!students.length ? html`<div class="card">${emptyState({ ic: 'link', title: 'No tenés estudiantes vinculados' })}</div>` : html`
      <div class="incident-layout">
        <form class="card form" novalidate data-inc-form>
          ${select({ name: 'studentId', label: 'Estudiante', options: students.map((s) => ({ value: s.id, label: s.name })), value: sid, required: true })}
          ${select({ name: 'category', label: 'Categoría', options: INCIDENT_CATEGORIES, required: true })}
          <div class="form-grid">
            ${field({ name: 'date', label: 'Fecha', type: 'date', value: todayStr(), required: true, attrs: `max="${todayStr()}"` })}
            ${field({ name: 'time', label: 'Hora', type: 'time', value: nowTimeStr(), required: true })}
          </div>
          ${textarea({ name: 'notes', label: 'Observaciones: ¿qué ocurrió?', required: true, attrs: 'rows="3" maxlength="600"', placeholder: 'Describí la situación de forma objetiva.' })}
          ${textarea({ name: 'actions', label: 'Acciones realizadas', required: true, attrs: 'rows="3" maxlength="600"', placeholder: 'Ej. Se le acompañó, se consultó su plan y se avisó a la familia.' })}
          ${notice('Registrá lo ocurrido y las acciones según el plan individual. GlucoKids no sugiere tratamientos.', '', 'shield')}
          <div class="form-actions"><a class="btn btn-ghost" href="#/incidentes">Cancelar</a><button class="btn btn-danger" type="submit">${icon('check')} Guardar incidente</button></div>
        </form>
        <aside class="card tone-red" aria-label="Acceso inmediato al plan y contactos" data-side>${sidePanel(studentById(sid))}</aside>
      </div>`}`;
  },
  mount: (el, ctx) => {
    const form = el.querySelector('[data-inc-form]');
    if (!form) return;
    liveClear(form);
    const side = el.querySelector('[data-side]');
    const bindSide = () => {
      const s = studentById(form.studentId.value);
      side.innerHTML = String(sidePanel(s));
      if (s) { const p = planFor(s.id); bindSimCalls(side, p.coordination.contacts, p.coordination.emergencyNumber); }
    };
    bindSide();
    form.studentId.addEventListener('change', bindSide);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = formData(form);
      if (showErrors(form, validateIncident(d))) return;
      if (!canAccessStudent(ctx.user, d.studentId)) { toast('No tenés acceso a ese estudiante.', { type: 'error' }); return; }
      const inc = addIncident(ctx.user, d);
      toast(`La familia de ${firstName(studentById(d.studentId).name)} recibió una notificación.`, { type: 'success', title: 'Incidente registrado' });
      ctx.go(`/incidentes/${inc.id}`);
    });
  },
};

export function incidentAccess(ctx) {
  const inc = incidentById(ctx.params.id);
  if (!inc) return 'El incidente no existe en esta demostración.';
  if (!canAccessStudent(ctx.user, inc.studentId)) return 'No tenés acceso a este incidente porque no estás vinculado al estudiante.';
  return true;
}

export const incidenteDetalle = {
  title: 'Detalle del incidente', nav: 'incidentes',
  view: (ctx) => {
    const inc = incidentById(ctx.params.id);
    const s = studentById(inc.studentId);
    const teacher = userById(inc.teacherId);
    const isFam = ctx.user.role === 'familia';
    const steps = ['registrado', 'visto', 'seguimiento'];
    const cur = steps.indexOf(inc.status);
    return html`${pageHeader({ title: INCIDENT_CATEGORIES[inc.category], eyebrow: `Incidente · ${s.name}`, sub: `${fmtDateTime(inc.at)} · registrado por ${teacher?.name} (docente)`, actions: html`<a class="btn" href="#/incidentes">${icon('arrow-left', { size: 18 })} Volver</a>` })}
      <ol class="status-steps" aria-label="Estado del incidente">${steps.map((k, i) => html`<li class="${i < cur ? 'done' : i === cur ? 'current' : ''}" ${i === cur ? raw('aria-current="step"') : ''}><span class="dot">${i <= cur ? icon('check', { size: 14 }) : i + 1}</span>${INCIDENT_STATUS[k].label}</li>`)}</ol>
      <div class="grid-3 mt-4">
        <section class="card span-2" aria-labelledby="det">
          <h2 class="h3" id="det">Detalle</h2>
          <dl class="kv"><dt>Estudiante</dt><dd>${s.name} · ${s.grade}</dd><dt>Fecha y hora</dt><dd>${fmtDateTime(inc.at)}</dd><dt>Categoría</dt><dd>${INCIDENT_CATEGORIES[inc.category]}</dd><dt>Estado</dt><dd>${statusChip(inc.status)}</dd></dl>
          <h3 class="h4 mt-4">Observaciones</h3><p>${inc.notes}</p>
          <h3 class="h4">Acciones realizadas</h3><p>${inc.actions}</p>
          ${isFam && inc.status === 'registrado' ? html`<div class="notice notice-warn">${icon('info')}<div class="row-between grow"><span>Abrir la alerta no cambia el estado. Confirmá cuando hayas leído el detalle.</span><button type="button" class="btn btn-primary btn-sm" data-seen>${icon('check', { size: 16 })} Confirmar que lo vi</button></div></div>` : ''}
          <h3 class="h4 mt-6">Historial</h3>
          <ol class="timeline">
            <li><span class="tl-dot"></span><strong>Registrado</strong> por ${teacher?.name}<br><span class="xsmall muted">${fmtDateTime(inc.createdAt || inc.at)}</span></li>
            ${inc.seenAt ? html`<li><span class="tl-dot ok"></span><strong>Visto por familiar</strong><br><span class="xsmall muted">${fmtDateTime(inc.seenAt)}</span></li>` : ''}
            ${(inc.followUps || []).map((f) => html`<li><span class="tl-dot warn"></span><strong>Seguimiento</strong> · ${userById(f.by)?.name}<br><span>${f.text}</span><br><span class="xsmall muted">${fmtDateTime(f.at)}</span></li>`)}
          </ol>
          <form class="form mt-4" novalidate data-follow>
            ${textarea({ name: 'text', label: 'Documentar seguimiento', attrs: 'rows="2" maxlength="400"', placeholder: isFam ? 'Ej. Lo conversamos con su equipo de salud.' : 'Ej. Al día siguiente participó con normalidad.' })}
            <div class="row" style="justify-content:flex-end"><button class="btn btn-secondary btn-sm" type="submit">${icon('plus', { size: 16 })} Agregar seguimiento</button></div>
          </form>
        </section>
        <aside class="card tone-red" aria-label="Plan y contactos">${sidePanel(s)}</aside>
      </div>
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    const inc = incidentById(ctx.params.id);
    const p = planFor(inc.studentId);
    bindSimCalls(el.querySelector('aside'), p.coordination.contacts, p.coordination.emergencyNumber);
    el.querySelector('[data-seen]')?.addEventListener('click', () => { markIncidentSeen(ctx.user, inc.id); toast('Confirmaste que viste el incidente. El docente recibió un aviso.', { type: 'success' }); ctx.refresh(); });
    const f = el.querySelector('[data-follow]');
    liveClear(f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = formData(f).text;
      if (showErrors(f, { text: !t || t.length < 5 ? 'Escribí el seguimiento (mínimo 5 caracteres).' : '' })) return;
      addIncidentFollowUp(ctx.user, inc.id, t);
      toast('Seguimiento documentado.', { type: 'success' });
      ctx.refresh();
    });
  },
};
