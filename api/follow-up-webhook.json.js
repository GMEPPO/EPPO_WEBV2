/**
 * Proxy para el webhook de alertas follow-up (evita CORS desde el navegador).
 * Ruta con .json para que el rewrite de SPA no la capture: POST /api/follow-up-webhook.json
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
        const n8nOk = proxyRes.status >= 200 && proxyRes.status < 300;
        // Siempre 200 al cliente para que no se muestre 404; el resultado real va en el body.
        return res.status(200).json({ ok: n8nOk });
    } catch (err) {
        console.error('follow-up-webhook proxy error:', err);
        return res.status(200).json({ ok: false, error: 'Proxy failed' });
    }
};
