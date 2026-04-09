const {
    ensureAllowedRole,
    jsonBody,
    requireAdmin,
    setCors
} = require('./_admin-users-helper');

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
    const userId = (req.query?.id || '').toString().trim();

    if (!userId) {
        return res.status(400).json({ error: 'User id is required' });
    }

    if (req.method === 'PATCH') {
        try {
            const body = jsonBody(req);
            const hasRole = Object.prototype.hasOwnProperty.call(body, 'role');
            const hasDisabled = Object.prototype.hasOwnProperty.call(body, 'disabled');
            const role = hasRole ? ensureAllowedRole(body.role) : null;

            if (!hasRole && !hasDisabled) {
                return res.status(400).json({ error: 'Nothing to update' });
            }

            if (hasRole) {
                if (!role) {
                    return res.status(400).json({ error: 'Valid role is required' });
                }

                const { error } = await adminClient
                    .from('user_roles')
                    .upsert(
                        {
                            user_id: userId,
                            role,
                            updated_at: new Date().toISOString()
                        },
                        { onConflict: 'user_id' }
                    );

                if (error) {
                    return res.status(500).json({ error: error.message });
                }
            }

            let disabled = null;
            if (hasDisabled) {
                disabled = !!body.disabled;
                if (disabled && String(auth.requester?.id || '') === String(userId)) {
                    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
                }

                const { data: updatedUser, error: updateAuthError } = await adminClient.auth.admin.updateUserById(userId, {
                    ban_duration: disabled ? '876000h' : 'none'
                });

                if (updateAuthError) {
                    return res.status(500).json({ error: updateAuthError.message });
                }

                const bannedUntil = updatedUser?.user?.banned_until || null;
                disabled = !!(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
            }

            return res.status(200).json({
                success: true,
                role: hasRole ? role : undefined,
                disabled: hasDisabled ? disabled : undefined
            });
        } catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to update user' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
