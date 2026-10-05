// Générateur de src/lib/i18n.ts — source unique : la table ci-dessous.
// Exécution : bun scripts/gen-i18n.mjs
import { writeFileSync } from "node:fs"

/** [fr, en, es, it, ar, zh] pour chaque clé. */
const T = {
  "common.retry": ["Réessayer", "Try again", "Reintentar", "Riprova", "أعد المحاولة", "重试"],
  "common.backHome": ["Retour à l'accueil", "Back to home", "Volver al inicio", "Torna alla home", "العودة إلى الصفحة الرئيسية", "返回首页"],
  "common.loadMore": ["Charger plus", "Load more", "Cargar más", "Carica altro", "تحميل المزيد", "加载更多"],
  "common.search": ["Rechercher", "Search", "Buscar", "Cerca", "بحث", "搜索"],
  "common.close": ["Fermer", "Close", "Cerrar", "Chiudi", "إغلاق", "关闭"],
  "common.language": ["Langue", "Language", "Idioma", "Lingua", "اللغة", "语言"],
  "common.views": ["lectures", "reads", "lecturas", "letture", "قراءة", "次阅读"],
  "common.readTime": ["min de lecture", "min read", "min de lectura", "min di lettura", "دقيقة قراءة", "分钟阅读"],
  "common.loading": ["Chargement…", "Loading…", "Cargando…", "Caricamento…", "جارٍ التحميل…", "加载中…"],
  "header.edition": ["Édition du {date}", "Edition of {date}", "Edición del {date}", "Edizione del {date}", "طبعة {date}", "{date} 刊"],
  "header.home": ["Accueil", "Home", "Inicio", "Home", "الرئيسية", "首页"],
  "header.dashboard": ["Tableau de bord", "Dashboard", "Panel", "Dashboard", "لوحة القيادة", "数据看板"],
  "header.cockpit": ["Cockpit", "Cockpit", "Cockpit", "Cockpit", "غرفة التحرير", "编辑部"],
  "header.cockpitFull": ["Cockpit rédaction", "Editorial cockpit", "Cockpit de redacción", "Cockpit redazione", "غرفة تحرير المجلة", "编辑工作台"],
  "header.about": ["À propos", "About", "Acerca de", "Chi siamo", "من نحن", "关于我们"],
  "header.contact": ["Contact", "Contact", "Contacto", "Contatti", "اتصل بنا", "联系我们"],
  "header.navigation": ["Navigation", "Navigation", "Navegación", "Navigazione", "التنقل", "导航"],
  "header.categories": ["Rubriques", "Sections", "Secciones", "Rubriche", "الأقسام", "栏目"],
  "header.writeToRedaction": ["Écrire à la rédaction", "Write to the newsroom", "Escribir a la redacción", "Scrivi alla redazione", "اكتب إلى هيئة التحرير", "致信编辑部"],
  "header.searchAria": ["Rechercher (Ctrl+K)", "Search (Ctrl+K)", "Buscar (Ctrl+K)", "Cerca (Ctrl+K)", "بحث (Ctrl+K)", "搜索 (Ctrl+K)"],
  "header.openMenu": ["Ouvrir le menu de navigation", "Open navigation menu", "Abrir el menú de navegación", "Apri il menu di navigazione", "افتح قائمة التنقل", "打开导航菜单"],
  "header.homeAria": ["REFERENCE.COM — Retour à l'accueil", "REFERENCE.COM — Back to home", "REFERENCE.COM — Volver al inicio", "REFERENCE.COM — Torna alla home", "REFERENCE.COM — العودة إلى الرئيسية", "REFERENCE.COM — 返回首页"],
  "header.taglineFallback": ["Comprendre le monde, article par article", "Understanding the world, one article at a time", "Entender el mundo, artículo por artículo", "Capire il mondo, articolo per articolo", "فهم العالم، مقالاً بمقال", "读懂世界，一篇一世界"],
  "header.themeLight": ["Passer en thème clair", "Switch to light theme", "Cambiar a tema claro", "Passa al tema chiaro", "التبديل إلى المظهر الفاتح", "切换到浅色主题"],
  "header.themeDark": ["Passer en thème sombre", "Switch to dark theme", "Cambiar a tema oscuro", "Passa al tema scuro", "التبديل إلى المظهر الداكن", "切换到深色主题"],
  "ticker.live": ["En direct", "Live", "En directo", "In diretta", "مباشر", "快讯"],
  "home.featured": ["À la une", "Top stories", "Portada", "In primo piano", "الأبرز", "头条"],
  "home.featuredEmpty": ["Les articles à la une arrivent très bientôt.", "Featured articles are coming very soon.", "Los artículos destacados llegarán muy pronto.", "Gli articoli in evidenza arriveranno molto presto.", "المقالات المميزة قادمة قريباً جداً.", "精选文章即将上线。"],
  "home.summary": ["Sommaire", "Overview", "Sumario", "Sommario", "نظرة عامة", "导览"],
  "home.exploreCategories": ["Explorer par rubrique", "Explore by section", "Explorar por sección", "Esplora per rubrica", "استكشف حسب القسم", "按栏目浏览"],
  "home.fil": ["Le fil", "Latest", "Lo último", "Gli ultimi", "الأحدث", "最新"],
  "home.articles": ["Articles", "Articles", "Artículos", "Articoli", "مقالات", "文章"],
  "home.continuous": ["En continu", "Latest news", "En continuo", "In continuo", "على مدار الساعة", "持续更新"],
  "home.latest": ["Derniers articles", "Latest articles", "Últimos artículos", "Ultimi articoli", "أحدث المقالات", "最新文章"],
  "trending.title": ["Les plus lus", "Most read", "Los más leídos", "I più letti", "الأكثر قراءة", "阅读排行"],
  "fact.title": ["Le saviez-vous ?", "Did you know?", "¿Sabía usted?", "Lo sapevi?", "هل تعلم؟", "你知道吗？"],
  "article.notFound": ["Article introuvable", "Article not found", "Artículo no encontrado", "Articolo non trovato", "المقال غير موجود", "文章未找到"],
  "article.video": ["Reportage vidéo", "Video report", "Reportaje en vídeo", "Servizio video", "تقرير مصور", "视频报道"],
  "article.illustration": ["Illustration", "Illustration", "Ilustración", "Illustrazione", "صورة توضيحية", "插图"],
  "article.topics": ["Sujets", "Topics", "Temas", "Argomenti", "مواضيع", "话题"],
  "article.related": ["À lire aussi", "Read more", "Leer también", "Da leggere anche", "اقرأ أيضاً", "延伸阅读"],
  "article.prev": ["Article précédent", "Previous article", "Artículo anterior", "Articolo precedente", "المقال السابق", "上一篇"],
  "article.next": ["Article suivant", "Next article", "Artículo siguiente", "Articolo successivo", "المقال التالي", "下一篇"],
  "category.recent": ["Récent", "Recent", "Reciente", "Recenti", "الأحدث", "最新"],
  "category.popular": ["Populaire", "Popular", "Popular", "Popolari", "الأكثر قراءة", "热门"],
  "category.emptyTitle": ["Pas encore d'article dans cette rubrique", "No articles in this section yet", "Aún no hay artículos en esta sección", "Ancora nessun articolo in questa rubrica", "لا توجد مقالات في هذا القسم بعد", "该栏目暂无文章"],
  "category.emptyHint": ["Les premiers dossiers arrivent bientôt.", "The first features are coming soon.", "Los primeros reportajes llegarán pronto.", "I primi servizi arriveranno presto.", "المقالات الأولى قادمة قريباً.", "首批深度报道即将上线。"],
  "category.count": ["{count} article(s)", "{count} article(s)", "{count} artículo(s)", "{count} articolo(i)", "{count} مقال/مقالات", "{count} 篇文章"],
  "category.explored": ["Vous avez exploré toute cette catégorie.", "You have explored this entire section.", "Ha explorado toda esta sección.", "Hai esplorato tutta questa rubrica.", "لقد استكشفت هذا القسم بالكامل.", "您已浏览完该栏目的全部内容。"],
  "category.none": ["Aucun article dans cette catégorie pour le moment.", "No articles in this section for now.", "No hay artículos en esta sección por ahora.", "Nessun articolo in questa rubrica per ora.", "لا توجد مقالات في هذا القسم حالياً.", "该栏目暂无文章。"],
  "search.title": ["Recherche", "Search", "Búsqueda", "Ricerca", "بحث", "搜索"],
  "search.placeholder": ["Rechercher un article, un sujet, un auteur…", "Search an article, a topic, an author…", "Buscar un artículo, un tema, un autor…", "Cerca un articolo, un argomento, un autore…", "ابحث عن مقال أو موضوع أو كاتب…", "搜索文章、话题或作者…"],
  "search.resultsFor": ["Résultats pour « {query} »", "Results for “{query}”", "Resultados para «{query}»", "Risultati per «{query}»", "نتائج البحث عن «{query}»", "“{query}”的搜索结果"],
  "search.resultsCount": ["{count} article(s) trouvé(s)", "{count} article(s) found", "{count} artículo(s) encontrado(s)", "{count} articolo/i trovato/i", "تم العثور على {count} مقال", "找到 {count} 篇文章"],
  "search.emptyTitle": ["Aucun résultat", "No results", "Sin resultados", "Nessun risultato", "لا توجد نتائج", "没有结果"],
  "search.emptyHint": ["Essayez un autre mot-clé ou explorez les sujets du moment.", "Try another keyword or explore trending topics.", "Pruebe otra palabra clave o explore los temas del momento.", "Prova un'altra parola chiave o esplora gli argomenti del momento.", "جرّب كلمة أخرى أو استكشف مواضيع الساعة.", "换个关键词试试，或浏览热门话题。"],
  "search.suggestions": ["Les sujets du moment", "Trending topics", "Temas del momento", "Argomenti del momento", "مواضيع الساعة", "热门话题"],
  "search.loading": ["Recherche en cours…", "Searching…", "Buscando…", "Ricerca in corso…", "جارٍ البحث…", "搜索中…"],
  "search.resultsWord": ["résultat(s)", "result(s)", "resultado(s)", "risultato(i)", "نتيجة/نتائج", "条结果"],
  "search.resultsForWord": ["pour", "for", "de", "per", "عن", ""],
  "search.placeholderExamples": ["Essayez « abeilles », « inflation », « sommeil »…", "Try “bees”, “inflation”, “sleep”…", "Pruebe «abejas», «inflación», «sueño»…", "Prova «api», «inflazione», «sonno»…", "جرّب «النحل» أو «التضخم» أو «النوم»…", "试试「蜜蜂」「通胀」「睡眠」…"],
  "search.noneFor": ["Aucun résultat pour « {query} »", "No results for “{query}”", "Sin resultados para «{query}»", "Nessun risultato per «{query}»", "لا نتائج عن «{query}»", "「{query}」无结果。"],
  "search.dialogTitle": ["Rechercher sur REFERENCE.COM", "Search on REFERENCE.COM", "Buscar en REFERENCE.COM", "Cerca su REFERENCE.COM", "ابحث في REFERENCE.COM", "在 REFERENCE.COM 搜索"],
  "search.dialogPlaceholder": ["Rechercher un article, un dossier…", "Search an article, a feature…", "Buscar un artículo, un reportaje…", "Cerca un articolo, un servizio…", "ابحث عن مقال أو تقرير…", "搜索文章、专题…"],
  "search.prompt": ["Chercher un dossier", "Search a feature", "Buscar un reportaje", "Cerca un servizio", "ابحث عن تقرير", "搜索专题"],
  "search.label": ["Votre recherche", "Your search", "Su búsqueda", "La tua ricerca", "بحثك", "您的搜索"],
  "search.spellHint": ["Vérifiez l'orthographe ou explorez une rubrique ci-dessous.", "Check the spelling or explore a section below.", "Compruebe la ortografía o explore una sección abajo.", "Controlla l'ortografia o esplora una rubrica qui sotto.", "تحقق من الإملاء أو استكشف قسماً أدناه.", "请检查拼写，或浏览下方栏目。"],
  "search.trendingTitle": ["Les sujets du moment", "Trending topics", "Temas del momento", "Argomenti del momento", "مواضيع الساعة", "热门话题"],
  "newsletter.title": ["La lettre de référence", "The reference newsletter", "La carta de referencia", "La lettera di riferimento", "نشرة المرجع", "参考通讯"],
  "newsletter.description": ["Chaque dimanche, l'essentiel décrypté par la rédaction. Gratuit, sans spam.", "Every Sunday, the essentials decoded by our newsroom. Free, no spam.", "Cada domingo, lo esencial decodificado por la redacción. Gratis, sin spam.", "Ogni domenica, l'essenziale decifrato dalla redazione. Gratis, senza spam.", "كل أحد، خلاصة مفسّرة من هيئة التحرير. مجاناً، دون إزعاج.", "每周日，编辑部为您解读要闻。免费，无垃圾邮件。"],
  "newsletter.placeholder": ["Votre adresse e-mail", "Your email address", "Su dirección de correo", "Il tuo indirizzo e-mail", "بريدك الإلكتروني", "您的电子邮箱"],
  "newsletter.subscribe": ["S'abonner", "Subscribe", "Suscribirse", "Iscriviti", "اشترك", "订阅"],
  "newsletter.successDefault": ["Merci ! Vous êtes bien inscrit·e à la newsletter.", "Thank you! You are now subscribed to the newsletter.", "¡Gracias! Ya está suscrito a la newsletter.", "Grazie! Ora sei iscritto alla newsletter.", "شكراً! تم اشتراكك في النشرة البريدية.", "感谢订阅！您已成功加入新闻通讯。"],
  "newsletter.invalid": ["Adresse e-mail invalide", "Invalid email address", "Dirección de correo no válida", "Indirizzo e-mail non valido", "بريد إلكتروني غير صالح", "电子邮箱无效"],
  "newsletter.invalidLong": ["Veuillez saisir une adresse e-mail valide.", "Please enter a valid email address.", "Introduzca una dirección de correo válida.", "Inserisci un indirizzo e-mail valido.", "يرجى إدخال بريد إلكتروني صالح.", "请输入有效的电子邮箱地址。"],
  "newsletter.check": ["Vérifiez votre saisie puis réessayez.", "Check your entry and try again.", "Compruebe lo escrito e inténtelo de nuevo.", "Controlla quanto digitato e riprova.", "تحقق من ما أدخلته وحاول مجدداً.", "请检查输入后重试。"],
  "newsletter.confirmed": ["Inscription confirmée", "Subscription confirmed", "Suscripción confirmada", "Iscrizione confermata", "تم تأكيد الاشتراك", "订阅成功"],
  "newsletter.fallback": ["Merci, vous êtes bien abonné·e à la newsletter.", "Thank you, you are now subscribed to the newsletter.", "Gracias, ya está suscrito a la newsletter.", "Grazie, ora sei iscritto alla newsletter.", "شكراً، لقد اشتركت في النشرة البريدية.", "感谢订阅我们的新闻通讯。"],
  "newsletter.failed": ["Inscription impossible", "Subscription failed", "No se pudo suscribir", "Iscrizione non riuscita", "تعذر الاشتراك", "订阅失败"],
  "newsletter.error": ["Une erreur est survenue, réessayez.", "Something went wrong, please try again.", "Ha ocurrido un error, inténtelo de nuevo.", "Si è verificato un errore, riprova.", "حدث خطأ، حاول مجدداً.", "出现错误，请重试。"],
  "newsletter.sending": ["Envoi…", "Sending…", "Enviando…", "Invio…", "جارٍ الإرسال…", "发送中…"],
  "newsletter.welcome": ["Bienvenue ! Vérifiez votre boîte mail.", "Welcome! Check your inbox.", "¡Bienvenido! Revise su bandeja de entrada.", "Benvenuto! Controlla la tua casella mail.", "مرحباً! تفقد بريدك الوارد.", "欢迎！请查收邮件。"],
  "contact.pageTitle": ["Contact", "Contact", "Contacto", "Contatti", "اتصل بنا", "联系我们"],
  "contact.name": ["Nom", "Name", "Nombre", "Nome", "الاسم", "姓名"],
  "contact.email": ["Adresse e-mail", "Email address", "Correo electrónico", "Indirizzo e-mail", "البريد الإلكتروني", "电子邮箱"],
  "contact.subject": ["Sujet", "Subject", "Asunto", "Oggetto", "الموضوع", "主题"],
  "contact.message": ["Message", "Message", "Mensaje", "Messaggio", "الرسالة", "留言内容"],
  "contact.send": ["Envoyer le message", "Send message", "Enviar mensaje", "Invia messaggio", "إرسال الرسالة", "发送留言"],
  "contact.sending": ["Envoi en cours…", "Sending…", "Enviando…", "Invio in corso…", "جارٍ الإرسال…", "发送中…"],
  "contact.success": ["Message bien reçu. La rédaction vous répondra sous 48 h ouvrées.", "Message received. The newsroom will reply within 48 business hours.", "Mensaje recibido. La redacción responderá en 48 h laborables.", "Messaggio ricevuto. La redazione risponderà entro 48 ore lavorative.", "تم استلام رسالتك. ستجيب هيئة التحرير خلال 48 ساعة عمل.", "留言已收到，编辑部将在 48 个工作小时内回复。"],
  "contact.subjects.redaction": ["Rédaction", "Newsroom", "Redacción", "Redazione", "هيئة التحرير", "编辑部"],
  "contact.subjects.correction": ["Correction", "Correction", "Corrección", "Correzione", "تصحيح", "勘误"],
  "contact.subjects.partenariat": ["Partenariat", "Partnership", "Colaboración", "Collaborazione", "شراكة", "合作"],
  "contact.subjects.publicite": ["Publicité", "Advertising", "Publicidad", "Pubblicità", "إعلانات", "广告"],
  "contact.subjects.droits": ["Droits", "Rights", "Derechos", "Diritti", "الحقوق", "版权"],
  "contact.subjects.autre": ["Autre", "Other", "Otro", "Altro", "أخرى", "其他"],
  "contact.subjects.redactionLong": ["Rédaction — question sur un article", "Newsroom — question about an article", "Redacción — pregunta sobre un artículo", "Redazione — domanda su un articolo", "هيئة التحرير — سؤال عن مقال", "编辑部 — 关于文章的提问"],
  "contact.subjects.correctionLong": ["Correction — signaler une erreur", "Correction — report an error", "Corrección — informar de un error", "Correzione — segnala un errore", "تصحيح — الإبلاغ عن خطأ", "勘误 — 报告错误"],
  "contact.subjects.partenariatLong": ["Partenariat éditorial", "Editorial partnership", "Colaboración editorial", "Collaborazione editoriale", "شراكة تحريرية", "内容合作"],
  "contact.subjects.publiciteLong": ["Publicité & sponsorship", "Advertising & sponsorship", "Publicidad y patrocinio", "Pubblicità e sponsorizzazioni", "إعلانات ورعاية", "广告与赞助"],
  "contact.subjects.droitsLong": ["Droits & réutilisation", "Rights & reuse", "Derechos y reutilización", "Diritti e riutilizzo", "الحقوق وإعادة الاستخدام", "版权与转载"],
  "contact.subjects.autreLong": ["Autre demande", "Other request", "Otra consulta", "Altra richiesta", "طلب آخر", "其他事项"],
  "contact.nameFull": ["Nom complet *", "Full name *", "Nombre completo *", "Nome completo *", "الاسم الكامل *", "姓名 *"],
  "contact.namePlaceholder": ["Votre nom et prénom", "Your first and last name", "Su nombre y apellidos", "Il tuo nome e cognome", "اسمك الكامل", "您的姓名"],
  "contact.subjectLabel": ["Sujet *", "Subject *", "Asunto *", "Oggetto *", "الموضوع *", "主题 *"],
  "contact.subjectPlaceholder": ["Sélectionnez le motif de votre message", "Select the reason for your message", "Seleccione el motivo de su mensaje", "Seleziona il motivo del messaggio", "اختر سبب رسالتك", "请选择留言事由"],
  "contact.messageLabel": ["Message *", "Message *", "Mensaje *", "Messaggio *", "الرسالة *", "留言 *"],
  "contact.messagePlaceholder": ["Décrivez votre demande avec le plus de détails possible…", "Describe your request in as much detail as possible…", "Describa su consulta con el mayor detalle posible…", "Descrivi la tua richiesta nel modo più dettagliato possibile…", "صف طلبك بأكبر قدر من التفصيل…", "请尽可能详细地描述您的需求…"],
  "contact.sent": ["Message envoyé", "Message sent", "Mensaje enviado", "Messaggio inviato", "تم إرسال الرسالة", "留言已发送"],
  "contact.received": ["Message bien reçu", "Message received", "Mensaje recibido", "Messaggio ricevuto", "تم استلام الرسالة", "留言已收到"],
  "contact.another": ["Écrire un autre message", "Write another message", "Escribir otro mensaje", "Scrivi un altro messaggio", "اكتب رسالة أخرى", "再写一条留言"],
  "contact.errName": ["Veuillez indiquer votre nom (2 caractères minimum).", "Please enter your name (2 characters minimum).", "Indique su nombre (2 caracteres como mínimo).", "Inserisci il tuo nome (minimo 2 caratteri).", "يرجى كتابة اسمك (حرفان على الأقل).", "请填写您的姓名（至少 2 个字符）。"],
  "contact.errSubject": ["Veuillez sélectionner un sujet.", "Please select a subject.", "Seleccione un asunto.", "Seleziona un oggetto.", "يرجى اختيار موضوع.", "请选择一个主题。"],
  "contact.replyDelay": ["Réponse sous 48 h", "Reply within 48 h", "Respuesta en 48 h", "Risposta entro 48 h", "الرد خلال 48 ساعة", "48 小时内回复"],
  "footer.copyright": ["© 2025 REFERENCE.COM — Comprendre le monde, article par article.", "© 2025 REFERENCE.COM — Understanding the world, one article at a time.", "© 2025 REFERENCE.COM — Entender el mundo, artículo por artículo.", "© 2025 REFERENCE.COM — Capire il mondo, articolo per articolo.", "© 2025 REFERENCE.COM — فهم العالم، مقالاً بمقال.", "© 2025 REFERENCE.COM — 读懂世界，一篇一世界。"],
  "footer.brandLine": ["Le portail de référence francophone.", "The French-language reference portal.", "El portal de referencia francófono.", "Il portale di riferimento francofono.", "البوابة المرجعية الناطقة بالفرنسية.", "法语世界的参考门户。"],
  "footer.newsletter": ["Newsletter", "Newsletter", "Newsletter", "Newsletter", "النشرة البريدية", "新闻通讯"],
  "footer.newsletterPitch": ["Le meilleur de nos dossiers, une fois par semaine, directement dans votre boîte mail.", "The best of our features, once a week, straight to your inbox.", "Lo mejor de nuestros reportajes, una vez por semana, directamente en su correo.", "Il meglio dei nostri servizi, una volta a settimana, direttamente nella tua casella mail.", "أفضل تقاريرنا، مرة في الأسبوع، مباشرة إلى بريدك.", "每周将我们的精选报道直送您的邮箱。"],
  "footer.follow": ["Nous suivre", "Follow us", "Síganos", "Seguici", "تابعنا", "关注我们"],
  "footer.followOn": ["Suivre REFERENCE.COM sur {platform}", "Follow REFERENCE.COM on {platform}", "Siga REFERENCE.COM en {platform}", "Segui REFERENCE.COM su {platform}", "تابع REFERENCE.COM على {platform}", "在 {platform} 上关注 REFERENCE.COM"],
  "footer.legal": ["Mentions légales", "Legal notice", "Aviso legal", "Note legali", "إشعارات قانونية", "法律声明"],
  "footer.privacy": ["Confidentialité", "Privacy", "Privacidad", "Privacy", "الخصوصية", "隐私政策"],
  "about.title": ["À propos", "About", "Acerca de", "Chi siamo", "من نحن", "关于我们"],
  "about.mission": ["Notre mission", "Our mission", "Nuestra misión", "La nostra missione", "مهمتنا", "我们的使命"],
  "about.values": ["Nos valeurs", "Our values", "Nuestros valores", "I nostri valori", "قيمنا", "我们的价值观"],
  "about.team": ["La rédaction", "The newsroom", "La redacción", "La redazione", "هيئة التحرير", "编辑部"],
  "lang.choose": ["Choisir la langue", "Choose language", "Elegir idioma", "Scegli la lingua", "اختر اللغة", "选择语言"],
  "lang.translating": ["Traduction en cours…", "Translating…", "Traduciendo…", "Traduzione in corso…", "جارٍ الترجمة…", "翻译中…"],
}

