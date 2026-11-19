/* =========================================================
   Acciones (mutaciones) sobre el estado común. Toda la app usa estas funciones,
   de modo que paneles, gráficos y contadores se actualizan desde la misma fuente.
   ========================================================= */
import { getState, commit, setSession, getSession } from './store.js';
import { uid, isoFromLocal, fromLocal, localParts, addMonths, isEmail, firstName, addDays, todayStr } from './utils.js';
import {
  userById, studentById, planFor, glucoseStatus, convId, parseConvId, activeLink, linkFor,
  INCIDENT_CATEGORIES, PLAN_PRICE, TRIAL_DAYS, canAccessStudent,
} from './data.js';
import { blankPlan, exampleClinical } from './seed.js';
import { ACHIEVEMENTS } from './content/achievements.js';
import { PASS_SCORE } from './content/topics.js';

const st = () => getState();
const now = () => new Date().toISOString();

/* ---------- Notificaciones ---------- */
export function notify(userId, { type, title, body = '', route = '', ref = null }) {
  if (!userId) return;
  st().notifications.push({ id: uid('n'), userId, type, title, body, route, ref, at: now(), read: false });
}
export function markNotificationRead(id, read = true) {
  const n = st().notifications.find((x) => x.id === id);
  if (n) { n.read = read; commit('notifications'); }
}
export function markAllNotificationsRead(userId) {
  st().notifications.filter((n) => n.userId === userId).forEach((n) => { n.read = true; });
  commit('notifications');
}
function markNotificationsByRef(userId, ref) {
  st().notifications.filter((n) => n.userId === userId && n.ref === ref).forEach((n) => { n.read = true; });
}

/* ---------- Sesión ---------- */
export function login(userId) {
  const user = userById(userId);
  if (!user) return null;
  setSession({ userId, kidMode: false, kidStudentId: undefined, activeStudentId: undefined });
  return user;
}
export function setActiveStudent(studentId) { setSession({ activeStudentId: studentId }); }
export function enterKidMode(studentId) { setSession({ kidMode: true, kidStudentId: studentId }); }
export function exitKidMode() { const s = getSession(); setSession({ kidMode: false, kidStudentId: undefined, activeStudentId: s.kidStudentId || s.activeStudentId }); }

/* ---------- Glucosa ---------- */
/** Valida un registro. Devuelve {campo: mensaje}. */
export function validateGlucose(d) {
  const e = {};
  if (!d.studentId) e.studentId = 'Elegí un estudiante.';
  const v = Number(d.value);
  if (d.value === '' || d.value == null) e.value = 'Ingresá el valor en mg/dL.';
  else if (!Number.isFinite(v) || v <= 0) e.value = 'El valor debe ser un número positivo.';
  else if (!Number.isInteger(v)) e.value = 'Ingresá un número entero (sin decimales).';
  else if (v < 20 || v > 600) e.value = 'Ingresá un valor entre 20 y 600 mg/dL (rango de lectura habitual de un medidor).';
  if (!d.date) e.date = 'Elegí la fecha.';
  if (!d.time) e.time = 'Elegí la hora.';
  if (d.date && d.time && fromLocal(d.date, d.time) > new Date()) e.time = 'No se pueden registrar mediciones futuras.';
  if (!d.context) e.context = 'Elegí el contexto de la medición.';
  if (d.notes && d.notes.length > 280) e.notes = 'Máximo 280 caracteres.';
  return e;
}
export function addGlucose(user, d) {
  const rec = {
    id: uid('g'), studentId: d.studentId, value: Number(d.value), at: isoFromLocal(d.date, d.time),
    context: d.context, notes: d.notes || '', createdBy: user.id, createdRole: user.role, createdAt: now(),
  };
  st().glucose.push(rec);
  const status = afterGlucoseChange(user, rec);
  commit('glucose');
  return { rec, status };
}
export function updateGlucose(user, id, d) {
  const rec = st().glucose.find((g) => g.id === id);
  if (!rec) return null;
  Object.assign(rec, { value: Number(d.value), at: isoFromLocal(d.date, d.time), context: d.context, notes: d.notes || '', studentId: d.studentId || rec.studentId, updatedAt: now(), updatedBy: user.id });
  const status = afterGlucoseChange(user, rec);
  commit('glucose');
  return { rec, status };
}
export function deleteGlucose(id) {
  const i = st().glucose.findIndex((g) => g.id === id);
  if (i >= 0) { st().glucose.splice(i, 1); commit('glucose'); }
}
/** Si el valor queda fuera de la meta del plan, genera una notificación local (sin diagnosticar). */
function afterGlucoseChange(user, rec) {
  const plan = planFor(rec.studentId);
  const status = glucoseStatus(rec.value, plan);
  if (status.key === 'bajo' || status.key === 'alto') {
    const student = studentById(rec.studentId);
    const payload = {
      type: 'glucosa',
      title: `Registro ${status.key === 'bajo' ? 'por debajo' : 'por encima'} de la meta del plan`,
      body: `${firstName(student.name)} · ${rec.value} mg/dL. Consultá el Plan GlucoCompartido.`,
      route: `/plan/${rec.studentId}`,
    };
    notify(student.familyId, payload);
    if (user.id !== student.familyId) notify(user.id, payload);
  }
  return status;
}

