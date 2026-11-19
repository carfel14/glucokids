/* =========================================================
   GlucoAprende (RF-12): temas, lecciones, cuestionarios, cuento interactivo y logros.
   Las mismas pantallas sirven para la vista adulta (/aprende) y el modo infantil (/ninos).
   Los logros premian aprendizaje y participación, nunca valores de glucosa.
   ========================================================= */
import { html, raw, firstName, fmtDate, plural } from '../utils.js';
import { icon } from '../icons.js';
import { dino, topicArt, storyScene } from '../illustrations.js';
import { progressFor, studentsForUser, studentById } from '../data.js';
import { recordLessonOpened, submitQuiz, finishStory, enterKidMode } from '../actions.js';
import { pageHeader, emptyState, healthNote, progressBar, confetti, notice } from '../components/ui.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TOPICS, topicById, PASS_SCORE } from '../content/topics.js';
import { STORIES, storyById } from '../content/story.js';
import { ACHIEVEMENTS } from '../content/achievements.js';

const base = (ctx) => (ctx.kid ? '/ninos' : '/aprende');
const toneClass = { familia: 'tone-familia', escuela: 'tone-escuela', aprende: 'tone-aprende', lilac: 'tone-lilac', red: 'tone-red' };

export function badge(a, earned, size = 64) {
  return html`<span class="badge-medal ${earned ? 'earned' : 'locked'}" style="--c:${a.color};width:${size}px;height:${size}px" aria-hidden="true">${icon(earned ? a.icon : 'lock', { size: Math.round(size * .44) })}</span>`;
}
function celebrateAchievements(fresh) {
  fresh.forEach((a, i) => setTimeout(() => toast(a.desc, { type: 'success', title: `¡Nuevo logro: ${a.title}!` }), i * 250));
}
function noStudent(ctx) {
  return html`${pageHeader({ title: 'GlucoAprende' })}<div class="card">${emptyState({ ic: 'gamepad', title: 'No hay estudiantes disponibles', text: 'El progreso se guarda por estudiante. Agregá o vinculá un estudiante para usar GlucoAprende.' })}</div>`;
}

