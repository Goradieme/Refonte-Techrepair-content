#!/usr/bin/env python3
"""
sitemap.py — Régénère sitemap.xml à partir des pages réellement publiées.

    python3 _outils/sitemap.py            réécrit sitemap.xml
    python3 _outils/sitemap.py --verifier n'écrit rien ; sort 1 si sitemap.xml n'est pas à jour

Règles :
  - une entrée par page HTML indexable du site : pages racine, articles, livres blancs ;
    l'adresse retenue est la balise canonique de la page ;
  - sont exclues : les pages en noindex, sans canonique vers elle-même, les fichiers de
    vérification Google, l'administration et les pages d'outils internes ;
  - <lastmod> = date de la dernière modification réelle de la page : fichier modifié et non
    encore validé → aujourd'hui ; sinon date du dernier commit qui l'a touché ; si l'historique
    est tronqué (clone superficiel) et ne permet pas de le savoir, la date déjà présente dans
    sitemap.xml est conservée ;
  - pour les articles et les livres blancs, l'image de couverture (og:image) est déclarée avec
    l'extension image de Google, pour Google Images ;
  - seul le domaine www.techrepaircontent.com figure ici : un sitemap ne peut pas déclarer les
    pages d'un autre sous-domaine (demo.techrepaircontent.com a besoin du sien).

Appelé automatiquement par publier_article.py et publier_livre_blanc.py.
"""
import html
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = "https://www.techrepaircontent.com"
EXCLURE = re.compile(r"^(google[0-9a-f]+\.html|404\.html|editeur-seo\.html)$")


def _git(*args) -> str:
    try:
        return subprocess.run(["git", "-C", str(RACINE), *args], capture_output=True,
                              text=True, timeout=30).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def _dates_connues() -> dict:
    s = (RACINE / "sitemap.xml").read_text(encoding="utf-8") if (RACINE / "sitemap.xml").exists() else ""
    return dict(re.findall(r"<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", s))


def _derniere_modif(chemin: str, ancienne: str | None) -> str:
    if _git("status", "--porcelain", "--", chemin):
        return date.today().isoformat()
    ligne = _git("log", "-1", "--format=%H %cs", "--", chemin)
    if not ligne:
        return ancienne or date.today().isoformat()
    sha, jour = ligne.split()
    bords = (RACINE / ".git" / "shallow")
    if bords.exists() and sha in bords.read_text():
        return ancienne or jour          # commit de bord d'un clone superficiel : date inconnue
    return jour


def pages():
    fichiers = sorted(RACINE.glob("*.html")) + sorted((RACINE / "articles").glob("article-*.html")) \
        + sorted((RACINE / "livres-blancs").glob("*.html"))
    for f in fichiers:
        rel = f.relative_to(RACINE).as_posix()
        if EXCLURE.match(f.name):
            continue
        s = f.read_text(encoding="utf-8", errors="ignore")
        tete = s.split("</head>", 1)[0]
        if re.search(r'<meta name="robots" content="[^"]*noindex', tete):
            continue
        can = re.search(r'<link rel="canonical" href="([^"]+)"', tete)
        if not can or not can.group(1).startswith(SITE):
            continue
        img = None
        if rel.startswith(("articles/", "livres-blancs/")) and f.name != "index.html":
            m = re.search(r'<meta property="og:image" content="([^"]+)"', tete)
            img = m.group(1) if m and m.group(1).startswith(SITE) else None
        yield rel, html.unescape(can.group(1)), img


def generer() -> str:
    connues = _dates_connues()
    vues, lignes = set(), []
    for rel, loc, img in pages():
        if loc in vues:
            continue
        vues.add(loc)
        lastmod = _derniere_modif(rel, connues.get(loc))
        extra = f"<image:image><image:loc>{html.escape(img)}</image:loc></image:image>" if img else ""
        lignes.append(f"  <url><loc>{html.escape(loc)}</loc><lastmod>{lastmod}</lastmod>{extra}</url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
            + "\n".join(lignes) + "\n</urlset>\n")


def main(args):
    neuf = generer()
    cible = RACINE / "sitemap.xml"
    if "--verifier" in args:
        actuel = cible.read_text(encoding="utf-8") if cible.exists() else ""
        a = set(re.findall(r"<loc>([^<]+)</loc>", actuel))
        n = set(re.findall(r"<loc>([^<]+)</loc>", neuf))
        if a != n:
            print("sitemap.xml pas à jour. Manquantes :", sorted(n - a), "En trop :", sorted(a - n))
            sys.exit(1)
        print(f"sitemap.xml à jour ({len(n)} adresses).")
        return
    cible.write_text(neuf, encoding="utf-8")
    print(f"sitemap.xml régénéré : {neuf.count('<url>')} adresses.")


if __name__ == "__main__":
    main(sys.argv[1:])