/* ---------- Recordatorios ---------- */
export function validateReminder(d) {
  const e = {};
  if (!d.studentId) e.studentId = 'Elegí un estudiante.';
  if (!d.title || d.title.length < 3) e.title = 'Escribí un título (mínimo 3 caracteres).';
  else if (d.title.length > 80) e.title = 'Máximo 80 caracteres.';
  if (!d.category) e.category = 'Elegí una categoría.';
  if (!d.date) e.date = 'Elegí la fecha.';
  if (!d.time) e.time = 'Elegí la hora.';
  if (d.notes && d.notes.length > 200) e.notes = 'Máximo 200 caracteres.';
  return e;
}
export function saveReminder(user, d, id = null) {
  if (id) {
    const r = st().reminders.find((x) => x.id === id);
    if (r) Object.assign(r, { studentId: d.studentId, title: d.title, category: d.category, date: d.date, time: d.time, recurrence: d.recurrence || 'none', notes: d.notes || '', updatedAt: now() });
  } else {
    st().reminders.push({ id: uid('r'), studentId: d.studentId, title: d.title, category: d.category, date: d.date, time: d.time, recurrence: d.recurrence || 'none', notes: d.notes || '', createdBy: user.id, completions: {}, createdAt: now() });
  }
  commit('reminders');
}
export function deleteReminder(id) {
  const i = st().reminders.findIndex((r) => r.id === id);
  if (i >= 0) { st().reminders.splice(i, 1); commit('reminders'); }
}
/** Completar corresponde a una fecha concreta: no afecta a los días futuros. */
export function setReminderDone(id, date, done) {
  const r = st().reminders.find((x) => x.id === id);
  if (!r) return;
  r.completions = r.completions || {};
  if (done) r.completions[date] = now(); else delete r.completions[date];
  commit('reminders');
}

/* ---------- Mensajes ---------- */
export function sendMessage(user, id, text) {
  const { studentId, teacherId } = parseConvId(id);
  const student = studentById(studentId);
  const toId = user.role === 'familia' ? teacherId : student.familyId;
  const m = { id: uid('m'), convId: id, studentId, fromId: user.id, toId, text: text.trim(), at: now(), readAt: null };
  st().messages.push(m);
  notify(toId, { type: 'mensaje', title: `Nuevo mensaje de ${user.name}`, body: m.text.slice(0, 90), route: `/mensajes/${id}`, ref: m.id });
  commit('messages');
  return m;
}
/** El mensaje se marca leído cuando el destinatario abre la conversación. */
export function markConversationRead(user, id) {
  let changed = false;
  st().messages.filter((m) => m.convId === id && m.toId === user.id && !m.readAt).forEach((m) => {
    m.readAt = now(); changed = true;
    markNotificationsByRef(user.id, m.id);
  });
  if (changed) commit('messages');
}

