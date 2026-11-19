/* =========================================================
   Estructuras de página: sitio público, área interna, modo infantil e impresión.
   ========================================================= */
import { html, raw, relTime, firstName } from '../utils.js';
import { icon } from '../icons.js';
import { dino } from '../illustrations.js';
import { getState, getSession } from '../store.js';
import {
  studentsForUser, activeStudent, unreadNotifications, notificationsFor, unreadMessages, roleLabel,
} from '../data.js';
import { login, markNotificationRead, markAllNotificationsRead, setActiveStudent } from '../actions.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { userAvatar } from './ui.js';
import { installApp } from './install.js';

export const LOGO = 'assets/img/glucokids-logo.png';
const NOTIF_ICON = { mensaje: 'message', incidente: 'siren', glucosa: 'droplet', plan: 'clipboard', vinculacion: 'link', recordatorio: 'bell', observacion: 'notebook' };

/* ---------- Sitio público ---------- */
const PUBLIC_NAV = [
  { path: '/inicio', label: 'Inicio' },
  { path: '/como-funciona', label: 'Cómo funciona' },
  { path: '/planes', label: 'Planes' },
  { path: '/recursos', label: 'Recursos' },
  { path: '/ayuda', label: 'Ayuda' },
];
export function publicShell(ctx) {
  return html`<div class="public-shell">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <header class="public-header">
      <div class="inner">
        <a class="brand-link" href="#/inicio" aria-label="GlucoKids, ir al inicio"><img src="${LOGO}" alt="GlucoKids" width="69" height="52"></a>
        <button type="button" class="btn btn-ghost btn-icon public-menu-toggle" aria-expanded="false" aria-controls="public-nav" aria-label="Abrir menú">${icon('menu')}</button>
        <nav class="public-nav" id="public-nav" aria-label="Navegación principal">
          ${PUBLIC_NAV.map((n) => html`<a class="nav-link" href="#${n.path}" ${ctx.path.startsWith(n.path) ? raw('aria-current="page"') : ''}>${n.label}</a>`)}
          <div class="nav-actions">
            ${ctx.user
              ? html`<a class="btn btn-primary" href="#/panel">${icon('home', { size: 18 })} Ir a mi panel</a>`
              : html`<a class="btn btn-secondary" href="#/login" ${ctx.path === '/login' ? raw('aria-current="page"') : ''}>Iniciar sesión</a><a class="btn btn-primary" href="#/registro" ${ctx.path === '/registro' ? raw('aria-current="page"') : ''}>Crear cuenta</a>`}
          </div>
        </nav>
      </div>
    </header>
    <main id="main" class="public-main" tabindex="-1"></main>
    <footer class="public-footer">
      <div class="inner">
        <div>
          <img src="${LOGO}" alt="GlucoKids" width="80" height="60" style="height:60px;width:auto;margin-bottom:8px">
          <p class="small muted">Educación, confianza y acompañamiento para niños con diabetes durante su jornada escolar.</p>
          <p class="xsmall muted mb-0">Prototipo de demostración con datos ficticios. No reemplaza la atención del equipo de salud ni realiza diagnósticos.</p>
        </div>
        <div><h2>Explorar</h2><ul>${PUBLIC_NAV.map((n) => html`<li><a href="#${n.path}">${n.label}</a></li>`)}</ul></div>
        <div><h2>Acceso</h2><ul><li><a href="#/login">Iniciar sesión</a></li><li><a href="#/registro">Crear cuenta</a></li><li><button type="button" class="link-btn" data-install>Instalar aplicación</button></li></ul></div>
      </div>
    </footer>
    <div class="waves-bg" aria-hidden="true"></div>
  </div>`;
}

