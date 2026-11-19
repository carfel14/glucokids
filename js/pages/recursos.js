/* =========================================================
   Biblioteca de recursos (RF-14): búsqueda, filtros por público y tema,
   lecturas, cuento, actividad y fichas imprimibles reales.
   ========================================================= */
import { html, raw, normalize, plural, fmtDate } from '../utils.js';
import { icon } from '../icons.js';
import { storyScene, topicArt } from '../illustrations.js';
import { RESOURCES, resourceById, AUDIENCES, RES_TOPICS, RES_TYPES, SOURCES } from '../content/resources.js';
import { storyById } from '../content/story.js';
import { setResourceRead, isResourceRead } from '../actions.js';
import { pageHeader, emptyState, healthNote, notice } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { getState } from '../store.js';

const f = { q: '', audience: '', topic: '', type: '' };
const TYPE_ICON = { lectura: 'book', cuento: 'sparkles', actividad: 'gamepad', ficha: 'printer' };

export const recursosPage = {
  title: 'Recursos', nav: 'recursos', shell: 'auto',
  view: (ctx) => html`${pageHeader({ title: 'Biblioteca de recursos', eyebrow: 'Recursos educativos', sub: 'Lecturas, un cuento, una actividad y fichas imprimibles. Contenido general que remite siempre al plan individual.' })}
    <form class="card card-tight filter-bar" role="search" data-res-filters onsubmit="return false">
      <div class="field grow"><label for="r-q">Buscar</label><div class="input-group"><span class="lead-icon">${icon('search', { size: 18 })}</span><input class="input" id="r-q" name="q" type="search" value="${f.q}" placeholder="Ej. señales, merienda, plan"></div></div>
      <div class="field"><label for="r-a">Público</label><select class="select" id="r-a" name="audience"><option value="">Todos</option>${Object.entries(AUDIENCES).map(([k, v]) => html`<option value="${k}" ${f.audience === k ? raw('selected') : ''}>${v}</option>`)}</select></div>
      <div class="field"><label for="r-t">Tema</label><select class="select" id="r-t" name="topic"><option value="">Todos</option>${Object.entries(RES_TOPICS).map(([k, v]) => html`<option value="${k}" ${f.topic === k ? raw('selected') : ''}>${v}</option>`)}</select></div>
      <div class="field"><label for="r-y">Tipo</label><select class="select" id="r-y" name="type"><option value="">Todos</option>${Object.entries(RES_TYPES).map(([k, v]) => html`<option value="${k}" ${f.type === k ? raw('selected') : ''}>${v}</option>`)}</select></div>
    </form>
    <p class="small muted mt-4" aria-live="polite" data-count></p>
    <div class="grid-auto" data-res-grid>${RESOURCES.map((r) => { const read = ctx.user && isResourceRead(ctx.user.id, r.id); return html`
      <article class="card resource-card" data-text="${normalize(`${r.title} ${r.summary}`)}" data-aud="${r.audience.join(' ')}" data-topic="${r.topic}" data-type="${r.type}">
        <div class="row-between"><span class="chip chip-info">${icon(TYPE_ICON[r.type], { size: 14 })} ${RES_TYPES[r.type]}</span>${ctx.user ? html`<span class="chip ${read ? 'chip-ok' : ''}">${read ? 'Leído' : 'Sin leer'}</span>` : html`<span class="xsmall muted">${r.minutes} min</span>`}</div>
        <h2 class="h3 mt-4">${r.title}</h2>
        <p class="small muted">${r.summary}</p>
        <p class="xsmall mb-2">${r.audience.map((a) => AUDIENCES[a]).join(' · ')} · ${RES_TOPICS[r.topic]}</p>
        <a class="btn btn-secondary btn-block" href="#/recursos/${r.id}">Abrir ${icon('arrow-right', { size: 18 })}</a>
      </article>`; })}</div>
    <div data-res-empty hidden>${emptyState({ ic: 'search', title: 'Ningún recurso coincide', text: 'Probá con otra palabra o quitá algún filtro.' })}</div>
    <div class="mt-6">${healthNote()}</div>`,
  mount: (el) => {
    const form = el.querySelector('[data-res-filters]');
    const apply = () => {
      Object.assign(f, { q: form.q.value, audience: form.audience.value, topic: form.topic.value, type: form.type.value });
      const words = normalize(f.q).trim().split(/\s+/).filter(Boolean);
      let n = 0;
      el.querySelectorAll('.resource-card').forEach((c) => {
        const ok = words.every((w) => c.dataset.text.includes(w)) && (!f.audience || c.dataset.aud.split(' ').includes(f.audience)) && (!f.topic || c.dataset.topic === f.topic) && (!f.type || c.dataset.type === f.type);
        c.hidden = !ok; if (ok) n++;
      });
      el.querySelector('[data-res-empty]').hidden = n > 0;
      el.querySelector('[data-count]').textContent = `${plural(n, 'recurso', 'recursos')} de ${RESOURCES.length}`;
    };
    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    apply();
  },
};

