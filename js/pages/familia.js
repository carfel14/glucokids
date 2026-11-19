/* =========================================================
   GlucoFamilia (RF-06). Todo depende del estudiante seleccionado.
   ========================================================= */
import { html, raw, firstName, todayStr, fmtLongDate, fmtTime, addDays, relTime } from '../utils.js';
import { icon } from '../icons.js';
import {
  studentsForUser, planFor, glucoseToday, glucoseFor, occurrencesOn, conversationsForUser, progressFor, teachersForStudent, CONTEXTS,
} from '../data.js';
import { setActiveStudent } from '../actions.js';
import { pageHeader, lastGlucoseBlock, emptyState, contactsList, bindSimCalls, statusChip, studentAvatar, progressBar, healthNote } from '../components/ui.js';
import { reminderRow, bindReminderToggles } from '../components/reminders.js';
import { openGlucoseForm } from '../components/glucoseForm.js';
import { glucoseChart } from '../components/chart.js';
import { ILLUSTRATION } from './public.js';

export const familiaHome = {
  title: 'GlucoFamilia', nav: 'familia',
  view: (ctx) => {
    const { user, student } = ctx;
    const students = studentsForUser(user);
    const header = pageHeader({ title: 'GlucoFamilia', eyebrow: 'Módulo familiar', sub: 'Acompañamos el cuidado de tu hijo o hija en casa y en la escuela.' });
    if (!student) {
      return html`${header}<section class="card">${emptyState({ ic: 'user-plus', title: 'Agregá a tu primer estudiante', text: 'Creá un perfil ficticio para registrar mediciones, recordatorios y compartir el plan con la escuela.', action: html`<a class="btn btn-primary" href="#/configuracion?tab=estudiantes">Agregar estudiante</a>` })}</section>`;
    }
    const fn = firstName(student.name);
    const plan = planFor(student.id);
    const today = todayStr();
    const recsToday = glucoseToday(student.id);
    const week = glucoseFor(student.id, { from: addDays(today, -6), to: today });
    const occ = occurrencesOn(today, [student.id]);
    const conv = conversationsForUser(user).filter((c) => c.studentId === student.id);
    const teachers = teachersForStudent(student.id);
    const prog = progressFor(student.id);
    const lastMsg = conv.map((c) => c.last).filter(Boolean).sort((a, b) => b.at.localeCompare(a.at))[0];
    const mainConv = conv.find((c) => c.active) || conv[0];
    const unread = conv.reduce((n, c) => n + c.unread, 0);

    return html`${header}
      <section class="card greet-card">
        ${studentAvatar(student, 'avatar-xl avatar-ring')}
        <div class="grow">
          <h2 class="mb-0">Hola, ${firstName(user.name)}</h2>
          <p class="muted mb-0">Aquí tenés el resumen del día de</p>
          ${students.length > 1 ? html`<label class="sr-only" for="fam-student">Elegir estudiante</label>
            <select id="fam-student" class="select greet-select" data-fam-student>${students.map((s) => html`<option value="${s.id}" ${s.id === student.id ? raw('selected') : ''}>${s.name}</option>`)}</select>`
            : html`<p class="h3 mb-0">${student.name}</p>`}
        </div>
        <div class="greet-side">
          <span class="chip chip-low">${icon('droplet', { size: 14 })} Diabetes ${student.diabetesType.toLowerCase()}</span>
          <span class="chip">${student.grade}</span>
          <img class="greet-art" src="${ILLUSTRATION}" alt="" width="180" height="126">
        </div>
      </section>

      <div class="quick-actions" role="group" aria-label="Acciones rápidas">
        <button type="button" class="btn btn-primary" data-add-glucose>${icon('plus')} Registrar glucosa</button>
        <a class="btn" href="#/glucosa">${icon('list')} Ver historial</a>
        <a class="btn" href="#/plan/${student.id}">${icon('clipboard')} Abrir plan</a>
        <a class="btn" href="#${mainConv ? `/mensajes/${mainConv.id}` : '/plan/' + student.id + '?compartir=1'}">${icon('send')} ${mainConv ? 'Enviar mensaje' : 'Compartir con docente'}</a>
      </div>

      <div class="grid-3">
        <section class="card span-2" aria-labelledby="resumen-hoy">
          <div class="card-header"><span class="card-icon">${icon('calendar')}</span><h2 id="resumen-hoy" class="h3">Resumen de hoy</h2><span class="actions small muted">${fmtLongDate(new Date())}</span></div>
          <div class="grid-2" style="gap:20px">
            <div class="soft-box">${lastGlucoseBlock(student)}</div>
            <div class="soft-box">
              <h3 class="h4">${icon('chart', { size: 18, cls: 'inline-icon' })} Registros del día</h3>
              ${recsToday.length ? html`<ul class="list list-compact">${recsToday.map((g) => html`<li><span class="dot ${g.value ? '' : ''}" aria-hidden="true"></span><span class="strong nowrap">${fmtTime(g.at)}</span><span class="grow"><strong>${g.value}</strong> mg/dL <span class="xsmall muted">· ${CONTEXTS[g.context]}</span></span>${statusChip(g.value, plan)}</li>`)}</ul>`
                : html`<p class="small muted">Todavía no hay registros hoy.</p>`}
            </div>
          </div>
          <div class="mt-4">
            <h3 class="h4">Últimos 7 días</h3>
            ${week.length ? glucoseChart(week, { plan, height: 220, label: `Registros de ${fn} de los últimos 7 días` }) : emptyState({ ic: 'chart', title: 'Sin registros esta semana', text: 'La gráfica aparecerá con la primera medición.' })}
          </div>
        </section>

        <section class="card" aria-labelledby="rutina">
          <div class="card-header"><span class="card-icon yellow">${icon('bell')}</span><h2 id="rutina" class="h3">Recordatorios de rutina</h2></div>
          ${occ.length ? html`<ul class="list reminder-list">${occ.map((o) => reminderRow(o, { showStudent: false }))}</ul>` : emptyState({ ic: 'calendar', title: 'Sin recordatorios para hoy' })}
          <a class="btn btn-ghost btn-sm mt-2" href="#/calendario?nuevo=1">${icon('plus', { size: 16 })} Agregar recordatorio</a>
        </section>

        <section class="card" aria-labelledby="plan-c">
          <div class="card-header"><span class="card-icon">${icon('clipboard')}</span><h2 id="plan-c" class="h3">Plan GlucoCompartido</h2></div>
          <p class="small muted">Plan individualizado de cuidados en la escuela · versión ${plan.version}</p>
          <ul class="checklist small">
            ${[['Meta de glucosa registrada', !!plan.target], ['Contactos de emergencia', plan.coordination.contacts.length > 0], ['Rutina escolar', plan.coordination.routine.length > 0], ['Alimentación y actividad física', !!(plan.coordination.food || plan.coordination.activity)], ['Actuación indicada por el equipo de salud', !!plan.clinical]].map(([t, ok]) => html`<li>${ok ? icon('check-circle', { size: 18 }) : raw(`<span style="color:var(--text-2);display:inline-flex">${icon('clock', { size: 18 })}</span>`)}<span>${t}${ok ? '' : ' · pendiente'}</span></li>`)}
          </ul>
          <p class="small mt-2">${teachers.length ? html`${icon('users', { size: 16, cls: 'inline-icon' })} Compartido con ${teachers.map((t) => t.name).join(', ')}` : 'Aún no se compartió con un docente.'}</p>
          <a class="btn btn-primary btn-block" href="#/plan/${student.id}">${icon('file', { size: 18 })} Ver plan completo</a>
        </section>

        <section class="card" aria-labelledby="msg-esc">
          <div class="card-header"><span class="card-icon green">${icon('message')}</span><h2 id="msg-esc" class="h3">Mensajes con la escuela</h2>${unread ? html`<span class="actions"><span class="chip chip-solid">${unread} sin leer</span></span>` : ''}</div>
          ${lastMsg ? html`<div class="msg-preview"><strong>${lastMsg.fromId === user.id ? 'Vos' : (teachers.find((t) => t.id === lastMsg.fromId)?.name || 'Docente')}</strong><span class="xsmall muted"> · ${relTime(lastMsg.at)}</span><p class="small mb-0">${lastMsg.text}</p></div>`
            : emptyState({ ic: 'message', title: 'Sin mensajes', text: teachers.length ? 'Escribile al docente vinculado.' : 'Compartí el plan con un docente para poder conversar.' })}
          ${mainConv ? html`<a class="btn btn-secondary btn-block mt-4" href="#/mensajes/${mainConv.id}">${icon('send', { size: 18 })} Enviar mensaje</a>` : html`<a class="btn btn-secondary btn-block mt-4" href="#/plan/${student.id}?compartir=1">${icon('share', { size: 18 })} Compartir plan</a>`}
        </section>

        <section class="card tone-red" aria-labelledby="contactos">
          <div class="card-header"><span class="card-icon red">${icon('phone')}</span><h2 id="contactos" class="h3">Contactos de emergencia</h2></div>
          ${contactsList(plan.coordination.contacts, plan.coordination.emergencyNumber)}
        </section>

        <section class="card tone-aprende" aria-labelledby="aprende-c">
          <div class="card-header"><span class="card-icon yellow">${icon('gamepad')}</span><h2 id="aprende-c" class="h3">Aprendizaje de ${fn}</h2></div>
          <p class="small mb-0">${prog.completed} de ${prog.total} temas completados</p>
          <div class="row" style="flex-wrap:nowrap"><div class="grow">${progressBar(prog.percent, `Progreso de ${fn}`)}</div><strong>${prog.percent}%</strong></div>
          <div class="row mt-4"><a class="btn btn-secondary btn-sm" href="#/aprende">Ver temas</a><a class="btn btn-sm" href="#/aprende?ninos=1">${icon('smile', { size: 16 })} Modo infantil</a></div>
        </section>
      </div>
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    bindReminderToggles(el, ctx);
    const plan = ctx.student && planFor(ctx.student.id);
    if (plan) bindSimCalls(el, plan.coordination.contacts, plan.coordination.emergencyNumber);
    el.querySelector('[data-fam-student]')?.addEventListener('change', (e) => { setActiveStudent(e.target.value); ctx.refresh(); });
    el.querySelector('[data-add-glucose]')?.addEventListener('click', () => openGlucoseForm({ user: ctx.user, studentId: ctx.student.id, onSaved: () => ctx.refresh() }));
  },
};
