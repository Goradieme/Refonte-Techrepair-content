#!/usr/bin/env python3
"""
verifier_article.py — Contrôle qualité d'un brouillon avant publication.

Usage :
    pip install --break-system-packages -q pyspellchecker   (une fois par session)
    python3 _outils/verifier_article.py _outils/brouillons/<slug>.html

Affiche :
  1. les mots inconnus du dictionnaire français (fautes possibles, à relire un par un ;
     noms propres, sigles et anglicismes techniques sont normaux) ;
  2. les problèmes typographiques (espaces, ponctuation, tirets cadratins, guillemets) ;
  3. la liste des sources externes, à ouvrir UNE PAR UNE avec WebFetch pour vérifier
     que la page existe et qu'elle contient bien le chiffre ou l'affirmation citée ;
  4. les liens internes qui ne correspondent à aucune page du site ;
  5. les phrases qui reprennent mot pour mot (6 mots consécutifs) un autre article.
Code de sortie 1 s'il reste un problème typographique ou un lien interne cassé.
"""
import html
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent


def texte(fragment):
    t = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", fragment)
    t = re.sub(r"</?(p|li|ul|ol|h[1-6]|td|th|tr|table|div|br|strong class)[^>]*>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = "\n".join(l.strip() for l in t.split("\n"))
    return html.unescape(t)


def main(chemin):
    src = Path(chemin).read_text(encoding="utf-8")
    brut = texte(src)
    erreurs = 0

    # 1. Orthographe
    try:
        from spellchecker import SpellChecker
        sc = SpellChecker(language="fr")
        mots = re.findall(r"[A-Za-zÀ-ÿœŒ]+(?:-[A-Za-zÀ-ÿœŒ]+)*", brut)
        candidats = {m for m in mots if m.islower() and len(m) > 2}
        pieces = set()
        for m in candidats:
            pieces.update(p for p in re.split(r"[-']", m) if len(p) > 2)
        inconnus = sorted(sc.unknown(pieces))
        print(f"1. Mots à vérifier ({len(inconnus)}) :")
        print("   " + (", ".join(inconnus) if inconnus else "aucun"))
    except ImportError:
        print("1. pyspellchecker absent : pip install --break-system-packages -q pyspellchecker")

    # 2. Typographie
    print("2. Typographie :")
    regles = [
        (r"\w[;:!?](?=\s|$)", "espace manquante avant ; : ! ?"),
        (r"  +", "double espace"),
        (r"—", "tiret cadratin (à remplacer par une virgule, des parenthèses ou deux points)"),
        (r"\s[,.]", "espace avant une virgule ou un point"),
        (r"«\S|\S»", "espace manquante à l'intérieur des guillemets « »"),
        (r'(?<![=\w])"[^"<>]{2,80}"', "guillemets droits dans le texte (utiliser « »)"),
        (r"\b(\w+) \1\b", "mot répété"),
    ]
    lignes = [l for l in brut.split("\n") if l.strip()]
    for motif, libelle in regles:
        for l in lignes:
            for m in re.finditer(motif, l):
                if libelle.startswith("espace manquante avant") and re.search(r"https?|\d:\d", l[max(0, m.start()-6):m.end()+2]):
                    continue
                if libelle.startswith("espace manquante avant") and l.rfind("«", 0, m.start()) > l.rfind("»", 0, m.start()):
                    continue  # titre cité en langue étrangère
                extrait = l[max(0, m.start() - 30):m.end() + 30].strip()
                print(f"   ✗ {libelle} : …{extrait}…")
                erreurs += 1
    if not erreurs:
        print("   aucun problème détecté")

    # 3. Sources externes
    ext = re.findall(r'<a href="(https?://[^"]+)"[^>]*>(.*?)</a>', src)
    print(f"3. Sources externes à vérifier avec WebFetch ({len(ext)}) :")
    for url, lib in ext:
        print(f"   - {texte(lib).strip()} → {url}")

    # 4. Liens internes
    print("4. Liens internes :")
    for lien in sorted(set(re.findall(r'href="(/[^"#]*)"', src))):
        chemin_l = lien.strip("/") or "index"
        candidats = [RACINE / chemin_l, RACINE / f"{chemin_l}.html", RACINE / chemin_l / "index.html"]
        ok = any(c.is_file() for c in candidats)
        print(f"   {'✓' if ok else '✗'} {lien}")
        erreurs += 0 if ok else 1

    # 5. Formulations déjà employées dans d'autres articles
    def shingles(txt, n=6):
        m = re.findall(r"[a-zà-ÿœ0-9']+", txt.lower())
        return {" ".join(m[i:i + n]) for i in range(len(m) - n + 1)}
    slug = Path(chemin).stem
    deja = {}
    for autre in sorted((RACINE / "articles").glob("article-*.html")):
        if autre.stem == f"article-{slug}":
            continue
        h = autre.read_text(encoding="utf-8")
        h = re.sub(r"<!-- maillage:debut -->[\s\S]*?<!-- maillage:fin -->", " ", h)
        corps = re.search(r"<main[\s\S]*?</main>|<article[\s\S]*?</article>", h)
        for s in shingles(texte(corps.group(0) if corps else h)):
            deja.setdefault(s, autre.stem.replace("article-", ""))
    # Libellés de structure communs au gabarit : autorisés.
    permis = ("questions fréquentes", "points clés", "en résumé", "à lire aussi", "lire l'article")
    repris = []
    for phrase in [l for l in brut.split("\n") if len(l.split()) >= 6]:
        for s in shingles(phrase):
            if s in deja and not any(p in s for p in permis):
                repris.append((phrase.strip(), deja[s], s))
                break
    print(f"5. Formulations déjà utilisées dans d'autres articles ({len(repris)}) :")
    for phrase, src, s in repris[:25]:
        print(f"   ✗ « {phrase[:110]}{'…' if len(phrase) > 110 else ''} »")
        print(f"     passage commun « {s} » (déjà dans {src})")
    if not repris:
        print("   aucune")
    erreurs += len(repris)

    sys.exit(1 if erreurs else 0)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
