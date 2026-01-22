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
        const maxRetries = 10;
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        if (!window.rolesManager) {
            console.warn('⚠️ rolesManager no disponible para ocultar menú');
            isHidingDropdown = false;
            return;
        }

        // Asegurar que el rol esté cargado (solo una vez)
        if (!window.rolesManager.isInitialized) {
            try {
                await window.rolesManager.initialize();
            } catch (error) {
                console.warn('⚠️ Error inicializando rolesManager:', error);
                isHidingDropdown = false;
                return;
            }
        }
        
        // Obtener rol (usa caché, no hace consultas repetitivas)
        const role = await window.rolesManager.getCurrentUserRole();
        const isComercial = role === 'comercial';

        console.log('🔐 Verificando rol para menú desplegable:', role, '| Es comercial:', isComercial);

        // Obtener el contenedor del menú desplegable y el botón hamburguesa
        const menuDropdown = document.querySelector('.menu-dropdown');
        const menuToggle = document.getElementById('menuToggle');
        
        if (menuDropdown) {
            if (isComercial) {
                // Ocultar el menú desplegable completo para usuarios comerciales
                menuDropdown.style.display = 'none';
                console.log('✅ Menú desplegable ocultado para usuario comercial');
            } else {
                // Mostrar el menú desplegable para admins
                menuDropdown.style.display = '';
                console.log('✅ Menú desplegable visible para usuario admin');
            }
        } else {
            console.warn('⚠️ No se encontró el elemento .menu-dropdown');
        }

        // También ocultar el botón hamburguesa si es comercial
        if (menuToggle) {
            if (isComercial) {
                menuToggle.style.display = 'none';
                console.log('✅ Botón hamburguesa ocultado para usuario comercial');
            } else {
                menuToggle.style.display = '';
                console.log('✅ Botón hamburguesa visible para usuario admin');
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
    const executeHiding = async () => {
        // Esperar a que rolesManager esté disponible y autenticado
        let attempts = 0;
        const maxAttempts = 20; // 4 segundos máximo (200ms * 20)
        
        while (attempts < maxAttempts) {
            // Verificar que authManager y rolesManager estén disponibles
            if (window.authManager && window.rolesManager) {
                // Verificar que el usuario esté autenticado
                try {
                    const isAuth = await window.authManager.isAuthenticated();
                    if (isAuth) {
                        // Usuario autenticado, ejecutar ocultación
                        await hideMenuDropdownByRole();
                        return;
                    }
                } catch (error) {
                    // Continuar intentando
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        // Si después de todos los intentos no se pudo, intentar una vez más
        if (window.rolesManager) {
            setTimeout(() => hideMenuDropdownByRole(), 1000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar un poco más para que todos los scripts se carguen
            setTimeout(executeHiding, 1000);
        });
    } else {
        // DOM ya está listo, esperar a que los scripts se carguen
        setTimeout(executeHiding, 1000);
    }
}

// Hacer la función disponible globalmente
window.hideMenuDropdownByRole = hideMenuDropdownByRole;

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




