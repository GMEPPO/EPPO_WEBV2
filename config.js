/**
 * 🔧 API ENDPOINT PARA CONFIGURACIÓN DE SUPABASE
 * 
 * Este endpoint devuelve las variables de entorno de Supabase
 * configuradas en Vercel. Solo devuelve la anon key (pública y segura).
 * 
 * IMPORTANTE: Este endpoint es público y solo devuelve la anon key,
 * que está diseñada para ser usada en el frontend.
 * 
 * Formato para Vercel Serverless Functions
 */

module.exports = function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo permitir GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Obtener variables de entorno de Vercel
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Validar que existan
    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ 
            error: 'Variables de entorno no configuradas',
            message: 'Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel Dashboard'
        });
    }

    // Devolver configuración (solo anon key, que es pública)
    return res.status(200).json({
        url: supabaseUrl,
        anonKey: supabaseAnonKey
    });
}

