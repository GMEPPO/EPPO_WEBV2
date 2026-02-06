/**
 * Proxy para el webhook de alertas follow-up (evita CORS desde el navegador).
 * Ruta: POST /api/follow-up-webhook (también /api/follow-up-webhook.json vía rewrite en vercel.json).
 */
const N8N_WEBHOOK_URL = 'https://groupegmpi.app.n8n.cloud/webhook/7b435532-c75c-497a-a22c-377d6b23421fFLUP';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    try {
        const proxyRes = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const status = proxyRes.status;
        return res.status(status).json({ ok: status >= 200 && status < 300 });
    } catch (err) {
        console.error('follow-up-webhook proxy error:', err);
        return res.status(502).json({ error: 'Proxy failed', message: err.message });
    }
};
