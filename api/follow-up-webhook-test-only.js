/**
 * Proxy que envía SOLO al webhook de test de n8n.
 * Ruta en Vercel: POST /api/follow-up-webhook-test-only
 */
const N8N_WEBHOOK_TEST_URL = 'https://groupegmpi.app.n8n.cloud/webhook-test/7b435532-c75c-497a-a22c-377d6b23421fFLUP';

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
        const testRes = await fetch(N8N_WEBHOOK_TEST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const ok = testRes.status >= 200 && testRes.status < 300;
        return res.status(200).json({ ok });
    } catch (err) {
        console.error('follow-up-webhook-test-only error:', err);
        return res.status(200).json({ ok: false, error: String(err.message) });
    }
};
