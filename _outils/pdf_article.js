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
  await p.addStyleTag({ content: `
    nav,.mobile-menu,.sidebar,.nl-band,.cta-band,footer,.hamburger{display:none!important}
    .layout{display:block!important;padding:24px 0 0!important;max-width:none!important}
    .article-hero,.breadcrumb{padding-left:0!important;padding-right:0!important;max-width:none!important}
    body{font-size:11.5pt} .content p,.content li{font-size:11pt}
    h2,h3{break-after:avoid} table,.callout,.faq-item,.conclusion-box{break-inside:avoid}
    a.src::after{content:" (" attr(href) ")";font-weight:400;font-size:8.5pt;color:#64748b;text-decoration:none}
  `});
  const titre = await p.title();
  await p.pdf({
    path: out, format: 'A4', printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#64748b;width:100%;padding:0 16mm">Relecture avant publication · ${titre.replace(/</g,'&lt;')}</div>`,
    footerTemplate: '<div style="font-size:8px;color:#64748b;width:100%;text-align:right;padding:0 16mm"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await b.close();
  console.log('OK : ' + out);
})();
