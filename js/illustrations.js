/* =========================================================
   Ilustraciones SVG propias (estilo plano infantil).
   La mascota "Gluki" es un dinosaurio verde inspirado en la referencia de GlucoAprende.
   ========================================================= */
import { raw } from './utils.js';

const C = {
  body: '#4DB560', bodyDark: '#3A9A4E', belly: '#E9F7CF', spike: '#1F8FB8',
  ink: '#1B2B4A', cheek: '#F59AA6', white: '#FFFFFF',
};

function a11y(label) {
  return label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
}

function spikes() {
  const cx = 112, cy = 104;
  const pts = [[92, 36], [76, 44], [64, 58], [57, 76], [56, 98], [52, 120]];
  return pts.map(([x, y]) => {
    let dx = x - cx, dy = y - cy; const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const px = -dy, py = dx;
    const tip = [x + dx * 15, y + dy * 15];
    const b1 = [x + px * 8, y + py * 8]; const b2 = [x - px * 8, y - py * 8];
    return `<path d="M${b1[0].toFixed(1)} ${b1[1].toFixed(1)} Q${(tip[0] + px * 2).toFixed(1)} ${(tip[1] + py * 2).toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)} Q${(tip[0] - px * 1).toFixed(1)} ${(tip[1] - py * 1).toFixed(1)} ${b2[0].toFixed(1)} ${b2[1].toFixed(1)} Z" fill="${C.spike}"/>`;
  }).join('');
}

/**
 * Mascota Gluki.
 * @param {{mood?:'wave'|'happy'|'think'|'calm'|'read', size?:number, label?:string, cls?:string}} o
 */
