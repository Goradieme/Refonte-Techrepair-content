# Consignes de rédaction — blog TechRepair Content

Ce dossier `_outils/` n'est pas publié sur le site (GitHub Pages ignore les dossiers
commençant par `_`). Il contient tout ce qu'il faut pour produire un article par jour.

## Ligne éditoriale : attirer et convertir des clients (règle prioritaire)

Le blog sert d'abord à **montrer l'expertise de TechRepair Content et à faire venir des
clients**. Chaque article répond à une recherche réelle que tape un **acheteur potentiel
de nos services** : responsable marketing, head of growth, product marketing manager,
fondateur ou directeur commercial d'une entreprise **SaaS B2B, fintech ou cybersécurité**
(cibles prioritaires), puis e-commerce tech et RH tech.

- **Le sujet, c'est leur acquisition** : SEO, stratégie de contenu, génération de leads,
  livres blancs, études de cas, pages comparatives, landing pages, fiches produits,
  documentation, rédaction technique, visibilité dans les moteurs IA, ROI du contenu…
  appliqués à leur secteur, avec ses contraintes propres (fintech : critères YMYL de
  Google, règles de communication de l'ACPR et de l'AMF ; cybersécurité : convaincre un
  RSSI ou un DSI, crédibilité technique, pas de marketing de la peur ; SaaS : cycle
  d'essai et de démo, churn, pricing).
- **L'actualité réglementaire** (DSP3, DORA, NIS2, AI Act, facturation électronique…)
  ne se traite plus pour elle-même : seulement sous l'angle « ce que cela change pour
  votre marketing, vos contenus, vos arguments commerciaux ou votre visibilité ».
- **Mix d'intentions sur la semaine** : au moins 2 articles à forte intention d'achat
  (« consultant SEO SaaS », « agence », « combien coûte », « comment choisir »,
  « exemple de… », comparatifs) et le reste en méthode (« comment faire… »,
  « stratégie… »). Mots-clés à faible volume mais à forte intention bienvenus : en B2B,
  10 recherches d'acheteurs valent mieux que 1 000 curieux.
- **Prouver l'expertise sans rien inventer** : méthodes détaillées, exemples de
  livrables (plans, grilles, modèles, avant/après rédigés pour l'article et présentés
  comme tels), erreurs fréquentes, critères chiffrés, chiffres sourcés. Jamais de faux
  client, de faux témoignage ni de résultat non documenté.
- **Conversion** : chaque article contient un bénéfice clair pour le lecteur, un
  passage qui montre comment TechRepair Content le met en œuvre (factuel, une fois),
  et une conclusion avec un appel à l'action précis vers la page service et `/devis`
  (par exemple un audit ou un diagnostic de contenu offert).

## Recherche de mots-clés et de questions réelles

En attendant l'abonnement Ahrefs (Semrush : unités API épuisées ; Ahrefs : pas d'accès
API ; ne pas les appeler) :

1. **Ubersuggest** (offre gratuite : **3 rapports par jour**, partagés avec toute
   session du jour ; vérifier le solde avec `user_limits`) :
   - `match_keywords` (France : `locId` 2250, `language` fr) avec 2 ou 3 graines dans
     un seul appel : **un seul rapport** pour des dizaines de mots-clés avec volume,
     difficulté (SD) et CPC. À préférer à `keyword_overview` (un mot-clé par rapport).
   - `google_suggestions` (`country` fr, `language` fr) : **gratuit, ne consomme pas
     de rapport**. Il fournit les vraies requêtes de la saisie semi-automatique de
     Google, dont les questions (« comment », « pourquoi », « combien »…).
   - Retenir le meilleur compromis intention / volume / difficulté (SD idéalement < 40),
     en privilégiant l'intention d'achat. Un CPC élevé signale une requête commerciale.
2. **Google Keyword Planner** : pas de connecteur. Si Goradieme dépose un export CSV
   dans Google Drive (dossier ou fichier dont le nom contient « Keyword Planner » ou
   « mots-clés »), le lire avec l'outil Google Drive et l'utiliser en priorité pour
   les volumes.
3. **Questions réelles des visiteurs** : en plus de `google_suggestions`, chercher sur
   le web la requête principale et relever les questions « Autres questions posées »,
   les discussions de forums et de communautés professionnelles (Reddit, LinkedIn,
   Quora, communautés SaaS ou fintech), et les questions des pages concurrentes les
   mieux classées. Les intertitres et la FAQ reprennent ces questions dans la
   formulation des internautes (corrigée), et le corps y répond directement.
