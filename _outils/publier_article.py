#!/usr/bin/env python3
"""
publier_article.py — Assemble un article de blog TechRepair Content et met à jour
le blog (articles.js, liste statique de blog.html), sitemap.xml et feed.xml.

Usage :
    python3 _outils/publier_article.py _outils/brouillons/<slug>.json

Le fichier JSON contient les métadonnées ; le corps de l'article est dans un
fichier HTML voisin (<slug>.html) : uniquement le contenu de <main>, avec des
<h2 id="..."> pour chaque partie et, en option, une FAQ en <div class="faq-item">.

Le script refuse de publier si le corps fait moins de 1800 ou plus de 2500 mots.
Le dossier _outils/ n'est pas publié par GitHub Pages (préfixe « _ »).
"""
import html
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = "https://www.techrepaircontent.com"
MIN_MOTS, MAX_MOTS = 1800, 2500

CATEGORIES = {
    "seo":       ("📊 SEO", "background:#EFF6FF;color:var(--blue-dark)", "SEO"),
    "saas":      ("☁️ SaaS B2B", "background:#EFF6FF;color:var(--blue-dark)", "SaaS B2B"),
    "ecommerce": ("🛒 E-commerce Tech", "background:#FFF7ED;color:#C2410C", "E-commerce"),
    "cyber":     ("🔒 Cybersécurité", "background:#FEF2F2;color:#B91C1C", "Cybersécurité"),
    "fintech":   ("💳 Fintech", "background:#ECFDF5;color:#047857", "Fintech"),
    "rh":        ("👥 RH Tech", "background:#F5F3FF;color:var(--purple)", "RH Tech"),
}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]


def texte_brut(fragment: str) -> str:
    sans = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", fragment)
    sans = re.sub(r"<[^>]+>", " ", sans)
    return html.unescape(re.sub(r"\s+", " ", sans)).strip()


def compter_mots(fragment: str) -> int:
    return len(re.findall(r"[\wÀ-ÿ'’-]+", texte_brut(fragment)))


