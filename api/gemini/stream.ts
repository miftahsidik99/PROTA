import { getAiClient, generateContentStreamWithFallback, extractGeminiErrorInfo } from './_shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { model, contents, config, customApiKey } = body;
    const headerKey = req.headers?.['x-gemini-api-key'];
    const clientKey = typeof headerKey === 'string' ? headerKey : customApiKey;

    const ai = getAiClient(clientKey);
    const responseStream = await generateContentStreamWithFallback(ai, model, contents, config);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of responseStream) {
      const data = JSON.stringify({ text: chunk.text });
      res.write(`data: ${data}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    const info = extractGeminiErrorInfo(error);
    const status = info.status >= 400 && info.status < 600 ? info.status : 500;
    console.warn(`Gemini stream error [${status} ${info.statusText}]: ${error?.message || info.rawMessage}`);
    if (!res.headersSent) {
      res.status(status).json({
        error: error?.message || 'Gagal streaming konten dari AI pada server',
        code: status,
        status: info.statusText,
        isQuotaError: info.isRateLimit,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message, code: status, isQuotaError: info.isRateLimit })}\n\n`);
      res.end();
    }
  }
}
