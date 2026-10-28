/* ══════════════════════════════════════════════════
   articles.js — Base d'articles TechRepair Content
   ─────────────────────────────────────────────────
   Ce fichier est partagé entre editeur.html et blog.html.
   Ne pas modifier manuellement : utiliser l'éditeur SEO
   pour ajouter des articles, puis copier le contenu généré.
══════════════════════════════════════════════════ */

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
    slug:     "facturation-electronique-2026",
    motCle:   "facturation électronique 2026",
    metaDesc: "Calendrier exact, formats acceptés, plateformes agréées réelles et sanctions : le guide complet de la réforme de facturation électronique 2026."
  },
  {
    titre:    "Le Commerce Agentique : le guide complet",
    extrait:  "AEO, GEO, schema.org : comment rendre votre e-commerce visible par les agents IA (ChatGPT, Gemini, Copilot). Guide complet avec études indépendantes et checklist actionnable.",
    auteur:   "Goradieme",
    date:     "2026-08-15",
    categorie:"ecommerce",
    lecture:  "18 min",
    lien:     "articles/article-commerce-agentique.html",
    image:    "articles/commerce-agentique-cover.jpg",
    slug:     "commerce-agentique",
    motCle:   "commerce agentique",
    metaDesc: "AEO, GEO, schema.org : comment rendre votre e-commerce visible par les agents IA. Guide complet et checklist actionnable."
  },
   {
    titre:    "Identités Non-Humaines : sécuriser l'explosion des agents IA",
    extrait:  "Agents IA, clés API, tokens : les identités non-humaines dépassent déjà les identités humaines dans les entreprises. Guide complet sur les risques réels, incidents documentés et le standard émergent AIMS pour les sécuriser.",
    auteur:   "Goradieme",
    date:     "2026-08-31",
    categorie:"cyber",
    lecture:  "16 min",
    lien:     "articles/article-identites-non-humaines.html",
    image:    "articles/identites-non-humaines-cover.jpg",
    slug:     "identites-non-humaines",
    motCle:   "identités non-humaines",
    metaDesc: "Agents IA, clés API, tokens : les identités non-humaines explosent en nombre. Guide complet sur les risques, incidents réels et le standard AIMS (SPIFFE, WIMSE) pour les sécuriser."
},
       {
      titre:     "Agents IA en RH : le guide complet",
      extrait:   "Recrutement, onboarding, rétention, paie : comment les agents IA transforment concrètement la fonction RH, avec cas d'usage, ROI et cadre légal.",
      auteur:    "Goradieme",
      date:      "2026-07-21",
      categorie: "rh",
      lecture:   "12 min",
      lien:      "articles/article-agents-ia-rh.html",
      image:     "articles/agents-ia-rh-cover.jpg",
      slug:      "agents-ia-rh",
      motCle:    "agent IA RH",
      metaDesc:  "Découvrez comment les agents IA transforment les RH : recrutement, onboarding, rétention, paie. Guide complet avec cas d'usage, outils et méthode de déploiement."
    },
       {
      titre:     "Dark social : le vrai funnel d'achat SaaS que Google Analytics ne voit pas",
      extrait:   "Slack, Discord, LinkedIn, WhatsApp : jusqu'à 84% des échanges B2B autour de votre produit échappent à vos outils d'analyse. Comprendre le dark social et agir dessus.",
      auteur:    "Goradieme",
      date:      "2026-09-16",
      categorie: "saas",
      lecture:   "15 min",
      lien:      "articles/article-dark-social-saas-b2b.html",
      image:     "articles/dark-social-saas-b2b-cover.jpg",
      slug:      "dark-social-saas-b2b",
      motCle:    "dark social SaaS B2B",
      metaDesc:  "Slack, Discord, LinkedIn : la majorité des décisions d'achat SaaS B2B se jouent hors de vos outils d'analyse. Guide complet pour mesurer et activer le dark social."
    },
  {
    titre:    "GEO : comment faire citer votre entreprise B2B par ChatGPT, Perplexity et Gemini",
    extrait:  "Robots à autoriser, écriture vérifiable, mentions tierces et mesure des citations : la méthode documentée pour que les assistants IA citent votre entreprise B2B.",
    auteur:   "Goradieme",
    date:     "2026-10-22",
    categorie:"seo",
    lecture:  "12 min",
    lien:     "articles/article-geo-etre-cite-par-chatgpt.html",
    image:    "articles/geo-etre-cite-par-chatgpt-cover.jpg",
    slug:     "geo-etre-cite-par-chatgpt",
    motCle:   "GEO référencement IA",
    metaDesc: "Robots, contenus, mesure : la méthode documentée pour que ChatGPT, Perplexity, Gemini et Copilot citent votre entreprise B2B. Plan d'action sur 30 jours."
  },
  {
    titre:    "NIS2 en France : entreprises concernées et plan d'action avant la loi Résilience",
    extrait:  "La transposition de NIS2 est de nouveau reportée à l'Assemblée. Seuils, secteurs, obligations, référentiel ReCyF de l'ANSSI : qui est concerné et quoi faire dès maintenant.",
    auteur:   "Goradieme",
    date:     "2026-10-23",
    categorie:"cyber",
    lecture:  "12 min",
    lien:     "articles/article-nis2-france-entreprises-concernees.html",
    image:    "articles/nis2-france-entreprises-concernees-cover.jpg",
    slug:     "nis2-france-entreprises-concernees",
    motCle:   "NIS2 entreprises concernées",
    metaDesc: "Loi Résilience reportée : quelles entreprises sont concernées par NIS2, ce que la loi exigera et le plan d'action en six étapes à lancer dès maintenant."
  },
  {
    titre:    "Allégations environnementales : ce qu'il faut changer sur vos fiches produits",
    extrait:  "L'échéance européenne contre l'écoblanchiment est passée, la loi française attend à l'Assemblée. Ce qui sera interdit, ce qui est déjà sanctionné et comment réécrire vos fiches produits.",
    auteur:   "Goradieme",
    date:     "2026-10-24",
    categorie:"ecommerce",
    lecture:  "12 min",
    lien:     "articles/article-allegations-environnementales-fiches-produits.html",
    image:    "articles/allegations-environnementales-fiches-produits-cover.jpg",
    slug:     "allegations-environnementales-fiches-produits",
    motCle:   "allégations environnementales fiches produits",
    metaDesc: "Directive 2024/825 applicable depuis le 27 septembre 2026, loi française en attente : les allégations environnementales à retirer de vos fiches produits."
  },
  {
    titre:    "Transparence salariale : ce que vos offres d'emploi et vos grilles doivent changer",
    extrait:  "Le projet de loi de transposition attend son examen au Parlement. Fourchettes dans les offres, fin des questions sur le salaire passé, catégories de valeur égale : l'ordre dans lequel s'y préparer.",
    auteur:   "Goradieme",
    date:     "2026-10-25",
    categorie:"rh",
    lecture:  "12 min",
    lien:     "articles/article-transparence-salariale-offres-emploi.html",
    image:    "articles/transparence-salariale-offres-emploi-cover.jpg?v=2",
    slug:     "transparence-salariale-offres-emploi",
    motCle:   "transparence salariale",
    metaDesc: "Projet de loi au Sénat : fourchette de salaire obligatoire dans les offres, catégories de valeur égale, seuil de 5 %. Ce qu'il faut préparer dès maintenant."
  },
  {
    titre:    "DSP3 et règlement PSR : ce que les fintechs de paiement doivent préparer",
    extrait:  "Le Conseil a arrêté sa position sur la DSP3 et le PSR. Remboursement des victimes de faux conseillers, vérification du bénéficiaire, nouvel agrément : l'ordre dans lequel s'y préparer.",
    auteur:   "Goradieme",
    date:     "2026-10-26",
    categorie:"fintech",
    lecture:  "12 min",
    lien:     "articles/article-dsp3-psr-fintechs-preparer.html",
    image:    "articles/dsp3-psr-fintechs-preparer-cover.jpg",
    slug:     "dsp3-psr-fintechs-preparer",
    motCle:   "DSP3",
    metaDesc: "Texte arrêté par le Conseil le 21 octobre 2026 : remboursement de la fraude par usurpation, vérification du bénéficiaire, agrément. Les chantiers DSP3 à ouvrir."
  },
  {
    titre:    "Pages comparatives SaaS : gagner les prospects qui vous comparent à vos concurrents",
    extrait:  "Vos prospects vous comparent à vos concurrents avant la première démo. Diagnostic, formats, cadre de la publicité comparative et gabarit de page « alternative à » prêt à remplir.",
    auteur:   "Goradieme",
    date:     "2026-10-27",
    categorie:"saas",
    lecture:  "12 min",
    lien:     "articles/article-pages-comparatives-saas.html",
    image:    "articles/pages-comparatives-saas-cover-v2.jpg",
    slug:     "pages-comparatives-saas",
    motCle:   "pages comparatives SaaS",
    metaDesc: "Pages « alternative à » et « vs » : repérer les comparaisons perdues, choisir le format, citer un concurrent sans risque et rédiger une page qui convertit."
  },
  {
    titre:    "Marketing fintech : les contenus qui créent la confiance avant la première démo",
    extrait:  "Vos prospects vérifient votre agrément et la protection de leurs fonds avant de demander une démo. Le test des douze questions, cinq contenus à produire et un modèle de page prêt à adapter.",
    auteur:   "Goradieme",
    date:     "2026-10-28",
    categorie:"fintech",
    lecture:  "12 min",
    lien:     "articles/article-marketing-fintech-contenus-confiance.html",
    image:    "articles/marketing-fintech-contenus-confiance-cover.jpg",
    slug:     "marketing-fintech-contenus-confiance",
    motCle:   "marketing fintech",
    metaDesc: "Agrément, protection des fonds, sécurité, tarifs, études de cas : les contenus qu'un DAF vérifie avant de contacter une fintech B2B, avec grille et modèle."
  },
];
