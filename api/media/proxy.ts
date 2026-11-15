import { fetchSafeRemoteImage } from './_shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let targetUrl = String(req.query?.url || '').trim();
  if (!targetUrl) {
    try {
      targetUrl = String(new URL(req.url || '/', 'https://localhost').searchParams.get('url') || '').trim();
    } catch {}
  }
  if (!targetUrl) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Parameter url wajib diisi' });
  }

  try {
    const { buffer, contentType } = await fetchSafeRemoteImage(targetUrl);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(buffer));
  } catch (error: any) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: error?.message || 'Gagal mengunduh gambar' });
  }
}
