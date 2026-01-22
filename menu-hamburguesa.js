/**
 * Script común para el menú hamburguesa
 * Funciones reutilizables para todas las páginas
 */

// Función para abrir/cerrar el menú desplegable
function toggleMenu() {
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

// Bandera para evitar ejecuciones múltiples simultáneas
let isHidingMenuItems = false;
let lastHideExecution = 0;
const HIDE_COOLDOWN = 2000; // 2 segundos entre ejecuciones

/**
 * Ocultar opciones del menú según el rol del usuario
 * Solo admin puede ver "Comparar" y "Creador/Editor"
 */
async function hideMenuItemsByRole() {
    // Evitar ejecuciones múltiples simultáneas
    const now = Date.now();
    if (isHidingMenuItems || (now - lastHideExecution) < HIDE_COOLDOWN) {
        if (isHidingMenuItems) {
            console.log('⏸️ hideMenuItemsByRole() ya está ejecutándose, omitiendo...');
        }
        return;
    }

    isHidingMenuItems = true;
    lastHideExecution = now;

    try {
        console.log('🔍 hideMenuItemsByRole() ejecutándose...');
        
        // Esperar a que authManager y rolesManager estén inicializados
        let retries = 0;
        const maxRetries = 10; // Reducir retries
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        if (!window.rolesManager) {
            console.warn('⚠️ rolesManager no disponible después de esperar');
            isHidingMenuItems = false;
            return; // NO reintentar automáticamente
        }

        // Asegurar que el rol esté cargado
        try {
            await window.rolesManager.initialize();
        } catch (error) {
            console.warn('⚠️ Error inicializando rolesManager:', error);
            isHidingMenuItems = false;
            return; // NO reintentar automáticamente
        }
        
        const role = await window.rolesManager.getCurrentUserRole();
        const isAdmin = role === 'admin';

        console.log('🔐 Rol del usuario:', role, '| Es admin:', isAdmin);

        // Buscar elementos del menú con múltiples selectores
        let hiddenCount = 0;

        // Ocultar "Comparar" si no es admin
        const compararSelectors = [
            'a[href="comparar-productos.html"]',
            'a[href*="comparar-productos"]',
            '.dropdown-link[href="comparar-productos.html"]'
        ];
        
        compararSelectors.forEach(selector => {
            const links = document.querySelectorAll(selector);
            links.forEach(link => {
                if (!isAdmin) {
                    link.style.display = 'none';
                    link.style.visibility = 'hidden';
                    link.setAttribute('data-hidden-by-role', 'true');
                    hiddenCount++;
                } else {
                    link.style.display = '';
                    link.style.visibility = '';
                    link.removeAttribute('data-hidden-by-role');
                }
            });
        });

        // Ocultar "Creador/Editor" (selector-productos.html) si no es admin
        const creadorSelectors = [
            'a[href="selector-productos.html"]',
            'a[href*="selector-productos"]',
            '.dropdown-link[href="selector-productos.html"]',
            '#nav-create-product-link'
        ];
        
        creadorSelectors.forEach(selector => {
            const links = document.querySelectorAll(selector);
            links.forEach(link => {
                if (!isAdmin) {
                    link.style.display = 'none';
                    link.style.visibility = 'hidden';
                    link.setAttribute('data-hidden-by-role', 'true');
                    hiddenCount++;
                } else {
                    link.style.display = '';
                    link.style.visibility = '';
                    link.removeAttribute('data-hidden-by-role');
                }
            });
        });

        // También ocultar por ID si existe
        const navCreateProductLink = document.getElementById('nav-create-product-link');
        if (navCreateProductLink && !isAdmin) {
            navCreateProductLink.style.display = 'none';
            navCreateProductLink.style.visibility = 'hidden';
            hiddenCount++;
        }

        if (hiddenCount > 0) {
            console.log(`✅ Ocultados ${hiddenCount} elementos del menú para rol: ${role}`);
        } else if (isAdmin) {
            console.log('✅ Usuario admin - todos los elementos del menú visibles');
        }

    } catch (error) {
        console.error('❌ Error al ocultar elementos del menú:', error);
    } finally {
        isHidingMenuItems = false;
    }
}

// Ejecutar cuando el DOM esté listo y después de que los scripts se carguen
function initMenuRoleHiding() {
    const executeHiding = () => {
        // Esperar a que rolesManager esté disponible
        if (window.rolesManager) {
            hideMenuItemsByRole();
        } else {
            // Intentar solo una vez más después de un momento
            setTimeout(() => {
                if (window.rolesManager) {
                    hideMenuItemsByRole();
                }
            }, 2000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar un poco más para que todos los scripts se carguen
            setTimeout(executeHiding, 1500);
        });
    } else {
        // DOM ya está listo, esperar a que los scripts se carguen
        setTimeout(executeHiding, 1500);
    }
}

// Inicializar solo una vez
if (!window.menuRoleHidingInitialized) {
    initMenuRoleHiding();
    window.menuRoleHidingInitialized = true;
}

// También ejecutar cuando cambie el estado de autenticación (solo una vez)
if (window.authManager && window.authManager.supabase && !window.authStateListenerAdded) {
    window.authManager.supabase.auth.onAuthStateChange(() => {
        // Esperar un momento antes de ocultar para que el rol se cargue
        setTimeout(hideMenuItemsByRole, 1000);
    });
    window.authStateListenerAdded = true;
}




