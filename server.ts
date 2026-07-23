import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_BOOKS } from "./src/data/mockData";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// Initialize Gemini client lazily
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return ai;
}

// REST api route: check API connection health
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    time: new Date().toISOString()
  });
});

// AI-picked book for the camera-free AR simulation demo, so each run lands
// on a varied, realistic destination instead of always the same book.
app.post("/api/simulate-scan", async (req, res) => {
  const { excludeId } = req.body || {};
  const candidates = MOCK_BOOKS.filter((b) => b.id !== excludeId);
  const pool = candidates.length > 0 ? candidates : MOCK_BOOKS;
  const pickRandom = () => pool[Math.floor(Math.random() * pool.length)];

  const client = getGeminiClient();

  if (!client) {
    const book = pickRandom();
    return res.json({ bookId: book.id, reason: null });
  }

  try {
    const catalogue = pool
      .map((b) => `- id: ${b.id}, title: "${b.title}", author: ${b.author}, category: ${b.category}, shelf: ${b.shelf}`)
      .join('\n');

    const prompt = `أنت مرشد مكتبة ذكي تُجري محاكاة تجريبية لمسح غلاف كتاب بالواقع المعزز (بدون كاميرا حقيقية).
اختر كتاباً واحداً متنوعاً من القائمة التالية بحيث تختلف الاختيارات بين مرة وأخرى:
${catalogue}

أجب بكائن JSON فقط يحتوي على:
- bookId: معرف الكتاب المختار، يجب أن يطابق أحد المعرفات أعلاه تماماً.
- reason: جملة قصيرة جداً (أقل من 15 كلمة) بالعربية تشرح سبب اقتراح هذا الكتاب للطالب.`;

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "أنت مساعد يختار كتباً متنوعة لمحاكاة تجريبية داخل تطبيق مكتبة ذكية.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bookId: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["bookId"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const matched = pool.find((b) => b.id === parsed.bookId) || pickRandom();
    return res.json({ bookId: matched.id, reason: parsed.reason || null });
  } catch (error: any) {
    console.error("Gemini Simulate Scan Error:", error);
    const book = pickRandom();
    return res.json({ bookId: book.id, reason: null });
  }
});

// Books database representation passed to Gemini for grounding
const BOOK_GROUNDING_CATALOGUE = [
  {
    id: 'relativity-01',
    title: 'The General Theory of Relativity Explained',
    titleArabic: 'النظرية العامة للنسبية المبسطة',
    author: 'Albert Einstein',
    genre: 'Science',
    location: { floor: 1, aisle: 'A', shelf: 1, section: 'Physics & General Science' },
    summary: 'A comprehensive yet accessible guide to Einstein’s revolutionary theory explaining gravity as curvature in the space-time fabric.'
  },
  {
    id: 'ai-01',
    title: 'Computational Intellect: Foundations of AI',
    titleArabic: 'الذكاء الحاسوبي: أسس ومناهج الذكاء الاصطناعي',
    author: 'Dr. Layth Al-Karimi',
    genre: 'Computer Science',
    location: { floor: 2, aisle: 'B', shelf: 3, section: 'Artificial Intelligence & Robotics' },
    summary: 'A study on algorithmic paradigms, neural networks, machine learning, and artificial consciousness.'
  },
  {
    id: 'history-golden-science',
    title: 'Islamic Golden Age Science & Discoveries',
    titleArabic: 'العلوم والاكتشافات في العصر الذهبي الإسلامي',
    author: 'Fatima Al-Hassan',
    genre: 'History',
    location: { floor: 1, aisle: 'C', shelf: 2, section: 'Islamic History & Arab Sciences' },
    summary: 'An extensive historical examination of scientific breakthroughs in medieval Baghdad, Cordoba, and Cairo, algebraic methods of Al-Khwarizmi, and optical theories of Ibn al-Haytham.'
  },
  {
    id: 'math-finance',
    title: 'Stochastic Calculus & Financial Mechanics',
    titleArabic: 'الحسبان العشوائي وميكانيكا الهندسة المالية',
    author: 'Dr. Samer Mansour',
    genre: 'Math',
    location: { floor: 2, aisle: 'A', shelf: 4, section: 'Advanced Mathematics & Statistics' },
    summary: 'A deep dive into Brownian motion, martingale pathways, Ito’s Lemma, and financial dynamics.'
  },
  {
    id: 'lit-epic',
    title: 'An Odyssey into Classical Epic Poetry',
    titleArabic: 'أوديسة الشعر الملحمي الكلاسيكي',
    author: 'Homer / Classical scholars',
    genre: 'Literature',
    location: { floor: 3, aisle: 'D', shelf: 1, section: 'World Classics & Ancient Lit' },
    summary: 'An Odyssey tracking Odysseus’ travel and the theme of tragic proud hubris.'
  },
  {
    id: 'art-calligraphy',
    title: 'Arabic Calligraphy & Geometric Artistry',
    titleArabic: 'الخط العربي والزخرفة الهندسية الإسلامية',
    author: 'Mustafa El-Sayed',
    genre: 'Art',
    location: { floor: 3, aisle: 'C', shelf: 2, section: 'Fine Arts & Architecture' },
    summary: 'Exquisite details on Kufic and Thuluth scripts and repeating modular tessellation grids.'
  }
];

