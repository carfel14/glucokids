/* =========================================================
   Panel general (RF-05), notificaciones y búsqueda.
   Todos los indicadores se calculan a partir del estado guardado.
   ========================================================= */
import { html, raw, firstName, relTime, todayStr, plural, fmtDateTime } from '../utils.js';
import { icon } from '../icons.js';
import { school, dino } from '../illustrations.js';
import {
  studentsForUser, planFor, planReadStatus, planStatusLabel, glucoseToday, occurrencesOn, conversationsForUser,
  progressFor, subscriptionFor, canSeeGlucose, canSeeCalendar, teachersForStudent, linksForTeacher, notificationsFor,
  unreadNotifications, search, incidentsForUser, INCIDENT_CATEGORIES, INCIDENT_STATUS, studentById,
} from '../data.js';
import { markNotificationRead, markAllNotificationsRead, setActiveStudent } from '../actions.js';
import { pageHeader, lastGlucoseBlock, emptyState, healthNote, progressBar, studentAvatar } from '../components/ui.js';
import { reminderRow, bindReminderToggles } from '../components/reminders.js';
import { openGlucoseForm } from '../components/glucoseForm.js';
import { RESOURCES } from '../content/resources.js';
import { TOPICS } from '../content/topics.js';
import { ILLUSTRATION } from './public.js';
import { getState } from '../store.js';

function moduleCards(ctx) {
  const { user, student } = ctx;
  const fn = firstName(student?.name || '');
  const isFam = user.role === 'familia';
  return html`<div class="grid-3 module-row">
    <article class="card tone-escuela module-card">
      <div class="module-head"><span class="module-art" aria-hidden="true">${school({ size: 92 })}</span><div><h2 class="h3 mb-0">GlucoEscuela</h2><p class="small mb-0">${isFam ? `Información escolar de ${fn || 'tu hijo'}.` : 'Herramientas para el cuidado seguro en la escuela.'}</p></div></div>
      <ul class="mini-features"><li>${icon('clipboard', { size: 22 })}<span>Protocolos y plan</span></li><li>${icon('siren', { size: 22 })}<span>Incidentes</span></li><li>${icon('bell', { size: 22 })}<span>Avisos</span></li></ul>
      <a class="btn btn-dark btn-block" href="#/escuela">Ingresar a GlucoEscuela ${icon('arrow-right', { size: 18 })}</a>
    </article>
    <article class="card tone-familia module-card">
      <div class="module-head"><span class="module-art" aria-hidden="true"><img src="${ILLUSTRATION}" alt="" width="110" height="77"></span><div><h2 class="h3 mb-0">GlucoFamilia</h2><p class="small mb-0">${isFam ? 'Plan de cuidado diario y seguimiento.' : 'Comunicación con las familias de tus estudiantes.'}</p></div></div>
      <ul class="mini-features"><li>${icon(isFam ? 'calendar' : 'message', { size: 22 })}<span>${isFam ? 'Plan diario' : 'Mensajes'}</span></li><li>${icon('trend', { size: 22 })}<span>Registros</span></li><li>${icon(isFam ? 'apple' : 'phone', { size: 22 })}<span>${isFam ? 'Rutinas' : 'Contactos'}</span></li></ul>
      <a class="btn btn-dark btn-block" href="#${isFam ? '/familia' : '/mensajes'}">${isFam ? 'Ingresar a GlucoFamilia' : 'Ir a mensajes con familias'} ${icon('arrow-right', { size: 18 })}</a>
    </article>
    <article class="card tone-aprende module-card">
      <div class="module-head"><span class="module-art" aria-hidden="true">${dino({ mood: 'wave', size: 88 })}</span><div><h2 class="h3 mb-0">GlucoAprende</h2><p class="small mb-0">Aprender jugando sobre diabetes y autocuidado.</p></div></div>
      <ul class="mini-features"><li>${icon('gamepad', { size: 22 })}<span>Juegos</span></li><li>${icon('book', { size: 22 })}<span>Cuentos</span></li><li>${icon('trophy', { size: 22 })}<span>Logros</span></li></ul>
      <a class="btn btn-dark btn-block" href="#/aprende">Ingresar a GlucoAprende ${icon('arrow-right', { size: 18 })}</a>
    </article>
  </div>`;
}

