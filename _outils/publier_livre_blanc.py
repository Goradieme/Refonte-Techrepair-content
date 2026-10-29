#!/usr/bin/env python3
"""
publier_livre_blanc.py — Publie un livre blanc TechRepair Content sur le site.

Usage :
    NODE_PATH=$(npm root -g) node _outils/livre_blanc.js _outils/livres-blancs/<slug>.json
    python3 _outils/publier_livre_blanc.py _outils/livres-blancs/<slug>.json

Prérequis : le PDF, la couverture et la vignette produits par livre_blanc.js.
Crée ou met à jour :
  - livres-blancs/<slug>.html : page de téléchargement indexable (présentation, sommaire,
    premier chapitre en accès libre, formulaire e-mail Brevo puis téléchargement immédiat) ;
  - livres-blancs/index.html : la liste de tous les livres blancs ;
  - sitemap.xml et feed.xml.
Contrôles : 4 000 à 7 000 mots hors sources, au moins 6 chapitres <h2 id="chN">,
au moins 2 encadrés <div class="outil">, une bibliographie, titre SEO ≤ 65 caractères,
meta description ≤ 160 caractères, champs obligatoires du JSON.
"""
import html
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = "https://www.techrepaircontent.com"
MIN_MOTS, MAX_MOTS = 4000, 7000
CATS = {"seo": "SEO B2B", "saas": "SaaS B2B", "ecommerce": "E-commerce tech", "cyber": "Cybersécurité",
        "fintech": "Fintech", "rh": "RH tech"}
SERVICES = {
    "articles-seo": ("/service-articles-seo", "Articles SEO longue traîne et piliers"),
    "livres-blancs": ("/service-livres-blancs", "Livres blancs et études de cas B2B"),
    "fiches-produits": ("/service-fiches-produits", "Fiches produits SEO et conversion"),
    "strategie-ia": ("/service-strategie-ia", "Stratégie de contenu IA augmentée"),
    "agents-ia": ("/agents-ia", "Agents IA sur mesure"),
    "visibilite-ia": ("/visibilite-ia", "Visibilité dans les IA"),
}
SECTEURS = {"seo": "/secteur-saas", "saas": "/secteur-saas", "ecommerce": "/secteur-ecommerce",
            "cyber": "/secteur-cybersecurite", "fintech": "/secteur-fintech", "rh": "/secteur-rh-tech"}
COULEURS = {"bleu": "#1A56DB", "orange": "#F97316", "vert": "#10B981", "violet": "#7C3AED"}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]
OBLIGATOIRES = ["slug", "date", "categorie", "service", "couleur", "titre", "titreCouverture", "sousTitre",
                "titreSeo", "metaDesc", "motCle", "resume", "apprendre", "pourQui", "pointsCles"]
esc = lambda s: html.escape(str(s), quote=True)


def texte_brut(fragment):
    t = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", fragment)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))).strip()


def compter_mots(fragment):
    sans = fragment.split('<h2 id="sources"')[0]
    return len(re.findall(r"[\wÀ-ÿ'’-]+", texte_brut(sans)))


def date_fr(date):
    d = datetime.strptime(date, "%Y-%m-%d")
    return f"{d.day}{'er' if d.day == 1 else ''} {MOIS[d.month - 1]} {d.year}"


def morceaux_gabarit():
    """Styles, menu et pied de page repris du gabarit des articles (même charte)."""
    g = (RACINE / "_outils" / "gabarit-article.html").read_text(encoding="utf-8")
    style = re.search(r"<style>[\s\S]*?</style>", g).group(0)
    nav = re.search(r"<nav>[\s\S]*?</nav>\s*<div class=\"mobile-menu\"[\s\S]*?</div>", g).group(0)
    nav = nav.replace(' class="active"', "")
    pied = re.search(r"<footer>[\s\S]*?</footer>", g).group(0)
    script_menu = re.search(r"<script>\s*(const hamburger[\s\S]*?\n\}\);\n)", g).group(1)
    return style, nav, pied, script_menu


