// livre_blanc.js — Met en page un livre blanc TechRepair Content en PDF (A4) et
// produit ses visuels pour le site.
//
// Usage : NODE_PATH=$(npm root -g) node _outils/livre_blanc.js _outils/livres-blancs/<slug>.json
//
// Entrées : <slug>.json (métadonnées) et <slug>.html (corps : chapitres en <h2 id="chN">,
// puis <h2 id="sources"> et <ol class="sources">).
// Sorties :
//   livres-blancs/<slug>.pdf            le livre blanc téléchargeable
//   livres-blancs/<slug>-cover.jpg      la couverture (portrait, 900 px de large)
//   livres-blancs/<slug>-og.jpg         la vignette de partage (1200 × 630)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
const COULEURS = { bleu: '#1A56DB', orange: '#F97316', vert: '#10B981', violet: '#7C3AED' };
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

const police = w => `@font-face{font-family:MR;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'polices', `manrope-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2')}`;
const POLICES = [400, 600, 800].map(police).join('') + '*{font-family:MR,sans-serif}';

function couverture(m, accent) {
  const d = new Date(m.date + 'T12:00:00');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${POLICES}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:210mm;height:297mm}
  body{background:#0B1633;color:#fff;position:relative;overflow:hidden}
  .grille{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:14mm 14mm}
  .halo{position:absolute;width:150mm;height:150mm;border-radius:50%;right:-55mm;top:40mm;background:radial-gradient(circle,${accent}55,transparent 70%)}
  .bande{position:absolute;left:0;top:0;bottom:0;width:7mm;background:${accent}}
  .marque{position:absolute;left:24mm;top:22mm;display:flex;align-items:center;gap:4mm}
  .logo{width:12mm;height:12mm;border-radius:2.5mm;background:#1A56DB;display:grid;place-items:center;font-weight:800;font-size:4.2mm;letter-spacing:-.2mm}
  .nom{font-weight:800;font-size:4.6mm;line-height:1.15}.nom span{display:block;font-weight:400;color:#94A3B8;font-size:3.6mm}
  .formes{position:absolute;right:20mm;top:58mm;width:70mm;height:84mm}
  .feuille{position:absolute;width:52mm;height:68mm;border-radius:3mm;background:#fff;box-shadow:0 6mm 14mm rgba(0,0,0,.35)}
  .f1{right:0;top:0;transform:rotate(6deg);opacity:.18}.f2{right:6mm;top:5mm;transform:rotate(-3deg);opacity:.35}
  .f3{right:12mm;top:10mm;padding:7mm 6mm}
  .f3 i{display:block;height:2mm;border-radius:1mm;background:#CBD5E1;margin-bottom:3mm}
  .f3 i.t{background:#0B1633;width:70%;height:3mm;margin-bottom:5mm}.f3 i.a{background:${accent};width:85%}
  .f3 i.c{width:55%}
  .bloc{position:absolute;left:24mm;right:24mm;bottom:58mm}
  .sur{display:inline-block;font-size:3.4mm;font-weight:800;letter-spacing:.9mm;text-transform:uppercase;color:${accent};border:.35mm solid ${accent};border-radius:10mm;padding:1.6mm 4mm;margin-bottom:9mm}
  h1{font-size:12.5mm;line-height:1.08;font-weight:800;letter-spacing:-.3mm;margin-bottom:7mm}
  .sous{font-size:5mm;line-height:1.45;color:#CBD5E1;max-width:150mm}
  .pied{position:absolute;left:24mm;right:24mm;bottom:20mm;display:flex;justify-content:space-between;font-size:3.5mm;color:#94A3B8;border-top:.3mm solid rgba(255,255,255,.15);padding-top:5mm}
  .pied b{color:#fff;font-weight:600}
  </style></head><body>
  <div class="grille"></div><div class="halo"></div><div class="bande"></div>
  <div class="marque"><div class="logo">TRD</div><div class="nom">TechRepair<span>Content</span></div></div>
  <div class="formes"><div class="feuille f1"></div><div class="feuille f2"></div><div class="feuille f3"><i class="t"></i><i></i><i class="a"></i><i></i><i class="c"></i><i class="a"></i><i></i><i class="c"></i></div></div>
  <div class="bloc"><div class="sur">Livre blanc · ${esc(CATS[m.categorie] || m.categorie)}</div>
  <h1>${esc(m.titreCouverture || m.titre)}</h1><p class="sous">${esc(m.sousTitre)}</p></div>
  <div class="pied"><span><b>Édition ${MOIS[d.getMonth()]} ${d.getFullYear()}</b> · Par Goradieme</span><span>techrepaircontent.com</span></div>
  </body></html>`;
}

function interieur(m, corps, accent) {
  const h2s = [...corps.matchAll(/<h2 id="(ch\d+)">([\s\S]*?)<\/h2>/g)].map(x => [x[1], x[2].replace(/<[^>]+>/g, '')]);
  let n = 0;
  corps = corps.replace(/<h2 id="(ch\d+)">([\s\S]*?)<\/h2>/g, (_, id, t) =>
    `<section class="chapitre-tete" id="${id}"><div class="num">Chapitre ${String(++n).padStart(2, '0')}</div><h2>${t}</h2></section>`);
  corps = corps.replace(/<h2 id="sources">([\s\S]*?)<\/h2>/, '<h2 class="annexe" id="sources">$1</h2>');
  const [lienService, nomService] = SERVICES[m.service] || SERVICES['articles-seo'];
  const liste = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${POLICES}
  *{margin:0;padding:0;box-sizing:border-box}
  body{color:#1E293B;font-size:10.6pt;line-height:1.62}
  :root{--a:${accent};--navy:#0B1633;--muted:#64748B;--border:#E2E8F0}
  .ouverture h2{font-size:20pt;color:var(--navy);margin:0 0 4mm;font-weight:800}
  .eyebrow{font-size:8pt;font-weight:800;letter-spacing:1.6pt;text-transform:uppercase;color:var(--a);margin-bottom:3mm}
  .resume{font-size:12pt;color:#334155;line-height:1.6;margin-bottom:9mm}
  .deux{display:grid;grid-template-columns:1fr 1fr;gap:7mm;margin-bottom:9mm}
  .carte{border:1px solid var(--border);border-top:2.4pt solid var(--a);border-radius:0 0 3mm 3mm;padding:5mm 6mm}
  .carte h3{font-size:9pt;letter-spacing:1pt;text-transform:uppercase;color:var(--navy);margin-bottom:3mm}
  .carte ul{margin-left:4.5mm}.carte li{margin-bottom:2mm;font-size:10pt}
  .sommaire{border-top:1px solid var(--border);padding-top:6mm}
  .sommaire ol{list-style:none;counter-reset:c}
  .sommaire li{counter-increment:c;display:flex;gap:5mm;padding:2.6mm 0;border-bottom:1px solid #F1F5F9;font-weight:600;color:var(--navy)}
  .sommaire li::before{content:counter(c,decimal-leading-zero);color:var(--a);font-weight:800;min-width:8mm}
  .chapitre-tete{break-before:page;padding:10mm 0 6mm;margin-bottom:6mm;border-bottom:2pt solid var(--a)}
  .chapitre-tete .num{font-size:8.5pt;font-weight:800;letter-spacing:1.6pt;text-transform:uppercase;color:var(--a);margin-bottom:2.5mm}
  .chapitre-tete h2{font-size:21pt;line-height:1.18;color:var(--navy);font-weight:800}
  h2.annexe{break-before:page;font-size:16pt;color:var(--navy);margin-bottom:5mm}
  h3{font-size:12.5pt;color:var(--navy);margin:6.5mm 0 2.5mm;font-weight:800;break-after:avoid}
  h4{font-size:10.8pt;color:var(--navy);margin:4.5mm 0 1.5mm;break-after:avoid}
  p{margin-bottom:3.2mm}
  ul,ol{margin:0 0 3.5mm 5.5mm}li{margin-bottom:1.6mm}
  strong{color:var(--navy)}
  a{color:#1342B0;text-decoration:none}
  .intro-lead{font-size:12pt;color:#334155}
  .key-points,.callout,.outil,.stat-row,table,.faq-item,.etapes{break-inside:avoid}
  .key-points{border:1px solid var(--border);border-top:2.4pt solid var(--a);padding:4.5mm 6mm 2mm;margin:4mm 0 6mm}
  .key-points h3{margin:0 0 2.5mm;font-size:8.5pt;letter-spacing:1.3pt;text-transform:uppercase}
  .callout{background:#F8FAFC;border-left:2.4pt solid var(--a);padding:4mm 5.5mm;margin:5mm 0;font-size:10pt}
  .callout strong:first-child{display:block;margin-bottom:1mm}
  .outil{border:1.2pt solid var(--navy);border-radius:3mm;margin:6mm 0;overflow:hidden}
  .outil>h3,.outil>h4{margin:0;background:var(--navy);color:#fff;padding:3mm 5.5mm;font-size:10.5pt}
  .outil>h3::before,.outil>h4::before{content:"OUTIL  ";color:var(--a);letter-spacing:1pt;font-size:8pt}
  .outil>*:not(h3):not(h4){margin-left:5.5mm;margin-right:5.5mm}
  .outil>*:nth-child(2){margin-top:4mm}.outil>*:last-child{margin-bottom:4mm}
  ul.checklist{list-style:none;margin-left:0}
  ul.checklist li{padding-left:7mm;position:relative}
  ul.checklist li::before{content:"";position:absolute;left:0;top:1.1mm;width:3.6mm;height:3.6mm;border:1pt solid var(--navy);border-radius:.8mm}
  .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin:5mm 0 6mm}
  .stat{border-left:2.4pt solid var(--a);padding:1mm 0 1mm 4mm}
  .stat b{display:block;font-size:20pt;color:var(--navy);line-height:1.1}
  .stat span{font-size:8.5pt;color:var(--muted);line-height:1.4;display:block;margin-top:1mm}
  table{width:100%;border-collapse:collapse;margin:4mm 0 6mm;font-size:9pt}
  th,td{border:1px solid var(--border);padding:2.2mm 3mm;text-align:left;vertical-align:top}
  th{background:var(--navy);color:#fff;font-size:8.3pt;letter-spacing:.3pt}
  tr:nth-child(even) td{background:#F8FAFC}
  .faq-item h3{font-size:11pt;margin-top:4mm}
  .conclusion-box{background:var(--navy);color:#E2E8F0;border-radius:3mm;padding:7mm;margin-top:7mm;break-inside:avoid}
  .conclusion-box strong,.conclusion-box h3{color:#fff}.conclusion-box a{color:#fff;font-weight:800}
  ol.sources{font-size:8.6pt;color:var(--muted);margin-left:5mm}ol.sources li{margin-bottom:1.8mm}
  .apropos{break-before:page;padding-top:12mm}
  .apropos h2{font-size:20pt;color:var(--navy);margin-bottom:5mm}
  .cta-final{background:var(--navy);color:#CBD5E1;border-radius:4mm;padding:9mm;margin-top:9mm}
  .cta-final h3{color:#fff;font-size:15pt;margin:0 0 3mm}
  .cta-final .btn{display:inline-block;background:var(--a);color:#fff;font-weight:800;border-radius:2mm;padding:3mm 6mm;margin:4mm 4mm 0 0}
  .cta-final .btn.sec{background:transparent;border:1pt solid rgba(255,255,255,.4)}
  .services{display:grid;grid-template-columns:1fr 1fr;gap:3mm 6mm;margin-top:5mm;font-size:9.6pt}
  .services div{border-left:2pt solid var(--a);padding-left:3mm}
  </style></head><body>
  <section class="ouverture">
    <div class="eyebrow">Livre blanc · ${esc(CATS[m.categorie] || m.categorie)}</div>
    <h2>${esc(m.titre)}</h2>
    <p class="resume">${esc(m.resume)}</p>
    <div class="deux">
      <div class="carte"><h3>Ce que vous allez obtenir</h3><ul>${liste(m.apprendre)}</ul></div>
      <div class="carte"><h3>Pour qui</h3><ul>${liste(m.pourQui)}</ul></div>
    </div>
    <div class="sommaire"><div class="eyebrow">Sommaire</div><ol>${h2s.map(([, t]) => `<li>${esc(t)}</li>`).join('')}</ol></div>
  </section>
  ${corps}
  <section class="apropos">
    <div class="eyebrow">L'auteur</div>
    <h2>TechRepair Content</h2>
    <p>TechRepair Content conçoit et rédige les contenus qui font venir des clients aux entreprises SaaS B2B, fintech, cybersécurité, e-commerce tech et RH tech : articles SEO, livres blancs, études de cas, fiches produits, stratégie de contenu augmentée par l'IA et agents IA sur mesure. Chaque contenu part des questions réelles de vos acheteurs et s'appuie sur des sources vérifiées.</p>
    <div class="services">${Object.values(SERVICES).map(([l, nm]) => `<div><a href="https://www.techrepaircontent.com${l}">${esc(nm)}</a></div>`).join('')}</div>
    <div class="cta-final">
      <h3>${esc(m.ctaTitre || 'Passer de la méthode aux résultats')}</h3>
      <p>${esc(m.ctaTexte || "Vous préférez qu'un expert applique cette méthode à votre entreprise ? Décrivez votre situation : vous recevez un diagnostic et une proposition chiffrée sous 24 h, sans engagement.")}</p>
      <a class="btn" href="https://www.techrepaircontent.com/devis">Demander un diagnostic gratuit</a><a class="btn sec" href="https://www.techrepaircontent.com${lienService}">${esc(nomService)}</a>
      <p style="margin-top:6mm;font-size:9pt">contact@techrepaircontent.com · www.techrepaircontent.com</p>
    </div>
  </section>
  </body></html>`;
}

(async () => {
  const meta = process.argv[2];
  if (!meta) { console.error('Usage : node _outils/livre_blanc.js _outils/livres-blancs/<slug>.json'); process.exit(1); }
  const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
  const corps = fs.readFileSync(meta.replace(/\.json$/, '.html'), 'utf8');
  const accent = COULEURS[m.couleur] || COULEURS.bleu;
  const sortie = path.join(RACINE, 'livres-blancs');
  fs.mkdirSync(sortie, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'lb-'));

  const b = await chromium.launch();
  const ctx = await b.newContext({ deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route('**/*', r => r.request().url().startsWith('data:') || r.request().url().startsWith('about:') ? r.continue() : r.abort());

  // Couverture : page PDF pleine page + image.
  await p.setContent(couverture(m, accent), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(tmp, 'c.pdf'), width: '210mm', height: '297mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await p.setViewportSize({ width: 794, height: 1123 });
  await p.screenshot({ path: path.join(tmp, 'c.png') });

  // Pages intérieures avec pied de page.
  await p.setContent(interieur(m, corps, accent), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const court = esc(m.titreCourt || m.titre).slice(0, 90);
  await p.pdf({
    path: path.join(tmp, 'i.pdf'), format: 'A4', printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    displayHeaderFooter: true, headerTemplate: '<div></div>',
    footerTemplate: `<div style="font-size:7.5px;color:#64748b;width:100%;padding:0 20mm;display:flex;justify-content:space-between"><span><b style="color:#0B1633">TechRepair Content</b> · ${court}</span><span class="pageNumber"></span></div>`,
  });

  // Vignette de partage 1200 × 630.
  const img = 'data:image/png;base64,' + fs.readFileSync(path.join(tmp, 'c.png')).toString('base64');
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${POLICES}
    *{margin:0;padding:0;box-sizing:border-box}body{width:1200px;height:630px;background:#F1F5F9;display:flex;align-items:center;gap:60px;padding:0 70px;overflow:hidden}
    .t{flex:1}.s{font-size:16px;font-weight:800;letter-spacing:3px;color:${accent};text-transform:uppercase;margin-bottom:18px}
    h1{font-size:44px;line-height:1.12;color:#0B1633;font-weight:800;margin-bottom:22px}.g{display:inline-block;background:#0B1633;color:#fff;font-weight:800;font-size:18px;padding:12px 22px;border-radius:8px}
    img{height:540px;border-radius:6px;box-shadow:0 30px 60px rgba(11,22,51,.35);transform:rotate(3deg)}</style></head>
    <body><div class="t"><div class="s">Livre blanc gratuit</div><h1>${esc(m.titreCouverture || m.titre)}</h1><span class="g">Télécharger le PDF</span></div><img src="${img}"></body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(tmp, 'og.png') });
  await b.close();

  const pdf = path.join(sortie, `${m.slug}.pdf`);
  const q = spawnSync('qpdf', ['--empty', '--pages', path.join(tmp, 'c.pdf'), path.join(tmp, 'i.pdf'), '--', '--object-streams=generate', '--compress-streams=y', pdf]);
  if (q.status !== 0 && q.status !== 3) { console.error(String(q.stderr)); process.exit(1); }
  const py = `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB')\nw=int(sys.argv[3])\nif im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)\nim.save(sys.argv[2],'JPEG',quality=84,optimize=True,progressive=True)`;
  for (const [src, dst, w] of [['c.png', `${m.slug}-cover.jpg`, 900], ['og.png', `${m.slug}-og.jpg`, 1200]]) {
    const r = spawnSync('python3', ['-c', py, path.join(tmp, src), path.join(sortie, dst), String(w)], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  }
  const pages = spawnSync('qpdf', ['--show-npages', pdf], { encoding: 'utf8' }).stdout.trim();
  fs.writeFileSync(path.join(tmp, 'pages'), pages);
  console.log(`OK : livres-blancs/${m.slug}.pdf (${pages} pages, ${Math.round(fs.statSync(pdf).size / 1024)} Ko), couverture et vignette générées`);
})();
