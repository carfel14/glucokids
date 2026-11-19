/* =========================================================
   Inicio de sesión, acceso demo, recuperación simulada y registro por pasos.
   La contraseña es exclusivamente demostrativa: no se guarda ni se envía.
   ========================================================= */
import { html, raw, formData, isEmail, firstName } from '../utils.js';
import { icon } from '../icons.js';
import { getState, sessionGet, sessionSet, sessionRemove, clearSession, getSession } from '../store.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, select, checkbox, showErrors, liveClear, clearErrors } from '../components/forms.js';
import { notice } from '../components/ui.js';
import { login, registerFamily, registerTeacher, validateEmailField, checkInviteCode } from '../actions.js';
import { enterDemo, ILLUSTRATION } from './public.js';
import { TRIAL_DAYS, PLAN_PRICE } from '../data.js';
import { LOGO } from '../components/shell.js';

export const GRADES = ['Preescolar', '1.er grado', '2.º grado', '3.er grado', '4.º grado', '5.º grado', '6.º grado', '7.º grado', '8.º grado', '9.º grado', '10.º grado', '11.º grado'];
export const DIABETES_TYPES = ['Tipo 1', 'Tipo 2', 'Otro tipo', 'Prefiero no indicarlo'];
const RELATIONS = ['Madre', 'Padre', 'Tutor o tutora', 'Abuela o abuelo', 'Otro familiar'];

