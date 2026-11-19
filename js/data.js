/* =========================================================
   Consultas y reglas de acceso (selectores) sobre el estado común.
   Nota: son controles de navegación de un prototipo, no autorización segura.
   ========================================================= */
import { getState, getSession } from './store.js';
import { localParts, addDays, dayOfWeek, todayStr, normalize, fromLocal, daysBetween } from './utils.js';
import { TOPICS } from './content/topics.js';
import { completedCount } from './content/achievements.js';

export const CONTEXTS = {
  antes_comer: 'Antes de comer',
  despues_comer: 'Después de comer',
  actividad: 'Actividad física',
  otro: 'Otro',
};
export const REMINDER_CATEGORIES = {
  alimentacion: { label: 'Alimentación', icon: 'utensils', color: '#21864B' },
  actividad: { label: 'Actividad', icon: 'run', color: '#7C6BD6' },
  consulta: { label: 'Consulta', icon: 'stethoscope', color: '#0077C8' },
  medicion: { label: 'Medición', icon: 'droplet', color: '#C93C4B' },
  rutina: { label: 'Rutina indicada en el plan', icon: 'clipboard', color: '#B07A00' },
};
export const RECURRENCE = { none: 'No se repite', daily: 'Todos los días', weekdays: 'Días de semana (lunes a viernes)' };
export const INCIDENT_CATEGORIES = {
  malestar: 'Malestar durante la jornada',
  actividad: 'Situación durante actividad física',
  alimentacion: 'Alimentación o merienda',
  medicion: 'Medición fuera de la meta del plan',
  otro: 'Otra situación',
};
export const INCIDENT_STATUS = {
  registrado: { label: 'Registrado', chip: 'chip-danger' },
  visto: { label: 'Visto por familiar', chip: 'chip-info' },
  seguimiento: { label: 'Seguimiento documentado', chip: 'chip-ok' },
};

const st = () => getState();

/* ---------- Usuarios y sesión ---------- */
export const userById = (id) => st().users.find((u) => u.id === id) || null;
export function currentUser() {
  const s = getSession();
  return s.userId ? userById(s.userId) : null;
}
export const studentById = (id) => st().students.find((x) => x.id === id) || null;
export const roleLabel = (role) => ({ familia: 'Familia', docente: 'Docente' }[role] || role);

/* ---------- Estudiantes y vinculaciones ---------- */
export function activeLinks() { return st().links.filter((l) => l.status === 'activo'); }
export function linkFor(studentId, teacherId) {
  return st().links.filter((l) => l.studentId === studentId && l.teacherId === teacherId).sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''))[0] || null;
}
export function activeLink(studentId, teacherId) { return st().links.find((l) => l.studentId === studentId && l.teacherId === teacherId && l.status === 'activo') || null; }
export function linksForStudent(studentId) { return st().links.filter((l) => l.studentId === studentId); }
export function linksForTeacher(teacherId) { return st().links.filter((l) => l.teacherId === teacherId); }
export function teachersForStudent(studentId) {
  return st().links.filter((l) => l.studentId === studentId && l.status === 'activo').map((l) => userById(l.teacherId)).filter(Boolean);
}

/** Estudiantes visibles para un usuario: familia → propios; docente → vinculaciones activas. */
export function studentsForUser(user) {
  if (!user) return [];
  if (user.role === 'familia') return st().students.filter((x) => x.familyId === user.id);
  if (user.role === 'docente') {
    const ids = new Set(st().links.filter((l) => l.teacherId === user.id && l.status === 'activo').map((l) => l.studentId));
    return st().students.filter((x) => ids.has(x.id));
  }
  return [];
}
export function canAccessStudent(user, studentId) { return studentsForUser(user).some((x) => x.id === studentId); }

/** Estudiante activo (selector del encabezado) o el primero disponible. */
export function activeStudent(user) {
  const session = getSession();
  if (session.kidMode && session.kidStudentId) return studentById(session.kidStudentId);
  const list = studentsForUser(user);
  return list.find((x) => x.id === session.activeStudentId) || list[0] || null;
}

export function canSeeGlucose(user, studentId) {
  if (!user || !canAccessStudent(user, studentId)) return false;
  if (user.role === 'familia') return true;
  return !!activeLink(studentId, user.id)?.permissions?.glucose;
}
export function canSeeCalendar(user, studentId) {
  if (!user || !canAccessStudent(user, studentId)) return false;
  if (user.role === 'familia') return true;
  return !!activeLink(studentId, user.id)?.permissions?.calendar;
}

