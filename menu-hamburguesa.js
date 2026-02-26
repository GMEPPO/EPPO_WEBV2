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

// Permitir a auth.js establecer el rol tras cargar desde user_roles (evita doble consulta)
window.setCachedRole = function(role) {
    if (role) {
        cachedRole = role;
        roleCacheTimestamp = Date.now();
    }
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
    // Solo bloquear apertura del menú para rol comercial (compras sí puede abrirlo)
    try {
        const role = await getUserRole();
        if (role === 'comercial') {
            return;
        }
    } catch (error) {
        // Si hay error, permitir acceso
    }
    const menu = document.getElementById('dropdownMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

/**
 * Inicializar barra de usuario (nombre, rol, logout) en el header
 */
async function initUserBar() {
    const nameEl = document.getElementById('user-bar-name');
    const roleEl = document.getElementById('user-bar-role');
    const logoutBtn = document.getElementById('user-bar-logout');
    if (!nameEl || !roleEl || !logoutBtn) return;

    const loginPage = 'login.html';
    const isAuth = window.authManager && await window.authManager.isAuthenticated();

    if (isAuth) {
        try {
            const name = (typeof localStorage !== 'undefined' && localStorage.getItem('commercial_name')) || null;
            let displayName = (name && name.trim()) || '';
            if (!displayName) {
                const user = await window.authManager.getCurrentUser();
                displayName = (user && user.email) || 'Usuario';
            }
            const role = await getUserRole();
            const roleLabel = (role && String(role).trim()) ? String(role).toUpperCase() : '—';
            nameEl.textContent = displayName;
            roleEl.textContent = roleLabel;
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = async () => {
                try {
                    await window.authManager.logout();
                    if (typeof window.clearRoleCache === 'function') window.clearRoleCache();
                    window.location.href = loginPage;
                } catch (e) {
                    window.location.href = loginPage;
                }
            };
        } catch (e) {
            nameEl.textContent = 'Usuario';
            roleEl.textContent = '—';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = () => { window.location.href = loginPage; };
        }
    } else {
        nameEl.textContent = 'Invitado';
        roleEl.textContent = '—';
        logoutBtn.textContent = 'Iniciar sesión';
        logoutBtn.onclick = () => { window.location.href = loginPage; };
    }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('DOMContentLoaded', () => {
    initUserBar();
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('dropdownMenu');
        const toggle = document.getElementById('menuToggle');
        if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
});

// Restricciones por rol: comercial no puede usar el menú; compras solo puede ir a Gestão de Encomendas
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const role = typeof window.getUserRole === 'function' ? await window.getUserRole() : null;
        const roleLower = (role || '').toString().toLowerCase();

        if (roleLower === 'compras') {
            const navCart = document.getElementById('nav-cart-link');
            const navProposals = document.getElementById('nav-proposals-link');
            if (navCart) navCart.style.display = 'none';
            if (navProposals) navProposals.style.display = 'none';
            const dropdownMenu = document.getElementById('dropdownMenu');
            if (dropdownMenu) {
                dropdownMenu.querySelectorAll('a.dropdown-link').forEach(link => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    if (!href.includes('gestao-encomendas')) link.style.display = 'none';
                });
            }
        }

        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu) {
            dropdownMenu.querySelectorAll('a.dropdown-link').forEach(link => {
                link.addEventListener('click', async (e) => {
                    try {
                        const r = await getUserRole();
                        const rl = (r || '').toString().toLowerCase();
                        if (rl === 'comercial') {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                        if (rl === 'compras') {
                            const href = (link.getAttribute('href') || '').toLowerCase();
                            if (!href.includes('gestao-encomendas')) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            }
                        }
                    } catch (err) {}
                }, true);
            });
        }
    }, 400);
});
