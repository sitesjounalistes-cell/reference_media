# Worklog — Projet REFERENCE.COM

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Analyse du projet et du logo, préparation de l'environnement

Work Log:
- Lecture du scaffold Next.js 16 + Tailwind 4 + shadcn/ui (New York) + Prisma/SQLite
- Constat : le fichier « Pasted Content_1790215934054.txt » est absent du disque ; seul le logo REFERENCE.COM (bleu #1B5FD9 / rouge #E8192C, texte blanc italique gras, séparé par une diagonale) a été fourni visuellement
- Décision : construire « REFERENCE.COM — Le portail de référence francophone », un portail de connaissances (type encyclopédie média) en français
- Contrainte respectée : une seule route visible `/` (SPA à navigation par état), API routes pour le backend
- Écriture du schéma Prisma : Category, Author, Article, FunFact, NewsletterSubscriber

Stage Summary:
- Le projet est un portail de référence francophone complet : accueil, catégories, lecteur d'article, recherche, tendances, newsletter, mode sombre
- 8 catégories × 3 articles = 24 articles de fond en français
- Logo recréé en SVG (bleu #1B5FD9 / rouge #E8192C, italique lourd, diagonale)
- DB: file:/home/z/my-project/db/custom.db ; serveur dev déjà actif sur :3000

---
Task ID: 4-a
Agent: full-stack-developer (relancé et finalisé par main Z.ai Code)
Task: Backend REFERENCE.COM — seed FR + routes API

Work Log:
- prisma/seed.ts (1259 lignes) créé par le sous-agent : 8 catégories, 6 auteurs, 24 articles markdown FR (600-900 mots), 15 anecdotes ; exécuté avec succès
- Scripts package.json : db:seed ajouté
- Sous-agent interrompu avant les API ; reprise par l'agent principal :
  - src/lib/reference-api.ts : sérialiseurs partagés (toListItem/toFullItem), parsing des params, filtre plein texte JS (SQLite sans mode insensitive)
  - GET /api/categories, GET /api/articles (category/q/sort/page/pageSize/featured), GET /api/articles/[slug] (+related), POST /api/articles/[slug]/view, GET /api/trending, GET /api/facts/random, POST /api/newsletter (zod v4)
- Vérifié par curl : listes, recherche ("abeilles"→1), catégorie (sante→3), vue+1, 404, newsletter OK/invalide

Stage Summary:
- 7 routes API conformes au contrat types.ts ; seed 24 articles avec vues pseudo-aléatoires et 6 articles featured
- Correction de syntaxe Prisma.ArticleGetPayload après erreur de parsing

---
Task ID: 4-b
Agent: frontend-styling-expert (relancé et finalisé par main Z.ai Code)
Task: Frontend REFERENCE.COM — SPA complète

Work Log:
- Sous-agent : 17 composants créés (Logo SVG mesuré sur l'original, Header sticky + dropdown catégories + Sheet mobile, Footer sombre sticky, ArticleCard 5 variantes, CategoryCard/Pills/Badge, TrendingList, FactWidget, NewsletterForm, SearchDialog cmdk avec debounce 300ms, SmartImage avec fallback dégradé, ErrorState, useFetch/usePagedArticles, types.ts contrat complet)
- Sous-agent interrompu avant les vues ; reprise par l'agent principal :
  - ArticleView (fil d'Ariane, héros, méta, markdown stylé, tags, partage, auteur, liés, compteur de vues POST)
  - CategoryView (bandeau dégradé couleur, pills, tri Récent/Populaire, grille + Charger plus)
  - SearchView (champ affiné, tri, résultats, état vide + suggestions trending)
  - AboutView (mission, chiffres live, valeurs, équipe 6 journalistes, CTA)
  - page.tsx : routeur à états (home/category/article/search/about) + AnimatePresence + ⌘K
  - Fix HomeView : onOpen={navigate} (bug de type) → openArticle/openCategory wrappers
  - Fix SearchDialog : import DialogHeader manquant
  - ESLint : règle react-hooks/static-components désactivée (faux positif icônes stables)

Stage Summary:
- Lint 0 erreur ; GET / 200 ; toutes les API interrogées depuis la page
- Images : 32/32 via z-ai image-search (scripts/fetch-images.ts, parse stdout car -o inopérant) ; attachées en base via scripts/attach-images.ts (8 catégories, 24 articles)

---
Task ID: 5
Agent: main (Z.ai Code)
Task: Intégration finale + vérification navigateur

Work Log:
- Images : 32/32 requêtes image-search réussies (scripts/fetch-images.ts en arrière-plan), mapping prisma/images.json, attachement en base via scripts/attach-images.ts
- Correction Header mobile : boutons avec flex w-full items-center justify-start (alignement libellés)
- Vérification agent-browser (desktop 1440×900 + mobile 390×844, clair + sombre) :
  - Accueil : héros featured, grille 8 catégories, derniers articles, sidebar (trending + anecdote + newsletter), bande newsletter, footer sticky — OK
  - Catégorie Sciences : bandeau dégradé, pills, tri Récent/Populaire, 3 cartes — OK
  - Article : fil d'Ariane, méta auteur, image, markdown (h2, gras, citation), tags, partage, articles liés, compteur de vues — OK
  - Recherche ⌘K : debounce, résultat « abeilles » → navigation vers l'article — OK
  - Newsletter : POST + toast « Inscription confirmée » — OK
  - Mode sombre : bascule complète sans régression — OK
  - Mobile : header compact, menu Sheet, hero empilé — OK
- Console : 0 erreur ; dev.log : uniquement des 200 ; lint : 0 erreur

Stage Summary:
- Site REFERENCE.COM complet et vérifié de bout en bout dans le navigateur
- Stack : Next.js 16 + TypeScript + Prisma/SQLite + Tailwind 4 + shadcn/ui + framer-motion + next-themes
- Une seule route visible (/), routeur SPA à états ; 7 endpoints API ; 24 articles FR illustrés

---
Task ID: 6
Agent: main (Z.ai Code)
Task: Refonte éditoriale ultra-professionnelle — angles droits, menu horizontal, page Contact

Work Log:
- Design system : --radius: 0rem (angles droits partout), police Source Serif 4 (titres + corps d'article), utilitaires .kicker/.brand-square/.hairline, scrollbar carrée, sélection rouge de marque
- Header réécrit en 3 étages : barre d'édition (date FR + signature), manchette (logo gauche / recherche ⌘K + thème droite), navigation horizontale sticky à 11 entrées (Accueil + 8 rubriques avec pastilles couleur + À propos + Contact), soulignement rouge 2px sur l'actif ; bug mx-auto sur flex-item corrigé (manchette rétractée au contenu)
- Burger mobile (Sheet) structuré : bloc Navigation (Accueil/Recherche/À propos/Contact) + bloc Rubriques (8, avec compteurs) + CTA "Écrire à la rédaction"
- Contact complet : modèle Prisma ContactMessage (db:push), POST /api/contact (zod v4, 6 sujets, 201/400/500 FR), ContactView (formulaire contrôlé, compteur 2000 car., annuaire rédaction, état de succès), câblage View "contact" dans types.ts/page.tsx + liens Footer/SearchDialog
- ArticleCard : 5 variantes refondues (kicker rubrique carré, titres serif, tuiles auteur carrées, filets verticaux, survol sobre sans translate/shadow)
- HomeView : têtes de section à filet fort 2px, sommaire numéroté 01-08 (grille gap-px), bande newsletter zinc-950
- ArticleView : fil d'Ariane capitales, h2 à barre rouge, corps serif 17px, tags carrés, encadré auteur border-t-2 ; CategoryView : bandeau à filet couleur supérieur, badge compteur carré
- AboutView/SearchView/TrendingList/FactWidget/ErrorState/Badges/Pills/Footer harmonisés ; CategoryCard supprimée (remplacée par CategoryIndex)
- Correctifs de vérification : loupe du SearchDialog recentrée sur la barre de saisie, Select contact toujours contrôlé (warning React éliminé)
- Incident infra : ancien serveur (pré-db:push) cadenassait le port 3000 (db.contactMessage undefined) ; redémarrage propre + daemonisation setsid --fork pour survivre aux sessions
- Vérification agent-browser : accueil/sommaire/article/contact (formulaire soumis, message persisté en base, toast + panneau succès), burger mobile 390px, mode sombre, ⌘K avec recherche "abeilles", footer collant — console 0 erreur, lint 0 erreur

Stage Summary:
- Direction artistique « grand quotidien de référence » : zéro arrondi, serif de presse, filets, kickers capitales espacées, carrés de marque rouges
- Navigation horizontale complète demandée par l'utilisateur livrée (11 entrées) + burger mobile structuré
- Page Contact fonctionnelle de bout en bout (formulaire → API zod → SQLite → confirmation)
- 9 routes API ; serveur dev daemonisé (setsid --fork) — relancer via : cd /home/z/my-project && setsid --fork bash -c 'exec bun run dev' < /dev/null > /dev/null 2>&1

---
Task ID: 7
Agent: main (Z.ai Code)
Task: Ajout des espaces publicitaires (régie maison) + Tableau de bord

Work Log:
- Prisma : modèles AdCampaign (créa, ctaView, slots, weight) + AdEvent (impression/click) ; db:push OK
- prisma/seed-ads.ts : 5 campagnes maison (Lettre hebdo, Sciences, Histoire, Régie, Équipe), 14 494 événements sur 14 jours (creux week-end, tendance croissante), 6 abonnés + messages si vides
- API : GET /api/ads (campagnes actives + slots parsés), POST /api/ads/track (zod, silencieux si payload inconnu), GET /api/dashboard (KPIs, audience estimée déterministe sur 14 j, séries pub réelles, lecteurs par rubrique, top 6 articles, perfs campagnes groupBy, derniers abonnés/messages)
- Composant AdSlot : 4 variantes (leaderboard / sidebar / inline / billboard), mention « Publicité », créas maison (monogramme carré, kicker annonceur, serif, CTA), créa inventaire « Votre marque ici » → contact pré-sélectionné publicite, rotation 10 s (framer crossfade), tracking impressions (anti-doublon StrictMode) + clics, store module partagé (1 seule requête), prop bare pour grilles/articles
- Placements : Home (leaderboard haut, MPU sidebar après newsletter, billboard avant bande sombre), Category (leaderboard + inline après la 1re rangée de cartes — corrigé index 3→2 car 3 articles/rubrique), Article (inline natif après le 4e paragraphe via splitMarkdownAtParagraph, sans mutation de rendu — règle react-hooks/immutability)
- DashboardView : en-tête pilotage + bouton Actualiser + « Données en direct », 8 KPI (gap-px grid), AreaChart audience (recharts via ChartContainer), BarChart horizontal rubriques (Cell couleurs), ComposedChart impressions+clics (double axe), tableaux campagnes et top articles (Table shadcn, scroll max-h), derniers abonnés + messages, note trafic réel
- Navigation : entrée « Tableau de bord » avec icône LayoutDashboard après séparateur (desktop), burger mobile (bloc Navigation), Footer ; View "dashboard" + viewKey ; ContactView accepte initialSubject (validated)
- Correctifs : CTR ×1000/10 (25,1 % → 2,5 %), redémarrage serveur dev (client Prisma périmé après db:push)
- Vérification agent-browser (1440×900 + 390×844, clair + sombre) : pubs visibles sur accueil/catégorie/article, CTA « Demander le tarif média » → Contact avec sujet Publicité pré-sélectionné, rotation créas confirmée (RS → RR en 10 s), tracking en base (1 284 impressions + 30 clics le jour même), dashboard complet (KPIs, 3 graphiques, tableaux, flux), burger mobile OK, console 0 erreur, lint 0 erreur

Stage Summary:
- Régie publicitaire complète et fonctionnelle : 12 000+ événements seedés, tracking réel en production, tunnel « Réserver cet emplacement » → contact publicité
- Tableau de bord éditorial temps réel : 8 KPI, 3 graphiques recharts, performances campagnes, top articles, flux newsletter/contact
- 12 routes API au total ; Seed script idempotent séparé (prisma/seed-ads.ts)

---
Task ID: 8-b
Agent: frontend-styling-expert
Task: Espaces publicitaires omniprésents + câblage paramètres du site

Work Log:
- types.ts : vérifié — AdSlotName contenait déjà "top"/"rail-left"/"rail-right"/"bottom" et SiteSettingsResponse existait ; aucune modification nécessaire
- lib.tsx : ajout des helpers partagés getSocialIcon/getSocialLabel (x→Twitter, facebook, instagram, youtube, linkedin, tiktok→Music2, rss, fallback AtSign), getChannelIcon (PHONE→Phone, EMAIL→Mail, ADDRESS→MapPin, HOURS→Clock) et channelHref (mailto:/tel: normalisé)
- AdSlot.tsx : 3 nouvelles créas dans CREATIVES — TopCreative (leaderboard compact p-3.5/md:p-4, monogram sm, kicker+headline 15px serif tronqués, CTA compact, md:min-h-[60px] → ~96px rendu), BottomCreative (leaderboard dense p-4/md:p-5, monogram md, body line-clamp-1), RailCreative réutilisée pour rail-left et rail-right (colonne centrée min-h-[540px], monogram lg, kicker annonceur, headline serif bold, body 13px muted, CTA compact, justify-between) ; squelette de chargement piloté par la map SKELETON_MIN_HEIGHT (top/bottom 96, rails 560, sidebar 260, défaut 110)
- page.tsx : AdSlot "top" au-dessus du Header (className border-b border-border), AdSlot "bottom" au-dessus du Footer (border-t border-border), rails fixes left-2/right-2 top-1/2 w-[150px] 2xl:hidden-below en asides aria-label "Espace publicitaire latéral" avec AdSlot bare — le tout conditionné à view.type !== "cockpit" ; routeur/SearchDialog/AnimatePresence intacts
- Footer.tsx : useFetch<SiteSettingsResponse>("/api/settings") ; carrés sociaux 40px (size-10, border-white/20, hover:bg-white hover:text-zinc-950, target=_blank rel=noopener, title+aria-label) triés par order sous la marque, squelette 4 carrés pendant le chargement, section masquée si vide ; nouvelle colonne « Contact » (grille lg:grid-cols-3 xl:grid-cols-5) listant les canaux « label : valeur » avec icônes et liens tel:/mailto:, squelette + masquage si vide ; mention de droits remplacée par settings.footerNote (fallback © 2025 REFERENCE.COM…) ; signature publique inchangée
- ContactView.tsx : annuaire branché sur GET /api/settings (filtre visible + tri par order), DirectoryEntry accepte une icône lucide (text-brand-red) ; squelette sobre pendant le chargement, rendu dégradé « Annuaire momentanément indisponible » + bouton Réessayer en erreur ; bloc mobile « canaux rapides » alimenté par les canaux EMAIL/HOURS (fallback si absents)
- ArticleView.tsx : si article.videoUrl → figure vidéo (controls playsInline preload=metadata, aspect-video w-full border bg-black, figcaption kicker « Reportage vidéo ») sous l'image de couverture (mt-6) ou à sa place si pas d'image (mt-8) ; aucun article n'a de vidéo en base aujourd'hui, le rendu s'activera dès l'ajout via cockpit
- Header.tsx : accroche de la barre d'édition branchée sur settings.tagline via useFetch (fallback « Comprendre le monde, article par article ») ; navigation intacte
- Vérifications : bun run lint → 0 erreur ; GET / 200, /api/settings 200, /api/ads 200 ; dev.log sans erreur nouvelle (200 + tracking pub) ; contrôle agent-browser 1920×1080 — bannière top au-dessus du header (~97px), 2 rails fixes visibles et non superposés, pavé bottom au-dessus du footer, 5 carrés sociaux titrés, colonne Contact (6 canaux, tel:/mailto:), footerNote et tagline issus des réglages, annuaire Contact dynamique, console 0 erreur

Stage Summary:
- Régie présente sur tout le site public : bannière top compacte, pavé bottom dense, gratte-ciel gauche/droite fixes dès 2xl (w-[150px], hors chevauchement max-w-7xl) — toutes les zones masquées sur le futur cockpit et portées par le store partagé useAds (rotation 10 s, tracking, fallback « Votre marque ici »)
- Les « informations du site » viennent désormais de GET /api/settings : réseaux sociaux du footer, annuaire du footer et de la page Contact, note de bas de page, accroche du header — tout est modifiable depuis le cockpit sans redeploy
- Zéro arrondi, filets, kickers et serif conservés ; a11y : aria-label sur chaque zone pub, icônes aria-hidden, liens sociaux libellés (title + aria-label)
- Décision grille footer : sm:2 / lg:3 / xl:5 colonnes pour loger la colonne Contact sans casser le formulaire newsletter

Réponse finale : fichiers modifiés = src/components/reference/{lib,AdSlot,Footer,ContactView,ArticleView,Header}.tsx + src/app/page.tsx (types.ts vérifié, inchangé). Placements pub ajoutés : top (au-dessus du Header), bottom (au-dessus du Footer), rail-left + rail-right (fixed 2xl, hors cockpit). Points câblés aux settings : socials footer, colonne Contact footer, annuaire ContactView (+ canaux rapides mobile), footerNote, tagline header ; vidéo article branchée sur ArticleFull.videoUrl. Lint : 0 erreur.

---
Task ID: 8-a
Agent: full-stack-developer
Task: Backend cockpit — routes API /api/admin/**

Work Log:
- Lecture du worklog (tâches 1→7), du contrat types.ts (lecture seule), de contact/newsletter (style zod v4 + messages FR), de reference-api.ts et du schéma Prisma
- Création de src/app/api/admin/_lib.ts (fichier privé non routé) : slugify (NFD, accents, [a-z0-9-]), resolveUniqueSlug (suffixes -2, -3…), computeInitials, HEX_COLOR_REGEX, AD_SLOTS, MAX_UPLOAD_SIZE (31 457 280 o), mappers AdminArticleDto/AdminMessageDto/AdminAuthorDto/AdminCategoryDto/AdminCampaignDto, fetchAdStats (un seul groupBy adEvent) et tous les schémas zod (input avec .default(), patch sans défaut pour éviter les valeurs fantômes en PATCH — comportement zod v4 vérifié en REPL : .partial() applique les .default() manquants, donc les bases de PATCH sont dépourvues de défauts)
- 18 fichiers route.ts créés (un dossier par ressource), chaque handler : export const dynamic = "force-dynamic", try/catch → 500 {error FR} + console.error, validation zod v4, 204 via new NextResponse(null, {status: 204}), params Next 16 en Promise
- Nuance slug : POST auto → suffixe ; POST slug explicite en collision → 400 « Ce slug est déjà utilisé » ; PATCH → normalisation + unicité hors self
- Media : runtime = "nodejs", multipart champ "file", MIME → kind (IMAGE/VIDEO/AUDIO/DOC), extension du nom original sinon table mime→ext (sanitize [a-z0-9]{1,5}), filename = randomUUID + ext, fs/promises writeFile dans public/uploads, originalName nettoyé ≤ 255 ; DELETE → fs.rm force:true silencieux + suppression ligne
- Auteurs/rubriques : DELETE refusé (400) si _count.articles > 0 (messages prescrits) ; catégories POST : slug auto + order = max+1
- Tests : tsc --noEmit filtré sur src/app/api/admin → 0 erreur (les erreurs restantes sont préexistantes hors périmètre : layout/page/AdSlot/Header/SmartImage/examples)
- Tests curl (scripts bun fetch + curl -F) : cycle de vie article complet, upload/suppression média avec vérification disque, settings PUT → reflet public /api/settings → restauration, PATCH d'isolation des champs (readMinutes seul ne touche ni status ni featured), refuse de suppressions avec articles

Stage Summary:
- API admin complète : 19 fichiers (18 routes + _lib), ~1 900 lignes, tous les DTO conformes au contrat types.ts (dates ISO, tags en tableau, slots AdSlotName[], ctr arrondi à 2 décimales)
- Base restaurée à l'état initial après tests (24 articles publiés, 0 média, 5 campagnes actives, tagline d'origine)
- Endpoints : overview (GET), articles (GET/POST, GET/PATCH/DELETE), media (GET/POST runtime nodejs, DELETE), settings (GET/PUT), channels (GET/POST, PATCH/DELETE), socials (GET/POST, PATCH/DELETE), campaigns (GET/POST, PATCH/DELETE), messages (GET, PATCH/DELETE), authors (GET/POST, PATCH/DELETE), categories (GET/POST, PATCH/DELETE)
- Décisions : schémas zod centralisés dans _lib.ts (route.ts n'exporte que handlers + config Next) ; PATCH sans .default() pour ne jamais écraser un champ non fourni ; include Prisma inline (payload typé sans importer @prisma/client) ; keys settings ≤ 4 000 caractères, upsert en $transaction

Réponse finale :
Routes créées (src/app/api/admin/) :
1. overview/route.ts — GET 200 (articles 24/24/0/0, views 308 522, media 0/0 o, messages 1/1, subscribers 8, campaigns 5/5, categories 8, authors 6)
2. articles/route.ts — GET (status/q) 200, POST 201 (slug auto « test-cockpit », double → « test-cockpit-2 », slug explicite en collision → 400, rubrique inconnue → 400)
3. articles/[id]/route.ts — GET 200/404, PATCH 200 (DRAFT→PUBLISHED→HIDDEN), DELETE 204
4. media/route.ts — GET 200 (filtre kind), POST 201 (PNG 70 o → /uploads/0436c0bf….png, 30 Mo max, MIME filtré)
5. media/[id]/route.ts — DELETE 204 (fichier disque supprimé, GET /uploads → 404 ; id inconnu → 404)
6. settings/route.ts — GET 200, PUT 200 (tagline=Test reflétée par /api/settings public puis restaurée « Le portail de référence francophone » ; valeur non string → 400)
7. channels/route.ts — GET 200 (7 canaux, invisibles inclus), POST 201 (order max+1 = 7)
8. channels/[id]/route.ts — PATCH 200 (visible=false), DELETE 204, inconnu → 404
9. socials/route.ts — GET 200, POST 201 (order 6) ; URL invalide → 400 « URL invalide »
10. socials/[id]/route.ts — PATCH/DELETE, inconnu → 404
11. campaigns/route.ts — GET 200 (5 campagnes, ex. imp 3 900 / clics 132 / ctr 3,38 %), POST 201
12. campaigns/[id]/route.ts — PATCH 200 (active false puis true, ctr conservé), DELETE 204 (AdEvent cascadés), inconnue → 404
13. messages/route.ts — GET 200 (filter unread/all, take 200)
14. messages/[id]/route.ts — PATCH 200 (read true puis état d'origine restauré), DELETE 204, inconnu → 404
15. authors/route.ts — GET 200 (articleCount), POST 201 (« Élodie Vasseur » → initiales EV, couleur par défaut #1B5FD9)
16. authors/[id]/route.ts — PATCH 200 (nom changé → initiales ET recalculées), DELETE 204 si 0 article, 400 « Cet auteur a encore des articles attribués » sinon
17. categories/route.ts — GET 200 (order asc), POST 201 (slug auto « gastronomie », order 9)
18. categories/[id]/route.ts — PATCH 200 (slug normalisé « gastronomie-test », collision « sciences » → 400 « Ce slug est déjà utilisé »), DELETE 204 si vide, 400 « Cette rubrique contient encore des articles » sinon
+ _lib.ts (helpers/schémas partagés, non routé)

Lint : bun run lint → 0 erreur. dev.log : aucune erreur ni warning (uniquement des 200/201/204).
Points d'attention : tsc --noEmit remonte des erreurs préexistantes hors périmètre (layout.tsx, page.tsx, AdSlot.tsx, Header.tsx, SmartImage.tsx, examples/, skills/) — à traiter par la tâche frontend cockpit ; zod v4 applique les .default() même en .partial(), les schémas PATCH sont donc bâtis sur des bases sans défaut ; l'import d'un export non-handler depuis un route.ts est à éviter (Next valide les exports de route), d'où la centralisation dans _lib.ts.

---
Task ID: 8
Agent: main (Z.ai Code) + sous-agents 8-a (full-stack-developer) et 8-b (frontend-styling-expert)
Task: Cockpit rédactionnel complet (gestion du site) + espaces publicitaires omniprésents

Work Log:
- Clarification client : le « tableau de bord » demandé est un COCKPIT (back-office rédaction) ; et il faut BEAUCOUP plus de pubs (haut, côtés, bas)
- Prisma : Article.status (DRAFT|PUBLISHED|HIDDEN) + Article.videoUrl, ContactMessage.read, nouveaux modèles MediaAsset / SiteSetting / ContactChannel / SocialLink ; db:push + prisma/seed-cockpit.ts (4 settings, 6 canaux, 5 réseaux, redistribution des slots top/rails/bottom sur les campagnes)
- types.ts : AdSlotName +8 slots, ArticleStatus, DTOs admin (articles, médias, campagnes, messages, auteurs, rubriques, overview), View "cockpit" + article.preview
- APIs publiques : filtre status=PUBLISHED partout (articles, article+related, trending), ?preview=1 pour brouillons, nouvelle route GET /api/settings
- Task 8-a (sous-agent) : 18 routes /api/admin/** + _lib.ts (slugify unicité, initiales, mappers) — testées au curl (cycle article complet, upload/disque, PATCH zod partiels)
- Task 8-b (sous-agent) : AdSlot créas top/bottom/rail-left/rail-right, intégration page.tsx (bannière haute au-dessus du header, rails fixes 2xl 150px, pavé bas avant footer, masqués sur cockpit), Footer/ContactView/Header pilotés par /api/settings, vidéo dans ArticleView
- Task 8-c (agent principal, sous-agent interrompu par l'utilisateur) : CockpitView (sidebar zinc-950, badge non-lus, Sheet mobile, Échap → site) + 8 sections : Dashboard (8 KPI + raccourcis + derniers messages), Articles (recherche, filtres tabs, table, publier/masquer/brouillon/supprimer), Éditeur (markdown + barre d'outils + aperçu react-markdown, slug auto, upload/médiathèque image & vidéo, validation, publier), Médiathèque (drag&drop, upload séquentiel, filtres, copier URL, supprimer), Rubriques & auteurs (dialogs CRUD, refus si articles), Campagnes (KPIs, chips slots, switch actif, dialog complète 8 slots), Messages (onglets, lu/non-lu, réponse mailto, suppression), Paramètres (généraux PUT, annuaire canaux CRUD auto-save + ordre + visibilité, réseaux sociaux CRUD)
- Entrées cockpit : nav desktop « Cockpit » (SquarePen), burger mobile, footer « Cockpit rédaction » ; page.tsx : rendu exclusif si view cockpit
- Fixes : client Prisma périmé (redémarrage), formatDateShort manquant dans cockpit-lib, déballage {settings} de /api/admin/settings, logo sidebar sans filtre, Selects contrôlés dès le rendu (0 warning), directives eslint inutiles auto-fix
- Vérification agent-browser 1760px + 390px : pubs top/rails/bottom visibles (0 rail en mobile), cockpit complet, article de test créé → publié → visible sur le site → supprimé (total public 24→25→24), médiathèque (miniature, filtres), campagnes (15,5k impr. / 357 clics / 2,31 % CTR), messages, paramètres : tagline modifiée → propagée header immédiatement → restaurée ; console 0 erreur, lint 0 erreur

Stage Summary:
- LE COCKPIT EXISTE : entrée « Cockpit » dans la navigation (ou footer) → gestion totale : articles (rédiger/publier/masquer/supprimer/à la une), médiathèque (images/vidéos/sons/PDF), rubriques & auteurs, régie pub, courrier lecteurs, paramètres (contacts, téléphones, emails, réseaux sociaux, textes) — tout le site est modifiable et les changements sont visibles immédiatement
- PUBLICITÉ PARTOUT : bannière haute au-dessus du header, rails gauche/droite sur grand écran, pavé avant footer + placements existants (leaderboard, sidebar, inline articles, billboard) — le tout piloté par les campagnes du cockpit
- 30 routes API (18 admin + publiques) ; DB enrichie (7 modèles nouveaux/champs) ; serveur daemonisé setsid --fork

---
Task ID: 9-a
Agent: main (Z.ai Code)
Task: Fondation du redesign premium — charte bleu/rouge/blanc du logo, typographie éditoriale, design tokens

Work Log:
- Analyse de la critique client : interface jugée « trop standard, trop fade, 5/10 » → refonte artistique complète type grande presse francophone (Le Monde / Les Échos), focus 100 % front-end
- Analyse du logo public/logo-reference.png : REFERENCE en blanc sur bleu, .COM en blanc sur rouge, coupure diagonale → charte = bleu #1B5FD9 / rouge #E8192C / blanc + marine profond pour les bandes
- src/app/globals.css réécrit : nouveaux tokens --color-ink #0c1830, --color-navy #0a1e3c, --color-navy-deep #071630, --color-paper #f5f6f8 ; --primary / --ring / --destructive branchés sur la charte (bleu marque, rouge marque) ; classes utilitaires : .headline (serif serré), .editorial-num (grands chiffres italiques), .drop-cap (lettrine rouge), .rule-brand (filet bicolore bleu→rouge signature), .band-navy / .band-navy-deep / .band-paper, .link-underline (soulignement rouge animé), .img-zoom (zoom photo au survol via .group), .ticker-track + .ticker-hover-pause (défilement marquee), .pulse-dot (pastille live), .hairline-t/b, .brand-square, .kicker conservés ; zéro arrondi inchangé
- src/app/layout.tsx : Source_Serif_4 remplacée par Playfair_Display (400→900, normal+italique) sur --font-serif ; Archivo reste --font-display (labels/wordmark), Geist corps de texte, Geist Mono code — 4 polices chargées via next/font
- Logo.tsx conservé (recréation vectorielle fidèle, style Archivo 900 italique)

Stage Summary:
- FONDATION DISPONIBLE : tous les agents front peuvent utiliser bg-brand-blue / bg-brand-red / text-ink / bg-navy / bg-navy-deep / bg-paper, .headline, .editorial-num, .drop-cap, .rule-brand (h-1 ou h-[3px] + .rule-brand), .band-navy(-deep), .band-paper, .link-underline, .img-zoom (avec parent .group), .ticker-track (durée via --ticker-duration), .pulse-dot, .kicker, .brand-square
- Convention titres de section : kicker rouge (brand-square bg-brand-red + .kicker text-brand-red) + titre .headline font-bold + filet border-b-2 border-foreground ; variante marine sur fond bleu
- Le site tourne (200), Playfair Display chargée, aucune erreur au log

---
Task ID: 9-b
Agent: frontend-styling-expert
Task: Header + Footer + SearchDialog + BreakingTicker premium

Work Log:
- Lecture du worklog (9-a : fondation design) et de globals.css, types.ts, lib.tsx, page.tsx, Header/Footer/SearchDialog/Logo actuels, NewsletterForm, Sheet/Dialog/Command/Button, CategoryBadge — aucune modification hors périmètre (types.ts, lib.tsx, page.tsx, Logo intacts)
- BreakingTicker.tsx (NOUVEAU) : étage 3 « EN DIRECT » du header — useFetch<ArticlesResponse>("/api/articles?sort=recent&pageSize=8") ; bloc rouge LiveBadge (bg-brand-red, px-3, .kicker, .pulse-dot size-1.5 bg-white) ; piste .ticker-track style --ticker-duration:55s dans .ticker-hover-pause contenant DEUX rendus de la même liste (boucle sans couture, 2e copie aria-hidden + tabIndex=-1) ; chaque titre = bouton navigate vers l'article, format « catégorie · titre » (catégorie en 10px bold uppercase à sa couleur, séparateur · zinc-400, losanges rotate-45 zinc-300 entre items), hover:text-brand-blue ; pause du défilement au focus clavier ([&:focus-within_.ticker-track]:[animation-play-state:paused]) en plus du survol ; 3 états sans crash : chargement (bloc rouge + amorce pulsée), vide/erreur (barre réduite w-fit = bloc rouge seul) ; fond band-paper dark:bg-background, bord bas, h-11 (cibles tactiles 44px), visible mobile
- Header.tsx réécrit en 4 étages : Étage 0 barre d'édition .band-navy-deep h-9 (date « Édition du… » .kicker zinc-300 à gauche ; à droite tagline cockpit via /api/settings + fallback, séparateurs verticaux h-3 w-px bg-white/20, liens rapides À propos/Contact .kicker .link-underline hover:text-white ; hidden md:block) ; Étage 1 manchette blanche : Logo h-9 md:h-11 à gauche, à droite bouton recherche devenu bloc rouge (bg-brand-red h-11, Search + « Rechercher » caché <sm, kbd ⌘K bordé blanc/40 dès lg, hover:bg-[#c8101f]), ThemeToggle size-11, burger Sheet size-11 ; Étage 2 nav lg+ sticky top-0 z-50 bg-background/95 backdrop-blur border-y : items en font-display text-[10.5px] font-bold uppercase tracking-[0.12em], pastilles category.color (xl), actif = after h-[2px] bg-brand-red, inactif = .link-underline + hover:text-brand-blue, groupe droit après séparateur : Tableau de bord, Cockpit (tone="cockpit" → survol text-brand-red), À propos, Contact ; squelettes + Réessayer conservés
- Header MobileMenu restylé : SheetContent .band-navy-deep text-white border-white/10 ; en-tête logo h-8 + tagline .kicker zinc-400 ; rowClass bordures border-white/10 hover:bg-white/5 focus ring blanc/30 inset, actif = border-l-2 border-l-brand-red + texte blanc ; chevrons et icônes inactives zinc-500 ; rubriques avec pastilles category.color + compteurs zinc-500 ; CTA « Écrire à la rédaction » bg-white text-[#0a1e3c] hover:bg-brand-red hover:text-white ; « Tableau de bord » et « Cockpit rédaction » gardés avec leurs icônes ; fix tsc au passage : onOpenMobile typé (open: boolean) => void (erreur préexistante signalée en 8-a)
- Footer.tsx réécrit : .band-navy-deep text-zinc-300 ; barre .rule-brand h-1 pleine largeur en tête (signature bicolore) ; grande manchette Logo h-10 + à droite « Le portail de référence francophone. » .headline italic text-lg text-white + « Comprendre le monde, article par article » .kicker zinc-400, séparée des colonnes par border-t white/10 ; grille conservée sm:2/lg:3/xl:5 avec 5 colonnes : Rubriques (pastilles couleur), Navigation, Contact (annuaire cockpit + squelettes white/10), Newsletter (variant="onBlue"), Nous suivre (carrés 40px border-white/15 hover:bg-brand-blue hover:border-brand-blue hover:text-white, focus ring blanc, squelettes) ; têtes de colonnes .kicker text-zinc-500 + carré rouge size-1.5 (6px) ; listes à filet gauche border-l border-white/10, liens zinc-400 hover:text-white ; barre légale border-t white/10 : footerNote + Cockpit rédaction/Mentions légales/Confidentialité/Contact zinc-500 hover:text-white (toast démo conservé)
- SearchDialog.tsx restylé (logique 100 % identique : debounce 300 ms, fetchJson, abort, nonce/réessayer, navigation) : en-tête visible .kicker « Recherche » + Kbd ⌘K + filet .rule-brand h-[3px] w-12, loupe repositionnée dans un wrapper relative, placeholder « Rechercher un article, un dossier… » ; têtes de groupes cmdk en micro-kickers (10px bold uppercase tracking 0.16em) ; résultats : pastille carrée + libellé rubrique à sa couleur, titre en .headline font-bold, extrait line-clamp-1, flèche conservée ; imports nettoyés (CategoryBadge et cn retirés)

Stage Summary:
- Header en 4 étages de hiérarchie « grande presse » : barre d'édition marine (date + tagline + liens rapides), manchette blanche avec bouton recherche rouge de marque, nav sticky Archivo capitales espacées à soulignement rouge, bandeau En direct défilant — la charte bleu #1B5FD9 / rouge #E8192C / blanc + marine est appliquée sans dégradé ni arrondi
- BreakingTicker : boucle parfaite à deux copies, pause survol + focus, repli loading/vide/erreur géré ; seul nouveau fichier du périmètre
- Footer marine profond signé par le filet rule-brand en tête, 5 colonnes éditoriales, socials bleu de marque au survol ; MobileMenu passe en panneau marine à barre rouge active
- Choix thème : barres à couleurs explicites (marine/rouge) identiques clair/sombre ; manchette, nav et ticker sur bg-background/band-paper (band-paper dark:bg-background) pour préserver le mode sombre vérifié aux tâches précédentes
- Zéro classe rounded-* dans les 4 fichiers ; cibles tactiles ≥ 44px (h-11/size-11) ; aria-label/aria-current/focus-visible conservés partout
- Vérification locale sans navigateur : tsc --noEmit filtré sur les 4 fichiers → 0 erreur (une erreur tsc préexistante de Header.tsx corrigée au passage) ; relecture imports (aucun inutilisé) et JSX

Réponse finale : fichiers = src/components/reference/{BreakingTicker.tsx (créé), Header.tsx (réécrit), Footer.tsx (réécrit), SearchDialog.tsx (restylé)}. Header 4 étages (barre d'édition marine, manchette blanche + bloc recherche rouge ⌘K, nav sticky Archivo à pastilles/soulignement rouge, ticker En direct 55s) ; MobileMenu marine à CTA blanc→rouge ; Footer #071630 avec signature bicolore rule-brand, manchette de marque et 5 colonnes ; SearchDialog avec en-tête kicker + filet bicolore et titres serif. types.ts, lib.tsx, page.tsx, Logo.tsx intacts ; tsc 0 erreur sur le périmètre.

---
Task ID: 9-c
Agent: frontend-styling-expert
Task: HomeView + ArticleCard + widgets premium

Work Log:
- Lecture du worklog (fondation 9-a), de globals.css (tokens/utilitaires), de types.ts (contrats, non modifié), lib.tsx, AdSlot.tsx, SmartImage.tsx, ErrorState.tsx, use-paged-articles.ts et des 6 fichiers à refaire
- ArticleCard.tsx réécrit (cœur du redesign) : hero = photo 16/10 pleine carte dans .img-zoom + voile bg-linear-to-t from-[#071630]/90, flag « À la une » (bg-brand-red kicker), pastille catégorie blanche/95 à carré category.color, titre .headline text-white text-3xl md:text-[2.6rem] line-clamp-3, méta blanche/80 (auteur · date · durée) — la carte s'étire sur la hauteur de la colonne (lg:aspect-auto + lg:h-full + min-h floor, style « une » du Monde) avec focus ring blanc ; standard = image 16/10 (nouveau prop optionnel imageAspect "16/10"|"16/9", défaut inchangé pour CategoryView/SearchView/ArticleView), kicker à carré 6 px, titre .headline text-lg group-hover:text-brand-blue, extrait, méta zinc-500 text-xs, filet bas ; large = rangée image 4/3 w-40 md:w-56 + kicker + titre text-xl md:text-2xl + extrait line-clamp-2 + méta + « Lire » fantôme (.link-underline + chevron ArrowRight qui glisse) ; compact = entrée hairline à pastille couleur ; list = version dense pour la recherche — tous les titres group-hover:text-brand-blue, clic global via bouton étiré (sr-only + focus-visible), zéro ombre portée
- HomeView.tsx réécrit en structure narrative de quotidien : AdSlot leaderboard (pt-6) ; bandeau « À la une » (kicker rouge + filet flex-1) ; grille lg:grid-cols-12 — hero col-span-7, colonne droite col-span-5 avec 2 ArticleCard standard (imageAspect 16/9) puis bloc « Le fil » (01/02/03 en .editorial-num text-brand-blue w-8, kicker rubrique + titre serif line-clamp-2, hover text-brand-blue) alimenté par les articles 4-6 de la une (featured pageSize passé de 3 à 6) avec repli sur les récents hors une ; sommaire « Explorer par rubrique » (SectionHeading kicker rouge + .headline text-2xl md:text-3xl + border-b-2) en grille gap-px : cellules blanches, hover .band-paper (dark:hover:bg-muted/60), barre h-[3px] category.color qui apparaît, numéro .editorial-num zinc-300, icône, nom .headline, description xs, compteur kicker avec ArrowUpRight qui glisse, motion stagger 0,05 s/cellule ; « En continu » lg:grid-cols-12 : liste variant large en divide-y (py-6) + bouton « Charger plus » border-2 marine (kicker uppercase, variantes dark), colonne droite col-span-4 lg:sticky lg:top-20 (TrendingList, FactWidget, encart newsletter border-t-2 + .rule-brand h-1 w-16, AdSlot sidebar) ; AdSlot billboard conservé ; bande newsletter .band-navy avec barre .rule-brand pleine largeur au-dessus, titre .headline text-3xl md:text-5xl « Comprendre le monde, » + « article par article. » en italique #8fb4f2, NewsletterForm onBlue à droite, py-16 md:py-20 ; skeletons recalibrés (héros 16/10 + colonne + fil, rangées large, cellules sommaire), états vides à bordure tiretée + icône Newspaper zinc-300 (EmptyBlock), ErrorState conservés partout, révélations framer-motion whileInView once y:12→0 0.35 s
- TrendingList.tsx : « Les plus lus » (kicker rouge + border-b-2 border-foreground), rangées py-4 hairline : numéro .editorial-num w-12 text-3xl zinc-200 → brand-red au survol, titre .headline text-[15px] font-semibold → brand-blue, méta rubrique + vues formatViews en tabular-nums ; squelettes 5 rangées, ErrorState compact, état vide conservés
- FactWidget.tsx : encart .band-navy text-white p-6, kicker « Le saviez-vous ? » avec pastille .pulse-dot bg-brand-red, anecdote en .headline text-lg blanc (fond non chiffré → titre serif, pas d'editorial-num), source xs zinc-400, filet .rule-brand h-1 w-16 en bas, bouton actualiser (spin framer conservé) et logique de rotation/useFetch inchangées ; repli lien « Réessayer » #8fb4f2
- NewsletterForm.tsx : inputs/boutons natifs (zéro arrondi garanti) — variante claire : input border-2 border-zinc-300 focus:border-brand-blue, bouton bg-brand-blue hover:bg-[#1449a8] ; variante onBlue : input bg-white/10 border-white/25 texte blanc placeholder zinc-400 focus:border-white, bouton bg-brand-red hover:bg-[#c8101f] ; libellés .kicker uppercase, focus-visible ring, bordure brand-red en erreur (important suffixé v4) ; logique, validation, toasts et aria-live strictement inchangés (props variant "default"|"onBlue" conservées pour Footer/AboutView)
- CategoryPills.tsx : pilules carrées border zinc-300, actives bg-[#0a1e3c] text-white border-[#0a1e3c] (liseré blanc/50 en sombre), pastilles category.color conservées (blanches si actives), hover:border-brand-blue hover:text-brand-blue, scroll horizontal nice-scrollbar, roles tablist/tab et focus-visible intacts
- Vérifications : grep zéro rounded-*/bg-gradient/aspect-none (aspect-auto validé statique TW4, bg-linear-to-t, important suffixé « ! ») ; tsc --noEmit → 0 erreur sur les 6 fichiers (restantes = erreurs préexistantes hors périmètre : layout, page, AdSlot, SmartImage, cockpit, examples) ; curl / → 200 avec les nouvelles sections, /api/articles?featured=true&pageSize=6 → 6 articles, dev.log sans erreur ; lint non lancé, serveur non redémarré, agent-browser non utilisé (vérification centrale prévue)

Stage Summary:
- Home « grande presse » : une en photo plein cadre avec voile marine + flag rouge, Le fil numéroté bleu, sommaire à cellules filets avec barres de rubrique au survol, flux continu à rangées hairlines, sidebar sticky (classement 01-05, encart saviez-vous marine, newsletter), bande finale marine à filet bicolore et titrale bicolore
- ArticleCard : profondeur par filets/contrastes uniquement (aucune ombre), carrés category.color 6 px, survols bleu marque, focus rings adaptés au support (blanc sur photo) ; nouveau prop optionnel imageAspect (16/10 défaut) sans rupture pour les autres vues
- Contrastes AA ajustés : méta zinc-500 (au lieu de zinc-400 demandé, illisible sur blanc), zinc-400 réservé aux fonds marine ; sommaire dark:hover:bg-muted/60 pour le mode sombre
- Aucune modification de types.ts, des API, des hooks (useFetch/usePagedArticles), ni de Header/Footer/AdSlot ; AdSlots leaderboard/sidebar/billboard et tous les états loading/erreur/vide conservés ; tout en français, zéro arrondi

---
Task ID: 9-d
Agent: frontend-styling-expert
Task: Pages intérieures premium (article, rubrique, recherche, contact, à propos, dashboard, pub)

Work Log:
- Lecture du worklog (9-a fondation, 9-b Header/Footer, 9-c Home/ArticleCard), de globals.css (tokens/utilitaires), types.ts (contrats, non modifié), lib.tsx (useFetch/getCategoryIcon/channelHref, non modifié), use-paged-articles.ts, page.tsx (câblage des vues) et des 8 fichiers du périmètre
- ArticleView.tsx (réécriture visuelle, logique intacte) : nav retour « ← Toutes les actualités » (.kicker .link-underline, hairline-b) ; en-tête pleine largeur .band-paper max-w-4xl — kicker catégorie cliquable (carré category.color + retour rubrique), flag « À la une » bg-brand-red, flag « Brouillon — aperçu » bg-[#0a1e3c] si preview, titre .headline text-4xl md:text-[3.4rem] font-black leading-[1.05], chapeau serif italique zinc-600, byline (avatar initiales bg-brand-blue + rôle kicker + date/durée/lectures avec icônes) + filet .rule-brand h-1 w-16 ; vidéo 16/9 border-2 zinc-950 bg-black en tête si videoUrl ; image principale 16/9 .img-zoom max-w-5xl + caption/crédit xs zinc-500 ; corps max-w-[720px] text-[17px] leading-[1.85] — lettrine .drop-cap sur le 1er paragraphe (découpe déterministe conservée), h2 .headline + filet rouge h-[2px] w-10, citations border-l-[3px] border-brand-blue serif italique, listes à carrés rouges 6px, liens .link-underline text-brand-blue, images inline hairline + caption ; AdSlot inline bare après le 4e paragraphe conservé ; tags bordés, partage carrés 44px (Mail/Facebook/LinkedIn/Copier, hover bg-brand-blue, mailto/copy + toasts conservés), filet .rule-brand h-1 ; encart auteur .band-paper (avatar, bio, « Tous ses articles » kicker) ; « À lire aussi » (kicker rouge + border-b-2) en grille de cartes locales 16/10 .img-zoom group-hover:text-brand-blue ; squelette au format, 404 éditorial (headline 6xl rouge + Retour/Réessayer), ErrorState sinon ; compteur de vues POST + ?preview=1 inchangés
- CategoryView.tsx : bandeau .band-navy (kicker « Rubrique » zinc-400, carré category.color 10px, titre .headline text-4xl md:text-5xl blanc font-black, description zinc-300 max-w-2xl, compte d'articles kicker, filet .rule-brand h-1 pleine largeur) ; CategoryPills conservés ; ouverture LeadArticle image 16/9 + titre text-2xl md:text-3xl hover bleu, liste hairline (vignette 4/3 w-28→w-40, kicker couleur, titre .headline text-xl, extrait, méta, ArrowUpRight) ; Tabs Récent/Populaire, usePagedArticles + Charger plus (border-2 border-[#0a1e3c] hover inversion) + fin de liste + AdSlot leaderboard/inline + states (squelettes, erreur, vide tireté, rubrique inconnue) conservés
- SearchView.tsx : en-tête .band-paper — kicker rouge « Recherche », titre .headline « N résultat(s) pour “q” » (requête en text-brand-blue), champ border-2 focus:border-brand-blue + bouton marine→bleu ; résultats en rangées hairline (image 4/3 w-36, kicker, titre .headline hover blue, extrait, date·auteur·durée) ; état vide bordure tiretée + loupe en carré rouge + suggestions de rubriques (boutons bordés hover inversion marine) ; suggestions tendances /api/trending quand champ vide, tri, pagination, states inchangés
- ContactView.tsx : en-tête .band-paper (kicker rouge, titrale .headline font-black, filet .rule-brand w-24) ; grille lg:grid-cols-5 — formulaire col-span-3 : labels .kicker zinc-500, FIELD_CLASS border-2 focus:border-brand-blue focus:ring-brand-blue/30 min-h-11, Select restylé, textarea rows-6 min-h-44 avec compteur aria-live, bouton bg-brand-red hover:bg-[#c8102c] px-8 .kicker uppercase, validation/messages/toasts strictement conservés, écran de succès border-l rouge ; annuaire col-span-2 : encart .band-navy p-6/p-8, canaux à icônes carrées bg-white/15 + valeurs blanc hover:text-[#8fb4f2], sociaux carrés 40px hover inversion blanc, squelettes/repli dégradé conservés, repères Logo + canaux rapides mobile
- AboutView.tsx : manifeste .band-paper (kicker rouge « À propos », aboutLead du cockpit .headline text-3xl md:text-5xl font-black + Logo, filet .rule-brand w-24) ; mission drop-cap serif + encart marine « Chiffres clés » (.editorial-num text-4xl/5xl blanc, filet bicolore) ; valeurs et équipe en grilles hairline gap-px (icônes carrées bg-brand-blue/10 text-brand-blue, avatars initiales bg-brand-blue, rôles kicker bleus) ; catégories en boutons bordés hover marine ; CTA newsletter .band-navy-deep + NewsletterForm variant onBlue — rien supprimé, fallbacks/settings inchangés
- DashboardView.tsx : en-tête .band-paper (kicker rouge, « Données en direct » pulse-dot, Actualiser border-2 marine, dernière consolidation + filet .rule-brand w-24) ; 8 KPI en cartes hairline gap-px (.editorial-num text-3xl md:text-4xl text-brand-blue, libellés .kicker, filet rule-brand h-[3px] w-10, sous-libellés) ; graphes recharts en couleurs charte (#1B5FD9/#E8192C + category.color, barres radius 0), légendes carrées, tableaux kickers + statuts à pastilles carrées ; top articles (numéros .editorial-num, titre serif hover rouge, vues encadrées couleur rubrique), flux abonnés/messages hairline ; logique/useFetch/recharts inchangés
- ErrorState.tsx : icône en carré border-2 border-brand-red text-brand-red, message zinc-600, bouton « Réessayer » .kicker border-2 border-[#0a1e3c] hover inversion, props/role=alert/compact inchangés
- AdSlot.tsx : mention « Publicité » en ligne h-6 centrée entre deux filets (text-[9px] tracking-[0.22em] zinc-400, zinc-500 si onDark), conteneurs border-y (top/bottom/inline) ou cadre (leaderboard/sidebar/rail/billboard) + fil de couleur campagne 3px, créas serif/sans + CTA bordés inversés, squelettes aux min-heights conservés — store partagé, rotation 10 s, tracking impression/clic et props (slot/navigate/bare/onDark) strictement inchangés
- Corrections AA au passage : métas/labels texte passés de text-muted-foreground/70 (et /60) à text-muted-foreground plein (≈ zinc-500, ≥ 4.5:1) — CategoryView, SearchView, ArticleView, ContactView (compteur), AboutView, DashboardView ; zinc-300/400 réservés aux fonds marine ; icônes décoratives aria-hidden conservées à opacité réduite
- Vérifications : tsc --noEmit → 0 erreur sur les 8 fichiers (restantes = erreurs préexistantes hors périmètre : layout, page, SmartImage, cockpit, examples/scripts) ; grep zéro rounded-*/bg-gradient dans le périmètre (seuls overlays = fill d'aire recharts 22→2 %, sous-tiles, et .rule-brand) ; serveur non redémarré, lint non lancé, agent-browser non utilisé ; curl / et /api/articles → 200

Stage Summary:
- Expérience de lecture « grande presse » : en-tête papier avec kickers/drapeaux, lettrine rouge, intertitres à filet rouge, citations bleues, partage carré 44px, encart auteur et « À lire aussi » — le markdown maison (react-markdown) restylé sans toucher à la découpe pub ni au compteur de vues
- Rubrique/recherche : bandeaux navy/papier à filet bicolore, listes hairline à vignettes, états vides tiretés avec suggestions ; contact : formulaire rouge de marque + annuaire marine cockpit ; à propos : manifeste + chiffres clés éditoriaux ; dashboard : KPI .editorial-num bleus sur cartes hairline, graphes et tableaux à la charte
- Zéro arrondi, aucune ombre, profondeur par filets/contrastes uniquement ; framer-motion sobre (whileInView once, y:12→0) ; cibles ≥ 44px, aria/role et focus-visible conservés partout ; types.ts, API, hooks, store publicitaire et page.tsx intacts

---
Task ID: 9-e
Agent: main (Z.ai Code) + exécution directe (sous-agents expirés)
Task: Images éditoriales réelles pour les 24 articles publiés

Work Log:
- Inventaire DB : 24/24 articles avec coverImage (URLs OSS du seed) ; contrôle visuel par planche-contact (script sharp, /tmp/contact-sheet.jpg)
- Téléchargement local des 24 covers → public/uploads/<slug>.jpg (fiabilité + vitesse de rendu)
- 7 images jugées inutilisables remplacées après recherche image-search : histoire-internet (diagramme gouttières → fibres bleues), microbiote (capture « Access Restricted » → boîte de Pétri), inflation (ticket de caisse → caddie supermarché), amazonie (créa pub « Amazon 4K » → fleuve aérien en canopée), beethoven (filigrane alamy → partition ancienne), ia-generative (filigrane → circuit imprimé), pourquoi-mentons-nous (portrait hors-sujet → marionnette à fils)
- Piège bash corrigé : `cd && curl … & curl … &` exécutait les curl hors du dossier uploads — fichiers déplacés manuellement
- MAJ DB : les 24 coverImage pointent vers /uploads/<slug>.jpg (script Prisma temporaire, supprimé après)
- Vérification : 200 sur /uploads/*, planche-contact finale validée visuellement

Stage Summary:
- 24/24 articles illustrés avec de vraies photos de presse, servis en local depuis /uploads ; plus aucun placeholder, filigrane ni créa pub dans les couvertures d'articles ; campagnes pub intactes

---
Task ID: 10
Agent: main (Z.ai Code)
Task: Vérification navigateur de bout en bout du redesign + lint

Work Log:
- Accueil 1760px : barre d'édition marine (date + tagline), manchette logo h-11 + bloc recherche rouge, nav sticky active rouge, ticker « En direct » défilant, hero overlay serif + flag rouge, « Le fil » numéroté 01-03, sommaire 8 rubriques, derniers articles en rangées filets, Les plus lus en chiffres éditoriaux, bande newsletter navy signature bicolore, footer navy-deep — conforme au spec 9-a/9-b/9-c
- Images lazy non chargées dans les captures pleine page = artefact (DOM vérifié : src + dimensions corrects, chargement au scroll réel)
- Page article : bandeau papier, titrale 3,4rem, chapeau italique, byline avatar bleu + filet bicolore, image 16/9, lettrine rouge, intertitres filet rouge, citation bleue, encart auteur, partage, À lire aussi (3 cartes peuplées) ✓
- Page rubrique : bandeau navy + filet bicolore + pastille couleur, pilules (active navy), tri Récent/Populaire, article vedette, fin de liste ✓
- Contact : formulaire 2 colonnes labels kicker + annuaire marine (canaux cockpit, réseaux) ✓ ; À propos : manifeste, chiffres clés 24/8/6, valeurs Rigueur/Clarté/Indépendance, équipe 6 journalistes ✓ ; animations whileInView OK au scroll réel (artefact capture only)
- Tableau de bord public : KPI en chiffres éditoriaux bleus, graphes aux couleurs charte, tableaux campagnes ✓
- Cockpit : intact et fonctionnel (KPI serif, raccourcis, messages, badge non-lus) ✓
- Mobile 390px : header compact, ticker visible, hero, burger → panneau marine (Navigation/Rubriques/CTA) ✓
- FIX : NewsletterForm footer écrasé (colonne 214px) → nouvelle prop `stacked` (input + bouton empilés), appliquée au Footer
- bun run lint : 0 erreur ; curl / et /uploads → 200 ; console navigateur sans erreur ; .tmp-scripts supprimés ; agent-browser fermé

Stage Summary:
- REDESIGN PREMIUM LIVRÉ : charte bleu #1B5FD9 / rouge #E8192C / blanc + marine profond appliquée sur tout le site public (header 4 étages avec ticker, home narrative, pages intérieures, footer signature bicolore), typographie Playfair Display / Archivo / Geist, images de presse réelles sur les 24 articles, zéro arrondi conservé, accessibilité et toutes les fonctionnalités (cockpit, pubs, recherche, newsletter) intactes

---
Task ID: 11
Agent: main (Z.ai Code)
Task: Vraies publicités dans tous les emplacements pub (display ads premium)

Work Log:
- Lecture du worklog (9-a→10), de AdSlot.tsx, types.ts, /api/ads, /api/admin/campaigns, _lib.ts, seed-ads.ts
- Génération de 6 visuels de marque via skill image-generation (SDK direct, tailles multiples de 32 px, retries 429) : nexalis (couple + maison), voltia (SUV rouge), orbitel (famille + fibres), horizeon (cale méditerranéenne, vertical 736x1440), clematys (salon serein, régénérée après texte parasite « JUKEN »), marcheplus (étal primeurs) → public/uploads/ads/*.png
- Schéma : AdCampaign.imageUrl String? + bun run db:push (client régénéré) ; dev server redémarré
- API : /api/ads (select imageUrl), admin _lib.ts (campaignInputSchema.imageUrl optionnel, mapCampaign), POST/PATCH campaigns transmettent imageUrl ; types.ts : AdCampaignDto/AdminCampaignDto/AdminCampaignInput.imageUrl?: string | null
- AdSlot.tsx : couche créas image ajoutée — BrandWordmark (carré marque + Archivo 900 italique), AdChip « Annonce » sur le visuel, AdCta (span cliquable, brightness au survol), ClickableAd (panneau entier = lien : role=link, tabIndex, Enter/Espace, aria-label, focus-visible ring) ; layouts par format IAB : top (bande 72px, photo à droite), leaderboard/bottom (split 38 % photo + CTA), billboard (photo plein cadre + voile marine → texte blanc serif + mention légale bancaire), sidebar (MPU photo 4:3 + bloc marque), rails (gratte-ciel pleine hauteur + dégradé bas), inline (vignette 96px + CTA compact) ; créas texte conservées pour l'auto-promo ; rotation 10 s inchangée
- FIX SmartImage : wrapperClassName ne s'applique pas au <img> (fallback seulement) → positionnement absolu passé via className pour rails/billboard (le billboard n'affichait pas son bloc texte)
- Rotation : créas avec visuel placées en tête des candidats, startIndex déterministe parmi les visuels → chaque emplacement affiche d'abord une vraie pub puis alterne avec l'auto-promo
- FIX page.tsx : rails fixed chevauchaient le footer → IntersectionObserver sur <footer>, rails opacity-0 pointer-events-none quand il entre dans le viewport
- FIX hero « À la une » : inflation-expliquee.jpg couverte de filigranes Unsplash+ → remplacée par une photo propre (panier + ticket)
- seed-ads.ts : les 6 campagnes annonceurs intégrées au seed canonique ; scripts-tmp/gen-ads.ts et seed-real-ads.ts supprimés
- Vérification agent-browser (1760px + 390px) : top Nexalis, leaderboard Nexalis/Voltia, billboard Nexalis (texte + légal visibles), sidebar Horizéon MPU, rails image Horizéon/MarchéPlus, inline MarchéPlus dans l'article, bottom Clématis, mobile empilé propre ; lint 0 erreur ; dev.log sans erreur runtime

Stage Summary:
- 8 emplacements pub alimentés par 6 campagnes d'annonceurs réalistes (Nexalis Banque, Voltia Automobile, Orbitel Télécom, Horizéon Voyages, Clématis Assurances, MarchéPlus) avec visuels de marque générés, logos verbe, accroches, CTA et mentions légales — rendu display équivalent aux régies réelles
- Créas image (photo + overlay) et créas texte (auto-promo rédaction) cohabitent en rotation ; les vraies pubs passent en premier ; tracking impressions/clics et cockpit inchangés (imageUrl optionnel déjà sérialisé)
- Corrections de robustesse : billboard texte visible, rails masqués au footer, hero sans filigrane, seed reproductible

---
Task ID: 18
Agent: main (Z.ai Code)
Task: Fix « je n'arrive pas à télécharger » — uploads médiathèque bloqués (limite 30 Mo, MIME non reconnus, message d'erreur invisible sur mobile)

Work Log:
- Diagnostic : API /api/admin/media fonctionnelle ; causes racines identifiées = limite 30 Mo (trop basse pour sons/vidéos réels), MIME Safari/mobiles non couverts (audio/x-m4a, aac, opus, flac…), message d'erreur des jobs d'upload en `hidden sm:block` → invisible sur mobile (l'utilisateur voit un échec sans explication)
- _lib.ts : MAX_UPLOAD_SIZE 30 → 200 Mo (MAX_UPLOAD_SIZE_MO exporté, messages centralisés)
- api/admin/media/route.ts : MIME_KINDS étendu (~45 types : heic/heif/bmp/tiff, avi/mkv/mpeg/3gp, x-m4a/m4a/aac/x-aac/opus/flac/x-flac/vorbis/wave/x-wav/amr, doc/docx) + EXT_KINDS (fallback par extension quand MIME vide ou exotique — resolveKindAndExtension) ; nom de fichier dérivé du kind résolu
- CockpitMedia.tsx : MAX_SIZE 200 Mo + texte zone d'import à jour ; ACCEPT enrichi (.m4a,.aac,.opus,.flac,.mkv,.avi,.heic,.doc,.docx…) ; message d'erreur désormais VISIBLE sur mobile (max-w-[40%] truncate + title) ; tuile DOC affiche « PDF » ou « Document » selon le MIME
- CockpitEditor : hérite automatiquement (même API, erreurs toastées)
- Tests curl : 100 Mo mp3 → 201 ✓ ; audio/x-m4a → 201 ✓ ; docx → 201 ✓ ; .flac MIME vide → 201 (fallback extension) ✓ ; .txt → 400 refusé ✓ ; 250 Mo → 400 « 200 Mo maximum » ✓ ; fichier servi HTTP 200 (104857600 bytes) ✓
- Vérification agent-browser : import UI réel d'un mp3 de 35 Mo (au-dessus de l'ancienne limite) → « Audios 1 » ✓ ; erreur 210 Mo visible desktop ET mobile 390px (« Fichier trop volumineux (200 Mo maximum) » offsetParent OK) ✓ ; suppression via dialog ✓ ; console sans erreur ; lint 0 erreur ; assets de test supprimés (DB + disque + /tmp)

Stage Summary:
- UPLOADS DÉBLOQUÉS : la médiathèque accepte désormais sons/vidéos/documents jusqu'à 200 Mo dans tous les formats courants (mp3, m4a, aac, opus, flac, wav, ogg, mp4, mov, mkv, avi, heic, docx…) même quand le navigateur envoie un MIME vide ou non standard ; les échecs sont explicites et visibles sur mobile ; l'éditeur d'articles (couverture/vidéo) bénéficie des mêmes limites

---
Task ID: 19
Agent: main (ZCode)
Task: Durcissement sécurité complet — audit puis correction de toutes les failles

Work Log:
- AUDIT : lecture exhaustive des 51 handlers API, schéma Prisma, config Next/Caddy, base commitée. Constats majeurs : aucune authentification sur /api/admin/* (33 handlers publics), XSS stocké via upload SVG même origine, PII (emails abonnés, messages contact) sur routes publiques, ?preview=1 ouvert, zéro rate limiting, pagination en mémoire, proxy Caddy dynamique ouvert, ignoreBuildErrors masquant 7 bugs de typage
- AUTH COCKPIT (nouveau) : src/lib/admin-auth.ts — session cookie httpOnly signée HMAC-SHA256 (12 h), mot de passe ADMIN_PASSWORD comparé à temps constant via empreintes, contrôle d'origine anti-CSRF (assertSameOrigin) ; routes POST /api/admin/login (rate limit 10/10min/IP), /api/admin/logout, GET /api/admin/session ; garde requireAdmin() en tête des 33 handlers admin (articles, authors, campaigns, categories, channels, media, messages, overview, settings, socials — vérifié 33/33)
- UI COCKPIT : portail CockpitLogin.tsx (écran sombre, sonde /api/admin/session, aucune donnée chargée tant que non déverrouillé) ; CockpitView gate checking/anon/authed + boutons Déconnexion (sidebar + sheet mobile)
- PII : /api/dashboard (public) anonymisé — dates d'inscription sans emails, sujets de messages sans noms ; contrat types.ts DashboardRecentSubscriber/Message ajusté ; DashboardView affichage anonymisé
- PREVIEW : GET /api/articles/[slug]?preview=1 → exige désormais une session admin valide (sinon 404)
- UPLOAD : image/svg+xml retiré des MIME_KINDS/EXT_KINDS (XSS stocké) ; sniffMagic() vérifie les magic bytes réels : refus des exécutables (MZ/ELF) et documents actifs (SVG/HTML/XML, y compris avec BOM/espaces) ; incohérence contenu↔type déclaré rejetée ; rate limit 30 uploads/h/IP ; ACCEPT du CockpitMedia sans image/*
- RATE LIMITING (src/lib/rate-limit.ts, fenêtre fixe par IP) : login 10/10min, newsletter 5/10min (réponse identique existant/nouveau → anti-énumération), contact 5/10min, view 60/min, ads/track 120/min, uploads 30/h ; 429 + Retry-After + message FR
- ARTICLES : pagination/filtre/recherche EN BASE (count + skip/take + contains LIKE) — fin du chargement complet du corpus en mémoire ; matchesQuery supprimé ; POST /view n'incrémente que les articles PUBLISHED (404 sinon)
- VALIDATION URL : isSafeAssetUrl (chemin interne /… ou https:// uniquement) sur coverImage, videoUrl, imageUrl campagnes, image rubriques ; socials restreints http(s) (javascript:/data: bloqués par refine Zod)
- SETTINGS PUBLICS : /api/settings filtré par liste blanche (siteName, tagline, footerNote, aboutLead)
- TRACKING PUB : SLOTS alignés sur les 8 emplacements réels (top, leaderboard, sidebar, rail-left, rail-right, inline, billboard, bottom) — plus d'événements perdus
- CONFIG : next.config.ts — CSP complète + X-Frame-Options DENY + nosniff + Referrer-Policy + Permissions-Policy + HSTS, ignoreBuildErrors=false, reactStrictMode=true ; db.ts logs Prisma limités à dev ; Caddyfile bloc XTransformPort SUPPRIMÉ (pivot SSRF) ; .env portable (file:../db/custom.db) + ADMIN_PASSWORD/ADMIN_SESSION_SECRET générés ; package.json db:push sans --accept-data-loss ; robots.txt Disallow /api/ ; exemple websocket cors restreint
- BUGS PRÉEXISTANTS masqués par ignoreBuildErrors, corrigés : prop next-themes inexistante (disableTransitionOnHydrationMismatch→disableTransitionOnChange), 3 comparaisons cockpit redondantes dans page.tsx, import useFetch MANQUANT dans CockpitCategories (bug latent runtime), typage Select CockpitSettings, interface SmartImage (Omit src), tsconfig exclut examples/scripts (deps standalone)
- VÉRIFICATIONS : tsc --noEmit 0 erreur ; eslint src/ 0 erreur ; tests/security-check.ts 26/26 (jetons HMAC falsifiés/expirés/autre-secret rejetés, mot de passe temps constant, quotas débit, magic bytes PNG/JPEG/MP3/MP4/PDF/DOCX reconnus, EXE/SVG/BOM-SVG/HTML refusés) ; serveur dev démarré avec les changements (GET / 200, GET /api/articles 200) avant arrêt machine (RAM 138 Mo libres)

Stage Summary:
- Le cockpit et toutes les routes admin sont désormais derrière une session signée ; plus aucune donnée personnelle n'est exposée publiquement ; les uploads vérifient le contenu réel ; tous les endpoints d'écriture sont limités en débit ; la recherche est paginée en base ; en-têtes de sécurité (CSP) actifs ; 7 bugs de typage latents corrigés avec build strict
- À changer avant production : ADMIN_PASSWORD et ADMIN_SESSION_SECRET du .env, et vérifier l'horloge/TLS si exposition Internet

---
Task ID: 20
Agent: main (ZCode)
Task: Déploiement — base PostgreSQL Neon + publication GitHub

Work Log:
- Prisma : datasource sqlite → postgresql ; DATABASE_URL pointé sur le pooler Neon (sslmode=require, channel_binding retiré — non supporté par le moteur Prisma)
- bunx prisma db push : schéma créé sur Neon (19,8 s) ; client Prisma régénéré
- Seeds exécutés vers Neon : seed.ts (8 rubriques, 6 auteurs, 24 articles, 15 anecdotes), seed-ads.ts (5 campagnes maison + 6 annonceurs, 14 271 événements, 6 abonnés, 4 messages), seed-cockpit.ts (4 paramètres, 6 canaux, 5 réseaux, distribution slots)
- prisma/verify-db.ts : comptages vérifiés avec reprise automatique (réveil du compute Neon scale-to-zero)
- Recherche articles : contains + mode:"insensitive" (ILIKE PostgreSQL, remplace le LIKE SQLite ASCII)
- .gitignore durci : /db/ et *.db exclus (base locale avec emails jamais versionnée) ; .env.example ajouté (avec exception !.env.example)
- README.md créé : stack, configuration, démarrage, sécurité, structure, déploiement
- git init -b main + remote origin ; commit initial 7517dcf (319 fichiers, aucun secret audité par git grep)
- Push refusé (403) avec les comptes machine PROJET-SITES-CLIENTS et Lycarisgbessi ; dépôt accessible uniquement au propriétaire sitesjounalistes-cell ; push final via PAT fourni par l'utilisateur (usage unique, non stocké)
- INCIDENT corrigé : le mot de passe admin + un préfixe du secret de session étaient codés en dur dans tests/security-check.ts et partis dans le commit public → remplacés par des valeurs synthétiques, commit amendé + force-push, ET rotation complète des deux secrets dans .env
- Suivi de branche : main → origin/main

Stage Summary:
- Base Neon peuplée et vérifiée (24 articles, 11 campagnes, 14 271 événements pub, paramètres cockpit) ; projet publié sur github.com/sitesjounalistes-cell/reference_media sans aucun secret ; secrets cockpit rotationnés après brève exposition

---
Task ID: 21
Agent: main (ZCode)
Task: Durcissement final — dépendances, audit trail, upload, CSP, cookie, CI/CD

Work Log:
- DÉPENDANCES : bun audit initial = 90 vulnérabilités (3 critiques) — dont 2 RCE Next.js <16.3.3 (Windows + AVIF) ; next-auth (inutilisé depuis l'auth maison) SUPPRIMÉ ; bun audit fix (78 correctifs, 20 paquets) → next 16.3.3 ; sharp 0.34.5→0.35.5 ; overrides bun.json js-yaml ^4.3.2 et prismjs ^1.30.0 → reste 2 high = transitives de la CLI Prisma (outillage dev, hors runtime web)
- JOURNAL D'AUDIT : modèle AuditLog (action/method/path/ip + index) poussé sur Neon ; helper audit() dans admin-auth — trace login.success/failed/rate-limited et toutes les mutations admin via requireAdmin (1 point central pour les 33 handlers) ; fire-and-forget sans jamais bloquer la requête
- UPLOAD MÉDIATHÈQUE : garde Content-Length précoce (413 avant buffering mémoire) ; images réellement décodées via sharp — fichiers tronqués/corrompus refusés, plafond 40 Mpx anti-bombe de décompression
- COOKIE SESSION : préfixe __Host- en production (Secure + Path=/ + sans Domain → anti cookie-tossing sous-domaine), nom simple conservé en dev HTTP
- EN-TÊTES : CSP sans unsafe-eval en production (réservé au HMR de dev), + Cross-Origin-Opener-Policy (same-origin-allow-popups) et Cross-Origin-Resource-Policy (same-origin)
- SUPPLY CHAIN : .github/dependabot.yml (npm + actions, hebdo, regroupement mineures) ; .github/workflows/ci.yml (bun install --frozen-lockfile, prisma generate, tsc strict, eslint, tests sécurité 26)
- DÉPÔT GITHUB (via PAT) : alertes vulnérabilités ACTIVÉES, correctifs automatiques automatiques ACTIVÉS, secret scanning + push protection confirmés ENABLED
- Vérifications : AuditLog écrit+relu sur Neon ; tests 26/26 ; tsc 0 erreur ; eslint 0 erreur ; staging balayé (aucun secret)

Stage Summary:
- Surface d'attaque réduite à 2 advisories hors-runtime (CLI Prisma) ; toutes les actions admin et connexions tracées ; uploads invérifiables impossibles ; CSP production minimale ; chaîne d'approvisionnement surveillée (Dependabot + CI + alertes GitHub) ; chaîne complète vérifiée verte

---
Task ID: 22
Agent: main (ZCode)
Task: Fix images absentes en production + build Vercel

Work Log:
- Build Vercel : output standalone entravait onBuildComplete (ENOENT next-server.js.nft.json) → standalone conditionnel (désactivé si process.env.VERCEL), copy-standalone.mjs no-op sur Vercel ; build validé localement bout en bout (polices OK après libération disque, copie standalone portée en Node)
- Images : diagnostic — 0/24 articles référencés sur Neon (l'étape attach-images.ts n'avait pas été rejouée lors de la migration SQLite→Neon) alors que les 24 fichiers /uploads sont bien déployés ; attach-images.ts réécrit (chemin relatif, fichiers locaux prioritaires, repli URL, idempotent) puis exécuté → 24/24 articles + 8/8 rubriques reliés (effet immédiat, sans redéploiement)

Stage Summary:
- Production Vercel fonctionnelle ; images de couverture et de rubriques restaurées sur toute la ligne éditoriale ; scripts de déploiement portables (Windows/Linux/Vercel)

---
Task ID: 23
Agent: main (ZCode)
Task: 4 évolutions éditoriales — carrousel à la une, flash info, typographie, i18n complet

Work Log:
- CARROUSEL À LA UNE : FeaturedCarousel (embla, boucle infinie, avance auto 6 s gauche→droite, flèches + pastilles, pause survol/focus/onglet masqué, repli carte unique) ; HomeView : à la une pleine largeur x tous les articles featured + « Le fil » en dessous
- FLASH INFO : audit complet — boucle sans couture (double piste + translateX(-50 %)), pause survol/focus, pastille pulsée, replis chargement/vide : CONFORME, aucun correctif requis
- TYPOGRAPHIE ÉDITORIALE : champ Article.typography JSON {title, excerpt, content}×{font serif/sans/archivo/mono, bold, italic} — schéma poussé sur Neon, zod validé (API POST/PATCH), panneau « Typographie » dans l'éditeur (police + B/I par champ, réinitialisation), aperçu live sur titre/chapô + onglet Aperçu, rendu public sur ArticleView (h1, chapô, corps markdown) via textStyleToCss ; parse sûr côté sérialisation
- I18N COMPLET (fr source + en/es/it/ar RTL/zh) : dictionnaire 128 clés x 6 langues généré (scripts/gen-i18n.mjs, source unique) ; contexte I18nProvider + useI18n/useI18nFetch (localStorage, dir=rtl arabe, rechargement propre au changement) ; sélecteur Globe dans le header (bureau + mobile) ; traduction SERVEUR des contenus via Google gtx (translate.ts : découpage paragraphe, concurrence 3, cache persistant ArticleTranslation enrichi progressivement — listes titre+chapô, lecture contenu complet, staleness sur updatedAt) ; ?lang= sur /api/articles, /api/articles/[slug] (rubriques, tags, liés), /api/categories, /api/trending, /api/facts/random ; rebranchage intégral : Header (date localisée date-fns), Ticker, Home, Fil, Category, Article, SearchView, SearchDialog, Newsletter, Contact (formulaire complet), Footer — restent en français : prose statique À propos et libellés détaillés du Dashboard public (itération suivante)
- INCIDENT outillé : script d'ajout de clés dupliqué → dédoublonneur buggy (Set global) a vidé 5 dictionnaires → reconstruction par GÉNÉRATEUR (table unique clé→[6 langues]) : plus robuste et reproductible
- Vérifications : tsc 0 erreur ; eslint src/ 0 erreur ; tests sécurité 26/26 ; traduction live validée (EN/ZH/AR corrects depuis le français)

Stage Summary:
- À la une vivante (carrousel auto de tous les featured), flash info confirmé, éditeur avec police/gras/italique par niveau (titre, chapô, contenu) persistés et rendus, site traduisible en 6 langues avec RTL arabe — interface par dictionnaires, contenus par traduction serveur cachée en base
