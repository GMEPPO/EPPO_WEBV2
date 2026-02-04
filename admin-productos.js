// Configuración de campos por categoría (dinámico)
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

let supabaseClient = null;
let brandSuggestions = [];

// Colores VACAVALIENTE con sus códigos (5º y 6º dígito de la referencia)
// Se cargan desde Supabase, pero se inicializa con valores por defecto
let VACAVALIENTE_COLORS = [
    { name: 'Merlot', code: 'B7' },
    { name: 'Red Clay', code: '25' },
    { name: 'Pink Sand', code: '13' },
    { name: 'Sandshell', code: '97' },
    { name: 'Ginger', code: '56' },
    { name: 'Cocoa', code: '45' },
    { name: 'Matone', code: '47' },
    { name: 'Ash', code: '30' },
    { name: 'Pumpkin Orange', code: '26' },
    { name: 'Lemon', code: '10' },
    { name: 'Lotus Green', code: '24' },
    { name: 'Pistacchio', code: 'C0' },
    { name: 'Olive', code: 'B9' },
    { name: 'Sage Green', code: '64' },
    { name: 'Eucalyptus', code: '21' },
    { name: 'Amazonia Green', code: '62' },
    { name: 'Lichen Blue', code: 'B8' },
    { name: 'Ocean Blue', code: '08' },
    { name: 'Tempest Blue', code: '94' },
    { name: 'Majolica Blue', code: 'A0' },
    { name: 'Petrol Blue', code: '20' },
    { name: 'Grafite', code: '36' },
    { name: 'Black', code: '01' }
];

let variants = {
    base: {
        name: '',
        tiers: [{ minQty: '', maxQty: '', price: '' }]
    }
};
let variantCounter = 0; // Contador para IDs únicos de variantes
let customCategories = {}; // Categorías personalizadas cargadas desde Supabase
let editingCategoryId = null; // ID de categoría que se está editando
// categoryFields se declara más abajo para evitar conflictos

// Variable global para el modo actual
let currentMode = 'new'; // 'new', 'edit', 'duplicate'
let selectedProductId = null;

// Variables para almacenar URLs de imágenes subidas
let uploadedFotoUrl = null;
let uploadedFoto2Url = null;

// Sistema de traducciones para el formulario de productos
const productFormTranslations = {
    pt: {
        // Títulos
        pageTitle: 'Criar Novo Produto',
        pageSubtitle: 'Complete as informações do produto de acordo com sua categoria',
        pageTitleEdit: 'Editar Produto',
        pageSubtitleEdit: 'Modifique as informações do produto',
        
        // Secciones
        basicInfo: 'Informação Básica',
        descriptions: 'Descrições',
        categoryFields: 'Campos da Categoria',
        multimedia: 'Multimédia',
        specifications: 'Especificações do Produto',
        deliveryTime: 'Prazo de Entrega',
        referencePackaging: 'Referência e Embalagem',
        referencesSuppliers: 'Referências e Fornecedores',
        referencesColors: 'Referências e Cores',
        supplierBusiness: 'Fornecedor e Área de Negócio',
        referenceVariants: 'Variantes de Referências',
        productZones: 'Zonas do Produto',
        variantsPrices: 'Preços e Variantes',
        
        // Campos
        brand: 'Marca',
        category: 'Categoria',
        market: 'Mercado',
        badge: 'Etiqueta Destacada',
        client: 'Cliente Específico',
        productName: 'Nome do Produto',
        descriptionEs: 'Descrição (Espanhol)',
        descriptionPt: 'Descrição (Português)',
        mainImage: 'Imagem Principal',
        secondaryImage: 'Imagem Secundária',
        technicalSheet: 'URL Ficha Técnica',
        deliveryTimeLabel: 'Prazo de Entrega',
        phcRef: 'Referência PHC',
        boxSize: 'Quantidade por Caixa',
        supplierName: 'Nome de Fornecedor',
        supplierRef: 'Referência Fornecedor',
        businessArea: 'Área de Negócio',
        zonesLabel: 'Zonas onde funciona o produto',
        
        // Zonas
        zoneRoom: 'Quarto',
        zoneBathroom: 'Banheiro',
        zoneCommon: 'Zonas Comuns',
        zoneRestaurants: 'Restaurantes',
        
        // Áreas de negócio
        businessAreaAccessories: 'Acessórios Personalizados',
        businessAreaCosmetics: 'Cosmética Personalizada',
        businessAreaEquipment: 'Equipamento',
        
        // Placeholders
        placeholderBrand: 'Ex. VALERA',
        placeholderProductName: 'Ex. Secador Premium 5400',
        placeholderDescriptionEs: 'Descreva o produto em espanhol',
        placeholderDescriptionPt: 'Descreva o produto em português',
        placeholderPhcRef: 'Ex: PHC-12345',
        placeholderBoxSize: 'Ex: 48',
        placeholderSupplierName: 'Ex: Fornecedor ABC',
        placeholderSupplierRef: 'Ex: FORN-001',
        placeholderDeliveryTime: 'Ex: 15-20 dias, 2-3 semanas, Imediato',
        placeholderTechnicalSheet: 'https://...',
        placeholderReference: 'Ex: REF-001-BLK',
        placeholderColor: 'Ex: Preto',
        placeholderVariantDesc: 'Ex: Variante em cor preta',
        
        // Selects
        selectMarket: 'Selecione um mercado...',
        selectBusinessArea: 'Selecione uma área de negócio...',
        selectCategory: 'Selecione uma categoria...',
        loadingCategories: 'Carregando categorias...',
        loadingFields: 'Carregando campos da categoria...',
        
        // Opciones de mercado
        marketPT: 'Portugal (PT)',
        marketES: 'Espanha (ES)',
        marketBOTH: 'Ambos (PT e ES)',
        
        // Badges
        noBadge: 'Sem etiqueta',
        badgeNew: 'New',
        badgePromotion: 'Promoção',
        
        // Checkboxes y textos de ayuda
        showInCatalog: 'Mostrar na página de produtos (catálogo público)',
        showInCatalogHelp: 'Se estiver desmarcado, o produto aparecerá apenas na lista de produtos para orçamentos, mas não na página pública de produtos.',
        phcRefHelp: 'Referência opcional do produto no sistema PHC',
        boxSizeHelp: 'Se especificado, o produto só poderá ser comprado em múltiplos desta quantidade (48, 96, 144, etc.). Deixar vazio para permitir qualquer quantidade.',
        supplierNameHelp: 'Nome do fornecedor/provedor do produto (opcional)',
        supplierRefHelp: 'Referência do produto no sistema do fornecedor (opcional)',
        businessAreaHelp: 'Área de negócio do produto (obrigatório)',
        referenceVariantsHelp: 'Adicione variantes de referências para diferentes cores ou versões do produto (opcional)',
        zonesHelp: 'Selecione uma ou mais zonas onde este produto pode ser utilizado. Por exemplo, um secador pode funcionar tanto no banheiro quanto no quarto.',
        imageMainHelp: 'Selecione uma imagem do seu PC. Será carregada automaticamente no Supabase.',
        imageSecondaryHelp: 'Opcional: Segunda imagem do produto.',
        
        // Variantes y precios
        basePrice: 'Preço Base (Sem variante)',
        addPriceTier: 'Adicionar Escalão de Preço',
        addCustomVariant: 'Adicionar Variante Personalizada',
        addReferenceVariant: 'Adicionar Variante de Referência',
        
        // Botones
        saveProduct: 'Guardar Produto',
        clearForm: 'Limpar Formulário',
        deleteProduct: 'Eliminar Produto',
        cancel: 'Cancelar',
        save: 'Guardar',
        add: 'Adicionar',
        remove: 'Eliminar',
        manageVacavalienteColors: 'Gerir Cores VACAVALIENTE',
        addColor: 'Adicionar Nova Cor',
        saveColor: 'Guardar Cor',
        cancelColor: 'Cancelar',
        
        // Variantes de referencias
        reference: 'Referência',
        color: 'Cor',
        description: 'Descrição',
        
        // Mensajes
        searchProduct: 'Buscar produto...',
        selectProduct: 'Selecionar Produto',
        confirmClear: 'Tem certeza de que deseja limpar todo o formulário?'
    },
    es: {
        // Títulos
        pageTitle: 'Crear Nuevo Producto',
        pageSubtitle: 'Completa la información del producto según su categoría',
        pageTitleEdit: 'Editar Producto',
        pageSubtitleEdit: 'Modifica la información del producto',
        
        // Secciones
        basicInfo: 'Información Básica',
        descriptions: 'Descripciones',
        categoryFields: 'Campos de la Categoría',
        multimedia: 'Multimedia',
        specifications: 'Especificaciones del Producto',
        deliveryTime: 'Plazo de Entrega',
        referencePackaging: 'Referencia y Embalaje',
        referencesSuppliers: 'Referencias y Proveedores',
        referencesColors: 'Referencias y Colores',
        supplierBusiness: 'Fornecedor y Área de Negocio',
        referenceVariants: 'Variantes de Referencias',
        productZones: 'Zonas del Producto',
        variantsPrices: 'Precios y Variantes',
        
        // Campos
        brand: 'Marca',
        category: 'Categoría',
        market: 'Mercado',
        badge: 'Etiqueta Destacada',
        client: 'Cliente Específico',
        productName: 'Nombre del Producto',
        descriptionEs: 'Descripción (Español)',
        descriptionPt: 'Descripción (Português)',
        mainImage: 'Imagen Principal',
        secondaryImage: 'Imagen Secundaria',
        technicalSheet: 'URL Ficha Técnica',
        deliveryTimeLabel: 'Plazo de Entrega',
        phcRef: 'Referencia PHC',
        boxSize: 'Cantidad por Caja',
        supplierName: 'Nombre de Fornecedor',
        supplierRef: 'Referencia Fornecedor',
        businessArea: 'Área de Negocio',
        zonesLabel: 'Zonas donde funciona el producto',
        
        // Zonas
        zoneRoom: 'Habitación',
        zoneBathroom: 'Baño',
        zoneCommon: 'Zonas Comunes',
        zoneRestaurants: 'Restaurantes',
        
        // Áreas de negocio
        businessAreaAccessories: 'Accesorios Personalizados',
        businessAreaCosmetics: 'Cosmética Personalizada',
        businessAreaEquipment: 'Equipamiento',
        
        // Placeholders
        placeholderBrand: 'Ej. VALERA',
        placeholderProductName: 'Ej. Secador Premium 5400',
        placeholderDescriptionEs: 'Describe el producto en español',
        placeholderDescriptionPt: 'Describa el producto en portugués',
        placeholderPhcRef: 'Ej: PHC-12345',
        placeholderBoxSize: 'Ej: 48',
        placeholderSupplierName: 'Ej: Fornecedor ABC',
        placeholderSupplierRef: 'Ej: FORN-001',
        placeholderDeliveryTime: 'Ej: 15-20 días, 2-3 semanas, Inmediato',
        placeholderTechnicalSheet: 'https://...',
        placeholderReference: 'Ej: REF-001-BLK',
        placeholderColor: 'Ej: Negro',
        placeholderVariantDesc: 'Ej: Variante en color negro',
        
        // Selects
        selectMarket: 'Selecciona un mercado...',
        selectBusinessArea: 'Selecciona un área de negocio...',
        selectCategory: 'Selecciona una categoría...',
        loadingCategories: 'Cargando categorías...',
        loadingFields: 'Cargando campos de la categoría...',
        
        // Opciones de mercado
        marketPT: 'Portugal (PT)',
        marketES: 'España (ES)',
        marketBOTH: 'Ambos (PT y ES)',
        
        // Badges
        noBadge: 'Sin etiqueta',
        badgeNew: 'New',
        badgePromotion: 'Promoción',
        
        // Checkboxes y textos de ayuda
        showInCatalog: 'Mostrar en página de productos (catálogo público)',
        showInCatalogHelp: 'Si está desmarcado, el producto solo aparecerá en la lista de productos para presupuestos, pero no en la página pública de productos.',
        phcRefHelp: 'Referencia opcional del producto en el sistema PHC',
        boxSizeHelp: 'Si se especifica, el producto solo se podrá comprar en múltiplos de esta cantidad (48, 96, 144, etc.). Dejar vacío para permitir cualquier cantidad.',
        supplierNameHelp: 'Nombre del fornecedor/proveedor del producto (opcional)',
        supplierRefHelp: 'Referencia del producto en el sistema del fornecedor (opcional)',
        businessAreaHelp: 'Área de negocio del producto (obligatorio)',
        referenceVariantsHelp: 'Agrega variantes de referencias para diferentes colores o versiones del producto (opcional)',
        zonesHelp: 'Selecciona una o más zonas donde puede utilizarse este producto. Por ejemplo, un secador puede funcionar tanto en el baño como en la habitación.',
        imageMainHelp: 'Selecciona una imagen desde tu PC. Se subirá automáticamente a Supabase.',
        imageSecondaryHelp: 'Opcional: Segunda imagen del producto.',
        
        // Variantes y precios
        basePrice: 'Precio Base (Sin variante)',
        addPriceTier: 'Agregar Escalón de Precio',
        addCustomVariant: 'Agregar Variante Personalizada',
        addReferenceVariant: 'Agregar Variante de Referencia',
        
        // Botones
        saveProduct: 'Guardar Producto',
        clearForm: 'Limpiar Formulario',
        deleteProduct: 'Eliminar Producto',
        cancel: 'Cancelar',
        save: 'Guardar',
        add: 'Agregar',
        remove: 'Eliminar',
        manageVacavalienteColors: 'Gestionar Colores VACAVALIENTE',
        addColor: 'Agregar Nuevo Color',
        saveColor: 'Guardar Color',
        cancelColor: 'Cancelar',
        
        // Variantes de referencias
        reference: 'Referencia',
        color: 'Color',
        description: 'Descripción',
        
        // Mensajes
        searchProduct: 'Buscar producto...',
        selectProduct: 'Seleccionar Producto',
        confirmClear: '¿Estás seguro de que quieres limpiar todo el formulario?'
    }
};

/**
 * Obtener traducción actual
 */
function getTranslation(key) {
    const lang = localStorage.getItem('language') || 'pt';
    const translations = productFormTranslations[lang] || productFormTranslations.pt;
    return translations[key] || key;
}

/**
 * Actualizar todas las traducciones del formulario
 */
function updateProductFormTranslations() {
    const lang = localStorage.getItem('language') || 'pt';
    const t = productFormTranslations[lang] || productFormTranslations.pt;
    
    // Títulos
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = currentMode === 'edit' ? t.pageTitleEdit : t.pageTitle;
    }
    
    const pageSubtitle = document.getElementById('page-subtitle');
    if (pageSubtitle) {
        pageSubtitle.textContent = currentMode === 'edit' ? t.pageSubtitleEdit : t.pageSubtitle;
    }
    
    // Actualizar títulos de secciones
    const sections = document.querySelectorAll('.form-section h2');
    sections.forEach(section => {
        const text = section.textContent.trim();
        if (text.includes('Información Básica') || text.includes('Informação Básica')) {
            section.textContent = t.basicInfo;
        } else if (text.includes('Descripciones') || text.includes('Descrições')) {
            section.textContent = t.descriptions;
        } else if (text.includes('Campos de la Categoría') || text.includes('Campos da Categoria')) {
            section.textContent = t.categoryFields;
        } else if (text.includes('Multimedia') || text.includes('Multimédia')) {
            section.textContent = t.multimedia;
        } else if (text.includes('Especificaciones del Producto') || text.includes('Especificações do Produto')) {
            section.textContent = t.specifications;
        } else if (text.includes('Plazo de Entrega') || text.includes('Prazo de Entrega')) {
            section.textContent = t.deliveryTime;
        } else if (text.includes('Referencia y Embalaje') || text.includes('Referência e Embalagem')) {
            section.textContent = t.referencePackaging;
        } else if (text.includes('Referencias y Proveedores') || text.includes('Referências e Fornecedores')) {
            section.textContent = t.referencesSuppliers || 'Referências e Fornecedores';
        } else if (text.includes('Referencias y Colores') || text.includes('Referências e Cores')) {
            section.textContent = t.referencesColors || 'Referências e Cores';
        } else if (text.includes('Fornecedor') || text.includes('Fornecedor')) {
            section.textContent = t.supplierBusiness;
        } else if (text.includes('Variantes de Referencias') || text.includes('Variantes de Referências')) {
            section.textContent = t.referenceVariants;
        } else if (text.includes('Zonas del Producto') || text.includes('Zonas do Produto')) {
            section.textContent = t.productZones;
        } else if (text.includes('Variantes y Precios') || text.includes('Variantes e Preços') || text.includes('Precios y Variantes') || text.includes('Preços e Variantes')) {
            section.textContent = t.variantsPrices;
        }
    });
    
    // Actualizar textos del botón y modal de colores VACAVALIENTE
    const vacavalienteBtn = document.getElementById('vacavaliente-colors-btn-text');
    if (vacavalienteBtn) {
        vacavalienteBtn.textContent = t.manageVacavalienteColors || 'Gestionar Colores VACAVALIENTE';
    }
    
    const modalTitle = document.getElementById('vacavaliente-colors-modal-title');
    if (modalTitle) {
        modalTitle.textContent = t.manageVacavalienteColors || 'Gestionar Colores VACAVALIENTE';
    }
    
    const addColorBtn = document.getElementById('add-color-btn-text');
    if (addColorBtn) {
        addColorBtn.textContent = t.addColor || 'Agregar Nuevo Color';
    }
    
    const saveColorBtn = document.getElementById('save-color-btn-text');
    if (saveColorBtn) {
        saveColorBtn.textContent = t.saveColor || 'Guardar Color';
    }
    
    const cancelColorBtn = document.getElementById('cancel-color-btn-text');
    if (cancelColorBtn) {
        cancelColorBtn.textContent = t.cancelColor || 'Cancelar';
    }
    
    // Labels
    updateLabel('marca', t.brand);
    updateLabel('categoria', t.category);
    updateLabel('mercado', t.market);
    updateLabel('badge', t.badge);
    updateLabel('clienteSelect', t.client);
    updateLabel('modelo', t.productName);
    updateLabel('descripcionEs', t.descriptionEs);
    updateLabel('descripcionPt', t.descriptionPt);
    updateLabel('foto', t.mainImage);
    updateLabel('foto2', t.secondaryImage);
    updateLabel('fichaTecnica', t.technicalSheet);
    updateLabel('plazoEntrega', t.deliveryTimeLabel);
    updateLabel('phcRef', t.phcRef);
    updateLabel('boxSize', t.boxSize);
    updateLabel('nombreFornecedor', t.supplierName);
    updateLabel('referenciaFornecedor', t.supplierRef);
    updateLabel('areaNegocio', t.businessArea);
    
    // Placeholders
    updatePlaceholder('marca', t.placeholderBrand);
    updatePlaceholder('modelo', t.placeholderProductName);
    updatePlaceholder('descripcionEs', t.placeholderDescriptionEs);
    updatePlaceholder('descripcionPt', t.placeholderDescriptionPt);
    updatePlaceholder('phcRef', t.placeholderPhcRef);
    updatePlaceholder('boxSize', t.placeholderBoxSize);
    updatePlaceholder('nombreFornecedor', t.placeholderSupplierName);
    updatePlaceholder('referenciaFornecedor', t.placeholderSupplierRef);
    updatePlaceholder('plazoEntrega', t.placeholderDeliveryTime);
    updatePlaceholder('fichaTecnica', t.placeholderTechnicalSheet);
    updatePlaceholder('product-search', t.searchProduct);
    
    // Selects
    updateSelectOption('mercado', '', t.selectMarket);
    updateSelectOption('mercado', 'PT', t.marketPT);
    updateSelectOption('mercado', 'ES', t.marketES);
    updateSelectOption('mercado', 'AMBOS', t.marketBOTH);
    
    updateSelectOption('areaNegocio', '', t.selectBusinessArea);
    updateSelectOption('areaNegocio', 'accesorios_personalizados', t.businessAreaAccessories);
    updateSelectOption('areaNegocio', 'cosmetica_personalizada', t.businessAreaCosmetics);
    updateSelectOption('areaNegocio', 'equipamiento', t.businessAreaEquipment);
    
    // Badge - actualizar opciones según el idioma
    const badgeOptions = {
        'pt': {
            '': 'Sem etiqueta',
            'NEW': 'Novo',
            'PROMOCION': 'Promoção',
            'STOCK_LIMITADO': 'Stock limitado'
        },
        'es': {
            '': 'Sin etiqueta',
            'NEW': 'Nuevo',
            'PROMOCION': 'Promoción',
            'STOCK_LIMITADO': 'Stock limitado'
        },
        'en': {
            '': 'No label',
            'NEW': 'New',
            'PROMOCION': 'Promotion',
            'STOCK_LIMITADO': 'Limited Stock'
        }
    };
    
    const currentLang = localStorage.getItem('language') || 'pt';
    const badgeLabels = badgeOptions[currentLang] || badgeOptions['pt'];
    
    // Obtener el valor actual del select antes de actualizarlo
    const badgeSelect = document.getElementById('badge');
    const currentBadgeValue = badgeSelect ? badgeSelect.value : '';
    
    // Limpiar y actualizar opciones
    if (badgeSelect) {
        badgeSelect.innerHTML = '';
        Object.keys(badgeLabels).forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = badgeLabels[value];
            badgeSelect.appendChild(option);
        });
        
        // Restaurar el valor seleccionado si existe
        if (currentBadgeValue) {
            badgeSelect.value = currentBadgeValue;
        }
    }
    
    // Zonas - Actualizar label padre
    const zonesLabel = document.getElementById('zones-label');
    if (zonesLabel) {
        zonesLabel.textContent = t.zonesLabel;
    }
    
    // Zonas - Actualizar labels individuales
    updateZoneLabel('zonaHabitacion', t.zoneRoom);
    updateZoneLabel('zonaBano', t.zoneBathroom);
    updateZoneLabel('zonaComunes', t.zoneCommon);
    updateZoneLabel('zonaRestaurantes', t.zoneRestaurants);
    
    // Botones
    const saveBtn = document.getElementById('saveProductBtnText');
    if (saveBtn) saveBtn.textContent = t.saveProduct;
    
    const deleteBtn = document.getElementById('delete-text');
    if (deleteBtn) deleteBtn.textContent = t.deleteProduct;
    
    // Actualizar textos de ayuda (small)
    updateHelpTexts(t);
    
    // Actualizar textos de variantes
    updateVariantsTexts(t);
    
    // Actualizar checkbox de mostrar en catálogo
    const showInCatalogLabel = document.querySelector('label[for="visibleEnCatalogo"] span');
    if (showInCatalogLabel) {
        showInCatalogLabel.textContent = t.showInCatalog;
    }
    
    // Actualizar selector de producto
    const selectorTitle = document.getElementById('selector-title');
    if (selectorTitle) {
        selectorTitle.textContent = t.selectProduct;
    }
    
    // Actualizar textos de botones de eliminar en imágenes
    const removeImageBtns = document.querySelectorAll('button[onclick*="removeImagePreview"]');
    removeImageBtns.forEach(btn => {
        if (btn.textContent.includes('Eliminar') || btn.textContent.includes('Remover')) {
            btn.innerHTML = `<i class="fas fa-times"></i> ${t.remove}`;
        }
    });
}

/**
 * Actualizar label de un campo
 */
function updateLabel(fieldId, text) {
    const label = document.querySelector(`label[for="${fieldId}"]`);
    if (label) {
        const required = label.classList.contains('required');
        label.textContent = text;
        if (required) {
            label.classList.add('required');
        }
    }
}

/**
 * Actualizar placeholder de un campo
 */
function updatePlaceholder(fieldId, text) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.placeholder = text;
    }
}

/**
 * Actualizar opción de select
 */
function updateSelectOption(selectId, value, text) {
    const select = document.getElementById(selectId);
    if (select) {
        const option = select.querySelector(`option[value="${value}"]`);
        if (option) {
            option.textContent = text;
        }
    }
}

/**
 * Actualizar label de zona
 */
function updateZoneLabel(checkboxId, text) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && checkbox.parentElement) {
        const span = checkbox.parentElement.querySelector('span');
        if (span) {
            span.textContent = text;
        }
    }
}

/**
 * Actualizar label padre de zonas
 */
function updateZonesParentLabel(text) {
    const zonesSection = document.querySelector('.form-section:has(#zonaHabitacion)');
    if (zonesSection) {
        const label = zonesSection.querySelector('label:not(:has(input))');
        if (label && (label.textContent.includes('Zonas donde funciona') || label.textContent.includes('Zonas onde funciona'))) {
            label.textContent = text;
        }
    }
}

/**
 * Actualizar textos de ayuda
 */
function updateHelpTexts(t) {
    // Buscar todos los elementos small y actualizar según su contenido
    const helpTexts = document.querySelectorAll('small');
    helpTexts.forEach(small => {
        const text = small.textContent.trim();
        if (text.includes('Selecciona para qué mercado') || text.includes('Selecione para qual mercado')) {
            small.textContent = t.market === 'Mercado' ? 'Selecciona para qué mercado(s) está disponible este producto' : 'Selecione para qual mercado(s) este produto está disponível';
        } else if (text.includes('Si está desmarcado') || text.includes('Se estiver desmarcado')) {
            small.textContent = t.showInCatalogHelp;
        } else if (text.includes('Referencia opcional') || text.includes('Referência opcional')) {
            small.textContent = t.phcRefHelp;
        } else if (text.includes('Si se especifica') || text.includes('Se especificado')) {
            small.textContent = t.boxSizeHelp;
        } else if (text.includes('Nombre del fornecedor') || text.includes('Nome do fornecedor')) {
            small.textContent = t.supplierNameHelp;
        } else if (text.includes('Referencia del producto en el sistema del fornecedor') || text.includes('Referência do produto no sistema do fornecedor')) {
            small.textContent = t.supplierRefHelp;
        } else if (text.includes('Área de negocio del producto') || text.includes('Área de negócio do produto')) {
            small.textContent = t.businessAreaHelp;
        } else if (text.includes('Agrega variantes') || text.includes('Adicione variantes')) {
            small.textContent = t.referenceVariantsHelp;
        } else if (text.includes('Selecciona una o más zonas') || text.includes('Selecione uma ou mais zonas')) {
            small.textContent = t.zonesHelp;
        } else if (text.includes('Selecciona una imagen') || text.includes('Selecione uma imagem')) {
            small.textContent = t.imageMainHelp;
        } else if (text.includes('Opcional: Segunda imagen') || text.includes('Opcional: Segunda imagem')) {
            small.textContent = t.imageSecondaryHelp;
        }
    });
}

/**
 * Actualizar textos de variantes
 */
function updateVariantsTexts(t) {
    // Actualizar título de variante base
    const baseVariantTitle = document.querySelector('.variant-section[data-variant-id="base"] .variant-header h3');
    if (baseVariantTitle) {
        baseVariantTitle.textContent = t.basePrice;
    }
    
    // Actualizar botones de agregar
    const addPriceTierBtns = document.querySelectorAll('button[onclick*="addPriceTier"]');
    addPriceTierBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon && btn.textContent.includes('Escalón') || btn.textContent.includes('Escalão')) {
            btn.innerHTML = `<i class="fas fa-plus"></i> ${t.addPriceTier}`;
        }
    });
    
    const addVariantBtn = document.querySelector('button[onclick="addVariant()"]');
    if (addVariantBtn) {
        addVariantBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.addCustomVariant}`;
    }
    
    const addRefVariantBtn = document.querySelector('button[onclick="addVarianteReferencia()"]');
    if (addRefVariantBtn) {
        addRefVariantBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.addReferenceVariant}`;
    }
    
    // Actualizar botón de limpiar
    const clearBtn = document.querySelector('button[onclick="resetForm()"]');
    if (clearBtn) {
        clearBtn.innerHTML = `<i class="fas fa-redo"></i> ${t.clearForm}`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar texto del botón de guardar
    updateSaveButtonText();
    
    // Detectar modo desde URL
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'new';
    
    console.log('🔍 Modo detectado:', currentMode);
    
    await initSupabase();
    await loadVacavalienteColors(); // Cargar colores VACAVALIENTE desde Supabase
    loadBrandSuggestions();
    loadCustomCategories();
    
    // Cargar clientes y configurar autocompletado (después de inicializar Supabase)
    // Esperar un poco para asegurar que Supabase esté completamente inicializado
    setTimeout(async () => {
        await loadClientsForProductForm();
        setupClientAutocomplete();
        setupClientCheckboxToggle();
    }, 500);
    
    // Actualizar traducciones del formulario
    setTimeout(() => {
        if (window.updateProductFormTranslations) {
            updateProductFormTranslations();
        }
    }, 500);
    
    // Configurar event listener para el select de tipo de campo en el formulario de categorías
    const fieldTypeSelect = document.getElementById('newFieldType');
    if (fieldTypeSelect) {
        fieldTypeSelect.addEventListener('change', function() {
            const optionsContainer = document.getElementById('newFieldOptionsContainer');
            if (this.value === 'select') {
                optionsContainer.style.display = 'block';
                if (document.getElementById('newFieldOptionsList').children.length === 0) {
                    addNewFieldOption();
                }
            } else {
                optionsContainer.style.display = 'none';
            }
        });
    }
    
    // Configurar visibilidad de descripción PT según el mercado seleccionado
    function toggleDescripcionPt() {
        const mercadoField = document.getElementById('mercado');
        const descripcionPtContainer = document.getElementById('descripcionPtContainer');
        const descripcionPtField = document.getElementById('descripcionPt');
        
        if (!mercadoField || !descripcionPtContainer || !descripcionPtField) return;
        
        const mercado = mercadoField.value;
        
        if (mercado === 'PT' || mercado === 'AMBOS') {
            // Mostrar campo de descripción PT y hacerlo obligatorio
            descripcionPtContainer.style.display = 'block';
            descripcionPtContainer.style.width = '100%';
            descripcionPtContainer.style.gridColumn = '1 / -1'; // Asegurar que ocupe todo el ancho
            descripcionPtField.setAttribute('required', 'required');
            // Asegurar que el textarea tenga el mismo tamaño que el ES
            const descripcionEsField = document.getElementById('descripcionEs');
            if (descripcionEsField) {
                descripcionPtField.style.width = '100%';
                descripcionPtField.style.minHeight = descripcionEsField.style.minHeight || '100px';
            }
        } else if (mercado === 'ES') {
            // Ocultar campo de descripción PT y quitar obligatoriedad
            descripcionPtContainer.style.display = 'none';
            descripcionPtField.removeAttribute('required');
            descripcionPtField.value = ''; // Limpiar valor cuando se oculta
        } else {
            // Si no hay mercado seleccionado, ocultar por defecto
            descripcionPtContainer.style.display = 'none';
            descripcionPtField.removeAttribute('required');
        }
    }
    
    // Agregar event listener al campo mercado
    const mercadoField = document.getElementById('mercado');
    if (mercadoField) {
        mercadoField.addEventListener('change', toggleDescripcionPt);
        // Ejecutar una vez al cargar para establecer el estado inicial
        toggleDescripcionPt();
    }
    
    // Configurar interfaz según el modo INMEDIATAMENTE
    setupModeInterface();
    
    // Verificación adicional para modo 'new' después de un pequeño delay
    setTimeout(() => {
        if (currentMode === 'new') {
            const form = document.getElementById('productForm');
            const selector = document.getElementById('mode-selector');
            
            console.log('🔍 Verificando formulario para modo new...');
            console.log('Form encontrado:', !!form);
            
            if (form) {
                // Forzar visibilidad del formulario
                form.style.display = 'block';
                form.style.visibility = 'visible';
                form.style.opacity = '1';
                form.style.height = 'auto';
                form.style.overflow = 'visible';
                console.log('✅ Formulario forzado a visible para modo new');
                console.log('Estilos aplicados:', {
                    display: form.style.display,
                    visibility: form.style.visibility,
                    opacity: form.style.opacity
                });
                
                // Asegurar que las variantes se rendericen
                setTimeout(() => {
                    if (!variants.base || !variants.base.tiers || variants.base.tiers.length === 0) {
                        variants.base = {
                            name: '',
                            tiers: [{ minQty: '', maxQty: '', price: '' }]
                        };
                    }
                    renderVariants();
                    console.log('✅ Variantes renderizadas');
                }, 200);
            } else {
                console.error('❌ Formulario no encontrado después del delay');
            }
            
            if (selector) {
                selector.style.display = 'none';
            }
        }
    }, 300);
    
    // Verificar si se debe abrir el modal de subcategorías
    const openSubcategoryModal = urlParams.get('openSubcategoryModal');
    const categoryId = urlParams.get('categoryId');
    
    if (openSubcategoryModal === 'true' && categoryId) {
        // Esperar a que se carguen las categorías del home
        setTimeout(async () => {
            // Cargar categorías del home si no están cargadas
            if (!homeCategories || homeCategories.length === 0) {
                try {
                    const { data, error } = await supabaseClient
                        .from('categorias_geral')
                        .select('*')
                        .eq('tipo', 'home')
                        .eq('is_active', true)
                        .order('orden', { ascending: true });
                    
                    if (!error && data) {
                        homeCategories = data;
                    }
                } catch (err) {
                    console.error('Error cargando categorías:', err);
                }
            }
            
            currentCategoryForSubcategories = categoryId;
            const cat = homeCategories.find(c => c.id === categoryId);
            if (cat) {
                const modalTitle = document.getElementById('subcategoryModalTitle');
                if (modalTitle) {
                    modalTitle.textContent = `Crear Subcategoría - ${cat.nombre_es}`;
                }
                const subcategoryModal = document.getElementById('subcategoryModal');
                if (subcategoryModal) {
                    subcategoryModal.classList.add('active');
                    showCreateSubcategoryForm();
                }
            }
            // Limpiar parámetros de la URL
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/[?&]openSubcategoryModal=[^&]*&?|[?&]categoryId=[^&]*&?/g, '').replace(/^&/, '?'));
        }, 1500);
    }
    
    // Escuchar cambios de idioma para actualizar categorías
    window.addEventListener('languageChanged', () => {
        loadCustomCategories();
    });
    
    // Cargar productos si es necesario para editar o duplicar
    if (currentMode === 'edit' || currentMode === 'duplicate') {
        await loadAllProducts();
        renderProductsList();
    }
    setupCategoryChange();
    renderVariants();
});

