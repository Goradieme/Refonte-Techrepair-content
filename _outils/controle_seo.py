#!/usr/bin/env python3
"""
controle_seo.py — Contrôle SEO et GEO d'un article publié (page assemblée dans articles/).

Usage :
    python3 _outils/controle_seo.py <slug> [<slug> ...]     contrôle ces articles
    python3 _outils/controle_seo.py --tous                  contrôle tout le blog (bilan)

Sortie 1 si au moins un point BLOQUANT échoue : l'article ne doit pas partir en
publication tant que ce n'est pas corrigé. Les AVERTISSEMENTS sont à examiner un par un
(ils signalent un défaut probable, pas certain). Lancé automatiquement à la fin de
publier_article.py et sur chaque demande de fusion « article/… ».

Ce que le contrôle garantit :
  SEO  balise title, meta description, H1 unique, hiérarchie Hn, mot-clé aux bons
       endroits, canonique, balises de partage, images, maillage, sitemap, longueur ;
  GEO  ce qui permet à Google et aux moteurs IA d'extraire et de citer : données
       structurées (article, auteur nommé, FAQ, fil d'Ariane), encadré « Points clés »,
       FAQ visible, chiffres sourcés, liste de sources, dates, robots IA autorisés.
"""
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = "https://www.techrepaircontent.com"
ROBOTS_IA = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot",
             "PerplexityBot", "Google-Extended", "Bingbot", "Googlebot"]


