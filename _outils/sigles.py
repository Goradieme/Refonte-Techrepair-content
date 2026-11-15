#!/usr/bin/env python3
"""
sigles.py — Lexique des sigles d'un article (règle de Goradieme du 15/11/2026 : tout sigle
est expliqué pour un lecteur novice).

Deux niveaux, complémentaires :
  1. à la rédaction, chaque sigle est développé entre parenthèses à sa première apparition
     (voir CONSIGNES-REDACTION.md) ;
  2. ce script ajoute automatiquement, avant la FAQ, un encadré « Sigles utilisés dans cet
     article » qui reprend tous les sigles du glossaire `_outils/sigles.json` présents dans
     le texte. Il est appelé par publier_article.py ; on peut aussi le relancer à la main :

    python3 _outils/sigles.py <slug> [<slug> ...]     régénère l'encadré de ces articles
    python3 _outils/sigles.py --tous                  régénère l'encadré de tout le blog

Un sigle absent du glossaire est signalé par controle_seo.py : l'ajouter à sigles.json
(ou à sa liste « ignorer » s'il n'a pas à être défini).
"""
import html
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
_G = json.loads((RACINE / "_outils" / "sigles.json").read_text(encoding="utf-8"))
GLOSSAIRE, IGNORER = _G["sigles"], set(_G["ignorer"])
DEBUT, FIN = "<!-- lexique:debut -->", "<!-- lexique:fin -->"


def _motif(sigle: str):
    return re.compile(r"(?<![\w/.\-])" + re.escape(sigle) + ("s?" if sigle == "KPI" else "") + r"(?![\w\-])")


def zone_redactionnelle(page: str):
    """Bornes du texte de l'article : après le H1, avant les sources et le maillage."""
    a = page.index("</h1>") + 5 if "</h1>" in page else 0
    m = re.search(r'<h2 id="sources"|<!-- maillage:debut -->|<aside|<footer', page[a:])
    return a, (a + m.start() if m else len(page))


def texte_brut(fragment: str) -> str:
    fragment = re.sub(re.escape(DEBUT) + r".*?" + re.escape(FIN), " ", fragment, flags=re.S)
    fragment = re.sub(r"<(script|style)\b.*?</\1>", " ", fragment, flags=re.S)
    return html.unescape(re.sub(r"<[^>]+>", " ", fragment))


def sigles_utilises(fragment: str):
    """Sigles du glossaire présents dans le texte, dans l'ordre de première apparition."""
    t = texte_brut(fragment)
    trouves = [(m.start(), s) for s in GLOSSAIRE for m in [_motif(s).search(t)] if m]
    return [s for _, s in sorted(trouves)]


def sigles_inconnus(fragment: str):
    t = texte_brut(fragment)
    vus = {w for w in re.findall(r"(?<![\w/.\-])[A-Z][A-Z0-9]{1,5}(?![\w\-])", t)}
    connus = set(GLOSSAIRE) | IGNORER | {s + "s" for s in GLOSSAIRE}
    return sorted(w for w in vus if w not in connus and not re.fullmatch(r"[A-Z]\d+|[IVXLC]+", w))


def bloc_lexique(sigles) -> str:
    lignes = "\n".join(
        f'      <dt style="float:left;clear:left;min-width:86px;font-weight:800;color:#0B1633">{html.escape(s)}</dt>'
        f'<dd style="margin:0 0 7px 96px">{html.escape(GLOSSAIRE[s]["developpe"])}</dd>'
        for s in sorted(sigles, key=str.lower))
    return (
        f"{DEBUT}\n"
        '    <div class="lexique" style="margin:40px 0 8px;padding:22px 26px 16px;background:#F4F7FC;'
        'border:1px solid #DCE5F3;border-radius:14px;font-size:15px;line-height:1.55;color:#33415C">\n'
        '      <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:1.4px;'
        'text-transform:uppercase;color:#1A56DB">Sigles utilisés dans cet article</p>\n'
        '      <dl style="margin:0;overflow:hidden">\n'
        f"{lignes}\n"
        "      </dl>\n"
        "    </div>\n"
        f"    {FIN}\n")


def inserer_lexique(page: str) -> str:
    """Retire l'ancien encadré, recalcule les sigles et réinsère l'encadré avant la FAQ."""
    page = re.sub(r"[ \t]*" + re.escape(DEBUT) + r".*?" + re.escape(FIN) + r"\n?", "", page, flags=re.S)
    a, b = zone_redactionnelle(page)
    sigles = sigles_utilises(page[a:b])
    if not sigles:
        return page
    corps = page[a:b]
    m = (re.search(r'[ \t]*<h2[^>]*id="faq"', corps)
         or re.search(r"[ \t]*<h2[^>]*>\s*(?:FAQ|Questions fréquentes)", corps))
    pos = a + m.start() if m else b - (len(corps) - len(corps.rstrip(" \t")))
    return page[:pos] + "    " + bloc_lexique(sigles) + page[pos:]


def main(args):
    slugs = [x for x in args if not x.startswith("--")]
    if "--tous" in args:
        slugs = sorted(p.stem[len("article-"):] for p in (RACINE / "articles").glob("article-*.html"))
    if not slugs:
        sys.exit(__doc__)
    for slug in slugs:
        f = RACINE / "articles" / f"article-{slug}.html"
        page = f.read_text(encoding="utf-8")
        neuf = inserer_lexique(page)
        if neuf != page:
            f.write_text(neuf, encoding="utf-8")
        a, b = zone_redactionnelle(neuf)
        inc = sigles_inconnus(neuf[a:b])
        print(f"{slug} : {len(sigles_utilises(neuf[a:b]))} sigle(s) au lexique"
              + (f" ; hors glossaire : {', '.join(inc)}" if inc else ""))


if __name__ == "__main__":
    main(sys.argv[1:])