export const panel = {
  title: 'Inicio', nav: 'panel',
  view: (ctx) => {
    const { user, student } = ctx;
    const students = studentsForUser(user);
    const isFam = user.role === 'familia';
    const sub = isFam ? subscriptionFor(user.id) : null;
    const pending = !isFam ? linksForTeacher(user.id).filter((l) => l.status === 'pendiente') : [];
    const header = pageHeader({
      title: '¡Bienvenidos a GlucoKids!',
      sub: 'Educación, seguimiento y seguridad para niños con diabetes en el entorno escolar.',
      actions: student && canSeeGlucose(user, student.id) ? html`<button type="button" class="btn btn-primary" data-add-glucose>${icon('plus')} Registrar glucosa</button>` : '',
    });
    const banner = isFam && sub ? (sub.status === 'prueba' && sub.inTrial
      ? html`<div class="notice notice-ok banner" role="status">${icon('sparkles')}<div class="row-between grow"><span><strong>Prueba gratuita:</strong> ${plural(sub.daysLeft, 'día restante', 'días restantes')}. Luego C$149/mes (simulado).</span><a class="btn btn-sm btn-secondary" href="#/suscripcion">Ver suscripción</a></div></div>`
      : sub.status === 'vencido' ? html`<div class="notice notice-warn banner">${icon('alert')}<div class="row-between grow"><span>Tu prueba o plan terminó. La información de emergencia sigue disponible.</span><a class="btn btn-sm btn-secondary" href="#/suscripcion">Activar plan</a></div></div>` : '') : '';

    if (!students.length) {
      return html`${header}${banner}${moduleCards(ctx)}
        <section class="card mt-6">${emptyState(isFam
          ? { ic: 'user-plus', title: 'Todavía no hay estudiantes en tu cuenta', text: 'Agregá un perfil ficticio para empezar a registrar mediciones y compartir el plan.', action: html`<a class="btn btn-primary" href="#/configuracion?tab=estudiantes">Agregar estudiante</a>` }
          : { ic: 'link', title: 'Aún no tenés estudiantes vinculados', text: pending.length ? `Tenés ${plural(pending.length, 'solicitud pendiente', 'solicitudes pendientes')} de autorización por parte de la familia.` : 'Pedí a la familia un código de invitación y usalo en GlucoEscuela.', action: html`<a class="btn btn-primary" href="#/escuela?vincular=1">Vincular con código</a>` })}</section>`;
    }

    const fn = firstName(student.name);
    const plan = planFor(student.id);
    const today = todayStr();
    const showGlu = canSeeGlucose(user, student.id);
    const showCal = canSeeCalendar(user, student.id);
    const occ = showCal ? occurrencesOn(today, [student.id]) : [];
    const convs = conversationsForUser(user).filter((c) => c.last).slice(0, 3);
    const prog = progressFor(student.id);
    const todayRecs = showGlu ? glucoseToday(student.id) : [];
    const readSt = !isFam ? planReadStatus(plan, user.id) : null;
    const teachers = teachersForStudent(student.id);
    const lastInc = incidentsForUser(user, { studentId: student.id })[0];

    return html`${header}${banner}
      ${pending.length ? html`<div class="notice banner">${icon('clock')}<span>${plural(pending.length, 'solicitud de vinculación espera', 'solicitudes de vinculación esperan')} la autorización de la familia.</span></div>` : ''}
      ${moduleCards(ctx)}
      <div class="grid-3 mt-6">
        <section class="card" aria-labelledby="estado-dia">
          <div class="card-header"><span class="card-icon">${icon('chart')}</span><h2 id="estado-dia" class="h3">Estado del día</h2><span class="actions">${studentAvatar(student, 'avatar-sm')}</span></div>
          <p class="small muted">${student.name} · ${student.grade}</p>
          ${lastGlucoseBlock(student, { canSee: showGlu })}
          <hr class="divider">
          <div class="row-between small"><span>${icon('droplet', { size: 16, cls: 'inline-icon' })} Registros de hoy</span><strong>${showGlu ? todayRecs.length : '—'}</strong></div>
          <div class="row-between small"><span>${icon('check-circle', { size: 16, cls: 'inline-icon' })} Recordatorios hechos hoy</span><strong>${showCal ? `${occ.filter((o) => o.done).length} de ${occ.length}` : '—'}</strong></div>
          ${showGlu ? html`<a class="btn btn-ghost btn-sm mt-2" href="#/glucosa">Ver historial ${icon('chev-right', { size: 16 })}</a>` : ''}
        </section>

        <section class="card" aria-labelledby="rec-hoy">
          <div class="card-header"><span class="card-icon yellow">${icon('bell')}</span><h2 id="rec-hoy" class="h3">Recordatorios de hoy</h2><a class="actions small" href="#/calendario">Calendario</a></div>
          ${!showCal ? emptyState({ ic: 'lock', title: 'Recordatorios no compartidos', text: 'La familia no comparte el calendario con tu perfil.' })
            : occ.length ? html`<ul class="list reminder-list">${occ.map((o) => reminderRow(o, { canEdit: isFam, showStudent: false }))}</ul>`
            : emptyState({ ic: 'calendar', title: 'Sin recordatorios para hoy', text: isFam ? 'Agregá rutinas desde el calendario.' : '' , action: isFam ? html`<a class="btn btn-secondary btn-sm" href="#/calendario?nuevo=1">Agregar recordatorio</a>` : '' })}
        </section>

        <section class="card" aria-labelledby="msg-rec">
          <div class="card-header"><span class="card-icon green">${icon('message')}</span><h2 id="msg-rec" class="h3">Mensajes recientes</h2><a class="actions small" href="#/mensajes">Ver todos</a></div>
          ${convs.length ? html`<ul class="list">${convs.map((c) => html`<li><a class="list-item-link" href="#/mensajes/${c.id}">
              ${studentAvatar(studentById(c.studentId), 'avatar-sm')}
              <span class="grow" style="min-width:0"><strong class="truncate" style="display:block">${c.counterpart?.name} · ${firstName(studentById(c.studentId).name)}</strong><span class="small muted truncate" style="display:block">${c.last.fromId === user.id ? 'Vos: ' : ''}${c.last.text}</span></span>
              ${c.unread ? html`<span class="chip chip-solid">${c.unread}<span class="sr-only"> sin leer</span></span>` : html`<span class="xsmall muted nowrap">${relTime(c.last.at)}</span>`}
            </a></li>`)}</ul>`
            : emptyState({ ic: 'message', title: 'Sin conversaciones', text: isFam ? 'Compartí el plan con un docente para conversar.' : 'Las conversaciones aparecen con estudiantes vinculados.' })}
        </section>
      </div>

      <div class="grid-3 mt-6">
        <section class="card tone-red" aria-labelledby="guia-rapida">
          <div class="card-header"><span class="card-icon red">${icon('siren')}</span><h2 id="guia-rapida" class="h3">Guía rápida ante emergencias</h2></div>
          <ol class="bullets small">
            <li>No dejes solo al estudiante.</li>
            <li>Seguí la actuación indicada en su <strong>Plan GlucoCompartido</strong>.</li>
            <li>Avisá a la familia y registrá lo ocurrido.</li>
          </ol>
          <p class="small"><strong>Ayuda urgente:</strong> si no responde, se desmaya, tiene convulsiones o no puede tragar, pedí ayuda de emergencia de inmediato.</p>
          <div class="row"><a class="btn btn-danger btn-sm" href="#/plan/${student.id}">${icon('clipboard', { size: 16 })} Plan de ${fn}</a><a class="btn btn-sm" href="#/escuela">Señales y protocolo</a></div>
        </section>

        <section class="card" aria-labelledby="plan-card">
          <div class="card-header"><span class="card-icon">${icon('clipboard')}</span><h2 id="plan-card" class="h3">Plan GlucoCompartido</h2></div>
          ${plan ? html`<div class="stack-sm">
            <div class="row"><span class="chip ${planStatusLabel(plan).chip}">${planStatusLabel(plan).label}</span><span class="chip">Versión ${plan.version}</span></div>
            <span class="small muted">Actualizado ${fmtDateTime(plan.updatedAt)}</span>
            <span class="small">Meta registrada: <strong>${plan.target ? `${plan.target.min}–${plan.target.max} mg/dL` : 'Sin meta configurada'}</strong></span>
            ${isFam
              ? html`<span class="small">${teachers.length ? `Compartido con ${teachers.map((t) => t.name).join(', ')}` : 'Aún no compartido con docentes'}</span>`
              : html`<span class="chip ${readSt.chip}">${readSt.label}</span>`}
            <div class="row mt-2"><a class="btn btn-primary btn-sm" href="#/plan/${student.id}">Ver plan completo ${icon('arrow-right', { size: 16 })}</a></div>
          </div>` : emptyState({ ic: 'clipboard', title: 'Sin plan' })}
        </section>

        <section class="card tone-aprende" aria-labelledby="prog-card">
          <div class="card-header"><span class="card-icon yellow">${icon('star')}</span><h2 id="prog-card" class="h3">Progreso educativo</h2></div>
          <p class="small mb-0">${fn} completó <strong>${prog.completed} de ${prog.total}</strong> temas.</p>
          <div class="row" style="flex-wrap:nowrap"><div class="grow">${progressBar(prog.percent, `Progreso de ${fn}`)}</div><strong>${prog.percent}%</strong></div>
          <p class="small">${icon('trophy', { size: 16, cls: 'inline-icon' })} ${plural(Object.keys(prog.achievements || {}).length, 'logro obtenido', 'logros obtenidos')}</p>
          ${lastInc ? html`<p class="xsmall muted mb-0">Último incidente: ${INCIDENT_CATEGORIES[lastInc.category]} · <span class="chip ${INCIDENT_STATUS[lastInc.status].chip}" style="min-height:22px">${INCIDENT_STATUS[lastInc.status].label}</span></p>` : ''}
          <a class="btn btn-secondary btn-sm mt-2" href="#/aprende">Ir a GlucoAprende</a>
        </section>
      </div>
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    bindReminderToggles(el, ctx);
    el.querySelector('[data-add-glucose]')?.addEventListener('click', () => openGlucoseForm({ user: ctx.user, studentId: ctx.student?.id, onSaved: () => ctx.refresh() }));
  },
};

/* ---------- Notificaciones ---------- */
export const notificaciones = {
  title: 'Notificaciones', auth: true, shell: 'app',
  view: (ctx) => {
    const filter = ctx.query.filtro === 'sinleer' ? 'sinleer' : 'todas';
    const list = notificationsFor(ctx.user.id).filter((n) => filter === 'todas' || !n.read);
    const unread = unreadNotifications(ctx.user.id);
    return html`${pageHeader({ title: 'Notificaciones', sub: 'Avisos internos de la demostración. No se envían correos, SMS ni notificaciones push.', actions: unread ? html`<button type="button" class="btn btn-secondary" data-read-all>${icon('check')} Marcar todas como leídas</button>` : '' })}
      <div class="segmented" role="group" aria-label="Filtrar notificaciones">
        <a href="#/notificaciones" ${filter === 'todas' ? raw('aria-current="page"') : ''}>Todas</a>
        <a href="#/notificaciones?filtro=sinleer" ${filter === 'sinleer' ? raw('aria-current="page"') : ''}>Sin leer (${unread})</a>
      </div>
      <section class="card mt-4">
        ${list.length ? html`<ul class="list">${list.map((n) => html`<li>
          <div class="notif-item ${n.read ? '' : 'unread'}" style="width:100%">
            <button type="button" class="notif-main" data-open="${n.id}"><span class="notif-title">${n.read ? '' : html`<span class="badge-dot" style="margin-right:6px"></span><span class="sr-only">Sin leer: </span>`}${n.title}</span><span class="notif-text">${n.body}</span><span class="notif-time">${fmtDateTime(n.at)}</span></button>
            <button type="button" class="btn btn-ghost btn-sm" data-toggle="${n.id}" data-read="${n.read ? '1' : ''}">${n.read ? 'Marcar como no leída' : 'Marcar como leída'}</button>
          </div></li>`)}</ul>`
          : emptyState({ ic: 'bell', title: filter === 'sinleer' ? 'No tenés notificaciones sin leer' : 'No tenés notificaciones' })}
      </section>`;
  },
  mount: (el, ctx) => {
    el.querySelector('[data-read-all]')?.addEventListener('click', () => { markAllNotificationsRead(ctx.user.id); ctx.refresh(); });
    el.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => { markNotificationRead(b.dataset.toggle, !b.dataset.read); ctx.refresh(); }));
    el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
      const n = getState().notifications.find((x) => x.id === b.dataset.open);
      markNotificationRead(n.id);
      if (n.route) ctx.go(n.route); else ctx.refresh();
    }));
  },
};

/* ---------- Búsqueda ---------- */
function searchIndex(user) {
  const items = [];
  const fam = user.role === 'familia';
  const pages = fam
    ? [['GlucoFamilia', '/familia'], ['Registro de glucosa', '/glucosa'], ['Calendario y recordatorios', '/calendario'], ['GlucoEscuela · información escolar', '/escuela'], ['Mensajes', '/mensajes'], ['Incidentes', '/incidentes'], ['GlucoAprende', '/aprende'], ['Reportes', '/reportes'], ['Suscripción y pagos', '/suscripcion'], ['Configuración', '/configuracion'], ['Permisos compartidos', '/configuracion?tab=permisos']]
    : [['GlucoEscuela', '/escuela'], ['Estudiantes vinculados', '/escuela/estudiantes'], ['Formación docente', '/escuela/formacion'], ['Incidentes', '/incidentes'], ['Registrar incidente', '/incidentes/nuevo'], ['Mensajes', '/mensajes'], ['Calendario', '/calendario'], ['GlucoAprende', '/aprende'], ['Reportes', '/reportes'], ['Configuración', '/configuracion']];
  pages.forEach(([t, r]) => items.push({ group: 'Secciones', title: t, route: r, ic: 'arrow-right' }));
  studentsForUser(user).forEach((s) => {
    items.push({ group: 'Estudiantes', title: s.name, text: `${s.grade} ${s.school} ${s.diabetesType}`, route: fam ? '/familia' : `/escuela/estudiante/${s.id}`, ic: 'user', studentId: s.id });
    items.push({ group: 'Planes', title: `Plan GlucoCompartido de ${s.name}`, text: 'contactos rutina alimentación actividad señales actuación meta emergencia', route: `/plan/${s.id}`, ic: 'clipboard' });
  });
  RESOURCES.forEach((r) => items.push({ group: 'Recursos', title: r.title, text: r.summary, body: (r.body || []).map((b) => b.p || b.h || b.note || b.danger || (b.list || b.steps || []).join(' ')).join(' '), route: `/recursos/${r.id}`, ic: 'book' }));
  TOPICS.forEach((t) => items.push({ group: 'Temas de GlucoAprende', title: t.title, text: `${t.goal} ${t.sections.map((s) => s.p).join(' ')}`, route: `/aprende/tema/${t.id}`, ic: 'gamepad' }));
  conversationsForUser(user).forEach((c) => items.push({ group: 'Mensajes', title: `Conversación con ${c.counterpart?.name} sobre ${firstName(studentById(c.studentId).name)}`, text: c.messages.map((m) => m.text).join(' '), route: `/mensajes/${c.id}`, ic: 'message' }));
  incidentsForUser(user).forEach((i) => items.push({ group: 'Incidentes', title: `${INCIDENT_CATEGORIES[i.category]} · ${studentById(i.studentId).name}`, text: `${i.notes} ${i.actions}`, route: `/incidentes/${i.id}`, ic: 'siren' }));
  return items;
}
export const buscar = {
  title: 'Buscar', auth: true, shell: 'app', key: 'buscar',
  view: (ctx) => {
    const q = ctx.query.q || '';
    const results = search(ctx.user, q, searchIndex(ctx.user));
    const groups = {};
    results.forEach((r) => { (groups[r.group] ||= []).push(r); });
    return html`${pageHeader({ title: 'Buscar en la plataforma', sub: 'Solo se muestran elementos que tu perfil puede consultar.' })}
      <form class="card card-tight" role="search" data-page-search>
        <label class="sr-only" for="page-search">Buscar</label>
        <div class="row" style="flex-wrap:nowrap"><div class="input-group grow"><span class="lead-icon">${icon('search', { size: 18 })}</span><input class="input" id="page-search" name="q" type="search" value="${q}" placeholder="Ej. insulina, plan, mensajes, Juan"></div><button class="btn btn-primary" type="submit">Buscar</button></div>
      </form>
      <div class="mt-4" aria-live="polite">
      ${!q ? emptyState({ ic: 'search', title: 'Escribí qué querés buscar', text: 'Podés buscar recursos, temas, estudiantes, planes, mensajes e incidentes.' })
        : !results.length ? emptyState({ ic: 'search', title: `Sin resultados para "${q}"`, text: 'Probá con otra palabra, por ejemplo "señales", "merienda" o el nombre de un estudiante.' })
        : html`<p class="muted">${plural(results.length, 'resultado', 'resultados')} para "${q}"</p>${Object.entries(groups).map(([g, list]) => html`<section class="card mt-4"><h2 class="h3">${g}</h2><ul class="list">${list.map((r) => html`<li><a class="list-item-link" href="#${r.route}" ${r.studentId ? raw(`data-student="${r.studentId}"`) : ''}><span class="card-icon">${icon(r.ic, { size: 18 })}</span><span class="grow"><strong>${r.title}</strong>${r.text && r.group === 'Recursos' ? html`<span class="small muted" style="display:block">${r.text}</span>` : ''}</span>${icon('chev-right')}</a></li>`)}</ul></section>`)}`}
      </div>`;
  },
  mount: (el, ctx) => {
    el.querySelector('[data-page-search]').addEventListener('submit', (e) => { e.preventDefault(); ctx.go(`/buscar?q=${encodeURIComponent(e.target.q.value.trim())}`); });
    el.querySelectorAll('[data-student]').forEach((a) => a.addEventListener('click', () => setActiveStudent(a.dataset.student)));
  },
};