export function dino({ mood = 'wave', size = 160, label = '', cls = '' } = {}) {
  const happy = mood === 'happy';
  const eyes = happy
    ? `<path d="M108 72 q10 -12 20 0" stroke="${C.ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
       <path d="M138 74 q9 -11 18 0" stroke="${C.ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="118" cy="70" rx="12.5" ry="13.5" fill="${C.white}"/><ellipse cx="147" cy="72" rx="10.5" ry="12" fill="${C.white}"/>
       <circle cx="${mood === 'think' ? 116 : 121}" cy="${mood === 'think' ? 66 : 73}" r="6.5" fill="${C.ink}"/>
       <circle cx="${mood === 'think' ? 145 : 149}" cy="${mood === 'think' ? 68 : 75}" r="5.5" fill="${C.ink}"/>
       <circle cx="${mood === 'think' ? 118 : 123.5}" cy="${mood === 'think' ? 63.5 : 70.5}" r="2.2" fill="#fff"/>
       <circle cx="${mood === 'think' ? 147 : 151}" cy="${mood === 'think' ? 65.5 : 72.5}" r="1.8" fill="#fff"/>`;
  const mouth = happy
    ? `<path d="M128 98 q16 20 32 0 z" fill="#B23A4E"/><path d="M134 104 q10 7 20 0" fill="#F38BA0"/>`
    : mood === 'think'
      ? `<path d="M134 102 q8 -3 18 2" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : `<path d="M130 99 q14 13 28 0" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  let arms = '';
  if (mood === 'wave') {
    arms = `<path d="M128 128 C140 118 146 104 152 92" stroke="${C.body}" stroke-width="13" stroke-linecap="round" fill="none"/>
            <circle cx="154" cy="88" r="9" fill="${C.body}"/>
            <path d="M162 74 l6 -6 M168 84 l8 -2 M158 68 l1 -8" stroke="#F5B400" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M74 132 C66 138 64 146 66 152" stroke="${C.bodyDark}" stroke-width="12" stroke-linecap="round" fill="none"/>`;
  } else if (happy) {
    arms = `<path d="M126 126 C140 116 148 102 156 90" stroke="${C.body}" stroke-width="13" stroke-linecap="round" fill="none"/>
            <circle cx="158" cy="86" r="9" fill="${C.body}"/>
            <path d="M74 126 C62 116 56 104 52 92" stroke="${C.bodyDark}" stroke-width="13" stroke-linecap="round" fill="none"/>
            <circle cx="50" cy="88" r="9" fill="${C.bodyDark}"/>
            <path d="M40 70 l-4 -8 M58 64 l2 -9 M168 66 l6 -6 M150 62 l0 -9" stroke="#F5B400" stroke-width="3.5" stroke-linecap="round"/>`;
  } else if (mood === 'think') {
    arms = `<path d="M124 132 C136 126 142 116 140 108" stroke="${C.body}" stroke-width="13" stroke-linecap="round" fill="none"/>
            <circle cx="140" cy="106" r="8.5" fill="${C.body}"/>
            <g transform="translate(166 30)"><circle r="16" fill="#fff" stroke="${C.spike}" stroke-width="3"/><text x="0" y="7" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="22" fill="${C.spike}">?</text></g>
            <circle cx="152" cy="54" r="4" fill="#fff" stroke="${C.spike}" stroke-width="2.5"/>`;
  } else if (mood === 'read') {
    arms = `<g transform="translate(96 118) rotate(-6)"><rect x="0" y="0" width="54" height="36" rx="5" fill="#FFC94A"/><rect x="26" y="0" width="3" height="36" fill="#E2A21F"/><rect x="5" y="6" width="17" height="3" rx="1.5" fill="#fff"/><rect x="5" y="13" width="14" height="3" rx="1.5" fill="#fff"/><rect x="33" y="6" width="16" height="3" rx="1.5" fill="#fff"/></g>
            <circle cx="98" cy="140" r="8.5" fill="${C.body}"/><circle cx="148" cy="134" r="8.5" fill="${C.body}"/>`;
  } else {
    arms = `<path d="M126 130 C134 138 136 146 134 154" stroke="${C.body}" stroke-width="12" stroke-linecap="round" fill="none"/>`;
  }
  return raw(`<svg class="dino ${cls}" width="${size}" height="${size}" viewBox="0 0 200 200" ${a11y(label)}>
    <ellipse cx="98" cy="190" rx="62" ry="7" fill="#102A56" opacity=".08"/>
    <path d="M62 150 C34 152 20 138 12 116 C30 128 46 130 64 126 Z" fill="${C.bodyDark}"/>
    ${spikes()}
    <ellipse cx="94" cy="142" rx="46" ry="40" fill="${C.body}"/>
    <ellipse cx="102" cy="150" rx="27" ry="25" fill="${C.belly}"/>
    <rect x="68" y="164" width="22" height="26" rx="11" fill="${C.bodyDark}"/>
    <rect x="102" y="166" width="22" height="24" rx="11" fill="${C.body}"/>
    <ellipse cx="110" cy="80" rx="48" ry="44" fill="${C.body}"/>
    <ellipse cx="142" cy="92" rx="30" ry="25" fill="${C.body}"/>
    <ellipse cx="108" cy="94" rx="7.5" ry="5" fill="${C.cheek}" opacity=".85"/>
    <ellipse cx="164" cy="98" rx="6" ry="4.5" fill="${C.cheek}" opacity=".85"/>
    <circle cx="166" cy="86" r="2.2" fill="${C.ink}"/>
    ${eyes}${mouth}${arms}
  </svg>`);
}

/** Edificio escolar */
export function school({ size = 140, label = '' } = {}) {
  return raw(`<svg width="${size}" height="${Math.round(size * .8)}" viewBox="0 0 200 160" ${a11y(label)}>
    <ellipse cx="100" cy="150" rx="92" ry="8" fill="#102A56" opacity=".08"/>
    <path d="M60 30 v-24" stroke="#5D6D7E" stroke-width="3"/>
    <path d="M61 6 h26 l-6 7 6 7 h-26z" fill="#0077C8"/>
    <rect x="24" y="64" width="152" height="84" rx="6" fill="#FFD66B"/>
    <rect x="24" y="64" width="152" height="10" fill="#F2BE3B"/>
    <path d="M14 70 L100 22 L186 70 Z" fill="#2F7FD1"/>
    <path d="M14 70 L100 22 L186 70" fill="none" stroke="#1F5FA8" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="100" cy="52" r="13" fill="#fff" stroke="#1F5FA8" stroke-width="3"/>
    <path d="M100 44 v8 l6 4" stroke="#102A56" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="86" y="104" width="28" height="44" rx="14" fill="#0077C8"/>
    <circle cx="107" cy="128" r="2" fill="#FFD66B"/>
    ${[38, 136].map((x) => `<rect x="${x}" y="86" width="26" height="22" rx="4" fill="#BFE6FA" stroke="#fff" stroke-width="3"/><path d="M${x + 13} 86 v22 M${x} 97 h26" stroke="#fff" stroke-width="2"/>`).join('')}
    ${[38, 136].map((x) => `<rect x="${x}" y="116" width="26" height="22" rx="4" fill="#BFE6FA" stroke="#fff" stroke-width="3"/>`).join('')}
    <circle cx="16" cy="140" r="12" fill="#5BBF6A"/><circle cx="186" cy="138" r="14" fill="#5BBF6A"/>
  </svg>`);
}

