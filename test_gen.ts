import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    fase: { type: Type.STRING },
    description: { type: Type.STRING },
    elements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          elementName: { type: Type.STRING },
          capaianPembelajaran: { type: Type.STRING },
          allocations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                className: { type: Type.STRING },
                tujuanPembelajaran: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Daftar Tujuan Pembelajaran spesifik"
                }
              },
              required: ["className", "tujuanPembelajaran"]
            }
          }
        },
        required: ["elementName", "capaianPembelajaran", "allocations"]
      }
    }
  },
  required: ["subject", "fase", "elements", "description"]
};

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Test prompt",
      config: { responseMimeType: "application/json", responseSchema: schema, maxOutputTokens: 8192 }
    });
    console.log("Success:", response.text ? "Has text" : "No text");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