/* ---------- Inicio ---------- */
export const aprendeHome = {
  title: (ctx) => (ctx.kid ? 'Mis temas' : 'GlucoAprende'), nav: 'aprende',
  view: (ctx) => {
    const { student } = ctx;
    if (!student) return noStudent(ctx);
    const fn = firstName(student.name);
    const prog = progressFor(student.id);
    const b = base(ctx);
    const next = TOPICS.find((t) => !prog.topics?.[t.id]?.completed) || TOPICS[0];
    const earned = ACHIEVEMENTS.filter((a) => prog.achievements?.[a.id]);
    return html`
      ${ctx.kid ? html`<h1 class="sr-only" data-page-title tabindex="-1">Mis temas de GlucoAprende</h1>` : pageHeader({
        title: 'GlucoAprende', eyebrow: `Aprendizaje de ${student.name}`,
        sub: 'Lecciones breves, cuestionarios y un cuento interactivo. El progreso se guarda para el estudiante seleccionado.',
        actions: html`<button type="button" class="btn btn-primary" data-kid-open>${icon('smile', { size: 18 })} Abrir modo infantil</button>`,
      })}
      <div class="aprende-top">
        <section class="card hello-card">
          <div><h2 class="kid-title">¡Hola${ctx.kid ? `, ${fn}` : ''}!</h2><p class="mb-0">Aprendé de forma divertida cómo cuidar tu salud y vivir bien con diabetes.</p></div>
          <span class="hello-dino">${dino({ mood: 'wave', size: 150 })}</span>
        </section>
        <section class="card progress-card" aria-labelledby="mi-prog">
          <h2 class="h3" id="mi-prog">${icon('star', { size: 22, cls: 'inline-icon star' })} ${ctx.kid ? 'Mi progreso' : `Progreso de ${fn}`}</h2>
          <p class="mb-0">${prog.completed} de ${prog.total} temas completados</p>
          <div class="row" style="flex-wrap:nowrap"><div class="grow">${progressBar(prog.percent, 'Progreso de temas completados')}</div><strong>${prog.percent}%</strong></div>
          <p class="xsmall muted mb-0">Completás un tema acertando al menos ${PASS_SCORE} de 3 preguntas. ¡Podés intentarlo las veces que quieras!</p>
        </section>
      </div>
      <section class="mt-6" aria-labelledby="temas">
        <h2 class="h3" id="temas">${icon('book', { size: 22, cls: 'inline-icon' })} Temas para aprender</h2>
        <div class="topic-grid">${TOPICS.map((t) => { const tp = prog.topics?.[t.id]; return html`<a class="card card-link topic-card ${toneClass[t.tone]}" href="#${b}/tema/${t.id}">
            <span class="topic-art">${topicArt(t.id, { size: 110 })}</span>
            <span class="topic-name">${t.short}</span>
            <span class="topic-status">${tp?.completed ? html`<span class="chip chip-ok">${icon('check', { size: 14 })} Completado</span>` : tp?.attempts ? html`<span class="chip chip-warn">Mejor: ${tp.best} de 3</span>` : html`<span class="chip">Nuevo</span>`}<span class="go">${icon('chev-right', { size: 16 })}</span></span>
          </a>`; })}</div>
      </section>
      <div class="grid-3 mt-6">
        <section class="card quiz-cta">
          <h2 class="h3">${icon('gamepad', { size: 22, cls: 'inline-icon' })} ¡Poné a prueba lo que aprendiste!</h2>
          <p class="small">Respondé el cuestionario de "${next.short}" y ganá estrellas.</p>
          <a class="btn btn-primary btn-lg" href="#${b}/tema/${next.id}/quiz">${icon('play', { size: 18 })} Jugar quiz</a>
        </section>
        <section class="card tone-lilac">
          <h2 class="h3">${icon('book', { size: 22, cls: 'inline-icon' })} Cuento interactivo</h2>
          ${STORIES.map((s) => html`<p class="small">${s.title}: ${s.summary}</p><a class="btn btn-secondary" href="#${b}/cuento/${s.id}">${prog.stories?.[s.id] ? 'Leer otra vez' : 'Leer cuento'} ${icon('arrow-right', { size: 18 })}</a>`)}
        </section>
        <section class="card" aria-labelledby="logros-h">
          <div class="card-header"><h2 class="h3" id="logros-h">${icon('trophy', { size: 22, cls: 'inline-icon' })} ${ctx.kid ? 'Mis logros' : 'Logros'}</h2><a class="actions small" href="#${b}/logros">Ver todos</a></div>
          ${earned.length ? html`<div class="badge-row">${earned.slice(0, 4).map((a) => html`<div class="badge-mini">${badge(a, true, 52)}<span class="xsmall">${a.title}</span></div>`)}</div>` : html`<p class="small muted">Completá tu primer tema para ganar un logro.</p>`}
          <p class="xsmall muted mb-0">${plural(earned.length, 'logro', 'logros')} de ${ACHIEVEMENTS.length}</p>
        </section>
      </div>
      ${ctx.kid ? '' : html`<div class="mt-6">${healthNote()}</div>`}`;
  },
  mount: (el, ctx) => {
    el.querySelector('[data-kid-open]')?.addEventListener('click', () => openKidModeDialog(ctx));
    if (ctx.query.ninos && !ctx.kid && !ctx.isRefresh) openKidModeDialog(ctx);
  },
};

export function openKidModeDialog(ctx) {
  const students = studentsForUser(ctx.user);
  if (!students.length) { toast('No hay estudiantes disponibles para el modo infantil.', { type: 'info' }); return; }
  const sel = ctx.student?.id || students[0].id;
  openModal({
    title: 'Abrir modo infantil',
    body: html`<form class="form">
      <p class="mb-0">El modo infantil muestra solo lecciones, actividades, progreso y logros del estudiante elegido. No muestra pagos, configuraciones ni información de otros estudiantes.</p>
      <fieldset><legend>¿Para quién?</legend><div class="choice-grid mt-2">${students.map((s) => html`<label class="choice"><input type="radio" name="sid" value="${s.id}" ${s.id === sel ? raw('checked') : ''}><span class="choice-title">${s.name}</span></label>`)}</div></fieldset>
      ${notice('Para salir del modo infantil se pedirá resolver una suma sencilla (puerta para adultos).', '', 'lock')}
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">${icon('smile', { size: 18 })} Empezar</button></div>
    </form>`,
    onMount: (el, close) => el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const sid = e.target.sid.value;
      close();
      enterKidMode(sid);
      ctx.go('/ninos');
    }),
  });
}

