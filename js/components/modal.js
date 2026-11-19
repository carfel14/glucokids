/* =========================================================
   Modal accesible: cierra con Escape, atrapa el foco y lo devuelve
   al control que lo abrió.
   ========================================================= */
import { html } from '../utils.js';
import { icon } from '../icons.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const stack = [];

/**
 * @param {{title:string, body:any, size?:'sm'|'lg', onMount?:(el, close)=>void, onClose?:()=>void, dismissible?:boolean, label?:string}} o
 * @returns {{el:HTMLElement, close:()=>void}}
 */
export function openModal({ title, body, size = '', onMount, onClose, dismissible = true, tag = '' }) {
  const opener = document.activeElement;
  const root = document.createElement('div');
  root.className = 'modal-root';
  const titleId = `modal-title-${Date.now()}`;
  root.innerHTML = String(html`
    <div class="modal-backdrop" data-close></div>
    <div class="modal ${size ? `modal-${size}` : ''}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <div class="modal-header">
        <div class="grow">
          ${tag ? html`<span class="sim-tag">${icon('info', { size: 14 })} ${tag}</span>` : ''}
          <h2 id="${titleId}" ${tag ? 'style="margin-top:8px"' : ''}>${title}</h2>
        </div>
        ${dismissible ? html`<button type="button" class="btn btn-ghost btn-icon modal-close" data-close aria-label="Cerrar">${icon('x')}</button>` : ''}
      </div>
      <div class="modal-body"></div>
    </div>`);
  const bodyEl = root.querySelector('.modal-body');
  bodyEl.innerHTML = String(body ?? '');
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';
  // El resto de la página queda inerte mientras el modal está abierto
  const appRoot = document.getElementById('app');
  if (appRoot && stack.length === 0) appRoot.setAttribute('inert', '');

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    root.classList.add('closing');
    document.removeEventListener('keydown', onKey, true);
    const finish = () => {
      root.remove();
      stack.splice(stack.indexOf(api), 1);
      if (stack.length === 0) {
        document.body.style.overflow = '';
        appRoot?.removeAttribute('inert');
      }
      onClose?.();
      if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus();
    };
    const reduce = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) finish(); else setTimeout(finish, 140);
  }
  function onKey(e) {
    if (stack[stack.length - 1] !== api) return;
    if (e.key === 'Escape' && dismissible) { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener('keydown', onKey, true);
  root.addEventListener('click', (e) => { if (e.target.closest('[data-close]') && dismissible) close(); });

  const api = { el: root, body: bodyEl, close };
  stack.push(api);
  onMount?.(bodyEl, close);
  requestAnimationFrame(() => {
    const auto = bodyEl.querySelector('[autofocus]') || bodyEl.querySelector(FOCUSABLE) || root.querySelector(FOCUSABLE);
    auto?.focus();
  });
  return api;
}

/** Diálogo de confirmación. Resuelve true/false. */
export function confirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    openModal({
      title, size: 'sm',
      body: html`<p>${message}</p>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-close>${cancelLabel}</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${confirmLabel}</button>
        </div>`,
      onMount: (el, close) => {
        el.querySelector('[data-confirm]').addEventListener('click', () => { result = true; close(); });
      },
      onClose: () => resolve(result),
    });
  });
}

export function closeAllModals() { [...stack].reverse().forEach((m) => m.close()); }