/* ---------- Inicio de sesión ---------- */
let loginRole = 'familia';
export const loginPage = {
  title: 'Iniciar sesión', guestOnly: true,
  view: () => html`
    <div class="auth-layout">
      <section class="auth-brand" aria-label="GlucoKids">
        <img class="auth-logo" src="${LOGO}" alt="GlucoKids" width="320" height="241">
        <p class="auth-tagline">Salud, educación y acompañamiento para niños con diabetes</p>
        <span class="auth-rule" aria-hidden="true"></span>
        <ul class="auth-features">
          <li><span class="feature-icon">${icon('droplet', { size: 26 })}</span>Registro de glucosa</li>
          <li><span class="feature-icon">${icon('cap', { size: 26 })}</span>Aprendizaje saludable</li>
          <li><span class="feature-icon">${icon('users', { size: 26 })}</span>Acompañamiento en familia y escuela</li>
        </ul>
      </section>
      <section class="card auth-card" aria-labelledby="login-title">
        <h1 id="login-title" data-page-title tabindex="-1">Iniciar sesión en GlucoKids</h1>
        <p class="muted">Accedé a tu espacio personalizado</p>
        <form class="form" novalidate data-login-form>
          <fieldset>
            <legend class="sr-only">Tipo de cuenta</legend>
            <div class="role-switch" data-field="role">
              <label class="choice"><input type="radio" name="role" value="familia" ${loginRole === 'familia' ? raw('checked') : ''}><span class="card-icon">${icon('users', { size: 24 })}</span><span><span class="choice-title">Familia</span><span class="choice-sub">Padres / tutores</span></span></label>
              <label class="choice"><input type="radio" name="role" value="docente" ${loginRole === 'docente' ? raw('checked') : ''}><span class="card-icon green">${icon('school', { size: 24 })}</span><span><span class="choice-title">Docente</span><span class="choice-sub">Educador</span></span></label>
            </div>
          </fieldset>
          <div class="field" data-field="email">
            <label for="login-email">Correo electrónico <span class="req" aria-hidden="true">*</span></label>
            <div class="input-group"><span class="lead-icon">${icon('mail', { size: 18 })}</span><input class="input" id="login-email" name="email" type="email" autocomplete="username" required aria-required="true" placeholder="nombre@correo.com"></div>
          </div>
          <div class="field" data-field="password">
            <label for="login-pass">Contraseña <span class="req" aria-hidden="true">*</span></label>
            <div class="input-group"><span class="lead-icon">${icon('lock', { size: 18 })}</span><input class="input has-action" id="login-pass" name="password" type="password" autocomplete="current-password" required aria-required="true" aria-describedby="pass-hint"><button type="button" class="btn btn-ghost btn-icon trail-btn" data-toggle-pass aria-label="Mostrar contraseña" aria-pressed="false">${icon('eye')}</button></div>
            <span class="hint" id="pass-hint">Demostrativa: no se guarda ni se envía. Cualquier contraseña funciona con un correo registrado.</span>
          </div>
          <div class="row-between"><span></span><button type="button" class="link-btn" data-forgot>¿Olvidaste tu contraseña?</button></div>
          <div data-form-alert></div>
          <button type="submit" class="btn btn-primary btn-lg btn-block">Iniciar sesión</button>
        </form>
        <a class="trial-link" href="#/registro?tipo=familia">${icon('calendar', { size: 18 })} Prueba gratuita de ${TRIAL_DAYS} días</a>
        <div class="demo-access">
          <p class="divider-label"><span>Acceso de demostración</span></p>
          <div class="grid-2" style="gap:12px">
            <button type="button" class="btn btn-secondary" data-demo="familia">${icon('users', { size: 18 })} Entrar como familia demo</button>
            <button type="button" class="btn btn-secondary" data-demo="docente">${icon('school', { size: 18 })} Entrar como docente demo</button>
          </div>
        </div>
        <p class="divider-label"><span>O iniciá sesión con</span></p>
        <div class="social-row">
          ${['Google', 'Apple', 'Microsoft'].map((p) => html`<button type="button" class="btn" data-social="${p}">${icon('key', { size: 18 })} ${p}</button>`)}
        </div>
        <p class="xsmall muted center mt-4 mb-0">${icon('info', { size: 14, cls: 'inline-icon' })} Prototipo con datos ficticios: no hay autenticación real.</p>
      </section>
    </div>`,
  mount: (el, ctx) => {
    const form = el.querySelector('[data-login-form]');
    liveClear(form);
    form.querySelectorAll('input[name="role"]').forEach((r) => r.addEventListener('change', () => { loginRole = r.value; }));
    const pass = form.querySelector('#login-pass');
    const tgl = form.querySelector('[data-toggle-pass]');
    tgl.addEventListener('click', () => {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      tgl.setAttribute('aria-pressed', String(show));
      tgl.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      tgl.innerHTML = String(icon(show ? 'eye-off' : 'eye'));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = formData(form);
      const alertBox = form.querySelector('[data-form-alert]');
      alertBox.innerHTML = '';
      const errors = {};
      if (!d.email) errors.email = 'Ingresá tu correo electrónico.';
      else if (!isEmail(d.email)) errors.email = 'Ingresá un correo con formato válido (ej. nombre@dominio.com).';
      if (!d.password) errors.password = 'Ingresá tu contraseña.';
      if (showErrors(form, errors)) return;
      const user = getState().users.find((u) => u.email.toLowerCase() === d.email.toLowerCase());
      if (!user) {
        alertBox.innerHTML = String(html`<div class="form-alert" role="alert">${icon('alert')}<span>No encontramos una cuenta con ese correo en esta demostración. Usá los accesos demo o creá una cuenta.</span></div>`);
        form.email.focus();
        return;
      }
      if (user.role !== d.role) {
        showErrors(form, { email: `Este correo corresponde a una cuenta de ${user.role === 'docente' ? 'docente' : 'familia'}. Cambiá el selector de tipo de cuenta.` });
        return;
      }
      pass.value = '';
      login(user.id);
      toast(`¡Hola, ${firstName(user.name)}!`, { type: 'success', title: 'Sesión iniciada' });
      const back = sessionGet('redirect');
      sessionRemove('redirect');
      ctx.go(back || '/panel');
    });
    el.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => enterDemo(b.dataset.demo, ctx)));
    el.querySelector('[data-forgot]').addEventListener('click', () => openRecovery());
    el.querySelectorAll('[data-social]').forEach((b) => b.addEventListener('click', () => openSocial(b.dataset.social, ctx)));
  },
};

function openRecovery() {
  openModal({
    title: 'Recuperar acceso', tag: 'Demostración', size: 'sm',
    body: html`<form class="form" novalidate>
      <p class="mb-0">Ingresá tu correo para ver cómo funcionaría la recuperación.</p>
      ${field({ name: 'email', label: 'Correo electrónico', type: 'email', required: true, attrs: 'autofocus' })}
      <div data-result></div>
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cerrar</button><button class="btn btn-primary" type="submit">Continuar</button></div>
    </form>`,
    onMount: (el) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.email.value.trim();
        if (showErrors(form, { email: !email ? 'Ingresá tu correo.' : !isEmail(email) ? 'Formato de correo no válido.' : '' })) return;
        form.querySelector('[data-result]').innerHTML = String(notice(html`<strong>Demostración:</strong> no se envió ningún correo. En una versión real recibirías un enlace para restablecer tu contraseña. Para continuar, usá los accesos demo.`, 'warn', 'info'));
      });
    },
  });
}