async function initSupabase() {
  try {
    if (window.universalSupabase) {
      supabaseClient = await window.universalSupabase.getClient();
        } else {
            // Esperar un momento para que universalSupabase se inicialice
            await new Promise(resolve => setTimeout(resolve, 200));
            if (window.universalSupabase) {
                supabaseClient = await window.universalSupabase.getClient();
            } else {
                throw new Error('Supabase no está disponible. Asegúrate de que supabase-config-universal.js se cargue antes.');
            }
        }
    } catch (error) {
        showAlert('Error al inicializar Supabase: ' + error.message, 'error');
        console.error(error);
    }
}

async function loadBrandSuggestions() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient
            .from('products')
            .select('brand')
            .not('brand', 'is', null)
            .not('brand', 'eq', '');
        
        brandSuggestions = [...new Set((data || []).map(r => r.brand).filter(Boolean))].sort();
        
        const datalist = document.getElementById('marcas');
        datalist.innerHTML = brandSuggestions.map(b => `<option value="${b}">`).join('');
        
        // Asignar datalist al campo de marca
        const marcaField = document.getElementById('marca');
        if (marcaField) {
            marcaField.setAttribute('list', 'marcas');
            // Agregar listener para actualizar variantes cuando cambie la marca
            marcaField.addEventListener('change', function() {
                updateVariantesReferenciasForBrand();
            });
            marcaField.addEventListener('input', function() {
                updateVariantesReferenciasForBrand();
            });
        }
  } catch (error) {
        console.error('Error cargando marcas:', error);
    }
}

// ============================================
// GESTIÓN DE COLORES VACAVALIENTE
// ============================================

let editingVacavalienteColorId = null;

/**
 * Cargar colores VACAVALIENTE desde Supabase
 */
async function loadVacavalienteColors() {
    if (!supabaseClient) {
        console.warn('⚠️ Supabase no está inicializado, usando colores por defecto');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('vacavaliente_colors')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('❌ Error cargando colores VACAVALIENTE:', error);
            // Mantener los colores por defecto si hay error
            return;
        }
        
        if (data && data.length > 0) {
            VACAVALIENTE_COLORS = data.map(color => ({
                id: color.id,
                name: color.name,
                code: color.code
            }));
            console.log('✅ Colores VACAVALIENTE cargados desde Supabase:', VACAVALIENTE_COLORS.length);
        } else {
            console.log('ℹ️ No hay colores en Supabase, usando valores por defecto');
        }
    } catch (error) {
        console.error('❌ Excepción cargando colores VACAVALIENTE:', error);
        // Mantener los colores por defecto si hay excepción
    }
}

/**
 * Abrir modal para gestionar colores VACAVALIENTE
 */
async function openVacavalienteColorsManager() {
    console.log('🎨 openVacavalienteColorsManager llamado');
    const modal = document.getElementById('vacavalienteColorsModal');
    if (!modal) {
        console.error('❌ Error: vacavalienteColorsModal no encontrado');
        alert('Error: No se encontró el modal. Verifica que el HTML esté correcto.');
        return;
    }
    
    console.log('✅ Modal encontrado, agregando clase active');
    modal.classList.add('active');
    
    // Asegurar que el modal sea visible
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    document.body.style.overflow = 'hidden';
    
    await loadVacavalienteColorsList();
    
    // Intentar configurar el handler si existe
    if (typeof setupModalOverlayClickHandler === 'function') {
        setupModalOverlayClickHandler();
    }
}

// Hacer la función disponible globalmente
window.openVacavalienteColorsManager = openVacavalienteColorsManager;

/**
 * Cerrar modal de colores VACAVALIENTE
 */
function closeVacavalienteColorsManager() {
    const modal = document.getElementById('vacavalienteColorsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    document.body.style.overflow = '';
    cancelVacavalienteColorEdit();
}

// Hacer la función disponible globalmente
window.closeVacavalienteColorsManager = closeVacavalienteColorsManager;

/**
 * Cargar lista de colores VACAVALIENTE
 */
async function loadVacavalienteColorsList() {
    const listContainer = document.getElementById('vacavalienteColorsList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<p>Cargando colores...</p>';
    
    if (!supabaseClient) {
        listContainer.innerHTML = '<p style="color: #ef4444;">Error: Supabase no está inicializado</p>';
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('vacavaliente_colors')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            listContainer.innerHTML = '<p>No hay colores configurados. Agrega el primero usando el botón de arriba.</p>';
            return;
        }
        
        listContainer.innerHTML = data.map(color => `
            <div class="category-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-white); border: 1px solid var(--bg-gray-200); border-radius: 8px; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: var(--bg-gray-200); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--text-primary);">
                            ${color.code}
                        </div>
                        <div>
                            <h4 style="margin: 0; color: var(--text-primary); font-weight: 600;">${color.name}</h4>
                            <p style="margin: 5px 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">Código: ${color.code}</p>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="editVacavalienteColor('${color.id}')" style="padding: 8px 16px;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger" onclick="deleteVacavalienteColor('${color.id}', '${color.name.replace(/'/g, "\\'")}')" style="padding: 8px 16px;">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Error cargando lista de colores:', error);
        listContainer.innerHTML = `<p style="color: #ef4444;">Error al cargar colores: ${error.message}</p>`;
    }
}

/**
 * Mostrar formulario para crear nuevo color
 */
function showCreateVacavalienteColorForm() {
    editingVacavalienteColorId = null;
    const formSection = document.getElementById('vacavalienteColorFormSection');
    const formTitle = document.getElementById('vacavalienteColorFormTitle');
    const nameInput = document.getElementById('vacavalienteColorName');
    const codeInput = document.getElementById('vacavalienteColorCode');
    
    if (formSection) formSection.style.display = 'block';
    if (formTitle) formTitle.textContent = 'Nuevo Color';
    if (nameInput) nameInput.value = '';
    if (codeInput) codeInput.value = '';
    
    // Scroll al formulario
    formSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Editar color existente
 */
async function editVacavalienteColor(colorId) {
    if (!supabaseClient) {
        showAlert('Error: Supabase no está inicializado', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('vacavaliente_colors')
            .select('*')
            .eq('id', colorId)
            .single();
        
        if (error) throw error;
        
        editingVacavalienteColorId = colorId;
        const formSection = document.getElementById('vacavalienteColorFormSection');
        const formTitle = document.getElementById('vacavalienteColorFormTitle');
        const nameInput = document.getElementById('vacavalienteColorName');
        const codeInput = document.getElementById('vacavalienteColorCode');
        
        if (formSection) formSection.style.display = 'block';
        if (formTitle) formTitle.textContent = `Editar Color: ${data.name}`;
        if (nameInput) nameInput.value = data.name;
        if (codeInput) codeInput.value = data.code;
        
        // Scroll al formulario
        formSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('❌ Error cargando color para editar:', error);
        showAlert('Error al cargar el color: ' + error.message, 'error');
    }
}

/**
 * Guardar color (crear o actualizar)
 */
async function saveVacavalienteColor() {
    if (!supabaseClient) {
        showAlert('Error: Supabase no está inicializado', 'error');
        return;
    }
    
    const nameInput = document.getElementById('vacavalienteColorName');
    const codeInput = document.getElementById('vacavalienteColorCode');
    
    if (!nameInput || !codeInput) {
        showAlert('Error: Campos no encontrados', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    
    // Validaciones
    if (!name) {
        showAlert('Por favor, ingresa un nombre para el color', 'error');
        return;
    }
    
    if (!code || code.length !== 2) {
        showAlert('El código debe tener exactamente 2 caracteres', 'error');
        return;
    }
    
    if (!/^[A-Z0-9]{2}$/.test(code)) {
        showAlert('El código solo puede contener letras mayúsculas y números', 'error');
        return;
    }
    
    try {
        const colorData = {
            name: name,
            code: code
        };
        
        let result;
        if (editingVacavalienteColorId) {
            // Actualizar
            const { data, error } = await supabaseClient
                .from('vacavaliente_colors')
                .update(colorData)
                .eq('id', editingVacavalienteColorId)
                .select()
                .single();
            
            if (error) throw error;
            result = data;
            showAlert('Color actualizado exitosamente', 'success');
        } else {
            // Crear
            const { data, error } = await supabaseClient
                .from('vacavaliente_colors')
                .insert(colorData)
                .select()
                .single();
            
            if (error) throw error;
            result = data;
            showAlert('Color creado exitosamente', 'success');
        }
        
        // Recargar colores y actualizar lista
        await loadVacavalienteColors();
        await loadVacavalienteColorsList();
        cancelVacavalienteColorEdit();
        
        // Si hay productos VACAVALIENTE abiertos, actualizar los selects
        updateVacavalienteColorSelects();
        
    } catch (error) {
        console.error('❌ Error guardando color:', error);
        if (error.code === '23505') {
            if (error.message.includes('code')) {
                showAlert('Ya existe un color con ese código', 'error');
            } else {
                showAlert('Ya existe un color con ese nombre', 'error');
            }
        } else {
            showAlert('Error al guardar el color: ' + error.message, 'error');
        }
    }
}

/**
 * Eliminar color
 */
async function deleteVacavalienteColor(colorId, colorName) {
    if (!supabaseClient) {
        showAlert('Error: Supabase no está inicializado', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar el color "${colorName}"?`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('vacavaliente_colors')
            .delete()
            .eq('id', colorId);
        
        if (error) throw error;
        
        showAlert('Color eliminado exitosamente', 'success');
        await loadVacavalienteColors();
        await loadVacavalienteColorsList();
        
        // Si hay productos VACAVALIENTE abiertos, actualizar los selects
        updateVacavalienteColorSelects();
        
    } catch (error) {
        console.error('❌ Error eliminando color:', error);
        showAlert('Error al eliminar el color: ' + error.message, 'error');
    }
}

/**
 * Cancelar edición de color
 */
function cancelVacavalienteColorEdit() {
    editingVacavalienteColorId = null;
    const formSection = document.getElementById('vacavalienteColorFormSection');
    if (formSection) {
        formSection.style.display = 'none';
    }
}

/**
 * Actualizar los selects de colores VACAVALIENTE en el formulario si hay productos abiertos
 */
function updateVacavalienteColorSelects() {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return;
    
    const colorSelects = container.querySelectorAll('.vacavaliente-color-select');
    colorSelects.forEach(select => {
        const currentValue = select.value;
        const colorOptions = VACAVALIENTE_COLORS.map(color => 
            `<option value="${color.code}" ${color.code === currentValue ? 'selected' : ''}>${color.name}</option>`
        ).join('');
        
        select.innerHTML = colorOptions;
    });
}

/**
 * Actualizar variantes de referencia cuando cambia la marca
 */
async function updateVariantesReferenciasForBrand() {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return;
    
    const marcaField = document.getElementById('marca');
    const isVacavaliente = marcaField && marcaField.value && marcaField.value.toUpperCase().trim() === 'VACAVALIENTE';
    
    // Si se selecciona VACAVALIENTE, recargar los colores desde Supabase para asegurar que estén actualizados
    if (isVacavaliente) {
        await loadVacavalienteColors();
        console.log('🔄 Colores VACAVALIENTE recargados desde Supabase');
    }
    
    if (isVacavaliente) {
        // Si cambia a VACAVALIENTE, verificar si hay referencia base y generar todas las variantes
        const baseRef = getVacavalienteBaseReference();
        if (baseRef && baseRef.length >= 6) {
            // Si hay referencia base válida, generar todas las variantes automáticamente
            generateAllVacavalienteVariants();
        } else {
            // Si no hay referencia base, limpiar y mostrar solo el campo de referencia base
            container.innerHTML = '';
            const t = productFormTranslations[localStorage.getItem('language') || 'pt'] || productFormTranslations.pt;
            const baseRefHtml = `
                <div style="grid-column: 1 / -1; margin-bottom: 15px; padding: 10px; background: var(--bg-gray-100); border-radius: 6px; border: 1px solid var(--bg-gray-200);">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text-primary);">
                        Referencia Base (VACAVALIENTE)
                    </label>
                    <input type="text" 
                           class="vacavaliente-base-ref-input" 
                           placeholder="Ej. MT080022" 
                           value="" 
                           style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);"
                           oninput="generateAllVacavalienteVariants()">
                    <small style="display: block; margin-top: 5px; color: var(--text-secondary);">
                        Los dígitos 5 y 6 se reemplazarán automáticamente según el color. Se crearán automáticamente todas las variantes para cada color disponible.
                    </small>
                </div>
            `;
            container.innerHTML = baseRefHtml;
        }
    } else {
        // Si cambia de VACAVALIENTE a otra marca, mantener las variantes existentes pero en formato normal
        const existingVariantes = getVariantesReferencias();
        container.innerHTML = '';
        existingVariantes.forEach(variante => {
            addVarianteReferencia(variante);
        });
    }
}

function setupCategoryChange() {
    const categoriaSelect = document.getElementById('categoria');
    const categoryFieldsSection = document.getElementById('categoryFieldsSection');
    
    if (!categoriaSelect) return;
    
    // Ejecutar al cargar si ya hay una categoría seleccionada
    if (categoriaSelect.value) {
        const categoria = categoriaSelect.value;
        if (categoryFieldsSection) {
            categoryFieldsSection.style.display = 'block';
        }
        renderCategoryFields(categoria).catch(err => console.error('Error renderizando campos:', err));
    }
    
    categoriaSelect.addEventListener('change', async () => {
        const categoria = categoriaSelect.value;
        
        if (categoria) {
            // Mostrar la sección de campos dinámicos
            if (categoryFieldsSection) {
                categoryFieldsSection.style.display = 'block';
            }
            await renderCategoryFields(categoria);
        } else {
            // Ocultar la sección si no hay categoría seleccionada
            if (categoryFieldsSection) {
                categoryFieldsSection.style.display = 'none';
            }
            // Limpiar campos específicos anteriores al cambiar de categoría
            const container = document.getElementById('categoryFields');
            if (container) {
                container.innerHTML = '<p style="color: #6b7280; grid-column: 1 / -1;">Selecciona una categoría para ver los campos disponibles</p>';
            }
        }
    });
}


// Variables globales para subcategorías
let subcategories = [];
let editingSubcategoryId = null;
let currentCategoryForSubcategories = null;

async function loadCustomCategories() {
    if (!supabaseClient) return;
    
    const select = document.getElementById('categoria');
    if (!select) return;
    
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    try {
        // Cargar categorías desde categorias_geral (solo activas, tipo home)
        const { data, error } = await supabaseClient
            .from('categorias_geral')
            .select('*')
            .eq('tipo', 'home')
            .eq('is_active', true)
            .order('orden', { ascending: true });
        
        if (error) {
            console.error('Error cargando categorías del home:', error);
            select.innerHTML = '<option value="">Error al cargar categorías</option>';
            return;
        }
        
        if (data && data.length > 0) {
            const currentLang = localStorage.getItem('language') || 'pt';
            
            data.forEach(cat => {
                // Obtener nombre según idioma
                const nombre = currentLang === 'es' ? cat.nombre_es : 
                              currentLang === 'pt' ? cat.nombre_pt : 
                              cat.nombre_es;
                
                // Crear valor de categoría (normalizado)
                const categoryValue = cat.nombre_es.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                // Agregar al dropdown
                const option = document.createElement('option');
                option.value = categoryValue;
                option.textContent = nombre;
                option.setAttribute('data-category-id', cat.id);
                option.setAttribute('data-category-name', cat.nombre_es);
                select.appendChild(option);
            });
            
            console.log('✅ Categorías del home cargadas:', data.length);
        } else {
            select.innerHTML = '<option value="">No hay categorías disponibles</option>';
            console.warn('⚠️ No se encontraron categorías activas');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        select.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
}

// Función auxiliar para cargar subcategorías (usada solo en gestión de categorías del home)
async function loadSubcategories(categoryId) {
    if (!supabaseClient || !categoryId) return [];
    
    try {
        const { data, error } = await supabaseClient
            .from('categorias_geral')
            .select('*')
            .eq('tipo', 'subcategory')
            .eq('categoria_padre_id', categoryId)
            .eq('is_active', true)
            .order('orden', { ascending: true });
        
        if (error) {
            console.error('Error cargando subcategorías:', error);
            return [];
        }
        
        subcategories = data || [];
        console.log('✅ Subcategorías cargadas:', subcategories.length);
        return subcategories;
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
        return [];
    }
}

// Variable para evitar múltiples llamadas simultáneas
let isRenderingCategoryFields = false;

async function renderCategoryFields(categoria) {
    // Evitar múltiples llamadas simultáneas
    if (isRenderingCategoryFields) {
        console.warn('⚠️ renderCategoryFields ya está en ejecución, omitiendo llamada duplicada');
        return;
    }
    
    isRenderingCategoryFields = true;
    
    const container = document.getElementById('categoryFields');
    const title = document.getElementById('categoryFieldsTitle');
    const categoryFieldsSection = document.getElementById('categoryFieldsSection');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor categoryFields');
        isRenderingCategoryFields = false;
        return;
    }
    
    // Limpiar campos anteriores completamente
    container.innerHTML = '<p style="color: #6b7280; grid-column: 1 / -1;">Cargando campos...</p>';
    
    // Actualizar título
    const categoryNames = {
        'secadores': 'Secadores',
        'planchas': 'Planchas',
        'tablas-planchar': 'Tablas de planchar',
        'porta-malas': 'Porta-malas'
    };
    
    // Incluir categorías personalizadas
    Object.keys(customCategories).forEach(id => {
        categoryNames[id] = customCategories[id].name;
    });
    
    if (!categoria) {
        if (title) title.textContent = 'Campos de la Categoría';
        if (categoryFieldsSection) categoryFieldsSection.style.display = 'none';
        container.innerHTML = '<p style="color: #6b7280; grid-column: 1 / -1;">Selecciona una categoría para ver los campos disponibles</p>';
        return;
    }
    
    // Mostrar la sección
    if (categoryFieldsSection) {
        categoryFieldsSection.style.display = 'block';
    }
    
    if (title) title.textContent = `Campos de la Categoría - ${categoryNames[categoria] || categoria}`;
    
    // Cargar campos desde la base de datos (category_fields)
    // IMPORTANTE: Cargar TODOS los campos, no solo los de show_in_filters=true
    let fields = [];
    
    if (supabaseClient) {
        try {
            // Obtener el ID de la categoría desde el select
            const categoriaSelect = document.getElementById('categoria');
            if (categoriaSelect) {
                const selectedOption = categoriaSelect.options[categoriaSelect.selectedIndex];
                const categoryId = selectedOption.getAttribute('data-category-id');
                
                if (categoryId) {
                    console.log('🔍 Cargando campos para categoría ID:', categoryId);
                    
                    // Cargar TODOS los campos desde category_fields (sin filtrar por show_in_filters)
                    const { data, error } = await supabaseClient
                        .from('category_fields')
                        .select('*')
                        .eq('categoria_id', categoryId)
                        .order('orden', { ascending: true });
                    
                    if (error) {
                        console.error('❌ Error cargando campos desde BD:', error);
                    } else if (data && data.length > 0) {
                        // Convertir campos de la BD al formato esperado
                        const currentLang = localStorage.getItem('language') || 'pt';
                        fields = data.map(field => {
                            const label = currentLang === 'es' ? field.label_es : field.label_pt;
                            
                            // Para campos numéricos, usar un solo placeholder genérico (priorizar ES, luego PT, luego genérico)
                            let placeholder = '';
                            if (field.field_type === 'number') {
                                // Para números, usar placeholder_es o placeholder_pt (ambos deberían ser iguales)
                                placeholder = field.placeholder_es || field.placeholder_pt || '';
                            } else {
                                // Para otros tipos, usar el placeholder según el idioma actual
                                placeholder = currentLang === 'es' ? (field.placeholder_es || '') : (field.placeholder_pt || '');
                            }
                            
                            const fieldObj = {
                                id: field.field_id,
                                label: label,
                                label_es: field.label_es,
                                label_pt: field.label_pt,
                                type: field.field_type,
                                placeholder: placeholder,
                                placeholder_es: field.placeholder_es || '',
                                placeholder_pt: field.placeholder_pt || '',
                                required: field.is_required || false,
                                // Guardar también el ID de category_fields para poder relacionarlo
                                categoryFieldId: field.id
                            };
                            
                            // Si es select, agregar opciones
                            if (field.field_type === 'select' && field.options && Array.isArray(field.options)) {
                                fieldObj.options = field.options.map(opt => ({
                                    value: opt.value,
                                    label: currentLang === 'es' ? opt.label_es : opt.label_pt,
                                    label_es: opt.label_es,
                                    label_pt: opt.label_pt
                                }));
                            }
                            
                            return fieldObj;
                        });
                        
                        console.log('✅ Campos cargados desde BD:', fields.length);
                        console.log('📋 Campos:', fields.map(f => ({ id: f.id, label: f.label, type: f.type })));
                        
                        // Eliminar duplicados por field_id (mantener el primero encontrado)
                        // IMPORTANTE: Usar field_id (ej: "potencia_secadores") no el UUID
                        const uniqueFields = [];
                        const seenFieldIds = new Set();
                        fields.forEach(field => {
                            // Usar field.id que es el field_id (ej: "potencia_secadores")
                            const fieldIdKey = field.id;
                            if (!seenFieldIds.has(fieldIdKey)) {
                                seenFieldIds.add(fieldIdKey);
                                uniqueFields.push(field);
                            } else {
                                // Campo duplicado eliminado
                            }
                        });
                        fields = uniqueFields;
                        console.log(`✅ Campos únicos después de eliminar duplicados: ${fields.length}`);
                        console.log(`📋 IDs únicos:`, Array.from(seenFieldIds));
                    } else {
                        console.log('ℹ️ No se encontraron campos en BD para esta categoría');
                    }
                } else {
                    console.warn('⚠️ No se encontró categoryId en la opción seleccionada');
                }
            }
        } catch (error) {
            console.error('❌ Error cargando campos desde BD:', error);
        }
    }
    
    // Si no hay campos en BD, usar los predefinidos (fallback)
    if (fields.length === 0) {
        console.log('🔄 Usando campos predefinidos como fallback');
        fields = categoryFieldsConfig[categoria] || [];
        
        // Si es una categoría personalizada, usar sus campos
        if (customCategories[categoria]) {
            fields = customCategories[categoria].fields || [];
        }
    }
    
    if (fields.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; grid-column: 1 / -1;">No hay campos configurados para esta categoría. Ve a "Categorías del Home" y gestiona los campos de esta categoría.</p>';
        isRenderingCategoryFields = false;
        return;
    }
    
    // Obtener campos visibles del producto si está en modo edición
    // visibleFields puede ser un array de strings (field_ids) o un array de objetos {field_id, label_es, label_pt}
    const visibleFields = window.editingProductId && window.editingProduct?.visible_fields 
        ? window.editingProduct.visible_fields 
        : [];
    
    // Función helper para obtener el field_id de un campo visible (compatibilidad con ambos formatos)
    const getVisibleFieldId = (fieldConfig) => {
        return typeof fieldConfig === 'string' ? fieldConfig : (fieldConfig?.field_id || fieldConfig);
    };
    
    // Evitar duplicados: usar un Set para rastrear los IDs de campos ya renderizados
    const renderedFieldIds = new Set();
    
    // Renderizar cada campo según su tipo
    fields.forEach(field => {
        // Evitar renderizar el mismo campo dos veces
        if (renderedFieldIds.has(field.id)) {
            console.warn(`⚠️ Campo duplicado detectado y omitido: ${field.id} (tipo: ${field.type})`);
            return;
        }
        renderedFieldIds.add(field.id);
        
        // Log para depuración
        console.log(`🔍 Renderizando campo: id="${field.id}", type="${field.type}", field_type="${field.field_type}", label="${field.label}"`);
        
        // Normalizar el tipo del campo (usar field.type o field.field_type)
        const fieldType = field.type || field.field_type || 'text';
        
        // Campos numéricos solo necesitan una versión (ej: potencia)
        // IMPORTANTE: Verificar tanto field.type como field.field_type para compatibilidad
        if (fieldType === 'number') {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            
            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            if (field.required) {
                label.className = 'required';
            }
            label.textContent = field.label;
            fieldDiv.appendChild(label);
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = field.id;
            input.name = field.id;
            input.placeholder = field.placeholder || '';
            if (field.required) {
                input.setAttribute('required', 'required');
            }
            
            fieldDiv.appendChild(input);
            
            // Agregar checkbox para mostrar en tarjeta
            const showInCardDiv = document.createElement('div');
            showInCardDiv.style.marginTop = '8px';
            showInCardDiv.style.display = 'flex';
            showInCardDiv.style.alignItems = 'center';
            showInCardDiv.style.gap = '8px';
            
            const showInCardCheckbox = document.createElement('input');
            showInCardCheckbox.type = 'checkbox';
            showInCardCheckbox.id = `showInCard_${field.id}`;
            showInCardCheckbox.name = `showInCard_${field.id}`;
            // Si está en modo edición y el campo está en visibleFields, marcarlo
            showInCardCheckbox.checked = visibleFields.length > 0 
                ? visibleFields.some(vf => getVisibleFieldId(vf) === field.id)
                : true; // Por defecto visible si no hay campos definidos
            showInCardCheckbox.style.cursor = 'pointer';
            
            const showInCardLabel = document.createElement('label');
            showInCardLabel.setAttribute('for', `showInCard_${field.id}`);
            showInCardLabel.textContent = 'Mostrar en tarjeta del producto';
            showInCardLabel.style.fontSize = '0.875rem';
            showInCardLabel.style.color = '#6b7280';
            showInCardLabel.style.cursor = 'pointer';
            showInCardLabel.style.margin = '0';
            showInCardLabel.style.fontWeight = 'normal';
            
            showInCardDiv.appendChild(showInCardCheckbox);
            showInCardDiv.appendChild(showInCardLabel);
            fieldDiv.appendChild(showInCardDiv);
            
            container.appendChild(fieldDiv);
        } else {
            // Campos especiales: garantía y dimensiones solo en un idioma
            const singleLanguageFields = ['garantia', 'dimensiones'];
            
            if (singleLanguageFields.includes(field.id)) {
                // Solo una versión para garantía y dimensiones
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'form-group';
                
                const label = document.createElement('label');
                label.setAttribute('for', field.id);
                if (field.required) {
                    label.className = 'required';
                }
                label.textContent = field.label;
                fieldDiv.appendChild(label);
                
                let input;
                if (field.type === 'number') {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.id = field.id;
                    input.name = field.id;
                    input.placeholder = field.placeholder || '';
                    if (field.required) {
                        input.setAttribute('required', 'required');
                    }
                } else {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.id = field.id;
                    input.name = field.id;
                    input.placeholder = field.placeholder || '';
                    if (field.required) {
                        input.setAttribute('required', 'required');
                    }
                }
                
                fieldDiv.appendChild(input);
                
                // Agregar checkbox para mostrar en tarjeta (para campos especiales)
                const showInCardDiv = document.createElement('div');
                showInCardDiv.style.marginTop = '8px';
                showInCardDiv.style.display = 'flex';
                showInCardDiv.style.alignItems = 'center';
                showInCardDiv.style.gap = '8px';
                
                const showInCardCheckbox = document.createElement('input');
                showInCardCheckbox.type = 'checkbox';
                showInCardCheckbox.id = `showInCard_${field.id}`;
                showInCardCheckbox.name = `showInCard_${field.id}`;
                showInCardCheckbox.checked = true; // Por defecto visible
                showInCardCheckbox.style.cursor = 'pointer';
                
                const showInCardLabel = document.createElement('label');
                showInCardLabel.setAttribute('for', `showInCard_${field.id}`);
                showInCardLabel.textContent = 'Mostrar en tarjeta del producto';
                showInCardLabel.style.fontSize = '0.875rem';
                showInCardLabel.style.color = '#6b7280';
                showInCardLabel.style.cursor = 'pointer';
                showInCardLabel.style.margin = '0';
                showInCardLabel.style.fontWeight = 'normal';
                
                showInCardDiv.appendChild(showInCardCheckbox);
                showInCardDiv.appendChild(showInCardLabel);
                fieldDiv.appendChild(showInCardDiv);
                
                container.appendChild(fieldDiv);
            } else {
                // Otros campos de texto y select necesitan versión ES y PT
                
                // Contenedor principal para el campo (ES y PT juntos)
                const fieldContainer = document.createElement('div');
                fieldContainer.style.marginBottom = '20px';
                
                // Versión Español
                const fieldDivEs = document.createElement('div');
                fieldDivEs.className = 'form-group';
                
                const labelEs = document.createElement('label');
                labelEs.setAttribute('for', field.id + '_es');
                if (field.required) {
                    labelEs.className = 'required';
                }
                labelEs.textContent = field.label + ' (Español)';
                fieldDivEs.appendChild(labelEs);
                
                let inputEs;
                
                if (field.type === 'select') {
                    inputEs = document.createElement('select');
                    inputEs.id = field.id + '_es';
                    inputEs.name = field.id + '_es';
                    if (field.required) {
                        inputEs.setAttribute('required', 'required');
                    }
                    
                    // Agregar opciones
                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = typeof opt === 'string' ? opt : opt.value;
                        option.textContent = typeof opt === 'string' ? opt : opt.label;
                        inputEs.appendChild(option);
                    });
                } else {
                    inputEs = document.createElement('input');
                    inputEs.type = 'text';
                    inputEs.id = field.id + '_es';
                    inputEs.name = field.id + '_es';
                    inputEs.placeholder = (field.placeholder || '') + ' (ES)';
                    if (field.required) {
                        inputEs.setAttribute('required', 'required');
                    }
                }
                
                fieldDivEs.appendChild(inputEs);
                container.appendChild(fieldDivEs);
                
                // Versión Portugués
                const fieldDivPt = document.createElement('div');
                fieldDivPt.className = 'form-group';
                
                const labelPt = document.createElement('label');
                labelPt.setAttribute('for', field.id + '_pt');
                labelPt.textContent = field.label + ' (Português)';
                fieldDivPt.appendChild(labelPt);
                
                let inputPt;
                
                if (field.type === 'select') {
                    inputPt = document.createElement('select');
                    inputPt.id = field.id + '_pt';
                    inputPt.name = field.id + '_pt';
                    
                    // Agregar opciones traducidas al portugués
                    const ptTranslations = {
                        'si': 'Sim',
                        'no': 'Não',
                        'removible': 'Removível',
                        'frio_caliente': 'Ar frio e quente',
                        'solo_caliente': 'Apenas ar quente',
                        'vapor': 'A vapor',
                        'seco': 'Seco',
                        'ambos': 'Ambos'
                    };
                    
                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        const optValue = typeof opt === 'string' ? opt : opt.value;
                        option.value = optValue;
                        const optLabel = typeof opt === 'string' ? opt : opt.label;
                        option.textContent = ptTranslations[optValue] || optLabel;
                        inputPt.appendChild(option);
                    });
                } else {
                    inputPt = document.createElement('input');
                    inputPt.type = 'text';
                    inputPt.id = field.id + '_pt';
                    inputPt.name = field.id + '_pt';
                    inputPt.placeholder = (field.placeholder || '') + ' (PT)';
                }
                
                fieldDivPt.appendChild(inputPt);
                fieldContainer.appendChild(fieldDivPt);
                
                // Agregar checkbox para mostrar en tarjeta (una sola vez para ES y PT)
                const showInCardDiv = document.createElement('div');
                showInCardDiv.style.marginTop = '8px';
                showInCardDiv.style.display = 'flex';
                showInCardDiv.style.alignItems = 'center';
                showInCardDiv.style.gap = '8px';
                
                const showInCardCheckbox = document.createElement('input');
                showInCardCheckbox.type = 'checkbox';
                showInCardCheckbox.id = `showInCard_${field.id}`;
                showInCardCheckbox.name = `showInCard_${field.id}`;
                showInCardCheckbox.checked = true; // Por defecto visible
                showInCardCheckbox.style.cursor = 'pointer';
                
                const showInCardLabel = document.createElement('label');
                showInCardLabel.setAttribute('for', `showInCard_${field.id}`);
                showInCardLabel.textContent = 'Mostrar en tarjeta del producto';
                showInCardLabel.style.fontSize = '0.875rem';
                showInCardLabel.style.color = '#6b7280';
                showInCardLabel.style.cursor = 'pointer';
                showInCardLabel.style.margin = '0';
                showInCardLabel.style.fontWeight = 'normal';
                
                showInCardDiv.appendChild(showInCardCheckbox);
                showInCardDiv.appendChild(showInCardLabel);
                fieldContainer.appendChild(showInCardDiv);
                
                container.appendChild(fieldContainer);
            }
        }
    });
    
    // Marcar como completado
    isRenderingCategoryFields = false;
    console.log('✅ renderCategoryFields completado. Total de campos renderizados:', renderedFieldIds.size);
}

