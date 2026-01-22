/**
 * 🔧 CARGADOR DE CONFIGURACIÓN LOCAL
 * 
 * Este script carga config.local.js si existe (para desarrollo local)
 * Debe cargarse ANTES de supabase-config-universal.js
 * 
 * En producción, las variables se cargan desde las variables de entorno
 * de la plataforma (Netlify/Vercel)
 * 
 * INSTRUCCIONES:
 * 1. Copia config.local.example.js y renómbralo a config.local.js
 * 2. Completa con tus credenciales reales de Supabase
 * 3. El archivo config.local.js está en .gitignore y NO se subirá a GitHub
 */

(function() {
    // Intentar cargar config.local.js solo en desarrollo local
    // Este archivo NO debe existir en producción
    
    // Detectar si estamos en desarrollo local
    const isLocal = window.location.protocol === 'file:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';
    
    // Detectar si estamos usando file:// (no recomendado)
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (isFileProtocol) {
        // Si está usando file://, mostrar advertencia y usar método asíncrono
        console.warn('⚠️ Estás usando file:// protocol. Usa un servidor HTTP local para mejor compatibilidad.');
        console.warn('💡 Ejecuta: python -m http.server 8000');
        console.warn('💡 Luego abre: http://localhost:8000');
        
        // Intentar cargar de forma asíncrona (puede fallar con file://)
        const script = document.createElement('script');
        script.src = 'config.local.js';
        script.async = false;
        
        script.onerror = function() {
            console.log('ℹ️ config.local.js no encontrado o no se puede cargar con file://');
            console.log('💡 Usa un servidor HTTP local (python -m http.server 8000)');
        };
        
        script.onload = function() {
            console.log('✅ Configuración local cargada desde config.local.js');
        };
        
        document.head.appendChild(script);
    } else if (isLocal) {
        // En desarrollo local con HTTP (localhost), cargar de forma asíncrona
        const script = document.createElement('script');
        script.src = 'config.local.js';
        script.async = false;
        
        script.onerror = function() {
            console.log('ℹ️ config.local.js no encontrado. Crea el archivo para desarrollo local.');
        };
        
        script.onload = function() {
            console.log('✅ Configuración local cargada desde config.local.js');
        };
        
        document.head.appendChild(script);
    } else {
        // En producción, no intentar cargar config.local.js
        console.log('ℹ️ Modo producción: usando variables de entorno de la plataforma.');
    }
})();

