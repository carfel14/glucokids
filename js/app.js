/* =========================================================
   GlucoKids · Inicialización y coordinación de la aplicación.
   ========================================================= */
import { initStore, subscribe, commit, getSession, sessionGet, sessionSet } from './store.js';
import { initRouter, refresh } from './router.js';
import { currentUser, studentsForUser, occurrencesOn, studentById } from './data.js';
import { notify, getPref, exitKidMode } from './actions.js';
import { todayStr, nowTimeStr, firstName } from './utils.js';
import { toast } from './components/toast.js';
import { updateCounters } from './components/shell.js';
import { initInstall } from './components/install.js';

import { landing, comoFunciona, planesPublic, ayuda, notFound, forbidden } from './pages/public.js';
import { loginPage, registerPage, logoutRoute } from './pages/auth.js';
import { panel, notificaciones, buscar } from './pages/dashboard.js';
import { familiaHome } from './pages/familia.js';
import { glucosaPage } from './pages/glucosa.js';
import { planPage, planPrint, planRedirect, planAccess } from './pages/plan.js';
import { escuelaHome, estudiantesPage, fichaPage, fichaAccess, formacionPage } from './pages/escuela.js';
import { incidentesList, incidenteNuevo, incidenteDetalle, incidentAccess } from './pages/incidentes.js';
import { mensajesPage, convAccess } from './pages/mensajes.js';
import { aprendeHome, leccion, quizPage, cuentoPage, logrosPage, openParentGate } from './pages/aprende.js';
import { calendarioPage } from './pages/calendario.js';
import { recursosPage, recursoDetalle } from './pages/recursos.js';
import { reportesPage } from './pages/reportes.js';
import { configPage } from './pages/configuracion.js';
import { suscripcionPage, pagoPage } from './pages/suscripcion.js';

/* ---------- Rutas ---------- */
const P = (path, page, extra = {}) => ({ path, shell: 'public', ...page, ...extra });
const A = (path, page, extra = {}) => ({ path, auth: true, shell: 'app', ...page, ...extra });
const K = (path, page, extra = {}) => ({ path, auth: true, kid: true, shell: 'kid', ...page, ...extra });
const ONLY_FAMILY = 'Esta sección es para familias. Como docente, coordiná con las familias desde Mensajes y GlucoEscuela.';
const ONLY_TEACHER = 'Esta sección es exclusiva del perfil docente. Como familia podés consultar la información escolar de tu hijo o hija en GlucoEscuela.';

const routes = [
  { path: '/', redirect: (ctx) => (ctx.user ? '/panel' : '/inicio') },
  P('/inicio', landing),
  P('/como-funciona', comoFunciona),
  P('/planes', planesPublic),
  P('/ayuda', ayuda, { shell: 'auto' }),
  P('/recursos', recursosPage, { shell: 'auto' }),
  P('/recursos/:id', recursoDetalle, { shell: 'auto' }),
  P('/login', loginPage),
  P('/registro', registerPage),
  { path: '/salir', key: 'salir', ...logoutRoute },

  A('/panel', panel),
  A('/notificaciones', notificaciones),
  A('/buscar', buscar),
  A('/familia', familiaHome, { roles: ['familia'], deniedReason: ONLY_FAMILY }),
  A('/glucosa', glucosaPage),
  { path: '/plan', redirect: planRedirect.redirect },
  A('/plan/:sid', planPage, { access: planAccess }),
  A('/plan/:sid/imprimir', planPrint, { access: planAccess, shell: 'print' }),
  A('/escuela', escuelaHome),
  A('/escuela/estudiantes', estudiantesPage, { roles: ['docente'], deniedReason: ONLY_TEACHER }),
  A('/escuela/estudiante/:sid', fichaPage, { roles: ['docente'], deniedReason: ONLY_TEACHER, access: fichaAccess }),
  A('/escuela/formacion', formacionPage, { roles: ['docente'], deniedReason: ONLY_TEACHER }),
  A('/incidentes', incidentesList),
  A('/incidentes/nuevo', incidenteNuevo, { roles: ['docente'], deniedReason: 'Solo el perfil docente registra incidentes escolares. Como familia podés verlos y documentar el seguimiento.' }),
  A('/incidentes/:id', incidenteDetalle, { access: incidentAccess }),
  A('/mensajes', mensajesPage),
  A('/mensajes/:cid', mensajesPage, { access: convAccess }),
  A('/aprende', aprendeHome),
  A('/aprende/tema/:tid', leccion),
  A('/aprende/tema/:tid/quiz', quizPage),
  A('/aprende/cuento/:id', cuentoPage),
  A('/aprende/logros', logrosPage),
  K('/ninos', aprendeHome, { nav: 'ninos' }),
  K('/ninos/tema/:tid', leccion, { nav: 'ninos' }),
  K('/ninos/tema/:tid/quiz', quizPage, { nav: 'ninos' }),
  K('/ninos/cuento/:id', cuentoPage),
  K('/ninos/logros', logrosPage),
  A('/calendario', calendarioPage),
  A('/reportes', reportesPage),
  A('/configuracion', configPage),
  A('/suscripcion', suscripcionPage, { roles: ['familia'], deniedReason: ONLY_FAMILY }),
  A('/suscripcion/pago', pagoPage, { roles: ['familia'], deniedReason: ONLY_FAMILY }),
  { path: '/__forbidden', key: 'forbidden', ...forbidden },
  { path: '/__notfound', key: 'notfound', ...notFound },
];