function renderVariants() {
    const container = document.getElementById('variantsContainer');
    if (!container) {
        console.warn('⚠️ No se encontró variantsContainer');
        return;
    }
    
    console.log('🔄 Renderizando variantes...');
    
    let html = '';
    
    // Renderizar variante base
    html += `
        <div class="variant-section" data-variant-id="base">
            <div class="variant-header">
                <h3>Precio Base (Sin variante)</h3>
            </div>
            <div id="basePriceTiers" class="price-tiers-container">
                ${renderPriceTiersForVariant('base')}
            </div>
            <button type="button" class="btn btn-add" onclick="addPriceTier('base')">
                <i class="fas fa-plus"></i> Agregar Escalón de Precio
            </button>
        </div>
    `;
    
    // Renderizar variantes personalizadas
    Object.keys(variants).forEach(variantId => {
        if (variantId === 'base') return;
        
        const variant = variants[variantId];
        if (!variant) return;
        
        html += `
            <div class="variant-section" data-variant-id="${variantId}">
                <div class="variant-header">
                    <input type="text" placeholder="Nombre de la variante (ej: Logo en 1 gomo)" 
                           value="${variant.name || ''}" 
                           onchange="variants['${variantId}'].name = this.value"
                           style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-weight: 600;">
                    <button type="button" class="btn btn-danger" onclick="removeVariant('${variantId}')" style="margin-left: 10px;">
                        <i class="fas fa-trash"></i> Eliminar Variante
                    </button>
                </div>
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text-primary, #111827);">
                        Plazo de Entrega (si hay stock y solo falta personalizar):
                    </label>
                    <input type="text" 
                           placeholder="Ej: 5-7 días, 1 semana" 
                           value="${variant.plazo_entrega_personalizado || ''}" 
                           onchange="variants['${variantId}'].plazo_entrega_personalizado = this.value"
                           style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <small style="display: block; margin-top: 5px; color: #6b7280; font-size: 0.875rem;">
                        Plazo cuando hay stock y solo falta estampar/personalizar el producto
                    </small>
                </div>
                <div id="${variantId}PriceTiers" class="price-tiers-container">
                    ${renderPriceTiersForVariant(variantId)}
                </div>
                <button type="button" class="btn btn-add" onclick="addPriceTier('${variantId}')">
                    <i class="fas fa-plus"></i> Agregar Escalón de Precio
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderPriceTiersForVariant(variantId) {
    const variant = variants[variantId];
    if (!variant || !variant.tiers) return '';
    const tiers = variant.tiers || [];
    return tiers.map((tier, index) => `
        <div class="price-tier">
            <input type="number" placeholder="Cantidad mín" value="${tier.minQty || ''}" min="0"
                   onchange="variants['${variantId}'].tiers[${index}].minQty = this.value">
            <input type="number" placeholder="Cantidad máx" value="${tier.maxQty || ''}" min="0"
                   onchange="variants['${variantId}'].tiers[${index}].maxQty = this.value">
            <input type="number" step="0.001" placeholder="Precio €" value="${tier.price || ''}" required
                   onchange="variants['${variantId}'].tiers[${index}].price = this.value">
            ${tiers.length > 1 ? `
                <button type="button" class="btn btn-danger" onclick="removePriceTier('${variantId}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            ` : '<div></div>'}
        </div>
    `).join('');
}

function addPriceTier(variantId) {
    if (!variants[variantId]) {
        variants[variantId] = { name: '', tiers: [], plazo_entrega_personalizado: '' };
    }
    if (!variants[variantId].tiers) {
        variants[variantId].tiers = [];
    }
    variants[variantId].tiers.push({ minQty: '', maxQty: '', price: '' });
    renderVariants();
}

function removePriceTier(variantId, index) {
    if (variants[variantId] && variants[variantId].tiers && variants[variantId].tiers.length > 1) {
        variants[variantId].tiers.splice(index, 1);
        renderVariants();
    }
}

function addVariant() {
    // Obtener todas las variantes personalizadas (excluyendo 'base')
    const existingVariants = Object.keys(variants).filter(id => id !== 'base');
    
    // Preguntar si quiere copiar escalones cuando hay al menos una variante existente
    // (funciona para segunda, tercera, cuarta, etc.)
    if (existingVariants.length > 0) {
        const firstVariantId = existingVariants[0];
        const firstVariant = variants[firstVariantId];
        
        // Verificar que la primera variante tenga escalones con cantidades definidas
        if (firstVariant && firstVariant.tiers && firstVariant.tiers.length > 0) {
            const hasDefinedTiers = firstVariant.tiers.some(tier => 
                (tier.minQty && tier.minQty !== '') || (tier.maxQty && tier.maxQty !== '')
            );
            
            if (hasDefinedTiers) {
                const currentLang = localStorage.getItem('language') || 'pt';
                
                const message = currentLang === 'es' ? 
                    '¿Deseas usar los mismos escalones de cantidad que la primera variante personalizada? (Solo necesitarás cambiar los precios)' :
                    currentLang === 'pt' ?
                    'Deseja usar os mesmos escalões de quantidade da primeira variante personalizada? (Apenas precisará alterar os preços)' :
                    'Do you want to use the same quantity tiers as the first custom variant? (You will only need to change the prices)';
                
                if (confirm(message)) {
                    // Copiar los escalones (minQty, maxQty) pero dejar los precios vacíos
                    const copiedTiers = firstVariant.tiers.map(tier => ({
                        minQty: tier.minQty || '',
                        maxQty: tier.maxQty || '',
                        price: '' // Dejar precio vacío para que el usuario lo complete
                    }));
                    
    const variantId = 'variant_' + (++variantCounter);
    variants[variantId] = {
        name: '',
                        tiers: copiedTiers,
                        plazo_entrega_personalizado: ''
                    };
                    renderVariants();
                    return;
                }
            }
        }
    }
    
    // Si no hay variantes anteriores, el usuario decidió no copiar, o la primera no tiene escalones definidos, crear variante vacía
    const variantId = 'variant_' + (++variantCounter);
    variants[variantId] = {
        name: '',
        tiers: [{ minQty: '', maxQty: '', price: '' }],
        plazo_entrega_personalizado: ''
    };
    renderVariants();
}

function removeVariant(variantId) {
    if (variantId === 'base') {
        alert('No se puede eliminar la variante base');
        return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar esta variante?')) {
        delete variants[variantId];
        renderVariants();
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function resetForm(skipConfirm = false) {
    if (!skipConfirm && !confirm('¿Estás seguro de que quieres limpiar todo el formulario?')) {
        return;
    }
    
        document.getElementById('productForm').reset();
        variants = {
            base: {
                name: '',
            tiers: [{ minQty: '', maxQty: '', price: '' }],
            plazo_entrega_personalizado: ''
            }
        };
        variantCounter = 0;
        renderVariants();
    const categoryFieldsDiv = document.getElementById('categoryFields');
    if (categoryFieldsDiv) {
        categoryFieldsDiv.innerHTML = '<p style="color: #6b7280;">Selecciona una categoría para ver los campos específicos</p>';
    }
    // Limpiar variantes de referencias
    const variantesContainer = document.getElementById('variantesReferenciasContainer');
    if (variantesContainer) {
        variantesContainer.innerHTML = '';
    }
    // Limpiar zonas
    document.querySelectorAll('input[name="zonas"]').forEach(cb => cb.checked = false);
}

/**
 * Obtener variantes de referencias del formulario
 */
function getVariantesReferencias() {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return [];
    
    // Verificar si la marca es VACAVALIENTE
    const marcaField = document.getElementById('marca');
    const isVacavaliente = marcaField && marcaField.value && marcaField.value.toUpperCase().trim() === 'VACAVALIENTE';
    
    const variantes = [];
    const varianteElements = container.querySelectorAll('.variante-referencia-item');
    
    varianteElements.forEach(element => {
        const referencia = element.querySelector('.variante-referencia-input')?.value?.trim();
        
        let color = null;
        if (isVacavaliente) {
            // Para VACAVALIENTE, obtener el nombre del color del select
            const colorSelect = element.querySelector('.vacavaliente-color-select');
            if (colorSelect && colorSelect.value) {
                const colorCode = colorSelect.value;
                const colorObj = VACAVALIENTE_COLORS.find(c => c.code === colorCode);
                color = colorObj ? colorObj.name : null;
            }
        } else {
            // Modo normal: obtener del input de texto
            color = element.querySelector('.variante-color-input')?.value?.trim() || null;
        }
        
        const descripcion = element.querySelector('.variante-descripcion-input')?.value?.trim();
        
        if (referencia) {
            variantes.push({
                referencia: referencia,
                color: color || null,
                descripcion: descripcion || null
            });
        }
    });
    
    return variantes;
}

/**
 * Obtener zonas seleccionadas del producto
 */
function getZonasProducto() {
    const zonasCheckboxes = document.querySelectorAll('input[name="zonas"]:checked');
    return Array.from(zonasCheckboxes).map(cb => cb.value);
}

/**
 * Generar referencia VACAVALIENTE basada en referencia base y código de color
 */
function generateVacavalienteReference(baseRef, colorCode) {
    if (!baseRef || !colorCode || baseRef.length < 6) {
        return baseRef;
    }
    // Reemplazar los dígitos 5 y 6 (índices 4 y 5) con el código del color
    const refArray = baseRef.split('');
    refArray[4] = colorCode[0] || refArray[4];
    refArray[5] = colorCode[1] || refArray[5];
    return refArray.join('');
}

/**
 * Obtener referencia base de una referencia VACAVALIENTE (si existe)
 */
function getVacavalienteBaseReference() {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return null;
    
    // Buscar el primer input de referencia base VACAVALIENTE
    const baseRefInput = container.querySelector('.vacavaliente-base-ref-input');
    if (baseRefInput) {
        return baseRefInput.value.trim();
    }
    
    // Si no existe, buscar el input temporal (cuando se está cargando)
    const tempBaseInput = container.querySelector('.temp-vacavaliente-base-ref');
    if (tempBaseInput) {
        return tempBaseInput.value.trim();
    }
    
    return null;
}

/**
 * Agregar una nueva variante de referencia
 */
function addVarianteReferencia(variante = null) {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return;
    
    const t = productFormTranslations[localStorage.getItem('language') || 'pt'] || productFormTranslations.pt;
    
    // Verificar si la marca es VACAVALIENTE
    const marcaField = document.getElementById('marca');
    const isVacavaliente = marcaField && marcaField.value && marcaField.value.toUpperCase().trim() === 'VACAVALIENTE';
    
    const varianteId = Date.now();
    const varianteItem = document.createElement('div');
    varianteItem.className = 'variante-referencia-item';
    varianteItem.style.cssText = 'background: var(--bg-white); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--bg-gray-200);';
    varianteItem.dataset.varianteId = varianteId;
    
    if (isVacavaliente) {
        // Modo VACAVALIENTE: referencia base + selector de colores
        const baseRef = getVacavalienteBaseReference() || '';
        const colorOptions = VACAVALIENTE_COLORS.map(color => 
            `<option value="${color.code}" ${variante?.color === color.name ? 'selected' : ''}>${color.name}</option>`
        ).join('');
        
        // Si es la primera variante, mostrar campo de referencia base
        const isFirstVariant = container.querySelectorAll('.variante-referencia-item').length === 0;
        const baseRefHtml = isFirstVariant ? `
            <div style="grid-column: 1 / -1; margin-bottom: 15px; padding: 10px; background: var(--bg-gray-100); border-radius: 6px; border: 1px solid var(--bg-gray-200);">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text-primary);">
                    Referencia Base (VACAVALIENTE)
                </label>
                <input type="text" 
                       class="vacavaliente-base-ref-input" 
                       placeholder="Ej. MT080022" 
                       value="${baseRef}" 
                       style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);"
                       oninput="generateAllVacavalienteVariants()">
                <small style="display: block; margin-top: 5px; color: var(--text-secondary);">
                    Los dígitos 5 y 6 se reemplazarán automáticamente según el color. Se crearán automáticamente todas las variantes para cada color disponible.
                </small>
            </div>
        ` : '';
        
        // Determinar referencia generada
        let generatedRef = '';
        if (variante && variante.referencia) {
            generatedRef = variante.referencia;
        } else if (baseRef && variante && variante.color) {
            const selectedColor = VACAVALIENTE_COLORS.find(c => c.name === variante.color);
            if (selectedColor) {
                generatedRef = generateVacavalienteReference(baseRef, selectedColor.code);
            }
        }
        
        varianteItem.innerHTML = `
            ${baseRefHtml}
            <div style="display: grid; grid-template-columns: 2fr 2fr 3fr auto; gap: 10px; align-items: end;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.reference}</label>
                    <input type="text" 
                           class="variante-referencia-input" 
                           placeholder="Se genera automáticamente" 
                           value="${generatedRef}" 
                           readonly
                           style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-gray-50); cursor: not-allowed;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.color}</label>
                    <select class="variante-color-input vacavaliente-color-select" 
                            style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);"
                            onchange="updateVacavalienteReferenceForItem(this, ${varianteId})">
                        <option value="">Selecciona un color...</option>
                        ${colorOptions}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.description}</label>
                    <input type="text" 
                           class="variante-descripcion-input" 
                           placeholder="${t.placeholderVariantDesc}" 
                           value="${variante?.descripcion || ''}" 
                           style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);">
                </div>
                <div>
                    <button type="button" onclick="removeVarianteReferencia(${varianteId})" style="padding: 8px 12px; background: linear-gradient(135deg, var(--danger-500) 0%, #dc2626 100%); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        // Modo normal: campos manuales
        varianteItem.innerHTML = `
            <div style="display: grid; grid-template-columns: 2fr 2fr 3fr auto; gap: 10px; align-items: end;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.reference}</label>
                    <input type="text" class="variante-referencia-input" placeholder="${t.placeholderReference}" value="${variante?.referencia || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.color}</label>
                    <input type="text" class="variante-color-input" placeholder="${t.placeholderColor}" value="${variante?.color || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.description}</label>
                    <input type="text" class="variante-descripcion-input" placeholder="${t.placeholderVariantDesc}" value="${variante?.descripcion || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);">
                </div>
                <div>
                    <button type="button" onclick="removeVarianteReferencia(${varianteId})" style="padding: 8px 12px; background: linear-gradient(135deg, var(--danger-500) 0%, #dc2626 100%); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    container.appendChild(varianteItem);
}

/**
 * Actualizar referencia VACAVALIENTE para un item específico
 */
function updateVacavalienteReferenceForItem(selectElement, varianteId) {
    const baseRef = getVacavalienteBaseReference();
    if (!baseRef) {
        alert('Por favor, ingresa primero la referencia base');
        return;
    }
    
    const colorCode = selectElement.value;
    if (!colorCode) {
        return;
    }
    
    const colorName = VACAVALIENTE_COLORS.find(c => c.code === colorCode)?.name || '';
    const generatedRef = generateVacavalienteReference(baseRef, colorCode);
    
    const item = document.querySelector(`.variante-referencia-item[data-variante-id="${varianteId}"]`);
    if (item) {
        const refInput = item.querySelector('.variante-referencia-input');
        if (refInput) {
            refInput.value = generatedRef;
        }
        // Actualizar también el nombre del color en el select (guardar el nombre, no el código)
        selectElement.setAttribute('data-color-name', colorName);
    }
}

/**
 * Generar automáticamente todas las variantes VACAVALIENTE para todos los colores disponibles
 */
function generateAllVacavalienteVariants() {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return;
    
    const baseRef = getVacavalienteBaseReference();
    if (!baseRef || baseRef.length < 6) {
        // Si no hay referencia base válida, limpiar todas las variantes excepto la primera
        const varianteItems = container.querySelectorAll('.variante-referencia-item');
        if (varianteItems.length > 1) {
            // Eliminar todas excepto la primera
            for (let i = 1; i < varianteItems.length; i++) {
                varianteItems[i].remove();
            }
        }
        return;
    }
    
    // Limpiar todas las variantes existentes (excepto el campo de referencia base)
    container.innerHTML = '';
    
    // Crear el campo de referencia base
    const baseRefHtml = `
        <div style="grid-column: 1 / -1; margin-bottom: 15px; padding: 10px; background: var(--bg-gray-100); border-radius: 6px; border: 1px solid var(--bg-gray-200);">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text-primary);">
                Referencia Base (VACAVALIENTE)
            </label>
            <input type="text" 
                   class="vacavaliente-base-ref-input" 
                   placeholder="Ej. MT080022" 
                   value="${baseRef}" 
                   style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);"
                   oninput="generateAllVacavalienteVariants()">
            <small style="display: block; margin-top: 5px; color: var(--text-secondary);">
                Los dígitos 5 y 6 se reemplazarán automáticamente según el color. Se crearán automáticamente todas las variantes para cada color disponible.
            </small>
        </div>
    `;
    
    // Crear una variante para cada color disponible
    VACAVALIENTE_COLORS.forEach((color, index) => {
        const generatedRef = generateVacavalienteReference(baseRef, color.code);
        const varianteId = Date.now() + index;
        const varianteItem = document.createElement('div');
        varianteItem.className = 'variante-referencia-item';
        varianteItem.style.cssText = 'background: var(--bg-white); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--bg-gray-200);';
        varianteItem.dataset.varianteId = varianteId;
        
        const t = productFormTranslations[localStorage.getItem('language') || 'pt'] || productFormTranslations.pt;
        
        // Crear opciones de colores con el color actual seleccionado
        const colorOptions = VACAVALIENTE_COLORS.map(c => 
            `<option value="${c.code}" ${c.code === color.code ? 'selected' : ''}>${c.name}</option>`
        ).join('');
        
        varianteItem.innerHTML = `
            ${index === 0 ? baseRefHtml : ''}
            <div style="display: grid; grid-template-columns: 2fr 2fr 3fr auto; gap: 10px; align-items: end;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.reference}</label>
                    <input type="text" 
                           class="variante-referencia-input" 
                           placeholder="Se genera automáticamente" 
                           value="${generatedRef}" 
                           readonly
                           style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-gray-50); cursor: not-allowed;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.color}</label>
                    <select class="variante-color-input vacavaliente-color-select" 
                            style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);"
                            onchange="updateVacavalienteReferenceForItem(this, ${varianteId})"
                            data-color-name="${color.name}">
                        <option value="">Selecciona un color...</option>
                        ${colorOptions}
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">${t.description}</label>
                    <input type="text" 
                           class="variante-descripcion-input" 
                           placeholder="${t.placeholderVariantDesc}" 
                           value="" 
                           style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300); border-radius: 6px; color: var(--text-primary); background: var(--bg-white);">
                </div>
                <div>
                    <button type="button" onclick="removeVarianteReferencia(${varianteId})" style="padding: 8px 12px; background: linear-gradient(135deg, var(--danger-500) 0%, #dc2626 100%); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(varianteItem);
    });
}

/**
 * Actualizar todas las referencias VACAVALIENTE cuando cambia la referencia base
 */
function updateVacavalienteReferences() {
    const container = document.getElementById('variantesReferenciasContainer');
    if (!container) return;
    
    const baseRef = getVacavalienteBaseReference();
    if (!baseRef) return;
    
    const varianteItems = container.querySelectorAll('.variante-referencia-item');
    varianteItems.forEach(item => {
        const colorSelect = item.querySelector('.vacavaliente-color-select');
        if (colorSelect && colorSelect.value) {
            const colorCode = colorSelect.value;
            const generatedRef = generateVacavalienteReference(baseRef, colorCode);
            const refInput = item.querySelector('.variante-referencia-input');
            if (refInput) {
                refInput.value = generatedRef;
            }
        }
    });
}

// Hacer funciones globales
window.updateVacavalienteReferenceForItem = updateVacavalienteReferenceForItem;
window.updateVacavalienteReferences = updateVacavalienteReferences;
window.generateAllVacavalienteVariants = generateAllVacavalienteVariants;

// Hacer funciones de gestión de colores VACAVALIENTE globales
window.openVacavalienteColorsManager = openVacavalienteColorsManager;
window.closeVacavalienteColorsManager = closeVacavalienteColorsManager;
window.showCreateVacavalienteColorForm = showCreateVacavalienteColorForm;
window.editVacavalienteColor = editVacavalienteColor;
window.saveVacavalienteColor = saveVacavalienteColor;
window.deleteVacavalienteColor = deleteVacavalienteColor;
window.cancelVacavalienteColorEdit = cancelVacavalienteColorEdit;

/**
 * Eliminar una variante de referencia
 */
