/* =========================================================
   GlucoEscuela (RF-09): vista docente (estudiantes vinculados, ficha, protocolos,
   formación) y vista familiar (información escolar de su hijo, sin listado docente).
   ========================================================= */
import { html, raw, firstName, fmtDateTime, relTime, plural, normalize, formData } from '../utils.js';
import { icon } from '../icons.js';
import { kidLow, kidHigh } from '../illustrations.js';
import {
  studentsForUser, planFor, planReadStatus, planStatusLabel, linksForTeacher, studentById, teachersForStudent, observationsFor,
  incidentsForUser, INCIDENT_CATEGORIES, INCIDENT_STATUS, userById, canSeeGlucose, visibleGlucose, convId, progressFor, activeLink, CONTEXTS,
} from '../data.js';
import { requestLink, addObservation, sendMessage, markPlanRead, isResourceRead, enterKidMode } from '../actions.js';
import {
  pageHeader, emptyState, contactsList, bindSimCalls, healthNote, studentAvatar, userAvatar, notice, statusChip, registeredBy, progressBar, simulatedCall,
} from '../components/ui.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, textarea, showErrors, liveClear } from '../components/forms.js';
import { openGlucoseForm } from '../components/glucoseForm.js';
import { trainingResources } from '../content/resources.js';

/* ---------- Bloques informativos compartidos ---------- */
export function signsBlock() {
  return html`<section class="card" aria-labelledby="signos">
    <div class="card-header"><span class="card-icon red">${icon('droplet')}</span><h2 class="h3" id="signos">Posibles señales de glucosa baja y alta</h2></div>
    <div class="grid-2" style="gap:16px">
      <div class="sign-box tone-red">
        <div class="row" style="flex-wrap:nowrap">${kidLow({ size: 60 })}<div><h3 class="h4 mb-0">${icon('arrow-down', { size: 18, cls: 'inline-icon' })} Glucosa baja</h3><span class="xsmall muted">Hipoglucemia</span></div></div>
        <ul class="checklist small mt-2">${['Temblor o sudor', 'Nerviosismo o irritabilidad', 'Confusión', 'Mareo', 'Hambre repentina'].map((s) => html`<li>${icon('check', { size: 16 })}<span>${s}</span></li>`)}</ul>
        <p class="xsmall mb-0"><strong>Puede aparecer de forma rápida.</strong></p>
      </div>
      <div class="sign-box tone-aprende">
        <div class="row" style="flex-wrap:nowrap">${kidHigh({ size: 60 })}<div><h3 class="h4 mb-0">${icon('arrow-up', { size: 18, cls: 'inline-icon' })} Glucosa alta</h3><span class="xsmall muted">Hiperglucemia</span></div></div>
        <ul class="checklist small mt-2">${['Mucha sed', 'Ganas frecuentes de ir al baño', 'Cansancio', 'Visión borrosa o dolor de cabeza'].map((s) => html`<li>${icon('check', { size: 16 })}<span>${s}</span></li>`)}</ul>
        <p class="xsmall mb-0"><strong>Suele aparecer de forma más gradual.</strong></p>
      </div>
    </div>
    <p class="xsmall muted mt-2 mb-0">Las señales varían en cada estudiante. Fuente general: CDC. El plan individual describe las propias de cada estudiante.</p>
  </section>`;
}
export function protocolBlock() {
  return html`<section class="card" aria-labelledby="protocolo">
    <div class="card-header"><span class="card-icon">${icon('clipboard')}</span><h2 class="h3" id="protocolo">Protocolo de actuación en el aula</h2></div>
    <p class="small muted">Pasos generales. La actuación concreta (alimentos, tiempos, medicamentos) es la que indica el plan individual de cada estudiante.</p>
    <ol class="protocol-steps">
      <li><span class="step-n">1</span><div><strong>No lo dejes solo</strong><br><span class="small">Acompañalo o pedí que acuda la persona designada.</span></div></li>
      <li><span class="step-n">2</span><div><strong>Seguí su plan individual</strong><br><span class="small">Consultá la actuación indicada en el Plan GlucoCompartido.</span></div></li>
      <li><span class="step-n">3</span><div><strong>Avisá a la familia</strong><br><span class="small">Usá los contactos del plan y registrá el incidente.</span></div></li>
    </ol>
    <div class="notice notice-danger mt-2">${icon('siren')}<p class="mb-0"><strong>Requiere ayuda urgente:</strong> si no responde, se desmaya, tiene convulsiones o no puede tragar, pedí ayuda de emergencia de inmediato y avisá a la familia.</p></div>
  </section>`;
}

