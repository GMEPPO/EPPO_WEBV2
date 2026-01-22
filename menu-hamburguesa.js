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
 * Ocultar opciones del menú según el rol del usuario
 * Solo admin puede ver "Comparar" y "Creador/Editor"
 */
async function hideMenuItemsByRole() {
    try {
        // Esperar a que authManager y rolesManager estén inicializados
        let retries = 0;
        const maxRetries = 10;
        
        while ((!window.authManager || !window.rolesManager) && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        if (!window.rolesManager) {
            console.warn('rolesManager no disponible después de esperar');
            return;
        }

        // Asegurar que el rol esté cargado
        await window.rolesManager.initialize();
        const role = await window.rolesManager.getCurrentUserRole();
        const isAdmin = role === 'admin';

        console.log('🔐 Rol del usuario:', role, '| Es admin:', isAdmin);

        // Ocultar "Comparar" si no es admin
        const compararLinks = document.querySelectorAll('a[href="comparar-productos.html"]');
        compararLinks.forEach(link => {
            if (!isAdmin) {
                link.style.display = 'none';
                console.log('✅ Ocultado: Comparar');
            } else {
                link.style.display = '';
            }
        });

        // Ocultar "Creador/Editor" (selector-productos.html) si no es admin
        const creadorLinks = document.querySelectorAll('a[href="selector-productos.html"]');
        creadorLinks.forEach(link => {
            if (!isAdmin) {
                link.style.display = 'none';
                console.log('✅ Ocultado: Creador/Editor');
            } else {
                link.style.display = '';
            }
        });

        // También ocultar por ID si existe
        const navCreateProductLink = document.getElementById('nav-create-product-link');
        if (navCreateProductLink) {
            if (!isAdmin) {
                navCreateProductLink.style.display = 'none';
                console.log('✅ Ocultado: nav-create-product-link');
            } else {
                navCreateProductLink.style.display = '';
            }
        }

    } catch (error) {
        console.error('Error al ocultar elementos del menú:', error);
    }
}

// Ejecutar cuando el DOM esté listo y después de que los scripts se carguen
function initMenuRoleHiding() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar un poco más para que todos los scripts se carguen
            setTimeout(hideMenuItemsByRole, 500);
        });
    } else {
        // DOM ya está listo, esperar a que los scripts se carguen
        setTimeout(hideMenuItemsByRole, 500);
    }
}

// Inicializar
initMenuRoleHiding();

// También ejecutar cuando cambie el estado de autenticación
if (window.authManager) {
    window.authManager.supabase?.auth.onAuthStateChange(() => {
        setTimeout(hideMenuItemsByRole, 300);
    });
}




