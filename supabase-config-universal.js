/**
 * 🔧 CONFIGURACIÓN UNIVERSAL DE SUPABASE
 * 
 * Este archivo proporciona una configuración robusta de Supabase
 * que funciona en todos los entornos: local, Netlify, y otras plataformas.
 */

// Variable para almacenar la configuración cargada desde la API
let configFromAPI = null;
let configLoadPromise = null;

/**
 * Detectar si estamos en desarrollo local
 */
function isLocalDevelopment() {
    if (typeof window === 'undefined') return false;
    const location = window.location;
    return location.protocol === 'file:' || 
           location.hostname === 'localhost' || 
           location.hostname === '127.0.0.1' ||
           location.hostname === '';
}

/**
 * Cargar configuración desde API de Vercel (solo en producción)
 */
async function loadConfigFromAPI() {
    // No intentar cargar desde API si estamos en desarrollo local
    if (isLocalDevelopment()) {
        return null;
    }

    if (configLoadPromise) {
        return configLoadPromise;
    }

    configLoadPromise = (async () => {
        try {
            // Intentar cargar desde API de Vercel
            const response = await fetch('/api/config');
            if (response.ok) {
                const data = await response.json();
                configFromAPI = data;
                return data;
            }
        } catch (error) {
            // API no disponible, continuar con otros métodos
            console.log('ℹ️ API de configuración no disponible, usando otros métodos');
        }
        return null;
    })();

    return configLoadPromise;
}

function readEnvVariable(key) {
    try {
        // 1. Variables inyectadas manualmente en window (para desarrollo local con config.local.js)
        if (typeof window !== 'undefined' && window && window[key]) {
            return window[key];
        }

        // 2. Variables agrupadas en window.__ENV__ u objetos similares
        if (typeof window !== 'undefined' && window && window.__ENV__ && window.__ENV__[key]) {
            return window.__ENV__[key];
        }

        // 3. Configuración cargada desde API (para Vercel)
        if (configFromAPI) {
            if (key === 'VITE_SUPABASE_URL' || key === 'SUPABASE_URL') {
                return configFromAPI.url;
            }
            if (key === 'VITE_SUPABASE_ANON_KEY' || key === 'SUPABASE_ANON_KEY') {
                return configFromAPI.anonKey;
            }
        }

        // 4. Entornos con process.env (Netlify, Node, Vercel, etc.)
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }

        // 5. Vercel inyecta variables en window durante el build
        // Intentar leer también sin prefijo VITE_ para compatibilidad con Vercel
        if (key.startsWith('VITE_')) {
            const keyWithoutPrefix = key.replace('VITE_', '');
            if (typeof process !== 'undefined' && process.env && process.env[keyWithoutPrefix]) {
                return process.env[keyWithoutPrefix];
            }
            if (typeof window !== 'undefined' && window && window[keyWithoutPrefix]) {
                return window[keyWithoutPrefix];
            }
        }
    } catch (error) {
        // Variable de entorno no disponible
    }
    return null;
}

// Configuración base de Supabase
if (typeof window.SUPABASE_CONFIG === 'undefined') {
    // Esperar un momento para que config.local.js se cargue si existe
    // (solo en desarrollo local)
    const initConfig = () => {
        // Intentar leer configuración
        let supabaseUrl = readEnvVariable('VITE_SUPABASE_URL');
        let supabaseAnonKey = readEnvVariable('VITE_SUPABASE_ANON_KEY');
        
        // Si tenemos configuración, usarla inmediatamente
        if (supabaseUrl && supabaseAnonKey) {
            window.SUPABASE_CONFIG = {
                url: supabaseUrl,
                anonKey: supabaseAnonKey
            };
            return;
        }
        
        // Si no están disponibles y NO estamos en desarrollo local, intentar cargar desde API (para Vercel)
        if (!isLocalDevelopment()) {
            loadConfigFromAPI().then(data => {
                if (data) {
                    window.SUPABASE_CONFIG = {
                        url: data.url,
                        anonKey: data.anonKey
                    };
                    // Disparar evento para notificar que la configuración está lista
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('supabase-config-ready'));
                    }
                } else {
                    // Si la API tampoco funciona, mostrar error
                    console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
                    console.error('Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
                    console.error('En producción (Vercel): configura las variables en Vercel Dashboard → Settings → Environment Variables');
                }
            }).catch(error => {
                console.error('Error al cargar configuración desde API:', error);
            });
        } else {
            // En desarrollo local, mostrar error si no se encontró config.local.js
            console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
            console.error('Por favor, crea un archivo config.local.js con estas variables:');
            console.error('  window.VITE_SUPABASE_URL = "https://tu-proyecto.supabase.co";');
            console.error('  window.VITE_SUPABASE_ANON_KEY = "tu-api-key-aqui";');
        }
    };
    
    // En desarrollo local, esperar un momento para que config.local.js se cargue
    if (isLocalDevelopment()) {
        setTimeout(initConfig, 100);
    } else {
        initConfig();
    }
}
// Usar window.SUPABASE_CONFIG directamente o crear variable solo si no existe
var SUPABASE_CONFIG = window.SUPABASE_CONFIG;

