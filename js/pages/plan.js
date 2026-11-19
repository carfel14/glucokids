/* =========================================================
   Plan GlucoCompartido (RF-08): consulta, edición de coordinación por la familia,
   confirmación de lectura docente, vinculación por código y vista imprimible.
   Las secciones clínicas son contenido ficticio previamente registrado (solo lectura).
   ========================================================= */
import { html, raw, firstName, fmtDateTime, fmtDate, maskPhone, formData } from '../utils.js';
import { icon } from '../icons.js';
import {
  studentById, planFor, planReadStatus, planStatusLabel, linksForStudent, userById, canAccessStudent, activeLink,
} from '../data.js';
import {
  updatePlanCoordination, updatePlanTarget, markPlanRead, createInvite, activeInvite, approveLink, rejectLink, revokeLink,
} from '../actions.js';
import { pageHeader, emptyState, contactsList, bindSimCalls, notice, healthNote, studentAvatar, userAvatar } from '../components/ui.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, textarea, showErrors, liveClear, checkbox } from '../components/forms.js';
import { LOGO } from '../components/shell.js';

export function planAccess(ctx) {
  const sid = ctx.params.sid;
  if (!studentById(sid)) return 'El estudiante solicitado no existe en esta demostración.';
  if (canAccessStudent(ctx.user, sid)) return true;
  return ctx.user.role === 'docente'
    ? 'No tenés una vinculación activa con este estudiante. Es posible que la familia haya revocado el acceso o que la solicitud siga pendiente.'
    : 'Este estudiante no está vinculado a tu cuenta familiar.';
}

const list = (items) => (items?.length ? html`<ul class="bullets">${items.map((i) => html`<li>${i}</li>`)}</ul>` : html`<p class="muted small mb-0">Sin información registrada.</p>`);
const text = (t) => (t ? html`<p class="mb-0">${t}</p>` : html`<p class="muted small mb-0">Sin información registrada.</p>`);

function section(title, ic, body, { tone = '', tag = '', id = '', actions = '' } = {}) {
  return html`<section class="card plan-section ${tone}" ${id ? raw(`id="${id}"`) : ''} aria-labelledby="ps-${ic}-${title.length}">
    <div class="card-header"><span class="card-icon ${tone === 'tone-red' ? 'red' : ''}">${icon(ic)}</span><h2 class="h3" id="ps-${ic}-${title.length}">${title}</h2>${tag || actions ? html`<span class="actions">${tag ? html`<span class="chip chip-lilac">${icon('lock', { size: 13 })} ${tag}</span>` : ''}${actions}</span>` : ''}</div>
    ${body}
  </section>`;
}

function clinicalBlocks(plan, isFam) {
  const c = plan.clinical;
  const tag = 'Solo lectura';
  if (!c) {
    return section('Indicaciones del equipo de salud', 'stethoscope', emptyState({ ic: 'stethoscope', title: 'Sin indicaciones registradas', text: isFam ? 'En este prototipo las indicaciones clínicas solo existen como contenido ficticio de ejemplo. Seguí siempre el plan escrito entregado por tu equipo de salud.' : 'La familia todavía no registró indicaciones. Consultá la copia escrita del plan entregada a la dirección.' }), { tag });
  }
  return html`
    ${section('Indicaciones registradas', 'stethoscope', html`${list(c.indications)}<p class="xsmall muted mt-2 mb-0">${c.source} ${c.healthTeam ? `· ${c.healthTeam}` : ''}</p>`, { tag })}
    ${section('Señales de atención', 'alert', list(c.signs), { tag })}
    ${section('Actuación indicada', 'shield', html`${list(c.actions)}<div class="notice notice-danger mt-2">${icon('siren')}<p class="mb-0"><strong>Ayuda urgente:</strong> si no responde, se desmaya, tiene convulsiones o no puede tragar, pedí ayuda de emergencia de inmediato y avisá a la familia.</p></div>`, { tag, tone: 'tone-red' })}`;
}

