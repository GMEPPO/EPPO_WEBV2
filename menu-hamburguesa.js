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
let hideMenuPromise = null; // Promise de la ejecución actual

/**
 * Ocultar el menú desplegable completo si el usuario es "comercial"
 */
async function hideMenuDropdownByRole() {
    // DEBUG: Stack trace para ver desde dónde se llama
    const stackTrace = new Error().stack;
    const callerInfo = stackTrace ? stackTrace.split('\n').slice(1, 4).join(' -> ') : 'N/A';
    console.log('🔍 [DEBUG] hideMenuDropdownByRole llamada desde:', callerInfo);
    console.log('🔍 [DEBUG] Estado actual:', {
        isHidingDropdown: isHidingDropdown,
        hasPromise: !!hideMenuPromise,
        lastRoleChecked: lastRoleChecked,
        timestamp: new Date().toISOString()
    });
    
    // Si ya hay una ejecución en curso, retornar la misma promise
    if (isHidingDropdown && hideMenuPromise) {
        console.log('⏳ [hideMenuDropdownByRole] Ejecución en curso, reutilizando promise...');
        console.log('🔍 [DEBUG] Esta llamada será ignorada (ya hay una ejecución activa)');
        return hideMenuPromise;
    }

    // Crear nueva promise para esta ejecución
    isHidingDropdown = true;
    hideMenuPromise = (async () => {
        console.log('🔍 [hideMenuDropdownByRole] Iniciando ejecución...');
        console.log('🔍 [DEBUG] Nueva ejecución iniciada, timestamp:', new Date().toISOString());

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
            return;
        }

        console.log('✅ [hideMenuDropdownByRole] rolesManager disponible');
        console.log('🔍 [DEBUG] rolesManager.isInitialized:', window.rolesManager.isInitialized);

        // Asegurar que el rol esté cargado (solo una vez)
        if (!window.rolesManager.isInitialized) {
            console.log('🔄 [hideMenuDropdownByRole] Inicializando rolesManager...');
            try {
                console.log('🔍 [DEBUG] Llamando rolesManager.initialize()...');
                await window.rolesManager.initialize();
                console.log('✅ [DEBUG] rolesManager inicializado correctamente');
                console.log('🔍 [DEBUG] Estado después de initialize:', {
                    isInitialized: window.rolesManager.isInitialized,
                    currentUserRole: window.rolesManager.currentUserRole,
                    isLoadingRole: window.rolesManager.isLoadingRole
                });
            } catch (error) {
                console.error('❌ [hideMenuDropdownByRole] Error inicializando rolesManager:', error);
                console.error('🔍 [DEBUG] Stack trace:', error.stack);
                console.error('🔍 [DEBUG] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                return;
            }
        } else {
            console.log('✅ [DEBUG] rolesManager ya estaba inicializado');
            console.log('🔍 [DEBUG] Estado actual:', {
                isInitialized: window.rolesManager.isInitialized,
                currentUserRole: window.rolesManager.currentUserRole,
                isLoadingRole: window.rolesManager.isLoadingRole
            });
        }
        
        // Esperar un momento para asegurar que el rol se haya cargado completamente
        console.log('🔍 [DEBUG] Esperando 200ms para asegurar que el rol esté cargado...');
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('✅ [DEBUG] Espera completada');
        
        console.log('🔍 [hideMenuDropdownByRole] Obteniendo rol del usuario...');
        console.log('🔍 [DEBUG] Llamando a getCurrentUserRole()...');
        
        // Obtener rol (usa caché, no hace consultas repetitivas)
        let role;
        let isComercial;
        try {
            console.log('🔍 [DEBUG] Estado antes de getCurrentUserRole:', {
                isInitialized: window.rolesManager.isInitialized,
                currentUserRole: window.rolesManager.currentUserRole,
                hasAuthManager: !!window.authManager,
                authManagerCurrentUser: window.authManager?.currentUser?.email
            });
            console.log('🔍 [DEBUG] Esperando respuesta de getCurrentUserRole()...');
            role = await window.rolesManager.getCurrentUserRole();
            console.log('✅ [DEBUG] getCurrentUserRole() retornó:', role);
            console.log('🔍 [DEBUG] Tipo de role:', typeof role);
            console.log('🔍 [DEBUG] Role es null/undefined:', role === null || role === undefined);
            isComercial = role === 'comercial';
            console.log('✅ [DEBUG] isComercial calculado:', isComercial);
            console.log('🔍 [DEBUG] Comparación role === "comercial":', role === 'comercial');
            console.log('🔍 [DEBUG] Comparación role === "admin":', role === 'admin');
        } catch (error) {
            console.error('❌ [DEBUG] Error obteniendo rol:', error);
            console.error('🔍 [DEBUG] Stack trace:', error.stack);
            console.error('🔍 [DEBUG] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            throw error; // Re-lanzar para que se capture en el catch externo
        }

        console.log('🔐 [hideMenuDropdownByRole] Rol detectado:', role, '| Es comercial:', isComercial);
        console.log('🔍 [DEBUG] Información del rol:', {
            role: role,
            isComercial: isComercial,
            lastRoleChecked: lastRoleChecked,
            roleChanged: lastRoleChecked !== role
        });
        
        // Si el rol no ha cambiado y ya aplicamos el estilo, verificar estado actual
        if (lastRoleChecked === role) {
            const menuDropdownCheck = document.querySelector('.menu-dropdown');
            if (menuDropdownCheck) {
                const computedDisplay = window.getComputedStyle(menuDropdownCheck).display;
                const computedVisibility = window.getComputedStyle(menuDropdownCheck).visibility;
                const inlineDisplay = menuDropdownCheck.style.display;
                const hasDataAttr = menuDropdownCheck.hasAttribute('data-hidden-by-role');
                const isHidden = computedDisplay === 'none' || hasDataAttr;
                
                console.log('🔍 [DEBUG] Verificación de estado actual del menú:', {
                    computedDisplay: computedDisplay,
                    computedVisibility: computedVisibility,
                    inlineDisplay: inlineDisplay,
                    hasDataAttr: hasDataAttr,
                    isHidden: isHidden,
                    shouldBeHidden: isComercial,
                    isCorrect: (isComercial && isHidden) || (!isComercial && !isHidden)
                });
                
                if ((isComercial && isHidden) || (!isComercial && !isHidden)) {
                    console.log('⏭️ [hideMenuDropdownByRole] El menú ya está en el estado correcto, saltando...');
                    return;
                } else {
                    console.warn('⚠️ [DEBUG] El menú NO está en el estado correcto!', {
                        expected: isComercial ? 'hidden' : 'visible',
                        actual: isHidden ? 'hidden' : 'visible',
                        action: 'Aplicando estilos de nuevo...'
                    });
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
        
        // DEBUG DETALLADO: Información de los elementos encontrados
        if (menuDropdown) {
            console.log('🔍 [DEBUG] Información del menuDropdown:', {
                tagName: menuDropdown.tagName,
                id: menuDropdown.id,
                className: menuDropdown.className,
                parentElement: menuDropdown.parentElement?.tagName,
                isConnected: menuDropdown.isConnected,
                offsetParent: menuDropdown.offsetParent !== null
            });
        } else {
            console.error('❌ [DEBUG] menuDropdown NO encontrado después de', domRetries, 'intentos');
            console.log('🔍 [DEBUG] Buscando todos los elementos posibles en el DOM...');
            const allElements = document.querySelectorAll('*');
            const dropdownCandidates = Array.from(allElements).filter(el => 
                el.className && el.className.includes('menu') && el.className.includes('dropdown')
            );
            console.log('  - Elementos con "menu" y "dropdown" en className:', dropdownCandidates.length);
            dropdownCandidates.forEach((el, idx) => {
                console.log(`    [${idx}]`, el.tagName, el.className, el.id);
            });
        }
        
        if (menuToggle) {
            console.log('🔍 [DEBUG] Información del menuToggle:', {
                tagName: menuToggle.tagName,
                id: menuToggle.id,
                className: menuToggle.className,
                parentElement: menuToggle.parentElement?.tagName,
                isConnected: menuToggle.isConnected,
                offsetParent: menuToggle.offsetParent !== null
            });
        } else {
            console.error('❌ [DEBUG] menuToggle NO encontrado después de', domRetries, 'intentos');
            console.log('🔍 [DEBUG] Buscando todos los botones posibles en el DOM...');
            const allButtons = document.querySelectorAll('button');
            const toggleCandidates = Array.from(allButtons).filter(btn => 
                btn.id === 'menuToggle' || 
                btn.className.includes('menu-toggle') || 
                btn.className.includes('menuToggle')
            );
            console.log('  - Botones candidatos:', toggleCandidates.length);
            toggleCandidates.forEach((btn, idx) => {
                console.log(`    [${idx}]`, btn.tagName, btn.className, btn.id);
            });
        }
        
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
            // DEBUG DETALLADO: Estado ANTES de aplicar estilos
            const beforeStyles = {
                display: window.getComputedStyle(menuDropdown).display,
                visibility: window.getComputedStyle(menuDropdown).visibility,
                inlineDisplay: menuDropdown.style.display,
                inlineVisibility: menuDropdown.style.visibility,
                hasDataAttr: menuDropdown.hasAttribute('data-hidden-by-role'),
                classes: menuDropdown.className,
                id: menuDropdown.id
            };
            console.log('🔍 [DEBUG] Estado ANTES de aplicar estilos:', beforeStyles);
            
            if (isComercial) {
                // Ocultar el menú desplegable completo para usuarios comerciales
                menuDropdown.style.setProperty('display', 'none', 'important');
                menuDropdown.style.setProperty('visibility', 'hidden', 'important');
                menuDropdown.setAttribute('data-hidden-by-role', 'true');
                
                // DEBUG DETALLADO: Estado DESPUÉS de aplicar estilos
                const afterStyles = {
                    display: window.getComputedStyle(menuDropdown).display,
                    visibility: window.getComputedStyle(menuDropdown).visibility,
                    inlineDisplay: menuDropdown.style.display,
                    inlineVisibility: menuDropdown.style.visibility,
                    hasDataAttr: menuDropdown.hasAttribute('data-hidden-by-role')
                };
                console.log('🔍 [DEBUG] Estado DESPUÉS de aplicar estilos:', afterStyles);
                
                // Verificar si realmente se ocultó
                if (afterStyles.display === 'none' && afterStyles.visibility === 'hidden') {
                    console.log('✅ [hideMenuDropdownByRole] Menú desplegable OCULTADO correctamente para usuario comercial');
                } else {
                    console.error('❌ [DEBUG] PROBLEMA: El menú NO se ocultó correctamente!', {
                        expected: { display: 'none', visibility: 'hidden' },
                        actual: { display: afterStyles.display, visibility: afterStyles.visibility },
                        possibleCause: 'CSS externo está sobrescribiendo los estilos'
                    });
                    
                    // Intentar con más fuerza
                    menuDropdown.style.cssText = 'display: none !important; visibility: hidden !important;';
                    const finalCheck = window.getComputedStyle(menuDropdown).display;
                    console.log('🔧 [DEBUG] Intento con !important, resultado:', finalCheck);
                }
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
                // DEBUG DETALLADO: Estado ANTES de aplicar estilos al botón
                const toggleBeforeStyles = {
                    display: window.getComputedStyle(menuToggle).display,
                    visibility: window.getComputedStyle(menuToggle).visibility,
                    inlineDisplay: menuToggle.style.display,
                    inlineVisibility: menuToggle.style.visibility,
                    hasDataAttr: menuToggle.hasAttribute('data-hidden-by-role'),
                    classes: menuToggle.className,
                    id: menuToggle.id
                };
                console.log('🔍 [DEBUG] Botón ANTES de aplicar estilos:', toggleBeforeStyles);
                
                menuToggle.style.setProperty('display', 'none', 'important');
                menuToggle.style.setProperty('visibility', 'hidden', 'important');
                menuToggle.setAttribute('data-hidden-by-role', 'true');
                
                // DEBUG DETALLADO: Estado DESPUÉS de aplicar estilos al botón
                const toggleAfterStyles = {
                    display: window.getComputedStyle(menuToggle).display,
                    visibility: window.getComputedStyle(menuToggle).visibility,
                    inlineDisplay: menuToggle.style.display,
                    inlineVisibility: menuToggle.style.visibility,
                    hasDataAttr: menuToggle.hasAttribute('data-hidden-by-role')
                };
                console.log('🔍 [DEBUG] Botón DESPUÉS de aplicar estilos:', toggleAfterStyles);
                
                // Verificar si realmente se ocultó
                if (toggleAfterStyles.display === 'none' && toggleAfterStyles.visibility === 'hidden') {
                    console.log('✅ [hideMenuDropdownByRole] Botón hamburguesa OCULTADO correctamente para usuario comercial');
                } else {
                    console.error('❌ [DEBUG] PROBLEMA: El botón NO se ocultó correctamente!', {
                        expected: { display: 'none', visibility: 'hidden' },
                        actual: { display: toggleAfterStyles.display, visibility: toggleAfterStyles.visibility }
                    });
                    
                    // Intentar con más fuerza
                    menuToggle.style.cssText = 'display: none !important; visibility: hidden !important;';
                    const finalToggleCheck = window.getComputedStyle(menuToggle).display;
                    console.log('🔧 [DEBUG] Intento con !important en botón, resultado:', finalToggleCheck);
                }
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
        console.error('🔍 [DEBUG] Stack trace del error:', error.stack);
    } finally {
        // DEBUG FINAL: Verificar estado final
        const finalMenuDropdown = document.querySelector('.menu-dropdown');
        const finalMenuToggle = document.getElementById('menuToggle');
        
        if (finalMenuDropdown) {
            const finalComputed = window.getComputedStyle(finalMenuDropdown);
            console.log('🔍 [DEBUG] Estado FINAL del menuDropdown:', {
                computedDisplay: finalComputed.display,
                computedVisibility: finalComputed.visibility,
                inlineDisplay: finalMenuDropdown.style.display,
                inlineVisibility: finalMenuDropdown.style.visibility,
                hasDataAttr: finalMenuDropdown.hasAttribute('data-hidden-by-role'),
                isVisible: finalComputed.display !== 'none' && finalComputed.visibility !== 'hidden'
            });
        }
        
        if (finalMenuToggle) {
            const finalToggleComputed = window.getComputedStyle(finalMenuToggle);
            console.log('🔍 [DEBUG] Estado FINAL del menuToggle:', {
                computedDisplay: finalToggleComputed.display,
                computedVisibility: finalToggleComputed.visibility,
                inlineDisplay: finalMenuToggle.style.display,
                inlineVisibility: finalMenuToggle.style.visibility,
                hasDataAttr: finalMenuToggle.hasAttribute('data-hidden-by-role'),
                isVisible: finalToggleComputed.display !== 'none' && finalToggleComputed.visibility !== 'hidden'
            });
        }
        
        // Resetear banderas
        isHidingDropdown = false;
        hideMenuPromise = null;
        console.log('✅ [hideMenuDropdownByRole] Ejecución completada');
    }
    })(); // Cerrar la promise
    
    return hideMenuPromise;
}

/**
 * Función de debug para verificar el estado del menú hamburguesa
 * Se puede llamar desde la consola: debugMenuHamburguesa()
 */
window.debugMenuHamburguesa = function() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 DEBUG COMPLETO DEL MENÚ HAMBURGUESA');
    console.log('═══════════════════════════════════════════════════════════');
    
    // 1. Verificar elementos del DOM
    const menuDropdown = document.querySelector('.menu-dropdown');
    const menuToggle = document.getElementById('menuToggle');
    
    console.log('1️⃣ ELEMENTOS DEL DOM:');
    console.log('   - menuDropdown encontrado:', !!menuDropdown);
    console.log('   - menuToggle encontrado:', !!menuToggle);
    
    if (menuDropdown) {
        console.log('   - menuDropdown info:', {
            tagName: menuDropdown.tagName,
            id: menuDropdown.id,
            className: menuDropdown.className,
            isConnected: menuDropdown.isConnected
        });
    }
    
    if (menuToggle) {
        console.log('   - menuToggle info:', {
            tagName: menuToggle.tagName,
            id: menuToggle.id,
            className: menuToggle.className,
            isConnected: menuToggle.isConnected
        });
    }
    
    // 2. Verificar estilos aplicados
    console.log('\n2️⃣ ESTILOS APLICADOS:');
    if (menuDropdown) {
        const computed = window.getComputedStyle(menuDropdown);
        console.log('   - menuDropdown estilos:', {
            display: computed.display,
            visibility: computed.visibility,
            inlineDisplay: menuDropdown.style.display,
            inlineVisibility: menuDropdown.style.visibility,
            hasDataAttr: menuDropdown.hasAttribute('data-hidden-by-role'),
            cssText: menuDropdown.style.cssText
        });
    }
    
    if (menuToggle) {
        const computed = window.getComputedStyle(menuToggle);
        console.log('   - menuToggle estilos:', {
            display: computed.display,
            visibility: computed.visibility,
            inlineDisplay: menuToggle.style.display,
            inlineVisibility: menuToggle.style.visibility,
            hasDataAttr: menuToggle.hasAttribute('data-hidden-by-role'),
            cssText: menuToggle.style.cssText
        });
    }
    
    // 3. Verificar rol del usuario
    console.log('\n3️⃣ ROL DEL USUARIO:');
    if (window.rolesManager) {
        (async () => {
            try {
                const role = await window.rolesManager.getCurrentUserRole();
                const isComercial = role === 'comercial';
                console.log('   - Rol:', role);
                console.log('   - Es comercial:', isComercial);
                console.log('   - Debería estar oculto:', isComercial);
                
                // 4. Verificar estado actual vs esperado
                console.log('\n4️⃣ ESTADO ACTUAL VS ESPERADO:');
                if (menuDropdown) {
                    const computed = window.getComputedStyle(menuDropdown);
                    const isHidden = computed.display === 'none' || computed.visibility === 'hidden';
                    const shouldBeHidden = isComercial;
                    const isCorrect = isHidden === shouldBeHidden;
                    
                    console.log('   - menuDropdown:', {
                        estáOculto: isHidden,
                        deberíaEstarOculto: shouldBeHidden,
                        esCorrecto: isCorrect,
                        problema: !isCorrect ? (shouldBeHidden ? 'Debería estar oculto pero está visible' : 'Debería estar visible pero está oculto') : 'Ninguno'
                    });
                }
                
                if (menuToggle) {
                    const computed = window.getComputedStyle(menuToggle);
                    const isHidden = computed.display === 'none' || computed.visibility === 'hidden';
                    const shouldBeHidden = isComercial;
                    const isCorrect = isHidden === shouldBeHidden;
                    
                    console.log('   - menuToggle:', {
                        estáOculto: isHidden,
                        deberíaEstarOculto: shouldBeHidden,
                        esCorrecto: isCorrect,
                        problema: !isCorrect ? (shouldBeHidden ? 'Debería estar oculto pero está visible' : 'Debería estar visible pero está oculto') : 'Ninguno'
                    });
                }
            } catch (error) {
                console.error('   - Error obteniendo rol:', error);
            }
        })();
    } else {
        console.warn('   - rolesManager no disponible');
    }
    
    // 5. Verificar ejecuciones
    console.log('\n5️⃣ ESTADO DE EJECUCIÓN:');
    console.log('   - isHidingDropdown:', isHidingDropdown);
    console.log('   - hideMenuPromise:', !!hideMenuPromise);
    console.log('   - lastRoleChecked:', lastRoleChecked);
    
    // 6. Buscar CSS que pueda estar interfiriendo
    console.log('\n6️⃣ CSS QUE PODRÍA INTERFERIR:');
    if (menuDropdown) {
        const allStyles = window.getComputedStyle(menuDropdown);
        console.log('   - Todos los estilos de menuDropdown:', {
            display: allStyles.display,
            visibility: allStyles.visibility,
            position: allStyles.position,
            zIndex: allStyles.zIndex
        });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💡 Para forzar la ocultación, ejecuta: window.hideMenuDropdownByRole()');
    console.log('═══════════════════════════════════════════════════════════');
};

// Ejecutar cuando el DOM esté listo y después de que los scripts se carguen
// NOTA: Esta función es un fallback. La ejecución principal ocurre en auth.js y roleLoaded event
function initMenuDropdownHiding() {
    console.log('🚀 [initMenuDropdownHiding] Inicializando sistema de ocultación de menú (fallback)...');
    
    const executeHiding = async () => {
        // Solo ejecutar si no hay una ejecución en curso y si el usuario está autenticado
        if (isHidingDropdown) {
            console.log('⏭️ [initMenuDropdownHiding] Ya hay una ejecución en curso, saltando...');
            return;
        }
        
        console.log('🔄 [initMenuDropdownHiding] Ejecutando verificación de rol...');
        
        // Esperar a que rolesManager esté disponible y autenticado
        let attempts = 0;
        const maxAttempts = 15; // 3 segundos máximo (200ms * 15)
        
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
                    }
                } catch (error) {
                    console.warn('⚠️ [initMenuDropdownHiding] Error verificando autenticación:', error);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        console.log('⏭️ [initMenuDropdownHiding] No se pudo verificar autenticación, saltando (otro handler se encargará)');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 [initMenuDropdownHiding] DOM cargado');
            // Esperar un poco para que los scripts se carguen
            setTimeout(executeHiding, 2000);
        });
    } else {
        console.log('📄 [initMenuDropdownHiding] DOM ya listo');
        // DOM ya está listo, esperar a que los scripts se carguen
        setTimeout(executeHiding, 2000);
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
                    // El rol ya se carga en auth.js y dispara roleLoaded
                    // Este listener es solo un fallback, no necesita hacer nada
                    // porque auth.js ya maneja la ocultación
                    console.log('✅ [menu-hamburguesa] SIGNED_IN detectado, auth.js se encargará de ocultar el menú');
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




