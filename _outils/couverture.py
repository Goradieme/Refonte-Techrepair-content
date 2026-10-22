#!/usr/bin/env python3
"""
couverture.py — Couverture éditoriale d'un article (1200x630, JPEG), style « note de
cabinet de conseil » : fond navy, hiérarchie typographique nette, motif graphique
propre à chaque catégorie. Rendu en 2x puis réduit pour un anticrénelage parfait.

Usage :
    python3 _outils/couverture.py <slug> "<titre de couverture>" <categorie> [<sur-titre>] [<numero>]
      <sur-titre> : ex. « Guide stratégique », « Analyse », « Décryptage réglementaire »
      <numero>    : numéro de l'article dans la collection (ex. 7)
Produit articles/<slug>-cover.jpg
"""
import math
import random
import sys
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parent.parent
POLICES = Path(__file__).resolve().parent / "polices"
S = 2                      # facteur de suréchantillonnage
W, H = 1200 * S, 630 * S
NAVY_A, NAVY_B = (9, 18, 44), (19, 38, 82)
BLEU, BLEU_CLAIR = (26, 86, 219), (125, 165, 255)
ARDOISE, BLANC = (148, 163, 184), (255, 255, 255)
LIBELLES = {"seo": "SEO & VISIBILITÉ IA", "saas": "SAAS B2B", "ecommerce": "E-COMMERCE TECH",
            "cyber": "CYBERSÉCURITÉ", "fintech": "FINTECH", "rh": "RH TECH"}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]
M = 76 * S                 # marge gauche


def police(poids, taille):
    return ImageFont.truetype(str(POLICES / f"manrope-latin-{poids}-normal.woff"), taille * S)


def texte_espace(d, xy, txt, fnt, fill, espacement):
    """Texte avec interlettrage (petites capitales éditoriales)."""
    x, y = xy
    for c in txt:
        d.text((x, y), c, font=fnt, fill=fill)
        x += d.textlength(c, font=fnt) + espacement * S
    return x


def couper(d, txt, fnt, largeur):
    lignes, cour = [], ""
    for mot in txt.split():
        essai = (cour + " " + mot).strip()
        if d.textlength(essai, font=fnt) <= largeur or not cour:
            cour = essai
        else:
            lignes.append(cour)
            cour = mot
    lignes.append(cour)
    return lignes


# ── Motifs par catégorie (dessinés dans la zone droite) ─────────────────────
def motif(cat, d, cx, cy, rnd):
    trait = (BLEU_CLAIR[0], BLEU_CLAIR[1], BLEU_CLAIR[2], 70)
    fort = (BLEU_CLAIR[0], BLEU_CLAIR[1], BLEU_CLAIR[2], 150)
    plein = BLEU + (255,)
    w = 2 * S // 2 + 1
    if cat == "seo":          # ondes de signal : être capté, être cité
        for i, r in enumerate(range(36, 300, 30)):
            d.ellipse([cx - r * S, cy - r * S, cx + r * S, cy + r * S], outline=trait if i % 3 else fort, width=w)
        for k in range(7):
            r = rnd.choice(range(66, 300, 30)) * S
            a = rnd.uniform(-math.pi * 0.42, math.pi * 0.42) + (math.pi if r < 130 * S and k % 2 else 0)
            x, y = cx + r * math.cos(a), cy + r * math.sin(a)
            d.ellipse([x - 7 * S, y - 7 * S, x + 7 * S, y + 7 * S], fill=plein)
        d.ellipse([cx - 14 * S, cy - 14 * S, cx + 14 * S, cy + 14 * S], fill=BLANC + (255,))
    elif cat == "saas":       # couches de plateforme empilées
        for i in range(5):
            y0 = cy + (90 - i * 46) * S
            pts = [(cx - 190 * S, y0), (cx, y0 - 95 * S), (cx + 190 * S, y0), (cx, y0 + 95 * S)]
            d.polygon(pts, outline=fort if i == 4 else trait, width=w)
            if i == 4:
                d.polygon(pts, fill=(BLEU[0], BLEU[1], BLEU[2], 120))
        for x in (cx - 190 * S, cx + 190 * S, cx):
            d.line([(x, cy - 94 * S), (x, cy + 90 * S + (95 * S if x == cx else 0))], fill=trait, width=w)
    elif cat == "cyber":      # treillis hexagonal, une cellule protégée
        r = 44 * S
        for q in range(-3, 4):
            for rr in range(-4, 5):
                x = cx + q * r * 1.5
                y = cy + rr * r * math.sqrt(3) + (q % 2) * r * math.sqrt(3) / 2
                if (x - cx) ** 2 + (y - cy) ** 2 > (300 * S) ** 2:
                    continue
                pts = [(x + r * math.cos(math.pi / 3 * k), y + r * math.sin(math.pi / 3 * k)) for k in range(6)]
                centre = abs(x - cx) < 1 and abs(y - cy) < 1
                d.polygon(pts, outline=fort if centre else trait, width=w, fill=plein if centre else None)
        d.ellipse([cx - 10 * S, cy - 10 * S, cx + 10 * S, cy + 10 * S], fill=BLANC + (255,))
    elif cat == "fintech":    # courbe de croissance sur grille
        x0, x1, y0, y1 = cx - 230 * S, cx + 200 * S, cy + 170 * S, cy - 190 * S
        for i in range(7):
            y = y0 + (y1 - y0) * i / 6
            d.line([(x0, y), (x1, y)], fill=trait, width=1 * S)
        pts, v = [], 0.08
        for i in range(10):
            v = min(0.95, v + rnd.uniform(0.02, 0.16))
            pts.append((x0 + (x1 - x0) * i / 9, y0 + (y1 - y0) * v))
        for i in range(9):
            bx = pts[i][0] + 10 * S
            d.rectangle([bx, pts[i][1] + 40 * S, bx + 18 * S, y0], fill=(BLEU[0], BLEU[1], BLEU[2], 90))
        d.line(pts, fill=BLANC + (230,), width=4 * S, joint="curve")
        for x, y in pts:
            d.ellipse([x - 7 * S, y - 7 * S, x + 7 * S, y + 7 * S], fill=plein, outline=BLANC + (255,), width=2 * S)
    elif cat == "rh":         # réseau de personnes et de liens
        pts = [(cx + rnd.randint(-240, 220) * S, cy + rnd.randint(-230, 230) * S) for _ in range(14)]
        for i, a in enumerate(pts):
            for b in pts[i + 1:]:
                if math.dist(a, b) < 190 * S:
                    d.line([a, b], fill=trait, width=w)
        for i, (x, y) in enumerate(pts):
            r = (16 if i % 4 == 0 else 9) * S
            d.ellipse([x - r, y - r, x + r, y + r], fill=plein if i % 4 == 0 else (NAVY_B + (255,)), outline=fort, width=w)
    else:                     # ecommerce : catalogue structuré
        taille, pas = 54 * S, 70 * S
        for i in range(-3, 4):
            for j in range(-4, 4):
                x, y = cx + i * pas, cy + j * pas
                if (x - cx) ** 2 + (y - cy) ** 2 > (290 * S) ** 2:
                    continue
                choisi = rnd.random() < 0.12
                d.rounded_rectangle([x - taille / 2, y - taille / 2, x + taille / 2, y + taille / 2], radius=10 * S,
                                    outline=fort if choisi else trait, width=w, fill=plein if choisi else None)