/** Puerta para adultos al salir del modo infantil */
export function openParentGate(ctx, onExit) {
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 6);
  openModal({
    title: 'Salir del modo infantil', size: 'sm',
    body: html`<form class="form" novalidate>
      <p class="mb-0">Pedile a un adulto que resuelva esta suma para salir.</p>
      <div class="field" data-field="answer"><label for="gate">¿Cuánto es ${a} + ${b}?</label><input class="input" id="gate" name="answer" inputmode="numeric" autocomplete="off" autofocus></div>
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Seguir jugando</button><button class="btn btn-primary" type="submit">Salir</button></div>
    </form>`,
    onMount: (el, close) => el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      if (Number(f.answer.value) !== a + b) {
        f.querySelector('[data-field]').classList.add('has-error');
        if (!f.querySelector('.field-error')) f.querySelector('[data-field]').insertAdjacentHTML('beforeend', String(html`<p class="field-error">${icon('alert', { size: 16 })}<span>Esa no es la respuesta. Intentá otra vez.</span></p>`));
        f.answer.focus();
        return;
      }
      close();
      onExit();
    }),
  });
}

/* ---------- Lección ---------- */
export const leccion = {
  title: (ctx) => topicById(ctx.params.tid)?.title || 'Lección', nav: 'aprende',
  access: (ctx) => (topicById(ctx.params.tid) ? true : 'Este tema no existe.'),
  view: (ctx) => {
    if (!ctx.student) return noStudent(ctx);
    const t = topicById(ctx.params.tid);
    const b = base(ctx);
    const tp = progressFor(ctx.student.id).topics?.[t.id];
    return html`<a class="btn btn-ghost btn-sm" href="#${b}">${icon('arrow-left', { size: 16 })} Volver a los temas</a>
      <header class="lesson-head card ${toneClass[t.tone]} mt-2">
        <span class="topic-art">${topicArt(t.id, { size: 150, label: `Ilustración del tema ${t.title}` })}</span>
        <div><span class="eyebrow">Lección${tp?.completed ? ' · completada' : ''}</span><h1 data-page-title tabindex="-1">${t.title}</h1><p class="mb-0">${t.goal}</p></div>
      </header>
      <ol class="lesson-sections">${t.sections.map((s, i) => html`<li class="card"><span class="lesson-n" aria-hidden="true">${i + 1}</span><div><h2 class="h3">${s.h}</h2><p class="mb-0">${s.p}</p></div></li>`)}</ol>
      <section class="card key-idea">
        <span>${dino({ mood: 'read', size: 110 })}</span>
        <div><h2 class="h3">Idea clave</h2><p>${t.key}</p><a class="btn btn-primary btn-lg" href="#${b}/tema/${t.id}/quiz">${icon('play', { size: 18 })} Ir al cuestionario</a></div>
      </section>
      ${ctx.kid ? '' : html`<div class="mt-6">${healthNote()}</div>`}`;
  },
  mount: (el, ctx) => {
    if (!ctx.student) return;
    const fresh = recordLessonOpened(ctx.student.id, ctx.params.tid);
    celebrateAchievements(fresh);
  },
};

/* ---------- Cuestionario ---------- */
let quiz = null;
function resetQuiz(key) { quiz = { key, idx: 0, answers: [], selected: null, confirmed: false, result: null }; }