/* ---------- Vinculación familia ↔ docente ---------- */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function createInvite(user, studentId) {
  st().invites.filter((i) => i.studentId === studentId && i.status === 'activo').forEach((i) => { i.status = 'reemplazado'; });
  let code;
  do { code = `GK-${Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')}`; }
  while (st().invites.some((i) => i.code === code));
  const inv = { code, studentId, familyId: user.id, createdAt: now(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'activo' };
  st().invites.push(inv);
  commit('invites');
  return inv;
}
export function activeInvite(studentId) {
  return st().invites.find((i) => i.studentId === studentId && i.status === 'activo' && new Date(i.expiresAt) > new Date()) || null;
}
/** Valida un código de invitación sin crear nada. */
export function checkInviteCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!/^GK-[A-Z0-9]{6}$/.test(code)) return { error: 'El código tiene el formato GK-XXXXXX (6 letras o números).' };
  const inv = st().invites.find((i) => i.code === code);
  if (!inv) return { error: 'No encontramos ese código en esta demostración. Revisalo con la familia.' };
  if (inv.status !== 'activo') return { error: 'Este código ya se utilizó o fue reemplazado. Pedí uno nuevo a la familia.' };
  if (new Date(inv.expiresAt) < new Date()) return { error: 'El código venció. Pedí uno nuevo a la familia.' };
  return { inv, code };
}
/** El docente introduce el código → solicitud pendiente para la familia. */
export function requestLink(teacher, rawCode) {
  const chk = checkInviteCode(rawCode);
  if (chk.error) return chk;
  const { inv, code } = chk;
  const existing = linkFor(inv.studentId, teacher.id);
  if (existing?.status === 'activo') return { error: 'Ya tenés acceso a este estudiante.' };
  if (existing?.status === 'pendiente') return { error: 'Ya enviaste una solicitud para este estudiante. Esperá la autorización de la familia.' };
  const student = studentById(inv.studentId);
  const l = { id: uid('l'), studentId: inv.studentId, teacherId: teacher.id, familyId: inv.familyId, status: 'pendiente', code, requestedAt: now(), approvedAt: null, revokedAt: null, permissions: { glucose: true, calendar: true } };
  st().links.push(l);
  inv.status = 'usado'; inv.usedBy = teacher.id;
  notify(inv.familyId, { type: 'vinculacion', title: 'Solicitud de acceso docente', body: `${teacher.name} solicita acceso al plan de ${firstName(student.name)}.`, route: '/configuracion?tab=permisos', ref: l.id });
  commit('links');
  return { link: l, student };
}
export function approveLink(user, linkId) {
  const l = st().links.find((x) => x.id === linkId);
  if (!l || l.familyId !== user.id) return;
  l.status = 'activo'; l.approvedAt = now();
  const student = studentById(l.studentId);
  notify(l.teacherId, { type: 'vinculacion', title: 'Acceso autorizado', body: `La familia autorizó tu acceso al plan de ${firstName(student.name)}.`, route: `/escuela/estudiante/${l.studentId}` });
  markNotificationsByRef(user.id, l.id);
  commit('links');
}
export function rejectLink(user, linkId) {
  const l = st().links.find((x) => x.id === linkId);
  if (!l || l.familyId !== user.id) return;
  l.status = 'rechazado'; l.revokedAt = now();
  notify(l.teacherId, { type: 'vinculacion', title: 'Solicitud no autorizada', body: `La familia no autorizó el acceso a ${firstName(studentById(l.studentId).name)}.`, route: '/escuela' });
  markNotificationsByRef(user.id, l.id);
  commit('links');
}
/** Revocar: el docente deja de ver al estudiante, incluso escribiendo la ruta. */
export function revokeLink(user, linkId) {
  const l = st().links.find((x) => x.id === linkId);
  if (!l || l.familyId !== user.id) return;
  l.status = 'revocado'; l.revokedAt = now();
  notify(l.teacherId, { type: 'vinculacion', title: 'Acceso revocado', body: `La familia revocó tu acceso a ${firstName(studentById(l.studentId).name)}.`, route: '/escuela' });
  commit('links');
}
export function setLinkPermission(user, linkId, key, value) {
  const l = st().links.find((x) => x.id === linkId);
  if (!l || l.familyId !== user.id) return;
  l.permissions = { ...l.permissions, [key]: !!value };
  commit('links');
}