CSS_LB = """
<style>
.lb-hero{background:linear-gradient(160deg,#F8FAFF,#EEF3FF);border-bottom:1px solid var(--border)}
.lb-hero-in{max-width:1100px;margin:0 auto;padding:22px 32px 48px;display:grid;grid-template-columns:1fr 380px;gap:48px;align-items:start}
.lb-badge{display:inline-flex;gap:6px;align-items:center;background:#fff;border:1px solid var(--border);color:var(--navy);font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;padding:5px 12px;border-radius:20px;margin:18px 0 16px}
.lb-badge i{width:8px;height:8px;border-radius:50%;background:var(--lb-accent);display:inline-block}
.lb-hero h1{font-size:36px;line-height:1.15;font-weight:800;color:var(--navy);margin-bottom:14px}
.lb-sous{font-size:17px;color:#475569;line-height:1.65;margin-bottom:18px}
.lb-meta{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin-bottom:24px}
.lb-meta b{color:var(--navy)}
.lb-apprendre{list-style:none;display:grid;gap:10px}
.lb-apprendre li{display:flex;gap:10px;font-size:14.5px;line-height:1.55;color:var(--text)}
.lb-apprendre li::before{content:"✓";flex-shrink:0;width:22px;height:22px;border-radius:50%;background:var(--lb-accent);color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;margin-top:1px}
.lb-form{background:#fff;border:1px solid var(--border);border-radius:20px;padding:24px;box-shadow:0 18px 50px rgba(15,27,61,.12);position:sticky;top:80px}
.lb-form img{width:62%;height:auto;display:block;margin:0 auto 18px;border-radius:6px;box-shadow:0 14px 34px rgba(11,22,51,.28)}
.lb-form h2{font-size:18px;font-weight:800;color:var(--navy);margin-bottom:4px;text-align:center}
.lb-form p.n{font-size:12.5px;color:var(--muted);text-align:center;margin-bottom:14px}
.lb-form input{width:100%;border:1.5px solid var(--border);border-radius:9px;padding:12px 14px;font-size:14px;font-family:inherit;margin-bottom:10px;outline:none}
.lb-form input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,86,219,.08)}
.lb-form button{width:100%;background:var(--blue);color:#fff;border:none;border-radius:9px;padding:13px;font-size:14.5px;font-weight:800;cursor:pointer;font-family:inherit}
.lb-form button:hover{background:var(--blue-dark)}
.lb-form .legal{font-size:11px;color:var(--muted);margin-top:10px;text-align:center;line-height:1.5}
.lb-form .legal a{text-decoration:underline}
.lb-msg{display:none;font-size:13px;margin-top:10px;text-align:center}
.lb-sec{max-width:1100px;margin:0 auto;padding:52px 32px 0}
.lb-sec>h2{font-size:26px;font-weight:800;color:var(--navy);margin-bottom:18px}
.lb-cartes{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.lb-carte{border:1px solid var(--border);border-top:3px solid var(--lb-accent);border-radius:0 0 14px 14px;padding:18px;font-size:14px;line-height:1.6;background:#fff}
.lb-som{list-style:none;counter-reset:c;border-top:1px solid var(--border)}
.lb-som li{counter-increment:c;display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--border);font-weight:700;color:var(--navy);font-size:15px}
.lb-som li::before{content:counter(c,decimal-leading-zero);color:var(--lb-accent);font-weight:800;min-width:26px}
.lb-extrait{max-width:760px}
.lb-suite{margin:26px 0 0;background:var(--navy);color:#cbd5e1;border-radius:18px;padding:28px;display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.lb-suite strong{color:#fff;font-size:17px;display:block;margin-bottom:4px}
.lb-suite a{background:#fff;color:var(--navy);font-weight:800;border-radius:9px;padding:12px 20px;font-size:14px;white-space:nowrap}
.lb-liste{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px;max-width:1100px;margin:0 auto;padding:10px 32px 60px}
.lb-item{border:1px solid var(--border);border-radius:18px;overflow:hidden;background:#fff;display:flex;flex-direction:column;transition:box-shadow .2s,transform .2s}
.lb-item:hover{box-shadow:0 14px 40px rgba(15,27,61,.12);transform:translateY(-2px)}
.lb-item .v{background:#EEF3FF;padding:26px;display:grid;place-items:center}
.lb-item .v img{width:46%;height:auto;border-radius:4px;box-shadow:0 12px 26px rgba(11,22,51,.3)}
.lb-item .t{padding:18px 20px 22px}
.lb-item .c{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--blue-dark);margin-bottom:6px}
.lb-item h2{font-size:17px;line-height:1.35;color:var(--navy);font-weight:800;margin-bottom:8px}
.lb-item p{font-size:13.5px;color:var(--muted);line-height:1.6}
@media(max-width:960px){.lb-hero-in{grid-template-columns:1fr;gap:28px}.lb-form{position:static}}
@media(max-width:600px){.lb-hero-in,.lb-sec,.lb-liste{padding-left:16px;padding-right:16px}.lb-hero h1{font-size:27px}.lb-sec>h2{font-size:22px}.lb-form img{width:48%}}
</style>"""

