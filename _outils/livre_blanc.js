// livre_blanc.js — Met en page un livre blanc TechRepair Content en PDF (A4) et
// produit ses visuels pour le site. Mise en page éditoriale « grand cabinet » :
// couverture de collection, page « en bref », sommaire paginé, introduction en
// synthèse, ouvertures de chapitre pleine page, figures numérotées, outils,
// page auteur et quatrième de couverture annonçant le prochain numéro.
//
// Usage : NODE_PATH=$(npm root -g) node _outils/livre_blanc.js _outils/livres-blancs/<slug>.json
//
// Entrées : <slug>.json (métadonnées) et <slug>.html (corps : introduction, chapitres en
// <h2 id="chN">, puis <h2 id="faq">, <h2 id="sources"> et <ol class="sources">).
// Sorties :
//   livres-blancs/<slug>.pdf            le livre blanc téléchargeable
//   livres-blancs/<slug>-cover.jpg      la couverture (portrait, 900 px de large)
//   livres-blancs/<slug>-og.jpg         la vignette de partage (1200 × 630)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
const SITE = 'https://www.techrepaircontent.com';
const COULEURS = { bleu: '#1A56DB', orange: '#F97316', vert: '#10B981', violet: '#7C3AED' };
// Teinte claire de chaque accent, lisible sur fond bleu nuit.
const CLAIRS = { bleu: '#93C5FD', orange: '#FDBA74', vert: '#6EE7B7', violet: '#C4B5FD' };
const CATS = { seo: 'SEO B2B', saas: 'SaaS B2B', ecommerce: 'E-commerce tech', cyber: 'Cybersécurité', fintech: 'Fintech', rh: 'RH tech' };
const SERVICES = {
  'articles-seo': ['/service-articles-seo', 'Articles SEO longue traîne et piliers'],
  'livres-blancs': ['/service-livres-blancs', 'Livres blancs et études de cas B2B'],
  'fiches-produits': ['/service-fiches-produits', 'Fiches produits SEO et conversion'],
  'strategie-ia': ['/service-strategie-ia', 'Stratégie de contenu IA augmentée'],
  'agents-ia': ['/agents-ia', 'Agents IA sur mesure'],
  'visibilite-ia': ['/visibilite-ia', 'Visibilité dans les IA'],
};
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const deux = n => String(n).padStart(2, '0');

const police = w => `@font-face{font-family:MR;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'polices', `manrope-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2')}`;
const POLICES = [400, 500, 600, 700, 800].map(police).join('');

// Titre de couverture : la partie avant les deux-points passe en couleur d'accent.
const titreAccent = (t, cls) => {
  const i = t.indexOf(' : ');
  return i > 0 ? `<span class="${cls}">${esc(t.slice(0, i))}</span> : ${esc(t.slice(i + 3))}` : esc(t);
};

