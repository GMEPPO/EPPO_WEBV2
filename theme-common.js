/**
 * Script común del tema: la aplicación usa siempre tema oscuro.
 * (El botón de cambio claro/oscuro fue eliminado.)
 */

function initTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});