function removeVarianteReferencia(varianteId) {
    const item = document.querySelector(`.variante-referencia-item[data-variante-id="${varianteId}"]`);
    if (item) {
        item.remove();
    }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!supabaseClient) {
        showAlert('Error: Supabase no está inicializado', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const categoria = formData.get('categoria');
    const categoryFields = categoryFieldsConfig[categoria] || [];
    
    // Validar escalones de precio de la variante base
    const baseTiers = variants.base?.tiers || [];
    if (baseTiers.length === 0 || baseTiers.some(t => !t.price || !t.minQty)) {
        showAlert('Error: Debes completar al menos un escalón de precio base con precio y cantidad mínima', 'error');
        return;
    }
    
    // Columnas que existen en la tabla products
    const validColumns = {
        'potencia': true,
        'color': true,
        'tipo': true
    };
    
    // Construir objeto de datos con solo columnas válidas
    // IMPORTANTE: Para las imágenes, usar las variables globales o los campos hidden
    // Validar que las URLs sean strings válidos, no objetos ni valores inválidos
    const getValidImageUrl = (url) => {
        if (!url) return null;
        // Si es un objeto (como {}), devolver null
        if (typeof url !== 'string') {
            console.warn('⚠️ URL de imagen no es un string:', typeof url, url);
            return null;
        }
        // Validar que no sea una cadena vacía, "{}", "null", "undefined", etc.
        const trimmed = url.trim();
        if (trimmed === '' || trimmed === '{}' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '{}') {
            console.warn('⚠️ URL de imagen es inválida:', trimmed);
            return null;
        }
        return trimmed;
    };
    
    const fotoUrl = getValidImageUrl(uploadedFotoUrl) || 
                    getValidImageUrl(formData.get('fotoUrl')) || 
                    getValidImageUrl(formData.get('foto')) || 
                    null;
    const foto2Url = getValidImageUrl(uploadedFoto2Url) || 
                     getValidImageUrl(formData.get('foto2Url')) || 
                     getValidImageUrl(formData.get('foto2')) || 
                     null;
    
    console.log('📸 URLs de imágenes a guardar:', {
        foto: fotoUrl,
        foto_2: foto2Url,
        uploadedFotoUrl: uploadedFotoUrl,
        uploadedFoto2Url: uploadedFoto2Url,
        fotoUrlField: formData.get('fotoUrl'),
        foto2UrlField: formData.get('foto2Url'),
        fotoField: formData.get('foto'),
        foto2Field: formData.get('foto2'),
        tipoFotoUrl: typeof fotoUrl,
        tipoFoto2Url: typeof foto2Url
    });
    
    if (!fotoUrl) {
        console.warn('⚠️ ADVERTENCIA: No hay URL de imagen principal válida. El producto se guardará sin foto.');
        showAlert('⚠️ Advertencia: No se ha subido ninguna imagen principal. El producto se guardará sin foto.', 'warning');
    }
    
    const productData = {
        nombre: formData.get('modelo') || '', // Usar el campo modelo como nombre
        categoria: categoria,
        brand: formData.get('marca') || null,
        mercado: formData.get('mercado') || 'AMBOS', // Mercado: PT, ES o AMBOS
        badge_pt: formData.get('badge') || null, // Guardar badge (solo en PT, se traduce automáticamente)
        descripcion_es: formData.get('descripcionEs') || null,
        descripcion_pt: formData.get('descripcionPt') || null,
        foto: fotoUrl || null, // Asegurar que sea null si no hay URL válida, nunca "{}"
        foto_2: foto2Url || null, // Asegurar que sea null si no hay URL válida, nunca "{}"
        ficha_tecnica: formData.get('fichaTecnica') || null,
        plazo_entrega: formData.get('plazoEntrega') || null,
        phc_ref: formData.get('phcRef') || null,
        box_size: formData.get('boxSize') ? parseInt(formData.get('boxSize')) : null,
        peso: formData.get('peso') ? parseFloat(formData.get('peso')) : 0.00,
        nombre_fornecedor: formData.get('nombreFornecedor') || null,
        referencia_fornecedor: formData.get('referenciaFornecedor') || null,
        office_only: formData.get('officeOnly') || null,
        area_negocio: formData.get('areaNegocio') || null,
        cliente_id: null, // Se establecerá más abajo después de leer del DOM
        variantes_referencias: getVariantesReferencias(),
        zonas_producto: getZonasProducto(),
        precio: parseFloat(baseTiers[0].price) || 0,
        price_tiers: baseTiers.length > 0 ? baseTiers.map(tier => ({
            min_qty: tier.minQty ? parseInt(tier.minQty) : null,
            max_qty: tier.maxQty ? parseInt(tier.maxQty) : null,
            price: tier.price ? parseFloat(tier.price) : null,
            currency: 'EUR'
        })).filter(tier => tier.min_qty !== null && tier.price !== null) : [],
        variants: Object.keys(variants).filter(id => id !== 'base').map(variantId => {
            const variant = variants[variantId];
            return {
                name: variant.name || '',
                plazo_entrega_personalizado: variant.plazo_entrega_personalizado || null,
                price_tiers: (variant.tiers || []).map(tier => ({
                    min_qty: tier.minQty ? parseInt(tier.minQty) : null,
                    max_qty: tier.maxQty ? parseInt(tier.maxQty) : null,
                    price: tier.price ? parseFloat(tier.price) : null,
                    currency: 'EUR'
                })).filter(tier => tier.min_qty !== null && tier.price !== null)
            };
        }).filter(v => v.name && v.price_tiers && v.price_tiers.length > 0)
    };
    
    // Si el producto tiene un cliente asociado, NO debe aparecer en el catálogo público
    // Leer del campo hidden primero, luego del input de texto como fallback
    const clienteIdField = document.getElementById('clienteId');
    const clienteSelect = document.getElementById('clienteSelect');
    const clienteId = (clienteIdField && clienteIdField.value && clienteIdField.value.trim()) || 
                     (clienteSelect && clienteSelect.value && clienteSelect.value.trim()) || 
                     formData.get('clienteId') || 
                     null;
    
    console.log('👤 Cliente ID obtenido:', {
        fromHiddenField: clienteIdField?.value,
        fromSelectField: clienteSelect?.value,
        fromFormData: formData.get('clienteId'),
        finalValue: clienteId
    });
    
    // Establecer cliente_id en productData
    productData.cliente_id = clienteId;
    
    let visibleEnCatalogo = true;
    
    if (clienteId) {
        // Si tiene cliente asociado, forzar visible_en_catalogo = false
        visibleEnCatalogo = false;
        console.log('📋 Producto con cliente asociado. visible_en_catalogo forzado a false');
    } else {
        // Si no tiene cliente, usar el valor del checkbox
    const visibleEnCatalogoCheckbox = document.getElementById('visibleEnCatalogo');
    if (visibleEnCatalogoCheckbox) {
            visibleEnCatalogo = visibleEnCatalogoCheckbox.checked;
            console.log('📋 Checkbox encontrado. visible_en_catalogo será guardado como:', visibleEnCatalogo);
    } else {
            visibleEnCatalogo = true; // Por defecto true si no existe el checkbox
        console.log('⚠️ Checkbox no encontrado, usando valor por defecto: true');
        }
    }
    
    productData.visible_en_catalogo = visibleEnCatalogo;
    
    // Obtener los campos dinámicos de la categoría seleccionada
    // Necesitamos cargarlos desde el DOM o desde Supabase
    let fields = [];
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect && categoriaSelect.value) {
        const selectedOption = categoriaSelect.options[categoriaSelect.selectedIndex];
        const categoryId = selectedOption.getAttribute('data-category-id');
        
        if (categoryId && supabaseClient) {
            try {
                // Cargar campos desde category_fields
                const { data: fieldsData, error } = await supabaseClient
                    .from('category_fields')
                    .select('*')
                    .eq('categoria_id', categoryId)
                    .order('orden', { ascending: true });
                
                if (!error && fieldsData && fieldsData.length > 0) {
                    const currentLang = localStorage.getItem('language') || 'pt';
                    fields = fieldsData.map(field => ({
                        id: field.field_id,
                        label: currentLang === 'es' ? field.label_es : field.label_pt,
                        label_es: field.label_es,
                        label_pt: field.label_pt,
                        type: field.field_type,
                        placeholder: currentLang === 'es' ? (field.placeholder_es || '') : (field.placeholder_pt || ''),
                        placeholder_es: field.placeholder_es || '',
                        placeholder_pt: field.placeholder_pt || '',
                        required: field.is_required || false,
                        categoryFieldId: field.id, // ID UUID de category_fields
                        options: field.options || []
                    }));
                    console.log('✅ Campos cargados desde BD para guardar:', fields.length);
                }
            } catch (error) {
                console.error('❌ Error cargando campos desde BD:', error);
            }
        }
    }
    
    // Si no hay campos, intentar obtenerlos del DOM
    if (fields.length === 0) {
        const categoryFieldsContainer = document.getElementById('categoryFields');
        if (categoryFieldsContainer) {
            const fieldGroups = categoryFieldsContainer.querySelectorAll('.form-group');
            fieldGroups.forEach(group => {
                const input = group.querySelector('input, select');
                const label = group.querySelector('label');
                if (input && label) {
                    const fieldId = input.id.replace('_es', '').replace('_pt', '');
                    fields.push({
                        id: fieldId,
                        label: label.textContent,
                        type: input.type === 'number' ? 'number' : (input.tagName === 'SELECT' ? 'select' : 'text')
                    });
                }
            });
        }
    }
    
    // Recolectar todos los campos específicos de categoría (ES y PT)
    const categorySpecificData = {};
    const caracteristicasLines = [];
    
    console.log('📋 Total campos a procesar:', fields.length);
    console.log('📋 Campos disponibles:', fields.map(f => ({ id: f.id, label: f.label, type: f.type, categoryFieldId: f.categoryFieldId })));
    
    fields.forEach(field => {
        // Log para verificar el field.id que se está usando
        console.log(`💾 Procesando campo: id="${field.id}", label="${field.label}", type="${field.type}"`);
        
        // Campos especiales: garantía y dimensiones solo en un idioma
        const singleLanguageFields = ['garantia', 'dimensiones'];
        
        if (singleLanguageFields.includes(field.id)) {
            // Solo una versión para garantía y dimensiones
            const value = formData.get(field.id);
            if (!value) return;
            
            if (field.id === 'garantia') {
                // Garantía siempre en años
                categorySpecificData[field.id] = parseFloat(value);
                caracteristicasLines.push(`${field.label}: ${value} años`);
            } else {
                // Dimensiones
                categorySpecificData[field.id] = value;
                caracteristicasLines.push(`${field.label}: ${value} cm`);
            }
        } else if (field.type === 'number') {
            // Campos numéricos solo tienen una versión
            const value = formData.get(field.id);
            console.log(`   📝 Valor obtenido del formulario para ${field.id}:`, value);
            
            if (!value) {
                console.log(`   ⚠️ No hay valor para ${field.id}, omitiendo...`);
                return;
            }
            
            const numericValue = parseFloat(value);
            console.log(`   ✅ Valor numérico parseado: ${numericValue}`);
            
            // Si es una columna válida, guardarla directamente
            if (validColumns[field.id]) {
                productData[field.id] = numericValue;
                console.log(`   💾 Guardado en productData[${field.id}] = ${numericValue}`);
            }
            
            // IMPORTANTE: Guardar SIEMPRE en categorySpecificData con el field_id completo
            // Esto permite que los filtros dinámicos encuentren los valores
            categorySpecificData[field.id] = numericValue;
            console.log(`   ✅ Guardado en categorySpecificData[${field.id}] = ${numericValue}`);
            
            caracteristicasLines.push(`${field.label}: ${value}`);
        } else {
            // Campos de texto y select tienen versión ES y PT
            const valueEs = formData.get(field.id + '_es');
            const valuePt = formData.get(field.id + '_pt');
            
            if (valueEs) {
                categorySpecificData[field.id + '_es'] = valueEs;
                caracteristicasLines.push(`${field.label} (ES): ${valueEs}`);
            }
            
            if (valuePt) {
                categorySpecificData[field.id + '_pt'] = valuePt;
                caracteristicasLines.push(`${field.label} (PT): ${valuePt}`);
            }
            
            // Para columnas válidas como color, guardar solo la versión ES
            if (validColumns[field.id] && valueEs) {
                productData[field.id] = valueEs;
            }
            
            // IMPORTANTE: Guardar SIEMPRE en categorySpecificData con el field_id completo
            // Esto permite que los filtros dinámicos encuentren los valores
            // Ya se guardó arriba con _es y _pt, pero también guardamos sin sufijo para búsqueda
            if (valueEs || valuePt) {
                // Guardar también con el field_id base para búsqueda más flexible
                if (valueEs) {
                    categorySpecificData[field.id] = valueEs;
                }
            }
        }
    });
    
    // Guardar todo en el campo "Carateristicas" (formato: línea por línea para campos + JSON para datos estructurados)
    let caracteristicasText = caracteristicasLines.join('\n');
    
    // Si hay datos estructurados adicionales, agregarlos como JSON
    if (Object.keys(categorySpecificData).length > 0) {
        caracteristicasText += '\n\n[DATOS ESTRUCTURADOS]\n' + JSON.stringify(categorySpecificData, null, 2);
    }
    
    productData.caracteristicas = caracteristicasText || null;
    
    // IMPORTANTE: Guardar también en la columna category_fields de la tabla products
    // Esto permite que los filtros dinámicos encuentren los valores fácilmente
    // Usar el field_id completo de category_fields como clave
    productData.category_fields = categorySpecificData;
    
    // Guardar qué campos deben mostrarse en la tarjeta del producto
    // Guardar no solo el field_id, sino también los labels (ES y PT) para mostrar dinámicamente
    const visibleFields = [];
    fields.forEach(field => {
        const showInCardCheckbox = document.getElementById(`showInCard_${field.id}`);
        if (showInCardCheckbox && showInCardCheckbox.checked) {
            const labelEs = field.label_es || field.label || field.id;
            const labelPt = field.label_pt || field.label || field.id;
            
            console.log(`👁️ Campo marcado como visible:`, {
                field_id: field.id,
                label_es: labelEs,
                label_pt: labelPt,
                field_completo: field
            });
            
            visibleFields.push({
                field_id: field.id,
                label_es: labelEs,
                label_pt: labelPt
            });
        }
    });
    // Guardar visible_fields como JSONB (array de objetos)
    // IMPORTANTE: Enviar como array de objetos JavaScript, NO como array de strings JSON
    // Supabase automáticamente lo convierte a JSONB cuando se envía como array de objetos
    productData.visible_fields = visibleFields.length > 0 ? visibleFields : null;
    console.log('👁️ Campos visibles en tarjeta (con labels):', visibleFields);
    console.log('👁️ visible_fields a guardar (tipo):', typeof productData.visible_fields);
    console.log('👁️ visible_fields a guardar (JSONB):', JSON.stringify(visibleFields));
    console.log('👁️ visible_fields a guardar (objetos):', visibleFields.map(f => ({ 
        field_id: f.field_id, 
        label_es: f.label_es, 
        label_pt: f.label_pt,
        tipo: typeof f
    })));
    
    // Validar que foto y foto_2 no sean objetos ni strings inválidos antes de enviar
    if (productData.foto && (typeof productData.foto !== 'string' || productData.foto === '{}' || productData.foto.trim() === '')) {
        console.warn('⚠️ productData.foto es inválido, estableciendo a null:', productData.foto);
        productData.foto = null;
    }
    if (productData.foto_2 && (typeof productData.foto_2 !== 'string' || productData.foto_2 === '{}' || productData.foto_2.trim() === '')) {
        console.warn('⚠️ productData.foto_2 es inválido, estableciendo a null:', productData.foto_2);
        productData.foto_2 = null;
    }
    
    console.log('📊 RESUMEN DE DATOS A GUARDAR:');
    console.log('   - categorySpecificData keys:', Object.keys(categorySpecificData));
    console.log('   - categorySpecificData values:', categorySpecificData);
    console.log('   - productData.category_fields:', productData.category_fields);
    console.log('💾 category_fields a guardar en products:', JSON.stringify(categorySpecificData, null, 2));
    console.log('📸 productData.foto (tipo y valor):', typeof productData.foto, productData.foto);
    console.log('📸 productData.foto_2 (tipo y valor):', typeof productData.foto_2, productData.foto_2);
    console.log('👤 productData.cliente_id:', productData.cliente_id);
    console.log('👤 clienteId del formulario:', formData.get('clienteId'));
    
    // Verificar que category_fields no esté vacío
    if (Object.keys(categorySpecificData).length === 0) {
        console.warn('⚠️ ADVERTENCIA: categorySpecificData está vacío. No se guardarán valores de filtros.');
        console.warn('   Verifica que los campos del formulario tengan valores.');
    }
    
    try {
        let result;
        
        // Si estamos editando, actualizar; si no, insertar
        // Validar que foto y foto_2 no sean objetos ni strings inválidos antes de enviar
        if (productData.foto && (typeof productData.foto !== 'string' || productData.foto === '{}' || productData.foto.trim() === '')) {
            console.warn('⚠️ productData.foto es inválido, estableciendo a null:', productData.foto);
            productData.foto = null;
        }
        if (productData.foto_2 && (typeof productData.foto_2 !== 'string' || productData.foto_2 === '{}' || productData.foto_2.trim() === '')) {
            console.warn('⚠️ productData.foto_2 es inválido, estableciendo a null:', productData.foto_2);
            productData.foto_2 = null;
        }
        
        // Verificar que window.editingProductId esté definido
        console.log('🔍 Verificando modo de guardado...');
        console.log('   - window.editingProductId:', window.editingProductId);
        console.log('   - Tipo:', typeof window.editingProductId);
        
        if (window.editingProductId) {
            console.log('🔄 MODO ACTUALIZACIÓN: Actualizando producto con ID:', window.editingProductId);
            console.log('📦 Datos a actualizar:', JSON.stringify(productData, null, 2));
            console.log('👁️ visible_en_catalogo:', productData.visible_en_catalogo);
            console.log('📸 foto (tipo y valor):', typeof productData.foto, productData.foto);
            console.log('📸 foto_2 (tipo y valor):', typeof productData.foto_2, productData.foto_2);
            
            // Obtener las imágenes antiguas antes de actualizar
            const { data: oldProductData } = await supabaseClient
                .from('products')
                .select('foto, foto_2')
                .eq('id', window.editingProductId)
                .single();
            
            // Eliminar imágenes antiguas del bucket si fueron reemplazadas
            if (oldProductData) {
                // Si hay una nueva foto y es diferente a la antigua, eliminar la antigua
                if (productData.foto && oldProductData.foto && productData.foto !== oldProductData.foto) {
                    console.log('🗑️ Eliminando imagen principal antigua del bucket:', oldProductData.foto);
                    await deleteImageFromStorage(oldProductData.foto);
                }
                // Si la nueva foto es null y había una antigua, eliminar la antigua
                if (!productData.foto && oldProductData.foto) {
                    console.log('🗑️ Eliminando imagen principal del bucket (se eliminó del producto):', oldProductData.foto);
                    await deleteImageFromStorage(oldProductData.foto);
                }
                
                // Si hay una nueva foto_2 y es diferente a la antigua, eliminar la antigua
                if (productData.foto_2 && oldProductData.foto_2 && productData.foto_2 !== oldProductData.foto_2) {
                    console.log('🗑️ Eliminando imagen secundaria antigua del bucket:', oldProductData.foto_2);
                    await deleteImageFromStorage(oldProductData.foto_2);
                }
                // Si la nueva foto_2 es null y había una antigua, eliminar la antigua
                if (!productData.foto_2 && oldProductData.foto_2) {
                    console.log('🗑️ Eliminando imagen secundaria del bucket (se eliminó del producto):', oldProductData.foto_2);
                    await deleteImageFromStorage(oldProductData.foto_2);
                }
            }
            
            // Intentar actualizar con todos los campos
            try {
                const { data, error } = await supabaseClient
                    .from('products')
                    .update(productData)
                    .eq('id', window.editingProductId)
                    .select();
                
                if (error) {
                    console.error('❌ Error en update:', error);
                    console.error('📋 Código de error:', error.code);
                    console.error('📋 Mensaje:', error.message);
                    console.error('📋 Detalles:', error.details);
                    console.error('📋 Hint:', error.hint);
                    
                    // Si el error es por una columna que no existe, intentar sin esos campos
                    if (error.code === '42703' || error.message.includes('column') || error.message.includes('does not exist') || error.message.includes('schema cache')) {
                        console.log('⚠️ Algunos campos no existen en la BD. Ejecuta el script SQL primero.');
                        console.log('⚠️ Intentando actualizar sin campos faltantes...');
                        const productDataWithoutMissing = { ...productData };
                        
                        // Eliminar campos que pueden no existir
                        if (error.message.includes('badge_pt')) {
                            console.log('⚠️ Campo badge_pt no existe, eliminándolo del update...');
                            delete productDataWithoutMissing.badge_pt;
                        }
                        // Eliminar badge_es si existe (ya no se usa)
                        if (productDataWithoutMissing.badge_es !== undefined) {
                            delete productDataWithoutMissing.badge_es;
                        }
                        // Eliminar badge si existe (ya no se usa)
                        if (productDataWithoutMissing.badge !== undefined) {
                            delete productDataWithoutMissing.badge;
                        }
                        if (error.message.includes('visible_en_catalogo')) {
                            delete productDataWithoutMissing.visible_en_catalogo;
                        }
                        if (error.message.includes('cliente_id')) {
                            console.log('⚠️ Campo cliente_id no existe, eliminándolo del update...');
                            delete productDataWithoutMissing.cliente_id;
                        }
                        
                        const { data: retryData, error: retryError } = await supabaseClient
                            .from('products')
                            .update(productDataWithoutMissing)
                            .eq('id', window.editingProductId)
                            .select();
                        
                        if (retryError) {
                            console.error('❌ Error en reintento:', retryError);
                            throw retryError;
                        }
                        
                        if (!retryData || retryData.length === 0) {
                            console.warn('⚠️ No se devolvieron datos después del update. Verificando...');
                            // Si aún no hay datos, verificar que el producto existe
                            const { data: verifyData } = await supabaseClient
                                .from('products')
                                .select('id')
                                .eq('id', window.editingProductId)
                                .maybeSingle();
                            
                            if (verifyData) {
                                // El producto existe, el update funcionó pero no devolvió datos
                                result = { id: window.editingProductId, ...productDataWithoutMissing };
                                showAlert(`✅ Producto actualizado (algunos campos no existen - ejecuta el script SQL: agregar-campos-badge.sql)`, 'success');
                            } else {
                                throw new Error(`No se encontró el producto con ID: ${window.editingProductId}`);
                            }
                        } else {
                            result = retryData[0];
                            showAlert(`✅ Producto actualizado (sin campo visible_en_catalogo - ejecuta el script SQL)`, 'success');
                        }
                    } else {
                        throw error;
                    }
                } else {
                    // No hay error, verificar si hay datos devueltos
                    console.log('✅ No hay error en el UPDATE');
                    console.log('   - Data recibida:', data);
                    console.log('   - Data es array?:', Array.isArray(data));
                    console.log('   - Data length:', data?.length);
                    
                    if (!data || data.length === 0) {
                        console.warn('⚠️ El UPDATE no devolvió datos (puede ser por RLS o porque no hay cambios)');
                        // El update funcionó pero no devolvió datos (puede ser por RLS)
                        // Verificar que el producto existe y se actualizó
                        console.log('🔍 Verificando que el producto existe después del UPDATE...');
                        const { data: verifyData, error: verifyError } = await supabaseClient
                            .from('products')
                            .select('id, nombre, updated_at, category_fields')
                            .eq('id', window.editingProductId)
                            .maybeSingle();
                        
                        if (verifyError) {
                            console.error('❌ Error al verificar:', verifyError);
                            throw new Error(`No se pudo verificar la actualización: ${verifyError.message}`);
                        }
                        
                        if (verifyData) {
                            result = verifyData;
                            console.log('✅ Producto verificado después del UPDATE:', verifyData);
                            console.log('   - category_fields guardado:', verifyData.category_fields);
                            showAlert(`✅ Producto actualizado correctamente (ID: ${result.id})`, 'success');
                            // Continuar con el flujo normal (no hacer return aquí)
                        } else {
                            throw new Error('No se pudo verificar la actualización del producto. El producto puede no existir.');
                        }
                    } else {
                        // El UPDATE devolvió datos directamente
                        result = data[0];
                        console.log('✅ Producto actualizado. visible_en_catalogo guardado como:', result.visible_en_catalogo);
                        console.log('📸 Foto guardada en BD:', result.foto);
                        console.log('📸 Foto_2 guardada en BD:', result.foto_2);
                        if (result.category_fields) {
                            console.log('✅ category_fields guardado correctamente:', result.category_fields);
                        } else {
                            console.warn('⚠️ category_fields no está en la respuesta. Verifica que la columna existe en la BD.');
                        }
                        
                        if (!result.foto) {
                            console.warn('⚠️ ADVERTENCIA: El producto se guardó sin foto. Verifica que la imagen se subió correctamente.');
                        }
                        
                        showAlert(`✅ Producto actualizado correctamente (ID: ${result.id})`, 'success');
                    }
                }
            } catch (updateError) {
                console.error('❌ Error completo en actualización:', updateError);
                console.error('📋 Stack:', updateError.stack);
                showAlert(`❌ Error al actualizar producto: ${updateError.message || updateError}`, 'error');
                throw updateError;
            }
            
            // Verificar que realmente se actualizó consultando la BD
            console.log('🔍 Verificando que el producto se actualizó correctamente...');
            try {
                const { data: verifyUpdate, error: verifyError } = await supabaseClient
                    .from('products')
                    .select('id, nombre, updated_at, category_fields')
                    .eq('id', window.editingProductId)
                    .maybeSingle();
                
                if (verifyError) {
                    console.error('❌ Error al verificar actualización:', verifyError);
                    showAlert(`⚠️ El producto puede haberse actualizado, pero no se pudo verificar. Revisa la base de datos.`, 'warning');
                } else if (verifyUpdate) {
                    console.log('✅ Verificación exitosa: Producto actualizado en BD');
                    console.log('   - Nombre:', verifyUpdate.nombre);
                    console.log('   - Última actualización:', verifyUpdate.updated_at);
                    console.log('   - category_fields:', verifyUpdate.category_fields);
                } else {
                    console.warn('⚠️ No se encontró el producto después de la actualización');
                    showAlert(`⚠️ No se pudo verificar la actualización. El producto puede no existir.`, 'warning');
                }
            } catch (verifyException) {
                console.error('❌ Excepción al verificar:', verifyException);
            }
        } else {
            console.log('➕ MODO CREACIÓN: INSERTANDO nuevo producto...');
            console.log('   ⚠️ window.editingProductId es:', window.editingProductId);
        console.log('📦 productData completo:', JSON.stringify(productData, null, 2));
        console.log('📦 productData.category_fields:', productData.category_fields);
        
        const { data, error } = await supabaseClient
            .from('products')
            .insert(productData)
            .select()
                .maybeSingle();
            
            if (error) {
                console.error('❌ Error en insert:', error);
                console.error('📋 Código de error:', error.code);
                console.error('📋 Mensaje:', error.message);
                console.error('📋 Detalles:', error.details);
                console.error('📦 ProductData enviado:', JSON.stringify(productData, null, 2));
                
                // Si el error es por una columna que no existe, intentar sin esos campos
                if (error.code === '42703' || error.message.includes('column') || error.message.includes('does not exist') || error.message.includes('schema cache')) {
                    console.warn('⚠️ Algunos campos no existen en la BD. Ejecuta el script SQL primero.');
                    console.warn('⚠️ Intentando insertar sin campos faltantes...');
                    const productDataWithoutMissing = { ...productData };
                    
                    // Eliminar campos que pueden no existir
                    if (error.message.includes('badge_pt')) {
                        console.warn('⚠️ Campo badge_pt no existe, eliminándolo del insert...');
                        delete productDataWithoutMissing.badge_pt;
                    }
                    // Eliminar badge_es si existe (ya no se usa)
                    if (productDataWithoutMissing.badge_es !== undefined) {
                        delete productDataWithoutMissing.badge_es;
                    }
                    // Eliminar badge si existe (ya no se usa)
                    if (productDataWithoutMissing.badge !== undefined) {
                        delete productDataWithoutMissing.badge;
                    }
                    if (error.message.includes('category_fields')) {
                        delete productDataWithoutMissing.category_fields;
                    }
                    if (error.message.includes('visible_en_catalogo')) {
                        delete productDataWithoutMissing.visible_en_catalogo;
                    }
                    
                    const { data: retryData, error: retryError } = await supabaseClient
                        .from('products')
                        .insert(productDataWithoutMissing)
                        .select()
                        .maybeSingle();
                    
                    if (retryError) {
                        console.error('❌ Error en reintento:', retryError);
                        throw retryError;
                    }
                    
                    result = { data: retryData };
                    console.warn('⚠️ Producto guardado sin algunos campos. Ejecuta el script SQL (agregar-campos-badge.sql) y vuelve a guardar el producto.');
                    showAlert('⚠️ Producto guardado, pero algunos campos no se guardaron. Ejecuta el script SQL: agregar-campos-badge.sql', 'warning');
                } else {
                    throw error;
                }
            } else {
                result = { data };
                console.log('✅ Producto insertado correctamente');
                console.log('📦 Datos devueltos:', data);
                if (data) {
                    console.log('📸 Foto guardada en BD:', data.foto);
                    console.log('📸 Foto_2 guardada en BD:', data.foto_2);
                    if (!data.foto) {
                        console.warn('⚠️ ADVERTENCIA: El producto se guardó sin foto. Verifica que la imagen se subió correctamente.');
                    }
                }
                if (data && data.category_fields) {
                    console.log('✅ category_fields guardado:', data.category_fields);
                } else {
                    console.warn('⚠️ category_fields no está en la respuesta. Verifica que la columna existe en la BD.');
                }
                
            }
            
            if (!data) {
                throw new Error('No se pudo crear el producto. No se devolvieron datos.');
            }
            
            result = data;
            showAlert(`✅ Producto guardado correctamente (ID: ${result.id})`, 'success');
        }
        
        setTimeout(() => {
            resetForm();
            window.editingProductId = null;
            // Actualizar texto del botón de guardar
            updateSaveButtonText();
            // Si veníamos de editar/duplicar, volver al selector
            if (currentMode === 'edit' || currentMode === 'duplicate') {
                document.getElementById('mode-selector').style.display = 'block';
                document.getElementById('productForm').style.display = 'none';
                renderProductsList();
            }
        }, 2000);
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('📋 Detalles del error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        showAlert('Error al guardar: ' + error.message, 'error');
    }
});

// ==================== CONFIGURACIÓN DE MODO ====================

/**
 * Actualizar texto del botón de guardar según el modo (edición o creación)
 */
function updateSaveButtonText() {
    const saveButtonText = document.getElementById('saveProductBtnText');
    if (!saveButtonText) return;
    
    const lang = localStorage.getItem('language') || 'pt';
    const t = productFormTranslations[lang] || productFormTranslations.pt;
    const isEditMode = window.editingProductId !== null && window.editingProductId !== undefined;
    
    if (isEditMode) {
        // Modo edición
        if (lang === 'es') {
            saveButtonText.textContent = 'Guardar Alteraciones';
        } else if (lang === 'pt') {
            saveButtonText.textContent = 'Guardar Alterações';
        } else {
            saveButtonText.textContent = 'Save Changes';
        }
    } else {
        // Modo creación
        saveButtonText.textContent = t.saveProduct;
    }
}

/**
 * Configurar interfaz según el modo
 */
function setupModeInterface() {
    const modeSelector = document.getElementById('mode-selector');
    const productForm = document.getElementById('productForm');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    const translations = {
        pt: {
            newTitle: 'Criar Novo Produto',
            newSubtitle: 'Complete as informações do produto de acordo com sua categoria',
            editTitle: 'Editar Produto',
            editSubtitle: 'Selecione o produto que deseja editar',
            duplicateTitle: 'Criar Produto a partir de Outro',
            duplicateSubtitle: 'Selecione o produto que deseja usar como base',
            selectorTitle: 'Selecionar Produto',
            searchPlaceholder: 'Buscar produto...',
            back: 'Voltar',
            catalog: 'Catálogo'
        },
        es: {
            newTitle: 'Crear Nuevo Producto',
            newSubtitle: 'Completa la información del producto según su categoría',
            editTitle: 'Editar Producto',
            editSubtitle: 'Selecciona el producto que deseas editar',
            duplicateTitle: 'Crear Producto desde Otro',
            duplicateSubtitle: 'Selecciona el producto que deseas usar como base',
            selectorTitle: 'Seleccionar Producto',
            searchPlaceholder: 'Buscar producto...',
            back: 'Volver',
            catalog: 'Catálogo'
        },
        en: {
            newTitle: 'Create New Product',
            newSubtitle: 'Complete the product information according to its category',
            editTitle: 'Edit Product',
            editSubtitle: 'Select the product you want to edit',
            duplicateTitle: 'Create Product from Another',
            duplicateSubtitle: 'Select the product you want to use as base',
            selectorTitle: 'Select Product',
            searchPlaceholder: 'Search product...',
            back: 'Back',
            catalog: 'Catalog'
        }
    };
    
    const lang = localStorage.getItem('language') || 'pt';
    const t = translations[lang] || translations.pt;
    
    if (currentMode === 'edit' || currentMode === 'duplicate') {
        // Mostrar selector de productos
        if (modeSelector) {
            modeSelector.style.display = 'block';
            modeSelector.style.visibility = 'visible';
        }
        if (productForm) {
            productForm.style.display = 'none';
        }
        
        if (currentMode === 'edit') {
            if (pageTitle) pageTitle.textContent = t.editTitle;
            if (pageSubtitle) pageSubtitle.textContent = t.editSubtitle;
        } else {
            if (pageTitle) pageTitle.textContent = t.duplicateTitle;
            if (pageSubtitle) pageSubtitle.textContent = t.duplicateSubtitle;
        }
        
        const selectorTitle = document.getElementById('selector-title');
        if (selectorTitle) selectorTitle.textContent = t.selectorTitle;
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.placeholder = t.searchPlaceholder;
        }
        
        const backText = document.getElementById('back-text');
        const catalogText = document.getElementById('catalog-text');
        if (backText) backText.textContent = t.back;
        if (catalogText) catalogText.textContent = t.catalog;
    } else {
        // Mostrar formulario normal (modo 'new')
        if (modeSelector) {
            modeSelector.style.display = 'none';
        }
        if (productForm) {
            // Asegurar que el formulario esté visible
            productForm.style.display = 'block';
            productForm.style.visibility = 'visible';
            productForm.style.opacity = '1';
            productForm.style.height = 'auto';
            productForm.style.overflow = 'visible';
            console.log('✅ Formulario de producto mostrado para modo:', currentMode);
            
            // Inicializar variantes si no existen
            if (!variants.base || !variants.base.tiers || variants.base.tiers.length === 0) {
                variants.base = {
                    name: '',
                    tiers: [{ minQty: '', maxQty: '', price: '' }]
                };
            }
            
            // Renderizar variantes inmediatamente
            renderVariants();
        } else {
            console.error('❌ No se encontró el elemento productForm');
        }
        if (pageTitle) pageTitle.textContent = t.newTitle;
        if (pageSubtitle) pageSubtitle.textContent = t.newSubtitle;
    }
    
    // Cargar productos si es necesario para editar o duplicar
    if (currentMode === 'edit' || currentMode === 'duplicate') {
        loadAllProducts();
    }
}

/**
 * Cargar todos los productos para selección
 */
async function loadAllProducts() {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id, nombre, categoria, brand, foto')
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        allProducts = data || [];
        renderProductsList();
    } catch (error) {
        console.error('Error cargando productos:', error);
        showAlert('Error al cargar productos: ' + error.message, 'error');
    }
}

/**
 * Renderizar lista de productos
 */
function renderProductsList(filter = '') {
    const productsList = document.getElementById('products-list');
    if (!productsList) return;
    
    const filtered = allProducts.filter(p => {
        const search = filter.toLowerCase();
        return (p.nombre && p.nombre.toLowerCase().includes(search)) ||
               (p.brand && p.brand.toLowerCase().includes(search)) ||
               (p.categoria && p.categoria.toLowerCase().includes(search));
    });
    
    if (filtered.length === 0) {
        productsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No se encontraron productos</p>';
        return;
    }
    
    productsList.innerHTML = filtered.map(product => `
        <div class="product-item" style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 1px solid var(--bg-gray-200); border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;" 
             onclick="selectProduct(${product.id})"
             onmouseover="this.style.backgroundColor='var(--bg-gray-50)'"
             onmouseout="this.style.backgroundColor='var(--bg-white)'">
            ${(() => {
                const getProductImageUrl = (imageUrl) => {
                    if (!imageUrl || imageUrl.trim() === '') {
                        return null;
                    }
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        return imageUrl;
                    }
                    if (imageUrl.startsWith('productos/') || imageUrl.includes('product-images')) {
                        // Usar la configuración de Supabase desde window.SUPABASE_CONFIG
                        const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) 
                            ? window.SUPABASE_CONFIG.url 
                            : null;
                        
                        if (!SUPABASE_URL) {
                            console.error('Error: Configuración de Supabase no disponible');
                            return imageUrl; // Devolver URL original si no hay configuración
                        }
                        
                        if (!imageUrl.includes('supabase.co')) {
                            return `${SUPABASE_URL}/storage/v1/object/public/product-images/${imageUrl}`;
                        }
                    }
                    return imageUrl;
                };
                const imageUrl = getProductImageUrl(product.foto);
                if (!imageUrl) {
                    return `<div style="width: 60px; height: 60px; background: var(--bg-gray-100); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-image" style="color: var(--text-secondary); font-size: 1.5rem;"></i>
                    </div>`;
                }
                return `<img src="${imageUrl}" alt="${product.nombre}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; background: var(--bg-gray-100);"
                     onerror="this.style.display='none'">`;
            })()}
            <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; text-align: center;">${product.nombre || 'Sin nombre'}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    ${product.brand ? product.brand + ' • ' : ''}${product.categoria || 'Sin categoría'}
                </div>
            </div>
            <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
        </div>
    `).join('');
}

/**
 * Seleccionar producto para editar o duplicar
 */
window.selectProduct = async function(productId) {
    selectedProductId = productId;
    
    if (currentMode === 'edit') {
        // Cargar producto para editar
        await loadProductForEdit(productId);
    } else if (currentMode === 'duplicate') {
        // Cargar producto para duplicar
        await loadProductForDuplicate(productId);
    }
};

/**
 * Cargar producto para editar
 */
window.loadProductForEdit = async function(productId) {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        // Parsear visible_fields si existe
        if (data.visible_fields) {
            if (typeof data.visible_fields === 'string') {
                try {
                    data.visible_fields = JSON.parse(data.visible_fields);
                } catch (e) {
                    console.warn('Error parseando visible_fields:', e);
                }
            } else if (Array.isArray(data.visible_fields)) {
                // Parsear cada elemento si es string JSON
                data.visible_fields = data.visible_fields.map(field => {
                    if (typeof field === 'string' && (field.startsWith('{') || field.startsWith('"'))) {
                        try {
                            return JSON.parse(field);
                        } catch (e) {
                            return { field_id: field };
                        }
                    }
                    return field;
                });
            }
        }
        
        // Parsear category_fields si es string
        if (data.category_fields && typeof data.category_fields === 'string') {
            try {
                data.category_fields = JSON.parse(data.category_fields);
            } catch (e) {
                console.warn('Error parseando category_fields:', e);
            }
        }
        
        // Llenar formulario con datos del producto
        await fillFormWithProduct(data);
        
        // Mostrar formulario y ocultar selector
        const modeSelector = document.getElementById('mode-selector');
        const productForm = document.getElementById('productForm');
        if (modeSelector) modeSelector.style.display = 'none';
        if (productForm) productForm.style.display = 'block';
        
        // Cambiar título
        const lang = localStorage.getItem('language') || 'pt';
        const editTitle = lang === 'es' ? 'Editar Producto' : lang === 'pt' ? 'Editar Produto' : 'Edit Product';
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = editTitle;
        
        // Guardar ID para actualizar en lugar de insertar
        window.editingProductId = productId;
        console.log('✅ window.editingProductId establecido para edición:', window.editingProductId);
        
        // Actualizar texto del botón de guardar
        updateSaveButtonText();
        
        // Mostrar botón de eliminar
        const deleteBtn = document.getElementById('deleteProductBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
            updateDeleteButtonText();
        }
        
    } catch (error) {
        console.error('Error cargando producto:', error);
        showAlert('Error al cargar producto: ' + error.message, 'error');
    }
};

/**
 * Cargar producto para duplicar
 */
window.loadProductForDuplicate = async function(productId) {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        // Parsear visible_fields y category_fields si existen (igual que en loadProductForEdit)
        if (data.visible_fields) {
            if (typeof data.visible_fields === 'string') {
                try {
                    data.visible_fields = JSON.parse(data.visible_fields);
                } catch (e) {
                    console.warn('Error parseando visible_fields:', e);
                }
            } else if (Array.isArray(data.visible_fields)) {
                data.visible_fields = data.visible_fields.map(field => {
                    if (typeof field === 'string' && (field.startsWith('{') || field.startsWith('"'))) {
                        try {
                            return JSON.parse(field);
                        } catch (e) {
                            return { field_id: field };
                        }
                    }
                    return field;
                });
            }
        }
        
        if (data.category_fields && typeof data.category_fields === 'string') {
            try {
                data.category_fields = JSON.parse(data.category_fields);
            } catch (e) {
                console.warn('Error parseando category_fields:', e);
            }
        }
        
        // Llenar formulario con datos del producto (pero sin ID)
        await fillFormWithProduct(data, true);
        
        // Mostrar formulario y ocultar selector
        const modeSelector = document.getElementById('mode-selector');
        const productForm = document.getElementById('productForm');
        if (modeSelector) modeSelector.style.display = 'none';
        if (productForm) productForm.style.display = 'block';
        
        // Cambiar título
        const lang = localStorage.getItem('language') || 'pt';
        const duplicateTitle = lang === 'es' ? 'Crear Producto desde Otro' : lang === 'pt' ? 'Criar Produto a partir de Outro' : 'Create Product from Another';
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = duplicateTitle;
        
        // No guardar ID (será un nuevo producto)
        window.editingProductId = null;
        
        // Actualizar texto del botón de guardar
        updateSaveButtonText();
        
        // Ocultar botón de eliminar
        const deleteBtn = document.getElementById('deleteProductBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error cargando producto:', error);
        showAlert('Error al cargar producto: ' + error.message, 'error');
    }
};

/**
 * Llenar formulario con datos del producto
 */
