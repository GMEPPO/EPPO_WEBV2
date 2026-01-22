/**
 * Script común para el manejo del tema (claro/oscuro)
 * Funciones reutilizables para todas las páginas
 */

// Función para cambiar tema
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        toggleButton.setAttribute('title', newTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
}

// Función para inicializar el tema
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        toggleButton.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleTheme);
    }
    
    // Escuchar cambios en las preferencias del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
        }
    });
});




