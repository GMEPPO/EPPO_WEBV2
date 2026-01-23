/**
 * Script común para el menú hamburguesa
 * Funciones reutilizables para todas las páginas
 */

// Caché simple del rol para evitar consultas repetitivas
let cachedRole = null;
let roleCacheTimestamp = 0;
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Caché simple del país para evitar consultas repetitivas
let cachedPais = null;
let paisCacheTimestamp = 0;
const PAIS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener rol del usuario directamente desde Supabase (sin roles.js)
 */
async function getUserRole() {
    // Verificar caché
    const now = Date.now();
    if (cachedRole && (now - roleCacheTimestamp) < ROLE_CACHE_DURATION) {
        return cachedRole;
    }

    try {
        // Verificar autenticación
        if (!window.authManager) {
            return null;
        }

        const isAuth = await window.authManager.isAuthenticated();
        if (!isAuth) {
            return null;
        }

        const user = await window.authManager.getCurrentUser();
        if (!user) {
            return null;
        }

        // Obtener cliente Supabase
        const client = await window.universalSupabase?.getClient();
        if (!client) {
            return null;
        }

        // Consultar rol directamente desde la BD
        const { data, error } = await client
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Usuario sin rol asignado, usar 'comercial' por defecto
                cachedRole = 'comercial';
                roleCacheTimestamp = now;
                return 'comercial';
            }
            console.warn('⚠️ [getUserRole] Error al consultar rol:', error.message);
            return null;
        }

        if (data && data.role) {
            // Mapear roles deprecados
            let role = data.role;
            if (role === 'editor' || role === 'viewer') {
                role = 'comercial';
            }
            
            // Guardar en caché
            cachedRole = role;
            roleCacheTimestamp = now;
            return role;
        }

        // Si no hay rol, usar 'comercial' por defecto
        cachedRole = 'comercial';
        roleCacheTimestamp = now;
        return 'comercial';

    } catch (error) {
        console.warn('⚠️ [getUserRole] Error obteniendo rol:', error);
        return null;
    }
}

// Hacer la función disponible globalmente
window.getUserRole = getUserRole;

// Función para limpiar el caché (útil al cerrar sesión)
window.clearRoleCache = function() {
    cachedRole = null;
    roleCacheTimestamp = 0;
    cachedPais = null;
    paisCacheTimestamp = 0;
    console.log('🗑️ [menu-hamburguesa] Caché de rol y país limpiado');
};

/**
 * Obtener país del usuario desde user_roles
 */
async function getUserPais() {
    // Verificar caché
    const now = Date.now();
    if (cachedPais && (now - paisCacheTimestamp) < PAIS_CACHE_DURATION) {
        return cachedPais;
    }

    try {
        // Verificar autenticación
        if (!window.authManager) {
            return null;
        }

        const isAuth = await window.authManager.isAuthenticated();
        if (!isAuth) {
            return null;
        }

        const user = await window.authManager.getCurrentUser();
        if (!user) {
            return null;
        }

        // Obtener cliente Supabase
        const client = await window.universalSupabase?.getClient();
        if (!client) {
            return null;
        }

        // Consultar país directamente desde la BD
        const { data, error } = await client
            .from('user_roles')
            .select('Pais')
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Usuario sin país asignado, usar 'Portugal' por defecto (acceso completo)
                cachedPais = 'Portugal';
                paisCacheTimestamp = now;
                return 'Portugal';
            }
            console.warn('⚠️ [getUserPais] Error al consultar país:', error.message);
            return null;
        }

        if (data && data.Pais) {
            // Guardar en caché
            cachedPais = data.Pais;
            paisCacheTimestamp = now;
            return data.Pais;
        }

        // Si no hay país, usar 'Portugal' por defecto (acceso completo)
        cachedPais = 'Portugal';
        paisCacheTimestamp = now;
        return 'Portugal';

    } catch (error) {
        console.warn('⚠️ [getUserPais] Error obteniendo país:', error);
        return null;
    }
}

// Hacer la función disponible globalmente
window.getUserPais = getUserPais;

// Función para abrir/cerrar el menú desplegable
async function toggleMenu() {
    // Verificar si el usuario es comercial ANTES de abrir el menú
    try {
        const role = await getUserRole();
        
        // Si es comercial, bloquear la apertura del menú
        if (role === 'comercial') {
            console.log('🚫 [toggleMenu] Usuario comercial - acceso al menú bloqueado');
            return; // Salir sin abrir el menú
        }
    } catch (error) {
        console.warn('⚠️ [toggleMenu] Error verificando rol, permitiendo acceso:', error);
        // Si hay error, permitir acceso por defecto
    }
    
    // Si no es comercial o hay error, abrir el menú normalmente
    const menu = document.getElementById('dropdownMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('dropdownMenu');
        const toggle = document.getElementById('menuToggle');
        if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
});

// También bloquear los enlaces del menú desplegable para usuarios comerciales
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el DOM esté completamente cargado
    setTimeout(() => {
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu) {
            const menuLinks = dropdownMenu.querySelectorAll('a.dropdown-link');
            menuLinks.forEach(link => {
                link.addEventListener('click', async (e) => {
                    // Verificar rol solo cuando se hace clic en el enlace
                    try {
                        const role = await getUserRole();
                        if (role === 'comercial') {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🚫 [menu-hamburguesa] Usuario comercial - acceso a', link.href, 'bloqueado');
                            return false;
                        }
                    } catch (error) {
                        console.warn('⚠️ [menu-hamburguesa] Error verificando rol, permitiendo acceso:', error);
                    }
                }, true); // Usar capture phase para interceptar antes
            });
        }
    }, 500);
});
