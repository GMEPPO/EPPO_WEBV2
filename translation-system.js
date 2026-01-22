/**
 * Sistema de Traducción Automática para EPPO
 * Maneja traducciones de elementos comunes sin necesidad de múltiples idiomas en la base de datos
 */

class TranslationSystem {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'pt';
        this.translations = this.initializeTranslations();
    }

    /**
     * Inicializa todas las traducciones
     */
    initializeTranslations() {
        return {
            // Traducciones de colores
            colors: {
                black: { pt: 'Preto', es: 'Negro', en: 'Black' },
                white: { pt: 'Branco', es: 'Blanco', en: 'White' },
                silver: { pt: 'Prateado', es: 'Plateado', en: 'Silver' },
                gray: { pt: 'Cinza', es: 'Gris', en: 'Gray' },
                red: { pt: 'Vermelho', es: 'Rojo', en: 'Red' },
                blue: { pt: 'Azul', es: 'Azul', en: 'Blue' },
                green: { pt: 'Verde', es: 'Verde', en: 'Green' },
                yellow: { pt: 'Amarelo', es: 'Amarillo', en: 'Yellow' },
                orange: { pt: 'Laranja', es: 'Naranja', en: 'Orange' },
                pink: { pt: 'Rosa', es: 'Rosa', en: 'Pink' },
                brown: { pt: 'Marrom', es: 'Marrón', en: 'Brown' },
                purple: { pt: 'Roxo', es: 'Morado', en: 'Purple' }
            },

            // Traducciones de características técnicas
            technicalFeatures: {
                potencia: { pt: 'Potência', es: 'Potencia', en: 'Power' },
                voltaje: { pt: 'Voltagem', es: 'Voltaje', en: 'Voltage' },
                frecuencia: { pt: 'Frequência', es: 'Frecuencia', en: 'Frequency' },
                peso: { pt: 'Peso', es: 'Peso', en: 'Weight' },
                dimensiones: { pt: 'Dimensões', es: 'Dimensiones', en: 'Dimensions' },
                cable: { pt: 'Cabo', es: 'Cable', en: 'Cable' },
                velocidad: { pt: 'Velocidade', es: 'Velocidad', en: 'Speed' },
                temperatura: { pt: 'Temperatura', es: 'Temperatura', en: 'Temperature' },
                capacidad: { pt: 'Capacidade', es: 'Capacidad', en: 'Capacity' },
                garantia: { pt: 'Garantia', es: 'Garantía', en: 'Warranty' },
                material: { pt: 'Material', es: 'Material', en: 'Material' },
                tecnologia: { pt: 'Tecnologia', es: 'Tecnología', en: 'Technology' }
            },

            // Traducciones de tipos de productos
            productTypes: {
                suelto: { pt: 'Soltos', es: 'Suelto', en: 'Handheld' },
                pared: { pt: 'Parede', es: 'Pared', en: 'Wall-mounted' },
                inalambrico: { pt: 'Sem fio', es: 'Inalámbrico', en: 'Wireless' },
                vapor: { pt: 'Vapor', es: 'Vapor', en: 'Steam' },
                seco: { pt: 'Seco', es: 'Seco', en: 'Dry' },
                vertical: { pt: 'Vertical', es: 'Vertical', en: 'Vertical' },
                dobravel: { pt: 'Dobrável', es: 'Plegable', en: 'Foldable' },
                fijo: { pt: 'Fixo', es: 'Fijo', en: 'Fixed' },
                modular: { pt: 'Modular', es: 'Modular', en: 'Modular' },
                madera: { pt: 'Madeira', es: 'Madera', en: 'Wood' },
                metal: { pt: 'Metal', es: 'Metal', en: 'Metal' },
                tela: { pt: 'Tecido', es: 'Tela', en: 'Fabric' },
                plastico: { pt: 'Plástico', es: 'Plástico', en: 'Plastic' }
            },

            // Traducciones de características específicas
            features: {
                ionica: { pt: 'Iônica', es: 'Iónica', en: 'Ionic' },
                ceramica: { pt: 'Cerâmica', es: 'Cerámica', en: 'Ceramic' },
                infrarroja: { pt: 'Infravermelha', es: 'Infrarroja', en: 'Infrared' },
                anti_calcario: { pt: 'Anti-calcário', es: 'Anti-calcáreo', en: 'Anti-limescale' },
                auto_apagado: { pt: 'Auto-desligamento', es: 'Auto-apagado', en: 'Auto-shutoff' },
                vapor_continuo: { pt: 'Vapor contínuo', es: 'Vapor continuo', en: 'Continuous steam' },
                vapor_impulso: { pt: 'Vapor de impulso', es: 'Vapor de impulso', en: 'Steam burst' },
                led_display: { pt: 'Display LED', es: 'Pantalla LED', en: 'LED display' },
                ergonomico: { pt: 'Ergonômico', es: 'Ergonómico', en: 'Ergonomic' },
                plegable: { pt: 'Dobrável', es: 'Plegable', en: 'Foldable' },
                resistente_agua: { pt: 'Resistente à água', es: 'Resistente al agua', en: 'Water resistant' },
                resistente_rayones: { pt: 'Resistente a arranhões', es: 'Resistente a rayones', en: 'Scratch resistant' },
                candado_tsa: { pt: 'Cadeado TSA', es: 'Candado TSA', en: 'TSA lock' },
                asa_retractil: { pt: 'Alça retrátil', es: 'Asa retráctil', en: 'Retractable handle' },
                asa_lateral: { pt: 'Alça lateral', es: 'Asa lateral', en: 'Side handle' },
                filtro_aire: { pt: 'Filtro de ar', es: 'Filtro de aire', en: 'Air filter' },
                concentrador_aire: { pt: 'Concentrador de ar', es: 'Concentrador de aire', en: 'Air concentrator' },
                difusor: { pt: 'Difusor', es: 'Difusor', en: 'Diffuser' }
            },

            // Traducciones de unidades
            units: {
                watts: { pt: 'W', es: 'W', en: 'W' },
                volts: { pt: 'V', es: 'V', en: 'V' },
                hertz: { pt: 'Hz', es: 'Hz', en: 'Hz' },
                celsius: { pt: '°C', es: '°C', en: '°C' },
                kilograms: { pt: 'kg', es: 'kg', en: 'kg' },
                liters: { pt: 'L', es: 'L', en: 'L' },
                meters: { pt: 'm', es: 'm', en: 'm' },
                centimeters: { pt: 'cm', es: 'cm', en: 'cm' },
                grams: { pt: 'g', es: 'g', en: 'g' },
                minutes: { pt: 'min', es: 'min', en: 'min' },
                months: { pt: 'meses', es: 'meses', en: 'months' }
            },

            // Traducciones de interfaz común
            ui: {
                precio: { pt: 'Preço', es: 'Precio', en: 'Price' },
                categoria: { pt: 'Categoria', es: 'Categoría', en: 'Category' },
                filtros: { pt: 'Filtros', es: 'Filtros', en: 'Filters' },
                buscar: { pt: 'Buscar', es: 'Buscar', en: 'Search' },
                limpiar: { pt: 'Limpar', es: 'Limpiar', en: 'Clear' },
                aplicar: { pt: 'Aplicar', es: 'Aplicar', en: 'Apply' },
                comparar: { pt: 'Comparar', es: 'Comparar', en: 'Compare' },
                ver_detalles: { pt: 'Ver detalhes', es: 'Ver detalles', en: 'View details' },
                agregar_comparacion: { pt: 'Adicionar à comparação', es: 'Agregar a comparación', en: 'Add to comparison' },
                quitar_comparacion: { pt: 'Remover da comparação', es: 'Quitar de comparación', en: 'Remove from comparison' },
                sin_productos: { pt: 'Nenhum produto encontrado', es: 'No se encontraron productos', en: 'No products found' },
                cargando: { pt: 'Carregando...', es: 'Cargando...', en: 'Loading...' },
                agregar: { pt: 'Adicionar', es: 'Agregar', en: 'Add' },
                // Traducciones de ordenamiento
                sortDefault: { pt: 'Predefinido', es: 'Predeterminado', en: 'Default' },
                sortPriceAsc: { pt: 'Preço: menor a maior', es: 'Precio: menor a mayor', en: 'Price: low to high' },
                sortPriceDesc: { pt: 'Preço: maior a menor', es: 'Precio: mayor a menor', en: 'Price: high to low' },
                sortCategory: { pt: 'Categoria', es: 'Categoría', en: 'Category' }
            }
        };
    }

    /**
     * Traduce un valor según el idioma actual
     * @param {string} category - Categoría de traducción (colors, features, etc.)
     * @param {string} key - Clave a traducir
     * @returns {string} - Valor traducido
     */
    translate(category, key) {
        if (!this.translations[category] || !this.translations[category][key]) {
            return key; // Retorna la clave original si no encuentra traducción
        }
        return this.translations[category][key][this.currentLanguage] || key;
    }

    /**
     * Traduce un color
     * @param {string} color - Color en inglés
     * @returns {string} - Color traducido
     */
    translateColor(color) {
        if (!color) return '';
        return this.translate('colors', color.toLowerCase());
    }

    /**
     * Traduce una característica técnica
     * @param {string} feature - Característica en inglés
     * @returns {string} - Característica traducida
     */
    translateFeature(feature) {
        if (!feature) return '';
        return this.translate('features', feature.toLowerCase());
    }

    /**
     * Traduce un tipo de producto
     * @param {string} type - Tipo en inglés
     * @returns {string} - Tipo traducido
     */
    translateType(type) {
        if (!type) return '';
        return this.translate('productTypes', type.toLowerCase());
    }

    /**
     * Traduce una característica técnica
     * @param {string} technical - Característica técnica en inglés
     * @returns {string} - Característica traducida
     */
    translateTechnical(technical) {
        if (!technical) return '';
        return this.translate('technicalFeatures', technical.toLowerCase());
    }

    /**
     * Traduce texto de interfaz
     * @param {string} uiText - Texto de interfaz en inglés
     * @returns {string} - Texto traducido
     */
    translateUI(uiText) {
        if (!uiText) return '';
        return this.translate('ui', uiText.toLowerCase());
    }

    /**
     * Cambia el idioma actual
     * @param {string} lang - Código del idioma (pt, es, en)
     */
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
    }

    /**
     * Obtiene el idioma actual
     * @returns {string} - Código del idioma actual
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Traduce un array de características
     * @param {Array} features - Array de características
     * @returns {Array} - Array de características traducidas
     */
    translateFeaturesArray(features) {
        if (!Array.isArray(features)) return [];
        return features.map(feature => this.translateFeature(feature));
    }

    /**
     * Traduce un objeto de producto completo
     * @param {Object} product - Objeto del producto
     * @returns {Object} - Producto con elementos traducidos
     */
    translateProduct(product) {
        if (!product) return product;

        const translatedProduct = { ...product };

        // Traducir color
        if (product.color) {
            translatedProduct.colorTranslated = this.translateColor(product.color);
        }

        // Traducir tipo
        if (product.tipo) {
            translatedProduct.tipoTranslated = this.translateType(product.tipo);
        }

        // Traducir características
        if (product.features && Array.isArray(product.features)) {
            translatedProduct.featuresTranslated = this.translateFeaturesArray(product.features);
        }

        // Traducir descripción según el idioma
        if (product[`descripcion_${this.currentLanguage}`]) {
            translatedProduct.descripcion = product[`descripcion_${this.currentLanguage}`];
        }

        return translatedProduct;
    }
}