SCRIPT_FORM = """
const BREVO_FORM_ACTION = 'https://a41ce724.sibforms.com/serve/MUIFAEGqDW1rbNTL0uU5ym6Ux5qJ7TJpdETsCjqRumOCnr-gRU8IGKx8Ic-JLjScrVVWrJVx_YXawDF8ao6y5hYLPvy7h8UJCk3gg9gTHcTaNAWQzbjwLnHO6DPk_HzPb7XY28rHy9JtEMuP-euST6RZutJ_bWOfqZFEtI-UUs9G4HA-O5V8JPwb3jLz0jhwuISuUqZ3Iok5IEyYHg==';
document.querySelectorAll('.lb-form form').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  const email = f.querySelector('input[type=email]').value.trim();
  const msg = f.parentNode.querySelector('.lb-msg');
  msg.style.display = 'block';
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) { msg.style.color = '#dc2626'; msg.textContent = "Merci d'entrer une adresse e-mail valide."; return; }
  const d = new FormData();
  d.append('EMAIL', email); d.append('email_address_check', ''); d.append('locale', 'fr'); d.append('html_type', 'simple');
  fetch(BREVO_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: d }).catch(() => {});
  const a = document.createElement('a'); a.href = f.dataset.pdf; a.download = f.dataset.pdf.split('/').pop();
  document.body.appendChild(a); a.click(); a.remove();
  msg.style.color = '#10b981';
  msg.innerHTML = 'Merci ! Le téléchargement commence. <a href="' + f.dataset.pdf + '" download style="text-decoration:underline">Lien direct</a>';
  f.querySelector('button').textContent = 'Téléchargement en cours ✓';
}));
"""


def page(titre_balise, meta_desc, url, og_image, jsonld, contenu, accent, style, nav, pied, script_menu, script=""):
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{esc(titre_balise)}</title>
<meta name="description" content="{esc(meta_desc)}"/>
<meta name="author" content="Goradieme"/>
<link rel="canonical" href="{url}"/>
<meta property="og:title" content="{esc(titre_balise)}"/>
<meta property="og:description" content="{esc(meta_desc)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="{url}"/>
<meta property="og:locale" content="fr_FR"/>
<meta property="og:site_name" content="TechRepair Content"/>
{f'<meta property="og:image" content="{og_image}"/>' if og_image else ''}
<meta name="twitter:card" content="summary_large_image"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
{style}
{CSS_LB}
<style>:root{{--lb-accent:{accent}}}</style>
<script type="application/ld+json">
{jsonld}
</script>
</head>
<body>

{nav}

{contenu}

{pied}