def js_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def main(chemin_meta: str) -> None:
    meta_path = Path(chemin_meta)
    m = json.loads(meta_path.read_text(encoding="utf-8"))
    corps = meta_path.with_suffix(".html").read_text(encoding="utf-8").strip()

    slug, cat = m["slug"], m["categorie"]
    if cat not in CATEGORIES:
        sys.exit(f"Catégorie inconnue : {cat}")
    badge, badge_style, cat_nom = CATEGORIES[cat]
    date = m["date"]
    d = datetime.strptime(date, "%Y-%m-%d")
    date_fr = f"{d.day}{'er' if d.day == 1 else ''} {MOIS[d.month - 1]} {d.year}"
    fichier = f"article-{slug}.html"
    url = f"{SITE}/articles/{fichier}"

    # --- Contrôles qualité -------------------------------------------------
    mots = compter_mots(corps)
    if not (MIN_MOTS <= mots <= MAX_MOTS):
        sys.exit(f"Longueur hors limites : {mots} mots (attendu {MIN_MOTS}-{MAX_MOTS}).")
    if len(m["metaDesc"]) > 160:
        sys.exit(f"Meta description trop longue ({len(m['metaDesc'])} > 160 caractères).")
    title_tag = f"{m['titreSeo']} | TechRepair Content"
    if len(m["titreSeo"]) > 65:
        sys.exit(f"Titre SEO trop long ({len(m['titreSeo'])} > 65 caractères).")
    if (RACINE / "articles" / fichier).exists() and not m.get("remplacer"):
        sys.exit(f"{fichier} existe déjà.")
    if "<h1" in corps:
        sys.exit("Le corps ne doit pas contenir de <h1> (il est généré par le gabarit).")
    lecture = f"{max(1, round(mots / 200))} min"

    # --- Sommaire --------------------------------------------------------------
    h2s = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', corps)
    if len(h2s) < 4:
        sys.exit("Au moins 4 <h2 id=...> sont attendus.")
    courts = m.get("sommaireCourt", {})
    mini_toc = "\n".join(
        f'        <a href="#{i}">{courts.get(i, texte_brut(t))}</a>' for i, t in h2s)

    # --- Données structurées ---------------------------------------------------
    image = m.get("image")
    graph = [{
        "@type": "BlogPosting",
        "headline": m["titre"],
        "description": m["metaDesc"],
        "datePublished": date,
        "dateModified": m.get("dateModification", date),
        "author": {"@type": "Person", "name": "Goradieme", "url": f"{SITE}/apropos"},
        "publisher": {"@type": "Organization", "name": "TechRepair Content", "url": f"{SITE}/"},
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "inLanguage": "fr-FR",
        "keywords": m["motCle"],
        "articleSection": cat_nom,
        "wordCount": mots,
    }]
    if image:
        graph[0]["image"] = f"{SITE}/{image}"
    faq = re.findall(
        r'<div class="faq-item">\s*<h3[^>]*>(.*?)</h3>\s*([\s\S]*?)</div>', corps)
    if faq:
        graph.append({
            "@type": "FAQPage",
            "mainEntity": [{
                "@type": "Question", "name": texte_brut(q),
                "acceptedAnswer": {"@type": "Answer", "text": texte_brut(r)},
            } for q, r in faq],
        })
    graph.append({
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE}/blog"},
            {"@type": "ListItem", "position": 3, "name": m["filAriane"], "item": url},
        ],
    })
    jsonld = json.dumps({"@context": "https://schema.org", "@graph": graph},
                        ensure_ascii=False, indent=2)

    # --- Assemblage --------------------------------------------------------------
    gabarit = (RACINE / "_outils" / "gabarit-article.html").read_text(encoding="utf-8")
    cta = m.get("ctaLateral", {})
    esc = lambda s: html.escape(s, quote=True)
    valeurs = {
        "TITLE_TAG": esc(title_tag),
        "META_DESC": esc(m["metaDesc"]),
        "URL": url,
        "TITRE": esc(m["titre"]),
        "OG_IMAGE": (f'<meta property="og:image" content="{SITE}/{image}"/>\n' if image else ""),
        "DATE": date,
        "JSONLD": jsonld,
        "FIL": esc(m["filAriane"]),
        "BADGE_STYLE": badge_style,
        "BADGE": badge,
        "H1": esc(m["h1"]),
        "DATE_FR": date_fr,
        "LECTURE": lecture.replace(" min", " min"),
        "COVER": (f'  <div class="ah-cover"><img src="{Path(image).name}" alt="{esc(m.get("imageAlt", m["titre"]))}" width="1200" height="630" style="max-height:360px;object-fit:cover"/></div>\n'
                  if image else ""),
        "CORPS": corps,
        "MINI_TOC": mini_toc,
        "SIDEBAR_CTA_TITRE": cta.get("titre", "Besoin de contenus qui se classent ?"),
        "SIDEBAR_CTA_TEXTE": cta.get("texte", "Articles SEO sourcés pour le SaaS, la tech et l'e-commerce B2B."),
        "SIDEBAR_CTA_LIEN": cta.get("lien", "/devis"),
        "SIDEBAR_CTA_BOUTON": cta.get("bouton", "Demander un devis"),
    }
    page = gabarit
    for k, v in valeurs.items():
        page = page.replace("{{" + k + "}}", v)
    if "{{" in page:
        sys.exit("Variable de gabarit non remplacée : " + re.search(r"\{\{\w+\}\}", page).group(0))
    (RACINE / "articles" / fichier).write_text(page, encoding="utf-8")

    # --- articles.js -----------------------------------------------------------
    aj = RACINE / "articles.js"
    contenu = aj.read_text(encoding="utf-8")
    if f'"articles/{fichier}"' not in contenu:
        champs = [
            ("titre", m["titre"]), ("extrait", m["extrait"]), ("auteur", "Goradieme"),
            ("date", date), ("categorie", cat), ("lecture", lecture),
            ("lien", f"articles/{fichier}"),
        ]
        if image:
            champs.append(("image", image))
        champs += [("slug", slug), ("motCle", m["motCle"]), ("metaDesc", m["metaDesc"])]
        bloc = "  {\n" + ",\n".join(f"    {k + ':':<10}{js_str(v)}" for k, v in champs) + "\n  },\n"
        fin = contenu.rindex("];")
        avant = contenu[:fin].rstrip()
        if not avant.endswith(",") and not avant.endswith("["):
            avant += ","
        contenu = avant + "\n" + bloc + "];\n"
        aj.write_text(contenu, encoding="utf-8")

    # --- Liste statique de blog.html (liens crawlables sans JS) ----------------
    bh = RACINE / "blog.html"
    b = bh.read_text(encoding="utf-8")
    if f'href="articles/{fichier}"' not in b:
        ligne = f'      <li><a href="articles/{fichier}">{esc(m["titre"])}</a></li>\n'
        b = b.replace("    </ul>\n    <div class=\"articles-grid\"", ligne + "    </ul>\n    <div class=\"articles-grid\"", 1)
        bh.write_text(b, encoding="utf-8")

    # --- sitemap.xml -------------------------------------------------------------
    sm = RACINE / "sitemap.xml"
    s = sm.read_text(encoding="utf-8")
    if url not in s:
        ligne = f"  <url><loc>{url}</loc><lastmod>{date}</lastmod><priority>0.9</priority></url>\n"
        ancre = f"  <url><loc>https://demo."
        s = s.replace(ancre, ligne + ancre, 1) if ancre in s else s.replace("</urlset>", ligne + "</urlset>")
        sm.write_text(s, encoding="utf-8")

    # --- feed.xml ----------------------------------------------------------------
    fd = RACINE / "feed.xml"
    f = fd.read_text(encoding="utf-8")
    if f"<link>{url}</link>" not in f:
        pub = format_datetime(d.replace(hour=7, tzinfo=timezone.utc), usegmt=True)
        item = (
            "    <item>\n"
            f"      <title>{esc(m['titre'])}</title>\n"
            f"      <link>{url}</link>\n"
            f'      <guid isPermaLink="true">{url}</guid>\n'
            f"      <pubDate>{pub}</pubDate>\n"
            f"      <description>{esc(m['extrait'])}</description>\n"
            + (f'      <enclosure url="{SITE}/{image}" type="image/jpeg"/>\n' if image else "")
            + "    </item>\n"
        )
        f = f.replace("    <item>", item + "    <item>", 1)
        f = re.sub(r"<lastBuildDate>.*?</lastBuildDate>",
                   f"<lastBuildDate>{format_datetime(datetime.now(timezone.utc), usegmt=True)}</lastBuildDate>", f)
        fd.write_text(f, encoding="utf-8")

    # --- Calendrier --------------------------------------------------------------
    cal_path = RACINE / "_outils" / "calendrier-editorial.json"
    if cal_path.exists():
        cal = json.loads(cal_path.read_text(encoding="utf-8"))
        for sujet in cal:
            if sujet["slug"] == slug:
                sujet["statut"] = "publie"
                sujet["date"] = date
        cal_path.write_text(
            "[\n" + ",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in cal) + "\n]\n",
            encoding="utf-8")

    print(f"OK : articles/{fichier} — {mots} mots, {lecture} de lecture, "
          f"{len(h2s)} parties, {len(faq)} questions FAQ.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