/* ---------- Plan GlucoCompartido ---------- */
function bumpPlan(user, plan, summary) {
  plan.version += 1;
  plan.updatedAt = now();
  plan.updatedBy = user.id;
  plan.history = plan.history || [];
  plan.history.push({ version: plan.version, at: plan.updatedAt, by: user.id, summary });
  const student = studentById(plan.studentId);
  st().links.filter((l) => l.studentId === plan.studentId && l.status === 'activo').forEach((l) => {
    notify(l.teacherId, { type: 'plan', title: `Plan de ${firstName(student.name)} actualizado (versión ${plan.version})`, body: `${summary}. Revisá la nueva versión y confirmá la lectura.`, route: `/plan/${plan.studentId}` });
  });
}
export function updatePlanCoordination(user, studentId, coord, summary = 'Datos de coordinación actualizados') {
  const plan = planFor(studentId);
  if (!plan || user.role !== 'familia') return;
  plan.coordination = { ...plan.coordination, ...coord };
  if (plan.status === 'borrador' && (plan.coordination.contacts || []).length) plan.status = 'vigente';
  bumpPlan(user, plan, summary);
  commit('plan');
}
/** La familia transcribe el rango meta indicado por su equipo de salud. */
export function updatePlanTarget(user, studentId, min, max) {
  const plan = planFor(studentId);
  if (!plan || user.role !== 'familia') return;
  plan.target = (min === '' || min == null) ? null : { min: Number(min), max: Number(max) };
  bumpPlan(user, plan, plan.target ? `Meta transcrita: ${min}–${max} mg/dL` : 'Meta eliminada');
  commit('plan');
}
export function markPlanRead(teacher, studentId) {
  const plan = planFor(studentId);
  if (!plan || !activeLink(studentId, teacher.id)) return;
  plan.readBy = (plan.readBy || []).filter((r) => !(r.teacherId === teacher.id && r.version === plan.version));
  plan.readBy.push({ teacherId: teacher.id, version: plan.version, at: now() });
  const student = studentById(studentId);
  notify(student.familyId, { type: 'plan', title: `${teacher.name} leyó el plan de ${firstName(student.name)}`, body: `Confirmó la lectura de la versión ${plan.version}.`, route: `/plan/${studentId}` });
  st().notifications.filter((n) => n.userId === teacher.id && n.type === 'plan' && n.route === `/plan/${studentId}`).forEach((n) => { n.read = true; });
  commit('plan');
}

/* ---------- Incidentes y observaciones ---------- */
export function validateIncident(d) {
  const e = {};
  if (!d.studentId) e.studentId = 'Elegí un estudiante.';
  if (!d.category) e.category = 'Elegí una categoría.';
  if (!d.date) e.date = 'Elegí la fecha.';
  if (!d.time) e.time = 'Elegí la hora.';
  if (d.date && d.time && fromLocal(d.date, d.time) > new Date()) e.time = 'La fecha y hora no pueden ser futuras.';
  if (!d.notes || d.notes.length < 5) e.notes = 'Describí brevemente lo ocurrido (mínimo 5 caracteres).';
  if (!d.actions || d.actions.length < 5) e.actions = 'Indicá las acciones realizadas (mínimo 5 caracteres).';
  return e;
}
export function addIncident(teacher, d) {
  const inc = { id: uid('inc'), studentId: d.studentId, teacherId: teacher.id, category: d.category, at: isoFromLocal(d.date, d.time), notes: d.notes, actions: d.actions, status: 'registrado', seenAt: null, followUps: [], createdAt: now() };
  st().incidents.push(inc);
  const student = studentById(d.studentId);
  notify(student.familyId, { type: 'incidente', title: 'Incidente escolar registrado', body: `${firstName(student.name)} · ${INCIDENT_CATEGORIES[d.category]}. Revisá el detalle.`, route: `/incidentes/${inc.id}`, ref: inc.id });
  commit('incidents');
  return inc;
}
/** Confirmación explícita del familiar (leer la alerta no cambia el estado). */
export function markIncidentSeen(user, id) {
  const inc = st().incidents.find((i) => i.id === id);
  if (!inc || inc.status !== 'registrado') return;
  inc.status = 'visto'; inc.seenAt = now(); inc.seenBy = user.id;
  notify(inc.teacherId, { type: 'incidente', title: 'La familia confirmó que vio el incidente', body: `${firstName(studentById(inc.studentId).name)} · ${INCIDENT_CATEGORIES[inc.category]}`, route: `/incidentes/${id}` });
  commit('incidents');
}
export function addIncidentFollowUp(user, id, text) {
  const inc = st().incidents.find((i) => i.id === id);
  if (!inc) return;
  inc.followUps = inc.followUps || [];
  inc.followUps.push({ id: uid('f'), by: user.id, at: now(), text });
  if (inc.status === 'registrado') { inc.seenAt = inc.seenAt || (user.role === 'familia' ? now() : null); }
  inc.status = 'seguimiento';
  const student = studentById(inc.studentId);
  const other = user.role === 'familia' ? inc.teacherId : student.familyId;
  notify(other, { type: 'incidente', title: 'Seguimiento documentado', body: `${user.name} agregó un seguimiento al incidente de ${firstName(student.name)}.`, route: `/incidentes/${id}` });
  commit('incidents');
}
export function addObservation(user, studentId, text) {
  st().observations.push({ id: uid('obs'), studentId, authorId: user.id, at: now(), text });
  const student = studentById(studentId);
  notify(student.familyId, { type: 'observacion', title: 'Nueva observación escolar', body: `${firstName(student.name)}: ${text.slice(0, 80)}`, route: '/escuela' });
  commit('observations');
}

