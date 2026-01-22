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
 * Ocultar opciones del menú según el rol del usuario
 * DESACTIVADO: Sistema de roles eliminado - todos los usuarios tienen acceso completo
 */
async function hideMenuItemsByRole() {
    // Función desactivada - no oculta ningún elemento del menú
    console.log('ℹ️ Sistema de roles desactivado - todos los elementos del menú están visibles');
    
    // Asegurar que todos los elementos del menú estén visibles
    const allMenuLinks = document.querySelectorAll('a[href*="comparar-productos"], a[href*="selector-productos"], #nav-create-product-link');
    allMenuLinks.forEach(link => {
        link.style.display = '';
        link.style.visibility = '';
        link.removeAttribute('data-hidden-by-role');
    });
    
    return;
}

// Sistema de roles desactivado - no se ejecuta ninguna inicialización
// Todos los usuarios tienen acceso completo a todas las funciones




