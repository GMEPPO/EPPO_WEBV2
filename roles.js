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

            // PGRST116 = no rows returned (usuario sin rol asignado)
            if (error && error.code === 'PGRST116') {
                // Si no hay rol asignado, asignar 'comercial' por defecto
                // Pero NO crear el registro automáticamente (debe hacerlo un admin)
                console.warn(`Usuario ${user.email} no tiene rol asignado. Asignando 'comercial' por defecto.`);
                this.currentUserRole = 'comercial';
                return 'comercial';
            }

            if (error) {
                console.error('Error al cargar rol del usuario:', error);
                this.currentUserRole = 'comercial'; // Rol por defecto en caso de error
                return 'comercial';
            }

            // Validar que el rol existe (solo 'admin' o 'comercial')
            const role = data?.role;
            if (role && !this.roles[role]) {
                console.warn(`Rol "${role}" no existe. Asignando 'comercial' por defecto.`);
                this.currentUserRole = 'comercial';
                return 'comercial';
            }

            this.currentUserRole = role || 'comercial';
            return this.currentUserRole;
        } catch (error) {
            console.error('Error al cargar rol del usuario:', error);
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


