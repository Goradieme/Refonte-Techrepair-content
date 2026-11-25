#!/usr/bin/env python3
"""
relecture.py — Relecture orthographique et grammaticale des articles (règle de Goradieme
du 25/11/2026 : contrôler les fautes de toute nature dans tous les articles, actuels et à venir).

    python3 _outils/relecture.py <slug> [<slug>…]   relit les articles nommés
    python3 _outils/relecture.py --tous             relit tous les articles
    option --json                                   sortie JSON (pour un traitement automatique)
    option --cache=<dossier>                        garde le résultat de chaque article (relance sans tout refaire)

Deux passes :
  1. LanguageTool (français) : orthographe, accords, conjugaison, homophones (ces/ses,
     a/à, et/est…), ponctuation, tournures. Le moteur est téléchargé à la première
     exécution par language_tool_python (Java 17 requis) ; dans le conteneur de rédaction,
     où ce téléchargement est bloqué, seule la passe 2 tourne et le contrôle complet
     a lieu dans GitHub Actions (.github/workflows/relecture.yml).
  2. Règles maison, sans dépendance : fautes déjà relevées sur le site (anglicismes,
     mots inexistants, mots répétés, promesses invérifiables…).

Textes relus : titre SEO, meta description, H1 et tout le texte rédactionnel (introduction,
corps, FAQ, conclusion) ; pas les sources, le menu ni le pied de page.

Faux positifs : les déclarer dans _outils/relecture-exceptions.json (mots admis, règles
LanguageTool désactivées, passages admis). Ne jamais y mettre une vraie faute.

Sortie 1 si au moins une faute bloquante reste à corriger. Les points « à vérifier » (style,
ponctuation conseillée, règles souvent fausses) ne bloquent pas mais doivent être relus un par un.
"""
import html
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "_outils"))
from sigles import GLOSSAIRE, DEBUT, FIN, zone_redactionnelle  # noqa: E402

EXC = json.loads((RACINE / "_outils" / "relecture-exceptions.json").read_text(encoding="utf-8"))
MOTS_ADMIS = {m.lower() for m in EXC.get("mots", [])} | {s.lower() for s in GLOSSAIRE}
REGLES_OFF = set(EXC.get("regles_desactivees", []))
PASSAGES_ADMIS = EXC.get("passages_admis", [])
# Règles LanguageTool trop souvent fausses ou de pur style : signalées « à vérifier »,
# sans bloquer la publication. Tout le reste (orthographe, accords, conjugaison…) bloque.
A_VERIFIER = set(EXC.get("regles_a_verifier", []))

# --- Passe 2 : règles maison (fautes constatées sur le site) ----------------------------
MAISON = [
    (r"\bcorrectrices?\b", "« correctrice » n'existe pas dans ce sens : écrire « corrective(s) »"),
    (r"\bproduct marketing\b", "anglicisme : « marketing produit » ou « responsable marketing produit »"),
    (r"\b(\w{3,})\s+\1\b", "mot répété"),
    # (motif, message, bloquant ?)
    (r"\bau niveau de\b", "tournure lourde « au niveau de » : préférer « pour », « dans », « chez »"),
    (r"\bimpacter\b|\bimpacté(e|s|es)?\b", "anglicisme « impacter » : « toucher », « affecter », « peser sur »"),
    (r"\bmalgré que\b", "« malgré que » est fautif : « bien que » + subjonctif"),
    (r"\bsuite à\b", "« suite à » : préférer « après », « à la suite de »"),
    (r"\bse rappeler de\b", "« se rappeler quelque chose » (sans « de »)"),
    (r"\bpallier à\b", "« pallier quelque chose » (sans « à »)"),
    (r"\bbasé sur\b|\bbasée sur\b|\bbasés sur\b|\bbasées sur\b", "« fondé sur » est plus juste que « basé sur »"),
    (r"\bopportunité de\b", "anglicisme possible : « occasion de »"),
    (r"\b(?:garantit|garantissent|assure|assurent) (?:une |la )?(?:première place|position 1|top 1)\b",
     "promesse invérifiable"),
    (r"\s,", "espace avant une virgule"),
    (r"[.!?]\s+[a-zàâéèêîôûç]", "minuscule après un point"),
]


def textes(slug: str):
    """[(zone, texte)] à relire, un bloc par paragraphe pour donner ses phrases à LanguageTool."""
    page = (RACINE / "articles" / f"article-{slug}.html").read_text(encoding="utf-8")
    tete = page.split("</head>", 1)[0]
    blocs = []
    t = re.search(r"<title>(.*?)</title>", tete, re.S)
    if t:
        blocs.append(("titre SEO", html.unescape(t.group(1)).split(" | ")[0]))
    d = re.search(r'<meta name="description" content="([^"]*)"', tete)
    if d:
        blocs.append(("meta description", html.unescape(d.group(1))))
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
    if h1:
        blocs.append(("H1", html.unescape(re.sub(r"<[^>]+>", "", h1.group(1)))))
    a, b = zone_redactionnelle(page)
    corps = page[a:b]
    corps = re.sub(re.escape(DEBUT) + r".*?" + re.escape(FIN), " ", corps, flags=re.S)
    corps = re.sub(r"<(script|style)\b.*?</\1>", " ", corps, flags=re.S)
    corps = re.sub(r'<div class="(?:stat|toc-box)[^"]*">.*?</div>\s*</div>|<div class="toc-box">.*?</div>', " ", corps, flags=re.S)
    # titre d'encadré en <strong> suivi du texte : séparer pour ne pas coller les mots
    corps = re.sub(r"(</(?:strong|b|span|em)>)(?=[A-ZÀ-Ý])", r"\1. ", corps)
    corps = re.sub(r"</?(p|li|h[1-6]|td|th|tr|div|dt|dd|blockquote|ol|ul|table|br|figcaption|summary)\b[^>]*>", "\n\n", corps)
    corps = html.unescape(re.sub(r"<[^>]+>", "", corps)).replace(" ", " ").replace(" ", " ")
    for para in re.split(r"\n\s*\n", corps):
        para = " ".join(para.split())
        if len(para) > 2 and re.search(r"[a-zà-ÿ]", para):
            blocs.append(("texte", para))
    return blocs


