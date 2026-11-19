/* =========================================================
   Configuración y controles de demostración (RF-15).
   ========================================================= */
import { html, raw, formData, fmtDate, fmtDateTime, firstName, plural, money } from '../utils.js';
import { icon } from '../icons.js';
import { resetDemo, isMemoryOnly, clearSession } from '../store.js';
import {
  studentsForUser, linksForStudent, linksForTeacher, userById, studentById, subscriptionFor, planFor, planReadStatus, PLAN_PRICE,
} from '../data.js';
import {
  updateProfile, validateEmailField, addStudent, updateStudent, validateStudent, approveLink, rejectLink, revokeLink,
  setLinkPermission, setPref, getPref, createInvite, activeInvite,
} from '../actions.js';
import { pageHeader, emptyState, notice, studentAvatar, userAvatar, tabsNav } from '../components/ui.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, select, showErrors, liveClear } from '../components/forms.js';
import { openAccountSwitcher } from '../components/shell.js';
import { GRADES, DIABETES_TYPES } from './auth.js';
import { openKidModeDialog } from './aprende.js';

function tabs(user) {
  const t = [
    { id: 'perfil', label: 'Perfil', icon: 'user' },
    { id: 'estudiantes', label: 'Estudiantes', icon: 'users' },
    { id: 'permisos', label: user.role === 'familia' ? 'Permisos compartidos' : 'Vinculaciones', icon: 'link' },
    { id: 'preferencias', label: 'Preferencias', icon: 'settings' },
  ];
  if (user.role === 'familia') t.push({ id: 'suscripcion', label: 'Plan', icon: 'card' });
  t.push({ id: 'demo', label: 'Demostración', icon: 'refresh' });
  return t;
}

