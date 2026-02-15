import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const posts = await kv.get('aip2100-posts') || [];
      return res.status(200).json(posts);
    }

    // All write operations require admin key
    const adminKey = req.headers['x-admin-key'];
    const validKey = process.env.ADMIN_KEY || 'aip2100admin';
    if (adminKey !== validKey) {
      return res.status(401).json({ error: 'Ugyldig admin-nøkkel' });
    }

    if (req.method === 'POST') {
      // Add one or more posts
      const body = req.body;
      const existing = await kv.get('aip2100-posts') || [];
      const newPosts = Array.isArray(body) ? body : [body];
      const withIds = newPosts.map((p, i) => ({
        ...p,
        id: p.id || `${Date.now()}-${i}`,
        likes: Number(p.likes) || 0,
        comments: Number(p.comments) || 0,
        externalComments: Number(p.externalComments) || 0,
        reposts: Number(p.reposts) || 0,
        createdAt: new Date().toISOString(),
      }));
      const updated = [...withIds, ...existing];
      await kv.set('aip2100-posts', updated);
      return res.status(201).json({ added: withIds.length, total: updated.length });
    }

    if (req.method === 'PUT') {
      // Update a post by id
      const { id, ...changes } = req.body;
      if (!id) return res.status(400).json({ error: 'Mangler id' });
      const existing = await kv.get('aip2100-posts') || [];
      const updated = existing.map(p => p.id === id ? {
        ...p, ...changes,
        likes: Number(changes.likes ?? p.likes) || 0,
        comments: Number(changes.comments ?? p.comments) || 0,
        externalComments: Number(changes.externalComments ?? p.externalComments) || 0,
        reposts: Number(changes.reposts ?? p.reposts) || 0,
      } : p);
      await kv.set('aip2100-posts', updated);
      return res.status(200).json({ updated: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Mangler id' });
      const existing = await kv.get('aip2100-posts') || [];
      const updated = existing.filter(p => p.id !== id);
      await kv.set('aip2100-posts', updated);
      return res.status(200).json({ deleted: true, remaining: updated.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
