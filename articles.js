/* ═══════════════════════════════════════════════════════
   articles.js — Base d'articles TechRepair Content
   ───────────────────────────────────────────────────────
   Ce fichier est partagé entre blog.html.

   Édition manuelle directe sur GitHub :
   1. Déposer l'image de l'article dans /articles
   2. Ajouter un objet à ARTICLES ci-dessous avec tous les
      champs (titre, extrait, auteur, date, categorie,
      lecture, lien, slug, motCle, metaDesc, image)
   3. Commit + push → mise en ligne automatique (GitHub Pages)

   Champs obligatoires pour un affichage correct sur le blog :
   titre, extrait, auteur, date (AAAA-MM-JJ), categorie,
   lecture, lien, image
   ═══════════════════════════════════════════════════════ */

const ARTICLES = [
  {
    titre:    "Comment survivre aux AI Overviews de Google en 2025 : le guide des contenus qui résistent",
    extrait:  "Les AI Overviews cannibalisent votre trafic SEO ? Voici la méthode exacte pour produire des contenus que Google cite — et non remplace — dans ses résultats IA.",
    auteur:   "Goradieme",
    date:     "2025-06-07",
    categorie:"seo",
    lecture:  "11 min",
    lien:     "articles/article-ai-overviews-seo.html",
    slug:     "ai-overviews-seo",
    motCle:   "AI Overviews SEO",
    metaDesc: "Les AI Overviews cannibalisent votre trafic SEO ? Voici la méthode exacte pour produire des contenus que Google cite — et non remplace — dans ses résultats IA."
  },
  {
    titre:    "Facturation électronique 2026 : comprendre la réforme et savoir où s'inscrire",
    extrait:  "Calendrier exact, formats acceptés, plateformes agréées réelles et sanctions : le guide complet de la réforme pour les entreprises françaises.",
    auteur:   "Goradieme",
    date:     "2026-07-15",
    categorie:"fintech",
    lecture:  "12 min",
    lien:     "articles/article-facturation-electronique-2026.html",
    image:    "articles/facturation-electronique-2026-cover.jpg",
    slug:     "facturation-electronique-2026",
    motCle:   "facturation électronique 2026",
    metaDesc: "Calendrier exact, formats acceptés, plateformes agréées réelles et sanctions : le guide complet de la réforme de facturation électronique 2026."
  },
];
