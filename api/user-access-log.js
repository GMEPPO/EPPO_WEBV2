const {
    jsonBody,
    requireAuthenticated,
    setCors
} = require('./_admin-users-helper');

module.exports = async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await requireAuthenticated(req);
    if (!auth.ok) {
        return res.status(auth.status).json(auth.body);
    }

    try {
        const body = jsonBody(req);
        const sourcePath = (body.source_path || '').toString().trim() || null;
        const pageTitle = (body.page_title || '').toString().trim() || null;
        const referrer = (body.referrer || '').toString().trim() || null;
        const userAgent = (body.user_agent || '').toString().trim() || null;
        const sessionKey = (body.session_key || '').toString().trim() || null;

        const { error } = await auth.adminClient
            .from('user_access_logs')
            .insert({
                user_id: auth.requester.id,
                source_path: sourcePath,
                page_title: pageTitle,
                referrer,
                user_agent: userAgent,
                session_key: sessionKey
            });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create access log' });
    }
};
