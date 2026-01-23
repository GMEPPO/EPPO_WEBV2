// Configuración de campos por categoría (copiada de admin-productos.js para uso en filtros)
const categoryFieldsConfig = {
    secadores: [
        { id: 'potencia', label: 'Potencia (W)', type: 'number', placeholder: 'Ej. 1800', required: true },
        { id: 'color', label: 'Color', type: 'text', placeholder: 'Ej. negro, blanco', required: true },
        { id: 'garantia', label: 'Garantía (años)', type: 'number', placeholder: 'Ej. 2', required: true },
        { id: 'tecnologia_iones', label: 'Tecnología de iones', type: 'select', options: [{value: '', label: 'Selecciona...'}, {value: 'si', label: 'Sí'}, {value: 'no', label: 'No'}], required: true },
        { id: 'difusor', label: 'Difusor', type: 'select', options: [{value: '', label: 'Selecciona...'}, {value: 'si', label: 'Sí'}, {value: 'no', label: 'No'}], required: true },
        { id: 'niveles_temperatura', label: 'Niveles de temperatura', type: 'text', placeholder: 'Ej. 3 niveles', required: true },
        { id: 'niveles_velocidad', label: 'Niveles de velocidad de flujo de aire', type: 'text', placeholder: 'Ej. 2 velocidades', required: true },
        { id: 'aire_frio_caliente', label: 'Aire frío y caliente o aire caliente solamente', type: 'select', options: [{value: '', label: 'Selecciona...'}, {value: 'frio_caliente', label: 'Aire frío y caliente'}, {value: 'solo_caliente', label: 'Aire caliente solamente'}], required: true },
        { id: 'filtro', label: 'Filtro', type: 'select', options: [{value: '', label: 'Selecciona...'}, {value: 'si', label: 'Sí'}, {value: 'no', label: 'No'}, {value: 'removible', label: 'Sí, removible'}], required: true }
    ],
    planchas: [
        { id: 'potencia', label: 'Potencia (W)', type: 'number', placeholder: 'Ej. 1800', required: true },
        { id: 'color', label: 'Color', type: 'text', placeholder: 'Ej. negro, blanco', required: true },
        { id: 'garantia', label: 'Garantía (años)', type: 'number', placeholder: 'Ej. 2', required: true },
        { id: 'vapor_seco', label: 'A vapor o seco', type: 'select', options: [{value: '', label: 'Selecciona...'}, {value: 'vapor', label: 'A vapor'}, {value: 'seco', label: 'Seco'}, {value: 'ambos', label: 'Ambos'}], required: true },
        { id: 'dimensiones', label: 'Dimensiones (largo × ancho × altura en cm)', type: 'text', placeholder: 'Ej. 12 × 20 × 5', required: true }
    ],
    'tablas-planchar': [
        { id: 'color', label: 'Color', type: 'text', placeholder: 'Ej. negro, blanco', required: true },
        { id: 'garantia', label: 'Garantía (años)', type: 'number', placeholder: 'Ej. 2', required: true },
        { id: 'dimensiones', label: 'Dimensiones', type: 'text', placeholder: 'Ej. 120 × 40 × 95 cm', required: true }
    ],
    'porta-malas': [
        { id: 'color', label: 'Color', type: 'text', placeholder: 'Ej. negro, plata', required: true },
        { id: 'garantia', label: 'Garantía (años)', type: 'number', placeholder: 'Ej. 2', required: true },
        { id: 'dimensiones', label: 'Dimensiones', type: 'text', placeholder: 'Ej. 80 × 50 × 30 cm', required: true },
        { id: 'material', label: 'Material', type: 'text', placeholder: 'Ej. Aluminio, Acero', required: true }
    ]
};

// Sistema dinámico de productos que carga desde Supabase
class DynamicProductsPage {
    constructor() {
        this.currentLanguage = 'pt';
        
        // Detectar categoría desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        
        // Mapear categorías de URL a nombres internos (incluye alias comunes)
        const categoryMap = {
            'secadores': 'secadores',
            'planchas': 'planchas',
            'planchado': 'planchas',
            'tablas-planchar': 'tablas-planchar',
            'porta-malas': 'porta-malas',
            'portamaletas': 'porta-malas',
            'paraguas': 'paraguas',
            'guarda-chuvas': 'guarda-chuvas'
        };
        
        // Si hay categoría en URL, usar esa categoría (del mapa si existe, o directamente si no)
        // (se actualizará después de cargar los productos)
        const initialCategories = categoryParam 
            ? [categoryMap[categoryParam] || categoryParam] 
            : []; // Vacío inicialmente, se llenará con todas las categorías disponibles
        
        this.filters = {
            categories: initialCategories,
            maxPrice: 200,
            powers: [],
            colors: [],
            types: [],
            technologies: [],
            // Filtros dinámicos basados en campos de categoría
            dynamicFilters: {},
            // Búsqueda de texto
            searchTerm: ''
        };
        this.allProducts = [];
        this.loadedProducts = false;
        this.supabase = null;
        this.defaultCategories = initialCategories;
        this.currentQuantity = 1;
        this.lastFilteredProducts = [];
        this.selectedCategoryFromUrl = categoryParam ? (categoryMap[categoryParam] || categoryParam) : null;
        this.categoryFieldsConfig = categoryFieldsConfig;
        this.homeCategories = []; // Categorías cargadas desde home_categories
        this.currentSort = 'default'; // Ordenamiento actual: default, price-asc, price-desc, category, name
        this.dynamicFilterFields = new Map(); // Almacenar campos de filtros dinámicos para traducciones
        // NO llamar init() aquí - se llamará desde el listener de DOMContentLoaded
        // Esto evita inicializaciones múltiples
    }

    async init() {
        try {
            // Resetear flags
            this.creatingDynamicFilters = false;
            this.skipDynamicFiltersOnInit = false;
            
            // OCULTAR FILTROS ESTÁTICOS INMEDIATAMENTE para evitar que aparezcan brevemente
            this.hideStaticFiltersImmediately();
            
            await this.initializeSupabase();
            
            // Cargar categorías SIN crear filtros dinámicos aún (los productos no están cargados)
            this.skipDynamicFiltersOnInit = true;
            await this.loadHomeCategories(); // Cargar categorías para el filtro
            this.skipDynamicFiltersOnInit = false;
            
            // Cargar productos
            await this.loadProductsFromSupabase();
            
            // Configurar event listeners de filtros
            this.setupEventListeners();
            this.setupPriceRange();
            
            // Esperar a que los productos estén completamente cargados
            await this.waitForProducts();
            
            // Mostrar productos filtrados PRIMERO
            if (this.loadedProducts && this.allProducts.length > 0) {
                    this.applyFilters();
            } else {
                // No hay productos disponibles
                this.displayProducts([]);
            }
            
            this.setupLanguageSelector();
            this.updateSearchPlaceholder();
            
            // FORZAR creación de filtros dinámicos DESPUÉS de todo lo demás
            // Esto es especialmente importante cuando viene una categoría desde URL
            if (this.filters.categories.length > 0 && this.allProducts.length > 0) {
                // Resetear el flag para asegurar que se puedan crear
                this.creatingDynamicFilters = false;
                
                // Pequeño delay para asegurar que el DOM esté listo
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Llamar directamente a createDynamicFilters en lugar de updateDynamicFilters
                await this.forceDynamicFiltersCreation();
            }
            
        } catch (error) {
            this.showErrorMessage();
        }
    }
    
    /**
     * Forzar la creación de filtros dinámicos
     * Se usa cuando se navega desde la página de inicio con una categoría preseleccionada
     */
    async forceDynamicFiltersCreation() {
        // IMPORTANTE: Asegurar que this.filters existe
        if (!this.filters) {
            this.filters = {
                categories: [],
                maxPrice: 200,
                powers: [],
                colors: [],
                types: [],
                technologies: [],
                dynamicFilters: {}
            };
        }
        if (!this.filters.dynamicFilters) {
            this.filters.dynamicFilters = {};
        }
        
        // Verificar que haya categorías y productos
        if (!this.filters.categories || this.filters.categories.length === 0) {
            return;
        }
        
        if (!this.allProducts || this.allProducts.length === 0) {
            return;
        }
        
        // Verificar el contenedor
        const dynamicContainer = document.getElementById('dynamic-filters-container');
        if (!dynamicContainer) {
            return;
        }
        
        // Si ya hay filtros dinámicos creados, no hacer nada
        const existingFilters = dynamicContainer.querySelectorAll('.dynamic-filter-section');
        if (existingFilters.length > 0) {
            return;
        }
        
        // Limpiar contenedor y resetear flag
        dynamicContainer.innerHTML = '';
        this.creatingDynamicFilters = false;
        
        // Crear los filtros
        await this.createDynamicFilters();
        
        // Verificar si se crearon
        const newFilters = dynamicContainer.querySelectorAll('.dynamic-filter-section');
    }