const LANGS = ["fr", "en", "es", "it", "ar", "zh"]
const keys = Object.keys(T)

function dict(lang, index) {
  const entries = keys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(T[key][index])},`)
  return entries.join("\n")
}

const header = `/**
 * REFERENCE.COM — Internationalisation du site public.
 *
 * Langues : français (source) + en | es | it | ar (RTL) | zh.
 * - Les libellés de l'interface proviennent des dictionnaires ci-dessous.
 * - Les contenus éditoriaux (articles, rubriques) sont traduits côté serveur
 *   (src/lib/translate.ts) avec cache en base — voir ArticleTranslation.
 *
 * ⚠️ Fichier généré par scripts/gen-i18n.mjs : modifier la table du générateur
 * puis relancer « bun scripts/gen-i18n.mjs » — ne pas éditer à la main.
 */

export const LANGUAGES = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
  { code: "it", label: "Italiano", short: "IT" },
  { code: "ar", label: "العربية", short: "AR" },
  { code: "zh", label: "中文", short: "ZH" },
] as const

export type Lang = (typeof LANGUAGES)[number]["code"]

export const DEFAULT_LANG: Lang = "fr"

/** Langues proposées à la traduction serveur (tout sauf le français). */
export const TRANSLATED_LANGS: Lang[] = ["en", "es", "it", "ar", "zh"]