4. Noter dans le JSON du calendrier et dans la description de la demande de fusion :
   mot-clé principal, volume, SD, CPC, source et date, et les 3 à 5 questions réelles
   retenues avec leur source.

## Routine quotidienne

1. Ouvrir `_outils/calendrier-editorial.json` et prendre le premier sujet dont le
   `statut` vaut `a_faire` dans la catégorie du jour. Si tous sont faits, proposer 10
   nouveaux sujets dans la même logique (ligne éditoriale ci-dessus, rotation des
   catégories, pas de doublon avec `articles.js`) et les ajouter au calendrier dans la
   même demande de fusion.
2. **Valider le mot-clé et les questions réelles** selon la section « Recherche de
   mots-clés et de questions réelles ».
3. Rechercher le sujet sur le web : sources primaires d'abord (textes officiels,
   documentation des éditeurs, études publiées), chiffres datés et vérifiés sur la
   page d'origine. Ne jamais inventer un chiffre, une citation, un client ou une étude.
4. Rédiger le corps dans `_outils/brouillons/<slug>.html` et les métadonnées dans
   `_outils/brouillons/<slug>.json` (prendre `geo-etre-cite-par-chatgpt.*` comme modèle).
5. Générer la couverture :
   `python3 _outils/couverture.py <slug> "<titre de couverture>" <categorie> "<sur-titre>" <numéro> [couleur] [style] [--motif=…]`
   - titre de couverture ≤ 70 caractères, sujet court avant les deux-points (« NIS2 : … »),
     apostrophes typographiques (’) ; sur-titre : « Guide stratégique », « Analyse »,
     « Décryptage réglementaire », « Méthode »… ; numéro = nombre d'articles dans
     `articles.js` après ajout ;
   - **couleur** (couleurs du site) : `bleu`, `orange`, `vert`, `violet`, ou `auto`.
     Ne jamais reprendre la couleur de la couverture précédente ; choisir celle qui sert
     le sujet (vert pour l'environnement, la croissance ; orange pour l'alerte, le risque ;
     violet pour l'IA, l'innovation ; bleu pour le cadre, la méthode) ;
   - **style** : `scission`, `nuit`, `accent`, `papier` ; sans argument, il tourne avec le
     numéro. Ne jamais reprendre le style de la couverture précédente ;
   - **motif** (illustration liée au sujet, à privilégier sur le motif de catégorie) :
     `fiche-produit` (e-commerce, catalogue, fiches produits), `document` (loi, règlement,
     norme, conformité, livre blanc), `tableau-de-bord` (chiffres, ROI, performance, SaaS),
     `calendrier` (échéance, date d'entrée en vigueur). Sans motif, l'illustration de la
     catégorie s'applique (bouclier, ondes, couches, courbe, réseau, colis) ;
   - ouvrir l'image et vérifier qu'elle est parfaite : titre sur 4 lignes au plus, aucune
     coupure de mot, illustration nette, aucun élément coupé ou superposé au texte.
6. Assembler et indexer : `python3 _outils/publier_article.py _outils/brouillons/<slug>.json`
   (met à jour l'article, `articles.js`, `blog.html`, `sitemap.xml`, `feed.xml` et le calendrier).
7. **Contrôle qualité obligatoire** (l'article peut être publié sans relecture humaine) :
   - `python3 _outils/verifier_article.py _outils/brouillons/<slug>.html` (installer
     d'abord `pip install --break-system-packages -q pyspellchecker`) ; corriger tout ce
     qui est signalé, puis relancer jusqu'à obtenir zéro problème typographique.
   - Ouvrir **chaque** source externe avec WebFetch : la page doit exister et contenir
     le chiffre ou l'affirmation citée, avec la même date et le même périmètre. Une
     source introuvable, payante, ou qui ne confirme pas l'affirmation est remplacée ;
     à défaut, l'affirmation est supprimée. Privilégier les sources primaires
     (organisme officiel, éditeur, auteur de l'étude) aux blogs qui les reprennent.
   - Relire l'article **en entier, deux fois** : orthographe, grammaire, accords,
     conjugaison, ponctuation et typographie française (espace avant « ; : ! ? »,
     guillemets « »), noms propres, chiffres, cohérence entre titre, sommaire et
     parties, liens. Corriger directement.
   - Relancer `publier_article.py` après les corrections.
8. Vérifier le rendu dans un navigateur (bureau et mobile).
9. Exporter le PDF de relecture :
   `NODE_PATH=$(npm root -g) node _outils/pdf_article.js articles/article-<slug>.html _outils/relecture/<slug>.pdf`
   puis l'ouvrir pour contrôler la mise en page.
10. Ouvrir une demande de fusion sur une branche `article/<date>-<slug>`. Ne jamais
   pousser sur `main` dans cette étape, et ne jamais commenter la demande. Le lien de
   téléchargement du PDF, à mettre dans la description de la demande :
   `https://github.com/Goradieme/Refonte-Techrepair-content/raw/<branche>/_outils/relecture/<slug>.pdf`

## Calendrier quotidien (heure de Paris)

- **03 h 47 — rédaction** : une tâche rédige l'article du jour (daté du jour), le
  contrôle, exporte le PDF et ouvre la demande de fusion `article/AAAA-MM-JJ-<slug>`.
  Elle ne fait rien si une demande d'article datée du jour est déjà ouverte.
- **06 h 00 — e-mail de relecture** : une tâche envoie depuis Gmail, à
  papisdieme79@gmail.com, un e-mail mis en forme (couverture, points clés, bouton de
  téléchargement du PDF, lien de la demande), plus une notification.
- **08 h 00 — publication** : une tâche fusionne les demandes `article/...` ouvertes,
  **sauf** si elles ont reçu un commentaire ou un avis, portent l'étiquette `attendre`
  ou ont été fermées. Pour bloquer une publication, il suffit de commenter la demande
  de fusion (par exemple « stop »). Les tâches automatiques ne commentent jamais les
  demandes de fusion, pour ne pas se bloquer elles-mêmes.

## Exigences éditoriales

- **Longueur** : 1 800 à 2 500 mots dans le corps (contrôlé par le script).
- **Langue et ton** : français, vouvoiement, expert mais accessible. Phrases nettes,
  pas de jargon non expliqué, pas de formules creuses (« dans un monde en constante
  évolution », « il est crucial de »…). Pas de tiret cadratin comme ponctuation.
- **Public** : acheteurs de contenus et de SEO dans les entreprises SaaS B2B, fintech
  et cybersécurité en priorité (marketing, growth, product marketing, fondateurs,
  direction commerciale), puis e-commerce tech et RH tech, en France et dans la
  francophonie. Voir « Ligne éditoriale ».
- **Honnêteté** : distinguer ce qui est documenté de ce qui est une hypothèse ; signaler
  les limites d'une étude (un seul site, échantillon réduit…). Aucune promesse de
  position Google ou de citation IA.

## Exigences SEO et GEO

- Mot-clé principal dans : titre SEO (≤ 65 caractères), H1, meta description
  (≤ 160 caractères), introduction et au moins un H2. Pas de bourrage.
- Structure, dans cet ordre : `<p class="intro-lead">`, un paragraphe d'introduction,
  un encadré `<div class="key-points"><h3>Points clés</h3><ul>…</ul></div>` (4 conclusions
  essentielles, chacune avec une amorce en gras), le sommaire `<div class="toc-box">`, 6 à 9 `<h2 id="chN">` numérotés, des `<h3>`,
  au moins un tableau ou une liste d'étapes, un `<div class="callout">`.
- Réponse directe dans les deux premières phrases de chaque partie ; passages
  autonomes, citables tels quels.
- 4 à 8 liens externes vers les sources primaires : `class="src" target="_blank" rel="noopener"`.
- **Maillage interne (obligatoire)** :
  - dans le nouvel article, 4 à 6 liens internes contextuels : la page service liée
    (`pagesLiees`), la page secteur, **au moins deux articles existants du blog** dont
    le sujet est proche, et `/devis` ou un outil (`/visibilite-ia`,
    `/calculateur-temps-perdu`, audit IA). Ancres descriptives (jamais « cliquez ici »),
    insérées là où le lecteur en a besoin, et **réparties dans tout l'article** : au moins
    un lien dans chaque tiers (début, milieu, fin), jamais deux liens vers d'autres
    articles dans la même partie (contrôlé par `verifier_article.py`) ;
  - en retour, ajouter **un lien contextuel vers le nouvel article dans les deux
    articles existants les plus proches** : une phrase naturelle et utile, dans la
    partie pertinente. Si l'article existant a un brouillon dans `_outils/brouillons/`,
    modifier le brouillon puis relancer `publier_article.py` avec `"remplacer": true`
    dans son JSON ; sinon modifier directement la page dans `articles/` ;
  - **mise en avant subtile des services** : quand le sujet s'y prête (RH, support,
    veille, contenu, tâches répétitives), glisser une phrase naturelle et utile qui montre
    comment un agent IA ou un service de TechRepair Content résout un point précis de
    l'article, avec un lien vers `/agents-ia`, `/calculateur-temps-perdu` ou la page
    service concernée. Une seule mention, factuelle, jamais publicitaire ;
  - le bloc « À lire aussi » (3 articles proches) est recalculé automatiquement sur
    toutes les pages par `_outils/maillage.py`, lancé par `publier_article.py`.
- FAQ finale `<h2 id="faq">` avec 3 à 5 `<div class="faq-item"><h3>…</h3><p>…</p></div>`
  (balisée automatiquement en FAQPage).
- Au moins une rangée de chiffres clés `<div class="stat-row">` avec 3 `<div class="stat"><b>chiffre</b><span>légende sourcée et datée</span></div>`.
- Conclusion `<div class="conclusion-box">` avec un appel à l'action vers la page service,
  puis en toute fin `<h2 id="sources">Sources</h2><ol class="sources">` : une ligne par
  source (auteur ou organisme, « titre », date, lien sur le nom de domaine). Cette liste
  n'est pas comptée dans les 1 800 à 2 500 mots.

## Niveau d'exigence

Le rendu doit être celui d'une note publiée par un grand cabinet de conseil : une thèse
claire, des chiffres sourcés, des tableaux propres, aucune phrase de remplissage, aucune
approximation. Sujets : les questions d'acquisition et de contenu des secteurs cibles
(voir « Ligne éditoriale »), nourries de l'actualité quand elle s'y prête (évolution de
Google ou des moteurs IA, étude récente sur le marketing B2B, réglementation qui change
les arguments ou la communication d'un secteur). Un sujet d'actualité peut remplacer le
sujet prévu du calendrier s'il répond mieux à une recherche réelle des acheteurs ce
jour-là ; l'ajouter alors au calendrier.

## Diversité des sujets (règle stricte)

Avant de choisir, lire les 10 derniers articles de `articles.js` (titre, catégorie, mot-clé).
- Jamais la même catégorie deux jours de suite. Sur 7 jours glissants : au moins
  2 articles `saas`, au moins 1 `fintech`, 1 `cyber` et 1 `seo` (SEO B2B transverse) ;
  `ecommerce` et `rh` au plus une fois chacun. La catégorie désigne le secteur du
  lecteur visé.
- Les sujets IA (GEO, ChatGPT, agents IA, moteurs de réponse, IA générative) : au plus
  **un article par semaine**. Le reste du temps, traiter les sujets d'acquisition des
  secteurs : SEO SaaS, génération de leads B2B, livres blancs, études de cas, pages
  comparatives, landing pages, documentation produit, rédaction technique, marketing
  fintech et cybersécurité, conformité de la communication, SEO technique, ROI du
  contenu, fiches produits, marque employeur.
- Pas deux articles sur le même angle ou le même mot-clé, même reformulés.
- Ne jamais écrire de formule méta du type « Ce guide répond à la question que se pose… » :
  poser directement la question au lecteur, ou entrer dans le sujet.

## Variété des formulations (règle stricte)

Chaque article doit sonner neuf. Avant d'écrire, relire l'introduction, les intertitres,
les encadrés et la conclusion des 5 derniers articles, puis s'en écarter :
- **Introduction** : changer d'attaque à chaque fois (un chiffre, une scène concrète, une
  échéance, une idée reçue à corriger, une question directe, une citation officielle…).
  Jamais deux articles de suite avec la même structure d'ouverture.
- **Intertitres, titres d'encadrés (`callout`), phrases de transition, conclusion,
  appel à l'action, questions de FAQ** : formulations propres au sujet, jamais recopiées
  d'un autre article (« La lecture honnête de ces chiffres », « Ce que ça change
  concrètement », « Plan d'action sur 30 jours »… ne se réutilisent pas tels quels).
- Varier aussi le rythme : longueur des phrases, tableaux ou listes selon le besoin,
  type de plan (chronologique, par profil, par risque, par question…).
- `verifier_article.py` signale toute phrase qui reprend 6 mots consécutifs d'un autre
  article : la réécrire (seuls les noms propres, intitulés officiels et libellés du
  gabarit comme « Points clés » ou « Questions fréquentes » sont admis).
- Partir d'une question réelle qu'un acheteur potentiel tape dans Google (relevée
  avec `google_suggestions`, les « Autres questions posées » ou les forums) et y répondre de façon complète et actionnable : ce qui
  change, qui est concerné, quoi faire, dans quel ordre, avec quels chiffres.

## Catégories

`seo`, `saas`, `ecommerce`, `cyber`, `fintech`, `rh` (voir `CAT_CONFIG` dans `blog.html`).