async function fillFormWithProduct(product, isDuplicate = false) {
    // Guardar el producto en window.editingProduct para que los checkboxes se puedan pre-rellenar
    window.editingProduct = product;
    // Limpiar formulario primero (sin confirmación)
    resetForm(true);
    
    // Llenar campos básicos
    const modeloField = document.getElementById('modelo');
    if (modeloField && product.nombre) {
        modeloField.value = isDuplicate ? product.nombre + ' (Copia)' : product.nombre;
    }
    const marcaField = document.getElementById('marca');
    if (marcaField && product.brand) {
        marcaField.value = product.brand;
        // Si es VACAVALIENTE, recargar los colores desde Supabase
        if (product.brand.toUpperCase().trim() === 'VACAVALIENTE') {
            await loadVacavalienteColors();
            console.log('🔄 Colores VACAVALIENTE recargados al cargar producto');
        }
    }
    const categoriaField = document.getElementById('categoria');
    if (categoriaField && product.categoria) {
        // Si la categoría tiene formato "categoria:subcategoria", separarla
        const categoriaParts = product.categoria.split(':');
        categoriaField.value = categoriaParts[0];
        categoriaField.dispatchEvent(new Event('change'));
        
    }
    const mercadoField = document.getElementById('mercado');
    if (mercadoField && product.mercado) {
        mercadoField.value = product.mercado;
        // Disparar evento change para actualizar visibilidad de descripción PT
        setTimeout(() => {
            mercadoField.dispatchEvent(new Event('change'));
        }, 100);
    }
    const badgeField = document.getElementById('badge');
    if (badgeField) {
        // Cargar desde badge_pt (donde se guarda)
        badgeField.value = product.badge_pt || '';
    }
    
    // Cargar cliente si existe
    const clienteSelect = document.getElementById('clienteSelect');
    const clienteIdField = document.getElementById('clienteId');
    if (product.cliente_id) {
        if (clienteSelect) clienteSelect.value = product.cliente_id;
        if (clienteIdField) clienteIdField.value = product.cliente_id;
    } else {
        if (clienteSelect) clienteSelect.value = '';
        if (clienteIdField) clienteIdField.value = '';
    }
    
    // Actualizar estado del checkbox después de cargar el cliente
    setTimeout(() => {
        if (typeof updateVisibleEnCatalogoCheckbox === 'function') {
            updateVisibleEnCatalogoCheckbox();
        }
    }, 100);
    
    const descEsField = document.getElementById('descripcionEs');
    if (descEsField && product.descripcion_es) descEsField.value = product.descripcion_es;
    const descPtField = document.getElementById('descripcionPt');
    if (descPtField && product.descripcion_pt) descPtField.value = product.descripcion_pt;
    
    // Actualizar visibilidad de descripción PT según el mercado después de cargar los valores
    setTimeout(() => {
        const mercadoField = document.getElementById('mercado');
        if (mercadoField) {
            mercadoField.dispatchEvent(new Event('change'));
        }
    }, 200);
    // Manejar imágenes: mostrar preview si ya hay URL guardada
    const fotoUrlField = document.getElementById('fotoUrl');
    if (fotoUrlField && product.foto) {
        fotoUrlField.value = product.foto;
        uploadedFotoUrl = product.foto;
        showImagePreview('foto', product.foto);
    }
    const foto2UrlField = document.getElementById('foto2Url');
    if (foto2UrlField && product.foto_2) {
        foto2UrlField.value = product.foto_2;
        uploadedFoto2Url = product.foto_2;
        showImagePreview('foto2', product.foto_2);
    }
    const fichaField = document.getElementById('fichaTecnica');
    if (fichaField && product.ficha_tecnica) fichaField.value = product.ficha_tecnica;
    const plazoField = document.getElementById('plazoEntrega');
    if (plazoField && product.plazo_entrega) plazoField.value = product.plazo_entrega;
    const phcRefField = document.getElementById('phcRef');
    if (phcRefField && product.phc_ref) phcRefField.value = product.phc_ref;
    const officeOnlyField = document.getElementById('officeOnly');
    if (officeOnlyField && product.office_only) officeOnlyField.value = product.office_only;
    const boxSizeField = document.getElementById('boxSize');
    if (boxSizeField && product.box_size) boxSizeField.value = product.box_size;
    const pesoField = document.getElementById('peso');
    if (pesoField && product.peso !== undefined && product.peso !== null) pesoField.value = product.peso;
    
    // Nuevos campos: Fornecedor y Área de Negocio
    const nombreFornecedorField = document.getElementById('nombreFornecedor');
    if (nombreFornecedorField && product.nombre_fornecedor) nombreFornecedorField.value = product.nombre_fornecedor;
    
    const referenciaFornecedorField = document.getElementById('referenciaFornecedor');
    if (referenciaFornecedorField && product.referencia_fornecedor) referenciaFornecedorField.value = product.referencia_fornecedor;
    
    const areaNegocioField = document.getElementById('areaNegocio');
    if (areaNegocioField && product.area_negocio) areaNegocioField.value = product.area_negocio;
    
    // Cargar variantes de referencias
    if (product.variantes_referencias && Array.isArray(product.variantes_referencias)) {
        const container = document.getElementById('variantesReferenciasContainer');
        if (container) {
            container.innerHTML = '';
            
            // Verificar si es VACAVALIENTE
            const marcaField = document.getElementById('marca');
            const isVacavaliente = marcaField && marcaField.value && marcaField.value.toUpperCase().trim() === 'VACAVALIENTE';
            
            if (isVacavaliente && product.variantes_referencias.length > 0) {
                // Para VACAVALIENTE, extraer la referencia base de la primera variante
                // La referencia base se obtiene reemplazando los dígitos 5 y 6 con "00"
                const firstRef = product.variantes_referencias[0].referencia;
                let baseRef = '';
                if (firstRef && firstRef.length >= 6) {
                    const refArray = firstRef.split('');
                    // Intentar encontrar el código de color en los dígitos 5 y 6
                    const colorCode = refArray[4] + refArray[5];
                    const colorObj = VACAVALIENTE_COLORS.find(c => c.code === colorCode);
                    if (colorObj) {
                        // Si encontramos el color, reemplazar con "00" para obtener la base
                        refArray[4] = '0';
                        refArray[5] = '0';
                        baseRef = refArray.join('');
                    } else {
                        // Si no encontramos el color, usar la referencia tal cual
                        baseRef = firstRef;
                    }
                }
                
                // Guardar la referencia base temporalmente para que addVarianteReferencia la use
                if (baseRef) {
                    const tempBaseInput = document.createElement('input');
                    tempBaseInput.type = 'hidden';
                    tempBaseInput.className = 'temp-vacavaliente-base-ref';
                    tempBaseInput.value = baseRef;
                    container.appendChild(tempBaseInput);
                }
            }
            
            product.variantes_referencias.forEach(variante => {
                addVarianteReferencia(variante);
            });
            
            // Limpiar el input temporal
            const tempBaseInput = container.querySelector('.temp-vacavaliente-base-ref');
            if (tempBaseInput) {
                tempBaseInput.remove();
            }
        }
    }
    
    // Cargar zonas del producto
    if (product.zonas_producto && Array.isArray(product.zonas_producto)) {
        const zonaMap = {
            'habitacion': 'zonaHabitacion',
            'bano': 'zonaBano',
            'zonas_comunes': 'zonaComunes',
            'restaurantes': 'zonaRestaurantes'
        };
        
        product.zonas_producto.forEach(zona => {
            const checkboxId = zonaMap[zona] || `zona${zona}`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    const visibleEnCatalogoField = document.getElementById('visibleEnCatalogo');
    if (visibleEnCatalogoField) {
        // Por defecto true si no existe el campo (para productos antiguos)
        visibleEnCatalogoField.checked = product.visible_en_catalogo !== false;
    }
    
    // Cargar campos específicos de categoría
    // IMPORTANTE: Primero renderizar los campos, luego llenarlos con los valores
    if (product.categoria) {
        // Renderizar campos de la categoría primero
        await renderCategoryFields(product.categoria);
        
        // Luego llenar los campos con los valores guardados
        // Esperar un poco más para asegurar que los campos estén en el DOM
        setTimeout(async () => {
            await fillCategoryFields(product);
        }, 300);
    }
    
    // Cargar price_tiers y variantes
    if (product.price_tiers && Array.isArray(product.price_tiers) && product.price_tiers.length > 0) {
        setTimeout(() => {
            loadPriceTiers(product.price_tiers, 'base');
        }, 300);
    }
    
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        setTimeout(() => {
            // Primero crear todas las variantes necesarias
            product.variants.forEach(() => {
                    addVariant();
            });
            
            // Luego cargar los datos de cada variante
                setTimeout(() => {
                    const variantIds = Object.keys(variants).filter(id => id !== 'base');
                product.variants.forEach((variant, index) => {
                    if (variantIds.length > index) {
                        const variantId = variantIds[index];
                        if (variantId) {
                            // Cargar nombre de la variante
                            if (variants[variantId]) {
                                variants[variantId].name = variant.name || '';
                                // Cargar plazo de entrega personalizado
                                variants[variantId].plazo_entrega_personalizado = variant.plazo_entrega_personalizado || '';
                            }
                            // Cargar price_tiers de la variante
                            if (variant.price_tiers) {
                                loadPriceTiers(variant.price_tiers, variantId);
                        }
                    }
                    }
            });
                renderVariants();
            }, 200);
        }, 400);
    }
}

/**
 * Llenar campos específicos de categoría
 */
async function fillCategoryFields(product) {
    console.log('🔄 fillCategoryFields - Iniciando para producto:', product.id);
    
    // Inicializar structuredData como objeto vacío
    let structuredData = {};
    
    // Llenar campos comunes (potencia, color, tipo) si existen como columnas directas
    const potenciaField = document.getElementById('potencia');
    if (potenciaField && product.potencia) {
        potenciaField.value = product.potencia;
        structuredData['potencia'] = product.potencia;
    }
    const colorField = document.getElementById('color');
    if (colorField && product.color) {
        colorField.value = product.color;
        structuredData['color'] = product.color;
    }
    const tipoField = document.getElementById('tipo');
    if (tipoField && product.tipo) {
        tipoField.value = product.tipo;
        structuredData['tipo'] = product.tipo;
    }
    
    // PRIORIDAD 1: Leer desde category_fields JSONB
    if (product.category_fields) {
        console.log('📋 Leyendo desde product.category_fields:', product.category_fields);
        if (typeof product.category_fields === 'object' && !Array.isArray(product.category_fields)) {
            structuredData = { ...structuredData, ...product.category_fields };
            console.log('✅ category_fields es objeto, datos cargados:', structuredData);
        } else if (typeof product.category_fields === 'string') {
            try {
                const parsed = JSON.parse(product.category_fields);
                structuredData = { ...structuredData, ...parsed };
                console.log('✅ category_fields parseado desde string:', structuredData);
            } catch (e) {
                console.warn('⚠️ Error parseando category_fields:', e);
            }
        }
    }
    
    // PRIORIDAD 2: Si no hay datos, leer desde características (compatibilidad con productos antiguos)
    if (Object.keys(structuredData).length === 0 && product.caracteristicas) {
        console.log('📋 Intentando leer desde características...');
        try {
            const structuredMatch = product.caracteristicas.match(/\[DATOS ESTRUCTURADOS\]([\s\S]*)/);
            if (structuredMatch) {
                const parsed = JSON.parse(structuredMatch[1]);
                structuredData = { ...structuredData, ...parsed };
                console.log('✅ Datos estructurados extraídos de características:', structuredData);
            }
        } catch (e) {
            console.error('❌ Error parseando datos estructurados:', e);
        }
    }
    
    // Llenar los campos del formulario con los datos estructurados
    if (Object.keys(structuredData).length > 0) {
        console.log('📋 Llenando campos del formulario con valores guardados:', structuredData);
        
        // Esperar un momento para asegurar que los campos dinámicos ya se renderizaron
        await new Promise(resolve => setTimeout(resolve, 300));
        
        Object.keys(structuredData).forEach(key => {
            const value = structuredData[key];
            
            // Determinar si es un campo numérico basándose en si tiene sufijo _es o _pt
            const isNumericField = !key.includes('_es') && !key.includes('_pt');
            
            // Intentar encontrar el campo directamente (para campos numéricos y campos base)
            let field = document.getElementById(key);
            
            if (field) {
                field.value = value !== null && value !== undefined ? String(value) : '';
                console.log(`   ✅ Campo ${key} = ${field.value}`);
            } else if (isNumericField) {
                // Para campos numéricos, solo buscar con el ID base (no con sufijos)
                // Si no se encuentra, puede ser que el campo aún no se haya renderizado
                console.log(`   ⚠️ Campo numérico ${key} no encontrado. Puede que aún no se haya renderizado.`);
            } else {
                // Para campos de texto/select, buscar con sufijos _es o _pt
                const fieldEs = document.getElementById(key + '_es');
                const fieldPt = document.getElementById(key + '_pt');
                
                if (fieldEs) {
                    fieldEs.value = value !== null && value !== undefined ? String(value) : '';
                    console.log(`   ✅ Campo ${key}_es = ${fieldEs.value}`);
                }
                if (fieldPt) {
                    fieldPt.value = value !== null && value !== undefined ? String(value) : '';
                    console.log(`   ✅ Campo ${key}_pt = ${fieldPt.value}`);
                }
                
                // Si aún no se encontró, puede ser que el key tenga sufijo y necesitemos buscar sin él
                if (!fieldEs && !fieldPt && key.includes('_')) {
                    const keyBase = key.split('_')[0];
                    const fieldBase = document.getElementById(keyBase);
                    if (fieldBase) {
                        fieldBase.value = value !== null && value !== undefined ? String(value) : '';
                        console.log(`   ✅ Campo ${keyBase} (base) = ${fieldBase.value}`);
                    }
                }
                
                // Si no se encontró ningún campo, mostrar advertencia
                if (!field && !fieldEs && !fieldPt) {
                    console.warn(`   ⚠️ No se encontró campo para key: ${key}`);
                }
            }
        });
        
        console.log('✅ Campos del formulario llenados correctamente');
    } else {
        console.log('ℹ️ No hay valores guardados para llenar en los campos dinámicos');
    }
}

/**
 * Cargar price tiers en el formulario
 */
function loadPriceTiers(priceTiers, variantId) {
    if (!priceTiers || priceTiers.length === 0) return;
    
    const variant = variants[variantId];
    if (!variant) {
        variants[variantId] = { name: '', tiers: [], plazo_entrega_personalizado: '' };
    }
    
    variants[variantId].tiers = priceTiers.map(tier => ({
        minQty: tier.min_qty || '',
        maxQty: tier.max_qty || '',
        price: tier.price || ''
    }));
    
    // Renderizar los tiers
    renderVariants();
}

// Event listener para búsqueda de productos
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderProductsList(e.target.value);
        });
    }
});

/**
 * Función para eliminar producto de la base de datos
 */