def a_verifier(regle: str) -> bool:
    """Règle déclarée « à vérifier » (nom exact, ou préfixe terminé par *)."""
    return regle in A_VERIFIER or any(r.endswith("*") and regle.startswith(r[:-1]) for r in A_VERIFIER)


def admis(passage: str) -> bool:
    return any(p in passage for p in PASSAGES_ADMIS)


def passe_maison(blocs):
    out = []
    for zone, t in blocs:
        for motif, msg in MAISON:
            for m in re.finditer(motif, t, flags=0 if "[a-z" in motif else re.I):
                if motif.startswith(r"[.!?]") and re.search(r"\b(?:etc|ex|cf|p|n°|art)\.\s+\S$", t[:m.end()]):
                    continue
                ctx = t[max(0, m.start() - 40): m.end() + 40]
                if not admis(ctx):
                    niveau = "a_verifier" if any(k in msg for k in ("préférer", "plus juste", "possible")) else "faute"
                    out.append({"zone": zone, "regle": "MAISON", "message": msg, "extrait": ctx,
                                "suggestions": [], "niveau": niveau})
    return out


_OUTIL = []


def _outil():
    if not _OUTIL:
        try:
            import language_tool_python
            _OUTIL.append(language_tool_python.LanguageTool("fr", config={"maxSpellingSuggestions": 3}))
        except Exception as e:  # moteur indisponible (téléchargement bloqué, Java absent…)
            print(f"[relecture] LanguageTool indisponible ({type(e).__name__}) : seule la passe maison a tourné.",
                  file=sys.stderr)
            _OUTIL.append(None)
    return _OUTIL[0]


def passe_languagetool(blocs):
    outil = _outil()
    if outil is None:
        return None
    out = []
    for zone, t in blocs:
        for m in outil.check(t):
            regle = m.rule_id
            if regle in REGLES_OFF or m.category in REGLES_OFF:
                continue
            mot = t[m.offset: m.offset + m.error_length]
            if m.rule_issue_type == "misspelling" or regle.startswith(("FR_SPELLING", "HUNSPELL", "MORFOLOGIK")):
                if (mot.lower() in MOTS_ADMIS or re.search(r"[A-Z].*[A-Z]|\d|[a-z][A-Z]", mot)
                        or (mot[:1].isupper() and m.offset > 0)):
                    continue  # sigle, nom de marque, nom propre en milieu de phrase
            ctx = t[max(0, m.offset - 40): m.offset + m.error_length + 40]
            if admis(ctx):
                continue
            bloquant = (m.rule_issue_type not in ("style", "typographical", "whitespace", "locale-violation",
                                                  "register", "duplication")
                        and not a_verifier(regle) and m.category not in A_VERIFIER)
            out.append({"zone": zone, "regle": regle, "message": m.message, "extrait": ctx,
                        "suggestions": m.replacements[:3], "type": m.rule_issue_type,
                        "niveau": "faute" if bloquant else "a_verifier"})
    return out


def main(args):
    slugs = [a for a in args if not a.startswith("--")]
    if "--tous" in args:
        slugs = sorted(p.stem[len("article-"):] for p in (RACINE / "articles").glob("article-*.html"))
    if not slugs:
        sys.exit(__doc__)
    resultat, total, lt_ok = {}, 0, True
    cache = next((a.split("=", 1)[1] for a in args if a.startswith("--cache=")), None)
    for slug in slugs:
        if cache:
            f = Path(cache) / f"{slug}.json"
            if f.exists():
                resultat[slug] = json.loads(f.read_text(encoding="utf-8"))
                total += sum(x.get("niveau") == "faute" for x in resultat[slug])
                continue
        blocs = textes(slug)
        fautes = passe_maison(blocs)
        lt = passe_languagetool(blocs)
        if lt is None:
            lt_ok = False
        else:
            fautes += lt
        resultat[slug] = fautes
        total += sum(f.get("niveau") == "faute" for f in fautes)
        if cache and lt is not None:
            Path(cache).mkdir(parents=True, exist_ok=True)
            (Path(cache) / f"{slug}.json").write_text(json.dumps(fautes, ensure_ascii=False), encoding="utf-8")
    if "--json" in args:
        print(json.dumps({"languagetool": lt_ok, "articles": resultat}, ensure_ascii=False, indent=1))
    else:
        for slug, tout in resultat.items():
            fautes = [f for f in tout if f.get("niveau") == "faute"]
            avoir = [f for f in tout if f.get("niveau") != "faute"]
            etat = f"✗ {len(fautes)} faute(s) à corriger" if fautes else "✓ aucune faute relevée"
            print(f"{slug} : {etat}" + (f", {len(avoir)} point(s) à vérifier" if avoir else ""))
            for titre, lot in (("FAUTES (bloquant)", fautes), ("À VÉRIFIER (corriger si c'est une vraie faute)", avoir)):
                if lot:
                    print(f"  {titre}")
                for f in lot:
                    sug = f" → {' / '.join(f['suggestions'])}" if f["suggestions"] else ""
                    print(f"  - [{f['zone']}] {f['message']}{sug}\n      « …{f['extrait']}… »  ({f['regle']})")
        if not lt_ok:
            print("\n(LanguageTool non disponible ici : relecture partielle, le contrôle complet tourne sur GitHub.)")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
