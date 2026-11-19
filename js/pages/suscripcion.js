/* =========================================================
   Planes y pago simulado (RF-04). No se procesan cobros, no se solicitan
   datos bancarios reales y no se guardan número de tarjeta ni CVV.
   ========================================================= */
import { html, raw, fmtDate, fmtDateTime, money, plural } from '../utils.js';
import { icon } from '../icons.js';
import { subscriptionFor, PLAN_PRICE, TRIAL_DAYS } from '../data.js';
import { activatePlan, setRenewal, startTrial } from '../actions.js';
import { pageHeader, notice, healthNote } from '../components/ui.js';
import { confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { setLoading } from '../components/forms.js';
import { ILLUSTRATION } from './public.js';

const FEATURES = ['Acceso a GlucoFamilia y reportes', 'Plan GlucoCompartido con docentes', 'Acceso a GlucoAprende', 'Sistema de avisos para docentes'];
const METHOD_LABEL = { tarjeta: 'Tarjeta de prueba', paypal: 'PayPal (visual)', mercadopago: 'Mercado Pago (visual)' };

export const suscripcionPage = {
  title: 'Suscripción', nav: 'suscripcion',
  view: (ctx) => {
    const sub = subscriptionFor(ctx.user.id);
    const st = sub.status;
    return html`${pageHeader({ title: 'Suscripción', eyebrow: 'Plan Familiar', sub: 'Todos los pagos de este prototipo son simulados: no se realizan cobros ni se guardan datos bancarios.' })}
      <div class="grid-2">
        <section class="card" aria-labelledby="estado-sub">
          <div class="card-header"><span class="card-icon">${icon('card')}</span><h2 class="h3" id="estado-sub">Estado actual</h2></div>
          <p><span class="chip ${st === 'activo' ? 'chip-ok' : st === 'vencido' ? 'chip-danger' : 'chip-info'}">${sub.label}</span></p>
          ${st === 'prueba' ? html`<dl class="kv"><dt>Inicio de la prueba</dt><dd>${fmtDate(sub.trialStart)}</dd><dt>Fin de la prueba</dt><dd>${fmtDate(sub.trialEnd)}</dd><dt>Días restantes</dt><dd>${sub.daysLeft}</dd><dt>Precio posterior</dt><dd>${money(PLAN_PRICE)}/mes (simulado)</dd></dl>
              <a class="btn btn-primary mt-4" href="#/suscripcion/pago">${icon('sparkles', { size: 18 })} Activar Plan Familiar</a>` : ''}
          ${st === 'activo' ? html`<dl class="kv"><dt>Plan</dt><dd>Plan Familiar · ${money(PLAN_PRICE)}/mes</dd><dt>Activado</dt><dd>${fmtDateTime(sub.activation.at)}</dd>
              ${sub.inTrial ? html`<dt>Prueba vigente hasta</dt><dd>${fmtDate(sub.trialEnd)}</dd><dt>Primer cobro simulado</dt><dd>${fmtDate(sub.activation.billingStart)}</dd>` : html`<dt>${sub.renews ? 'Próxima renovación simulada' : 'Acceso hasta'}</dt><dd>${fmtDate(sub.activation.nextBilling)}</dd>`}
              <dt>Renovación</dt><dd>${sub.renews ? 'Activa' : 'Cancelada'}</dd></dl>
              <div class="row mt-4">${sub.renews ? html`<button type="button" class="btn btn-danger-outline" data-cancel>${icon('x-circle', { size: 18 })} Cancelar renovación</button>` : html`<button type="button" class="btn btn-secondary" data-resume>${icon('refresh', { size: 18 })} Reanudar renovación</button>`}</div>` : ''}
          ${st === 'vencido' ? html`<p>Tu prueba o plan terminó. La información de emergencia y el plan siguen disponibles en este prototipo.</p><a class="btn btn-primary" href="#/suscripcion/pago">Activar Plan Familiar</a>` : ''}
          ${st === 'sin_plan' ? html`<p>Esta cuenta aún no inició la prueba gratuita.</p><button type="button" class="btn btn-primary" data-trial>${icon('sparkles', { size: 18 })} Comenzar prueba gratuita de ${TRIAL_DAYS} días</button>` : ''}
        </section>
        <section class="card tone-aprende price-mini" aria-labelledby="plan-fam">
          <div class="row" style="flex-wrap:nowrap"><img src="${ILLUSTRATION}" alt="" width="140" height="98"><div><h2 class="h3 mb-0" id="plan-fam">Plan Familiar</h2><p class="price mb-0"><span class="amount">${money(PLAN_PRICE)}</span><span class="per">/mes</span></p></div></div>
          <ul class="checklist mt-4">${FEATURES.map((f) => html`<li>${icon('check-circle', { size: 18 })}<span>${f}</span></li>`)}</ul>
          <p class="small mt-4 mb-0"><strong>Docentes:</strong> acceso gratuito. <strong>Centros educativos:</strong> precio por definir.</p>
        </section>
      </div>
      <section class="mt-6" aria-labelledby="hist-pagos">
        <h2 class="h3" id="hist-pagos">Historial de transacciones simuladas</h2>
        ${sub.history?.length ? html`<div class="table-wrap table-responsive"><table class="table"><caption class="sr-only">Transacciones simuladas</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Concepto</th><th scope="col">Método</th><th scope="col" class="num">Monto</th><th scope="col">Resultado</th></tr></thead>
          <tbody>${[...sub.history].reverse().map((h) => html`<tr><td data-label="Fecha">${fmtDateTime(h.at)}</td><td data-label="Concepto">${h.mode === 'fin_prueba' ? 'Activación al terminar la prueba' : 'Activación inmediata'}</td><td data-label="Método">${METHOD_LABEL[h.method] || h.method}</td><td data-label="Monto" class="num">${money(h.amount)}</td><td data-label="Resultado"><span class="chip ${h.result === 'aprobado' ? 'chip-ok' : 'chip-danger'}">${h.result === 'aprobado' ? 'Aprobado (simulado)' : 'Rechazado (simulado)'}</span></td></tr>`)}</tbody></table></div>`
          : html`<div class="card">${notice('Todavía no hay transacciones simuladas.', '', 'info')}</div>`}
      </section>`;
  },
  mount: (el, ctx) => {
    el.querySelector('[data-cancel]')?.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Cancelar renovación', message: 'El plan seguirá activo hasta el final del periodo y no se renovará. Es una simulación: no hay cobros reales.', confirmLabel: 'Cancelar renovación', danger: true });
      if (!ok) return;
      setRenewal(ctx.user.id, false);
      toast('Renovación cancelada (simulada).', { type: 'success' });
      ctx.refresh();
    });
    el.querySelector('[data-resume]')?.addEventListener('click', () => { setRenewal(ctx.user.id, true); toast('Renovación reanudada (simulada).', { type: 'success' }); ctx.refresh(); });
    el.querySelector('[data-trial]')?.addEventListener('click', () => { startTrial(ctx.user.id); toast(`Prueba gratuita de ${TRIAL_DAYS} días iniciada.`, { type: 'success' }); ctx.refresh(); });
  },
};