def brut(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def norm(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def _racine(m: str) -> str:
    """Racine approximative : « fintechs » et « fintech », « réglementaire » et « réglementation »."""
    return m if m.isdigit() or len(m) <= 4 else m[:max(4, len(m) - 3)]


def part_mot_cle(texte: str, mot_cle: str) -> float:
    """Part des mots significatifs du mot-clé retrouvés dans le texte (ordre libre, pluriels admis)."""
    jetons = norm(texte).split()
    mots = [m for m in norm(mot_cle).split() if len(m) > 2 or m.isdigit()] or norm(mot_cle).split()
    return sum(any(j.startswith(_racine(m)) for j in jetons) for m in mots) / len(mots)


def contient(texte: str, mot_cle: str) -> bool:
    return part_mot_cle(texte, mot_cle) == 1


def controler(slug: str):
    bloquants, avertissements = [], []
    B, A = bloquants.append, avertissements.append
    page = RACINE / "articles" / f"article-{slug}.html"
    if not page.exists():
        return [f"page introuvable : {page.name}"], []
    s = page.read_text(encoding="utf-8")
    url = f"{SITE}/articles/{page.name}"
    tete, reste = s.split("</head>", 1)
    corps = reste.split("<h1", 1)[-1]
    principal = re.split(r"<!-- maillage:debut -->|<aside|<footer", corps)[0]
    principal = re.sub(r"<(script|style)\b.*?</\1>", "", principal, flags=re.S)
    sans_sources = principal.split('<h2 id="sources"')[0]

    # --- Données structurées ---------------------------------------------------
    types, art, faq_ld = {}, None, None
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', tete, re.S):
        try:
            d = json.loads(bloc)
        except ValueError:
            B("données structurées : JSON-LD invalide")
            continue
        for n in d.get("@graph", [d]):
            types[n.get("@type")] = n
    art = types.get("BlogPosting") or types.get("Article")
    faq_ld = types.get("FAQPage")
    if not art:
        B("données structurées : BlogPosting absent")
    else:
        for k in ("headline", "description", "datePublished", "dateModified", "image", "author", "publisher", "mainEntityOfPage"):
            if not art.get(k):
                B(f"données structurées : « {k} » absent")
        aut = art.get("author") or {}
        if aut.get("@type") != "Person" or not aut.get("name") or not aut.get("url"):
            B("données structurées : l'auteur doit être une personne nommée, avec sa page (E-E-A-T)")
        if str(art.get("image", "")).startswith(SITE) is False:
            B("données structurées : image en adresse absolue attendue")
    if "BreadcrumbList" not in types:
        B("données structurées : fil d'Ariane (BreadcrumbList) absent")
    mot_cle = (art or {}).get("keywords") or ""
    if not mot_cle:
        B("mot-clé principal absent des données structurées (« keywords »)")

    # --- Balises de tête -------------------------------------------------------
    titles = re.findall(r"<title>(.*?)</title>", tete, re.S)
    title = html.unescape(titles[0]).strip() if len(titles) == 1 else ""
    if not title:
        B("balise <title> absente ou en double")
    elif len(title) > 60:
        B(f"balise <title> trop longue ({len(title)} > 60 caractères)")
    descs = re.findall(r'<meta name="description" content="(.*?)"', tete, re.S)
    desc = html.unescape(descs[0]) if len(descs) == 1 else ""
    if not desc:
        B("meta description absente ou en double")
    elif len(desc) > 160:
        B(f"meta description trop longue ({len(desc)} > 160 caractères)")
    elif len(desc) < 120:
        A(f"meta description courte ({len(desc)} caractères ; viser 140 à 160)")
    can = re.findall(r'<link rel="canonical" href="(.*?)"', tete)
    if can != [url]:
        B("balise canonique absente ou qui ne pointe pas sur la page")
    if re.search(r'<meta name="robots" content="[^"]*noindex', tete):
        B("page en noindex")
    if not re.search(r'<html[^>]*lang="fr', s):
        B('attribut lang="fr" absent')
    for og in ("og:title", "og:description", "og:type", "og:url", "og:image"):
        m = re.search(rf'<meta property="{og}" content="(.*?)"', tete)
        if not m or not m.group(1):
            B(f"balise de partage {og} absente")
        elif og == "og:image":
            chemin = m.group(1).split("?")[0]
            if not chemin.startswith(SITE + "/"):
                B("og:image : adresse absolue attendue")
            elif not (RACINE / chemin[len(SITE) + 1:]).exists():
                B("og:image : fichier introuvable")
    if 'name="twitter:card"' not in tete:
        B("balise twitter:card absente")
    if not re.search(r'<meta name="author" content="[^"]+"', tete):
        A("balise meta author absente")

    # --- Titres ----------------------------------------------------------------
    h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", reste, re.S)
    if len(h1s) != 1:
        B(f"H1 : un seul attendu, {len(h1s)} trouvé(s)")
    niveaux = [1] + [int(n) for n in re.findall(r"<h([2-6])[\s>]", principal)]
    for a, b in zip(niveaux, niveaux[1:]):
        if b > a + 1:
            B(f"hiérarchie des titres : saut de H{a} à H{b}")
            break
    h2 = [brut(t) for t in re.findall(r"<h2[^>]*>(.*?)</h2>", principal, re.S)]
    sections = [t for t in h2 if norm(t) not in ("questions frequentes", "sources")]
    if len(sections) < 6:
        B(f"structure : 6 parties H2 au moins attendues, {len(sections)} trouvée(s)")
    if len(set(norm(t) for t in h2)) != len(h2):
        B("deux H2 identiques")

    # --- Mot-clé ---------------------------------------------------------------
    if mot_cle:
        texte = brut(sans_sources)
        if title and not contient(title, mot_cle):
            B(f"mot-clé « {mot_cle} » absent de la balise <title>")
        if h1s and not contient(brut(h1s[0]), mot_cle):
            B(f"mot-clé « {mot_cle} » absent du H1")
        if desc and not contient(desc, mot_cle):
            B(f"mot-clé « {mot_cle} » absent de la meta description")
        if not any(part_mot_cle(t, mot_cle) >= 0.6 for t in sections):
            B(f"mot-clé « {mot_cle} » absent de tous les H2 (au moins un H2 doit en reprendre l'essentiel)")
        if not contient(" ".join(texte.split()[:200]), mot_cle):
            B(f"mot-clé « {mot_cle} » absent des 200 premiers mots")

    # --- Contenu extractible (GEO) ---------------------------------------------
    if 'class="intro-lead"' not in principal:
        B("chapeau <p class=\"intro-lead\"> absent")
    kp = re.search(r'<div class="key-points">(.*?)</div>', principal, re.S)
    if not kp:
        B("encadré « Points clés » absent")
    elif len(re.findall(r"<li", kp.group(1))) < 3:
        B("encadré « Points clés » : 3 conclusions au moins attendues")
    faq_vis = re.findall(r'<div class="faq-item">\s*<h3[^>]*>(.*?)</h3>', principal, re.S)
    if not (3 <= len(faq_vis) <= 6):
        B(f"FAQ visible : 3 à 5 questions attendues, {len(faq_vis)} trouvée(s)")
    if not faq_ld:
        B("données structurées : FAQPage absente")
    elif len(faq_ld.get("mainEntity", [])) != len(faq_vis):
        B("FAQPage : le balisage ne correspond pas aux questions visibles")
    for q in faq_vis:
        if not brut(q).rstrip().endswith("?"):
            A(f"question de FAQ sans point d'interrogation : « {brut(q)[:60]} »")
    if "<table" not in principal and "<ol" not in sans_sources:
        B("ni tableau ni liste d'étapes : au moins un attendu")
    if len(re.findall(r'<div class="stat">', principal)) < 3:
        B("rangée de chiffres clés (3 « stat ») absente")
    src = re.search(r'<h2 id="sources">.*?<ol class="sources">(.*?)</ol>', principal, re.S)
    n_src = len(re.findall(r"<li", src.group(1))) if src else 0
    if n_src < 2:
        B(f"liste « Sources » : 2 sources au moins attendues, {n_src} trouvée(s)")
    if 'class="conclusion-box"' not in principal:
        A("encadré de conclusion absent")
    if not re.search(r"Publié le|Mis à jour le", reste):
        A("date de publication non visible dans la page")
    # Premier paragraphe de chaque partie : court et autonome, donc citable tel quel.
    for titre, suite in re.findall(r"<h2[^>]*>(.*?)</h2>\s*(<[^>]+>.*?)(?=<h2|\Z)", sans_sources, re.S):
        if norm(brut(titre)) == "questions frequentes":
            continue
        p = re.search(r"<p[^>]*>(.*?)</p>", suite, re.S)
        if not suite.lstrip().startswith("<p") or not p:
            A(f"partie « {brut(titre)[:50]} » : ne commence pas par un paragraphe de réponse")
        elif len(brut(p.group(1)).split()) > 90:
            A(f"partie « {brut(titre)[:50]} » : premier paragraphe long ({len(brut(p.group(1)).split())} mots ; réponse directe en 2 phrases attendue)")
    if not any(t.rstrip().endswith("?") for t in h2 + [brut(x) for x in re.findall(r"<h3[^>]*>(.*?)</h3>", sans_sources, re.S)]):
        A("aucun titre formulé comme une question d'internaute")

    # --- Images ----------------------------------------------------------------
    for img in re.findall(r"<img\b[^>]*>", principal):
        if not re.search(r'alt="[^"]+', img):
            B("image sans texte alternatif")
        if "width=" not in img or "height=" not in img:
            B("image sans dimensions (width/height)")
        m = re.search(r'src="([^"?]+)', img)
        if m and not m.group(1).startswith("http") and not (RACINE / "articles" / m.group(1)).exists() \
                and not (RACINE / m.group(1).lstrip("/")).exists():
            B(f"image introuvable : {m.group(1)}")

    # --- Liens -----------------------------------------------------------------
    liens = re.findall(r'<a\s[^>]*href="([^"#][^"]*)"', sans_sources)
    internes = [h for h in liens if h.startswith("/") or h.startswith(SITE)]
    externes = [h for h in liens if h.startswith("http") and "techrepaircontent.com" not in h]
    if len(set(internes)) < 4:
        B(f"maillage : 4 liens internes au moins attendus, {len(set(internes))} trouvé(s)")
    if len([h for h in set(internes) if "/articles/article-" in h]) < 2:
        B("maillage : 2 liens au moins vers d'autres articles du blog")
    if len(externes) > 1:
        B(f"liens sortants dans le corps : 1 au maximum, {len(externes)} trouvé(s)")
    for h in set(internes):
        p = h.replace(SITE, "").split("#")[0].split("?")[0].strip("/")
        if p and not any((RACINE / c).exists() for c in (p, p + ".html", p + "/index.html")):
            B(f"lien interne cassé : {h}")

    # --- Indexation ------------------------------------------------------------
    if page.name not in (RACINE / "sitemap.xml").read_text(encoding="utf-8"):
        B("absent du sitemap.xml")
    if f'"{slug}"' not in (RACINE / "articles.js").read_text(encoding="utf-8"):
        B("absent de articles.js (non listé dans le blog)")
    return bloquants, avertissements


def controler_site():
    """Robots d'indexation et moteurs IA : aucun ne doit être bloqué."""
    pb = []
    robots = (RACINE / "robots.txt").read_text(encoding="utf-8")
    groupes = re.split(r"(?im)^\s*user-agent\s*:", robots)[1:]
    for g in groupes:
        agent = g.splitlines()[0].strip()
        interdit_tout = re.search(r"(?im)^\s*disallow\s*:\s*/\s*$", g)
        if interdit_tout and (agent == "*" or agent in ROBOTS_IA):
            pb.append(f"robots.txt bloque « {agent} » : les moteurs ne peuvent plus lire ni citer le site")
    if "sitemap:" not in robots.lower():
        pb.append("robots.txt : ligne Sitemap absente")
    if not (RACINE / "llms.txt").exists():
        pb.append("llms.txt absent")
    return pb


def main(args):
    tous = "--tous" in args
    slugs = [a for a in args if not a.startswith("--")]
    if tous:
        slugs = sorted(p.stem[len("article-"):] for p in (RACINE / "articles").glob("article-*.html"))
    if not slugs:
        sys.exit(__doc__)
    echec = False
    site = controler_site()
    if site:
        echec = True
        print("SITE\n" + "\n".join(f"  ✗ {p}" for p in site))
    for slug in slugs:
        b, a = controler(slug)
        etat = "✗ NON CONFORME" if b else ("✓ conforme, à relire" if a else "✓ conforme")
        print(f"{slug} : {etat}")
        for p in b:
            print(f"  ✗ BLOQUANT : {p}")
        for p in a:
            print(f"  · avertissement : {p}")
        echec = echec or bool(b)
    sys.exit(1 if echec else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
