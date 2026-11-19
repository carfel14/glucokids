/* =========================================================
   Sitio público: presentación, cómo funciona, planes, ayuda y páginas de error.
   ========================================================= */
import { html, money } from '../utils.js';
import { icon } from '../icons.js';
import { dino, school, sparkleDots } from '../illustrations.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { healthNote } from '../components/ui.js';
import { login } from '../actions.js';
import { DEMO_FAMILY_ID, DEMO_TEACHER_ID } from '../seed.js';
import { PLAN_PRICE, TRIAL_DAYS } from '../data.js';
import { sessionGet, sessionRemove } from '../store.js';

export const ILLUSTRATION = 'assets/img/glucokids-ilustracion.png';

/** Acceso inmediato a las cuentas demo */
export function enterDemo(role, ctx) {
  const u = login(role === 'docente' ? DEMO_TEACHER_ID : DEMO_FAMILY_ID);
  toast(`Entraste como ${u.name} (${role === 'docente' ? 'docente' : 'familia'} demo).`, { type: 'success', title: 'Demostración' });
  const back = sessionGet('redirect');
  sessionRemove('redirect');
  ctx.go(back || '/panel');
}
export function openDemoChooser(ctx) {
  openModal({
    title: 'Explorar la demostración', tag: 'Datos ficticios',
    body: html`<div class="stack">
      <p class="mb-0 muted">Elegí un perfil para entrar de inmediato. Podés cambiar de cuenta en cualquier momento desde el distintivo "Demostración".</p>
      <div class="choice-grid">
        <button type="button" class="choice" data-demo="familia"><span class="card-icon">${icon('users')}</span><span><span class="choice-title">Familia demo</span><span class="choice-sub">María López · mamá de Juan y Lucía</span></span></button>
        <button type="button" class="choice" data-demo="docente"><span class="card-icon green">${icon('school')}</span><span><span class="choice-title">Docente demo</span><span class="choice-sub">Laura Martínez · 3.er y 4.º grado</span></span></button>
      </div>
    </div>`,
    onMount: (el, close) => el.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => { close(); enterDemo(b.dataset.demo, ctx); })),
  });
}

const MODULES = [
  { id: 'familia', name: 'GlucoFamilia', tone: 'tone-familia', iconTone: 'green', ic: 'users', lead: 'Seguimiento cotidiano y coordinación con la escuela.', items: ['Registros de glucosa con historial y gráfica', 'Recordatorios de rutina por fecha', 'Mensajes con docentes y contactos'] },
  { id: 'escuela', name: 'GlucoEscuela', tone: 'tone-escuela', iconTone: '', ic: 'school', lead: 'Información del estudiante para docentes, sin costo.', items: ['Acceso al Plan GlucoCompartido autorizado', 'Registro de incidentes y observaciones', 'Recursos breves de formación docente'] },
  { id: 'aprende', name: 'GlucoAprende', tone: 'tone-aprende', iconTone: 'yellow', ic: 'gamepad', lead: 'Aprender sobre diabetes y autocuidado jugando.', items: ['Seis temas con lecciones breves', 'Cuestionarios con explicación amable', 'Logros por aprender y participar'] },
];