// Conversational AI Smart Search Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages parameter" });
  }

  const client = getGeminiClient();

  // If Gemini API Key is missing or default, provide an intelligent simulated response based on the books
  if (!client) {
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    const lowercaseQuery = lastUserMsg.toLowerCase();
    
    let text = "Welcome to the Smart Library Assistant! (Simulated Mode). Please configure your GEMINI_API_KEY in Secrets for real AI answers.";
    let suggestedBookIds: string[] = [];
    let highlightLocation: any = undefined;

    // Direct simple intent matching for mockup demo
    if (lowercaseQuery.includes("relativity") || lowercaseQuery.includes("einstein") || lowercaseQuery.includes("physics") || lowercaseQuery.includes("نسبية")) {
      text = "I recommend **The General Theory of Relativity Explained** by Albert Einstein! It demystifies special/general relativity. You can find it on **Floor 1, Aisle A, Shelf 1**.";
      suggestedBookIds = ["relativity-01"];
      highlightLocation = { floor: 1, aisle: "A", shelf: 1 };
    } else if (lowercaseQuery.includes("ai") || lowercaseQuery.includes("computational") || lowercaseQuery.includes("ذكاء")) {
      text = "Check out **Computational Intellect: Foundations of AI** by Dr. Layth Al-Karimi. It contains great chapters on Neural Networks and Transformers. It is located on **Floor 2, Aisle B, Shelf 3**.";
      suggestedBookIds = ["ai-01"];
      highlightLocation = { floor: 2, aisle: "B", shelf: 3 };
    } else if (lowercaseQuery.includes("history") || lowercaseQuery.includes("islamic") || lowercaseQuery.includes("تاريخ") || lowercaseQuery.includes("خوارزمي")) {
      text = "You should read **Islamic Golden Age Science & Discoveries** by Fatima Al-Hassan! It highlights Islamic scholars like Al-Khwarizmi and Alhazen. Located on **Floor 1, Aisle C, Shelf 2**.";
      suggestedBookIds = ["history-golden-science"];
      highlightLocation = { floor: 1, aisle: "C", shelf: 2 };
    } else if (lowercaseQuery.includes("math") || lowercaseQuery.includes("calculus") || lowercaseQuery.includes("رياضيات")) {
      text = "We have **Stochastic Calculus & Financial Mechanics** by Dr. Samer Mansour on **Floor 2, Aisle A, Shelf 4**.";
      suggestedBookIds = ["math-finance"];
      highlightLocation = { floor: 2, aisle: "A", shelf: 4 };
    } else if (lowercaseQuery.includes("literature") || lowercaseQuery.includes("odyssey") || lowercaseQuery.includes("شعر") || lowercaseQuery.includes("أدب")) {
      text = "The classic masterpiece **An Odyssey into Classical Epic Poetry** is catalogued on **Floor 3, Aisle D, Shelf 1**.";
      suggestedBookIds = ["lit-epic"];
      highlightLocation = { floor: 3, aisle: "D", shelf: 1 };
    } else if (lowercaseQuery.includes("art") || lowercaseQuery.includes("calligraphy") || lowercaseQuery.includes("خط") || lowercaseQuery.includes("فنون")) {
      text = "Discover the beauty of geometric tessellations in **Arabic Calligraphy & Geometric Artistry** by Mustafa El-Sayed, catalogued on **Floor 3, Aisle C, Shelf 2**.";
      suggestedBookIds = ["art-calligraphy"];
      highlightLocation = { floor: 3, aisle: "C", shelf: 2 };
    } else {
      text = "I am Al-Maktaba Assistant. Ask me about our sections (Science, Computer Science, History, Mathematics, Literature, Art). I can highlight the floor path to lead you directly to any book!";
    }

    return res.json({ text, suggestedBookIds, highlightLocation });
  }

  try {
    // Structured JSON query via Gemini
    const sysInstruction = `You are "Al-Maktaba Guide" (مرشد المكتبة الذكية), a helpful virtual librarian assistant.
    You assist students in searching for books, navigating sections, and answering educational questions.
    You have direct access to our live physical library catalog database:
    ${JSON.stringify(BOOK_GROUNDING_CATALOGUE, null, 2)}
    
    Rules:
    1. If the user asks for a book or subject, check if we have matching books in our database. If yes, refer to them and highly recommend visiting their exact Shelf in the physical library.
    2. Respond politely in either English or Arabic (or bilingual) depending on the message language.
    3. You MUST return your response as a valid JSON object matching our responseSchema exactly.
    `;

    // Map conversation array to Gemini content structures
    const conversation = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: conversation as any,
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The conversational text response to the user. Write in clean markdown. Mention book floor, aisle, and shelf clearly if pointing to them physically."
            },
            suggestedBookIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of book IDs matching any book from the catalog discussed or recommended in this turn (e.g. ['relativity-01'] or ['ai-01']). Return empty array if no specific card applies."
            },
            highlightLocation: {
              type: Type.OBJECT,
              properties: {
                floor: { type: Type.INTEGER, description: "Floor of selected book (1, 2, or 3)" },
                aisle: { type: Type.STRING, description: "Aisle letter of selected book (e.g. 'A')" },
                shelf: { type: Type.INTEGER, description: "Shelf number (e.g. 2)" }
              },
              description: "The specific location on the map to automatically flash/locate, if a single specific book is recommended or requested."
            }
          },
          required: ["text"]
        }
      }
    });

    const outputText = response.text || "{}";
    const structuredResult = JSON.parse(outputText);
    return res.json(structuredResult);
  } catch (error: any) {
    console.error("Gemini API Error in conversational librarian route: ", error);
    return res.status(500).json({
      error: "Failed to communicate with AI model",
      details: error.message || error
    });
  }
});