/** Avatar ilustrado de estudiante */
export function kidAvatar({ hair = 'short', skin = '#F4C29C', hairColor = '#5A3A2A', bg = '#D9EEFB', shirt = '#2F7FD1', label = '' } = {}) {
  const hairShapes = {
    short: `<path d="M18 30 C16 16 26 10 34 10 C44 10 50 18 48 30 C44 22 38 20 32 22 C26 20 22 24 18 30Z" fill="${hairColor}"/>`,
    long: `<path d="M16 34 C12 14 26 8 34 9 C46 10 52 20 49 36 L50 50 C46 46 46 40 46 30 C40 24 30 22 22 28 C20 36 20 44 16 50 Z" fill="${hairColor}"/>`,
    pony: `<path d="M18 30 C16 15 26 9 34 9 C44 10 50 18 48 30 C44 22 36 20 30 22 C24 22 20 26 18 30Z" fill="${hairColor}"/><circle cx="50" cy="20" r="7" fill="${hairColor}"/><circle cx="14" cy="20" r="7" fill="${hairColor}"/>`,
    curly: `<g fill="${hairColor}"><circle cx="22" cy="20" r="7"/><circle cx="30" cy="14" r="7"/><circle cx="39" cy="14" r="7"/><circle cx="46" cy="21" r="7"/><circle cx="18" cy="28" r="5"/><circle cx="49" cy="29" r="5"/></g>`,
  };
  return raw(`<svg viewBox="0 0 64 64" ${a11y(label)}>
    <rect width="64" height="64" fill="${bg}"/>
    <path d="M10 64 C12 50 22 46 32 46 C42 46 52 50 54 64Z" fill="${shirt}"/>
    <rect x="28" y="38" width="8" height="10" rx="3" fill="${skin}"/>
    <circle cx="33" cy="30" r="15" fill="${skin}"/>
    <circle cx="18" cy="31" r="3.5" fill="${skin}"/><circle cx="48" cy="31" r="3.5" fill="${skin}"/>
    ${hairShapes[hair] || hairShapes.short}
    <circle cx="27.5" cy="31" r="2" fill="#1B2B4A"/><circle cx="38.5" cy="31" r="2" fill="#1B2B4A"/>
    <path d="M28 37 q5 4.5 10 0" stroke="#B23A4E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="24" cy="36" r="2.4" fill="#F59AA6" opacity=".7"/><circle cx="42" cy="36" r="2.4" fill="#F59AA6" opacity=".7"/>
  </svg>`);
}

/** Niño con señales de glucosa baja (sudor) */
export function kidLow({ size = 120, label = '' } = {}) {
  return raw(`<svg width="${size}" height="${size}" viewBox="0 0 120 120" ${a11y(label)}>
    <circle cx="60" cy="60" r="56" fill="#FDECEE"/>
    <path d="M26 118 C28 92 42 84 60 84 C78 84 92 92 94 118Z" fill="#2F7FD1"/>
    <rect x="53" y="70" width="14" height="16" rx="5" fill="#F4C29C"/>
    <circle cx="60" cy="52" r="24" fill="#F4C29C"/>
    <path d="M36 50 C34 28 50 22 60 22 C74 22 86 32 83 50 C78 38 68 34 60 37 C50 34 41 40 36 50Z" fill="#5A3A2A"/>
    <path d="M48 52 q4 -3 8 0 M64 52 q4 -3 8 0" stroke="#1B2B4A" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M52 66 q8 -5 16 0" stroke="#B23A4E" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M86 40 q4 7 0 10 q-4 -3 0 -10z M92 56 q3 6 0 8 q-3 -2 0 -8z M30 42 q-4 7 0 10 q4 -3 0 -10z" fill="#24B6E6"/>
    <path d="M78 22 c6 0 6 6 12 6 M84 14 c6 0 6 6 12 6" stroke="#C93C4B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`);
}