function openSocial(provider, ctx) {
  openModal({
    title: `Inicio con ${provider}`, tag: 'Simulación', size: 'sm',
    body: html`<div class="stack">
      <p class="mb-0">Este prototipo <strong>no se conecta con ${provider}</strong> ni con ningún proveedor externo. Podés continuar con una cuenta de ejemplo.</p>
      <button type="button" class="btn btn-primary btn-block" data-as="familia">${icon('users', { size: 18 })} Continuar como familia de ejemplo</button>
      <button type="button" class="btn btn-secondary btn-block" data-as="docente">${icon('school', { size: 18 })} Continuar como docente de ejemplo</button>
      <button type="button" class="btn btn-ghost btn-block" data-close>Cancelar</button>
    </div>`,
    onMount: (el, close) => el.querySelectorAll('[data-as]').forEach((b) => b.addEventListener('click', () => { close(); enterDemo(b.dataset.as, ctx); })),
  });
}

export const logoutRoute = {
  redirect: () => {
    if (getSession().kidMode) return '/ninos';
    clearSession();
    toast('Cerraste sesión. Los datos de la demostración siguen guardados en este navegador.', { type: 'info' });
    return '/inicio';
  },
};

/* ---------- Registro por pasos ---------- */
const DRAFT_KEY = 'registro.draft';
let passMemory = ''; // la contraseña solo vive en memoria durante el registro

const FAMILY_STEPS = [
  { id: 'adulto', label: 'Tus datos' },
  { id: 'estudiante', label: 'Estudiante' },
  { id: 'centro', label: 'Centro educativo' },
  { id: 'config', label: 'Configuración inicial' },
];
const TEACHER_STEPS = [
  { id: 'adulto', label: 'Tus datos' },
  { id: 'centro', label: 'Centro educativo' },
  { id: 'vincular', label: 'Vincular estudiante' },
];

function getDraft(tipo) {
  const d = sessionGet(DRAFT_KEY, null);
  return d && d.tipo === tipo ? d : { tipo, data: { reminderAlerts: 'on' } };
}
function saveDraft(draft) { sessionSet(DRAFT_KEY, draft); }

function validateStep(tipo, stepId, d) {
  const e = {};
  if (stepId === 'adulto') {
    if (!d.name || d.name.length < 3) e.name = 'Escribí tu nombre completo.';
    const em = validateEmailField(d.email);
    if (em) e.email = em;
    if (tipo === 'familia' && !d.relation) e.relation = 'Elegí tu relación con el estudiante.';
    if (!passMemory || passMemory.length < 8) e.password = 'La contraseña demostrativa debe tener al menos 8 caracteres.';
  }
  if (stepId === 'estudiante') {
    if (!d.studentName || d.studentName.trim().split(/\s+/).length < 2) e.studentName = 'Escribí nombre y apellido (datos ficticios).';
    const age = Number(d.studentAge);
    if (!d.studentAge) e.studentAge = 'Indicá la edad.';
    else if (!Number.isInteger(age) || age < 3 || age > 19) e.studentAge = 'La edad debe estar entre 3 y 19 años.';
    if (!d.diabetesType) e.diabetesType = 'Elegí una opción.';
  }
  if (stepId === 'centro') {
    if (!d.school || d.school.length < 3) e.school = 'Indicá el nombre del centro educativo.';
    if (!d.grade) e.grade = tipo === 'docente' ? 'Indicá el grado o grupo que atendés.' : 'Elegí el grado.';
  }
  if (stepId === 'config') {
    const hasMin = d.targetMin !== '' && d.targetMin != null, hasMax = d.targetMax !== '' && d.targetMax != null;
    if (hasMin !== hasMax) { e[hasMin ? 'targetMax' : 'targetMin'] = 'Completá ambos valores o dejá los dos vacíos.'; }
    if (hasMin && hasMax) {
      const a = Number(d.targetMin), b = Number(d.targetMax);
      if (!Number.isInteger(a) || a < 40 || a > 400) e.targetMin = 'Ingresá un valor entero entre 40 y 400.';
      if (!Number.isInteger(b) || b < 40 || b > 400) e.targetMax = 'Ingresá un valor entero entre 40 y 400.';
      if (!e.targetMin && !e.targetMax && a >= b) e.targetMax = 'El valor máximo debe ser mayor que el mínimo.';
    }
    if (!d.ack) e.ack = 'Confirmá que entendés que es una demostración.';
  }
  if (stepId === 'vincular') {
    if (d.code) { const r = checkInviteCode(d.code); if (r.error) e.code = r.error; }
    if (!d.ack) e.ack = 'Confirmá que entendés que es una demostración.';
  }
  return e;
}