export function isLang(value: string | null | undefined): value is Lang {
  return LANGUAGES.some((lang) => lang.code === value)
}

/** Sens de lecture — l'arabe se lit de droite à gauche. */
export function isRtl(lang: Lang): boolean {
  return lang === "ar"
}

/** Libellé affichable d'une langue. */
export function langLabel(lang: Lang): string {
  return LANGUAGES.find((entry) => entry.code === lang)?.label ?? lang
}

/* -------------------------------------------------------------------------- */
/*                               Dictionnaires                                */
/* -------------------------------------------------------------------------- */
`

const body = LANGS.map((lang, index) => {
  const decl = index === 0 ? `const ${lang} = {` : `const ${lang}: Record<TranslationKey, string> = {`
  return `${decl}\n${dict(lang, index)}\n}`
}).join("\n\n")

const footer = `
export type TranslationKey = keyof typeof fr

/* Les six dictionnaires couvrent exactement les mêmes clés (contrôlé par le type). */

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = {
  fr,
  en,
  es,
  it,
  ar,
  zh,
}

/** Traduction d'un libellé d'interface, avec paramètres {nom}. */
export function translateUi(
  lang: Lang,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dictionary = DICTIONARIES[lang] ?? DICTIONARIES.fr
  let text = dictionary[key] ?? DICTIONARIES.fr[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll("{" + name + "}", String(value))
    }
  }
  return text
}
`

writeFileSync("src/lib/i18n.ts", header + body + "\n" + footer)
console.log(`i18n.ts régénéré : ${keys.length} clés x ${LANGS.length} langues`)
