/**
 * Sistema de aviso de stock no actualizado
 * Muestra un aviso grande en todas las páginas cuando el stock no está actualizado para el día actual
 */

class StockWarningManager {
    constructor() {
        this.checkInterval = null;
        this.warningElement = null;
        this.isChecking = false;
        this.lastCheckDate = null;
    }

    /**
     * Inicializar el sistema de avisos
     */
    async init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startChecking());
        } else {
            this.startChecking();
        }
    }

    /**
     * Iniciar verificación periódica del stock
     */
    startChecking() {
        // Verificar inmediatamente
        this.checkStockStatus();
        
        // Verificar cada 5 minutos
        this.checkInterval = setInterval(() => {
            this.checkStockStatus();
        }, 5 * 60 * 1000); // 5 minutos
    }

    /**
     * Obtener cliente Supabase
     */
    async getSupabaseClient() {
        try {
            // Usar siempre el cliente compartido para evitar múltiples instancias
            if (window.universalSupabase) {
                return await window.universalSupabase.getClient();
            }
            return null;
        } catch (error) {
            // Error obteniendo cliente
            return null;
        }
    }

    /**
     * Verificar si el stock está actualizado para el día actual
     */
    async checkStockStatus() {
        // Evitar múltiples verificaciones simultáneas
        if (this.isChecking) return;
        
        this.isChecking = true;
        
        try {
            const client = await this.getSupabaseClient();
            if (!client) {
                // No se pudo obtener cliente para verificar stock
                this.isChecking = false;
                return;
            }

            // Obtener la fecha de hoy en formato YYYY-MM-DD
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStart = today.toISOString();
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            const todayEndISO = todayEnd.toISOString();

            // Verificar si hay AL MENOS UN registro con fecha_actualizacion del día actual
            const { data: todayRecords, error } = await client
                .from('stock_productos')
                .select('fecha_actualizacion')
                .gte('fecha_actualizacion', todayStart)
                .lte('fecha_actualizacion', todayEndISO)
                .limit(1);

            if (error) {
                // Si la tabla no existe o hay error, mostrar aviso por seguridad
                this.showWarning();
                this.isChecking = false;
                return;
            }

            // Si no hay ningún registro con fecha de hoy, mostrar aviso
            if (!todayRecords || todayRecords.length === 0) {
                this.showWarning();
            } else {
                // Stock actualizado para el día de hoy
                this.hideWarning();
            }

        } catch (error) {
            // En caso de error, mostrar aviso por seguridad
            this.showWarning();
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * Mostrar aviso de stock no actualizado
     */
    showWarning() {
        // No mostrar aviso en la página de actualización de stock
        if (window.location.pathname.includes('selector-productos.html')) {
            return;
        }

        // Si ya existe el aviso, no crear otro
        if (this.warningElement && document.body.contains(this.warningElement)) {
            return;
        }

        // Crear elemento de aviso
        this.warningElement = document.createElement('div');
        this.warningElement.id = 'stock-warning-banner';
        this.warningElement.className = 'stock-warning-banner';
        
        // Obtener traducciones según idioma
        const lang = this.getCurrentLanguage();
        const translations = this.getTranslations(lang);
        
        this.warningElement.innerHTML = `
            <div class="stock-warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span class="stock-warning-text">${translations.message}</span>
                <i class="fas fa-arrow-right"></i>
            </div>
        `;

        // Hacer clickeable para ir a la página de stock
        this.warningElement.addEventListener('click', () => {
            window.location.href = 'selector-productos.html';
        });

        // Añadir estilos si no existen
        this.addStyles();

        // Insertar al inicio del body
        document.body.insertBefore(this.warningElement, document.body.firstChild);
    }

    /**
     * Ocultar aviso de stock
     */
    hideWarning() {
        if (this.warningElement && document.body.contains(this.warningElement)) {
            this.warningElement.remove();
        }
    }

    /**
     * Obtener idioma actual
     */
    getCurrentLanguage() {
        // Intentar obtener del sistema de traducciones
        if (window.translationSystem && window.translationSystem.getCurrentLanguage) {
            return window.translationSystem.getCurrentLanguage();
        }
        // Fallback: leer del HTML o localStorage
        const htmlLang = document.documentElement.lang || 'pt';
        return htmlLang === 'es' ? 'es' : htmlLang === 'en' ? 'en' : 'pt';
    }

    /**
     * Obtener traducciones
     */
    getTranslations(lang) {
        const translations = {
            pt: {
                message: 'É necessário atualizar o stock do dia atual. Clique aqui para atualizar.'
            },
            es: {
                message: 'Es necesario actualizar el stock del día actual. Haga clic aquí para actualizar.'
            },
            en: {
                message: 'Stock needs to be updated for today. Click here to update.'
            }
        };
        return translations[lang] || translations.pt;
    }

    /**
     * Añadir estilos CSS para el aviso
     */
    addStyles() {
        // Verificar si los estilos ya existen
        if (document.getElementById('stock-warning-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'stock-warning-styles';
        style.textContent = `
            .stock-warning-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                transition: all 0.3s ease;
                animation: slideDown 0.5s ease;
            }

            .stock-warning-banner:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                transform: translateY(2px);
            }

            .stock-warning-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
            }

            .stock-warning-content i {
                font-size: 24px;
            }

            .stock-warning-text {
                flex: 1;
            }

            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            /* Ajustar contenido de la página para que no quede oculto bajo el banner */
            body:has(.stock-warning-banner) {
                padding-top: 80px;
            }

            /* Ajustar para páginas con menú fijo */
            body:has(.stock-warning-banner) .menu-hamburguesa,
            body:has(.stock-warning-banner) header {
                top: 80px;
            }

            /* Ajustar para elementos con position: fixed que necesiten espacio */
            body:has(.stock-warning-banner) [style*="position: fixed"] {
                top: 80px !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Crear instancia global
if (typeof window.stockWarningManager === 'undefined') {
    window.stockWarningManager = new StockWarningManager();
    window.stockWarningManager.init();
}

