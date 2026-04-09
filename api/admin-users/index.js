const {
    ensureAllowedRole,
    jsonBody,
    normalizeRole,
    requireAdmin,
    setCors
} = require('../_admin-users-helper');
module.exports = async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const auth = await requireAdmin(req);
    if (!auth.ok) {
        return res.status(auth.status).json(auth.body);
    }

    const { adminClient } = auth;

    if (req.method === 'GET') {
        try {
            const { data, error } = await adminClient.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            });
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            const users = Array.isArray(data?.users) ? data.users : [];
            const userIds = users.map(user => user.id).filter(Boolean);

            let roles = [];
            if (userIds.length > 0) {
                const { data: rolesData, error: rolesError } = await adminClient
                    .from('user_roles')
                    .select('user_id, role, "Pais", "Name"')
                    .in('user_id', userIds);
                if (rolesError) {
                    return res.status(500).json({ error: rolesError.message });
                }
                roles = rolesData || [];
            }

            const rolesMap = new Map(roles.map(item => [String(item.user_id), item]));
            const payload = users.map(user => {
                const roleRow = rolesMap.get(String(user.id)) || null;
                const bannedUntil = user.banned_until || null;
                const isDisabled = !!(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
                return {
                    id: user.id,
                    email: user.email || '',
                    created_at: user.created_at || null,
                    last_sign_in_at: user.last_sign_in_at || null,
                    banned_until: bannedUntil,
                    disabled: isDisabled,
                    role: normalizeRole(roleRow?.role) || 'comercial',
                    pais: roleRow?.Pais || null,
                    name: roleRow?.Name || null
                };
            });

            return res.status(200).json({ users: payload });
        } catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list users' });
        }
    }

    if (req.method === 'POST') {
        try {
            const body = jsonBody(req);
            const email = (body.email || '').toString().trim().toLowerCase();
            const password = (body.password || '').toString();
            const role = ensureAllowedRole(body.role);

            if (!email || !password || !role) {
                return res.status(400).json({ error: 'email, password and valid role are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            const { data: created, error: createError } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (createError || !created?.user?.id) {
                return res.status(400).json({ error: createError?.message || 'Unable to create user' });
            }

            const userId = created.user.id;
            const { error: upsertError } = await adminClient
                .from('user_roles')
                .upsert(
                    {
                        user_id: userId,
                        role,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'user_id' }
                );

            if (upsertError) {
                await adminClient.auth.admin.deleteUser(userId).catch(() => {});
                return res.status(500).json({ error: upsertError.message });
            }

            return res.status(201).json({
                user: {
                    id: userId,
                    email: created.user.email || email,
                    created_at: created.user.created_at || null,
                    last_sign_in_at: created.user.last_sign_in_at || null,
                    banned_until: created.user.banned_until || null,
                    disabled: false,
                    role
                }
            });
        } catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to create user' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
