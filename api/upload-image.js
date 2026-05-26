export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, filename, base64 } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const safeName = filename.replace(/[^a-z0-9._-]/gi, '_');
  const path = `images/uploads/${safeName}`;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'milena-admin'
  };

  // Check if file already exists (need SHA to overwrite)
  let sha;
  const check = await fetch(apiBase, { headers });
  if (check.ok) { const d = await check.json(); sha = d.sha; }

  const body = {
    message: `Upload image: ${safeName}`,
    content: base64.replace(/^data:[^;]+;base64,/, ''),
    committer: { name: 'Milena Admin', email: 'milena.kaligirwa@gmail.com' }
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });

  if (putRes.ok) {
    return res.status(200).json({ success: true, path: `/images/uploads/${safeName}` });
  } else {
    const err = await putRes.json();
    return res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
}
