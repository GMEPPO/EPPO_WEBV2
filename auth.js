/**
 * Sistema de Autenticación con Supabase Auth
 * Maneja login, registro, sesiones y verificación de autenticación
 */

class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
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
                        // Sistema de roles desactivado - no se carga el rol
                        // if (window.rolesManager) {
                        //     await window.rolesManager.loadCurrentUserRole();
                        // }
                    }
                } catch (error) {
                    // Si falla por CORS, es porque estamos en file://
                    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
                        console.warn('⚠️ Error de CORS - Supabase no puede funcionar con file://');
                    } else {
                        console.error('Error obteniendo sesión:', error);
                    }
                }

                // Escuchar cambios de autenticación
                try {
                    this.supabase.auth.onAuthStateChange(async (event, session) => {
                        if (event === 'SIGNED_IN') {
                            this.currentUser = session?.user || null;
                            // Sistema de roles desactivado - no se carga el rol
                            // if (window.rolesManager && this.currentUser) {
                            //     await window.rolesManager.loadCurrentUserRole();
                            // }
                        } else if (event === 'SIGNED_OUT') {
                            this.currentUser = null;
                            // Sistema de roles desactivado - no se limpia el rol
                            // if (window.rolesManager) {
                            //     window.rolesManager.currentUserRole = null;
                            // }
                        }
                    });
                } catch (error) {
                    console.warn('No se pudo configurar listener de autenticación:', error);
                }
            }

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
            
            // Sistema de roles desactivado - no se carga el rol después del login
            // if (window.rolesManager) {
            //     await window.rolesManager.loadCurrentUserRole();
            // }
            
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
     * Verificar si el usuario está autenticado
     */
    async isAuthenticated() {
        try {
            console.log('🔍 [isAuthenticated] Iniciando verificación...');
            console.log('🔍 [isAuthenticated] isInitialized:', this.isInitialized);
            console.log('🔍 [isAuthenticated] supabase disponible:', !!this.supabase);
            console.log('🔍 [isAuthenticated] universalSupabase disponible:', !!window.universalSupabase);
            
            // Si estamos usando file://, Supabase no puede funcionar correctamente
            if (window.location.protocol === 'file:') {
                console.warn('⚠️ file:// protocol detectado - Supabase requiere un servidor HTTP local');
                console.warn('💡 Ejecuta: python -m http.server 8000');
                console.warn('💡 Luego abre: http://localhost:8000');
                return false;
            }

            // Asegurar que esté inicializado
            if (!this.isInitialized) {
                console.log('🔍 [isAuthenticated] Inicializando authManager...');
                await this.initialize();
            }

            // Obtener cliente
            const client = await this.getClient();
            if (!client) {
                console.error('❌ [isAuthenticated] No se pudo obtener cliente de Supabase');
                return false;
            }

            console.log('🔍 [isAuthenticated] Cliente obtenido, verificando sesión...');
            
            // Usar getSession() que lee de localStorage y es más confiable
            const { data, error } = await client.auth.getSession();
            
            if (error) {
                console.error('❌ [isAuthenticated] Error al obtener sesión:', error);
                return false;
            }

            console.log('🔍 [isAuthenticated] Respuesta de getSession:', {
                hasSession: !!data?.session,
                hasUser: !!data?.session?.user,
                userEmail: data?.session?.user?.email
            });
            
            if (data?.session && data.session.user) {
                this.currentUser = data.session.user;
                console.log('✅ [isAuthenticated] Usuario autenticado:', data.session.user.email);
                return true;
            }
            
            console.log('⚠️ [isAuthenticated] No hay sesión activa');
            return false;
        } catch (error) {
            console.error('❌ [isAuthenticated] Error en verificación:', error);
            // Detectar errores de CORS que indican uso de file://
            if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                console.error('❌ Error de CORS - Supabase no puede funcionar con file:// protocol');
                console.error('💡 SOLUCIÓN: Usa un servidor HTTP local');
                console.error('   Windows: python -m http.server 8000');
                console.error('   Luego abre: http://localhost:8000');
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
                // Solo redirigir si no estamos ya en la página de login Y no estamos usando file://
                if (!window.location.pathname.includes('login.html') && window.location.protocol !== 'file:') {
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

