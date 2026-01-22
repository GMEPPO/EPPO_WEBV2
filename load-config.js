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
    const script = document.createElement('script');
    script.src = 'config.local.js';
    script.async = false; // Cargar de forma síncrona para que esté disponible antes
    
    script.onerror = function() {
        // config.local.js no existe, esto es normal en producción
        // Las variables se cargarán desde las variables de entorno
        console.log('ℹ️ config.local.js no encontrado. Usando variables de entorno de la plataforma.');
    };
    
    script.onload = function() {
        console.log('✅ Configuración local cargada desde config.local.js');
    };
    
    document.head.appendChild(script);
})();