function openLinkModal(ctx) {
  openModal({
    title: 'Vincular estudiante con código',
    body: html`<form class="form" novalidate>
      <p class="mb-0">Ingresá el código de invitación que te compartió la familia. Se enviará una solicitud que la familia debe autorizar.</p>
      ${field({ name: 'code', label: 'Código de invitación', placeholder: 'GK-XXXXXX', required: true, attrs: 'autocapitalize="characters" autofocus' })}
      ${notice(html`<strong>Para probar en la demo:</strong> en la cuenta familia abrí el plan de Lucía › Compartir › Generar código, y luego volvé a esta cuenta.`, '', 'info')}
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">${icon('send', { size: 18 })} Enviar solicitud</button></div>
    </form>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = form.code.value.trim();
        if (!code) { showErrors(form, { code: 'Ingresá el código.' }); return; }
        const res = requestLink(ctx.user, code);
        if (res.error) { showErrors(form, { code: res.error }); return; }
        close();
        toast(`Solicitud enviada para ${firstName(res.student.name)}. Cuando la familia la autorice, aparecerá en tu listado.`, { type: 'success', title: 'Solicitud pendiente' });
        if (ctx.query.vincular) ctx.go(ctx.path); else ctx.refresh();
      });
    },
  });
}

function pendingBlock(user) {
  const pending = linksForTeacher(user.id).filter((l) => l.status === 'pendiente');
  if (!pending.length) return '';
  return html`<section class="card tone-aprende mt-6" aria-labelledby="pend">
    <h2 class="h3" id="pend">${icon('clock', { size: 18, cls: 'inline-icon' })} Solicitudes esperando autorización</h2>
    <ul class="list">${pending.map((l) => html`<li>${studentAvatar(studentById(l.studentId), 'avatar-sm')}<span class="grow"><strong>${studentById(l.studentId).name}</strong><br><span class="xsmall muted">Enviada ${relTime(l.requestedAt)} · la familia debe autorizarla</span></span><span class="chip chip-warn">Pendiente</span></li>`)}</ul>
  </section>`;
}

/* ---------- Inicio GlucoEscuela ---------- */
export const escuelaHome = {
  title: 'GlucoEscuela', nav: 'escuela',
  view: (ctx) => (ctx.user.role === 'docente' ? teacherHome(ctx) : familySchool(ctx)),
  mount: (el, ctx) => {
    el.querySelector('[data-link]')?.addEventListener('click', () => openLinkModal(ctx));
    if (ctx.query.vincular && ctx.user.role === 'docente' && !ctx.isRefresh) openLinkModal(ctx);
    const plan = ctx.student && planFor(ctx.student.id);
    if (plan) bindSimCalls(el, plan.coordination.contacts, plan.coordination.emergencyNumber);
    el.querySelector('[data-emergency]')?.addEventListener('click', () => simulatedCall({ name: 'Emergencias', relation: 'Servicio local', phone: plan?.coordination.emergencyNumber }));
  },
};

function teacherHome(ctx) {
  const { user, student } = ctx;
  const students = studentsForUser(user);
  const training = trainingResources();
  const read = training.filter((r) => isResourceRead(user.id, r.id)).length;
  const plan = student && planFor(student.id);
  return html`${pageHeader({
      title: 'GlucoEscuela', eyebrow: user.school || 'Docente',
      sub: 'Apoyo escolar seguro para estudiantes con diabetes.',
      actions: html`<button type="button" class="btn btn-secondary" data-link>${icon('link', { size: 18 })} Vincular estudiante</button>${students.length ? html`<a class="btn btn-primary" href="#/incidentes/nuevo">${icon('siren', { size: 18 })} Registrar incidente</a>` : ''}`,
    })}
    <div class="grid-2">${signsBlock()}${protocolBlock()}</div>
    <div class="grid-3 mt-6">
      <section class="card span-2" aria-labelledby="mis-est">
        <div class="card-header"><span class="card-icon">${icon('users')}</span><h2 class="h3" id="mis-est">Estudiantes con diabetes</h2><a class="actions small" href="#/escuela/estudiantes">Ver todos</a></div>
        ${students.length ? html`<ul class="list">${students.map((s) => { const p = planFor(s.id); const rs = planReadStatus(p, user.id); return html`<li>
            ${studentAvatar(s)}
            <div class="grow"><strong>${s.name}</strong><br><span class="small muted">Diabetes ${s.diabetesType.toLowerCase()} · ${s.grade}</span><br><span class="chip ${planStatusLabel(p).chip}" style="min-height:24px">${icon('check', { size: 13 })} ${planStatusLabel(p).label}</span> <span class="chip ${rs.chip}" style="min-height:24px">${rs.label}</span></div>
            <a class="btn btn-sm" href="#/escuela/estudiante/${s.id}">Ficha ${icon('chev-right', { size: 16 })}</a>
          </li>`; })}</ul>`
          : emptyState({ ic: 'link', title: 'Aún no tenés estudiantes vinculados', text: 'Pedí a la familia un código de invitación.', action: html`<button type="button" class="btn btn-primary" data-link>Vincular con código</button>` })}
      </section>
      <div class="stack">
        <section class="card tone-red" aria-labelledby="emerg">
          <div class="card-header"><span class="card-icon red">${icon('siren')}</span><h2 class="h3" id="emerg">Emergencia</h2></div>
          <button type="button" class="btn btn-danger btn-block btn-lg" data-emergency>${icon('phone')} Llamar ahora (simulación)</button>
          ${student ? html`<a class="btn btn-block mt-2" href="#/plan/${student.id}">${icon('file', { size: 18 })} Ver plan completo de ${firstName(student.name)}</a>` : ''}
          <p class="xsmall muted mt-2 mb-0">No se realizan llamadas reales.</p>
        </section>
        <section class="card tone-escuela" aria-labelledby="form-d">
          <div class="card-header"><span class="card-icon">${icon('cap')}</span><h2 class="h3" id="form-d">Formación docente</h2></div>
          <p class="small mb-0">${read} de ${training.length} recursos leídos</p>
          ${progressBar(Math.round((read / training.length) * 100), 'Progreso de formación docente')}
          <a class="btn btn-sm btn-secondary mt-4" href="#/escuela/formacion">Continuar formación</a>
        </section>
      </div>
    </div>
    ${student ? html`<section class="card mt-6" aria-labelledby="cont-e"><div class="card-header"><span class="card-icon green">${icon('phone')}</span><h2 class="h3" id="cont-e">Contactos de emergencia · ${student.name}</h2><span class="actions xsmall muted">Cambiá de estudiante con el selector superior</span></div>${contactsList(plan.coordination.contacts, plan.coordination.emergencyNumber)}</section>` : ''}
    ${pendingBlock(user)}
    <div class="mt-6">${healthNote()}</div>`;
}

function familySchool(ctx) {
  const { user, student } = ctx;
  if (!student) return html`${pageHeader({ title: 'GlucoEscuela' })}<section class="card">${emptyState({ ic: 'user-plus', title: 'Agregá un estudiante', action: html`<a class="btn btn-primary" href="#/configuracion?tab=estudiantes">Agregar estudiante</a>` })}</section>`;
  const fn = firstName(student.name);
  const teachers = teachersForStudent(student.id);
  const plan = planFor(student.id);
  const obs = observationsFor(student.id).slice(0, 5);
  const incs = incidentsForUser(user, { studentId: student.id }).slice(0, 4);
  return html`${pageHeader({ title: `Información escolar de ${fn}`, eyebrow: 'GlucoEscuela', sub: `${student.school} · ${student.grade}. Como familia ves la información escolar de tu hijo o hija; el listado completo del docente no está disponible para tu perfil.` })}
    <div class="grid-3">
      <section class="card" aria-labelledby="doc-v">
        <div class="card-header"><span class="card-icon green">${icon('school')}</span><h2 class="h3" id="doc-v">Docentes vinculados</h2></div>
        ${teachers.length ? html`<ul class="list">${teachers.map((t) => { const rs = planReadStatus(plan, t.id); return html`<li>${userAvatar(t)}<span class="grow"><strong>${t.name}</strong><br><span class="xsmall muted">${t.subject || ''} · ${t.grade || ''}</span><br><span class="chip ${rs.chip}" style="min-height:24px">${rs.label}</span></span><a class="btn btn-ghost btn-icon btn-sm" href="#/mensajes/${convId(student.id, t.id)}" aria-label="Escribir a ${t.name}">${icon('message', { size: 18 })}</a></li>`; })}</ul>`
          : emptyState({ ic: 'share', title: 'Aún no compartiste el plan', text: 'Generá un código para que el docente solicite acceso.', action: html`<a class="btn btn-primary btn-sm" href="#/plan/${student.id}?compartir=1">Compartir plan</a>` })}
      </section>
      <section class="card" aria-labelledby="obs-f">
        <div class="card-header"><span class="card-icon">${icon('notebook')}</span><h2 class="h3" id="obs-f">Observaciones escolares</h2></div>
        ${obs.length ? html`<ul class="list">${obs.map((o) => html`<li style="align-items:flex-start"><span class="grow"><span class="small">${o.text}</span><br><span class="xsmall muted">${userById(o.authorId)?.name} · ${fmtDateTime(o.at)}</span></span></li>`)}</ul>` : emptyState({ ic: 'notebook', title: 'Sin observaciones', text: 'Las notas del docente aparecerán aquí.' })}
      </section>
      <section class="card" aria-labelledby="inc-f">
        <div class="card-header"><span class="card-icon red">${icon('siren')}</span><h2 class="h3" id="inc-f">Incidentes recientes</h2><a class="actions small" href="#/incidentes">Ver todos</a></div>
        ${incs.length ? html`<ul class="list">${incs.map((i) => html`<li><a class="list-item-link" href="#/incidentes/${i.id}"><span class="grow"><strong class="small">${INCIDENT_CATEGORIES[i.category]}</strong><br><span class="xsmall muted">${fmtDateTime(i.at)}</span></span><span class="chip ${INCIDENT_STATUS[i.status].chip}">${INCIDENT_STATUS[i.status].label}</span></a></li>`)}</ul>` : emptyState({ ic: 'check-circle', title: 'Sin incidentes registrados' })}
      </section>
    </div>
    <div class="grid-2 mt-6">${signsBlock()}${protocolBlock()}</div>
    <div class="mt-6">${healthNote()}</div>`;
}

/* ---------- Listado docente ---------- */
const listFilters = { q: '', grade: '', status: '' };
export const estudiantesPage = {
  title: 'Estudiantes', nav: 'estudiantes',
  view: (ctx) => {
    const { user } = ctx;
    const students = studentsForUser(user);
    const grades = [...new Set(students.map((s) => s.grade))].sort();
    const statusOf = (s) => { const p = planFor(s.id); const rs = planReadStatus(p, user.id); return rs.key === 'leido' ? 'leido' : 'pendiente'; };
    return html`${pageHeader({ title: 'Estudiantes vinculados', eyebrow: 'GlucoEscuela', sub: 'Solo ves estudiantes cuyas familias autorizaron tu acceso.', actions: html`<button type="button" class="btn btn-secondary" data-link>${icon('link', { size: 18 })} Vincular estudiante</button>` })}
      <form class="card card-tight filter-bar" role="search" data-list-filters onsubmit="return false">
        <div class="field grow"><label for="st-q">Buscar por nombre</label><div class="input-group"><span class="lead-icon">${icon('search', { size: 18 })}</span><input class="input" id="st-q" name="q" type="search" value="${listFilters.q}" placeholder="Ej. Mateo"></div></div>
        <div class="field"><label for="st-g">Grado</label><select class="select" id="st-g" name="grade"><option value="">Todos</option>${grades.map((g) => html`<option ${listFilters.grade === g ? raw('selected') : ''}>${g}</option>`)}</select></div>
        <div class="field"><label for="st-s">Estado del plan</label><select class="select" id="st-s" name="status"><option value="">Todos</option><option value="leido" ${listFilters.status === 'leido' ? raw('selected') : ''}>Versión vigente leída</option><option value="pendiente" ${listFilters.status === 'pendiente' ? raw('selected') : ''}>Lectura pendiente</option></select></div>
      </form>
      <p class="small muted mt-4" aria-live="polite" data-count></p>
      ${students.length ? html`<div class="grid-auto" data-cards>${students.map((s) => { const p = planFor(s.id); const rs = planReadStatus(p, user.id); return html`
        <article class="card student-card" data-name="${normalize(s.name)}" data-grade="${s.grade}" data-status="${statusOf(s)}">
          <div class="row" style="flex-wrap:nowrap">${studentAvatar(s, 'avatar-lg')}<div><h2 class="h3 mb-0">${s.name}</h2><span class="small muted">${s.grade} · Diabetes ${s.diabetesType.toLowerCase()}</span></div></div>
          <div class="row mt-4"><span class="chip ${planStatusLabel(p).chip}">${planStatusLabel(p).label}</span><span class="chip ${rs.chip}">${rs.label}</span></div>
          <a class="btn btn-primary btn-block mt-4" href="#/escuela/estudiante/${s.id}">Abrir ficha ${icon('arrow-right', { size: 18 })}</a>
        </article>`; })}</div>
        <div data-empty hidden>${emptyState({ ic: 'search', title: 'Ningún estudiante coincide con los filtros' })}</div>`
        : html`<section class="card">${emptyState({ ic: 'link', title: 'Aún no tenés estudiantes vinculados', text: 'Pedí un código de invitación a la familia.' })}</section>`}
      ${pendingBlock(user)}`;
  },
  mount: (el, ctx) => {
    el.querySelectorAll('[data-link]').forEach((b) => b.addEventListener('click', () => openLinkModal(ctx)));
    const form = el.querySelector('[data-list-filters]');
    const apply = () => {
      Object.assign(listFilters, { q: form.q.value, grade: form.grade.value, status: form.status.value });
      const q = normalize(listFilters.q.trim());
      let n = 0;
      el.querySelectorAll('.student-card').forEach((c) => {
        const ok = (!q || c.dataset.name.includes(q)) && (!listFilters.grade || c.dataset.grade === listFilters.grade) && (!listFilters.status || c.dataset.status === listFilters.status);
        c.hidden = !ok; if (ok) n++;
      });
      const empty = el.querySelector('[data-empty]');
      if (empty) empty.hidden = n > 0;
      el.querySelector('[data-count]').textContent = `${plural(n, 'estudiante', 'estudiantes')} ${n === 1 ? 'coincide' : 'coinciden'} con los filtros.`;
    };
    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    apply();
  },
};

/* ---------- Ficha del estudiante (docente) ---------- */
export function fichaAccess(ctx) {
  const s = studentById(ctx.params.sid);
  if (!s) return 'El estudiante no existe en esta demostración.';
  if (!activeLink(s.id, ctx.user.id)) return 'No tenés una vinculación activa con este estudiante. Si la familia revocó el acceso, ya no podés consultar su información.';
  return true;
}
export const fichaPage = {
  title: (ctx) => `Ficha de ${firstName(studentById(ctx.params.sid)?.name || '')}`, nav: 'estudiantes',
  view: (ctx) => {
    const { user } = ctx;
    const s = studentById(ctx.params.sid);
    const plan = planFor(s.id);
    const rs = planReadStatus(plan, user.id);
    const fam = userById(s.familyId);
    const full = canSeeGlucose(user, s.id);
    const recs = visibleGlucose(user, s.id).slice(0, 5);
    const obs = observationsFor(s.id);
    const incs = incidentsForUser(user, { studentId: s.id });
    const prog = progressFor(s.id);
    return html`
      <header class="page-header ficha-head">
        ${studentAvatar(s, 'avatar-xl avatar-ring')}
        <div class="grow"><span class="eyebrow">Ficha del estudiante</span><h1 data-page-title tabindex="-1">${s.name}</h1><p>${s.grade} · ${s.school} · Diabetes ${s.diabetesType.toLowerCase()} · Familia: ${fam?.name}</p></div>
        <div class="actions"><a class="btn" href="#/plan/${s.id}">${icon('clipboard', { size: 18 })} Ver plan</a><a class="btn btn-danger" href="#/incidentes/nuevo?sid=${s.id}">${icon('siren', { size: 18 })} Registrar incidente</a></div>
      </header>
      <div class="grid-3">
        <section class="card" aria-labelledby="f-plan">
          <div class="card-header"><span class="card-icon">${icon('clipboard')}</span><h2 class="h3" id="f-plan">Plan GlucoCompartido</h2></div>
          <div class="stack-sm">
            <div class="row"><span class="chip">Versión ${plan.version}</span><span class="chip ${rs.chip}">${rs.label}</span></div>
            <span class="small">Meta registrada: <strong>${plan.target ? `${plan.target.min}–${plan.target.max} mg/dL` : 'Sin meta configurada'}</strong></span>
            ${plan.coordination.routine.length ? html`<ul class="bullets small mb-0">${plan.coordination.routine.slice(0, 4).map((r) => html`<li>${r}</li>`)}</ul>` : ''}
            ${rs.key !== 'leido' ? html`<button type="button" class="btn btn-primary btn-sm" data-read>${icon('check-circle', { size: 16 })} He leído esta versión</button>` : ''}
            <a class="btn btn-ghost btn-sm" href="#/plan/${s.id}">Plan completo ${icon('chev-right', { size: 16 })}</a>
          </div>
        </section>
        <section class="card tone-red" aria-labelledby="f-cont">
          <div class="card-header"><span class="card-icon red">${icon('phone')}</span><h2 class="h3" id="f-cont">Contactos</h2></div>
          ${contactsList(plan.coordination.contacts, plan.coordination.emergencyNumber)}
        </section>
        <section class="card" aria-labelledby="f-msg">
          <div class="card-header"><span class="card-icon green">${icon('message')}</span><h2 class="h3" id="f-msg">Mensaje a la familia</h2></div>
          <form class="form" novalidate data-msg-form>
            ${textarea({ name: 'text', label: `Mensaje para ${fam?.name}`, attrs: 'rows="3" maxlength="500"', placeholder: 'Ej. Hoy participó muy bien en educación física.' })}
            <div class="row-between"><a class="small" href="#/mensajes/${convId(s.id, user.id)}">Ver conversación</a><button class="btn btn-primary btn-sm" type="submit">${icon('send', { size: 16 })} Enviar</button></div>
          </form>
        </section>
        <section class="card span-2" aria-labelledby="f-glu">
          <div class="card-header"><span class="card-icon">${icon('droplet')}</span><h2 class="h3" id="f-glu">Registros de glucosa</h2><span class="actions"><button type="button" class="btn btn-primary btn-sm" data-add-glucose>${icon('plus', { size: 16 })} Registrar medición</button></span></div>
          ${!full ? notice('La familia no comparte el historial con tu perfil. Ves solo las mediciones que registraste; la familia recibe todas.', 'warn', 'lock') : ''}
          ${recs.length ? html`<div class="table-wrap table-responsive mt-2"><table class="table"><caption class="sr-only">Últimos registros visibles</caption><thead><tr><th scope="col">Fecha y hora</th><th scope="col" class="num">mg/dL</th><th scope="col">Estado</th><th scope="col">Contexto</th><th scope="col">Registrado por</th></tr></thead>
            <tbody>${recs.map((g) => html`<tr><td data-label="Fecha y hora">${fmtDateTime(g.at)}</td><td data-label="mg/dL" class="num"><strong>${g.value}</strong></td><td data-label="Estado">${statusChip(g.value, plan)}</td><td data-label="Contexto">${CONTEXTS[g.context]}</td><td data-label="Registrado por">${registeredBy(g)}</td></tr>`)}</tbody></table></div>`
            : emptyState({ ic: 'droplet', title: 'Sin registros visibles' })}
        </section>
        <section class="card tone-aprende" aria-labelledby="f-apr">
          <div class="card-header"><span class="card-icon yellow">${icon('gamepad')}</span><h2 class="h3" id="f-apr">Aprendizaje</h2></div>
          <p class="small mb-0">${prog.completed} de ${prog.total} temas completados</p>
          ${progressBar(prog.percent, `Progreso de ${firstName(s.name)}`)}
          <button type="button" class="btn btn-secondary btn-sm mt-4" data-kid>${icon('smile', { size: 16 })} Abrir modo infantil</button>
        </section>
        <section class="card span-2" aria-labelledby="f-obs">
          <div class="card-header"><span class="card-icon">${icon('notebook')}</span><h2 class="h3" id="f-obs">Observaciones escolares</h2></div>
          <form class="form" novalidate data-obs-form>
            ${textarea({ name: 'obs', label: 'Nueva observación', attrs: 'rows="2" maxlength="400"', placeholder: 'Ej. Tomó su merienda a la hora indicada.' })}
            <div class="row" style="justify-content:flex-end"><button class="btn btn-secondary btn-sm" type="submit">${icon('plus', { size: 16 })} Guardar observación</button></div>
          </form>
          ${obs.length ? html`<ul class="list mt-4">${obs.map((o) => html`<li style="align-items:flex-start">${userAvatar(userById(o.authorId))}<span class="grow"><span>${o.text}</span><br><span class="xsmall muted">Registrado por ${userById(o.authorId)?.name} (docente) · ${fmtDateTime(o.at)}</span></span></li>`)}</ul>` : html`<p class="small muted mt-2 mb-0">Sin observaciones todavía.</p>`}
        </section>
        <section class="card" aria-labelledby="f-inc">
          <div class="card-header"><span class="card-icon red">${icon('siren')}</span><h2 class="h3" id="f-inc">Incidentes</h2></div>
          ${incs.length ? html`<ul class="list">${incs.map((i) => html`<li><a class="list-item-link" href="#/incidentes/${i.id}"><span class="grow"><strong class="small">${INCIDENT_CATEGORIES[i.category]}</strong><br><span class="xsmall muted">${fmtDateTime(i.at)}</span></span><span class="chip ${INCIDENT_STATUS[i.status].chip}">${INCIDENT_STATUS[i.status].label}</span></a></li>`)}</ul>` : emptyState({ ic: 'check-circle', title: 'Sin incidentes' })}
        </section>
      </div>
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    const { user } = ctx;
    const s = studentById(ctx.params.sid);
    const plan = planFor(s.id);
    bindSimCalls(el, plan.coordination.contacts, plan.coordination.emergencyNumber);
    el.querySelector('[data-read]')?.addEventListener('click', () => { markPlanRead(user, s.id); toast('Lectura confirmada. La familia recibió un aviso.', { type: 'success' }); ctx.refresh(); });
    el.querySelector('[data-add-glucose]').addEventListener('click', () => openGlucoseForm({ user, studentId: s.id, onSaved: () => ctx.refresh() }));
    el.querySelector('[data-kid]').addEventListener('click', () => { enterKidMode(s.id); ctx.go('/ninos'); });
    const obsForm = el.querySelector('[data-obs-form]');
    liveClear(obsForm);
    obsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = formData(obsForm).obs;
      if (showErrors(obsForm, { obs: !t || t.length < 5 ? 'Escribí la observación (mínimo 5 caracteres).' : '' })) return;
      addObservation(user, s.id, t);
      toast('Observación guardada y visible para la familia.', { type: 'success' });
      ctx.refresh();
    });
    const msgForm = el.querySelector('[data-msg-form]');
    liveClear(msgForm);
    msgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = formData(msgForm).text;
      if (showErrors(msgForm, { text: !t ? 'Escribí un mensaje.' : '' })) return;
      sendMessage(user, convId(s.id, user.id), t);
      toast(`Mensaje enviado a ${userById(s.familyId)?.name}.`, { type: 'success', action: { label: 'Ver conversación', onClick: () => ctx.go(`/mensajes/${convId(s.id, user.id)}`) } });
      ctx.refresh();
    });
  },
};

