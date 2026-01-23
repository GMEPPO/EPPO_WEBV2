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

// Bandera para evitar ejecuciones múltiples simultáneas
let isHidingDropdown = false;
let lastRoleChecked = null; // Cache del último rol verificado

/**
 * Ocultar el menú desplegable completo si el usuario es "comercial"
 */
async function hideMenuDropdownByRole() {
    // Si ya hay una ejecución en curso, esperar a que termine en lugar de retornar
    if (isHidingDropdown) {
        console.log('⏳ [hideMenuDropdownByRole] Esperando a que termine la ejecución anterior...');
        // Esperar hasta 3 segundos a que termine
        let waitCount = 0;
        while (isHidingDropdown && waitCount < 15) {
            await new Promise(resolve => setTimeout(resolve, 200));
            waitCount++;
        }
        if (isHidingDropdown) {
            console.warn('⚠️ [hideMenuDropdownByRole] Timeout esperando ejecución anterior, continuando...');
            isHidingDropdown = false; // Forzar reset si hay timeout
        }
    }

    isHidingDropdown = true;
    console.log('🔍 [hideMenuDropdownByRole] Iniciando ejecución...');

    try {
        console.log('🔍 [hideMenuDropdownByRole] Verificando managers...');
        
        // Esperar a que authManager y rolesManager estén inicializados
        let retries = 0;
        const maxRetries = 15;
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        if (!window.rolesManager) {
            console.warn('⚠️ [hideMenuDropdownByRole] rolesManager no disponible después de esperar');
            isHidingDropdown = false;
            return;
        }

        console.log('✅ [hideMenuDropdownByRole] rolesManager disponible');

        // Asegurar que el rol esté cargado (solo una vez)
        if (!window.rolesManager.isInitialized) {
            console.log('🔄 [hideMenuDropdownByRole] Inicializando rolesManager...');
            try {
                await window.rolesManager.initialize();
            } catch (error) {
                console.warn('⚠️ [hideMenuDropdownByRole] Error inicializando rolesManager:', error);
                isHidingDropdown = false;
                return;
            }
        }
        
        console.log('🔍 [hideMenuDropdownByRole] Obteniendo rol del usuario...');
        
        // Obtener rol (usa caché, no hace consultas repetitivas)
        const role = await window.rolesManager.getCurrentUserRole();
        const isComercial = role === 'comercial';

        console.log('🔐 [hideMenuDropdownByRole] Rol detectado:', role, '| Es comercial:', isComercial);
        
        // Si el rol no ha cambiado y ya aplicamos el estilo, no hacer nada
        if (lastRoleChecked === role) {
            const menuDropdown = document.querySelector('.menu-dropdown');
            if (menuDropdown) {
                const isHidden = menuDropdown.style.display === 'none' || menuDropdown.hasAttribute('data-hidden-by-role');
                if ((isComercial && isHidden) || (!isComercial && !isHidden)) {
                    console.log('⏭️ [hideMenuDropdownByRole] El menú ya está en el estado correcto, saltando...');
                    isHidingDropdown = false;
                    return;
                }
            }
        }
        
        lastRoleChecked = role;

        // Esperar a que el DOM esté completamente listo (con retry)
        let menuDropdown = null;
        let menuToggle = null;
        let domRetries = 0;
        const maxDomRetries = 10;
        
        while ((!menuDropdown || !menuToggle) && domRetries < maxDomRetries) {
            // Intentar múltiples selectores
            menuDropdown = document.querySelector('.menu-dropdown') || 
                          document.querySelector('div.menu-dropdown');
            
            menuToggle = document.getElementById('menuToggle') || 
                        document.querySelector('button.menu-toggle') ||
                        document.querySelector('.menu-toggle');
            
            if (menuDropdown && menuToggle) {
                break; // Ambos encontrados
            }
            
            // Esperar un poco antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 100));
            domRetries++;
        }
        
        console.log('🔍 [hideMenuDropdownByRole] Elementos encontrados:', {
            menuDropdown: !!menuDropdown,
            menuToggle: !!menuToggle,
            isComercial: isComercial,
            domRetries: domRetries
        });
        
        if (!menuDropdown && !menuToggle) {
            console.error('❌ [hideMenuDropdownByRole] No se encontraron los elementos del menú después de', maxDomRetries, 'intentos');
            console.log('🔍 [hideMenuDropdownByRole] Intentando buscar todos los elementos posibles...');
            const allDropdowns = document.querySelectorAll('.menu-dropdown, div.menu-dropdown');
            const allToggles = document.querySelectorAll('#menuToggle, button.menu-toggle, .menu-toggle');
            console.log('  - Dropdowns encontrados:', allDropdowns.length);
            console.log('  - Toggles encontrados:', allToggles.length);
            if (allDropdowns.length > 0) menuDropdown = allDropdowns[0];
            if (allToggles.length > 0) menuToggle = allToggles[0];
        }
        
        if (menuDropdown) {
            if (isComercial) {
                // Ocultar el menú desplegable completo para usuarios comerciales
                menuDropdown.style.display = 'none';
                menuDropdown.style.visibility = 'hidden';
                menuDropdown.setAttribute('data-hidden-by-role', 'true');
                console.log('✅ [hideMenuDropdownByRole] Menú desplegable OCULTADO para usuario comercial');
            } else {
                // Mostrar el menú desplegable para admins
                menuDropdown.style.display = '';
                menuDropdown.style.visibility = '';
                menuDropdown.removeAttribute('data-hidden-by-role');
                console.log('✅ [hideMenuDropdownByRole] Menú desplegable VISIBLE para usuario admin');
            }
        } else {
            console.warn('⚠️ [hideMenuDropdownByRole] No se encontró el elemento .menu-dropdown');
            // Intentar buscar todos los elementos con esa clase
            const allDropdowns = document.querySelectorAll('.menu-dropdown');
            console.log('🔍 [hideMenuDropdownByRole] Elementos .menu-dropdown encontrados:', allDropdowns.length);
            if (allDropdowns.length > 0) {
                allDropdowns.forEach((dropdown, index) => {
                    console.log(`  - Dropdown ${index}:`, dropdown);
                    if (isComercial) {
                        dropdown.style.display = 'none';
                        dropdown.style.visibility = 'hidden';
                    }
                });
            }
        }

        // También ocultar el botón hamburguesa si es comercial
        if (menuToggle) {
            if (isComercial) {
                menuToggle.style.display = 'none';
                menuToggle.style.visibility = 'hidden';
                menuToggle.setAttribute('data-hidden-by-role', 'true');
                console.log('✅ [hideMenuDropdownByRole] Botón hamburguesa OCULTADO para usuario comercial');
            } else {
                menuToggle.style.display = '';
                menuToggle.style.visibility = '';
                menuToggle.removeAttribute('data-hidden-by-role');
                console.log('✅ [hideMenuDropdownByRole] Botón hamburguesa VISIBLE para usuario admin');
            }
        } else {
            console.warn('⚠️ [hideMenuDropdownByRole] No se encontró el elemento #menuToggle');
            // Intentar buscar el botón por clase
            const allToggles = document.querySelectorAll('button.menu-toggle, .menu-toggle');
            console.log('🔍 [hideMenuDropdownByRole] Botones toggle encontrados:', allToggles.length);
            if (allToggles.length > 0) {
                allToggles.forEach((toggle, index) => {
                    console.log(`  - Toggle ${index}:`, toggle);
                    if (isComercial) {
                        toggle.style.display = 'none';
                        toggle.style.visibility = 'hidden';
                    }
                });
            }
        }

    } catch (error) {
        console.error('❌ [hideMenuDropdownByRole] Error al ocultar menú desplegable:', error);
    } finally {
        // Asegurar que la bandera se resetee siempre
        setTimeout(() => {
            isHidingDropdown = false;
            console.log('✅ [hideMenuDropdownByRole] Ejecución completada y bandera reseteada');
        }, 100);
    }
}