export const configPage = {
  title: 'Configuración', nav: 'configuracion',
  view: (ctx) => {
    const { user } = ctx;
    const list = tabs(user);
    const tab = list.some((t) => t.id === ctx.query.tab) ? ctx.query.tab : 'perfil';
    const body = { perfil: perfilTab, estudiantes: estudiantesTab, permisos: permisosTab, preferencias: prefsTab, suscripcion: planTab, demo: demoTab }[tab](ctx);
    return html`${pageHeader({ title: 'Configuración', sub: `${user.name} · ${user.role === 'familia' ? 'Familia' : 'Docente'}` })}
      ${tabsNav(list, tab, '/configuracion')}
      <div data-tab="${tab}">${body}</div>`;
  },
  mount: (el, ctx) => {
    const { user } = ctx;
    // Perfil
    const pf = el.querySelector('[data-profile-form]');
    if (pf) {
      liveClear(pf);
      pf.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = formData(pf);
        const errors = { name: !d.name || d.name.length < 3 ? 'Escribí tu nombre completo.' : '', email: validateEmailField(d.email, user.id) };
        if (d.phone && d.phone.replace(/\D/g, '').length < 8) errors.phone = 'Mínimo 8 dígitos.';
        if (user.role === 'docente' && !d.school) errors.school = 'Indicá el centro educativo.';
        if (showErrors(pf, errors)) return;
        updateProfile(user.id, { ...d, email: d.email.toLowerCase() });
        toast('Perfil actualizado.', { type: 'success' });
        ctx.refresh();
      });
    }
    // Estudiantes
    el.querySelector('[data-add-student]')?.addEventListener('click', () => openStudentForm(ctx));
    el.querySelectorAll('[data-edit-student]').forEach((b) => b.addEventListener('click', () => openStudentForm(ctx, studentById(b.dataset.editStudent))));
    // Permisos
    el.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => { approveLink(user, b.dataset.approve); toast('Acceso autorizado.', { type: 'success' }); ctx.refresh(); }));
    el.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => { rejectLink(user, b.dataset.reject); toast('Solicitud rechazada.', { type: 'info' }); ctx.refresh(); }));
    el.querySelectorAll('[data-revoke]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Revocar acceso', message: 'El docente dejará de ver al estudiante, su plan, sus registros y la conversación, incluso escribiendo la ruta directamente.', confirmLabel: 'Revocar', danger: true });
      if (!ok) return;
      revokeLink(user, b.dataset.revoke); toast('Acceso revocado.', { type: 'success' }); ctx.refresh();
    }));
    el.querySelectorAll('[data-perm]').forEach((c) => c.addEventListener('change', () => {
      const [linkId, key] = c.dataset.perm.split('|');
      setLinkPermission(user, linkId, key, c.checked);
      toast(c.checked ? 'Permiso concedido.' : 'Permiso retirado.', { type: 'success' });
      ctx.refresh();
    }));
    el.querySelectorAll('[data-invite]').forEach((b) => b.addEventListener('click', () => { const inv = createInvite(user, b.dataset.invite); toast(`Código ${inv.code} generado.`, { type: 'success' }); ctx.refresh(); }));
    // Preferencias
    el.querySelectorAll('[data-pref]').forEach((c) => c.addEventListener('change', () => {
      setPref(user.id, c.dataset.pref, c.checked);
      if (c.dataset.pref === 'reduceMotion') document.documentElement.classList.toggle('reduce-motion', c.checked);
      toast('Preferencia guardada.', { type: 'success' });
    }));
    // Demostración
    el.querySelector('[data-switch]')?.addEventListener('click', () => openAccountSwitcher(ctx));
    el.querySelector('[data-kid]')?.addEventListener('click', () => openKidModeDialog(ctx));
    el.querySelector('[data-logout]')?.addEventListener('click', () => ctx.go('/salir'));
    el.querySelector('[data-reset]')?.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Reiniciar datos demo', message: 'Se borrarán únicamente las claves de GlucoKids (glucokids.*) de este navegador y se restaurará el conjunto inicial de datos ficticios. Las cuentas creadas y los cambios se perderán. También se cerrará la sesión.', confirmLabel: 'Reiniciar demostración', danger: true });
      if (!ok) return;
      resetDemo();
      clearSession();
      toast('Se restauraron los datos iniciales de la demostración.', { type: 'success', title: 'Demostración reiniciada' });
      ctx.go('/login');
    });
  },
};

function perfilTab({ user }) {
  return html`<section class="card" style="max-width:760px">
    <div class="row mb-0" style="margin-bottom:16px">${userAvatar(user, 'avatar-lg')}<div><h2 class="h3 mb-0">${user.name}</h2><span class="small muted">Cuenta ${user.demo ? 'demo' : 'creada en este navegador'} · desde ${fmtDate(user.createdAt)}</span></div></div>
    <form class="form" novalidate data-profile-form>
      <div class="form-grid">
        ${field({ name: 'name', label: 'Nombre completo', value: user.name, required: true })}
        ${field({ name: 'email', label: 'Correo electrónico', type: 'email', value: user.email, required: true })}
        ${field({ name: 'phone', label: 'Teléfono (ficticio)', type: 'tel', value: user.phone || '' })}
        ${user.role === 'familia' ? field({ name: 'relation', label: 'Relación con los estudiantes', value: user.relation || '' }) : field({ name: 'school', label: 'Centro educativo', value: user.school || '', required: true })}
        ${user.role === 'docente' ? html`${field({ name: 'grade', label: 'Grado o grupo', value: user.grade || '' })}${field({ name: 'subject', label: 'Asignatura o rol', value: user.subject || '' })}` : ''}
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit">${icon('check')} Guardar cambios</button></div>
    </form>
  </section>`;
}

