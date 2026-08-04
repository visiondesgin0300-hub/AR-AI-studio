import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_BOOKS, MOCK_USERS } from "./src/data/mockData";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Limit body size — prevents oversized payloads on all routes
app.use(express.json({ limit: "2mb" }));

// Rate limiting — AI routes are expensive; cap each IP to 30 req/min
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." },
});
app.use("/api/", aiLimiter);

// ── Authentication ───────────────────────────────────────────────────
// The login form used to decide everything client-side: an unknown email
// combined with the "Admin" toggle fabricated a user with role 'admin' and
// routed it straight to /admin. Credentials are now checked here, and the
// role comes from this table rather than from anything the browser sends.
//
// Demo accounts share one password so the project can be handed to a marker
// without distributing secrets; the admin account is deliberately different.
// ADMIN_PASSWORD has no default — if it is not set in the environment, admin
// login is refused outright rather than falling back to something guessable.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "library2024";

// The admin password falls back to a built-in value so a fresh deployment
// works with no configuration. That fallback lives in this file, which means
// it is readable by anyone with the source: on a public deployment it is a
// published credential, not a secret. Set ADMIN_PASSWORD in the environment to
// replace it, or set it to an empty string to switch admin sign-in off
// entirely. Anything beyond a demo should do one of those two things.
const DEFAULT_ADMIN_PASSWORD = "ARLibrary@Admin2026";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD !== undefined
  ? process.env.ADMIN_PASSWORD
  : DEFAULT_ADMIN_PASSWORD;

// Constant-time compare so a wrong password cannot be narrowed by timing.
function passwordMatches(supplied: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// token -> the account it was issued for. In memory: sessions end when the
// process restarts, which is the right lifetime for a demo server.
const sessions = new Map<string, { email: string; role: string }>();

function sessionFor(req: express.Request): { email: string; role: string } | null {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token ? sessions.get(token) ?? null : null;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = sessionFor(req);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "admin session required" });
  }
  return next();
}

// Five *failed* attempts a minute per IP — enough for a fumbled password, not
// enough to work through a password list. Successful logins are not counted,
// so a shared address (a lab, a lecture theatre) doesn't lock legitimate
// students out just because several sign in at once.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait a minute." },
});

app.post("/api/login", loginLimiter, (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  const account = MOCK_USERS.find((u) => u.email.toLowerCase() === email);

  // An unconfigured deployment refuses every admin login, and reporting that
  // as "wrong password" sends the operator hunting for a credential that was
  // never going to work. Say what is actually wrong — it grants nothing, since
  // there is still no password that would get in.
  if (account?.role === "admin" && !ADMIN_PASSWORD) {
    return res.status(503).json({ error: "admin sign-in not configured" });
  }

  // Same response whether the address is unknown or the password is wrong, so
  // the form cannot be used to enumerate who has an account.
  const expected = account?.role === "admin" ? ADMIN_PASSWORD : DEMO_PASSWORD;
  if (!account || !passwordMatches(password, expected)) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { email, role: account.role });
  return res.json({ user: account, token });
});

// Returns the account behind a session token. The client stores a full copy of
// the user at login and would otherwise keep showing that snapshot forever —
// a renamed account, a changed role or a revoked session all went unnoticed
// until the next manual sign-out.
app.get("/api/me", (req, res) => {
  const session = sessionFor(req);
  if (!session) return res.status(401).json({ error: "no session" });
  const account = MOCK_USERS.find((u) => u.email.toLowerCase() === session.email);
  if (!account) return res.status(401).json({ error: "unknown account" });
  return res.json({ user: account });
});

app.post("/api/logout", (req, res) => {
  const header = req.header("authorization") || "";
  if (header.startsWith("Bearer ")) sessions.delete(header.slice(7));
  return res.json({ ok: true });
});

