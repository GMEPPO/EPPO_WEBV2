/**
 * Sistema de Roles y Permisos
 * Gestiona roles de usuarios y control de acceso basado en roles
 */

class RolesManager {
    constructor() {
        this.supabase = null;
        this.currentUserRole = null;
        this.isInitialized = false;
        
        // Definir roles y permisos
        this.roles = {
            'admin': {
                name: 'Administrador',
                permissions: ['*'] // Todos los permisos
            },
            'comercial': {
                name: 'Comercial',
                permissions: [
                    'view-products',
                    'create-proposals',
                    'edit-proposals',
                    'view-proposals',
                    'view-stock'
                ]
            }
        };

        // Mapeo de páginas a permisos requeridos
        this.pagePermissions = {
            'index.html': ['view-products'],
            'productos-dinamico.html': ['view-products'],
            'producto-detalle.html': ['view-products'],
            'carrito-compras.html': ['create-proposals', 'edit-proposals'],
            'consultar-propuestas.html': ['view-proposals'],
            'admin-productos.html': ['*'], // Solo admin
            'selector-productos.html': ['*'], // Solo admin (Creador/Editor)
            'gestion-usuarios.html': ['*'], // Solo admin
            'gestion-logos-propuesta.html': ['edit-proposals'],
            'comparar-productos.html': ['*'] // Solo admin
        };
    }

    /**
     * Inicializar el sistema de roles
     */
    async initialize() {
        if (this.isInitialized) {
            return this.supabase;
        }

        try {
            // Si estamos usando file://, no podemos obtener roles
            if (window.location.protocol === 'file:') {
                console.warn('⚠️ rolesManager: file:// detectado - asignando rol por defecto "comercial"');
                this.currentUserRole = 'comercial';
                this.isInitialized = true;
                return null;
            }

            // Obtener cliente Supabase - usar siempre el cliente compartido
            if (window.universalSupabase) {
                this.supabase = await window.universalSupabase.getClient();
            } else {
                // Si no hay Supabase y estamos en file://, usar rol por defecto
                if (window.location.protocol === 'file:') {
                    this.currentUserRole = 'comercial';
                    this.isInitialized = true;
                    return null;
                }
                throw new Error('Supabase no está disponible. Asegúrate de que supabase-config-universal.js se cargue antes.');
            }

            // Si no hay cliente (file://), usar rol por defecto
            if (!this.supabase) {
                this.currentUserRole = 'comercial';
                this.isInitialized = true;
                return null;
            }

            // Cargar rol del usuario actual
            await this.loadCurrentUserRole();

            this.isInitialized = true;
            return this.supabase;
        } catch (error) {
            // Si es error de CORS y estamos en file://, usar rol por defecto
            if (window.location.protocol === 'file:' && error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
                console.warn('⚠️ rolesManager: Error de CORS esperado con file:// - usando rol por defecto');
                this.currentUserRole = 'comercial';
                this.isInitialized = true;
                return null;
            }
            // En otros casos, asignar rol por defecto pero marcar como inicializado
            console.warn('⚠️ Error inicializando rolesManager, usando rol por defecto:', error);
            this.currentUserRole = 'comercial';
            this.isInitialized = true;
            return null;
        }
    }

