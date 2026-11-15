import { searchEducationalMedia } from './_shared';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let q = String(req.query?.q || '').trim();
  let limitRaw = req.query?.limit;
  if (!q || limitRaw === undefined) {
    try {
      const sp = new URL(req.url || '/', 'https://localhost').searchParams;
      if (!q) q = String(sp.get('q') || '').trim();
      if (limitRaw === undefined) limitRaw = sp.get('limit') ?? undefined;
    } catch {}
  }
  const limit = Math.min(8, Math.max(1, Number(limitRaw || 4)));

  if (!q) {
    return res.status(400).json({ error: 'Parameter pencarian q wajib diisi', results: [] });
  }

  try {
    const results = await searchEducationalMedia(q, limit);
    return res.status(200).json({ query: q, results });
  } catch (error: any) {
    console.error('Media search error:', error);
    return res.status(200).json({ query: q, results: [] });
  }
}