/** Niña con señales de glucosa alta (sed) */
export function kidHigh({ size = 120, label = '' } = {}) {
  return raw(`<svg width="${size}" height="${size}" viewBox="0 0 120 120" ${a11y(label)}>
    <circle cx="60" cy="60" r="56" fill="#FFF4CC"/>
    <path d="M26 118 C28 92 42 84 60 84 C78 84 92 92 94 118Z" fill="#F16C7A"/>
    <rect x="53" y="70" width="14" height="16" rx="5" fill="#E9B48C"/>
    <circle cx="60" cy="52" r="24" fill="#E9B48C"/>
    <path d="M35 54 C30 26 50 20 60 21 C76 22 88 34 84 56 L86 74 C80 68 80 60 80 48 C70 38 52 36 42 44 C40 54 40 64 34 72Z" fill="#3B2418"/>
    <circle cx="51" cy="52" r="2.6" fill="#1B2B4A"/><circle cx="69" cy="52" r="2.6" fill="#1B2B4A"/>
    <g transform="translate(74 52) rotate(28)"><rect x="0" y="0" width="12" height="30" rx="4" fill="#BFE6FA" stroke="#2F7FD1" stroke-width="2"/><rect x="2" y="-5" width="8" height="6" rx="2" fill="#2F7FD1"/><rect x="2" y="12" width="8" height="15" rx="2" fill="#24B6E6" opacity=".7"/></g>
    <ellipse cx="62" cy="66" rx="5" ry="3.5" fill="#B23A4E"/>
  </svg>`);
}