export function planBody(plan, student, { isFam, print = false } = {}) {
  const co = plan.coordination;
  return html`
    <div class="plan-grid">
      ${section('Identificación del estudiante', 'user', html`<dl class="kv">
        <dt>Nombre</dt><dd>${student.name}</dd><dt>Edad</dt><dd>${student.age} años</dd><dt>Tipo de diabetes</dt><dd>${student.diabetesType}</dd>
        <dt>Centro educativo</dt><dd>${student.school}</dd><dt>Grado</dt><dd>${student.grade}</dd></dl>`)}
      ${section('Meta de glucosa del plan', 'target', plan.target
        ? html`<p class="big-number">${plan.target.min}–${plan.target.max} <span class="stat-unit">mg/dL</span></p><p class="small muted mb-0">Rango transcrito por la familia desde el plan del equipo de salud (dato ficticio de ejemplo). GlucoKids no propone metas.</p>`
        : html`<span class="chip">Sin meta configurada</span><p class="small muted mt-2 mb-0">Sin rango registrado, los registros se muestran como "Sin meta configurada".</p>`,
        { actions: isFam && !print ? html`<button type="button" class="btn btn-ghost btn-sm" data-edit-target>${icon('pencil', { size: 16 })} ${plan.target ? 'Editar' : 'Transcribir meta'}</button>` : '' })}
      ${section('Responsables', 'users', co.responsables?.length ? html`<ul class="list list-compact">${co.responsables.map((r) => html`<li>${icon('user', { size: 18 })}<span><strong>${r.name}</strong> · ${r.relation}</span></li>`)}</ul>` : text(''))}
      ${section('Contactos', 'phone', print
        ? html`<ul class="list list-compact">${co.contacts.map((c) => html`<li><span><strong>${c.name}</strong> · ${c.relation} · ${maskPhone(c.phone)}</span></li>`)}<li><span><strong>Emergencias:</strong> ${co.emergencyNumber || 'número local no configurado en el plan'}</span></li></ul><p class="xsmall muted mb-0">Números ficticios mostrados enmascarados.</p>`
        : contactsList(co.contacts, co.emergencyNumber), { tone: 'tone-red' })}
      ${section('Rutina escolar', 'clock', list(co.routine))}
      ${section('Alimentación', 'utensils', text(co.food))}
      ${section('Actividad física', 'run', text(co.activity))}
      ${section('Materiales y notas para el docente', 'backpack', html`${text(co.supplies)}${co.notes ? html`<p class="small mt-2 mb-0"><strong>Nota de la familia:</strong> ${co.notes}</p>` : ''}`)}
      ${clinicalBlocks(plan, isFam)}
    </div>`;
}

function shareSection(student, user) {
  const links = linksForStudent(student.id).filter((l) => l.status === 'activo' || l.status === 'pendiente');
  const inv = activeInvite(student.id);
  const active = links.filter((l) => l.status === 'activo');
  const pending = links.filter((l) => l.status === 'pendiente');
  const plan = planFor(student.id);
  return html`<section class="card mt-6" id="compartir" aria-labelledby="share-title">
    <div class="card-header"><span class="card-icon green">${icon('share')}</span><h2 class="h3" id="share-title">Compartir con docentes</h2></div>
    <ol class="mini-steps small"><li>Generá un código.</li><li>El docente lo ingresa en GlucoEscuela.</li><li>Autorizá la solicitud aquí o en Configuración › Permisos.</li></ol>
    <div class="grid-2 mt-4">
      <div class="soft-box">
        <h3 class="h4">Código de invitación</h3>
        ${inv ? html`<p class="invite-code" aria-label="Código ${inv.code.split('').join(' ')}">${inv.code}</p><p class="xsmall muted">Vence el ${fmtDate(inv.expiresAt)}. Un solo uso.</p>
            <div class="row"><button type="button" class="btn btn-sm" data-copy="${inv.code}">${icon('copy', { size: 16 })} Copiar</button><button type="button" class="btn btn-ghost btn-sm" data-new-code>${icon('refresh', { size: 16 })} Generar otro</button></div>`
          : html`<p class="small muted">No hay un código activo para ${firstName(student.name)}.</p><button type="button" class="btn btn-primary" data-new-code>${icon('key', { size: 18 })} Generar código</button>`}
      </div>
      <div class="soft-box">
        <h3 class="h4">Solicitudes pendientes</h3>
        ${pending.length ? html`<ul class="list">${pending.map((l) => { const t = userById(l.teacherId); return html`<li>${userAvatar(t)}<span class="grow"><strong>${t.name}</strong><br><span class="xsmall muted">${t.school || ''} · solicitó ${fmtDateTime(l.requestedAt)}</span></span>
            <span class="row" style="gap:6px"><button type="button" class="btn btn-success btn-sm" data-approve="${l.id}">${icon('check', { size: 16 })} Autorizar</button><button type="button" class="btn btn-ghost btn-sm" data-reject="${l.id}">Rechazar</button></span></li>`; })}</ul>`
          : html`<p class="small muted mb-0">No hay solicitudes pendientes.</p>`}
      </div>
    </div>
    <h3 class="h4 mt-6">Docentes con acceso</h3>
    ${active.length ? html`<ul class="list">${active.map((l) => { const t = userById(l.teacherId); const rs = planReadStatus(plan, t.id); return html`<li>${userAvatar(t)}<span class="grow"><strong>${t.name}</strong><br><span class="xsmall muted">${t.school || ''} · ${t.grade || ''}</span></span><span class="chip ${rs.chip}">${rs.label}</span><button type="button" class="btn btn-danger-outline btn-sm" data-revoke="${l.id}">${icon('unlink', { size: 16 })} Revocar</button></li>`; })}</ul>`
      : html`<p class="small muted">Ningún docente tiene acceso todavía.</p>`}
    <p class="xsmall muted mb-0">Los permisos de historial de glucosa y calendario se ajustan en <a href="#/configuracion?tab=permisos">Configuración › Permisos</a>.</p>
  </section>`;
}

