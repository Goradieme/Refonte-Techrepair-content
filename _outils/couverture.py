#!/usr/bin/env python3
"""
couverture.py — Génère l'image de couverture d'un article (1200x630, JPEG),
aux couleurs du site : fond navy, accent bleu, police Manrope.

Usage :
    python3 _outils/couverture.py <slug> "<titre court>" <categorie>
Produit articles/<slug>-cover.jpg
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parent.parent
POLICES = Path(__file__).resolve().parent / "polices"
W, H = 1200, 630
NAVY, NAVY2, BLEU = (15, 27, 61), (30, 58, 110), (26, 86, 219)
LIBELLES = {"seo": "SEO", "saas": "SaaS B2B", "ecommerce": "E-commerce Tech",
            "cyber": "Cybersécurité", "fintech": "Fintech", "rh": "RH Tech"}


def police(poids: int, taille: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(POLICES / f"manrope-latin-{poids}-normal.woff"), taille)


def couper(draw, texte, fnt, largeur):
    lignes, cour = [], ""
    for mot in texte.split():
        essai = (cour + " " + mot).strip()
        if draw.textlength(essai, font=fnt) <= largeur:
            cour = essai
        else:
            lignes.append(cour)
            cour = mot
    lignes.append(cour)
    return lignes


def main(slug: str, titre: str, cat: str) -> None:
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    # dégradé diagonal discret
    for y in range(H):
        t = y / H
        c = tuple(int(NAVY[i] * (1 - t * .6) + NAVY2[i] * t * .6) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)
    # motif de grille
    for x in range(0, W, 48):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 0) if False else (24, 38, 78))
    for y in range(0, H, 48):
        d.line([(0, y), (W, y)], fill=(24, 38, 78))
    # cercles d'accent
    d.ellipse([W - 330, -170, W + 170, 330], outline=BLEU, width=3)
    d.ellipse([W - 250, -90, W + 90, 250], outline=(52, 108, 230), width=2)
    d.ellipse([W - 150, 60, W - 110, 100], fill=BLEU)

    # logo
    d.rounded_rectangle([72, 130, 128, 186], radius=10, fill=BLEU)
    f_logo = police(800, 20)
    d.text((100, 158), "TRD", font=f_logo, fill="white", anchor="mm")
    d.text((144, 136), "TechRepair", font=police(800, 22), fill="white")
    d.text((144, 162), "Content", font=police(500, 17), fill=(148, 163, 184))

    # pastille catégorie
    lib = LIBELLES.get(cat, cat).upper()
    f_cat = police(800, 17)
    lw = d.textlength(lib, font=f_cat)
    d.rounded_rectangle([72, H - 170, 72 + lw + 36, H - 132], radius=19, fill=BLEU)
    d.text((90, H - 151), lib, font=f_cat, fill="white", anchor="lm")

    # motif réseau (déterministe selon le slug) : pas de texte, pour ne pas
    # doubler le titre affiché par le blog par-dessus l'image.
    import random
    rnd = random.Random(slug)
    pts = [(rnd.randint(420, W - 60), rnd.randint(150, H - 90)) for _ in range(16)]
    for i, a in enumerate(pts):
        for b2 in pts[i + 1:]:
            if (a[0] - b2[0]) ** 2 + (a[1] - b2[1]) ** 2 < 230 ** 2:
                d.line([a, b2], fill=(46, 84, 170), width=2)
    for x, y in pts:
        r = rnd.choice([6, 8, 11])
        d.ellipse([x - r, y - r, x + r, y + r], fill=BLEU, outline=(147, 182, 255), width=2)
    _ = titre  # conservé dans l'interface pour compatibilité
    d.text((72, H - 64), "techrepaircontent.com", font=police(500, 19), fill=(148, 163, 184))
    d.rectangle([0, H - 8, W, H], fill=BLEU)

    sortie = RACINE / "articles" / f"{slug}-cover.jpg"
    img.save(sortie, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"OK : {sortie.relative_to(RACINE)}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
