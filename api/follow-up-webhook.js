/**
 * Proxy para el webhook de alertas follow-up (evita CORS desde el navegador).
 * Ruta: POST /api/follow-up-webhook (también /api/follow-up-webhook.json vía rewrite en vercel.json).
 * Envía a producción y al webhook de test de n8n.
 */
const N8N_WEBHOOK_URL = 'https://groupegmpi.app.n8n.cloud/webhook/7b435532-c75c-497a-a22c-377d6b23421fFLUP';
const N8N_WEBHOOK_TEST_URL = 'https://groupegmpi.app.n8n.cloud/webhook-test/7b435532-c75c-497a-a22c-377d6b23421fFLUP';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Send-To-Test');

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

    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
    const doSendToTest = true;

    try {
        const prodPromise = fetch(N8N_WEBHOOK_URL, postOptions);
        const testPromise = doSendToTest ? fetch(N8N_WEBHOOK_TEST_URL, postOptions) : Promise.resolve(null);
        const [prodResult, testResult] = await Promise.allSettled([prodPromise, testPromise]);
        const prodOk = prodResult.status === 'fulfilled' && prodResult.value.status >= 200 && prodResult.value.status < 300;
        const testOk = testResult.status === 'fulfilled' && testResult.value != null && testResult.value.status >= 200 && testResult.value.status < 300;
        if (prodResult.status === 'rejected') console.error('follow-up-webhook proxy (prod):', prodResult.reason);
        if (testResult.status === 'rejected') console.error('follow-up-webhook proxy (test):', testResult.reason);
        return res.status(200).json({ ok: prodOk, testOk });
    } catch (err) {
        console.error('follow-up-webhook proxy error:', err);
        return res.status(502).json({ error: 'Proxy failed', message: err.message });
    }
};
