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

// Bandera para evitar ejecuciones múltiples
let isHidingDropdown = false;
let lastDropdownHide = 0;
const DROPDOWN_HIDE_COOLDOWN = 3000; // 3 segundos entre ejecuciones

/**
 * Ocultar el menú desplegable completo si el usuario es "comercial"
 */
async function hideMenuDropdownByRole() {
    // Evitar ejecuciones múltiples simultáneas
    const now = Date.now();
    if (isHidingDropdown || (now - lastDropdownHide) < DROPDOWN_HIDE_COOLDOWN) {
        return;
    }

    isHidingDropdown = true;
    lastDropdownHide = now;

    try {
        // Esperar a que authManager y rolesManager estén inicializados
        let retries = 0;
        const maxRetries = 5; // Reducir retries
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 300));
            retries++;
        }

        if (!window.rolesManager) {
            isHidingDropdown = false;
            return;
        }

        // Asegurar que el rol esté cargado (solo una vez)
        if (!window.rolesManager.isInitialized) {
            try {
                await window.rolesManager.initialize();
            } catch (error) {
                isHidingDropdown = false;
                return;
            }
        }
        
        // Obtener rol (usa caché, no hace consultas repetitivas)
        const role = await window.rolesManager.getCurrentUserRole();
        const isComercial = role === 'comercial';

        // Obtener el contenedor del menú desplegable
        const menuDropdown = document.querySelector('.menu-dropdown');
        
        if (menuDropdown) {
            if (isComercial) {
                // Ocultar el menú desplegable completo para usuarios comerciales
                menuDropdown.style.display = 'none';
            } else {
                // Mostrar el menú desplegable para admins
                menuDropdown.style.display = '';
            }
        }

    } catch (error) {
        console.error('❌ Error al ocultar menú desplegable:', error);
    } finally {
        isHidingDropdown = false;
    }
}

// Ejecutar cuando el DOM esté listo y después de que los scripts se carguen
function initMenuDropdownHiding() {
    const executeHiding = () => {
        // Esperar a que rolesManager esté disponible
        if (window.rolesManager) {
            hideMenuDropdownByRole();
        } else {
            // Intentar solo una vez más después de un momento
            setTimeout(() => {
                if (window.rolesManager) {
                    hideMenuDropdownByRole();
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
if (!window.menuDropdownHidingInitialized) {
    initMenuDropdownHiding();
    window.menuDropdownHidingInitialized = true;
}

// También ejecutar cuando cambie el estado de autenticación (solo una vez)
if (!window.menuDropdownAuthListenerAdded) {
    const setupAuthListener = () => {
        if (window.authManager && window.authManager.supabase) {
            window.authManager.supabase.auth.onAuthStateChange(() => {
                // Esperar un momento antes de ocultar para que el rol se cargue
                // Solo ejecutar si no se ejecutó recientemente
                const now = Date.now();
                if (now - lastDropdownHide > DROPDOWN_HIDE_COOLDOWN) {
                    setTimeout(hideMenuDropdownByRole, 1500);
                }
            });
            window.menuDropdownAuthListenerAdded = true;
        } else {
            setTimeout(setupAuthListener, 500);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAuthListener);
    } else {
        setupAuthListener();
    }
}