function block(b) {
  if (b.h) return html`<h2 class="h3">${b.h}</h2>`;
  if (b.p) return html`<p>${b.p}</p>`;
  if (b.list) return html`<ul class="bullets">${b.list.map((i) => html`<li>${i}</li>`)}</ul>`;
  if (b.steps) return html`<ol class="protocol-steps">${b.steps.map((s, i) => html`<li><span class="step-n">${i + 1}</span><div>${s}</div></li>`)}</ol>`;
  if (b.note) return notice(b.note, '', 'info');
  if (b.danger) return html`<div class="notice notice-danger">${icon('siren')}<p class="mb-0"><strong>${b.danger}</strong></p></div>`;
  return '';
}

function bodyFor(r, ctx) {
  if (r.type === 'ficha' && r.form) {
    return html`<p>${r.form.intro}</p><div class="print-form">${r.form.fields.map((fl) => html`<div class="print-line"><span>${fl}</span><span class="blank"></span></div>`)}</div>`;
  }
  if (r.type === 'ficha' && r.table) {
    return html`<p>${r.table.intro}</p><div class="table-wrap"><table class="table print-table"><caption class="sr-only">${r.title}</caption><thead><tr>${r.table.head.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead><tbody>${Array.from({ length: r.table.rows }, () => html`<tr>${r.table.head.map(() => html`<td>&nbsp;</td>`)}</tr>`)}</tbody></table></div>`;
  }
  if (r.type === 'cuento') {
    const s = storyById(r.story);
    return html`<p>${s.summary}</p>
      ${ctx.user ? html`<a class="btn btn-primary btn-lg" href="#/aprende/cuento/${s.id}">${icon('play', { size: 18 })} Leer la versión interactiva</a>` : notice('Iniciá sesión para leer la versión interactiva y guardar el logro. Aquí podés ver la lección ilustrada completa.', '', 'info')}
      <div class="stack mt-6">${s.pages.map((p, i) => html`<figure class="story-static"><div class="story-art">${storyScene(p.scene, { label: `Escena ${i + 1}` })}</div><figcaption><p class="mb-0">${p.text}</p>${p.question ? html`<p class="small mt-2 mb-0"><strong>Para conversar:</strong> ${p.question} (${p.choices.find((c) => c.ok).label})</p>` : ''}</figcaption></figure>`)}</div>`;
  }
  if (r.type === 'actividad') {
    return html`<div class="activity" data-activity>
      <div class="row" style="flex-wrap:nowrap">${topicArt('ayuda', { size: 90 })}<p class="mb-0 strong">${r.activity.prompt}</p></div>
      <div class="choice-grid mt-4">${r.activity.items.map((it, i) => html`<button type="button" class="choice act-item" data-item="${i}" aria-pressed="false"><span class="card-icon">${icon('backpack', { size: 20 })}</span><span class="choice-title">${it.label}</span></button>`)}</div>
      <div class="row mt-4"><button type="button" class="btn btn-primary" data-check>${icon('check')} Revisar mi mochila</button><button type="button" class="btn btn-ghost" data-reset>Empezar de nuevo</button></div>
      <div aria-live="polite" data-act-result class="mt-4"></div>
    </div>`;
  }
  return html`${r.body.map(block)}`;
}