def main(slug, titre, cat, sur_titre="Guide stratégique", numero=None):
    rnd = random.Random(slug)
    img = Image.new("RGB", (W, H), NAVY_A)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 4):                       # dégradé horizontal doux
        t = x / W
        d.line([(x, 0), (x + 4, H)], fill=tuple(int(NAVY_A[i] * (1 - t) + NAVY_B[i] * t) for i in range(3)), width=4)

    # zone graphique à droite
    calque = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    motif(cat, ImageDraw.Draw(calque), int(W * 0.815), int(H * 0.47), rnd)
    # fondu pour que le motif ne touche jamais le texte
    masque = Image.new("L", (W, H), 0)
    dm = ImageDraw.Draw(masque)
    for x in range(W):
        a = 0 if x < W * 0.6 else min(255, int((x - W * 0.6) / (W * 0.1) * 255))
        dm.line([(x, 0), (x, H)], fill=a)
    calque.putalpha(Image.composite(calque.getchannel("A"), Image.new("L", (W, H), 0), masque))
    img.paste(calque, (0, 0), calque)
    d = ImageDraw.Draw(img)

    # en-tête : marque | collection
    d.rounded_rectangle([M, 58 * S, M + 34 * S, 92 * S], radius=7 * S, fill=BLEU)
    d.text((M + 17 * S, 75 * S), "TRD", font=police(800, 12), fill=BLANC, anchor="mm")
    x = texte_espace(d, (M + 48 * S, 66 * S), "TECHREPAIR CONTENT", police(800, 13), BLANC, 2.2)
    d.line([(x + 12 * S, 64 * S), (x + 12 * S, 86 * S)], fill=(70, 86, 120), width=S)
    texte_espace(d, (x + 26 * S, 66 * S), "INSIGHTS", police(500, 13), ARDOISE, 2.2)

    # catégorie
    y = 168 * S
    d.rectangle([M, y + 8 * S, M + 30 * S, y + 10 * S], fill=BLEU_CLAIR)
    texte_espace(d, (M + 42 * S, y), LIBELLES.get(cat, cat.upper()), police(800, 14), BLEU_CLAIR, 2.6)

    # titre
    largeur = int(W * 0.56)
    for taille in (56, 52, 48, 44, 40, 36):
        f_t = police(800, taille)
        lignes = couper(d, titre, f_t, largeur)
        if len(lignes) <= 4:
            break
    y = 206 * S
    for l in lignes:
        d.text((M, y), l, font=f_t, fill=BLANC)
        y += int(taille * 1.16 * S)

    # sur-titre et date
    d.rectangle([M, y + 22 * S, M + 48 * S, y + 25 * S], fill=BLEU)
    auj = date.today()
    meta = f"{sur_titre}  ·  {MOIS[auj.month - 1].capitalize()} {auj.year}"
    d.text((M, y + 40 * S), meta, font=police(500, 17), fill=ARDOISE)

    # pied : filet, site, numéro
    d.line([(M, H - 70 * S), (W - M, H - 70 * S)], fill=(44, 60, 98), width=S)
    texte_espace(d, (M, H - 52 * S), "TECHREPAIRCONTENT.COM", police(500, 12), ARDOISE, 2.2)
    if numero:
        n = f"N° {int(numero):03d}"
        f_n = police(800, 12)
        larg = sum(d.textlength(c, font=f_n) + 2.2 * S for c in n)
        texte_espace(d, (W - M - larg, H - 52 * S), n, f_n, BLEU_CLAIR, 2.2)

    final = img.resize((W // S, H // S), Image.LANCZOS)
    sortie = RACINE / "articles" / f"{slug}-cover.jpg"
    final.save(sortie, "JPEG", quality=90, optimize=True, progressive=True, subsampling=0)
    print(f"OK : {sortie.relative_to(RACINE)}")


if __name__ == "__main__":
    if not 4 <= len(sys.argv) <= 6:
        sys.exit(__doc__)
    main(*sys.argv[1:])