/* ---------- Área interna ---------- */
function navItems(user) {
  if (user.role === 'familia') {
    return [
      { title: 'Principal', items: [
        { key: 'panel', path: '/panel', label: 'Inicio', icon: 'home' },
        { key: 'familia', path: '/familia', label: 'GlucoFamilia', icon: 'users' },
        { key: 'glucosa', path: '/glucosa', label: 'Registro de glucosa', icon: 'droplet' },
        { key: 'plan', path: '/plan', label: 'Plan GlucoCompartido', icon: 'clipboard' },
        { key: 'calendario', path: '/calendario', label: 'Calendario', icon: 'calendar' },
      ] },
      { title: 'Escuela', items: [
        { key: 'escuela', path: '/escuela', label: 'GlucoEscuela', icon: 'school' },
        { key: 'mensajes', path: '/mensajes', label: 'Mensajes', icon: 'message', count: 'messages' },
        { key: 'incidentes', path: '/incidentes', label: 'Incidentes', icon: 'siren' },
      ] },
      { title: 'Aprender y revisar', items: [
        { key: 'aprende', path: '/aprende', label: 'GlucoAprende', icon: 'gamepad' },
        { key: 'recursos', path: '/recursos', label: 'Recursos', icon: 'book' },
        { key: 'reportes', path: '/reportes', label: 'Reportes', icon: 'chart' },
      ] },
      { title: 'Cuenta', items: [
        { key: 'suscripcion', path: '/suscripcion', label: 'Suscripción', icon: 'card' },
        { key: 'configuracion', path: '/configuracion', label: 'Configuración', icon: 'settings' },
      ] },
    ];
  }
  return [
    { title: 'Principal', items: [
      { key: 'panel', path: '/panel', label: 'Inicio', icon: 'home' },
      { key: 'escuela', path: '/escuela', label: 'GlucoEscuela', icon: 'school' },
      { key: 'estudiantes', path: '/escuela/estudiantes', label: 'Estudiantes', icon: 'users' },
      { key: 'incidentes', path: '/incidentes', label: 'Incidentes', icon: 'siren' },
      { key: 'calendario', path: '/calendario', label: 'Calendario', icon: 'calendar' },
    ] },
    { title: 'Comunicación', items: [
      { key: 'mensajes', path: '/mensajes', label: 'Mensajes', icon: 'message', count: 'messages' },
    ] },
    { title: 'Aprender y revisar', items: [
      { key: 'aprende', path: '/aprende', label: 'GlucoAprende', icon: 'gamepad' },
      { key: 'formacion', path: '/escuela/formacion', label: 'Formación docente', icon: 'cap' },
      { key: 'recursos', path: '/recursos', label: 'Recursos', icon: 'book' },
      { key: 'reportes', path: '/reportes', label: 'Reportes', icon: 'chart' },
    ] },
    { title: 'Cuenta', items: [
      { key: 'configuracion', path: '/configuracion', label: 'Configuración', icon: 'settings' },
    ] },
  ];
}

