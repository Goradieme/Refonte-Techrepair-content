#!/usr/bin/env python3
"""
maillage.py — Maillage interne automatique du blog.

Ajoute (ou met à jour) dans CHAQUE article un bloc « À lire aussi » de 3 liens vers
les articles les plus proches : même catégorie, mots communs dans le titre et le
mot-clé, puis les plus récents. Le bloc est placé à la fin du contenu, entre les
marqueurs <!-- maillage:debut --> et <!-- maillage:fin -->, et réécrit à chaque
publication : les anciens articles pointent ainsi automatiquement vers les nouveaux.

Usage : python3 _outils/maillage.py          (appelé aussi par publier_article.py)
"""
import html
import re
import unicodedata
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
LIBELLES = {"seo": "SEO", "saas": "SaaS B2B", "ecommerce": "E-commerce", "cyber": "Cybersécurité",
            "fintech": "Fintech", "rh": "RH Tech"}
# Catégories voisines : un lien croisé utile quand la catégorie a peu d'articles.
VOISINES = {"seo": {"saas", "ecommerce"}, "saas": {"seo", "rh"}, "ecommerce": {"seo", "fintech"},
            "cyber": {"fintech", "saas"}, "fintech": {"cyber", "ecommerce"}, "rh": {"saas", "cyber"}}
VIDES = set("""le la les un une des du de d l et ou en à au aux pour par sur dans avec
sans ce ces cette votre vos nos notre qui que quoi comment pourquoi est sont guide complet
2025 2026 b2b ia""".split())
DEBUT, FIN = "<!-- maillage:debut -->", "<!-- maillage:fin -->"


def lire_articles():
    src = (RACINE / "articles.js").read_text(encoding="utf-8")
    articles = []
    for bloc in re.findall(r"\{([^{}]*)\}", src):
        champs = dict(re.findall(r'(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"', bloc))
        if "lien" in champs:
            articles.append({k: v.replace('\\"', '"') for k, v in champs.items()})
    return articles


def mots(texte):
    t = unicodedata.normalize("NFKD", texte.lower()).encode("ascii", "ignore").decode()
    return {m for m in re.findall(r"[a-z0-9]{3,}", t) if m not in VIDES}


def proches(a, tous, n=3):
    ma = mots(a["titre"] + " " + a.get("motCle", ""))
    def score(b):
        s = 0
        if b["categorie"] == a["categorie"]:
            s += 6
        elif b["categorie"] in VOISINES.get(a["categorie"], ()):
            s += 2
        s += 2 * len(ma & mots(b["titre"] + " " + b.get("motCle", "")))
        return (s, b["date"])
    autres = [b for b in tous if b["lien"] != a["lien"]]
    return sorted(autres, key=score, reverse=True)[:n]


def bloc(liste):
    cartes = "".join(
        f'<a class="mi-carte" href="/{html.escape(b["lien"])}">'
        f'<span class="mi-cat">{LIBELLES.get(b["categorie"], b["categorie"])}</span>'
        f'<span class="mi-titre">{html.escape(b["titre"])}</span>'
        f'<span class="mi-lire">Lire l\'article · {html.escape(b.get("lecture", ""))}</span></a>'
        for b in liste)
    return f"""{DEBUT}
<section class="maillage" aria-label="Articles liés">
<style>
.maillage{{margin:44px 0 8px;padding-top:28px;border-top:1px solid #e2e8f0;font-family:inherit}}
.maillage h2{{font-size:20px!important;font-weight:800;color:#0F1B3D;margin:0 0 16px!important}}
.mi-grille{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}}
.mi-carte{{display:flex;flex-direction:column;gap:8px;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;background:#fff;text-decoration:none!important;transition:border-color .2s,box-shadow .2s,transform .2s}}
.mi-carte:hover{{border-color:#1A56DB;box-shadow:0 8px 24px rgba(26,86,219,.10);transform:translateY(-2px)}}
.mi-cat{{font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#1342b0}}
.mi-titre{{font-size:14.5px;font-weight:700;line-height:1.4;color:#0F1B3D}}
.mi-lire{{margin-top:auto;font-size:12px;color:#64748b}}
</style>
<h2>À lire aussi</h2>
<div class="mi-grille">{cartes}</div>
</section>
{FIN}"""


def main():
    tous = lire_articles()
    for a in tous:
        page = RACINE / a["lien"]
        if not page.exists():
            continue
        h = page.read_text(encoding="utf-8")
        nouveau = bloc(proches(a, tous))
        if DEBUT in h:
            h = re.sub(re.escape(DEBUT) + r"[\s\S]*?" + re.escape(FIN), lambda _: nouveau, h)
        elif "</main>" in h:
            h = h.replace("</main>", nouveau + "\n</main>", 1)
        elif "</article>" in h:
            h = h.replace("</article>", nouveau + "\n</article>", 1)
        else:
            print(f"! point d'insertion introuvable : {page.name}")
            continue
        page.write_text(h, encoding="utf-8")
    print(f"Maillage interne mis à jour sur {len(tous)} articles.")


if __name__ == "__main__":
    main()
