/* =========================================================
   Mensajes (RF-11): conversaciones familia–docente por estudiante.
   La comunicación ocurre en el estado local de la demostración; no hay envío entre dispositivos.
   ========================================================= */
import { html, raw, firstName, fmtTime, fmtDate, relTime, localParts, capitalize } from '../utils.js';
import { icon } from '../icons.js';
import { conversationsForUser, studentById, canAccessConversation } from '../data.js';
import { sendMessage, markConversationRead } from '../actions.js';
import { pageHeader, emptyState, studentAvatar, notice } from '../components/ui.js';
import { toast } from '../components/toast.js';

const QUICK = ['He revisado el plan.', 'Gracias por la actualización.', 'Recibido, lo coordinamos.', '¿Podemos conversar a la salida?'];
const drafts = {};

export function convAccess(ctx) {
  return canAccessConversation(ctx.user, ctx.params.cid) ? true : 'No tenés acceso a esta conversación. Puede que la vinculación con el estudiante se haya revocado.';
}

export const mensajesPage = {
  title: 'Mensajes', nav: 'mensajes',
  view: (ctx) => {
    const { user } = ctx;
    const cid = ctx.params.cid;
    if (cid) markConversationRead(user, cid); // se marca leído cuando el destinatario abre la conversación
    const convs = conversationsForUser(user);
    const conv = cid ? convs.find((c) => c.id === cid) : null;
    return html`${pageHeader({ title: 'Mensajes', eyebrow: 'Comunicación familia–escuela', sub: 'Conversaciones vinculadas a cada estudiante. Se guardan en este navegador y se ven desde el otro perfil demo.' })}
      <div class="chat-layout ${conv ? 'has-conv' : ''}">
        <aside class="card chat-list" aria-label="Conversaciones">
          ${convs.length ? html`<ul class="list">${convs.map((c) => { const s = studentById(c.studentId); return html`<li style="padding:4px 0;border:0"><a class="conv-link ${c.id === cid ? 'active' : ''}" href="#/mensajes/${c.id}" ${c.id === cid ? raw('aria-current="page"') : ''}>
              ${studentAvatar(s, 'avatar-sm')}
              <span class="grow" style="min-width:0"><strong class="truncate" style="display:block">${c.counterpart?.name}</strong><span class="xsmall muted truncate" style="display:block">Sobre ${firstName(s.name)}${c.last ? ` · ${c.last.fromId === user.id ? 'Vos: ' : ''}${c.last.text}` : ' · Sin mensajes'}</span></span>
              ${c.unread ? html`<span class="chip chip-solid">${c.unread}<span class="sr-only"> sin leer</span></span>` : c.last ? html`<span class="xsmall muted nowrap">${relTime(c.last.at).replace(/^hoy, /, '')}</span>` : ''}
            </a></li>`; })}</ul>`
            : emptyState({ ic: 'message', title: 'Sin conversaciones', text: user.role === 'familia' ? 'Compartí el plan con un docente para conversar.' : 'Las conversaciones aparecen con estudiantes vinculados.' })}
        </aside>
        <section class="card chat-panel" aria-label="Conversación">
          ${conv ? chatView(conv, user) : emptyState({ ic: 'messages', title: 'Elegí una conversación', text: 'Seleccioná una conversación de la lista para leer y responder.' })}
        </section>
      </div>`;
  },
  mount: (el, ctx) => {
    const box = el.querySelector('[data-messages]');
    if (box) box.scrollTop = box.scrollHeight;
    const form = el.querySelector('[data-composer]');
    if (!form) return;
    const cid = ctx.params.cid;
    const ta = form.querySelector('textarea');
    ta.value = drafts[cid] || '';
    ta.addEventListener('input', () => { drafts[cid] = ta.value; });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    el.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => { ta.value = ta.value ? `${ta.value} ${b.dataset.quick}` : b.dataset.quick; drafts[cid] = ta.value; ta.focus(); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = ta.value.trim();
      const err = form.querySelector('[data-err]');
      if (!t) { err.hidden = false; ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
      if (t.length > 1000) { toast('El mensaje es demasiado largo (máximo 1000 caracteres).', { type: 'error' }); return; }
      sendMessage(ctx.user, cid, t);
      drafts[cid] = '';
      ctx.refresh();
      document.querySelector('[data-composer] textarea')?.focus();
    });
    if (ctx.route && !ctx.query.nofocus) ta.focus({ preventScroll: true });
  },
};

function chatView(conv, user) {
  const s = studentById(conv.studentId);
  let lastDay = '';
  return html`<div class="chat-head">
      <a class="btn btn-ghost btn-icon chat-back" href="#/mensajes" aria-label="Volver a las conversaciones">${icon('arrow-left')}</a>
      ${studentAvatar(s, 'avatar-sm')}
      <div class="grow"><h2 class="h3 mb-0">${conv.counterpart?.name}</h2><span class="xsmall muted">${user.role === 'familia' ? 'Docente' : 'Familia'} · sobre ${s.name}</span></div>
    </div>
    <div class="chat-messages" data-messages tabindex="0" aria-label="Mensajes de la conversación" role="log">
      ${conv.messages.length ? conv.messages.map((m) => {
        const day = localParts(m.at).date;
        const sep = day !== lastDay ? html`<p class="day-sep"><span>${capitalize(fmtDate(m.at, { weekday: 'long', day: 'numeric', month: 'long' }))}</span></p>` : '';
        lastDay = day;
        const mine = m.fromId === user.id;
        return html`${sep}<div class="bubble-row ${mine ? 'mine' : ''}"><div class="bubble">
          <span class="sr-only">${mine ? 'Vos escribiste' : `${conv.counterpart?.name} escribió`}:</span>
          <p class="mb-0">${m.text}</p>
          <span class="bubble-meta">${fmtTime(m.at)}${mine ? html` · ${m.readAt ? html`${icon('check', { size: 12 })}${icon('check', { size: 12 })} Leído` : html`${icon('check', { size: 12 })} Enviado`}` : ''}</span>
        </div></div>`;
      }) : html`<p class="muted center small">Todavía no hay mensajes. Escribí el primero.</p>`}
    </div>
    ${conv.active ? html`<form class="composer" data-composer novalidate>
        <div class="quick-replies" role="group" aria-label="Respuestas rápidas">${QUICK.map((q) => html`<button type="button" class="chip quick" data-quick="${q}">${q}</button>`)}</div>
        <label class="sr-only" for="composer-text">Escribir mensaje</label>
        <div class="row" style="flex-wrap:nowrap;align-items:flex-end">
          <textarea class="textarea" id="composer-text" rows="2" maxlength="1000" placeholder="Escribí un mensaje de coordinación…" aria-describedby="composer-hint"></textarea>
          <button class="btn btn-primary btn-icon" type="submit" aria-label="Enviar mensaje">${icon('send')}</button>
        </div>
        <p class="field-error" data-err hidden>${icon('alert', { size: 16 })}<span>Escribí un mensaje antes de enviar.</span></p>
        <p class="xsmall muted mb-0" id="composer-hint">Enter para enviar, Shift + Enter para nueva línea. Los mensajes no reemplazan la comunicación inmediata en una emergencia ni contienen consejos clínicos.</p>
      </form>`
      : notice('La vinculación con este docente ya no está activa: podés leer el historial, pero no enviar mensajes.', 'warn', 'lock')}`;
}
