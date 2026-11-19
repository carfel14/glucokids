/* =========================================================
   Estado compartido y persistencia local.
   - localStorage  → datos ficticios y preferencias (clave versionada glucokids.demo.v1)
   - sessionStorage → sesión de demostración (glucokids.session.v1)
   Si el almacenamiento no está disponible, la app continúa en memoria con un aviso.
   ========================================================= */
import { buildSeed, SCHEMA_VERSION } from './seed.js';

export const STATE_KEY = 'glucokids.demo.v1';
export const SESSION_KEY = 'glucokids.session.v1';
export const KEY_PREFIX = 'glucokids.';

let state = null;
let memoryOnly = false;
let sessionMemory = {};
let sessionUsable = true;
const listeners = new Set();

function storageUsable(storage) {
  try {
    const k = `${KEY_PREFIX}__test`;
    storage.setItem(k, '1');
    storage.removeItem(k);
    return true;
  } catch { return false; }
}

function isValid(s) {
  return s && s.version === SCHEMA_VERSION && Array.isArray(s.users) && Array.isArray(s.students) && Array.isArray(s.glucose)
    && Array.isArray(s.links) && Array.isArray(s.plans) && typeof s.progress === 'object' && typeof s.subscriptions === 'object';
}

export function initStore() {
  memoryOnly = !storageUsable(localStorage);
  sessionUsable = storageUsable(sessionStorage);
  if (!memoryOnly) {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) state = parsed;
      }
    } catch { state = null; }
  }
  if (!state) {
    state = buildSeed();
    persist();
  }
  // Sincroniza cambios hechos en otra pestaña del mismo navegador
  window.addEventListener('storage', (e) => {
    if (e.key === STATE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (isValid(parsed)) { state = parsed; emit('external'); }
      } catch { /* ignorar */ }
    }
  });
  return { memoryOnly };
}

export const isMemoryOnly = () => memoryOnly;
export const getState = () => state;

function persist() {
  if (memoryOnly) return;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {
    memoryOnly = true;
    emit('storage-error');
  }
}

/** Guarda y notifica a las vistas suscritas. */
export function commit(reason = 'change') {
  persist();
  emit(reason);
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(reason) { listeners.forEach((fn) => { try { fn(reason); } catch (err) { console.error(err); } }); }

/* ---------- Sesión de demostración ---------- */
export function getSession() {
  if (!sessionUsable) return { ...sessionMemory };
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; }
}
export function setSession(patch) {
  const next = { ...getSession(), ...patch };
  Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
  if (!sessionUsable) { sessionMemory = next; return next; }
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch { sessionMemory = next; }
  return next;
}
export function clearSession() {
  sessionMemory = {};
  if (sessionUsable) { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ } }
}

/** Datos auxiliares de la sesión (borradores de formularios), siempre con prefijo glucokids. */
export function sessionGet(key, fallback = null) {
  try { const v = sessionUsable ? sessionStorage.getItem(KEY_PREFIX + key) : sessionMemory[`__${key}`]; return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function sessionSet(key, value) {
  const v = JSON.stringify(value);
  if (!sessionUsable) { sessionMemory[`__${key}`] = v; return; }
  try { sessionStorage.setItem(KEY_PREFIX + key, v); } catch { sessionMemory[`__${key}`] = v; }
}
export function sessionRemove(key) {
  delete sessionMemory[`__${key}`];
  if (sessionUsable) { try { sessionStorage.removeItem(KEY_PREFIX + key); } catch { /* */ } }
}

/**
 * Reinicia la demostración: borra ÚNICAMENTE las claves que empiezan por "glucokids."
 * (nunca usa localStorage.clear()) y vuelve a sembrar los datos iniciales.
 */
export function resetDemo() {
  [localStorage, sessionStorage].forEach((storage) => {
    try {
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => storage.removeItem(k));
    } catch { /* almacenamiento no disponible */ }
  });
  sessionMemory = {};
  state = buildSeed();
  persist();
  emit('reset');
}