function estudiantesTab({ user }) {
  const list = studentsForUser(user);
  if (user.role === 'docente') {
    return html`<section class="card"><div class="card-header"><h2 class="h3">Estudiantes vinculados</h2><a class="actions btn btn-secondary btn-sm" href="#/escuela?vincular=1">${icon('link', { size: 16 })} Vincular con código</a></div>
      ${list.length ? html`<ul class="list">${list.map((s) => html`<li>${studentAvatar(s, 'avatar-sm')}<span class="grow"><strong>${s.name}</strong><br><span class="xsmall muted">${s.grade} · familia: ${userById(s.familyId)?.name}</span></span><a class="btn btn-sm" href="#/escuela/estudiante/${s.id}">Ficha</a></li>`)}</ul>` : emptyState({ ic: 'users', title: 'Sin estudiantes vinculados' })}
      <p class="xsmall muted mb-0">Los datos del estudiante solo los edita la familia.</p></section>`;
  }
  return html`<section class="card"><div class="card-header"><h2 class="h3">Estudiantes de tu cuenta</h2><span class="actions"><button type="button" class="btn btn-primary btn-sm" data-add-student>${icon('plus', { size: 16 })} Agregar estudiante</button></span></div>
    ${notice('Usá solo datos ficticios. Pedimos lo mínimo necesario para la demostración.', 'warn', 'shield')}
    ${list.length ? html`<ul class="list mt-4">${list.map((s) => html`<li>${studentAvatar(s)}<span class="grow"><strong>${s.name}</strong><br><span class="small muted">${s.age} años · ${s.grade} · ${s.school} · Diabetes ${s.diabetesType.toLowerCase()}</span></span><button type="button" class="btn btn-sm" data-edit-student="${s.id}">${icon('pencil', { size: 16 })} Editar</button></li>`)}</ul>`
      : emptyState({ ic: 'user-plus', title: 'Sin estudiantes', text: 'Agregá un perfil ficticio para empezar.' })}
  </section>`;
}