export const quizPage = {
  title: (ctx) => `Cuestionario: ${topicById(ctx.params.tid)?.short || ''}`, nav: 'aprende',
  access: (ctx) => (topicById(ctx.params.tid) ? true : 'Este tema no existe.'),
  view: (ctx) => {
    if (!ctx.student) return noStudent(ctx);
    const t = topicById(ctx.params.tid);
    const key = `${ctx.student.id}|${t.id}`;
    if (!quiz || quiz.key !== key || !ctx.isRefresh) resetQuiz(key); // cada visita empieza un intento nuevo
    const b = base(ctx);
    const head = html`<a class="btn btn-ghost btn-sm" href="#${b}/tema/${t.id}">${icon('arrow-left', { size: 16 })} Repasar la lección</a>
      <h1 class="mt-2" data-page-title tabindex="-1">${icon('gamepad', { size: 28, cls: 'inline-icon' })} ${t.short}</h1>`;
    if (quiz.result) return html`${head}${resultView(ctx, t)}`;
    const q = t.quiz[quiz.idx];
    const correct = quiz.confirmed && quiz.selected === q.answer;
    return html`${head}
      <div class="quiz-dots" aria-label="Pregunta ${quiz.idx + 1} de ${t.quiz.length}">${t.quiz.map((_, i) => html`<span class="${i < quiz.idx ? (quiz.answers[i] ? 'ok' : 'miss') : i === quiz.idx ? 'cur' : ''}"></span>`)}</div>
      <form class="card quiz-card" data-quiz novalidate>
        <fieldset>
          <legend><span class="eyebrow">Pregunta ${quiz.idx + 1} de ${t.quiz.length}</span><span class="quiz-q">${q.q}</span></legend>
          <div class="quiz-options">${q.options.map((o, i) => {
            const state = quiz.confirmed ? (i === q.answer ? 'is-correct' : i === quiz.selected ? 'is-wrong' : '') : '';
            return html`<label class="choice quiz-option ${state}"><input type="radio" name="opt" value="${i}" ${quiz.selected === i ? raw('checked') : ''} ${quiz.confirmed ? raw('disabled') : ''}><span class="opt-letter" aria-hidden="true">${'ABC'[i]}</span><span class="choice-title">${o}</span>${state === 'is-correct' ? icon('check-circle', { size: 22 }) : state === 'is-wrong' ? icon('x-circle', { size: 22 }) : ''}</label>`;
          })}</div>
        </fieldset>
        <div aria-live="polite">${quiz.confirmed ? html`<div class="quiz-feedback ${correct ? 'ok' : 'try'}"><span>${dino({ mood: correct ? 'happy' : 'think', size: 70 })}</span><div><strong>${correct ? '¡Muy bien!' : 'Casi. ¡Aprendamos juntos!'}</strong><p class="mb-0">${q.explain}</p></div></div>` : ''}</div>
        <div class="form-actions">
          ${!quiz.confirmed ? html`<button type="submit" class="btn btn-primary btn-lg" data-confirm ${quiz.selected == null ? raw('disabled') : ''}>Confirmar respuesta</button>`
            : quiz.idx < t.quiz.length - 1 ? html`<button type="button" class="btn btn-primary btn-lg" data-next>Siguiente pregunta ${icon('arrow-right', { size: 18 })}</button>`
            : html`<button type="button" class="btn btn-primary btn-lg" data-finish>Ver resultado ${icon('star', { size: 18 })}</button>`}
        </div>
      </form>
      <p class="small muted center">Para completar el tema necesitás al menos ${PASS_SCORE} respuestas correctas de ${t.quiz.length}.</p>`;
  },
  mount: (el, ctx) => {
    if (!ctx.student) return;
    const t = topicById(ctx.params.tid);
    const form = el.querySelector('[data-quiz]');
    if (form) {
      form.querySelectorAll('input[name="opt"]').forEach((r) => r.addEventListener('change', () => { quiz.selected = Number(r.value); form.querySelector('[data-confirm]').disabled = false; }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (quiz.selected == null || quiz.confirmed) return;
        quiz.confirmed = true;
        quiz.answers[quiz.idx] = quiz.selected === t.quiz[quiz.idx].answer;
        ctx.refresh();
        el.ownerDocument.querySelector('[data-next], [data-finish]')?.focus();
      });
      el.querySelector('[data-next]')?.addEventListener('click', () => { quiz.idx += 1; quiz.selected = null; quiz.confirmed = false; ctx.refresh(); document.querySelector('.quiz-option input')?.focus(); });
      el.querySelector('[data-finish]')?.addEventListener('click', () => {
        const score = quiz.answers.filter(Boolean).length;
        const res = submitQuiz(ctx.student.id, t.id, score); // se registra una sola vez por intento
        quiz.result = { score, ...res };
        ctx.refresh();
        document.querySelector('[data-result-title]')?.focus();
      });
    }
    el.querySelector('[data-retry]')?.addEventListener('click', () => { resetQuiz(quiz.key); ctx.refresh(); });
  },
};

