const { createClient } = require('@supabase/supabase-js');

const ALLOWED_ROLES = new Set(['admin', 'comercial', 'compras']);

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function getEnv() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    return { supabaseUrl, serviceRoleKey };
}

function getAdminClient() {
    const { supabaseUrl, serviceRoleKey } = getEnv();
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

function getBearerToken(req) {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    return match ? match[1] : null;
}

async function requireAuthenticated(req) {
    const token = getBearerToken(req);
    if (!token) {
        return { ok: false, status: 401, body: { error: 'Missing bearer token' } };
    }

    const adminClient = getAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData?.user) {
        return { ok: false, status: 401, body: { error: 'Invalid token' } };
    }

    return { ok: true, adminClient, requester: authData.user };
}

async function requireAdmin(req) {
    const auth = await requireAuthenticated(req);
    if (!auth.ok) {
        return auth;
    }

    const { adminClient } = auth;
    const userId = auth.requester.id;
    const { data: roleData, error: roleError } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

    if (roleError) {
        return { ok: false, status: 500, body: { error: roleError.message } };
    }

    const role = (roleData?.role || '').toString().toLowerCase();
    if (role !== 'admin') {
        return { ok: false, status: 403, body: { error: 'Admin access required' } };
    }

    return auth;
}

function normalizeRole(role) {
    const normalized = (role || '').toString().trim().toLowerCase();
    if (normalized === 'viewer' || normalized === 'editor') return normalized;
    return ALLOWED_ROLES.has(normalized) ? normalized : null;
}

function ensureAllowedRole(role) {
    const normalized = (role || '').toString().trim().toLowerCase();
    return ALLOWED_ROLES.has(normalized) ? normalized : null;
}

function jsonBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        return JSON.parse(req.body);
    }
    return req.body;
}

module.exports = {
    ALLOWED_ROLES,
    ensureAllowedRole,
    getAdminClient,
    jsonBody,
    normalizeRole,
    requireAuthenticated,
    requireAdmin,
    setCors
};