const pay = { method: 'tarjeta', mode: 'fin_prueba', approve: true, testData: false, result: null };

export const pagoPage = {
  title: 'Activar plan', nav: 'suscripcion',
  view: (ctx) => {
    const sub = subscriptionFor(ctx.user.id);
    if (!ctx.isRefresh) Object.assign(pay, { result: null, testData: false, method: 'tarjeta', approve: true, mode: sub.inTrial ? 'fin_prueba' : 'ahora' });
    if (!sub.inTrial) pay.mode = 'ahora';
    const total = pay.mode === 'fin_prueba' ? 0 : PLAN_PRICE;
    const header = pageHeader({ title: 'Completá tu activación', eyebrow: 'Pago simulado', sub: 'Activá tu Plan Familiar. Ningún dato ingresado aquí se guarda ni se envía.' });
    if (sub.status === 'activo' && !pay.result) {
      return html`${header}<div class="card">${notice(html`Tu Plan Familiar ya está activo. <a href="#/suscripcion">Ver suscripción</a>`, 'ok', 'check-circle')}</div>`;
    }
    if (pay.result?.approved) {
      return html`${header}<section class="card result-card celebrate" aria-live="polite">
        <span class="card-icon green pop" style="width:72px;height:72px">${icon('check-circle', { size: 40 })}</span>
        <h2 data-result-title tabindex="-1">¡Plan Familiar activado!</h2>
        <p>${pay.result.amount === 0 ? `Total de hoy: C$0. El primer cobro simulado de ${money(PLAN_PRICE)} sería el ${fmtDate(sub.activation.billingStart)}, al terminar tu prueba.` : `Se simuló un cobro de ${money(PLAN_PRICE)}. Próxima renovación simulada: ${fmtDate(sub.activation.nextBilling)}.`}</p>
        <p class="small muted">No se realizó ningún cobro real.</p>
        <div class="row" style="justify-content:center"><a class="btn btn-primary" href="#/suscripcion">Ver suscripción</a><a class="btn" href="#/panel">Ir al inicio</a></div>
      </section>`;
    }
    return html`${header}
      ${pay.result && !pay.result.approved ? html`<div class="form-alert" role="alert" tabindex="-1" data-error-box>${icon('alert')}<span>La simulación rechazó el pago. No se realizó ningún cobro. Probá de nuevo o elegí "Simular pago aprobado" en los controles de demostración.</span></div>` : ''}
      <div class="checkout mt-4">
        <section class="card" aria-labelledby="datos-pago">
          <div class="card-header"><span class="card-icon">${icon('card')}</span><h2 class="h3" id="datos-pago">Completá tu pago</h2><span class="actions"><span class="sim-tag">Simulación</span></span></div>
          <div class="checkout-grid">
            <div class="stack-sm">
              <h3 class="h4">Datos de pago</h3>
              ${notice('No ingreses datos reales. Usá los datos de prueba: los campos son de solo lectura y no se guardan.', 'warn', 'shield')}
              <div class="field"><label for="p-name">Nombre del titular</label><input class="input" id="p-name" readonly value="${pay.testData ? 'Titular de prueba' : ''}" placeholder="Usá los datos de prueba"></div>
              <div class="field" data-field="card"><label for="p-card">Número de tarjeta</label><div class="input-group"><span class="lead-icon">${icon('card', { size: 18 })}</span><input class="input" id="p-card" readonly value="${pay.testData ? '4242 4242 4242 4242' : ''}" placeholder="•••• •••• •••• ••••" autocomplete="off"></div></div>
              <div class="form-grid" style="grid-template-columns:1fr 1fr">
                <div class="field"><label for="p-exp">Vencimiento</label><input class="input" id="p-exp" readonly value="${pay.testData ? '12/30' : ''}" placeholder="MM/AA" autocomplete="off"></div>
                <div class="field"><label for="p-cvv">CVV</label><input class="input" id="p-cvv" type="password" readonly value="${pay.testData ? '000' : ''}" placeholder="•••" autocomplete="off"></div>
              </div>
              <button type="button" class="btn btn-secondary" data-test ${pay.testData ? raw('disabled') : ''}>${icon('sparkles', { size: 18 })} ${pay.testData ? 'Datos de prueba cargados' : 'Usar datos de prueba'}</button>
            </div>
            <fieldset class="stack-sm">
              <legend class="h4">Método de pago</legend>
              ${[['tarjeta', 'Tarjeta de crédito o débito', 'card'], ['paypal', 'PayPal', 'wallet'], ['mercadopago', 'Mercado Pago', 'wallet']].map(([v, l, ic]) => html`<label class="choice"><input type="radio" name="method" value="${v}" ${pay.method === v ? raw('checked') : ''}><span class="card-icon">${icon(ic)}</span><span><span class="choice-title">${l}</span><span class="choice-sub">${v === 'tarjeta' ? 'Con datos de prueba' : 'Opción visual de demostración, sin integración'}</span></span></label>`)}
            </fieldset>
          </div>
        </section>
        <aside class="card order-summary" aria-labelledby="resumen">
          <h2 class="h3" id="resumen">${icon('card', { size: 20, cls: 'inline-icon' })} Resumen de tu pedido</h2>
          <div class="row-between"><strong>Plan Familiar</strong><span>${money(PLAN_PRICE)}/mes</span></div>
          <ul class="checklist small mt-2">${FEATURES.map((f) => html`<li>${icon('check-circle', { size: 16 })}<span>${f}</span></li>`)}</ul>
          ${sub.inTrial ? html`<fieldset class="stack-sm mt-4"><legend class="strong small">¿Cuándo activar?</legend>
            <label class="choice"><input type="radio" name="mode" value="fin_prueba" ${pay.mode === 'fin_prueba' ? raw('checked') : ''}><span><span class="choice-title">Al terminar la prueba</span><span class="choice-sub">Total de hoy C$0 · desde el ${fmtDate(sub.trialEnd)}: ${money(PLAN_PRICE)}/mes</span></span></label>
            <label class="choice"><input type="radio" name="mode" value="ahora" ${pay.mode === 'ahora' ? raw('checked') : ''}><span><span class="choice-title">Ahora</span><span class="choice-sub">Cobro simulado de ${money(PLAN_PRICE)} hoy; la prueba termina</span></span></label>
          </fieldset>` : ''}
          <hr class="divider">
          <div class="row-between total-row"><span>Total de hoy</span><strong class="big-number" style="font-size:1.75rem">${money(total)}</strong></div>
          <p class="xsmall muted">${pay.mode === 'fin_prueba' ? `Tu prueba sigue hasta el ${fmtDate(sub.trialEnd)} (${plural(sub.daysLeft, 'día', 'días')}). Después: ${money(PLAN_PRICE)}/mes simulado.` : `Se simula un cobro de ${money(PLAN_PRICE)} y la renovación mensual.`} Podés cancelar la renovación cuando quieras.</p>
          <fieldset class="demo-controls">
            <legend>${icon('settings', { size: 14, cls: 'inline-icon' })} Controles de demostración</legend>
            <label class="check"><input type="radio" name="approve" value="1" ${pay.approve ? raw('checked') : ''}><span>Simular pago aprobado</span></label>
            <label class="check"><input type="radio" name="approve" value="0" ${!pay.approve ? raw('checked') : ''}><span>Simular pago rechazado</span></label>
          </fieldset>
          <div data-pay-error></div>
          <button type="button" class="btn btn-primary btn-lg btn-block mt-4" data-pay>${icon('lock', { size: 18 })} Confirmar activación (simulada)</button>
          <p class="xsmall muted center mt-2 mb-0">Prototipo sin pasarela de pago. No se procesan cobros.</p>
        </aside>
      </div>`;
  },
  mount: (el, ctx) => {
    el.querySelector('[data-error-box]')?.focus();
    el.querySelector('[data-test]')?.addEventListener('click', () => { pay.testData = true; ctx.refresh(); toast('Datos de prueba cargados (no se guardan).', { type: 'info' }); });
    el.querySelectorAll('input[name="method"]').forEach((r) => r.addEventListener('change', () => { pay.method = r.value; ctx.refresh(); }));
    el.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { pay.mode = r.value; ctx.refresh(); }));
    el.querySelectorAll('input[name="approve"]').forEach((r) => r.addEventListener('change', () => { pay.approve = r.value === '1'; }));
    el.querySelector('[data-pay]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (pay.method === 'tarjeta' && !pay.testData) {
        el.querySelector('[data-pay-error]').innerHTML = String(html`<p class="field-error mt-2" role="alert">${icon('alert', { size: 16 })}<span>Cargá los datos de prueba con "Usar datos de prueba" o elegí otro método visual.</span></p>`);
        el.querySelector('[data-test]')?.focus();
        return;
      }
      setLoading(btn, true, 'Procesando simulación…');
      setTimeout(() => {
        const res = activatePlan(ctx.user.id, { mode: pay.mode, method: pay.method, approved: pay.approve });
        pay.result = res;
        pay.testData = false; // los datos de prueba no se conservan
        toast(res.approved ? 'Plan activado (simulación).' : 'Pago rechazado (simulación). No hubo cobro.', { type: res.approved ? 'success' : 'error' });
        ctx.refresh();
        document.querySelector('[data-result-title], [data-error-box]')?.focus();
      }, 1400);
    });
  },
};

export { healthNote };
