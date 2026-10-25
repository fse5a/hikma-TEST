(() => {
  const languages = ['ar', 'en', 'fr', 'de', 'es', 'zh'];
  const languageNames = {ar: 'العربية', en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', zh: '中文'};
  const dictionaries = {
    en: {
      'نقرأها سوا': 'Read together', 'إعدادات الصوت': 'Voice settings', 'قصة جديدة': 'New story',
      'كل قصة، عالم جديد.': 'Every story, a new world.', 'اختار حكايتك وخلي حكمة تقرأها معاك، أو أضف نصك الخاص.': 'Choose a story for Hikma to read, or add your own.',
      'مكتبتك': 'Your library', 'ابحث في القصص': 'Search stories', 'ابحث عن قصة...': 'Search stories...', 'فلترة القصص': 'Filter stories',
      'كل القصص': 'All stories', 'قصصي': 'My stories', 'المكتبة': 'Library', 'إضافة': 'Add', 'إضافة قصة': 'Add story', 'الصوت': 'Voice', 'الإعدادات': 'Settings',
      'إضافة قصة للمكتبة': 'Add a story', 'عنوان القصة': 'Story title', 'النص': 'Text', 'الترجمة (اختياري)': 'Translation (optional)',
      'حفظ القصة': 'Save story', 'إلغاء': 'Cancel', 'إعدادات حكمة': 'Hikma settings', 'العمر والواجهة': 'Age and interface',
      'أقل من 16 سنة': 'Under 16', '16 سنة أو أكثر': '16 or older', 'المساعدة وإمكانية الوصول': 'Help and accessibility',
      'خيارات إمكانية الوصول': 'Accessibility options', 'شخصية القلم': 'Character', 'المظهر': 'Appearance', 'لغة التطبيق': 'App language',
      'لغة القراءة': 'Reading language', 'الأصل': 'Original', 'العربية': 'Arabic', 'حكاية عربية': 'Arabic story', 'English story': 'English story',
      'سرعة القراءة': 'Reading speed', 'طبقة الصوت': 'Voice pitch', 'هادئة': 'Slower', 'أسرع': 'Faster', 'أخفض': 'Lower', 'أعلى': 'Higher',
      'الجملة السابقة': 'Previous sentence', 'الجملة التالية': 'Next sentence', 'تشغيل القراءة': 'Play reading', 'تشغيل بصوت الجهاز': 'Play with device voice',
      'تشكيل النص العربي': 'Add Arabic diacritics', 'إيقاف التشكيل': 'Turn diacritics off', 'تحرير الترجمة يدويًا': 'Edit translation manually',
      'النص المترجم': 'Translated text', 'حفظ الترجمة': 'Save translation', 'حفظ موضعي الحالي': 'Save position', 'الانتقال للعلامة المحفوظة': 'Go to bookmark',
      'ملاحظتي': 'My note', 'حفظ الملاحظة': 'Save note', 'إغلاق': 'Close', 'تفعيل الوضع التجريبي': 'Continue in local demo',
      'التحقق من الرمز': 'Verify code', 'رمز التفعيل': 'Activation code', 'تباعد الأسطر': 'Line spacing', 'حجم النص': 'Text size',
      'داكن': 'Dark', 'فاتح': 'Light', 'إضافة صوت بشري': 'Add recorded voice', 'إدارة الصوت البشري': 'Manage recorded voice', 'حفظ الصوت': 'Save audio',
      'حذف': 'Delete', 'التقدم': 'Progress', 'قصتي': 'My story', 'اختيار لغة التطبيق': 'Select app language',
      'أهلاً بيك في حكمة': 'Welcome to Hikma', 'هل عمرك 16 سنة أو أكثر؟': 'Are you 16 or older?', 'تحب نفعّل وضع المساعدة؟': 'Would you like accessibility help?',
      'القراءة': 'Reading', 'الصوت والقراءة': 'Voice and reading', 'مثال: مغامرة في الغابة': 'Example: An adventure in the forest',
      'اكتب أو الصق قصتك هنا...': 'Write or paste your story here...', 'أضف ترجمة القصة للغة الأخرى': 'Add a translation in another language',
      'لا توجد قصص هنا بعد': 'No stories here yet', 'جرّب كلمة بحث أخرى أو أضف قصة جديدة.': 'Try another search or add a story.'
    },
    fr: {
      'نقرأها سوا': 'Lisons ensemble', 'إعدادات الصوت': 'Réglages audio', 'قصة جديدة': 'Nouvelle histoire',
      'كل قصة، عالم جديد.': 'Chaque histoire, un nouveau monde.', 'اختار حكايتك وخلي حكمة تقرأها معاك، أو أضف نصك الخاص.': 'Choisissez une histoire ou ajoutez votre texte.',
      'مكتبتك': 'Votre bibliothèque', 'ابحث في القصص': 'Rechercher des histoires', 'ابحث عن قصة...': 'Rechercher une histoire...', 'فلترة القصص': 'Filtrer les histoires',
      'كل القصص': 'Toutes les histoires', 'قصصي': 'Mes histoires', 'المكتبة': 'Bibliothèque', 'إضافة': 'Ajouter', 'إضافة قصة': 'Ajouter une histoire', 'الصوت': 'Voix', 'الإعدادات': 'Paramètres',
      'إضافة قصة للمكتبة': 'Ajouter une histoire', 'عنوان القصة': 'Titre', 'النص': 'Texte', 'الترجمة (اختياري)': 'Traduction (facultatif)', 'حفظ القصة': 'Enregistrer', 'إلغاء': 'Annuler',
      'إعدادات حكمة': 'Paramètres Hikma', 'العمر والواجهة': 'Âge et interface', 'أقل من 16 سنة': 'Moins de 16 ans', '16 سنة أو أكثر': '16 ans ou plus',
      'المساعدة وإمكانية الوصول': 'Aide et accessibilité', 'خيارات إمكانية الوصول': 'Options d’accessibilité', 'شخصية القلم': 'Personnage', 'المظهر': 'Apparence', 'لغة التطبيق': 'Langue de l’application',
      'لغة القراءة': 'Langue de lecture', 'الأصل': 'Original', 'العربية': 'Arabe', 'حكاية عربية': 'Histoire arabe', 'English story': 'Histoire anglaise',
      'سرعة القراءة': 'Vitesse de lecture', 'طبقة الصوت': 'Hauteur de la voix', 'الجملة السابقة': 'Phrase précédente', 'الجملة التالية': 'Phrase suivante',
      'تشكيل النص العربي': 'Ajouter les voyelles arabes', 'إيقاف التشكيل': 'Désactiver les voyelles', 'تحرير الترجمة يدويًا': 'Modifier la traduction', 'النص المترجم': 'Texte traduit',
      'حفظ الترجمة': 'Enregistrer la traduction', 'حفظ موضعي الحالي': 'Enregistrer la position', 'الانتقال للعلامة المحفوظة': 'Aller au signet', 'ملاحظتي': 'Ma note', 'حفظ الملاحظة': 'Enregistrer la note',
      'إغلاق': 'Fermer', 'التحقق من الرمز': 'Vérifier le code', 'رمز التفعيل': 'Code d’activation', 'تباعد الأسطر': 'Interligne', 'حجم النص': 'Taille du texte', 'داكن': 'Sombre', 'فاتح': 'Clair',
      'التقدم': 'Progression', 'قصتي': 'Mon histoire', 'إضافة صوت بشري': 'Ajouter un enregistrement', 'إدارة الصوت البشري': 'Gérer l’enregistrement',
      'أهلاً بيك في حكمة': 'Bienvenue dans Hikma', 'هل عمرك 16 سنة أو أكثر؟': 'As-tu 16 ans ou plus ?', 'تحب نفعّل وضع المساعدة؟': 'Souhaitez-vous activer l’accessibilité ?',
      'القراءة': 'Lecture', 'الصوت والقراءة': 'Voix et lecture', 'مثال: مغامرة في الغابة': 'Exemple : Une aventure en forêt',
      'اكتب أو الصق قصتك هنا...': 'Écrivez ou collez votre histoire ici…', 'أضف ترجمة القصة للغة الأخرى': 'Ajoutez une traduction dans une autre langue',
      'لا توجد قصص هنا بعد': 'Aucune histoire ici', 'جرّب كلمة بحث أخرى أو أضف قصة جديدة.': 'Essayez une autre recherche ou ajoutez une histoire.'
    },
    de: {
      'نقرأها سوا': 'Gemeinsam lesen', 'إعدادات الصوت': 'Spracheinstellungen', 'قصة جديدة': 'Neue Geschichte',
      'كل قصة، عالم جديد.': 'Jede Geschichte, eine neue Welt.', 'اختار حكايتك وخلي حكمة تقرأها معاك، أو أضف نصك الخاص.': 'Wähle eine Geschichte oder füge eigenen Text hinzu.',
      'مكتبتك': 'Deine Bibliothek', 'ابحث في القصص': 'Geschichten suchen', 'ابحث عن قصة...': 'Geschichte suchen...', 'فلترة القصص': 'Geschichten filtern',
      'كل القصص': 'Alle Geschichten', 'قصصي': 'Meine Geschichten', 'المكتبة': 'Bibliothek', 'إضافة': 'Hinzufügen', 'إضافة قصة': 'Geschichte hinzufügen', 'الصوت': 'Stimme', 'الإعدادات': 'Einstellungen',
      'إضافة قصة للمكتبة': 'Geschichte hinzufügen', 'عنوان القصة': 'Titel', 'النص': 'Text', 'الترجمة (اختياري)': 'Übersetzung (optional)', 'حفظ القصة': 'Speichern', 'إلغاء': 'Abbrechen',
      'إعدادات حكمة': 'Hikma-Einstellungen', 'العمر والواجهة': 'Alter und Oberfläche', 'أقل من 16 سنة': 'Unter 16', '16 سنة أو أكثر': '16 oder älter',
      'المساعدة وإمكانية الوصول': 'Hilfe und Barrierefreiheit', 'خيارات إمكانية الوصول': 'Barrierefreiheit', 'شخصية القلم': 'Figur', 'المظهر': 'Darstellung', 'لغة التطبيق': 'App-Sprache',
      'لغة القراءة': 'Lesesprache', 'الأصل': 'Original', 'العربية': 'Arabisch', 'حكاية عربية': 'Arabische Geschichte', 'English story': 'Englische Geschichte',
      'سرعة القراءة': 'Lesegeschwindigkeit', 'طبقة الصوت': 'Tonhöhe', 'الجملة السابقة': 'Vorheriger Satz', 'الجملة التالية': 'Nächster Satz',
      'تشكيل النص العربي': 'Arabische Vokalzeichen hinzufügen', 'إيقاف التشكيل': 'Vokalzeichen ausschalten', 'تحرير الترجمة يدويًا': 'Übersetzung bearbeiten', 'النص المترجم': 'Übersetzter Text',
      'حفظ الترجمة': 'Übersetzung speichern', 'حفظ موضعي الحالي': 'Position speichern', 'الانتقال للعلامة المحفوظة': 'Zum Lesezeichen', 'ملاحظتي': 'Meine Notiz', 'حفظ الملاحظة': 'Notiz speichern',
      'إغلاق': 'Schließen', 'التحقق من الرمز': 'Code prüfen', 'رمز التفعيل': 'Aktivierungscode', 'تباعد الأسطر': 'Zeilenabstand', 'حجم النص': 'Textgröße', 'داكن': 'Dunkel', 'فاتح': 'Hell',
      'التقدم': 'Fortschritt', 'قصتي': 'Meine Geschichte', 'إضافة صوت بشري': 'Aufnahme hinzufügen', 'إدارة الصوت البشري': 'Aufnahme verwalten',
      'أهلاً بيك في حكمة': 'Willkommen bei Hikma', 'هل عمرك 16 سنة أو أكثر؟': 'Bist du mindestens 16 Jahre alt?', 'تحب نفعّل وضع المساعدة؟': 'Barrierefreiheit aktivieren?',
      'القراءة': 'Lesen', 'الصوت والقراءة': 'Stimme und Lesen', 'مثال: مغامرة في الغابة': 'Beispiel: Ein Abenteuer im Wald',
      'اكتب أو الصق قصتك هنا...': 'Schreibe oder füge deine Geschichte hier ein…', 'أضف ترجمة القصة للغة الأخرى': 'Übersetzung in eine andere Sprache hinzufügen',
      'لا توجد قصص هنا بعد': 'Noch keine Geschichten', 'جرّب كلمة بحث أخرى أو أضف قصة جديدة.': 'Suche erneut oder füge eine Geschichte hinzu.'
    },
    es: {
      'نقرأها سوا': 'Leamos juntos', 'إعدادات الصوت': 'Ajustes de voz', 'قصة جديدة': 'Nueva historia',
      'كل قصة، عالم جديد.': 'Cada historia, un mundo nuevo.', 'اختار حكايتك وخلي حكمة تقرأها معاك، أو أضف نصك الخاص.': 'Elige una historia o añade tu propio texto.',
      'مكتبتك': 'Tu biblioteca', 'ابحث في القصص': 'Buscar historias', 'ابحث عن قصة...': 'Buscar una historia...', 'فلترة القصص': 'Filtrar historias',
      'كل القصص': 'Todas las historias', 'قصصي': 'Mis historias', 'المكتبة': 'Biblioteca', 'إضافة': 'Añadir', 'إضافة قصة': 'Añadir historia', 'الصوت': 'Voz', 'الإعدادات': 'Ajustes',
      'إضافة قصة للمكتبة': 'Añadir historia', 'عنوان القصة': 'Título', 'النص': 'Texto', 'الترجمة (اختياري)': 'Traducción (opcional)', 'حفظ القصة': 'Guardar historia', 'إلغاء': 'Cancelar',
      'إعدادات حكمة': 'Ajustes de Hikma', 'العمر والواجهة': 'Edad e interfaz', 'أقل من 16 سنة': 'Menor de 16', '16 سنة أو أكثر': '16 o más',
      'المساعدة وإمكانية الوصول': 'Ayuda y accesibilidad', 'خيارات إمكانية الوصول': 'Opciones de accesibilidad', 'شخصية القلم': 'Personaje', 'المظهر': 'Apariencia', 'لغة التطبيق': 'Idioma de la aplicación',
      'لغة القراءة': 'Idioma de lectura', 'الأصل': 'Original', 'العربية': 'Árabe', 'حكاية عربية': 'Historia árabe', 'English story': 'Historia en inglés',
      'سرعة القراءة': 'Velocidad de lectura', 'طبقة الصوت': 'Tono de voz', 'الجملة السابقة': 'Frase anterior', 'الجملة التالية': 'Frase siguiente',
      'تشكيل النص العربي': 'Añadir diacríticos árabes', 'إيقاف التشكيل': 'Desactivar diacríticos', 'تحرير الترجمة يدويًا': 'Editar traducción', 'النص المترجم': 'Texto traducido',
      'حفظ الترجمة': 'Guardar traducción', 'حفظ موضعي الحالي': 'Guardar posición', 'الانتقال للعلامة المحفوظة': 'Ir al marcador', 'ملاحظتي': 'Mi nota', 'حفظ الملاحظة': 'Guardar nota',
      'إغلاق': 'Cerrar', 'التحقق من الرمز': 'Verificar código', 'رمز التفعيل': 'Código de activación', 'تباعد الأسطر': 'Interlineado', 'حجم النص': 'Tamaño del texto', 'داكن': 'Oscuro', 'فاتح': 'Claro',
      'التقدم': 'Progreso', 'قصتي': 'Mi historia', 'إضافة صوت بشري': 'Añadir grabación', 'إدارة الصوت البشري': 'Gestionar grabación',
      'أهلاً بيك في حكمة': 'Te damos la bienvenida a Hikma', 'هل عمرك 16 سنة أو أكثر؟': '¿Tienes 16 años o más?', 'تحب نفعّل وضع المساعدة؟': '¿Quieres activar la accesibilidad?',
      'القراءة': 'Lectura', 'الصوت والقراءة': 'Voz y lectura', 'مثال: مغامرة في الغابة': 'Ejemplo: Una aventura en el bosque',
      'اكتب أو الصق قصتك هنا...': 'Escribe o pega tu historia aquí…', 'أضف ترجمة القصة للغة الأخرى': 'Añade una traducción a otro idioma',
      'لا توجد قصص هنا بعد': 'Aún no hay historias', 'جرّب كلمة بحث أخرى أو أضف قصة جديدة.': 'Prueba otra búsqueda o añade una historia.'
    },
    zh: {
      'نقرأها سوا': '一起阅读', 'إعدادات الصوت': '语音设置', 'قصة جديدة': '新故事',
      'كل قصة، عالم جديد.': '每个故事，都是新世界。', 'اختار حكايتك وخلي حكمة تقرأها معاك، أو أضف نصك الخاص.': '选择一个故事，或添加自己的文本。',
      'مكتبتك': '你的书库', 'ابحث في القصص': '搜索故事', 'ابحث عن قصة...': '搜索故事…', 'فلترة القصص': '筛选故事',
      'كل القصص': '所有故事', 'قصصي': '我的故事', 'المكتبة': '书库', 'إضافة': '添加', 'إضافة قصة': '添加故事', 'الصوت': '语音', 'الإعدادات': '设置',
      'إضافة قصة للمكتبة': '添加故事', 'عنوان القصة': '故事标题', 'النص': '文本', 'الترجمة (اختياري)': '翻译（可选）', 'حفظ القصة': '保存故事', 'إلغاء': '取消',
      'إعدادات حكمة': 'Hikma 设置', 'العمر والواجهة': '年龄与界面', 'أقل من 16 سنة': '未满 16 岁', '16 سنة أو أكثر': '16 岁及以上',
      'المساعدة وإمكانية الوصول': '帮助与无障碍', 'خيارات إمكانية الوصول': '无障碍选项', 'شخصية القلم': '角色', 'المظهر': '外观', 'لغة التطبيق': '应用语言',
      'لغة القراءة': '阅读语言', 'الأصل': '原文', 'العربية': '阿拉伯语', 'حكاية عربية': '阿拉伯语故事', 'English story': '英语故事',
      'سرعة القراءة': '阅读速度', 'طبقة الصوت': '音调', 'الجملة السابقة': '上一句', 'الجملة التالية': '下一句',
      'تشكيل النص العربي': '添加阿拉伯语音标', 'إيقاف التشكيل': '关闭音标', 'تحرير الترجمة يدويًا': '手动编辑翻译', 'النص المترجم': '翻译文本',
      'حفظ الترجمة': '保存翻译', 'حفظ موضعي الحالي': '保存位置', 'الانتقال للعلامة المحفوظة': '转到书签', 'ملاحظتي': '我的笔记', 'حفظ الملاحظة': '保存笔记',
      'إغلاق': '关闭', 'التحقق من الرمز': '验证代码', 'رمز التفعيل': '激活码', 'تباعد الأسطر': '行距', 'حجم النص': '文字大小', 'داكن': '深色', 'فاتح': '浅色',
      'التقدم': '进度', 'قصتي': '我的故事', 'إضافة صوت بشري': '添加录音', 'إدارة الصوت البشري': '管理录音',
      'أهلاً بيك في حكمة': '欢迎来到 Hikma', 'هل عمرك 16 سنة أو أكثر؟': '你是否已满 16 岁？', 'تحب نفعّل وضع المساعدة؟': '要启用无障碍辅助吗？',
      'القراءة': '阅读', 'الصوت والقراءة': '语音与阅读', 'مثال: مغامرة في الغابة': '示例：森林探险',
      'اكتب أو الصق قصتك هنا...': '在此输入或粘贴故事…', 'أضف ترجمة القصة للغة الأخرى': '添加其他语言的故事翻译',
      'لا توجد قصص هنا بعد': '这里还没有故事', 'جرّب كلمة بحث أخرى أو أضف قصة جديدة.': '尝试其他搜索词或添加新故事。'
    }
  };
  const nodeSources = new WeakMap();
  const skipSelector = 'script,style,textarea,input,.story-desc,.reading-text,.active-word,.gate-error';
  let activeLanguage = 'ar';
  let observer;

  function normalizeLanguage(value) {
    const code = String(value || '').toLowerCase().split(/[-_]/)[0];
    return languages.includes(code) ? code : 'en';
  }

  function detectLanguage(preferences = globalThis.navigator?.languages || [globalThis.navigator?.language]) {
    for (const preference of preferences || []) {
      const normalized = normalizeLanguage(preference);
      if (languages.includes(String(preference || '').toLowerCase().split(/[-_]/)[0])) return normalized;
    }
    return 'ar';
  }

  function mapFor(language) {
    return dictionaries[language] || {};
  }

  function translateNode(node, dictionary) {
    const parent = node.parentElement;
    if (!parent || parent.closest(skipSelector)) return;
    const current = nodeSources.get(node) ?? node.nodeValue;
    nodeSources.set(node, current);
    const trimmed = current.trim();
    if (!trimmed) return;
    const translated = dictionary[trimmed] || trimmed;
    const nextValue = current.replace(trimmed, translated);
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  }

  function translateAttributes(element, dictionary) {
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const sourceKey = `data-hikma-${attribute}`;
      if (!element.hasAttribute(sourceKey)) element.setAttribute(sourceKey, value);
      const source = element.getAttribute(sourceKey);
      const translated = dictionary[source] || source;
      if (value !== translated) element.setAttribute(attribute, translated);
    }
  }

  function translateTree(root = document.body) {
    if (!root) return;
    const dictionary = mapFor(activeLanguage);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateNode(node, dictionary);
    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root, dictionary);
    root.querySelectorAll?.('*').forEach(element => translateAttributes(element, dictionary));
  }

  function setLanguage(language) {
    activeLanguage = normalizeLanguage(language);
    const root = document.documentElement;
    root.lang = activeLanguage;
    root.dir = activeLanguage === 'ar' ? 'rtl' : 'ltr';
    document.title = activeLanguage === 'ar' ? 'حِكمة | مكتبة القراءة' : `${mapFor(activeLanguage)['مكتبتك'] || 'Library'} | Hikma`;
    translateTree();
    document.dispatchEvent(new CustomEvent('hikma:languagechange', {detail: {language: activeLanguage}}));
    return activeLanguage;
  }

  function observeBody() {
    if (!document.body || observer) return;
    observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target, mapFor(activeLanguage));
        if (record.type === 'attributes') translateAttributes(record.target, mapFor(activeLanguage));
        for (const node of record.addedNodes || []) {
          if (node.nodeType === Node.TEXT_NODE) translateNode(node, mapFor(activeLanguage));
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        }
      }
    });
    observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'placeholder']});
    translateTree(document.body);
  }

  if (typeof document !== 'undefined') {
    if (document.body) observeBody();
    else document.addEventListener('DOMContentLoaded', observeBody, {once: true});
  }

  globalThis.HikmaI18n = {languages, languageNames, dictionaries, detectLanguage, normalizeLanguage, setLanguage, get language() { return activeLanguage; }};
})();
