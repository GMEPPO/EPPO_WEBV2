/**
 * Script común para el menú hamburguesa
 * Funciones reutilizables para todas las páginas
 */

(function() {
    try {
        var r = localStorage.getItem('eppo_user_role');
        if (r === 'compras') document.documentElement.classList.add('role-compras');
    } catch (e) {}
})();

// Caché simple del rol para evitar consultas repetitivas
let cachedRole = null;
const ROLE_STORAGE_KEY = 'eppo_user_role';
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
                cachedRole = 'comercial';
                roleCacheTimestamp = now;
                try { localStorage.setItem(ROLE_STORAGE_KEY, 'comercial'); } catch (e) {}
                document.documentElement.classList.remove('role-compras');
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
            cachedRole = role;
            roleCacheTimestamp = now;
            try { localStorage.setItem(ROLE_STORAGE_KEY, String(role).toLowerCase()); } catch (e) {}
            if (String(role).toLowerCase() === 'compras') document.documentElement.classList.add('role-compras');
            else document.documentElement.classList.remove('role-compras');
            return role;
        }

        cachedRole = 'comercial';
        roleCacheTimestamp = now;
        try { localStorage.setItem(ROLE_STORAGE_KEY, 'comercial'); } catch (e) {}
        document.documentElement.classList.remove('role-compras');
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
    try { localStorage.removeItem(ROLE_STORAGE_KEY); } catch (e) {}
    document.documentElement.classList.remove('role-compras');
};

// Permitir a auth.js establecer el rol tras cargar desde user_roles (evita doble consulta)
window.setCachedRole = function(role) {
    if (role) {
        cachedRole = role;
        roleCacheTimestamp = Date.now();
        try { localStorage.setItem(ROLE_STORAGE_KEY, String(role).toLowerCase()); } catch (e) {}
        if (String(role).toLowerCase() === 'compras') document.documentElement.classList.add('role-compras');
        else document.documentElement.classList.remove('role-compras');
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
            // Nombre siempre desde user_roles (usuario logueado), no desde localStorage,
            // para que no cambie al guardar una propuesta o al elegir un comercial en carrito
            let displayName = await window.authManager.getDisplayName();
            if (!displayName) displayName = 'Usuario';
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

// Exponer para que otras páginas puedan refrescar la barra tras guardar (evita que el nombre se cambie por error)
window.refreshUserBar = initUserBar;

// Exponer para que otras páginas puedan refrescar la barra tras guardar (evita que el nombre se cambie por error)
window.refreshUserBar = initUserBar;

// Re-refrescar la barra si se dispara el evento (p. ej. tras guardar propuesta)
document.addEventListener('refresh-user-bar', () => { initUserBar(); });

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
