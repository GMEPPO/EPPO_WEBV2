/**
 * 🔍 SISTEMA DE DEBUG DE AUTENTICACIÓN Y ROLES
 * 
 * Muestra información del usuario autenticado y su rol en Supabase
 * 
 * Uso:
 * - Se ejecuta automáticamente al cargar la página
 * - También puedes llamarlo manualmente desde la consola: debugAuth()
 */

/**
 * Función principal de debug
 */
async function debugAuth() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 DEBUG DE AUTENTICACIÓN Y ROLES');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
        // 1. Verificar si authManager está disponible
        if (!window.authManager) {
            console.error('❌ authManager no está disponible');
            return;
        }
        
        console.log('✅ authManager disponible');
        
        // 2. Verificar autenticación
        const isAuth = await window.authManager.isAuthenticated();
        console.log('🔐 Estado de autenticación:', isAuth ? '✅ AUTENTICADO' : '❌ NO AUTENTICADO');
        
        if (!isAuth) {
            console.log('⚠️ No hay usuario autenticado');
            console.log('═══════════════════════════════════════════════════════════');
            return;
        }
        
        // 3. Obtener información del usuario
        const user = await window.authManager.getCurrentUser();
        
        if (!user) {
            console.error('❌ No se pudo obtener el usuario');
            console.log('═══════════════════════════════════════════════════════════');
            return;
        }
        
        console.log('');
        console.log('👤 INFORMACIÓN DEL USUARIO:');
        console.log('───────────────────────────────────────────────────────────────');
        console.log('  📧 Email:', user.email);
        console.log('  🆔 ID:', user.id);
        console.log('  📅 Creado:', user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A');
        console.log('  ✉️ Email verificado:', user.email_confirmed_at ? '✅ Sí' : '❌ No');
        console.log('  🔑 Última sesión:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A');
        
        // 4. Obtener rol desde Supabase
        console.log('');
        console.log('🔐 INFORMACIÓN DEL ROL:');
        console.log('───────────────────────────────────────────────────────────────');
        
        let roleFromDB = null;
        let roleError = null;
        
        try {
            const client = await window.universalSupabase?.getClient();
            
            if (!client) {
                console.warn('⚠️ No se pudo obtener cliente de Supabase');
            } else {
                const { data, error } = await client
                    .from('user_roles')
                    .select('role, created_at, updated_at')
                    .eq('user_id', user.id)
                    .single();
                
                if (error) {
                    if (error.code === 'PGRST116') {
                        console.log('  ⚠️ Estado: NO TIENE ROL ASIGNADO en la tabla user_roles');
                        console.log('  💡 Para asignar un rol, ejecuta en Supabase SQL Editor:');
                        console.log(`     INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'admin');`);
                        console.log('     o');
                        console.log(`     INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'comercial');`);
                    } else {
                        roleError = error;
                        console.error('  ❌ Error al consultar rol:', error.message);
                        console.error('  📋 Código de error:', error.code);
                    }
                } else if (data) {
                    roleFromDB = data.role;
                    console.log('  ✅ Rol en BD:', roleFromDB);
                    console.log('  📅 Rol asignado:', data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A');
                    console.log('  🔄 Última actualización:', data.updated_at ? new Date(data.updated_at).toLocaleString() : 'N/A');
                }
            }
        } catch (error) {
            roleError = error;
            console.error('  ❌ Error al obtener rol:', error.message);
        }
        
        // 5. Verificar rol en rolesManager (si está disponible)
        console.log('');
        console.log('🔧 ESTADO DEL SISTEMA DE ROLES:');
        console.log('───────────────────────────────────────────────────────────────');
        
        if (window.rolesManager) {
            try {
                const roleFromManager = await window.rolesManager.getCurrentUserRole();
                console.log('  📦 Rol en rolesManager:', roleFromManager);
                console.log('  🔄 rolesManager inicializado:', window.rolesManager.isInitialized);
            } catch (error) {
                console.warn('  ⚠️ Error al obtener rol de rolesManager:', error.message);
            }
        } else {
            console.log('  ⚠️ rolesManager no está disponible');
        }
        
        // 6. Resumen
        console.log('');
        console.log('📊 RESUMEN:');
        console.log('───────────────────────────────────────────────────────────────');
        console.log('  Usuario:', user.email);
        console.log('  Rol en BD:', roleFromDB || '❌ NO ASIGNADO');
        console.log('  Rol en Manager:', window.rolesManager?.currentUserRole || 'N/A');
        console.log('  Estado:', isAuth ? '✅ Autenticado' : '❌ No autenticado');
        
        // 7. Información adicional de la sesión
        try {
            const client = await window.universalSupabase?.getClient();
            if (client) {
                const { data: { session } } = await client.auth.getSession();
                if (session) {
                    console.log('');
                    console.log('🔑 INFORMACIÓN DE LA SESIÓN:');
                    console.log('───────────────────────────────────────────────────────────────');
                    console.log('  🎫 Token expira:', session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A');
                    console.log('  🔄 Refresh token:', session.refresh_token ? '✅ Disponible' : '❌ No disponible');
                }
            }
        } catch (error) {
            // Ignorar errores de sesión
        }
        
    } catch (error) {
        console.error('❌ Error en debug:', error);
    }
    
    console.log('═══════════════════════════════════════════════════════════');
}

// Ejecutar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un momento para que authManager se inicialice
        setTimeout(debugAuth, 2000);
    });
} else {
    // DOM ya está listo
    setTimeout(debugAuth, 2000);
}

// También ejecutar cuando cambie el estado de autenticación
if (window.authManager && window.authManager.supabase) {
    window.authManager.supabase.auth.onAuthStateChange(() => {
        setTimeout(debugAuth, 1000);
    });
}

// Hacer la función disponible globalmente para llamarla manualmente desde la consola
window.debugAuth = debugAuth;