export const recursoDetalle = {
  title: (ctx) => resourceById(ctx.params.id)?.title || 'Recurso', nav: 'recursos', shell: 'auto',
  access: (ctx) => (resourceById(ctx.params.id) ? true : 'El recurso solicitado no existe.'),
  view: (ctx) => {
    const r = resourceById(ctx.params.id);
    const read = ctx.user && isResourceRead(ctx.user.id, r.id);
    const readAt = ctx.user && getState().resourcesRead[ctx.user.id]?.[r.id];
    return html`<a class="btn btn-ghost btn-sm no-print" href="#/recursos">${icon('arrow-left', { size: 16 })} Biblioteca</a>
      <article class="card reader printable mt-2">
        <header class="reader-head">
          <div class="row"><span class="chip chip-info">${icon(TYPE_ICON[r.type], { size: 14 })} ${RES_TYPES[r.type]}</span><span class="chip">${r.minutes} min</span><span class="chip">${r.audience.map((a) => AUDIENCES[a]).join(' · ')}</span></div>
          <h1 class="mt-4" data-page-title tabindex="-1">${r.title}</h1>
          <p class="muted">${r.summary}</p>
        </header>
        <div class="reader-body">${bodyFor(r, ctx)}</div>
        ${r.sources?.length ? html`<footer class="reader-sources"><h2 class="h4">Fuentes consultadas</h2><ul class="bullets small">${r.sources.map((k) => html`<li><a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${SOURCES[k].label} ${icon('arrow-right', { size: 12, cls: 'inline-icon' })}</a></li>`)}</ul><p class="xsmall muted mb-0">Contenido redactado de forma general para esta demostración; no constituye validación profesional.</p></footer>` : ''}
        <p class="print-only xsmall">GlucoKids · Demostración con datos ficticios. El cuidado debe seguir el plan individual indicado por el equipo de salud.</p>
      </article>
      <div class="row mt-4 no-print">
        ${ctx.user ? html`<button type="button" class="btn ${read ? '' : 'btn-success'}" data-read="${read ? '' : '1'}">${icon(read ? 'undo' : 'check', { size: 18 })} ${read ? 'Marcar como no leído' : 'Marcar como leído'}</button>${read ? html`<span class="small muted">Leído el ${fmtDate(readAt)}</span>` : ''}` : ''}
        ${r.type === 'ficha' || r.type === 'lectura' ? html`<button type="button" class="btn" data-print>${icon('printer', { size: 18 })} ${r.type === 'ficha' ? 'Imprimir ficha' : 'Imprimir lectura'}</button>` : ''}
      </div>
      <div class="mt-6 no-print">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    const r = resourceById(ctx.params.id);
    el.querySelector('[data-print]')?.addEventListener('click', () => window.print());
    el.querySelector('[data-read]')?.addEventListener('click', (e) => {
      const mark = !!e.currentTarget.dataset.read;
      setResourceRead(ctx.user.id, r.id, mark);
      toast(mark ? 'Recurso marcado como leído.' : 'Recurso marcado como no leído.', { type: 'success' });
      ctx.refresh();
    });
    const act = el.querySelector('[data-activity]');
    if (act) {
      const sel = new Set();
      act.querySelectorAll('[data-item]').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.item);
        if (sel.has(i)) sel.delete(i); else sel.add(i);
        b.setAttribute('aria-pressed', String(sel.has(i)));
        b.classList.toggle('picked', sel.has(i));
      }));
      act.querySelector('[data-check]').addEventListener('click', () => {
        const items = r.activity.items;
        const okCount = items.filter((it, i) => it.ok === sel.has(i)).length;
        act.querySelector('[data-act-result]').innerHTML = String(html`<div class="notice ${okCount === items.length ? 'notice-ok' : 'notice-warn'}">${icon(okCount === items.length ? 'check-circle' : 'info')}<div><strong>${okCount === items.length ? '¡Tu mochila está lista!' : `Acertaste ${okCount} de ${items.length}. ¡Revisemos juntos!`}</strong>
          <ul class="bullets small mt-2 mb-0">${items.map((it, i) => html`<li>${it.label}: ${it.ok ? 'sí va' : 'mejor no'} — ${it.why}${it.ok !== sel.has(i) ? ' ✱' : ''}</li>`)}</ul></div></div>`);
      });
      act.querySelector('[data-reset]').addEventListener('click', () => {
        sel.clear();
        act.querySelectorAll('[data-item]').forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('picked'); });
        act.querySelector('[data-act-result]').innerHTML = '';
      });
    }
  },
};