/* ---------- Progreso educativo ---------- */
function progressRef(studentId) {
  const p = st().progress;
  if (!p[studentId]) p[studentId] = { topics: {}, lessonsOpened: {}, stories: {}, achievements: {} };
  const ref = p[studentId];
  ref.topics ||= {}; ref.lessonsOpened ||= {}; ref.stories ||= {}; ref.achievements ||= {};
  return ref;
}
/** Evalúa logros y devuelve solo los nuevos (nunca se duplican). */
function evaluateAchievements(studentId) {
  const p = progressRef(studentId);
  const fresh = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!p.achievements[a.id] && a.test(p)) { p.achievements[a.id] = now(); fresh.push(a); }
  });
  return fresh;
}
export function recordLessonOpened(studentId, topicId) {
  const p = progressRef(studentId);
  if (p.lessonsOpened[topicId]) return [];
  p.lessonsOpened[topicId] = now();
  const fresh = evaluateAchievements(studentId);
  commit('progress');
  return fresh;
}
export function submitQuiz(studentId, topicId, score) {
  const p = progressRef(studentId);
  const t = p.topics[topicId] || { best: 0, attempts: 0, completed: false };
  t.attempts = (t.attempts || 0) + 1;
  t.best = Math.max(t.best || 0, score);
  t.lastAt = now();
  const newlyCompleted = !t.completed && score >= PASS_SCORE;
  if (newlyCompleted) { t.completed = true; t.completedAt = now(); }
  p.topics[topicId] = t;
  const fresh = evaluateAchievements(studentId);
  commit('progress');
  return { topic: t, newlyCompleted, fresh };
}
export function finishStory(studentId, storyId) {
  const p = progressRef(studentId);
  if (!p.stories[storyId]) p.stories[storyId] = now();
  const fresh = evaluateAchievements(studentId);
  commit('progress');
  return fresh;
}

/* ---------- Suscripción (simulada) ---------- */
export function startTrial(familyId) {
  const subs = st().subscriptions;
  if (subs[familyId]?.trialStart) return subs[familyId]; // la prueba nunca se reinicia
  const start = now();
  subs[familyId] = { status: 'prueba', trialStart: start, trialEnd: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(), activation: null, renews: true, history: [] };
  commit('subscription');
  return subs[familyId];
}
/**
 * Activa el plan pagado de forma simulada.
 * mode 'fin_prueba' → total de hoy C$0, cobro simulado al terminar la prueba.
 * mode 'ahora' → cobro simulado de C$149 hoy y la prueba termina.
 */