function resultView(ctx, t) {
  const { score, topic, newlyCompleted, fresh } = quiz.result;
  const pass = score >= PASS_SCORE;
  const b = base(ctx);
  const next = TOPICS[(TOPICS.indexOf(t) + 1) % TOPICS.length];
  return html`<section class="card result-card ${pass ? 'celebrate' : ''}" aria-labelledby="res-t">
    ${pass ? confetti() : ''}
    <span class="pop">${dino({ mood: pass ? 'happy' : 'think', size: 140 })}</span>
    <h2 id="res-t" data-result-title tabindex="-1">${pass ? (newlyCompleted ? '¡Tema completado!' : '¡Excelente repaso!') : '¡Buen intento!'}</h2>
    <p class="result-score"><strong>${score}</strong> de ${t.quiz.length} respuestas correctas</p>
    <p>${pass ? 'Aprendiste algo muy importante para cuidarte.' : 'Cada intento te ayuda a aprender. Repasá la lección y volvé a intentarlo cuando quieras.'}</p>
    <p class="small muted">Mejor resultado: ${topic.best} de ${t.quiz.length} · Intentos: ${topic.attempts}${topic.completed ? ' · Tema completado' : ''}</p>
    ${fresh.length ? html`<div class="new-badges">${fresh.map((a) => html`<div class="badge-mini pop">${badge(a, true, 64)}<strong class="small">${a.title}</strong><span class="xsmall muted">${a.desc}</span></div>`)}</div>` : ''}
    <div class="row" style="justify-content:center">
      <button type="button" class="btn btn-secondary" data-retry>${icon('refresh', { size: 18 })} Intentar de nuevo</button>
      ${pass ? html`<a class="btn btn-primary" href="#${b}/tema/${next.id}">Siguiente tema: ${next.short} ${icon('arrow-right', { size: 18 })}</a>` : html`<a class="btn btn-primary" href="#${b}/tema/${t.id}">Repasar la lección</a>`}
      <a class="btn btn-ghost" href="#${b}">Volver a los temas</a>
    </div>
  </section>`;
}

