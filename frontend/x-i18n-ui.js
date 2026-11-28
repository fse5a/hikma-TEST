// ترجمة واجهة الموقع (شاشات رئيسية، حكمة+، الإعدادات، القارئ) لـ en/fr/es/de/zh. ترجمة آلية من إعدادي: محتاجة مراجعة بشرية.
// الترتيب في كل سطر: [en, fr, es, de, zh]. النصوص الديناميكية بالأرقام ليها قواعد (patterns) تحت.
(() => {
  const I = window.HikmaI18n; if (!I) return;
  const L = ['en', 'fr', 'es', 'de', 'zh'];
  const T = {
    'انتقل إلى المحتوى الرئيسي': ['Skip to main content', 'Aller au contenu principal', 'Ir al contenido principal', 'Zum Hauptinhalt springen', '跳到主要内容'],
    'قصص مكتملة': ['Stories finished', 'Histoires terminées', 'Cuentos terminados', 'Abgeschlossene Geschichten', '已读完的故事'],
    'أيام متتالية': ['Days in a row', 'Jours de suite', 'Días seguidos', 'Tage in Folge', '连续天数'],
    'قصص مفضلة': ['Favorite stories', 'Histoires préférées', 'Cuentos favoritos', 'Lieblingsgeschichten', '收藏的故事'],
    'ابدأ أول حكاية لك': ['Start your first story', 'Commencez votre première histoire', 'Empieza tu primer cuento', 'Starte deine erste Geschichte', '开始你的第一个故事'],
    'اختر حكاية من مكتبتك': ['Pick a story from your library', 'Choisissez une histoire de votre bibliothèque', 'Elige un cuento de tu biblioteca', 'Wähle eine Geschichte aus deiner Bibliothek', '从你的书库里选一个故事'],
    'اقرأ لي الصفحة': ['Read this page to me', 'Lisez-moi la page', 'Léeme la página', 'Lies mir die Seite vor', '给我朗读本页'],
    'مسح كتاب أو رمز QR': ['Scan a book or QR code', 'Scanner un livre ou un QR', 'Escanear libro o QR', 'Buch oder QR-Code scannen', '扫描书籍或二维码'],
    'مميزات حكمة': ['Hikma features', 'Fonctions de Hikma', 'Funciones de Hikma', 'Hikma-Funktionen', 'Hikma 功能'],
    'الإعدادات': ['Settings', 'Réglages', 'Ajustes', 'Einstellungen', '设置'],
    'التبديل إلى المظهر الداكن': ['Switch to dark theme', 'Passer au thème sombre', 'Cambiar al tema oscuro', 'Zum dunklen Design wechseln', '切换到深色主题'],
    'إعدادات الصوت': ['Voice settings', 'Réglages de la voix', 'Ajustes de voz', 'Spracheinstellungen', '语音设置'],
    'إضافة قصة جديدة': ['Add a new story', 'Ajouter une histoire', 'Añadir un cuento nuevo', 'Neue Geschichte hinzufügen', '添加新故事'],
    'إمكانية الوصول': ['Accessibility', 'Accessibilité', 'Accesibilidad', 'Barrierefreiheit', '无障碍'],
    'حكمة، المسه ليتكلم': ['Hikma, touch to talk', 'Hikma, touchez pour parler', 'Hikma, toca para hablar', 'Hikma, berühren zum Sprechen', 'Hikma，点一下说话'],
    'ابحث عن قصة...': ['Search for a story...', 'Chercher une histoire...', 'Buscar un cuento...', 'Geschichte suchen...', '搜索故事...'],
    'الشخصية': ['Character', 'Personnage', 'Personaje', 'Figur', '角色'],
    'مفيش مراجعة النهاردة': ['Nothing to review today', "Rien à réviser aujourd'hui", 'Nada que repasar hoy', 'Heute nichts zu wiederholen', '今天没有要复习的'],
    'ابدأ المراجعة': ['Start review', 'Commencer la révision', 'Empezar el repaso', 'Wiederholung starten', '开始复习'],
    'الكلمة': ['Word', 'Mot', 'Palabra', 'Wort', '单词'],
    'المعنى': ['Meaning', 'Sens', 'Significado', 'Bedeutung', '意思'],
    'اضغط على أي كلمة أثناء القراءة ثم «احفظ» وهتظهر هنا.': ['Tap any word while reading, then "Save" and it shows up here.', 'Touchez un mot pendant la lecture, puis « Enregistrer » : il apparaîtra ici.', 'Toca cualquier palabra al leer y pulsa «Guardar»: aparecerá aquí.', 'Tippe beim Lesen auf ein Wort und dann auf „Speichern“, dann erscheint es hier.', '阅读时点任意单词，再点“保存”，它就会出现在这里。'],
    'إغلاق': ['Close', 'Fermer', 'Cerrar', 'Schließen', '关闭'],
    'كلمة جديدة': ['New word', 'Nouveau mot', 'Palabra nueva', 'Neues Wort', '新单词'],
    'معناها (اختياري)': ['Meaning (optional)', 'Sens (facultatif)', 'Significado (opcional)', 'Bedeutung (optional)', '意思（可选）'],
    'سهولة القراءة والاستخدام': ['Easy reading and use', 'Lecture et utilisation faciles', 'Lectura y uso fáciles', 'Leichtes Lesen und Bedienen', '轻松阅读与使用'],
    'وضع عسر القراءة': ['Dyslexia mode', 'Mode dyslexie', 'Modo dislexia', 'Legasthenie-Modus', '阅读障碍模式'],
    'مسافات أوسع بين الحروف والكلمات وخلفية هادئة وسطر واحد في كل مرة.': ['Wider spacing between letters and words, a calm background, and one line at a time.', 'Espacement plus large, fond calme et une seule ligne à la fois.', 'Más espacio entre letras y palabras, fondo tranquilo y una línea cada vez.', 'Mehr Abstand zwischen Buchstaben und Wörtern, ruhiger Hintergrund, jeweils eine Zeile.', '字母和单词间距更大，背景柔和，一次只显示一行。'],
    'مسطرة التركيز': ['Focus ruler', 'Règle de concentration', 'Regla de enfoque', 'Fokuslineal', '专注标尺'],
    'بتظلّل كل الجمل ما عدا الجملة اللي بتقراها.': ['Dims every sentence except the one you are reading.', 'Estompe toutes les phrases sauf celle que vous lisez.', 'Atenúa todas las frases menos la que lees.', 'Blendet alle Sätze aus außer dem, den du liest.', '除了你正在读的句子，其余都会变暗。'],
    'تباين عالي': ['High contrast', 'Contraste élevé', 'Alto contraste', 'Hoher Kontrast', '高对比度'],
    'إعلان الجملة لقارئ الشاشة': ['Announce sentence to screen reader', "Annoncer la phrase au lecteur d'écran", 'Anunciar la frase al lector de pantalla', 'Satz an Screenreader ansagen', '向读屏软件播报句子'],
    'التحكم بزر واحد': ['One-button control', 'Contrôle à un seul bouton', 'Control con un solo botón', 'Ein-Tasten-Steuerung', '单键操作'],
    'نطقها': ['Pronunciation', 'Prononciation', 'Pronunciación', 'Aussprache', '发音'],
    'جرّب': ['Try', 'Essayer', 'Probar', 'Testen', '试试'],
    'أصوات خلفية للقراءة': ['Background sounds for reading', 'Sons de fond pour lire', 'Sonidos de fondo para leer', 'Hintergrundgeräusche zum Lesen', '阅读背景音'],
    'مستوى الصوت': ['Volume', 'Volume', 'Volumen', 'Lautstärke', '音量'],
    'أضف': ['Add', 'Ajouter', 'Añadir', 'Hinzufügen', '添加'],
    'في مكتبتك': ['In your library', 'Dans votre bibliothèque', 'En tu biblioteca', 'In deiner Bibliothek', '已在你的书库'],
    'نجمة': ['Star', 'Étoile', 'Estrella', 'Stern', '星星'],
    'يوم متتالي': ['Day in a row', 'Jour de suite', 'Día seguido', 'Tag in Folge', '连续一天'],
    'قصة': ['Story', 'Histoire', 'Cuento', 'Geschichte', '故事'],
    'هدف النهاردة': ["Today's goal", "Objectif d'aujourd'hui", 'Meta de hoy', 'Heutiges Ziel', '今日目标'],
    'نوع الهدف': ['Goal type', "Type d'objectif", 'Tipo de meta', 'Zieltyp', '目标类型'],
    'العدد': ['Number', 'Nombre', 'Cantidad', 'Anzahl', '数量'],
    'تحدي الأسبوع': ['Weekly challenge', 'Défi de la semaine', 'Reto de la semana', 'Wochen-Challenge', '每周挑战'],
    'جاوب على أسئلة ٣ قصص': ['Answer the questions of 3 stories', 'Répondez aux questions de 3 histoires', 'Responde las preguntas de 3 cuentos', 'Beantworte die Fragen zu 3 Geschichten', '回答 3 个故事的问题'],
    'حديقة حكمة': ["Hikma's garden", 'Le jardin de Hikma', 'El jardín de Hikma', 'Hikmas Garten', 'Hikma 花园'],
    'كل قصة بتخلّصها بتزرع نبتة جديدة.': ['Every story you finish plants a new plant.', 'Chaque histoire terminée plante une nouvelle plante.', 'Cada cuento que terminas planta una planta nueva.', 'Jede beendete Geschichte pflanzt eine neue Pflanze.', '每读完一个故事就种下一棵新植物。'],
    'الشارات': ['Badges', 'Badges', 'Insignias', 'Abzeichen', '徽章'],
    'لسه مفيش شارات. كمّل قراءة!': ['No badges yet. Keep reading!', "Pas encore de badges. Continuez à lire !", '¡Aún no hay insignias! ¡Sigue leyendo!', 'Noch keine Abzeichen. Lies weiter!', '还没有徽章。继续阅读吧！'],
    'نزّل شهادة إنجاز': ['Download achievement certificate', "Télécharger l'attestation", 'Descargar certificado de logro', 'Urkunde herunterladen', '下载成就证书'],
    'تقدم تحدي الأسبوع': ['Weekly challenge progress', 'Progression du défi', 'Progreso del reto semanal', 'Fortschritt der Wochen-Challenge', '每周挑战进度'],
    'التقرير الأسبوعي': ['Weekly report', 'Rapport hebdomadaire', 'Informe semanal', 'Wochenbericht', '每周报告'],
    'تدريب النطق': ['Pronunciation practice', 'Entraînement à la prononciation', 'Práctica de pronunciación', 'Aussprache üben', '发音练习'],
    'اسمع وسجّل وقارن': ['Listen, record and compare', 'Écoutez, enregistrez, comparez', 'Escucha, graba y compara', 'Hören, aufnehmen, vergleichen', '听、录、比'],
    'أسئلة عن القصة': ['Questions about the story', "Questions sur l'histoire", 'Preguntas sobre el cuento', 'Fragen zur Geschichte', '关于故事的问题'],
    'إيه حصل الأول؟': ['What happened first?', "Qu'est-ce qui s'est passé d'abord ?", '¿Qué pasó primero?', 'Was passierte zuerst?', '什么先发生？'],
    'أهم الكلمات': ['Key words', 'Mots clés', 'Palabras clave', 'Schlüsselwörter', '关键词'],
    'إيه أهم كلمات النص': ['What the text is about', 'Les mots principaux du texte', 'Las palabras principales del texto', 'Die wichtigsten Wörter im Text', '文章的重点词'],
    'مستوى النص': ['Text level', 'Niveau du texte', 'Nivel del texto', 'Textniveau', '文本难度'],
    'سهل ولا صعب؟': ['Easy or hard?', 'Facile ou difficile ?', '¿Fácil o difícil?', 'Leicht oder schwer?', '容易还是难？'],
    'خصوصيتي': ['My privacy', 'Ma vie privée', 'Mi privacidad', 'Meine Privatsphäre', '我的隐私'],
    'إيه المحفوظ وإيه اللي بيخرج': ['What is saved and what leaves', "Ce qui est stocké et ce qui sort", 'Qué se guarda y qué sale', 'Was gespeichert wird und was das Gerät verlässt', '保存了什么、发送了什么'],
    'حكمة+': ['Hikma+', 'Hikma+', 'Hikma+', 'Hikma+', 'Hikma+'],
    'أنا': ['Me', 'Moi', 'Yo', 'Ich', '我'],
    '＋ مستخدم': ['+ User', '+ Utilisateur', '+ Usuario', '+ Nutzer', '+ 用户'],
    'ملخص للمعلم': ['Summary for the teacher', "Résumé pour l'enseignant", 'Resumen para el docente', 'Zusammenfassung für die Lehrkraft', '给老师的摘要'],
    'جاهز للنسخ': ['Ready to copy', 'Prêt à copier', 'Listo para copiar', 'Bereit zum Kopieren', '可直接复制']
  };
  const P = {
    en: [[/^(\d+) قصص في مكتبتك$/, (m, n) => `${n} stories in your library`], [/^(\d+) كلمة محفوظة$/, (m, n) => `${n} saved words`], [/^(\d+) من (\d+) قصة$/, (m, a, b) => `${a} of ${b} stories`], [/^(\d+) من (\d+) نهايات$/, (m, a, b) => `${a} of ${b} endings`], [/^(\d+) من (\d+)$/, (m, a, b) => `${a} of ${b}`], [/^(\d+) نجمة ·?$/, (m, n) => `${n} stars ·`], [/^(\d+) يوم$/, (m, n) => `${n} days`], [/^تقدم الهدف (\d+) في المية$/, (m, n) => `Goal progress ${n}%`], [/^حديقة فيها (\d+) نبتة$/, (m, n) => `A garden with ${n} plants`], [/^(\d+) كلمة · أسئلة وعبرة$/, (m, n) => `${n} words · questions and moral`]],
    fr: [[/^(\d+) قصص في مكتبتك$/, (m, n) => `${n} histoires dans votre bibliothèque`], [/^(\d+) كلمة محفوظة$/, (m, n) => `${n} mots enregistrés`], [/^(\d+) من (\d+) قصة$/, (m, a, b) => `${a} sur ${b} histoires`], [/^(\d+) من (\d+) نهايات$/, (m, a, b) => `${a} sur ${b} fins`], [/^(\d+) من (\d+)$/, (m, a, b) => `${a} sur ${b}`], [/^(\d+) نجمة ·?$/, (m, n) => `${n} étoiles ·`], [/^(\d+) يوم$/, (m, n) => `${n} jours`], [/^تقدم الهدف (\d+) في المية$/, (m, n) => `Progression de l'objectif ${n} %`], [/^حديقة فيها (\d+) نبتة$/, (m, n) => `Un jardin de ${n} plantes`], [/^(\d+) كلمة · أسئلة وعبرة$/, (m, n) => `${n} mots · questions et morale`]],
    es: [[/^(\d+) قصص في مكتبتك$/, (m, n) => `${n} cuentos en tu biblioteca`], [/^(\d+) كلمة محفوظة$/, (m, n) => `${n} palabras guardadas`], [/^(\d+) من (\d+) قصة$/, (m, a, b) => `${a} de ${b} cuentos`], [/^(\d+) من (\d+) نهايات$/, (m, a, b) => `${a} de ${b} finales`], [/^(\d+) من (\d+)$/, (m, a, b) => `${a} de ${b}`], [/^(\d+) نجمة ·?$/, (m, n) => `${n} estrellas ·`], [/^(\d+) يوم$/, (m, n) => `${n} días`], [/^تقدم الهدف (\d+) في المية$/, (m, n) => `Progreso de la meta ${n} %`], [/^حديقة فيها (\d+) نبتة$/, (m, n) => `Un jardín con ${n} plantas`], [/^(\d+) كلمة · أسئلة وعبرة$/, (m, n) => `${n} palabras · preguntas y moraleja`]],
    de: [[/^(\d+) قصص في مكتبتك$/, (m, n) => `${n} Geschichten in deiner Bibliothek`], [/^(\d+) كلمة محفوظة$/, (m, n) => `${n} gespeicherte Wörter`], [/^(\d+) من (\d+) قصة$/, (m, a, b) => `${a} von ${b} Geschichten`], [/^(\d+) من (\d+) نهايات$/, (m, a, b) => `${a} von ${b} Enden`], [/^(\d+) من (\d+)$/, (m, a, b) => `${a} von ${b}`], [/^(\d+) نجمة ·?$/, (m, n) => `${n} Sterne ·`], [/^(\d+) يوم$/, (m, n) => `${n} Tage`], [/^تقدم الهدف (\d+) في المية$/, (m, n) => `Zielfortschritt ${n} %`], [/^حديقة فيها (\d+) نبتة$/, (m, n) => `Ein Garten mit ${n} Pflanzen`], [/^(\d+) كلمة · أسئلة وعبرة$/, (m, n) => `${n} Wörter · Fragen und Lehre`]],
    zh: [[/^(\d+) قصص في مكتبتك$/, (m, n) => `书库里有 ${n} 个故事`], [/^(\d+) كلمة محفوظة$/, (m, n) => `已保存 ${n} 个单词`], [/^(\d+) من (\d+) قصة$/, (m, a, b) => `${a}/${b} 个故事`], [/^(\d+) من (\d+) نهايات$/, (m, a, b) => `${a}/${b} 个结局`], [/^(\d+) من (\d+)$/, (m, a, b) => `${a}/${b}`], [/^(\d+) نجمة ·?$/, (m, n) => `${n} 颗星 ·`], [/^(\d+) يوم$/, (m, n) => `${n} 天`], [/^تقدم الهدف (\d+) في المية$/, (m, n) => `目标进度 ${n}%`], [/^حديقة فيها (\d+) نبتة$/, (m, n) => `花园里有 ${n} 棵植物`], [/^(\d+) كلمة · أسئلة وعبرة$/, (m, n) => `${n} 个词 · 问题和寓意`]]
  };
  L.forEach((l, i) => {
    const d = I.dictionaries[l] ||= {};
    for (const [ar, tr] of Object.entries(T)) if (!(ar in d)) d[ar] = tr[i];
    d.__patterns = P[l];
  });
  // de/zh: أي نص عنده ترجمة إنجليزي بس يتعرض بالإنجليزي بدل العربي (لحد المراجعة البشرية)
  for (const l of ['de', 'zh']) for (const [k, v] of Object.entries(I.dictionaries.en || {})) if (k !== '__patterns' && !(k in I.dictionaries[l])) I.dictionaries[l][k] = v;
  I.setLanguage(I.language);
})();