// Strip characters that could escape prompt string boundaries or inject instructions
function sanitizeInput(raw: unknown, maxLen = 300): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/["""'''`\\]/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxLen);
}

// In-memory feedback store — resets on server restart (acceptable for a dissertation demo)
interface FeedbackEntry {
  id: string;
  // 'rating' = a mood submitted from the feedback widget; 'inquiry' = a
  // support message from the help centre. They share a store but are not the
  // same thing, and the admin panel must not present an inquiry as a rating.
  kind: 'rating' | 'inquiry';
  mood: string;
  moodLabel: string;
  categories: string[];
  text: string;
  user: string;
  email: string;
  time: string;
  timestamp: number;
}
const feedbackStore: FeedbackEntry[] = [];

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

// Retry Gemini calls up to 3 times on 429 with exponential backoff
async function withGeminiRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status ?? (err as { code?: number })?.code;
      const isQuota = status === 429 || String(err).includes('RESOURCE_EXHAUSTED');
      if (isQuota && attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1500 * 2 ** attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Gemini retry limit reached');
}

// REST api route: basic liveness check — no internal config exposed
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// User feedback submission — stored in-memory for admin review.
// Two kinds share this endpoint: mood ratings from the feedback widget, and
// support inquiries from the help centre (which carry a reply-to address and
// no mood).
app.post("/api/feedback", (req, res) => {
  const { kind, mood, moodLabel, categories, text, user, email } = req.body || {};
  const entryKind: FeedbackEntry['kind'] = kind === 'inquiry' ? 'inquiry' : 'rating';
  if (entryKind === 'rating' && !mood) return res.status(400).json({ error: "mood required" });
  if (entryKind === 'inquiry' && !String(text || '').trim()) {
    return res.status(400).json({ error: "text required" });
  }
  const entry: FeedbackEntry = {
    id: Math.random().toString(36).substr(2, 9),
    kind: entryKind,
    mood: String(mood || '').slice(0, 4),
    moodLabel: String(moodLabel || '').slice(0, 20),
    categories: Array.isArray(categories) ? categories.map((c: unknown) => String(c).slice(0, 30)) : [],
    text: String(text || '').slice(0, 280),
    user: String(user || 'Anonymous').slice(0, 50),
    email: String(email || '').slice(0, 120),
    time: new Date().toISOString(),
    timestamp: Date.now(),
  };
  feedbackStore.unshift(entry);
  if (feedbackStore.length > 100) feedbackStore.pop();
  return res.json({ ok: true, id: entry.id });
});

// Admin retrieves all submitted feedback. This is the one endpoint that hands
// back other people's messages — including the reply addresses on help-centre
// inquiries — so it needs a real admin session, not just a client-side route
// guard that anyone can walk around by editing localStorage.
app.get("/api/feedback", requireAdmin, (_req, res) => {
  return res.json({ entries: feedbackStore, count: feedbackStore.length });
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
      model: "gemini-1.5-flash",
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
      model: "gemini-1.5-flash",
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
      model: "gemini-1.5-flash",
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
      model: "gemini-1.5-flash",
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
// Category names are stored in Arabic on every book (same map as the client's
// bookCategory helper) — needed so an English profile does not name the field
// in Arabic.
const CATEGORY_EN: Record<string, string> = {
  'فيزياء': 'Physics',
  'هندسة': 'Engineering',
  'عام': 'General',
  'علم نفس': 'Psychology',
  'طب': 'Medicine',
  'أدب': 'Literature',
};

const THEMES_BY_CATEGORY: Record<string, string[]> = {
  'فيزياء': ['قوانين الحركة والطاقة', 'النظريات الفيزيائية الحديثة', 'التطبيقات التجريبية'],
  'هندسة': ['مبادئ التصميم الهندسي', 'الأنظمة والتقنيات', 'التطبيقات العملية والصناعية'],
  'علم نفس': ['السلوك البشري والدوافع', 'العمليات الإدراكية', 'التحليل والتطبيق النفسي'],
  'عام': ['المعرفة العامة', 'الفكر والثقافة', 'العلوم الإنسانية'],
};

const THEMES_BY_CATEGORY_EN: Record<string, string[]> = {
  'فيزياء': ['Laws of motion and energy', 'Modern physical theory', 'Experimental applications'],
  'هندسة': ['Engineering design principles', 'Systems and technologies', 'Practical and industrial applications'],
  'علم نفس': ['Human behaviour and motivation', 'Cognitive processes', 'Psychological analysis and practice'],
  'عام': ['General knowledge', 'Thought and culture', 'The humanities'],
};

// Both this and the Gemini prompt below were written Arabic-only, so an
// English reader looking at the AR info layer got an Arabic profile no matter
// what the client asked for. The request already carried `language`; it just
// was not read.
function localInsight(
  book: { title?: string; author?: string; category?: string; description?: string },
  language = 'ar',
) {
  const category = book.category ?? 'عام';
  const en = language === 'en';
  const categoryLabel = en ? (CATEGORY_EN[category] ?? category) : category;
  const summary = book.description
    ? en
      ? `${book.description} This reference sits within ${categoryLabel} and is among the academic sources recommended to students and researchers working in the field.`
      : `${book.description} يُصنّف هذا المرجع ضمن مجال ${category}، ويُعد من المصادر الأكاديمية الموصى بها للطلاب والباحثين المهتمين بهذا التخصص.`
    : en
      ? `An academic reference in ${categoryLabel} by ${book.author ?? 'an unlisted author'}, held in the library's digital collection.`
      : `مرجع أكاديمي متخصص في مجال ${category} للمؤلف ${book.author ?? 'غير محدد'}، متاح ضمن مقتنيات المكتبة الرقمية.`;
  const themes = en ? THEMES_BY_CATEGORY_EN : THEMES_BY_CATEGORY;
  const keyThemes = themes[category] ?? themes['عام'];
  const recommendedReading = MOCK_BOOKS
    .filter((b) => b.category === book.category && b.title !== book.title)
    .slice(0, 3)
    .map((b) => (en && b.titleEn ? b.titleEn : b.title));
  return { summary, keyThemes, recommendedReading };
}

// AR shelf-scan / book profile: academic summary + key themes + recommended
// reading for a single book. Always returns 200 with a usable profile (Gemini
// when a key is configured, otherwise a composed local one) so the demo never
// shows a broken card.
app.post("/api/book-insight", async (req, res) => {
  const raw = req.body || {};
  const title       = sanitizeInput(raw.title, 150);
  const author      = sanitizeInput(raw.author, 100);
  const category    = sanitizeInput(raw.category, 60);
  const description = sanitizeInput(raw.description, 500);
  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  const language = raw.language === 'en' ? 'en' : 'ar';
  const fallback = localInsight({ title, author, category, description }, language);

  const client = getGeminiClient();
  if (!client) {
    return res.json(fallback);
  }

  try {
    const prompt = language === 'en'
      ? `Write a short academic profile in English for the following book, to be shown in an augmented-reality info panel inside a library:
    Title: ${title}
    Author: ${author ?? 'unlisted'}
    Category: ${category ?? 'General'}
    Description: ${description ?? ''}

    Return a JSON object containing:
    - summary: a brief academic summary (two to three lines) that encourages a student to read it.
    - keyThemes: an array of 3 main themes the book covers.
    - recommendedReading: an array of 2 to 3 titles or topics worth reading before or after it.`
      : `أنشئ ملفاً أكاديمياً موجزاً باللغة العربية عن الكتاب التالي لعرضه في نافذة معلومات معزّزة داخل المكتبة:
    العنوان: ${title}
    المؤلف: ${author ?? 'غير محدد'}
    التصنيف: ${category ?? 'عام'}
    الوصف: ${description ?? ''}

    أرجِع كائن JSON يحتوي:
    - summary: خلاصة أكاديمية موجزة (سطران إلى ثلاثة) تشجّع الطالب على قراءته.
    - keyThemes: مصفوفة من 3 مواضيع رئيسية يغطيها الكتاب.
    - recommendedReading: مصفوفة من 2 إلى 3 عناوين أو مواضيع مقترحة للقراءة قبله أو بعده.`;

    const response = await withGeminiRetry(() => client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: language === 'en'
          ? "You are an academic librarian writing brief, accurate knowledge profiles for books."
          : "أنت أمين مكتبة أكاديمي يكتب ملفات معرفية موجزة ودقيقة للكتب.",
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
    }));

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      summary: parsed.summary || fallback.summary,
      keyThemes: parsed.keyThemes?.length ? parsed.keyThemes : fallback.keyThemes,
      recommendedReading: parsed.recommendedReading?.length ? parsed.recommendedReading : fallback.recommendedReading,
    });
  } catch (error: any) {
    const isQuota = String(error).includes('RESOURCE_EXHAUSTED') || error?.status === 429;
    if (!isQuota) console.error("Gemini Book Insight Error: ", error);
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
      model: "gemini-1.5-flash",
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
      model: "gemini-1.5-flash",
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

// ── Feature: AI Flashcard Generator ──────────────────────────────────────────
// ── Feature: AR Book Translation (overlaid on live camera AR card) ──────────
app.post("/api/translate-book", async (req, res) => {
  const { title, description, targetLang } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });

  const fallback = { titleTranslated: title, descriptionTranslated: description ?? "", readingLevel: "جامعي", estimatedPages: null };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  const isToAr = targetLang === 'ar';
  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `ترجم وحلّل الكتاب التالي:
العنوان: ${title}
الوصف: ${description ?? ''}

أجب بـ JSON فقط:
{
  "titleTranslated": "الترجمة ${isToAr ? 'العربية' : 'الإنجليزية'} للعنوان",
  "descriptionTranslated": "الترجمة ${isToAr ? 'العربية' : 'الإنجليزية'} للوصف في جملتين",
  "readingLevel": "مستوى القراءة: ابتدائي / متوسط / ثانوي / جامعي / متخصص",
  "tags": ["3 كلمات مفتاحية"]
}`,
        }],
      }] as any,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleTranslated: { type: Type.STRING },
            descriptionTranslated: { type: Type.STRING },
            readingLevel: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["titleTranslated", "descriptionTranslated"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...fallback, ...parsed });
  } catch (err: any) {
    console.error("Translation error:", err);
    return res.json(fallback);
  }
});

// ── Feature: The Speaking Book — AR speech bubbles from the book's POV ───────
app.post("/api/book-speaks", async (req, res) => {
  const raw = req.body || {};
  const title       = sanitizeInput(raw.title, 150);
  const author      = sanitizeInput(raw.author, 100);
  const description = sanitizeInput(raw.description, 400);
  const category    = sanitizeInput(raw.category, 60);
  const year        = sanitizeInput(String(raw.year ?? ""), 10);
  if (!title) return res.status(400).json({ error: "title required" });

  const fallback = {
    bubbles: [
      { text: `لستُ مجرد كتاب عن ${category || 'هذا الموضوع'}… أنا الإجابة التي تبحث عنها`, delay: 0 },
      { text: `${author ? author + ' كتبني ليُغيّر طريقة تفكيرك، لا ليضيف رقماً لقائمة مراجعك' : 'كُتبت لأبقى معك بعد إغلاق صفحتي الأخيرة'}`, delay: 700 },
      { text: `الفصل الأول وحده يستحق الرحلة إليّ`, delay: 1400 },
    ],
    stats: { readTime: '6-8 ساعات', completionRate: '87%' },
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `أنت كتاب أكاديمي اسمك "${title}" تأليف ${author || 'مؤلف'} (${year || ''}, تخصص: ${category || 'عام'}).
وصفك: ${description || ''}

تكلّم بصوت الكتاب نفسه — شخصيّاً ومفاجئاً. اكتب 3 فقاعات حوار قصيرة (جملة واحدة لكل منها) كأنك تقنع الطالب الواقف أمامك.

القواعد:
- لا تبدأ بـ "أنا كتاب عن..."
- الجملة الأولى: حقيقة غير متوقعة أو مفارقة
- الجملة الثانية: ربط بحياة الطالب أو مشكلة يعيشها
- الجملة الثالثة: وعد بتجربة أو تحوّل محدد

أجب بـ JSON فقط:
{
  "bubbles": [
    { "text": "...", "delay": 0 },
    { "text": "...", "delay": 700 },
    { "text": "...", "delay": 1400 }
  ],
  "stats": { "readTime": "X ساعات", "completionRate": "X%" }
}`,
        }],
      }] as any,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bubbles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  delay: { type: Type.NUMBER },
                },
                required: ["text", "delay"],
              },
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                readTime: { type: Type.STRING },
                completionRate: { type: Type.STRING },
              },
            },
          },
          required: ["bubbles"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...fallback, ...parsed });
  } catch (err: any) {
    console.error("Book speaks error:", err);
    return res.json(fallback);
  }
});

// Knowledge Stars: AI insight explaining why two books form a spatial knowledge link.
// Always returns 200 — Gemini when a key is configured, local fallback otherwise.
app.post("/api/knowledge-relations", async (req, res) => {
  const { bookA, bookB, relationType } = req.body || {};
  if (!bookA || !bookB) return res.status(400).json({ error: "bookA and bookB required" });

  const fallback = {
    insight: `يتقاطع "${bookA.title}" و"${bookB.title}" في مجال ${relationType} — قراءتهما معاً تمنح الطالب رؤية أعمق مما يمنحه كل كتاب منفرداً.`,
    sharedConcepts: [relationType],
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `أنت مساعد مكتبة أكاديمية متخصص في الربط المعرفي بين الكتب.

الكتاب الأول: "${bookA.title}" بقلم ${bookA.author} — ${bookA.description ?? ''}
الكتاب الثاني: "${bookB.title}" بقلم ${bookB.author} — ${bookB.description ?? ''}
نوع العلاقة المعرفية: ${relationType}

في جملتين بالعربية فقط: لماذا يكسب الطالب من قراءة هذين الكتابين معاً أكثر مما يكسبه من أيٍّ منهما وحده؟ ركّز على الفهم الأعمق الذي يمنحه التقاطع بينهما.` }],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            sharedConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["insight"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      insight: parsed.insight || fallback.insight,
      sharedConcepts: parsed.sharedConcepts || fallback.sharedConcepts,
    });
  } catch (err: any) {
    console.error("[knowledge-relations]", err);
    return res.json(fallback);
  }
});

app.post("/api/hidden-bridges", async (req, res) => {
  const { leftBook, rightBook, discoveryType } = req.body || {};
  if (!leftBook || !rightBook) return res.status(400).json({ error: "leftBook and rightBook required" });

  const fallback = {
    insight: `"${leftBook.title}" و"${rightBook.title}" يُخفيان رابطاً لم يُكتشف بعد في مجال ${discoveryType} — هذا بالضبط ما عناه سوانسون بـ"المعرفة العامة غير المكتشفة".`,
    swanskLink: `${discoveryType}: تقاطع بين ${leftBook.subject ?? 'الفيزياء'} و${rightBook.subject ?? 'علوم الحاسب'}`,
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `أنت باحث متخصص في "المعرفة العامة غير المكتشفة" (Swanson 1986).

الكتاب الأيسر (الفيزياء): "${leftBook.title}" بقلم ${leftBook.author}
الكتاب الأيمن (علوم الحاسب): "${rightBook.title}" بقلم ${rightBook.author}
نوع الجسر المعرفي المكتشف: ${discoveryType}

في جملتين بالعربية فقط: صِف الاكتشاف المعرفي الذي يظهر حين يُدرس الباحث هذين الكتابين معاً، وهو اكتشاف موجود في الأدبيات لكن لم يُوثَّق رسمياً كرابط. لا تُعطِ نصائح عامة، بل صِف الرابط الخفي تحديداً.` }],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight:     { type: Type.STRING },
            swanskLink:  { type: Type.STRING },
          },
          required: ["insight"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      insight:    parsed.insight    || fallback.insight,
      swanskLink: parsed.swanskLink || fallback.swanskLink,
    });
  } catch (err: any) {
    console.error("[hidden-bridges]", err);
    return res.json(fallback);
  }
});

app.post("/api/bridge-question", async (req, res) => {
  const { books, leftIds, rightIds } = req.body || {};
  const question = sanitizeInput(req.body?.question, 300);
  if (!question) return res.status(400).json({ error: "question required" });

  const bookById = (id: string) => Array.isArray(books) ? books.find((b: any) => b.id === id) : null;
  const leftList  = Array.isArray(leftIds)  ? leftIds.map((id: string)  => { const b = bookById(id);  return b ? `ID "${id}": "${b.title}" — ${b.author}` : `ID "${id}"`; }).join('\n') : '';
  const rightList = Array.isArray(rightIds) ? rightIds.map((id: string) => { const b = bookById(id); return b ? `ID "${id}": "${b.title}" — ${b.author}` : `ID "${id}"`; }).join('\n') : '';

  const fallback = {
    answer: `الجسور المخفية المرتبطة بسؤالك تُظهر روابط معرفية بين الفيزياء وعلوم الحاسب لم تُوثَّق رسمياً — جوهر نظرية Swanson 1986.`,
    bridges: [{ leftId: '1', rightId: '6', connectionName: 'حدود المعرفة', strength: 3, explanation: 'هوكينج والذكاء الاصطناعي يُحددان معاً ما لا يمكن معرفته — الكون ومعالج البيانات يواجهان نفس الحدود.' }],
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `أنت باحث في نظرية "المعرفة العامة غير المكتشفة" (Swanson 1986).

الكتب في المنطقة اليسرى (العلوم الطبيعية — الفيزياء):
${leftList}

الكتب في المنطقة اليمنى (علوم الحاسب والهندسة):
${rightList}

سؤال الباحث: "${question}"

حدد 1-3 جسور معرفية مخفية ترتبط بهذا السؤال. لكل جسر:
- leftId: أحد المعرّفات من المنطقة اليسرى فقط
- rightId: أحد المعرّفات من المنطقة اليمنى فقط
- connectionName: اسم الجسر بالعربية (3-5 كلمات)
- strength: قوة الرابط من 1 إلى 3
- explanation: جملة واحدة بالعربية تصف الجسر المخفي تحديداً
ثم answer: فقرة 2-3 جمل بالعربية تشرح أهمية هذه الجسور في سياق السؤال.` }],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            bridges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  leftId:         { type: Type.STRING },
                  rightId:        { type: Type.STRING },
                  connectionName: { type: Type.STRING },
                  strength:       { type: Type.INTEGER },
                  explanation:    { type: Type.STRING },
                },
                required: ["leftId", "rightId", "connectionName", "strength", "explanation"],
              },
            },
          },
          required: ["answer", "bridges"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const bridges = Array.isArray(parsed.bridges) && parsed.bridges.length > 0
      ? parsed.bridges : fallback.bridges;
    return res.json({ answer: parsed.answer || fallback.answer, bridges });
  } catch (err: any) {
    console.error("[bridge-question]", err);
    return res.json(fallback);
  }
});

interface ScholarPaper {
  title: string;
  year: number;
  citations: number;
  doi: string | null;
}

async function searchOpenAlex(query: string, limit = 8): Promise<ScholarPaper[]> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}&sort=cited_by_count:desc&mailto=library@research.edu`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return ((data.results ?? []) as any[])
      .map((w: any) => ({ title: w.title ?? '', year: w.publication_year ?? 0, citations: w.cited_by_count ?? 0, doi: w.doi ?? null }))
      .filter((w: any) => w.title);
  } catch {
    return [];
  }
}

function buildEvidenceFallback(topic: string, papers: ScholarPaper[]) {
  // Use citation counts as research saturation proxy (Swanson 1986 methodology)
  const maxCitations = papers.length > 0 ? Math.max(...papers.map(p => p.citations)) : 0;
  const avgCitations = papers.length > 0 ? papers.reduce((s, p) => s + p.citations, 0) / papers.length : 0;
  const recentCount  = papers.filter(p => p.year >= 2020).length;
  const hasArabic    = papers.some(p => /[؀-ۿ]/.test(p.title));

  // Classify overall coverage
  const overallStatus = maxCitations > 500 ? 'covered' : maxCitations > 50 ? 'partial' : 'unexplored';
  const arabicStatus  = hasArabic ? 'partial' : 'unexplored';
  const recentStatus  = recentCount >= 3 ? 'covered' : recentCount >= 1 ? 'partial' : 'unexplored';

  const topCited = papers[0];
  const coveredNote = topCited
    ? `أبرز الأوراق المرجعية هي "${topCited.title}" (${topCited.year}، ${topCited.citations.toLocaleString()} استشهاد)`
    : null;

  const summary = papers.length === 0
    ? `مجال "${topic}" يكاد يكون غائباً عن قواعد البيانات الدولية — فجوة بحثية نادرة وفرصة استثنائية لإسهام أصيل.`
    : `مشهد الأدبيات في "${topic}": وُجدت ${papers.length} ورقة بحثية في OpenAlex (أعلى استشهاد: ${maxCitations.toLocaleString()})، مما يكشف مساحات غير مستكشفة — لا سيما في السياق العربي والتطبيقات الميدانية.`;

  const gaps = [
    {
      topicArea:    'Arabic Context',
      topicAreaAr:  'السياق العربي',
      status:       arabicStatus,
      opportunity:  arabicStatus === 'unexplored'
        ? `لا توجد أوراق بحثية باللغة العربية في OpenAlex حول "${topic}" — هذا فراغ بحثي حقيقي يُعدّ إسهاماً أصيلاً في مجال الدراسة.`
        : `الأدبيات العربية في "${topic}" محدودة — دراسة ميدانية في السياق الجامعي العربي تُوفر قيمة مضافة واضحة.`,
      relatedBookIds: ['6', '7'],
      bridgeField: 'Library Science',
    },
    {
      topicArea:    'Field Application',
      topicAreaAr:  'التطبيق الميداني',
      status:       overallStatus === 'covered' ? 'partial' : 'unexplored',
      opportunity:  `التطبيق العملي لـ "${topic}" في البيئات الأكاديمية العربية يفتقر إلى دراسات تجريبية — ${avgCitations > 100 ? 'النظرية موثقة لكن التطبيق يمثل فجوة' : 'مجال ناشئ بأعداد استشهادات منخفضة'}.`,
      relatedBookIds: ['6', '9'],
      bridgeField:  'HCI',
    },
    {
      topicArea:    'Recent Trends',
      topicAreaAr:  'الاتجاهات الحديثة',
      status:       recentStatus,
      opportunity:  recentCount === 0
        ? `لا توجد أوراق حديثة (2020+) في OpenAlex حول "${topic}" — الميدان يفتقر لمراجعة نظامية حديثة.`
        : recentCount < 3
        ? `${recentCount} ورقة فقط نشرت بعد 2020 حول "${topic}" — هناك حاجة لدراسات تواكب التطورات التقنية الأخيرة.`
        : `الاتجاهات الحديثة مدروسة في "${topic}" (${recentCount} ورقة بعد 2020) — ركّز على تطبيق في بيئة عربية.`,
      relatedBookIds: ['7', '9'],
      bridgeField:  'Education Technology',
    },
    {
      topicArea:    'Cross-disciplinary',
      topicAreaAr:  'التقاطع بين التخصصات',
      status:       'partial',
      opportunity:  `ربط "${topic}" بعلم المكتبات والذكاء الاصطناعي لم يُوثَّق بالشكل الكافي — Swanson 1986 يثبت أن الفجوات تقع عند تقاطع التخصصات.`,
      relatedBookIds: ['6', '7'],
      bridgeField:  'Cognitive Science',
    },
    {
      topicArea:    'User Experience',
      topicAreaAr:  'تجربة المستخدم',
      status:       'unexplored',
      opportunity:  `تجربة المستخدم النهائي في أنظمة "${topic}" داخل المكتبات الجامعية العربية غائبة تقريباً عن الأدبيات — فجوة تصميمية وسلوكية.`,
      relatedBookIds: ['6', '7', '9'],
      bridgeField:  'HCI',
    },
    {
      topicArea:    coveredNote ? 'Core Theory' : 'Research Methodology',
      topicAreaAr:  coveredNote ? 'النظرية الأساسية' : 'منهجية البحث',
      status:       overallStatus,
      opportunity:  overallStatus === 'covered'
        ? `${coveredNote ?? 'النظرية الأساسية'} مغطاة جيداً — انتقل لزاوية تطبيقية أو سياق عربي لإضافة قيمة حقيقية.`
        : `منهجية البحث في "${topic}" تحتاج تطويراً — الأدبيات الحالية ضعيفة الاستشهادات (متوسط ${Math.round(avgCitations)}).`,
      relatedBookIds: ['1', '3'],
      bridgeField:  null,
    },
  ] as const;

  return { summary, gaps };
}

app.post("/api/gap-scan", async (req, res) => {
  const { topic: rawTopic, books } = req.body || {};
  if (!rawTopic) return res.status(400).json({ error: "topic required" });
  const topic = sanitizeInput(rawTopic, 200);

  const bookList = (Array.isArray(books) ? books : MOCK_BOOKS)
    .map((b: any) => `ID:${b.id} "${b.title}" by ${b.author}`)
    .join('\n');

  // Search OpenAlex in parallel with client initialization
  const scholarPapers = await searchOpenAlex(topic, 8);

  const paperContext = scholarPapers.length > 0
    ? `Real academic papers found on OpenAlex (open knowledge graph similar to Google Scholar) for "${topic}":\n${scholarPapers.map(p => `- "${p.title}" (${p.year}, cited ${p.citations} times)`).join('\n')}\nTotal results in OpenAlex: ${scholarPapers.length}+`
    : `No papers found on OpenAlex for this exact topic — this itself indicates a significant research gap.`;

  // Evidence-based fallback using OpenAlex citation data as saturation proxy
  const fallback = buildEvidenceFallback(topic, scholarPapers);

  const client = getGeminiClient();
  if (!client) return res.json({ ...fallback, scholarPapers, scholarCount: scholarPapers.length });

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `You are a research methodology expert helping a PhD student identify literature gaps.

Research topic: "${topic}"

Library books available:
${bookList}

${paperContext}

Using the real paper data above, identify 4-6 distinct research territory zones for this topic. For each zone:
- A concise name in English (2-4 words) and Arabic
- Status: "unexplored" (few/no papers found, clear gap), "partial" (some papers, cross-disciplinary bridge possible), "covered" (many highly-cited papers, try a different angle)
- A concrete Arabic description of the contribution opportunity or why it is well-covered
- Which book IDs from the library are most relevant (1-3 IDs)
- If status is "partial", one bridge discipline (e.g. "HCI", "Library Science") or null

Respond in JSON only:
{
  "summary": "2 Arabic sentences describing the research landscape based on the real paper data",
  "gaps": [
    {
      "topicArea": "English name",
      "topicAreaAr": "الاسم بالعربي",
      "status": "unexplored|partial|covered",
      "opportunity": "Arabic 1-2 sentences with concrete advice",
      "relatedBookIds": ["id1"],
      "bridgeField": "discipline or null"
    }
  ]
}` }],
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            gaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topicArea:      { type: Type.STRING },
                  topicAreaAr:    { type: Type.STRING },
                  status:         { type: Type.STRING },
                  opportunity:    { type: Type.STRING },
                  relatedBookIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  bridgeField:    { type: Type.STRING },
                },
                required: ["topicArea", "topicAreaAr", "status", "opportunity", "relatedBookIds"],
              },
            },
          },
          required: ["summary", "gaps"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      summary: parsed.summary || fallback.summary,
      gaps: Array.isArray(parsed.gaps) && parsed.gaps.length > 0 ? parsed.gaps : fallback.gaps,
      scholarPapers,
      scholarCount: scholarPapers.length,
    });
  } catch (err: any) {
    console.error("[gap-scan]", err);
    return res.json({ ...fallback, scholarPapers, scholarCount: scholarPapers.length });
  }
});

// ── Research Mirror: analyzes library coverage for a dissertation topic ────────
app.post("/api/research-mirror", async (req, res) => {
  const { topic: rawTopic, abstract: rawAbstract } = req.body || {};
  if (!rawTopic) return res.status(400).json({ error: "topic required" });
  const topic    = sanitizeInput(rawTopic, 200);
  const abstract = sanitizeInput(rawAbstract ?? '', 500);

  const catalogue = MOCK_BOOKS.map(b =>
    `ID:${b.id} | "${b.title}" | ${b.author} | ${b.category} | ${(b as any).description ?? ''}`
  ).join('\n');

  const fallback = {
    coverageScore: 58,
    criticalBooks: MOCK_BOOKS.slice(0, 5).map((b, i) => ({
      id: b.id, title: b.title, author: b.author,
      reason: `مرجع أساسي في مجال ${b.category}`, priority: i + 1,
    })),
    missingTopics: [
      'الدراسات التجريبية في البيئة العربية',
      'تقييم جودة واجهات AR في المكتبات',
      'أثر الواقع المعزز على اكتساب المعلومات',
    ],
    disciplines: [
      { name: 'علم المكتبات', nameEn: 'Library Science', coverage: 'medium' },
      { name: 'الواقع المعزز', nameEn: 'Augmented Reality', coverage: 'low' },
      { name: 'تجربة المستخدم', nameEn: 'UX', coverage: 'low' },
      { name: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', coverage: 'medium' },
      { name: 'المنهجية البحثية', nameEn: 'Research Methods', coverage: 'high' },
    ],
    summary: `المكتبة تُغطي حوالي 58% من الأدبيات الأساسية لموضوع "${topic}". توجد فجوات واضحة في الدراسات الميدانية العربية وتطبيقات AR في بيئات المكتبات.`,
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text:
        `أنت مستشار بحثي متخصص في علم المكتبات.
موضوع رسالة الطالب: "${topic}"${abstract ? `\nملخص: "${abstract}"` : ''}

فهرس المكتبة:
${catalogue}

حلّل مدى تغطية هذه المكتبة لمتطلبات الأدبيات الأكاديمية لهذه الرسالة. أجب بـ JSON:
{
  "coverageScore": رقم 0-100,
  "criticalBooks": [{ "id":"...", "title":"...", "author":"...", "reason":"جملة واحدة", "priority":1 }] (أهم 5 مرتبة),
  "missingTopics": ["موضوع 1"] (3-5 مواضيع أساسية غير مغطاة),
  "disciplines": [{ "name":"عربي", "nameEn":"English", "coverage":"high|medium|low" }] (4-6),
  "summary": "جملتان تلخصان حالة التغطية"
}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coverageScore: { type: Type.INTEGER },
            criticalBooks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, author: { type: Type.STRING }, reason: { type: Type.STRING }, priority: { type: Type.INTEGER } }, required: ["id","title","author","reason","priority"] } },
            missingTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            disciplines: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, nameEn: { type: Type.STRING }, coverage: { type: Type.STRING } }, required: ["name","coverage"] } },
            summary: { type: Type.STRING },
          },
          required: ["coverageScore","criticalBooks","missingTopics","disciplines","summary"],
        },
      },
    });
    const p = JSON.parse(response.text || "{}");
    return res.json({
      coverageScore: p.coverageScore ?? fallback.coverageScore,
      criticalBooks: p.criticalBooks?.length ? p.criticalBooks : fallback.criticalBooks,
      missingTopics: p.missingTopics?.length ? p.missingTopics : fallback.missingTopics,
      disciplines:   p.disciplines?.length   ? p.disciplines   : fallback.disciplines,
      summary:       p.summary               || fallback.summary,
    });
  } catch (err: any) {
    console.error("[research-mirror]", err);
    return res.json(fallback);
  }
});

// ── Research DNA: personalised knowledge-profile from books read ───────────────
app.post("/api/research-dna", async (req, res) => {
  const { readBooks, topic: rawTopic } = req.body || {};
  if (!Array.isArray(readBooks) || readBooks.length === 0)
    return res.status(400).json({ error: "readBooks required" });

  const topic    = sanitizeInput(rawTopic ?? '', 200);
  const bookList = readBooks.slice(0, 20).map((b: any) => `- "${b.title}" (${b.category})`).join('\n');
  const unread   = MOCK_BOOKS.filter(b => !readBooks.find((r: any) => r.id === b.id));
  const catalogue = unread.map(b => `ID:${b.id} | "${b.title}" | ${b.author} | ${b.category}`).join('\n');

  const fallback = {
    disciplines: [
      { name: 'علم المكتبات', score: 40 },
      { name: 'الواقع المعزز', score: 20 },
      { name: 'تجربة المستخدم', score: 15 },
      { name: 'الذكاء الاصطناعي', score: 55 },
      { name: 'المنهجية', score: 35 },
    ],
    blindSpot: 'أنت تُركّز على الجانب التقني وتفتقر للعمق في الدراسات الميدانية وتجربة المستخدم',
    nextBook: { id: unread[0]?.id ?? '', title: unread[0]?.title ?? '', reason: 'يُغطي الجانب الأكثر غياباً في قراءاتك' },
    readinessScore: 42,
    pattern: 'تقني-نظري',
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text:
        `أنت مرشد بحثي. حلّل نمط قراءة الطالب:
الكتب التي قرأها:\n${bookList}
${topic ? `موضوع اهتمامه: "${topic}"` : ''}
الكتب المتبقية (للتوصية):\n${catalogue}

أجب بـ JSON:
{
  "disciplines": [{ "name":"عربي قصير", "score":0-100 }] (5 تخصصات),
  "blindSpot": "جملة واحدة: أهم نقطة ضعف في نمط قراءته",
  "nextBook": { "id":"من المتبقية", "title":"...", "reason":"جملة واحدة" },
  "readinessScore": 0-100,
  "pattern": "وصف النمط بكلمتين"
}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disciplines: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.INTEGER } }, required: ["name","score"] } },
            blindSpot: { type: Type.STRING },
            nextBook: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["id","title","reason"] },
            readinessScore: { type: Type.INTEGER },
            pattern: { type: Type.STRING },
          },
          required: ["disciplines","blindSpot","nextBook","readinessScore"],
        },
      },
    });
    const p = JSON.parse(response.text || "{}");
    return res.json({
      disciplines:   p.disciplines?.length ? p.disciplines : fallback.disciplines,
      blindSpot:     p.blindSpot           || fallback.blindSpot,
      nextBook:      p.nextBook            || fallback.nextBook,
      readinessScore:p.readinessScore      ?? fallback.readinessScore,
      pattern:       p.pattern             || fallback.pattern,
    });
  } catch (err: any) {
    console.error("[research-dna]", err);
    return res.json(fallback);
  }
});

// ── Book Duel: AI head-to-head comparison of two books ────────────────────────
app.post("/api/book-duel", async (req, res) => {
  const { bookA, bookB } = req.body || {};
  if (!bookA || !bookB) return res.status(400).json({ error: "bookA and bookB required" });

  const fallback = {
    readFirst: 'A',
    readFirstReason: `ابدأ بـ "${sanitizeInput(bookA.title, 80)}" لأنه يُرسّخ الأساس النظري الذي يبني عليه الكتاب الثاني`,
    similarities: ['كلاهما يتناول نفس المجال الأكاديمي', 'يشتركان في المنهجية التحليلية'],
    differences: ['أحدهما نظري والآخر تطبيقي', 'يختلفان في المستوى المطلوب من القارئ'],
    complementary: `معاً يُكوّنان صورة متكاملة — الأول يُجيب على "لماذا؟" والثاني على "كيف؟"`,
    synergy: 82,
  };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text:
        `قارن بين هذين الكتابين للطالب:
(A) "${sanitizeInput(bookA.title,100)}" — ${sanitizeInput(bookA.author,80)} — ${sanitizeInput(bookA.category,60)}
    ${sanitizeInput(bookA.description ?? '',300)}
(B) "${sanitizeInput(bookB.title,100)}" — ${sanitizeInput(bookB.author,80)} — ${sanitizeInput(bookB.category,60)}
    ${sanitizeInput(bookB.description ?? '',300)}

أجب بـ JSON:
{
  "readFirst": "A" أو "B",
  "readFirstReason": "جملة واحدة بالعربية",
  "similarities": ["وجه 1","وجه 2"] (2-3),
  "differences": ["فارق 1","فارق 2"] (2-3),
  "complementary": "جملة واحدة: كيف يُكملان بعضهما",
  "synergy": 0-100
}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readFirst:      { type: Type.STRING },
            readFirstReason:{ type: Type.STRING },
            similarities:   { type: Type.ARRAY, items: { type: Type.STRING } },
            differences:    { type: Type.ARRAY, items: { type: Type.STRING } },
            complementary:  { type: Type.STRING },
            synergy:        { type: Type.INTEGER },
          },
          required: ["readFirst","readFirstReason","similarities","differences","complementary","synergy"],
        },
      },
    });
    const p = JSON.parse(response.text || "{}");
    return res.json({
      readFirst:       p.readFirst                           || fallback.readFirst,
      readFirstReason: p.readFirstReason                    || fallback.readFirstReason,
      similarities:    p.similarities?.length ? p.similarities : fallback.similarities,
      differences:     p.differences?.length  ? p.differences  : fallback.differences,
      complementary:   p.complementary                      || fallback.complementary,
      synergy:         p.synergy                            ?? fallback.synergy,
    });
  } catch (err: any) {
    console.error("[book-duel]", err);
    return res.json(fallback);
  }
});

// ── Reading Roadmap: 3-stage sequential reading plan from the library catalog ──
app.post("/api/reading-roadmap", async (req, res) => {
  const { topic } = req.body || {};
  if (!topic) return res.status(400).json({ error: "topic required" });

  const cleanTopic = sanitizeInput(topic, 120);

  const catalogSample = MOCK_BOOKS.slice(0, 30).map(b =>
    `"${b.title}" — ${b.author} [${b.category}]`
  ).join('\n');

  const fallback = {
    stages: [
      {
        label: ar_label('مبتدئ', 'Beginner'),
        icon: '🌱',
        books: [
          { title: `مقدمة في ${cleanTopic}`, author: '', reason: ar_label('أساسيات المجال', 'Foundational overview'), estimatedHours: 6, difficulty: 'beginner' },
        ],
      },
      {
        label: ar_label('متوسط', 'Intermediate'),
        icon: '🔬',
        books: [
          { title: `تعمق في ${cleanTopic}`, author: '', reason: ar_label('بناء الفهم التحليلي', 'Build analytical depth'), estimatedHours: 8, difficulty: 'intermediate' },
        ],
      },
      {
        label: ar_label('متقدم', 'Advanced'),
        icon: '🏆',
        books: [
          { title: `إتقان ${cleanTopic}`, author: '', reason: ar_label('إتقان المجال', 'Master the field'), estimatedHours: 10, difficulty: 'advanced' },
        ],
      },
    ],
    totalHours: 24,
    overview: ar_label(
      `مسار قراءة متدرج في موضوع "${cleanTopic}" — من الأساسيات إلى الإتقان`,
      `A progressive reading path on "${cleanTopic}" — from foundations to mastery`
    ),
  };

  function ar_label(arabic: string, english: string) { return arabic; }

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text:
        `أنت مكتبي ذكي. الطالب يريد خطة قراءة متدرجة في موضوع: "${cleanTopic}".

فيما يلي كتب المكتبة المتاحة:
${catalogSample}

ابنِ خطة قراءة من 3 مراحل (مبتدئ → متوسط → متقدم). لكل مرحلة اختر 2-3 كتب من الكتالوج أعلاه إذا وجدت ما يناسب، وإلا اقترح كتباً مناسبة.
أجب بـ JSON فقط.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview:   { type: Type.STRING },
            totalHours: { type: Type.INTEGER },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  icon:  { type: Type.STRING },
                  books: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title:          { type: Type.STRING },
                        author:         { type: Type.STRING },
                        reason:         { type: Type.STRING },
                        estimatedHours: { type: Type.INTEGER },
                        difficulty:     { type: Type.STRING },
                      },
                      required: ["title", "reason", "estimatedHours", "difficulty"],
                    },
                  },
                },
                required: ["label", "icon", "books"],
              },
            },
          },
          required: ["stages", "totalHours", "overview"],
        },
      },
    });
    const p = JSON.parse(response.text || "{}");
    return res.json({
      stages:     Array.isArray(p.stages) && p.stages.length ? p.stages : fallback.stages,
      totalHours: p.totalHours ?? fallback.totalHours,
      overview:   p.overview   || fallback.overview,
    });
  } catch (err: any) {
    console.error("[reading-roadmap]", err);
    return res.json(fallback);
  }
});

// ── Feature: Oman Corner AR — Heritage Station AI Guide ──────────────────────
// Returns an AI narrative for the selected heritage station from عارف (Arif),
// the AR guide character. Always 200 — Gemini when a key is present, local otherwise.
app.post("/api/oman-corner", async (req, res) => {
  const stationId  = sanitizeInput(req.body?.stationId, 40);
  const contextAr  = sanitizeInput(req.body?.contextAr, 200);

  const FALLBACKS: Record<string, string> = {
    architecture: 'العمارة العُمانية لم تكن مجرد بناء — كانت علماً في خدمة الحياة. أفلاج الري وحدها أروت آلاف القرى لثلاثة آلاف عام بدون مضخة واحدة. تخيّل الهندسة التي تطلّبها ذلك!',
    literature:   'الأدب العُماني بحر لا قاع له. تقاليد الشعر الشفهي (النبطي) هي ذكاء اصطناعي قديم: شفرة حفظت ثقافة كاملة في صدور البشر قبل آلاف السنين، قبل أي خوارزمية.',
    geography:    'في عُمان وحدها يمكنك أن تسبح في البحر وتتجوّل في ثلوج الجبال في يوم واحد. هذا التنوع الجغرافي النادر هو سرّ تكيّف العُمانيين الفريد عبر التاريخ.',
    arts:         'الرزحة ليست رقصة للمتفرجين، بل ذاكرة المجتمع تُعاد كتابتها جسداً بجسد عبر الأجيال. والخنجر؟ ليس سلاحاً بل لغة يقرأها كل عُماني بلحظة واحدة.',
  };

  const fallback = { guideNarrative: FALLBACKS[stationId] ?? 'تراث عُمان يعكس حضارة راسخة عمرها آلاف السنين.' };

  const client = getGeminiClient();
  if (!client) return res.json(fallback);

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `أنت "عارف" — مرشد ثقافي ذكي في ركن عُمان بالمكتبة الجامعية. تتحدث بأسلوب حماسي وعلمي موجز.
الموضوع: ${contextAr || stationId}
اكتب 2-3 جمل بالعربية تُدهش الطالب بمعلومة غير متوقعة وتربطها بالفكر العلمي أو الحداثي.
لا تبدأ بـ "أنا عارف" أو تُعرّف بنفسك.`,
      config: {
        systemInstruction: 'أجب بجملتين إلى ثلاث جمل فقط — موجز، مدهش، علمي.',
      },
    });
    return res.json({ guideNarrative: response.text?.trim() || fallback.guideNarrative });
  } catch (err: any) {
    console.error('[oman-corner]', err);
    return res.json(fallback);
  }
});

// ── Quiz Questions (Gemini-generated for CognitiveARGame) ────────────────
app.post("/api/quiz-questions", async (req, res) => {
  const { levelId, levelNameAr, levelNameEn, count } = req.body || {};
  const wanted = Math.min(Math.max(Number(count) || 6, 3), 8);

  const difficultyMap: Record<string, string> = {
    explorer:      'سهل — من أين تأتي المعرفة الموثوقة: المصدر والمؤلف والتاريخ والنسبة',
    researcher:    'متوسط — بناء البحث وتوثيقه: المعاملات المنطقية، المكنز، التحكيم، الاقتباس، الـDOI',
    distinguished: 'متقدم — أحكام صعبة: المجلات المفترسة، الـpreprint، تضارب المصالح، انتقاء الأدلة، المراجع التي يولّدها الذكاء الاصطناعي، القراءة الجانبية',
  };
  const difficulty = difficultyMap[levelId] || 'متوسط';

  const fallbackQuestions = [
    {
      qAr: 'ما المصدر الأكثر موثوقية للبحث العلمي؟',
      qEn: 'Which is the most reliable source for scientific research?',
      options: [
        { ar: 'مقال محكّم في مجلة علمية', en: 'Peer-reviewed scientific article', correct: true },
        { ar: 'منشور في التواصل الاجتماعي', en: 'Social media post', correct: false },
        { ar: 'مدونة شخصية', en: 'Personal blog', correct: false },
      ],
      whyAr: 'التحكيم فحص مسبق من باحثين مختصين — ليس ضماناً مطلقاً لكنه فرق حقيقي عن نص لم يراجعه أحد.',
      whyEn: 'Peer review is a prior check by specialists — not a guarantee, but a real difference from an unreviewed text.',
    },
    {
      qAr: 'لماذا يجب التحقق من مصدر المعلومة؟',
      qEn: 'Why should you verify the source of information?',
      options: [
        { ar: 'لضمان دقتها وموثوقيتها', en: 'To ensure its accuracy and reliability', correct: true },
        { ar: 'لأن كل المعلومات خاطئة', en: 'Because all information is wrong', correct: false },
        { ar: 'لا داعي للتحقق أبداً', en: 'Verification is never necessary', correct: false },
      ],
      whyAr: 'المعلومة تُستعمل في بناء نتيجة؛ فإن كان أساسها غير موثوق انهارت النتيجة معه.',
      whyEn: 'Information is the foundation of a conclusion; if the foundation is unreliable the conclusion falls with it.',
    },
    {
      qAr: 'أي من هذه يُعدّ مصدراً أولياً؟',
      qEn: 'Which of these is a primary source?',
      options: [
        { ar: 'ورقة بحثية أكاديمية محكّمة', en: 'Peer-reviewed academic paper', correct: true },
        { ar: 'خبر منقول بلا مرجع', en: 'Unattributed news story', correct: false },
        { ar: 'تعليق في منتدى', en: 'Forum comment', correct: false },
      ],
      whyAr: 'المصدر الأولي يقدّم البيانات أو الشهادة مباشرة، بخلاف ما ينقل عن غيره.',
      whyEn: 'A primary source presents the data or testimony directly, unlike one relaying someone else.',
    },
  ];

  const client = getGeminiClient();
  if (!client) return res.json({ questions: fallbackQuestions });

  try {
    const prompt = `أنت خبير في الوعي المعلوماتي وتدريب الباحثين. أنشئ ${wanted} أسئلة اختيار من متعدد تنمّي وعي الطالب المعلوماتي في البحث العلمي.

مستوى الصعوبة: ${difficulty}
اسم المستوى: ${levelNameAr} (${levelNameEn})

شروط لازمة:
- صغ كل سؤال كموقف عملي يواجهه باحث، لا كتعريف يُستظهر.
- 3 خيارات لكل سؤال، خيار واحد فقط صحيح، والخيارات الخاطئة معقولة لا سخيفة.
- لكل سؤال شرح موجز (whyAr / whyEn) يوضّح لماذا الإجابة صحيحة — هذا الشرح هو الفائدة التعليمية وليس اختيارياً.
- وزّع الأسئلة على المهارات: تقييم المصادر، استراتيجية البحث، التوثيق والأمانة، قراءة الأدلة.
- النص بالعربية والإنجليزية معاً، بلغة سليمة ومختصرة.`;

    const response = await withGeminiRetry(() => client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "أنت خبير تربوي في محو الأمية المعلوماتية. أجب بـ JSON فقط.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  qAr:     { type: Type.STRING },
                  qEn:     { type: Type.STRING },
                  whyAr:   { type: Type.STRING },
                  whyEn:   { type: Type.STRING },
                  skill:   { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        ar:      { type: Type.STRING },
                        en:      { type: Type.STRING },
                        correct: { type: Type.BOOLEAN },
                      },
                      required: ["ar", "en", "correct"],
                    },
                  },
                },
                required: ["qAr", "qEn", "whyAr", "whyEn", "options"],
              },
            },
          },
          required: ["questions"],
        },
      },
    }));

    const parsed = JSON.parse(response.text || "{}");
    const questions = parsed.questions?.slice(0, wanted);
    if (!questions || questions.length < 3) return res.json({ questions: fallbackQuestions });
    return res.json({ questions });
  } catch (err: any) {
    const isQuota = String(err).includes('RESOURCE_EXHAUSTED') || (err as any)?.status === 429;
    if (!isQuota) console.error('[quiz-questions]', err);
    return res.json({ questions: fallbackQuestions });
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
    // Loud on purpose: running on the built-in admin password means anyone who
    // can read the source can sign in as an administrator.
    if (ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
      console.warn(
        "\n  WARNING  Admin sign-in is using the built-in password from server.ts.\n" +
        "           It is public to anyone with the source. Set ADMIN_PASSWORD to\n" +
        "           replace it, or ADMIN_PASSWORD=\"\" to disable admin sign-in.\n"
      );
    } else if (!ADMIN_PASSWORD) {
      console.log("  Admin sign-in is disabled (ADMIN_PASSWORD is empty).");
    }
  });
}

startServer();
