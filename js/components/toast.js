/* =========================================================
   Notificaciones visuales integradas (sin alert()).
   ========================================================= */
import { html } from '../utils.js';
import { icon } from '../icons.js';

let region;
function ensureRegion() {
  if (region && document.body.contains(region)) return region;
  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

/**
 * @param {string} message
 * @param {{type?:'success'|'error'|'info'|'warn', title?:string, action?:{label:string, onClick:()=>void}, duration?:number}} o
 */
export function toast(message, { type = 'info', title = '', action = null, duration = 4200 } = {}) {
  const r = ensureRegion();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const ic = { success: 'check-circle', error: 'alert', warn: 'bell', info: 'info' }[type] || 'info';
  el.innerHTML = String(html`
    <span class="toast-icon">${icon(ic)}</span>
    <div class="toast-body">
      ${title ? html`<strong>${title}</strong><br>` : ''}<span>${message}</span>
      ${action ? html`<div class="toast-actions"><button type="button" data-act>${action.label}</button></div>` : ''}
    </div>
    <button type="button" class="toast-close" aria-label="Cerrar notificación">${icon('x', { size: 16 })}</button>`);
  r.appendChild(el);
  let timer;
  const remove = () => {
    clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 160);
  };
  el.querySelector('.toast-close').addEventListener('click', remove);
  if (action) el.querySelector('[data-act]').addEventListener('click', () => { action.onClick(); remove(); });
  const start = () => { timer = setTimeout(remove, action ? Math.max(duration, 6500) : duration); };
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', start);
  el.addEventListener('focusin', () => clearTimeout(timer));
  start();
  return remove;
}