export const landing = {
  title: 'Inicio',
  view: (ctx) => html`
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">${icon('heart', { size: 14 })} Familias y escuelas de Managua, Nicaragua</span>
        <h1 data-page-title tabindex="-1">Educación, confianza y acompañamiento para niños con diabetes durante su jornada escolar</h1>
        <p class="lead">GlucoKids conecta a familias, docentes y estudiantes con diabetes tipo 1 y tipo 2 alrededor de un plan compartido, registros claros y aprendizaje infantil.</p>
        <div class="row">
          <a class="btn btn-primary btn-lg" href="#/registro?tipo=familia">${icon('sparkles')} Comenzar prueba gratuita</a>
          <button type="button" class="btn btn-secondary btn-lg" data-demo-chooser>${icon('play', { size: 18 })} Explorar demostración</button>
        </div>
        <p class="small muted">${TRIAL_DAYS} días gratis para familias, sin tarjeta. Acceso docente gratuito.</p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="hero-circle"><img src="${ILLUSTRATION}" alt="" width="507" height="354"></div>
        <div class="hero-dino">${dino({ mood: 'wave', size: 130 })}</div>
        <div class="hero-dots">${sparkleDots()}</div>
      </div>
    </section>

    <section class="section" aria-labelledby="mod-title">
      <div class="section-head"><h2 id="mod-title">Tres módulos, un mismo acompañamiento</h2><p class="muted">Cada participante tiene herramientas adaptadas a lo que necesita durante la jornada escolar.</p></div>
      <div class="grid-3">
        ${MODULES.map((m) => html`<article class="card ${m.tone} module-card">
          <div class="card-header"><span class="card-icon ${m.iconTone}">${icon(m.ic, { size: 24 })}</span><h3>${m.name}</h3></div>
          <p>${m.lead}</p>
          <ul class="checklist">${m.items.map((i) => html`<li>${icon('check-circle', { size: 18 })}<span>${i}</span></li>`)}</ul>
        </article>`)}
      </div>
    </section>

    <section class="section card plan-band" aria-labelledby="plan-title">
      <div class="plan-band-art" aria-hidden="true">${school({ size: 170 })}</div>
      <div>
        <span class="eyebrow">El elemento que conecta</span>
        <h2 id="plan-title">Plan GlucoCompartido</h2>
        <p>Reúne la información individual que la escuela necesita: responsables, contactos, meta registrada por la familia, rutina escolar, alimentación, actividad física y la actuación indicada por el equipo de salud.</p>
        <ol class="mini-steps">
          <li><strong>La familia</strong> registra el plan y genera un código.</li>
          <li><strong>El docente</strong> solicita acceso con ese código.</li>
          <li><strong>La familia</strong> autoriza y puede revocar cuando quiera.</li>
        </ol>
      </div>
    </section>

    <section class="section" aria-labelledby="who-title">
      <div class="section-head"><h2 id="who-title">Beneficios para cada participante</h2></div>
      <div class="grid-3">
        <article class="card"><div class="card-header"><span class="card-icon">${icon('users')}</span><h3>Familias</h3></div><p class="mb-0">Más tranquilidad durante el horario escolar: saben quién conoce el plan, reciben avisos de incidentes y coordinan por mensajes.</p></article>
        <article class="card"><div class="card-header"><span class="card-icon green">${icon('school')}</span><h3>Docentes</h3></div><p class="mb-0">Información clara del estudiante y orientaciones generales, siempre remitidas al plan individual. Sin costo personal.</p></article>
        <article class="card"><div class="card-header"><span class="card-icon yellow">${icon('smile')}</span><h3>Estudiantes</h3></div><p class="mb-0">Aprenden sobre su condición con la mascota Gluki, sin necesidad de llevar un teléfono a clases.</p></article>
      </div>
    </section>

    <section class="section grid-2">
      <div class="card tone-escuela">
        <div class="card-header"><span class="card-icon">${icon('phoneApp')}</span><h3>Sin teléfono en el aula</h3></div>
        <p class="mb-0">El estudiante no necesita llevar un teléfono: familiares y docentes consultan la plataforma desde sus propios dispositivos, incluidas las computadoras de la escuela.</p>
      </div>
      <div class="card tone-aprende">
        <div class="card-header"><span class="card-icon yellow">${icon('card')}</span><h3>Plan Familiar ${money(PLAN_PRICE)}/mes</h3></div>
        <p>Prueba gratuita de ${TRIAL_DAYS} días. Docentes: acceso gratuito a GlucoEscuela y recursos.</p>
        <a class="btn btn-secondary" href="#/planes">Ver planes ${icon('arrow-right', { size: 18 })}</a>
      </div>
    </section>
    <section class="section">${healthNote('GlucoKids organiza información y educación: no diagnostica, no calcula dosis y no sustituye al equipo de salud.')}</section>
  `,
  mount: (el, ctx) => el.querySelector('[data-demo-chooser]')?.addEventListener('click', () => openDemoChooser(ctx)),
};