// Interactive Smart Search Insights generator
app.post("/api/search-insights", async (req, res) => {
  const { query, results } = req.body;
  
  if (!results || !Array.isArray(results)) {
    return res.status(400).json({ error: "Missing results array" });
  }

  const client = getGeminiClient();

  if (!client) {
    // Generate intelligent simulated search insights based on the found books
    const bookTitles = results.slice(0, 3).map(b => `"${b.title}"`).join(' و');
    const responseText = results.length > 0 
      ? `لقد ربط محرك البحث الذكي ببحثك عن "${query}" مجموعة من المراجع الأكاديمية البارزة ومنها ${bookTitles}.

💡 **توصية أكاديمية:** نقترح التركيز على المفاهيم المتبادلة والبحث العضوي داخل الرف ${results[0].shelf} حيث تتجمع الأبحاث المشابهة في نفس القسم لتوفير الوقت.`
      : `لم يتم العثور على مراجع كافية لبناء ملخص متبادل لـ "${query}". حاول تغيير تصنيف التصفية أو استخدام كلمات مفتاحية عامة أكثر للحصول على مراجع أكبر.`;

    return res.json({ insights: responseText });
  }

  try {
    const booksContext = results.slice(0, 3).map(b => `- ${b.title} [تأليف: ${b.author}] [التصنيف: ${b.category}]: ${b.description}`).join('\n');
    
    const prompt = `أنت محلل وباحث أكاديمي خبير في المكتبة الرقمية لجامعة متقدمة.
    قام الباحث بالبحث عن: "${query}".
    وحصل الفهرس على النتائج التالية (أهم 3 كتب):
    ${booksContext}
    
    مهمتك:
    1. قدم ملخصاً أكاديمياً مترابطاً وموجزاً جداً باللغة العربية (في حدود 3 إلى 5 أسطر) يربط بين هذه المكتشفات وعلاقتها بطلب الباحث.
    2. صغ الرد بنقاط ذكية ولغة أكاديمية موجهة تشجع الطالب وتمنحه نصيحة لتنسيق بحثه.
    3. أجب باللغة العربية حصراً وبشكل منمق.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "أنت بروفيسور أكاديمي ومحلل معلومات بمكتبة جامعية متطورة تقدم توجيهات بحثية بالغة الدقة."
      }
    });

    return res.json({
      insights: response.text || "لم يتمكن المساعد من تحليل نتائج البحث حالياً."
    });
  } catch (error: any) {
    console.error("Gemini Search Insights Error:", error);
    return res.status(500).json({ error: "فشل إنشاء التقرير الذكي بفعل مشكلة بالاتصال بمخدم الذكاء الاصطناعي." });
  }
});

// Interactive AI Book Summarizer / Study Partner Endpoint
app.post("/api/summarize-chapter", async (req, res) => {
  const { title, chapterNumber, chapterTitle, chapterContent } = req.body;
  if (!title || !chapterContent) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const client = getGeminiClient();

  if (!client) {
    // Return a mocked study note
    return res.json({
      summary: `### Study Notes: ${chapterTitle}\n\nThis is a mock study guide summary of Chapter ${chapterNumber} of **${title}**. In a real app setup with your Gemini API key, this is an AI-powered digest detailing critical insights, formulas, and academic takeaways.`,
      keyConcepts: ["Basic Terminology", "Groundwork Formula", "Historical Context"]
    });
  }

  try {
    const prompt = `You are a professional study partner assisting a student.
    Carefully read Chapter ${chapterNumber} ("${chapterTitle}") of the book "${title}":
    "${chapterContent}"
    
    Please provide a beautiful and informative layout in Markdown including:
    1. A concise, engaging summary.
    2. Bullet points with high-level conceptual takeaways.
    3. An interesting real-world application or analogy of this material.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite academic tutor helping students study smartly."
      }
    });

    return res.json({
      summary: response.text || "Could not generate summary."
    });
  } catch (error: any) {
    console.error("Gemini Summarize Chapter Error: ", error);
    return res.status(500).json({ error: "AI summary failed, try again." });
  }
});

// Local, category-based key themes so the academic profile always has themes
// to show even without an API key.
const THEMES_BY_CATEGORY: Record<string, string[]> = {
  'فيزياء': ['قوانين الحركة والطاقة', 'النظريات الفيزيائية الحديثة', 'التطبيقات التجريبية'],
  'هندسة': ['مبادئ التصميم الهندسي', 'الأنظمة والتقنيات', 'التطبيقات العملية والصناعية'],
  'علم نفس': ['السلوك البشري والدوافع', 'العمليات الإدراكية', 'التحليل والتطبيق النفسي'],
  'عام': ['المعرفة العامة', 'الفكر والثقافة', 'العلوم الإنسانية'],
};

function localInsight(book: { title?: string; author?: string; category?: string; description?: string }) {
  const category = book.category ?? 'عام';
  const summary = book.description
    ? `${book.description} يُصنّف هذا المرجع ضمن مجال ${category}، ويُعد من المصادر الأكاديمية الموصى بها للطلاب والباحثين المهتمين بهذا التخصص.`
    : `مرجع أكاديمي متخصص في مجال ${category} للمؤلف ${book.author ?? 'غير محدد'}، متاح ضمن مقتنيات المكتبة الرقمية.`;
  const keyThemes = THEMES_BY_CATEGORY[category] ?? THEMES_BY_CATEGORY['عام'];
  const recommendedReading = MOCK_BOOKS
    .filter((b) => b.category === book.category && b.title !== book.title)
    .slice(0, 3)
    .map((b) => b.title);
  return { summary, keyThemes, recommendedReading };
}

// AR shelf-scan / book profile: academic summary + key themes + recommended
// reading for a single book. Always returns 200 with a usable profile (Gemini
// when a key is configured, otherwise a composed local one) so the demo never
// shows a broken card.
app.post("/api/book-insight", async (req, res) => {
  const { title, author, category, description } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  const fallback = localInsight({ title, author, category, description });

  const client = getGeminiClient();
  if (!client) {
    return res.json(fallback);
  }

  try {
    const prompt = `أنشئ ملفاً أكاديمياً موجزاً باللغة العربية عن الكتاب التالي لعرضه في نافذة معلومات معزّزة داخل المكتبة:
    العنوان: ${title}
    المؤلف: ${author ?? 'غير محدد'}
    التصنيف: ${category ?? 'عام'}
    الوصف: ${description ?? ''}

    أرجِع كائن JSON يحتوي:
    - summary: خلاصة أكاديمية موجزة (سطران إلى ثلاثة) تشجّع الطالب على قراءته.
    - keyThemes: مصفوفة من 3 مواضيع رئيسية يغطيها الكتاب.
    - recommendedReading: مصفوفة من 2 إلى 3 عناوين أو مواضيع مقترحة للقراءة قبله أو بعده.`;

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "أنت أمين مكتبة أكاديمي يكتب ملفات معرفية موجزة ودقيقة للكتب.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedReading: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      summary: parsed.summary || fallback.summary,
      keyThemes: parsed.keyThemes?.length ? parsed.keyThemes : fallback.keyThemes,
      recommendedReading: parsed.recommendedReading?.length ? parsed.recommendedReading : fallback.recommendedReading,
    });
  } catch (error: any) {
    console.error("Gemini Book Insight Error: ", error);
    return res.json(fallback);
  }
});

// Real camera-based AR scan: Gemini Vision analyzes a captured frame and
// picks the most contextually relevant book from the library catalogue.
app.post("/api/vision-scan", async (req, res) => {
  const { imageData } = req.body || {};
  if (!imageData || typeof imageData !== 'string') {
    return res.status(400).json({ error: "Missing imageData" });
  }

  const pool = MOCK_BOOKS;
  const pickRandom = () => pool[Math.floor(Math.random() * pool.length)];

  const client = getGeminiClient();
  if (!client) {
    const book = pickRandom();
    return res.json({
      bookId: book.id,
      whatISaw: 'وضع تجريبي — لا يوجد مفتاح API',
      reason: 'تم الاختيار عشوائياً للعرض التوضيحي.',
    });
  }

  try {
    const catalogue = pool
      .map((b) => `id:${b.id} | "${b.title}" | ${b.author} | ${b.category} | الرف ${b.shelf}`)
      .join('\n');

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageData } } as any,
            {
              text: `أنت مساعد مكتبة ذكي مدعوم بالواقع المعزز. انظر إلى هذه الصورة الملتقطة من كاميرا المستخدم:

1. صف ما تراه في جملة واحدة موجزة بالعربية.
2. اختر الكتاب الأكثر صلة بالسياق المرئي من فهرس المكتبة التالي:
${catalogue}

أجب بكائن JSON فقط (بدون markdown):
{ "whatISaw": "وصف مختصر لما تراه", "bookId": "معرف الكتاب المختار يطابق أحد المعرفات أعلاه تماماً", "reason": "سبب اختيار هذا الكتاب بناءً على ما رأيته (جملة أو جملتان)" }`
            }
          ]
        }
      ] as any,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whatISaw: { type: Type.STRING },
            bookId: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["bookId"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const matched = pool.find((b) => b.id === parsed.bookId) || pickRandom();
    return res.json({
      bookId: matched.id,
      whatISaw: parsed.whatISaw || null,
      reason: parsed.reason || null,
    });
  } catch (error: any) {
    console.error("Gemini Vision Scan Error:", error);
    const book = pickRandom();
    const isQuota = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429;
    return res.json({
      bookId: book.id,
      whatISaw: null,
      reason: null,
      fallbackReason: isQuota ? 'quota' : 'error',
    });
  }
});

// AI Librarian chat assistant, grounded in the real app catalog (MOCK_BOOKS).
// Always returns 200 with a helpful reply: Gemini when a key is configured,
// otherwise a local keyword-matching librarian so the assistant always works.
// Guided-tour answers for local (no-API-key) mode
const TOUR_REPLIES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['كيف', 'استخدم', 'استخدام', 'شرح', 'اشرح', 'ميزات', 'وظائف', 'how', 'guide', 'tour', 'feature', 'جولة'],
    reply: `أنا رفيق، وهذه أبرز ميزات التطبيق:\n\n1️⃣ **البحث الذكي** — ابحث عن أي كتاب بالاسم أو المؤلف أو التصنيف مع تحليل مدعوم بالذكاء الاصطناعي.\n2️⃣ **الخريطة الداخلية** — استعرض أرفف المكتبة واختر أي رف لعرض مسار الوصول إليه خطوة بخطوة.\n3️⃣ **الواقع المعزز AR** — امسح غلاف أي كتاب بالكاميرا للتعرف عليه، ثم اتبع الكاميرا نحو علامة الرف للملاحة الحية.\n4️⃣ **محاكاة الذكاء الاصطناعي** — جرّب التجربة كاملة بدون كاميرا أو كتاب حقيقي.\n5️⃣ **الاستشهادات الأكاديمية** — ولّد استشهادات بصيغ APA وMLA وChicago وBibTeX لأي كتاب.\n6️⃣ **نقاط XP والأوسمة** — اكسب نقاطاً عند البحث والاستعارة والوصول لرفع مستواك.\n\nاسألني عن أي ميزة بالتفصيل!`,
  },
  {
    keywords: ['بحث', 'search', 'ابحث', 'بحثت', 'تصنيف', 'موضوع'],
    reply: `**البحث الذكي في المصادر** 🔍\n\nمن الصفحة الرئيسية أو شريط البحث العلوي:\n• اكتب اسم الكتاب أو المؤلف أو الموضوع (مثل: فيزياء، ذكاء اصطناعي، أدب).\n• ستظهر النتائج فورياً مع ملخص وتحليل ذكي مدعوم بالذكاء الاصطناعي.\n• انقر على أي كتاب لعرض تفاصيله: الملخص، رقم التصنيف، موقع الرف، والاستشهادات الأكاديمية.`,
  },
  {
    keywords: ['خريطة', 'map', 'رف', 'موقع', 'ملاحة', 'وصول', 'طريق', 'مكان'],
    reply: `**الخريطة الداخلية والملاحة** 🗺️\n\nمن قائمة "الخريطة" في الشريط الجانبي:\n• ترى خريطة تفاعلية لجميع أرفف المكتبة والمرافق.\n• اختر أي رف من الخريطة أو من تفاصيل الكتاب لعرض مسار الوصول إليه خطوة بخطوة.\n• كما يمكنك تفعيل **وضع AR** مباشرة من الخريطة لتوجيه كاميرا هاتفك نحو علامات الأرفف المطبوعة.`,
  },
  {
    keywords: ['ar', 'واقع معزز', 'كاميرا', 'مسح', 'scan', 'augmented', 'علامة', 'marker'],
    reply: `**الواقع المعزز AR** 📷\n\nمن زر AR العائم (الكاميرا) في أسفل الشاشة:\n• **مسح الغلاف**: وجّه الكاميرا نحو غلاف أي كتاب وسيتعرف عليه التطبيق فوراً ويعرض تفاصيله.\n• **الملاحة الحية**: اتبع الكاميرا نحو علامة الرف المطبوعة (QR/AR Marker) وستظهر المسافة ورقم الرف مباشرة على الشاشة.\n• **المحاكاة**: إذا لم تتوفر كاميرا، اختر "محاكاة" ليختار الذكاء الاصطناعي كتاباً ويعرض التجربة كاملة.`,
  },
  {
    keywords: ['محاكاة', 'simulation', 'بدون كاميرا', 'تجريبي', 'demo'],
    reply: `**محاكاة الذكاء الاصطناعي** 🤖\n\nمن شاشة AR، اختر "محاكاة" إذا لم تتوفر كاميرا أو كتاب حقيقي:\n• يختار الذكاء الاصطناعي كتاباً مختلفاً في كل مرة من الفهرس.\n• تعرض المحاكاة كامل تجربة AR: التعرف على الغلاف، الملاحة للرف، وعرض التفاصيل — دون الحاجة لأي أجهزة فعلية.`,
  },
  {
    keywords: ['استشهاد', 'citation', 'مرجع', 'apa', 'mla', 'chicago', 'bibtex', 'توثيق', 'اقتباس'],
    reply: `**الاستشهادات الأكاديمية** 📄\n\nمن صفحة تفاصيل أي كتاب:\n• انقر على تبويب "الاستشهادات" لتوليد المرجع تلقائياً بصيغ:\n  - **APA** (الأكثر شيوعاً في العلوم الاجتماعية)\n  - **MLA** (الأدب والإنسانيات)\n  - **Chicago** (التاريخ والعلوم)\n  - **BibTeX** (للاستخدام في LaTeX)\n• انسخ الاستشهاد بنقرة واحدة وأضفه مباشرة لبحثك.`,
  },
  {
    keywords: ['xp', 'نقاط', 'وسام', 'badge', 'مستوى', 'مكافأة', 'خبرة', 'points'],
    reply: `**نقاط XP والأوسمة** 🏆\n\nالتطبيق يكافئك على كل نشاط:\n• 🔍 **كل بحث** = نقاط XP\n• 📚 **كل استعارة** = نقاط إضافية\n• 📍 **الوصول للرف** بالخريطة أو AR = نقاط مضاعفة\n\nكلما تراكمت نقاطك ترتفع مستواك وتفتح أوسمة تحفيزية مختلفة. تابع مستواك من ملفك الشخصي.`,
  },
  {
    keywords: ['فحص', 'audit', 'رفوف', 'مخطئ', 'مرتب', 'ترتيب', 'shelf audit', 'مكتبي'],
    reply: `**فحص الرفوف الذكي** 🔎\n\nمن لوحة AR أو (للمسؤولين) من لوحة الإدارة:\n• وجّه الكاميرا نحو أي رف ليمسح الكتب تلقائياً.\n• يقارن الذكاء الاصطناعي رقم تصنيف كل كتاب مع قسم الرف المتوقع.\n• يظهر الكتب المرتّبة **بشكل صحيح** ✅ والكتب **في غير مكانها** ❌ مع تعليمات إعادة الترتيب.`,
  },
  {
    keywords: ['ادمن', 'admin', 'مسؤول', 'إدارة', 'لوحة', 'dashboard', 'احصائيات', 'إحصاء'],
    reply: `**لوحة إدارة النظام** ⚙️\n\nمتاحة للمسؤولين فقط عند تسجيل الدخول بحساب مسؤول:\n• إدارة الكتب والمصادر (إضافة، تعديل، حذف).\n• إدارة المستخدمين والأدوار.\n• إدارة أقسام الأرفف والمرافق وتحديث علامات AR.\n• إحصاءات مباشرة: الإعارات، الزيارات، أكثر الكتب طلباً.`,
  },
];

function localLibrarianReply(query: string): { reply: string; suggestedBookIds: string[] } {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return {
      reply: 'مرحباً! أنا رفيق، مساعدك الذكي في المكتبة. يمكنني مساعدتك في: البحث عن الكتب، التنقل بالخريطة والواقع المعزز، شرح ميزات التطبيق، توليد الاستشهادات الأكاديمية، ومتابعة نقاط XP والأوسمة. اسألني أي شيء!',
      suggestedBookIds: [],
    };
  }

  // Check tour/feature questions first
  for (const entry of TOUR_REPLIES) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return { reply: entry.reply, suggestedBookIds: [] };
    }
  }

  // Fall back to book search
  const matches = MOCK_BOOKS.filter((b) =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    (b.category ?? '').toLowerCase().includes(q) ||
    (b.description ?? '').toLowerCase().includes(q)
  ).slice(0, 3);

  if (matches.length === 0) {
    return {
      reply: `لم أجد مطابقة مباشرة لـ "${query}". جرّب كلمة أعمّ مثل: فيزياء، هندسة، علم نفس، أو اسألني عن ميزات التطبيق مثل: الخريطة، AR، الاستشهادات، نقاط XP.`,
      suggestedBookIds: [],
    };
  }

  const list = matches.map((b) => `• «${b.title}» للمؤلف ${b.author} — تجده على الرف ${b.shelf}`).join('\n');
  return {
    reply: `بناءً على سؤالك، أنصحك بالمراجع التالية من مقتنيات مكتبتنا:\n${list}\n\nيمكنك فتح تفاصيل أي كتاب أو تحديد موقعه على الخريطة مباشرة.`,
    suggestedBookIds: matches.map((b) => b.id),
  };
}

app.post("/api/librarian-chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages" });
  }
  const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
  const fallback = localLibrarianReply(lastUser);

  const client = getGeminiClient();
  if (!client) {
    return res.json(fallback);
  }

  try {
    const catalogue = MOCK_BOOKS
      .map((b) => `- id:${b.id} | ${b.title} | ${b.author} | ${b.category} | الرف ${b.shelf}`)
      .join('\n');
    const conversation = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: conversation as any,
      config: {
        systemInstruction: `أنت "رفيق"، المساعد الذكي لمكتبة جامعية متطورة. أجب بالعربية بإيجاز ووضوح.

مهامك الرئيسية:
1. إرشاد الطلاب إلى الكتب المناسبة من الفهرس مع ذكر موقع الرف ورمز LC.
2. شرح ميزات التطبيق عند السؤال:
   - البحث الذكي: ابحث عن أي كتاب بالاسم أو المؤلف أو التصنيف مع نتائج فورية وتحليل مدعوم بالذكاء الاصطناعي.
   - الخريطة الداخلية والملاحة: استعرض أرفف المكتبة والمرافق، واختر أي رف أو كتاب لعرض مسار الوصول إليه خطوة بخطوة.
   - الواقع المعزز AR: امسح غلاف أي كتاب بالكاميرا للتعرف عليه فوراً، ثم اتبع الكاميرا نحو علامة الرف المطبوعة للملاحة الحية بالمسافة الحقيقية.
   - محاكاة الذكاء الاصطناعي بدون كاميرا: يختار الذكاء الاصطناعي كتاباً متنوعاً في كل مرة لعرض التجربة كاملة كمحاكاة دون الحاجة إلى كاميرا أو كتاب حقيقي.
   - مختبر AR وفحص الرفوف: مسح أغلفة الكتب والتعرف عليها، وفحص الرفوف تلقائياً للكشف عن الكتب المُرتّبة في غير مكانها.
   - الاستشهادات الأكاديمية: توليد الاستشهادات بصيغ APA وMLA وChicago وBibTeX تلقائياً لأي كتاب في الفهرس.
   - نقاط XP والأوسمة: كل بحث واستعارة ووصول يكسبك نقاط خبرة (XP) تفتح أوسمة تحفيزية وترفع مستواك.
   - لوحة الإدارة: للمسؤولين فقط — تحكم كامل في المصادر والمستخدمين والأقسام والمرافق مع إحصاءات مباشرة.
3. للجولة التعريفية: اشرح الخطوات واحدة تلو الأخرى إذا طلب المستخدم كيفية استخدام التطبيق.

الفهرس المتاح:
${catalogue}

إن لم يوجد كتاب مطابق فاقترح الأقرب واذكر القسم.`,
      },
    });

    return res.json({ reply: response.text || fallback.reply, suggestedBookIds: fallback.suggestedBookIds });
  } catch (error: any) {
    console.error("Gemini Librarian Chat Error: ", error);
    return res.json(fallback);
  }
});

// Setup dev server or static static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Library Server running on http://localhost:${PORT}`);
  });
}

startServer();
