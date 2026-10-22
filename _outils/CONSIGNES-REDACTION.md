# Consignes de rédaction — blog TechRepair Content

Ce dossier `_outils/` n'est pas publié sur le site (GitHub Pages ignore les dossiers
commençant par `_`). Il contient tout ce qu'il faut pour produire un article par jour.

## Routine quotidienne

1. Ouvrir `_outils/calendrier-editorial.json` et prendre le premier sujet dont le
   `statut` vaut `a_faire`. Si tous sont faits, proposer 10 nouveaux sujets dans la
   même logique (rotation des catégories, pas de doublon avec `articles.js`) et les
   ajouter au calendrier dans la même demande de fusion.
2. Rechercher le sujet sur le web : sources primaires d'abord (textes officiels,
   documentation des éditeurs, études publiées), chiffres datés et vérifiés sur la
   page d'origine. Ne jamais inventer un chiffre, une citation, un client ou une étude.
3. Rédiger le corps dans `_outils/brouillons/<slug>.html` et les métadonnées dans
   `_outils/brouillons/<slug>.json` (prendre `geo-etre-cite-par-chatgpt.*` comme modèle).
4. Générer la couverture : `python3 _outils/couverture.py <slug> "<titre court>" <categorie>`
5. Assembler et indexer : `python3 _outils/publier_article.py _outils/brouillons/<slug>.json`
   (met à jour l'article, `articles.js`, `blog.html`, `sitemap.xml`, `feed.xml` et le calendrier).
6. **Contrôle qualité obligatoire** (l'article peut être publié sans relecture humaine) :
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
7. Vérifier le rendu dans un navigateur (bureau et mobile).
8. Exporter le PDF de relecture :
   `NODE_PATH=$(npm root -g) node _outils/pdf_article.js articles/article-<slug>.html _outils/relecture/<slug>.pdf`
   puis l'ouvrir pour contrôler la mise en page.
9. Ouvrir une demande de fusion sur une branche `article/<date>-<slug>`. Ne jamais
   pousser sur `main` dans cette étape. Le message
   final de la session (envoyé par e-mail à papisdieme79@gmail.com) doit contenir le
   lien direct de téléchargement du PDF :
   `https://github.com/Goradieme/Refonte-Techrepair-content/raw/<branche>/_outils/relecture/<slug>.pdf`

## Publication automatique

Goradieme a demandé que l'article soit publié automatiquement s'il ne réagit pas dans
les 2 heures suivant l'e-mail. Une tâche planifiée distincte vérifie chaque heure les
demandes de fusion `article/...` ouvertes depuis plus de 2 heures et les fusionne,
**sauf** si Goradieme a laissé un commentaire ou un avis sur la demande, si elle porte
l'étiquette `attendre`, ou si elle a été fermée. Pour bloquer une publication, il suffit
donc de commenter la demande de fusion (par exemple « stop »).

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
- Structure : `<p class="intro-lead">`, introduction avec liste « Vous y trouverez »,
  sommaire `<div class="toc-box">`, 6 à 9 `<h2 id="chN">` numérotés, des `<h3>`,
  au moins un tableau ou une liste d'étapes, un `<div class="callout">`.
- Réponse directe dans les deux premières phrases de chaque partie ; passages
  autonomes, citables tels quels.
- 4 à 8 liens externes vers les sources primaires : `class="src" target="_blank" rel="noopener"`.
- 3 à 5 liens internes : la page service liée au sujet (`pagesLiees` du calendrier),
  un ou deux articles existants du blog, `/devis` ou un outil (`/visibilite-ia`,
  `/calculateur-temps-perdu`, audit IA).
- FAQ finale `<h2 id="faq">` avec 3 à 5 `<div class="faq-item"><h3>…</h3><p>…</p></div>`
  (balisée automatiquement en FAQPage).
- Conclusion `<div class="conclusion-box">` avec un appel à l'action vers la page service.

## Catégories

`seo`, `saas`, `ecommerce`, `cyber`, `fintech`, `rh` (voir `CAT_CONFIG` dans `blog.html`).
