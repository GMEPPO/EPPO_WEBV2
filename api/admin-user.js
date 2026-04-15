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

    if (req.method === 'GET') {
        try {
            const { data: accessLogs, error: accessLogsError } = await adminClient
                .from('user_access_logs')
                .select('id, accessed_at, source_path, page_title, referrer, user_agent, session_key')
                .eq('user_id', userId)
                .order('accessed_at', { ascending: false })
                .limit(100);

            if (accessLogsError) {
                return res.status(500).json({ error: accessLogsError.message });
            }

            return res.status(200).json({
                user_id: userId,
                activity: Array.isArray(accessLogs) ? accessLogs : []
            });
        } catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to load user activity' });
        }
    }

    if (req.method === 'PATCH') {
        try {
            const body = jsonBody(req);
            const hasRole = Object.prototype.hasOwnProperty.call(body, 'role');
            const hasDisabled = Object.prototype.hasOwnProperty.call(body, 'disabled');
            const hasMirrorUserId = Object.prototype.hasOwnProperty.call(body, 'mirror_user_id');
            const hasMirrorEnabled = Object.prototype.hasOwnProperty.call(body, 'mirror_enabled');
            const role = hasRole ? ensureAllowedRole(body.role) : null;
            const requestedMirrorUserId = hasMirrorUserId
                ? ((body.mirror_user_id || '').toString().trim() || null)
                : undefined;
            const requestedMirrorEnabled = hasMirrorEnabled ? !!body.mirror_enabled : undefined;

            if (!hasRole && !hasDisabled && !hasMirrorUserId && !hasMirrorEnabled) {
                return res.status(400).json({ error: 'Nothing to update' });
            }

            const { data: existingRoleRow, error: existingRoleError } = await adminClient
                .from('user_roles')
                .select('role, mirror_user_id, mirror_enabled')
                .eq('user_id', userId)
                .maybeSingle();

            if (existingRoleError) {
                return res.status(500).json({ error: existingRoleError.message });
            }

            const currentRole = existingRoleRow?.role || 'comercial';
            const finalRole = hasRole ? role : currentRole;

            let finalMirrorUserId = hasMirrorUserId
                ? requestedMirrorUserId
                : (existingRoleRow?.mirror_user_id || null);
            let finalMirrorEnabled = hasMirrorEnabled
                ? requestedMirrorEnabled
                : !!existingRoleRow?.mirror_enabled;

            if (hasRole) {
                if (!role) {
                    return res.status(400).json({ error: 'Valid role is required' });
                }
            }

            if (finalRole !== 'comercial') {
                finalMirrorUserId = null;
                finalMirrorEnabled = false;
            } else {
                if (finalMirrorUserId && String(finalMirrorUserId) === String(userId)) {
                    return res.status(400).json({ error: 'Un comercial no puede ser su propio espejo' });
                }

                // Si no hay espejo asignado, desactivar el flag automáticamente.
                // Esto evita errores al cambiar solo el rol cuando existen datos legacy inconsistentes.
                if (!finalMirrorUserId) {
                    finalMirrorEnabled = false;
                }

                if (hasMirrorEnabled && requestedMirrorEnabled && !finalMirrorUserId) {
                    return res.status(400).json({ error: 'No se puede activar el espejo sin asignar un comercial espejo' });
                }

                if (finalMirrorUserId) {
                    const { data: mirrorRoleRow, error: mirrorRoleError } = await adminClient
                        .from('user_roles')
                        .select('role, "Name"')
                        .eq('user_id', finalMirrorUserId)
                        .maybeSingle();

                    if (mirrorRoleError) {
                        return res.status(500).json({ error: mirrorRoleError.message });
                    }

                    if (!mirrorRoleRow || mirrorRoleRow.role !== 'comercial') {
                        return res.status(400).json({ error: 'El espejo asignado debe ser un usuario con rol comercial' });
                    }
                }
            }

            if (hasRole || hasMirrorUserId || hasMirrorEnabled) {
                const { error } = await adminClient
                    .from('user_roles')
                    .upsert(
                        {
                            user_id: userId,
                            role: finalRole,
                            mirror_user_id: finalMirrorUserId,
                            mirror_enabled: finalMirrorEnabled,
                            updated_at: new Date().toISOString()
                        },
                        { onConflict: 'user_id' }
                    );

                if (error) {
                    const mappedError = mapUserRolesConstraintError(error, 'Failed to update user');
                    if (mappedError) {
                        return res.status(400).json({ error: mappedError });
                    }
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
                role: finalRole,
                disabled: hasDisabled ? disabled : undefined,
                mirror_user_id: finalMirrorUserId,
                mirror_enabled: finalMirrorEnabled
            });
        } catch (error) {
            const mappedError = mapUserRolesConstraintError(error, 'Failed to update user');
            if (mappedError) {
                return res.status(400).json({ error: mappedError });
            }
            return res.status(500).json({ error: error.message || 'Failed to update user' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

function mapUserRolesConstraintError(error, fallbackMessage) {
    const message = error?.message || fallbackMessage || 'Failed to update user';
    const normalized = message.toLowerCase();

    if (
        error?.code === '23514' ||
        normalized.includes('user_roles_role_check') ||
        (normalized.includes('check constraint') && normalized.includes('role'))
    ) {
        return 'La base de datos aún no permite el rol "director comercial". Ejecuta el script docs-y-scripts/supabase-user-roles-add-director-comercial.sql en Supabase.';
    }

    return null;
}
