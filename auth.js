/**
 * Sistema de Autenticación con Supabase Auth
 * Maneja login, registro, sesiones y verificación de autenticación.
 * Nombre y rol se obtienen de la tabla user_roles por user_id (auth.users.id).
 */

class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.authStateChangeListenerAdded = false; // Evitar múltiples listeners
        this.processingSignIn = false; // Evitar procesar SIGNED_IN múltiples veces
    }

    /**
     * Inicializar el sistema de autenticación
     */
    async initialize() {
        if (this.isInitialized) {
            return this.supabase;
        }

        try {
            // Si estamos usando file://, mostrar advertencia pero intentar continuar
            if (window.location.protocol === 'file:') {
                console.warn('⚠️ ADVERTENCIA: Estás usando file:// protocol');
                console.warn('⚠️ Supabase NO puede funcionar correctamente con file://');
                console.warn('💡 SOLUCIÓN: Usa un servidor HTTP local');
                console.warn('   Ejecuta: python -m http.server 8000');
                console.warn('   Luego abre: http://localhost:8000');
            }

            // Obtener cliente Supabase - usar siempre el cliente compartido
            if (window.universalSupabase) {
                this.supabase = await window.universalSupabase.getClient();
            } else {
                // Esperar un momento para que universalSupabase se inicialice
                await new Promise(resolve => setTimeout(resolve, 200));
                if (window.universalSupabase) {
                    this.supabase = await window.universalSupabase.getClient();
                } else {
                    // Si estamos en file://, no lanzar error fatal
                    if (window.location.protocol === 'file:') {
                        console.warn('⚠️ Supabase no disponible en file:// - la autenticación no funcionará');
                        this.isInitialized = true; // Marcar como inicializado para evitar reintentos
                        return null;
                    }
                    throw new Error('Supabase no está disponible. Asegúrate de que supabase-config-universal.js se cargue antes.');
                }
            }

            // Si no hay cliente (file://), salir temprano
            if (!this.supabase) {
                this.isInitialized = true;
                return null;
            }

            // Verificar sesión actual (solo si no estamos en file://)
            if (window.location.protocol !== 'file:') {
                try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
            }
                } catch (error) {
                    // Si falla por CORS, es porque estamos en file://
                    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
                        console.warn('⚠️ Error de CORS - Supabase no puede funcionar con file://');
                    } else {
                        console.error('Error obteniendo sesión:', error);
                    }
                }

                // Escuchar cambios de autenticación (solo una vez)
                if (!this.authStateChangeListenerAdded) {
                    try {
                        this.supabase.auth.onAuthStateChange(async (event, session) => {
                            if (event === 'SIGNED_IN' && session) {
                                // Evitar procesar múltiples veces el mismo SIGNED_IN
                                if (this.processingSignIn) {
                                    console.log('⏭️ [auth.js] SIGNED_IN ya se está procesando, saltando...');
                                    return;
                                }
                                
                                this.processingSignIn = true;
                    this.currentUser = session?.user || null;
                                if (this.currentUser) this.syncIdentityFromUserRoles().catch(() => {});
                                console.log('✅ [auth.js] Usuario autenticado:', this.currentUser?.email);
                                
                                // El rol se consultará directamente desde Supabase cuando sea necesario
                                // (en toggleMenu() cuando el usuario intente abrir el menú)
                                // No necesitamos cargar el rol aquí
                                console.log('✅ [auth.js] Usuario autenticado, el rol se consultará cuando sea necesario');
                                this.processingSignIn = false;
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                            try { localStorage.removeItem('commercial_name'); } catch (e) {}
                            if (typeof window.clearRoleCache === 'function') {
                                window.clearRoleCache();
                            }
                }
            });
                    this.authStateChangeListenerAdded = true;
                    console.log('✅ [auth.js] Listener de autenticación configurado (solo una vez)');
                } catch (error) {
                    console.warn('⚠️ [auth.js] No se pudo configurar listener de autenticación:', error);
                }
            }
            } // Cerrar el if (window.location.protocol !== 'file:')

            this.isInitialized = true;
            return this.supabase;
        } catch (error) {
            // Si es error de CORS y estamos en file://, no es crítico
            if (window.location.protocol === 'file:' && error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
                console.warn('⚠️ Error de CORS esperado con file:// - la autenticación no funcionará');
                this.isInitialized = true;
                return null;
            }
            throw error;
        }
    }

    /**
     * Sincronizar nombre (y rol en caché) desde la tabla user_roles por user_id de Auth.
     */
    async syncIdentityFromUserRoles() {
        if (!this.supabase || !this.currentUser) return;
        try {
            const { data, error } = await this.supabase
                .from('user_roles')
                .select('"Name", role')
                .eq('user_id', this.currentUser.id)
                .single();

            if (!error && data) {
                const name = data.Name || this.currentUser.email || this.currentUser.id;
                if (name) localStorage.setItem('commercial_name', String(name));
                if (data.role && typeof window.setCachedRole === 'function') {
                    const role = (data.role === 'editor' || data.role === 'viewer') ? 'comercial' : data.role;
                    window.setCachedRole(role);
                }
            } else {
                const fallback = this.currentUser.email || this.currentUser.id;
                if (fallback) localStorage.setItem('commercial_name', String(fallback));
            }
        } catch (e) {}
    }

    /**
     * Obtener cliente Supabase
     */
    async getClient() {
        if (!this.isInitialized) {
            console.log('🔍 [getClient] Inicializando porque no está inicializado...');
            await this.initialize();
        }
        
        if (!this.supabase) {
            console.error('❌ [getClient] Supabase no está disponible después de inicializar');
            // Intentar obtener directamente desde universalSupabase
            if (window.universalSupabase) {
                console.log('🔍 [getClient] Intentando obtener desde universalSupabase directamente...');
                try {
                    this.supabase = await window.universalSupabase.getClient();
                    if (this.supabase) {
                        console.log('✅ [getClient] Cliente obtenido desde universalSupabase');
                    }
                } catch (error) {
                    console.error('❌ [getClient] Error obteniendo cliente:', error);
                }
            }
        }
        
        return this.supabase;
    }

    /**
     * Iniciar sesión con email y contraseña
     */
    async login(email, password) {
        try {
            const client = await this.getClient();
            const { data, error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            await this.syncIdentityFromUserRoles();

            return {
                success: true,
                user: data.user,
                session: data.session
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async signUp(email, password, metadata = {}) {
        try {
            const client = await this.getClient();
            const { data, error } = await client.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: metadata
                }
            });

            if (error) throw error;

            return {
                success: true,
                user: data.user,
                session: data.session
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            const client = await this.getClient();
            const { error } = await client.auth.signOut();

            if (error) throw error;

            this.currentUser = null;
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
     * Obtener usuario actual
     */
    async getCurrentUser() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const client = await this.getClient();
            const { data: { user } } = await client.auth.getUser();
            this.currentUser = user;
            return user;
        } catch (error) {
            return null;
        }
    }

    /**
     * Verificar si el usuario está autenticado.
     * Usa getUser() para validar el JWT con Supabase (no solo localStorage),
     * así solo usuarios realmente registrados en Auth pueden acceder.
     */
    async isAuthenticated() {
        try {
            if (window.location.protocol === 'file:') {
                return false;
            }

            if (!this.isInitialized) {
                await Promise.race([
                    this.initialize(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]).catch(() => {});
            }

            const client = this.supabase || await this.getClient();
            if (!client) {
                return false;
            }

            const sessionPromise = client.auth.getSession();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session timeout')), 2000)
            );
            const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]).catch(() => ({ data: null }));
            if (!sessionData?.session?.access_token) {
                this.currentUser = null;
                return false;
            }

            const userPromise = client.auth.getUser();
            const userTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 4000)
            );
            const { data: userData, error } = await Promise.race([userPromise, userTimeout]).catch(() => ({ data: null, error: { message: 'Timeout' } }));

            if (error || !userData?.user) {
                this.currentUser = null;
                return false;
            }
            this.currentUser = userData.user;
            this.syncIdentityFromUserRoles().catch(() => {});
            return true;
        } catch (error) {
            if (error.message && (
                error.message.includes('Timeout') ||
                error.message.includes('CORS') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError')
            )) {
                return false;
            }
            return false;
        }
    }

    /**
     * Requerir autenticación (redirige a login si no está autenticado)
     */
    async requireAuth(redirectTo = 'login.html') {
        try {
        // Esperar un momento para que la sesión se cargue desde localStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
                const path = window.location.pathname || '';
                const isLogin = path.includes('login.html');
                const isResetPassword = path.includes('reset-password');
                // No redirigir en login ni en reset-password (flujo de recuperación sin sesión)
                if (!isLogin && !isResetPassword && window.location.protocol !== 'file:') {
                window.location.href = redirectTo;
            }
            return false;
        }
        return true;
        } catch (error) {
            console.error('Error en requireAuth:', error);
            // Si hay error, retornar false pero no bloquear
            return false;
        }
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    async resetPassword(email) {
        try {
            const client = await this.getClient();
            const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

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
     * Actualizar contraseña
     */
    async updatePassword(newPassword) {
        try {
            const client = await this.getClient();
            const { error } = await client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

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
     * Crear usuario con Admin API (requiere service_role key)
     * Nota: Esto debe hacerse desde el backend por seguridad
     */
    async createUserWithAdmin(email, password, metadata = {}) {
        try {
            // IMPORTANTE: Esta función requiere usar el Admin API de Supabase
            // que necesita la service_role key. Por seguridad, esto debe hacerse
            // desde un backend o Edge Function de Supabase.
            
            // Por ahora, usamos signUp normal que requiere confirmación de email
            return await this.signUp(email, password, metadata);
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Crear instancia global
if (typeof window.authManager === 'undefined') {
    window.authManager = new AuthManager();
    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.authManager.initialize();
        });
    } else {
        window.authManager.initialize();
    }
}

