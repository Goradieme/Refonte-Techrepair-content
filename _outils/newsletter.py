#!/usr/bin/env python3
"""
newsletter.py — Assemble la newsletter mensuelle de TechRepair Content (e-mail HTML).

Usage :
    python3 _outils/newsletter.py _outils/newsletters/AAAA-MM.json

Le JSON contient :
  objet       objet de l'e-mail (≤ 60 caractères conseillés)
  preheader   texte d'aperçu (≤ 110 caractères)
  edito       2 à 4 phrases, signées Goradieme (texte simple, paragraphes séparés par \\n\\n)
  livreBlanc  slug du livre blanc du mois (_outils/livres-blancs/<slug>.json)
  articles    (facultatif) slugs des articles à mettre en avant, 3 à 6 ;
              par défaut : les articles du mois précédent, du plus récent au plus ancien
  conseil     {"titre": ..., "texte": ...} : une action concrète à faire ce mois-ci
Sortie : _outils/newsletters/AAAA-MM.html (600 px, styles en ligne, police Arial,
compatible Brevo : lien de désinscription {{ unsubscribe }}).
"""
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = "https://www.techrepaircontent.com"
NAVY, BLEU, MUTED = "#0B1633", "#1A56DB", "#64748B"
COULEURS = {"bleu": "#1A56DB", "orange": "#F97316", "vert": "#10B981", "violet": "#7C3AED"}
CATS = {"seo": "SEO B2B", "saas": "SaaS B2B", "ecommerce": "E-commerce", "cyber": "Cybersécurité",
        "fintech": "Fintech", "rh": "RH tech"}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]
esc = lambda s: html.escape(str(s), quote=True)
UTM = "utm_source=newsletter&utm_medium=email&utm_campaign=newsletter-{}"


def lire_articles():
    src = (RACINE / "articles.js").read_text(encoding="utf-8")
    out = []
    for bloc in re.findall(r"\{([^{}]*)\}", src):
        c = dict(re.findall(r'(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"', bloc))
        if "lien" in c:
            out.append({k: v.replace('\\"', '"') for k, v in c.items()})
    return out


