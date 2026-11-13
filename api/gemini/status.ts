import { getResolvedApiKey } from './_shared';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const serverKeyConfigured = Boolean(getResolvedApiKey());
  return res.status(200).json({
    status: 'ok',
    serverKeyConfigured,
  });
}