/* ---------- Cuento interactivo ---------- */
let story = null;
export const cuentoPage = {
  title: (ctx) => storyById(ctx.params.id)?.title || 'Cuento', nav: (ctx) => (ctx.kid ? 'ninos-cuento' : 'aprende'),
  access: (ctx) => (storyById(ctx.params.id) ? true : 'Este cuento no existe.'),
  view: (ctx) => {
    if (!ctx.student) return noStudent(ctx);
    const s = storyById(ctx.params.id);
    const key = `${ctx.student.id}|${s.id}`;
    if (!story || story.key !== key || (!ctx.isRefresh && story.done)) story = { key, page: 0, choice: null, solved: {}, done: false };
    const b = base(ctx);
    if (story.done) {
      return html`<section class="card result-card celebrate">${confetti()}<span class="pop">${dino({ mood: 'happy', size: 140 })}</span>
        <h1 data-page-title tabindex="-1">¡Fin del cuento!</h1><p>Gluki aprendió que avisar a un adulto a tiempo es lo más valiente.</p>
        ${story.fresh?.length ? html`<div class="new-badges">${story.fresh.map((a) => html`<div class="badge-mini pop">${badge(a, true, 64)}<strong class="small">${a.title}</strong></div>`)}</div>` : ''}
        <div class="row" style="justify-content:center"><button type="button" class="btn btn-secondary" data-again>${icon('refresh', { size: 18 })} Leer otra vez</button><a class="btn btn-primary" href="#${b}">Volver a los temas</a></div></section>`;
    }
    const p = s.pages[story.page];
    const chosen = story.choice != null ? p.choices?.[story.choice] : null;
    const canNext = !p.question || story.solved[story.page];
    return html`<a class="btn btn-ghost btn-sm" href="#${b}">${icon('arrow-left', { size: 16 })} Volver</a>
      <h1 class="mt-2" data-page-title tabindex="-1">${s.title}</h1>
      <article class="card story-card">
        <div class="story-art">${storyScene(p.scene, { label: `Escena ${story.page + 1} del cuento` })}</div>
        <div class="story-text">
          <p class="eyebrow">Página ${story.page + 1} de ${s.pages.length}</p>
          <p class="story-p">${p.text}</p>
          ${p.question ? html`<fieldset><legend class="strong">${p.question}</legend><div class="stack-sm mt-2">${p.choices.map((c, i) => html`<button type="button" class="btn ${story.solved[story.page] && c.ok ? 'btn-success' : ''} btn-block story-choice" data-choice="${i}" ${story.solved[story.page] ? raw('disabled') : ''}>${c.label}</button>`)}</div></fieldset>
            <div aria-live="polite">${chosen ? html`<div class="quiz-feedback ${chosen.ok ? 'ok' : 'try'} mt-4"><span>${dino({ mood: chosen.ok ? 'happy' : 'think', size: 60 })}</span><p class="mb-0">${chosen.feedback}</p></div>` : ''}</div>` : ''}
          <div class="row-between mt-4">
            <button type="button" class="btn btn-ghost" data-prev ${story.page === 0 ? raw('disabled') : ''}>${icon('arrow-left', { size: 18 })} Anterior</button>
            ${story.page < s.pages.length - 1
              ? html`<button type="button" class="btn btn-primary" data-next-page ${canNext ? '' : raw('disabled aria-describedby="need-choice"')}>Siguiente ${icon('arrow-right', { size: 18 })}</button>`
              : html`<button type="button" class="btn btn-primary" data-end>${icon('check', { size: 18 })} Terminar cuento</button>`}
          </div>
          ${!canNext ? html`<p class="xsmall muted mt-2" id="need-choice">Elegí la mejor opción para continuar.</p>` : ''}
        </div>
      </article>`;
  },
  mount: (el, ctx) => {
    if (!ctx.student) return;
    const s = storyById(ctx.params.id);
    el.querySelectorAll('[data-choice]').forEach((bt) => bt.addEventListener('click', () => {
      story.choice = Number(bt.dataset.choice);
      if (s.pages[story.page].choices[story.choice].ok) story.solved[story.page] = true;
      ctx.refresh();
    }));
    el.querySelector('[data-prev]')?.addEventListener('click', () => { story.page -= 1; story.choice = null; ctx.refresh(); });
    el.querySelector('[data-next-page]')?.addEventListener('click', () => { story.page += 1; story.choice = null; ctx.refresh(); });
    el.querySelector('[data-end]')?.addEventListener('click', () => { story.fresh = finishStory(ctx.student.id, s.id); story.done = true; ctx.refresh(); });
    el.querySelector('[data-again]')?.addEventListener('click', () => { story = null; ctx.refresh(); });
  },
};

/* ---------- Logros ---------- */
export const logrosPage = {
  title: 'Logros', nav: (ctx) => (ctx.kid ? 'ninos-logros' : 'aprende'),
  view: (ctx) => {
    if (!ctx.student) return noStudent(ctx);
    const prog = progressFor(ctx.student.id);
    const b = base(ctx);
    return html`<a class="btn btn-ghost btn-sm" href="#${b}">${icon('arrow-left', { size: 16 })} Volver a los temas</a>
      <h1 class="mt-2" data-page-title tabindex="-1">${icon('trophy', { size: 28, cls: 'inline-icon' })} ${ctx.kid ? 'Mis logros' : `Logros de ${firstName(ctx.student.name)}`}</h1>
      <p class="muted">Los logros se ganan aprendiendo y participando. Nunca dependen de los valores de glucosa.</p>
      <div class="badge-grid">${ACHIEVEMENTS.map((a) => { const at = prog.achievements?.[a.id]; return html`<article class="card badge-card ${at ? '' : 'is-locked'}">
        ${badge(a, !!at, 76)}<h2 class="h4 mb-0">${a.title}</h2><p class="small mb-0">${a.desc}</p>
        <span class="xsmall ${at ? 'strong' : 'muted'}">${at ? `Obtenido el ${fmtDate(at)}` : 'Por desbloquear'}</span>
      </article>`; })}</div>`;
  },
};

export { studentById };
