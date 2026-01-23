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

        // NO inicializar rolesManager aquí - auth.js ya lo hace
        // Solo esperar a que el rol esté disponible (evitar consultas duplicadas)
        console.log('🔍 [disableMenuForComercial] Esperando a que el rol esté disponible...');
        console.log('🔍 [DEBUG] Estado inicial:', {
            isInitialized: window.rolesManager.isInitialized,
            currentUserRole: window.rolesManager.currentUserRole,
            isLoadingRole: window.rolesManager.isLoadingRole,
            hasRoleLoadPromise: !!window.rolesManager.roleLoadPromise
        });

        let role = null;
        
        // Primero verificar si el rol ya está en caché
        if (window.rolesManager.currentUserRole) {
            role = window.rolesManager.currentUserRole;
            console.log('✅ [disableMenuForComercial] Rol encontrado en caché:', role);
        }
        // Si hay una carga en curso, esperar a que termine
        else if (window.rolesManager.roleLoadPromise) {
            console.log('⏳ [disableMenuForComercial] Rol se está cargando, esperando a que termine...');
            try {
                role = await window.rolesManager.roleLoadPromise;
                console.log('✅ [disableMenuForComercial] Carga de rol completada:', role);
            } catch (error) {
                console.warn('⚠️ [disableMenuForComercial] Error esperando carga de rol:', error);
            }
        }
        // Si no hay carga en curso y no está inicializado, esperar un momento
        // (auth.js debería estar cargándolo)
        else if (!window.rolesManager.isInitialized) {
            console.log('⏳ [disableMenuForComercial] rolesManager no inicializado, esperando a que auth.js lo inicialice...');
            let retries = 0;
            const maxRetries = 15;
            while (!window.rolesManager.isInitialized && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 200));
                retries++;
            }
            // Después de esperar, intentar obtener el rol
            if (window.rolesManager.currentUserRole) {
                role = window.rolesManager.currentUserRole;
            } else if (window.rolesManager.roleLoadPromise) {
                role = await window.rolesManager.roleLoadPromise;
            }
        }
        
        // Solo si aún no tenemos el rol y no hay carga en curso, obtenerlo
        if (!role && !window.rolesManager.isLoadingRole) {
            console.log('🔍 [disableMenuForComercial] Obteniendo rol del usuario...');
            role = await window.rolesManager.getCurrentUserRole();
        }
        
        // Si el rol aún es null o undefined, esperar un poco más y reintentar
        let roleRetries = 0;
        const maxRoleRetries = 15;
        while ((!role || role === null || role === undefined) && roleRetries < maxRoleRetries) {
            console.log(`⏳ [disableMenuForComercial] Rol aún no disponible (intento ${roleRetries + 1}/${maxRoleRetries}), esperando...`);
            console.log('🔍 [DEBUG] Estado actual:', {
                currentUserRole: window.rolesManager.currentUserRole,
                isLoadingRole: window.rolesManager.isLoadingRole,
                hasRoleLoadPromise: !!window.rolesManager.roleLoadPromise
            });
            await new Promise(resolve => setTimeout(resolve, 300));
            role = await window.rolesManager.getCurrentUserRole();
            roleRetries++;
        }

        if (!role || role === null || role === undefined) {
            console.warn('⚠️ [disableMenuForComercial] No se pudo obtener el rol después de múltiples intentos');
            console.log('✅ [disableMenuForComercial] No se puede deshabilitar el menú sin conocer el rol, saliendo...');
            return; // Salir sin deshabilitar si no podemos obtener el rol
        }

        console.log('✅ [disableMenuForComercial] Rol obtenido:', role);
        console.log('🔍 [DEBUG] Estado después de getCurrentUserRole:', {
            role: role,
            currentUserRole: window.rolesManager.currentUserRole,
            isLoadingRole: window.rolesManager.isLoadingRole,
            tipo: typeof role
        });

        const isComercial = role === 'comercial';
        console.log('🔍 [DEBUG] isComercial:', isComercial);
        console.log('🔍 [DEBUG] Rol completo:', role);

        // IMPORTANTE: Solo deshabilitar si es comercial, NO si es admin u otro rol
        if (!isComercial) {
            console.log('✅ [disableMenuForComercial] Usuario NO es comercial (rol:', role, '), menú HABILITADO');
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

// SOLO ejecutar cuando el rol se carga (evento disparado por auth.js)
// Esto evita múltiples consultas duplicadas
if (!window.roleLoadedListenerAdded) {
    document.addEventListener('roleLoaded', async (event) => {
        console.log('🔄 [menu-hamburguesa] Evento roleLoaded recibido, ejecutando disableMenuForComercial...');
        // Esperar un momento para asegurar que el DOM esté listo
        setTimeout(async () => {
            await disableMenuForComercial();
        }, 300);
    });
    window.roleLoadedListenerAdded = true;
    console.log('✅ [menu-hamburguesa] Listener de roleLoaded configurado');
}