<script>
{script_menu}{script}</script>
</body>
</html>
"""


def charger(meta_path):
    m = json.loads(meta_path.read_text(encoding="utf-8"))
    manquants = [k for k in OBLIGATOIRES if not m.get(k)]
    if manquants:
        sys.exit("Champs manquants dans le JSON : " + ", ".join(manquants))
    return m


def main(chemin):
    meta_path = Path(chemin)
    m = charger(meta_path)
    corps = meta_path.with_suffix(".html").read_text(encoding="utf-8").strip()
    slug = m["slug"]
    if m["categorie"] not in CATS:
        sys.exit(f"Catégorie inconnue : {m['categorie']}")
    if m["service"] not in SERVICES:
        sys.exit(f"Service inconnu : {m['service']} (attendu : {', '.join(SERVICES)})")

    # --- Contrôles ---------------------------------------------------------------
    mots = compter_mots(corps)
    if not (MIN_MOTS <= mots <= MAX_MOTS):
        sys.exit(f"Longueur hors limites : {mots} mots (attendu {MIN_MOTS}-{MAX_MOTS}).")
    if len(m["titreSeo"]) > 60:
        sys.exit(f"Titre SEO trop long ({len(m['titreSeo'])} > 60 caractères).")
    if len(m["metaDesc"]) > 160:
        sys.exit(f"Meta description trop longue ({len(m['metaDesc'])} > 160 caractères).")
    chapitres = re.findall(r'<h2 id="(ch\d+)">([\s\S]*?)</h2>', corps)
    if len(chapitres) < 6:
        sys.exit("Au moins 6 chapitres <h2 id=\"chN\"> sont attendus.")
    if corps.count('<div class="outil">') < 2:
        sys.exit('Au moins 2 outils prêts à l\'emploi (<div class="outil">) sont attendus.')
    if '<h2 id="sources">' not in corps or '<ol class="sources">' not in corps:
        sys.exit('Bibliographie manquante (<h2 id="sources"> puis <ol class="sources">).')
    if "<h1" in corps:
        sys.exit("Le corps ne doit pas contenir de <h1>.")
    fichiers = {k: RACINE / "livres-blancs" / f"{slug}{s}" for k, s in
                (("pdf", ".pdf"), ("cover", "-cover.jpg"), ("og", "-og.jpg"))}
    for k, f in fichiers.items():
        if not f.exists():
            sys.exit(f"{f.relative_to(RACINE)} absent : lancer d'abord _outils/livre_blanc.js")
    pages = subprocess.run(["qpdf", "--show-npages", str(fichiers["pdf"])], capture_output=True, text=True).stdout.strip()
    html_page = RACINE / "livres-blancs" / f"{slug}.html"
    if html_page.exists() and not m.get("remplacer"):
        sys.exit(f"{html_page.relative_to(RACINE)} existe déjà (ajouter \"remplacer\": true pour le régénérer).")

    style, nav, pied, script_menu = morceaux_gabarit()
    accent = COULEURS.get(m["couleur"], COULEURS["bleu"])
    url = f"{SITE}/livres-blancs/{slug}.html"
    lien_service, nom_service = SERVICES[m["service"]]
    lecture = max(1, round(mots / 200))
    pdf_rel = f"/livres-blancs/{slug}.pdf"

    # Premier chapitre en accès libre : contenu indexable et avant-goût du document.
    premier = re.split(r'<h2 id="ch2">', corps)[0]
    premier = re.sub(r'<h2 id="ch1">([\s\S]*?)</h2>', r"<h3>\1</h3>", premier)

    graph = [{
        "@type": "DigitalDocument",
        "name": m["titre"], "headline": m["titre"], "description": m["metaDesc"],
        "url": url, "encodingFormat": "application/pdf", "inLanguage": "fr-FR",
        "datePublished": m["date"], "dateModified": m.get("dateModification", m["date"]),
        "image": f"{SITE}/livres-blancs/{slug}-og.jpg", "keywords": m["motCle"],
        "numberOfPages": int(pages) if pages.isdigit() else None, "wordCount": mots,
        "author": {"@type": "Person", "name": "Goradieme", "url": f"{SITE}/apropos"},
        "publisher": {"@type": "Organization", "name": "TechRepair Content", "url": f"{SITE}/"},
        "isAccessibleForFree": True,
    }, {
        "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Livres blancs", "item": f"{SITE}/livres-blancs/"},
            {"@type": "ListItem", "position": 3, "name": m["titreCouverture"], "item": url},
        ]}]
    graph[0] = {k: v for k, v in graph[0].items() if v is not None}
    jsonld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)

    formulaire = f"""<div class="lb-form" id="telecharger">
      <img src="{slug}-cover.jpg" alt="Couverture du livre blanc {esc(m['titreCouverture'])}" width="900" height="1273"/>
      <h2>Téléchargez le livre blanc</h2>
      <p class="n">PDF gratuit · {pages} pages · lecture {lecture} min</p>
      <form data-pdf="{pdf_rel}">
        <input type="email" required placeholder="votre@email-pro.com" aria-label="Adresse e-mail professionnelle"/>
        <button type="submit">Recevoir le PDF gratuitement →</button>
      </form>
      <p class="lb-msg" role="status"></p>
      <p class="legal">Votre e-mail sert à vous envoyer ce livre blanc et des conseils de contenu B2B. Désinscription en un clic. <a href="/confidentialite">Confidentialité</a></p>
    </div>"""
    contenu = f"""<div class="lb-hero">
  <div class="breadcrumb" style="padding-top:18px"><a href="/">Accueil</a> / <a href="/livres-blancs/">Livres blancs</a> / <span style="color:var(--navy)">{esc(m['titreCouverture'])}</span></div>
  <div class="lb-hero-in">
    <div>
      <span class="lb-badge"><i></i>Livre blanc gratuit · {esc(CATS[m['categorie']])}</span>
      <h1>{esc(m['titre'])}</h1>
      <p class="lb-sous">{esc(m['sousTitre'])}</p>
      <div class="lb-meta"><span><b>{pages} pages</b> · PDF</span><span>Lecture {lecture} min</span><span>Publié le {date_fr(m['date'])}</span><span>Par Goradieme</span></div>
      <ul class="lb-apprendre">{''.join(f'<li>{esc(x)}</li>' for x in m['apprendre'])}</ul>
    </div>
    {formulaire}
  </div>
