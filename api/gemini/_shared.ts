import { GoogleGenAI } from '@google/genai';

export function getResolvedApiKey(reqHeaderKey?: string): string {
  if (reqHeaderKey && typeof reqHeaderKey === 'string' && reqHeaderKey.trim().length > 0) {
    return reqHeaderKey.trim();
  }
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.VITE_PROTA_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
}

export function getAiClient(reqHeaderKey?: string): GoogleGenAI {
  const apiKey = getResolvedApiKey(reqHeaderKey);
  if (!apiKey) {
    const err: any = new Error('API Key Gemini belum dikonfigurasi pada server (GEMINI_API_KEY).');
    err.status = 401;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function sanitizeConfigForModel(modelName: string, config?: any): any {
  if (!config || typeof config !== 'object') return config;
  const cleaned = { ...config };
  if (modelName.startsWith('gemini-4-') || modelName.startsWith('gemini-3.')) {
    delete cleaned.temperature;
    delete cleaned.topP;
    delete cleaned.topK;
    delete cleaned.candidateCount;
    if (cleaned.thinkingConfig && 'thinkingBudget' in cleaned.thinkingConfig) {
      const { thinkingBudget: _ignored, ...restThinking } = cleaned.thinkingConfig;
      cleaned.thinkingConfig = restThinking;
    }
  }
  return cleaned;
}

export function getCandidateModels(requestedModel?: string): string[] {
  const candidates: string[] = [];
  const pushUnique = (m?: string) => {
    if (m && !candidates.includes(m)) candidates.push(m);
  };

  if (requestedModel && !requestedModel.includes('2.5') && !requestedModel.includes('flash-preview')) {
    pushUnique(requestedModel);
  }
  pushUnique('gemini-4-hydrogen');
  pushUnique('gemini-3.8-flash');
  pushUnique('gemini-2.5-flash');
  return candidates;
}

function isModelNotFoundError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = `${err?.message || ''} ${JSON.stringify(err?.error || '')}`.toLowerCase();
  return (
    status === 404 ||
    msg.includes('not_found') ||
    msg.includes('is no longer available') ||
    msg.includes('is not found for api version')
  );
}

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestedModel: string | undefined,
  contents: any,
  config?: any
) {
  const models = getCandidateModels(requestedModel);
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const safeConfig = sanitizeConfigForModel(modelName, config);
      return await ai.models.generateContent({
        model: modelName,
        contents,
        config: safeConfig,
      });
    } catch (err: any) {
      lastError = err;
      if (isModelNotFoundError(err)) {
        console.warn(`Model ${modelName} unavailable on this API key tier, trying next fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function generateContentStreamWithFallback(
  ai: GoogleGenAI,
  requestedModel: string | undefined,
  contents: any,
  config?: any
) {
  const models = getCandidateModels(requestedModel);
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const safeConfig = sanitizeConfigForModel(modelName, config);
      return await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: safeConfig,
      });
    } catch (err: any) {
      lastError = err;
      if (isModelNotFoundError(err)) {
        console.warn(`Stream model ${modelName} unavailable on this API key tier, trying next fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