/**
 * 🔧 Cliente Supabase con configuración optimizada
 */
// Evitar redeclaración si la clase ya existe
if (typeof UniversalSupabaseClient === 'undefined') {
    var UniversalSupabaseClient = class UniversalSupabaseClient {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    /**
     * Inicializar cliente Supabase
     */
    async initialize() {
        // Si ya está inicializado, retornar el cliente existente
        if (this.isInitialized && this.client) {
            return this.client;
        }

        try {
            // Verificar que la biblioteca esté disponible
            if (typeof supabase === 'undefined') {
                throw new Error('Error de configuración: La biblioteca requerida no está disponible.');
            }

            // Esperar a que la configuración esté disponible
            let config = window.SUPABASE_CONFIG;
            if (!config) {
                // Si no está disponible, esperar a que se cargue desde API
                await new Promise((resolve) => {
                    if (window.SUPABASE_CONFIG) {
                        resolve();
                    } else {
                        window.addEventListener('supabase-config-ready', resolve, { once: true });
                        // Timeout de seguridad
                        setTimeout(resolve, 5000);
                    }
                });
                config = window.SUPABASE_CONFIG;
            }

            if (!config || !config.url || !config.anonKey) {
                throw new Error('Configuración de Supabase no disponible. Verifica las variables de entorno.');
            }

            // Si ya existe un cliente, reutilizarlo para evitar múltiples instancias
            if (this.client && this.client.auth) {
                console.log('ℹ️ Reutilizando cliente Supabase existente');
                this.isInitialized = true;
                return this.client;
            }

            // Crear cliente con configuración optimizada
            // Usar una clave de almacenamiento única para evitar conflictos
            const storageKey = `sb-${config.url.split('//')[1]?.split('.')[0] || 'default'}-auth-token`;
            this.client = supabase.createClient(config.url, config.anonKey, {
                auth: {
                    persistSession: true, // Persistir sesión para mantener login entre recargas
                    autoRefreshToken: true, // Refrescar token automáticamente
                    detectSessionInUrl: true, // Detectar sesión en URL (para callbacks)
                    storageKey: storageKey, // Clave única para evitar conflictos
                    storage: window.localStorage // Usar localStorage explícitamente
                },
                global: {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                },
                db: {
                    schema: 'public'
                },
                realtime: {
                    enabled: false // Deshabilitar realtime para mejor rendimiento
                }
            });

            // Test de conexión (solo si no estamos en file://)
            if (window.location.protocol !== 'file:') {
                try {
                    await this.testConnection();
                } catch (error) {
                    console.warn('⚠️ Error en test de conexión (continuando):', error);
                }
            }
            
            this.isInitialized = true;
            
            return this.client;
            
        } catch (error) {
            // Error silenciado por seguridad
            throw error;
        }
    }

    /**
     * Test de conexión básica
     */
    async testConnection() {
        try {
            // Test de conexión usando la tabla 'products' que siempre debe existir
            const { data, error } = await this.client
                .from('products')
                .select('id')
                .limit(1);

            if (error) {
                throw new Error(`Error de conexión: ${error.message}`);
            }

            // Test de conexión exitoso
            return true;
            
        } catch (error) {
            // Error en test de conexión
            throw error;
        }
    }

    /**
     * Obtener cliente (inicializar si es necesario)
     */
    async getClient() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.client;
    }

    /**
     * Cargar productos con reintentos automáticos
     * Ahora usa solo la tabla 'products' unificada
     */
    async loadProducts() {
        const client = await this.getClient();
        const allProducts = [];

        try {
            const { data, error } = await client
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Reintentar si no hemos alcanzado el máximo
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
                    return this.loadProducts();
                }
                return allProducts;
            }

            if (data && data.length > 0) {
                // Los productos ya tienen su categoría en el campo 'category' o 'categoria'
                data.forEach(product => {
                    allProducts.push({
                        ...product,
                        categoria: product.category || product.categoria || 'general'
                    });
                });
            }
            
        } catch (error) {
            // Reintentar si no hemos alcanzado el máximo
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
                return this.loadProducts();
            }
        }
        return allProducts;
    }

    /**
     * Obtener información de configuración
     */
    getConfig() {
        return {
            isInitialized: this.isInitialized,
            retryCount: this.retryCount
        };
    }
    }; // Fin de la clase
} // Fin del if

// Crear instancia solo si no existe
if (typeof universalSupabase === 'undefined') {
    var universalSupabase = new UniversalSupabaseClient();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UniversalSupabaseClient, universalSupabase, SUPABASE_CONFIG };
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
    if (typeof window.UniversalSupabaseClient === 'undefined') {
        window.UniversalSupabaseClient = UniversalSupabaseClient;
    }
    if (typeof window.universalSupabase === 'undefined') {
        window.universalSupabase = universalSupabase;
    }
    if (typeof window.SUPABASE_CONFIG === 'undefined') {
        window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    }
}

// Auto-inicializar si estamos en el navegador
// Nota: La inicialización se hará cuando se llame explícitamente desde otros scripts
// para evitar problemas de orden de carga