</div>

<section class="lb-sec">
  <h2>Pour qui ?</h2>
  <div class="lb-cartes">{''.join(f'<div class="lb-carte">{esc(x)}</div>' for x in m['pourQui'])}</div>
</section>

<section class="lb-sec">
  <h2>Au sommaire</h2>
  <ol class="lb-som">{''.join(f'<li>{esc(texte_brut(t))}</li>' for _, t in chapitres)}</ol>
</section>

<section class="lb-sec">
  <h2>Lire le premier chapitre</h2>
  <div class="content lb-extrait">
{premier}
  </div>
  <div class="lb-suite"><div><strong>La suite dans le livre blanc</strong>{len(chapitres) - 1} chapitres, des outils prêts à l'emploi et toutes les sources.</div><a href="#telecharger">Télécharger le PDF →</a></div>
</section>

<section class="lb-sec" style="padding-bottom:56px">
  <h2>Besoin d'aller plus vite ?</h2>
  <div class="content lb-extrait"><p>{esc(m.get('ctaTexte') or "Ce livre blanc donne la méthode complète pour la mettre en œuvre en interne. Si vous préférez qu'un expert l'applique à votre entreprise, TechRepair Content peut s'en charger.")} Découvrez le service <a href="{lien_service}">{esc(nom_service)}</a>, l'offre pour le secteur <a href="{SECTEURS[m['categorie']]}">{esc(CATS[m['categorie']])}</a>, ou <a href="/devis">demandez un diagnostic gratuit</a>.</p></div>
</section>"""
    titre_balise = m["titreSeo"] if len(m["titreSeo"]) > 47 else f"{m['titreSeo']} | TechRepair"
    html_page.write_text(page(titre_balise, m["metaDesc"], url, f"{SITE}/livres-blancs/{slug}-og.jpg", jsonld,
                              contenu, accent, style, nav, pied, script_menu, SCRIPT_FORM), encoding="utf-8")

    # --- Index des livres blancs -------------------------------------------------
    tous = []
    for f in sorted((RACINE / "_outils" / "livres-blancs").glob("*.json")):
        x = json.loads(f.read_text(encoding="utf-8"))
        if (RACINE / "livres-blancs" / f"{x['slug']}.html").exists():
            tous.append(x)
    tous.sort(key=lambda x: x["date"], reverse=True)
    cartes = "".join(f"""
  <a class="lb-item" href="{x['slug']}.html">
    <div class="v"><img src="{x['slug']}-cover.jpg" alt="Couverture : {esc(x['titreCouverture'])}" loading="lazy"/></div>
    <div class="t"><div class="c">{esc(CATS.get(x['categorie'], x['categorie']))} · {date_fr(x['date'])}</div><h2>{esc(x['titre'])}</h2><p>{esc(x['resume'])}</p></div>
  </a>""" for x in tous)
    jl_index = json.dumps({"@context": "https://schema.org", "@type": "CollectionPage", "name": "Livres blancs TechRepair Content",
                           "url": f"{SITE}/livres-blancs/", "hasPart": [{"@type": "DigitalDocument", "name": x["titre"],
                           "url": f"{SITE}/livres-blancs/{x['slug']}.html"} for x in tous]}, ensure_ascii=False, indent=2)
    contenu_index = f"""<div class="lb-hero"><div class="lb-sec" style="padding-top:22px;padding-bottom:36px">
  <div class="breadcrumb" style="padding:0 0 14px"><a href="/">Accueil</a> / <span style="color:var(--navy)">Livres blancs</span></div>
  <span class="lb-badge"><i></i>Ressources gratuites</span>
  <h1 style="font-size:34px;font-weight:800;color:var(--navy);line-height:1.2;margin-bottom:12px">Livres blancs pour les équipes marketing B2B tech</h1>
  <p class="lb-sous" style="max-width:760px">Des guides complets et des outils prêts à l'emploi pour attirer et convertir vos acheteurs : SaaS B2B, fintech, cybersécurité, e-commerce tech. Un nouveau livre blanc chaque semaine.</p>
