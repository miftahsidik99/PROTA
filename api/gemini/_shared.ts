import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const DEFAULT_PRIMARY_MODEL = 'gemini-4-hydrogen';
const DEFAULT_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

const INVALID_OR_LEGACY_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash-thinking',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
]);

export interface ParsedGeminiErrorInfo {
  status: number;
  statusText: string;
  rawMessage: string;
  details: any;
  isModelNotFound: boolean;
  isRateLimit: boolean;
  isZeroQuota: boolean;
  isRetryable: boolean;
  isAuthOrKeyError: boolean;
  retryDelayMs: number | null;
}

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
    const err: any = new Error(
      'API Key Gemini belum dikonfigurasi pada server (GEMINI_API_KEY). Silakan periksa panel Settings > Secrets.'
    );
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
  const cleaned = config && typeof config === 'object' ? { ...config } : {};
  const isGemini4 = modelName.startsWith('gemini-4-');
  const isGemini3 = modelName.startsWith('gemini-3.');
  const isModernThinkingModel = isGemini4 || isGemini3;

  if (isModernThinkingModel) {
    delete cleaned.temperature;
    delete cleaned.topP;
    delete cleaned.topK;
    delete cleaned.candidateCount;

    if (cleaned.thinkingConfig && 'thinkingBudget' in cleaned.thinkingConfig) {
      const { thinkingBudget: _ignored, ...restThinking } = cleaned.thinkingConfig;
      cleaned.thinkingConfig = restThinking;
    }

    const currentLevel = cleaned.thinkingConfig?.thinkingLevel;
    if (isGemini4) {
      if (!currentLevel || currentLevel === ThinkingLevel.MINIMAL || currentLevel === 'MINIMAL') {
        cleaned.thinkingConfig = {
          ...(cleaned.thinkingConfig || {}),
          thinkingLevel: ThinkingLevel.LOW,
        };
      }
    } else if (isGemini3) {
      if (currentLevel === 'XHIGH' || currentLevel === (ThinkingLevel as any).XHIGH) {
        cleaned.thinkingConfig = {
          ...(cleaned.thinkingConfig || {}),
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  if (cleaned.thinkingConfig && 'thinkingLevel' in cleaned.thinkingConfig) {
    const { thinkingLevel: _ignoredLevel, ...restThinking } = cleaned.thinkingConfig;
    if (Object.keys(restThinking).length > 0) {
      cleaned.thinkingConfig = restThinking;
    } else {
      delete cleaned.thinkingConfig;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export function getCandidateModels(requestedModel?: string): string[] {
  const candidates: string[] = [];
  const pushUnique = (m?: string) => {
    if (m && !candidates.includes(m)) candidates.push(m);
  };

  const trimmed = (requestedModel || '').trim();
  const isLegacyOrInvalid =
    !trimmed ||
    INVALID_OR_LEGACY_MODELS.has(trimmed) ||
    trimmed.includes('2.5') ||
    trimmed.includes('2.0') ||
    trimmed.includes('1.5') ||
    trimmed.includes('flash-preview') ||
    (trimmed.includes('3.8-flash') && !trimmed.includes('tts'));

  if (!isLegacyOrInvalid) {
    pushUnique(trimmed);
  }
  pushUnique(DEFAULT_PRIMARY_MODEL);
  pushUnique(DEFAULT_FALLBACK_MODEL);
  return candidates;
}

function tryParseJsonPayload(text: string): any | null {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function parseRetryDelayMs(details: any): number | null {
  if (!Array.isArray(details)) return null;
  for (const item of details) {
    if (item && typeof item.retryDelay === 'string') {
      const match = item.retryDelay.trim().match(/^(\d+(?:\.\d+)?)s$/i);
      if (match) {
        const ms = Math.ceil(Number(match[1]) * 1000);
        if (Number.isFinite(ms) && ms > 0) return ms;
      }
    }
  }
  return null;
}

export function extractGeminiErrorInfo(err: any): ParsedGeminiErrorInfo {
  const parsedMsgObj = tryParseJsonPayload(String(err?.message || ''));
  const nestedError = err?.error?.error || err?.error || parsedMsgObj?.error || parsedMsgObj || null;

  let status = Number(
    err?.status ||
      err?.statusCode ||
      err?.code ||
      nestedError?.code ||
      0
  );

  const statusText = String(
    nestedError?.status || err?.statusText || ''
  ).toUpperCase();

  const rawMessage = String(
    nestedError?.message || err?.message || 'Gagal memproses permintaan Gemini AI'
  );
  const lowerCombined = `${statusText} ${rawMessage} ${String(err?.message || '')}`.toLowerCase();

  if (!status || status < 400 || status >= 600) {
    if (
      statusText === 'RESOURCE_EXHAUSTED' ||
      lowerCombined.includes('resource_exhausted') ||
      lowerCombined.includes('exceeded your current quota') ||
      lowerCombined.includes('"code":429')
    ) {
      status = 429;
    } else if (statusText === 'PERMISSION_DENIED' || lowerCombined.includes('permission_denied')) {
      status = 403;
    } else if (statusText === 'UNAUTHENTICATED' || lowerCombined.includes('api_key_invalid') || lowerCombined.includes('api key not valid')) {
      status = 400;
    } else if (statusText === 'NOT_FOUND' || lowerCombined.includes('not_found') || lowerCombined.includes('is not found')) {
      status = 404;
    } else if (statusText === 'UNAVAILABLE' || lowerCombined.includes('overloaded') || lowerCombined.includes('temporarily unavailable')) {
      status = 503;
    } else {
      status = 500;
    }
  }

  const isModelNotFound =
    status === 404 ||
    statusText === 'NOT_FOUND' ||
    lowerCombined.includes('is no longer available') ||
    lowerCombined.includes('is not found for api version');

  const isRateLimit =
    status === 429 ||
    statusText === 'RESOURCE_EXHAUSTED' ||
    lowerCombined.includes('resource_exhausted') ||
    lowerCombined.includes('exceeded your current quota') ||
    lowerCombined.includes('rate limit');

  const isZeroQuota =
    lowerCombined.includes('limit: 0') ||
    lowerCombined.includes('please check your plan and billing');

  const isRetryable =
    isRateLimit ||
    status === 503 ||
    status === 500 ||
    statusText === 'UNAVAILABLE' ||
    lowerCombined.includes('overloaded') ||
    lowerCombined.includes('temporarily unavailable');

  const isAuthOrKeyError =
    status === 401 ||
    status === 403 ||
    statusText === 'PERMISSION_DENIED' ||
    lowerCombined.includes('api_key_invalid') ||
    lowerCombined.includes('api key not valid');

  const retryDelayMs = parseRetryDelayMs(nestedError?.details);

  return {
    status,
    statusText: statusText || (isRateLimit ? 'RESOURCE_EXHAUSTED' : 'INTERNAL'),
    rawMessage,
    details: nestedError?.details || err?.error || null,
    isModelNotFound,
    isRateLimit,
    isZeroQuota,
    isRetryable,
    isAuthOrKeyError,
    retryDelayMs,
  };
}

export function buildNormalizedGeminiError(err: any): Error & {
  status: number;
  code: number;
  isQuotaError: boolean;
  error: any;
} {
  const info = extractGeminiErrorInfo(err);
  let friendlyMessage = info.rawMessage;

  if (info.isRateLimit) {
    friendlyMessage =
      'Kuota atau batas permintaan Gemini API sedang terlampaui (429 RESOURCE_EXHAUSTED). Silakan tunggu sebentar lalu coba lagi, atau pilih API key berbayar pada panel Settings > Secrets untuk kuota yang lebih tinggi.';
  } else if (info.isAuthOrKeyError) {
    friendlyMessage =
      'API Key Gemini tidak valid atau tidak memiliki izin akses (403/400). Silakan periksa atau pilih ulang API key pada panel Settings > Secrets.';
  } else if (info.isModelNotFound) {
    friendlyMessage =
      'Model Gemini yang diminta tidak tersedia untuk konfigurasi saat ini (404 NOT_FOUND).';
  }

  const normalized: any = new Error(friendlyMessage);
  normalized.status = info.status;
  normalized.code = info.status;
  normalized.isQuotaError = info.isRateLimit;
  normalized.statusText = info.statusText;
  normalized.error = {
    code: info.status,
    status: info.statusText,
    message: friendlyMessage,
    upstreamMessage: info.rawMessage,
    details: info.details,
  };
  return normalized;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestedModel: string | undefined,
  contents: any,
  config?: any
) {
  const models = getCandidateModels(requestedModel);
  let lastError: any = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const modelName = models[mIdx];
    const hasNextModel = mIdx < models.length - 1;
    const safeConfig = sanitizeConfigForModel(modelName, config);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model: modelName,
          contents,
          config: safeConfig,
        });
      } catch (err: any) {
        lastError = err;
        const info = extractGeminiErrorInfo(err);

        if (info.isModelNotFound) {
          console.warn(`Gemini model ${modelName} unavailable (404), trying next fallback model...`);
          break;
        }

        if (info.isRetryable) {
          if (attempt === 1 && !info.isZeroQuota) {
            const backoffMs =
              info.retryDelayMs && info.retryDelayMs <= 4500
                ? info.retryDelayMs + Math.floor(Math.random() * 350)
                : 1200 + Math.floor(Math.random() * 450);
            console.warn(
              `Gemini ${modelName} transient ${info.status} (${info.statusText}), retrying in ${backoffMs}ms...`
            );
            await sleep(backoffMs);
            continue;
          }

          if (hasNextModel) {
            console.warn(
              `Gemini ${modelName} hit ${info.status} (${info.statusText}), switching to fallback model ${models[mIdx + 1]}...`
            );
            await sleep(350);
            break;
          }
        }

        throw buildNormalizedGeminiError(err);
      }
    }
  }

  throw buildNormalizedGeminiError(lastError);
}

export async function generateContentStreamWithFallback(
  ai: GoogleGenAI,
  requestedModel: string | undefined,
  contents: any,
  config?: any
) {
  const models = getCandidateModels(requestedModel);
  let lastError: any = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const modelName = models[mIdx];
    const hasNextModel = mIdx < models.length - 1;
    const safeConfig = sanitizeConfigForModel(modelName, config);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContentStream({
          model: modelName,
          contents,
          config: safeConfig,
        });
      } catch (err: any) {
        lastError = err;
        const info = extractGeminiErrorInfo(err);

        if (info.isModelNotFound) {
          console.warn(`Gemini stream model ${modelName} unavailable (404), trying next fallback model...`);
          break;
        }

        if (info.isRetryable) {
          if (attempt === 1 && !info.isZeroQuota) {
            const backoffMs =
              info.retryDelayMs && info.retryDelayMs <= 4500
                ? info.retryDelayMs + Math.floor(Math.random() * 350)
                : 1200 + Math.floor(Math.random() * 450);
            console.warn(
              `Gemini stream ${modelName} transient ${info.status} (${info.statusText}), retrying in ${backoffMs}ms...`
            );
            await sleep(backoffMs);
            continue;
          }

          if (hasNextModel) {
            console.warn(
              `Gemini stream ${modelName} hit ${info.status} (${info.statusText}), switching to fallback model ${models[mIdx + 1]}...`
            );
            await sleep(350);
            break;
          }
        }

        throw buildNormalizedGeminiError(err);
      }
    }
  }

  throw buildNormalizedGeminiError(lastError);
}