// Crear instancia global
window.translationSystem = new TranslationSystem();

// Función global para cambiar idioma (unificada)
// Esta función debe ser llamada desde todas las páginas
window.changeLanguage = function(lang) {
    if (!lang) return;
    
    // Actualizar el sistema de traducción
    if (window.translationSystem) {
        window.translationSystem.setLanguage(lang);
    }
    
    // Actualizar atributo lang del HTML
    document.documentElement.lang = lang;
    
    // Guardar en localStorage
    localStorage.setItem('language', lang);
    
    // Actualizar banderas activas
    document.querySelectorAll('.flag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const langButton = document.querySelector(`[data-lang="${lang}"]`);
    if (langButton) {
        langButton.classList.add('active');
    }
    
    // Actualizar elementos de navegación inmediatamente
    updateNavigationElements(lang);
    
    // Disparar evento personalizado para que otras partes de la aplicación reaccionen
    window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: lang } 
    }));
    
    console.log('🌐 Idioma cambiado a:', lang);
};

// Función para actualizar elementos de navegación en todas las páginas
function updateNavigationElements(lang) {
    const navTranslations = {
        pt: {
            budget: 'Orçamento',
            history: 'Histórico',
            createProduct: 'Criador/Editor',
            home: 'Home',
            products: 'Products',
            compare: 'Comparar'
        },
        es: {
            budget: 'Presupuesto',
            history: 'Histórico',
            createProduct: 'Creador/Editor',
            home: 'Home',
            products: 'Products',
            compare: 'Comparar'
        },
        en: {
            budget: 'Budget',
            history: 'History',
            createProduct: 'Creator/Editor',
            home: 'Home',
            products: 'Products',
            compare: 'Compare'
        }
    };
    
    const t = navTranslations[lang] || navTranslations.pt;
    
    // Actualizar enlaces de navegación
    const cartLink = document.getElementById('nav-cart-link');
    const proposalsLink = document.getElementById('nav-proposals-link');
    const createProductLink = document.getElementById('create-product-text');
    const homeLink = document.querySelector('a[href="index.html"].nav-link');
    const productsLink = document.querySelector('a[href="productos-dinamico.html"].nav-link');
    const compareLinks = document.querySelectorAll('a[href="comparar-productos.html"]');
    
    if (cartLink) cartLink.textContent = t.budget;
    if (proposalsLink) {
        // Ahora es un link directo, no tiene span dentro
        proposalsLink.textContent = t.history;
    }
    if (createProductLink) createProductLink.textContent = t.createProduct;
    if (homeLink) homeLink.textContent = t.home;
    if (productsLink) productsLink.textContent = t.products;
    
    // Actualizar links de comparar en el dropdown
    compareLinks.forEach(link => {
        const span = link.querySelector('span');
        if (span) span.textContent = t.compare;
    });
}

// Escuchar cambios de idioma globalmente
window.addEventListener('languageChanged', function(event) {
    const lang = event.detail.language;
    updateNavigationElements(lang);
});

// Inicializar idioma al cargar
document.addEventListener('DOMContentLoaded', function() {
    const savedLanguage = localStorage.getItem('language') || 'pt';
    window.translationSystem.setLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    
    // Activar bandera correcta
    document.querySelectorAll('.flag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeButton = document.querySelector(`[data-lang="${savedLanguage}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Actualizar elementos de navegación
    updateNavigationElements(savedLanguage);
});