    /**
     * Obtener cliente Supabase
     */
    async getClient() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.supabase;
    }

    /**
     * Cargar rol del usuario actual
     */
    async loadCurrentUserRole() {
        try {
            console.log('🔍 [loadCurrentUserRole] Iniciando carga de rol...');
            
            // Si estamos usando file://, usar rol por defecto
            if (window.location.protocol === 'file:') {
                console.warn('⚠️ [loadCurrentUserRole] file:// protocol - usando rol por defecto');
                this.currentUserRole = 'comercial';
                return 'comercial';
            }

            const user = await window.authManager?.getCurrentUser();
            if (!user) {
                console.warn('⚠️ [loadCurrentUserRole] No hay usuario autenticado');
                this.currentUserRole = 'comercial';
                return 'comercial';
            }

            console.log('🔍 [loadCurrentUserRole] Usuario encontrado:', {
                id: user.id,
                email: user.email
            });

            const client = await this.getClient();
            if (!client) {
                console.error('❌ [loadCurrentUserRole] No hay cliente de Supabase');
                this.currentUserRole = 'comercial';
                return 'comercial';
            }

            console.log('🔍 [loadCurrentUserRole] Consultando tabla user_roles para user_id:', user.id);
            
            const { data, error } = await client
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            console.log('🔍 [loadCurrentUserRole] Respuesta de Supabase:', {
                data: data,
                error: error,
                errorCode: error?.code,
                errorMessage: error?.message
            });

            // PGRST116 = no rows returned (usuario sin rol asignado)
            if (error && error.code === 'PGRST116') {
                console.warn(`⚠️ [loadCurrentUserRole] Usuario ${user.email} (${user.id}) no tiene rol asignado en user_roles. Asignando 'comercial' por defecto.`);
                console.warn('💡 [loadCurrentUserRole] Para asignar un rol, un admin debe crear un registro en la tabla user_roles:');
                console.warn(`   INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'admin');`);
                this.currentUserRole = 'comercial';
                return 'comercial';
            }

            if (error) {
                // Si es error de CORS, es porque estamos en file://
                if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
                    console.warn('⚠️ [loadCurrentUserRole] Error de red al cargar rol:', error.message);
                } else {
                    console.error('❌ [loadCurrentUserRole] Error al cargar rol del usuario:', error);
                }
                this.currentUserRole = 'comercial'; // Rol por defecto en caso de error
                return 'comercial';
            }

            // Validar que el rol existe
            const role = data?.role;
            console.log('🔍 [loadCurrentUserRole] Rol encontrado en BD:', role);
            
            // Aceptar 'admin', 'comercial', 'editor', 'viewer' (aunque solo usamos admin y comercial)
            if (role && (role === 'admin' || role === 'comercial' || role === 'editor' || role === 'viewer')) {
                // Si es 'editor' o 'viewer', mapear a 'comercial' (roles deprecados)
                if (role === 'editor' || role === 'viewer') {
                    console.warn(`⚠️ [loadCurrentUserRole] Rol "${role}" está deprecado. Mapeando a 'comercial'.`);
                    this.currentUserRole = 'comercial';
                    return 'comercial';
                }
                this.currentUserRole = role;
                console.log('✅ [loadCurrentUserRole] Rol asignado:', role);
                return role;
            }

            if (role) {
                console.warn(`⚠️ [loadCurrentUserRole] Rol "${role}" no es válido. Asignando 'comercial' por defecto.`);
            }
            
            this.currentUserRole = 'comercial';
            return 'comercial';
        } catch (error) {
            console.error('❌ [loadCurrentUserRole] Error en catch:', error);
            // Si es error de CORS, es porque estamos en file://
            if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
                console.warn('⚠️ [loadCurrentUserRole] Error de red - usando rol por defecto');
            }
            this.currentUserRole = 'comercial'; // Rol por defecto
            return 'comercial';
        }
    }

    /**
     * Obtener rol del usuario actual
     */
    async getCurrentUserRole() {
        if (!this.currentUserRole) {
            await this.loadCurrentUserRole();
        }
        return this.currentUserRole;
    }

    /**
     * Verificar si el usuario tiene un permiso específico
     */
    async hasPermission(permission) {
        const role = await this.getCurrentUserRole();
        if (!role) return false;

        const roleData = this.roles[role];
        if (!roleData) return false;

        // Si tiene permiso '*', tiene todos los permisos
        if (roleData.permissions.includes('*')) {
            return true;
        }

        return roleData.permissions.includes(permission);
    }

    /**
     * Verificar si el usuario tiene acceso a una página
     */
    async hasPageAccess(pagePath) {
        const pageName = pagePath.split('/').pop() || pagePath;
        const requiredPermissions = this.pagePermissions[pageName];

        if (!requiredPermissions) {
            // Si la página no está en el mapeo, permitir acceso por defecto
            return true;
        }

        // Si requiere permiso '*', solo admin puede acceder
        if (requiredPermissions.includes('*')) {
            const role = await this.getCurrentUserRole();
            return role === 'admin';
        }

        // Verificar si tiene alguno de los permisos requeridos
        for (const permission of requiredPermissions) {
            if (await this.hasPermission(permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Requerir acceso a una página (redirige si no tiene acceso)
     */
    async requireAccess(pagePath, redirectTo = 'index.html') {
        const hasAccess = await this.hasPageAccess(pagePath);
        if (!hasAccess) {
            const role = await this.getCurrentUserRole();
            const roleName = this.roles[role]?.name || role;
            alert(`No tienes permiso para acceder a esta página.\n\nTu rol actual: ${roleName}`);
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    async hasRole(role) {
        const currentRole = await this.getCurrentUserRole();
        return currentRole === role;
    }

    /**
     * Verificar si el usuario es administrador
     */
    async isAdmin() {
        return await this.hasRole('admin');
    }

    /**
     * Obtener todos los usuarios con sus roles
     */
    async getAllUsersWithRoles() {
        try {
            const client = await this.getClient();
            
            // Obtener todos los usuarios de auth.users (requiere función RPC o vista)
            // Como no podemos acceder directamente a auth.users desde el cliente,
            // necesitamos crear una función RPC en Supabase o usar una vista
            
            // Por ahora, obtenemos solo los usuarios que tienen roles asignados
            const { data: userRoles, error } = await client
                .from('user_roles')
                .select(`
                    id,
                    user_id,
                    role,
                    created_at,
                    updated_at
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                users: userRoles || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                users: []
            };
        }
    }

    /**
     * Asignar rol a un usuario
     */
    async assignRole(userId, role) {
        try {
            // Verificar que el rol existe
            if (!this.roles[role]) {
                throw new Error(`Rol "${role}" no existe. Roles válidos: ${Object.keys(this.roles).join(', ')}`);
            }

            // Verificar permisos: solo admin puede asignar roles
            const currentRole = await this.getCurrentUserRole();
            if (currentRole !== 'admin') {
                throw new Error('Solo los administradores pueden asignar roles');
            }

            const client = await this.getClient();
            
            // Verificar si el usuario ya tiene un rol asignado
            const { data: existing, error: checkError } = await client
                .from('user_roles')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle(); // maybeSingle() no lanza error si no hay resultados

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existing) {
                // Actualizar rol existente
                const { error } = await client
                    .from('user_roles')
                    .update({ 
                        role: role, 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('user_id', userId);

                if (error) throw error;
            } else {
                // Crear nuevo registro de rol
                const { error } = await client
                    .from('user_roles')
                    .insert({
                        user_id: userId,
                        role: role
                        // created_at y updated_at se asignan automáticamente por la base de datos
                    });

                if (error) throw error;
            }

            // Si es el usuario actual, actualizar el rol en memoria
            const currentUser = await window.authManager?.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.currentUserRole = role;
            }

            return {
                success: true,
                message: `Rol "${this.roles[role].name}" asignado correctamente`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener rol de un usuario
     */
    async getUserRole(userId) {
        try {
            const client = await this.getClient();
            const { data, error } = await client
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            const role = data?.role;
            // Validar que el rol existe
            if (role && !this.roles[role]) {
                return 'comercial';
            }
            return role || 'comercial';
        } catch (error) {
            return 'comercial';
        }
    }

    /**
     * Obtener todos los roles disponibles
     */
    getAvailableRoles() {
        return Object.keys(this.roles).map(key => ({
            value: key,
            label: this.roles[key].name
        }));
    }

    /**
     * Obtener información de un rol
     */
    getRoleInfo(role) {
        return this.roles[role] || null;
    }
}

// Crear instancia global
if (typeof window.rolesManager === 'undefined') {
    window.rolesManager = new RolesManager();
    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.rolesManager.initialize();
        });
    } else {
        window.rolesManager.initialize();
    }
}


