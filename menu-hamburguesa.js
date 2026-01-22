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
    console.log('🔍 [hideMenuDropdownByRole] Iniciando ejecución...');
    
    // Evitar ejecuciones múltiples simultáneas (pero permitir si han pasado más de 1 segundo)
    const now = Date.now();
    if (isHidingDropdown) {
        console.log('⏸️ [hideMenuDropdownByRole] Ya hay una ejecución en curso, esperando...');
        return;
    }
    
    // Permitir ejecución si han pasado más de 1 segundo desde la última
    if ((now - lastDropdownHide) < 1000 && lastDropdownHide > 0) {
        console.log('⏸️ [hideMenuDropdownByRole] Cooldown activo, esperando...');
        return;
    }

    isHidingDropdown = true;
    lastDropdownHide = now;

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

        // Esperar un momento para asegurar que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 100));

        // Obtener el contenedor del menú desplegable y el botón hamburguesa
        const menuDropdown = document.querySelector('.menu-dropdown');
        const menuToggle = document.getElementById('menuToggle');
        
        console.log('🔍 [hideMenuDropdownByRole] Elementos encontrados:', {
            menuDropdown: !!menuDropdown,
            menuToggle: !!menuToggle
        });
        
        if (menuDropdown) {
            if (isComercial) {
                // Ocultar el menú desplegable completo para usuarios comerciales
                menuDropdown.style.display = 'none';
                menuDropdown.style.visibility = 'hidden';
                console.log('✅ [hideMenuDropdownByRole] Menú desplegable OCULTADO para usuario comercial');
            } else {
                // Mostrar el menú desplegable para admins
                menuDropdown.style.display = '';
                menuDropdown.style.visibility = '';
                console.log('✅ [hideMenuDropdownByRole] Menú desplegable VISIBLE para usuario admin');
            }
        } else {
            console.warn('⚠️ [hideMenuDropdownByRole] No se encontró el elemento .menu-dropdown');
            // Intentar buscar todos los elementos con esa clase
            const allDropdowns = document.querySelectorAll('.menu-dropdown');
            console.log('🔍 [hideMenuDropdownByRole] Elementos .menu-dropdown encontrados:', allDropdowns.length);
        }

        // También ocultar el botón hamburguesa si es comercial
        if (menuToggle) {
            if (isComercial) {
                menuToggle.style.display = 'none';
                menuToggle.style.visibility = 'hidden';
                console.log('✅ [hideMenuDropdownByRole] Botón hamburguesa OCULTADO para usuario comercial');
            } else {
                menuToggle.style.display = '';
                menuToggle.style.visibility = '';
                console.log('✅ [hideMenuDropdownByRole] Botón hamburguesa VISIBLE para usuario admin');
            }
        } else {
            console.warn('⚠️ [hideMenuDropdownByRole] No se encontró el elemento #menuToggle');
        }

    } catch (error) {
        console.error('❌ [hideMenuDropdownByRole] Error al ocultar menú desplegable:', error);
    } finally {
        isHidingDropdown = false;
        console.log('✅ [hideMenuDropdownByRole] Ejecución completada');
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




