/**
 * Script común para el menú hamburguesa
 * Funciones reutilizables para todas las páginas
 */

// Función para abrir/cerrar el menú desplegable
async function toggleMenu() {
    // Verificar si el usuario es comercial ANTES de abrir el menú
    if (window.rolesManager && window.authManager) {
        try {
            // Verificar si el usuario está autenticado
            const isAuth = await window.authManager.isAuthenticated();
            if (isAuth) {
                // Obtener rol del usuario (solo cuando se intenta abrir el menú)
                const role = await window.rolesManager.getCurrentUserRole();
                
                // Si es comercial, bloquear la apertura del menú
                if (role === 'comercial') {
                    console.log('🚫 [toggleMenu] Usuario comercial - acceso al menú bloqueado');
                    return; // Salir sin abrir el menú
                }
            }
        } catch (error) {
            console.warn('⚠️ [toggleMenu] Error verificando rol, permitiendo acceso:', error);
            // Si hay error, permitir acceso por defecto
        }
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
                    if (window.rolesManager && window.authManager) {
                        try {
                            const isAuth = await window.authManager.isAuthenticated();
                            if (isAuth) {
                                const role = await window.rolesManager.getCurrentUserRole();
                                if (role === 'comercial') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🚫 [menu-hamburguesa] Usuario comercial - acceso a', link.href, 'bloqueado');
                                    return false;
                                }
                            }
                        } catch (error) {
                            console.warn('⚠️ [menu-hamburguesa] Error verificando rol, permitiendo acceso:', error);
                        }
                    }
                }, true); // Usar capture phase para interceptar antes
            });
        }
    }, 500);
});