function stepFields(tipo, stepId, d) {
  if (stepId === 'adulto') return html`<div class="form-grid">
    ${field({ name: 'name', label: 'Nombre completo', value: d.name, required: true, autocomplete: 'name', attrs: 'autofocus' })}
    ${field({ name: 'email', label: 'Correo electrónico', type: 'email', value: d.email, required: true, autocomplete: 'email', hint: 'Usá un correo ficticio, por ejemplo nombre@ejemplo.demo' })}
    ${tipo === 'familia' ? field({ name: 'phone', label: 'Teléfono (opcional)', type: 'tel', value: d.phone, autocomplete: 'tel', hint: 'Ficticio. Se mostrará enmascarado.' }) : ''}
    ${tipo === 'familia' ? select({ name: 'relation', label: 'Relación con el estudiante', options: RELATIONS.map((r) => ({ value: r, label: r })), value: d.relation, required: true }) : ''}
    ${field({ name: 'password', label: 'Contraseña demostrativa', type: 'password', value: passMemory, required: true, autocomplete: 'new-password', hint: 'Mínimo 8 caracteres. No se guarda ni se envía.', cls: 'full' })}
  </div>`;
  if (stepId === 'estudiante') return html`
    ${notice('Usá datos ficticios. No ingreses información real de menores de edad.', 'warn', 'shield')}
    <div class="form-grid">
      ${field({ name: 'studentName', label: 'Nombre y apellido del estudiante', value: d.studentName, required: true, cls: 'full', attrs: 'autofocus' })}
      ${field({ name: 'studentAge', label: 'Edad', type: 'number', value: d.studentAge, required: true, attrs: 'min="3" max="19" inputmode="numeric"' })}
      ${select({ name: 'diabetesType', label: 'Tipo de diabetes', options: DIABETES_TYPES.map((t) => ({ value: t, label: t })), value: d.diabetesType, required: true })}
    </div>`;
  if (stepId === 'centro') return html`<div class="form-grid">
    ${field({ name: 'school', label: 'Centro educativo', value: d.school, required: true, cls: 'full', attrs: 'autofocus', hint: 'Nombre ficticio' })}
    ${tipo === 'familia'
      ? html`${select({ name: 'grade', label: 'Grado', options: GRADES.map((g) => ({ value: g, label: g })), value: d.grade, required: true })}${field({ name: 'section', label: 'Sección (opcional)', value: d.section, placeholder: 'Ej. A' })}`
      : html`${field({ name: 'grade', label: 'Grado o grupo que atendés', value: d.grade, required: true, placeholder: 'Ej. 3.er grado A' })}${field({ name: 'subject', label: 'Asignatura o rol (opcional)', value: d.subject, placeholder: 'Ej. Docente guía' })}`}
  </div>`;
  if (stepId === 'config') return html`
    <fieldset class="stack-sm">
      <legend class="h3">Meta de glucosa del plan (opcional)</legend>
      <p class="small muted mb-0">Transcribí el rango indicado por el equipo de salud de tu hija o hijo. GlucoKids no propone metas. Si lo dejás vacío, los registros mostrarán "Sin meta configurada".</p>
      <div class="form-grid">
        ${field({ name: 'targetMin', label: 'Mínimo (mg/dL)', type: 'number', value: d.targetMin, attrs: 'min="40" max="400" inputmode="numeric"' })}
        ${field({ name: 'targetMax', label: 'Máximo (mg/dL)', type: 'number', value: d.targetMax, attrs: 'min="40" max="400" inputmode="numeric"' })}
      </div>
    </fieldset>
    <div class="stack-sm">
      ${checkbox({ name: 'reminderAlerts', label: 'Mostrar avisos internos de recordatorios', checked: d.reminderAlerts === 'on', hint: 'Funcionan mientras la aplicación está abierta.' })}
      ${checkbox({ name: 'loadExample', label: 'Cargar datos de ejemplo', checked: d.loadExample === 'on', hint: 'Registros de 7 días, recordatorios y un plan de ejemplo. Si no lo marcás, la cuenta empieza vacía.' })}
      <div class="field" data-field="ack">${checkbox({ name: 'ack', label: 'Entiendo que es una demostración con datos ficticios.', checked: d.ack === 'on' })}</div>
    </div>
    <div class="card tone-aprende card-tight">
      <div class="row" style="flex-wrap:nowrap"><span class="card-icon yellow">${icon('sparkles')}</span><div><strong>Se activará tu prueba gratuita de ${TRIAL_DAYS} días.</strong><br><span class="small">No se solicita tarjeta. Total de hoy: C$0. Luego el Plan Familiar cuesta C$${PLAN_PRICE}/mes (simulado).</span></div></div>
    </div>`;
  if (stepId === 'vincular') return html`
    <p>Si una familia ya te compartió un código de invitación, ingresalo para solicitar acceso a su estudiante. También podés hacerlo más tarde desde GlucoEscuela.</p>
    ${field({ name: 'code', label: 'Código de invitación (opcional)', value: d.code, placeholder: 'GK-XXXXXX', attrs: 'autocapitalize="characters" autofocus' })}
    <div class="field" data-field="ack">${checkbox({ name: 'ack', label: 'Entiendo que es una demostración con datos ficticios.', checked: d.ack === 'on' })}</div>
    ${notice('El acceso docente es gratuito. Solo verás estudiantes cuyas familias autoricen tu solicitud.', 'ok', 'check-circle')}`;
  return '';
}

