import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Helper to initialize GoogleGenAI with server key, falling back to client-provided key if supplied
function getAiClient(reqHeaderKey?: string) {
  const apiKey = (reqHeaderKey && reqHeaderKey.trim().length > 0)
    ? reqHeaderKey.trim()
    : (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '');

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Status check endpoint
app.get('/api/gemini/status', (req: Request, res: Response) => {
  const serverKeyConfigured = Boolean(
    process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY
  );
  res.json({
    status: 'ok',
    serverKeyConfigured
  });
});

// Helper to resolve the correct supported Gemini model
function resolveModel(requestedModel?: string): string {
  if (!requestedModel || requestedModel.includes('2.5') || requestedModel.includes('flash-preview')) {
    return 'gemini-3.8-flash';
  }
  return requestedModel;
}

// Primary generation endpoint
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { model, contents, config } = req.body;
    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const ai = getAiClient(clientKey);

    const modelName = resolveModel(model);
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config
    });

    res.json({
      text: response.text || '',
      candidates: response.candidates,
      usageMetadata: response.usageMetadata
    });
  } catch (error: any) {
    console.error('Server Gemini generateContent error:', error);
    const status = error?.status || 500;
    res.status(status).json({
      error: error?.message || 'Gagal memproses permintaan AI pada server',
      details: error?.error || null
    });
  }
});

// Streaming endpoint
app.post('/api/gemini/stream', async (req: Request, res: Response) => {
  try {
    const { model, contents, config } = req.body;
    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const ai = getAiClient(clientKey);

    const modelName = resolveModel(model);
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config
    });

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
    console.error('Server Gemini stream error:', error);
    if (!res.headersSent) {
      res.status(error?.status || 500).json({
        error: error?.message || 'Gagal streaming konten dari AI pada server'
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message })}\n\n`);
      res.end();
    }
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (${isDev ? 'development' : 'production'})`);
  });
}

startServer();