/** Arte de cada tema de GlucoAprende */
export function topicArt(id, { size = 120, label = '' } = {}) {
  const art = {
    alimentos: `<ellipse cx="60" cy="92" rx="52" ry="6" fill="#102A56" opacity=".07"/>
      <path d="M10 70 q30 26 60 0 z" fill="#2F7FD1"/><ellipse cx="40" cy="70" rx="30" ry="8" fill="#fff"/>
      <g fill="#fff" stroke="#E3EEF5" stroke-width="1">${[[24, 64], [32, 60], [42, 62], [50, 60], [56, 66], [36, 67], [46, 67], [28, 69]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5"/>`).join('')}</g>
      <path d="M86 40 c-12 -6 -24 4 -20 22 c4 18 14 24 20 20 c6 4 16 -2 20 -20 c4 -18 -8 -28 -20 -22z" fill="#E5484D"/>
      <path d="M86 40 c0 -8 2 -12 6 -16" stroke="#6B3E2A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M90 28 c8 -6 16 -2 16 -2 c-6 8 -12 8 -16 2z" fill="#4DB560"/>
      <ellipse cx="78" cy="52" rx="4" ry="7" fill="#fff" opacity=".35"/>
      <path d="M58 24 h28 a8 8 0 0 1 2 15.7 V52 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 V39.7 a8 8 0 0 1 2 -15.7z" fill="#F2BE6B" transform="translate(-48 -14)"/>
      <path d="M14 28 h20" stroke="#E2A21F" stroke-width="2" stroke-linecap="round"/>`,
    insulina: `<ellipse cx="60" cy="92" rx="52" ry="6" fill="#102A56" opacity=".07"/>
      <g transform="rotate(-30 60 52)"><rect x="18" y="42" width="72" height="20" rx="10" fill="#2F7FD1"/><rect x="84" y="45" width="18" height="14" rx="5" fill="#102A56"/><rect x="40" y="46" width="22" height="12" rx="3" fill="#BFE6FA"/><rect x="10" y="47" width="10" height="10" rx="3" fill="#FFC94A"/><path d="M102 52 h8" stroke="#8FA3B5" stroke-width="2.5" stroke-linecap="round"/></g>
      <rect x="76" y="56" width="22" height="30" rx="6" fill="#E0F4FF" stroke="#2F7FD1" stroke-width="2.5"/><rect x="80" y="50" width="14" height="8" rx="2" fill="#F16C7A"/><rect x="79" y="66" width="16" height="14" rx="2" fill="#24B6E6" opacity=".5"/>`,
    glucosa: `<ellipse cx="60" cy="94" rx="40" ry="5" fill="#102A56" opacity=".07"/>
      <rect x="34" y="10" width="52" height="78" rx="14" fill="#1F5FA8"/>
      <rect x="40" y="18" width="40" height="32" rx="6" fill="#E0F4FF"/>
      <text x="60" y="38" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="#102A56">105</text>
      <text x="60" y="47" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="7" fill="#5D6D7E">mg/dL</text>
      <circle cx="60" cy="66" r="8" fill="#24B6E6"/><rect x="54" y="86" width="12" height="10" rx="2" fill="#BFE6FA"/>
      <path d="M96 22 q5 8 0 12 q-5 -4 0 -12z" fill="#E5484D"/>`,
    actividad: `<ellipse cx="60" cy="92" rx="52" ry="6" fill="#102A56" opacity=".07"/>
      <path d="M14 70 c0 -16 10 -26 24 -26 l14 8 c10 6 22 8 34 10 c10 2 18 8 18 16 v4 H14z" fill="#2F7FD1"/>
      <rect x="12" y="78" width="94" height="10" rx="5" fill="#fff" stroke="#BFD8E8" stroke-width="2"/>
      <path d="M44 48 l6 12 M52 52 l6 12 M60 56 l4 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <circle cx="96" cy="30" r="16" fill="#FFC94A"/><path d="M84 22 q12 8 24 0 M84 38 q12 -8 24 0" stroke="#E2A21F" stroke-width="2.5" fill="none"/>`,
    habitos: `<ellipse cx="60" cy="92" rx="52" ry="6" fill="#102A56" opacity=".07"/>
      <rect x="12" y="50" width="70" height="36" rx="18" fill="#D8CEFA"/><path d="M22 60 q24 8 50 0" stroke="#B9A9F0" stroke-width="3" fill="none"/>
      <path d="M70 18 a16 16 0 1 0 18 22 a12 12 0 0 1 -18 -22z" fill="#FFC94A"/>
      <text x="30" y="36" font-family="Nunito, sans-serif" font-weight="900" font-size="16" fill="#7C6BD6">z</text><text x="42" y="26" font-family="Nunito, sans-serif" font-weight="900" font-size="12" fill="#7C6BD6">z</text>
      <path d="M92 52 h18 l-2 34 h-14z" fill="#BFE6FA" stroke="#2F7FD1" stroke-width="2.5" stroke-linejoin="round"/><path d="M93 66 h16" stroke="#24B6E6" stroke-width="2"/>`,
    ayuda: `<ellipse cx="60" cy="94" rx="50" ry="5" fill="#102A56" opacity=".07"/>
      <path d="M36 92 V40 a6 6 0 0 1 12 0 V26 a6 6 0 0 1 12 0 v2 a6 6 0 0 1 12 0 v8 a6 6 0 0 1 12 0 V70 c0 14 -10 22 -24 22z" fill="#F4C29C" stroke="#D99B72" stroke-width="2"/>
      <path d="M78 10 h32 a6 6 0 0 1 6 6 v18 a6 6 0 0 1 -6 6 h-18 l-8 8 v-8 h-6 a6 6 0 0 1 -6 -6 V16 a6 6 0 0 1 6 -6z" fill="#E5484D"/>
      <text x="94" y="33" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="20" fill="#fff">!</text>`,
    cuento: `<ellipse cx="60" cy="92" rx="52" ry="6" fill="#102A56" opacity=".07"/>
      <path d="M60 30 C46 20 26 20 12 26 V84 C26 78 46 78 60 88 Z" fill="#fff" stroke="#2F7FD1" stroke-width="3" stroke-linejoin="round"/>
      <path d="M60 30 C74 20 94 20 108 26 V84 C94 78 74 78 60 88 Z" fill="#FFF4CC" stroke="#2F7FD1" stroke-width="3" stroke-linejoin="round"/>
      <path d="M22 40 h26 M22 50 h26 M22 60 h20" stroke="#BFD8E8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="84" cy="52" r="12" fill="#4DB560"/><circle cx="88" cy="49" r="3" fill="#fff"/><circle cx="89" cy="49.5" r="1.6" fill="#1B2B4A"/>`,
  };
  return raw(`<svg width="${size}" height="${Math.round(size * .83)}" viewBox="0 0 120 100" ${a11y(label)}>${art[id] || art.cuento}</svg>`);
}

