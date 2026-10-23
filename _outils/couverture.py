#!/usr/bin/env python3
"""
couverture.py — Génère la couverture éditoriale haute définition d'un article
(2400x1260, affichée en 1200x630) via le moteur de rendu _outils/couverture.js.

Usage :
    python3 _outils/couverture.py <slug> "<titre de couverture>" <categorie> "<sur-titre>" <numero> [orange|bleu|auto] [scission|nuit|accent|papier]
L'accent par défaut est orange pour cyber, ecommerce, rh et bleu pour seo, saas, fintech.
Sans 7e argument, le style tourne selon le numéro : scission, nuit, accent, papier.
La partie du titre avant les deux-points est mise en couleur d'accent.
"""
import os
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
if not 4 <= len(sys.argv) <= 8:
    sys.exit(__doc__)
env = dict(os.environ)
if "NODE_PATH" not in env:
    env["NODE_PATH"] = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
sys.exit(subprocess.run(["node", str(ICI / "couverture.js"), *sys.argv[1:]], env=env).returncode)
