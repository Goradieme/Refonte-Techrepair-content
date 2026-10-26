// Modèle des visuels LinkedIn validés le 26/10/2026 (chiffre clé, liste, accroche), 1080x1350 rendu x2.
// À adapter à chaque article ; publication via Metricool une fois l'abonnement pris.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const POL = path.join(__dirname, 'polices');
const OUT = path.join(__dirname, 'linkedin');  // _outils/linkedin/
fs.mkdirSync(OUT, { recursive: true });
const fonte = w => `url(data:font/woff2;base64,${fs.readFileSync(path.join(POL, `manrope-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2')`;
const AC = {
  bleu:   { a: '#2563EB', b: '#93C5FD', c: '#1A56DB' },
  orange: { a: '#F97316', b: '#FDBA74', c: '#C2410C' },
  violet: { a: '#7C3AED', b: '#C4B5FD', c: '#6D28D9' },
};
const base = (fond, ink) => `
@font-face{font-family:M;font-weight:400;src:${fonte(400)}}@font-face{font-family:M;font-weight:500;src:${fonte(500)}}
@font-face{font-family:M;font-weight:600;src:${fonte(600)}}@font-face{font-family:M;font-weight:700;src:${fonte(700)}}
@font-face{font-family:M;font-weight:800;src:${fonte(800)}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden}
body{font-family:M;background:${fond};color:${ink};position:relative;-webkit-font-smoothing:antialiased}
.pad{position:absolute;inset:84px 84px 76px}
.marque{display:flex;align-items:center;gap:18px;font-weight:700;font-size:26px;letter-spacing:-.01em}
.logo{width:56px;height:56px;border-radius:14px;background:#0B1633;color:#fff;display:grid;place-items:center;font-weight:800;font-size:20px;position:relative}
.logo i{position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:50%}
.sep{width:1px;height:28px;opacity:.3;background:currentColor}
.rub{font-size:19px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;opacity:.6}
.pied{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;padding-top:30px;border-top:1.5px solid currentColor;border-color:rgba(127,127,127,.3);font-size:23px}
.pied b{font-weight:700}
.cta{display:flex;align-items:center;gap:12px;font-weight:700}
`;
const marque = (pastille, logoFond = '#0B1633') => `<div class="marque"><div class="logo" style="background:${logoFond}">TRD<i style="background:${pastille}"></i></div>TechRepair Content<span class="sep"></span><span class="rub">Analyses</span></div>`;
const fleche = c => `<svg width="34" height="20" viewBox="0 0 34 20"><path d="M2 10h28M22 2l8 8-8 8" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// 1. Chiffre clé (nuit, violet)
const v = AC.violet;
const visuel1 = `<style>${base('#0B1633', '#fff')}
.grille{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:54px 54px}
.halo{position:absolute;width:1100px;height:1100px;left:-260px;top:120px;border-radius:50%;background:radial-gradient(circle,${v.a}66,transparent 62%)}
.sur{margin-top:250px;font-size:22px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${v.b}}
.chiffre{font-size:330px;font-weight:800;letter-spacing:-.06em;line-height:.9;margin-top:34px;background:linear-gradient(135deg,#fff 20%,${v.b});-webkit-background-clip:text;color:transparent}
.chiffre span{font-size:200px}
.texte{font-size:56px;font-weight:700;line-height:1.14;letter-spacing:-.025em;margin-top:44px;max-width:860px}
.texte em{font-style:normal;color:${v.b}}
.src{margin-top:34px;font-size:22px;opacity:.55}
.barres{display:flex;gap:10px;margin-top:56px}
.barres div{height:16px;border-radius:8px;flex:1;background:rgba(255,255,255,.14)}
.barres div.on{background:${v.a}}
</style><div class="grille"></div><div class="halo"></div><div class="pad">
${marque(v.a, v.a)}
<div class="sur">Transparence salariale</div>
<div class="chiffre">40<span> %</span></div>
<div class="texte">des candidats ne postuleraient pas à une offre <em>sans salaire indiqué.</em></div>
<div class="barres">${[1,1,1,1,0,0,0,0,0,0].map(o => `<div class="${o ? 'on' : ''}"></div>`).join('')}</div>
<div class="src">Étude Michael Page avec YouGov</div>
<div class="pied"><span><b>techrepaircontent.com</b></span><span class="cta" style="color:${v.b}">Lire l'analyse ${fleche(v.b)}</span></div>
</div>`;

// 2. Liste des quatre règles (papier, bleu)
const b = AC.bleu;
const regles = [
  ['Une fourchette de salaire', 'dans chaque offre publique.'],
  ['Plus de question', 'sur le salaire actuel ou passé du candidat.'],
  ['Une information écrite', 'avant l’entretien, sans offre publiée.'],
  ['Fin des clauses', 'de confidentialité sur la rémunération.'],
];
const visuel2 = `<style>${base('#F6F4EF', '#0B1633')}
.sur{margin-top:96px;font-size:22px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${b.c}}
h1{font-size:76px;font-weight:800;line-height:1.04;letter-spacing:-.035em;margin-top:24px}
h1 span{color:${b.a}}
ol{list-style:none;margin-top:58px;display:flex;flex-direction:column;gap:22px}
li{display:flex;gap:30px;align-items:center;background:#fff;border-radius:22px;padding:30px 34px;box-shadow:0 1px 0 rgba(11,22,51,.06),0 18px 40px -24px rgba(11,22,51,.25)}
.n{flex:none;width:68px;height:68px;border-radius:18px;background:${b.a};color:#fff;font-size:32px;font-weight:800;display:grid;place-items:center}
li:nth-child(even) .n{background:#0B1633}
.t{font-size:31px;line-height:1.25;letter-spacing:-.01em;color:#334155}
.t b{display:block;font-weight:800;color:#0B1633;font-size:34px}
.note{margin-top:30px;font-size:21px;color:#64748B}
</style><div class="pad">
${marque(b.a)}
<div class="sur">Projet de loi · Recrutement</div>
<h1>4 règles qui vont changer <span>vos offres d’emploi</span></h1>
<ol>${regles.map((r, i) => `<li><div class="n">${i + 1}</div><div class="t"><b>${r[0]}</b>${r[1]}</div></li>`).join('')}</ol>
<div class="note">Directive (UE) 2023/970 · projet de loi déposé le 10 septembre 2026</div>
<div class="pied"><span><b>techrepaircontent.com</b></span><span class="cta" style="color:${b.a}">Lire l'analyse ${fleche(b.a)}</span></div>
</div>`;

// 3. Accroche avec annonce barrée (accent, orange)
const o = AC.orange;
const visuel3 = `<style>${base(o.c, '#fff')}
.motif{position:absolute;right:-120px;top:-120px;width:620px;height:620px;border-radius:50%;border:2px solid rgba(255,255,255,.18)}
.motif2{position:absolute;right:-20px;top:-20px;width:420px;height:420px;border-radius:50%;border:2px solid rgba(255,255,255,.12)}
.annonce{margin-top:150px;background:#fff;border-radius:26px;padding:42px 46px;color:#0B1633;box-shadow:0 40px 80px -30px rgba(60,10,0,.55);transform:rotate(-2deg)}
.ligne{height:14px;border-radius:7px;background:#E2E8F0;margin-top:16px}
.poste{font-size:34px;font-weight:800;letter-spacing:-.02em}
.lieu{font-size:22px;color:#64748B;margin-top:8px}
.sal{margin-top:30px;display:flex;align-items:center;gap:22px}
.barre{position:relative;font-size:40px;font-weight:800;color:#94A3B8}
.barre:after{content:"";position:absolute;left:-8px;right:-8px;top:52%;height:7px;border-radius:4px;background:#EF4444;transform:rotate(-4deg)}
.ok{font-size:40px;font-weight:800;color:${o.c};background:#FFF1E6;border-radius:14px;padding:6px 18px}
h1{font-size:82px;font-weight:800;line-height:1.03;letter-spacing:-.035em;margin-top:120px}
h1 span{color:#FFE4D1}
p.s{font-size:31px;line-height:1.35;margin-top:30px;opacity:.88;max-width:860px}
.pied{border-color:rgba(255,255,255,.3)!important}
</style><div class="motif"></div><div class="motif2"></div><div class="pad">
${marque('#fff', '#0B1633')}
<div class="annonce"><div class="poste">Responsable marketing B2B</div><div class="lieu">CDI · Paris · Hybride</div>
<div class="ligne" style="width:92%"></div><div class="ligne" style="width:78%"></div>
<div class="sal"><span class="barre">Selon profil</span><span class="ok">48 000 à 56 000 €</span></div></div>
<h1>« Selon profil », <span>bientôt interdit</span> dans vos annonces.</h1>
<p class="s">Le projet de loi sur la transparence salariale impose une fourchette dans chaque offre publique.</p>
<div class="pied"><span><b>techrepaircontent.com</b></span><span class="cta">Lire l'analyse ${fleche('#fff')}</span></div>
</div>`;

(async () => {
  const nav = await chromium.launch();
  const p = await nav.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const [nom, h] of [['1-chiffre-cle', visuel1], ['2-quatre-regles', visuel2], ['3-accroche', visuel3]]) {
    await p.setContent(`<!doctype html><meta charset="utf-8"><body>${h}</body>`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, `linkedin-transparence-${nom}.png`) });
  }
  await nav.close();
})();