export const planRedirect = {
  redirect: (ctx) => (ctx.student ? `/plan/${ctx.student.id}` : '/panel'),
};

export const planPage = {
  title: (ctx) => `Plan de ${firstName(studentById(ctx.params.sid)?.name || '')}`, nav: 'plan',
  view: (ctx) => {
    const student = studentById(ctx.params.sid);
    const plan = planFor(student.id);
    const { user } = ctx;
    const isFam = user.role === 'familia';
    const st = planStatusLabel(plan);
    const rs = !isFam ? planReadStatus(plan, user.id) : null;
    const link = !isFam ? activeLink(student.id, user.id) : null;
    return html`
      ${pageHeader({
        title: `Plan GlucoCompartido`, eyebrow: student.name,
        sub: 'Información individual para el acompañamiento escolar. Contenido de demostración con datos ficticios.',
        actions: html`<a class="btn" href="#/plan/${student.id}/imprimir">${icon('printer', { size: 18 })} Vista imprimible</a>
          ${isFam ? html`<button type="button" class="btn btn-secondary" data-edit-coord>${icon('pencil', { size: 18 })} Editar coordinación</button><a class="btn btn-primary" href="#/plan/${student.id}?compartir=1">${icon('share', { size: 18 })} Compartir</a>`
            : html`<button type="button" class="btn ${rs.key === 'leido' ? 'btn-success' : 'btn-primary'}" data-mark-read ${rs.key === 'leido' ? raw('disabled') : ''}>${icon('check-circle', { size: 18 })} ${rs.key === 'leido' ? 'Versión leída' : 'He leído esta versión'}</button>`}`,
      })}
      <div class="plan-status card card-tight">
        ${studentAvatar(student, 'avatar-sm')}
        <span class="chip ${st.chip}">${st.label}</span>
        <span class="chip">Versión ${plan.version}</span>
        <span class="small muted">Actualizado: ${fmtDateTime(plan.updatedAt)} por ${userById(plan.updatedBy)?.name || 'la familia'}</span>
        ${rs ? html`<span class="chip ${rs.chip}">${rs.label}${rs.at ? ` · ${fmtDate(rs.at)}` : ''}</span>` : ''}
        ${link ? html`<span class="xsmall muted">Acceso autorizado el ${fmtDate(link.approvedAt)}</span>` : ''}
      </div>
      ${!isFam ? notice('Como docente podés consultar el plan y confirmar la lectura. Las indicaciones clínicas no se pueden modificar desde tu perfil.', '', 'info') : ''}
      <div class="mt-4">${planBody(plan, student, { isFam })}</div>
      ${isFam ? shareSection(student, user) : ''}
      <section class="card mt-6" aria-labelledby="hist">
        <h2 class="h3" id="hist">Historial de versiones</h2>
        <ol class="timeline">${[...(plan.history || [])].reverse().map((h) => html`<li><span class="tl-dot ${h.version === plan.version ? 'ok' : 'muted'}"></span><strong>Versión ${h.version}</strong> · ${h.summary}<br><span class="xsmall muted">${fmtDateTime(h.at)} · ${userById(h.by)?.name || ''}</span></li>`)}</ol>
      </section>
      <div class="mt-6">${healthNote()}</div>`;
  },
  mount: (el, ctx) => {
    const student = studentById(ctx.params.sid);
    const plan = planFor(student.id);
    const { user } = ctx;
    bindSimCalls(el, plan.coordination.contacts, plan.coordination.emergencyNumber);
    if (ctx.query.compartir) setTimeout(() => el.querySelector('#compartir')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    el.querySelector('[data-mark-read]')?.addEventListener('click', () => {
      markPlanRead(user, student.id);
      toast(`Confirmaste la lectura de la versión ${plan.version}. La familia recibió un aviso.`, { type: 'success' });
      ctx.refresh();
    });
    el.querySelector('[data-edit-coord]')?.addEventListener('click', () => openCoordinationForm(user, student, ctx));
    el.querySelector('[data-edit-target]')?.addEventListener('click', () => openTargetForm(user, student, ctx));
    el.querySelectorAll('[data-new-code]').forEach((b) => b.addEventListener('click', () => {
      const inv = createInvite(user, student.id);
      toast(`Código ${inv.code} generado. Compartilo con el docente (en esta demo, cambiá a la cuenta docente).`, { type: 'success', title: 'Código de invitación' });
      ctx.refresh();
    }));
    el.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); toast('Código copiado al portapapeles.', { type: 'success' }); }
      catch { toast(`No se pudo copiar automáticamente. El código es ${b.dataset.copy}.`, { type: 'info' }); }
    }));
    el.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => { approveLink(user, b.dataset.approve); toast('Acceso autorizado. El docente ya puede consultar el plan.', { type: 'success' }); ctx.refresh(); }));
    el.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => { rejectLink(user, b.dataset.reject); toast('Solicitud rechazada.', { type: 'info' }); ctx.refresh(); }));
    el.querySelectorAll('[data-revoke]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Revocar acceso', message: `El docente dejará de ver a ${firstName(student.name)}, su plan, registros y mensajes, incluso si intenta abrir la ruta directamente.`, confirmLabel: 'Revocar acceso', danger: true });
      if (!ok) return;
      revokeLink(user, b.dataset.revoke);
      toast('Acceso revocado.', { type: 'success' });
      ctx.refresh();
    }));
  },
};

