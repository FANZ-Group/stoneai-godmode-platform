// server.js — StoneAI GOD MODE Platform server
// Serves the 3D infrastructure map and proxies to the God Mode control plane.

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8888;
const GOD_MODE_API = (process.env.GOD_MODE_API || 'http://127.0.0.1:8787').replace(/\/$/, '');

app.use(express.json());
app.use(express.static(__dirname));

// Proxy: assets
app.get('/api/godmode/assets', async (req, res) => {
  try {
    const r = await fetch(`${GOD_MODE_API}/api/godmode/assets`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Proxy: commands list
app.get('/api/godmode/commands', async (req, res) => {
  try {
    const r = await fetch(`${GOD_MODE_API}/api/godmode/commands`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Proxy: single command
app.get('/api/godmode/commands/:id', async (req, res) => {
  try {
    const r = await fetch(`${GOD_MODE_API}/api/godmode/commands/${encodeURIComponent(req.params.id)}`);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Proxy: issue command
app.post('/api/godmode/commands', async (req, res) => {
  try {
    const r = await fetch(`${GOD_MODE_API}/api/godmode/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Proxy: objection
app.post('/api/godmode/commands/:id/objection', async (req, res) => {
  try {
    const r = await fetch(`${GOD_MODE_API}/api/godmode/commands/${encodeURIComponent(req.params.id)}/objection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// Health
app.get('/healthz', (req, res) => {
  res.json({ ok: true, service: 'stoneai-godmode-platform' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`StoneAI GOD MODE Platform listening on http://0.0.0.0:${PORT}`);
  console.log(`  God Mode API: ${GOD_MODE_API}`);
  console.log(`  Map: http://0.0.0.0:${PORT}/`);
});
EOF
echo "written"