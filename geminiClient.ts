// Client-side helper for interacting with the server-side Gemini API endpoints

export enum Type {
  TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
}

export interface GenerateGeminiOptions {
  model?: string;
  contents: any;
  config?: any;
}

export interface GenerateGeminiResult {
  text: string;
  candidates?: any[];
  usageMetadata?: any;
}

/**
 * Calls server-side Gemini endpoint /api/gemini/generate
 */
export async function generateGeminiContent(options: GenerateGeminiOptions): Promise<GenerateGeminiResult> {
  let customKey = '';
  try {
    customKey = localStorage.getItem('prota_custom_api_key') || '';
  } catch (e) {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (customKey && customKey.trim()) {
    headers['x-gemini-api-key'] = customKey.trim();
  }

  const response = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server AI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.text || '',
    candidates: data.candidates,
    usageMetadata: data.usageMetadata
  };
}