    /**
     * Esperar a que los productos estén completamente cargados
     */
    async waitForProducts(maxWait = 3000) {
        const startTime = Date.now();
        
        while (!this.loadedProducts || this.allProducts.length === 0) {
            if (Date.now() - startTime > maxWait) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
    }

    async initializeSupabase() {
        // Usar configuración universal si está disponible
        if (typeof window !== 'undefined' && window.universalSupabase) {
            this.supabase = await window.universalSupabase.getClient();
            return;
        }

        // Usar siempre el cliente compartido para evitar múltiples instancias
        if (window.universalSupabase) {
            this.supabase = await window.universalSupabase.getClient();
        } else {
            // Esperar un momento para que universalSupabase se inicialice
            await new Promise(resolve => setTimeout(resolve, 200));
            if (window.universalSupabase) {
                this.supabase = await window.universalSupabase.getClient();
            } else {
                throw new Error('Error de configuración: La biblioteca requerida no está disponible.');
            }
        }
    }

    async loadHomeCategories() {
        try {
            if (!this.supabase) {
                return;
            }

            const { data, error } = await this.supabase
                .from('categorias_geral')
                .select('*')
                .eq('tipo', 'home')
                .eq('is_active', true)
                .order('orden', { ascending: true });

            if (error) {
                return;
            }

            this.homeCategories = data || [];
            
            // Renderizar categorías en los filtros
            this.renderCategoryFilters();
        } catch (error) {
            // Error al cargar categorías
        }
    }

    renderCategoryFilters() {
        const container = document.getElementById('category-filters-container');
        if (!container) {
            return;
        }

        if (!this.homeCategories || this.homeCategories.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay categorías disponibles.</p>';
            return;
        }


        const currentLang = this.currentLanguage || localStorage.getItem('language') || 'pt';
        
        // IMPORTANTE: Usar las categorías que ya vienen configuradas desde el constructor
        // o desde selectedCategoryFromUrl
        let categoriesToUse = [...this.filters.categories];
        
        // Si hay categoría desde URL y no está en categoriesToUse, agregarla
        if (this.selectedCategoryFromUrl) {
            const matchingCategory = this.homeCategories.find(cat => {
                const normalizedName = this.normalizeCategoryName(cat.nombre_es);
                return normalizedName === this.selectedCategoryFromUrl || 
                       normalizedName.includes(this.selectedCategoryFromUrl) ||
                       this.selectedCategoryFromUrl.includes(normalizedName);
            });
            
            if (matchingCategory) {
                const categoryValue = this.normalizeCategoryName(matchingCategory.nombre_es);
                if (!categoriesToUse.includes(categoryValue)) {
                    categoriesToUse = [categoryValue];
                }
            }
        }
        
        const selectedCategories = new Set(categoriesToUse);
        
        let html = '';
        this.homeCategories.forEach((category, index) => {
            const nombre = currentLang === 'es' ? category.nombre_es : 
                          currentLang === 'pt' ? category.nombre_pt : 
                          currentLang === 'en' ? (category.nombre_en || category.nombre_es) :
                          category.nombre_es;

            const categoryValue = this.normalizeCategoryName(category.nombre_es);
            const iconClass = this.getCategoryIcon(categoryValue);
            const isChecked = selectedCategories.has(categoryValue) || 
                           (selectedCategories.size === 0 && index === 0);

            html += `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${categoryValue}" ${isChecked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    <i class="${iconClass}"></i>
                    <span>${nombre}</span>
                </label>
            `;
        });

        container.innerHTML = html;

        // Actualizar this.filters.categories con las categorías seleccionadas
        this.filters.categories = Array.from(selectedCategories);
        
        // Si no hay ninguna seleccionada, usar la primera
        if (this.filters.categories.length === 0 && this.homeCategories.length > 0) {
            const firstCategoryValue = this.normalizeCategoryName(this.homeCategories[0].nombre_es);
            this.filters.categories = [firstCategoryValue];
            // Marcar el checkbox
            const firstCheckbox = container.querySelector(`input[value="${firstCategoryValue}"]`);
            if (firstCheckbox) {
                firstCheckbox.checked = true;
            }
        }
        
        // Cargar filtros dinámicos para las categorías seleccionadas
        // PERO solo si no estamos en la inicialización (los productos deben estar cargados primero)
        if (!this.skipDynamicFiltersOnInit) {
        this.updateDynamicFilters();
        }
    }

    /**
     * Normalizar nombre de categoría a un valor consistente
     * Usa la misma lógica que en admin-productos.js
     */
    normalizeCategoryName(categoryName) {
        if (!categoryName) return '';
        return categoryName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    getCategoryIcon(categoryValue) {
        // Mapear valores de categoría a iconos
        const iconMap = {
            'secadores': 'fas fa-wind',
            'planchas': 'fas fa-tshirt',
            'planchado': 'fas fa-tshirt',
            'passar-a-ferro': 'fas fa-tshirt',
            'tablas-planchar': 'fas fa-table',
            'tablas-de-planchar': 'fas fa-table',
            'porta-malas': 'fas fa-suitcase',
            'portamaletas': 'fas fa-suitcase'
        };

        // Buscar coincidencia parcial
        for (const [key, icon] of Object.entries(iconMap)) {
            if (categoryValue.includes(key) || key.includes(categoryValue)) {
                return icon;
            }
        }

        // Icono por defecto
        return 'fas fa-tag';
    }

    async loadProductsFromSupabase() {
        try {

            if (!this.supabase) {
                throw new Error('Cliente Supabase no inicializado');
            }

            // Cargar productos visibles desde Supabase
            // Mostrar productos con visible_en_catalogo = true o null (compatibilidad con productos antiguos)
            let data = null;
            let error = null;
            
            try {
                // Obtener país del usuario para filtrar productos
                let userPais = null;
                try {
                    userPais = await window.getUserPais?.();
                } catch (error) {
                    console.warn('⚠️ No se pudo obtener el país del usuario:', error);
                }

                // Filtrar SOLO productos con visible_en_catalogo = true o null
                // Los productos con visible_en_catalogo = false NO deben aparecer
                // Excluir productos asociados a clientes específicos (cliente_id IS NULL)
                let query = this.supabase
                    .from('products')
                    .select('*')
                    .or('visible_en_catalogo.eq.true,visible_en_catalogo.is.null')
                    .is('cliente_id', null); // Solo productos generales, no asociados a clientes
                
                // Filtrar productos según el país del usuario
                // Si el usuario es de España, solo mostrar productos con mercado = 'AMBOS'
                // Si el usuario es de Portugal, mostrar todos los productos
                if (userPais && (userPais === 'Espanha' || userPais === 'España' || userPais === 'ES')) {
                    query = query.eq('mercado', 'AMBOS');
                    console.log('🇪🇸 [loadProductsFromSupabase] Usuario de España detectado, filtrando productos con mercado = AMBOS');
                } else {
                    // Portugal o sin país: mostrar todos los productos
                    console.log('🇵🇹 [loadProductsFromSupabase] Usuario de Portugal o sin país, mostrando todos los productos');
                }
                
                const result = await query
                    .order('created_at', { ascending: false });
                
                data = result.data;
                error = result.error;
                
                if (data) {
                    // Verificar que no hay productos con false (no deberían aparecer por el filtro)
                    const productosConFalse = data.filter(p => p.visible_en_catalogo === false);
                    if (productosConFalse.length > 0) {
                        // Filtrar manualmente para asegurar que no aparezcan
                        data = data.filter(p => p.visible_en_catalogo !== false);
                    }
                }
                
                if (error) {
                    // Si hay error (probablemente porque la columna no existe), cargar todos los productos
                    const allResult = await this.supabase
                        .from('products')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (allResult.error) {
                        throw allResult.error;
                    }
                    
                    // Filtrar manualmente - SOLO mostrar productos con visible_en_catalogo = true o null
                    data = (allResult.data || []).filter(product => {
                        // Si el campo no existe o es null, mostrar el producto (compatibilidad con productos antiguos)
                        if (!('visible_en_catalogo' in product) || product.visible_en_catalogo === null || product.visible_en_catalogo === undefined) {
                            return true;
                        }
                        // Si el campo existe, mostrar SOLO si es true (excluir false)
                        return product.visible_en_catalogo === true;
                    });
                    
                }
            } catch (e) {
                throw e;
            }
            
            if (error && !data) {
                throw error;
            }

            // Función auxiliar para normalizar categoría (usar fuera del map para evitar problemas con 'this')
            const normalizeCategory = (categoryName) => {
                if (!categoryName) return 'sin-categoria';
                return categoryName.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
            };
            
            const normalizedProducts = (data || []).map(product => {
                // PRIORIDAD 1: Leer de la columna category_fields (JSONB) si existe
                let structuredData = {};
                if (product.category_fields && typeof product.category_fields === 'object') {
                    // Si es un objeto JSONB, usarlo directamente
                    structuredData = product.category_fields;
                } else if (typeof product.category_fields === 'string') {
                    // Si es un string, intentar parsearlo
                    try {
                        structuredData = JSON.parse(product.category_fields);
                    } catch (e) {
                    }
                }
                
                // Parsear visible_fields (JSONB) si existe
                if (product.visible_fields) {
                    if (typeof product.visible_fields === 'string') {
                        // Si es un string, intentar parsearlo
                        try {
                            product.visible_fields = JSON.parse(product.visible_fields);
                        } catch (e) {
                            product.visible_fields = [];
                        }
                    } else if (Array.isArray(product.visible_fields)) {
                        // Ya es un array, usar directamente
                        // Asegurar que cada elemento sea un objeto válido
                        product.visible_fields = product.visible_fields.map((field, idx) => {
                            // Si el elemento es un string que parece JSON (empieza con { o "), parsearlo
                            if (typeof field === 'string' && (field.startsWith('{') || field.startsWith('"'))) {
                                try {
                                    const parsed = JSON.parse(field);
                                    return parsed;
                                } catch (e) {
                                    // Si falla el parsing, tratar como field_id simple
                                    return { field_id: field };
                                }
                            } else if (typeof field === 'string') {
                                // Formato antiguo: solo field_id, convertir a objeto
                                return { field_id: field };
                            } else if (typeof field === 'object' && field !== null) {
                                // Formato nuevo: objeto con field_id, label_es, label_pt
                                return field;
                            }
                            return null;
                        }).filter(Boolean);
                    }
                }
                
                // PRIORIDAD 2: Si no hay datos en category_fields, extraer del campo caracteristicas (compatibilidad con productos antiguos)
                if (Object.keys(structuredData).length === 0 && product.caracteristicas) {
                    try {
                        const structuredMatch = product.caracteristicas.match(/\[DATOS ESTRUCTURADOS\]([\s\S]*)/);
                        if (structuredMatch) {
                            structuredData = JSON.parse(structuredMatch[1]);
                        }
                    } catch (e) {
                    }
                }
                
                // Normalizar la categoría del producto para que coincida con los filtros
                let normalizedCategoria = product.categoria || 'sin-categoria';
                // Si la categoría no está normalizada, intentar normalizarla
                // Pero primero verificar si ya está normalizada (no tiene espacios ni caracteres especiales)
                if (normalizedCategoria && normalizedCategoria !== 'sin-categoria') {
                    // Si tiene espacios o caracteres especiales, normalizarla
                    if (/\s|[^a-z0-9-]/.test(normalizedCategoria)) {
                        normalizedCategoria = normalizeCategory(normalizedCategoria);
                    }
                }
                
                // Buscar potencia en múltiples ubicaciones
                let potenciaValue = product.potencia;
                if (potenciaValue === null || potenciaValue === undefined) {
                    // Buscar en categoryFields/structuredData
                    potenciaValue = structuredData?.potencia || 
                                   structuredData?.power || 
                                   structuredData?.potencia_secadores ||
                                   null;
                }
                
                return {
                    ...product,
                    categoria: normalizedCategoria,
                    categoriaOriginal: product.categoria, // Guardar original para referencia
                    precio: product.precio !== null && product.precio !== undefined ? Number(product.precio) : 0,
                    potencia: potenciaValue !== null && potenciaValue !== undefined ? Number(potenciaValue) : null,
                    features: Array.isArray(product.features) ? product.features : [],
                    price_tiers: Array.isArray(product.price_tiers) ? product.price_tiers : [],
                    brand: product.brand || '',
                    tipo: product.tipo || '',
                    color: product.color || null,
                    nombre_fornecedor: product.nombre_fornecedor || null,
                    // Agregar datos estructurados para filtrado
                    categoryFields: structuredData || {}
                };
            });

            this.allProducts = normalizedProducts;
            const availableCategories = [...new Set(normalizedProducts.map(p => p.categoria))];
            if (availableCategories.length === 0) {
                availableCategories.push('secadores');
            }
            
            this.loadedProducts = true;
            
            if (this.allProducts.length === 0) {
                this.displayProducts([]);
            } else {
                // Mostrar todos los productos directamente
                this.applyFilters();
            }
            
        } catch (error) {
            // Error al cargar productos
            this.allProducts = [];
            this.loadedProducts = true;
            this.showErrorMessage(`Error: ${error.message}`);
        }
    }

    showLoadingMessage(message) {
        const productsHeader = document.querySelector('.products-header');
        if (productsHeader) {
            productsHeader.style.display = 'none';
        }
    }

    showErrorMessage(customMessage = null) {
        const translations = {
            pt: 'Erro ao carregar produtos. Verifique a conexão com Supabase.',
            es: 'Error al cargar productos. Verifique la conexión con Supabase.',
            en: 'Error loading products. Check Supabase connection.'
        };
        
        const errorMessage = customMessage || translations[this.currentLanguage] || translations.pt;
        this.showLoadingMessage(errorMessage);
    }

    setupEventListeners() {
        // Verificar si ya se configuraron los listeners para evitar duplicados
        if (this.eventListenersSetup) {
            return;
        }
        
        // Filtros de categoría - usar delegación de eventos
        const categoriesContainer = document.getElementById('category-filters-container');
        if (categoriesContainer && !categoriesContainer.dataset.listenerAdded) {
            categoriesContainer.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.handleCategoryFilter();
                }
            });
            categoriesContainer.dataset.listenerAdded = 'true';
        }

        // Los filtros se aplican automáticamente cuando cambian
        // No se necesitan botones de aplicar/limpiar
        
