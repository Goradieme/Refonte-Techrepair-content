// pdf_article.js — Exporte un article en PDF de relecture (A4), sans menu ni pied de page.
// Usage : node _outils/pdf_article.js articles/article-<slug>.html sortie.pdf
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const [src, out] = process.argv.slice(2);
  if (!src || !out) { console.error('Usage : node _outils/pdf_article.js <article.html> <sortie.pdf>'); process.exit(1); }
  const b = await chromium.launch();
  const p = await b.newPage();
  // Les polices Google ne sont pas toujours joignables : on n'attend pas le réseau.
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + path.resolve(src), { waitUntil: 'load' });
  const fs = require('fs');
  const ff = w => `@font-face{font-family:MR;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'polices', `manrope-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2')}`;
  await p.addStyleTag({ content: [400, 600, 800].map(ff).join('') + '*{font-family:MR,sans-serif!important}' });
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: `
    nav,.mobile-menu,.sidebar,.nl-band,.cta-band,footer,.hamburger{display:none!important}
    .layout{display:block!important;padding:24px 0 0!important;max-width:none!important}
    .article-hero,.breadcrumb{padding-left:0!important;padding-right:0!important;max-width:none!important}
    body{font-size:11.5pt} .content p,.content li{font-size:11pt}
    h2,h3{break-after:avoid} table,.callout,.faq-item,.conclusion-box{break-inside:avoid}
    *{box-shadow:none!important;text-shadow:none!important}
    a.src::after{content:" (" attr(href) ")";font-weight:400;font-size:8.5pt;color:#64748b;text-decoration:none}
  `});
  // Images réduites (900 px, JPEG 75 %) pour un PDF léger, envoyable en pièce jointe.
  const srcs = await p.$$eval('img', l => l.map(i => i.src));
  for (const s of [...new Set(srcs)]) {
    if (!s.startsWith('file://')) continue;
    const py = "import sys,io,base64\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB')\nif im.width>900: im=im.resize((900,round(im.height*900/im.width)),Image.LANCZOS)\nb=io.BytesIO(); im.save(b,'JPEG',quality=75,optimize=True)\nprint(base64.b64encode(b.getvalue()).decode())";
    const r = require('child_process').spawnSync('python3', ['-c', py, decodeURIComponent(new URL(s).pathname)], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0) continue;
    const data = 'data:image/jpeg;base64,' + r.stdout.trim();
    await p.evaluate(([a, b]) => { for (const i of document.images) if (i.src === a) i.src = b; }, [s, data]);
  }
  await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
  // Retire les émojis (polices bitmap très lourdes dans un PDF).
  await p.evaluate(() => {
    const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) w.currentNode.nodeValue = w.currentNode.nodeValue.replace(re, '').replace(/^\s+(?=\S)/, m => m.includes('\n') ? m : '');
  });
  const titre = await p.title();
  await p.pdf({
    path: out, format: 'A4', printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#64748b;width:100%;padding:0 16mm">Relecture avant publication · ${titre.replace(/</g,'&lt;')}</div>`,
    footerTemplate: '<div style="font-size:8px;color:#64748b;width:100%;text-align:right;padding:0 16mm"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await b.close();
  // Recompression (qpdf) : PDF plus léger, pratique en pièce jointe.
  const q = require('child_process').spawnSync('qpdf', ['--object-streams=generate', '--compress-streams=y', '--recompress-flate', '--replace-input', out]);
  if (q.error) console.log('(qpdf absent : PDF non recompressé)');
  console.log('OK : ' + out + ' (' + Math.round(require('fs').statSync(out).size / 1024) + ' Ko)');
})();
