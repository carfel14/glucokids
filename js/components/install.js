/* =========================================================
   Instalación PWA: usa el evento beforeinstallprompt del navegador.
   Nunca finge que la instalación ocurrió.
   ========================================================= */
import { html } from '../utils.js';
import { icon } from '../icons.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';

let deferred = null;
export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    document.documentElement.classList.add('can-install');
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    document.documentElement.classList.remove('can-install');
    toast('GlucoKids se instaló en este dispositivo.', { type: 'success', title: 'Aplicación instalada' });
  });
}
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export async function installApp() {
  if (isStandalone()) {
    openModal({ title: 'La aplicación ya está instalada', size: 'sm', body: html`<p>Estás usando GlucoKids como aplicación instalada.</p><div class="modal-footer"><button class="btn btn-primary" data-close>Entendido</button></div>` });
    return;
  }
  if (deferred) {
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' }));
    deferred = null;
    document.documentElement.classList.remove('can-install');
    if (choice.outcome === 'accepted') toast('El navegador está instalando la aplicación.', { type: 'success' });
    else toast('Instalación cancelada. Podés intentarlo más tarde.', { type: 'info' });
    return;
  }
  const secure = window.isSecureContext;
  openModal({
    title: 'Cómo instalar GlucoKids',
    body: html`<div class="stack">
      <p class="mb-0">Tu navegador no ofreció la instalación automática en este momento. La instalación depende del navegador y del dispositivo.</p>
      ${!secure ? html`<div class="notice notice-warn">${icon('alert')}<p>La app no se está sirviendo desde <strong>localhost</strong> o HTTPS. Abrila con un servidor local (por ejemplo <code>python -m http.server 5500</code>) para habilitar la instalación y el modo sin conexión.</p></div>` : ''}
      <div class="accordion">
        <details open><summary>${icon('phoneApp')} Chrome o Edge (computadora y Android)<span class="chev">${icon('chev-down')}</span></summary><div class="acc-body"><ol class="bullets"><li>Abrí el menú del navegador (⋮ o …).</li><li>Elegí <strong>Instalar GlucoKids</strong> o <strong>Agregar a la pantalla de inicio</strong>.</li><li>Confirmá la instalación.</li></ol></div></details>
        <details><summary>${icon('phoneApp')} Safari (iPhone o iPad)<span class="chev">${icon('chev-down')}</span></summary><div class="acc-body"><ol class="bullets"><li>Tocá el botón <strong>Compartir</strong>.</li><li>Elegí <strong>Agregar a inicio</strong>.</li></ol></div></details>
      </div>
      <p class="small muted mb-0">Si ya la instalaste, el navegador no vuelve a ofrecer la opción.</p>
      <div class="modal-footer"><button class="btn btn-primary" data-close>Entendido</button></div>
    </div>`,
  });
}
