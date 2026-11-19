/* =========================================================
   Enrutador por hash (#/ruta) con comprobaciones de acceso por perfil.
   IMPORTANTE: estas comprobaciones son controles de navegación de un prototipo
   (todo el estado vive en el navegador); no son una autorización segura de producción.
   Funcionan también cuando se escribe una ruta directamente en la barra de direcciones.
   ========================================================= */
import { html } from './utils.js';
import { getSession, setSession } from './store.js';
import { currentUser, activeStudent, canAccessStudent } from './data.js';
import { publicShell, appShell, kidShell, printShell, demoBadge, bindShell } from './components/shell.js';
import { toast } from './components/toast.js';
import { sessionSet } from './store.js';

let routes = [];
let appEl = null;
let hooks = {};
let rendering = false;
let lastPath = null;

function compile(path) {
  const keys = [];
  const re = new RegExp(`^${path.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; })}/?$`);
  return { re, keys };
}

export function initRouter({ el, routeList, onAfterRender }) {
  appEl = el;
  routes = routeList.map((r) => ({ ...r, ...compile(r.path) }));
  hooks = { onAfterRender };
  window.addEventListener('hashchange', () => render());
  render();
}

export function parseHash() {
  const h = decodeURIComponent(location.hash.slice(1) || '/');
  const [p, q = ''] = h.split('?');
  return { path: p || '/', query: Object.fromEntries(new URLSearchParams(q)) };
}

/** Navega a una ruta interna. */
export function go(path, { replace = false, force = false } = {}) {
  const target = `#${path}`;
  let current = location.hash;
  try { current = decodeURIComponent(location.hash); } catch { /* */ }
  if (current === target || location.hash === target) { render({ refresh: !force }); return; }
  if (replace) { history.replaceState(null, '', target); render(); } else { location.hash = target; }
}
export function refresh() { render({ refresh: true }); }

function match(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { route: r, params };
    }
  }
  return null;
}

function buildCtx(path, query, route, params, isRefresh) {
  const user = currentUser();
  const session = getSession();
  const ctx = {
    path, query, params, route, user, session, isRefresh,
    kid: !!session.kidMode,
    student: user ? activeStudent(user) : null,
    go, refresh,
  };
  ctx.navKey = typeof route?.nav === 'function' ? route.nav(ctx) : route?.nav;
  return ctx;
}

export function render(opts = {}) {
  if (rendering) return;
  rendering = true;
  try { doRender(opts); } finally { rendering = false; }
}

function doRender({ refresh: isRefresh = false } = {}) {
  const { path, query } = parseHash();
  const found = match(path);
  const route = found?.route || routes.find((r) => r.key === 'notfound');
  const params = found?.params || {};
  const ctx = buildCtx(path, query, route, params, isRefresh || lastPath === path);
  const { user, kid } = ctx;

  /* ---------- Comprobaciones de acceso ---------- */
  if (route.redirect) { const to = typeof route.redirect === 'function' ? route.redirect(ctx) : route.redirect; return deferGo(to); }
  if (kid && !route.kid && route.key !== 'salir') {
    if (!isRefresh) toast('Estás en el modo infantil. Para salir, usá el botón "Salir" y pedí ayuda a un adulto.', { type: 'info' });
    return deferGo('/ninos');
  }
  if (route.kid && !kid) return deferGo(user ? '/aprende' : '/login');
  if (route.auth && !user) {
    sessionSet('redirect', path + (Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''));
    toast('Iniciá sesión para continuar. Podés usar las cuentas demo.', { type: 'info' });
    return deferGo('/login');
  }
  if (route.guestOnly && user) return deferGo('/panel');

  let view = route;
  let denied = null;
  if (route.roles && user && !route.roles.includes(user.role)) denied = route.deniedReason || 'Esta sección no está disponible para tu perfil.';
  if (!denied && route.access) {
    const res = route.access(ctx);
    if (res !== true) denied = typeof res === 'string' ? res : 'No tenés acceso a esta información.';
  }
  if (denied) view = { ...routes.find((r) => r.key === 'forbidden'), reason: denied, shell: user ? 'app' : 'public' };
  // Si la ruta trae un estudiante concreto, el selector del encabezado se sincroniza con él
  if (!denied && user && !kid && params.sid && canAccessStudent(user, params.sid)) {
    setSession({ activeStudentId: params.sid });
    ctx.student = activeStudent(user);
  }

  /* ---------- Shell ---------- */
  let shellType = view.shell || 'public';
  if (shellType === 'auto') shellType = user ? 'app' : 'public';
  if (kid) shellType = 'kid';
  const shellHtml = { public: publicShell, app: appShell, kid: kidShell, print: printShell }[shellType](ctx);

  const scrollY = window.scrollY;
  const wrap = document.createElement('div');
  wrap.className = `shell-root shell-${shellType}`;
  wrap.innerHTML = String(html`${shellHtml}${shellType === 'print' ? '' : demoBadge(kid)}`);
  appEl.replaceChildren(wrap);
  bindShell(wrap, ctx);

  const main = wrap.querySelector('#main');
  const page = document.createElement('div');
  page.className = isRefresh ? 'page no-anim' : 'page';
  main.appendChild(page);
  try {
    page.innerHTML = String(view.view({ ...ctx, reason: view.reason }));
    view.mount?.(page, { ...ctx, reason: view.reason });
  } catch (err) {
    console.error(err);
    page.innerHTML = String(html`<div class="card"><h1>Ocurrió un problema al mostrar esta pantalla</h1><p>Recargá la página o volvé al inicio. Detalle técnico: ${err.message}</p><a class="btn btn-primary" href="#/panel">Volver al inicio</a></div>`);
  }

  const title = typeof view.title === 'function' ? view.title(ctx) : view.title;
  document.title = title ? `${title} · GlucoKids` : 'GlucoKids';

  if (isRefresh || lastPath === path) {
    window.scrollTo(0, scrollY);
  } else {
    window.scrollTo(0, 0);
    const h = page.querySelector('[data-page-title]') || page.querySelector('h1');
    if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    else main.focus({ preventScroll: true });
  }
  lastPath = path;
  hooks.onAfterRender?.(ctx);
}

function deferGo(to) {
  history.replaceState(null, '', `#${to}`);
  // se ejecuta tras liberar el bloqueo de renderizado
  setTimeout(() => render(), 0);
}

export function routeTo(path) { go(path); }
