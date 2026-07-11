import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

export function getAiClient() {
  if (!ai) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in your environment.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function summarizeBookContent(content: string): Promise<string> {
  const client = getAiClient();
  
  const prompt = `
    أنت خبير في تلخيص الكتب والمحتوى الأكاديمي.
    قم بتزويد ملخص شامل ومنظم للمحتوى التالي باللغة العربية.
    يجب أن يتضمن الملخص:
    1. نظرة عامة موجزة.
    2. الأفكار الرئيسية أو الفصول الهامة.
    3. النقاط الأساسية أو الدروس المستفادة.
    4. خاتمة موجزة.
    
    استخدم تنسيق Markdown لجعل الملخص سهل القراءة.
    
    المحتوى المراد تلخيصه:
    ${content}
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "لم يتمكن النموذج من إنشاء ملخص.";
  } catch (error) {
    console.error("Error summarizing content:", error);
    throw new Error("حدث خطأ أثناء محاولة تلخيص المحتوى. يرجى المحاولة مرة أخرى.");
  }
}
