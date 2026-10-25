// couverture.js — Couverture éditoriale haute définition (rendu HTML/SVG par Chromium).
// Usage : node _outils/couverture.js <slug> "<titre>" <categorie> "<sur-titre>" <numero> [bleu|orange|vert|violet|auto] [scission|nuit|accent|papier] [--motif=fiche-produit|document|tableau-de-bord|calendrier]
// Produit articles/<slug>-cover.jpg en 2400x1260 (affichage 1200x630, net sur écrans Retina).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
const POL = path.join(__dirname, 'polices');
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const OPTS = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [slug, titre, cat, surTitre = 'Analyse', numero = '', accentArgBrut, styleArg] = ARGS;
const COULEURS = ['bleu', 'orange', 'vert', 'violet'];
const accentArg = COULEURS.includes(accentArgBrut) ? accentArgBrut : undefined;
const MOTIF = OPTS.motif || '';
if (!slug || !titre || !cat) {
  console.error('Usage : node _outils/couverture.js <slug> "<titre>" <categorie> "<sur-titre>" <numero> [orange|bleu]');
  process.exit(1);
}

const LIBELLES = { seo: 'SEO & visibilité', saas: 'SaaS B2B', ecommerce: 'E-commerce tech',
  cyber: 'Cybersécurité', fintech: 'Fintech', rh: 'RH tech' };
