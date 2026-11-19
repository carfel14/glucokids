/* =========================================================
   Ayudas de formularios: campos con etiqueta visible y errores junto al campo.
   ========================================================= */
import { html, raw } from '../utils.js';
import { icon } from '../icons.js';

let seq = 0;
const fid = (name) => `f-${name}-${++seq}`;

/** Campo de texto/número/fecha/etc. */
export function field({ name, label, type = 'text', value = '', required = false, hint = '', attrs = '', cls = '', placeholder = '', readonly = false, autocomplete = '' }) {
  const id = fid(name);
  return html`<div class="field ${cls}" data-field="${name}">
    <label for="${id}">${label}${required ? html` <span class="req" aria-hidden="true">*</span>` : ''}</label>
    <input class="input" id="${id}" name="${name}" type="${type}" value="${value ?? ''}" ${required ? raw('required aria-required="true"') : ''} ${readonly ? raw('readonly') : ''} ${placeholder ? raw(`placeholder="${String(placeholder).replace(/"/g, '&quot;')}"`) : ''} ${autocomplete ? raw(`autocomplete="${autocomplete}"`) : ''} ${raw(attrs)} ${hint ? raw(`aria-describedby="${id}-hint"`) : ''}>
    ${hint ? html`<span class="hint" id="${id}-hint">${hint}</span>` : ''}
  </div>`;
}
export function textarea({ name, label, value = '', required = false, hint = '', attrs = '', cls = '', placeholder = '' }) {
  const id = fid(name);
  return html`<div class="field ${cls}" data-field="${name}">
    <label for="${id}">${label}${required ? html` <span class="req" aria-hidden="true">*</span>` : ''}</label>
    <textarea class="textarea" id="${id}" name="${name}" ${required ? raw('required aria-required="true"') : ''} ${placeholder ? raw(`placeholder="${String(placeholder).replace(/"/g, '&quot;')}"`) : ''} ${raw(attrs)} ${hint ? raw(`aria-describedby="${id}-hint"`) : ''}>${value ?? ''}</textarea>
    ${hint ? html`<span class="hint" id="${id}-hint">${hint}</span>` : ''}
  </div>`;
}
/** options: [{value,label}] | {value:label} */
export function select({ name, label, options, value = '', required = false, hint = '', cls = '', placeholder = 'Elegí una opción', attrs = '' }) {
  const id = fid(name);
  const opts = Array.isArray(options) ? options : Object.entries(options).map(([v, l]) => ({ value: v, label: typeof l === 'string' ? l : l.label }));
  return html`<div class="field ${cls}" data-field="${name}">
    <label for="${id}">${label}${required ? html` <span class="req" aria-hidden="true">*</span>` : ''}</label>
    <select class="select" id="${id}" name="${name}" ${required ? raw('required aria-required="true"') : ''} ${raw(attrs)} ${hint ? raw(`aria-describedby="${id}-hint"`) : ''}>
      ${placeholder ? html`<option value="">${placeholder}</option>` : ''}
      ${opts.map((o) => html`<option value="${o.value}" ${String(o.value) === String(value) ? raw('selected') : ''}>${o.label}</option>`)}
    </select>
    ${hint ? html`<span class="hint" id="${id}-hint">${hint}</span>` : ''}
  </div>`;
}
export function checkbox({ name, label, checked = false, hint = '' }) {
  return html`<label class="check"><input type="checkbox" name="${name}" ${checked ? raw('checked') : ''}><span>${label}${hint ? html`<br><span class="xsmall muted">${hint}</span>` : ''}</span></label>`;
}

/** Muestra los errores junto a cada campo y enfoca el primero. Devuelve true si hubo errores. */
export function showErrors(form, errors) {
  clearErrors(form);
  const entries = Object.entries(errors || {}).filter(([, m]) => m);
  entries.forEach(([name, msg]) => {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (!wrap) return;
    wrap.classList.add('has-error');
    const ctrl = wrap.querySelector('input, select, textarea');
    const errId = `${ctrl?.id || name}-err`;
    const p = document.createElement('p');
    p.className = 'field-error';
    p.id = errId;
    p.innerHTML = String(html`${icon('alert', { size: 16 })}<span>${msg}</span>`);
    wrap.appendChild(p);
    if (ctrl) {
      ctrl.setAttribute('aria-invalid', 'true');
      const prev = ctrl.getAttribute('aria-describedby') || '';
      ctrl.setAttribute('aria-describedby', `${prev} ${errId}`.trim());
    }
  });
  if (entries.length) {
    const first = form.querySelector('.has-error input, .has-error select, .has-error textarea');
    first?.focus();
    return true;
  }
  return false;
}
export function clearErrors(form) {
  form.querySelectorAll('.field-error').forEach((e) => e.remove());
  form.querySelectorAll('.has-error').forEach((w) => {
    w.classList.remove('has-error');
    const ctrl = w.querySelector('input, select, textarea');
    if (ctrl) {
      ctrl.removeAttribute('aria-invalid');
      const d = (ctrl.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && !x.endsWith('-err')).join(' ');
      if (d) ctrl.setAttribute('aria-describedby', d); else ctrl.removeAttribute('aria-describedby');
    }
  });
}
/** Limpia el error de un campo cuando el usuario lo corrige. */
export function liveClear(form) {
  form.addEventListener('input', (e) => {
    const wrap = e.target.closest('.field.has-error');
    if (!wrap) return;
    wrap.classList.remove('has-error');
    wrap.querySelector('.field-error')?.remove();
    e.target.removeAttribute('aria-invalid');
  });
}

/** Estado de carga de un botón */
export function setLoading(btn, loading, label = 'Procesando…') {
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${label}</span>`;
  } else {
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
}
