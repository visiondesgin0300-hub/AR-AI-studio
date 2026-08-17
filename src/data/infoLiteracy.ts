/**
 * Information-literacy question bank.
 *
 * These are the questions the cognitive AR game asks. Each one targets a
 * specific research skill and carries the reason its answer is right — the
 * explanation is the point of the exercise, not decoration, so it is shown
 * whether the student answers correctly or not.
 *
 * The server can generate extra questions with Gemini (/api/quiz-questions);
 * this bank is what the game runs on when that is unavailable, and it is what
 * guarantees every level is playable offline.
 */

export type LiteracyLevel = 'explorer' | 'researcher' | 'distinguished';

/** The research skill a question exercises — shown as a tag on the card. */
export type LiteracySkill =
  | 'evaluate'   // judging a source
  | 'search'     // finding things
  | 'cite'       // attribution and honesty
  | 'reason';    // reading evidence critically

export interface LiteracyOption {
  ar: string;
  en: string;
  correct: boolean;
}

export interface LiteracyQuestion {
  id: string;
  level: LiteracyLevel;
  skill: LiteracySkill;
  qAr: string;
  qEn: string;
  options: LiteracyOption[];
  /** Why the right answer is right. Shown after answering, always. */
  whyAr: string;
  whyEn: string;
}

export const SKILL_LABEL: Record<LiteracySkill, { ar: string; en: string }> = {
  evaluate: { ar: 'تقييم المصادر', en: 'Evaluating sources' },
  search:   { ar: 'استراتيجية البحث', en: 'Search strategy' },
  cite:     { ar: 'التوثيق والأمانة', en: 'Citation & integrity' },
  reason:   { ar: 'قراءة الأدلة', en: 'Reading evidence' },
};