export function activatePlan(familyId, { mode, method, approved }) {
  const subs = st().subscriptions;
  const sub = subs[familyId] || (subs[familyId] = { status: 'sin_plan', trialStart: null, trialEnd: null, activation: null, renews: true, history: [] });
  const amount = mode === 'fin_prueba' ? 0 : PLAN_PRICE;
  sub.history = sub.history || [];
  sub.history.push({ id: uid('pay'), at: now(), amount, method, mode, result: approved ? 'aprobado' : 'rechazado', simulated: true });
  if (approved) {
    const billingStart = mode === 'fin_prueba' && sub.trialEnd ? sub.trialEnd : now();
    if (mode === 'ahora' && sub.trialEnd && new Date(sub.trialEnd) > new Date()) sub.trialEnd = now();
    sub.status = 'activo';
    sub.renews = true;
    sub.activation = { at: now(), mode, method, billingStart, nextBilling: mode === 'fin_prueba' ? billingStart : addMonths(billingStart, 1) };
  }
  commit('subscription');
  return { approved, amount };
}
export function setRenewal(familyId, renews) {
  const sub = st().subscriptions[familyId];
  if (!sub) return;
  sub.renews = renews;
  commit('subscription');
}

/* ---------- Perfiles y registro ---------- */
export function emailTaken(email, exceptId = null) {
  const e = String(email || '').trim().toLowerCase();
  return st().users.some((u) => u.email.toLowerCase() === e && u.id !== exceptId);
}
export function updateProfile(userId, patch) {
  const u = userById(userId);
  if (!u) return;
  Object.assign(u, patch);
  commit('profile');
}
export function setPref(userId, key, value) {
  st().prefs[userId] = { ...(st().prefs[userId] || {}), [key]: value };
  commit('prefs');
}
export const getPref = (userId, key, fallback) => (st().prefs[userId]?.[key] ?? fallback);