/* ---------- Preferencias visuales ---------- */
function applyPrefs() {
  const u = currentUser();
  document.documentElement.classList.toggle('reduce-motion', !!(u && getPref(u.id, 'reduceMotion', false)));
}

function onAfterRender(ctx) {
  applyPrefs();
  document.querySelectorAll('[data-exit-kid]').forEach((b) => b.addEventListener('click', () => openParentGate(ctx, () => {
    exitKidMode();
    toast('Saliste del modo infantil.', { type: 'info' });
    ctx.go('/aprende');
  })));
}

/* ---------- Avisos internos de recordatorios (solo con la app abierta) ---------- */
function checkReminders() {
  const user = currentUser();
  if (!user || user.role !== 'familia' || getSession().kidMode) return;
  if (!getPref(user.id, 'reminderAlerts', true)) return;
  const now = nowTimeStr();
  const today = todayStr();
  const alerted = new Set(sessionGet('alerted', []));
  const due = occurrencesOn(today, studentsForUser(user).map((s) => s.id)).filter((o) => !o.done && o.reminder.time <= now && o.reminder.time >= minusMinutes(now, 2) && !alerted.has(o.key));
  if (!due.length) return;
  due.forEach((o) => {
    alerted.add(o.key);
    const s = studentById(o.reminder.studentId);
    notify(user.id, { type: 'recordatorio', title: `Recordatorio: ${o.reminder.title}`, body: `${firstName(s.name)} · ${o.reminder.time} h`, route: '/calendario' });
    toast(`${firstName(s.name)} · ${o.reminder.time} h`, { type: 'warn', title: `Recordatorio: ${o.reminder.title}`, action: { label: 'Ver calendario', onClick: () => { location.hash = '#/calendario'; } } });
  });
  sessionSet('alerted', [...alerted]);
  commit('reminder-alert');
}
function minusMinutes(hhmm, n) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = Math.max(0, h * 60 + m - n);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/* ---------- Arranque ---------- */
function start() {
  const { memoryOnly } = initStore();
  initInstall();
  applyPrefs();
  initRouter({ el: document.getElementById('app'), routeList: routes, onAfterRender });
  subscribe((reason) => {
    if (reason === 'external') refresh();
    else updateCounters(currentUser());
    if (reason === 'storage-error') toast('No se pudo guardar en el almacenamiento local. Los cambios se mantienen solo en memoria.', { type: 'warn' });
  });
  if (memoryOnly) toast('El almacenamiento local no está disponible. Podés continuar, pero los cambios se perderán al recargar.', { type: 'warn', title: 'Modo temporal en memoria', duration: 8000 });
  setInterval(checkReminders, 30000);
  setTimeout(checkReminders, 3000);
  window.addEventListener('offline', () => toast('Sin conexión. GlucoKids sigue funcionando con los datos locales.', { type: 'warn' }));
  window.addEventListener('online', () => toast('Conexión restablecida.', { type: 'info' }));

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('No se pudo registrar el service worker', err));
  }
}

start();
