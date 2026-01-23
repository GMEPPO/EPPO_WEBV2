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

/**
 * Deshabilitar el menú hamburguesa para usuarios comerciales
 * Previene el clic en el botón y los enlaces del menú
 */
async function disableMenuForComercial() {
    try {
        // Esperar a que rolesManager esté disponible
        let retries = 0;
        const maxRetries = 15;
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        if (!window.rolesManager) {
            console.warn('⚠️ [disableMenuForComercial] rolesManager no disponible');
            return;
        }

        // Asegurar que el rol esté cargado
        if (!window.rolesManager.isInitialized) {
            await window.rolesManager.initialize();
        }

        // Obtener rol del usuario
        const role = await window.rolesManager.getCurrentUserRole();
        const isComercial = role === 'comercial';

        if (!isComercial) {
            console.log('✅ [disableMenuForComercial] Usuario no es comercial, menú habilitado');
            return;
        }

        console.log('🔒 [disableMenuForComercial] Usuario comercial detectado, deshabilitando menú...');

        // Esperar a que el DOM esté listo
        let menuToggle = document.getElementById('menuToggle');
        let menuDropdown = document.querySelector('.menu-dropdown');
        let dropdownMenu = document.getElementById('dropdownMenu');

        let domRetries = 0;
        while ((!menuToggle || !menuDropdown) && domRetries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            menuToggle = document.getElementById('menuToggle');
            menuDropdown = document.querySelector('.menu-dropdown');
            dropdownMenu = document.getElementById('dropdownMenu');
            domRetries++;
        }

        // Deshabilitar el botón hamburguesa
        if (menuToggle) {
            // Prevenir el clic en el botón
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('🚫 [disableMenuForComercial] Clic en menú hamburguesa bloqueado para usuario comercial');
                return false;
            }, true); // Usar capture phase para interceptar antes que otros handlers

            // Agregar estilo visual de deshabilitado
            menuToggle.style.cursor = 'not-allowed';
            menuToggle.style.opacity = '0.5';
            menuToggle.setAttribute('disabled', 'true');
            menuToggle.setAttribute('aria-disabled', 'true');
            menuToggle.setAttribute('title', 'No disponible para tu rol');
            
            console.log('✅ [disableMenuForComercial] Botón hamburguesa deshabilitado');
        }

        // Deshabilitar los enlaces del menú desplegable
        if (dropdownMenu) {
            const menuLinks = dropdownMenu.querySelectorAll('a.dropdown-link');
            menuLinks.forEach(link => {
                // Prevenir el clic en los enlaces
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log('🚫 [disableMenuForComercial] Clic en enlace del menú bloqueado para usuario comercial');
                    return false;
                }, true);

                // Agregar estilo visual de deshabilitado
                link.style.cursor = 'not-allowed';
                link.style.opacity = '0.5';
                link.style.pointerEvents = 'none';
                
                console.log('✅ [disableMenuForComercial] Enlace deshabilitado:', link.href);
            });
        }

        // También prevenir que el menú se abra si se hace clic en el contenedor
        if (menuDropdown) {
            menuDropdown.addEventListener('click', (e) => {
                // Solo bloquear si el clic es en el contenedor o en elementos deshabilitados
                if (e.target === menuDropdown || e.target.closest('.dropdown-link')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚫 [disableMenuForComercial] Clic en menú desplegable bloqueado');
                    return false;
                }
            }, true);
        }

        console.log('✅ [disableMenuForComercial] Menú hamburguesa completamente deshabilitado para usuario comercial');

    } catch (error) {
        console.error('❌ [disableMenuForComercial] Error deshabilitando menú:', error);
    }
}

// Hacer la función disponible globalmente
window.disableMenuForComercial = disableMenuForComercial;

// Ejecutar cuando el DOM esté listo
function initMenuDisabling() {
    const executeDisabling = async () => {
        if (window.authManager && window.rolesManager) {
            try {
                const isAuth = await window.authManager.isAuthenticated();
                if (isAuth) {
                    await disableMenuForComercial();
                }
            } catch (error) {
                console.warn('⚠️ [initMenuDisabling] Error verificando autenticación:', error);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(executeDisabling, 1000);
        });
    } else {
        setTimeout(executeDisabling, 1000);
    }
}

// Inicializar solo una vez
if (!window.menuDisablingInitialized) {
    initMenuDisabling();
    window.menuDisablingInitialized = true;
}

// Ejecutar cuando cambie el estado de autenticación
if (!window.menuDisablingAuthListenerAdded) {
    const setupAuthListener = () => {
        if (window.authManager && window.authManager.supabase) {
            window.authManager.supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setTimeout(async () => {
                        await disableMenuForComercial();
                    }, 500);
                }
            });
            window.menuDisablingAuthListenerAdded = true;
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

// Ejecutar cuando el rol se carga
document.addEventListener('roleLoaded', async (event) => {
    setTimeout(async () => {
        await disableMenuForComercial();
    }, 200);
});