const AVATARS = [
  { hair: 'short', skin: '#F4C29C', hairColor: '#5A3A2A', bg: '#D9EEFB', shirt: '#2F7FD1' },
  { hair: 'long', skin: '#E9B48C', hairColor: '#3B2418', bg: '#FFE3E7', shirt: '#F16C7A' },
  { hair: 'curly', skin: '#C98E64', hairColor: '#2A1A12', bg: '#E5F7ED', shirt: '#21864B' },
  { hair: 'pony', skin: '#F4C29C', hairColor: '#4A2C1C', bg: '#FFF4CC', shirt: '#7C6BD6' },
];
export function validateStudent(d) {
  const e = {};
  if (!d.name || d.name.length < 3) e.name = 'Escribí nombre y apellido (datos ficticios).';
  const age = Number(d.age);
  if (!d.age) e.age = 'Indicá la edad.';
  else if (!Number.isInteger(age) || age < 3 || age > 19) e.age = 'La edad debe estar entre 3 y 19 años.';
  if (!d.diabetesType) e.diabetesType = 'Elegí una opción.';
  if (!d.school || d.school.length < 3) e.school = 'Indicá el centro educativo.';
  if (!d.grade) e.grade = 'Indicá el grado o grupo.';
  return e;
}
export function addStudent(family, d, { example = false, target = null } = {}) {
  const id = uid('s');
  const student = { id, name: d.name, age: Number(d.age), grade: d.grade, school: d.school, diabetesType: d.diabetesType, familyId: family.id, avatar: AVATARS[d.avatar ?? st().students.length % AVATARS.length] || AVATARS[0], createdAt: now() };
  st().students.push(student);
  const plan = blankPlan(id, family.id);
  plan.coordination.responsables = [{ name: family.name, relation: family.relation || 'Familiar' }];
  plan.coordination.contacts = family.phone ? [{ name: family.name, relation: family.relation || 'Familiar', phone: family.phone }] : [];
  if (target) plan.target = target;
  if (example) loadExampleData(family, student, plan);
  if (plan.coordination.contacts.length) plan.status = 'vigente';
  st().plans.push(plan);
  st().progress[id] = { topics: {}, lessonsOpened: {}, stories: {}, achievements: {} };
  commit('students');
  return student;
}
export function updateStudent(studentId, d) {
  const s = studentById(studentId);
  if (!s) return;
  Object.assign(s, { name: d.name, age: Number(d.age), grade: d.grade, school: d.school, diabetesType: d.diabetesType });
  commit('students');
}
/** Datos de ejemplo para una cuenta nueva (solo si se elige en el registro). */
function loadExampleData(family, student, plan) {
  const fn = firstName(student.name);
  plan.target = plan.target || { min: 80, max: 180 };
  plan.clinical = exampleClinical(fn);
  plan.coordination = {
    ...plan.coordination,
    routine: ['07:00 · Entrada a clases', '09:30 · Merienda', '12:00 · Salida'],
    food: `${fn} lleva la merienda desde casa.`,
    activity: `${fn} participa en educación física siguiendo su plan.`,
    supplies: 'Materiales indicados por su plan, agua y merienda.',
    notes: 'Datos de ejemplo cargados al crear la cuenta.',
  };
  const today = todayStr();
  const times = [['06:50', 'antes_comer'], ['12:20', 'antes_comer'], ['19:00', 'despues_comer']];
  for (let d = -6; d <= 0; d++) {
    times.forEach(([t, ctx], i) => {
      const date = addDays(today, d);
      if (fromLocal(date, t) > new Date()) return;
      const value = 105 + ((d + 7) * 13 + i * 29) % 90;
      st().glucose.push({ id: uid('g'), studentId: student.id, value, at: isoFromLocal(date, t), context: ctx, notes: 'Dato de ejemplo', createdBy: family.id, createdRole: 'familia', createdAt: now() });
    });
  }
  st().reminders.push(
    { id: uid('r'), studentId: student.id, title: 'Merienda de media mañana', category: 'alimentacion', date: addDays(today, -3), time: '09:30', recurrence: 'weekdays', notes: '', createdBy: family.id, completions: {}, createdAt: now() },
    { id: uid('r'), studentId: student.id, title: 'Medición antes de cenar', category: 'medicion', date: addDays(today, -3), time: '18:30', recurrence: 'daily', notes: '', createdBy: family.id, completions: {}, createdAt: now() },
  );
}
export function registerFamily(d) {
  const user = { id: uid('u'), role: 'familia', name: d.name, email: d.email.toLowerCase(), phone: d.phone || '', relation: d.relation, demo: false, createdAt: now() };
  st().users.push(user);
  st().prefs[user.id] = { reminderAlerts: d.reminderAlerts !== false, reduceMotion: false };
  const target = d.targetMin ? { min: Number(d.targetMin), max: Number(d.targetMax) } : null;
  const student = addStudent(user, { name: d.studentName, age: d.studentAge, grade: d.grade + (d.section ? ` ${d.section}` : ''), school: d.school, diabetesType: d.diabetesType }, { example: !!d.loadExample, target });
  startTrial(user.id);
  commit('register');
  return { user, student };
}
export function registerTeacher(d) {
  const user = { id: uid('u'), role: 'docente', name: d.name, email: d.email.toLowerCase(), phone: '', school: d.school, grade: d.grade, subject: d.subject || '', demo: false, createdAt: now() };
  st().users.push(user);
  st().prefs[user.id] = { reminderAlerts: false, reduceMotion: false };
  commit('register');
  let link = null;
  if (d.code) link = requestLink(user, d.code);
  return { user, link };
}
export function validateEmailField(email, exceptId) {
  if (!email) return 'Ingresá tu correo electrónico.';
  if (!isEmail(email)) return 'Ingresá un correo con formato válido (ej. nombre@dominio.com).';
  if (emailTaken(email, exceptId)) return 'Ya existe una cuenta con ese correo en esta demostración.';
  return '';
}

/* ---------- Recursos ---------- */
export function setResourceRead(userId, resourceId, read) {
  const map = st().resourcesRead[userId] || (st().resourcesRead[userId] = {});
  if (read) map[resourceId] = now(); else delete map[resourceId];
  commit('resources');
}
export const isResourceRead = (userId, resourceId) => !!st().resourcesRead[userId]?.[resourceId];

/* ---------- Alertas internas de recordatorios ---------- */
export function canEditStudent(user, studentId) { return user?.role === 'familia' && canAccessStudent(user, studentId); }
export { localParts };