export function appShell(ctx) {
  const { user } = ctx;
  const students = studentsForUser(user);
  const active = activeStudent(user);
  const unreadN = unreadNotifications(user.id);
  const unreadM = unreadMessages(user);
  return html`<div class="app-shell">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <aside class="sidebar" id="sidebar" aria-label="Menú de la aplicación">
      <a class="brand-link" href="#/panel" aria-label="GlucoKids, ir al inicio"><img src="${LOGO}" alt="GlucoKids" width="128" height="96"></a>
      ${navItems(user).map((g) => html`<div>
        <p class="sidebar-section-title">${g.title}</p>
        <nav class="side-nav" aria-label="${g.title}">
          ${g.items.map((it) => html`<a href="#${it.path}" ${ctx.navKey === it.key ? raw('aria-current="page"') : ''}>${icon(it.icon)}<span>${it.label}</span>${it.count === 'messages' ? html`<span class="nav-count chip chip-solid ${unreadM ? '' : 'hidden-count'}" data-count="messages" ${unreadM ? '' : raw('hidden')}>${unreadM}<span class="sr-only"> sin leer</span></span>` : ''}</a>`)}
        </nav>
      </div>`)}
      <div class="sidebar-footer">
        <div class="card card-tight tone-familia install-card">
          <div class="row" style="gap:10px;flex-wrap:nowrap"><span class="card-icon green">${icon('install')}</span><div><strong class="small" style="display:block;color:var(--blue-dark)">PWA</strong><span class="xsmall muted">Instalá la app en tu dispositivo</span></div></div>
          <button type="button" class="btn btn-sm btn-block mt-2" data-install>${icon('download', { size: 16 })} Instalar aplicación</button>
        </div>
      </div>
    </aside>
    <div class="sidebar-backdrop" data-close-sidebar></div>
    <div class="app-main">
      <header class="topbar">
        <button type="button" class="btn btn-ghost btn-icon menu-toggle" aria-expanded="false" aria-controls="sidebar" aria-label="Abrir menú">${icon('menu')}</button>
        <a class="topbar-brand" href="#/panel" aria-label="GlucoKids, inicio"><img src="${LOGO}" alt="" width="53" height="40"></a>
        <form class="search-form" role="search" data-search>
          <label class="sr-only" for="global-search">Buscar en la plataforma</label>
          <div class="input-group">${raw(`<span class="lead-icon">${icon('search', { size: 18 })}</span>`)}<input class="input" id="global-search" name="q" type="search" placeholder="Buscar en la plataforma…" value="${ctx.route?.key === 'buscar' ? (ctx.query.q || '') : ''}" autocomplete="off"></div>
        </form>
        <div class="topbar-actions">
          ${students.length ? html`<div class="student-switch">
            ${students.length > 1
              ? html`<label class="sr-only" for="student-select">Estudiante activo</label>
                <select id="student-select" class="select select-sm" data-student-select>${students.map((s) => html`<option value="${s.id}" ${s.id === active?.id ? raw('selected') : ''}>${s.name}</option>`)}</select>`
              : html`<span class="chip chip-info">${icon('user', { size: 14 })}${active?.name}</span>`}
          </div>` : html`<span class="chip">Sin estudiantes vinculados</span>`}
          <div class="popover-wrap">
            <button type="button" class="btn btn-ghost btn-icon icon-btn" data-bell aria-expanded="false" aria-haspopup="true" aria-label="Notificaciones${unreadN ? `, ${unreadN} sin leer` : ''}">
              ${icon('bell')}<span class="counter" data-count="notifications" ${unreadN ? '' : raw('hidden')}>${unreadN}</span>
            </button>
            <div class="popover" data-bell-panel hidden></div>
          </div>
          <div class="popover-wrap">
            <button type="button" class="btn btn-ghost profile-btn" data-profile aria-expanded="false" aria-haspopup="true" aria-label="Menú de perfil de ${user.name}">
              ${userAvatar(user)}<span class="profile-name">${firstName(user.name)}</span>${icon('chev-down', { size: 16 })}
            </button>
            <div class="popover popover-menu" data-profile-panel hidden>
              <div class="popover-header"><div><strong style="display:block;color:var(--blue-dark)">${user.name}</strong><span class="xsmall muted">${roleLabel(user.role)} · ${user.email}</span></div></div>
              <div class="menu-sep"></div>
              <a class="menu-item" href="#/configuracion">${icon('settings')} Configuración</a>
              ${students.length ? html`<a class="menu-item" href="#/aprende?ninos=1">${icon('gamepad')} Abrir modo infantil</a>` : ''}
              <button type="button" class="menu-item" data-switch-account>${icon('swap')} Cambiar cuenta demo</button>
              <div class="menu-sep"></div>
              <a class="menu-item" href="#/salir">${icon('logout')} Cerrar sesión</a>
            </div>
          </div>
        </div>
      </header>
      <main id="main" class="app-content" tabindex="-1"></main>
    </div>
    <div class="waves-bg" aria-hidden="true"></div>
  </div>`;
}

/* ---------- Modo infantil ---------- */
export function kidShell(ctx) {
  const student = ctx.student;
  const items = [
    { path: '/ninos', label: 'Mis temas', icon: 'gamepad', key: 'ninos' },
    { path: '/ninos/cuento/gluki-recreo', label: 'Cuento', icon: 'book', key: 'ninos-cuento' },
    { path: '/ninos/logros', label: 'Mis logros', icon: 'trophy', key: 'ninos-logros' },
  ];
  return html`<div class="kid-shell">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <header class="kid-topbar">
      <div class="kid-hello">${dino({ mood: 'happy', size: 48 })}<span>¡Hola, ${firstName(student?.name)}!</span></div>
      <nav class="kid-nav" aria-label="Modo infantil">
        ${items.map((i) => html`<a href="#${i.path}" ${ctx.navKey === i.key ? raw('aria-current="page"') : ''}>${icon(i.icon)}${i.label}</a>`)}
        <button type="button" class="btn btn-secondary" data-exit-kid>${icon('lock', { size: 18 })} Salir</button>
      </nav>
    </header>
    <main id="main" class="kid-content" tabindex="-1"></main>
    <div class="waves-bg" aria-hidden="true"></div>
  </div>`;
}