def main(chemin):
    p = Path(chemin).resolve()
    n = json.loads(p.read_text(encoding="utf-8"))
    mois = p.stem  # AAAA-MM
    an, mm = map(int, mois.split("-"))
    utm = UTM.format(mois)
    for k in ("objet", "preheader", "edito", "livreBlanc", "conseil"):
        if not n.get(k):
            sys.exit(f"Champ manquant : {k}")
    lb_path = RACINE / "_outils" / "livres-blancs" / f"{n['livreBlanc']}.json"
    lb = json.loads(lb_path.read_text(encoding="utf-8"))
    accent = COULEURS.get(lb.get("couleur"), BLEU)

    tous = lire_articles()
    if n.get("articles"):
        par_slug = {a.get("slug"): a for a in tous}
        choix = [par_slug[s] for s in n["articles"] if s in par_slug]
    else:
        pm_an, pm = (an, mm - 1) if mm > 1 else (an - 1, 12)
        choix = sorted([a for a in tous if a["date"].startswith(f"{pm_an}-{pm:02d}")], key=lambda a: a["date"], reverse=True)[:6]
    if not choix:
        sys.exit("Aucun article à mettre en avant : préciser la liste \"articles\".")

    lien_lb = f"{SITE}/livres-blancs/{lb['slug']}.html?{utm}"
    edito = "".join(f'<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#1E293B">{esc(x.strip())}</p>'
                    for x in n["edito"].split("\n\n") if x.strip())
    puces = "".join(f'<tr><td valign="top" style="padding:0 10px 8px 0;color:{accent};font-weight:bold">✓</td>'
                    f'<td style="padding:0 0 8px;font-size:14px;line-height:1.55;color:#334155">{esc(x)}</td></tr>'
                    for x in lb["apprendre"][:3])
    arts = "".join(f"""
      <tr><td style="padding:16px 0;border-bottom:1px solid #E2E8F0">
        <div style="font-size:11px;font-weight:bold;letter-spacing:.6px;text-transform:uppercase;color:{BLEU};margin-bottom:4px">{esc(CATS.get(a['categorie'], a['categorie']))}</div>
        <a href="{SITE}/{a['lien']}?{utm}" style="font-size:16px;font-weight:bold;color:{NAVY};text-decoration:none;line-height:1.35">{esc(a['titre'])}</a>
        <div style="font-size:13.5px;color:{MUTED};line-height:1.55;margin-top:5px">{esc(a['extrait'])}</div>
      </td></tr>""" for a in choix)
    page = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{esc(n['objet'])}</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{esc(n['preheader'])}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden">
  <tr><td style="background:{NAVY};padding:22px 32px">
    <table role="presentation" width="100%"><tr>
      <td style="font-size:15px;font-weight:bold;color:#FFFFFF"><span style="display:inline-block;background:{BLEU};border-radius:6px;padding:6px 8px;font-size:12px;margin-right:8px">TRD</span>TechRepair Content</td>
      <td align="right" style="font-size:12px;color:#94A3B8">Newsletter · {MOIS[mm - 1]} {an}</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:30px 32px 10px">{edito}
    <p style="margin:0;font-size:14px;color:{MUTED}">Goradieme, TechRepair Content</p></td></tr>

  <tr><td style="padding:22px 32px">
    <table role="presentation" width="100%" style="background:#F8FAFF;border:1px solid #E2E8F0;border-top:3px solid {accent};border-radius:0 0 12px 12px"><tr>
      <td width="170" valign="top" style="padding:22px 0 22px 22px"><a href="{lien_lb}"><img src="{SITE}/livres-blancs/{lb['slug']}-cover.jpg" width="148" alt="Couverture du livre blanc" style="display:block;width:148px;border-radius:4px;border:1px solid #E2E8F0"/></a></td>
      <td valign="top" style="padding:22px">
        <div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:{accent};margin-bottom:6px">Le livre blanc du mois</div>
        <div style="font-size:19px;font-weight:bold;color:{NAVY};line-height:1.3;margin-bottom:12px">{esc(lb['titre'])}</div>
        <table role="presentation">{puces}</table>
        <a href="{lien_lb}" style="display:inline-block;margin-top:8px;background:{BLEU};color:#FFFFFF;font-weight:bold;font-size:14px;text-decoration:none;border-radius:8px;padding:12px 20px">Télécharger gratuitement</a>
      </td></tr></table>
  </td></tr>

  <tr><td style="padding:12px 32px 0">
    <div style="font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:{NAVY};border-bottom:2px solid {NAVY};padding-bottom:8px">À lire sur le blog ce mois-ci</div>
    <table role="presentation" width="100%">{arts}</table>
  </td></tr>

  <tr><td style="padding:26px 32px">
    <table role="presentation" width="100%" style="background:{NAVY};border-radius:12px"><tr><td style="padding:22px 24px">
      <div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#FBBF24;margin-bottom:6px">Le conseil du mois</div>
      <div style="font-size:17px;font-weight:bold;color:#FFFFFF;margin-bottom:8px">{esc(n['conseil']['titre'])}</div>
      <div style="font-size:14px;line-height:1.6;color:#CBD5E1">{esc(n['conseil']['texte'])}</div>
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:0 32px 30px;text-align:center">
    <p style="font-size:15px;color:#1E293B;margin:0 0 14px">Vous voulez des contenus qui font venir des clients, sans y passer vos soirées ?</p>
    <a href="{SITE}/devis?{utm}" style="display:inline-block;background:{BLEU};color:#FFFFFF;font-weight:bold;font-size:14px;text-decoration:none;border-radius:8px;padding:12px 22px">Demander un diagnostic gratuit</a>
  </td></tr>
  <tr><td style="background:#F8FAFC;padding:18px 32px;font-size:11.5px;line-height:1.6;color:{MUTED};text-align:center">
    TechRepair Content · Contenus SEO, livres blancs et agents IA pour le B2B tech · <a href="{SITE}/?{utm}" style="color:{MUTED}">techrepaircontent.com</a><br/>
    Vous recevez cet e-mail car vous êtes inscrit à la newsletter ou avez téléchargé un livre blanc. <a href="{{{{ unsubscribe }}}}" style="color:{MUTED}">Se désinscrire</a>
  </td></tr>
</table></td></tr></table>
</body></html>
"""
    sortie = p.with_suffix(".html")
    sortie.write_text(page, encoding="utf-8")
    print(f"OK : {sortie.relative_to(RACINE)} ({len(choix)} articles, livre blanc : {lb['slug']})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