        // Slider de precio
        const priceSlider = document.getElementById('priceSlider');
        if (priceSlider) {
            // Verificar si ya tiene un listener
            if (!priceSlider.dataset.listenerAdded) {
                priceSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.filters.maxPrice = value;
                    this.updatePriceValue(value);
                    this.applyFilters();
                });
                priceSlider.dataset.listenerAdded = 'true';
            }
        }
        
        // Botones de ordenamiento
        this.setupSortButtons();
        
        // Barra de búsqueda
        const searchInput = document.getElementById('product-search-input');
        if (searchInput && !searchInput.dataset.listenerAdded) {
            // Event listener para búsqueda en tiempo real
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const searchTerm = e.target.value.trim();
                
                // Usar debounce para evitar demasiadas búsquedas
                searchTimeout = setTimeout(() => {
                    this.filters.searchTerm = searchTerm;
                    this.applyFilters();
                }, 300);
            });
            
            // También buscar al presionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(searchTimeout);
                    const searchTerm = e.target.value.trim();
                    this.filters.searchTerm = searchTerm;
                    this.applyFilters();
                }
            });
            
            searchInput.dataset.listenerAdded = 'true';
        }
        const clearSearchBtn = document.getElementById('clear-search-btn');
        
        if (searchInput && !searchInput.dataset.listenerAdded) {
            // Event listener para búsqueda en tiempo real
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                this.filters.searchTerm = searchTerm;
                
                // Mostrar/ocultar botón de limpiar
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';
                }
                
                // Aplicar filtros con debounce para mejor rendimiento
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            });
            
            // Event listener para Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(this.searchTimeout);
                    this.applyFilters();
                }
            });
            
            searchInput.dataset.listenerAdded = 'true';
        }
        
        // Botón de limpiar búsqueda
        if (clearSearchBtn && !clearSearchBtn.dataset.listenerAdded) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.filters.searchTerm = '';
                    clearSearchBtn.style.display = 'none';
                    this.applyFilters();
                }
            });
            clearSearchBtn.dataset.listenerAdded = 'true';
        }
        
        // Marcar que los listeners están configurados
        this.eventListenersSetup = true;
    }

    /**
     * Configurar botón de ordenamiento desplegable
     */
    setupSortButtons() {
        const dropdownBtn = document.getElementById('sort-dropdown-btn');
        const dropdownContainer = document.querySelector('.sort-dropdown-container');
        const sortOptions = document.querySelectorAll('.sort-option');
        
        if (!dropdownBtn || !dropdownContainer) {
            return;
        }
        
        // Toggle del menú desplegable
        if (!dropdownBtn.dataset.listenerAdded) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownContainer.classList.toggle('open');
            });
            dropdownBtn.dataset.listenerAdded = 'true';
        }
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                dropdownContainer.classList.remove('open');
            }
        });
        
        // Opciones de ordenamiento
        sortOptions.forEach(option => {
            if (!option.dataset.listenerAdded) {
                option.addEventListener('click', (e) => {
                    const sortType = option.dataset.sort;
                    this.handleSort(sortType);
                    
                    // Actualizar estado activo
                    sortOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    // Actualizar texto del botón
                    const label = option.querySelector('span').textContent;
                    document.getElementById('sort-current-label').textContent = label;
                    
                    // Cerrar menú
                    dropdownContainer.classList.remove('open');
                });
                option.dataset.listenerAdded = 'true';
            }
        });
    }
    
    /**
     * Manejar ordenamiento de productos
     */
    handleSort(sortType) {
        this.currentSort = sortType;
        
        // Re-aplicar filtros con el nuevo ordenamiento
        this.applyFilters();
    }
    
    /**
     * Ordenar productos según el tipo seleccionado
     */
    sortProducts(products) {
        if (!products || products.length === 0) return products;
        
        const sortedProducts = [...products]; // Copia para no modificar el original
        
        switch (this.currentSort) {
            case 'price-asc':
                // Precio de menor a mayor
                sortedProducts.sort((a, b) => {
                    const priceA = parseFloat(a.precio) || 0;
                    const priceB = parseFloat(b.precio) || 0;
                    return priceA - priceB;
                });
                break;
                
            case 'price-desc':
                // Precio de mayor a menor
                sortedProducts.sort((a, b) => {
                    const priceA = parseFloat(a.precio) || 0;
                    const priceB = parseFloat(b.precio) || 0;
                    return priceB - priceA;
                });
                break;
                
            case 'category':
                // Por categoría (alfabéticamente)
                sortedProducts.sort((a, b) => {
                    const catA = (a.categoria || '').toLowerCase();
                    const catB = (b.categoria || '').toLowerCase();
                    return catA.localeCompare(catB);
                });
                break;
                
            case 'default':
            default:
                // Orden predeterminado (por ID o referencia)
                // No hacer nada, mantener el orden original
                break;
        }
        
        return sortedProducts;
    }

    handleCategoryFilter() {
        // Recopilar categorías seleccionadas
        this.filters.categories = [];
        const categoryCheckboxes = document.querySelectorAll('#category-filters-container input[type="checkbox"]');
        
        categoryCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const categoryValue = this.normalizeCategoryName(checkbox.value);
                this.filters.categories.push(categoryValue);
            }
        });
        
        // Si no hay ninguna seleccionada, limpiar filtros dinámicos
        if (this.filters.categories.length === 0) {
            const dynamicContainer = document.getElementById('dynamic-filters-container');
            if (dynamicContainer) {
                dynamicContainer.innerHTML = '';
            }
            this.filters.dynamicFilters = {};
            this.applyFilters();
            return;
        }
        
        // Limpiar filtros dinámicos anteriores y mostrar loading
        this.filters.dynamicFilters = {};
        const dynamicContainer = document.getElementById('dynamic-filters-container');
        if (dynamicContainer) {
            dynamicContainer.innerHTML = `
                <div class="dynamic-filters-loading" style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p style="margin: 0; font-size: 14px;">Cargando filtros...</p>
                </div>
            `;
        }
        
        // Actualizar filtros dinámicos y aplicar
        this.updateDynamicFilters().then(() => {
            this.applyFilters();
        }).catch(error => {
            // Error al actualizar filtros dinámicos
        });
    }

    updateCategoryCheckboxes() {
        const selected = new Set(this.filters.categories);
        const categoryCheckboxes = document.querySelectorAll('.filter-section:first-of-type input[type="checkbox"]');
        
        let anyChanged = false;
        categoryCheckboxes.forEach(checkbox => {
            const wasChecked = checkbox.checked;
            const shouldBeChecked = selected.has(checkbox.value);
            checkbox.checked = shouldBeChecked;
            
            if (wasChecked !== checkbox.checked) {
                anyChanged = true;
            }
        });
        
        // Verificar que los checkboxes se actualizaron correctamente
        const checkedBoxes = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        // NO sincronizar automáticamente filters.categories con los checkboxes
        // Esto puede causar conflictos cuando se accede desde diferentes lugares
        // Los checkboxes deben reflejar filters.categories, no al revés
        // Solo sincronizar si hay una discrepancia significativa y no hay categoría de URL
        if (anyChanged && checkedBoxes.length > 0 && !this.selectedCategoryFromUrl) {
            // Verificar si hay una discrepancia significativa
            const categoriesSet = new Set(this.filters.categories);
            const checkedSet = new Set(checkedBoxes);
            const isDifferent = checkedBoxes.length !== this.filters.categories.length || 
                               !checkedBoxes.every(cat => categoriesSet.has(cat));
            
            if (isDifferent) {
                // Solo sincronizar si realmente es diferente y no hay categoría de URL
                this.filters.categories = checkedBoxes;
            }
        }
    }

    async updateDynamicFilters() {
        const dynamicContainer = document.getElementById('dynamic-filters-container');
        
        // Si los productos no están cargados, esperar
        if (!this.loadedProducts || this.allProducts.length === 0) {
            
            // Mostrar loading mientras esperamos
            if (dynamicContainer) {
                dynamicContainer.innerHTML = `
                    <div class="dynamic-filters-loading" style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <p style="margin: 0; font-size: 14px;">Cargando filtros...</p>
                    </div>
                `;
            }
            
            // Esperar a que los productos estén cargados
            await this.waitForProducts(5000);
            
            // Verificar nuevamente
            if (!this.loadedProducts || this.allProducts.length === 0) {
                if (dynamicContainer) {
                    dynamicContainer.innerHTML = '';
                }
                return;
            }
        }
        
        // IMPORTANTE: Resetear el flag para permitir nueva creación
        this.creatingDynamicFilters = false;
        
        // Limpiar filtros dinámicos anteriores
        if (dynamicContainer) {
            dynamicContainer.innerHTML = '';
        }
        
        // Si hay categorías seleccionadas, cargar filtros dinámicos desde category_fields
        if (this.filters.categories.length > 0) {
            await this.createDynamicFilters();
        } else {
            // Si no hay categorías seleccionadas, limpiar filtros dinámicos
            if (dynamicContainer) {
                dynamicContainer.innerHTML = '';
            }
        }
    }

    /**
     * Ocultar filtros estáticos inmediatamente al cargar la página
     * Esto evita que aparezcan brevemente antes de que se carguen los filtros dinámicos
     */
    hideStaticFiltersImmediately() {
        const sections = [
            'powerFilter',
            'colorFilter', 
            'typeFilter',
            'technologyFilter'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
        
        // También ocultar el contenedor de filtros dinámicos y mostrar loading
        const dynamicContainer = document.getElementById('dynamic-filters-container');
        if (dynamicContainer) {
            dynamicContainer.innerHTML = `
                <div class="dynamic-filters-loading" style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p style="margin: 0; font-size: 14px;">Cargando filtros...</p>
                </div>
            `;
        }
    }

    hideAllFilterSections() {
        // Ocultar los filtros estáticos antiguos (ya no se usan, se reemplazan por dinámicos)
        const sections = [
            'powerFilter',
            'colorFilter', 
            'typeFilter',
            'technologyFilter'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
        
        // Ocultar todos los filtros dinámicos
        document.querySelectorAll('.dynamic-filter-section').forEach(section => {
            section.style.display = 'none';
        });
    }

    showRelevantFilterSections() {
        // Ya no usamos los filtros estáticos, todos se generan dinámicamente
        // Los filtros dinámicos se crean en createDynamicFilters()
        // Esta función se mantiene por compatibilidad pero no hace nada
    }

    showFilterSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }

    updateTypeFilter() {
        const typeOptions = document.getElementById('typeOptions');
        if (!typeOptions) return;

        const availableTypes = new Set();

        const filteredByCategory = this.filters.categories.length === 0
            ? this.allProducts
            : this.allProducts.filter(product => this.filters.categories.includes(product.categoria));

        filteredByCategory.forEach(product => {
            if (product.tipo && product.tipo.trim() !== '') {
                availableTypes.add(product.tipo.trim());
            }
        });

        // Si no hay tipos disponibles, ocultar la sección
        if (availableTypes.size === 0) {
            const typeFilter = document.getElementById('typeFilter');
            if (typeFilter) {
                typeFilter.style.display = 'none';
            }
            return;
        }

        // Generar opciones de tipo dinámicamente
        const typeLabels = {
            pt: {
                suelto: 'Suelto',
                pared: 'Pared',
                techo: 'Techo',
                portatil: 'Portátil',
                vertical: 'Vertical',
                horizontal: 'Horizontal',
                compacto: 'Compacto'
            },
            es: {
                suelto: 'Suelto',
                pared: 'Pared',
                techo: 'Techo',
                portatil: 'Portátil',
                vertical: 'Vertical',
                horizontal: 'Horizontal',
                compacto: 'Compacto'
            },
            en: {
                suelto: 'Freestanding',
                pared: 'Wall',
                techo: 'Ceiling',
                portatil: 'Portable',
                vertical: 'Vertical',
                horizontal: 'Horizontal',
                compacto: 'Compact'
            }
        };

        const currentLang = this.currentLanguage;
        const typeOptionsHtml = Array.from(availableTypes).map(type => {
            const label = typeLabels[currentLang]?.[type] || type;
            const isChecked = this.filters.types.includes(type) ? 'checked' : '';
            return `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${type}" ${isChecked}>
                    <span class="checkmark"></span>
                    <span>${label}</span>
                </label>
            `;
        }).join('');

        typeOptions.innerHTML = typeOptionsHtml;

        // Agregar event listeners
        typeOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleTypeFilter());
        });
    }

    updatePowerFilter() {
        const powerOptions = document.getElementById('powerOptions');
        if (!powerOptions) return;

        const availablePowers = new Set();

        // Obtener potencias disponibles según las categorías seleccionadas
        this.filters.categories.forEach(category => {
            this.allProducts.filter(product => product.categoria === category).forEach(product => {
                if (product.potencia && product.potencia > 0) {
                    availablePowers.add(product.potencia);
                }
            });
        });

        // Si no hay potencias disponibles, ocultar la sección
        if (availablePowers.size === 0) {
            const powerFilter = document.getElementById('powerFilter');
            if (powerFilter) {
                powerFilter.style.display = 'none';
            }
            return;
        }

        // Ordenar potencias
        const sortedPowers = Array.from(availablePowers).sort((a, b) => a - b);
        
        const powerOptionsHtml = sortedPowers.map(power => {
            const isChecked = this.filters.powers.includes(power) ? 'checked' : '';
            return `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${power}" ${isChecked}>
                    <span class="checkmark"></span>
                    <span>${power}W</span>
                </label>
            `;
        }).join('');

        powerOptions.innerHTML = powerOptionsHtml;

        // Agregar event listeners
        powerOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handlePowerFilter());
        });
    }

    updateColorFilter() {
        const colorOptions = document.getElementById('colorOptions');
        if (!colorOptions) return;

        const availableColors = new Set();

        // Obtener colores disponibles según las categorías seleccionadas
        this.filters.categories.forEach(category => {
            this.allProducts.filter(product => product.categoria === category).forEach(product => {
                if (product.color && product.color.trim() !== '') {
                    availableColors.add(product.color);
                }
            });
        });

        // Si no hay colores disponibles, ocultar la sección
        if (availableColors.size === 0) {
            const colorFilter = document.getElementById('colorFilter');
            if (colorFilter) {
                colorFilter.style.display = 'none';
            }
            return;
        }

        const colorOptionsHtml = Array.from(availableColors).map(color => {
            const translatedColor = this.translateColor(color);
            const isChecked = this.filters.colors.includes(color) ? 'checked' : '';
            return `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${color}" ${isChecked}>
                    <span class="checkmark"></span>
                    <span>${translatedColor}</span>
                </label>
            `;
        }).join('');

        colorOptions.innerHTML = colorOptionsHtml;

        // Agregar event listeners
        colorOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleColorFilter());
        });
    }

    updateTechnologyFilter() {
        const technologyOptions = document.getElementById('technologyOptions');
        
        // No hay campos específicos de tecnología en la tabla unificada,
        // así que ocultamos el bloque para evitar filtros vacíos.
        const technologyFilter = document.getElementById('technologyFilter');
        if (technologyFilter) {
            technologyFilter.style.display = 'none';
        }
        if (technologyOptions) {
            technologyOptions.innerHTML = '';
        }
    }

    handleTypeFilter() {
        this.filters.types = [];
        document.querySelectorAll('#typeOptions input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                this.filters.types.push(checkbox.value);
            }
        });
        this.applyFilters();
    }

    handlePowerFilter() {
        this.filters.powers = [];
        document.querySelectorAll('#powerOptions input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                const powerValue = parseInt(checkbox.value, 10);
                if (!isNaN(powerValue)) {
                    this.filters.powers.push(powerValue);
                }
            }
        });
        this.applyFilters();
    }

    handleColorFilter() {
        this.filters.colors = [];
        document.querySelectorAll('#colorOptions input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                this.filters.colors.push(checkbox.value);
            }
        });
        this.applyFilters();
    }

    handleTechnologyFilter() {
        this.filters.technologies = [];
        document.querySelectorAll('#technologyOptions input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                this.filters.technologies.push(checkbox.value);
            }
        });
        this.applyFilters();
    }

    /**
     * Crear filtros dinámicos basados en los campos de categoría
     * Muestra SOLO los campos con show_in_filters === true
     */
    async createDynamicFilters() {
        // Protección contra llamadas múltiples simultáneas
        if (this.creatingDynamicFilters) {
            // Esperar a que termine la ejecución anterior
            await new Promise(resolve => setTimeout(resolve, 200));
            if (this.creatingDynamicFilters) {
            return;
            }
        }
        
        this.creatingDynamicFilters = true;
        
        try {
            // IMPORTANTE: Asegurar que this.filters y this.filters.dynamicFilters existen
            if (!this.filters) {
                this.filters = {
                    categories: [],
                    maxPrice: 200,
                    powers: [],
                    colors: [],
                    types: [],
                    technologies: [],
                    dynamicFilters: {}
                };
            }
            if (!this.filters.dynamicFilters) {
                this.filters.dynamicFilters = {};
            }
            
            if (this.filters.categories.length === 0) {
                // Eliminar filtros dinámicos anteriores
                document.querySelectorAll('.dynamic-filter-section').forEach(section => {
                    section.remove();
                });
                this.creatingDynamicFilters = false; // Liberar flag antes de return
                return;
            }
            
            if (!this.allProducts || this.allProducts.length === 0) {
                this.creatingDynamicFilters = false;
                return;
            }
        
        // Obtener campos desde la base de datos (solo los que tienen show_in_filters === true)
        const allFields = new Map();
        
        if (this.supabase) {
            try {
                // ============================================
                // 1️⃣ BUSCAR CATEGORÍAS EN SUPABASE
                // ============================================
                const categoryIds = [];
                
                for (const categoryValue of this.filters.categories) {
                    // Normalizar el valor de búsqueda
                    const normalizedSearchValue = this.normalizeCategoryName(categoryValue);
                    
                    // Primero intentar buscar en homeCategories (categorías ya cargadas)
                    let category = null;
                    if (this.homeCategories && this.homeCategories.length > 0) {
                        this.homeCategories.forEach((cat, idx) => {
                            const catValueNormalized = this.normalizeCategoryName(cat.nombre_es);
                            if (catValueNormalized === normalizedSearchValue) {
                                category = cat;
                            }
                        });
                    }
                    
                    // Si no se encuentra en homeCategories, buscar directamente en categorias_geral
                    if (!category) {
                        const { data: categoriesFromDb, error: catError } = await this.supabase
                            .from('categorias_geral')
                            .select('id, nombre_es, nombre_pt, tipo, is_active')
                            .eq('tipo', 'home')
                            .eq('is_active', true);
                        
                        if (catError) {
                            // Error buscando categorías
                        } else if (categoriesFromDb && categoriesFromDb.length > 0) {
                            categoriesFromDb.forEach((cat, idx) => {
                                const catValueNormalized = this.normalizeCategoryName(cat.nombre_es);
                                if (catValueNormalized === normalizedSearchValue) {
                                    category = cat;
                                }
                            });
                            
                            // Si se encuentra, agregarla a homeCategories para futuras búsquedas
                            if (category && this.homeCategories) {
                                const exists = this.homeCategories.find(c => c.id === category.id);
                                if (!exists) {
                                    this.homeCategories.push(category);
                                }
                            }
                        }
                    }
                    
                    if (category && category.id) {
                        categoryIds.push(category.id);
                    }
                }
                
                // ============================================
                // 2️⃣ CARGAR CAMPOS DESDE SUPABASE
                // ============================================
                if (categoryIds.length > 0) {
                    
                    // Primero verificar que la tabla existe y tiene datos
                    const { data: testFields, error: testError } = await this.supabase
                        .from('category_fields')
                        .select('categoria_id, field_id, show_in_filters')
                        .limit(5);
                    
                    // Cargar campos desde la BD que tengan show_in_filters === true
                    // IMPORTANTE: También incluir los que tienen show_in_filters = null (compatibilidad)
                    const { data: fieldsFromDb, error } = await this.supabase
                        .from('category_fields')
                        .select('*')
                        .in('categoria_id', categoryIds)
                        .or('show_in_filters.eq.true,show_in_filters.is.null') // true O null (compatibilidad)
                        .order('orden', { ascending: true });
                    
                    if (error) {
                        // Verificar si es un error de RLS
                        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission')) {
                            // POSIBLE PROBLEMA DE RLS (Row Level Security)
                            // Verifica las políticas RLS para category_fields
                        }
                    } else if (fieldsFromDb && fieldsFromDb.length > 0) {
                        const currentLang = this.currentLanguage || localStorage.getItem('language') || 'pt';
                        
                        fieldsFromDb.forEach((field, idx) => {
                            const label = currentLang === 'es' ? field.label_es : 
                                         currentLang === 'en' ? (field.label_en || field.label_es) : 
                                         field.label_pt;
                            const placeholder = currentLang === 'es' ? (field.placeholder_es || '') : 
                                               currentLang === 'en' ? (field.placeholder_en || field.placeholder_es || '') :
                                               (field.placeholder_pt || '');
                            
                            const fieldObj = {
                                id: field.field_id,
                                label: label,
                                type: field.field_type,
                                placeholder: placeholder,
                                required: field.is_required || false
                            };
                            
                            // Si es select, agregar opciones CON TODOS LOS IDIOMAS para poder cambiar después
                            if (field.field_type === 'select' && field.options && Array.isArray(field.options)) {
                                fieldObj.options = field.options.map(opt => ({
                                    value: opt.value,
                                    label_es: opt.label_es || opt.value,
                                    label_pt: opt.label_pt || opt.value,
                                    label_en: opt.label_en || opt.label_es || opt.value
                                }));
                            }
                            
                            // Guardar también los labels originales del campo para poder cambiar idioma
                            fieldObj.label_es = field.label_es;
                            fieldObj.label_pt = field.label_pt;
                            fieldObj.label_en = field.label_en || field.label_es;
                            
                            // ✅ DETECTAR DUPLICADOS POR LABEL NORMALIZADO (no solo por field_id)
                            // Esto permite combinar filtros que tienen diferente field_id pero mismo nombre
                            const normalizedLabel = (field.label_es || field.label_pt || field.field_id)
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/\s+/g, '-');
                            
                            // Buscar si ya existe un campo con el mismo label normalizado
                            let existingFieldKey = null;
                            for (const [key, existingField] of allFields.entries()) {
                                const existingNormalizedLabel = (existingField.label_es || existingField.label_pt || existingField.id)
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '')
                                    .replace(/\s+/g, '-');
                                if (existingNormalizedLabel === normalizedLabel) {
                                    existingFieldKey = key;
                                    break;
                                }
                            }
                            
                            if (!existingFieldKey) {
                                // Campo nuevo - agregarlo
                                allFields.set(field.field_id, fieldObj);
                            } else {
                                // ✅ COMBINAR opciones de campos con mismo label
                                const existingField = allFields.get(existingFieldKey);
                                
                                // Combinar opciones de select si ambos tienen
                                if (fieldObj.options && existingField.options) {
                                    const existingValues = new Set(existingField.options.map(o => String(o.value).toLowerCase()));
                                    fieldObj.options.forEach(opt => {
                                        if (!existingValues.has(String(opt.value).toLowerCase())) {
                                            existingField.options.push(opt);
                                        }
                                    });
                                }
                                
                                // Guardar los field_ids originales para buscar valores en productos
                                if (!existingField.originalFieldIds) {
                                    existingField.originalFieldIds = [existingFieldKey];
                                }
                                existingField.originalFieldIds.push(field.field_id);
                            }
                        });
                    }
                }
            } catch (error) {
                // Error cargando campos desde BD
            }
        } else {
            // Client no está inicializado
        }
        
        // ============================================
        // 3️⃣ FALLBACK A categoryFieldsConfig
        // ============================================
        if (allFields.size === 0) {
            // Usando fallback a categoryFieldsConfig
            
            this.filters.categories.forEach(category => {
                const normalizedCategory = this.normalizeCategoryName(category);
                
                // Intentar con el nombre original y normalizado
                const fields = this.categoryFieldsConfig[category] || 
                              this.categoryFieldsConfig[normalizedCategory] || 
                              [];
                
                // Campos encontrados en config
                
                fields.forEach(field => {
                    if (!allFields.has(field.id)) {
                        allFields.set(field.id, field);
                    } else {
                        // Combinar opciones de campos duplicados
                        const existingField = allFields.get(field.id);
                        if (field.options && existingField.options) {
                            const existingValues = new Set(existingField.options.map(o => o.value));
                            field.options.forEach(opt => {
                                if (!existingValues.has(opt.value)) {
                                    existingField.options.push(opt);
                                }
                            });
                        }
                    }
                });
            });
            
        }
        // Total campos únicos a crear filtros
        if (allFields.size > 0) {
            // Los campos se guardarán DESPUÉS de crear las secciones para incluir traducciones
        } else {
            // NO SE ENCONTRARON CAMPOS PARA CREAR FILTROS
            // Posibles causas: categorías no encontradas, no hay category_fields con show_in_filters=true, problema de RLS, o nombres no coinciden
        }

        // Eliminar filtros dinámicos anteriores Y sus event listeners
        const oldSections = document.querySelectorAll('.dynamic-filter-section');
        // Eliminando filtros dinámicos anteriores
        oldSections.forEach(section => {
            // Eliminar event listeners antes de remover el elemento
            const optionsContainer = section.querySelector('.filter-options');
            if (optionsContainer && optionsContainer.dataset.listenerAdded) {
                // Clonar el elemento para eliminar todos los event listeners
                const newContainer = optionsContainer.cloneNode(true);
                optionsContainer.parentNode.replaceChild(newContainer, optionsContainer);
            }
            section.remove();
        });

        // Buscar el contenedor de filtros dinámicos
        const dynamicContainer = document.getElementById('dynamic-filters-container');
        
        if (!dynamicContainer) {
            this.creatingDynamicFilters = false;
            return;
        }

        // Crear filtros para cada campo de filtros
        let filtersCreated = 0;
        let filtersSkipped = 0;
        
        allFields.forEach((field, fieldId) => {
            const section = this.createDynamicFilterSection(field, fieldId);
            if (section) {
                // Insertar en el contenedor de filtros dinámicos
                dynamicContainer.appendChild(section);
                filtersCreated++;
            } else {
                filtersSkipped++;
            }
        });

        // ✅ GUARDAR CAMPOS PARA TRADUCCIONES (DESPUÉS de crear secciones para incluir traducciones)
        // Las traducciones se agregan en createDynamicFilterSection
        if (allFields.size > 0) {
            this.dynamicFilterFields = new Map(allFields);
        }
        } finally {
            // Liberar el flag al finalizar (incluso si hay error)
            this.creatingDynamicFilters = false;
        }
    }

    /**
     * Crear una sección de filtro dinámico
     */
    createDynamicFilterSection(field, fieldId) {
        // Verificar que field existe
        if (!field) {
            return null;
        }
        
        // Obtener valores únicos de este campo de los productos
        const availableValues = new Set();
        
        this.filters.categories.forEach(category => {
            // Normalizar la categoría para comparar
            const normalizedCategory = this.normalizeCategoryName(category);
            const productsInCategory = this.allProducts.filter(product => {
                const productCategoryNormalized = this.normalizeCategoryName(product.categoria);
                return productCategoryNormalized === normalizedCategory;
            });
            
            productsInCategory.forEach((product, idx) => {
                // Obtener el fieldIdBase (sin sufijo de categoría)
                const fieldIdBase = fieldId.includes('_') ? fieldId.split('_')[0] : fieldId;
                
                // ✅ Incluir todos los field_ids originales si es un campo combinado
                const allFieldIds = field.originalFieldIds 
                    ? [...new Set([fieldId, fieldIdBase, ...field.originalFieldIds, ...field.originalFieldIds.map(id => id.includes('_') ? id.split('_')[0] : id)])]
                    : [fieldIdBase, fieldId];
                
                // Buscar valores en AMBOS idiomas para campos de texto
                let valueEs = null;
                let valuePt = null;
                let valueNumeric = null; // Para campos numéricos como potencia
                
                // 1. Campos numéricos (potencia) - no tienen traducción
                if (fieldIdBase === 'potencia' || fieldIdBase === 'power' || allFieldIds.some(id => id === 'potencia' || id === 'power')) {
                    valueNumeric = product.potencia ? String(product.potencia) : null;
                    if (valueNumeric) {
                        availableValues.add(valueNumeric);
                    }
                } else {
                    // 2. Campos de texto - buscar en ambos idiomas
                    const cf = product.categoryFields || {};
                    
                    // ✅ Usar todos los field_ids posibles para buscar valores
                    const possibleNames = allFieldIds;
                    
                    // Buscar valor en español - probar múltiples nombres
                    for (const name of possibleNames) {
                        if (!valueEs) {
                            valueEs = cf[name + '_es'] || 
                                      cf[name + '_espanol'] ||
                                      product[name + '_es'] ||
                                      product.attributes?.[name + '_es'];
                        }
                    }
                    
                    // Buscar valor en portugués
                    for (const name of possibleNames) {
                        if (!valuePt) {
                            valuePt = cf[name + '_pt'] || 
                                      cf[name + '_portugues'] ||
                                      product[name + '_pt'] ||
                                      product.attributes?.[name + '_pt'];
                        }
                    }
                    
                    // Si no hay valores con sufijo, buscar sin sufijo (campo genérico)
                    if (!valueEs && !valuePt) {
                        for (const name of possibleNames) {
                            const genericValue = cf[name] || product[name] || product.attributes?.[name];
                            if (genericValue) {
                                valueEs = genericValue;
                                valuePt = genericValue;
                                break;
                            }
                        }
                    }
                    
                    // Limpiar valores
                    if (valueEs) valueEs = String(valueEs).trim();
                    if (valuePt) valuePt = String(valuePt).trim();
                    
                    // Agregar a availableValues con información de traducción
                    if (valueEs || valuePt) {
                        // Usar el valor español como clave interna (o portugués si no hay español)
                        const internalValue = valueEs || valuePt;
                        
                        // Guardar el mapeo de traducciones
                        if (!field.translations) {
                            field.translations = {};
                        }
                        field.translations[internalValue] = {
                            es: valueEs || internalValue,
                            pt: valuePt || internalValue,
                            en: valueEs || internalValue // Fallback a español para inglés
                        };
                        
                        availableValues.add(internalValue);
                    }
                }
            });
        });

        if (availableValues.size === 0) {
            return null; // No crear filtro si no hay valores
        }

        const section = document.createElement('div');
        section.className = 'filter-section dynamic-filter-section';
        section.id = `dynamicFilter_${fieldId}`;
        section.setAttribute('data-field-id', fieldId); // ✅ Para actualizar traducciones
        section.style.display = 'block'; // Asegurar que se muestre
        section.style.visibility = 'visible'; // Asegurar visibilidad

        // Obtener el label según el idioma actual usando los labels guardados
        const currentLang = this.currentLanguage || localStorage.getItem('language') || 'pt';
        const label = currentLang === 'es' ? (field.label_es || field.label || fieldId) :
                      currentLang === 'en' ? (field.label_en || field.label_es || field.label || fieldId) :
                      (field.label_pt || field.label || fieldId);
        
        section.innerHTML = `
            <h4 class="filter-title">${label}</h4>
            <div class="filter-options" id="dynamicOptions_${fieldId}">
                ${this.generateDynamicFilterOptions(field, fieldId, Array.from(availableValues))}
            </div>
        `;

        // Agregar event listeners usando delegación de eventos en el contenedor
        // IMPORTANTE: Verificar que no exista ya un listener para evitar duplicados
        const optionsContainer = section.querySelector(`#dynamicOptions_${fieldId}`);
        if (optionsContainer) {
            // Verificar si ya tiene un listener (marcar con data attribute)
            if (!optionsContainer.dataset.listenerAdded) {
                optionsContainer.addEventListener('change', (e) => {
                    if (e.target.type === 'checkbox' && e.target.closest(`#dynamicOptions_${fieldId}`)) {
                        this.handleDynamicFilter(fieldId);
                    }
                });
                optionsContainer.dataset.listenerAdded = 'true';
            }
        }

        return section;
    }

    /**
     * Generar opciones de filtro dinámico - solo mostrar valores que existen en productos
     */
    generateDynamicFilterOptions(field, fieldId, values) {
        // Asegurar que field existe
        if (!field) {
            return '';
        }
        
        const currentLang = this.currentLanguage || localStorage.getItem('language') || 'pt';
        
        // Asegurar que dynamicFilters existe
        if (!this.filters.dynamicFilters) {
            this.filters.dynamicFilters = {};
        }
        
        // Obtener los valores seleccionados de forma segura
        const selectedValues = this.filters.dynamicFilters[fieldId] || [];
        
        // values ya contiene solo los valores que existen en los productos
        if (field.type === 'select' && field.options) {
            // Para campos select, mostrar solo las opciones que tienen valores en productos
            // Comparar como strings para evitar problemas de tipo
            const valuesSet = new Set(values.map(v => String(v)));
            return field.options
                .filter(opt => opt && opt.value && valuesSet.has(String(opt.value)))
                .map(opt => {
                    const isChecked = selectedValues.includes(String(opt.value)) ? 'checked' : '';
                    // Seleccionar el label según el idioma actual
                    const optLabel = currentLang === 'es' ? (opt.label_es || opt.label || opt.value) :
                                     currentLang === 'en' ? (opt.label_en || opt.label_es || opt.label || opt.value) :
                                     (opt.label_pt || opt.label || opt.value);
                    return `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${opt.value}" ${isChecked}>
                            <span class="checkmark"></span>
                            <span>${optLabel}</span>
                        </label>
                    `;
                }).join('');
        } else {
            // Para campos de texto/número, mostrar los valores traducidos según el idioma
            return values
                .sort()
                .map(value => {
                    const isChecked = selectedValues.includes(String(value)) ? 'checked' : '';
                    
                    // Obtener la traducción si existe (de forma segura)
                    let displayValue = value;
                    if (field && field.translations && field.translations[value]) {
                        const trans = field.translations[value];
                        displayValue = currentLang === 'es' ? (trans.es || value) :
                                       currentLang === 'en' ? (trans.en || trans.es || value) :
                                       (trans.pt || value);
                    }
                    
                    return `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${value}" ${isChecked}>
                            <span class="checkmark"></span>
                            <span>${displayValue}</span>
                        </label>
                    `;
                }).join('');
        }
    }

    /**
     * Manejar cambios en filtros dinámicos
     */
    handleDynamicFilter(fieldId) {
        // Inicializar el array si no existe
        if (!this.filters.dynamicFilters[fieldId]) {
            this.filters.dynamicFilters[fieldId] = [];
        }
        
        // Limpiar y recopilar valores seleccionados
        this.filters.dynamicFilters[fieldId] = [];
        const checkboxes = document.querySelectorAll(`#dynamicOptions_${fieldId} input[type="checkbox"]`);
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                this.filters.dynamicFilters[fieldId].push(checkbox.value);
            }
        });
        
        this.applyFilters();
    }

    applyFilters() {
        // Verificar que los productos estén cargados
        if (!this.loadedProducts) {
            // Si los productos aún no están cargados, esperar un momento y reintentar
            setTimeout(() => {
                if (this.loadedProducts) {
                    this.applyFilters();
                }
            }, 200);
            return;
        }

        if (this.allProducts.length === 0) {
            this.displayProducts([]);
            return;
        }
        
        // Verificar que el contenedor existe antes de continuar
        const container = document.getElementById('products-grid');
        if (!container) {
            setTimeout(() => {
                const retryContainer = document.getElementById('products-grid');
                if (retryContainer) {
                    this.applyFilters();
                }
            }, 200);
            return;
        }

        // Aplicar filtros
        let filteredProducts = this.allProducts.filter(product => {
            // Filtro por búsqueda de texto
            if (this.filters.searchTerm && this.filters.searchTerm.trim() !== '') {
                const searchTerm = this.filters.searchTerm.trim().toLowerCase();
                const normalizeString = (str) => {
                    if (!str) return '';
                    return String(str)
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .trim();
                };
                
                // Obtener nombres de categoría en ambos idiomas
                let categoriaNombreEs = '';
                let categoriaNombrePt = '';
                if (product.categoria && this.homeCategories) {
                    const categoriaMatch = this.homeCategories.find(cat => {
                        const normalizedCat = this.normalizeCategoryName(cat.nombre_es);
                        return normalizedCat === this.normalizeCategoryName(product.categoria);
                    });
                    if (categoriaMatch) {
                        categoriaNombreEs = categoriaMatch.nombre_es || '';
                        categoriaNombrePt = categoriaMatch.nombre_pt || '';
                    }
                }
                
                const searchFields = [
                    product.nombre,
                    product.modelo,
                    product.marca,
                    product.brand,
                    product.id,
                    product.referencia,
                    product.descripcionEs || product.descripcion_es,
                    product.descripcionPt || product.descripcion_pt,
                    product.categoria,
                    // Fornecedor
                    product.nombre_fornecedor,
                    // Categoría en español y portugués
                    categoriaNombreEs,
                    categoriaNombrePt,
                    // Color
                    product.color
                ];
                
                // Buscar en categoryFields también (incluye color y otros campos)
                if (product.categoryFields && typeof product.categoryFields === 'object') {
                    Object.values(product.categoryFields).forEach(value => {
                        if (value) searchFields.push(String(value));
                    });
                }
                
                const normalizedSearchTerm = normalizeString(searchTerm);
                const matches = searchFields.some(field => {
                    if (!field) return false;
                    return normalizeString(field).includes(normalizedSearchTerm);
                });
                
                if (!matches) {
                    return false;
                }
            }

            // Filtro por categorías
            if (this.filters.categories.length > 0) {
                const productCategoryNormalized = this.normalizeCategoryName(product.categoria);
                const normalizedFilterCategories = this.filters.categories.map(cat => 
                    this.normalizeCategoryName(cat)
                );
                if (!normalizedFilterCategories.includes(productCategoryNormalized)) {
                    return false;
                }
            }

            // Filtro por precio
            const productPrice = product.precio || 0;
            if (productPrice > this.filters.maxPrice) {
                return false;
            }

            // Filtros dinámicos
            if (this.filters.dynamicFilters && typeof this.filters.dynamicFilters === 'object') {
                for (const [fieldId, selectedValues] of Object.entries(this.filters.dynamicFilters)) {
                    if (!selectedValues || !Array.isArray(selectedValues) || selectedValues.length === 0) {
                        continue;
                    }
                    
                    let productValue = null;
                    const fieldIdBase = fieldId.includes('_') ? fieldId.split('_')[0] : fieldId;
                    
                    // Buscar potencia en múltiples ubicaciones
                    if (fieldId === 'potencia' || fieldIdBase === 'potencia' || fieldId === 'power' || fieldIdBase === 'power') {
                        productValue = product.potencia ? String(product.potencia) : null;
                        // Si no está en el campo directo, buscar en categoryFields
                        if (!productValue) {
                            productValue = product.categoryFields?.potencia || 
                                          product.categoryFields?.power ||
                                          product.categoryFields?.potencia_secadores ||
                                          null;
                            if (productValue) productValue = String(productValue);
                        }
                    } else if (fieldId === 'color' || fieldIdBase === 'color') {
                        productValue = product.color ? product.color.trim() : null;
                        if (!productValue) {
                            productValue = product.categoryFields?.color || null;
                            if (productValue) productValue = String(productValue).trim();
                        }
                    } else if (fieldId === 'tipo' || fieldIdBase === 'tipo' || fieldId === 'type' || fieldIdBase === 'type') {
                        productValue = product.tipo ? product.tipo.trim() : null;
                        if (!productValue) {
                            productValue = product.categoryFields?.tipo || product.categoryFields?.type || null;
                            if (productValue) productValue = String(productValue).trim();
                        }
                    } else {
                        // Buscar en categoryFields para otros campos
                        productValue = product.categoryFields?.[fieldId] || 
                                      product.categoryFields?.[fieldIdBase] ||
                                      product.categoryFields?.[fieldId + '_es'] ||
                                      product.categoryFields?.[fieldIdBase + '_es'] ||
                                      product.categoryFields?.[fieldId + '_pt'] ||
                                      product.categoryFields?.[fieldIdBase + '_pt'] ||
                                      product.attributes?.[fieldId] ||
                                      product.attributes?.[fieldIdBase] ||
                                      // También buscar directamente en el producto
                                      product[fieldId] ||
                                      product[fieldIdBase];
                        
                        if (!productValue && typeof product.categoryFields === 'string') {
                            try {
                                const parsed = JSON.parse(product.categoryFields);
                                productValue = parsed[fieldId] || parsed[fieldIdBase] || 
                                             parsed[fieldId + '_es'] || parsed[fieldId + '_pt'];
                            } catch (e) {
                                // Silenciar error
                            }
                        }
                        
                        if (productValue !== null && productValue !== undefined && productValue !== '') {
                            productValue = String(productValue);
                        } else {
                            productValue = null;
                        }
                    }
                
                    const selectedValuesStr = selectedValues.map(v => String(v).trim().toLowerCase());
                    const productValueStr = productValue ? String(productValue).trim().toLowerCase() : null;
                    
                    // Si hay valores seleccionados, el producto DEBE tener un valor que coincida
                    // Si el producto no tiene valor (null), se excluye
                    if (!productValueStr || !selectedValuesStr.includes(productValueStr)) {
                        return false;
                    }
                }
            }

            return true;
        });

        // Si no hay categorías seleccionadas, ordenar por categoría automáticamente
        if (this.filters.categories.length === 0) {
            this.currentSort = 'category';
            // Actualizar el dropdown para mostrar "Categoria" como seleccionado
            this.updateSortDropdownUI('category');
        }
        
        // Aplicar ordenamiento a los productos filtrados
        const sortedProducts = this.sortProducts(filteredProducts);
        
        this.lastFilteredProducts = sortedProducts;
        this.displayProducts(sortedProducts);
    }

    displayProducts(products) {
        // Buscar el contenedor de productos
        let productsContainer = document.getElementById('products-grid');
        
        // Si no se encuentra, intentar varias veces
        if (!productsContainer) {
            productsContainer = document.querySelector('#products-grid');
        }
        
        if (!productsContainer) {
            // Intentar encontrar el contenedor después de un delay
            setTimeout(() => {
                const retryContainer = document.getElementById('products-grid');
                if (retryContainer) {
                    this.displayProducts(products);
                } else {
                    // Intentar crear el contenedor si no existe
                    const mainContent = document.querySelector('.products-content') || document.querySelector('main');
                    if (mainContent) {
                        const newContainer = document.createElement('div');
                        newContainer.id = 'products-grid';
                        newContainer.className = 'products-grid';
                        mainContent.appendChild(newContainer);
                        productsContainer = newContainer;
                    }
                }
            }, 500);
            
            if (!productsContainer) {
                return;
            }
        }

        if (products.length === 0) {
            const translations = {
                pt: 'Nenhum produto encontrado com os filtros aplicados.',
                es: 'No se encontraron productos con los filtros aplicados.',
                en: 'No products found with the applied filters.'
            };
            productsContainer.innerHTML = `<div class="no-products">${translations[this.currentLanguage] || translations.pt}</div>`;
            return;
        }

        try {
            const productsHtml = products.map(product => this.createProductCard(product)).join('');
            
            if (!productsContainer) {
                return;
            }
            
            productsContainer.innerHTML = productsHtml;
            
            // Configurar navegación de imágenes con flechas
            this.setupImageNavigation();
        } catch (error) {
            // Error en displayProducts
        }
    }
    
    setupImageNavigation() {
        // Buscar todas las imágenes con data-rotating="true" (productos con segunda foto)
        const rotatingImages = document.querySelectorAll('img[data-rotating="true"]');
        
        rotatingImages.forEach(img => {
            // Guardar la URL original de la primera foto
            const foto1 = img.getAttribute('src') || img.src;
            const foto2 = img.getAttribute('data-foto-2');
            
            if (!foto2 || !foto1) return;
            
            // Guardar las URLs en data attributes
            img.setAttribute('data-foto-1', foto1);
            img.setAttribute('data-current-photo', '1'); // 1 = primera foto, 2 = segunda foto
            
            // Obtener el contenedor de la imagen (div.media)
            const mediaContainer = img.closest('.media');
            if (!mediaContainer) return;
            
            // Crear contenedor de flechas si no existe
            let arrowsContainer = mediaContainer.querySelector('.image-arrows');
            if (!arrowsContainer) {
                arrowsContainer = document.createElement('div');
                arrowsContainer.className = 'image-arrows';
                arrowsContainer.style.cssText = 'position: absolute; top: 50%; transform: translateY(-50%); width: 100%; display: flex; justify-content: space-between; padding: 0 10px; pointer-events: none; z-index: 10;';
                mediaContainer.style.position = 'relative';
                mediaContainer.appendChild(arrowsContainer);
            }
            
            // Crear flecha izquierda
            const leftArrow = document.createElement('button');
            leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
            leftArrow.className = 'image-arrow image-arrow-left';
            leftArrow.style.cssText = 'background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; transition: background 0.3s;';
            leftArrow.onmouseover = () => leftArrow.style.background = 'rgba(0,0,0,0.8)';
            leftArrow.onmouseout = () => leftArrow.style.background = 'rgba(0,0,0,0.5)';
            leftArrow.onclick = (e) => {
                e.stopPropagation();
                this.navigateImage(img, 'prev');
            };
            
            // Crear flecha derecha
            const rightArrow = document.createElement('button');
            rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
            rightArrow.className = 'image-arrow image-arrow-right';
            rightArrow.style.cssText = 'background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; transition: background 0.3s;';
            rightArrow.onmouseover = () => rightArrow.style.background = 'rgba(0,0,0,0.8)';
            rightArrow.onmouseout = () => rightArrow.style.background = 'rgba(0,0,0,0.5)';
            rightArrow.onclick = (e) => {
                e.stopPropagation();
                this.navigateImage(img, 'next');
            };
            
            arrowsContainer.innerHTML = '';
            arrowsContainer.appendChild(leftArrow);
            arrowsContainer.appendChild(rightArrow);
        });
    }
    
    navigateImage(img, direction) {
        const currentPhoto = parseInt(img.getAttribute('data-current-photo') || '1');
        const foto1 = img.getAttribute('data-foto-1');
        const foto2 = img.getAttribute('data-foto-2');
        
        if (!foto1 || !foto2) return;
        
        let newPhoto = currentPhoto;
        
        if (direction === 'next') {
            newPhoto = currentPhoto === 1 ? 2 : 1;
        } else if (direction === 'prev') {
            newPhoto = currentPhoto === 1 ? 2 : 1;
        }
        
        img.setAttribute('data-current-photo', newPhoto.toString());
        img.src = newPhoto === 1 ? foto1 : foto2;
    }

    /**
     * Obtener URL de imagen del producto (desde Supabase Storage o URL externa)
     * @param {string} imageUrl - URL de la imagen
     * @returns {string} URL formateada correctamente
     */
    getProductImageUrl(imageUrl) {
        // Validar que imageUrl sea una cadena válida
        if (!imageUrl) {
            return null;
        }
        
        // Si es un objeto (como {}), devolver null
        if (typeof imageUrl !== 'string') {
            return null;
        }
        
        // Validar que no sea una cadena vacía o solo espacios
        const trimmedUrl = imageUrl.trim();
        if (trimmedUrl === '' || trimmedUrl === '{}' || trimmedUrl === 'null' || trimmedUrl === 'undefined') {
            return null;
        }
        
        // Si ya es una URL completa (http/https), usarla directamente
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
            return trimmedUrl;
        }
        
        // Si es una ruta relativa de Supabase Storage, construir la URL completa
        // Las URLs de Supabase Storage tienen el formato: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        if (trimmedUrl.startsWith('productos/') || trimmedUrl.includes('product-images')) {
            // Usar la configuración de Supabase desde window.SUPABASE_CONFIG
            const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) 
                ? window.SUPABASE_CONFIG.url 
                : null;
            
            if (!SUPABASE_URL) {
                console.error('Error: Configuración de Supabase no disponible');
                return trimmedUrl; // Devolver URL original si no hay configuración
            }
            
            // Si la URL no incluye el dominio completo, construirla
            if (!trimmedUrl.includes('supabase.co')) {
                return `${SUPABASE_URL}/storage/v1/object/public/product-images/${trimmedUrl}`;
            }
        }
        
        // Si no coincide con ningún patrón, devolver la URL original (pero validada)
        return trimmedUrl;
    }

    createProductCard(product) {
        // Obtener el badge desde badge_pt (donde se guarda) y traducirlo según el idioma
        const badgeValue = product.badge_pt || null;
        let badgeText = null;
        
        if (badgeValue) {
            // Traducir el badge según el idioma actual
            const badgeTranslations = {
                'NEW': {
                    'es': 'NUEVO',
                    'pt': 'NOVO',
                    'en': 'NEW'
                },
                'PROMOCION': {
                    'es': 'PROMOCIÓN',
                    'pt': 'PROMOÇÃO',
                    'en': 'PROMOTION'
                },
                'STOCK_LIMITADO': {
                    'es': 'STOCK LIMITADO',
                    'pt': 'STOCK LIMITADO',
                    'en': 'LIMITED STOCK'
                }
            };
            
            // Obtener la traducción según el idioma actual
            const currentLang = this.currentLanguage || 'pt';
            if (badgeTranslations[badgeValue] && badgeTranslations[badgeValue][currentLang]) {
                badgeText = badgeTranslations[badgeValue][currentLang];
            } else {
                // Si no hay traducción, usar el valor original
                badgeText = badgeValue;
            }
        }
        
        // Generar HTML del badge con estilos mejorados para asegurar visibilidad
        const badgeHtml = badgeText ? 
            `<span class="badge badge--accent" style="position:absolute;left:12px;top:12px;z-index:100;background:var(--brand-gold, #D4AF37);color:var(--brand-blue, #0D2A3C);padding:6px 12px;border-radius:999px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${badgeText}</span>` : 
            '';
        const { formattedPrice, tierLabel } = this.getPriceForQuantity(product);
        
        // Obtener campos relevantes según la categoría
        const relevantFields = this.getRelevantFieldsForCategorySync(product);

        // Traducir botón
        const addButtonText = window.translationSystem ?
            window.translationSystem.translateUI('agregar') : 'Añadir';

        // Obtener URL de imagen principal (desde Supabase Storage)
        // Validar que product.foto sea una cadena antes de procesarla
        const fotoMain = (product.foto && typeof product.foto === 'string') ? product.foto : null;
        const mainImageUrl = fotoMain ? this.getProductImageUrl(fotoMain) : null;
        
        // Verificar si tiene segunda foto para rotación
        const foto2 = (product.foto_2 && typeof product.foto_2 === 'string') ? product.foto_2 : null;
        const hasSecondPhoto = foto2 && foto2.trim() !== '';
        const secondImageUrl = hasSecondPhoto ? this.getProductImageUrl(foto2) : null;
        const imageId = `product-img-${product.id}`;
        // Solo agregar data-foto-2 si secondImageUrl es válido (no null, no undefined, no objeto vacío)
        const imageDataAttr = (hasSecondPhoto && secondImageUrl && typeof secondImageUrl === 'string' && secondImageUrl.trim() !== '') 
            ? `data-foto-2="${secondImageUrl}" data-rotating="true"` 
            : '';

        // Escapar el producto para usar en onclick
        const productJson = JSON.stringify(product).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // Si no hay imagen, mostrar un placeholder o ocultar
        const imageHtml = mainImageUrl ? 
            `<img id="${imageId}" src="${mainImageUrl}" alt="${product.nombre}" ${imageDataAttr} onerror="this.style.display='none'">` :
            `<div style="width:100%;height:200px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;">
                <i class="fas fa-image" style="font-size:3rem;"></i>
            </div>`;

        return `
            <article class="card product-card" data-product-id="${product.id}">
                <div class="media" onclick="window.location.href='producto-detalle.html?id=${product.id}'" style="cursor: pointer; position: relative;">
                    ${imageHtml}
                    ${badgeHtml}
                </div>

                <div style="padding:12px; display:flex; flex-direction:column; flex:1;">
                    <h3 class="title" onclick="window.location.href='producto-detalle.html?id=${product.id}'" style="cursor: pointer; text-align: center;">${product.nombre || product.modelo || '—'}</h3>
                    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px; flex:1;">
                        ${relevantFields.map(field => `
                            <div style="display:flex;justify-content:space-between;gap:16px;">
                                <span style="color:var(--text-secondary);">${field.label}</span>
                                <strong>${field.value}</strong>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top:auto; padding-top:12px;">
                        <div style="font-size:1.2rem;color:var(--brand-gold);font-weight:600;text-align:center;">${formattedPrice}</div>
                    ${
                        tierLabel
                            ? `<div style="margin-top:4px;font-size:0.85rem;color:var(--text-secondary);text-align:center;">Escalón aplicado: ${tierLabel}</div>`
                            : ''
                    }
                    <div style="margin-top:12px;">
                        <button class="btn btn-primary" style="width:100%;" onclick="event.stopPropagation(); askQuantityAndAddToCart(${productJson})">${addButtonText}</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    getRelevantFieldsForCategorySync(product) {
        const fields = [];
        const categoria = product.categoria;
        const currentLang = this.currentLanguage || 'pt';
        
        // Usar dynamicFilterFields si está disponible
        const categoryFieldsMap = this.dynamicFilterFields || new Map();

        // Marca siempre se muestra
        if (product.brand) {
            fields.push({ label: 'Marca', value: product.brand });
        }

        // Obtener campos visibles desde product.visible_fields
        // IMPORTANTE: visible_fields se guarda como JSONB con objetos {field_id, label_es, label_pt}
        let visibleFields = product.visible_fields || [];
        
        // Si visible_fields es un string (JSON parseado), intentar parsearlo
        if (typeof visibleFields === 'string') {
            try {
                visibleFields = JSON.parse(visibleFields);
            } catch (e) {
                visibleFields = [];
            }
        }
        
        // Si es un array, verificar si cada elemento es un string JSON que necesita parsing
        if (Array.isArray(visibleFields)) {
            visibleFields = visibleFields.map((fieldConfig, idx) => {
                // Si el elemento es un string que parece JSON, parsearlo
                if (typeof fieldConfig === 'string' && (fieldConfig.startsWith('{') || fieldConfig.startsWith('"'))) {
                    try {
                        const parsed = JSON.parse(fieldConfig);
                        return parsed;
                    } catch (e) {
                        // Si falla el parsing, tratar como field_id simple
                        return { field_id: fieldConfig };
                    }
                }
                // Si ya es un objeto, devolverlo tal cual
                return fieldConfig;
            });
        }
        
        // Si hay campos visibles definidos, usar solo esos
        if (visibleFields && visibleFields.length > 0) {
            visibleFields.forEach((fieldConfig, index) => {
                // fieldConfig puede ser un string (field_id) para compatibilidad o un objeto {field_id, label_es, label_pt}
                let fieldId, fieldLabel;
                
                if (typeof fieldConfig === 'string') {
                    // Compatibilidad con formato antiguo (solo field_id)
                    fieldId = fieldConfig;
                    fieldLabel = fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/_/g, ' ');
                } else if (typeof fieldConfig === 'object' && fieldConfig !== null) {
                    // Nuevo formato con labels dinámicos guardados en visible_fields
                    fieldId = fieldConfig.field_id || fieldConfig;
                    
                    // IMPORTANTE: Usar los labels guardados en visible_fields (no buscar en category_fields)
                    if (fieldConfig.label_es || fieldConfig.label_pt) {
                        // Usar el label según el idioma actual desde los labels guardados
                        fieldLabel = currentLang === 'es' 
                            ? (fieldConfig.label_es || fieldConfig.label || fieldId)
                            : (fieldConfig.label_pt || fieldConfig.label || fieldId);
                    } else {
                        // Fallback si no hay labels guardados
                        fieldLabel = fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/_/g, ' ');
                    }
                } else {
                    // Formato inválido, saltar
                    return;
                }
                
                // Buscar el valor del campo en category_fields o en propiedades directas del producto
                // PRIORIDAD: Primero buscar con sufijo de idioma, luego sin sufijo
                let fieldValue = null;
                const fieldIdEs = fieldId + '_es';
                const fieldIdPt = fieldId + '_pt';
                
                // PRIORIDAD 1: Buscar valor traducido según el idioma actual
                if (currentLang === 'es') {
                    // Buscar versión en español primero
                    if (product.category_fields && product.category_fields[fieldIdEs] !== undefined) {
                        fieldValue = product.category_fields[fieldIdEs];
                    } else if (product[fieldIdEs] !== undefined) {
                        fieldValue = product[fieldIdEs];
                    }
                } else if (currentLang === 'pt') {
                    // Buscar versión en portugués primero
                    if (product.category_fields && product.category_fields[fieldIdPt] !== undefined) {
                        fieldValue = product.category_fields[fieldIdPt];
                    } else if (product[fieldIdPt] !== undefined) {
                        fieldValue = product[fieldIdPt];
                    }
                }
                
                // PRIORIDAD 2: Si no se encontró con sufijo, buscar sin sufijo (compatibilidad)
                if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
                    if (product.category_fields && product.category_fields[fieldId] !== undefined) {
                        fieldValue = product.category_fields[fieldId];
                    } else if (product[fieldId] !== undefined) {
                        fieldValue = product[fieldId];
                    }
                }
                
                // PRIORIDAD 3: Si aún no se encontró, intentar con el otro idioma como último recurso
                if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
                    if (currentLang === 'es') {
                        // Si estamos en español y no encontramos, intentar portugués
                        if (product.category_fields && product.category_fields[fieldIdPt] !== undefined) {
                            fieldValue = product.category_fields[fieldIdPt];
                        } else if (product[fieldIdPt] !== undefined) {
                            fieldValue = product[fieldIdPt];
                        }
                    } else if (currentLang === 'pt') {
                        // Si estamos en portugués y no encontramos, intentar español
                        if (product.category_fields && product.category_fields[fieldIdEs] !== undefined) {
                            fieldValue = product.category_fields[fieldIdEs];
                        } else if (product[fieldIdEs] !== undefined) {
                            fieldValue = product[fieldIdEs];
                        }
                    }
                }
                
                // Si se encontró un valor, agregarlo a los campos
                if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
                    // Formatear el valor según el tipo de campo
                    let displayValue = fieldValue;
                    
                    // Si es un número, formatear según el tipo
                    if (typeof fieldValue === 'number') {
                        // Si es potencia, agregar "W"
                        if (fieldId === 'potencia') {
                            displayValue = `${fieldValue}W`;
                        } else if (fieldId === 'garantia') {
                            displayValue = `${fieldValue} años`;
                        }
                    } else {
                        // Para campos de tipo select, buscar la traducción del valor
                        // Buscar en los campos dinámicos cargados para obtener las opciones
                        const dynamicField = this.dynamicFilterFields?.get(fieldId);
                        if (dynamicField && dynamicField.options && Array.isArray(dynamicField.options)) {
                            // Buscar la opción que coincida con el valor
                            const matchingOption = dynamicField.options.find(opt => {
                                const optValue = String(opt.value || '').toLowerCase().trim();
                                const fieldVal = String(fieldValue || '').toLowerCase().trim();
                                return optValue === fieldVal;
                            });
                            
                            if (matchingOption) {
                                // Usar el label traducido según el idioma actual
                                if (currentLang === 'es' && matchingOption.label_es) {
                                    displayValue = matchingOption.label_es;
                                } else if (currentLang === 'pt' && matchingOption.label_pt) {
                                    displayValue = matchingOption.label_pt;
                                } else if (currentLang === 'en' && matchingOption.label_en) {
                                    displayValue = matchingOption.label_en;
                                } else {
                                    // Fallback: usar label_es o el valor original
                                    displayValue = matchingOption.label_es || matchingOption.label_pt || fieldValue;
                                }
                            }
                        }
                    }
                    
                    // Usar el label dinámico guardado (no hardcodeado)
                    fields.push({ label: fieldLabel, value: displayValue });
                }
            });
        } else {
            // Fallback: comportamiento anterior (solo para compatibilidad)
            if (categoria === 'secadores' || categoria === 'planchas') {
                if (product.potencia) fields.push({ label: 'Potencia', value: `${product.potencia}W` });
            }
            
            if (product.color) {
                const translatedColor = window.translationSystem ?
                    window.translationSystem.translateColor(product.color) :
                    this.translateColor(product.color);
                fields.push({ label: 'Color', value: translatedColor });
            }
        }

        return fields;
    }

    getPriceForQuantity(product) {
        const quantity = this.currentQuantity || 1;
        const currencyFromProduct = product.moneda || 'EUR';
        let selectedPrice = Number.isFinite(product.precio) ? Number(product.precio) : 0;
        let currency = currencyFromProduct;
        let tierLabel = null;

        if (Array.isArray(product.price_tiers) && product.price_tiers.length > 0) {
            const sortedTiers = [...product.price_tiers].sort((a, b) => {
                const minA = a?.min_qty !== null && a?.min_qty !== undefined ? Number(a.min_qty) : 0;
                const minB = b?.min_qty !== null && b?.min_qty !== undefined ? Number(b.min_qty) : 0;
                return minA - minB;
            });

            for (const tier of sortedTiers) {
                if (!tier) continue;
                const min = tier.min_qty !== null && tier.min_qty !== undefined ? Number(tier.min_qty) : 0;
                const max = tier.max_qty !== null && tier.max_qty !== undefined ? Number(tier.max_qty) : Infinity;
                const tierPrice = tier.price !== null && tier.price !== undefined ? Number(tier.price) : null;

                if (tierPrice === null) {
                    continue;
                }

                if (quantity >= min && quantity <= max) {
                    selectedPrice = tierPrice;
                    currency = tier.currency || currencyFromProduct;
                    tierLabel = tier.label || null;
                    break;
                }

                if (quantity >= min && (tier.max_qty === null || tier.max_qty === undefined)) {
                    selectedPrice = tierPrice;
                    currency = tier.currency || currencyFromProduct;
                    tierLabel = tier.label || null;
                }
            }
        }

        const formattedPrice = this.formatCurrency(selectedPrice, currency);
        return { formattedPrice, tierLabel };
    }

    formatCurrency(amount, currencyCode = 'EUR') {
        // Si el precio es 0, mostrar "sobre consulta"
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        if (safeAmount === 0 || safeAmount === null || safeAmount === undefined) {
            // Traducir "sobre consulta" según el idioma
            const translations = {
                'pt': 'Sobre consulta',
                'es': 'Sobre consulta',
                'en': 'On request'
            };
            const currentLang = this.currentLanguage || 'pt';
            return translations[currentLang] || translations['pt'];
        }
        
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            const symbol = this.getCurrencySymbol(currencyCode);
            return `${symbol}${safeAmount.toFixed(2)}`;
        }
    }

    getCurrencySymbol(currencyCode) {
        const symbols = {
            EUR: '€',
            USD: '$',
            BRL: 'R$',
            GBP: '£'
        };
        return symbols[currencyCode] || `${currencyCode} `;
    }

    translateColor(color) {
        const colorTranslations = {
            pt: {
                black: 'Preto',
                white: 'Branco',
                silver: 'Prata',
                pink: 'Rosa',
                blue: 'Azul',
                red: 'Vermelho',
                green: 'Verde',
                yellow: 'Amarelo'
            },
            es: {
                black: 'Negro',
                white: 'Blanco',
                silver: 'Plata',
                pink: 'Rosa',
                blue: 'Azul',
                red: 'Rojo',
                green: 'Verde',
                yellow: 'Amarillo'
            },
            en: {
                black: 'Black',
                white: 'White',
                silver: 'Silver',
                pink: 'Pink',
                blue: 'Blue',
                red: 'Red',
                green: 'Green',
                yellow: 'Yellow'
            }
        };
        
        return colorTranslations[this.currentLanguage]?.[color] || color;
    }

    setupPriceRange() {
        const priceRange = document.getElementById('priceSlider') || document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        
        if (!priceRange || !priceValue) return;

        // Calcular precio máximo de todos los productos
        const maxPrice = this.allProducts.length > 0 ? Math.max(...this.allProducts.map(p => p.precio)) : 200;
        
        priceRange.max = Math.ceil(maxPrice);
        priceRange.value = Math.ceil(maxPrice);
        
        // Actualizar valor inicial
        this.updatePriceValue(Math.ceil(maxPrice));

        // Resetear filtros manteniendo categorías disponibles
        this.filters = {
            categories: [...this.defaultCategories],
            maxPrice: Math.ceil(maxPrice),
            powers: [],
            colors: [],
            types: [],
            technologies: []
        };
        this.updateCategoryCheckboxes();

        // Agregar event listener para el slider
        priceRange.addEventListener('input', () => {
            const value = priceRange.value;
            this.updatePriceValue(value);
            this.filters.maxPrice = parseInt(value);
            this.applyFilters();
        });

        this.updateDynamicFilters().then(() => {
            this.applyFilters();
        });
    }

    updatePriceValue(value) {
        const priceValue = document.getElementById('priceValue');
        if (!priceValue) return;

        const translations = {
            pt: `Até €${value}`,
            es: `Hasta €${value}`,
            en: `Up to €${value}`
        };
        priceValue.textContent = translations[this.currentLanguage];
    }

    clearAllFilters() {
        // Guardar el precio máximo actual antes de resetear
        const currentMaxPrice = this.filters.maxPrice || 200;
        
        // Resetear categorías a las categorías disponibles por defecto
        this.filters = {
            categories: [...this.defaultCategories],
            maxPrice: currentMaxPrice,
            powers: [],
            colors: [],
            types: [],
            technologies: [],
            // Mantener la estructura de filtros dinámicos pero vacía
            dynamicFilters: {}
        };
        
        // Desmarcar todos los checkboxes de filtros dinámicos
        document.querySelectorAll('.dynamic-filter-section input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Desmarcar solo los checkboxes de filtros dinámicos (no los de categoría)
        document.querySelectorAll('#typeOptions input[type="checkbox"], #powerOptions input[type="checkbox"], #colorOptions input[type="checkbox"], #technologyOptions input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Resetear el slider de precio si existe
        const priceRange = document.getElementById('priceRange');
        if (priceRange && this.allProducts.length > 0) {
            const maxPrice = Math.max(...this.allProducts.map(p => p.precio || 0));
            priceRange.value = Math.ceil(maxPrice);
            this.updatePriceValue(Math.ceil(maxPrice));
            this.filters.maxPrice = Math.ceil(maxPrice);
        }

        this.updateCategoryCheckboxes();
        this.updateDynamicFilters().then(() => {
            this.applyFilters();
        });
    }

    setupLanguageSelector() {
        const flagButtons = document.querySelectorAll('.flag-btn');
        flagButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.getAttribute('data-lang');
                this.changeLanguage(lang);
            });
        });
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        
        // Volver a renderizar los productos para mostrar valores traducidos
        if (this.lastFilteredProducts && this.lastFilteredProducts.length > 0) {
            this.displayProducts(this.lastFilteredProducts);
        } else if (this.allProducts && this.allProducts.length > 0) {
            this.displayProducts(this.allProducts);
        }
        localStorage.setItem('language', lang);
        
        // Actualizar botones de idioma
        document.querySelectorAll('.flag-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-lang="${lang}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // Actualizar sistema de traducción
        if (window.translationSystem) {
            window.translationSystem.setLanguage(lang);
        }
        
        // IMPORTANTE: Re-renderizar completamente los filtros de categorías para actualizar los textos
        if (this.homeCategories && this.homeCategories.length > 0) {
            this.renderCategoryFilters();
        }
        
        // Actualizar títulos de filtros estáticos
        this.updateFilterTitles(lang);
        
        // Actualizar textos de ordenamiento
        this.updateSortLabels(lang);
        
        // Actualizar labels de filtros dinámicos sin regenerarlos
        this.updateDynamicFilterLabels(lang);
        
        // Re-renderizar productos con el nuevo idioma (sin cambiar filtros)
        this.applyFilters();
    }
    
    /**
     * Actualizar solo las etiquetas de las categorías sin cambiar los filtros seleccionados
     */
    updateCategoryLabels(lang) {
        const container = document.getElementById('category-filters-container');
        if (!container) return;
        
        // Actualizar cada label de categoría
        this.homeCategories.forEach(category => {
            const categoryValue = this.normalizeCategoryName(category.nombre_es);
            // Buscar el input con el value correspondiente y luego el span dentro del label padre
            const input = container.querySelector(`input[value="${categoryValue}"]`);
            
            if (input) {
                const label = input.closest('label');
                if (label) {
                    const span = label.querySelector('span:last-child'); // El último span es el que contiene el texto
                    if (span) {
                        const nombre = lang === 'es' ? category.nombre_es : 
                                      lang === 'pt' ? category.nombre_pt : 
                                      lang === 'en' ? (category.nombre_en || category.nombre_es) :
                                      category.nombre_es;
                        span.textContent = nombre;
                    }
                }
            }
        });
    }
    
    /**
     * Actualizar solo las etiquetas de los filtros dinámicos sin regenerarlos
     */
    updateDynamicFilterLabels(lang) {
        const container = document.getElementById('dynamic-filters-container');
        if (!container) return;
        
        // Verificar que haya campos guardados
        if (!this.dynamicFilterFields || this.dynamicFilterFields.size === 0) {
            return;
        }
        
        // Actualizar títulos de secciones de filtros dinámicos
        const sections = container.querySelectorAll('.dynamic-filter-section');
        sections.forEach(section => {
            const fieldId = section.getAttribute('data-field-id');
            if (!fieldId) return;
            
            // Buscar el campo directamente en el Map (fieldId → fieldObj)
            const field = this.dynamicFilterFields.get(fieldId);
            if (field) {
                // Actualizar título del filtro
                const titleElement = section.querySelector('.filter-title');
                if (titleElement) {
                    const fieldLabel = lang === 'es' ? field.label_es :
                                      lang === 'pt' ? field.label_pt :
                                      lang === 'en' ? (field.label_en || field.label_es) :
                                      field.label_es;
                    titleElement.textContent = fieldLabel || field.id || fieldId;
                }
                
                // Buscar todos los labels de checkbox
                const checkboxLabels = section.querySelectorAll('.filter-options label.filter-checkbox');
                
                // Si el campo tiene opciones con traducciones, usarlas
                if (field.options && field.options.length > 0) {
                    checkboxLabels.forEach(label => {
                        const checkbox = label.querySelector('input[type="checkbox"]');
                        const textSpan = label.querySelector('span:not(.checkmark)');
                        
                        if (checkbox && textSpan) {
                            const optionValue = checkbox.value;
                            const option = field.options.find(opt => String(opt.value) === String(optionValue));
                            if (option) {
                                const optionLabel = lang === 'es' ? (option.label_es || option.value) :
                                                   lang === 'pt' ? (option.label_pt || option.value) :
                                                   lang === 'en' ? (option.label_en || option.label_es || option.value) :
                                                   option.label_es || option.value;
                                textSpan.textContent = optionLabel;
                            }
                        }
                    });
                } 
                // Si el campo tiene traducciones directas (para campos no-select)
                else if (field.translations) {
                    checkboxLabels.forEach(label => {
                        const checkbox = label.querySelector('input[type="checkbox"]');
                        const textSpan = label.querySelector('span:not(.checkmark)');
                        
                        if (checkbox && textSpan) {
                            const optionValue = checkbox.value;
                            // Intentar buscar la traducción con el valor exacto o normalizado
                            let trans = field.translations[optionValue];
                            
                            // Si no se encuentra, buscar en todas las claves (puede estar guardado con otro formato)
                            if (!trans) {
                                const matchingKey = Object.keys(field.translations).find(key => 
                                    String(key).toLowerCase() === String(optionValue).toLowerCase() ||
                                    String(key).trim() === String(optionValue).trim()
                                );
                                if (matchingKey) {
                                    trans = field.translations[matchingKey];
                                }
                            }
                            
                            if (trans) {
                                const translatedValue = lang === 'es' ? (trans.es || optionValue) :
                                                       lang === 'pt' ? (trans.pt || optionValue) :
                                                       lang === 'en' ? (trans.en || trans.es || optionValue) :
                                                       trans.es || optionValue;
                                textSpan.textContent = translatedValue;
                            } else {
                                // Si no se encuentra la traducción, buscar en todas las claves posibles
                                // El valor del checkbox puede ser el valor en español o portugués
                                const allKeys = Object.keys(field.translations);
                                const matchingKey = allKeys.find(key => {
                                    const transForKey = field.translations[key];
                                    return transForKey && (
                                        transForKey.es === optionValue ||
                                        transForKey.pt === optionValue ||
                                        transForKey.en === optionValue ||
                                        key === optionValue
                                    );
                                });
                                
                                if (matchingKey) {
                                    const trans = field.translations[matchingKey];
                                    const translatedValue = lang === 'es' ? (trans.es || matchingKey) :
                                                           lang === 'pt' ? (trans.pt || matchingKey) :
                                                           lang === 'en' ? (trans.en || trans.es || matchingKey) :
                                                           trans.es || matchingKey;
                                    textSpan.textContent = translatedValue;
                                }
                            }
                        }
                    });
                }
                // Si no hay traducciones, intentar con availableValues guardados
                else if (field.availableValues) {
                    checkboxLabels.forEach(label => {
                        const checkbox = label.querySelector('input[type="checkbox"]');
                        const textSpan = label.querySelector('span:not(.checkmark)');
                        
                        if (checkbox && textSpan) {
                            const optionValue = checkbox.value;
                            const valueObj = field.availableValues.find(v => String(v.value) === String(optionValue));
                            if (valueObj) {
                                const translatedValue = lang === 'es' ? (valueObj.label_es || optionValue) :
                                                       lang === 'pt' ? (valueObj.label_pt || optionValue) :
                                                       lang === 'en' ? (valueObj.label_en || valueObj.label_es || optionValue) :
                                                       valueObj.label_es || optionValue;
                                textSpan.textContent = translatedValue;
                            }
                        }
                    });
                }
            }
        });
    }
    
    /**
     * Actualizar etiquetas de ordenamiento según el idioma
     */
    updateSortLabels(lang) {
        const translations = {
            pt: {
                sortBtn: 'Ordenar',
                sortDefault: 'Predefinido',
                sortPriceAsc: 'Preço: menor a maior',
                sortPriceDesc: 'Preço: maior a menor',
                sortCategory: 'Categoria'
            },
            es: {
                sortBtn: 'Ordenar',
                sortDefault: 'Predeterminado',
                sortPriceAsc: 'Precio: menor a mayor',
                sortPriceDesc: 'Precio: mayor a menor',
                sortCategory: 'Categoría'
            },
            en: {
                sortBtn: 'Sort',
                sortDefault: 'Default',
                sortPriceAsc: 'Price: low to high',
                sortPriceDesc: 'Price: high to low',
                sortCategory: 'Category'
            }
        };
        
        const t = translations[lang] || translations.pt;
        
        // Actualizar opciones del menú desplegable
        const options = document.querySelectorAll('.sort-option');
        options.forEach(option => {
            const sortType = option.dataset.sort;
            const span = option.querySelector('span');
            if (span) {
                switch (sortType) {
                    case 'default':
                        span.textContent = t.sortDefault;
                        break;
                    case 'price-asc':
                        span.textContent = t.sortPriceAsc;
                        break;
                    case 'price-desc':
                        span.textContent = t.sortPriceDesc;
                        break;
                    case 'category':
                        span.textContent = t.sortCategory;
                        break;
                }
            }
        });
        
        // Actualizar el texto del botón si está en estado predeterminado
        this.updateSortDropdownUI(this.currentSort);
    }
    
    /**
     * Actualizar la UI del dropdown de ordenamiento
     */
    updateSortDropdownUI(sortType) {
        const currentLabel = document.getElementById('sort-current-label');
        if (currentLabel) {
            const currentSortOption = document.querySelector(`.sort-option[data-sort="${sortType}"]`);
            if (currentSortOption) {
                const labelSpan = currentSortOption.querySelector('span');
                if (labelSpan) {
                    currentLabel.textContent = labelSpan.textContent;
                }
            }
        }
        
        // Actualizar estado activo de las opciones
        const options = document.querySelectorAll('.sort-option');
        options.forEach(option => {
            if (option.dataset.sort === sortType) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    updateFilterTitles(lang) {
        const translations = {
            pt: {
                power: 'Potência',
                color: 'Cor',
                type: 'Tipo',
                technology: 'Tecnologia',
                upTo: 'Até'
            },
            es: {
                power: 'Potencia',
                color: 'Color',
                type: 'Tipo',
                technology: 'Tecnología',
                upTo: 'Hasta'
            },
            en: {
                power: 'Power',
                color: 'Color',
                type: 'Type',
                technology: 'Technology',
                upTo: 'Up to'
            }
        };

        const t = translations[lang] || translations.pt;

        // Actualizar títulos de filtros dinámicos
        const powerTitle = document.getElementById('power-title');
        const colorTitle = document.getElementById('color-title');
        const typeTitle = document.getElementById('type-title');
        const technologyTitle = document.getElementById('technology-title');

        if (powerTitle) powerTitle.textContent = t.power;
        if (colorTitle) colorTitle.textContent = t.color;
        if (typeTitle) typeTitle.textContent = t.type;
        if (technologyTitle) technologyTitle.textContent = t.technology;

        // Actualizar valor del precio
        const priceSlider = document.getElementById('priceSlider') || document.getElementById('priceRange');
        if (priceSlider) {
            const currentValue = priceSlider.value || '200';
            this.updatePriceValue(currentValue);
        }
        
        // Actualizar placeholder de búsqueda
        this.updateSearchPlaceholder();
    }
    
    /**
     * Actualizar placeholder de la barra de búsqueda según el idioma
     */
    updateSearchPlaceholder() {
        const searchInput = document.getElementById('product-search-input');
        if (!searchInput) return;
        
        const lang = localStorage.getItem('language') || 'pt';
        const translations = {
            pt: 'Buscar por fornecedor, nome, categoria ou cor...',
            es: 'Buscar por fornecedor, nombre, categoría o color...',
            en: 'Search by supplier, name, category or color...'
        };
        
        searchInput.placeholder = translations[lang] || translations.pt;
    }
}

// Inicializar cuando el DOM esté listo
// IMPORTANTE: Esperar a que el DOM esté completamente cargado
// Y asegurar que no haya múltiples inicializaciones
if (!window.productManagerInitialized) {
    window.productManagerInitialized = true;
    
    function initializeProductManager() {
        if (window.productManager) {
            return;
        }
        
        // Ya no necesitamos verificar el contenedor de categorías porque lo eliminamos
        // Verificar solo que el contenedor de productos existe
        const productsContainer = document.getElementById('products-grid');
        if (!productsContainer) {
            setTimeout(initializeProductManager, 200);
            return;
        }
        
        try {
            window.productManager = new DynamicProductsPage();
            // Llamar init() manualmente ya que lo removimos del constructor
            if (window.productManager && typeof window.productManager.init === 'function') {
                window.productManager.init().catch(error => {
                    // Error en init
                });
            }
        } catch (error) {
            window.productManagerInitialized = false; // Permitir reintento
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Usar un pequeño delay para asegurar que todos los scripts estén cargados
            setTimeout(initializeProductManager, 100);
        });
    } else {
        // Si el DOM ya está cargado, inicializar inmediatamente
        // Usar un pequeño delay para asegurar que todos los scripts estén cargados
        setTimeout(initializeProductManager, 100);
    }
}