export function printShell() {
  return html`<main id="main" class="print-shell" tabindex="-1"></main>`;
}

export function demoBadge(kidMode) {
  return html`<div class="demo-badge no-print" role="note">${icon('info', { size: 14 })}<span>Demostración · datos ficticios</span>${kidMode ? '' : html`<button type="button" data-switch-account aria-label="Cambiar cuenta demo">Cuentas demo</button>`}</div>`;
}

/* ---------- Comportamiento del shell ---------- */
export function bindShell(root, ctx) {
  const closeAll = () => {
    root.querySelectorAll('[data-bell-panel], [data-profile-panel]').forEach((p) => { p.hidden = true; });
    root.querySelectorAll('[data-bell], [data-profile]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  };
  // Menú público (móvil)
  const pToggle = root.querySelector('.public-menu-toggle');
  if (pToggle) {
    const nav = root.querySelector('#public-nav');
    pToggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      pToggle.setAttribute('aria-expanded', String(open));
      pToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
  }
  // Barra lateral (móvil)
  const sidebar = root.querySelector('#sidebar');
  const toggle = root.querySelector('.menu-toggle');
  const backdrop = root.querySelector('.sidebar-backdrop');
  const setSidebar = (open) => {
    sidebar?.classList.toggle('open', open);
    backdrop?.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) sidebar?.querySelector('a')?.focus();
  };
  toggle?.addEventListener('click', () => setSidebar(!sidebar.classList.contains('open')));
  backdrop?.addEventListener('click', () => setSidebar(false));
  sidebar?.addEventListener('click', (e) => { if (e.target.closest('a')) setSidebar(false); });

  // Selector de estudiante
  root.querySelector('[data-student-select]')?.addEventListener('change', (e) => {
    setActiveStudent(e.target.value);
    ctx.refresh();
    toast(`Mostrando la información de ${e.target.selectedOptions[0].textContent}.`, { type: 'info' });
  });

  // Búsqueda
  root.querySelector('[data-search]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    ctx.go(`/buscar${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  });

  // Notificaciones
  const bell = root.querySelector('[data-bell]');
  const panel = root.querySelector('[data-bell-panel]');
  bell?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.hidden;
    closeAll();
    if (open) { renderBellPanel(panel, ctx); panel.hidden = false; bell.setAttribute('aria-expanded', 'true'); panel.querySelector('button, a')?.focus(); }
  });
  // Perfil
  const prof = root.querySelector('[data-profile]');
  const profPanel = root.querySelector('[data-profile-panel]');
  prof?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = profPanel.hidden;
    closeAll();
    if (open) { profPanel.hidden = false; prof.setAttribute('aria-expanded', 'true'); profPanel.querySelector('a, button')?.focus(); }
  });
  root.addEventListener('click', (e) => {
    if (!e.target.closest('.popover') && !e.target.closest('[data-bell]') && !e.target.closest('[data-profile]')) closeAll();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openBtn = root.querySelector('[data-bell][aria-expanded="true"], [data-profile][aria-expanded="true"]');
      if (openBtn) { closeAll(); openBtn.focus(); }
      if (sidebar?.classList.contains('open')) { setSidebar(false); toggle?.focus(); }
    }
  });
  root.querySelectorAll('[data-install]').forEach((b) => b.addEventListener('click', () => installApp()));
  root.querySelectorAll('[data-switch-account]').forEach((b) => b.addEventListener('click', () => { closeAll(); openAccountSwitcher(ctx); }));

  // Sombra del encabezado al desplazarse
  const topbar = root.querySelector('.topbar');
  if (topbar) {
    const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 4);
    window.removeEventListener('scroll', window.__gkScroll || (() => {}));
    window.__gkScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