/* ---------- Plan ---------- */
export const planFor = (studentId) => st().plans.find((p) => p.studentId === studentId) || null;
export function planReadStatus(plan, teacherId) {
  if (!plan) return { key: 'none', label: 'Sin plan', chip: '' };
  const reads = (plan.readBy || []).filter((r) => r.teacherId === teacherId);
  const latest = reads.sort((a, b) => b.version - a.version)[0];
  if (latest && latest.version >= plan.version) return { key: 'leido', label: `Versión ${plan.version} leída`, chip: 'chip-ok', at: latest.at };
  if (latest) return { key: 'nueva', label: `Nueva versión (${plan.version}) sin leer`, chip: 'chip-warn' };
  return { key: 'sinleer', label: 'Plan sin leer', chip: 'chip-warn' };
}
export function planStatusLabel(plan) {
  if (!plan) return { label: 'Sin plan', chip: '' };
  if (plan.status === 'vigente') return { label: 'Plan activo', chip: 'chip-ok' };
  return { label: 'Plan en preparación', chip: 'chip-warn' };
}

/* ---------- Glucosa ---------- */
export function glucoseStatus(value, plan) {
  const t = plan?.target;
  if (!t || t.min == null || t.max == null) return { key: 'sin', label: 'Sin meta configurada', chip: '', pt: 'pt-none' };
  if (value < t.min) return { key: 'bajo', label: 'Por debajo de la meta', chip: 'chip-low', pt: 'pt-low' };
  if (value > t.max) return { key: 'alto', label: 'Por encima de la meta', chip: 'chip-high', pt: 'pt-high' };
  return { key: 'meta', label: 'Dentro de la meta', chip: 'chip-ok', pt: 'pt-ok' };
}
/** Registros de un estudiante, ordenados por fecha y hora (más reciente primero). */
export function glucoseFor(studentId, { from, to, context } = {}) {
  return st().glucose
    .filter((g) => g.studentId === studentId)
    .filter((g) => {
      const d = localParts(g.at).date;
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (context && context !== 'todos' && g.context !== context) return false;
      return true;
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}
/** Registros que un usuario puede ver (docente sin permiso: solo los que registró). */
export function visibleGlucose(user, studentId, filters) {
  const all = glucoseFor(studentId, filters);
  if (canSeeGlucose(user, studentId)) return all;
  if (user?.role === 'docente' && canAccessStudent(user, studentId)) return all.filter((g) => g.createdBy === user.id);
  return [];
}
/** Último registro determinado por fecha y hora (no por orden de carga). */
export function latestGlucose(studentId) { return glucoseFor(studentId)[0] || null; }
export function glucoseToday(studentId) { return glucoseFor(studentId, { from: todayStr(), to: todayStr() }); }

/* ---------- Recordatorios ---------- */
export function occursOn(rem, date) {
  if (date < rem.date) return false;
  if (rem.recurrence === 'none') return rem.date === date;
  if (rem.recurrence === 'daily') return true;
  if (rem.recurrence === 'weekdays') { const w = dayOfWeek(date); return w >= 1 && w <= 5; }
  return false;
}
/** Ocurrencias en una fecha para un conjunto de estudiantes. El completado es por fecha. */
export function occurrencesOn(date, studentIds) {
  const set = new Set(studentIds);
  return st().reminders
    .filter((r) => set.has(r.studentId) && occursOn(r, date))
    .map((r) => ({ reminder: r, date, done: !!r.completions?.[date], key: `${r.id}|${date}` }))
    .sort((a, b) => a.reminder.time.localeCompare(b.reminder.time));
}
export function remindersVisible(user) {
  return studentsForUser(user).filter((x) => canSeeCalendar(user, x.id)).map((x) => x.id);
}

/* ---------- Mensajes ---------- */
export const convId = (studentId, teacherId) => `${studentId}.${teacherId}`;
export function parseConvId(id) { const [studentId, teacherId] = String(id).split('.'); return { studentId, teacherId }; }
export function conversationsForUser(user) {
  if (!user) return [];
  const msgs = st().messages;
  const list = [];
  if (user.role === 'familia') {
    studentsForUser(user).forEach((s) => {
      const teacherIds = new Set(st().links.filter((l) => l.studentId === s.id && l.status === 'activo').map((l) => l.teacherId));
      msgs.filter((m) => m.studentId === s.id).forEach((m) => teacherIds.add(m.fromId === user.id ? m.toId : m.fromId));
      teacherIds.forEach((tid) => {
        const t = userById(tid);
        if (!t || t.role !== 'docente') return;
        list.push({ id: convId(s.id, tid), studentId: s.id, teacherId: tid, familyId: user.id, counterpart: t, active: !!activeLink(s.id, tid) });
      });
    });
  } else {
    studentsForUser(user).forEach((s) => {
      const fam = userById(s.familyId);
      list.push({ id: convId(s.id, user.id), studentId: s.id, teacherId: user.id, familyId: s.familyId, counterpart: fam, active: true });
    });
  }
  return list.map((c) => {
    const cm = msgs.filter((m) => m.convId === c.id).sort((a, b) => a.at.localeCompare(b.at));
    return { ...c, messages: cm, last: cm[cm.length - 1] || null, unread: cm.filter((m) => m.toId === user.id && !m.readAt).length };
  }).sort((a, b) => (b.last?.at || '').localeCompare(a.last?.at || ''));
}
export function canAccessConversation(user, id) { return conversationsForUser(user).some((c) => c.id === id); }
export function unreadMessages(user) { return st().messages.filter((m) => m.toId === user?.id && !m.readAt && canAccessConversation(user, m.convId)).length; }

/* ---------- Notificaciones ---------- */
export function notificationsFor(userId) { return st().notifications.filter((n) => n.userId === userId).sort((a, b) => b.at.localeCompare(a.at)); }
export function unreadNotifications(userId) { return notificationsFor(userId).filter((n) => !n.read).length; }

/* ---------- Incidentes y observaciones ---------- */
export function incidentsForUser(user, { studentId } = {}) {
  const ids = new Set(studentsForUser(user).map((x) => x.id));
  return st().incidents.filter((i) => ids.has(i.studentId) && (!studentId || i.studentId === studentId)).sort((a, b) => b.at.localeCompare(a.at));
}
export const incidentById = (id) => st().incidents.find((i) => i.id === id) || null;
export function observationsFor(studentId) { return st().observations.filter((o) => o.studentId === studentId).sort((a, b) => b.at.localeCompare(a.at)); }

/* ---------- Progreso educativo ---------- */
export function progressFor(studentId) {
  const p = st().progress[studentId] || { topics: {}, lessonsOpened: {}, stories: {}, achievements: {} };
  const done = completedCount(p);
  return { ...p, completed: done, total: TOPICS.length, percent: Math.round((done / TOPICS.length) * 100) };
}

/* ---------- Suscripción ---------- */
export const PLAN_PRICE = 149;
export const TRIAL_DAYS = 30;
export function subscriptionFor(familyId) {
  const sub = st().subscriptions[familyId];
  if (!sub) return { status: 'sin_plan', label: 'Sin plan', daysLeft: 0 };
  const now = new Date();
  const trialEnd = sub.trialEnd ? new Date(sub.trialEnd) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : 0;
  let status = sub.status;
  if (status === 'prueba' && trialEnd && now > trialEnd) status = 'vencido';
  if (status === 'activo' && !sub.renews && sub.activation?.nextBilling && now > new Date(sub.activation.nextBilling)) status = 'vencido';
  const inTrial = !!trialEnd && now <= trialEnd && (!sub.activation || new Date(sub.activation.billingStart) > now);
  const labels = { prueba: 'Prueba gratuita', activo: sub.renews ? 'Plan Familiar activo' : 'Activo · renovación cancelada', vencido: 'Prueba o plan vencido', sin_plan: 'Sin plan' };
  return { ...sub, status, inTrial, daysLeft, label: labels[status] || status };
}

/* ---------- Búsqueda ---------- */
export function search(user, q, extra = []) {
  const n = normalize(q).trim();
  if (!n) return [];
  const words = n.split(/\s+/);
  const match = (text) => { const t = normalize(text); return words.every((w) => t.includes(w)); };
  return extra.filter((item) => match(`${item.title} ${item.text || ''} ${item.body || ''} ${item.group || ''}`));
}

/* ---------- Varios ---------- */
export function daysSince(iso) { return daysBetween(localParts(iso).date, todayStr()); }
export function isFuture(date, time) { return fromLocal(date, time) > new Date(); }
export function weekRange() { const t = todayStr(); return { from: addDays(t, -6), to: t }; }