function openCoordinationForm(user, student, ctx) {
  const co = planFor(student.id).coordination;
  const rows = [...co.contacts, ...Array(Math.max(1, 4 - co.contacts.length)).fill({ name: '', relation: '', phone: '' })].slice(0, 5);
  openModal({
    title: `Datos de coordinación · ${firstName(student.name)}`, size: 'lg',
    body: html`<form class="form" novalidate>
      ${notice('Editás datos de coordinación. Las indicaciones clínicas no se modifican desde aquí.', '', 'info')}
      ${textarea({ name: 'responsables', label: 'Responsables (uno por línea: Nombre — Relación)', value: co.responsables.map((r) => `${r.name} — ${r.relation}`).join('\n'), attrs: 'rows="2"' })}
      <fieldset class="stack-sm"><legend>Contactos (ficticios)</legend>
        ${rows.map((c, i) => html`<div class="form-grid contact-row" style="grid-template-columns:repeat(3,minmax(0,1fr))">
          ${field({ name: `c${i}_name`, label: `Nombre ${i + 1}`, value: c.name })}
          ${field({ name: `c${i}_relation`, label: 'Relación', value: c.relation })}
          ${field({ name: `c${i}_phone`, label: 'Teléfono', type: 'tel', value: c.phone, placeholder: '+505 8000 0000' })}
        </div>`)}
      </fieldset>
      ${field({ name: 'emergencyNumber', label: 'Número de emergencias local (opcional)', value: co.emergencyNumber, hint: 'Verificalo con fuentes oficiales de tu localidad antes de registrarlo.' })}
      ${textarea({ name: 'routine', label: 'Rutina escolar (una actividad por línea)', value: co.routine.join('\n'), attrs: 'rows="4"' })}
      <div class="form-grid">
        ${textarea({ name: 'food', label: 'Alimentación', value: co.food, attrs: 'rows="3"' })}
        ${textarea({ name: 'activity', label: 'Actividad física', value: co.activity, attrs: 'rows="3"' })}
        ${textarea({ name: 'supplies', label: 'Materiales', value: co.supplies, attrs: 'rows="3"' })}
        ${textarea({ name: 'notes', label: 'Notas para el docente', value: co.notes, attrs: 'rows="3"' })}
      </div>
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">${icon('check')} Guardar y crear nueva versión</button></div>
    </form>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = formData(form);
        const errors = {};
        const contacts = [];
        for (let i = 0; i < rows.length; i++) {
          const n = d[`c${i}_name`], r = d[`c${i}_relation`], p = d[`c${i}_phone`];
          if (!n && !r && !p) continue;
          if (!n) errors[`c${i}_name`] = 'Falta el nombre.';
          if (!r) errors[`c${i}_relation`] = 'Falta la relación.';
          if (!p) errors[`c${i}_phone`] = 'Falta el teléfono.';
          else if (p.replace(/\D/g, '').length < 8) errors[`c${i}_phone`] = 'Mínimo 8 dígitos.';
          contacts.push({ name: n, relation: r, phone: p });
        }
        if (d.emergencyNumber && !/^[0-9 +-]{2,15}$/.test(d.emergencyNumber)) errors.emergencyNumber = 'Usá solo números (máximo 15 caracteres).';
        if (showErrors(form, errors)) return;
        const responsables = d.responsables.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, relation = 'Responsable'] = l.split(/\s+[—-]\s+/); return { name, relation }; });
        updatePlanCoordination(user, student.id, {
          responsables, contacts, emergencyNumber: d.emergencyNumber, routine: d.routine.split('\n').map((x) => x.trim()).filter(Boolean),
          food: d.food, activity: d.activity, supplies: d.supplies, notes: d.notes,
        });
        close();
        toast('Se creó una nueva versión del plan. Los docentes vinculados recibieron un aviso.', { type: 'success', title: 'Plan actualizado' });
        ctx.refresh();
      });
    },
  });
}

function openTargetForm(user, student, ctx) {
  const t = planFor(student.id).target;
  openModal({
    title: 'Meta de glucosa del plan', size: 'sm',
    body: html`<form class="form" novalidate>
      <p class="small mb-0">Transcribí el rango indicado por el equipo de salud de ${firstName(student.name)}. GlucoKids no sugiere metas.</p>
      <div class="form-grid">
        ${field({ name: 'min', label: 'Mínimo (mg/dL)', type: 'number', value: t?.min ?? '', attrs: 'min="40" max="400" inputmode="numeric" autofocus' })}
        ${field({ name: 'max', label: 'Máximo (mg/dL)', type: 'number', value: t?.max ?? '', attrs: 'min="40" max="400" inputmode="numeric"' })}
      </div>
      <div class="field" data-field="ack">${checkbox({ name: 'ack', label: 'Confirmo que es el rango indicado por el equipo de salud (dato ficticio en esta demo).' })}</div>
      <div class="form-actions">${t ? html`<button type="button" class="btn btn-danger-outline" data-clear-target>Quitar meta</button>` : ''}<button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div>
    </form>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      liveClear(form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const a = Number(form.min.value), b = Number(form.max.value);
        const errors = {};
        if (!form.min.value || !Number.isInteger(a) || a < 40 || a > 400) errors.min = 'Valor entero entre 40 y 400.';
        if (!form.max.value || !Number.isInteger(b) || b < 40 || b > 400) errors.max = 'Valor entero entre 40 y 400.';
        if (!errors.min && !errors.max && a >= b) errors.max = 'El máximo debe ser mayor que el mínimo.';
        if (!form.ack.checked) errors.ack = 'Confirmá el origen del dato.';
        if (showErrors(form, errors)) return;
        updatePlanTarget(user, student.id, a, b);
        close();
        toast('Meta actualizada. Las etiquetas de los registros se recalcularon.', { type: 'success' });
        ctx.refresh();
      });
      el.querySelector('[data-clear-target]')?.addEventListener('click', () => { updatePlanTarget(user, student.id, '', ''); close(); toast('Meta eliminada. Los registros mostrarán "Sin meta configurada".', { type: 'info' }); ctx.refresh(); });
    },
  });
}