export const comoFunciona = {
  title: 'Cómo funciona',
  view: () => html`
    <header class="page-header"><div class="grow"><span class="eyebrow">Cómo funciona</span><h1 data-page-title tabindex="-1">Del plan individual a la coordinación diaria</h1><p>Un recorrido en cinco pasos para familias y docentes.</p></div></header>
    <ol class="how-steps">
      ${[
        ['user-plus', 'Crear la cuenta familiar', `La familia se registra, agrega los datos ficticios del estudiante y su centro educativo. Se activa una prueba gratuita de ${TRIAL_DAYS} días, sin tarjeta.`],
        ['clipboard', 'Completar el Plan GlucoCompartido', 'La familia registra contactos, rutina escolar y transcribe la meta indicada por su equipo de salud. GlucoKids no crea indicaciones clínicas.'],
        ['link', 'Compartir con el docente', 'La familia genera un código, el docente lo introduce y la familia autoriza el acceso. Puede revocarlo en cualquier momento.'],
        ['messages', 'Coordinar el día a día', 'Registros de glucosa, recordatorios, mensajes, observaciones e incidentes con estados claros y notificaciones internas.'],
        ['gamepad', 'Aprender jugando', 'En GlucoAprende el estudiante recorre seis temas, responde cuestionarios y gana logros por aprender, nunca por sus valores de glucosa.'],
      ].map(([ic, t, p], i) => html`<li class="card how-step"><span class="how-num" aria-hidden="true">${i + 1}</span><span class="card-icon">${icon(ic)}</span><div><h2 class="h3">${t}</h2><p class="mb-0">${p}</p></div></li>`)}
    </ol>
    <section class="section grid-2">
      <div class="card"><h2 class="h3">${icon('check-circle', { size: 20 })} Lo que hace GlucoKids</h2><ul class="checklist">
        <li>${icon('check', { size: 18 })}<span>Organiza la información que la familia comparte con la escuela.</span></li>
        <li>${icon('check', { size: 18 })}<span>Facilita la comunicación familia–escuela y el registro de incidentes.</span></li>
        <li>${icon('check', { size: 18 })}<span>Educa a niñas y niños sobre autocuidado de forma lúdica.</span></li>
        <li>${icon('check', { size: 18 })}<span>Funciona como aplicación web instalable (PWA).</span></li></ul></div>
      <div class="card tone-red"><h2 class="h3">${icon('x-circle', { size: 20 })} Lo que no hace</h2><ul class="bullets">
        <li>No diagnostica ni interpreta valores clínicos.</li>
        <li>No calcula dosis ni recomienda cambios de medicamentos.</li>
        <li>No es un monitoreo continuo: los registros son manuales.</li>
        <li>No reemplaza al equipo de salud ni a los servicios de emergencia.</li></ul></div>
    </section>
    <section class="section row"><a class="btn btn-primary" href="#/registro?tipo=familia">Comenzar prueba gratuita</a><a class="btn btn-secondary" href="#/login">Iniciar sesión</a></section>
  `,
};

export const planesPublic = {
  title: 'Planes',
  view: (ctx) => html`
    <header class="page-header"><div class="grow"><span class="eyebrow">Planes</span><h1 data-page-title tabindex="-1">Elegí tu plan y comenzá hoy</h1><p>Acompañá el cuidado, aprendizaje y seguridad de tu hija o hijo con diabetes, dentro y fuera de la escuela.</p></div></header>
    <div class="pricing">
      <article class="card price-card featured">
        <span class="ribbon">${TRIAL_DAYS} días gratis</span>
        <div class="card-header"><span class="card-icon">${icon('users', { size: 24 })}</span><h2 class="mb-0">Plan Familiar</h2></div>
        <p class="price"><span class="amount">${money(PLAN_PRICE)}</span><span class="per">/mes</span></p>
        <p class="muted">Durante la prueba gratuita el total de hoy es C$0. Al terminar, el precio es ${money(PLAN_PRICE)} al mes (en este prototipo todo pago es simulado).</p>
        <ul class="checklist">
          ${['GlucoFamilia: registros, recordatorios y reportes', 'Plan GlucoCompartido con vinculación docente', 'Mensajes e incidentes con la escuela', 'GlucoAprende para tus hijos', 'Cancelación de la renovación cuando quieras'].map((i) => html`<li>${icon('check-circle', { size: 18 })}<span>${i}</span></li>`)}
        </ul>
        <a class="btn btn-primary btn-block btn-lg" href="${ctx.user?.role === 'familia' ? '#/suscripcion' : '#/registro?tipo=familia'}">${icon('sparkles')} Comenzar prueba gratuita</a>
      </article>
      <article class="card price-card">
        <div class="card-header"><span class="card-icon green">${icon('school', { size: 24 })}</span><h2 class="mb-0">Docentes</h2></div>
        <p class="price"><span class="amount">Gratis</span></p>
        <p class="muted">Acceso a GlucoEscuela y a la biblioteca educativa sin costo personal.</p>
        <ul class="checklist">${['Estudiantes autorizados por sus familias', 'Plan compartido y confirmación de lectura', 'Incidentes, observaciones y mensajes', 'Recursos de formación'].map((i) => html`<li>${icon('check-circle', { size: 18 })}<span>${i}</span></li>`)}</ul>
        <a class="btn btn-secondary btn-block" href="#/registro?tipo=docente">Crear cuenta docente</a>
      </article>
      <article class="card price-card">
        <div class="card-header"><span class="card-icon lilac">${icon('cap', { size: 24 })}</span><h2 class="mb-0">Centros educativos</h2></div>
        <p class="price"><span class="amount small-amount">Precio por definir</span></p>
        <p class="muted mb-0">Los planes institucionales están en definición. No hay tarifas publicadas en este prototipo.</p>
      </article>
    </div>
    <section class="section">${healthNote()}</section>
  `,
};

