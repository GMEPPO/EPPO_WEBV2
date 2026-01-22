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
            'editor': {
                name: 'Editor',
                permissions: [
                    'view-products',
                    'edit-products',
                    'view-proposals',
                    'create-proposals',
                    'edit-proposals',
                    'view-stock'
                ]
            },
            'viewer': {
                name: 'Visualizador',
                permissions: [
                    'view-products',
                    'view-proposals',
                    'view-stock'
                ]
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
            'admin-productos.html': ['edit-products'],
            'selector-productos.html': ['view-stock'],
            'gestion-usuarios.html': ['*'], // Solo admin
            'gestion-logos-propuesta.html': ['edit-proposals'],
            'comparar-productos.html': ['view-products']
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
            // Obtener cliente Supabase - usar siempre el cliente compartido
            if (window.universalSupabase) {
                this.supabase = await window.universalSupabase.getClient();
            } else {
                throw new Error('Supabase no está disponible. Asegúrate de que supabase-config-universal.js se cargue antes.');
            }

            // Cargar rol del usuario actual
            await this.loadCurrentUserRole();

            this.isInitialized = true;
            return this.supabase;
        } catch (error) {
            throw error;
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
            const user = await window.authManager?.getCurrentUser();
            if (!user) {
                this.currentUserRole = null;
                return null;
            }

            const client = await this.getClient();
            const { data, error } = await client
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                // Si no hay rol asignado, asignar 'viewer' por defecto
                this.currentUserRole = 'viewer';
                return 'viewer';
            }

            this.currentUserRole = data?.role || 'viewer';
            return this.currentUserRole;
        } catch (error) {
            this.currentUserRole = 'viewer'; // Rol por defecto
            return 'viewer';
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
            alert('No tienes permiso para acceder a esta página.');
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    /**
     * Asignar rol a un usuario
     */
    async assignRole(userId, role) {
        try {
            // Verificar que el rol existe
            if (!this.roles[role]) {
                throw new Error(`Rol "${role}" no existe`);
            }

            const client = await this.getClient();
            
            // Verificar si el usuario ya tiene un rol asignado
            const { data: existing } = await client
                .from('user_roles')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (existing) {
                // Actualizar rol existente
                const { error } = await client
                    .from('user_roles')
                    .update({ role: role, updated_at: new Date().toISOString() })
                    .eq('user_id', userId);

                if (error) throw error;
            } else {
                // Crear nuevo registro de rol
                const { error } = await client
                    .from('user_roles')
                    .insert({
                        user_id: userId,
                        role: role,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            }

            // Si es el usuario actual, actualizar el rol en memoria
            const currentUser = await window.authManager?.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.currentUserRole = role;
            }

            return {
                success: true
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

            return data?.role || 'viewer';
        } catch (error) {
            return 'viewer';
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