// Couleurs d'accent : celles du site techrepaircontent.com (bleu, orange, vert, violet).
// Sans choix explicite, la couleur tourne avec le numéro, décalée à chaque cycle de styles
// pour ne jamais répéter la même combinaison style + couleur deux fois de suite.
const ACCENTS = {
  bleu:   { a: '#2563EB', b: '#93C5FD', c: '#1A56DB' },
  orange: { a: '#F97316', b: '#FDBA74', c: '#C2410C' },
  vert:   { a: '#10B981', b: '#6EE7B7', c: '#047857' },
  violet: { a: '#7C3AED', b: '#C4B5FD', c: '#6D28D9' },
};
const N = parseInt(numero, 10) || 0;
const AC = ACCENTS[accentArg || COULEURS[(N + Math.floor(N / 4)) % 4]];
const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const d = new Date();
const dateTxt = `${MOIS[d.getMonth()][0].toUpperCase()}${MOIS[d.getMonth()].slice(1)} ${d.getFullYear()}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fonte = w => `url(data:font/woff2;base64,${fs.readFileSync(path.join(POL, `manrope-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2')`;

// ── Pseudo-aléatoire déterministe (même slug = même image) ─────────────────
let graine = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const rnd = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);

// ── Illustrations (repère du panneau : 492 x 630, centre ~ 246,300) ────────
const W = 'rgba(255,255,255,', CX = 246, CY = 300;
// Styles de couverture : ils tournent d'un article à l'autre (numéro), ou se forcent en 7e argument.
const STYLES = ['scission', 'nuit', 'accent', 'papier'];
const STYLE = STYLES.includes(styleArg) ? styleArg : STYLES[N % STYLES.length];
let INK = W, IL = AC, FOND = '#0B1633';
if (STYLE === 'papier') { INK = 'rgba(11,22,51,'; FOND = '#F6F4EF'; }
if (STYLE === 'accent') { IL = { a: '#FFFFFF', b: '#FFFFFF', c: '#0B1633', glow: 'rgba(255,255,255,.4)' }; FOND = AC.c; }
function illustration() {
  const defs = `
    <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${IL.a}" stop-opacity=".55"/><stop offset="1" stop-color="${IL.a}" stop-opacity="0"/></radialGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${IL.b}"/><stop offset="1" stop-color="${IL.a}"/></linearGradient>
    <linearGradient id="acc2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${AC.b}"/><stop offset="1" stop-color="${AC.a}"/></linearGradient>
    <linearGradient id="verre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".03"/></linearGradient>
    <filter id="flou" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`;
  let g = `<circle cx="${CX}" cy="${CY}" r="210" fill="url(#halo)" opacity=".55"/>`;
  const ombre = `<filter id="ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#020617" flood-opacity=".35"/></filter>`;
  const barre = (x, y, w, h, c, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c}" fill-opacity="${o}"/>`;
  const pastille = (x, y, ok) => `<g><circle cx="${x}" cy="${y}" r="15" fill="${ok ? '#10B981' : '#EF4444'}" stroke="#fff" stroke-width="3"/>${ok
    ? `<path d="M ${x - 6} ${y} l 4 4.5 l 8 -9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M ${x - 5} ${y - 5} l 10 10 M ${x + 5} ${y - 5} l -10 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`}</g>`;
  if (MOTIF === 'fiche-produit') {
    // Fiche produit stylisée, annotée comme un audit : ce qui est vérifiable (✓) / ce qui ne l'est pas (✕).
    const x = CX - 128, y = CY - 196, w = 256, h = 392;
    g += `<defs>${ombre}<linearGradient id="visuel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEF2F8"/><stop offset="1" stop-color="#DCE3EE"/></linearGradient></defs>
      <rect x="${x + 22}" y="${y + 18}" width="${w}" height="${h}" rx="18" fill="#fff" opacity=".08" transform="rotate(6 ${CX} ${CY})"/>
      <g filter="url(#ombre)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff"/></g>
      <rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="150" rx="12" fill="url(#visuel)"/>
      <rect x="${CX - 62}" y="${y + 52}" width="124" height="80" rx="8" fill="#0F1B3D"/><rect x="${CX - 54}" y="${y + 59}" width="108" height="64" rx="4" fill="url(#acc2)"/>
      <path d="M ${CX - 82} ${y + 134} h 164 l -10 10 h -144 z" fill="#94A3B8"/>
      <g transform="translate(${x + 30} ${y + 30})"><circle r="16" fill="${AC.a}"/><path d="M -6 6 C -6 -4 0 -9 8 -9 C 8 -1 3 6 -6 6 Z M -6 6 L 2 -2" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>
      ${barre(x + 22, y + 184, 170, 12, '#0F1B3D')}${barre(x + 22, y + 206, 120, 10, '#94A3B8', .7)}
      <g fill="#F59E0B">${[0, 1, 2, 3, 4].map(i => `<path transform="translate(${x + 30 + i * 20} ${y + 236}) scale(.8)" d="M0,-9 L2.6,-3 L9,-2.8 L4,1.4 L5.6,8 L0,4.4 L-5.6,8 L-4,1.4 L-9,-2.8 L-2.6,-3 Z" opacity="${i < 4 ? 1 : .3}"/>`).join('')}</g>
      ${barre(x + 22, y + 262, 200, 8, '#CBD5E1')}${barre(x + 22, y + 278, 176, 8, '#CBD5E1')}${barre(x + 22, y + 294, 188, 8, '#CBD5E1')}
      ${barre(x + 22, y + 318, 74, 16, '#0F1B3D')}
      <rect x="${x + 22}" y="${y + 344}" width="${w - 44}" height="34" rx="9" fill="${AC.a}"/>${barre(CX - 46, y + 357, 92, 8, '#fff', .9)}
      <path d="M ${x + w - 4} ${y + 30} C ${x + w + 30} ${y + 30} ${x + w + 30} ${y + 52} ${x + w + 44} ${y + 52}" fill="none" stroke="${INK}.55)" stroke-width="1.5" stroke-dasharray="3 4"/>${pastille(x + w + 58, y + 52, false)}
      <path d="M ${x + w - 30} ${y + 266} C ${x + w + 20} ${y + 266} ${x + w + 20} ${y + 286} ${x + w + 44} ${y + 286}" fill="none" stroke="${INK}.55)" stroke-width="1.5" stroke-dasharray="3 4"/>${pastille(x + w + 58, y + 286, true)}
      <path d="M ${x + 4} ${y + 190} C ${x - 30} ${y + 190} ${x - 30} ${y + 210} ${x - 44} ${y + 210}" fill="none" stroke="${INK}.55)" stroke-width="1.5" stroke-dasharray="3 4"/>${pastille(x - 58, y + 210, true)}`;
  } else if (MOTIF === 'document') {
    // Texte réglementaire : pages empilées, articles surlignés, tampon.
    const x = CX - 120, y = CY - 180, w = 240, h = 340;
    g += `<defs>${ombre}</defs>
      <rect x="${x + 26}" y="${y - 14}" width="${w}" height="${h}" rx="10" fill="#fff" opacity=".12" transform="rotate(5 ${CX} ${CY})"/>
      <rect x="${x + 12}" y="${y - 6}" width="${w}" height="${h}" rx="10" fill="#fff" opacity=".25" transform="rotate(2 ${CX} ${CY})"/>
      <g filter="url(#ombre)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff"/></g>
      ${barre(x + 28, y + 34, 120, 12, '#0F1B3D')}${barre(x + 28, y + 56, 80, 8, '#94A3B8')}
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const yy = y + 92 + i * 20; const hl = i === 2 || i === 3 || i === 7;
        return (hl ? `<rect x="${x + 22}" y="${yy - 7}" width="${w - 44}" height="16" rx="4" fill="${AC.b}" fill-opacity=".55"/>` : '') + barre(x + 28, yy - 3, (i % 3 === 2 ? 140 : 184), 7, hl ? '#0F1B3D' : '#CBD5E1'); }).join('')}
      <g transform="translate(${x + w - 34} ${y + h - 40}) rotate(-14)"><circle r="40" fill="none" stroke="${AC.a}" stroke-width="4"/><circle r="30" fill="none" stroke="${AC.a}" stroke-width="1.5"/><path d="M -14 0 l 9 9 l 19 -20" fill="none" stroke="${AC.a}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  } else if (MOTIF === 'tableau-de-bord') {
    const x = CX - 150, y = CY - 150, w = 300, h = 300;
    let bars = '';
    for (let i = 0; i < 7; i++) { const hh = 30 + rnd() * 90; bars += `<rect x="${x + 30 + i * 36}" y="${y + 250 - hh}" width="22" height="${hh}" rx="4" fill="${i === 5 ? AC.a : '#CBD5E1'}"/>`; }
    g += `<defs>${ombre}</defs><g filter="url(#ombre)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff"/></g>
      ${barre(x + 24, y + 26, 90, 10, '#0F1B3D')}
      <rect x="${x + 24}" y="${y + 52}" width="76" height="58" rx="10" fill="#F1F5F9"/>${barre(x + 34, y + 66, 40, 14, AC.a)}${barre(x + 34, y + 90, 50, 7, '#94A3B8')}
      <rect x="${x + 112}" y="${y + 52}" width="76" height="58" rx="10" fill="#F1F5F9"/>${barre(x + 122, y + 66, 46, 14, '#0F1B3D')}${barre(x + 122, y + 90, 40, 7, '#94A3B8')}
      <rect x="${x + 200}" y="${y + 52}" width="76" height="58" rx="10" fill="#F1F5F9"/>${barre(x + 210, y + 66, 34, 14, '#10B981')}${barre(x + 210, y + 90, 48, 7, '#94A3B8')}
      ${bars}<line x1="${x + 24}" y1="${y + 252}" x2="${x + w - 24}" y2="${y + 252}" stroke="#E2E8F0"/>`;
  } else if (MOTIF === 'calendrier') {
    const x = CX - 140, y = CY - 140, w = 280, h = 290;
    let cases = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const n = r * 7 + c; const cible = n === 23;
      cases += `<rect x="${x + 20 + c * 35}" y="${y + 90 + r * 36}" width="28" height="28" rx="7" fill="${cible ? AC.a : (n < 23 ? '#E2E8F0' : '#F8FAFC')}"/>`; }
    g += `<defs>${ombre}</defs><g filter="url(#ombre)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff"/></g>
      <path d="M ${x} ${y + 18} a 18 18 0 0 1 18 -18 h ${w - 36} a 18 18 0 0 1 18 18 v 46 h -${w} z" fill="#0F1B3D"/>
      ${barre(x + 24, y + 28, 100, 12, '#fff')}<rect x="${x + 60}" y="${y - 14}" width="12" height="30" rx="6" fill="#94A3B8"/><rect x="${x + w - 72}" y="${y - 14}" width="12" height="30" rx="6" fill="#94A3B8"/>
      ${cases}<circle cx="${x + 20 + 2 * 35 + 14}" cy="${y + 90 + 3 * 36 + 14}" r="24" fill="none" stroke="${AC.a}" stroke-width="3" stroke-dasharray="4 4"/>`;
  } else if (cat === 'cyber') {
    const shield = (s) => `M ${CX} ${CY - 150 * s} L ${CX + 118 * s} ${CY - 108 * s} L ${CX + 118 * s} ${CY + 6 * s} C ${CX + 118 * s} ${CY + 88 * s} ${CX + 62 * s} ${CY + 142 * s} ${CX} ${CY + 170 * s} C ${CX - 62 * s} ${CY + 142 * s} ${CX - 118 * s} ${CY + 88 * s} ${CX - 118 * s} ${CY + 6 * s} L ${CX - 118 * s} ${CY - 108 * s} Z`;
    let hex = '';
    const r = 21;
    for (let q = -9; q <= 9; q++) for (let k = -9; k <= 9; k++) {
      const x = CX + q * r * 1.5, y = CY + k * r * Math.sqrt(3) + (q & 1) * r * Math.sqrt(3) / 2;
      const pts = [...Array(6)].map((_, i) => `${(x + (r - 2) * Math.cos(Math.PI / 3 * i)).toFixed(1)},${(y + (r - 2) * Math.sin(Math.PI / 3 * i)).toFixed(1)}`).join(' ');
      const on = false; rnd();
      hex += `<polygon points="${pts}" fill="${on ? IL.a : 'none'}" fill-opacity="${on ? .22 : 0}" stroke="${INK}.12)" stroke-width="1"/>`;
    }
    g += `<defs><clipPath id="bouclier"><path d="${shield(1)}"/></clipPath></defs>
      <path d="${shield(1.42)}" fill="none" stroke="${INK}.07)" stroke-width="1"/>
      <path d="${shield(1.22)}" fill="none" stroke="${INK}.12)" stroke-width="1" stroke-dasharray="2 6"/>
      <path d="${shield(1)}" fill="url(#verre)"/>
      <g clip-path="url(#bouclier)">${hex}</g>
      <path d="${shield(1)}" fill="none" stroke="url(#acc)" stroke-width="2.5"/>
      <circle cx="${CX}" cy="${CY + 6}" r="44" fill="${IL.a}" filter="url(#flou)" opacity=".7"/>
      <rect x="${CX - 30}" y="${CY - 8}" width="60" height="50" rx="9" fill="url(#acc)"/>
      <path d="M ${CX - 18} ${CY - 8} V ${CY - 26} a 18 18 0 0 1 36 0 V ${CY - 8}" fill="none" stroke="url(#acc)" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${CX}" cy="${CY + 12}" r="6" fill="#0B1633"/><rect x="${CX - 2.5}" y="${CY + 14}" width="5" height="14" rx="2" fill="#0B1633"/>`;
  } else if (cat === 'seo') {
    for (let i = 0; i < 9; i++) {
      const r = 34 + i * 26;
      g += `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${INK}${i % 3 === 2 ? .22 : .09})" stroke-width="1" ${i % 2 ? 'stroke-dasharray="1 5"' : ''}/>`;
    }
    for (let i = 0; i < 9; i++) {
      const r = 60 + Math.floor(rnd() * 8) * 26, a = rnd() * Math.PI * 2;
      g += `<circle cx="${(CX + r * Math.cos(a)).toFixed(1)}" cy="${(CY + r * Math.sin(a)).toFixed(1)}" r="${i % 3 ? 4 : 7}" fill="${i % 3 ? '#fff' : IL.a}" opacity="${i % 3 ? .55 : 1}"/>`;
    }
    g += `<path d="M ${CX} ${CY} L ${CX + 230} ${CY - 120} A 260 260 0 0 1 ${CX + 252} ${CY - 20} Z" fill="url(#acc)" opacity=".18"/>
      <circle cx="${CX}" cy="${CY}" r="30" fill="${IL.a}" filter="url(#flou)"/><circle cx="${CX}" cy="${CY}" r="16" fill="#fff"/>`;
  } else if (cat === 'saas') {
    const couche = (dy, o, f) => `<path d="M ${CX} ${CY - 70 + dy} L ${CX + 150} ${CY + dy} L ${CX} ${CY + 70 + dy} L ${CX - 150} ${CY + dy} Z" fill="${f}" fill-opacity="${o}" stroke="${INK}.35)" stroke-width="1.2"/>`;
    g += couche(110, .05, '#fff') + couche(55, .08, '#fff') + couche(0, .12, '#fff') + couche(-55, .9, 'url(#acc)');
    for (let i = 0; i < 4; i++) g += `<line x1="${CX - 150}" y1="${CY - 55 + i * 55}" x2="${CX - 150}" y2="${CY + i * 55}" stroke="${INK}.15)"/>`;
    g += `<path d="M ${CX - 60} ${CY - 85} L ${CX + 40} ${CY - 60} M ${CX - 20} ${CY - 110} L ${CX + 70} ${CY - 85}" stroke="#0B1633" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`;
  } else if (cat === 'fintech') {
    const x0 = CX - 170, x1 = CX + 170, y0 = CY + 140, y1 = CY - 150;
    for (let i = 0; i <= 6; i++) g += `<line x1="${x0}" y1="${y0 + (y1 - y0) * i / 6}" x2="${x1}" y2="${y0 + (y1 - y0) * i / 6}" stroke="${INK}.08)"/>`;
    let v = .1; const pts = [];
    for (let i = 0; i < 11; i++) { v = Math.min(.9, v + .03 + rnd() * .1); pts.push([x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * v]); }
    const ligne = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    g += `<defs><linearGradient id="aire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${IL.a}" stop-opacity=".45"/><stop offset="1" stop-color="${IL.a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${ligne} L ${x1} ${y0} L ${x0} ${y0} Z" fill="url(#aire)"/>
      <path d="${ligne}" fill="none" stroke="url(#acc)" stroke-width="3.5" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { if (i % 2 === 0 || i === pts.length - 1) g += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 8 : 4.5}" fill="${i === pts.length - 1 ? '#fff' : IL.a}" stroke="${FOND}" stroke-width="2"/>`; });
    g += `<circle cx="${CX + 100}" cy="${CY + 60}" r="46" fill="none" stroke="${INK}.18)"/><circle cx="${CX + 100}" cy="${CY + 60}" r="34" fill="none" stroke="${INK}.1)"/>`;
  } else if (cat === 'rh') {
    const nodes = [...Array(16)].map(() => [CX + (rnd() - .5) * 320, CY + (rnd() - .5) * 380]);
    nodes[0] = [CX, CY];
    nodes.forEach((a, i) => nodes.slice(i + 1).forEach(b => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 150) g += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${INK}.16)"/>`; }));
    nodes.forEach(([x, y], i) => {
      const r = i === 0 ? 34 : i % 4 === 0 ? 18 : 11, f = i === 0 ? 'url(#acc)' : i % 4 === 0 ? IL.a : '#1E3366';
      g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${INK}.4)" stroke-width="1.2"/>`;
      if (r > 11) g += `<circle cx="${x}" cy="${y - r * .22}" r="${r * .28}" fill="#0B1633" opacity=".55"/><path d="M ${x - r * .5} ${y + r * .55} a ${r * .5} ${r * .42} 0 0 1 ${r} 0" fill="#0B1633" opacity=".55"/>`;
    });
  } else { // ecommerce : boîtes isométriques
    const boite = (x, y, s, plein) => {
      const h = s * .58;
      return `<path d="M ${x} ${y - h} L ${x + s} ${y - h + s * .5} L ${x} ${y + s * .5 - h + s * .5} L ${x - s} ${y - h + s * .5} Z" fill="${plein ? 'url(#acc)' : 'url(#verre)'}" stroke="${INK}.35)"/>
        <path d="M ${x - s} ${y - h + s * .5} L ${x} ${y + s - h} L ${x} ${y + s} L ${x - s} ${y + s * .5} Z" fill="${plein ? IL.c : '#fff'}" fill-opacity="${plein ? 1 : .05}" stroke="${INK}.3)"/>
        <path d="M ${x + s} ${y - h + s * .5} L ${x} ${y + s - h} L ${x} ${y + s} L ${x + s} ${y + s * .5} Z" fill="${plein ? IL.a : '#fff'}" fill-opacity="${plein ? .75 : .1}" stroke="${INK}.3)"/>`;
    };
    [[-110, -40, 52], [10, -100, 52], [120, -30, 52], [-50, 60, 52], [70, 50, 70], [-150, 150, 40], [150, 150, 40]]
      .forEach(([dx, dy, s], i) => { g += boite(CX + dx, CY + dy, s, i === 4); });
  }
  return `<svg width="492" height="630" viewBox="0 0 492 630" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${g}</svg>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;font-weight:400;src:${fonte(400)}}
@font-face{font-family:M;font-weight:500;src:${fonte(500)}}
@font-face{font-family:M;font-weight:600;src:${fonte(600)}}
@font-face{font-family:M;font-weight:700;src:${fonte(700)}}
@font-face{font-family:M;font-weight:800;src:${fonte(800)}}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;font-family:M,sans-serif;background:#F6F4EF;overflow:hidden;position:relative;-webkit-font-smoothing:antialiased}
.grain{position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply}
.gauche{position:absolute;left:0;top:0;width:708px;height:630px;padding:56px 64px 0 68px}
.marque{display:flex;align-items:center;gap:12px}
.logo{width:34px;height:34px;border-radius:8px;background:#0B1633;color:#fff;font-weight:800;font-size:11.5px;display:grid;place-items:center;letter-spacing:-.2px;position:relative}
.logo:after{content:"";position:absolute;right:-3px;top:-3px;width:9px;height:9px;border-radius:50%;background:${AC.a};border:2px solid #F6F4EF}
.nom{font-weight:800;font-size:15px;color:#0B1633;letter-spacing:-.1px}
.sep{width:1px;height:16px;background:#CBD2DE}
.coll{font-weight:600;font-size:12px;color:#6B7690;letter-spacing:2.4px;text-transform:uppercase}
.kicker{margin-top:76px;display:flex;align-items:center;gap:14px;font-weight:800;font-size:13px;letter-spacing:2.6px;text-transform:uppercase;color:${AC.c}}
.kicker i{display:block;width:34px;height:3px;background:${AC.a};border-radius:2px}
h1{margin-top:22px;font-weight:800;color:#0B1633;letter-spacing:-1.6px;line-height:1.06;max-width:575px;text-wrap:balance}
h1 em{font-style:normal;color:${AC.c}}
.pied{position:absolute;left:68px;right:64px;bottom:48px;display:flex;align-items:center;gap:14px;font-size:14px;color:#55607A;font-weight:500;padding-top:20px;border-top:1px solid #DCD8CE}
.pied b{color:#0B1633;font-weight:700}
.pied .pt{width:4px;height:4px;border-radius:50%;background:#B5BCCB}
.pied .num{margin-left:auto;font-weight:800;color:${AC.c};letter-spacing:1.6px;font-size:13px}
.droite{position:absolute;right:0;top:0;width:492px;height:630px;background:radial-gradient(120% 90% at 70% 20%,#1B326A 0%,#0F1F47 45%,#0A1430 100%);overflow:hidden}
.droite:before{content:"";position:absolute;inset:0;background-image:linear-gradient(${W}.045) 1px,transparent 1px),linear-gradient(90deg,${W}.045) 1px,transparent 1px);background-size:41px 41px}
.droite svg{position:absolute;inset:0}
.filet{position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,${AC.b},${AC.a} 40%,${AC.c})}
.legende{position:absolute;left:34px;bottom:44px;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${W}.55);font-weight:700}
.legende span{color:${AC.b}}

/* ── Variante « nuit » : pleine page sombre ── */
body.s-nuit{background:radial-gradient(90% 120% at 85% 30%,#1B326A 0%,#0E1D44 45%,#08112A 100%)}
body.s-nuit .grain{mix-blend-mode:screen;opacity:.25}
body.s-nuit:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:41px 41px}
body.s-nuit .droite,body.s-papier .droite,body.s-accent .droite{background:none}
body.s-nuit .droite:before,body.s-papier .droite:before,body.s-accent .droite:before,body.s-nuit .filet,body.s-papier .filet,body.s-accent .filet{display:none}
body.s-nuit .nom,body.s-nuit h1,body.s-nuit .pied b{color:#fff}
body.s-nuit h1 em{color:${AC.b}}
body.s-nuit .kicker{color:${AC.b}}
body.s-nuit .logo{background:#fff;color:#0B1633}
body.s-nuit .logo:after,body.s-accent .logo:after{border-color:transparent}
body.s-nuit .coll,body.s-nuit .pied{color:#94A3B8}
body.s-nuit .sep{background:rgba(255,255,255,.2)}
body.s-nuit .pied{border-top-color:rgba(255,255,255,.14)}
body.s-nuit .pied .num{color:${AC.b}}
/* ── Variante « accent » : aplat orange ou bleu ── */
body.s-accent{background:linear-gradient(135deg,${AC.a} 0%,${AC.c} 100%)}
body.s-accent .grain{mix-blend-mode:soft-light;opacity:.5}
body.s-accent .nom,body.s-accent h1,body.s-accent .pied b{color:#fff}
body.s-accent h1 em{color:#0B1633}
body.s-accent .kicker,body.s-accent .coll,body.s-accent .pied,body.s-accent .pied .num{color:rgba(255,255,255,.85)}
body.s-accent .kicker i{background:#fff}
body.s-accent .logo{background:#0B1633}
body.s-accent .logo:after{background:#fff}
body.s-accent .sep{background:rgba(255,255,255,.35)}
body.s-accent .pied{border-top-color:rgba(255,255,255,.3)}
body.s-accent .pt{background:rgba(255,255,255,.6)}
/* ── Variante « papier » : pleine page claire, trait encre ── */
body.s-papier:after{content:"";position:absolute;left:0;right:0;top:0;height:8px;background:linear-gradient(90deg,${AC.c},${AC.a} 50%,${AC.b})}
</style></head><body class="s-${STYLE}">
<svg class="grain" width="1200" height="630"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .09 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="gauche">
  <div class="marque"><div class="logo">TRD</div><div class="nom">TechRepair Content</div><div class="sep"></div><div class="coll">Analyses</div></div>
  <div class="kicker">${esc(LIBELLES[cat] || cat)}</div>
  <h1 id="t">${esc(titre).replace(/^([^:]+:)/, '<em>$1</em>')}</h1>
  <div class="pied"><b>${esc(surTitre)}</b><span class="pt"></span><span>${dateTxt}</span>${numero ? `<span class="num">N° ${String(numero).padStart(3, '0')}</span>` : ''}</div>
</div>
<div class="droite"><div class="filet"></div>${illustration()}</div>
</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(async () => {
    await document.fonts.ready;
    const t = document.getElementById('t');
    // Plus grande taille qui tient en 4 lignes et au-dessus du pied de page.
    for (let s = 56; s >= 34; s -= 1) {
      t.style.fontSize = s + 'px';
      const lignes = Math.round(t.offsetHeight / (s * 1.06));
      if (lignes <= 4 && t.getBoundingClientRect().bottom < 510) break;
    }
    // Centre optiquement le bloc catégorie + titre entre la marque et le pied de page.
    const k = document.querySelector('.kicker');
    const haut = k.getBoundingClientRect().top, bas = t.getBoundingClientRect().bottom;
    const decalage = Math.max(0, ((118 + 520) / 2 - (haut + bas) / 2));
    k.style.marginTop = (76 + decalage) + 'px';
  });
  const sortie = path.join(RACINE, 'articles', `${slug}-cover.jpg`);
  await p.screenshot({ path: sortie, type: 'jpeg', quality: 90 });
  await b.close();
  console.log('OK : ' + path.relative(RACINE, sortie));
})();
