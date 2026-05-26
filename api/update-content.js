import { writeFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, content } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

  // In local dev, write directly to the file so changes are immediately visible
  if (process.env.VERCEL !== '1') {
    try {
      const localPath = join(process.cwd(), '_data', 'content.json');
      await writeFile(localPath, JSON.stringify(content, null, 2), 'utf8');
      return res.status(200).json({ success: true, local: true });
    } catch (e) {
      return res.status(500).json({ error: 'Local write failed', detail: e.message });
    }
  }

  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const path  = '_data/content.json';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'milena-admin'
  };

  // Get current SHA
  const getRes = await fetch(apiBase, { headers });
  if (!getRes.ok) return res.status(500).json({ error: 'Could not read current content' });
  const { sha } = await getRes.json();

  // Push updated content
  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Update site content via admin panel',
      content: encoded,
      sha,
      committer: { name: 'Milena Admin', email: 'milena.kaligirwa@gmail.com' }
    })
  });

  if (putRes.ok) {
    return res.status(200).json({ success: true });
  } else {
    const err = await putRes.json();
    return res.status(500).json({ error: 'GitHub update failed', detail: err.message });
  }
}