function openStudentForm(ctx, s = null) {
  openModal({
    title: s ? `Editar a ${firstName(s.name)}` : 'Agregar estudiante',
    body: html`<form class="form" novalidate>
      <div class="form-grid">
        ${field({ name: 'name', label: 'Nombre y apellido (ficticios)', value: s?.name || '', required: true, cls: 'full', attrs: 'autofocus' })}
        ${field({ name: 'age', label: 'Edad', type: 'number', value: s?.age || '', required: true, attrs: 'min="3" max="19"' })}
        ${select({ name: 'diabetesType', label: 'Tipo de diabetes', options: DIABETES_TYPES.map((t) => ({ value: t, label: t })), value: s?.diabetesType || '', required: true })}
        ${field({ name: 'school', label: 'Centro educativo', value: s?.school || studentsForUser(ctx.user)[0]?.school || '', required: true })}
        ${field({ name: 'grade', label: 'Grado y sección', value: s?.grade || '', required: true, attrs: 'list="grades-list"', placeholder: 'Ej. 3.er grado A' })}
        <datalist id="grades-list">${GRADES.map((g) => html`<option value="${g}">`)}</datalist>
      </div>
      ${s ? '' : notice('Se crea un Plan GlucoCompartido vacío. Podrás completarlo y compartirlo después.', '', 'clipboard')}
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">${icon('check')} Guardar</button></div>
    </form>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = formData(form);
        if (showErrors(form, validateStudent(d))) return;
        if (s) updateStudent(s.id, d); else addStudent(ctx.user, d);
        close();
        toast(s ? 'Datos del estudiante actualizados.' : `${firstName(d.name)} se agregó a tu cuenta con un plan vacío.`, { type: 'success' });
        ctx.refresh();
      });
    },
  });
}

function permisosTab({ user }) {
  if (user.role === 'docente') {
    const links = linksForTeacher(user.id).sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
    const label = { activo: ['Activo', 'chip-ok'], pendiente: ['Pendiente de autorización', 'chip-warn'], revocado: ['Revocado por la familia', 'chip-danger'], rechazado: ['No autorizado', 'chip-danger'] };
    return html`<section class="card"><h2 class="h3">Tus vinculaciones</h2>
      ${links.length ? html`<ul class="list">${links.map((l) => { const s = studentById(l.studentId); const [t, c] = label[l.status]; return html`<li>${studentAvatar(s, 'avatar-sm')}<span class="grow"><strong>${l.status === 'activo' ? s.name : firstName(s.name)}</strong><br><span class="xsmall muted">Solicitado ${fmtDateTime(l.requestedAt)}${l.status === 'activo' ? ` · historial de glucosa: ${l.permissions.glucose ? 'compartido' : 'no compartido'} · calendario: ${l.permissions.calendar ? 'compartido' : 'no compartido'}` : ''}</span></span><span class="chip ${c}">${t}</span></li>`; })}</ul>` : emptyState({ ic: 'link', title: 'Sin vinculaciones' })}
    </section>`;
  }
  const students = studentsForUser(user);
  if (!students.length) return html`<section class="card">${emptyState({ ic: 'link', title: 'Agregá un estudiante para compartir su plan' })}</section>`;
  return html`<div class="stack">${students.map((s) => {
    const links = linksForStudent(s.id).filter((l) => l.status === 'activo' || l.status === 'pendiente');
    const inv = activeInvite(s.id);
    const plan = planFor(s.id);
    return html`<section class="card" aria-labelledby="perm-${s.id}">
      <div class="card-header">${studentAvatar(s, 'avatar-sm')}<h2 class="h3" id="perm-${s.id}">${s.name}</h2><span class="actions">${inv ? html`<span class="chip chip-info">Código activo: <strong>${inv.code}</strong></span>` : html`<button type="button" class="btn btn-secondary btn-sm" data-invite="${s.id}">${icon('key', { size: 16 })} Generar código</button>`}<a class="btn btn-ghost btn-sm" href="#/plan/${s.id}?compartir=1">Ver plan</a></span></div>
      ${links.length ? html`<ul class="list">${links.map((l) => { const t = userById(l.teacherId); return html`<li style="align-items:flex-start;flex-wrap:wrap">
          ${userAvatar(t)}
          <div class="grow" style="min-width:200px"><strong>${t.name}</strong><br><span class="xsmall muted">${t.school || ''} · ${t.grade || ''}</span><br>
            ${l.status === 'pendiente' ? html`<span class="chip chip-warn">Solicitud pendiente</span>` : html`<span class="chip ${planReadStatus(plan, t.id).chip}">${planReadStatus(plan, t.id).label}</span>`}</div>
          ${l.status === 'pendiente'
            ? html`<div class="row"><button type="button" class="btn btn-success btn-sm" data-approve="${l.id}">${icon('check', { size: 16 })} Autorizar</button><button type="button" class="btn btn-ghost btn-sm" data-reject="${l.id}">Rechazar</button></div>`
            : html`<div class="perm-box">
                <label class="switch"><span class="small">Ver historial de glucosa</span><input type="checkbox" data-perm="${l.id}|glucose" ${l.permissions.glucose ? raw('checked') : ''}></label>
                <label class="switch"><span class="small">Ver recordatorios</span><input type="checkbox" data-perm="${l.id}|calendar" ${l.permissions.calendar ? raw('checked') : ''}></label>
                <button type="button" class="btn btn-danger-outline btn-sm" data-revoke="${l.id}">${icon('unlink', { size: 16 })} Revocar acceso</button>
              </div>`}
        </li>`; })}</ul>`
        : html`<p class="small muted mb-0">Ningún docente tiene acceso. ${inv ? 'Compartí el código activo con el docente.' : 'Generá un código para compartir el plan.'}</p>`}
      <p class="xsmall muted mt-2 mb-0">El plan y los contactos siempre se comparten con los docentes autorizados. El docente nunca puede modificar las indicaciones clínicas.</p>
    </section>`;
  })}</div>`;
}

function prefsTab({ user }) {
  return html`<section class="card" style="max-width:760px"><h2 class="h3">Preferencias</h2>
    <label class="switch"><span><strong>Avisos internos de recordatorios</strong><br><span class="small muted">Se muestran mientras la app está abierta. No son notificaciones push.</span></span><input type="checkbox" data-pref="reminderAlerts" ${getPref(user.id, 'reminderAlerts', user.role === 'familia') ? raw('checked') : ''} ${user.role === 'docente' ? raw('disabled') : ''}></label>
    <hr class="divider">
    <label class="switch"><span><strong>Reducir animaciones</strong><br><span class="small muted">También se respeta la preferencia del sistema operativo.</span></span><input type="checkbox" data-pref="reduceMotion" ${getPref(user.id, 'reduceMotion', false) ? raw('checked') : ''}></label>
    <hr class="divider">
    <p class="small mb-0"><strong>Idioma y zona horaria:</strong> Español · America/Managua (UTC−6). Moneda: córdobas (C$).</p>
  </section>`;
}

function planTab({ user }) {
  const sub = subscriptionFor(user.id);
  return html`<section class="card" style="max-width:760px">
    <h2 class="h3">Estado del plan</h2>
    <p><span class="chip ${sub.status === 'activo' ? 'chip-ok' : sub.status === 'vencido' ? 'chip-danger' : 'chip-info'}">${sub.label}</span></p>
    ${sub.status === 'prueba' ? html`<p class="mb-0">Prueba iniciada el ${fmtDate(sub.trialStart)} · termina el ${fmtDate(sub.trialEnd)} (${plural(sub.daysLeft, 'día restante', 'días restantes')}).</p>` : ''}
    ${sub.status === 'activo' ? html`<p class="mb-0">Plan Familiar ${money(PLAN_PRICE)}/mes · ${sub.renews ? `próxima renovación simulada: ${fmtDate(sub.activation.nextBilling)}` : `renovación cancelada; acceso hasta ${fmtDate(sub.activation.nextBilling)}`}.</p>` : ''}
    <a class="btn btn-primary mt-4" href="#/suscripcion">Gestionar suscripción ${icon('arrow-right', { size: 18 })}</a>
  </section>`;
}

function demoTab() {
  return html`<div class="grid-2">
    <section class="card"><h2 class="h3">${icon('swap', { size: 20, cls: 'inline-icon' })} Cuentas demo</h2><p class="small">Cambiá entre la familia y la docente para probar los recorridos compartidos. Los cambios se conservan.</p><button type="button" class="btn btn-secondary" data-switch>Cambiar cuenta demo</button></section>
    <section class="card"><h2 class="h3">${icon('smile', { size: 20, cls: 'inline-icon' })} Modo infantil</h2><p class="small">Abrí GlucoAprende para el estudiante seleccionado, sin información de adultos.</p><button type="button" class="btn btn-secondary" data-kid>Abrir modo infantil</button></section>
    <section class="card"><h2 class="h3">${icon('logout', { size: 20, cls: 'inline-icon' })} Cerrar sesión</h2><p class="small">La sesión vive en sessionStorage; los datos quedan guardados en este navegador.</p><button type="button" class="btn" data-logout>Cerrar sesión</button></section>
    <section class="card tone-red"><h2 class="h3">${icon('refresh', { size: 20, cls: 'inline-icon' })} Reiniciar datos demo</h2><p class="small">Borra solo las claves <code>glucokids.*</code> y restaura los datos iniciales. Requiere confirmación.</p><button type="button" class="btn btn-danger" data-reset>Reiniciar demostración</button></section>
    ${isMemoryOnly() ? html`<div class="span-2">${notice('El almacenamiento local no está disponible: los cambios se mantienen solo en memoria hasta recargar.', 'warn', 'alert')}</div>` : ''}
  </div>`;
}
