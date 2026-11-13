import { getAiClient, generateContentWithFallback } from './_shared';

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
    console.error('Vercel Gemini generateContent error:', error);
    const status = Number(error?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error?.message || 'Gagal memproses permintaan AI pada server',
      details: error?.error || null,
    });
  }
}