function renderBellPanel(panel, ctx) {
  const list = notificationsFor(ctx.user.id).slice(0, 8);
  const unread = unreadNotifications(ctx.user.id);
  panel.innerHTML = String(html`
    <div class="popover-header"><h2>Notificaciones</h2>${unread ? html`<button type="button" class="link-btn small" data-read-all>Marcar todas como leídas</button>` : ''}</div>
    ${list.length ? html`<ul class="list" style="padding:0 4px">${list.map((n) => html`<li style="padding:2px 0;border:0">
        <div class="notif-item ${n.read ? '' : 'unread'}" style="width:100%">
          <span class="card-icon ${n.type === 'incidente' ? 'red' : n.type === 'glucosa' ? 'yellow' : ''}" style="width:36px;height:36px">${icon(NOTIF_ICON[n.type] || 'bell', { size: 18 })}</span>
          <button type="button" class="notif-main" data-open-notif="${n.id}"><span class="notif-title">${n.read ? '' : html`<span class="badge-dot" style="margin-right:6px"></span><span class="sr-only">Sin leer: </span>`}${n.title}</span><span class="notif-text">${n.body}</span><span class="notif-time">${relTime(n.at)}</span></button>
          ${n.read ? '' : html`<button type="button" class="btn btn-ghost btn-icon btn-sm" data-read-notif="${n.id}" aria-label="Marcar como leída: ${n.title}">${icon('check', { size: 16 })}</button>`}
        </div></li>`)}</ul>`
      : html`<div class="empty-state" style="padding:16px">${icon('bell', { size: 28 })}<p>No tenés notificaciones.</p></div>`}
    <div class="menu-sep"></div>
    <a class="menu-item" href="#/notificaciones">${icon('list')} Ver todas las notificaciones</a>`);
  panel.querySelector('[data-read-all]')?.addEventListener('click', (e) => { e.stopPropagation(); markAllNotificationsRead(ctx.user.id); ctx.refresh(); });
  panel.querySelectorAll('[data-read-notif]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation(); markNotificationRead(b.dataset.readNotif); renderBellPanel(panel, ctx); updateCounters(ctx.user);
  }));
  panel.querySelectorAll('[data-open-notif]').forEach((b) => b.addEventListener('click', () => {
    const n = getState().notifications.find((x) => x.id === b.dataset.openNotif);
    if (!n) return;
    markNotificationRead(n.id);
    if (n.route) ctx.go(n.route); else ctx.refresh();
  }));
}

/** Actualiza contadores del encabezado sin volver a dibujar la página. */
export function updateCounters(user) {
  if (!user) return;
  const n = unreadNotifications(user.id);
  const m = unreadMessages(user);
  document.querySelectorAll('[data-count="notifications"]').forEach((el) => { el.textContent = n; el.hidden = !n; });
  document.querySelectorAll('[data-count="messages"]').forEach((el) => { el.innerHTML = `${m}<span class="sr-only"> sin leer</span>`; el.hidden = !m; });
  const bell = document.querySelector('[data-bell]');
  if (bell) bell.setAttribute('aria-label', `Notificaciones${n ? `, ${n} sin leer` : ''}`);
}

/* ---------- Cambio de cuenta demo ---------- */
export function openAccountSwitcher(ctx) {
  const users = getState().users;
  const current = getSession().userId;
  const main = users.filter((u) => u.demo);
  const others = users.filter((u) => !u.demo);
  const item = (u) => html`<button type="button" class="choice" data-login="${u.id}" ${u.id === current ? raw('aria-current="true"') : ''} style="width:100%;text-align:left">
      ${userAvatar(u, '')}<span class="grow"><span class="choice-title">${u.name}${u.id === current ? ' · sesión actual' : ''}</span><span class="choice-sub">${roleLabel(u.role)} · ${u.email}</span></span>${icon('chev-right')}
    </button>`;
  openModal({
    title: 'Cambiar cuenta demo',
    tag: 'Demostración',
    body: html`<div class="stack">
      <p class="mb-0 muted">Los cambios compartidos (mensajes, incidentes, vinculaciones) se conservan al cambiar de cuenta. Todo ocurre en este navegador.</p>
      <h3 class="mb-0">Cuentas demo principales</h3>
      <div class="stack-sm">${main.map(item)}</div>
      ${others.length ? html`<h3 class="mb-0">Otras cuentas ficticias</h3><div class="stack-sm">${others.map(item)}</div>` : ''}
    </div>`,
    onMount: (el, close) => {
      el.querySelectorAll('[data-login]').forEach((b) => b.addEventListener('click', () => {
        const u = login(b.dataset.login);
        close();
        toast(`Ahora estás como ${u.name} (${roleLabel(u.role).toLowerCase()}).`, { type: 'success', title: 'Cuenta cambiada' });
        ctx.go('/panel', { force: true });
      }));
    },
  });
}
