/**
 * Sistema de Roles y Permisos
 * Gestiona roles de usuarios y control de acceso basado en roles
 */

class RolesManager {
    constructor() {
        this.supabase = null;
        this.currentUserRole = null;
        this.isInitialized = false;
        this.isLoadingRole = false; // Bandera para evitar consultas simultáneas
        this.roleLoadPromise = null; // Promise para cachear la consulta en curso
        this.isLoadingRole = false; // Bandera para evitar consultas simultáneas
        this.roleLoadPromise = null; // Promise para cachear la consulta en curso
        
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
     * Cargar rol del usuario actual (con caché para evitar consultas repetitivas)
     */
    async loadCurrentUserRole() {
        // Si ya hay una consulta en curso, esperar a que termine
        if (this.roleLoadPromise) {
            return await this.roleLoadPromise;
        }
        
        // Si ya tenemos el rol cargado, retornarlo inmediatamente
        if (this.currentUserRole) {
            return this.currentUserRole;
        }
        
        // Si ya estamos cargando, esperar
        if (this.isLoadingRole) {
            // Esperar a que termine la carga actual
            while (this.isLoadingRole) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.currentUserRole || 'comercial';
        }
        
        // Marcar que estamos cargando
        this.isLoadingRole = true;
        
        // Crear promise para cachear la consulta
        this.roleLoadPromise = (async () => {
            try {
                // Si estamos usando file://, usar rol por defecto
                if (window.location.protocol === 'file:') {
                    this.currentUserRole = 'comercial';
                    return 'comercial';
                }

                const user = await window.authManager?.getCurrentUser();
                if (!user) {
                    this.currentUserRole = 'comercial';
                    return 'comercial';
                }

                const client = await this.getClient();
                if (!client) {
                    this.currentUserRole = 'comercial';
                    return 'comercial';
                }

                // Consultar solo una vez
                const { data, error } = await client
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();

                // PGRST116 = no rows returned (usuario sin rol asignado)
                if (error && error.code === 'PGRST116') {
                    this.currentUserRole = 'comercial';
                    return 'comercial';
                }

                if (error) {
                    // Si es error de CORS, usar rol por defecto
                    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
                        // Error de red esperado
                    }
                    this.currentUserRole = 'comercial';
                    return 'comercial';
                }

                // Validar que el rol existe
                const role = data?.role;
                
                // Aceptar 'admin', 'comercial', 'editor', 'viewer'
                if (role && (role === 'admin' || role === 'comercial' || role === 'editor' || role === 'viewer')) {
                    // Si es 'editor' o 'viewer', mapear a 'comercial'
                    if (role === 'editor' || role === 'viewer') {
                        this.currentUserRole = 'comercial';
                        return 'comercial';
                    }
                    this.currentUserRole = role;
                    return role;
                }
                
                this.currentUserRole = 'comercial';
                return 'comercial';
            } catch (error) {
                // Si es error de CORS, usar rol por defecto
                if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
                    // Error de red esperado
                }
                this.currentUserRole = 'comercial';
                return 'comercial';
            } finally {
                // Limpiar flags
                this.isLoadingRole = false;
                this.roleLoadPromise = null;
            }
        })();
        
        return await this.roleLoadPromise;
    }

    /**
     * Obtener rol del usuario actual (usa caché, no hace consultas repetitivas)
     */
    async getCurrentUserRole() {
        console.log('🔍 [roles.js] getCurrentUserRole() llamado');
        console.log('🔍 [roles.js] Estado actual:', {
            currentUserRole: this.currentUserRole,
            isLoadingRole: this.isLoadingRole,
            hasRoleLoadPromise: !!this.roleLoadPromise,
            isInitialized: this.isInitialized
        });
        
        // Si ya tenemos el rol, retornarlo inmediatamente
        if (this.currentUserRole) {
            console.log('✅ [roles.js] Rol ya en caché, retornando:', this.currentUserRole);
            return this.currentUserRole;
        }
        
        // Si hay una consulta en curso, esperar a que termine
        if (this.roleLoadPromise) {
            console.log('⏳ [roles.js] Hay una consulta en curso, esperando...');
            try {
                const role = await this.roleLoadPromise;
                console.log('✅ [roles.js] Consulta completada, rol obtenido:', role);
                // Asegurar que el rol se guardó en currentUserRole
                if (role && !this.currentUserRole) {
                    this.currentUserRole = role;
                }
                return role || this.currentUserRole || 'comercial';
            } catch (error) {
                console.error('❌ [roles.js] Error esperando roleLoadPromise:', error);
                // Si hay error, intentar cargar de nuevo
            }
        }
        
        // Si no hay rol y no hay consulta en curso, cargar
        if (!this.isLoadingRole) {
            console.log('🔄 [roles.js] No hay rol ni consulta en curso, cargando...');
            await this.loadCurrentUserRole();
            console.log('✅ [roles.js] Rol cargado:', this.currentUserRole);
        } else {
            console.log('⏳ [roles.js] Ya se está cargando el rol, esperando...');
            // Esperar a que termine (con timeout para evitar esperas infinitas)
            let waitCount = 0;
            const maxWait = 50; // 5 segundos máximo (100ms * 50)
            while (this.isLoadingRole && waitCount < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            if (this.isLoadingRole) {
                console.warn('⚠️ [roles.js] Timeout esperando carga de rol, usando valor por defecto');
            } else {
                console.log('✅ [roles.js] Carga completada, rol:', this.currentUserRole);
            }
        }
        
        const finalRole = this.currentUserRole || 'comercial';
        console.log('✅ [roles.js] Retornando rol final:', finalRole);
        return finalRole;
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
     * DESACTIVADO: Sistema de roles eliminado - todos tienen acceso completo
     */
    async requireAccess(pagePath, redirectTo = 'index.html') {
        // Sistema de roles desactivado - siempre permitir acceso
        console.log('ℹ️ Sistema de roles desactivado - acceso permitido a:', pagePath);
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


