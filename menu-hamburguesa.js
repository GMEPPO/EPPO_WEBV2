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
        // Esperar a que rolesManager esté inicializado
        if (!window.rolesManager) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!window.rolesManager) {
            console.warn('rolesManager no disponible');
            return;
        }

        const role = await window.rolesManager.getCurrentUserRole();
        const isAdmin = role === 'admin';

        // Ocultar "Comparar" si no es admin
        const compararLinks = document.querySelectorAll('a[href="comparar-productos.html"]');
        compararLinks.forEach(link => {
            if (!isAdmin) {
                link.style.display = 'none';
            } else {
                link.style.display = '';
            }
        });

        // Ocultar "Creador/Editor" (selector-productos.html) si no es admin
        const creadorLinks = document.querySelectorAll('a[href="selector-productos.html"]');
        creadorLinks.forEach(link => {
            if (!isAdmin) {
                link.style.display = 'none';
            } else {
                link.style.display = '';
            }
        });

        // También ocultar por ID si existe
        const navCreateProductLink = document.getElementById('nav-create-product-link');
        if (navCreateProductLink && !isAdmin) {
            navCreateProductLink.style.display = 'none';
        }

    } catch (error) {
        console.error('Error al ocultar elementos del menú:', error);
    }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideMenuItemsByRole);
} else {
    // DOM ya está listo
    hideMenuItemsByRole();
}