// Motif de collection : matrice de points dont une vague monte vers la droite
// (les signaux qui convergent). Même dessin pour tous les numéros, seule la couleur change.
function motif(accent, clair, l = 124, h = 104) {
  const cols = 18, rows = 15, px = l / cols, py = h / rows;
  let s = '';
  for (let c = 0; c < cols; c++) {
    const t = c / (cols - 1);
    // Courbe de croissance : basse à gauche, haute à droite.
    const crete = (rows - 1) * (0.92 - 0.8 * Math.pow(t, 1.35));
    for (let r = 0; r < rows; r++) {
      const x = px / 2 + c * px, y = py / 2 + r * py, d = r - crete;
      if (d < -0.6) { s += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r=".42" fill="#fff" fill-opacity=".18"/>`; continue; }
      const k = Math.exp(-d / 3.2);                  // intensité qui décroît sous la crête
      const fond = 1 - 0.55 * (r / (rows - 1));      // fondu vers le bas
      const rr = 0.55 + 1.75 * k * fond;
      const col = d < 0.9 ? clair : accent;
      s += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${rr.toFixed(2)}" fill="${col}" fill-opacity="${(0.25 + 0.75 * k * fond).toFixed(2)}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${l} ${h}" width="${l}mm" height="${h}mm" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

// Flux lumineux bleus (repris du visuel de référence de Goradieme) : courbes qui
// traversent la page, avec halo, trait lumineux et cœur presque blanc.
function lumieres(l, h, v = 0, ymin = 0.1, ymax = 0.45) {
  const courbes = [], bande = ymax - ymin;
  for (let i = 0; i < 6; i++) {
    const y0 = h * (ymin + bande * (0.35 + 0.13 * i)) + 4 * Math.sin(v + i);
    const y3 = h * (ymin + bande * (0.05 + 0.12 * i)) + 5 * Math.cos(v * 1.3 + i);
    const c1 = y0 + h * bande * (0.30 - 0.08 * i) * (i % 2 ? 1 : -1);
    const c2 = y3 + h * bande * 0.30 * Math.sin(v + i * 0.7);
    courbes.push(`M -5 ${y0.toFixed(1)} C ${(l * 0.35).toFixed(1)} ${c1.toFixed(1)}, ${(l * 0.6).toFixed(1)} ${c2.toFixed(1)}, ${(l + 5).toFixed(1)} ${y3.toFixed(1)}`);
  }
  const trait = (d, i) => {
    const o = (0.55 + 0.45 * Math.sin(v * 2 + i)).toFixed(2);
    return `<g opacity="${o}"><path d="${d}" stroke="#1D6BFF" stroke-width="2.6" fill="none" filter="url(#fl${v})" opacity=".55"/>
      <path d="${d}" stroke="url(#gl${v})" stroke-width=".7" fill="none"/>
      <path d="${d}" stroke="#D3F2FD" stroke-width=".22" fill="none" opacity=".9"/></g>`;
  };
  return `<svg class="lumieres" viewBox="0 0 ${l} ${h}" width="${l}mm" height="${h}mm" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="fl${v}" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <linearGradient id="gl${v}" x1="0" x2="1"><stop offset="0" stop-color="#63B8FD" stop-opacity="0"/><stop offset=".35" stop-color="#63B8FD"/><stop offset=".8" stop-color="#9DD7FF"/><stop offset="1" stop-color="#63B8FD" stop-opacity=".2"/></linearGradient></defs>
    ${courbes.map(trait).join('')}</svg>`;
}
// Fonds sombres précalculés en JPEG (le flou des flux lumineux alourdirait le PDF).
const FONDS = {};
async function preparerFonds(page) {
  const vues = { couv: [1, 0.06, 0.40], ouv: [3, 0.03, 0.30], dos: [4, 0.50, 0.85], concl: [5, 0.60, 0.86] };
  await page.setViewportSize({ width: 794, height: 1123 });
  for (const [cle, [v, a, b]] of Object.entries(vues)) {
    await page.setContent(`<!doctype html><html><head><style>*{margin:0}body{width:210mm;height:297mm;background:${FOND};overflow:hidden}svg{position:absolute;left:0;top:0;width:100%;height:100%}</style></head><body>${lumieres(210, 297, v, a, b)}</body></html>`);
    const buf = await page.screenshot({ type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: 794, height: 1123 } });
    FONDS[cle] = 'data:image/jpeg;base64,' + buf.toString('base64');
  }
}
const FOND = `radial-gradient(150mm 120mm at 88% 14%,#0E32A2 0%,rgba(14,50,162,0) 70%),radial-gradient(130mm 130mm at 6% 96%,#0A2A8C 0%,rgba(10,42,140,0) 70%),linear-gradient(165deg,#03143C 0%,#02246B 55%,#020845 100%)`;

function contexte(m) {
  const d = new Date(m.date + 'T12:00:00');
  let numero = 1, suivant = null;
  try {
    const cal = JSON.parse(fs.readFileSync(path.join(__dirname, 'calendrier-livres-blancs.json'), 'utf8'));
    const i = cal.findIndex(x => x.slug === m.slug);
    if (i >= 0) {
      numero = i + 1;
      suivant = cal.slice(i + 1).find(x => x.statut !== 'publie') || null;
    }
  } catch (e) { /* calendrier absent : numéro 1, pas d'annonce */ }
  let annonce = null;
  if (suivant) {
    const [an, mo] = suivant.mois.split('-').map(Number);
    annonce = { titre: suivant.titre, probleme: suivant.probleme || '', date: `1er ${MOIS[mo - 1]} ${an}`, categorie: CATS[suivant.categorie] || '' };
  }
  return { edition: `${MOIS[d.getMonth()]} ${d.getFullYear()}`, numero: deux(numero), annonce };
}

function couverture(m, c, A, AC) {
  return `<section class="couv">
    <div class="couv-motif">${motif(A, AC)}</div>
    <div class="couv-haut">
      <div class="marque"><div class="logo">TRD</div><div class="nom">TechRepair<span>Content</span></div></div>
      <div class="couv-num"><span>Livre blanc</span><b>N° ${c.numero}</b></div>
    </div>
    <div class="couv-bloc">
      <div class="couv-cat">${esc(CATS[m.categorie] || m.categorie)}</div>
      <h1>${titreAccent(m.titreCouverture || m.titre, 'ac')}</h1>
      <p>${esc(m.sousTitre)}</p>
    </div>
    <div class="couv-pied"><span><b>Édition ${esc(c.edition)}</b></span><span>Méthode · Outils · Plan d'action</span><span>techrepaircontent.com</span></div>
  </section>`;
}

const CSS = (A, AC) => `${POLICES}
  :root{--a:${A};--ac:${AC};--navy:#0B1633;--navy2:#14244F;--ink:#1F2A44;--muted:#64748B;--rule:#E3E8F0;--tint:#F5F7FB;--soft:color-mix(in srgb,${A} 8%,#fff)}
  *{margin:0;padding:0;box-sizing:border-box;font-family:MR,sans-serif}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{color:var(--ink);font-size:9.8pt;line-height:1.62;font-weight:400;font-variant-numeric:lining-nums}
  @page{size:A4;margin:25mm 22mm 22mm 22mm;
    @top-left{content:"TechRepair Content  |  Livre blanc";font:700 7pt MR;color:#0B1633;letter-spacing:.6pt;text-transform:uppercase;vertical-align:bottom;padding-bottom:5mm}
    @top-right{content:var(--court);font:500 7pt MR;color:#94A3B8;vertical-align:bottom;padding-bottom:5mm}
    @bottom-left{content:"techrepaircontent.com";font:500 7pt MR;color:#94A3B8;vertical-align:top;padding-top:5mm}
    @bottom-right{content:counter(page);font:800 8pt MR;color:#0B1633;vertical-align:top;padding-top:5mm}}
  @page plein{margin:0;@top-left{content:none}@top-right{content:none}@bottom-left{content:none}@bottom-right{content:none}}
  .couv,.ouv,.dos,.bref{page:plein;width:210mm;height:296.6mm;position:relative;overflow:hidden;break-after:page}

  /* Couverture */
  .couv{background:#03143C url(${FONDS.couv}) 0 0/100% 100% no-repeat;color:#fff}
  .lumieres{position:absolute;left:0;top:0;width:100%;height:100%}
  .couv-motif{position:absolute;right:14mm;top:44mm}
  .couv-haut{position:absolute;left:22mm;right:22mm;top:20mm;display:flex;justify-content:space-between;align-items:center}
  .marque{display:flex;align-items:center;gap:3.5mm}
  .logo{width:11mm;height:11mm;border-radius:2.4mm;background:#1A56DB;color:#fff;display:grid;place-items:center;font-weight:800;font-size:3.9mm;letter-spacing:-.15mm}
  .nom{font-weight:800;font-size:4.3mm;line-height:1.12;color:#fff}.nom span{display:block;font-weight:500;color:#94A3B8;font-size:3.4mm}
  .couv-num{text-align:right;line-height:1.15}.couv-num span{display:block;font-size:2.8mm;letter-spacing:.7mm;text-transform:uppercase;color:#94A3B8;font-weight:600}
  .couv-num b{font-size:7mm;font-weight:800;color:var(--ac)}
  .couv-bloc{position:absolute;left:22mm;width:150mm;bottom:52mm}
  .couv-cat{display:inline-block;font-size:2.9mm;font-weight:800;letter-spacing:.8mm;text-transform:uppercase;color:var(--navy);background:var(--ac);border-radius:1mm;padding:1.4mm 3mm;margin-bottom:8mm}
  .couv h1{font-size:15mm;line-height:1.04;font-weight:800;letter-spacing:-.45mm;margin-bottom:8mm;text-wrap:balance}
  .couv h1 .ac{color:var(--ac)}
  .couv-bloc p{font-size:4.3mm;line-height:1.5;color:#C7D2E5;max-width:132mm}
  .couv-pied{position:absolute;left:22mm;right:22mm;bottom:20mm;display:flex;justify-content:space-between;font-size:3mm;color:#94A3B8;border-top:.25mm solid rgba(255,255,255,.18);padding-top:4.5mm}
  .couv-pied b{color:#fff;font-weight:700}

  /* Page « en bref » */
  .bref{padding:30mm 22mm 22mm;background:#fff}
  .bref .eyebrow{margin-bottom:5mm}
  .bref h2{font-size:23pt;line-height:1.12;color:var(--navy);font-weight:800;letter-spacing:-.3pt;max-width:150mm;margin-bottom:7mm;text-wrap:balance}
  .bref .resume{font-size:12.5pt;line-height:1.55;color:#334155;max-width:150mm;margin-bottom:12mm}
  .bref-grille{display:grid;grid-template-columns:1.35fr 1fr;gap:10mm;border-top:1.5pt solid var(--navy);padding-top:7mm}
  .bref h3{font-size:7.5pt;font-weight:800;letter-spacing:1.4pt;text-transform:uppercase;color:var(--navy);margin-bottom:4mm}
  .bref ol{list-style:none;counter-reset:b}
  .bref ol li{counter-increment:b;display:grid;grid-template-columns:9mm 1fr;padding:2.4mm 0;border-bottom:.5pt solid var(--rule);font-size:9.6pt;line-height:1.45}
  .bref ol li::before{content:counter(b,decimal-leading-zero);font-weight:800;color:var(--a);font-size:9pt}
  .bref ul{list-style:none}
  .bref ul li{padding:2.4mm 0 2.4mm 5mm;border-bottom:.5pt solid var(--rule);font-size:9.6pt;line-height:1.45;position:relative}
  .bref ul li::before{content:"";position:absolute;left:0;top:4.4mm;width:2mm;height:2mm;background:var(--a);border-radius:.4mm}
  .bref-pied{position:absolute;left:22mm;right:22mm;bottom:20mm;display:grid;grid-template-columns:1fr 1fr;gap:10mm;font-size:7.6pt;color:var(--muted);line-height:1.5;border-top:.5pt solid var(--rule);padding-top:4mm}
  .bref-pied b{color:var(--navy)}

  .eyebrow{font-size:7.5pt;font-weight:800;letter-spacing:1.6pt;text-transform:uppercase;color:var(--a)}

  /* Sommaire */
  .sommaire{break-after:page;padding-top:4mm}
  .sommaire h2{font-size:30pt;font-weight:800;color:var(--navy);letter-spacing:-.5pt;margin:3mm 0 10mm}
  .sommaire ol{list-style:none;border-top:1.5pt solid var(--navy)}
  .sommaire li{display:grid;grid-template-columns:16mm 1fr 14mm;align-items:baseline;padding:3.6mm 0;border-bottom:.5pt solid var(--rule)}
  .sommaire li .n{font-size:15pt;font-weight:800;color:var(--a);letter-spacing:-.3pt}
  .sommaire li .t{font-size:11pt;font-weight:700;color:var(--navy);line-height:1.35;padding-right:6mm}
  .sommaire li .p{text-align:right;font-size:10pt;font-weight:700;color:var(--navy)}
  .sommaire li.annexe .n{color:#94A3B8;font-size:10pt}
  .sommaire li.annexe .t{font-weight:600;color:#475569;font-size:10pt}

  /* Introduction (synthèse) */
  .intro{break-after:page}
  .intro h2{font-size:24pt;font-weight:800;color:var(--navy);letter-spacing:-.3pt;margin:3mm 0 7mm}
  .intro .intro-lead{font-size:13pt;line-height:1.55;color:var(--navy);font-weight:500;margin-bottom:5mm;max-width:none}
  .intro .key-points{margin-top:8mm;border:none;padding:0}
  .intro .key-points h3{font-size:7.5pt;font-weight:800;letter-spacing:1.4pt;text-transform:uppercase;color:var(--navy);border-bottom:1.5pt solid var(--navy);padding-bottom:2.5mm;margin:0 0 5mm}
  .intro .key-points h3{background:none;padding-top:0}
  .intro .key-points ul{list-style:none;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:6mm 8mm;counter-reset:k}
  .intro .key-points li{counter-increment:k;margin:0;font-size:9.2pt;line-height:1.5;color:#334155;padding-top:9mm;position:relative;border-top:.5pt solid var(--rule)}
  .intro .key-points li::before{content:counter(k,decimal-leading-zero);position:absolute;top:2mm;left:0;font-size:12pt;font-weight:800;color:var(--a)}
  .intro .key-points li strong{display:block;font-size:10.5pt;color:var(--navy);margin-bottom:1mm;line-height:1.35}

  /* Ouvertures de chapitre */
  .ouv{background:#03143C url(${FONDS.ouv}) 0 0/100% 100% no-repeat;color:#fff}
  .ouv .gros{position:absolute;right:16mm;top:16mm;font-size:120mm;line-height:.8;font-weight:800;letter-spacing:-6mm;color:transparent;-webkit-text-stroke:.5mm rgba(99,184,253,.6)}
  .ouv .cont{position:absolute;left:26mm;right:26mm;top:118mm}
  .ouv .eyebrow{margin-bottom:5mm}
  .ouv h2{font-size:28pt;line-height:1.1;font-weight:800;color:var(--navy);letter-spacing:-.5pt;max-width:150mm;text-wrap:balance}
  .ouv .filet{width:22mm;height:1.6mm;background:var(--a);margin:9mm 0 9mm}
  .ouv .dans{font-size:7.5pt;font-weight:800;letter-spacing:1.4pt;text-transform:uppercase;color:#fff;margin-bottom:3mm}
  .ouv .eyebrow{color:var(--ac)}
  .ouv h2{color:#fff!important}
  .ouv .filet{background:var(--ac)!important}
  .ouv ul{border-top-color:rgba(255,255,255,.18)!important}
  .ouv ul li{color:#D6E2F5!important;border-bottom-color:rgba(255,255,255,.18)!important}
  .ouv ul li::before{color:var(--ac)!important}
  .ouv ul{list-style:none;max-width:140mm;border-top:.5pt solid #CBD5E1}
  .ouv ul li{padding:2.6mm 0 2.6mm 7mm;border-bottom:.5pt solid #CBD5E1;font-size:10pt;font-weight:600;color:#334155;position:relative}
  .ouv ul li::before{content:"→";position:absolute;left:0;color:var(--a);font-weight:800}
  .ouv .folio{position:absolute;left:26mm;bottom:18mm;font-size:7pt;font-weight:700;letter-spacing:.6pt;text-transform:uppercase;color:#94A3B8}

  /* Corps */
  .corps p,.corps>ul,.corps>ol{max-width:134mm}
  p{margin-bottom:3.4mm;orphans:3;widows:3}
  strong{color:var(--navy);font-weight:700}
  a{color:${A === COULEURS.orange ? '#C2410C' : '#1A47B8'};text-decoration:none;font-weight:600}
  .corps h3{font-size:13pt;line-height:1.3;color:var(--navy);margin:8mm 0 3mm;padding-top:4.2mm;font-weight:800;break-after:avoid;break-inside:avoid;letter-spacing:-.1pt;max-width:150mm;background:linear-gradient(var(--a),var(--a)) no-repeat 0 0/8mm 1.1mm}
  .corps h4{font-size:10.4pt;color:var(--navy);margin:5mm 0 1.5mm;font-weight:800;break-after:avoid}
  .corps ul,.corps ol{margin:0 0 4mm 5mm}.corps li{margin-bottom:1.8mm;padding-left:1mm}
  .corps ul li::marker{color:var(--a)}.corps ol li::marker{color:var(--a);font-weight:800}
  .debut-chapitre>p:first-child{font-size:11.6pt;line-height:1.55;color:var(--navy);font-weight:500}

  .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm;margin:6mm 0 8mm;break-inside:avoid;border-top:1.5pt solid var(--navy);padding-top:5mm}
  .stat b{display:block;font-size:26pt;font-weight:800;color:var(--a);line-height:1;letter-spacing:-.6pt;margin-bottom:2.5mm}
  .stat span{display:block;font-size:8pt;color:#475569;line-height:1.45}

  .callout{background:var(--soft);padding:6mm 7mm;margin:6mm 0 7mm;break-inside:avoid;font-size:10pt;line-height:1.6;color:var(--navy);border-radius:1.5mm}
  .callout strong:first-child{display:block;font-size:7.5pt;font-weight:800;letter-spacing:1.4pt;text-transform:uppercase;color:var(--a);margin-bottom:2mm}

  figure.exhibit{margin:7mm 0 8mm;break-inside:avoid}
  .exhibit-tete{border-top:1.5pt solid var(--navy);padding-top:2.6mm;margin-bottom:3.5mm;display:flex;gap:3mm;align-items:baseline}
  .exhibit-tete .lab{font-size:7.5pt;font-weight:800;letter-spacing:1.3pt;text-transform:uppercase;color:var(--a);white-space:nowrap}
  .exhibit-tete .tit{font-size:10pt;font-weight:800;color:var(--navy)}
  table{width:100%!important;border-collapse:collapse;font-size:8.5pt;line-height:1.45}
  th{font-size:7pt;font-weight:800;letter-spacing:.7pt;text-transform:uppercase;color:#475569;text-align:left;padding:0 3mm 2.2mm 0;border-bottom:1pt solid var(--navy);vertical-align:bottom}
  td{padding:2.6mm 3mm 2.6mm 0;border-bottom:.5pt solid var(--rule);vertical-align:top;color:#334155}
  td:first-child{font-weight:700;color:var(--navy)}
  tr{break-inside:avoid}

  .outil{margin:8mm 0;border:.6pt solid #CBD5E1;border-radius:2mm;overflow:hidden;break-inside:avoid}
  .outil>h3,.outil>h4{margin:0!important;background:linear-gradient(100deg,#03143C,#0E32A2);color:#fff;padding:4mm 6mm;font-size:11pt;font-weight:800;display:flex;align-items:center;gap:3mm;max-width:none}
  .outil>h3::before,.outil>h4::before{content:attr(data-lab);display:inline-block;width:auto;height:auto;background:var(--ac);color:var(--navy);font-size:6.8pt;letter-spacing:1pt;padding:1mm 2mm;border-radius:.8mm;margin:0}
  .outil>*:not(h3):not(h4){margin-left:6mm;margin-right:6mm;max-width:none}
  .outil>*:nth-child(2){margin-top:5mm}.outil>*:last-child{margin-bottom:5mm}
  .outil>table{width:calc(100% - 12mm)!important}
  ul.checklist{list-style:none;margin-left:0!important;columns:1}
  ul.checklist li{padding:2mm 0 2mm 8mm;position:relative;border-bottom:.5pt solid var(--rule);margin:0}
  ul.checklist li::before{content:"";position:absolute;left:0;top:2.8mm;width:3.6mm;height:3.6mm;border:1pt solid var(--a);border-radius:.8mm}

  .faq-item{break-inside:avoid;border-top:.5pt solid var(--rule);padding-top:4mm;margin-bottom:4mm}
  .faq-item h3{font-size:10.8pt!important;margin:0 0 2mm!important}
  .faq-item h3{background:none!important;padding-top:0!important}

  /* Conclusion : page pleine, même fond que la couverture et les ouvertures de chapitre */
  .conclu-page{page:plein;width:210mm;height:296.6mm;position:relative;overflow:hidden;break-before:page;break-after:page;background:#03143C url(${FONDS.concl}) 0 0/100% 100% no-repeat;color:#C7D2E5}
  .conclusion-box{position:absolute;left:26mm;right:26mm;top:52mm;font-size:12pt;line-height:1.7;color:#C7D2E5}
  .conclusion-box::before{content:"Conclusion";display:block;font-size:7.5pt;font-weight:800;letter-spacing:1.6pt;text-transform:uppercase;color:var(--ac);margin-bottom:6mm}
  .conclusion-box h3{color:#fff!important;font-size:28pt!important;line-height:1.1!important;letter-spacing:-.5pt;margin:0 0 9mm!important;padding:0 0 9mm!important;max-width:150mm!important;background:linear-gradient(var(--ac),var(--ac)) no-repeat 0 100%/22mm 1.6mm!important;text-wrap:balance}
  .conclusion-box p{max-width:150mm!important;margin-bottom:5mm}
  .conclu-page .folio{position:absolute;left:26mm;bottom:18mm;font-size:7pt;font-weight:700;letter-spacing:.6pt;text-transform:uppercase;color:#94A3B8}
  .conclusion-box strong{color:#fff}.conclusion-box a{color:var(--ac)}

  .section-annexe{break-before:page}
  .section-annexe>h2{font-size:22pt;font-weight:800;color:var(--navy);letter-spacing:-.3pt;margin:3mm 0 7mm;padding-bottom:4mm;border-bottom:1.5pt solid var(--navy)}
  ol.sources{columns:2;column-gap:9mm;font-size:7.6pt;line-height:1.5;color:#475569;margin-left:4.5mm!important;max-width:none!important}
  ol.sources li{margin-bottom:2.4mm;break-inside:avoid}
  ol.sources a{font-weight:600}

  /* Auteur et appel à l'action */
  .auteur{break-before:page}
  .auteur h2{font-size:22pt;font-weight:800;color:var(--navy);letter-spacing:-.3pt;margin:3mm 0 6mm}
  .auteur>p{font-size:10.6pt;line-height:1.65;max-width:150mm}
  .services{display:grid;grid-template-columns:1fr 1fr;gap:0 9mm;margin:7mm 0 0;border-top:1.5pt solid var(--navy)}
  .services a{display:block;padding:3mm 0;border-bottom:.5pt solid var(--rule);color:var(--navy);font-weight:700;font-size:9.4pt}
  .services a::before{content:"→  ";color:var(--a)}
  .cta-final{background:#03143C url(${FONDS.concl}) center 85%/cover no-repeat;color:#C7D2E5;border-radius:2mm;padding:10mm;margin-top:12mm;position:relative;overflow:hidden}
  .cta-final h3{color:#fff;font-size:17pt;font-weight:800;margin:0 0 3mm;position:relative}
  .cta-final p{position:relative;max-width:130mm}
  .btn{display:inline-block;background:var(--a);color:#fff!important;font-weight:800;border-radius:1.5mm;padding:3.2mm 6mm;margin:5mm 3mm 0 0;font-size:9.4pt;position:relative}
  .btn.sec{background:transparent;border:.8pt solid rgba(255,255,255,.45)}

  /* Quatrième de couverture */
  .dos{background:#03143C url(${FONDS.dos}) 0 0/100% 100% no-repeat;color:#fff}
  .dos .motif{position:absolute;right:16mm;top:132mm;opacity:.6}
  .dos .bloc{position:absolute;left:22mm;right:22mm;top:30mm}
  .dos .prochain{font-size:7.5pt;font-weight:800;letter-spacing:1.6pt;text-transform:uppercase;color:var(--ac);margin-bottom:5mm}
  .dos .date{font-size:11pt;font-weight:600;color:#94A3B8;margin-bottom:4mm}
  .dos h2{font-size:24pt;line-height:1.12;font-weight:800;letter-spacing:-.3pt;max-width:150mm;margin-bottom:6mm;text-wrap:balance}
  .dos .teaser{font-size:11pt;line-height:1.55;color:#C7D2E5;max-width:140mm;margin-bottom:8mm}
  .dos .inscr{display:inline-block;border:.8pt solid rgba(255,255,255,.4);border-radius:1.5mm;padding:3mm 5mm;font-size:9.4pt;font-weight:700;color:#fff}
  .dos .bas{position:absolute;left:22mm;right:22mm;bottom:20mm;display:flex;justify-content:space-between;align-items:flex-end;border-top:.25mm solid rgba(255,255,255,.18);padding-top:5mm;font-size:8pt;color:#94A3B8;line-height:1.6}
  .dos .bas b{color:#fff}
`;

function document_(m, corps, c, A, AC, pages) {
  const [lienService, nomService] = SERVICES[m.service] || SERVICES['articles-seo'];
  const court = (m.titreCourt || m.titre).slice(0, 80).replace(/"/g, "'");
  // Découpage du corps : introduction, chapitres, FAQ, sources.
  const morceaux = corps.split(/(?=<h2 id=")/);
  const intro = morceaux[0].startsWith('<h2') ? '' : morceaux.shift();
  const chapitres = [], annexes = [];
  for (const mc of morceaux) {
    const mm = mc.match(/^<h2 id="([^"]+)">([\s\S]*?)<\/h2>([\s\S]*)$/);
    if (!mm) continue;
    (/^ch\d+$/.test(mm[1]) ? chapitres : annexes).push({ id: mm[1], titre: mm[2], html: mm[3] });
  }
  const p = id => (pages && pages[id] ? pages[id] : '');
  const lignes = [
    `<li class="annexe"><span class="n">—</span><span class="t">Introduction : l'essentiel</span><span class="p">${p('intro')}</span></li>`,
    ...chapitres.map((ch, i) => `<li><span class="n">${deux(i + 1)}</span><span class="t">${ch.titre.replace(/<[^>]+>/g, '')}</span><span class="p">${p(ch.id)}</span></li>`),
    ...annexes.map(a => `<li class="annexe"><span class="n">—</span><span class="t">${a.titre.replace(/<[^>]+>/g, '')}</span><span class="p">${p(a.id)}</span></li>`),
    `<li class="annexe"><span class="n">—</span><span class="t">À propos de TechRepair Content</span><span class="p">${p('auteur')}</span></li>`,
  ].join('');
  const ouvertures = chapitres.map((ch, i) => {
    const h3 = [...ch.html.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(x => x[1].replace(/<[^>]+>/g, ''))
      .filter(t => !/^(Points clés)$/i.test(t)).slice(0, 5);
    return `<section class="ouv" data-marque="ouv-${ch.id}">
      <div class="gros">${deux(i + 1)}</div>
      <div class="cont"><div class="eyebrow">Chapitre ${deux(i + 1)}</div><h2>${ch.titre}</h2><div class="filet"></div>
      ${h3.length ? `<div class="dans">Dans ce chapitre</div><ul>${h3.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}</div>
      <div class="folio">TechRepair Content · Livre blanc N° ${c.numero}</div>
    </section>
    <section class="corps debut-chapitre" data-marque="${ch.id}">${ch.html}</section>`;
  }).join('');
  const liste = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(m.titre)}</title><style>${CSS(A, AC)}
    @page{@top-right{content:"${esc(court)}"}}</style></head><body>
  ${couverture(m, c, A, AC)}
  <section class="bref">
    <div class="eyebrow">Ce livre blanc en bref</div>
    <h2>${esc(m.titre)}</h2>
    <p class="resume">${esc(m.resume)}</p>
    <div class="bref-grille">
      <div><h3>Ce que vous saurez faire</h3><ol>${liste(m.apprendre)}</ol></div>
      <div><h3>Pour qui</h3><ul>${liste(m.pourQui)}</ul></div>
    </div>
    <div class="bref-pied">
      <div><b>Méthode.</b> Chaque chiffre a été vérifié sur sa source primaire ; la liste complète des sources figure en fin de document. Les exemples rédigés pour l'occasion sont signalés comme tels.</div>
      <div><b>TechRepair Content</b>, livre blanc N° ${c.numero}, édition ${esc(c.edition)}. © ${m.date.slice(0, 4)} TechRepair Content. Citation libre avec mention de la source et lien vers techrepaircontent.com.</div>
    </div>
  </section>
  <section class="sommaire"><div class="eyebrow">Livre blanc N° ${c.numero}</div><h2>Sommaire</h2><ol>${lignes}</ol></section>
  <section class="intro corps" data-marque="intro"><div class="eyebrow">Introduction</div><h2>L'essentiel</h2>${intro}</section>
  ${ouvertures}
  ${annexes.map(a => `<section class="section-annexe corps" data-marque="${a.id}"><div class="eyebrow">Annexe</div><h2>${a.titre}</h2>${a.html}</section>`).join('')}
  <section class="auteur corps" data-marque="auteur">
    <div class="eyebrow">L'auteur</div>
    <h2>TechRepair Content</h2>
    <p>TechRepair Content conçoit et rédige les contenus qui font venir des clients aux entreprises SaaS B2B, fintech, cybersécurité, e-commerce tech et RH tech : articles SEO, livres blancs, études de cas, fiches produits, stratégie de contenu augmentée par l'IA et agents IA sur mesure. Chaque contenu part des questions réelles de vos acheteurs et s'appuie sur des sources vérifiées.</p>
    <div class="services">${Object.values(SERVICES).map(([l, nm]) => `<a href="${SITE}${l}">${esc(nm)}</a>`).join('')}</div>
    <div class="cta-final">
      <h3>${esc(m.ctaTitre || 'Passer de la méthode aux résultats')}</h3>
      <p>${esc(m.ctaTexte || "Vous préférez qu'un expert applique cette méthode à votre entreprise ? Décrivez votre situation : vous recevez un diagnostic et une proposition chiffrée sous 24 h, sans engagement.")}</p>
      <a class="btn" href="${SITE}/devis">Demander un diagnostic gratuit</a><a class="btn sec" href="${SITE}${lienService}">${esc(nomService)}</a>
    </div>
  </section>
  <section class="dos">
    <div class="motif">${motif(A, AC, 110, 92)}</div>
    <div class="bloc">${c.annonce ? `
      <div class="prochain">Prochain livre blanc</div>
      <div class="date">À paraître le ${esc(c.annonce.date)}${c.annonce.categorie ? ' · ' + esc(c.annonce.categorie) : ''}</div>
      <h2>${esc(c.annonce.titre)}</h2>
      ${c.annonce.probleme ? `<p class="teaser">${esc(c.annonce.probleme)} Le prochain numéro donne la méthode, les chiffres et les outils pour y remédier.</p>` : ''}
      <a class="inscr" href="${SITE}/blog">Le recevoir dès sa parution : newsletter sur techrepaircontent.com</a>` : `
      <div class="prochain">Livres blancs TechRepair Content</div>
      <h2>Un nouveau livre blanc chaque mois</h2>
      <p class="teaser">Méthodes, chiffres vérifiés et outils prêts à l'emploi pour le marketing B2B tech.</p>
      <a class="inscr" href="${SITE}/livres-blancs/">Tous les livres blancs sur techrepaircontent.com</a>`}
    </div>
    <div class="bas">
      <div class="marque"><div class="logo">TRD</div><div class="nom">TechRepair<span>Content</span></div></div>
      <div style="text-align:right"><b>contact@techrepaircontent.com</b><br>www.techrepaircontent.com</div>
    </div>
  </section>
  </body></html>`;
}

// Retouches du corps dans le navigateur : figures numérotées, outils, liens absolus.
function retoucher(site) {
  let f = 0, o = 0;
  document.querySelectorAll('.conclusion-box').forEach(box => {
    const sec = box.closest('section');
    const page = document.createElement('section');
    page.className = 'conclu-page';
    sec.parentNode.insertBefore(page, sec.nextSibling);
    page.appendChild(box);
    const folio = document.querySelector('.ouv .folio');
    if (folio) page.appendChild(folio.cloneNode(true));
  });
  document.querySelectorAll('a[href^="/"]').forEach(a => { a.href = site + a.getAttribute('href'); });
  document.querySelectorAll('.key-points li>strong:first-child').forEach(st => { st.textContent = st.textContent.replace(/\s*:\s*$/, ''); });
  document.querySelectorAll('.outil').forEach(el => {
    const h = el.querySelector(':scope>h3,:scope>h4');
    if (h) h.setAttribute('data-lab', `OUTIL ${++o}`);
  });
  document.querySelectorAll('.corps table').forEach(t => {
    if (t.closest('.outil')) return;
    let prec = t.previousElementSibling, titre = '', ecart = 0;
    while (prec && !/^H[34]$/.test(prec.tagName)) { prec = prec.previousElementSibling; ecart++; }
    if (prec && ecart > 1) titre = prec.textContent.trim();
    const fig = document.createElement('figure');
    fig.className = 'exhibit';
    fig.innerHTML = `<div class="exhibit-tete"><span class="lab">Figure ${++f}</span><span class="tit"></span></div>`;
    fig.querySelector('.tit').textContent = titre;
    t.parentNode.insertBefore(fig, t);
    fig.appendChild(t);
  });
}

(async () => {
  const meta = process.argv[2];
  if (!meta) { console.error('Usage : node _outils/livre_blanc.js _outils/livres-blancs/<slug>.json'); process.exit(1); }
  const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
  const corps = fs.readFileSync(meta.replace(/\.json$/, '.html'), 'utf8');
  // Codes couleur de TechRepair Content pour tous les numéros (choix de Goradieme, 01/11/2026) :
  // bleu du site sur fond clair, bleu lumineux sur fond sombre.
  const A = '#1A56DB';
  const AC = '#63B8FD';
  const c = contexte(m);
  const sortie = path.join(RACINE, 'livres-blancs');
  fs.mkdirSync(sortie, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-'));

  const b = await chromium.launch();
  const ctx = await b.newContext({ deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route('**/*', r => r.request().url().startsWith('data:') || r.request().url().startsWith('about:') ? r.continue() : r.abort());
  await preparerFonds(p);

  const rendre = async (pages, fichier) => {
    await p.setContent(document_(m, corps, c, A, AC, pages), { waitUntil: 'load' });
    await p.evaluate(retoucher, SITE);
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: fichier, preferCSSPageSize: true, printBackground: true });
  };

  // 1er passage : repérer la page de chaque section pour paginer le sommaire.
  const brouillon = path.join(tmp, 'b.pdf');
  await rendre(null, brouillon);
  const texte = spawnSync('pdftotext', ['-layout', brouillon, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 }).stdout.split('\f');
  const pages = {};
  const chercher = (cle, motif, apres = 3) => {
    for (let i = apres; i < texte.length; i++) if (motif.test(texte[i].replace(/\s+/g, ''))) { pages[cle] = i + 1; return i; }
    return apres;
  };
  chercher('intro', /L.ESSENTIEL/i);
  const ids = [...corps.matchAll(/<h2 id="(ch\d+|[a-z]+)">/g)].map(x => x[1]);
  let n = 0;
  for (const id of ids) {
    if (/^ch\d+$/.test(id)) chercher(id, new RegExp(`CHAPITRE${deux(++n)}`, 'i'));
    else {
      const t = (corps.match(new RegExp(`<h2 id="${id}">([\\s\\S]*?)</h2>`)) || [])[1] || id;
      const debut = t.replace(/<[^>]+>/g, '').trim().split(/\s+/).slice(0, 2).join('');
      chercher(id, new RegExp('ANNEXE' + debut, 'i'), Math.max(3, ...Object.values(pages)) - 1);
    }
  }
  chercher('auteur', /L.AUTEUR/i, Math.max(...Object.values(pages)));

  // 2e passage avec le sommaire paginé.
  const pdf = path.join(sortie, `${m.slug}.pdf`);
  await rendre(pages, path.join(tmp, 'i.pdf'));

  // Couverture seule (image du site) et vignette de partage.
  await p.setViewportSize({ width: 794, height: 1123 });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS(A, AC)} body{margin:0}</style></head><body>${couverture(m, c, A, AC)}</body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(tmp, 'c.png'), clip: { x: 0, y: 0, width: 794, height: 1123 } });
  const img = 'data:image/png;base64,' + fs.readFileSync(path.join(tmp, 'c.png')).toString('base64');
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${POLICES}
    *{margin:0;padding:0;box-sizing:border-box;font-family:MR,sans-serif}body{width:1200px;height:630px;background:#F5F7FB;display:flex;align-items:center;gap:64px;padding:0 76px;overflow:hidden;position:relative}
    body::before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:${A}}
    .t{flex:1}.s{font-size:15px;font-weight:800;letter-spacing:3px;color:${A};text-transform:uppercase;margin-bottom:18px}
    h1{font-size:44px;line-height:1.1;color:#0B1633;font-weight:800;margin-bottom:24px;letter-spacing:-.5px}.g{display:inline-block;background:#0B1633;color:#fff;font-weight:800;font-size:18px;padding:13px 24px;border-radius:8px}
    img{height:540px;border-radius:4px;box-shadow:0 30px 60px rgba(11,22,51,.35);transform:rotate(3deg)}</style></head>
    <body><div class="t"><div class="s">Livre blanc gratuit · N° ${c.numero}</div><h1>${esc(m.titreCouverture || m.titre)}</h1><span class="g">Télécharger le PDF</span></div><img src="${img}"></body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(tmp, 'og.png') });
  await b.close();

  const q = spawnSync('qpdf', [path.join(tmp, 'i.pdf'), '--object-streams=generate', '--compress-streams=y', pdf]);
  if (q.status !== 0 && q.status !== 3) { console.error(String(q.stderr)); process.exit(1); }
  const py = `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB')\nw=int(sys.argv[3])\nif im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)\nim.save(sys.argv[2],'JPEG',quality=86,optimize=True,progressive=True)`;
  for (const [src, dst, w] of [['c.png', `${m.slug}-cover.jpg`, 900], ['og.png', `${m.slug}-og.jpg`, 1200]]) {
    const r = spawnSync('python3', ['-c', py, path.join(tmp, src), path.join(sortie, dst), String(w)], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  }
  const nb = spawnSync('qpdf', ['--show-npages', pdf], { encoding: 'utf8' }).stdout.trim();
  console.log(`OK : livres-blancs/${m.slug}.pdf (${nb} pages, ${Math.round(fs.statSync(pdf).size / 1024)} Ko), sommaire paginé ${JSON.stringify(pages)}, couverture et vignette générées`);
})();