export const LITERACY_QUESTIONS: LiteracyQuestion[] = [
  // ── Explorer — the basics of where knowledge comes from ──────────────
  {
    id: 'e1', level: 'explorer', skill: 'evaluate',
    qAr: 'تبحث عن رقم موثوق لعدد سكان سلطنة عُمان. أي مصدر تعتمد؟',
    qEn: 'You need a trustworthy figure for Oman’s population. Which source do you use?',
    options: [
      { ar: 'المركز الوطني للإحصاء والمعلومات', en: 'The National Centre for Statistics and Information', correct: true },
      { ar: 'منشور على إنستغرام يذكر الرقم', en: 'An Instagram post quoting the figure', correct: false },
      { ar: 'إجابة روبوت محادثة بلا مرجع', en: 'A chatbot answer with no reference', correct: false },
    ],
    whyAr: 'الجهة التي تُنتج البيانات أصلاً هي المرجع. غيرها ينقل — وقد ينقل خطأً أو رقماً قديماً.',
    whyEn: 'The body that produces the data is the reference. Everyone else is relaying it, possibly wrongly or years late.',
  },
  {
    id: 'e2', level: 'explorer', skill: 'evaluate',
    qAr: 'ما الذي يجعل المقال المحكّم (peer-reviewed) أقوى من مدونة شخصية؟',
    qEn: 'What makes a peer-reviewed article stronger than a personal blog?',
    options: [
      { ar: 'راجعه باحثون مختصون قبل نشره', en: 'Specialist researchers examined it before publication', correct: true },
      { ar: 'لغته أصعب وأطول', en: 'Its language is harder and longer', correct: false },
      { ar: 'نُشر على موقع بتصميم أنيق', en: 'It appeared on a nicely designed website', correct: false },
    ],
    whyAr: 'التحكيم فحص مسبق من أقران مختصين — ليس ضماناً مطلقاً، لكنه فرق حقيقي عن نص لم يقرأه أحد سوى كاتبه.',
    whyEn: 'Peer review is a check by specialists before release — not a guarantee, but a real difference from a text no one but its author read.',
  },
  {
    id: 'e3', level: 'explorer', skill: 'search',
    qAr: 'أين تبدأ البحث عن كتاب أكاديمي في تخصصك؟',
    qEn: 'Where do you start when looking for an academic book in your field?',
    options: [
      { ar: 'فهرس المكتبة وقواعد بياناتها', en: 'The library catalogue and its databases', correct: true },
      { ar: 'أول نتيجة في محرك بحث عام', en: 'The first result in a general search engine', correct: false },
      { ar: 'مجموعة دردشة للطلاب', en: 'A student chat group', correct: false },
    ],
    whyAr: 'فهرس المكتبة يبحث في مقتنيات مفحوصة ومصنّفة، ويخبرك أين الكتاب على الرف فعلاً.',
    whyEn: 'The catalogue searches vetted, classified holdings — and tells you which shelf the book is actually on.',
  },
  {
    id: 'e4', level: 'explorer', skill: 'evaluate',
    qAr: 'صفحة تعرض معلومة دون ذكر كاتبها ولا تاريخها. ما الحكم الأنسب؟',
    qEn: 'A page states a fact with no author and no date. What is the right call?',
    options: [
      { ar: 'ابحث عن المعلومة نفسها في مصدر يذكر كاتبه وتاريخه', en: 'Look for the same claim in a source that names its author and date', correct: true },
      { ar: 'اقتبسها كما هي — المحتوى أهم من الكاتب', en: 'Quote it as is — content matters more than authorship', correct: false },
      { ar: 'تجاهل الموضوع كله', en: 'Abandon the topic entirely', correct: false },
    ],
    whyAr: 'غياب الكاتب والتاريخ يمنعك من الحكم على الخبرة والحداثة — وكلاهما شرط لاستعمال المعلومة في بحث.',
    whyEn: 'Without an author and a date you cannot judge expertise or currency, and research needs both.',
  },
  {
    id: 'e5', level: 'explorer', skill: 'cite',
    qAr: 'استفدت من فكرة في كتاب وأعدت صياغتها بأسلوبك. ماذا يلزم؟',
    qEn: 'You used an idea from a book and rewrote it in your own words. What is required?',
    options: [
      { ar: 'الإشارة إلى المصدر — إعادة الصياغة لا تلغي حق النسبة', en: 'Cite the source — paraphrasing does not remove the need to attribute', correct: true },
      { ar: 'لا شيء، ما دامت الكلمات كلماتك', en: 'Nothing, as long as the words are yours', correct: false },
      { ar: 'يكفي ذكر اسم الكتاب في نهاية البحث دون ربطه بالفكرة', en: 'Just list the book at the end without linking it to the idea', correct: false },
    ],
    whyAr: 'التوثيق ينسب الفكرة لا الألفاظ. أخذ فكرة دون نسبة انتحال حتى لو غيّرت كل كلمة.',
    whyEn: 'Citation attributes the idea, not the wording. Taking an idea without credit is plagiarism even if every word changed.',
  },
  {
    id: 'e6', level: 'explorer', skill: 'search',
    qAr: 'بحثك عن «الذكاء الاصطناعي» أعطاك ملايين النتائج. ما التصرف الأفضل؟',
    qEn: 'Searching “artificial intelligence” returned millions of results. What is the better move?',
    options: [
      { ar: 'ضيّق السؤال: مجال محدد، فترة زمنية، نوع مصدر', en: 'Narrow it: a specific domain, a date range, a source type', correct: true },
      { ar: 'اقرأ أول عشر نتائج واكتف بها', en: 'Read the first ten results and stop', correct: false },
      { ar: 'كرّر البحث بالكلمة نفسها حتى تتغير النتائج', en: 'Repeat the same search until the results change', correct: false },
    ],
    whyAr: 'كثرة النتائج علامة سؤال فضفاض لا علامة وفرة. البحث الجيد يبدأ بسؤال محدد.',
    whyEn: 'A flood of results signals a vague question, not a rich one. Good searching starts with a precise question.',
  },
  {
    id: 'e7', level: 'explorer', skill: 'evaluate',
    qAr: 'ما الفرق بين المصدر الأولي والمصدر الثانوي؟',
    qEn: 'What is the difference between a primary and a secondary source?',
    options: [
      { ar: 'الأولي يقدّم بيانات أو شهادة مباشرة، والثانوي يحلّل عمل غيره', en: 'A primary source gives direct data or testimony; a secondary one analyses someone else’s work', correct: true },
      { ar: 'الأولي أقدم زمنياً والثانوي أحدث', en: 'A primary source is older and a secondary one is newer', correct: false },
      { ar: 'الأولي مطبوع والثانوي رقمي', en: 'A primary source is printed and a secondary one is digital', correct: false },
    ],
    whyAr: 'التمييز يتعلق بقرب المصدر من الحدث أو البيانات، لا بتاريخه ولا بشكله.',
    whyEn: 'The distinction is about closeness to the evidence, not about age or format.',
  },
  {
    id: 'e8', level: 'explorer', skill: 'reason',
    qAr: 'عنوان يقول: «دراسة تثبت أن القهوة تُطيل العمر». ما أول ما تتحقق منه؟',
    qEn: 'A headline says: “Study proves coffee extends your life.” What do you check first?',
    options: [
      { ar: 'الدراسة نفسها: من أجراها، على كم شخصاً، وماذا قالت حرفياً', en: 'The study itself: who ran it, on how many people, and what it actually claimed', correct: true },
      { ar: 'عدد مشاركات الخبر على وسائل التواصل', en: 'How many times the story was shared', correct: false },
      { ar: 'هل يوافق ما تعتقده أصلاً', en: 'Whether it matches what you already believe', correct: false },
    ],
    whyAr: 'العناوين تختصر وتبالغ. كلمة «تثبت» نادراً ما تكون في الورقة الأصلية.',
    whyEn: 'Headlines compress and inflate. The word “proves” is rarely in the paper itself.',
  },

  // ── Explorer — databases and referencing, first contact ──────────────
  {
    id: 'e9', level: 'explorer', skill: 'search',
    qAr: 'ما الفرق بين البحث في قاعدة بيانات المكتبة والبحث في الويب المفتوح؟',
    qEn: 'What is the difference between searching a library database and searching the open web?',
    options: [
      { ar: 'قاعدة البيانات تبحث في محتوى مُنتقى ومفهرس، والويب يبحث في كل ما نُشر', en: 'A database searches selected, indexed content; the web searches whatever was published', correct: true },
      { ar: 'قاعدة البيانات أسرع فقط', en: 'A database is simply faster', correct: false },
      { ar: 'لا فرق، كلاهما يستعمل المحرك نفسه', en: 'No difference — both use the same engine', correct: false },
    ],
    whyAr: 'الانتقاء والفهرسة هما الفرق: القاعدة تعرف نوع كل وثيقة وحقولها، فتتيح تضييقاً لا يقدر عليه محرك عام.',
    whyEn: 'Selection and indexing are the difference: a database knows each document’s type and fields, so it allows filtering a general engine cannot.',
  },
  {
    id: 'e10', level: 'explorer', skill: 'evaluate',
    qAr: 'Google Scholar مجاني وواسع التغطية. ما حدوده التي يجب الانتباه لها؟',
    qEn: 'Google Scholar is free and broad. What limitation must you keep in mind?',
    options: [
      { ar: 'لا يميّز المحكّم من غيره، وتغطيته غير معلنة بدقة', en: 'It does not separate peer-reviewed from other material, and its coverage is not precisely disclosed', correct: true },
      { ar: 'يقتصر على المجلات الطبية', en: 'It is limited to medical journals', correct: false },
      { ar: 'لا يعرض إلا الأبحاث المدفوعة', en: 'It only shows paywalled research', correct: false },
    ],
    whyAr: 'يخلط الرسائل والعروض والمسودات بالمقالات المحكّمة. أداة كشف ممتازة، لكنها ليست ضماناً للجودة.',
    whyEn: 'It mixes theses, slides and drafts with peer-reviewed articles. An excellent discovery tool, not a quality guarantee.',
  },
  {
    id: 'e11', level: 'explorer', skill: 'cite',
    qAr: 'ما وظيفة قائمة المراجع في نهاية البحث؟',
    qEn: 'What is the reference list at the end of a paper for?',
    options: [
      { ar: 'تمكين القارئ من العودة إلى كل مصدر استندت إليه والتحقق منه', en: 'To let a reader reach and check every source you relied on', correct: true },
      { ar: 'إظهار سعة اطلاع الباحث', en: 'To show how widely the author has read', correct: false },
      { ar: 'استيفاء شرط شكلي في التنسيق', en: 'To satisfy a formatting requirement', correct: false },
    ],
    whyAr: 'المرجع وعد بإمكان التتبع. لذلك تُذكر بيانات تكفي للوصول إلى المصدر نفسه لا للإشارة إليه فحسب.',
    whyEn: 'A reference is a promise of traceability, which is why it carries enough detail to reach the source, not merely to name it.',
  },
  {
    id: 'e12', level: 'explorer', skill: 'cite',
    qAr: 'ما الفرق بين الاستشهاد داخل النص وقائمة المراجع؟',
    qEn: 'What is the difference between an in-text citation and the reference list?',
    options: [
      { ar: 'داخل النص إشارة مختصرة تدل على مدخل كامل في القائمة', en: 'The in-text citation is a short pointer to a full entry in the list', correct: true },
      { ar: 'داخل النص للكتب والقائمة للمقالات', en: 'In-text is for books, the list is for articles', correct: false },
      { ar: 'أحدهما اختياري والآخر إلزامي', en: 'One is optional and the other is required', correct: false },
    ],
    whyAr: 'الاثنان نظام واحد: الإشارة تربط الجملة بالمصدر، والقائمة تعطي بياناته كاملة. كل إشارة يقابلها مدخل.',
    whyEn: 'They are one system: the pointer ties a sentence to a source, the list gives its full detail. Every pointer has an entry.',
  },

  // ── Researcher — working the literature ──────────────────────────────
  {
    id: 'r1', level: 'researcher', skill: 'search',
    qAr: 'ما نتيجة البحث بالصيغة: (نقل OR مواصلات) AND ذكية؟',
    qEn: 'What does the query (transport OR transit) AND smart return?',
    options: [
      { ar: 'نتائج تذكر «ذكية» مع أيٍّ من الكلمتين', en: 'Results containing “smart” together with either word', correct: true },
      { ar: 'نتائج تذكر الكلمات الثلاث معاً فقط', en: 'Only results containing all three words', correct: false },
      { ar: 'نتائج تذكر أي كلمة من الثلاث', en: 'Results containing any one of the three', correct: false },
    ],
    whyAr: 'OR يوسّع بين المترادفات، وAND يشترط التقاطع. الأقواس تحدد ترتيب التطبيق.',
    whyEn: 'OR widens across synonyms, AND requires overlap, and the brackets fix the order of operations.',
  },
  {
    id: 'r2', level: 'researcher', skill: 'search',
    qAr: 'لماذا تستعمل رؤوس الموضوعات (المكنز) بدل الكلمات الحرة؟',
    qEn: 'Why use subject headings (a thesaurus) instead of free keywords?',
    options: [
      { ar: 'لأنها تجمع كل مرادفات المفهوم تحت مصطلح واحد معتمد', en: 'They gather every synonym for a concept under one controlled term', correct: true },
      { ar: 'لأنها تعطي نتائج أكثر عدداً دائماً', en: 'They always return more results', correct: false },
      { ar: 'لأنها تعمل في محركات البحث العامة فقط', en: 'They only work in general search engines', correct: false },
    ],
    whyAr: 'الكلمة الحرة تفوّت ما كُتب بمرادف آخر. المصطلح المعتمد يلتقط المفهوم مهما اختلفت ألفاظ المؤلفين.',
    whyEn: 'A free keyword misses whatever was written with a different synonym; a controlled term catches the concept however authors phrased it.',
  },
  {
    id: 'r3', level: 'researcher', skill: 'cite',
    qAr: 'متى تحتاج إلى اقتباس حرفي بين علامتي تنصيص؟',
    qEn: 'When do you need a direct quotation in quotation marks?',
    options: [
      { ar: 'حين تكون صياغة المؤلف نفسها موضع التحليل أو لا تُستبدل بدقة', en: 'When the author’s exact wording is what you are analysing, or cannot be replaced precisely', correct: true },
      { ar: 'كلما أعجبتك الجملة', en: 'Whenever you like the sentence', correct: false },
      { ar: 'لملء عدد الكلمات المطلوب', en: 'To fill the required word count', correct: false },
    ],
    whyAr: 'الاقتباس الحرفي أداة للدقة لا للتعبئة. البحث الجيد يغلب عليه صوت الباحث.',
    whyEn: 'Direct quotation is a precision tool, not filler. In good research the writer’s own voice dominates.',
  },
  {
    id: 'r4', level: 'researcher', skill: 'evaluate',
    qAr: 'وجدت ورقة على خادم preprint. ما الذي يجب أن تعرفه؟',
    qEn: 'You found a paper on a preprint server. What must you know?',
    options: [
      { ar: 'أنها لم تمرّ بالتحكيم بعد، فتُقرأ بحذر وتُذكر بوصفها preprint', en: 'It has not been peer reviewed yet, so read it cautiously and cite it as a preprint', correct: true },
      { ar: 'أنها مرفوضة من المجلات', en: 'It was rejected by journals', correct: false },
      { ar: 'أنها مساوية تماماً للورقة المنشورة', en: 'It is identical in standing to a published paper', correct: false },
    ],
    whyAr: 'الـpreprint نشر مبكر مشروع، لكنه بلا فحص أقران — تُستعمل نتائجه بتحفّظ ويُصرّح بحالته.',
    whyEn: 'A preprint is legitimate early sharing but carries no peer check — use it with reservation and label it.',
  },
  {
    id: 'r5', level: 'researcher', skill: 'reason',
    qAr: 'دراسة تجد ارتباطاً بين ساعات المذاكرة والمعدل. ما الاستنتاج السليم؟',
    qEn: 'A study finds a correlation between study hours and grades. What follows?',
    options: [
      { ar: 'وجود علاقة إحصائية — دون إثبات أن أحدهما سبب الآخر', en: 'A statistical association — without establishing that one causes the other', correct: true },
      { ar: 'أن زيادة الساعات ترفع المعدل حتماً', en: 'That more hours necessarily raise grades', correct: false },
      { ar: 'أن المعدل المرتفع يدفع الطالب للمذاكرة', en: 'That high grades cause students to study', correct: false },
    ],
    whyAr: 'الارتباط قد ينشأ عن سبب ثالث أو عن اتجاه معاكس. السببية تحتاج تصميماً بحثياً يثبتها.',
    whyEn: 'A correlation can come from a third factor or run the other way. Causation needs a design that can show it.',
  },
  {
    id: 'r6', level: 'researcher', skill: 'evaluate',
    qAr: 'ما وظيفة الـDOI في مرجع علمي؟',
    qEn: 'What does a DOI do in a scholarly reference?',
    options: [
      { ar: 'معرّف دائم يقود إلى الوثيقة نفسها ولو تغيّر رابطها', en: 'A permanent identifier that resolves to the document even if its link changes', correct: true },
      { ar: 'يقيس جودة البحث وأهميته', en: 'It measures the quality and importance of the research', correct: false },
      { ar: 'يمنح المؤلف حقوق الملكية', en: 'It grants the author copyright', correct: false },
    ],
    whyAr: 'الروابط تموت، والمعرّف الدائم يبقى — لذلك تطلبه أنماط التوثيق.',
    whyEn: 'URLs rot; a persistent identifier does not, which is why citation styles ask for it.',
  },
  {
    id: 'r7', level: 'researcher', skill: 'search',
    qAr: 'مصطلحك يظهر بصيغ متعددة: تعليم، تعليمي، تعليمية. ما الأداة المناسبة؟',
    qEn: 'Your term appears as educate, education, educational. Which tool fits?',
    options: [
      { ar: 'البتر بعلامة * لالتقاط كل الصيغ المشتقة', en: 'Truncation with * to catch every derived form', correct: true },
      { ar: 'كتابة كل صيغة في بحث منفصل ثم جمع النتائج يدوياً', en: 'Running a separate search for each form and merging by hand', correct: false },
      { ar: 'استعمال علامة الاقتباس حول الكلمة', en: 'Putting quotation marks around the word', correct: false },
    ],
    whyAr: 'البتر يوسّع على الجذر في خطوة واحدة؛ علامة الاقتباس تفعل العكس فتحصر العبارة حرفياً.',
    whyEn: 'Truncation expands on the stem in one step; quotation marks do the opposite and pin an exact phrase.',
  },
  {
    id: 'r8', level: 'researcher', skill: 'cite',
    qAr: 'لماذا يُطلب ذكر تاريخ الاطلاع على مصدر إلكتروني؟',
    qEn: 'Why do citation styles ask for an access date on a web source?',
    options: [
      { ar: 'لأن محتوى الصفحة قد يتغيّر أو يُحذف بعد اطلاعك', en: 'Because the page may change or vanish after you read it', correct: true },
      { ar: 'لإثبات أنك قرأته فعلاً', en: 'To prove you really read it', correct: false },
      { ar: 'لأن المجلات تشترط ذلك شكلياً', en: 'Because journals require it as a formality', correct: false },
    ],
    whyAr: 'التاريخ يوثّق أي نسخة من الصفحة استندت إليها — وهو ما يسمح لغيرك بتتبع ما قرأته.',
    whyEn: 'The date records which version of the page you relied on, so a reader can trace what you saw.',
  },

  // ── Researcher — choosing a database, following a style ──────────────
  {
    id: 'r9', level: 'researcher', skill: 'search',
    qAr: 'تبحث في موضوع طبي حيوي. أي قاعدة بيانات هي نقطة البداية الطبيعية؟',
    qEn: 'You are researching a biomedical topic. Which database is the natural starting point?',
    options: [
      { ar: 'PubMed — تغطي العلوم الطبية والحيوية', en: 'PubMed — it covers medicine and the life sciences', correct: true },
      { ar: 'IEEE Xplore', en: 'IEEE Xplore', correct: false },
      { ar: 'ERIC', en: 'ERIC', correct: false },
    ],
    whyAr: 'لكل قاعدة تخصص: PubMed للطب والعلوم الحيوية، وIEEE Xplore للهندسة والحوسبة، وERIC للتربية. اختيار القاعدة نصف البحث.',
    whyEn: 'Each database has a domain: PubMed for medicine and life sciences, IEEE Xplore for engineering and computing, ERIC for education. Choosing the right one is half the search.',
  },
  {
    id: 'r10', level: 'researcher', skill: 'search',
    qAr: 'ما طبيعة Scopus وWeb of Science؟',
    qEn: 'What kind of resource are Scopus and Web of Science?',
    options: [
      { ar: 'كشّافان للاستشهادات متعددا التخصصات يتيحان تتبّع من استشهد بمن', en: 'Multidisciplinary citation indexes that let you trace who cited whom', correct: true },
      { ar: 'مستودعان لنصوص الكتب الكاملة', en: 'Repositories of full-text books', correct: false },
      { ar: 'محركا بحث عامان مثل محركات الويب', en: 'General web search engines', correct: false },
    ],
    whyAr: 'قيمتهما في شبكة الاستشهادات: تتقدّم من ورقة إلى ما استشهد بها، أو ترجع إلى ما بُنيت عليه.',
    whyEn: 'Their value is the citation network: from a paper you can move forward to what cited it, or back to what it was built on.',
  },
  {
    id: 'r11', level: 'researcher', skill: 'cite',
    qAr: 'كيف يظهر الاستشهاد داخل النص في نمط APA؟',
    qEn: 'How does an in-text citation appear in APA style?',
    options: [
      { ar: 'اسم المؤلف والسنة: (الحارثي، 2021)', en: 'Author and year: (Al-Harthy, 2021)', correct: true },
      { ar: 'رقم بين معقوفتين: [3]', en: 'A number in brackets: [3]', correct: false },
      { ar: 'حاشية سفلية في أسفل الصفحة', en: 'A footnote at the bottom of the page', correct: false },
    ],
    whyAr: 'APA نمط «مؤلف — تاريخ»، فالسنة جزء من الإشارة نفسها لأن حداثة المصدر معلومة مهمة في العلوم الاجتماعية.',
    whyEn: 'APA is an author–date style: the year sits inside the pointer because currency matters in the social sciences.',
  },
  {
    id: 'r12', level: 'researcher', skill: 'cite',
    qAr: 'في نمط IEEE، بأي ترتيب تُرقَّم المراجع؟',
    qEn: 'In IEEE style, in what order are references numbered?',
    options: [
      { ar: 'بترتيب ظهورها أول مرة في النص', en: 'By the order of their first appearance in the text', correct: true },
      { ar: 'أبجدياً حسب اسم المؤلف', en: 'Alphabetically by author name', correct: false },
      { ar: 'حسب سنة النشر من الأقدم للأحدث', en: 'By publication year, oldest first', correct: false },
    ],
    whyAr: 'IEEE نمط رقمي: [1] هو أول مرجع ذُكر في النص. الترتيب الأبجدي من خصائص الأنماط المؤلف-تاريخ مثل APA.',
    whyEn: 'IEEE is a numeric style: [1] is the first reference mentioned. Alphabetical ordering belongs to author–date styles such as APA.',
  },
  {
    id: 'r13', level: 'researcher', skill: 'search',
    qAr: 'تبحث عن دراسات عربية محكّمة في التربية. أين تتوجّه؟',
    qEn: 'You need peer-reviewed Arabic-language studies in education. Where do you go?',
    options: [
      { ar: 'قواعد الدوريات العربية مثل دار المنظومة وe-Marefa', en: 'Arabic journal databases such as Dar Almandumah and e-Marefa', correct: true },
      { ar: 'ترجمة البحث إلى الإنجليزية والاكتفاء بالقواعد الأجنبية', en: 'Translate the query and rely on English-language databases only', correct: false },
      { ar: 'الاكتفاء بما يظهر في محرك بحث عام', en: 'Rely on what a general search engine shows', correct: false },
    ],
    whyAr: 'الإنتاج العلمي العربي مفهرس في قواعد مخصصة له. الاكتفاء بالقواعد الأجنبية يُسقط أدبيات كاملة عن بحثك.',
    whyEn: 'Arabic scholarship is indexed in databases built for it; relying only on English-language ones drops an entire literature from your review.',
  },

  // ── Distinguished — the hard judgement calls ─────────────────────────
  {
    id: 'd1', level: 'distinguished', skill: 'evaluate',
    qAr: 'مجلة تَعِدُ بالنشر خلال ٤٨ ساعة مقابل رسوم، وتراسلك بإلحاح. ما هذا؟',
    qEn: 'A journal promises publication in 48 hours for a fee and emails you insistently. What is this?',
    options: [
      { ar: 'مؤشرات مجلة مفترسة — تبيع النشر بلا تحكيم حقيقي', en: 'Signs of a predatory journal — selling publication without real review', correct: true },
      { ar: 'مجلة كفؤة تفتخر بسرعة إجراءاتها', en: 'An efficient journal proud of its turnaround', correct: false },
      { ar: 'نموذج الوصول المفتوح المعتاد', en: 'The ordinary open-access model', correct: false },
    ],
    whyAr: 'التحكيم الجاد يستغرق أسابيع. السرعة المفرطة مع الإلحاح والرسوم علامة بيع لا نشر. والوصول المفتوح شيء آخر تماماً.',
    whyEn: 'Real review takes weeks. Extreme speed plus solicitation and fees signals a sale, not publishing — and open access is a different thing entirely.',
  },
  {
    id: 'd2', level: 'distinguished', skill: 'cite',
    qAr: 'أعطاك مساعد ذكاء اصطناعي مرجعاً بعنوان ومؤلف ورقم صفحات. ماذا تفعل؟',
    qEn: 'An AI assistant gave you a reference with a title, an author and page numbers. What do you do?',
    options: [
      { ar: 'تتحقق من وجوده في فهرس أو قاعدة بيانات قبل الاستشهاد به', en: 'Verify it exists in a catalogue or database before citing it', correct: true },
      { ar: 'تستشهد به مباشرة — التفاصيل تدل على أنه حقيقي', en: 'Cite it directly — the detail shows it is real', correct: false },
      { ar: 'تغيّر صياغته قليلاً ثم تستشهد به', en: 'Reword it slightly and then cite it', correct: false },
    ],
    whyAr: 'النماذج اللغوية تولّد مراجع تبدو مكتملة وهي غير موجودة. اكتمال التفاصيل ليس دليل وجود.',
    whyEn: 'Language models produce references that look complete and do not exist. Plausible detail is not evidence of existence.',
  },
  {
    id: 'd3', level: 'distinguished', skill: 'reason',
    qAr: 'دراسة تموّلها شركة تنتج المنتج محل الدراسة. ما الموقف الصحيح؟',
    qEn: 'A study is funded by the company that makes the product being studied. What is the right stance?',
    options: [
      { ar: 'تُقرأ مع الانتباه لتضارب المصالح ويُقارن نتائجها بدراسات مستقلة', en: 'Read it noting the conflict of interest and compare it with independent work', correct: true },
      { ar: 'تُرفض تماماً لأن تمويلها يفسدها', en: 'Reject it outright because the funding taints it', correct: false },
      { ar: 'تُقبل كما هي ما دامت منشورة في مجلة محكّمة', en: 'Accept it as is since it appeared in a peer-reviewed journal', correct: false },
    ],
    whyAr: 'تضارب المصالح ليس إدانة ولا يُهمل — هو سبب لطلب تأكيد مستقل. ولهذا يُشترط الإفصاح عنه.',
    whyEn: 'A conflict of interest neither condemns nor can be ignored — it is a reason to seek independent confirmation, which is why disclosure is required.',
  },
  {
    id: 'd4', level: 'distinguished', skill: 'evaluate',
    qAr: 'ما القراءة الجانبية (lateral reading) في التحقق من مصدر؟',
    qEn: 'What is lateral reading when checking a source?',
    options: [
      { ar: 'مغادرة الصفحة والبحث عمّن يقف خلفها في مصادر أخرى', en: 'Leaving the page to find out who is behind it, using other sources', correct: true },
      { ar: 'قراءة الصفحة كاملة بتمعّن قبل الحكم', en: 'Reading the whole page carefully before judging', correct: false },
      { ar: 'مقارنة فقرات الصفحة ببعضها', en: 'Comparing the page’s paragraphs with one another', correct: false },
    ],
    whyAr: 'الموقع المضلّل يبدو متماسكاً من الداخل. الحكم يأتي من خارجه لا من داخله.',
    whyEn: 'A misleading site looks coherent from the inside. The judgement comes from outside it, not within.',
  },
  {
    id: 'd5', level: 'distinguished', skill: 'reason',
    qAr: 'تجربة على ١٢ شخصاً تعلن نتيجة قاطعة. أين الخلل؟',
    qEn: 'A trial on 12 people announces a decisive result. Where is the flaw?',
    options: [
      { ar: 'عيّنة بهذا الصغر لا تحتمل تعميماً قاطعاً', en: 'A sample that small cannot carry a decisive generalisation', correct: true },
      { ar: 'العدد الفردي أو الزوجي للمشاركين', en: 'Whether the number of participants is odd or even', correct: false },
      { ar: 'لا خلل ما دامت النتيجة واضحة', en: 'No flaw, as long as the result is clear', correct: false },
    ],
    whyAr: 'العيّنة الصغيرة تجعل الصدفة تفسيراً وارداً. حجم العيّنة شرط قبل قراءة أي نتيجة.',
    whyEn: 'With a small sample, chance remains a live explanation. Sample size is a precondition for reading any result.',
  },
  {
    id: 'd6', level: 'distinguished', skill: 'reason',
    qAr: 'باحث يعرض النتائج المؤيدة لفرضيته ويسكت عن المخالفة. ما هذا؟',
    qEn: 'A researcher reports the findings that support their hypothesis and omits the rest. What is this?',
    options: [
      { ar: 'انتقاء للأدلة يُبطل قيمة الاستنتاج', en: 'Cherry-picking, which voids the conclusion’s value', correct: true },
      { ar: 'تركيز مشروع على ما يخدم موضوع البحث', en: 'A legitimate focus on what serves the topic', correct: false },
      { ar: 'اختصار مقبول بسبب حدود عدد الكلمات', en: 'An acceptable trim given word limits', correct: false },
    ],
    whyAr: 'الاستنتاج يُقاس بمجمل الأدلة. إخفاء المخالف يجعل النتيجة غير قابلة للتقييم أصلاً.',
    whyEn: 'A conclusion is judged against the whole body of evidence. Hiding what disagrees makes it unassessable.',
  },
  {
    id: 'd7', level: 'distinguished', skill: 'search',
    qAr: 'بحثك في قاعدة واحدة أعطاك نتائج متجانسة تؤيد رأياً واحداً. ما الاحتمال؟',
    qEn: 'One database gave you uniform results all supporting a single view. What should you suspect?',
    options: [
      { ar: 'أن تغطية القاعدة أو صياغة سؤالك حصرت الرؤية', en: 'That the database’s coverage or your phrasing narrowed the view', correct: true },
      { ar: 'أن المسألة محسومة علمياً', en: 'That the matter is scientifically settled', correct: false },
      { ar: 'أن القواعد الأخرى ستعطي النتائج نفسها', en: 'That other databases would return the same', correct: false },
    ],
    whyAr: 'كل قاعدة تغطي مجلات بعينها، وكل صياغة تحمل افتراضاً. التنويع شرط لرؤية الخلاف القائم.',
    whyEn: 'Every database covers particular journals and every phrasing carries an assumption. Varying both is how you see the real disagreement.',
  },
  {
    id: 'd8', level: 'distinguished', skill: 'cite',
    qAr: 'تريد استعمال شكل بياني من ورقة منشورة في بحثك. ما اللازم؟',
    qEn: 'You want to reuse a figure from a published paper in your own work. What is required?',
    options: [
      { ar: 'نسبة المصدر والتحقق من رخصة الاستعمال أو طلب الإذن', en: 'Attribute it and check the licence, or request permission', correct: true },
      { ar: 'نسبة المصدر فقط — النسبة تكفي دائماً', en: 'Attribution alone — crediting is always enough', correct: false },
      { ar: 'إعادة رسمه بألوان مختلفة ثم استعماله بلا نسبة', en: 'Redraw it in different colours and use it uncredited', correct: false },
    ],
    whyAr: 'النسبة واجب أخلاقي، والرخصة مسألة حقوق منفصلة. إعادة الرسم لا تنقل ملكية المحتوى.',
    whyEn: 'Attribution is an ethical duty; licensing is a separate legal one. Redrawing does not transfer ownership of the content.',
  },

  // ── Distinguished — coverage, indexing, and citation edge cases ──────
  {
    id: 'd9', level: 'distinguished', skill: 'search',
    qAr: 'متى تفضّل قاعدة متخصصة على أداة الاكتشاف الموحّدة في المكتبة؟',
    qEn: 'When do you prefer a subject database over the library’s single discovery search?',
    options: [
      { ar: 'حين تحتاج مكنزاً وحقولاً وفلاتر دقيقة لا توفّرها الأداة الموحّدة', en: 'When you need the thesaurus, fields and fine filters the unified tool does not offer', correct: true },
      { ar: 'حين تريد أكبر عدد من النتائج', en: 'When you want the largest number of results', correct: false },
      { ar: 'لا فرق بينهما في العمق', en: 'There is no depth difference between them', correct: false },
    ],
    whyAr: 'الأداة الموحّدة تتسع ولا تعمّق. القاعدة المتخصصة تعطي أدوات ضبط تجعل نتائجك أقل عدداً وأدق مطابقة.',
    whyEn: 'Discovery goes wide, not deep. A subject database gives control that returns fewer results but far better matched ones.',
  },
  {
    id: 'd10', level: 'distinguished', skill: 'cite',
    qAr: 'قرأت في مصدر أن باحثاً آخر قال شيئاً، ولم تطّلع على الأصل. ماذا تفعل؟',
    qEn: 'A source reports what another researcher said, and you have not seen the original. What do you do?',
    options: [
      { ar: 'تبحث عن الأصل وتستشهد به؛ فإن تعذّر صرّحت بأنه نقل غير مباشر', en: 'Find the original and cite it; if that is impossible, declare it as a secondary citation', correct: true },
      { ar: 'تستشهد بالأصل مباشرة كأنك قرأته', en: 'Cite the original directly as though you had read it', correct: false },
      { ar: 'تحذف الفكرة تجنّباً للتعقيد', en: 'Drop the idea to avoid the complication', correct: false },
    ],
    whyAr: 'الاستشهاد بما لم تقرأه ينقل خطأ الوسيط إليك ويُنسب إليك. النقل غير المباشر جائز عند التعذّر بشرط التصريح به.',
    whyEn: 'Citing what you have not read inherits the intermediary’s error and attributes it to you. Secondary citation is acceptable only when unavoidable and declared.',
  },
  {
    id: 'd11', level: 'distinguished', skill: 'cite',
    qAr: 'في APA (الإصدار السابع)، بحث لثلاثة مؤلفين فأكثر — كيف يُستشهد به داخل النص؟',
    qEn: 'In APA 7th edition, how do you cite a work with three or more authors in text?',
    options: [
      { ar: 'المؤلف الأول متبوعاً بـ et al. منذ الاستشهاد الأول', en: 'First author followed by et al., from the very first citation', correct: true },
      { ar: 'تُذكر أسماء الجميع في الاستشهاد الأول ثم et al. لاحقاً', en: 'List every author the first time, then et al. afterwards', correct: false },
      { ar: 'تُذكر أسماء الجميع في كل استشهاد', en: 'List every author in every citation', correct: false },
    ],
    whyAr: 'هذا تغيير أدخله الإصدار السابع؛ القاعدة القديمة (ذكر الجميع أولاً) ما زالت شائعة الاستعمال خطأً.',
    whyEn: 'This changed in the seventh edition; the older rule — naming everyone the first time — is still widely applied by mistake.',
  },
  {
    id: 'd12', level: 'distinguished', skill: 'reason',
    qAr: 'ورقة منشورة في مجلة ذات معامل تأثير مرتفع. ماذا يعني ذلك عن هذه الورقة بعينها؟',
    qEn: 'A paper appears in a journal with a high impact factor. What does that say about this particular paper?',
    options: [
      { ar: 'لا شيء مؤكداً — المعامل وصف للمجلة لا حكم على ورقة منفردة', en: 'Nothing definite — the factor describes the journal, not an individual paper', correct: true },
      { ar: 'أنها ورقة عالية الجودة بالضرورة', en: 'That it is necessarily a high-quality paper', correct: false },
      { ar: 'أنها استُشهد بها كثيراً', en: 'That it has been cited a great deal', correct: false },
    ],
    whyAr: 'المعامل متوسط استشهادات المجلة، وتوزيع الاستشهادات داخلها شديد التفاوت. الورقة تُقيَّم بمنهجها وأدلتها.',
    whyEn: 'The factor is a journal-level average, and citations inside a journal are distributed very unevenly. A paper is judged by its methods and evidence.',
  },
];

/** Questions for one level, shuffled, capped at `count`. */
export function pickQuestions(level: LiteracyLevel, count: number): LiteracyQuestion[] {
  const pool = LITERACY_QUESTIONS.filter(q => q.level === level);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/** Options in a random order, so the right answer is not always first. */
export function shuffleOptions(q: LiteracyQuestion): LiteracyOption[] {
  return [...q.options].sort(() => Math.random() - 0.5);
}