export const registerPage = {
  title: 'Crear cuenta', guestOnly: true,
  view: (ctx) => {
    const tipo = ctx.query.tipo;
    if (tipo !== 'familia' && tipo !== 'docente') {
      return html`<div class="register-wrap">
        <header class="page-header center" style="justify-content:center"><div><span class="eyebrow">Crear cuenta</span><h1 data-page-title tabindex="-1">¿Cómo vas a usar GlucoKids?</h1><p>Elegí el tipo de cuenta para empezar.</p></div></header>
        <div class="grid-2">
          <a class="card card-link tone-familia register-choice" href="#/registro?tipo=familia"><span class="card-icon green">${icon('users', { size: 28 })}</span><h2 class="h3">Soy familia o tutor</h2><p>Prueba gratuita de ${TRIAL_DAYS} días, sin tarjeta. Luego C$${PLAN_PRICE}/mes.</p><span class="btn btn-primary">Crear cuenta familiar ${icon('arrow-right', { size: 18 })}</span></a>
          <a class="card card-link tone-escuela register-choice" href="#/registro?tipo=docente"><span class="card-icon">${icon('school', { size: 28 })}</span><h2 class="h3">Soy docente</h2><p>Acceso gratuito a GlucoEscuela y recursos educativos.</p><span class="btn btn-secondary">Crear cuenta docente ${icon('arrow-right', { size: 18 })}</span></a>
        </div>
        <p class="center mt-6">¿Ya tenés cuenta? <a href="#/login">Iniciá sesión</a></p>
      </div>`;
    }
    const steps = tipo === 'familia' ? FAMILY_STEPS : TEACHER_STEPS;
    const draft = getDraft(tipo);
    let idx = Math.max(0, Math.min(steps.length - 1, Number(ctx.query.paso || 1) - 1));
    // No se puede saltar pasos sin completar los anteriores
    for (let i = 0; i < idx; i++) {
      if (Object.keys(validateStep(tipo, steps[i].id, draft.data)).length) { idx = i; break; }
    }
    const step = steps[idx];
    return html`<div class="register-wrap">
      <header class="page-header"><div class="grow"><span class="eyebrow">${tipo === 'familia' ? 'Cuenta familiar' : 'Cuenta docente'} · Paso ${idx + 1} de ${steps.length}</span><h1 data-page-title tabindex="-1">${step.label}</h1></div>
        ${tipo === 'familia' && idx === 0 ? html`<div class="actions"><button type="button" class="btn btn-secondary" data-example>${icon('sparkles', { size: 18 })} Cargar perfil de ejemplo</button></div>` : ''}
      </header>
      <ol class="steps" aria-label="Progreso del registro">${steps.map((s, i) => html`<li class="${i < idx ? 'done' : i === idx ? 'current' : ''}" ${i === idx ? raw('aria-current="step"') : ''}>${i + 1}. ${s.label}${i < idx ? html`<span class="sr-only"> (completado)</span>` : ''}</li>`)}</ol>
      <form class="card form" novalidate data-step-form data-step="${step.id}" data-idx="${idx}">
        ${stepFields(tipo, step.id, draft.data)}
        <div class="form-actions" style="justify-content:space-between">
          ${idx > 0 ? html`<button type="button" class="btn btn-ghost" data-back>${icon('arrow-left', { size: 18 })} Paso anterior</button>` : html`<a class="btn btn-ghost" href="#/registro">${icon('arrow-left', { size: 18 })} Cambiar tipo de cuenta</a>`}
          <button type="submit" class="btn btn-primary">${idx === steps.length - 1 ? html`${icon('check')} ${tipo === 'familia' ? 'Crear cuenta e iniciar prueba' : 'Crear cuenta docente'}` : html`Continuar ${icon('arrow-right', { size: 18 })}`}</button>
        </div>
      </form>
      <p class="center small muted">¿Ya tenés cuenta? <a href="#/login">Iniciá sesión</a></p>
    </div>`;
  },
  mount: (el, ctx) => {
    const tipo = ctx.query.tipo;
    const form = el.querySelector('[data-step-form]');
    if (!form) return;
    const steps = tipo === 'familia' ? FAMILY_STEPS : TEACHER_STEPS;
    const idx = Number(form.dataset.idx);
    const stepId = form.dataset.step;
    liveClear(form);
    const collect = () => {
      const draft = getDraft(tipo);
      const d = formData(form);
      if ('password' in d) { passMemory = d.password; delete d.password; }
      // casillas no marcadas no aparecen en FormData
      form.querySelectorAll('input[type="checkbox"]').forEach((c) => { d[c.name] = c.checked ? 'on' : ''; });
      if (d.code) d.code = d.code.toUpperCase();
      draft.data = { ...draft.data, ...d };
      saveDraft(draft);
      return draft;
    };
    form.addEventListener('input', () => collect());
    el.querySelector('[data-back]')?.addEventListener('click', () => { collect(); ctx.go(`/registro?tipo=${tipo}&paso=${idx}`); });
    el.querySelector('[data-example]')?.addEventListener('click', () => {
      const n = getState().users.length + Math.floor(Math.random() * 900);
      passMemory = 'demo-ejemplo';
      saveDraft({ tipo, data: {
        name: 'Ana Martínez', email: `ana.martinez${n}@ejemplo.demo`, phone: '+505 8000 0999', relation: 'Madre',
        studentName: 'Diego Martínez', studentAge: '9', diabetesType: 'Tipo 1',
        school: 'Escuela Los Laureles', grade: '4.º grado', section: 'B',
        targetMin: '80', targetMax: '180', reminderAlerts: 'on', loadExample: '', ack: '',
      } });
      toast('Perfil de ejemplo cargado en todos los pasos. Revisalo y continuá.', { type: 'success' });
      ctx.refresh();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const draft = collect();
      clearErrors(form);
      if (showErrors(form, validateStep(tipo, stepId, draft.data))) return;
      if (idx < steps.length - 1) { ctx.go(`/registro?tipo=${tipo}&paso=${idx + 2}`); return; }
      // Validación final de todos los pasos
      for (let i = 0; i < steps.length; i++) {
        if (Object.keys(validateStep(tipo, steps[i].id, draft.data)).length) { ctx.go(`/registro?tipo=${tipo}&paso=${i + 1}`); return; }
      }
      const d = draft.data;
      passMemory = '';
      sessionRemove(DRAFT_KEY);
      if (tipo === 'familia') {
        const { user, student } = registerFamily({ ...d, reminderAlerts: d.reminderAlerts === 'on', loadExample: d.loadExample === 'on' });
        login(user.id);
        toast(`Se activó tu prueba gratuita de ${TRIAL_DAYS} días. ${d.loadExample === 'on' ? 'Cargamos datos de ejemplo.' : 'Empezá registrando la primera medición o completando el plan.'}`, { type: 'success', title: `¡Bienvenida/o, ${firstName(user.name)}!` });
        ctx.go('/panel');
        void student;
      } else {
        const { user, link } = registerTeacher(d);
        login(user.id);
        toast(link?.link ? `Solicitud enviada para ${firstName(link.student.name)}. La familia debe autorizarla.` : 'Podés vincular estudiantes desde GlucoEscuela con un código.', { type: 'success', title: `¡Bienvenida/o, ${firstName(user.name)}!` });
        ctx.go('/escuela');
      }
    });
  },
};