window.deleteProduct = async function() {
    if (!window.editingProductId) {
        showAlert('Error: No hay producto seleccionado para eliminar', 'error');
        return;
    }
    
    if (!supabaseClient) {
        showAlert('Error: Supabase no está inicializado', 'error');
        return;
    }
    
    // Obtener idioma actual para las traducciones
    const lang = localStorage.getItem('language') || 'pt';
    const translations = {
        pt: {
            confirmTitle: 'Confirmar Eliminação',
            confirmMessage: 'Tem certeza de que deseja eliminar este produto? Esta ação não pode ser desfeita.',
            confirm: 'Eliminar',
            cancel: 'Cancelar',
            success: 'Produto eliminado com sucesso',
            error: 'Erro ao eliminar produto'
        },
        es: {
            confirmTitle: 'Confirmar Eliminación',
            confirmMessage: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
            confirm: 'Eliminar',
            cancel: 'Cancelar',
            success: 'Producto eliminado correctamente',
            error: 'Error al eliminar producto'
        },
        en: {
            confirmTitle: 'Confirm Deletion',
            confirmMessage: 'Are you sure you want to delete this product? This action cannot be undone.',
            confirm: 'Delete',
            cancel: 'Cancel',
            success: 'Product deleted successfully',
            error: 'Error deleting product'
        }
    };
    
    const t = translations[lang] || translations.pt;
    
    // Mostrar confirmación
    const confirmed = confirm(t.confirmMessage);
    if (!confirmed) {
        return;
    }
    
    try {
        const productIdToDelete = window.editingProductId;
        
        if (!productIdToDelete) {
            throw new Error('No hay ID de producto para eliminar');
        }
        
        console.log('🗑️ Intentando eliminar producto con ID:', productIdToDelete);
        
        // Verificar que el producto existe antes de eliminar
        const { data: productExists, error: checkError } = await supabaseClient
            .from('products')
            .select('id, nombre')
            .eq('id', productIdToDelete)
            .single();
        
        if (checkError) {
            console.error('❌ Error al verificar producto:', checkError);
            // Si el error es que no existe, continuar con la eliminación de todos modos
            if (checkError.code !== 'PGRST116') {
                throw new Error(`Error al verificar producto: ${checkError.message}`);
            }
        }
        
        if (productExists) {
            console.log('✅ Producto encontrado:', productExists);
        } else {
            console.log('⚠️ Producto no encontrado, pero continuando con eliminación');
        }
        
        // Obtener las URLs de las imágenes antes de eliminar el producto
        const { data: productData } = await supabaseClient
            .from('products')
            .select('foto, foto_2')
            .eq('id', productIdToDelete)
            .single();
        
        // Eliminar las imágenes del bucket si existen
        if (productData) {
            if (productData.foto) {
                console.log('🗑️ Eliminando imagen principal del bucket:', productData.foto);
                await deleteImageFromStorage(productData.foto);
            }
            if (productData.foto_2) {
                console.log('🗑️ Eliminando imagen secundaria del bucket:', productData.foto_2);
                await deleteImageFromStorage(productData.foto_2);
            }
        }
        
        // Eliminar el producto
        
        // Intentar eliminación con .select() para confirmar
        const { data: deletedData, error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productIdToDelete)
            .select();
        
        if (error) {
            console.error('❌ Error en la eliminación:', error);
            console.error('❌ Código de error:', error.code);
            console.error('❌ Mensaje de error:', error.message);
            console.error('❌ Detalles completos:', JSON.stringify(error, null, 2));
            
            // Mensaje de error más descriptivo
            let errorMessage = error.message || 'Error desconocido';
            let showInstructions = false;
            
            if (error.code === '42501') {
                errorMessage = 'No tienes permisos para eliminar productos. El problema es la configuración de Row Level Security (RLS) en Supabase.';
                showInstructions = true;
            } else if (error.code === 'PGRST116') {
                errorMessage = 'El producto no existe o ya fue eliminado.';
            } else if (error.message && (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('row-level security'))) {
                errorMessage = 'Error de permisos: Las políticas RLS (Row Level Security) están bloqueando la eliminación.';
                showInstructions = true;
            } else if (error.message && error.message.includes('JWT')) {
                errorMessage = 'Error de autenticación: Verifica que la clave de API de Supabase sea correcta.';
            }
            
            if (showInstructions) {
                const instructions = `\n\nPara solucionar este problema:\n1. Ve a tu proyecto en Supabase\n2. Abre el SQL Editor\n3. Ejecuta este comando:\n\nCREATE POLICY "Allow delete for all" ON products\n    FOR DELETE\n    USING (true);\n\nO consulta el archivo supabase-enable-delete.sql en tu proyecto.`;
                console.error('📋 Instrucciones:', instructions);
                errorMessage += instructions;
            }
            
            throw new Error(errorMessage);
        }
        
        // Verificar que se eliminó algo
        if (!deletedData || deletedData.length === 0) {
            console.warn('⚠️ No se eliminó ningún registro. El producto puede no existir.');
            // No lanzar error, puede que ya esté eliminado
        } else {
            console.log('✅ Producto eliminado exitosamente:', deletedData);
        }
        
        console.log('✅ Respuesta de eliminación:', deletedData);
        
        // Verificar que realmente se eliminó (esperar un momento para que se propague)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: verifyData, error: verifyError } = await supabaseClient
            .from('products')
            .select('id')
            .eq('id', productIdToDelete)
            .maybeSingle();
        
        if (verifyData) {
            console.warn('⚠️ El producto todavía existe después de la eliminación');
            // No lanzar error aquí, puede ser un problema de caché
            console.log('⚠️ Continuando de todos modos...');
        } else {
            console.log('✅ Confirmado: El producto fue eliminado correctamente');
        }
        
        showAlert(`✅ ${t.success}`, 'success');
        
        // Limpiar formulario y ocultar botón de eliminar
        resetForm();
        window.editingProductId = null;
        const deleteBtn = document.getElementById('deleteProductBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
        
        // Recargar la lista de productos para que el eliminado no aparezca
        console.log('🔄 Recargando lista de productos...');
        await loadAllProducts();
        console.log('✅ Lista de productos recargada');
        
        // Si veníamos de editar, volver al selector con la lista actualizada
        if (currentMode === 'edit') {
            // Ocultar formulario y mostrar selector
            const modeSelector = document.getElementById('mode-selector');
            const productForm = document.getElementById('productForm');
            if (modeSelector) modeSelector.style.display = 'block';
            if (productForm) productForm.style.display = 'none';
            
            // Renderizar lista actualizada (sin el producto eliminado)
            renderProductsList();
            console.log('✅ Lista renderizada sin el producto eliminado');
        } else {
            // Si no, redirigir al selector
            setTimeout(() => {
                window.location.href = 'selector-productos.html';
            }, 1500);
        }
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        showAlert(`${t.error}: ${error.message}`, 'error');
    }
};

/**
 * Actualizar texto del botón de eliminar según el idioma
 */
function updateDeleteButtonText() {
    const lang = localStorage.getItem('language') || 'pt';
    const t = productFormTranslations[lang] || productFormTranslations.pt;
    
    const deleteText = document.getElementById('delete-text');
    if (deleteText) {
        deleteText.textContent = t.deleteProduct;
    }
}

// ==================== GESTIÓN DE CATEGORÍAS ====================

function openCategoryManager() {
    document.getElementById('categoryModal').classList.add('active');
    loadCategoryList();
}

function closeCategoryManager() {
    document.getElementById('categoryModal').classList.remove('active');
    cancelCategoryEdit();
}

async function loadCategoryList() {
    const container = document.getElementById('categoryList');
    
    const defaultCats = [
        { id: 'secadores', name: 'Secadores', isDefault: true },
        { id: 'planchas', name: 'Planchas', isDefault: true },
        { id: 'tablas-planchar', name: 'Tablas de planchar', isDefault: true },
        { id: 'porta-malas', name: 'Porta-malas', isDefault: true }
    ];
    
    let html = '<h3 style="margin-bottom: 15px;">Categorías Predefinidas</h3>';
    defaultCats.forEach(cat => {
        html += `
            <div class="category-item">
                <div>
                    <div class="category-item-name">${cat.name}</div>
                    <small style="color: #6b7280;">ID: ${cat.id}</small>
                </div>
                <div class="category-item-actions">
                    <span style="color: #6b7280; padding: 5px 10px; background: #e5e7eb; border-radius: 4px;">Predefinida</span>
                </div>
            </div>
        `;
    });
    
    if (Object.keys(customCategories).length > 0) {
        html += '<h3 style="margin-top: 30px; margin-bottom: 15px;">Categorías Personalizadas</h3>';
        Object.keys(customCategories).forEach(id => {
            const cat = customCategories[id];
            html += `
                <div class="category-item">
                    <div>
                        <div class="category-item-name">${cat.name}</div>
                        <small style="color: #6b7280;">ID: ${id}</small>
                        <small style="color: #6b7280; display: block;">${cat.fields.length} campo(s)</small>
                    </div>
                    <div class="category-item-actions">
                        <button class="btn btn-secondary" onclick="editCategory('${id}')" style="padding: 8px 16px;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="deleteCategory('${id}')" style="padding: 8px 16px;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

function showCreateCategoryForm() {
    editingCategoryId = null;
    categoryFields = [];
    document.getElementById('categoryFormTitle').textContent = 'Nueva Categoría';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryId').disabled = false;
    document.getElementById('categoryFieldsEditor').innerHTML = '<p style="color: #6b7280;">No hay campos agregados. Haz clic en "Agregar Campo" para comenzar.</p>';
    document.getElementById('categoryFormSection').style.display = 'block';
    document.getElementById('categoryList').style.display = 'none';
}

function cancelCategoryEdit() {
    editingCategoryId = null;
    categoryFields = [];
    document.getElementById('categoryFormSection').style.display = 'none';
    document.getElementById('categoryList').style.display = 'block';
}

function addFieldToCategory() {
    categoryFields.push({
        id: '',
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: []
    });
    renderCategoryFieldsEditor();
}

function removeFieldFromCategory(index) {
    categoryFields.splice(index, 1);
    renderCategoryFieldsEditor();
}

function renderCategoryFieldsEditor() {
    const container = document.getElementById('categoryFieldsEditor');
    
    if (categoryFields.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay campos agregados. Haz clic en "Agregar Campo" para comenzar.</p>';
        return;
    }
    
    container.innerHTML = categoryFields.map((field, index) => {
        const optionsHtml = field.type === 'select' ? `
            <div style="margin-top: 5px;">
                <small style="color: #6b7280;">Opciones (separadas por coma):</small>
                <input type="text" placeholder="Ej. Sí, No, Ambos" 
                       value="${(field.options || []).join(', ')}"
                       onchange="categoryFields[${index}].options = this.value.split(',').map(o => o.trim()).filter(Boolean)">
            </div>
        ` : '';
        
        return `
            <div class="field-editor">
                <div class="field-editor-header">
                    <strong>Campo ${index + 1}</strong>
                    <button type="button" class="btn btn-danger" onclick="removeFieldFromCategory(${index})" style="padding: 5px 10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="field-row">
                    <div>
                        <label>Nombre del campo *</label>
                        <input type="text" placeholder="Ej. Color" 
                               value="${field.label || ''}"
                               onchange="categoryFields[${index}].label = this.value" required>
                    </div>
                    <div>
                        <label>ID (sin espacios) *</label>
                        <input type="text" placeholder="Ej. color" 
                               value="${field.id || ''}"
                               pattern="[a-z0-9_]+"
                               onchange="categoryFields[${index}].id = this.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')" required>
                    </div>
                    <div>
                        <label>Tipo *</label>
                        <select onchange="categoryFields[${index}].type = this.value; renderCategoryFieldsEditor()">
                            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Texto</option>
                            <option value="number" ${field.type === 'number' ? 'selected' : ''}>Número</option>
                            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                        </select>
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="checkbox" ${field.required ? 'checked' : ''} 
                                   onchange="categoryFields[${index}].required = this.checked">
                            Requerido
                        </label>
    </div>
    </div>
                ${field.type !== 'select' ? `
                    <div style="margin-top: 5px;">
                        <label>Placeholder</label>
                        <input type="text" placeholder="Ej. negro, blanco" 
                               value="${field.placeholder || ''}"
                               onchange="categoryFields[${index}].placeholder = this.value">
    </div>
                ` : ''}
                ${optionsHtml}
    </div>
  `;
    }).join('');
}

function editCategory(categoryId) {
    const cat = customCategories[categoryId];
    if (!cat) return;
    
    editingCategoryId = categoryId;
    document.getElementById('categoryFormTitle').textContent = `Editar: ${cat.name}`;
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryId').value = categoryId;
    document.getElementById('categoryId').disabled = true;
    
    categoryFields = JSON.parse(JSON.stringify(cat.fields));
    renderCategoryFieldsEditor();
    
    document.getElementById('categoryFormSection').style.display = 'block';
    document.getElementById('categoryList').style.display = 'none';
}

async function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const id = editingCategoryId || document.getElementById('categoryId').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    if (!name || !id) {
        alert('Debes completar el nombre y el ID de la categoría');
        return;
    }
    
    if (categoryFields.length === 0) {
        alert('Debes agregar al menos un campo a la categoría');
    return;
  }

    for (let i = 0; i < categoryFields.length; i++) {
        const field = categoryFields[i];
        if (!field.id || !field.label) {
            alert(`El campo ${i + 1} debe tener un ID y un nombre`);
            return;
        }
        if (field.type === 'select' && (!field.options || field.options.length === 0)) {
            alert(`El campo "${field.label}" debe tener opciones definidas`);
            return;
        }
    }
    
    const fieldsToSave = categoryFields.map(field => {
        const fieldData = {
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required || false
        };
        
        if (field.type !== 'select') {
            fieldData.placeholder = field.placeholder || '';
        } else {
            fieldData.options = field.options.map(opt => ({
                value: opt.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                label: opt
            }));
            fieldData.options.unshift({ value: '', label: 'Selecciona...' });
        }
        
        return fieldData;
    });
    
    try {
        const categoryData = {
            tipo: 'product', // ← IMPORTANTE: Agregar tipo para categorías de productos
            nombre_es: name,
            nombre_pt: name, // product_categories solo tiene un nombre, usar el mismo para ambos idiomas
            fields: fieldsToSave // Mantener fields por compatibilidad si se usa
        };
        
        if (editingCategoryId) {
            const { error } = await supabaseClient
                .from('categorias_geral')
                .update(categoryData)
                .eq('id', id)
                .eq('tipo', 'product');
            
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('categorias_geral')
                .insert(categoryData);
            
            if (error) throw error;
        }
        
        customCategories[id] = {
            name: name,
            fields: fieldsToSave
        };
        
        const select = document.getElementById('categoria');
        if (!editingCategoryId) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            select.appendChild(option);
        } else {
            const option = select.querySelector(`option[value="${id}"]`);
            if (option) option.textContent = name;
        }
        
        alert('✅ Categoría guardada correctamente');
        cancelCategoryEdit();
        loadCategoryList();
  } catch (error) {
        console.error('Error guardando categoría:', error);
        alert('Error al guardar: ' + error.message);
    }
}

async function deleteCategory(categoryId) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${customCategories[categoryId].name}"?`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('categorias_geral')
            .delete()
            .eq('id', categoryId)
            .eq('tipo', 'product');
        
        if (error) throw error;
        
        delete customCategories[categoryId];
        
        const select = document.getElementById('categoria');
        const option = select.querySelector(`option[value="${categoryId}"]`);
        if (option) option.remove();
        
        alert('✅ Categoría eliminada');
        loadCategoryList();
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

// ============================================
// GESTIÓN DE CATEGORÍAS DEL HOME
// ============================================

let editingHomeCategoryId = null;
let homeCategories = [];
let categoryFieldsInForm = []; // Campos que se están agregando en el formulario de categoría

async function openHomeCategoryManager() {
    console.log('🚀 openHomeCategoryManager llamado');
    const modal = document.getElementById('homeCategoryModal');
    if (!modal) {
        console.error('❌ Error: homeCategoryModal no encontrado');
        return;
    }
    
    console.log('✅ Modal encontrado, agregando clase active');
    modal.classList.add('active');
    
    // Verificar que el onclick esté configurado
    const hasOnclick = modal.getAttribute('onclick');
    console.log('📍 Modal tiene onclick:', !!hasOnclick, hasOnclick);
    
    // Asegurar que el botón de subcategorías esté visible
    const btn = document.getElementById('createSubcategoryFromHomeBtn');
    if (btn) {
        btn.style.display = 'inline-flex';
    }
    
    await loadHomeCategoryList();
    
    // Verificar si hay categoría "Personalizados" para configurar el botón
    updateCreateSubcategoryButtonVisibility();
    
    // Configurar event listener para cerrar al hacer clic en el overlay
    setupModalOverlayClickHandler();
    
    // Verificar que el modal-content tenga stopPropagation
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        const hasStopPropagation = modalContent.getAttribute('onclick');
        console.log('📍 modal-content tiene onclick (stopPropagation):', !!hasStopPropagation, hasStopPropagation);
    }
}

/**
 * Configurar event listener para cerrar el modal al hacer clic en el overlay (fondo oscuro)
 */
function setupModalOverlayClickHandler() {
    console.log('🔧 setupModalOverlayClickHandler llamado');
    const modal = document.getElementById('homeCategoryModal');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    if (!modal || !modalContent) {
        console.error('❌ Error: No se pudo configurar el handler del overlay: modal o modalContent no encontrado');
        console.error('   modal:', !!modal);
        console.error('   modalContent:', !!modalContent);
        return;
    }
    
    console.log('✅ Modal y modalContent encontrados');
    
    // Remover handler anterior si existe
    if (window.homeCategoryModalOverlayHandler) {
        console.log('🧹 Removiendo handler anterior del overlay');
        modal.removeEventListener('click', window.homeCategoryModalOverlayHandler, true);
    }
    
    // Remover listener de stopPropagation anterior si existe
    if (window.homeCategoryModalContentClickHandler) {
        console.log('🧹 Removiendo handler anterior del modal-content');
        modalContent.removeEventListener('click', window.homeCategoryModalContentClickHandler);
    }
    
    // Prevenir que los clics dentro del modal-content se propaguen al modal
    window.homeCategoryModalContentClickHandler = (e) => {
        console.log('🛑 stopPropagation en modal-content');
        e.stopPropagation();
    };
    modalContent.addEventListener('click', window.homeCategoryModalContentClickHandler);
    console.log('✅ Listener de stopPropagation agregado al modal-content');
    
    // Crear nuevo handler para el overlay
    window.homeCategoryModalOverlayHandler = (event) => {
        console.log('🖱️ Click detectado en el modal (overlay handler)');
        console.log('   event.target:', event.target);
        console.log('   event.currentTarget:', event.currentTarget);
        
        // Verificar que el clic NO sea dentro del modal-content
        const clickedInsideContent = modalContent.contains(event.target);
        console.log('   clickedInsideContent:', clickedInsideContent);
        
        // Si el clic es directamente en el modal (overlay) o fuera del modal-content, cerrar
        if (!clickedInsideContent) {
            console.log('✅ Clic fuera del contenido, cerrando modal...');
            event.preventDefault();
            event.stopPropagation();
            closeHomeCategoryManager();
        } else {
            console.log('ℹ️ Clic dentro del contenido, ignorando...');
        }
    };
    
    // Agregar listener al modal (overlay) con capture: true para capturar antes
    modal.addEventListener('click', window.homeCategoryModalOverlayHandler, true);
    console.log('✅ Listener del overlay agregado al modal (capture: true)');
}

function updateCreateSubcategoryButtonVisibility() {
    const btn = document.getElementById('createSubcategoryFromHomeBtn');
    if (!btn) {
        console.warn('⚠️ Botón createSubcategoryFromHomeBtn no encontrado');
        return;
    }
    
    // Buscar categoría "Personalizados" en las categorías cargadas
    const personalizadosCategory = homeCategories.find(cat => {
        const nombreEsLower = (cat.nombre_es || '').toLowerCase().trim();
        const nombrePtLower = (cat.nombre_pt || '').toLowerCase().trim();
        return nombreEsLower.includes('personalizado') || nombrePtLower.includes('personalizado');
    });
    
    // El botón SIEMPRE está visible
    btn.style.display = 'inline-flex';
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
    
    if (personalizadosCategory) {
        btn.setAttribute('data-category-id', personalizadosCategory.id);
        btn.setAttribute('data-category-name', personalizadosCategory.nombre_es);
        btn.style.cursor = 'pointer';
        btn.disabled = false;
        console.log('✅ Botón de subcategoría configurado para:', personalizadosCategory.nombre_es);
    } else {
        btn.removeAttribute('data-category-id');
        btn.removeAttribute('data-category-name');
        btn.style.cursor = 'pointer';
        btn.disabled = false; // Permitir clic para mostrar mensaje
        console.log('⚠️ No se encontró categoría Personalizados, pero el botón está visible');
    }
}

window.openCreateSubcategoryFromHomeManager = function() {
    const btn = document.getElementById('createSubcategoryFromHomeBtn');
    if (!btn) {
        console.error('❌ Botón createSubcategoryFromHomeBtn no encontrado');
        return;
    }
    
    // Buscar categoría "Personalizados" si no está en el botón
    let categoryId = btn.getAttribute('data-category-id');
    let categoryName = btn.getAttribute('data-category-name') || 'Personalizados';
    
    if (!categoryId) {
        // Buscar en las categorías cargadas
        const personalizadosCategory = homeCategories.find(cat => {
            const nombreEsLower = (cat.nombre_es || '').toLowerCase().trim();
            const nombrePtLower = (cat.nombre_pt || '').toLowerCase().trim();
            return nombreEsLower.includes('personalizado') || nombrePtLower.includes('personalizado');
        });
        
        if (personalizadosCategory) {
            categoryId = personalizadosCategory.id;
            categoryName = personalizadosCategory.nombre_es;
            btn.setAttribute('data-category-id', categoryId);
            btn.setAttribute('data-category-name', categoryName);
        } else {
            alert('No se encontró la categoría "Personalizados". Por favor, créala primero en "Categorías del Home".');
            return;
        }
    }
    
    currentCategoryForSubcategories = categoryId;
    
    // Abrir el modal de subcategorías
    const modalTitle = document.getElementById('subcategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Crear Subcategoría - ${categoryName}`;
    }
    
    const subcategoryModal = document.getElementById('subcategoryModal');
    if (subcategoryModal) {
        subcategoryModal.classList.add('active');
        showCreateSubcategoryForm();
    } else {
        console.error('❌ Modal de subcategorías no encontrado');
    }
}

window.openCreateSubcategoryFromCategoryForm = function() {
    const btn = document.getElementById('createSubcategoryFromFormBtn');
    if (!btn) return;
    
    const categoryId = btn.getAttribute('data-category-id');
    const categoryName = btn.getAttribute('data-category-name') || 'Personalizados';
    
    if (!categoryId) {
        alert('Esta categoría no permite subcategorías. Solo la categoría "Personalizados" puede tener subcategorías.');
        return;
    }
    
    currentCategoryForSubcategories = categoryId;
    
    // Abrir el modal de subcategorías
    const modalTitle = document.getElementById('subcategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Crear Subcategoría - ${categoryName}`;
    }
    
    document.getElementById('subcategoryModal').classList.add('active');
    showCreateSubcategoryForm();
}

/**
 * Manejar clic en el overlay del modal (llamado desde el HTML)
 */
function handleModalOverlayClick(event) {
    console.log('🔍 handleModalOverlayClick llamado');
    console.log('📍 event.target:', event.target);
    console.log('📍 event.currentTarget:', event.currentTarget);
    
    // Verificar si el clic fue en el modal de colores VACAVALIENTE
    const vacavalienteModal = document.getElementById('vacavalienteColorsModal');
    if (vacavalienteModal && event.currentTarget === vacavalienteModal) {
        const modalContent = vacavalienteModal.querySelector('.modal-content');
        if (modalContent && !modalContent.contains(event.target)) {
            console.log('🖱️ Clic fuera del contenido del modal VACAVALIENTE, cerrando...');
            closeVacavalienteColorsManager();
            return;
        }
    }
    
    // Manejar modal de categorías del home (código original)
    const modal = document.getElementById('homeCategoryModal');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    console.log('📍 modal encontrado:', !!modal);
    console.log('📍 modalContent encontrado:', !!modalContent);
    
    if (!modal) {
        console.error('❌ Error: modal no encontrado');
        return;
    }
    
    if (!modalContent) {
        console.error('❌ Error: modalContent no encontrado');
        return;
    }
    
    console.log('📍 event.target === modal:', event.target === modal);
    console.log('📍 modalContent.contains(event.target):', modalContent.contains(event.target));
    
    // Si el clic es directamente en el modal (overlay) y no en el contenido, cerrar
    if (event.target === modal) {
        console.log('✅ Clic detectado en el overlay, cerrando modal...');
        closeHomeCategoryManager();
    } else {
        console.log('ℹ️ Clic no fue directamente en el modal, ignorando...');
    }
}

function closeHomeCategoryManager() {
    const modal = document.getElementById('homeCategoryModal');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    if (modal) {
        modal.classList.remove('active');
    }
    cancelHomeCategoryEdit();
    
    // Remover event listeners del overlay si existen
    if (window.homeCategoryModalOverlayHandler && modal) {
        modal.removeEventListener('click', window.homeCategoryModalOverlayHandler, true);
        window.homeCategoryModalOverlayHandler = null;
    }
    
    if (window.homeCategoryModalContentClickHandler && modalContent) {
        modalContent.removeEventListener('click', window.homeCategoryModalContentClickHandler);
        window.homeCategoryModalContentClickHandler = null;
    }
}

async function loadHomeCategoryList() {
    const container = document.getElementById('homeCategoryList');
    container.innerHTML = '<p>Cargando categorías...</p>';
    
    try {
        const { data, error } = await supabaseClient
            .from('categorias_geral')
            .select('*')
            .eq('tipo', 'home')
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        homeCategories = data || [];
        
        // Actualizar visibilidad del botón de crear subcategoría
        updateCreateSubcategoryButtonVisibility();
        
        if (homeCategories.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No hay categorías del home creadas aún.</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 15px;">';
        homeCategories.forEach(cat => {
            const activeBadge = cat.is_active ? 
                '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Activa</span>' :
                '<span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Inactiva</span>';
            
            // Verificar si es "Personalizados" para mostrar el botón de subcategorías
            const nombreEsLower = (cat.nombre_es || '').toLowerCase().trim();
            const nombrePtLower = (cat.nombre_pt || '').toLowerCase().trim();
            
            const isPersonalizados = nombreEsLower.includes('personalizado') || 
                                    nombrePtLower.includes('personalizado');
            
            const subcategoryButton = isPersonalizados ? `
                <button class="btn btn-primary" onclick="toggleSubcategoriesForCategory('${cat.id}')" style="padding: 8px 16px; margin-right: 5px;">
                    <i class="fas fa-tags"></i> <span id="subcat-toggle-${cat.id}">Ver Subcategorías</span>
                </button>
            ` : '';
            
            // Contenedor para subcategorías (inicialmente oculto)
            const subcategoriesContainer = isPersonalizados ? `
                <div id="subcategories-${cat.id}" style="display: none; margin-top: 15px; padding: 15px; background: #f0f4f8; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: #1d3557;">Subcategorías de ${cat.nombre_es}</h4>
                        <button class="btn btn-primary" onclick="showCreateSubcategoryFormForCategory('${cat.id}', '${cat.nombre_es}')" style="padding: 6px 12px; font-size: 0.875rem;">
                            <i class="fas fa-plus"></i> Crear Subcategoría
                        </button>
                    </div>
                    <div id="subcategories-list-${cat.id}">
                        <p style="color: #6b7280; text-align: center;">Cargando subcategorías...</p>
                    </div>
                </div>
            ` : '';
            
            html += `
                <div class="category-item" style="padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 8px;">
                                ${cat.foto ? `<img src="${cat.foto}" alt="${cat.nombre_es}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px;">` : ''}
                                <div>
                                    <div style="font-weight: 600; color: #1d3557; margin-bottom: 4px;">
                                        ${cat.nombre_es} / ${cat.nombre_pt}
                                    </div>
                                    <div style="font-size: 0.875rem; color: #6b7280;">
                                        Orden: ${cat.orden} | ${activeBadge}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${subcategoryButton}
                            <button class="btn btn-secondary" onclick="editHomeCategory('${cat.id}')" style="padding: 8px 16px;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-danger" onclick="deleteHomeCategory('${cat.id}')" style="padding: 8px 16px;">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                    ${subcategoriesContainer}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando categorías del home:', error);
        container.innerHTML = `<p style="color: #ef4444;">Error al cargar: ${error.message}</p>`;
    }
}

function showCreateHomeCategoryForm() {
    console.log('➕ Mostrando formulario para crear nueva categoría');
    editingHomeCategoryId = null;
    categoryFieldsInForm = []; // Limpiar campos
    
    // Limpiar formulario
    document.getElementById('homeCategoryFormTitle').textContent = 'Nueva Categoría Home';
    document.getElementById('homeCategoryNameEs').value = '';
    document.getElementById('homeCategoryNamePt').value = '';
    document.getElementById('homeCategoryFoto').value = '';
    document.getElementById('homeCategoryOrden').value = homeCategories.length || 0;
    document.getElementById('homeCategoryActive').checked = true;
    
    // Mostrar el formulario primero
    const formSection = document.getElementById('homeCategoryFormSection');
    const categoryList = document.getElementById('homeCategoryList');
    const filtersSection = document.getElementById('categoryFiltersSection');
    const modal = document.getElementById('homeCategoryModal');
    
    if (formSection) {
        formSection.style.display = 'block';
        formSection.style.visibility = 'visible';
        console.log('✅ Formulario de categoría mostrado');
        
        // Agregar event listener para cerrar al hacer clic fuera del formulario
        // Usar setTimeout para evitar que el clic que abre el formulario lo cierre inmediatamente
        setTimeout(() => {
            setupClickOutsideToCloseForm();
        }, 100);
        
        // Inmediatamente después de mostrar el formulario, forzar la visibilidad de la sección de filtros
        setTimeout(() => {
            const filtersSectionCheck = document.getElementById('categoryFiltersSection');
            if (filtersSectionCheck) {
                filtersSectionCheck.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #e2e8f0;';
                console.log('✅ Sección de filtros forzada a visible inmediatamente');
            } else {
                console.error('❌ No se encontró categoryFiltersSection después de mostrar el formulario');
            }
        }, 50);
    }
    
    if (categoryList) {
        categoryList.style.display = 'none';
    }
    
    // Llenar campos básicos
    document.getElementById('homeCategoryFormTitle').textContent = 'Nueva Categoría Home';
    document.getElementById('homeCategoryNameEs').value = '';
    document.getElementById('homeCategoryNamePt').value = '';
    document.getElementById('homeCategoryFoto').value = '';
    document.getElementById('homeCategoryOrden').value = homeCategories.length;
    document.getElementById('homeCategoryActive').checked = true;
    
    // Esperar un momento para que el DOM se actualice antes de acceder a los elementos de filtros
    setTimeout(() => {
        // FORZAR que la sección de filtros esté visible SIEMPRE
        const filtersSection = document.getElementById('categoryFiltersSection');
        if (filtersSection) {
            // Forzar visibilidad con múltiples métodos
            filtersSection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #e2e8f0;';
            filtersSection.style.display = 'block';
            filtersSection.style.visibility = 'visible';
            filtersSection.style.opacity = '1';
            console.log('✅ Sección de filtros encontrada y forzada a visible');
        } else {
            console.error('❌ NO se encontró categoryFiltersSection');
            // Intentar buscar por selector
            const filtersSectionFallback = document.querySelector('#homeCategoryFormSection #categoryFiltersSection');
            if (filtersSectionFallback) {
                filtersSectionFallback.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
                console.log('✅ Sección de filtros encontrada por fallback y forzada a visible');
            } else {
                console.error('❌ No se encontró la sección de filtros en ningún lugar');
            }
        }
        
        // Limpiar formulario de campos
        const newFieldId = document.getElementById('newFieldId');
        const newFieldType = document.getElementById('newFieldType');
        const newFieldLabelEs = document.getElementById('newFieldLabelEs');
        const newFieldLabelPt = document.getElementById('newFieldLabelPt');
        const newFieldPlaceholderEs = document.getElementById('newFieldPlaceholderEs');
        const newFieldPlaceholderPt = document.getElementById('newFieldPlaceholderPt');
        const newFieldRequired = document.getElementById('newFieldRequired');
        const newFieldOrden = document.getElementById('newFieldOrden');
        const newFieldOptionsContainer = document.getElementById('newFieldOptionsContainer');
        const newFieldOptionsList = document.getElementById('newFieldOptionsList');
        
        console.log('🔍 Elementos de filtros:', {
            newFieldId: !!newFieldId,
            newFieldType: !!newFieldType,
            newFieldLabelEs: !!newFieldLabelEs,
            newFieldLabelPt: !!newFieldLabelPt,
            filtersSection: !!filtersSection
        });
        
        if (newFieldId) {
            newFieldId.value = '';
            newFieldId.disabled = false;
        }
        if (newFieldLabelEs) newFieldLabelEs.value = '';
        if (newFieldLabelPt) newFieldLabelPt.value = '';
        if (newFieldPlaceholderEs) newFieldPlaceholderEs.value = '';
        if (newFieldPlaceholderPt) newFieldPlaceholderPt.value = '';
        if (newFieldType) newFieldType.value = 'text';
        if (newFieldRequired) newFieldRequired.checked = false;
        if (newFieldOrden) newFieldOrden.value = 0;
        if (newFieldOptionsContainer) newFieldOptionsContainer.style.display = 'none';
        if (newFieldOptionsList) newFieldOptionsList.innerHTML = '';
        
        // Configurar event listener para el select de tipo de campo
        if (newFieldType) {
            // Remover listener anterior si existe
            const newFieldTypeClone = newFieldType.cloneNode(true);
            newFieldType.parentNode.replaceChild(newFieldTypeClone, newFieldType);
            
            // Agregar nuevo listener
            const updatedFieldType = document.getElementById('newFieldType');
            if (updatedFieldType) {
                updatedFieldType.addEventListener('change', function() {
                    const optionsContainer = document.getElementById('newFieldOptionsContainer');
                    if (this.value === 'select') {
                        if (optionsContainer) optionsContainer.style.display = 'block';
                        const optionsList = document.getElementById('newFieldOptionsList');
                        if (optionsList && optionsList.children.length === 0) {
                            addNewFieldOption();
                        }
                    } else {
                        if (optionsContainer) optionsContainer.style.display = 'none';
                    }
                });
            }
        }
        
        // Limpiar y renderizar campos del formulario
        renderCategoryFieldsInForm();
    }, 200);
    
    // Limpiar campos del formulario (modo creación)
    categoryFieldsInForm = [];
    renderCategoryFieldsInForm();
    
    // Mostrar botón de gestionar campos (aunque esté deshabilitado hasta guardar)
    const manageFieldsBtn = document.getElementById('manageCategoryFieldsBtn');
    if (manageFieldsBtn) {
        manageFieldsBtn.style.display = 'inline-flex';
        manageFieldsBtn.disabled = true;
        manageFieldsBtn.title = 'Guarda la categoría primero para gestionar sus campos';
    }
}

async function editHomeCategory(categoryId) {
    console.log('✏️ Editando categoría:', categoryId);
    
    const cat = homeCategories.find(c => c.id === categoryId);
    if (!cat) {
        console.error('❌ Categoría no encontrada:', categoryId);
        alert('Error: Categoría no encontrada');
        return;
    }
    
    editingHomeCategoryId = categoryId; // ← IMPORTANTE: Asignar el ID al editar
    console.log('✅ editingHomeCategoryId asignado al editar:', editingHomeCategoryId);
    console.log('✅ Tipo de editingHomeCategoryId:', typeof editingHomeCategoryId);
    
    // Limpiar campos anteriores antes de cargar nuevos
    categoryFieldsInForm = [];
    
    // Rellenar formulario con datos de la categoría
    document.getElementById('homeCategoryFormTitle').textContent = `Editar: ${cat.nombre_es}`;
    document.getElementById('homeCategoryNameEs').value = cat.nombre_es || '';
    document.getElementById('homeCategoryNamePt').value = cat.nombre_pt || '';
    document.getElementById('homeCategoryFoto').value = cat.foto || '';
    document.getElementById('homeCategoryOrden').value = cat.orden || 0;
    document.getElementById('homeCategoryActive').checked = cat.is_active !== false;
    
    // Mostrar formulario y ocultar lista
    document.getElementById('homeCategoryFormSection').style.display = 'block';
    document.getElementById('homeCategoryList').style.display = 'none';
    
    // Agregar event listener para cerrar al hacer clic fuera del formulario
    setTimeout(() => {
        setupClickOutsideToCloseForm();
    }, 100);
    
    // FORZAR que la sección de filtros esté visible SIEMPRE al editar
    const filtersSection = document.getElementById('categoryFiltersSection');
    if (filtersSection) {
        filtersSection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #e2e8f0;';
        filtersSection.style.display = 'block';
        filtersSection.style.visibility = 'visible';
        console.log('✅ Sección de filtros forzada a visible en edición');
    }
    
    // Cargar campos existentes de la categoría
    console.log('🔄 Cargando campos existentes para categoría:', categoryId);
    try {
        await loadCategoryFieldsForEdit(categoryId);
        console.log('✅ Campos cargados. Total:', categoryFieldsInForm.length);
        console.log('📋 Campos en categoryFieldsInForm:', JSON.stringify(categoryFieldsInForm, null, 2));
        
        // Esperar un momento para asegurar que el DOM esté listo y luego renderizar
        // Usar múltiples intentos para asegurar que el contenedor esté disponible
        let renderAttempts = 0;
        const maxAttempts = 5;
        
        const tryRender = () => {
            renderAttempts++;
            const container = document.getElementById('categoryFieldsFormContainer');
            
            if (container) {
                console.log('✅ Contenedor encontrado en intento', renderAttempts);
                console.log('🎨 Renderizando campos en el formulario...');
                console.log('📊 categoryFieldsInForm.length:', categoryFieldsInForm.length);
                renderCategoryFieldsInForm();
                
                // Verificar que se renderizaron correctamente
                setTimeout(() => {
                    const checkContainer = document.getElementById('categoryFieldsFormContainer');
                    if (checkContainer && checkContainer.innerHTML.includes('Campo')) {
                        console.log('✅ Campos renderizados correctamente');
                    } else {
                        console.warn('⚠️ Campos no se renderizaron correctamente, reintentando...');
                        if (renderAttempts < maxAttempts) {
                            setTimeout(tryRender, 200);
                        }
                    }
                }, 100);
            } else {
                console.warn('⚠️ Contenedor no encontrado en intento', renderAttempts);
                if (renderAttempts < maxAttempts) {
                    setTimeout(tryRender, 200);
                } else {
                    console.error('❌ No se pudo encontrar el contenedor después de', maxAttempts, 'intentos');
                }
            }
        };
        
        // Iniciar el primer intento
        setTimeout(tryRender, 100);
        
    } catch (error) {
        console.error('❌ Error cargando campos:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al cargar los campos de la categoría: ' + error.message);
    }
    
    console.log('✅ Categoría cargada para edición');
    
    // Mostrar y habilitar botón de gestionar campos
    const manageFieldsBtn = document.getElementById('manageCategoryFieldsBtn');
    if (manageFieldsBtn) {
        manageFieldsBtn.style.display = 'inline-flex';
        manageFieldsBtn.disabled = false;
        manageFieldsBtn.title = 'Gestionar campos/filtros de esta categoría';
    }
    
    // Mostrar botón de crear subcategoría solo si es "Personalizados"
    const createSubcategoryBtn = document.getElementById('createSubcategoryFromFormBtn');
    if (createSubcategoryBtn) {
        const nombreEsLower = (cat.nombre_es || '').toLowerCase().trim();
        const nombrePtLower = (cat.nombre_pt || '').toLowerCase().trim();
        const isPersonalizados = nombreEsLower.includes('personalizado') || nombrePtLower.includes('personalizado');
        
        if (isPersonalizados) {
            createSubcategoryBtn.style.display = 'inline-flex';
            createSubcategoryBtn.setAttribute('data-category-id', categoryId);
            createSubcategoryBtn.setAttribute('data-category-name', cat.nombre_es);
            currentCategoryForSubcategories = categoryId;
        } else {
            createSubcategoryBtn.style.display = 'none';
            createSubcategoryBtn.removeAttribute('data-category-id');
        }
    }
}

function cancelHomeCategoryEdit() {
    editingHomeCategoryId = null;
    categoryFieldsInForm = [];
    const formSection = document.getElementById('homeCategoryFormSection');
    const categoryList = document.getElementById('homeCategoryList');
    
    if (formSection) {
        formSection.style.display = 'none';
    }
    if (categoryList) {
        categoryList.style.display = 'block';
    }
    
    // Remover event listener de clic fuera si existe
    if (window.homeCategoryClickOutsideHandler) {
        const modal = document.getElementById('homeCategoryModal');
        const modalContent = modal ? modal.querySelector('.modal-content') : null;
        if (modalContent) {
            modalContent.removeEventListener('click', window.homeCategoryClickOutsideHandler);
        }
        window.homeCategoryClickOutsideHandler = null;
    }
}

/**
 * Configurar event listener para cerrar el formulario al hacer clic fuera
 */
function setupClickOutsideToCloseForm() {
    const modal = document.getElementById('homeCategoryModal');
    const formSection = document.getElementById('homeCategoryFormSection');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    if (!modal || !formSection || !modalContent) {
        return;
    }
    
    // Remover handler anterior si existe
    if (window.homeCategoryClickOutsideHandler) {
        modalContent.removeEventListener('click', window.homeCategoryClickOutsideHandler);
    }
    
    // Crear nuevo handler
    window.homeCategoryClickOutsideHandler = (event) => {
        // Verificar que el formulario esté visible
        const formDisplay = window.getComputedStyle(formSection).display;
        const isFormVisible = formDisplay !== 'none';
        
        if (!isFormVisible) {
            return;
        }
        
        // Verificar que el clic NO sea dentro del formulario
        if (formSection.contains(event.target)) {
            return;
        }
        
        // Verificar que el clic no sea en botones que abren el formulario
        const createBtn = event.target.closest('button[onclick*="showCreateHomeCategoryForm"]');
        const editBtn = event.target.closest('button[onclick*="editHomeCategory"]');
        
        if (createBtn || editBtn) {
            return;
        }
        
        // Si llegamos aquí, el clic es fuera del formulario dentro del modal-content
        // Cerrar el formulario
        event.preventDefault();
        event.stopPropagation();
        cancelHomeCategoryEdit();
    };
    
    // Agregar listener al modal-content con capture: true para capturar antes que otros handlers
    modalContent.addEventListener('click', window.homeCategoryClickOutsideHandler, true);
}

// Función auxiliar para cargar campos existentes al editar
async function loadCategoryFieldsForEdit(categoryId) {
    console.log('🔄 Cargando campos para edición de categoría:', categoryId);
    
    if (!supabaseClient) {
        // Intentar inicializar si no está disponible
        await initSupabase();
        if (!supabaseClient) {
            categoryFieldsInForm = [];
            return;
        }
    }
    
    try {
        const { data: fields, error } = await supabaseClient
            .from('category_fields')
            .select('*')
            .eq('categoria_id', categoryId)
            .order('orden', { ascending: true });
        
        if (error) {
            console.error('❌ Error cargando campos:', error);
            throw error;
        }
        
        console.log('✅ Campos cargados desde BD:', fields?.length || 0);
        
        if (fields && fields.length > 0) {
            categoryFieldsInForm = fields.map(field => ({
                id: field.id, // IMPORTANTE: guardar el ID del campo para poder actualizarlo
                field_id: field.field_id,
                label_es: field.label_es,
                label_pt: field.label_pt,
                field_type: field.field_type,
                placeholder_es: field.placeholder_es || '',
                placeholder_pt: field.placeholder_pt || '',
                options: field.options || [],
                is_required: field.is_required || false,
                show_in_filters: field.show_in_filters !== undefined ? field.show_in_filters : true, // Por defecto true
                orden: field.orden || 0
            }));
            console.log('✅ Campos cargados en categoryFieldsInForm:', categoryFieldsInForm.length);
        } else {
            categoryFieldsInForm = [];
            console.log('ℹ️ No hay campos asociados a esta categoría');
        }
    } catch (error) {
        console.error('❌ Error cargando campos de la categoría:', error);
        console.error('Stack trace:', error.stack);
        categoryFieldsInForm = [];
    }
}

async function saveHomeCategory() {
    console.log('💾 saveHomeCategory() llamado');
    console.log('📊 categoryFieldsInForm al inicio de saveHomeCategory:', categoryFieldsInForm);
    console.log('📊 categoryFieldsInForm.length al inicio:', categoryFieldsInForm?.length || 0);
    
    const nombreEs = document.getElementById('homeCategoryNameEs').value.trim();
    const nombrePt = document.getElementById('homeCategoryNamePt').value.trim();
    const foto = document.getElementById('homeCategoryFoto').value.trim();
    const orden = parseInt(document.getElementById('homeCategoryOrden').value) || 0;
    const isActive = document.getElementById('homeCategoryActive').checked;
    
    if (!nombreEs || !nombrePt || !foto) {
        alert('Debes completar el nombre en ambos idiomas y la foto');
        return;
    }
    
    try {
        const categoryData = {
            tipo: 'home', // ← IMPORTANTE: Agregar tipo para categorías del home
            nombre_es: nombreEs,
            nombre_pt: nombrePt,
            foto: foto,
            orden: orden,
            is_active: isActive
        };
        
        // Debug: mostrar qué datos se están guardando
        console.log('💾 Guardando categoría con datos:', categoryData);
        console.log('📸 URL de foto que se guardará:', foto);
        
        let savedCategoryId = null;
        
        if (editingHomeCategoryId) {
            // MODO EDICIÓN: Actualizar categoría existente
            // Primero obtener el nombre antiguo de la categoría para actualizar productos
            const { data: oldCategory, error: fetchError } = await supabaseClient
                .from('categorias_geral')
                .select('nombre_es, nombre_pt')
                .eq('id', editingHomeCategoryId)
                .single();
            
            if (fetchError) {
                console.warn('⚠️ No se pudo obtener la categoría antigua:', fetchError);
            }
            
            // Actualizar la categoría
            const { error } = await supabaseClient
                .from('categorias_geral')
                .update(categoryData)
                .eq('id', editingHomeCategoryId)
                .eq('tipo', 'home');
            
            if (error) throw error;
            savedCategoryId = editingHomeCategoryId;
            
            // Si el nombre cambió, actualizar todos los productos con el nombre antiguo
            if (oldCategory && (oldCategory.nombre_es !== nombreEs || oldCategory.nombre_pt !== nombrePt)) {
                console.log('🔄 Nombre de categoría cambió, actualizando productos...');
                console.log('   Nombre antiguo (ES):', oldCategory.nombre_es);
                console.log('   Nombre nuevo (ES):', nombreEs);
                
                // Actualizar productos que tengan el nombre antiguo en español
                if (oldCategory.nombre_es && oldCategory.nombre_es !== nombreEs) {
                    const { error: updateErrorEs } = await supabaseClient
                        .from('products')
                        .update({ categoria: nombreEs })
                        .eq('categoria', oldCategory.nombre_es);
                    
                    if (updateErrorEs) {
                        console.error('❌ Error actualizando productos (ES):', updateErrorEs);
                    } else {
                        console.log('✅ Productos actualizados con nuevo nombre (ES)');
                    }
                }
                
                // Actualizar productos que tengan el nombre antiguo en portugués
                if (oldCategory.nombre_pt && oldCategory.nombre_pt !== nombrePt) {
                    const { error: updateErrorPt } = await supabaseClient
                        .from('products')
                        .update({ categoria: nombrePt })
                        .eq('categoria', oldCategory.nombre_pt);
                    
                    if (updateErrorPt) {
                        console.error('❌ Error actualizando productos (PT):', updateErrorPt);
                    } else {
                        console.log('✅ Productos actualizados con nuevo nombre (PT)');
                    }
                }
            }
            
            // Guardar/actualizar campos asociados a la categoría
            console.log('🔍 Verificando campos antes de guardar...');
            console.log('📊 categoryFieldsInForm:', categoryFieldsInForm);
            console.log('📊 categoryFieldsInForm.length:', categoryFieldsInForm?.length);
            console.log('📊 editingHomeCategoryId:', editingHomeCategoryId);
            
            if (categoryFieldsInForm && categoryFieldsInForm.length > 0) {
                await saveCategoryFieldsForCategory(editingHomeCategoryId, categoryFieldsInForm);
            }
            
            alert('✅ Categoría del home actualizada correctamente');
        } else {
            // Agregar tipo='home' al crear nueva categoría
            categoryData.tipo = 'home';
            const { data, error } = await supabaseClient
                .from('categorias_geral')
                .insert(categoryData)
                .select()
                .single();
            
            if (error) throw error;
            savedCategoryId = data.id;
            editingHomeCategoryId = savedCategoryId; // ← IMPORTANTE: Guardar el ID para poder gestionar campos
            
            // Guardar campos asociados a la categoría si hay alguno
            if (categoryFieldsInForm && categoryFieldsInForm.length > 0) {
                await saveCategoryFieldsForCategory(savedCategoryId, categoryFieldsInForm);
            }
            
            alert('✅ Categoría del home creada correctamente. Ahora puedes gestionar sus campos/filtros.');
        }
        
        // Habilitar botón de gestionar campos después de guardar
        const manageFieldsBtn = document.getElementById('manageCategoryFieldsBtn');
        if (manageFieldsBtn && savedCategoryId) {
            manageFieldsBtn.disabled = false;
            manageFieldsBtn.title = 'Gestionar campos/filtros de esta categoría';
            console.log('✅ Botón de gestionar campos habilitado');
        }
        
        // No cancelar la edición para que el usuario pueda gestionar campos inmediatamente
        // cancelHomeCategoryEdit();
        await loadHomeCategoryList();
    } catch (error) {
        console.error('Error guardando categoría del home:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al guardar: ' + error.message);
    }
}

/**
 * Guardar/actualizar campos de una categoría
 * Si el campo tiene ID, se actualiza; si no, se crea
 */
async function saveCategoryFieldsForCategory(categoryId, fields) {
    console.log('💾 saveCategoryFieldsForCategory llamado');
    console.log('📋 Parámetros:', { categoryId, fieldsCount: fields?.length, supabaseClient: !!supabaseClient });
    
    if (!supabaseClient) {
        alert('Error: Supabase no está inicializado. No se pueden guardar los campos.');
        return;
    }
    
    if (!categoryId) {
        console.error('❌ categoryId no proporcionado');
        alert('Error: No se proporcionó el ID de la categoría.');
        return;
    }
    
    if (!fields || fields.length === 0) {
        return;
    }
    console.log('📋 Campos a guardar:', JSON.stringify(fields, null, 2));
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const field of fields) {
            console.log(`🔄 Procesando campo:`, field);
            
            // Validar que el campo tenga los datos mínimos
            if (!field.field_id || !field.label_es || !field.label_pt || !field.field_type) {
                console.warn('⚠️ Campo incompleto, saltando:', field);
                errorCount++;
                continue;
            }
            
            const fieldData = {
                categoria_id: categoryId,
                field_id: field.field_id,
                label_es: field.label_es,
                label_pt: field.label_pt,
                field_type: field.field_type,
                placeholder_es: field.placeholder_es || null,
                placeholder_pt: field.placeholder_pt || null,
                options: field.options && field.options.length > 0 ? field.options : null,
                is_required: field.is_required || false,
                show_in_filters: field.show_in_filters !== undefined ? field.show_in_filters : true,
                orden: field.orden || 0
            };
            
            console.log(`📤 Datos del campo a guardar:`, JSON.stringify(fieldData, null, 2));
            console.log(`📤 Tipo de categoria_id:`, typeof fieldData.categoria_id);
            console.log(`📤 Valor de categoria_id:`, fieldData.categoria_id);
            
            if (field.id) {
                // ACTUALIZAR campo existente
                console.log(`🔄 Actualizando campo existente con ID: ${field.id}`);
                const { data, error } = await supabaseClient
                    .from('category_fields')
                    .update(fieldData)
                    .eq('id', field.id)
                    .select();
                
                if (error) {
                    console.error(`❌ Error actualizando campo ${field.field_id}:`, error);
                    console.error('Detalles del error:', JSON.stringify(error, null, 2));
                    errorCount++;
                } else {
                    console.log(`✅ Campo actualizado: ${field.field_id}`, data);
                    successCount++;
                }
            } else {
                // CREAR nuevo campo
                console.log(`➕ Creando nuevo campo: ${field.field_id}`);
                const { data, error } = await supabaseClient
                    .from('category_fields')
                    .insert(fieldData)
                    .select();
                
                if (error) {
                    console.error(`❌ Error creando campo ${field.field_id}:`, error);
                    console.error('Detalles del error:', JSON.stringify(error, null, 2));
                    console.error('Código del error:', error.code);
                    console.error('Mensaje del error:', error.message);
                    console.error('Detalles completos:', error);
                    
                    // Mostrar error específico al usuario
                    if (error.code === '23503') {
                        alert(`Error: La categoría con ID ${categoryId} no existe en home_categories. Verifica que la categoría se haya guardado correctamente.`);
                    } else if (error.code === '23505') {
                        alert(`Error: Ya existe un campo con el ID "${field.field_id}" para esta categoría.`);
                    } else {
                        alert(`Error al crear campo "${field.field_id}": ${error.message}`);
                    }
                    
                    errorCount++;
                } else {
                    console.log(`✅ Campo creado: ${field.field_id}`, data);
                    successCount++;
                }
            }
        }
        
        console.log(`✅ Proceso completado: ${successCount} exitosos, ${errorCount} errores`);
        
        if (errorCount > 0) {
            alert(`⚠️ Se guardaron ${successCount} campos, pero hubo ${errorCount} errores. Revisa la consola para más detalles.`);
        } else {
            console.log('✅ Todos los campos guardados/actualizados correctamente');
        }
    } catch (error) {
        console.error('❌ Error guardando campos de la categoría:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al guardar campos: ' + error.message);
        throw error;
    }
}

// ============================================
// FUNCIONES PARA GESTIONAR SUBCATEGORÍAS
// ============================================

window.openSubcategoryManager = function() {
    if (!currentCategoryForSubcategories) {
        alert('Primero debes seleccionar una categoría que tenga subcategorías (ej: Personalizados)');
        return;
    }
    
    // Obtener el nombre de la categoría padre
    const categoriaSelect = document.getElementById('categoria');
    const selectedOption = categoriaSelect.options[categoriaSelect.selectedIndex];
    const categoryName = selectedOption.getAttribute('data-category-name') || 'Personalizados';
    
    openSubcategoryManagerForCategory(currentCategoryForSubcategories, categoryName);
}

window.toggleSubcategoriesForCategory = async function(categoryId) {
    const container = document.getElementById(`subcategories-${categoryId}`);
    const toggleText = document.getElementById(`subcat-toggle-${categoryId}`);
    
    if (!container) return;
    
    if (container.style.display === 'none' || !container.style.display) {
        // Mostrar y cargar subcategorías
        container.style.display = 'block';
        if (toggleText) toggleText.textContent = 'Ocultar Subcategorías';
        
        // Cargar subcategorías para esta categoría
        await loadSubcategoriesForCategory(categoryId);
    } else {
        // Ocultar
        container.style.display = 'none';
        if (toggleText) toggleText.textContent = 'Ver Subcategorías';
    }
}

async function loadSubcategoriesForCategory(categoryId) {
    const listContainer = document.getElementById(`subcategories-list-${categoryId}`);
    if (!listContainer || !supabaseClient) return;
    
    listContainer.innerHTML = '<p style="color: #6b7280; text-align: center;">Cargando subcategorías...</p>';
    
    try {
        const { data, error } = await supabaseClient
            .from('categorias_geral')
            .select('*')
            .eq('tipo', 'subcategory')
            .eq('categoria_padre_id', categoryId)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        const subcats = data || [];
        
        if (subcats.length === 0) {
            listContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No hay subcategorías creadas aún.</p>';
            return;
        }
        
        const currentLang = localStorage.getItem('language') || 'pt';
        
        let html = '<div style="display: grid; gap: 10px;">';
        subcats.forEach(subcat => {
            const nombre = currentLang === 'es' ? subcat.nombre_es : 
                          currentLang === 'pt' ? subcat.nombre_pt : 
                          subcat.nombre_es;
            
            const activeBadge = subcat.is_active ? 
                '<span style="background: #10b981; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem;">Activa</span>' :
                '<span style="background: #6b7280; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem;">Inactiva</span>';
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1d3557; margin-bottom: 4px;">
                            ${nombre}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            Orden: ${subcat.orden} | ${activeBadge}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="editSubcategoryInCategory('${subcat.id}', '${categoryId}')" style="background: #6b7280; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="deleteSubcategoryInCategory('${subcat.id}', '${categoryId}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        listContainer.innerHTML = html;
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
        listContainer.innerHTML = `<p style="color: #ef4444;">Error al cargar: ${error.message}</p>`;
    }
}

window.showCreateSubcategoryFormForCategory = function(categoryId, categoryName) {
    currentCategoryForSubcategories = categoryId;
    
    // Abrir el modal de subcategorías
    const modalTitle = document.getElementById('subcategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Crear Subcategoría - ${categoryName}`;
    }
    
    document.getElementById('subcategoryModal').classList.add('active');
    showCreateSubcategoryForm();
}

window.editSubcategoryInCategory = function(subcategoryId, categoryId) {
    currentCategoryForSubcategories = categoryId;
    
    // Cargar subcategorías primero
    loadSubcategories(categoryId).then(() => {
        editSubcategory(subcategoryId);
        
        // Abrir el modal
        const subcat = subcategories.find(s => s.id === subcategoryId);
        if (subcat) {
            const modalTitle = document.getElementById('subcategoryModalTitle');
            if (modalTitle) {
                // Obtener nombre de la categoría padre
                const cat = homeCategories.find(c => c.id === categoryId);
                const categoryName = cat ? cat.nombre_es : 'Personalizados';
                modalTitle.textContent = `Editar Subcategoría - ${categoryName}`;
            }
        }
        
        document.getElementById('subcategoryModal').classList.add('active');
    });
}

window.deleteSubcategoryInCategory = async function(subcategoryId, categoryId) {
    if (!supabaseClient) {
        alert('Error: No se pudo conectar con la base de datos');
        return;
    }

    // Cargar subcategorías para obtener el nombre
    await loadSubcategories(categoryId);
    const subcat = subcategories.find(s => s.id === subcategoryId);
    if (!subcat) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la subcategoría "${subcat.nombre_es}"?`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('categorias_geral')
            .delete()
            .eq('id', subcategoryId)
            .eq('tipo', 'subcategory');
        
        if (error) throw error;
        
        alert('✅ Subcategoría eliminada');
        // Recargar la lista de subcategorías en el contenedor
        await loadSubcategoriesForCategory(categoryId);
    } catch (error) {
        console.error('Error eliminando subcategoría:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

window.toggleSubcategoriesForCategory = async function(categoryId) {
    const container = document.getElementById(`subcategories-${categoryId}`);
    const toggleText = document.getElementById(`subcat-toggle-${categoryId}`);
    
    if (!container) return;
    
    if (container.style.display === 'none' || !container.style.display) {
        // Mostrar y cargar subcategorías
        container.style.display = 'block';
        if (toggleText) toggleText.textContent = 'Ocultar Subcategorías';
        
        // Cargar subcategorías para esta categoría
        await loadSubcategoriesForCategory(categoryId);
    } else {
        // Ocultar
        container.style.display = 'none';
        if (toggleText) toggleText.textContent = 'Ver Subcategorías';
    }
}

async function loadSubcategoriesForCategory(categoryId) {
    const listContainer = document.getElementById(`subcategories-list-${categoryId}`);
    if (!listContainer || !supabaseClient) return;
    
    listContainer.innerHTML = '<p style="color: #6b7280; text-align: center;">Cargando subcategorías...</p>';
    
    try {
        const { data, error } = await supabaseClient
            .from('categorias_geral')
            .select('*')
            .eq('tipo', 'subcategory')
            .eq('categoria_padre_id', categoryId)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        const subcats = data || [];
        
        if (subcats.length === 0) {
            listContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No hay subcategorías creadas aún.</p>';
            return;
        }
        
        const currentLang = localStorage.getItem('language') || 'pt';
        
        let html = '<div style="display: grid; gap: 10px;">';
        subcats.forEach(subcat => {
            const nombre = currentLang === 'es' ? subcat.nombre_es : 
                          currentLang === 'pt' ? subcat.nombre_pt : 
                          subcat.nombre_es;
            
            const activeBadge = subcat.is_active ? 
                '<span style="background: #10b981; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem;">Activa</span>' :
                '<span style="background: #6b7280; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem;">Inactiva</span>';
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1d3557; margin-bottom: 4px;">
                            ${nombre}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            Orden: ${subcat.orden} | ${activeBadge}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="editSubcategoryInCategory('${subcat.id}', '${categoryId}')" style="background: #6b7280; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="deleteSubcategoryInCategory('${subcat.id}', '${categoryId}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        listContainer.innerHTML = html;
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
        listContainer.innerHTML = `<p style="color: #ef4444;">Error al cargar: ${error.message}</p>`;
    }
}

window.showCreateSubcategoryFormForCategory = function(categoryId, categoryName) {
    currentCategoryForSubcategories = categoryId;
    
    // Abrir el modal de subcategorías
    const modalTitle = document.getElementById('subcategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Crear Subcategoría - ${categoryName}`;
    }
    
    document.getElementById('subcategoryModal').classList.add('active');
    showCreateSubcategoryForm();
}

window.openSubcategoryManagerForCategory = function(categoryId, categoryName) {
    currentCategoryForSubcategories = categoryId;
    
    // Actualizar título del modal
    const modalTitle = document.getElementById('subcategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Gestionar Subcategorías - ${categoryName}`;
    }
    
    // Cerrar el modal de categorías del home si está abierto
    const homeCategoryModal = document.getElementById('homeCategoryModal');
    if (homeCategoryModal && homeCategoryModal.classList.contains('active')) {
        homeCategoryModal.classList.remove('active');
    }
    
    // Abrir el modal de subcategorías
    document.getElementById('subcategoryModal').classList.add('active');
    loadSubcategoryList();
}

window.closeSubcategoryManager = function() {
    document.getElementById('subcategoryModal').classList.remove('active');
    cancelSubcategoryEdit();
}

async function loadSubcategoryList() {
    const container = document.getElementById('subcategoryList');
    if (!container || !currentCategoryForSubcategories) return;
    
    container.innerHTML = '<p>Cargando subcategorías...</p>';
    
    try {
        const { data, error } = await supabaseClient
            .from('categorias_geral')
            .select('*')
            .eq('tipo', 'subcategory')
            .eq('categoria_padre_id', currentCategoryForSubcategories)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        subcategories = data || [];
        
        if (subcategories.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No hay subcategorías creadas aún.</p>';
            return;
        }
        
        const currentLang = localStorage.getItem('language') || 'pt';
        
        let html = '<div style="display: grid; gap: 15px;">';
        subcategories.forEach(subcat => {
            const nombre = currentLang === 'es' ? subcat.nombre_es : 
                          currentLang === 'pt' ? subcat.nombre_pt : 
                          subcat.nombre_es;
            
            const activeBadge = subcat.is_active ? 
                '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Activa</span>' :
                '<span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Inactiva</span>';
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1d3557; margin-bottom: 4px;">
                            ${nombre}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            Orden: ${subcat.orden} | ${activeBadge}
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editSubcategory('${subcat.id}')" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="deleteSubcategory('${subcat.id}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
        container.innerHTML = `<p style="color: #ef4444;">Error al cargar: ${error.message}</p>`;
    }
}

window.showCreateSubcategoryForm = function() {
    // Si no hay categoría seleccionada, intentar obtenerla del botón o buscar "Personalizados"
    if (!currentCategoryForSubcategories) {
        const btn = document.getElementById('createSubcategoryFromHomeBtn');
        if (btn) {
            const categoryId = btn.getAttribute('data-category-id');
            if (categoryId) {
                currentCategoryForSubcategories = categoryId;
            }
        }
        
        // Si aún no hay, buscar "Personalizados" en las categorías cargadas
        if (!currentCategoryForSubcategories) {
            const personalizadosCategory = homeCategories.find(cat => {
                const nombreEsLower = (cat.nombre_es || '').toLowerCase().trim();
                const nombrePtLower = (cat.nombre_pt || '').toLowerCase().trim();
                return nombreEsLower.includes('personalizado') || nombrePtLower.includes('personalizado');
            });
            
            if (personalizadosCategory) {
                currentCategoryForSubcategories = personalizadosCategory.id;
            } else {
                alert('No se encontró la categoría "Personalizados". Por favor, créala primero en "Categorías del Home".');
                return;
            }
        }
    }
    
    // Asegurar que el modal esté abierto
    const modal = document.getElementById('subcategoryModal');
    if (!modal) {
        console.error('❌ Modal de subcategorías no encontrado');
        return;
    }
    
    if (!modal.classList.contains('active')) {
        modal.classList.add('active');
    }
    
    // Obtener el nombre de la categoría padre
    let categoryName = 'Personalizados';
    const btn = document.getElementById('createSubcategoryFromHomeBtn');
    if (btn) {
        const name = btn.getAttribute('data-category-name');
        if (name) categoryName = name;
    } else {
        const cat = homeCategories.find(c => c.id === currentCategoryForSubcategories);
        if (cat) categoryName = cat.nombre_es;
    }
    
    // Actualizar título del modal
    const modalTitle = document.getElementById('subcategoryModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Crear Subcategoría - ${categoryName}`;
    }
    
    // Cargar lista de subcategorías si no está cargada
    loadSubcategoryList();
    
    editingSubcategoryId = null;
    document.getElementById('subcategoryFormTitle').textContent = 'Nueva Subcategoría';
    document.getElementById('subcategoryNameEs').value = '';
    document.getElementById('subcategoryNamePt').value = '';
    document.getElementById('subcategoryOrden').value = subcategories.length || 0;
    document.getElementById('subcategoryActive').checked = true;
    document.getElementById('subcategoryFormSection').style.display = 'block';
    document.getElementById('subcategoryList').style.display = 'none';
}

window.cancelSubcategoryEdit = function() {
    editingSubcategoryId = null;
    document.getElementById('subcategoryFormSection').style.display = 'none';
    document.getElementById('subcategoryList').style.display = 'block';
}

window.editSubcategory = function(subcategoryId) {
    const subcat = subcategories.find(s => s.id === subcategoryId);
    if (!subcat) return;
    
    editingSubcategoryId = subcategoryId;
    document.getElementById('subcategoryFormTitle').textContent = `Editar: ${subcat.nombre_es}`;
    document.getElementById('subcategoryNameEs').value = subcat.nombre_es || '';
    document.getElementById('subcategoryNamePt').value = subcat.nombre_pt || '';
    document.getElementById('subcategoryOrden').value = subcat.orden || 0;
    document.getElementById('subcategoryActive').checked = subcat.is_active !== false;
    document.getElementById('subcategoryFormSection').style.display = 'block';
    document.getElementById('subcategoryList').style.display = 'none';
}

window.saveSubcategory = async function() {
    if (!supabaseClient || !currentCategoryForSubcategories) {
        alert('Error: No se pudo conectar con la base de datos');
        return;
    }

    const nombreEs = document.getElementById('subcategoryNameEs').value.trim();
    const nombrePt = document.getElementById('subcategoryNamePt').value.trim();
    const orden = parseInt(document.getElementById('subcategoryOrden').value) || 0;
    const isActive = document.getElementById('subcategoryActive').checked;
    
    if (!nombreEs || !nombrePt) {
        alert('Debes completar el nombre en ambos idiomas');
        return;
    }
    
    try {
        const subcategoryData = {
            tipo: 'subcategory', // ← IMPORTANTE: Agregar tipo
            categoria_padre_id: currentCategoryForSubcategories,
            nombre_es: nombreEs,
            nombre_pt: nombrePt,
            orden: orden,
            is_active: isActive
        };
        
        if (editingSubcategoryId) {
            const { error } = await supabaseClient
                .from('categorias_geral')
                .update(subcategoryData)
                .eq('id', editingSubcategoryId)
                .eq('tipo', 'subcategory');
            
            if (error) throw error;
            alert('✅ Subcategoría actualizada correctamente');
        } else {
            const { error } = await supabaseClient
                .from('categorias_geral')
                .insert(subcategoryData);
            
            if (error) throw error;
            alert('✅ Subcategoría creada correctamente');
        }
        
        cancelSubcategoryEdit();
        await loadSubcategoryList();
        // Recargar subcategorías en el formulario si está abierto
        if (currentCategoryForSubcategories) {
            loadSubcategories(currentCategoryForSubcategories);
        }
    } catch (error) {
        console.error('Error guardando subcategoría:', error);
        alert('Error al guardar: ' + error.message);
    }
}

window.deleteSubcategory = async function(subcategoryId) {
    if (!supabaseClient) {
        alert('Error: No se pudo conectar con la base de datos');
        return;
    }

    const subcat = subcategories.find(s => s.id === subcategoryId);
    if (!subcat) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la subcategoría "${subcat.nombre_es}"?`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('categorias_geral')
            .delete()
            .eq('id', subcategoryId)
            .eq('tipo', 'subcategory');
        
        if (error) throw error;
        
        alert('✅ Subcategoría eliminada');
        await loadSubcategoryList();
        // Recargar subcategorías en el formulario si está abierto
        if (currentCategoryForSubcategories) {
            loadSubcategories(currentCategoryForSubcategories);
        }
    } catch (error) {
        console.error('Error eliminando subcategoría:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

async function deleteHomeCategory(categoryId) {
    const cat = homeCategories.find(c => c.id === categoryId);
    if (!cat) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${cat.nombre_es}"?`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('categorias_geral')
            .delete()
            .eq('id', categoryId)
            .eq('tipo', 'home');
        
        if (error) throw error;
        
        alert('✅ Categoría del home eliminada');
        await loadHomeCategoryList();
    } catch (error) {
        console.error('Error eliminando categoría del home:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

// Función para crear la tabla (ejecutar desde consola del navegador)
window.createCategoryTable = async function() {
    if (!supabaseClient) {
        return;
    }
    
    const sql = `
        CREATE TABLE IF NOT EXISTS product_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            fields JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_product_categories_id ON product_categories(id);
    `;
    
    console.log('⚠️ Esta función debe ejecutarse en el SQL Editor de Supabase:');
    console.log(sql);
    console.log('\nO abre la consola de Supabase y ejecuta el SQL manualmente.');
};

// ============================================
// GESTIÓN DE CAMPOS/FILTROS DE CATEGORÍAS
// ============================================

let currentCategoryForFields = null; // ID de la categoría para la que se están gestionando campos
let editingCategoryFieldId = null; // ID del campo que se está editando
let categoryFieldsList = []; // Lista de campos de la categoría actual

async function openCategoryFieldsManager() {
    if (!editingHomeCategoryId) {
        alert('Primero debes guardar la categoría antes de gestionar sus campos.');
        return;
    }
    
    currentCategoryForFields = editingHomeCategoryId;
    const cat = homeCategories.find(c => c.id === editingHomeCategoryId);
    const modalTitle = document.getElementById('categoryFieldsModalTitle');
    if (modalTitle && cat) {
        modalTitle.textContent = `Gestionar Campos/Filtros - ${cat.nombre_es}`;
    }
    
    document.getElementById('categoryFieldsModal').classList.add('active');
    await loadCategoryFieldsList();
}

function closeCategoryFieldsManager() {
    document.getElementById('categoryFieldsModal').classList.remove('active');
    cancelCategoryFieldEdit();
    currentCategoryForFields = null;
}

async function loadCategoryFieldsList() {
    const container = document.getElementById('categoryFieldsList');
    container.innerHTML = '<p>Cargando campos...</p>';
    
    if (!supabaseClient || !currentCategoryForFields) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('category_fields')
            .select('*')
            .eq('categoria_id', currentCategoryForFields)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        categoryFieldsList = data || [];
        
        if (categoryFieldsList.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No hay campos definidos para esta categoría. Crea el primero haciendo clic en "Crear Nuevo Campo".</p>';
            return;
        }
        
        let html = '<div style="display: grid; gap: 15px;">';
        categoryFieldsList.forEach(field => {
            const typeLabels = {
                'text': 'Texto',
                'number': 'Número',
                'select': 'Select',
                'textarea': 'Área de texto'
            };
            
            const requiredBadge = field.is_required ? 
                '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Obligatorio</span>' :
                '<span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Opcional</span>';
            
            html += `
                <div style="padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1d3557; margin-bottom: 4px;">
                                ${field.label_es} / ${field.label_pt}
                            </div>
                            <div style="font-size: 0.875rem; color: #6b7280;">
                                ID: <code>${field.field_id}</code> | Tipo: ${typeLabels[field.field_type] || field.field_type} | Orden: ${field.orden} | ${requiredBadge}
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" onclick="editCategoryField('${field.id}')" style="padding: 8px 16px;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-danger" onclick="deleteCategoryField('${field.id}')" style="padding: 8px 16px;">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando campos:', error);
        container.innerHTML = `<p style="color: #ef4444;">Error al cargar: ${error.message}</p>`;
    }
}

function showCreateCategoryFieldForm() {
    editingCategoryFieldId = null;
    document.getElementById('categoryFieldFormTitle').textContent = 'Nuevo Campo';
    document.getElementById('categoryFieldId').value = '';
    document.getElementById('categoryFieldId').disabled = false;
    document.getElementById('categoryFieldLabelEs').value = '';
    document.getElementById('categoryFieldLabelPt').value = '';
    document.getElementById('categoryFieldType').value = 'text';
    document.getElementById('categoryFieldPlaceholderEs').value = '';
    document.getElementById('categoryFieldPlaceholderPt').value = '';
    document.getElementById('categoryFieldRequired').checked = false;
    document.getElementById('categoryFieldShowInFilters').checked = true; // Por defecto true
    document.getElementById('categoryFieldOrden').value = categoryFieldsList.length;
    document.getElementById('fieldOptionsContainer').innerHTML = '';
    toggleFieldOptions();
    document.getElementById('categoryFieldFormSection').style.display = 'block';
    document.getElementById('categoryFieldsList').style.display = 'none';
}

function cancelCategoryFieldEdit() {
    editingCategoryFieldId = null;
    document.getElementById('categoryFieldFormSection').style.display = 'none';
    document.getElementById('categoryFieldsList').style.display = 'block';
}

async function editCategoryField(fieldId) {
    const field = categoryFieldsList.find(f => f.id === fieldId);
    if (!field) return;
    
    editingCategoryFieldId = fieldId;
    document.getElementById('categoryFieldFormTitle').textContent = `Editar: ${field.label_es}`;
    document.getElementById('categoryFieldId').value = field.field_id;
    document.getElementById('categoryFieldId').disabled = true; // No permitir cambiar el ID
    document.getElementById('categoryFieldLabelEs').value = field.label_es || '';
    document.getElementById('categoryFieldLabelPt').value = field.label_pt || '';
    document.getElementById('categoryFieldType').value = field.field_type || 'text';
    document.getElementById('categoryFieldPlaceholderEs').value = field.placeholder_es || '';
    document.getElementById('categoryFieldPlaceholderPt').value = field.placeholder_pt || '';
    document.getElementById('categoryFieldRequired').checked = field.is_required || false;
    document.getElementById('categoryFieldShowInFilters').checked = field.show_in_filters !== undefined ? field.show_in_filters : true; // Por defecto true si no existe
    document.getElementById('categoryFieldOrden').value = field.orden || 0;
    
    // Cargar opciones si es tipo select
    if (field.field_type === 'select' && field.options && Array.isArray(field.options)) {
        const container = document.getElementById('fieldOptionsContainer');
        container.innerHTML = '';
        field.options.forEach(option => {
            addFieldOption(option.value || '', option.label_es || '', option.label_pt || '');
        });
    } else {
        document.getElementById('fieldOptionsContainer').innerHTML = '';
    }
    
    toggleFieldOptions();
    document.getElementById('categoryFieldFormSection').style.display = 'block';
    document.getElementById('categoryFieldsList').style.display = 'none';
}

async function saveCategoryField() {
    if (!supabaseClient || !currentCategoryForFields) return;
    
    const fieldId = document.getElementById('categoryFieldId').value.trim().toLowerCase().replace(/\s+/g, '_');
    const labelEs = document.getElementById('categoryFieldLabelEs').value.trim();
    const labelPt = document.getElementById('categoryFieldLabelPt').value.trim();
    const fieldType = document.getElementById('categoryFieldType').value;
    const placeholderEs = document.getElementById('categoryFieldPlaceholderEs').value.trim();
    const placeholderPt = document.getElementById('categoryFieldPlaceholderPt').value.trim();
    const isRequired = document.getElementById('categoryFieldRequired').checked;
    const showInFilters = document.getElementById('categoryFieldShowInFilters').checked;
    const orden = parseInt(document.getElementById('categoryFieldOrden').value) || 0;
    
    if (!fieldId || !labelEs || !labelPt || !fieldType) {
        alert('Debes completar el ID del campo, las etiquetas y el tipo de campo');
        return;
    }
    
    // Validar formato del ID
    if (!/^[a-z0-9_]+$/.test(fieldId)) {
        alert('El ID del campo solo puede contener letras minúsculas, números y guiones bajos');
        return;
    }
    
    // Obtener opciones si es tipo select
    let options = [];
    if (fieldType === 'select') {
        const optionRows = document.querySelectorAll('.field-option-row');
        options = Array.from(optionRows).map(row => {
            const value = row.querySelector('.option-value').value.trim();
            const labelEs = row.querySelector('.option-label-es').value.trim();
            const labelPt = row.querySelector('.option-label-pt').value.trim();
            if (value && labelEs && labelPt) {
                return { value, label_es: labelEs, label_pt: labelPt };
            }
            return null;
        }).filter(opt => opt !== null);
        
        if (options.length === 0) {
            alert('Debes agregar al menos una opción para campos tipo Select');
            return;
        }
    }
    
    try {
        const fieldData = {
            categoria_id: currentCategoryForFields,
            field_id: fieldId,
            label_es: labelEs,
            label_pt: labelPt,
            field_type: fieldType,
            placeholder_es: placeholderEs || null,
            placeholder_pt: placeholderPt || null,
            options: options.length > 0 ? options : null,
            is_required: isRequired,
            show_in_filters: showInFilters,
            orden: orden
        };
        
        if (editingCategoryFieldId) {
            // Actualizar campo existente
            const { error } = await supabaseClient
                .from('category_fields')
                .update(fieldData)
                .eq('id', editingCategoryFieldId);
            
            if (error) throw error;
            alert('Campo actualizado correctamente');
        } else {
            // Crear nuevo campo
            const { error } = await supabaseClient
                .from('category_fields')
                .insert(fieldData);
            
            if (error) throw error;
            alert('Campo creado correctamente');
        }
        
        cancelCategoryFieldEdit();
        await loadCategoryFieldsList();
    } catch (error) {
        console.error('Error guardando campo:', error);
        alert('Error al guardar campo: ' + error.message);
    }
}

async function deleteCategoryField(fieldId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este campo?')) return;
    
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient
            .from('category_fields')
            .delete()
            .eq('id', fieldId);
        
        if (error) throw error;
        
        alert('Campo eliminado correctamente');
        await loadCategoryFieldsList();
    } catch (error) {
        console.error('Error eliminando campo:', error);
        alert('Error al eliminar campo: ' + error.message);
    }
}

function toggleFieldOptions() {
    const fieldType = document.getElementById('categoryFieldType').value;
    const optionsGroup = document.getElementById('fieldOptionsGroup');
    const placeholderEsGroup = document.getElementById('fieldPlaceholderEsGroup');
    const placeholderPtGroup = document.getElementById('fieldPlaceholderPtGroup');
    
    if (fieldType === 'select') {
        optionsGroup.style.display = 'block';
        placeholderEsGroup.style.display = 'none';
        placeholderPtGroup.style.display = 'none';
        
        // Si no hay opciones, agregar una por defecto
        if (document.getElementById('fieldOptionsContainer').children.length === 0) {
            addFieldOption();
        }
    } else {
        optionsGroup.style.display = 'none';
        placeholderEsGroup.style.display = 'block';
        placeholderPtGroup.style.display = 'block';
    }
}

function addFieldOption(value = '', labelEs = '', labelPt = '') {
    const container = document.getElementById('fieldOptionsContainer');
    const row = document.createElement('div');
    row.className = 'field-option-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: end;';
    
    row.innerHTML = `
        <input type="text" class="option-value" placeholder="Valor (ej: si, no)" value="${value}" style="flex: 1;">
        <input type="text" class="option-label-es" placeholder="Etiqueta ES" value="${labelEs}" style="flex: 1;">
        <input type="text" class="option-label-pt" placeholder="Etiqueta PT" value="${labelPt}" style="flex: 1;">
        <button type="button" class="btn btn-danger" onclick="removeFieldOption(this)" style="padding: 8px 12px;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(row);
}

function removeFieldOption(button) {
    button.closest('.field-option-row').remove();
}

// ============================================
// GESTIÓN DE CAMPOS EN EL FORMULARIO DE CATEGORÍAS
// ============================================

function addCategoryFieldToForm() {
    categoryFieldsInForm.push({
        field_id: '',
        label_es: '',
        label_pt: '',
        field_type: 'text',
        placeholder_es: '',
        placeholder_pt: '',
        options: [],
        is_required: false,
        orden: categoryFieldsInForm.length
    });
    renderCategoryFieldsInForm();
}

/**
 * Eliminar un campo del formulario (y de Supabase si ya está guardado)
 */
async function removeCategoryFieldFromForm(index) {
    const field = categoryFieldsInForm[index];
    if (!field) return;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar el campo "${field.label_es}"?`)) {
        return;
    }
    
    // Si el campo ya está guardado en Supabase, eliminarlo también
    if (field.id && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('category_fields')
                .delete()
                .eq('id', field.id);
            
            if (error) {
                console.error('Error eliminando campo de Supabase:', error);
                alert(`Error al eliminar el campo de la base de datos: ${error.message}`);
                return;
            }
        } catch (error) {
            console.error('Error inesperado:', error);
            alert(`Error inesperado: ${error.message}`);
            return;
        }
    }
    
    // Eliminar del array local
    categoryFieldsInForm.splice(index, 1);
    renderCategoryFieldsInForm();
}

window.addNewFieldOption = function() {
    const container = document.getElementById('newFieldOptionsList');
    if (!container) return;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'field-option-row';
    optionDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 15px; align-items: center; margin-bottom: 15px; padding: 15px; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;';
    
    optionDiv.innerHTML = `
        <input type="text" class="new-option-value" placeholder="Valor (ej: si, no)" 
               style="padding: 10px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
               onfocus="this.style.borderColor='#1d3557';" 
               onblur="this.style.borderColor='#d1d5db';">
        <input type="text" class="new-option-label-es" placeholder="Etiqueta ES" 
               style="padding: 10px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
               onfocus="this.style.borderColor='#1d3557';" 
               onblur="this.style.borderColor='#d1d5db';">
        <input type="text" class="new-option-label-pt" placeholder="Etiqueta PT" 
               style="padding: 10px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s;"
               onfocus="this.style.borderColor='#1d3557';" 
               onblur="this.style.borderColor='#d1d5db';">
        <button type="button" class="btn btn-danger" onclick="removeNewFieldOption(this)" 
                style="padding: 10px 15px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#dc2626';" 
                onmouseout="this.style.background='#ef4444';">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(optionDiv);
}

window.removeNewFieldOption = function(button) {
    button.closest('.field-option-row').remove();
}

// ============================================
// NUEVA IMPLEMENTACIÓN LIMPIA: GESTIÓN DE FILTROS DE CATEGORÍAS
// ============================================

/**
 * Agregar un nuevo filtro/campo a la categoría y guardarlo inmediatamente en Supabase
 */
window.addFieldToCategoryForm = async function() {
    console.log('🚀 ============================================');
    console.log('🚀 addFieldToCategoryForm() EJECUTADO');
    console.log('🚀 ============================================');
    
    try {
        // 1. VALIDAR QUE HAY UNA CATEGORÍA GUARDADA
        console.log('🔍 Paso 1: Verificando editingHomeCategoryId...');
        console.log('📊 editingHomeCategoryId:', editingHomeCategoryId);
        
        if (!editingHomeCategoryId) {
            console.warn('⚠️ No hay editingHomeCategoryId');
            alert('⚠️ Primero debes guardar la categoría antes de agregar filtros.\n\nGuarda la categoría y luego agrega los filtros.');
            return;
        }
        
        console.log('✅ editingHomeCategoryId encontrado:', editingHomeCategoryId);
    
        // 2. VALIDAR SUPABASE CLIENT
        if (!supabaseClient) {
            alert('❌ Error: No se pudo conectar con la base de datos. Recarga la página.');
            return;
        }
        
        // 3. OBTENER Y VALIDAR DATOS DEL FORMULARIO
    const fieldId = document.getElementById('newFieldId').value.trim().toLowerCase().replace(/\s+/g, '_');
    const labelEs = document.getElementById('newFieldLabelEs').value.trim();
    const labelPt = document.getElementById('newFieldLabelPt').value.trim();
    const fieldType = document.getElementById('newFieldType').value;
    const placeholderEs = document.getElementById('newFieldPlaceholderEs').value.trim();
    const placeholderPt = document.getElementById('newFieldPlaceholderPt').value.trim();
    const isRequired = document.getElementById('newFieldRequired').checked;
    const showInFilters = document.getElementById('newFieldShowInFilters')?.checked ?? true;
    const orden = parseInt(document.getElementById('newFieldOrden').value) || categoryFieldsInForm.length;
    
    // Validaciones básicas
    if (!fieldId || !labelEs || !labelPt) {
        alert('❌ Debes completar el ID del campo y las etiquetas en ambos idiomas');
        return;
    }
    
    if (!/^[a-z0-9_]+$/.test(fieldId)) {
        alert('❌ El ID del campo solo puede contener letras minúsculas, números y guiones bajos');
        return;
    }
    
    // Verificar duplicados en el array local
    if (categoryFieldsInForm.some(f => f.field_id === fieldId)) {
        alert('❌ Ya existe un campo con ese ID en esta categoría. Usa otro ID.');
        return;
    }
    
    // 4. OBTENER OPCIONES SI ES TIPO SELECT
    let options = null;
    if (fieldType === 'select') {
        const optionRows = document.querySelectorAll('#newFieldOptionsList .field-option-row');
        const parsedOptions = Array.from(optionRows)
            .map(row => {
                const value = row.querySelector('.new-option-value')?.value.trim();
                const labelEs = row.querySelector('.new-option-label-es')?.value.trim();
                const labelPt = row.querySelector('.new-option-label-pt')?.value.trim();
                if (value && labelEs && labelPt) {
                    return { value, label_es: labelEs, label_pt: labelPt };
                }
                return null;
            })
            .filter(opt => opt !== null);
        
        if (parsedOptions.length === 0) {
            alert('❌ Para campos tipo Select, debes agregar al menos una opción');
            return;
        }
        options = parsedOptions;
    }
    
    // 5. VERIFICAR QUE LA CATEGORÍA EXISTE EN categorias_geral
    const { data: categoriaCheck, error: categoriaError } = await supabaseClient
        .from('categorias_geral')
        .select('id')
        .eq('id', editingHomeCategoryId)
        .single();
    
    if (categoriaError || !categoriaCheck) {
        alert(`❌ Error: La categoría no existe en la base de datos.\n\nID: ${editingHomeCategoryId}\n\nGuarda la categoría primero.`);
        console.error('Error verificando categoría:', categoriaError);
        return;
    }
    
    // 6. PREPARAR DATOS PARA INSERTAR
    const fieldData = {
        categoria_id: editingHomeCategoryId,
        field_id: fieldId,
        label_es: labelEs,
        label_pt: labelPt,
        field_type: fieldType,
        placeholder_es: placeholderEs || null,
        placeholder_pt: placeholderPt || null,
        options: options,
        is_required: isRequired,
        show_in_filters: showInFilters,
        orden: orden
    };
    
        // 7. INSERTAR EN SUPABASE
        console.log('🔍 Paso 7: Insertando en Supabase...');
        console.log('📋 fieldData:', fieldData);
        
        const { data, error } = await supabaseClient
            .from('category_fields')
            .insert([fieldData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error de Supabase:', error);
            
            if (error.code === '23505') {
                alert(`❌ Ya existe un campo con el ID "${fieldId}" para esta categoría.`);
            } else if (error.code === '23503') {
                alert(`❌ Error de Foreign Key: La categoría no existe.\n\nEjecuta el script: supabase-fix-category-fields-foreign-key-complete.sql`);
            } else if (error.message?.includes('RLS') || error.message?.includes('policy')) {
                alert(`❌ Error de permisos (RLS): ${error.message}\n\nConfigura las políticas RLS en Supabase.`);
            } else {
                alert(`❌ Error al guardar: ${error.message}\n\nCódigo: ${error.code || 'N/A'}`);
            }
            return;
        }
        
        // 8. VERIFICAR QUE REALMENTE SE GUARDÓ
        if (!data || !data.id) {
            alert('❌ Error: No se recibieron datos del servidor. El campo NO se guardó.');
            return;
        }
        
        // 9. VERIFICAR QUE EL REGISTRO EXISTE EN LA BASE DE DATOS
        const { data: verifyData, error: verifyError } = await supabaseClient
            .from('category_fields')
            .select('id, field_id, label_es')
            .eq('id', data.id)
            .single();
        
        if (verifyError || !verifyData) {
            alert('⚠️ El campo se insertó pero no se pudo verificar. Revisa la base de datos manualmente.');
            return;
        }
        
        // 10. AGREGAR AL ARRAY LOCAL Y ACTUALIZAR UI
        const newField = {
            id: data.id,
            ...fieldData
        };
        categoryFieldsInForm.push(newField);
        
        // 11. LIMPIAR FORMULARIO
        document.getElementById('newFieldId').value = '';
        document.getElementById('newFieldId').disabled = false;
        document.getElementById('newFieldLabelEs').value = '';
        document.getElementById('newFieldLabelPt').value = '';
        document.getElementById('newFieldPlaceholderEs').value = '';
        document.getElementById('newFieldPlaceholderPt').value = '';
        document.getElementById('newFieldType').value = 'text';
        document.getElementById('newFieldRequired').checked = false;
        if (document.getElementById('newFieldShowInFilters')) {
            document.getElementById('newFieldShowInFilters').checked = true;
        }
        document.getElementById('newFieldOrden').value = categoryFieldsInForm.length;
        
        const optionsList = document.getElementById('newFieldOptionsList');
        if (optionsList) optionsList.innerHTML = '';
        const optionsContainer = document.getElementById('newFieldOptionsContainer');
        if (optionsContainer) optionsContainer.style.display = 'none';
        
        // 12. ACTUALIZAR VISUALIZACIÓN
        renderCategoryFieldsInForm();
        
        // 13. MOSTRAR MENSAJE DE ÉXITO SOLO DESPUÉS DE VERIFICAR
        alert(`✅ Campo "${labelEs}" guardado y verificado correctamente en Supabase.\n\nID: ${data.id}`);
        
    } catch (error) {
        console.error('❌ ============================================');
        console.error('❌ ERROR INESPERADO EN addFieldToCategoryForm');
        console.error('❌ ============================================');
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Stack:', error.stack);
        alert(`❌ Error inesperado: ${error.message}\n\nEl campo NO se guardó.\n\nRevisa la consola (F12) para más detalles.`);
    }
    
    console.log('🏁 ============================================');
    console.log('🏁 addFieldToCategoryForm() FINALIZADO');
    console.log('🏁 ============================================');
}

window.editCategoryFieldInFormSimple = function(index) {
    const field = categoryFieldsInForm[index];
    if (!field) return;
    
    // Llenar el formulario con los datos del campo
    document.getElementById('newFieldId').value = field.field_id;
    document.getElementById('newFieldId').disabled = true; // No permitir cambiar el ID
    document.getElementById('newFieldLabelEs').value = field.label_es;
    document.getElementById('newFieldLabelPt').value = field.label_pt;
    document.getElementById('newFieldType').value = field.field_type;
    document.getElementById('newFieldPlaceholderEs').value = field.placeholder_es || '';
    document.getElementById('newFieldPlaceholderPt').value = field.placeholder_pt || '';
    document.getElementById('newFieldRequired').checked = field.is_required || false;
    document.getElementById('newFieldOrden').value = field.orden || index;
    
    // Cargar opciones si es tipo select
    if (field.field_type === 'select' && field.options && field.options.length > 0) {
        const container = document.getElementById('newFieldOptionsList');
        container.innerHTML = '';
        field.options.forEach(opt => {
            addNewFieldOption();
            const rows = container.querySelectorAll('.field-option-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.new-option-value').value = opt.value || '';
            lastRow.querySelector('.new-option-label-es').value = opt.label_es || '';
            lastRow.querySelector('.new-option-label-pt').value = opt.label_pt || '';
        });
        document.getElementById('newFieldOptionsContainer').style.display = 'block';
    } else {
        document.getElementById('newFieldOptionsContainer').style.display = 'none';
        document.getElementById('newFieldOptionsList').innerHTML = '';
    }
    
    // Eliminar el campo de la lista (se volverá a agregar al guardar)
    categoryFieldsInForm.splice(index, 1);
    renderCategoryFieldsInForm();
    
    // Scroll al formulario
    document.getElementById('newFieldId').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Renderizar la lista de campos/filtros agregados a la categoría
 */
function renderCategoryFieldsInForm() {
    const container = document.getElementById('categoryFieldsFormContainer');
    if (!container) {
        console.warn('Contenedor categoryFieldsFormContainer no encontrado');
        return;
    }
    
    if (!categoryFieldsInForm || categoryFieldsInForm.length === 0) {
        container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 30px; margin: 0; font-size: 0.95rem;"><i class="fas fa-info-circle" style="margin-right: 8px; color: #94a3b8;"></i>No hay campos agregados. Completa el formulario arriba y haz clic en "Agregar Filtro a la Categoría".</p>';
        return;
    }
    
    const typeLabels = {
        'text': 'Texto',
        'number': 'Número',
        'select': 'Select',
        'textarea': 'Área de texto'
    };
    
    let html = '<div style="display: grid; gap: 15px;">';
    categoryFieldsInForm.forEach((field, index) => {
        const showInFiltersBadge = field.show_in_filters !== false 
            ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">En filtros</span>'
            : '<span style="background: #6b7280; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">Solo atributo</span>';
        
        html += `
            <div style="padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1d3557; margin-bottom: 8px;">
                            ${field.label_es || '(Sin nombre)'} / ${field.label_pt || '(Sin nome)'}
                            ${showInFiltersBadge}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            ID: <code>${field.field_id || '(sin ID)'}</code> | Tipo: ${typeLabels[field.field_type] || field.field_type} | Orden: ${field.orden || 0}
                            ${field.is_required ? ' | <span style="color: #ef4444;">Obligatorio</span>' : ''}
                            ${field.id ? ' | <span style="color: #10b981;">✓ Guardado</span>' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button type="button" class="btn btn-secondary" onclick="editCategoryFieldInForm(${index})" style="padding: 6px 12px; font-size: 0.875rem;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger" onclick="removeCategoryFieldFromForm(${index})" style="padding: 6px 12px; font-size: 0.875rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function editCategoryFieldInForm(index) {
    const field = categoryFieldsInForm[index];
    if (!field) {
        console.error('❌ Campo no encontrado en índice:', index);
        return;
    }
    
    console.log('✏️ Editando campo en índice:', index, field);
    
    // Abrir modal de edición de campo con los datos prellenados
    editingCategoryFieldId = field.id || null;
    currentCategoryForFields = editingHomeCategoryId; // Usar el ID de la categoría si existe
    
    // Llenar el formulario del modal
    document.getElementById('categoryFieldFormTitle').textContent = field.id ? `Editar Campo: ${field.label_es}` : `Editar Campo ${index + 1}`;
    document.getElementById('categoryFieldId').value = field.field_id || '';
    document.getElementById('categoryFieldId').disabled = !!field.id; // No permitir cambiar ID si ya existe
    document.getElementById('categoryFieldLabelEs').value = field.label_es || '';
    document.getElementById('categoryFieldLabelPt').value = field.label_pt || '';
    document.getElementById('categoryFieldType').value = field.field_type || 'text';
    document.getElementById('categoryFieldPlaceholderEs').value = field.placeholder_es || '';
    document.getElementById('categoryFieldPlaceholderPt').value = field.placeholder_pt || '';
    document.getElementById('categoryFieldRequired').checked = field.is_required || false;
    document.getElementById('categoryFieldShowInFilters').checked = field.show_in_filters !== undefined ? field.show_in_filters : true;
    document.getElementById('categoryFieldOrden').value = field.orden || index;
    
    // Cargar opciones si es tipo select
    if (field.field_type === 'select' && field.options && Array.isArray(field.options)) {
        const container = document.getElementById('fieldOptionsContainer');
        container.innerHTML = '';
        field.options.forEach(opt => {
            addFieldOption(opt.value || '', opt.label_es || '', opt.label_pt || '');
        });
    } else {
        document.getElementById('fieldOptionsContainer').innerHTML = '';
    }
    
    toggleFieldOptions();
    
    // Abrir modal de campos
    document.getElementById('categoryFieldsModal').classList.add('active');
    document.getElementById('categoryFieldFormSection').style.display = 'block';
    document.getElementById('categoryFieldsList').style.display = 'none';
    
    // Guardar el índice para actualizar el campo correcto
    window.editingFieldIndex = index;
}

// Modificar saveCategoryField para que también actualice categoryFieldsInForm
const originalSaveCategoryField = window.saveCategoryField;
window.saveCategoryField = async function() {
    // Si estamos editando desde el formulario de categoría (no desde el modal de gestión)
    if (window.editingFieldIndex !== undefined) {
        const fieldId = document.getElementById('categoryFieldId').value.trim().toLowerCase().replace(/\s+/g, '_');
        const labelEs = document.getElementById('categoryFieldLabelEs').value.trim();
        const labelPt = document.getElementById('categoryFieldLabelPt').value.trim();
        const fieldType = document.getElementById('categoryFieldType').value;
        const placeholderEs = document.getElementById('categoryFieldPlaceholderEs').value.trim();
        const placeholderPt = document.getElementById('categoryFieldPlaceholderPt').value.trim();
        const isRequired = document.getElementById('categoryFieldRequired').checked;
        const showInFilters = document.getElementById('categoryFieldShowInFilters') ? document.getElementById('categoryFieldShowInFilters').checked : true;
        const orden = parseInt(document.getElementById('categoryFieldOrden').value) || 0;
        
        if (!fieldId || !labelEs || !labelPt || !fieldType) {
            alert('Debes completar el ID del campo, las etiquetas y el tipo de campo');
            return;
        }
        
        // Validar formato del ID
        if (!/^[a-z0-9_]+$/.test(fieldId)) {
            alert('El ID del campo solo puede contener letras minúsculas, números y guiones bajos');
            return;
        }
        
        // Obtener opciones si es tipo select
        let options = [];
        if (fieldType === 'select') {
            const optionRows = document.querySelectorAll('.field-option-row');
            options = Array.from(optionRows).map(row => {
                const value = row.querySelector('.option-value').value.trim();
                const labelEs = row.querySelector('.option-label-es').value.trim();
                const labelPt = row.querySelector('.option-label-pt').value.trim();
                if (value && labelEs && labelPt) {
                    return { value, label_es: labelEs, label_pt: labelPt };
                }
                return null;
            }).filter(opt => opt !== null);
            
            if (options.length === 0) {
                alert('Debes agregar al menos una opción para campos tipo Select');
                return;
            }
        }
        
        // Actualizar el campo en categoryFieldsInForm
        const fieldData = {
            field_id: fieldId,
            label_es: labelEs,
            label_pt: labelPt,
            field_type: fieldType,
            placeholder_es: placeholderEs || null,
            placeholder_pt: placeholderPt || null,
            options: options.length > 0 ? options : [],
            is_required: isRequired,
            show_in_filters: showInFilters,
            orden: orden
        };
        
        // Si el campo ya tiene ID, mantenerlo (importante para actualizar en lugar de crear)
        if (categoryFieldsInForm[window.editingFieldIndex] && categoryFieldsInForm[window.editingFieldIndex].id) {
            fieldData.id = categoryFieldsInForm[window.editingFieldIndex].id;
        }
        
        categoryFieldsInForm[window.editingFieldIndex] = fieldData;
        renderCategoryFieldsInForm();
        
        // Cerrar modal
        document.getElementById('categoryFieldsModal').classList.remove('active');
        document.getElementById('categoryFieldFormSection').style.display = 'none';
        delete window.editingFieldIndex;
        
        alert('Campo actualizado en el formulario');
        return;
    }
    
    // Si no, usar la función original
    if (originalSaveCategoryField) {
        return originalSaveCategoryField();
    }
};

// ============================================
// GESTIÓN DE CAMPOS EN EL FORMULARIO DE CATEGORÍAS
// ============================================

function addCategoryFieldToForm() {
    categoryFieldsInForm.push({
        field_id: '',
        label_es: '',
        label_pt: '',
        field_type: 'text',
        placeholder_es: '',
        placeholder_pt: '',
        options: [],
        is_required: false,
        orden: categoryFieldsInForm.length
    });
    renderCategoryFieldsInForm();
}

/**
 * Eliminar un campo del formulario (y de Supabase si ya está guardado)
 */
async function removeCategoryFieldFromForm(index) {
    const field = categoryFieldsInForm[index];
    if (!field) return;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar el campo "${field.label_es}"?`)) {
        return;
    }
    
    // Si el campo ya está guardado en Supabase, eliminarlo también
    if (field.id && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('category_fields')
                .delete()
                .eq('id', field.id);
            
            if (error) {
                console.error('Error eliminando campo de Supabase:', error);
                alert(`Error al eliminar el campo de la base de datos: ${error.message}`);
                return;
            }
        } catch (error) {
            console.error('Error inesperado:', error);
            alert(`Error inesperado: ${error.message}`);
            return;
        }
    }
    
    // Eliminar del array local
    categoryFieldsInForm.splice(index, 1);
    renderCategoryFieldsInForm();
}

// Esta función está duplicada - eliminada, se usa la versión mejorada de arriba

function editCategoryFieldInForm(index) {
    const field = categoryFieldsInForm[index];
    if (!field) return;
    
    // Abrir modal de edición de campo con los datos prellenados
    editingCategoryFieldId = field.id || null;
    currentCategoryForFields = editingHomeCategoryId; // Usar el ID de la categoría si existe
    
    // Llenar el formulario del modal
    document.getElementById('categoryFieldFormTitle').textContent = field.id ? `Editar Campo: ${field.label_es}` : `Editar Campo ${index + 1}`;
    document.getElementById('categoryFieldId').value = field.field_id || '';
    document.getElementById('categoryFieldId').disabled = !!field.id; // No permitir cambiar ID si ya existe
    document.getElementById('categoryFieldLabelEs').value = field.label_es || '';
    document.getElementById('categoryFieldLabelPt').value = field.label_pt || '';
    document.getElementById('categoryFieldType').value = field.field_type || 'text';
    document.getElementById('categoryFieldPlaceholderEs').value = field.placeholder_es || '';
    document.getElementById('categoryFieldPlaceholderPt').value = field.placeholder_pt || '';
    document.getElementById('categoryFieldRequired').checked = field.is_required || false;
    document.getElementById('categoryFieldOrden').value = field.orden || index;
    
    // Cargar opciones si es tipo select
    if (field.field_type === 'select' && field.options && Array.isArray(field.options)) {
        const container = document.getElementById('fieldOptionsContainer');
        container.innerHTML = '';
        field.options.forEach(opt => {
            addFieldOption(opt.value || '', opt.label_es || '', opt.label_pt || '');
        });
    } else {
        document.getElementById('fieldOptionsContainer').innerHTML = '';
    }
    
    toggleFieldOptions();
    
    // Abrir modal de campos
    document.getElementById('categoryFieldsModal').classList.add('active');
    document.getElementById('categoryFieldFormSection').style.display = 'block';
    document.getElementById('categoryFieldsList').style.display = 'none';
    
    // Guardar el índice para actualizar el campo correcto
    window.editingFieldIndex = index;
}

// Esta función ya está definida arriba (línea 3303), no duplicar

/**
 * ==================== FUNCIONES PARA SUBIR IMÁGENES A SUPABASE STORAGE ====================
 */

/**
 * Subir imagen a Supabase Storage
 * @param {File} file - Archivo de imagen a subir
 * @param {string} fieldName - Nombre del campo (foto, foto2)
 * @returns {Promise<string>} URL pública de la imagen subida
 */
async function uploadImageToSupabase(file, fieldName = 'foto') {
    // Asegurarse de que el cliente está inicializado
    if (!supabaseClient) {
        if (window.universalSupabase) {
            supabaseClient = await window.universalSupabase.getClient();
        } else {
            throw new Error('Cliente de Supabase no inicializado. Por favor, recarga la página.');
        }
    }
    
    // Crear un cliente específico para Storage sin headers globales que interfieran
    // Esto evita que el header 'Content-Type': 'application/json' afecte las subidas de archivos
    let storageClient;
    try {
        if (typeof supabase !== 'undefined' && window.SUPABASE_CONFIG) {
            // Crear un cliente nuevo sin headers globales para Storage
            storageClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                },
                // NO incluir 'global.headers' para que Supabase maneje automáticamente el Content-Type según el archivo
            });
            // Copiar la sesión del cliente principal si existe
            if (supabaseClient && supabaseClient.auth) {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    await storageClient.auth.setSession(session);
                }
            }
        } else {
            // Fallback al cliente compartido si no podemos crear uno nuevo
            storageClient = supabaseClient;
        }
    } catch (error) {
        console.warn('⚠️ No se pudo crear cliente específico para Storage, usando cliente compartido:', error);
        storageClient = supabaseClient;
    }
    
    if (!file) {
        throw new Error('No se proporcionó ningún archivo');
    }
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
    }
    
    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB');
    }
    
    try {
        // Verificar que el archivo es válido
        console.log('📋 Información del archivo:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        });
        
        // Validar que el tipo MIME sea una imagen
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        if (!validImageTypes.includes(file.type)) {
            // Intentar determinar el tipo por extensión si el MIME type no es válido
            const fileExt = file.name.split('.').pop().toLowerCase();
            const extensionMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'avif': 'image/avif'
            };
            
            if (extensionMap[fileExt]) {
                console.warn(`⚠️ Tipo MIME no válido (${file.type}), usando tipo por extensión: ${extensionMap[fileExt]}`);
            } else {
                throw new Error(`Tipo de archivo no soportado: ${file.type}. Solo se permiten imágenes (JPG, PNG, GIF, WEBP, AVIF)`);
            }
        }
        
        // Generar nombre único para el archivo
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `${fieldName}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `productos/${fileName}`;
        
        console.log(`📤 Subiendo imagen: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)}KB) -> ${filePath}`);
        
        // Crear un nuevo File con el tipo MIME correcto si es necesario
        let fileToUpload = file;
        if (!validImageTypes.includes(file.type)) {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const extensionMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'avif': 'image/avif'
            };
            if (extensionMap[fileExt]) {
                fileToUpload = new File([file], file.name, { type: extensionMap[fileExt] });
                console.log(`🔧 Archivo convertido a tipo MIME: ${fileToUpload.type}`);
            }
        }
        
        // Verificar que el archivo es realmente un File object
        if (!(fileToUpload instanceof File) && !(fileToUpload instanceof Blob)) {
            console.error('❌ El objeto no es un File o Blob:', typeof fileToUpload, fileToUpload);
            throw new Error('El archivo no es válido. Debe ser un objeto File.');
        }
        
        console.log('📦 Archivo a subir:', {
            name: fileToUpload.name,
            type: fileToUpload.type,
            size: fileToUpload.size,
            isFile: fileToUpload instanceof File,
            isBlob: fileToUpload instanceof Blob
        });
        
        // Verificar que storageClient.storage existe
        if (!storageClient || !storageClient.storage) {
            console.error('❌ storageClient.storage no está disponible');
            throw new Error('El cliente de Supabase no tiene acceso a Storage. Verifica la configuración.');
        }
        
        // Subir archivo a Supabase Storage usando el cliente específico para Storage
        // IMPORTANTE: Usar storageClient, no supabaseClient, para evitar headers globales
        console.log('🚀 Iniciando subida a Supabase Storage con storageClient...');
        console.log('📋 Tipo MIME del archivo:', fileToUpload.type);
        console.log('📋 Nombre del archivo:', fileToUpload.name);
        console.log('📋 Tamaño del archivo:', fileToUpload.size);
        
        // Asegurarse de que el tipo MIME sea correcto
        let finalFile = fileToUpload;
        if (!fileToUpload.type || fileToUpload.type === 'application/json' || !fileToUpload.type.startsWith('image/')) {
            const fileExt = fileToUpload.name.split('.').pop().toLowerCase();
            const mimeTypeMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'avif': 'image/avif'
            };
            const correctMimeType = mimeTypeMap[fileExt] || 'image/jpeg';
            console.log(`🔧 Corrigiendo tipo MIME de "${fileToUpload.type}" a "${correctMimeType}"`);
            finalFile = new File([fileToUpload], fileToUpload.name, { type: correctMimeType });
        }
        
        const { data, error } = await storageClient.storage
            .from('product-images')
            .upload(filePath, finalFile, {
                cacheControl: '3600',
                upsert: false,
                contentType: finalFile.type
            });
        
        if (error) {
            // Proporcionar mensajes de error más descriptivos
            if (error.message && (error.message.includes('Bucket not found') || error.message.includes('not found'))) {
                throw new Error('El bucket "product-images" no existe. Por favor, créalo en Supabase Dashboard > Storage. Consulta INSTRUCCIONES-BUCKET-PRODUCT-IMAGES.md para más detalles.');
            } else if (error.message && error.message.includes('new row violates row-level security policy')) {
                throw new Error('Error de permisos: No tienes permiso para subir imágenes. Verifica las políticas RLS del bucket "product-images".');
            } else {
                // Mostrar el error original de Supabase para debugging
                throw new Error(`Error al subir la imagen: ${error.message || JSON.stringify(error)}`);
            }
        }
        
        // Obtener URL pública
        const { data: urlData } = storageClient.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
            throw new Error('No se pudo obtener la URL pública de la imagen');
        }
        
        // Validar que la URL sea un string válido
        const publicUrl = urlData.publicUrl;
        if (typeof publicUrl !== 'string' || publicUrl.trim() === '' || publicUrl === '{}') {
            throw new Error('La URL pública obtenida no es válida');
        }
        
        return publicUrl.trim(); // Devolver siempre un string limpio
        
    } catch (error) {
        // Proporcionar un mensaje de error más descriptivo
        if (error.message) {
            throw new Error(error.message);
        } else if (error.error) {
            throw new Error(error.error);
        } else {
            throw new Error('Error desconocido al subir la imagen: ' + JSON.stringify(error));
        }
    }
}

/**
 * Manejar cambio en input de archivo
 * @param {string} fieldName - Nombre del campo (foto, foto2)
 */
async function handleImageFileChange(fieldName) {
    const fileInput = document.getElementById(fieldName);
    const previewDiv = document.getElementById(fieldName + 'Preview');
    const previewImg = document.getElementById(fieldName + 'PreviewImg');
    const urlField = document.getElementById(fieldName + 'Url');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        console.warn('⚠️ No se seleccionó ningún archivo');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Verificar que el archivo es válido
    if (!file) {
        console.error('❌ El archivo es null o undefined');
        showAlert('Error: No se pudo leer el archivo seleccionado', 'error');
        return;
    }
    
    console.log('📁 Archivo seleccionado:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString(),
        isFile: file instanceof File
    });
    
    // Mostrar preview local mientras se sube
    const reader = new FileReader();
    reader.onload = (e) => {
        if (previewImg) {
            previewImg.src = e.target.result;
        }
        if (previewDiv) {
            previewDiv.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
    
    // Mostrar indicador de carga
    if (previewDiv) {
        previewDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #1d3557;"></i>
                <p style="margin-top: 10px; color: #6b7280;">Subiendo imagen...</p>
            </div>
        `;
    }
    
    try {
        console.log(`🔄 Iniciando subida de imagen para campo: ${fieldName}`);
        
        // Subir imagen a Supabase
        const imageUrl = await uploadImageToSupabase(file, fieldName);
        
        console.log(`✅ URL obtenida después de subir: ${imageUrl}`);
        
        // Guardar URL en campo hidden
        if (urlField) {
            urlField.value = imageUrl;
            console.log(`✅ URL guardada en campo hidden ${fieldName}Url: ${imageUrl}`);
        } else {
            console.warn(`⚠️ Campo hidden ${fieldName}Url no encontrado`);
        }
        
        // Guardar URL en variable global
        if (fieldName === 'foto') {
            uploadedFotoUrl = imageUrl;
            console.log(`✅ uploadedFotoUrl actualizado: ${imageUrl}`);
        } else if (fieldName === 'foto2') {
            uploadedFoto2Url = imageUrl;
            console.log(`✅ uploadedFoto2Url actualizado: ${imageUrl}`);
        }
        
        // Mostrar preview con la imagen subida
        if (previewDiv) {
            previewDiv.innerHTML = `
                <img id="${fieldName}PreviewImg" src="${imageUrl}" alt="Vista previa" style="max-width: 300px; max-height: 300px; border-radius: 8px; border: 2px solid #d1d5db;">
                <button type="button" onclick="removeImagePreview('${fieldName}')" style="margin-top: 10px; padding: 5px 15px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-times"></i> Eliminar
                </button>
            `;
        }
        
        console.log(`✅ Imagen ${fieldName} subida y guardada correctamente. URL: ${imageUrl}`);
        showAlert(`✅ Imagen ${fieldName} subida correctamente a Supabase Storage`, 'success');
        
    } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        console.error('📋 Stack trace:', error.stack);
        showAlert(`❌ Error subiendo imagen: ${error.message}`, 'error');
        
        // Limpiar preview en caso de error
        if (previewDiv) {
            previewDiv.style.display = 'none';
        }
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

/**
 * Mostrar preview de imagen desde URL
 * @param {string} fieldName - Nombre del campo (foto, foto2)
 * @param {string} imageUrl - URL de la imagen
 */
function showImagePreview(fieldName, imageUrl) {
    const previewDiv = document.getElementById(fieldName + 'Preview');
    const previewImg = document.getElementById(fieldName + 'PreviewImg');
    
    if (previewDiv && previewImg && imageUrl) {
        previewImg.src = imageUrl;
        previewDiv.style.display = 'block';
        // Asegurar que el botón de eliminar esté presente
        if (!previewDiv.querySelector('button')) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.onclick = () => removeImagePreview(fieldName);
            removeBtn.style.cssText = 'margin-top: 10px; padding: 5px 15px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;';
            removeBtn.innerHTML = '<i class="fas fa-times"></i> Eliminar';
            previewDiv.appendChild(removeBtn);
        }
    }
}

/**
 * Extraer ruta del archivo desde URL de Supabase Storage
 * @param {string} url - URL completa del archivo
 * @returns {string|null} - Ruta del archivo en el bucket o null si no es válida
 */
function extractFilePathFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    // Patrón: https://[project].supabase.co/storage/v1/object/public/product-images/productos/[filename]
    const match = url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    
    // Si la URL ya es una ruta relativa (productos/filename.jpg)
    if (url.startsWith('productos/')) {
        return url;
    }
    
    return null;
}

/**
 * Eliminar archivo del bucket de Supabase Storage
 * @param {string} fileUrl - URL del archivo a eliminar
 * @returns {Promise<boolean>} - true si se eliminó correctamente, false en caso contrario
 */
async function deleteImageFromStorage(fileUrl) {
    if (!fileUrl) return false;
    
    try {
        const filePath = extractFilePathFromUrl(fileUrl);
        if (!filePath) {
            console.warn('⚠️ No se pudo extraer la ruta del archivo desde la URL:', fileUrl);
            return false;
        }
        
        // Crear cliente específico para Storage
        let storageClient;
        if (typeof supabase !== 'undefined' && window.SUPABASE_CONFIG) {
            storageClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            // Copiar sesión si existe
            if (supabaseClient && supabaseClient.auth) {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    await storageClient.auth.setSession(session);
                }
            }
        } else {
            storageClient = supabaseClient;
        }
        
        if (!storageClient || !storageClient.storage) {
            console.warn('⚠️ Cliente de Storage no disponible');
            return false;
        }
        
        console.log('🗑️ Eliminando archivo del bucket:', filePath);
        const { error } = await storageClient.storage
            .from('product-images')
            .remove([filePath]);
        
        if (error) {
            console.error('❌ Error al eliminar archivo del bucket:', error);
            return false;
        }
        
        console.log('✅ Archivo eliminado del bucket correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar archivo del bucket:', error);
        return false;
    }
}

/**
 * Eliminar preview de imagen
 * @param {string} fieldName - Nombre del campo (foto, foto2)
 */
async function removeImagePreview(fieldName) {
    const fileInput = document.getElementById(fieldName);
    const previewDiv = document.getElementById(fieldName + 'Preview');
    const urlField = document.getElementById(fieldName + 'Url');
    
    // Obtener la URL de la imagen antes de limpiar
    let imageUrl = null;
    if (fieldName === 'foto') {
        imageUrl = uploadedFotoUrl || (urlField ? urlField.value : null);
    } else if (fieldName === 'foto2') {
        imageUrl = uploadedFoto2Url || (urlField ? urlField.value : null);
    }
    
    // Si hay una URL válida, eliminar el archivo del bucket
    if (imageUrl) {
        const deleted = await deleteImageFromStorage(imageUrl);
        if (!deleted) {
            console.warn('⚠️ No se pudo eliminar el archivo del bucket, pero se continuará con la eliminación local');
        }
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
    if (previewDiv) {
        previewDiv.style.display = 'none';
    }
    if (urlField) {
        urlField.value = '';
    }
    
    // Limpiar variables globales
    if (fieldName === 'foto') {
        uploadedFotoUrl = null;
    } else if (fieldName === 'foto2') {
        uploadedFoto2Url = null;
    }
}

// Hacer funciones globales
window.handleImageFileChange = handleImageFileChange;
window.removeImagePreview = removeImagePreview;

/**
 * Cargar clientes con propuestas para el selector de cliente
 */
let availableClients = [];

async function loadClientsForProductForm() {
    if (!supabaseClient) {
        return;
    }

    try {
        // Obtener clientes únicos de TODAS las propuestas (no solo en curso o enviadas)
        // Esto asegura que aparezcan todos los clientes que tienen propuestas registradas
        const { data, error } = await supabaseClient
            .from('presupuestos')
            .select('nombre_cliente')
            .not('nombre_cliente', 'is', null)
            .order('nombre_cliente', { ascending: true });

        if (error) {
            console.error('Error al cargar clientes:', error);
            console.error('Detalles del error:', error.message, error.code);
            return;
        }

        // Obtener nombres únicos y filtrar valores vacíos
        availableClients = [...new Set(data.map(p => p.nombre_cliente))].filter(Boolean);
        console.log('✅ Clientes cargados para selector:', availableClients.length);
        console.log('📋 Lista de clientes:', availableClients);
        
        if (availableClients.length === 0) {
            console.warn('⚠️ No se encontraron clientes. Verifica que haya propuestas en la base de datos.');
        }
    } catch (error) {
        console.error('Error en loadClientsForProductForm:', error);
    }
}

/**
 * Configurar autocompletado para el selector de cliente
 */
function setupClientAutocomplete() {
    const clienteSelect = document.getElementById('clienteSelect');
    const clienteIdField = document.getElementById('clienteId');
    const suggestionsDiv = document.getElementById('clienteSuggestions');
    
    if (!clienteSelect || !clienteIdField || !suggestionsDiv) return;
    
    clienteSelect.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            suggestionsDiv.style.display = 'none';
            clienteIdField.value = '';
            return;
        }
        
        // Filtrar clientes que coincidan con la búsqueda
        const filtered = availableClients.filter(client => 
            client.toLowerCase().includes(searchTerm)
        );
        
        if (filtered.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        // Mostrar sugerencias
        suggestionsDiv.innerHTML = filtered.map(client => `
            <div class="client-suggestion-item" 
                 style="padding: 10px; cursor: pointer; border-bottom: 1px solid var(--bg-gray-200); transition: background 0.2s;"
                 onmouseover="this.style.background='var(--bg-gray-50)'"
                 onmouseout="this.style.background='var(--bg-white)'"
                 onclick="selectClient('${client.replace(/'/g, "\\'")}')">
                ${client}
            </div>
        `).join('');
        
        suggestionsDiv.style.display = 'block';
    });
    
    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!clienteSelect.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Manejar tecla Enter
    clienteSelect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstSuggestion = suggestionsDiv.querySelector('.client-suggestion-item');
            if (firstSuggestion) {
                firstSuggestion.click();
            }
        }
    });
}

