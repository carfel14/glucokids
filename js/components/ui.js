/* =========================================================
   Fragmentos de interfaz compartidos.
   ========================================================= */
import { html, raw, maskPhone, initials, fmtDateTime, firstName, relTime } from '../utils.js';
import { icon } from '../icons.js';
import { kidAvatar } from '../illustrations.js';
import { openModal } from './modal.js';
import { glucoseStatus, planFor, latestGlucose, CONTEXTS, userById, roleLabel } from '../data.js';

export const HEALTH_NOTE = 'Contenido de demostración. El cuidado debe seguir el plan individual indicado por el equipo de salud.';

export function healthNote(extra = '') {
  return html`<div class="notice health-disclaimer" role="note">${icon('shield')}<p><strong>${HEALTH_NOTE}</strong>${extra ? html` ${extra}` : ''}</p></div>`;
}
export function notice(text, kind = '', ic = 'info') {
  return html`<div class="notice ${kind ? `notice-${kind}` : ''}" role="note">${icon(ic)}<div>${text}</div></div>`;
}
export function emptyState({ ic = 'info', title, text = '', action = '' }) {
  return html`<div class="empty-state"><span class="empty-icon">${icon(ic, { size: 30 })}</span><h3>${title}</h3>${text ? html`<p>${text}</p>` : ''}${action || ''}</div>`;
}
export function pageHeader({ title, sub = '', eyebrow = '', actions = '' }) {
  return html`<header class="page-header">
    <div class="grow">${eyebrow ? html`<span class="eyebrow">${eyebrow}</span>` : ''}<h1 tabindex="-1" data-page-title>${title}</h1>${sub ? html`<p>${sub}</p>` : ''}</div>
    ${actions ? html`<div class="actions">${actions}</div>` : ''}
  </header>`;
}
export function studentAvatar(student, cls = '') {
  if (!student) return '';
  return html`<span class="avatar ${cls}" aria-hidden="true">${kidAvatar(student.avatar || {})}</span>`;
}
export function userAvatar(user, cls = 'avatar-sm') {
  const bg = user?.role === 'docente' ? 'var(--green)' : 'var(--blue)';
  return html`<span class="avatar ${cls}" style="background:${bg}" aria-hidden="true">${initials(user?.name)}</span>`;
}
export function statusChip(value, plan) {
  const s = glucoseStatus(value, plan);
  const ic = { bajo: 'arrow-down', alto: 'arrow-up', meta: 'check', sin: 'info' }[s.key];
  return html`<span class="chip ${s.chip}">${icon(ic, { size: 14 })}${s.label}</span>`;
}
export function registeredBy(rec) {
  const u = userById(rec.createdBy);
  return u ? `${u.name} (${roleLabel(u.role).toLowerCase()})` : 'Usuario de la demostración';
}

/** Tarjeta "último registro" calculada desde los datos guardados. */
export function lastGlucoseBlock(student, { canSee = true } = {}) {
  if (!canSee) return emptyState({ ic: 'lock', title: 'Registros no compartidos', text: 'La familia no comparte el historial de glucosa con tu perfil.' });
  const last = latestGlucose(student.id);
  const plan = planFor(student.id);
  if (!last) return emptyState({ ic: 'droplet', title: 'Sin registros todavía', text: `Cuando registres una medición de ${firstName(student.name)}, aparecerá aquí.` });
  return html`<div class="stack-sm">
    <span class="muted small">Última glucosa · ${fmtDateTime(last.at)}</span>
    <div class="row"><span class="big-number">${last.value}</span><span class="muted strong">mg/dL</span></div>
    <div class="row">${statusChip(last.value, plan)}<span class="chip">${CONTEXTS[last.context]}</span></div>
    <span class="xsmall muted">Registrado por ${registeredBy(last)} · ${relTime(last.at)}</span>
  </div>`;
}

/** Lista de contactos enmascarados con llamada simulada. */
export function contactsList(contacts = [], emergencyNumber = '') {
  if (!contacts.length && !emergencyNumber) return emptyState({ ic: 'phone', title: 'Sin contactos registrados', text: 'La familia puede agregarlos desde el Plan GlucoCompartido.' });
  return html`<ul class="list">
    ${contacts.map((c, i) => html`<li>
      <span class="card-icon ${c.relation?.match(/salud|Pediatra/i) ? 'green' : ''}">${icon(c.relation?.match(/salud|Pediatra/i) ? 'stethoscope' : 'user')}</span>
      <div class="grow"><strong class="truncate" style="display:block">${c.name}</strong><span class="small muted">${c.relation} · ${maskPhone(c.phone)}</span></div>
      <button type="button" class="btn btn-success btn-icon btn-sm" data-sim-call="${i}" aria-label="Llamar a ${c.name} (simulación)">${icon('phone', { size: 18 })}</button>
    </li>`)}
    <li>
      <span class="card-icon red">${icon('siren')}</span>
      <div class="grow"><strong style="display:block">Emergencias</strong><span class="small muted">${emergencyNumber ? `Número local registrado: ${emergencyNumber}` : 'Número de emergencias local: no configurado en el plan'}</span></div>
      <button type="button" class="btn btn-danger btn-icon btn-sm" data-sim-call="emergencia" aria-label="Llamar a emergencias (simulación)">${icon('phone', { size: 18 })}</button>
    </li>
  </ul>`;
}
/** Enlaza los botones de llamada simulada dentro de un contenedor. */
export function bindSimCalls(root, contacts = [], emergencyNumber = '') {
  root.querySelectorAll('[data-sim-call]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.simCall;
      const c = key === 'emergencia' ? { name: 'Emergencias', relation: 'Servicio local', phone: emergencyNumber } : contacts[Number(key)];
      simulatedCall(c);
    });
  });
}
export function simulatedCall(c) {
  openModal({
    title: `Llamada a ${c.name}`, size: 'sm', tag: 'Simulación',
    body: html`<div class="stack center" style="align-items:center">
      <span class="avatar avatar-lg" style="background:var(--green)">${icon('phone', { size: 32 })}</span>
      <p class="mb-0"><strong>${c.relation}</strong><br><span class="muted">${c.phone ? maskPhone(c.phone) : 'Número no configurado'}</span></p>
      ${notice('Esta es una simulación del prototipo: no se realizó ninguna llamada. En una situación real, usá el teléfono de la escuela o tu propio dispositivo.', 'warn', 'info')}
      <button type="button" class="btn btn-primary btn-block" data-close>Entendido</button>
    </div>`,
  });
}
export function tabsNav(items, current, base) {
  return html`<nav class="tabs" aria-label="Secciones">${items.map((t) => html`<a href="#${base}${t.id === items[0].id ? '' : `?tab=${t.id}`}" ${t.id === current ? raw('aria-current="page"') : ''}>${t.icon ? icon(t.icon, { size: 18 }) : ''}${t.label}</a>`)}</nav>`;
}
export function progressBar(percent, label) {
  return html`<div class="progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}"><span style="--value:${percent}%"></span></div>`;
}
/** Pequeña celebración (respeta reducir movimiento) */
export function confetti() {
  const colors = ['#FFC94A', '#24B6E6', '#F16C7A', '#4DB560', '#7C6BD6'];
  return raw(`<div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 53) % 100}%;background:${colors[i % 5]};animation-delay:${(i % 6) * 60}ms"></i>`).join('')}</div>`);
}