// Ejecutar cuando el DOM esté listo y después de que los scripts se carguen
function initMenuDropdownHiding() {
    console.log('🚀 [initMenuDropdownHiding] Inicializando sistema de ocultación de menú...');
    
    const executeHiding = async () => {
        console.log('🔄 [initMenuDropdownHiding] Ejecutando verificación de rol...');
        
        // Esperar a que rolesManager esté disponible y autenticado
        let attempts = 0;
        const maxAttempts = 25; // 5 segundos máximo (200ms * 25)
        
        while (attempts < maxAttempts) {
            // Verificar que authManager y rolesManager estén disponibles
            if (window.authManager && window.rolesManager) {
                // Verificar que el usuario esté autenticado
                try {
                    const isAuth = await window.authManager.isAuthenticated();
                    if (isAuth) {
                        console.log('✅ [initMenuDropdownHiding] Usuario autenticado, ejecutando ocultación de menú...');
                        // Usuario autenticado, ejecutar ocultación
                        await hideMenuDropdownByRole();
                        return;
                    } else {
                        console.log('⏳ [initMenuDropdownHiding] Usuario no autenticado aún, esperando...');
                    }
                } catch (error) {
                    console.warn('⚠️ [initMenuDropdownHiding] Error verificando autenticación:', error);
                }
            } else {
                console.log('⏳ [initMenuDropdownHiding] Managers no disponibles aún, esperando...', {
                    authManager: !!window.authManager,
                    rolesManager: !!window.rolesManager
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        console.log('⚠️ [initMenuDropdownHiding] Timeout alcanzado, intentando ejecutar de todas formas...');
        
        // Si después de todos los intentos no se pudo, intentar una vez más
        if (window.rolesManager) {
            setTimeout(async () => {
                console.log('🔄 [initMenuDropdownHiding] Intento final de ocultación...');
                await hideMenuDropdownByRole();
            }, 1000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 [initMenuDropdownHiding] DOM cargado, esperando scripts...');
            // Esperar un poco más para que todos los scripts se carguen
            setTimeout(executeHiding, 1500);
        });
    } else {
        console.log('📄 [initMenuDropdownHiding] DOM ya listo, esperando scripts...');
        // DOM ya está listo, esperar a que los scripts se carguen
        setTimeout(executeHiding, 1500);
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
            window.authManager.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('🔄 [menu-hamburguesa] Cambio de estado de autenticación:', event);
                if (event === 'SIGNED_IN' && session) {
                    // El rol ya se carga en auth.js, solo esperar un momento para que el DOM esté listo
                    // y ejecutar la ocultación
                    setTimeout(async () => {
                        console.log('🔄 [menu-hamburguesa] Ejecutando ocultación después de SIGNED_IN...');
                        await hideMenuDropdownByRole();
                    }, 300); // Delay mínimo solo para asegurar que el DOM esté listo
                }
            });
            window.menuDropdownAuthListenerAdded = true;
            console.log('✅ [menu-hamburguesa] Listener de autenticación configurado');
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

// Ejecutar también cuando el rol se carga (evento personalizado) - INMEDIATAMENTE
document.addEventListener('roleLoaded', async (event) => {
    console.log('🔄 [menu-hamburguesa] Evento roleLoaded recibido, rol:', event.detail?.role);
    // Ejecutar inmediatamente, solo esperar un momento mínimo para el DOM
    setTimeout(async () => {
        console.log('🔄 [menu-hamburguesa] Ejecutando ocultación después de roleLoaded...');
        await hideMenuDropdownByRole();
    }, 100); // Delay mínimo solo para asegurar que el DOM esté listo
});