/**
 * Seleccionar un cliente del autocompletado
 */
window.selectClient = function(clientName) {
    const clienteSelect = document.getElementById('clienteSelect');
    const clienteIdField = document.getElementById('clienteId');
    const suggestionsDiv = document.getElementById('clienteSuggestions');
    
    if (clienteSelect) clienteSelect.value = clientName;
    if (clienteIdField) clienteIdField.value = clientName;
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    
    // Actualizar estado del checkbox de visible_en_catalogo
    if (typeof updateVisibleEnCatalogoCheckbox === 'function') {
        updateVisibleEnCatalogoCheckbox();
    }
};

/**
 * Configurar toggle del checkbox visible_en_catalogo según si hay cliente
 */
function setupClientCheckboxToggle() {
    const clienteSelect = document.getElementById('clienteSelect');
    const visibleEnCatalogoCheckbox = document.getElementById('visibleEnCatalogo');
    
    if (!clienteSelect || !visibleEnCatalogoCheckbox) return;
    
    // Listener para cuando cambia el campo de cliente
    clienteSelect.addEventListener('input', () => {
        updateVisibleEnCatalogoCheckbox();
    });
    
    // Listener para cuando se selecciona un cliente
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('client-suggestion-item')) {
            setTimeout(() => {
                updateVisibleEnCatalogoCheckbox();
            }, 100);
        }
    });
    
    // Verificar estado inicial
    updateVisibleEnCatalogoCheckbox();
}

