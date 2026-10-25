# Consignes de rédaction — blog TechRepair Content

Ce dossier `_outils/` n'est pas publié sur le site (GitHub Pages ignore les dossiers
commençant par `_`). Il contient tout ce qu'il faut pour produire un article par jour.

## Routine quotidienne

1. Ouvrir `_outils/calendrier-editorial.json` et prendre le premier sujet dont le
   `statut` vaut `a_faire`. Si tous sont faits, proposer 10 nouveaux sujets dans la
   même logique (rotation des catégories, pas de doublon avec `articles.js`) et les
   ajouter au calendrier dans la même demande de fusion.
2. **Choisir le mot-clé avec des données** : Ubersuggest est connecté (offre gratuite :
   3 recherches par jour, ne pas en gaspiller). Utiliser `keyword_overview` (France :
   `locId` 2250, `language` fr) sur 2 ou 3 formulations candidates et retenir celle qui
   combine le meilleur volume et une difficulté SEO raisonnable (idéalement < 40 pour un
   site jeune). Noter volume et difficulté dans la description de la demande de fusion.
   Semrush et Ahrefs sont reliés mais inutilisables en l'état (unités API Semrush
   épuisées, offre Ahrefs sans accès API) : ne pas les appeler.
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
- **Public** : marketing, fondateurs et décideurs d'entreprises SaaS, tech,
  e-commerce, cybersécurité, fintech et RH tech, en France et dans la francophonie.
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
    insérées là où le lecteur en a besoin ;
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
approximation. Sujets : tendances actuelles (actualité réglementaire, études récentes,
annonces des grands éditeurs, évolutions de Google et des IA) toujours rattachées aux
services de TechRepair Content (rédaction SEO, GEO, fiches produits, livres blancs,
rédaction technique, agents IA) et à ses secteurs (SaaS B2B, e-commerce tech,
cybersécurité, fintech, RH tech). Un sujet tendance peut remplacer le sujet prévu du
calendrier s'il est plus pertinent ce jour-là ; l'ajouter alors au calendrier.

## Diversité des sujets (règle stricte)

Avant de choisir, lire les 10 derniers articles de `articles.js` (titre, catégorie, mot-clé).
- Jamais la même catégorie deux jours de suite ; chaque catégorie (seo, saas, ecommerce,
  cyber, fintech, rh) revient au moins une fois tous les 7 jours.
- Les sujets IA (GEO, ChatGPT, agents IA, moteurs de réponse, IA générative) : au plus
  **un article par semaine**. Le reste du temps, traiter les vrais sujets métier des
  secteurs : réglementation (NIS2, DORA, DSP3, facturation électronique, AI Act, RGPD,
  accessibilité), sécurité, paiement, conversion e-commerce, recrutement et paie,
  pricing et croissance SaaS, documentation produit, livres blancs, fiches produits,
  SEO technique, stratégie de contenu.
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
- Partir d'une question concrète que se pose un décideur cette semaine (actualité,
  échéance, étude, annonce) et y répondre de façon complète et actionnable : ce qui
  change, qui est concerné, quoi faire, dans quel ordre, avec quels chiffres.

## Catégories

`seo`, `saas`, `ecommerce`, `cyber`, `fintech`, `rh` (voir `CAT_CONFIG` dans `blog.html`).
