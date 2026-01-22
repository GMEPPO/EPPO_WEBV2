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
 * Ocultar el menú desplegable completo si el usuario es "comercial"
 */
async function hideMenuDropdownByRole() {
    try {
        console.log('🔍 hideMenuDropdownByRole() ejecutándose...');
        
        // Esperar a que authManager y rolesManager estén inicializados
        let retries = 0;
        const maxRetries = 10;
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        if (!window.rolesManager) {
            console.warn('⚠️ rolesManager no disponible después de esperar');
            return;
        }

        // Asegurar que el rol esté cargado
        try {
            await window.rolesManager.initialize();
        } catch (error) {
            console.warn('⚠️ Error inicializando rolesManager:', error);
            return;
        }
        
        const role = await window.rolesManager.getCurrentUserRole();
        const isComercial = role === 'comercial';

        console.log('🔐 Rol del usuario:', role, '| Es comercial:', isComercial);

        // Obtener el contenedor del menú desplegable
        const menuDropdown = document.querySelector('.menu-dropdown');
        
        if (menuDropdown) {
            if (isComercial) {
                // Ocultar el menú desplegable completo para usuarios comerciales
                menuDropdown.style.display = 'none';
                console.log('✅ Menú desplegable oculto para usuario comercial');
            } else {
                // Mostrar el menú desplegable para admins
                menuDropdown.style.display = '';
                console.log('✅ Menú desplegable visible para usuario admin');
            }
        } else {
            console.warn('⚠️ No se encontró el elemento .menu-dropdown');
        }

    } catch (error) {
        console.error('❌ Error al ocultar menú desplegable:', error);
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

// También ejecutar cuando cambie el estado de autenticación
// Usar un listener global para evitar duplicados
if (!window.menuDropdownAuthListenerAdded) {
    // Esperar a que authManager esté disponible
    const setupAuthListener = () => {
        if (window.authManager && window.authManager.supabase) {
            window.authManager.supabase.auth.onAuthStateChange(() => {
                // Esperar un momento antes de ocultar para que el rol se cargue
                setTimeout(hideMenuDropdownByRole, 1000);
            });
            window.menuDropdownAuthListenerAdded = true;
        } else {
            // Intentar de nuevo después de un momento
            setTimeout(setupAuthListener, 500);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAuthListener);
    } else {
        setupAuthListener();
    }
}




