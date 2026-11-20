import { getAiClient, generateContentWithFallback, extractGeminiErrorInfo } from './_shared';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { model, contents, config, customApiKey } = body;
    const headerKey = req.headers?.['x-gemini-api-key'];
    const clientKey = typeof headerKey === 'string' ? headerKey : customApiKey;

    const ai = getAiClient(clientKey);
    const response = await generateContentWithFallback(ai, model, contents, config);

    return res.status(200).json({
      text: response.text || '',
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
    });
  } catch (error: any) {
    const info = extractGeminiErrorInfo(error);
    const status = info.status >= 400 && info.status < 600 ? info.status : 500;
    console.warn(`Gemini generateContent error [${status} ${info.statusText}]: ${error?.message || info.rawMessage}`);
    return res.status(status).json({
      error: error?.message || 'Gagal memproses permintaan AI pada server',
      code: status,
      status: info.statusText,
      isQuotaError: info.isRateLimit,
      details: error?.error || info.details || null,
    });
  }
}
