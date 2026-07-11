import { GoogleGenAI } from "@google/genai";
import { Book } from "../types";
import { MOCK_BOOKS } from "../data/mockData";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function getAiRecommendations(userIdea: string): Promise<string> {
  const booksContext = MOCK_BOOKS.map(b => `- ID: [ID:${b.id}], العنوان: ${b.title}, التصنيف: ${b.category}, الوصف: ${b.description}`).join('\n');
  
  const systemInstruction = `
    أنت مساعد ذكي في مكتبة جامعية متطورة. مهمتك هي مساعدة الطلاب في العثور على الكتب المناسبة بناءً على أفكارهم أو احتياجاتهم البحثية.
    لديك قائمة بالكتب المتوفرة في المكتبة:
    ${booksContext}
    
    تعليمات:
    1. اقترح أفضل الكتب المتوفرة التي تناسب فكرة الطالب.
    2. يجب عليك دائماً ذكر معرف الكتاب بتنسيق [ID:رقم] (مثال: [ID:21]) بجانب اسم الكتاب لكي يتعرف عليه النظام.
    3. إذا لم تجد كتاباً مطابقاً تماماً، اقترح الأقرب إليه واشرح لماذا.
    4. قدم ملخصاً بسيطاً لكل كتاب تقترحه.
    5. اجعل لغتك ودية، مهنية، ومشجعة.
    6. أجب باللغة العربية دائماً.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userIdea,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء التواصل مع مساعد الذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
  }
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function chatWithAi(messages: ChatMessage[]): Promise<string> {
  const booksContext = MOCK_BOOKS.map(b => `- ID: [ID:${b.id}], العنوان: ${b.title}, التصنيف: ${b.category}, الوصف: ${b.description}`).join('\n');
  
  const systemInstruction = `
    أنت مساعد ذكي ونظام خبير في مكتبة جامعية رقمية متطورة. مهمتك هي مساعدة الطلاب والباحثين في العثور على المراجع الدقيقة والكتب المتخصصة بناءً على استفساراتهم بالدردشة.
    
    قاعدة بيانات الكتب المتاحة:
    ${booksContext}
    
    قواعد الرد:
    1. التحليل الموضوعي: إذا سأل الطالب عن موضوع معين (مثلاً: "تركيب محركات السيارات")، ابحث في الوصف عن الكلمات المفتاحية (مثل "محركات"، "ميكانيكا"، "تركيب").
    2. عرض الكتب: عند ترشيح كتاب، يجب كتابة اسم الكتاب متبوعاً بمعرفه الخاص بتنسيق [ID:رقم]. هذا ضروري جداً ليتمكن النظام من إظهار بطاقة الكتاب للمستخدم.
       مثال: "أنصحك بقراءة كتاب مبادئ محركات الاحتراق الداخلي [ID:21] لأنه يتناول بالتفصيل طرق التركيب."
    3. التفصيل العلمي: قدم نبذة عن الموضوع الذي سأل عنه الطالب قبل أو بعد اقتراح الكتب لتعزيز القيمة المعرفية.
    4. التنسيق: استخدم القوائم والنقاط والخط العريض لتنظيم الإجابة.
    5. اللغة: اللغة العربية الفصحى، بأسلوب مهذب ومشجع.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء التواصل مع مساعد الذكاء الاصطناعي.";
  }
}

export async function getSearchInsights(query: string, results: Book[]): Promise<string> {
  const context = results.slice(0, 3).map(b => `- ${b.title}: ${b.description}`).join('\n');
  
  const prompt = `
    أنت محلل أكاديمي ذكي. قام الطالب بالبحث عن: "${query}".
    ظهرت النتائج التالية (أهم 3 كتب):
    ${context}
    
    مهمتك:
    1. قدم ملخصاً قصيراً جداً (في سطرين) عن الرابط المشترك بين هذه الكتب وعلاقتها ببحث الطالب.
    2. قدم نصيحة بحثية سريعة للطالب لتوسيع مداركه في هذا الموضوع.
    3. إذا كانت الكتب متنوعة، اقترح عليه أي قسم في المكتبة يجب أن يركز عليه.
    
    اجعل الرد موجزاً ومركزاً جداً (حوالي 50-70 كلمة).
    أجب باللغة العربية.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Search Insights Error:", error);
    return "";
  }
}