</div></div>
<div class="lb-liste">{cartes}
</div>"""
    (RACINE / "livres-blancs" / "index.html").write_text(
        page("Livres blancs B2B gratuits | TechRepair Content",
             "Livres blancs gratuits pour les équipes marketing SaaS B2B, fintech et cybersécurité : méthodes complètes et outils prêts à l'emploi.",
             f"{SITE}/livres-blancs/", f"{SITE}/livres-blancs/{tous[0]['slug']}-og.jpg" if tous else "", jl_index,
             contenu_index, COULEURS["bleu"], style, nav, pied, script_menu), encoding="utf-8")

    # --- sitemap.xml -------------------------------------------------------------
    sm = RACINE / "sitemap.xml"
    s = sm.read_text(encoding="utf-8")
    for loc, prio in ((url, "0.9"), (f"{SITE}/livres-blancs/", "0.8")):
        if f"<loc>{loc}</loc>" not in s:
            s = s.replace("</urlset>", f"  <url><loc>{loc}</loc><lastmod>{m['date']}</lastmod><priority>{prio}</priority></url>\n</urlset>")
        else:
            s = re.sub(rf"(<loc>{re.escape(loc)}</loc><lastmod>)[^<]*", rf"\g<1>{m['date']}", s)
    sm.write_text(s, encoding="utf-8")

    # --- feed.xml ----------------------------------------------------------------
    fd = RACINE / "feed.xml"
    f = fd.read_text(encoding="utf-8")
    if f"<link>{url}</link>" not in f:
        d = datetime.strptime(m["date"], "%Y-%m-%d")
        item = ("    <item>\n"
                f"      <title>Livre blanc : {esc(m['titre'])}</title>\n"
                f"      <link>{url}</link>\n"
                f'      <guid isPermaLink="true">{url}</guid>\n'
                f"      <pubDate>{format_datetime(d.replace(hour=7, tzinfo=timezone.utc), usegmt=True)}</pubDate>\n"
                f"      <description>{esc(m['resume'])}</description>\n"
                f'      <enclosure url="{SITE}/livres-blancs/{slug}-og.jpg" type="image/jpeg"/>\n'
                "    </item>\n")
        f = f.replace("    <item>", item + "    <item>", 1) if "    <item>" in f else f.replace("</channel>", item + "</channel>")
        f = re.sub(r"<lastBuildDate>.*?</lastBuildDate>",
                   f"<lastBuildDate>{format_datetime(datetime.now(timezone.utc), usegmt=True)}</lastBuildDate>", f)
        fd.write_text(f, encoding="utf-8")

    # --- Calendrier des livres blancs ---------------------------------------------
    cal = RACINE / "_outils" / "calendrier-livres-blancs.json"
    if cal.exists():
        c = json.loads(cal.read_text(encoding="utf-8"))
        for x in c:
            if x["slug"] == slug:
                x["statut"], x["date"] = "publie", m["date"]
        cal.write_text(json.dumps(c, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    print(f"OK : livres-blancs/{slug}.html ({mots} mots, {pages} pages), index, sitemap et flux mis à jour.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
