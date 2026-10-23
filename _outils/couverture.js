// couverture.js — Couverture éditoriale haute définition (rendu HTML/SVG par Chromium).
// Usage : node _outils/couverture.js <slug> "<titre>" <categorie> "<sur-titre>" <numero> [orange|bleu]
// Produit articles/<slug>-cover.jpg en 2400x1260 (affichage 1200x630, net sur écrans Retina).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
const POL = path.join(__dirname, 'polices');
const [slug, titre, cat, surTitre = 'Analyse', numero = '', accentArg] = process.argv.slice(2);
if (!slug || !titre || !cat) {
  console.error('Usage : node _outils/couverture.js <slug> "<titre>" <categorie> "<sur-titre>" <numero> [orange|bleu]');
  process.exit(1);
}

const LIBELLES = { seo: 'SEO & visibilité', saas: 'SaaS B2B', ecommerce: 'E-commerce tech',
  cyber: 'Cybersécurité', fintech: 'Fintech', rh: 'RH tech' };
// Accent par défaut : orange pour cyber, e-commerce, RH ; bleu pour SEO, SaaS, fintech.
const PAR_DEFAUT = { cyber: 'orange', ecommerce: 'orange', rh: 'orange', seo: 'bleu', saas: 'bleu', fintech: 'bleu' };
const ACCENTS = {
  orange: { a: '#F97316', b: '#FDBA74', c: '#C2410C', glow: 'rgba(249,115,22,.55)' },
  bleu:   { a: '#2563EB', b: '#93C5FD', c: '#1A56DB', glow: 'rgba(37,99,235,.6)' },
};
const AC = ACCENTS[accentArg || PAR_DEFAUT[cat] || 'bleu'];
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
function illustration() {
  const defs = `
    <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${AC.a}" stop-opacity=".55"/><stop offset="1" stop-color="${AC.a}" stop-opacity="0"/></radialGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${AC.b}"/><stop offset="1" stop-color="${AC.a}"/></linearGradient>
    <linearGradient id="verre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".03"/></linearGradient>
    <filter id="flou" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`;
  let g = `<circle cx="${CX}" cy="${CY}" r="210" fill="url(#halo)" opacity=".55"/>`;
  if (cat === 'cyber') {
    const shield = (s) => `M ${CX} ${CY - 150 * s} L ${CX + 118 * s} ${CY - 108 * s} L ${CX + 118 * s} ${CY + 6 * s} C ${CX + 118 * s} ${CY + 88 * s} ${CX + 62 * s} ${CY + 142 * s} ${CX} ${CY + 170 * s} C ${CX - 62 * s} ${CY + 142 * s} ${CX - 118 * s} ${CY + 88 * s} ${CX - 118 * s} ${CY + 6 * s} L ${CX - 118 * s} ${CY - 108 * s} Z`;
    let hex = '';
    const r = 21;
    for (let q = -9; q <= 9; q++) for (let k = -9; k <= 9; k++) {
      const x = CX + q * r * 1.5, y = CY + k * r * Math.sqrt(3) + (q & 1) * r * Math.sqrt(3) / 2;
      const pts = [...Array(6)].map((_, i) => `${(x + (r - 2) * Math.cos(Math.PI / 3 * i)).toFixed(1)},${(y + (r - 2) * Math.sin(Math.PI / 3 * i)).toFixed(1)}`).join(' ');
      const on = false; rnd();
      hex += `<polygon points="${pts}" fill="${on ? AC.a : 'none'}" fill-opacity="${on ? .22 : 0}" stroke="${W}.12)" stroke-width="1"/>`;
    }
    g += `<defs><clipPath id="bouclier"><path d="${shield(1)}"/></clipPath></defs>
      <path d="${shield(1.42)}" fill="none" stroke="${W}.07)" stroke-width="1"/>
      <path d="${shield(1.22)}" fill="none" stroke="${W}.12)" stroke-width="1" stroke-dasharray="2 6"/>
      <path d="${shield(1)}" fill="url(#verre)"/>
      <g clip-path="url(#bouclier)">${hex}</g>
      <path d="${shield(1)}" fill="none" stroke="url(#acc)" stroke-width="2.5"/>
      <circle cx="${CX}" cy="${CY + 6}" r="44" fill="${AC.a}" filter="url(#flou)" opacity=".7"/>
      <rect x="${CX - 30}" y="${CY - 8}" width="60" height="50" rx="9" fill="url(#acc)"/>
      <path d="M ${CX - 18} ${CY - 8} V ${CY - 26} a 18 18 0 0 1 36 0 V ${CY - 8}" fill="none" stroke="url(#acc)" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${CX}" cy="${CY + 12}" r="6" fill="#0B1633"/><rect x="${CX - 2.5}" y="${CY + 14}" width="5" height="14" rx="2" fill="#0B1633"/>`;
  } else if (cat === 'seo') {
    for (let i = 0; i < 9; i++) {
      const r = 34 + i * 26;
      g += `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${W}${i % 3 === 2 ? .22 : .09})" stroke-width="1" ${i % 2 ? 'stroke-dasharray="1 5"' : ''}/>`;
    }
    for (let i = 0; i < 9; i++) {
      const r = 60 + Math.floor(rnd() * 8) * 26, a = rnd() * Math.PI * 2;
      g += `<circle cx="${(CX + r * Math.cos(a)).toFixed(1)}" cy="${(CY + r * Math.sin(a)).toFixed(1)}" r="${i % 3 ? 4 : 7}" fill="${i % 3 ? '#fff' : AC.a}" opacity="${i % 3 ? .55 : 1}"/>`;
    }
    g += `<path d="M ${CX} ${CY} L ${CX + 230} ${CY - 120} A 260 260 0 0 1 ${CX + 252} ${CY - 20} Z" fill="url(#acc)" opacity=".18"/>
      <circle cx="${CX}" cy="${CY}" r="30" fill="${AC.a}" filter="url(#flou)"/><circle cx="${CX}" cy="${CY}" r="16" fill="#fff"/>`;
  } else if (cat === 'saas') {
    const couche = (dy, o, f) => `<path d="M ${CX} ${CY - 70 + dy} L ${CX + 150} ${CY + dy} L ${CX} ${CY + 70 + dy} L ${CX - 150} ${CY + dy} Z" fill="${f}" fill-opacity="${o}" stroke="${W}.35)" stroke-width="1.2"/>`;
    g += couche(110, .05, '#fff') + couche(55, .08, '#fff') + couche(0, .12, '#fff') + couche(-55, .9, 'url(#acc)');
    for (let i = 0; i < 4; i++) g += `<line x1="${CX - 150}" y1="${CY - 55 + i * 55}" x2="${CX - 150}" y2="${CY + i * 55}" stroke="${W}.15)"/>`;
    g += `<path d="M ${CX - 60} ${CY - 85} L ${CX + 40} ${CY - 60} M ${CX - 20} ${CY - 110} L ${CX + 70} ${CY - 85}" stroke="#0B1633" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`;
  } else if (cat === 'fintech') {
    const x0 = CX - 170, x1 = CX + 170, y0 = CY + 140, y1 = CY - 150;
    for (let i = 0; i <= 6; i++) g += `<line x1="${x0}" y1="${y0 + (y1 - y0) * i / 6}" x2="${x1}" y2="${y0 + (y1 - y0) * i / 6}" stroke="${W}.08)"/>`;
    let v = .1; const pts = [];
    for (let i = 0; i < 11; i++) { v = Math.min(.9, v + .03 + rnd() * .1); pts.push([x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * v]); }
    const ligne = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    g += `<defs><linearGradient id="aire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AC.a}" stop-opacity=".45"/><stop offset="1" stop-color="${AC.a}" stop-opacity="0"/></linearGradient></defs>
      <path d="${ligne} L ${x1} ${y0} L ${x0} ${y0} Z" fill="url(#aire)"/>
      <path d="${ligne}" fill="none" stroke="url(#acc)" stroke-width="3.5" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { if (i % 2 === 0 || i === pts.length - 1) g += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 8 : 4.5}" fill="${i === pts.length - 1 ? '#fff' : AC.a}" stroke="#0B1633" stroke-width="2"/>`; });
    g += `<circle cx="${CX + 100}" cy="${CY + 60}" r="46" fill="none" stroke="${W}.18)"/><circle cx="${CX + 100}" cy="${CY + 60}" r="34" fill="none" stroke="${W}.1)"/>`;
  } else if (cat === 'rh') {
    const nodes = [...Array(16)].map(() => [CX + (rnd() - .5) * 320, CY + (rnd() - .5) * 380]);
    nodes[0] = [CX, CY];
    nodes.forEach((a, i) => nodes.slice(i + 1).forEach(b => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 150) g += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${W}.16)"/>`; }));
    nodes.forEach(([x, y], i) => {
      const r = i === 0 ? 34 : i % 4 === 0 ? 18 : 11, f = i === 0 ? 'url(#acc)' : i % 4 === 0 ? AC.a : '#1E3366';
      g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${W}.4)" stroke-width="1.2"/>`;
      if (r > 11) g += `<circle cx="${x}" cy="${y - r * .22}" r="${r * .28}" fill="#0B1633" opacity=".55"/><path d="M ${x - r * .5} ${y + r * .55} a ${r * .5} ${r * .42} 0 0 1 ${r} 0" fill="#0B1633" opacity=".55"/>`;
    });
  } else { // ecommerce : boîtes isométriques
    const boite = (x, y, s, plein) => {
      const h = s * .58;
      return `<path d="M ${x} ${y - h} L ${x + s} ${y - h + s * .5} L ${x} ${y + s * .5 - h + s * .5} L ${x - s} ${y - h + s * .5} Z" fill="${plein ? 'url(#acc)' : 'url(#verre)'}" stroke="${W}.35)"/>
        <path d="M ${x - s} ${y - h + s * .5} L ${x} ${y + s - h} L ${x} ${y + s} L ${x - s} ${y + s * .5} Z" fill="${plein ? AC.c : '#fff'}" fill-opacity="${plein ? 1 : .05}" stroke="${W}.3)"/>
        <path d="M ${x + s} ${y - h + s * .5} L ${x} ${y + s - h} L ${x} ${y + s} L ${x + s} ${y + s * .5} Z" fill="${plein ? AC.a : '#fff'}" fill-opacity="${plein ? .75 : .1}" stroke="${W}.3)"/>`;
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
h1{margin-top:22px;font-weight:800;color:#0B1633;letter-spacing:-1.6px;line-height:1.06;max-width:575px}
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
</style></head><body>
<svg class="grain" width="1200" height="630"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .09 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="gauche">
  <div class="marque"><div class="logo">TRD</div><div class="nom">TechRepair Content</div><div class="sep"></div><div class="coll">Insights</div></div>
  <div class="kicker"><i></i>${esc(LIBELLES[cat] || cat)}</div>
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