/* ---------- Vista imprimible ---------- */
export const planPrint = {
  title: (ctx) => `Plan imprimible de ${firstName(studentById(ctx.params.sid)?.name || '')}`, shell: 'print',
  view: (ctx) => {
    const student = studentById(ctx.params.sid);
    const plan = planFor(student.id);
    return html`<div class="print-toolbar no-print">
        <a class="btn" href="#/plan/${student.id}">${icon('arrow-left', { size: 18 })} Volver al plan</a>
        <button type="button" class="btn btn-primary" data-print>${icon('printer', { size: 18 })} Imprimir / Guardar como PDF</button>
        <span class="small muted">En el diálogo de impresión elegí "Guardar como PDF".</span>
      </div>
      <article class="print-doc">
        <header class="print-head"><img src="${LOGO}" alt="GlucoKids" width="96" height="72"><div><h1 data-page-title tabindex="-1">Plan GlucoCompartido</h1><p class="mb-0"><strong>${student.name}</strong> · ${student.grade} · ${student.school}</p><p class="small muted mb-0">Versión ${plan.version} · actualizado ${fmtDateTime(plan.updatedAt)} · ${planStatusLabel(plan).label}</p></div></header>
        <p class="print-warning">DEMOSTRACIÓN · DATOS FICTICIOS. El cuidado debe seguir el plan individual indicado por el equipo de salud.</p>
        ${planBody(plan, student, { isFam: false, print: true })}
      </article>`;
  },
  mount: (el) => el.querySelector('[data-print]').addEventListener('click', () => window.print()),
};