/**
 * Actualizar estado del checkbox visible_en_catalogo
 */
function updateVisibleEnCatalogoCheckbox() {
    const clienteSelect = document.getElementById('clienteSelect');
    const clienteIdField = document.getElementById('clienteId');
    const visibleEnCatalogoCheckbox = document.getElementById('visibleEnCatalogo');
    const showInCatalogLabel = document.querySelector('label[for="visibleEnCatalogo"]');
    
    if (!clienteSelect || !visibleEnCatalogoCheckbox) return;
    
    const hasCliente = (clienteSelect.value && clienteSelect.value.trim() !== '') || 
                       (clienteIdField && clienteIdField.value && clienteIdField.value.trim() !== '');
    
    if (hasCliente) {
        // Si hay cliente, deshabilitar checkbox y desmarcarlo
        visibleEnCatalogoCheckbox.disabled = true;
        visibleEnCatalogoCheckbox.checked = false;
        if (showInCatalogLabel) {
            showInCatalogLabel.style.opacity = '0.5';
            showInCatalogLabel.style.cursor = 'not-allowed';
        }
    } else {
        // Si no hay cliente, habilitar checkbox
        visibleEnCatalogoCheckbox.disabled = false;
        if (showInCatalogLabel) {
            showInCatalogLabel.style.opacity = '1';
            showInCatalogLabel.style.cursor = 'pointer';
        }
    }
}