const FAQ = [
  ['¿Esta aplicación es real?', 'Es un prototipo funcional de demostración. Todos los nombres, registros, contactos y planes son ficticios. No hay servidor, cobros, correos, SMS ni llamadas reales.'],
  ['¿Dónde se guardan los datos?', 'En el almacenamiento local de este navegador (localStorage), con la clave glucokids.demo.v1. La sesión de demostración se guarda en sessionStorage. Nada se envía a internet.'],
  ['¿Cómo pruebo la comunicación entre familia y docente?', 'Usá el botón "Cuentas demo" para cambiar de perfil en el mismo navegador. También podés abrir dos pestañas: cada una mantiene su propia sesión y los cambios se sincronizan.'],
  ['¿Cómo se comparte el plan con un docente?', 'En el Plan GlucoCompartido, la familia genera un código. El docente lo introduce en GlucoEscuela y la familia autoriza la solicitud desde Configuración › Permisos.'],
  ['¿Qué pasa con la prueba gratuita?', `Al crear una cuenta familiar empieza una prueba de ${TRIAL_DAYS} días que no solicita tarjeta. La fecha de inicio se guarda y no se reinicia al recargar.`],
  ['¿Por qué no aparece un número de emergencias?', 'Para no mostrar números sin verificar, cada plan tiene un campo "Número de emergencias local" que la familia configura. Los botones de llamada abren una simulación.'],
  ['¿Funciona sin conexión?', 'Después de una primera carga desde localhost, el service worker guarda los recursos para abrir la app sin conexión. Los datos siguen siendo locales y no se sincronizan entre dispositivos.'],
  ['¿Cómo reinicio la demostración?', 'En Configuración › Demostración, elegí "Reiniciar datos demo". Solo se borran las claves de GlucoKids.'],
];
export const ayuda = {
  title: 'Ayuda',
  view: () => html`
    <header class="page-header"><div class="grow"><span class="eyebrow">Ayuda</span><h1 data-page-title tabindex="-1">Preguntas frecuentes</h1><p>Todo lo que necesitás para presentar y probar el prototipo.</p></div></header>
    <div class="accordion">${FAQ.map(([q, a], i) => html`<details ${i === 0 ? 'open' : ''}><summary>${icon('help')} ${q}<span class="chev">${icon('chev-down')}</span></summary><div class="acc-body"><p class="mb-0">${a}</p></div></details>`)}</div>
    <section class="section">${healthNote('Ante una situación urgente, seguí el plan individual y comunicate con los servicios de emergencia de tu localidad.')}</section>
  `,
};

export const notFound = {
  title: 'Página no encontrada', shell: 'auto',
  view: (ctx) => html`<div class="card center stack" style="align-items:center;max-width:640px;margin:32px auto">
    ${dino({ mood: 'think', size: 150 })}
    <h1 data-page-title tabindex="-1">No encontramos esta página</h1>
    <p class="muted">La dirección <code>${ctx.path}</code> no existe en GlucoKids.</p>
    <a class="btn btn-primary" href="#${ctx.user ? '/panel' : '/inicio'}">Volver al inicio</a>
  </div>`,
};
export const forbidden = {
  title: 'Acceso no disponible',
  view: (ctx) => html`<div class="card center stack" style="align-items:center;max-width:680px;margin:32px auto">
    <span class="empty-icon" style="width:72px;height:72px;border-radius:24px;background:var(--red-bg);color:var(--red-text);display:inline-flex;align-items:center;justify-content:center">${icon('lock', { size: 34 })}</span>
    <h1 data-page-title tabindex="-1">Acceso no disponible</h1>
    <p>${ctx.reason}</p>
    <p class="xsmall muted">Control de navegación del prototipo: en producción estas reglas deben validarse en un servidor.</p>
    <a class="btn btn-primary" href="#${ctx.user ? '/panel' : '/inicio'}">Volver al inicio</a>
  </div>`,
};