/** Escenas del cuento interactivo */
export function storyScene(step, { label = '' } = {}) {
  const sky = '<rect width="320" height="200" rx="20" fill="#E0F4FF"/>';
  const ground = '<path d="M0 150 q80 -14 160 0 t160 0 V200 H0z" fill="#9BD8A5"/>';
  const scenes = {
    1: `${sky}<g transform="translate(170 30) scale(.55)">${String(school({ size: 200 }))}</g>${ground}<g transform="translate(30 40) scale(.75)">${String(dino({ mood: 'wave', size: 200 }))}</g>
        <g transform="translate(150 120)"><rect width="34" height="40" rx="10" fill="#F16C7A"/><rect x="6" y="-6" width="22" height="10" rx="5" fill="none" stroke="#F16C7A" stroke-width="4"/></g>`,
    2: `${sky}${ground}<circle cx="250" cy="148" r="18" fill="#fff" stroke="#2F7FD1" stroke-width="4"/><path d="M236 140 q14 8 28 0" stroke="#2F7FD1" stroke-width="3" fill="none"/>
        <g transform="translate(60 40) scale(.75)">${String(dino({ mood: 'think', size: 200 }))}</g>
        <path d="M44 70 l-8 -6 M40 86 l-10 0 M200 70 l8 -6" stroke="#C93C4B" stroke-width="3" stroke-linecap="round"/>`,
    3: `${sky}<rect x="190" y="26" width="110" height="64" rx="8" fill="#1F5FA8"/><path d="M204 44 h70 M204 58 h50" stroke="#fff" stroke-width="4" stroke-linecap="round"/>${ground}
        <g transform="translate(20 46) scale(.7)">${String(dino({ mood: 'calm', size: 200 }))}</g>
        <g transform="translate(206 92)"><circle cx="30" cy="16" r="16" fill="#F4C29C"/><path d="M14 14 C12 -2 48 -4 46 14 C42 6 20 6 14 14z" fill="#5A3A2A"/><path d="M6 80 C8 46 52 46 54 80z" fill="#24B6E6"/><rect x="36" y="44" width="26" height="32" rx="3" fill="#fff" stroke="#2F7FD1" stroke-width="2.5"/><path d="M41 54 h16 M41 62 h12" stroke="#2F7FD1" stroke-width="2"/></g>`,
    4: `${sky}${ground}<rect x="200" y="96" width="90" height="52" rx="10" fill="#FFF4CC" stroke="#F2BE3B" stroke-width="3"/><path d="M212 110 h60 M212 122 h46" stroke="#E2A21F" stroke-width="3" stroke-linecap="round"/>
        <g transform="translate(40 50) scale(.66)">${String(dino({ mood: 'calm', size: 200 }))}</g>
        <g transform="translate(226 40)"><rect width="40" height="56" rx="8" fill="#102A56"/><rect x="6" y="8" width="28" height="30" rx="4" fill="#BFE6FA"/><circle cx="20" cy="46" r="4" fill="#24B6E6"/></g>`,
    5: `${sky}${ground}<g transform="translate(20 40) scale(.72)">${String(dino({ mood: 'happy', size: 200 }))}</g>
        <g transform="translate(190 70) scale(.62)">${String(dino({ mood: 'wave', size: 200 }))}</g>
        <circle cx="270" cy="70" r="12" fill="#F16C7A"/><path d="M262 66 h16" stroke="#fff" stroke-width="3"/>`,
  };
  return raw(`<svg class="story-svg" viewBox="0 0 320 200" ${a11y(label)}>${scenes[step] || scenes[1]}</svg>`);
}

/** Puntos decorativos para fondos */
export function sparkleDots() {
  return raw(`<svg class="deco-dots" width="120" height="60" viewBox="0 0 120 60" aria-hidden="true" focusable="false">
    <circle cx="10" cy="30" r="5" fill="#24B6E6" opacity=".5"/><circle cx="40" cy="12" r="4" fill="#FFC94A"/><circle cx="70" cy="40" r="6" fill="#F16C7A" opacity=".6"/><circle cx="104" cy="18" r="4" fill="#4DB560" opacity=".7"/>
  </svg>`);
}