/* ---------- Formación docente ---------- */
export const formacionPage = {
  title: 'Formación docente', nav: 'formacion',
  view: (ctx) => {
    const list = trainingResources();
    const read = list.filter((r) => isResourceRead(ctx.user.id, r.id)).length;
    return html`${pageHeader({ title: 'Formación docente', eyebrow: 'GlucoEscuela', sub: 'Recursos breves para acompañar a estudiantes con diabetes. Marcá cada uno como leído al terminar.' })}
      <section class="card card-tight"><div class="row" style="flex-wrap:nowrap"><strong class="nowrap">${read} de ${list.length} leídos</strong><div class="grow">${progressBar(Math.round((read / list.length) * 100), 'Progreso de formación')}</div></div></section>
      <div class="grid-auto mt-6">${list.map((r) => { const done = isResourceRead(ctx.user.id, r.id); return html`<article class="card resource-card">
        <div class="row-between"><span class="chip chip-info">${icon('book', { size: 14 })} ${r.minutes} min</span><span class="chip ${done ? 'chip-ok' : ''}">${done ? html`${icon('check', { size: 14 })} Leído` : 'Pendiente'}</span></div>
        <h2 class="h3 mt-4">${r.title}</h2><p class="small muted">${r.summary}</p>
        <a class="btn ${done ? '' : 'btn-primary'} btn-block" href="#/recursos/${r.id}">${done ? 'Volver a leer' : 'Abrir recurso'}</a>
      </article>`; })}</div>`;
  },
};
