/**
 * 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA VERCEL
 * 
 * Este archivo se genera automáticamente durante el deploy en Vercel
 * usando las variables de entorno configuradas en el dashboard.
 * 
 * IMPORTANTE: Este archivo NO debe contener credenciales hardcodeadas.
 * Las variables se inyectan desde Vercel durante el build.
 * 
 * Para desarrollo local, usa config.local.js en su lugar.
 */

// En Vercel, las variables de entorno están disponibles en process.env durante el build
// Para aplicaciones estáticas, necesitamos inyectarlas en window
(function() {
    // Intentar leer desde variables de entorno de Vercel
    // Estas se inyectan durante el build si están configuradas
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.VITE_SUPABASE_URL) {
            window.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
        }
        if (process.env.VITE_SUPABASE_ANON_KEY) {
            window.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
        }
        // También sin prefijo VITE_
        if (process.env.SUPABASE_URL) {
            window.VITE_SUPABASE_URL = process.env.SUPABASE_URL;
        }
        if (process.env.SUPABASE_ANON_KEY) {
            window.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
        }
    }
})();

