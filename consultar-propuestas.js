/**
 * Sistema de Consulta de Propuestas
 * Carga y muestra todas las propuestas enviadas desde Supabase
 */

class ProposalsManager {
    constructor() {
        this.supabase = null;
        this.allProposals = [];
        this.filteredProposals = [];
        this.currentLanguage = localStorage.getItem('language') || 'pt';
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando ProposalsManager...');
        
        try {
        await this.initializeSupabase();
            
            if (!this.supabase) {
                // No se inicializó correctamente
                this.showLoadingError('No se pudo conectar con la base de datos');
                return;
            }
            
            // Cargar propuestas primero (más importante)
        await this.loadProposals();
            
            // Cargar productos en segundo plano (para búsqueda, no crítico)
            this.loadAllProducts().catch(error => {
                console.warn('⚠️ Error al cargar productos (no crítico):', error);
            });
            
        this.setupEventListeners();
        this.updateTranslations();
        } catch (error) {
            console.error('❌ Error crítico en init():', error);
            this.showLoadingError('Error al inicializar la página');
        }
    }

    showLoadingError(message) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        const noProposals = document.getElementById('noProposals');
        if (noProposals) {
            noProposals.style.display = 'block';
            noProposals.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: var(--danger-500); font-size: 3rem; margin-bottom: var(--space-4);"></i>
                <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-2);">${message}</p>
                <p style="font-size: 0.875rem; color: var(--text-secondary);">Por favor, recarga la página o contacta al administrador.</p>
                <button onclick="location.reload()" style="margin-top: var(--space-4); padding: var(--space-3) var(--space-5); background: var(--brand-blue); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
                    Recargar Página
                </button>
            `;
        }
    }

    async loadAllProducts() {
        if (!this.supabase) {
            // No se pueden cargar productos
            return;
        }

        try {
            // Obtener país del usuario para filtrar productos
            let userPais = null;
            try {
                userPais = await window.getUserPais?.();
            } catch (error) {
                console.warn('⚠️ No se pudo obtener el país del usuario:', error);
            }

            let query = this.supabase
                .from('products')
                .select('*');
            
            // Filtrar productos según el país del usuario
            // Si el usuario es de España, solo mostrar productos con mercado = 'AMBOS'
            // Si el usuario es de Portugal, mostrar todos los productos
            if (userPais && (userPais === 'Espanha' || userPais === 'España' || userPais === 'ES')) {
                query = query.eq('mercado', 'AMBOS');
                console.log('🇪🇸 [loadAllProducts] Usuario de España detectado, filtrando productos con mercado = AMBOS');
            } else {
                // Portugal o sin país: mostrar todos los productos
                console.log('🇵🇹 [loadAllProducts] Usuario de Portugal o sin país, mostrando todos los productos');
            }
            
            const { data, error } = await query
                .order('nombre', { ascending: true });

            if (error) {
                throw error;
            }

            this.allProducts = (data || []).map(product => {
                // Normalizar price_tiers
                let priceTiers = [];
                if (Array.isArray(product.price_tiers)) {
                    priceTiers = product.price_tiers;
                } else if (product.price_tiers) {
                    try {
                        priceTiers = typeof product.price_tiers === 'string' ? JSON.parse(product.price_tiers) : [product.price_tiers];
                    } catch (e) {
                        console.warn('Error parseando price_tiers para producto', product.id, e);
                        priceTiers = [];
                    }
                }

                return {
                    id: product.id,
                    nombre: product.nombre || '',
                    categoria: product.categoria || 'otros',
                    precio: parseFloat(product.precio) || 0,
                    price_tiers: priceTiers,
                    plazo_entrega: product.plazo_entrega || '',
                    referencia: product.id ? String(product.id) : '',
                    foto: product.foto || null,
                    phc_ref: product.phc_ref || null,
                    nombre_fornecedor: product.nombre_fornecedor || null,
                    referencia_fornecedor: product.referencia_fornecedor || null
                };
            });

            // Obtener categorías únicas
            this.productCategories = [...new Set(this.allProducts.map(p => p.categoria).filter(Boolean))];
            this.filteredProducts = [...this.allProducts];

            console.log('✅ Productos cargados para búsqueda:', this.allProducts.length);
            console.log('📂 Categorías disponibles:', this.productCategories);
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
        }
    }

    async initializeSupabase() {
        try {
            // Usar siempre el cliente compartido para evitar múltiples instancias
            if (window.universalSupabase) {
                this.supabase = await window.universalSupabase.getClient();
            } else {
                // Esperar un momento para que universalSupabase se inicialice
                await new Promise(resolve => setTimeout(resolve, 200));
                if (window.universalSupabase) {
                    this.supabase = await window.universalSupabase.getClient();
                } else {
                    throw new Error('No se encontró cliente Supabase. Asegúrate de que supabase-config-universal.js se cargue antes.');
                }
            }
        } catch (error) {
            // Error al inicializar
            throw error;
        }
    }

    /**
     * Consultar stock disponible desde Supabase (stock_productos por referencia_phc).
     * @param {string} phcRef - Referencia PHC del producto
     * @returns {Promise<number|null>} - Stock disponible o null si no existe
     */
    async getStockForProduct(phcRef) {
        if (!phcRef || !this.supabase) return null;
        const normalized = String(phcRef).trim().toUpperCase();
        if (!normalized) return null;
        try {
            const { data: stockRecords, error } = await this.supabase
                .from('stock_productos')
                .select('referencia_phc, stock_disponible')
                .ilike('referencia_phc', normalized);
            if (error || !stockRecords?.length) return null;
            const record = stockRecords.find(r => r.referencia_phc && String(r.referencia_phc).trim().toUpperCase() === normalized);
            if (!record) return null;
            const stock = Number(record.stock_disponible);
            return Number.isFinite(stock) ? stock : null;
        } catch (e) {
            return null;
        }
    }

    async loadProposals() {
        console.log('📋 loadProposals() llamado');
        
        if (!this.supabase) {
            // No inicializado en loadProposals
            this.showLoadingError('Error: No se pudo conectar con la base de datos');
            return;
        }

        try {
            // Mostrar indicador de carga
            const loadingIndicator = document.getElementById('loadingIndicator');
            const proposalsTable = document.getElementById('proposalsTable');
            const noProposals = document.getElementById('noProposals');
            
            if (!loadingIndicator) {
                console.error('❌ No se encontró loadingIndicator en el DOM');
            }
            
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            if (proposalsTable) proposalsTable.style.display = 'none';
            if (noProposals) noProposals.style.display = 'none';

            // Cargar presupuestos con sus artículos (sistema original con tablas separadas)
            const { data: presupuestos, error: presupuestosError } = await this.supabase
                .from('presupuestos')
                .select('*')
                .order('created_at', { ascending: false });

            if (presupuestosError) {
                console.error('❌ Error en consulta de presupuestos:', presupuestosError);
                throw presupuestosError;
            }

            console.log('📊 Presupuestos recibidos:', presupuestos ? presupuestos.length : 0);

            // Filtrar propuestas por rol si el usuario es comercial
            let filteredPresupuestos = presupuestos;
            if (presupuestos && presupuestos.length > 0) {
                try {
                    // Obtener rol del usuario
                    const role = await window.getUserRole?.();
                    
                    if (role === 'comercial') {
                        console.log('🔒 [consultar-propuestas] Usuario comercial detectado, filtrando propuestas...');
                        
                        // Obtener nombre del usuario desde user_roles
                        const user = await window.authManager?.getCurrentUser();
                        if (user) {
                            const client = await window.universalSupabase?.getClient();
                            if (client) {
                                const { data: userRoleData, error: userRoleError } = await client
                                    .from('user_roles')
                                    .select('Name')
                                    .eq('user_id', user.id)
                                    .single();
                                
                                if (!userRoleError && userRoleData && userRoleData.Name) {
                                    const userName = userRoleData.Name;
                                    console.log('👤 [consultar-propuestas] Filtrando por comercial:', userName);
                                    
                                    // Filtrar propuestas donde nombre_comercial coincida con el nombre del usuario
                                    filteredPresupuestos = presupuestos.filter(p => {
                                        const nombreComercial = p.nombre_comercial || '';
                                        return nombreComercial.trim() === userName.trim();
                                    });
                                    
                                    console.log(`📊 [consultar-propuestas] Propuestas filtradas: ${filteredPresupuestos.length} de ${presupuestos.length}`);
                                } else {
                                    console.warn('⚠️ [consultar-propuestas] No se pudo obtener el nombre del usuario, mostrando todas las propuestas');
                                }
                            }
                        }
                    } else {
                        console.log('✅ [consultar-propuestas] Usuario admin, mostrando todas las propuestas');
                    }
                } catch (error) {
                    console.error('❌ [consultar-propuestas] Error filtrando por rol:', error);
                    // En caso de error, mostrar todas las propuestas
                }
            }

            // Cargar productos para obtener categorías
            if (!this.allProducts || this.allProducts.length === 0) {
                console.log('🔄 Cargando productos para obtener categorías...');
                const { data: products, error: productsError } = await this.supabase
                    .from('products')
                    .select('id, nombre, categoria');
                
                if (!productsError && products) {
                    this.allProducts = products.map(p => ({
                        id: p.id,
                        nombre: p.nombre || '',
                        categoria: p.categoria || ''
                    }));
                    console.log('✅ Productos cargados para categorías:', this.allProducts.length);
                    if (this.allProducts.length > 0) {
                        console.log('📋 Ejemplo de producto:', this.allProducts[0]);
                    }
                } else {
                    console.warn('⚠️ No se pudieron cargar productos:', productsError);
                    this.allProducts = [];
                }
            }

            // Cargar artículos para cada presupuesto
            if (filteredPresupuestos && filteredPresupuestos.length > 0) {
                const presupuestoIds = filteredPresupuestos.map(p => p.id);
                console.log('🔄 Cargando artículos para', presupuestoIds.length, 'presupuestos...');
                
                const { data: articulos, error: articulosError } = await this.supabase
                    .from('presupuestos_articulos')
                    .select('*, encomendado, fecha_encomenda, numero_encomenda, cantidad_encomendada, fecha_prevista_entrega')
                    .in('presupuesto_id', presupuestoIds);

                if (articulosError) {
                    console.error('❌ Error al cargar artículos:', articulosError);
                    // Continuar aunque haya error, pero con artículos vacíos
                } else {
                    console.log('📦 Artículos cargados:', articulos ? articulos.length : 0);
                }

                // Los artículos encomendados ahora se obtienen directamente de la columna 'encomendado' en presupuestos_articulos
                // No necesitamos cargar desde una tabla separada

                // Cargar artículos concluidos (si existe esta tabla)
                let articulosConcluidos = null;
                try {
                    const { data } = await this.supabase
                    .from('presupuestos_articulos_concluidos')
                    .select('articulo_id')
                    .in('presupuesto_id', presupuestoIds);
                    articulosConcluidos = data;
                } catch (error) {
                    // Si la tabla no existe o hay error, continuar sin error
                    console.warn('⚠️ No se pudo cargar artículos concluidos (tabla puede no existir):', error);
                    articulosConcluidos = null;
                }

                // Crear sets para búsqueda rápida (solo para concluidos, encomendados ahora viene de la columna)
                const concluidosSet = new Set((articulosConcluidos || []).map(a => a.articulo_id));

                // Agrupar artículos por presupuesto y marcar estados
                const articulosPorPresupuesto = {};
                if (articulos) {
                    articulos.forEach(articulo => {
                        if (!articulosPorPresupuesto[articulo.presupuesto_id]) {
                            articulosPorPresupuesto[articulo.presupuesto_id] = [];
                        }
                        // Agregar información de estado (encomendado ahora viene directamente de la columna)
                        // Asegurar que el ID esté presente
                        if (!articulo.id) {
                            console.warn('⚠️ Artículo sin ID:', articulo);
                        }
                        articulosPorPresupuesto[articulo.presupuesto_id].push({
                            ...articulo,
                            encomendado: articulo.encomendado === true || articulo.encomendado === 'true',
                            concluido: concluidosSet.has(articulo.id)
                        });
                    });
                }

                // Cargar dossiers para cada presupuesto
                let dossiersPorPresupuesto = {};
                if (presupuestoIds && presupuestoIds.length > 0) {
                    try {
                        const { data: dossiers, error: dossiersError } = await this.supabase
                            .from('presupuestos_dossiers')
                            .select('*')
                            .in('presupuesto_id', presupuestoIds);
                        
                        if (!dossiersError && dossiers) {
                            dossiers.forEach(dossier => {
                                dossiersPorPresupuesto[dossier.presupuesto_id] = dossier;
                            });
                            console.log('📁 Dossiers cargados:', dossiers.length);
                        }
                    } catch (error) {
                        console.warn('⚠️ No se pudo cargar dossiers:', error);
                    }
                }

                // Cargar follow-ups por presupuesto
                let followUpsPorPresupuesto = {};
                if (presupuestoIds && presupuestoIds.length > 0) {
                    try {
                        const { data: followUps, error: followUpsError } = await this.supabase
                            .from('presupuestos_follow_ups')
                            .select('*')
                            .in('presupuesto_id', presupuestoIds)
                            .order('fecha_follow_up', { ascending: true });
                        if (!followUpsError && followUps) {
                            followUps.forEach(fu => {
                                if (!followUpsPorPresupuesto[fu.presupuesto_id]) followUpsPorPresupuesto[fu.presupuesto_id] = [];
                                followUpsPorPresupuesto[fu.presupuesto_id].push(fu);
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ No se pudo cargar follow-ups:', error);
                    }
                }

                // Combinar datos (usar filteredPresupuestos si existe, sino presupuestos)
                const presupuestosToUse = filteredPresupuestos || presupuestos;
                this.allProposals = presupuestosToUse.map(presupuesto => {
                    // Parsear historial_modificaciones si viene como string JSON
                    let historialModificaciones = presupuesto.historial_modificaciones || [];
                    if (typeof historialModificaciones === 'string') {
                        try {
                            historialModificaciones = JSON.parse(historialModificaciones);
                        } catch (e) {
                            console.warn('⚠️ Error parseando historial_modificaciones para propuesta', presupuesto.id, e);
                            historialModificaciones = [];
                        }
                    }
                    // Asegurar que sea un array
                    if (!Array.isArray(historialModificaciones)) {
                        historialModificaciones = [];
                    }

                    // Obtener documentos del dossier
                    const dossier = dossiersPorPresupuesto[presupuesto.id];
                    let documentosUrls = [];
                    if (dossier && dossier.documentos_urls) {
                        if (typeof dossier.documentos_urls === 'string') {
                            try {
                                documentosUrls = JSON.parse(dossier.documentos_urls);
                            } catch (e) {
                                documentosUrls = [dossier.documentos_urls];
                            }
                        } else if (Array.isArray(dossier.documentos_urls)) {
                            documentosUrls = dossier.documentos_urls;
                        }
                    }

                    // Obtener categorías únicas de los artículos de esta propuesta
                    const categorias = this.getCategoriasFromArticulos(articulosPorPresupuesto[presupuesto.id] || []);

                    return {
                    ...presupuesto,
                        historial_modificaciones: historialModificaciones,
                    articulos: articulosPorPresupuesto[presupuesto.id] || [],
                    total: (articulosPorPresupuesto[presupuesto.id] || []).reduce((sum, art) => {
                        return sum + (parseFloat(art.precio) || 0) * (parseInt(art.cantidad) || 0);
                    }, 0),
                    dossier_documentos: documentosUrls,
                    presupuesto_dossier_id: dossier?.id || null,
                    categorias: categorias, // Agregar categorías únicas
                    follow_ups: followUpsPorPresupuesto[presupuesto.id] || []
                    };
                });

                console.log('✅ Propuestas cargadas:', this.allProposals.length);
            } else {
                this.allProposals = [];
            }

            // Reaplicar filtros actuales si existen, sino mostrar todas las propuestas
            this.applyFilters();

        } catch (error) {
            console.error('❌ Error al cargar propuestas:', error);
            this.showError('Error al cargar las propuestas');
            
            // Asegurar que se oculte el indicador de carga
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Mostrar mensaje de error
            const noProposals = document.getElementById('noProposals');
            if (noProposals) {
                noProposals.style.display = 'block';
                const message = this.currentLanguage === 'es' ? 
                    'Error al cargar las propuestas. Por favor, recarga la página.' : 
                    this.currentLanguage === 'pt' ?
                    'Erro ao carregar as propostas. Por favor, recarregue a página.' :
                    'Error loading proposals. Please reload the page.';
                noProposals.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>${message}</p>`;
            }
        } finally {
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    /**
     * Traducir nombre de categoría según el idioma actual
     */
    translateCategoryName(categorySlug) {
        if (!categorySlug) return categorySlug;
        
        const translations = {
            pt: {
                'secadores': 'Secadores',
                'accesorios': 'Acessórios',
                'maleteros': 'Porta-malas',
                'planchas': 'Ferros de passar',
                'tablas-de-planchar': 'Tábuas de passar',
                'bandejas': 'Bandejas',
                'baldes-de-reciclage': 'Baldes de reciclagem',
                'balde-wc': 'Balde WC',
                'bascula': 'Balança',
                'bolsas': 'Bolsas',
                'boligrafos-y-lapiceros': 'Canetas e lápis',
                'caja-para-kleenex': 'Caixa para lenços',
                'caja-fuerte': 'Cofre',
                'camas-y-cunas': 'Camas e berços',
                'carros': 'Carrinhos',
                'cuero-reciclado': 'Couro reciclado',
                'espejos': 'Espelhos',
                'escobillas': 'Escovas',
                'kettles': 'Chaleiras',
                'papeleras': 'Papeleiras',
                'paraguas': 'Guardas-chuva',
                'pedido-especial': 'Pedido especial',
                'perchas': 'Cabides',
                'silla-para-bebe': 'Cadeira para bebé',
                'tendedero': 'Estendal'
            },
            es: {
                'secadores': 'Secadores',
                'accesorios': 'Accesorios',
                'maleteros': 'Portamaletas',
                'planchas': 'Planchas',
                'tablas-de-planchar': 'Tablas de planchar',
                'bandejas': 'Bandejas',
                'baldes-de-reciclage': 'Cubos de reciclaje',
                'balde-wc': 'Cubo WC',
                'bascula': 'Báscula',
                'bolsas': 'Bolsas',
                'boligrafos-y-lapiceros': 'Bolígrafos y lápices',
                'caja-para-kleenex': 'Caja para pañuelos',
                'caja-fuerte': 'Caja fuerte',
                'camas-y-cunas': 'Camas y cunas',
                'carros': 'Carros',
                'cuero-reciclado': 'Cuero reciclado',
                'espejos': 'Espejos',
                'escobillas': 'Escobillas',
                'kettles': 'Teteras',
                'papeleras': 'Papeleras',
                'paraguas': 'Paraguas',
                'pedido-especial': 'Pedido especial',
                'perchas': 'Perchas',
                'silla-para-bebe': 'Silla para bebé',
                'tendedero': 'Tendedero'
            },
            en: {
                'secadores': 'Hair Dryers',
                'accesorios': 'Accessories',
                'maleteros': 'Luggage Racks',
                'planchas': 'Irons',
                'tablas-de-planchar': 'Ironing Boards',
                'bandejas': 'Trays',
                'baldes-de-reciclage': 'Recycling Bins',
                'balde-wc': 'WC Bucket',
                'bascula': 'Scale',
                'bolsas': 'Bags',
                'boligrafos-y-lapiceros': 'Pens and Pencils',
                'caja-para-kleenex': 'Tissue Box',
                'caja-fuerte': 'Safe',
                'camas-y-cunas': 'Beds and Cribs',
                'carros': 'Carts',
                'cuero-reciclado': 'Recycled Leather',
                'espejos': 'Mirrors',
                'escobillas': 'Brushes',
                'kettles': 'Kettles',
                'papeleras': 'Wastebaskets',
                'paraguas': 'Umbrellas',
                'pedido-especial': 'Special Order',
                'perchas': 'Hangers',
                'silla-para-bebe': 'Baby Chair',
                'tendedero': 'Clothesline'
            }
        };
        
        const lang = this.currentLanguage || 'pt';
        const categoryLower = categorySlug.toLowerCase().trim();
        
        // Buscar traducción exacta
        if (translations[lang] && translations[lang][categoryLower]) {
            return translations[lang][categoryLower];
        }
        
        // Si no hay traducción, capitalizar la primera letra de cada palabra
        return categorySlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Obtener categorías únicas de los artículos de una propuesta
     */
    getCategoriasFromArticulos(articulos) {
        if (!articulos || articulos.length === 0) {
            return [];
        }
        
        if (!this.allProducts || this.allProducts.length === 0) {
            console.warn('⚠️ No hay productos cargados para buscar categorías');
            return [];
        }
        
        const categoriasSet = new Set();
        
        articulos.forEach(articulo => {
            let producto = null;
            
            // Primero intentar buscar por referencia_articulo (que puede ser el ID del producto como string)
            if (articulo.referencia_articulo) {
                producto = this.allProducts.find(p => {
                    // Comparar ID como string (el referencia_articulo suele ser el ID del producto)
                    return String(p.id) === String(articulo.referencia_articulo);
                });
            }
            
            // Si no se encontró por referencia, buscar por nombre
            if (!producto && articulo.nombre_articulo) {
                const nombreArticuloLower = articulo.nombre_articulo.toLowerCase().trim();
                producto = this.allProducts.find(p => {
                    if (!p.nombre) return false;
                    const nombreProductoLower = p.nombre.toLowerCase().trim();
                    // Comparación exacta (case-insensitive)
                    if (nombreProductoLower === nombreArticuloLower) {
                        return true;
                    }
                    // Comparación parcial (por si hay diferencias menores como espacios extra)
                    // Solo usar comparación parcial si ambos nombres tienen al menos 5 caracteres
                    if (nombreArticuloLower.length >= 5 && nombreProductoLower.length >= 5) {
                        return nombreProductoLower.includes(nombreArticuloLower) ||
                               nombreArticuloLower.includes(nombreProductoLower);
                    }
                    return false;
                });
            }
            
            if (producto && producto.categoria) {
                categoriasSet.add(producto.categoria);
            } else if (articulo.nombre_articulo) {
                // Solo mostrar warning si realmente hay un nombre de artículo
                console.warn(`⚠️ No se encontró producto para artículo: "${articulo.nombre_articulo}" (referencia: ${articulo.referencia_articulo || 'N/A'})`);
            }
        });
        
        const categorias = Array.from(categoriasSet).sort();
        if (categorias.length > 0) {
            console.log(`📂 Categorías encontradas (${categorias.length}):`, categorias);
        }
        return categorias;
    }

    renderProposals() {
        const tbody = document.getElementById('proposalsTableBody');
        const table = document.getElementById('proposalsTable');
        const noProposals = document.getElementById('noProposals');
        const loadingIndicator = document.getElementById('loadingIndicator');

        // Asegurar que el indicador de carga esté oculto
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla');
            return;
        }

        tbody.innerHTML = '';

        if (this.filteredProposals.length === 0) {
            if (table) table.style.display = 'none';
            if (noProposals) {
            noProposals.style.display = 'block';
            }
            return;
        }

        if (table) table.style.display = 'table';
        if (noProposals) noProposals.style.display = 'none';

        this.filteredProposals.forEach(proposal => {
            const row = document.createElement('tr');
            const followUpAlert = this.isProposalInFollowUpAlert(proposal);
            if (followUpAlert.isAlert) {
                row.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                row.style.borderLeft = '4px solid #dc2626';
            }

            // Formatear fechas
            const fechaInicio = new Date(proposal.fecha_inicial);
            const fechaInicioFormateada = fechaInicio.toLocaleDateString(this.currentLanguage === 'es' ? 'es-ES' : 
                                                           this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US');
            
            const fechaUltimaActualizacion = proposal.fecha_ultima_actualizacion ? 
                new Date(proposal.fecha_ultima_actualizacion) : null;
            const fechaUltimaFormateada = fechaUltimaActualizacion ? 
                fechaUltimaActualizacion.toLocaleDateString(this.currentLanguage === 'es' ? 'es-ES' : 
                                                           this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US') : '-';

            // Número de propuesta (usar código generado si existe, sino primeros 8 caracteres del UUID)
            // Obtener versión de la propuesta (por defecto 1 si no existe)
            const version = proposal.version || 1;
            const versionSuffix = version > 1 ? ` V${version}` : '';
            
            const proposalNumber = (proposal.codigo_propuesta || 
                                  (proposal.id ? proposal.id.substring(0, 8).toUpperCase() : '-')) + versionSuffix;

            // Estado
            const statusClass = this.getStatusClass(proposal.estado_propuesta);
            const statusText = this.getStatusText(proposal.estado_propuesta);

            // Normalizar el valor del estado para el select (manejar variaciones como "propuesta enviada" vs "propuesta_enviada")
            const normalizeStatusValue = (status) => {
                if (!status) return 'propuesta_enviada';
                const statusLower = status.toLowerCase();
                // Mapear valores antiguos a nuevos
                if (statusLower === 'propuesta enviada' || statusLower === 'propuesta_enviada') return 'propuesta_enviada';
                if (statusLower.includes('en curso') || statusLower === 'propuesta_en_curso') return 'propuesta_en_curso';
                if (statusLower.includes('en edicion') || statusLower === 'propuesta_en_edicion') return 'propuesta_en_edicion';
                if (statusLower.includes('muestra pedida') || statusLower.includes('amostra pedida') || statusLower === 'muestra_pedida' || statusLower === 'amostra_pedida') return 'amostra_pedida';
                if (statusLower.includes('muestra entregada') || statusLower.includes('amostra enviada') || statusLower === 'muestra_entregada' || statusLower === 'amostra_enviada') return 'amostra_enviada';
                if (statusLower.includes('aguarda dossier') && !statusLower.includes('aprovacao')) return 'aguarda_dossier';
                if (statusLower.includes('aguarda') && statusLower.includes('aprovacao') && statusLower.includes('dossier')) return 'aguarda_aprovacao_dossier';
                if (statusLower.includes('aguarda') && statusLower.includes('creacion') && statusLower.includes('cliente')) return 'aguarda_creacion_cliente';
                if (statusLower.includes('aguarda') && statusLower.includes('creacion') && statusLower.includes('codigo') && statusLower.includes('phc')) return 'aguarda_creacion_codigo_phc';
                if (statusLower.includes('aguarda') && statusLower.includes('pagamento')) return 'aguarda_pagamento';
                // Estado 'encomendado' eliminado - ya no se usa
                if (statusLower.includes('pedido') && statusLower.includes('encomenda')) return 'pedido_de_encomenda';
                if (statusLower.includes('encomenda') && (statusLower.includes('en curso') || statusLower.includes('em curso'))) return 'encomenda_en_curso';
                if (statusLower.includes('concluida') || statusLower.includes('concluída') || statusLower === 'encomenda_concluida') return 'encomenda_concluida';
                if (statusLower.includes('rechazada') || statusLower.includes('rejeitada')) return 'rejeitada';
                if (statusLower === 'follow_up' || statusLower.includes('follow up')) return 'follow_up';
                return status; // Si no coincide, usar el valor original
            };
            
            const estadoNormalizado = normalizeStatusValue(proposal.estado_propuesta);

            // Hacer el número de propuesta clickeable si tiene código
            const proposalNumberCell = proposal.codigo_propuesta ? 
                `<td style="cursor: pointer; color: var(--brand-blue, #2563eb); text-decoration: underline;" onclick="window.proposalsManager.showProposalCodeBreakdown('${proposal.id}', '${proposal.codigo_propuesta}', '${(proposal.nombre_comercial || '').replace(/'/g, "\\'")}', '${(proposal.nombre_cliente || '').replace(/'/g, "\\'")}', '${proposal.fecha_inicial}', ${version})" title="Click para ver la fórmula">${proposalNumber}</td>` :
                `<td>${proposalNumber}</td>`;

            // Renderizar categorías como badges pequeños (máximo 3 + "otros" si hay más)
            let categoriasHTML = '';
            if (proposal.categorias && proposal.categorias.length > 0) {
                const categoriasMostrar = proposal.categorias.slice(0, 3);
                const hayMas = proposal.categorias.length > 3;
                const cantidadOtros = proposal.categorias.length - 3;
                
                // Traducir las categorías antes de mostrarlas
                categoriasHTML = categoriasMostrar.map(cat => {
                    const categoriaTraducida = this.translateCategoryName(cat);
                    return `<span style="
                        display: inline-block;
                        background: var(--primary-100, #dbeafe);
                        color: var(--primary-700, #1e40af);
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        margin: 2px;
                        white-space: nowrap;
                    ">${categoriaTraducida}</span>`;
                }).join('');
                
                // Agregar badge "otros" si hay más categorías
                if (hayMas) {
                    const textoOtros = this.currentLanguage === 'es' ? 'otros' : 
                                      this.currentLanguage === 'pt' ? 'outros' : 'others';
                    categoriasHTML += `<span style="
                        display: inline-block;
                        background: var(--primary-100, #dbeafe);
                        color: var(--primary-700, #1e40af);
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        margin: 2px;
                        white-space: nowrap;
                    ">${textoOtros} (${cantidadOtros})</span>`;
                }
            } else {
                categoriasHTML = '<span style="color: var(--text-muted, #9ca3af); font-size: 0.75rem;">-</span>';
            }

            row.innerHTML = `
                ${proposalNumberCell}
                <td>${fechaInicioFormateada}</td>
                <td>${proposal.nombre_cliente || '-'}</td>
                <td>${proposal.nombre_comercial || '-'}</td>
                <td style="max-width: 200px; padding: 8px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
                        ${categoriasHTML}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        ${this.canChangeStatus(proposal.estado_propuesta) ? `
                            <select class="status-select-inline" id="status-select-inline-${proposal.id}" onchange="window.proposalsManager.handleStatusChange('${proposal.id}', this.value)" style="
                                background: var(--bg-white, #ffffff);
                                border: 1px solid var(--bg-gray-300, #d1d5db);
                                color: var(--text-primary, #111827);
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 0.875rem;
                                font-weight: 600;
                                cursor: pointer;
                                min-width: 150px;
                                appearance: none;
                                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                                background-repeat: no-repeat;
                                background-position: right 8px center;
                                padding-right: 32px;
                            " onfocus="this.style.borderColor='var(--primary-500, #2563eb)'; this.style.boxShadow='0 0 0 2px rgba(37,99,235,0.2)';" onblur="this.style.borderColor='var(--bg-gray-300, #d1d5db)'; this.style.boxShadow='none';">
                                ${(() => {
                                    const hasPassedPropuestaEnviada = this.hasPassedThroughStatus(proposal, 'propuesta_enviada');
                                    
                                    let options = '';
                                    
                                    // "propuesta_en_curso" es un estado automático que se asigna al crear la propuesta
                                    // No debe aparecer en el dropdown, solo se muestra si está actualmente en ese estado
                                    if (estadoNormalizado === 'propuesta_en_curso') {
                                        options += `<option value="propuesta_en_curso" selected disabled>${this.getStatusText('propuesta_en_curso')}</option>`;
                                    }
                                    
                                    // Solo mostrar "propuesta_enviada" si no ha pasado por él antes
                                    if (!hasPassedPropuestaEnviada) {
                                        options += estadoNormalizado === 'propuesta_enviada' ? 
                                            `<option value="propuesta_enviada" selected>${this.getStatusText('propuesta_enviada')}</option>` : 
                                            `<option value="propuesta_enviada">${this.getStatusText('propuesta_enviada')}</option>`;
                                    } else if (estadoNormalizado === 'propuesta_enviada') {
                                        // Si está actualmente en ese estado pero ya pasó por él, mostrarlo como seleccionado pero deshabilitado
                                        options += `<option value="propuesta_enviada" selected disabled>${this.getStatusText('propuesta_enviada')}</option>`;
                                    }
                                    
                                    return options;
                                })()}
                                ${estadoNormalizado === 'propuesta_en_edicion' ? `<option value="propuesta_en_edicion" selected>${this.getStatusText('propuesta_en_edicion')}</option>` : `<option value="propuesta_en_edicion">${this.getStatusText('propuesta_en_edicion')}</option>`}
                                ${estadoNormalizado === 'amostra_pedida' ? `<option value="amostra_pedida" selected>${this.getStatusText('amostra_pedida')}</option>` : `<option value="amostra_pedida">${this.getStatusText('amostra_pedida')}</option>`}
                                ${estadoNormalizado === 'amostra_enviada' ? `<option value="amostra_enviada" selected>${this.getStatusText('amostra_enviada')}</option>` : `<option value="amostra_enviada">${this.getStatusText('amostra_enviada')}</option>`}
                                ${estadoNormalizado === 'aguarda_dossier' ? `<option value="aguarda_dossier" selected>${this.getStatusText('aguarda_dossier')}</option>` : `<option value="aguarda_dossier">${this.getStatusText('aguarda_dossier')}</option>`}
                                ${estadoNormalizado === 'aguarda_aprovacao_dossier' ? `<option value="aguarda_aprovacao_dossier" selected>${this.getStatusText('aguarda_aprovacao_dossier')}</option>` : `<option value="aguarda_aprovacao_dossier">${this.getStatusText('aguarda_aprovacao_dossier')}</option>`}
                                ${estadoNormalizado === 'aguarda_creacion_cliente' ? `<option value="aguarda_creacion_cliente" selected>${this.getStatusText('aguarda_creacion_cliente')}</option>` : `<option value="aguarda_creacion_cliente">${this.getStatusText('aguarda_creacion_cliente')}</option>`}
                                ${estadoNormalizado === 'aguarda_creacion_codigo_phc' ? `<option value="aguarda_creacion_codigo_phc" selected>${this.getStatusText('aguarda_creacion_codigo_phc')}</option>` : `<option value="aguarda_creacion_codigo_phc">${this.getStatusText('aguarda_creacion_codigo_phc')}</option>`}
                                ${estadoNormalizado === 'aguarda_pagamento' ? `<option value="aguarda_pagamento" selected>${this.getStatusText('aguarda_pagamento')}</option>` : `<option value="aguarda_pagamento">${this.getStatusText('aguarda_pagamento')}</option>`}
                                ${estadoNormalizado === 'follow_up' ? `<option value="follow_up" selected>${this.getStatusText('follow_up')}</option>` : `<option value="follow_up">${this.getStatusText('follow_up')}</option>`}
                                ${estadoNormalizado === 'pedido_de_encomenda' ? `<option value="pedido_de_encomenda" selected>${this.getStatusText('pedido_de_encomenda')}</option>` : `<option value="pedido_de_encomenda">${this.getStatusText('pedido_de_encomenda')}</option>`}
                                ${estadoNormalizado === 'encomenda_en_curso' ? `<option value="encomenda_en_curso" selected>${this.getStatusText('encomenda_en_curso')}</option>` : `<option value="encomenda_en_curso">${this.getStatusText('encomenda_en_curso')}</option>`}
                                ${estadoNormalizado === 'encomenda_concluida' ? `<option value="encomenda_concluida" selected>${this.getStatusText('encomenda_concluida')}</option>` : `<option value="encomenda_concluida">${this.getStatusText('encomenda_concluida')}</option>`}
                                ${estadoNormalizado === 'rejeitada' ? `<option value="rejeitada" selected>${this.getStatusText('rejeitada')}</option>` : `<option value="rejeitada">${this.getStatusText('rejeitada')}</option>`}
                            </select>
                        ` : `
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        `}
                        ${(proposal.historial_modificaciones?.length || 0) > 0 ? `
                            <button onclick="window.proposalsManager.viewStatusChangesHistory('${proposal.id}')" style="
                                background: transparent;
                                border: 1px solid var(--bg-gray-300, #d1d5db);
                                color: var(--text-secondary, #6b7280);
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 0.75rem;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                                transition: all 0.2s;
                            " onmouseover="this.style.background='var(--bg-gray-100, #f3f4f6)'; this.style.color='var(--text-primary, #111827)';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary, #6b7280)';" title="Ver cambios de estado">
                                <i class="fas fa-exchange-alt" style="font-size: 0.7rem;"></i>
                                <span>${proposal.historial_modificaciones?.length || 0}</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td>${fechaUltimaFormateada}</td>
                <td>
                    <button class="btn-view-details" onclick="window.proposalsManager.viewProposalDetails('${proposal.id}')" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-eye"></i> <span id="view-details-text">Ver Detalles</span>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Enviar webhooks de alerta follow-up en secuencia (evitar muchas peticiones a la vez)
        const toSend = [];
        this.filteredProposals.forEach(proposal => {
            const alert = this.isProposalInFollowUpAlert(proposal);
            if (alert.isAlert) toSend.push({ proposal, alert });
        });
        if (toSend.length) {
            (async () => {
                for (const { proposal, alert } of toSend) {
                    await this.sendFollowUpAlertWebhookIfNeeded(proposal, alert);
                    if (toSend.length > 1) await new Promise(r => setTimeout(r, 250));
                }
            })();
        }
    }

    /**
     * Determina si una propuesta está en estado de alerta (sin follow-up a 15d o fecha futuro vencida).
     * Solo aplica si el estado es: Proposta Enviada, Follow up, Aguarda Aprovação de Dossier o Aguarda Pagamento.
     * @returns {{ isAlert: boolean, is15dOverdue: boolean, isFutureFuOverdue: boolean }}
     */
    isProposalInFollowUpAlert(proposal) {
        const estado = (proposal.estado_propuesta || '').toLowerCase();
        const isPropostaEnviada = (estado.includes('proposta') || estado.includes('propuesta')) && estado.includes('enviada');
        const isFollowUp = estado === 'follow_up' || estado.includes('follow up');
        const isAguardaAprovacaoDossier = estado.includes('aguarda') && (estado.includes('aprovacao') || estado.includes('aprovação')) && estado.includes('dossier');
        const isAguardaPagamento = estado.includes('aguarda') && estado.includes('pagamento');
        const isEligibleStatus = isPropostaEnviada || isFollowUp || isAguardaAprovacaoDossier || isAguardaPagamento;
        if (!isEligibleStatus) {
            return { isAlert: false, is15dOverdue: false, isFutureFuOverdue: false };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Si tiene al menos un follow-up con fecha futura, no marcar en rojo
        const hasFutureFollowUp = proposal.follow_ups && proposal.follow_ups.length > 0 && proposal.follow_ups.some(fu => {
            const f = fu.fecha_follow_up_futuro;
            if (!f) return false;
            const d = new Date(f);
            d.setHours(0, 0, 0, 0);
            return d >= today;
        });
        if (hasFutureFollowUp) {
            return { isAlert: false, is15dOverdue: false, isFutureFuOverdue: false };
        }

        const fechaEnvio = proposal.fecha_envio_propuesta || proposal.fecha_propuesta || proposal.fecha_inicial;
        const fechaEnvioDate = fechaEnvio ? new Date(fechaEnvio) : null;
        let is15dOverdue = false;
        if (fechaEnvioDate && !isFollowUp) {
            fechaEnvioDate.setHours(0, 0, 0, 0);
            const daysSinceSend = Math.floor((today - fechaEnvioDate) / (24 * 60 * 60 * 1000));
            is15dOverdue = daysSinceSend >= 15;
        }

        let isFutureFuOverdue = false;
        if (isFollowUp && proposal.follow_ups && proposal.follow_ups.length > 0) {
            const futureDates = proposal.follow_ups
                .map(fu => fu.fecha_follow_up_futuro)
                .filter(Boolean)
                .map(d => new Date(d));
            if (futureDates.length > 0) {
                const maxFuture = new Date(Math.max(...futureDates.map(d => d.getTime())));
                maxFuture.setHours(0, 0, 0, 0);
                isFutureFuOverdue = maxFuture < today;
            }
        }

        return {
            isAlert: is15dOverdue || isFutureFuOverdue,
            is15dOverdue,
            isFutureFuOverdue
        };
    }

    /**
     * Envía webhook de alerta follow-up si corresponde y actualiza flags para no spamear.
     * Usa proxy (Vercel API route) para evitar CORS al llamar a n8n desde el navegador.
     */
    async sendFollowUpAlertWebhookIfNeeded(proposal, alert) {
        const payload = {
            numero_propuesta: proposal.codigo_propuesta || (proposal.id ? proposal.id.substring(0, 8).toUpperCase() : ''),
            nombre_cliente: proposal.nombre_cliente || '',
            nombre_comercial: proposal.nombre_comercial || '',
            nombre_responsable: proposal.responsavel || ''
        };

        const send15d = alert.is15dOverdue;
        const sendFuture = alert.isFutureFuOverdue;
        const now = new Date().toISOString();

        // Proxy en mismo origen (evita CORS). Ruta con .json para que Vercel no la mande a index.html.
        const origin = typeof window !== 'undefined' && window.location && window.location.origin;
        const useProxy = origin && origin !== 'null' && !origin.startsWith('file');
        const webhookTarget = useProxy ? (origin + '/api/follow-up-webhook.json') : null;

        if (!webhookTarget) {
            return;
        }

        try {
            if (send15d && !proposal.webhook_15d_sent_at) {
                const res = await fetch(webhookTarget, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, tipo_alerta: '15_dias_sin_follow_up' })
                });
                var json15 = null;
                if (res.ok) try { json15 = await res.json(); } catch (e) {}
                if (res.ok && json15 && json15.ok && this.supabase) {
                    await this.supabase.from('presupuestos').update({ webhook_15d_sent_at: now }).eq('id', proposal.id);
                }
            }
            if (sendFuture && !proposal.webhook_future_fu_sent_at) {
                const res = await fetch(webhookTarget, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, tipo_alerta: 'fecha_follow_up_futuro_vencida' })
                });
                var jsonFuture = null;
                if (res.ok) try { jsonFuture = await res.json(); } catch (e) {}
                if (res.ok && jsonFuture && jsonFuture.ok && this.supabase) {
                    await this.supabase.from('presupuestos').update({ webhook_future_fu_sent_at: now }).eq('id', proposal.id);
                }
            }
        } catch (e) {
            console.warn('Error enviando webhook follow-up:', e);
        }
    }

    getStatusClass(status) {
        const statusLower = (status || '').toLowerCase();
        
        // Estados iniciales (azul)
        if (statusLower.includes('enviada') || statusLower.includes('enviado') || statusLower === 'propuesta_enviada') {
            return 'status-sent';
        } else if (statusLower.includes('en curso') && !statusLower.includes('encomenda')) {
            return 'status-pending';
        } else if (statusLower.includes('en edicion') || statusLower.includes('em edição')) {
            return 'status-pending';
        }
        
        // Estados de muestra (amarillo/naranja)
        else if (statusLower.includes('muestra pedida') || statusLower.includes('amostra pedida')) {
            return 'status-pending';
        } else if (statusLower.includes('muestra enviada') || statusLower.includes('amostra enviada') || statusLower.includes('muestra entregada') || statusLower.includes('amostra entregue')) {
            return 'status-pending';
        }
        
        // Estados de aguarda (amarillo)
        else if (statusLower.includes('aguarda') && statusLower.includes('dossier') && !statusLower.includes('aprovacao') && !statusLower.includes('aprovação')) {
            return 'status-aguarda-pagamento';
        } else if (statusLower.includes('aguarda') && (statusLower.includes('aprovacao') || statusLower.includes('aprovação')) && statusLower.includes('dossier')) {
            return 'status-aguarda-aprovacao';
        } else if (statusLower.includes('aguarda') && (statusLower.includes('creacion') || statusLower.includes('criação'))) {
            return 'status-aguarda-aprovacao';
        } else if (statusLower.includes('aguarda') && (statusLower.includes('codigo') || statusLower.includes('código')) && statusLower.includes('phc')) {
            return 'status-aguarda-aprovacao'; // Mismo estilo que aguarda aprovação
        } else if (statusLower.includes('aguarda') && statusLower.includes('pagamento')) {
            return 'status-aguarda-pagamento';
        }
        
        // Pedido de encomenda (antes de encomenda en curso)
        else if (statusLower.includes('pedido') && statusLower.includes('encomenda')) {
            return 'status-pending';
        }
        // Estados de encomenda (verde)
        else if (statusLower.includes('encomenda') && (statusLower.includes('en curso') || statusLower.includes('em curso'))) {
            return 'status-encomendado';
        } else if (statusLower.includes('encomendado')) {
            return 'status-encomendado';
        } else if (statusLower.includes('concluida') || statusLower.includes('concluída')) {
            return 'status-encomendado';
        }
        
        // Estados finales
        else if (statusLower.includes('rechazada') || statusLower.includes('rejeitada')) {
            return 'status-rejected';
        } else if (statusLower.includes('aprobada') || statusLower.includes('aprovada')) {
            return 'status-approved';
        } else if (statusLower === 'follow_up' || statusLower.includes('follow up')) {
            return 'status-pending';
        }
        
        return 'status-sent';
    }

    getStatusText(status) {
        const statusLower = (status || '').toLowerCase();
        
        // Mapa completo de estados con traducciones
        const statusMap = {
            es: {
                'propuesta_en_curso': 'Propuesta en Curso',
                'propuesta_enviada': 'Propuesta Enviada',
                'propuesta_en_edicion': 'Propuesta en Edición',
                'muestra_pedida': 'Amostra Pedida',
                'amostra_pedida': 'Amostra Pedida',
                'amostra_enviada': 'Amostra Enviada',
                'aguarda_dossier': 'Aguarda Dossier',
                'aguarda_aprovacao_dossier': 'Aguarda Aprobación de Dossier',
                'aguarda_creacion_cliente': 'Aguarda Creación del Cliente',
                'aguarda_creacion_codigo_phc': 'Aguarda Creación de Código PHC',
                'aguarda_pagamento': 'Aguarda Pagamento',
                'pedido_de_encomenda': 'Pedido de Encomenda',
                'encomenda_en_curso': 'Encomenda en Curso',
                'encomenda_concluida': 'Encomenda Concluída',
                'rejeitada': 'Rechazada',
                'follow_up': 'Follow up',
                // Compatibilidad con estados antiguos
                'propuesta enviada': 'Propuesta Enviada',
                'muestra_entregada': 'Muestra Enviada' // Mantener compatibilidad
            },
            pt: {
                'propuesta_en_curso': 'Proposta em Curso',
                'propuesta_enviada': 'Proposta Enviada',
                'propuesta_en_edicion': 'Proposta em Edição',
                'muestra_pedida': 'Amostra Pedida',
                'amostra_pedida': 'Amostra Pedida',
                'amostra_enviada': 'Amostra Enviada',
                'aguarda_dossier': 'Aguarda Dossier',
                'aguarda_aprovacao_dossier': 'Aguarda Aprovação de Dossier',
                'aguarda_creacion_cliente': 'Aguarda Criação do Cliente',
                'aguarda_creacion_codigo_phc': 'Aguarda Criação de Código PHC',
                'aguarda_pagamento': 'Aguarda Pagamento',
                'pedido_de_encomenda': 'Pedido de Encomenda',
                'encomenda_en_curso': 'Encomenda em Curso',
                'encomenda_concluida': 'Encomenda Concluída',
                'rejeitada': 'Rejeitada',
                'follow_up': 'Follow up',
                // Compatibilidad con estados antiguos
                'propuesta enviada': 'Proposta Enviada',
                'muestra_entregada': 'Amostra Enviada' // Mantener compatibilidad
            },
            en: {
                'propuesta_en_curso': 'Proposal in Progress',
                'propuesta_enviada': 'Proposal Sent',
                'propuesta_en_edicion': 'Proposal in Editing',
                'muestra_pedida': 'Sample Requested',
                'amostra_pedida': 'Sample Requested',
                'amostra_enviada': 'Sample Sent',
                'muestra_entregada': 'Sample Sent', // Compatibilidad
                'aguarda_dossier': 'Awaiting Dossier',
                'aguarda_aprovacao_dossier': 'Awaiting Dossier Approval',
                'aguarda_creacion_cliente': 'Awaiting Client Creation',
                'aguarda_creacion_codigo_phc': 'Awaiting PHC Code Creation',
                'aguarda_pagamento': 'Awaiting Payment',
                'pedido_de_encomenda': 'Order Request',
                'encomenda_en_curso': 'Order in Progress',
                'encomenda_concluida': 'Order Completed',
                'rejeitada': 'Rejected',
                'follow_up': 'Follow up',
                // Compatibilidad con estados antiguos
                'propuesta enviada': 'Proposal Sent',
                'encomendado': 'Ordered'
            }
        };

        const lang = this.currentLanguage || 'es';
        const map = statusMap[lang] || statusMap.es;

        // Buscar coincidencia exacta primero
        if (map[status]) {
            return map[status];
        }

        // Buscar por coincidencias parciales (compatibilidad)
        if (statusLower.includes('enviada') || statusLower.includes('enviado')) {
            return map['propuesta_enviada'] || 'Enviada';
        } else if (statusLower.includes('en curso') || statusLower.includes('em curso')) {
            return map['propuesta_en_curso'] || 'En Curso';
        } else if (statusLower.includes('en edicion') || statusLower.includes('em edição') || statusLower.includes('edicion')) {
            return map['propuesta_en_edicion'] || 'En Edición';
        } else if (statusLower.includes('muestra pedida') || statusLower.includes('amostra pedida')) {
            return map['muestra_pedida'] || 'Muestra Pedida';
        } else if (statusLower.includes('muestra enviada') || statusLower.includes('amostra enviada') || statusLower.includes('muestra entregada') || statusLower.includes('amostra entregue')) {
            return map['amostra_enviada'] || 'Muestra Enviada';
        } else if (statusLower.includes('aguarda') && statusLower.includes('dossier') && !statusLower.includes('aprovacao') && !statusLower.includes('aprovação')) {
            return map['aguarda_dossier'] || 'Aguarda Dossier';
        } else if (statusLower.includes('aguarda') && (statusLower.includes('aprovacao') || statusLower.includes('aprovação')) && statusLower.includes('dossier')) {
            return map['aguarda_aprovacao_dossier'] || 'Aguarda Aprobación de Dossier';
        } else if (statusLower.includes('aguarda') && (statusLower.includes('creacion') || statusLower.includes('criação')) && statusLower.includes('cliente')) {
            return map['aguarda_creacion_cliente'] || 'Aguarda Creación del Cliente';
        } else if (statusLower.includes('aguarda') && (statusLower.includes('creacion') || statusLower.includes('criação')) && (statusLower.includes('codigo') || statusLower.includes('código')) && statusLower.includes('phc')) {
            return map['aguarda_creacion_codigo_phc'] || 'Aguarda Creación de Código PHC';
        } else if (statusLower.includes('aguarda') && statusLower.includes('pagamento')) {
            return map['aguarda_pagamento'] || 'Aguarda Pagamento';
        } else if (statusLower.includes('pedido') && statusLower.includes('encomenda')) {
            return map['pedido_de_encomenda'] || 'Pedido de Encomenda';
        } else if (statusLower.includes('encomenda') && (statusLower.includes('en curso') || statusLower.includes('em curso'))) {
            return map['encomenda_en_curso'] || 'Encomenda en Curso';
        } else if (statusLower.includes('encomendado') || (statusLower.includes('encomenda') && statusLower.includes('curso'))) {
            return map['encomendado'] || 'Encomendado';
        } else if (statusLower.includes('concluida') || statusLower.includes('concluída')) {
            return map['encomenda_concluida'] || 'Encomenda Concluída';
        } else if (statusLower.includes('rechazada') || statusLower.includes('rejeitada')) {
            return map['rejeitada'] || 'Rechazada';
        } else if (statusLower === 'follow_up' || statusLower.includes('follow up')) {
            return map['follow_up'] || 'Follow up';
        }

        return status || map['propuesta_enviada'] || 'Enviada';
    }

    canChangeStatus(currentStatus) {
        const statusLower = (currentStatus || '').toLowerCase();
        
        // No permitir cambiar el estado si está en "encomenda concluida" o "rejeitada"
        if (statusLower.includes('concluida') || statusLower.includes('concluída') || statusLower === 'encomenda_concluida') {
            return false;
        }
        if (statusLower.includes('rechazada') || statusLower.includes('rejeitada') || statusLower === 'rejeitada') {
            return false;
        }
        
        // Permitir cambiar el estado desde cualquier otro estado
        return true;
    }

    /**
     * Verifica si una propuesta ya ha pasado por un estado específico
     * @param {Object} proposal - La propuesta a verificar
     * @param {string} statusToCheck - El estado a verificar (normalizado)
     * @returns {boolean} - true si ya ha pasado por ese estado, false si no
     */
    hasPassedThroughStatus(proposal, statusToCheck) {
        if (!proposal) return false;
        
        // Normalizar estados
        const normalizeStatus = (status) => {
            const s = (status || '').toLowerCase().trim();
            if (s === 'propuesta en curso' || s === 'propuesta_en_curso') return 'propuesta_en_curso';
            if (s === 'propuesta enviada' || s === 'propuesta_enviada') return 'propuesta_enviada';
            return s;
        };
        
        const normalizedStatusToCheck = normalizeStatus(statusToCheck);
        const normalizedCurrentStatus = normalizeStatus(proposal.estado_propuesta);
        
        // Si el estado actual es el que estamos verificando, no ha "pasado" por él aún (está en él)
        // Por lo tanto, puede seguir usándolo
        if (normalizedCurrentStatus === normalizedStatusToCheck) {
            return false;
        }
        
        // Verificar en el historial de modificaciones
        const historial = proposal.historial_modificaciones || [];
        
        // Si el historial está vacío o no tiene cambios de estado, y estamos verificando "propuesta_en_curso",
        // significa que la propuesta fue creada inicialmente con ese estado y luego cambió a otro
        // Por lo tanto, ya pasó por "propuesta_en_curso"
        if (normalizedStatusToCheck === 'propuesta_en_curso') {
            const hasStatusChanges = historial.some(reg => reg.tipo === 'cambio_estado');
            if (!hasStatusChanges && normalizedCurrentStatus !== 'propuesta_en_curso') {
                // La propuesta fue creada con "propuesta_en_curso" y ahora tiene otro estado
                // Por lo tanto, ya pasó por "propuesta_en_curso"
                return true;
            }
        }
        
        // Buscar en el historial si alguna vez cambió a ese estado
        for (const registro of historial) {
            if (registro.tipo === 'cambio_estado' && registro.descripcion) {
                const descripcionLower = registro.descripcion.toLowerCase();
                
                // Patrones para detectar cambios a los estados específicos
                // La descripción tiene el formato: "Estado cambiado de 'X' a 'Y'" (ES)
                // o "Estado alterado de 'X' para 'Y'" (PT) o "Status changed from 'X' to 'Y'" (EN)
                if (normalizedStatusToCheck === 'propuesta_en_curso') {
                    // Verificar si cambió A "propuesta en curso" o "propuesta_en_curso"
                    const patterns = [
                        /a\s+["']propuesta\s+(en\s+)?curso["']/i,  // ES: a "propuesta en curso"
                        /a\s+["']propuesta_en_curso["']/i,  // ES: a "propuesta_en_curso"
                        /para\s+["']propuesta\s+(em\s+)?curso["']/i,  // PT: para "proposta em curso"
                        /para\s+["']proposta\s+(em\s+)?curso["']/i,  // PT alternativo
                        /to\s+["']proposal\s+in\s+progress["']/i,  // EN: to "proposal in progress"
                        /changed\s+to\s+["']proposal\s+in\s+progress["']/i  // EN alternativo
                    ];
                    
                    for (const pattern of patterns) {
                        if (pattern.test(descripcionLower)) {
                            return true;
                        }
                    }
                } else if (normalizedStatusToCheck === 'propuesta_enviada') {
                    // Verificar si cambió A "propuesta enviada" o "propuesta_enviada"
                    const patterns = [
                        /a\s+["']propuesta\s+enviada["']/i,  // ES: a "propuesta enviada"
                        /a\s+["']propuesta_enviada["']/i,  // ES: a "propuesta_enviada"
                        /para\s+["']propuesta\s+enviada["']/i,  // PT: para "proposta enviada"
                        /para\s+["']proposta\s+enviada["']/i,  // PT alternativo
                        /to\s+["']proposal\s+sent["']/i,  // EN: to "proposal sent"
                        /changed\s+to\s+["']proposal\s+sent["']/i  // EN alternativo
                    ];
                    
                    for (const pattern of patterns) {
                        if (pattern.test(descripcionLower)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    async viewProposalDetails(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Cargar rol del usuario para mostrar precios correctamente
        if (!window.cachedRole) {
            try {
                window.cachedRole = await window.getUserRole?.();
            } catch (error) {
                console.warn('⚠️ No se pudo obtener el rol del usuario:', error);
            }
        }

        const modal = document.getElementById('proposalDetailsModal');
        const content = document.getElementById('proposalDetailsContent');

        // Cargar datos de amostras enviadas desde las columnas de la propuesta
        let amostrasEnviadas = null;
        
        // Los datos ya están en la propuesta (amostras_enviadas_fotos_urls y amostras_enviadas_articulos_ids)
        if (proposal.amostras_enviadas_fotos_urls || proposal.amostras_enviadas_articulos_ids) {
            console.log('🔍 Datos de amostras enviadas encontrados en la propuesta:', {
                fotos_urls: proposal.amostras_enviadas_fotos_urls,
                articulos_ids: proposal.amostras_enviadas_articulos_ids
            });
            
            amostrasEnviadas = {
                fotos_urls: proposal.amostras_enviadas_fotos_urls || [],
                articulos_ids: proposal.amostras_enviadas_articulos_ids || []
            };
            
            // Asegurar que sean arrays
            if (!Array.isArray(amostrasEnviadas.fotos_urls)) {
                // Si es string, intentar parsear como JSON
                if (typeof amostrasEnviadas.fotos_urls === 'string') {
                    try {
                        amostrasEnviadas.fotos_urls = JSON.parse(amostrasEnviadas.fotos_urls);
                    } catch (e) {
                        amostrasEnviadas.fotos_urls = amostrasEnviadas.fotos_urls ? [amostrasEnviadas.fotos_urls] : [];
                    }
                } else {
                    amostrasEnviadas.fotos_urls = [];
                }
            }
            
            if (!Array.isArray(amostrasEnviadas.articulos_ids)) {
                // Si es string, intentar parsear como JSON
                if (typeof amostrasEnviadas.articulos_ids === 'string') {
                    try {
                        amostrasEnviadas.articulos_ids = JSON.parse(amostrasEnviadas.articulos_ids);
                    } catch (e) {
                        amostrasEnviadas.articulos_ids = amostrasEnviadas.articulos_ids ? [amostrasEnviadas.articulos_ids] : [];
                    }
                } else {
                    amostrasEnviadas.articulos_ids = [];
                }
            }
            
            console.log('✅ Datos de amostras enviadas procesados:', {
                fotos_urls: amostrasEnviadas.fotos_urls,
                cantidad_fotos: amostrasEnviadas.fotos_urls.length,
                articulos_ids: amostrasEnviadas.articulos_ids,
                cantidad_articulos: amostrasEnviadas.articulos_ids.length
            });
        } else {
            console.log('ℹ️ No hay datos de amostras enviadas para esta propuesta');
        }

        // Formatear fechas
        const fechaPropuesta = new Date(proposal.fecha_inicial);
        const fechaUltimaActualizacion = proposal.fecha_ultima_actualizacion ? 
            new Date(proposal.fecha_ultima_actualizacion) : null;

        const fechaFormateada = fechaPropuesta.toLocaleDateString(
            this.currentLanguage === 'es' ? 'es-ES' : 
            this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' }
        );

        const fechaActualizacionFormateada = fechaUltimaActualizacion ? 
            fechaUltimaActualizacion.toLocaleDateString(
                this.currentLanguage === 'es' ? 'es-ES' : 
                this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US',
                { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            ) : '-';

        // Calcular total
        const total = proposal.articulos.reduce((sum, art) => {
            return sum + (parseFloat(art.precio) || 0) * (parseInt(art.cantidad) || 0);
        }, 0);

        // Verificar si hay logos en los artículos
        const logos = proposal.articulos
            .filter(art => art.logo_url && art.logo_url.trim() !== '')
            .map(art => ({
                nombre: art.nombre_articulo || 'Sin nombre',
                logoUrl: art.logo_url,
                cantidad: art.cantidad || 0
            }));

        // Traducciones para los detalles
        const detailLabels = this.getDetailLabels();

        // Obtener stock actual de cada artículo para la columna Stock (reemplaza Total)
        let articulosWithStock = proposal.articulos.map(a => ({ articulo: a, stock: null }));
        if (this.supabase && proposal.articulos.length > 0) {
            const productIds = [...new Set(proposal.articulos.map(a => a.referencia_articulo).filter(Boolean))];
            let phcByRef = {};
            if (productIds.length > 0) {
                try {
                    const { data: prods } = await this.supabase.from('products').select('id, phc_ref').in('id', productIds);
                    (prods || []).forEach(p => { phcByRef[p.id] = p.phc_ref || null; });
                } catch (e) {}
            }
            articulosWithStock = await Promise.all(proposal.articulos.map(async (articulo) => {
                const phcRef = phcByRef[articulo.referencia_articulo] ?? this.allProducts?.find(p => String(p.id) === String(articulo.referencia_articulo))?.phc_ref;
                const stock = phcRef ? await this.getStockForProduct(phcRef) : null;
                return { articulo, stock };
            }));
        }

        // Construir HTML de follow-ups (escapar observaciones para evitar rotura del template)
        const locale = this.currentLanguage === 'es' ? 'es-ES' : this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US';
        let followUpsSectionHtml = `<p style="color: var(--text-secondary); font-size: 0.875rem;" id="no-follow-ups-${proposal.id}">${detailLabels.noFollowUps}</p>`;
        if (proposal.follow_ups && proposal.follow_ups.length > 0) {
            followUpsSectionHtml = proposal.follow_ups.map(fu => {
                const fechaFu = fu.fecha_follow_up ? new Date(fu.fecha_follow_up).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
                const fechaFuturo = fu.fecha_follow_up_futuro ? (typeof fu.fecha_follow_up_futuro === 'string' ? fu.fecha_follow_up_futuro.split('T')[0] : fu.fecha_follow_up_futuro) : '';
                const obsEscaped = (fu.observaciones || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                const url1 = (fu.foto_url_1 || '').replace(/"/g, '&quot;');
                const url2 = (fu.foto_url_2 || '').replace(/"/g, '&quot;');
                const slot1Html = url1
                    ? `<div class="follow-up-photo-slot" style="position:relative;display:inline-block;"><a href="${url1}" target="_blank" rel="noopener" style="display:block;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--bg-gray-200);"><img src="${url1}" alt="Foto 1" style="width:100%;height:100%;object-fit:cover;"></a><button type="button" onclick="window.proposalsManager.removeFollowUpPhoto('${proposal.id}','${fu.id}',1)" style="position:absolute;top:2px;right:2px;background:var(--danger-500,#ef4444);color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;"><i class="fas fa-times"></i></button></div>`
                    : `<label style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border:2px dashed var(--bg-gray-200);border-radius:8px;cursor:pointer;font-size:0.75rem;color:var(--text-secondary);"><input type="file" accept="image/*" id="fu-photo-${fu.id}-1" style="display:none;" onchange="window.proposalsManager.handleFollowUpPhotoInput('${proposal.id}','${fu.id}',1,event)"><i class="fas fa-plus" style="margin-right:4px;"></i>${detailLabels.addPhoto}</label>`;
                const slot2Html = url2
                    ? `<div class="follow-up-photo-slot" style="position:relative;display:inline-block;"><a href="${url2}" target="_blank" rel="noopener" style="display:block;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--bg-gray-200);"><img src="${url2}" alt="Foto 2" style="width:100%;height:100%;object-fit:cover;"></a><button type="button" onclick="window.proposalsManager.removeFollowUpPhoto('${proposal.id}','${fu.id}',2)" style="position:absolute;top:2px;right:2px;background:var(--danger-500,#ef4444);color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;"><i class="fas fa-times"></i></button></div>`
                    : `<label style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border:2px dashed var(--bg-gray-200);border-radius:8px;cursor:pointer;font-size:0.75rem;color:var(--text-secondary);"><input type="file" accept="image/*" id="fu-photo-${fu.id}-2" style="display:none;" onchange="window.proposalsManager.handleFollowUpPhotoInput('${proposal.id}','${fu.id}',2,event)"><i class="fas fa-plus" style="margin-right:4px;"></i>${detailLabels.addPhoto}</label>`;
                return `<div class="follow-up-item" data-follow-up-id="${fu.id}" style="padding: var(--space-4); margin-bottom: var(--space-3); background: var(--bg-white); border-radius: 8px; border: 1px solid var(--bg-gray-200);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                        <div style="flex: 1; min-width: 140px;">
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">${detailLabels.followUpDate}</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${fechaFu}</div>
                        </div>
                        <div style="flex: 2; min-width: 200px;">
                            <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">${detailLabels.observations}</label>
                            <div style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-200); border-radius: 6px; font-size: 0.875rem; background: var(--bg-gray-50, #f9fafb); color: var(--text-primary); min-height: 2.5rem;">${obsEscaped || '-'}</div>
                        </div>
                        <div style="min-width: 160px;">
                            <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">${detailLabels.futureFollowUpDate}</label>
                            <input type="date" id="follow-up-futuro-${fu.id}" value="${fechaFuturo}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-200); border-radius: 6px; font-size: 0.875rem; background: var(--bg-white); color: var(--text-primary);">
                        </div>
                        <button type="button" onclick="window.proposalsManager.saveFollowUpEntry('${proposal.id}', '${fu.id}')" style="
                            background: var(--primary-500);
                            color: var(--text-white);
                            border: none;
                            padding: 8px 14px;
                            border-radius: 6px;
                            font-size: 0.875rem;
                            font-weight: 500;
                            cursor: pointer;
                            align-self: flex-end;
                        "><i class="fas fa-save"></i> ${detailLabels.save}</button>
                    </div>
                    <div style="margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--bg-gray-200);">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">${detailLabels.followUpPhotos}</div>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                            ${slot1Html}
                            ${slot2Html}
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        content.innerHTML = `
            <div class="proposal-actions" style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn-edit-proposal" onclick="window.proposalsManager.editProposal('${proposal.id}')" style="
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-edit"></i> <span id="edit-proposal-text">${detailLabels.editProposal}</span>
                </button>
                <button class="btn-print-pdf" onclick="window.proposalsManager.printProposalPDF('${proposal.id}')" style="
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(239,68,68,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-file-pdf"></i> <span id="print-pdf-text">${detailLabels.printPDF}</span>
                </button>
                ${logos.length > 0 ? `
                <button class="btn-view-logos" onclick="window.proposalsManager.viewProposalLogos('${proposal.id}')" style="
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245,158,11,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-image"></i> <span id="view-logos-text">${this.currentLanguage === 'es' ? 'Ver Logotipos' : this.currentLanguage === 'pt' ? 'Ver Logotipos' : 'View Logos'} (${logos.length})</span>
                </button>
                ` : ''}
                ${proposal.dossier_documentos && proposal.dossier_documentos.length > 0 ? `
                <button class="btn-view-dossiers" onclick="window.proposalsManager.viewProposalDossiers('${proposal.id}')" style="
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(139,92,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-folder"></i> <span id="view-dossiers-text">${this.currentLanguage === 'es' ? 'Ver Dossiers' : this.currentLanguage === 'pt' ? 'Ver Dossiers' : 'View Dossiers'} (${proposal.dossier_documentos.length})</span>
                </button>
                ` : ''}
                ${window.cachedRole !== 'comercial' ? `
                <button class="btn-delete-proposal" onclick="window.proposalsManager.openDeleteConfirmModal('${proposal.id}')" style="
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(239,68,68,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-trash-alt"></i> <span id="delete-proposal-text">${detailLabels.deleteProposal}</span>
                </button>
                ` : ''}
            </div>
            <div class="proposal-details">
                <div class="detail-item" id="client-name-row-${proposal.id}">
                    <div class="detail-label">${detailLabels.client}</div>
                    <div id="client-name-display-${proposal.id}" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <div class="detail-value" id="client-name-value-${proposal.id}">${(proposal.nombre_cliente || '-').replace(/</g, '&lt;')}</div>
                        <button type="button" onclick="window.proposalsManager.toggleClientNameEdit('${proposal.id}')" style="
                            background: transparent;
                            color: var(--primary-500, #3b82f6);
                            border: none;
                            padding: 4px 8px;
                            font-size: 0.8rem;
                            cursor: pointer;
                            text-decoration: underline;
                        "><span id="edit-client-name-text">${detailLabels.editComments}</span></button>
                    </div>
                    <div id="client-name-edit-${proposal.id}" style="display: none; margin-top: 4px;">
                        <input type="text" id="client-name-input-${proposal.id}" value="${(proposal.nombre_cliente || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}" style="width: 100%; max-width: 280px; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem; margin-bottom: 8px;">
                        <div style="display: flex; gap: 8px;">
                            <button type="button" onclick="window.proposalsManager.cancelClientNameEdit('${proposal.id}')" style="background: var(--bg-gray-200); color: var(--text-primary); border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; cursor: pointer;">${detailLabels.cancel}</button>
                            <button type="button" onclick="window.proposalsManager.saveClientName('${proposal.id}')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; cursor: pointer;"><i class="fas fa-save"></i> ${detailLabels.save}</button>
                        </div>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">${detailLabels.commercial}</div>
                    <div class="detail-value">${proposal.nombre_comercial || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">${detailLabels.proposalDate}</div>
                    <div class="detail-value">${fechaFormateada}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">${detailLabels.modifications}</div>
                    <div class="detail-value">
                        <span onclick="window.proposalsManager.viewModificationsHistory('${proposal.id}')" style="
                            cursor: pointer;
                            color: var(--accent-500, #8b5cf6);
                            text-decoration: underline;
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                        " title="${detailLabels.clickToViewHistory}">
                            ${proposal.ediciones_propuesta?.length || 0}
                            <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
                        </span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">${detailLabels.total}</div>
                    <div class="detail-value">€${total.toFixed(2)}</div>
                </div>
                </div>
            
            <!-- Sección de Información Adicional -->
            <div class="additional-details-section" style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--bg-gray-50, #f9fafb); border-radius: var(--radius-lg, 12px); border: 1px solid var(--bg-gray-200, #e5e7eb);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #111827); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-info-circle"></i>
                        <span id="additional-details-title">Información Adicional</span>
                    </h4>
                    <button id="edit-additional-details-btn" onclick="window.proposalsManager.toggleAdditionalDetailsEdit('${proposal.id}')" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-edit"></i>
                        <span id="edit-additional-details-text">Editar</span>
                    </button>
                </div>
                
                <!-- Vista de solo lectura -->
                <div id="additional-details-display-${proposal.id}" style="display: block;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4);">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Nº Cliente</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.numero_cliente || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Tipo de Cliente</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.tipo_cliente || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">País</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.pais || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Responsável</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.responsavel || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Área de Negócio</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.area_negocio || '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Reposição</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.reposicao ? 'Sim' : 'Não'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Nº Factura Proforma</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.factura_proforma || '-'}</div>
                            ${proposal.fecha_factura_proforma ? `<div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-top: 2px;">${new Date(proposal.fecha_factura_proforma).toLocaleDateString('pt-PT')}</div>` : ''}
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Valor da Adjudicação</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.valor_adjudicacao ? '€' + parseFloat(proposal.valor_adjudicacao).toFixed(2) : '-'}</div>
                            ${proposal.fecha_adjudicacao ? `<div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-top: 2px;">${new Date(proposal.fecha_adjudicacao).toLocaleDateString('pt-PT')}</div>` : ''}
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Nº Guía de Preparação</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.numero_guia_preparacao || '-'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Vista de edición -->
                <div id="additional-details-edit-${proposal.id}" style="display: none;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4);">
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Nº Cliente</label>
                            <input type="text" id="numero-cliente-${proposal.id}" value="${proposal.numero_cliente || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Tipo de Cliente</label>
                            <select id="tipo-cliente-${proposal.id}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                                <option value="">Selecionar...</option>
                                <option value="A" ${proposal.tipo_cliente === 'A' || proposal.tipo_cliente === 'a' ? 'selected' : ''}>A</option>
                                <option value="B" ${proposal.tipo_cliente === 'B' || proposal.tipo_cliente === 'b' ? 'selected' : ''}>B</option>
                                <option value="C" ${proposal.tipo_cliente === 'C' || proposal.tipo_cliente === 'c' ? 'selected' : ''}>C</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">País</label>
                            <select id="pais-${proposal.id}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                                <option value="">Selecionar...</option>
                                <option value="Portugal" ${proposal.pais === 'Portugal' ? 'selected' : ''}>Portugal</option>
                                <option value="España" ${proposal.pais === 'España' ? 'selected' : ''}>España</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Responsável</label>
                            <select id="responsavel-${proposal.id}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                                <option value="">Selecionar...</option>
                                <option value="Sonia" ${proposal.responsavel === 'Sonia' ? 'selected' : ''}>Sonia</option>
                                <option value="Ana" ${proposal.responsavel === 'Ana' ? 'selected' : ''}>Ana</option>
                                <option value="Eduardo" ${proposal.responsavel === 'Eduardo' ? 'selected' : ''}>Eduardo</option>
                                <option value="Miguel" ${proposal.responsavel === 'Miguel' ? 'selected' : ''}>Miguel</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Área de Negócio</label>
                            <select id="area-negocio-${proposal.id}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                                <option value="">Selecionar...</option>
                                <option value="Accesorios personalizados" ${proposal.area_negocio === 'Accesorios personalizados' ? 'selected' : ''}>Accesorios personalizados</option>
                                <option value="Cosmetica personalizados" ${proposal.area_negocio === 'Cosmetica personalizados' ? 'selected' : ''}>Cosmetica personalizados</option>
                                <option value="Equipamiento" ${proposal.area_negocio === 'Equipamiento' ? 'selected' : ''}>Equipamiento</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Reposição</label>
                            <select id="reposicao-${proposal.id}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                                <option value="false" ${!proposal.reposicao ? 'selected' : ''}>Não</option>
                                <option value="true" ${proposal.reposicao ? 'selected' : ''}>Sim</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Nº Factura Proforma</label>
                            <input type="text" id="factura-proforma-${proposal.id}" value="${proposal.factura_proforma || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Data Factura Proforma</label>
                            <input type="date" id="fecha-factura-proforma-${proposal.id}" value="${proposal.fecha_factura_proforma ? proposal.fecha_factura_proforma.split('T')[0] : ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Valor da Adjudicação</label>
                            <input type="number" step="0.01" id="valor-adjudicacao-${proposal.id}" value="${proposal.valor_adjudicacao || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Data Adjudicação</label>
                            <input type="date" id="fecha-adjudicacao-${proposal.id}" value="${proposal.fecha_adjudicacao ? proposal.fecha_adjudicacao.split('T')[0] : ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Nº Guía de Preparação</label>
                            <input type="text" id="numero-guia-preparacao-${proposal.id}" value="${proposal.numero_guia_preparacao || ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--bg-gray-200, #e5e7eb); justify-content: flex-end;">
                        <button type="button" onclick="window.proposalsManager.cancelAdditionalDetailsEdit('${proposal.id}')" style="
                            background: var(--bg-gray-200, #e5e7eb);
                            color: var(--text-primary, #111827);
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                        " onmouseover="this.style.background='var(--bg-gray-300, #d1d5db)';" onmouseout="this.style.background='var(--bg-gray-200, #e5e7eb)';">
                            ${detailLabels.cancel}
                        </button>
                        <button type="button" onclick="window.proposalsManager.saveAdditionalDetails('${proposal.id}')" style="
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <i class="fas fa-save"></i> ${detailLabels.save}
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Sección Follow up -->
            <div class="follow-up-section" style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--bg-gray-50); border-radius: var(--radius-lg, 12px); border: 1px solid var(--bg-gray-200);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-calendar-check"></i>
                        <span id="follow-up-section-title">${detailLabels.followUpTitle}</span>
                    </h4>
                    <button type="button" onclick="window.proposalsManager.openAddFollowUpForm('${proposal.id}')" style="
                        background: var(--primary-500);
                        color: var(--text-white);
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--radius-md, 8px);
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    "><i class="fas fa-plus"></i> <span id="add-follow-up-btn-text">${detailLabels.addFollowUp}</span></button>
                </div>
                <div id="follow-up-list-${proposal.id}">
                    ${followUpsSectionHtml}
                </div>
                <div id="add-follow-up-form-${proposal.id}" style="display: none; padding: var(--space-4); margin-top: var(--space-3); background: var(--bg-white); border-radius: 8px; border: 1px dashed var(--bg-gray-200);">
                    <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">${detailLabels.followUpDate}</label>
                    <input type="date" id="new-follow-up-date-${proposal.id}" style="width: 100%; max-width: 200px; padding: 8px; border: 1px solid var(--bg-gray-200); border-radius: 6px; margin-bottom: 12px; background: var(--bg-white); color: var(--text-primary);">
                    <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">${detailLabels.observations}</label>
                    <textarea id="new-follow-up-observacoes-${proposal.id}" rows="3" placeholder="-" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-200); border-radius: 6px; margin-bottom: 12px; background: var(--bg-white); color: var(--text-primary); font-family: inherit; resize: vertical;" maxlength="2000"></textarea>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" onclick="window.proposalsManager.confirmAddFollowUp('${proposal.id}')" style="background: var(--primary-500); color: var(--text-white); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">${detailLabels.save}</button>
                        <button type="button" onclick="window.proposalsManager.cancelAddFollowUpForm('${proposal.id}')" style="background: var(--bg-gray-200); color: var(--text-primary); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">${detailLabels.cancel}</button>
                    </div>
                </div>
            </div>
            
            <!-- Sección de Procurement y Fornecedor -->
            <div class="procurement-section" style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--bg-gray-50, #f9fafb); border-radius: var(--radius-lg, 12px); border: 1px solid var(--bg-gray-200, #e5e7eb);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #111827); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-shopping-cart"></i>
                        <span id="procurement-title">Dados de Consulta a Fornecedores</span>
                    </h4>
                    <button id="edit-procurement-btn" onclick="window.proposalsManager.toggleProcurementEdit('${proposal.id}')" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-edit"></i>
                        <span id="edit-procurement-text">Editar</span>
                    </button>
                </div>
                
                <!-- Vista de solo lectura Procurement -->
                <div id="procurement-display-${proposal.id}" style="display: block;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4);">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Data Início Procurement</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.data_inicio_procurement ? new Date(proposal.data_inicio_procurement).toLocaleDateString('pt-PT') : '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Data Pedido Cotação Fornecedor</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.data_pedido_cotacao_fornecedor ? new Date(proposal.data_pedido_cotacao_fornecedor).toLocaleDateString('pt-PT') : '-'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary, #6b7280); margin-bottom: 4px;">Data Resposta Fornecedor</div>
                            <div style="font-weight: 600; color: var(--text-primary, #111827);">${proposal.data_resposta_fornecedor ? new Date(proposal.data_resposta_fornecedor).toLocaleDateString('pt-PT') : '-'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Vista de edición Procurement -->
                <div id="procurement-edit-${proposal.id}" style="display: none;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4);">
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Data Início Procurement</label>
                            <input type="date" id="data-inicio-procurement-${proposal.id}" value="${proposal.data_inicio_procurement ? proposal.data_inicio_procurement.split('T')[0] : ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Data Pedido Cotação Fornecedor</label>
                            <input type="date" id="data-pedido-cotacao-${proposal.id}" value="${proposal.data_pedido_cotacao_fornecedor ? proposal.data_pedido_cotacao_fornecedor.split('T')[0] : ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827); margin-bottom: 6px;">Data Resposta Fornecedor</label>
                            <input type="date" id="data-resposta-fornecedor-${proposal.id}" value="${proposal.data_resposta_fornecedor ? proposal.data_resposta_fornecedor.split('T')[0] : ''}" style="width: 100%; padding: 8px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--bg-gray-200, #e5e7eb); justify-content: flex-end;">
                        <button onclick="window.proposalsManager.cancelProcurementEdit('${proposal.id}')" style="
                            background: var(--bg-gray-200, #e5e7eb);
                            color: var(--text-primary, #111827);
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='var(--bg-gray-300, #d1d5db)';" onmouseout="this.style.background='var(--bg-gray-200, #e5e7eb)';">
                            Cancelar
                        </button>
                        <button onclick="window.proposalsManager.saveProcurementDetails('${proposal.id}')" style="
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sección ENCOMENDA -->
            ${proposal.articulos && proposal.articulos.some(a => a.encomendado === true || a.encomendado === 'true') ? `
            <div class="encomenda-section" style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--bg-gray-50, #f9fafb); border-radius: var(--radius-lg, 12px); border: 1px solid var(--bg-gray-200, #e5e7eb);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #111827); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-shipping-fast"></i>
                        <span>ENCOMENDA</span>
                    </h4>
                    <button id="save-encomenda-dates-btn" onclick="window.proposalsManager.saveEncomendaDates('${proposal.id}')" style="
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-save"></i>
                        <span>${this.currentLanguage === 'es' ? 'Guardar Fechas' : this.currentLanguage === 'pt' ? 'Guardar Datas' : 'Save Dates'}</span>
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                        <thead>
                            <tr style="background: var(--bg-gray-100, #f3f4f6); border-bottom: 2px solid var(--bg-gray-300, #d1d5db);">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary, #111827);">${this.currentLanguage === 'es' ? 'Producto' : this.currentLanguage === 'pt' ? 'Produto' : 'Product'}</th>
                                <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-primary, #111827);">${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary, #111827);">${this.currentLanguage === 'es' ? 'Número de Encomenda' : this.currentLanguage === 'pt' ? 'Número de Encomenda' : 'Order Number'}</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary, #111827);">${this.currentLanguage === 'es' ? 'Fecha de Encomenda' : this.currentLanguage === 'pt' ? 'Data de Encomenda' : 'Order Date'}</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary, #111827);">${this.currentLanguage === 'es' ? 'Fecha Prevista de Entrega' : this.currentLanguage === 'pt' ? 'Data Prevista de Entrega' : 'Expected Delivery Date'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${proposal.articulos
                                .filter(a => a.encomendado === true || a.encomendado === 'true')
                                .map((articulo, index) => {
                                    const fechaEncomenda = articulo.fecha_encomenda ? new Date(articulo.fecha_encomenda).toLocaleDateString('pt-PT') : '-';
                                    const fechaPrevista = articulo.fecha_prevista_entrega ? articulo.fecha_prevista_entrega.split('T')[0] : '';
                                    return `
                                <tr style="border-bottom: 1px solid var(--bg-gray-200, #e5e7eb);">
                                    <td style="padding: 12px; color: var(--text-primary, #111827);">
                                        <strong>${articulo.nombre_articulo || '-'}</strong>
                                        ${articulo.referencia_articulo ? `<br><span style="font-size: 0.75rem; color: var(--text-secondary, #6b7280);">Ref: ${articulo.referencia_articulo}</span>` : ''}
                                    </td>
                                    <td style="padding: 12px; color: var(--text-primary, #111827); font-weight: 500; text-align: center;">${articulo.cantidad_encomendada || articulo.cantidad || 0}</td>
                                    <td style="padding: 12px; color: var(--text-primary, #111827);">${articulo.numero_encomenda || '-'}</td>
                                    <td style="padding: 12px; color: var(--text-primary, #111827);">${fechaEncomenda}</td>
                                    <td style="padding: 12px;">
                                        <input type="date" 
                                               id="fecha-prevista-entrega-${articulo.id}" 
                                               value="${fechaPrevista}" 
                                               data-articulo-id="${articulo.id}"
                                               style="width: 100%; padding: 6px; border: 1px solid var(--bg-gray-300, #d1d5db); border-radius: 6px; font-size: 0.875rem; background: white;"
                                               placeholder="${this.currentLanguage === 'es' ? 'Seleccionar fecha' : this.currentLanguage === 'pt' ? 'Selecionar data' : 'Select date'}">
                                    </td>
                                </tr>
                            `;
                                }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <div class="comments-section" style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--bg-gray-50, #f9fafb); border-radius: var(--radius-lg, 12px); border: 1px solid var(--bg-gray-200, #e5e7eb);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #111827); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-comments"></i>
                        <span id="comments-title">${detailLabels.comments}</span>
                    </h4>
                    <button id="edit-comments-btn" onclick="window.proposalsManager.toggleCommentsEdit('${proposal.id}')" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-edit"></i>
                        <span id="edit-comments-text">${detailLabels.editComments}</span>
                    </button>
                </div>
                <div id="comments-display-${proposal.id}" style="display: block;">
                    <p style="color: var(--text-primary, #111827); white-space: pre-wrap; word-wrap: break-word; min-height: 40px; padding: var(--space-2);">
                        ${proposal.comentarios ? proposal.comentarios : `<span style="color: var(--text-secondary, #6b7280); font-style: italic;">${detailLabels.noComments}</span>`}
                    </p>
                </div>
                <div id="comments-edit-${proposal.id}" style="display: none;">
                    <textarea id="comments-textarea-${proposal.id}" style="
                        width: 100%;
                        min-height: 120px;
                        padding: var(--space-3);
                        border: 2px solid var(--bg-gray-300, #d1d5db);
                        border-radius: var(--radius-md, 8px);
                        font-family: inherit;
                        font-size: 0.9375rem;
                        color: #111827;
                        background: white;
                        resize: vertical;
                        transition: border-color 0.2s;
                    " onfocus="this.style.borderColor='#3b82f6';" onblur="this.style.borderColor='#d1d5db';" placeholder="${detailLabels.commentsPlaceholder}">${proposal.comentarios || ''}</textarea>
                    <div style="display: flex; gap: 8px; margin-top: var(--space-3); justify-content: flex-end;">
                        <button onclick="window.proposalsManager.cancelCommentsEdit('${proposal.id}')" style="
                            background: var(--bg-gray-200, #e5e7eb);
                            color: var(--text-primary, #111827);
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='var(--bg-gray-300, #d1d5db)';" onmouseout="this.style.background='var(--bg-gray-200, #e5e7eb)';">
                            ${detailLabels.cancel}
                        </button>
                        <button onclick="window.proposalsManager.saveComments('${proposal.id}')" style="
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <i class="fas fa-save"></i> ${detailLabels.save}
                        </button>
                    </div>
                </div>
            </div>

            ${(() => {
                const tieneAmostras = amostrasEnviadas && 
                                     amostrasEnviadas.fotos_urls && 
                                     Array.isArray(amostrasEnviadas.fotos_urls) && 
                                     amostrasEnviadas.fotos_urls.length > 0;
                console.log('🔍 Verificando si mostrar sección de amostras enviadas:', {
                    tieneAmostras,
                    amostrasEnviadas: !!amostrasEnviadas,
                    fotos_urls: amostrasEnviadas?.fotos_urls,
                    esArray: Array.isArray(amostrasEnviadas?.fotos_urls),
                    length: amostrasEnviadas?.fotos_urls?.length,
                    proposal_amostras_fotos: proposal.amostras_enviadas_fotos_urls,
                    proposal_amostras_articulos: proposal.amostras_enviadas_articulos_ids
                });
                return tieneAmostras;
            })() ? `
            <!-- Sección de Muestras Enviadas -->
            <div class="amostras-enviadas-section" style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--bg-gray-50, #f9fafb); border-radius: var(--radius-lg, 12px); border: 1px solid var(--bg-gray-200, #e5e7eb);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #111827); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-box-open" style="color: var(--primary-500, #3b82f6);"></i>
                        <span id="amostras-enviadas-title">${this.currentLanguage === 'es' ? 'Muestras Enviadas' : this.currentLanguage === 'pt' ? 'Amostras Enviadas' : 'Samples Sent'}</span>
                    </h4>
                    <button onclick="window.proposalsManager.openAddAmostrasPhotosModal('${proposal.id}')" style="
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-plus"></i>
                        <span id="add-more-photos-text">${this.currentLanguage === 'es' ? 'Agregar más fotos' : this.currentLanguage === 'pt' ? 'Adicionar mais fotos' : 'Add more photos'}</span>
                    </button>
                </div>
                <div style="margin-bottom: var(--space-3);">
                    <p style="color: var(--text-secondary, #6b7280); font-size: 0.875rem; margin-bottom: var(--space-3);">
                        ${this.currentLanguage === 'es' ? 
                            'Fotos de las muestras enviadas:' : 
                            this.currentLanguage === 'pt' ?
                            'Fotos das amostras enviadas:' :
                            'Photos of sent samples:'}
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-3);">
                        ${amostrasEnviadas.fotos_urls.map((fotoUrl, index) => `
                            <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid var(--bg-gray-300, #d1d5db); cursor: pointer; transition: transform 0.2s;" 
                                 onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" 
                                 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
                                 onclick="window.proposalsManager.showImageModal('${fotoUrl}', '${this.currentLanguage === 'es' ? 'Muestra Enviada' : this.currentLanguage === 'pt' ? 'Amostra Enviada' : 'Sample Sent'} - ${index + 1}')">
                                <img src="${fotoUrl}" alt="Muestra ${index + 1}" 
                                     style="width: 100%; height: 100%; object-fit: cover;"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div style="width: 100%; height: 100%; background: var(--bg-gray-200, #e5e7eb); display: none; align-items: center; justify-content: center;">
                                    <i class="fas fa-image" style="color: var(--text-muted, #6b7280); font-size: 2rem;"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${amostrasEnviadas.articulos_ids && amostrasEnviadas.articulos_ids.length > 0 ? `
                <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--bg-gray-200, #e5e7eb);">
                    <p style="color: var(--text-secondary, #6b7280); font-size: 0.875rem; margin-bottom: var(--space-2);">
                        ${this.currentLanguage === 'es' ? 
                            'Artículos enviados:' : 
                            this.currentLanguage === 'pt' ?
                            'Artigos enviados:' :
                            'Articles sent:'}
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
                        ${amostrasEnviadas.articulos_ids.map(articuloId => {
                            const articulo = proposal.articulos.find(a => (a.id || '').toString() === articuloId.toString());
                            return articulo ? `
                                <span style="
                                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                    color: white;
                                    padding: 6px 12px;
                                    border-radius: 16px;
                                    font-size: 0.875rem;
                                    font-weight: 500;
                                ">${articulo.nombre_articulo || 'Artículo'}</span>
                            ` : '';
                        }).filter(Boolean).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div class="articles-section">
                <h4 class="articles-title" id="articles-title">${detailLabels.articlesTitle}</h4>
                <table class="articles-table">
                    <thead>
                        <tr>
                            <th id="th-article-photo">${detailLabels.photo}</th>
                            <th id="th-article-name">${detailLabels.name}</th>
                            <th id="th-article-qty">${detailLabels.quantity}</th>
                            <th id="th-article-price">${detailLabels.unitPrice}</th>
                            <th id="th-article-total">${detailLabels.stock}</th>
                            <th id="th-article-delivery">${detailLabels.deliveryTime}</th>
                            <th id="th-article-personalization">${detailLabels.personalization}</th>
                            <th id="th-article-notes">${detailLabels.observations}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${articulosWithStock.map(({ articulo, stock }) => {
                            // Buscar la foto del producto usando la referencia
                            const producto = this.allProducts?.find(p => 
                                String(p.id) === String(articulo.referencia_articulo) || 
                                String(p.phc_ref) === String(articulo.referencia_articulo) ||
                                String(p.referencia_fornecedor) === String(articulo.referencia_articulo) ||
                                p.nombre === articulo.nombre_articulo
                            );
                            const rawFoto = producto?.foto || articulo.foto_articulo || null;
                            const fotoUrl = this.getProductImageUrl(rawFoto);
                            const qty = parseInt(articulo.cantidad) || 0;
                            const lang = this.currentLanguage || localStorage.getItem('language') || 'pt';
                            let stockText = '-';
                            let stockColor = 'var(--text-secondary, #9ca3af)';
                            if (stock !== null && stock !== undefined) {
                                if (stock >= qty) {
                                    stockText = lang === 'pt' ? 'Em stock' : lang === 'es' ? 'En stock' : 'In stock';
                                    stockColor = stock > 2 * qty ? '#10b981' : '#eab308';
                                } else if (stock > 0) {
                                    stockText = `${stock} ${lang === 'pt' ? 'em stock' : lang === 'es' ? 'en stock' : 'in stock'}`;
                                    stockColor = '#f59e0b';
                                } else {
                                    stockText = lang === 'pt' ? 'Sem stock' : lang === 'es' ? 'Sin stock' : 'No stock';
                                }
                            } else {
                                stockText = lang === 'pt' ? 'N/D' : lang === 'es' ? 'N/D' : 'N/A';
                            }
                            return `
                            <tr style="color: var(--text-primary, #f9fafb);">
                                <td style="text-align: center;">
                                    ${fotoUrl ? 
                                        `<img src="${fotoUrl}" alt="${articulo.nombre_articulo}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <div style="width: 50px; height: 50px; background: var(--bg-gray-200, #374151); border-radius: 6px; display: none; align-items: center; justify-content: center; margin: 0 auto;">
                                            <i class="fas fa-image" style="color: var(--text-muted, #6b7280); font-size: 1rem;"></i>
                                        </div>` :
                                        `<div style="width: 50px; height: 50px; background: var(--bg-gray-200, #374151); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                            <i class="fas fa-image" style="color: var(--text-muted, #6b7280); font-size: 1rem;"></i>
                                        </div>`
                                    }
                                </td>
                                <td style="color: var(--text-primary, #f9fafb); font-weight: 500;">${articulo.nombre_articulo || '-'}</td>
                                <td style="color: var(--text-primary, #f9fafb); text-align: center;">${articulo.cantidad || 0}</td>
                                <td style="color: var(--text-primary, #f9fafb);">${(() => {
                                    const precio = parseFloat(articulo.precio) || 0;
                                    // Si el precio es 0 y el usuario es comercial, mostrar "Sobre consulta"
                                    if (precio === 0 && window.cachedRole === 'comercial') {
                                        const translations = {
                                            'pt': 'Sobre consulta',
                                            'es': 'Sobre consulta',
                                            'en': 'On request'
                                        };
                                        const currentLang = this.currentLanguage || localStorage.getItem('language') || 'pt';
                                        return translations[currentLang] || translations['pt'];
                                    }
                                    return `€${precio.toFixed(2)}`;
                                })()}</td>
                                <td style="color: ${stockColor}; font-weight: 600;">${stockText}</td>
                                <td style="color: var(--text-primary, #f9fafb);">${articulo.plazo_entrega || '-'}</td>
                                <td>
                                    ${articulo.precio_personalizado ? 
                                        `<span style="
                                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                            color: white;
                                            padding: 4px 10px;
                                            border-radius: 12px;
                                            font-size: 0.8rem;
                                            font-weight: 600;
                                            white-space: nowrap;
                                        ">${articulo.tipo_personalizacion || 'Personalizado'}</span>` : 
                                        '<span style="color: var(--text-secondary, #9ca3af);">-</span>'
                                    }
                                </td>
                                <td style="color: var(--text-primary, #f9fafb); max-width: 200px; word-wrap: break-word;">${articulo.observaciones || '-'}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;

        modal.classList.add('active');
        this.updateTranslations();
    }

    editProposal(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Guardar información de la propuesta en localStorage para cargarla en el carrito
        const proposalData = {
            id: proposal.id,
            nombre_cliente: proposal.nombre_cliente,
            nombre_comercial: proposal.nombre_comercial,
            fecha_inicial: proposal.fecha_inicial,
            estado_propuesta: proposal.estado_propuesta,
            articulos: proposal.articulos || [],
            modo_200_plus: proposal.modo_200_plus || proposal.modo_200 || false
        };

        localStorage.setItem('editing_proposal', JSON.stringify(proposalData));
        
        // Redirigir a la página de presupuesto
        window.location.href = `carrito-compras.html?edit=${proposalId}`;
    }

    async printProposalPDF(proposalId) {
        console.log('🖨️ ========== INICIO printProposalPDF ==========');
        console.log('📋 proposalId:', proposalId);
        console.log('📋 allProposals count:', this.allProposals.length);
        
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('❌ ERROR: Propuesta no encontrada');
            console.error('   - proposalId buscado:', proposalId);
            console.error('   - IDs disponibles:', this.allProposals.map(p => p.id));
            const message = this.currentLanguage === 'es' ? 
                'Propuesta no encontrada' : 
                this.currentLanguage === 'pt' ?
                'Proposta não encontrada' :
                'Proposal not found';
            this.showNotification(message, 'error');
            return;
        }
        
        console.log('✅ Propuesta encontrada:', {
            id: proposal.id,
            nombre_cliente: proposal.nombre_cliente,
            codigo_propuesta: proposal.codigo_propuesta
        });

        try {
            // Verificar si carrito-compras.js está cargado
            console.log('🔍 Verificando si generateProposalPDFFromSavedProposal está disponible...');
            console.log('   - typeof generateProposalPDFFromSavedProposal:', typeof generateProposalPDFFromSavedProposal);
            console.log('   - window.jspdf disponible:', typeof window.jspdf !== 'undefined');
            console.log('   - Scripts en DOM:', Array.from(document.querySelectorAll('script[src*="carrito"]')).map(s => s.src));
            
            if (typeof generateProposalPDFFromSavedProposal === 'undefined') {
                console.warn('⚠️ generateProposalPDFFromSavedProposal no está disponible, intentando cargar...');
                
                // Esperar un momento por si el script aún se está cargando
                console.log('⏳ Esperando 500ms por si el script se está cargando...');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Verificar nuevamente después de esperar
                if (typeof generateProposalPDFFromSavedProposal !== 'undefined') {
                    console.log('✅ Función disponible después de esperar');
                } else {
                    console.warn('⚠️ Todavía no disponible, cargando script explícitamente...');
                // Cargar el script si no está disponible
                await this.loadCartManagerScript();
                    
                    // Esperar un poco más después de cargar
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Verificar nuevamente
                    if (typeof generateProposalPDFFromSavedProposal === 'undefined') {
                        console.error('❌ ERROR: generateProposalPDFFromSavedProposal aún no está disponible después de cargar');
                        console.error('   - Verificando funciones globales disponibles:');
                        console.error('   - generateProposalPDF:', typeof generateProposalPDF);
                        console.error('   - window.cartManager:', typeof window.cartManager);
                        throw new Error('No se pudo cargar la función generateProposalPDFFromSavedProposal. Verifica que carrito-compras.js esté cargado correctamente.');
                    }
                    console.log('✅ Script cargado exitosamente');
                }
            } else {
                console.log('✅ generateProposalPDFFromSavedProposal ya está disponible');
            }

            // Obtener el idioma actual
            const language = this.currentLanguage || 'pt';
            console.log('🌐 Idioma seleccionado:', language);

            // Mostrar notificación de carga
            const loadingMessage = this.currentLanguage === 'es' ? 
                'Generando PDF...' : 
                this.currentLanguage === 'pt' ?
                'Gerando PDF...' :
                'Generating PDF...';
            this.showNotification(loadingMessage, 'info');

            // Generar el PDF
            console.log('📄 Llamando a generateProposalPDFFromSavedProposal...');
            if (typeof generateProposalPDFFromSavedProposal !== 'undefined') {
                await generateProposalPDFFromSavedProposal(proposalId, language);
                
                console.log('✅ generateProposalPDFFromSavedProposal completado');
                const successMessage = this.currentLanguage === 'es' ? 
                    'PDF generado correctamente' : 
                    this.currentLanguage === 'pt' ?
                    'PDF gerado com sucesso' :
                    'PDF generated successfully';
                this.showNotification(successMessage, 'success');
            } else {
                throw new Error('Función de generación de PDF no disponible después de cargar script');
            }

        } catch (error) {
            console.error('❌ ERROR en printProposalPDF:', error);
            console.error('   - Tipo:', error.name);
            console.error('   - Mensaje:', error.message);
            console.error('   - Stack:', error.stack);
            const errorMessage = this.currentLanguage === 'es' ? 
                `Error al generar PDF: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao gerar PDF: ${error.message}` :
                `Error generating PDF: ${error.message}`;
            this.showNotification(errorMessage, 'error');
        }
        
        console.log('🏁 ========== FIN printProposalPDF ==========');
    }

    async loadCartManagerScript() {
        console.log('📥 loadCartManagerScript iniciado...');
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (typeof generateProposalPDFFromSavedProposal !== 'undefined') {
                console.log('✅ Función ya está disponible, no necesita cargar');
                resolve();
                return;
            }

            // Verificar si el script ya está en el DOM
            const existingScript = document.querySelector('script[src*="carrito-compras.js"]');
            console.log('🔍 Script existente en DOM:', existingScript ? existingScript.src : 'no encontrado');
            
            if (existingScript) {
                console.log('📋 Script ya está en DOM, esperando a que se cargue...');
                // Si el script ya está en el DOM pero la función no está disponible,
                // puede que haya un error en el script. Esperar un poco y verificar
                const checkInterval = setInterval(() => {
                    if (typeof generateProposalPDFFromSavedProposal !== 'undefined') {
                        clearInterval(checkInterval);
                        console.log('✅ Función disponible después de esperar');
                        resolve();
                    }
                }, 100);
                
                // Timeout después de 5 segundos
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (typeof generateProposalPDFFromSavedProposal === 'undefined') {
                        console.error('❌ Timeout: La función no se cargó después de 5 segundos');
                        console.error('   - Esto puede indicar un error en carrito-compras.js');
                        reject(new Error('Timeout: La función generateProposalPDFFromSavedProposal no se cargó. Verifica la consola para errores en carrito-compras.js'));
                    }
                }, 5000);
                
                // También verificar errores del script
                existingScript.onerror = () => {
                    clearInterval(checkInterval);
                    console.error('❌ Error cargando script existente');
                    reject(new Error('Error cargando carrito-compras.js'));
                };
                return;
            }

            // Cargar jsPDF primero si no está disponible
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                console.log('📦 Cargando jsPDF primero...');
                const jspdfScript = document.createElement('script');
                jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(jspdfScript);
                
                jspdfScript.onload = () => {
                    console.log('✅ jsPDF cargado, ahora cargando carrito-compras.js...');
                    // Cargar carrito-compras.js
                    const script = document.createElement('script');
                    script.src = 'carrito-compras.js';
                    script.onload = () => {
                        console.log('✅ carrito-compras.js cargado, verificando función...');
                        // Esperar un momento y verificar
                        setTimeout(() => {
                            if (typeof generateProposalPDFFromSavedProposal !== 'undefined') {
                                console.log('✅ Función disponible después de cargar');
                                resolve();
                            } else {
                                console.error('❌ Función no disponible después de cargar script');
                                reject(new Error('La función generateProposalPDFFromSavedProposal no está disponible después de cargar el script. Verifica errores en carrito-compras.js'));
                            }
                        }, 500);
                    };
                    script.onerror = () => {
                        console.error('❌ Error cargando carrito-compras.js');
                        reject(new Error('Error cargando carrito-compras.js'));
                    };
                    document.body.appendChild(script);
                };
                jspdfScript.onerror = () => {
                    console.error('❌ Error cargando jsPDF');
                    reject(new Error('Error cargando jsPDF'));
                };
            } else {
                console.log('📦 jsPDF ya disponible, cargando carrito-compras.js directamente...');
                // Cargar carrito-compras.js directamente
                const script = document.createElement('script');
                script.src = 'carrito-compras.js';
                script.onload = () => {
                    console.log('✅ carrito-compras.js cargado, verificando función...');
                    // Esperar un momento y verificar
                    setTimeout(() => {
                        if (typeof generateProposalPDFFromSavedProposal !== 'undefined') {
                            console.log('✅ Función disponible después de cargar');
                            resolve();
                        } else {
                            console.error('❌ Función no disponible después de cargar script');
                            reject(new Error('La función generateProposalPDFFromSavedProposal no está disponible después de cargar el script. Verifica errores en carrito-compras.js'));
                        }
                    }, 500);
                };
                script.onerror = () => {
                    console.error('❌ Error cargando carrito-compras.js');
                    reject(new Error('Error cargando carrito-compras.js'));
                };
                document.body.appendChild(script);
            }
        });
    }

    openDeleteConfirmModal(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Guardar el ID de la propuesta en el modal
        const modal = document.getElementById('deleteProposalConfirmModal');
        if (modal) {
            modal.setAttribute('data-proposal-id', proposalId);
        }

        // Traducciones
        const translations = {
            es: {
                confirmTitle: 'Confirmar Eliminación',
                confirmMessage: '¿Estás seguro de que deseas eliminar esta propuesta? Esta acción no se puede deshacer.',
                clientLabel: 'Cliente:',
                confirmButton: 'Eliminar',
                cancelButton: 'Cancelar'
            },
            pt: {
                confirmTitle: 'Confirmar Eliminação',
                confirmMessage: 'Tem certeza de que deseja eliminar esta proposta? Esta ação não pode ser desfeita.',
                clientLabel: 'Cliente:',
                confirmButton: 'Eliminar',
                cancelButton: 'Cancelar'
            },
            en: {
                confirmTitle: 'Confirm Deletion',
                confirmMessage: 'Are you sure you want to delete this proposal? This action cannot be undone.',
                clientLabel: 'Client:',
                confirmButton: 'Delete',
                cancelButton: 'Cancel'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        // Actualizar textos del modal
        const titleElement = document.getElementById('delete-confirm-title');
        const messageElement = document.getElementById('delete-confirm-message');
        const clientNameElement = document.getElementById('delete-confirm-client-name');
        const clientLabelElement = document.getElementById('delete-confirm-details');
        const cancelBtn = document.getElementById('delete-confirm-cancel-btn');
        const deleteBtn = document.getElementById('delete-confirm-delete-text');

        if (titleElement) titleElement.textContent = t.confirmTitle;
        if (messageElement) messageElement.textContent = t.confirmMessage;
        if (clientNameElement) clientNameElement.textContent = proposal.nombre_cliente || '-';
        if (clientLabelElement) clientLabelElement.innerHTML = `${t.clientLabel} <strong id="delete-confirm-client-name">${proposal.nombre_cliente || '-'}</strong>`;
        if (cancelBtn) cancelBtn.textContent = t.cancelButton;
        if (deleteBtn) deleteBtn.textContent = t.confirmButton;

        // Mostrar modal
        if (modal) {
            modal.style.display = 'flex';
            
            // Cerrar al hacer clic fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDeleteConfirmModal();
                }
            });
        }
    }

    closeDeleteConfirmModal() {
        const modal = document.getElementById('deleteProposalConfirmModal');
        if (modal) {
            modal.style.display = 'none';
            modal.removeAttribute('data-proposal-id');
        }
    }

    async confirmDeleteProposal() {
        const modal = document.getElementById('deleteProposalConfirmModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Traducciones para mensajes
        const translations = {
            es: {
                successMessage: 'Propuesta eliminada correctamente',
                errorMessage: 'Error al eliminar la propuesta'
            },
            pt: {
                successMessage: 'Proposta eliminada com sucesso',
                errorMessage: 'Erro ao eliminar a proposta'
            },
            en: {
                successMessage: 'Proposal deleted successfully',
                errorMessage: 'Error deleting proposal'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        // Cerrar modal
        this.closeDeleteConfirmModal();

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Eliminar el presupuesto (los artículos se eliminarán automáticamente por CASCADE)
            const { error } = await this.supabase
                .from('presupuestos')
                .delete()
                .eq('id', proposalId);

            if (error) {
                throw error;
            }

            // Eliminar también de las tablas de relación (por si acaso no hay CASCADE)
            await this.supabase
                .from('presupuestos_articulos_encomendados')
                .delete()
                .eq('presupuesto_id', proposalId);

            await this.supabase
                .from('presupuestos_articulos_concluidos')
                .delete()
                .eq('presupuesto_id', proposalId);

            // Mostrar mensaje de éxito
            this.showNotification(t.successMessage, 'success');

            // Recargar la lista de propuestas
            await this.loadProposals();

        } catch (error) {
            console.error('Error al eliminar propuesta:', error);
            const message = `${t.errorMessage}: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    setupEventListeners() {
        // Listener para cambios de idioma
        window.addEventListener('languageChanged', (event) => {
            const newLanguage = event.detail?.language || localStorage.getItem('language') || 'pt';
            if (this.currentLanguage !== newLanguage) {
                this.currentLanguage = newLanguage;
                console.log('🌐 Idioma actualizado en ProposalsManager:', this.currentLanguage);
                // Actualizar traducciones y volver a renderizar
                this.updateTranslations();
                this.renderProposals();
            }
        });
        
        // Filtros en tiempo real
        const searchClient = document.getElementById('searchClientInput');
        const searchCommercial = document.getElementById('searchCommercialInput');
        const filterDateFrom = document.getElementById('filterDateFrom');
        const filterDateTo = document.getElementById('filterDateTo');
        const filterStatus = document.getElementById('filterStatus');

        if (searchClient) {
            searchClient.addEventListener('input', () => this.applyFilters());
        }
        if (searchCommercial) {
            searchCommercial.addEventListener('input', () => this.applyFilters());
        }
        if (filterDateFrom) {
            filterDateFrom.addEventListener('change', () => this.applyFilters());
        }
        if (filterDateTo) {
            filterDateTo.addEventListener('change', () => this.applyFilters());
        }
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.applyFilters());
        }
    }

    applyFilters() {
        const searchClient = document.getElementById('searchClientInput')?.value.toLowerCase() || '';
        const searchCommercial = document.getElementById('searchCommercialInput')?.value.toLowerCase() || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value || '';
        const dateTo = document.getElementById('filterDateTo')?.value || '';
        const status = document.getElementById('filterStatus')?.value || '';

        this.filteredProposals = this.allProposals.filter(proposal => {
            // Filtro por cliente
            if (searchClient && !proposal.nombre_cliente?.toLowerCase().includes(searchClient)) {
                return false;
            }

            // Filtro por comercial
            if (searchCommercial && !proposal.nombre_comercial?.toLowerCase().includes(searchCommercial)) {
                return false;
            }

            // Filtro por fecha
            if (dateFrom) {
                const proposalDate = new Date(proposal.fecha_inicial);
                const fromDate = new Date(dateFrom);
                if (proposalDate < fromDate) {
                    return false;
                }
            }

            if (dateTo) {
                const proposalDate = new Date(proposal.fecha_inicial);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (proposalDate > toDate) {
                    return false;
                }
            }

            // Filtro por estado
            if (status) {
                const proposalStatus = (proposal.estado_propuesta || '').toLowerCase();
                const filterStatus = status.toLowerCase();
                // Comparación exacta primero, luego por coincidencia parcial para compatibilidad
                if (proposalStatus !== filterStatus && !proposalStatus.includes(filterStatus)) {
                    return false;
                }
            }

            return true;
        });

        this.renderProposals();
    }

    clearFilters() {
        document.getElementById('searchClientInput').value = '';
        document.getElementById('searchCommercialInput').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('filterStatus').value = '';
        this.filteredProposals = [...this.allProposals];
        this.renderProposals();
    }

    showError(message) {
        console.error(message);
        // Podrías mostrar una notificación aquí
    }

    applyFilters() {
        const searchClient = document.getElementById('searchClientInput')?.value.toLowerCase() || '';
        const searchCommercial = document.getElementById('searchCommercialInput')?.value.toLowerCase() || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value || '';
        const dateTo = document.getElementById('filterDateTo')?.value || '';
        const status = document.getElementById('filterStatus')?.value || '';

        this.filteredProposals = this.allProposals.filter(proposal => {
            // Filtro por cliente
            if (searchClient && !proposal.nombre_cliente?.toLowerCase().includes(searchClient)) {
                return false;
            }

            // Filtro por comercial
            if (searchCommercial && !proposal.nombre_comercial?.toLowerCase().includes(searchCommercial)) {
                return false;
            }

            // Filtro por fecha
            if (dateFrom) {
                const proposalDate = new Date(proposal.fecha_inicial);
                const fromDate = new Date(dateFrom);
                if (proposalDate < fromDate) {
                    return false;
                }
            }

            if (dateTo) {
                const proposalDate = new Date(proposal.fecha_inicial);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (proposalDate > toDate) {
                    return false;
                }
            }

            // Filtro por estado
            if (status) {
                const proposalStatus = (proposal.estado_propuesta || '').toLowerCase();
                const filterStatus = status.toLowerCase();
                // Comparación exacta primero, luego por coincidencia parcial para compatibilidad
                if (proposalStatus !== filterStatus && !proposalStatus.includes(filterStatus)) {
                    return false;
                }
            }

            return true;
        });

        this.renderProposals();
    }

    clearFilters() {
        document.getElementById('searchClientInput').value = '';
        document.getElementById('searchCommercialInput').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('filterStatus').value = '';
        this.filteredProposals = [...this.allProposals];
        this.renderProposals();
    }

    showError(message) {
        console.error(message);
        // Podrías mostrar una notificación aquí
    }

    updateTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Consultar Propostas',
                searchClient: 'Buscar por cliente...',
                searchCommercial: 'Buscar por comercial...',
                allStatuses: 'Todos os estados',
                applyFilters: 'Aplicar Filtros',
                clear: 'Limpar',
                loading: 'Carregando propostas...',
                noProposals: 'Não foram encontradas propostas',
                proposalNumber: 'Nº Proposta',
                startDate: 'Data Início',
                lastUpdate: 'Última Actualização',
                client: 'Cliente',
                commercial: 'Comercial',
                categories: 'Categorias',
                articles: 'Produtos',
                total: 'Total',
                status: 'Estado',
                actions: 'Ações',
                viewDetails: 'Ver Detalhes',
                proposalDetails: 'Detalhes da Proposta',
                articlesTitle: 'Artigos da Proposta',
                articlePhoto: 'Foto',
                articleName: 'Nome',
                articleQty: 'Quantidade',
                articlePrice: 'Preço Unit.',
                articleTotal: 'Total',
                stock: 'Stock',
                articleDelivery: 'Prazo de Entrega',
                articlePersonalization: 'Personalização',
                articleNotes: 'Observações',
                editProposal: 'Editar Proposta',
                editComments: 'Editar',
                deleteProposal: 'Eliminar'
            },
            es: {
                title: 'Consultar Propuestas',
                searchClient: 'Buscar por cliente...',
                searchCommercial: 'Buscar por comercial...',
                allStatuses: 'Todos los estados',
                applyFilters: 'Aplicar Filtros',
                clear: 'Limpiar',
                loading: 'Cargando propuestas...',
                noProposals: 'No se encontraron propuestas',
                proposalNumber: 'Nº Propuesta',
                startDate: 'Fecha Inicio',
                lastUpdate: 'Última Actualización',
                client: 'Cliente',
                commercial: 'Comercial',
                categories: 'Categorías',
                articles: 'Productos',
                total: 'Total',
                status: 'Estado',
                actions: 'Acciones',
                viewDetails: 'Ver Detalles',
                proposalDetails: 'Detalles de la Propuesta',
                articlesTitle: 'Artículos de la Propuesta',
                articlePhoto: 'Foto',
                articleName: 'Nombre',
                articleQty: 'Cantidad',
                articlePrice: 'Precio Unit.',
                articleTotal: 'Total',
                stock: 'Stock',
                articleDelivery: 'Plazo de Entrega',
                articlePersonalization: 'Personalización',
                articleNotes: 'Observaciones',
                editProposal: 'Editar Propuesta',
                editComments: 'Editar',
                deleteProposal: 'Eliminar'
            },
            en: {
                title: 'View Proposals',
                searchClient: 'Search by client...',
                searchCommercial: 'Search by commercial...',
                allStatuses: 'All statuses',
                applyFilters: 'Apply Filters',
                clear: 'Clear',
                loading: 'Loading proposals...',
                noProposals: 'No proposals found',
                proposalNumber: 'Proposal #',
                startDate: 'Start Date',
                lastUpdate: 'Last Update',
                client: 'Client',
                commercial: 'Commercial',
                categories: 'Categories',
                articles: 'Products',
                total: 'Total',
                status: 'Status',
                actions: 'Actions',
                viewDetails: 'View Details',
                proposalDetails: 'Proposal Details',
                articlesTitle: 'Proposal Articles',
                articlePhoto: 'Photo',
                articleName: 'Name',
                articleQty: 'Quantity',
                articlePrice: 'Unit Price',
                articleTotal: 'Total',
                stock: 'Stock',
                articleDelivery: 'Delivery Time',
                articlePersonalization: 'Personalization',
                articleNotes: 'Observations',
                editProposal: 'Edit Proposal',
                editComments: 'Edit',
                deleteProposal: 'Delete'
            }
        };

        const t = translations[lang] || translations.pt;

        // Actualizar textos
        const elements = {
            'proposals-page-title': t.title,
            'searchClientInput': { placeholder: t.searchClient },
            'searchCommercialInput': { placeholder: t.searchCommercial },
            'apply-filters-text': t.applyFilters,
            'clear-filters-text': t.clear,
            'loading-text': t.loading,
            'no-proposals-text': t.noProposals,
            'th-proposal-number': t.proposalNumber,
            'th-start-date': t.startDate,
            'th-last-update': t.lastUpdate,
            'th-client': t.client,
            'th-commercial': t.commercial,
            'th-categories': t.categories,
            'th-articles': t.articles,
            'th-total': t.total,
            'th-status': t.status,
            'th-actions': t.actions,
            'view-details-text': t.viewDetails,
            'delete-proposal-text': t.deleteProposal,
            'modal-title': t.proposalDetails,
            'articles-title': t.articlesTitle,
            'th-article-photo': t.articlePhoto,
            'th-article-name': t.articleName,
            'th-article-qty': t.articleQty,
            'th-article-price': t.articlePrice,
            'th-article-total': t.stock || t.articleTotal,
            'th-article-delivery': t.articleDelivery,
            'th-article-personalization': t.articlePersonalization,
            'th-article-notes': t.articleNotes,
            'edit-proposal-text': t.editProposal,
            'edit-client-name-text': t.editComments
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (value == null) return;
            if (typeof value === 'string') {
                el.textContent = value;
            } else if (typeof value === 'object') {
                Object.entries(value).forEach(([key, val]) => {
                    el[key] = val;
                });
            }
        });

        // Actualizar opciones del select de estado
        const statusSelect = document.getElementById('filterStatus');
        if (statusSelect) {
            const lang = this.currentLanguage;
            const statusOptions = {
                pt: {
                    all: 'Todos os estados',
                    propuesta_en_curso: 'Proposta em Curso',
                    propuesta_enviada: 'Proposta Enviada',
                    propuesta_en_edicion: 'Proposta em Edição',
                    muestra_pedida: 'Amostra Pedida',
                    amostra_enviada: 'Amostra Enviada',
                    aguarda_dossier: 'Aguarda Dossier',
                    aguarda_aprovacao_dossier: 'Aguarda Aprovação de Dossier',
                    aguarda_creacion_cliente: 'Aguarda Criação do Cliente',
                    aguarda_creacion_codigo_phc: 'Aguarda Criação de Código PHC',
                    aguarda_pagamento: 'Aguarda Pagamento',
                    follow_up: 'Follow up',
                    pedido_de_encomenda: 'Pedido de Encomenda',
                    encomenda_en_curso: 'Encomenda em Curso',
                    encomenda_concluida: 'Encomenda Concluída',
                    rejeitada: 'Rejeitada'
                },
                es: {
                    all: 'Todos los estados',
                    propuesta_en_curso: 'Propuesta en Curso',
                    propuesta_enviada: 'Propuesta Enviada',
                    propuesta_en_edicion: 'Propuesta en Edición',
                    muestra_pedida: 'Muestra Pedida',
                    amostra_enviada: 'Amostra Enviada',
                    aguarda_dossier: 'Aguarda Dossier',
                    aguarda_aprovacao_dossier: 'Aguarda Aprobación de Dossier',
                    aguarda_creacion_cliente: 'Aguarda Creación del Cliente',
                    aguarda_creacion_codigo_phc: 'Aguarda Creación de Código PHC',
                    aguarda_pagamento: 'Aguarda Pagamento',
                    follow_up: 'Follow up',
                    pedido_de_encomenda: 'Pedido de Encomenda',
                    encomenda_en_curso: 'Encomenda en Curso',
                    encomenda_concluida: 'Encomenda Concluída',
                    rejeitada: 'Rechazada'
                },
                en: {
                    all: 'All statuses',
                    propuesta_en_curso: 'Proposal in Progress',
                    propuesta_enviada: 'Proposal Sent',
                    propuesta_en_edicion: 'Proposal in Editing',
                    muestra_pedida: 'Sample Requested',
                    amostra_enviada: 'Sample Sent',
                    aguarda_dossier: 'Awaiting Dossier',
                    aguarda_aprovacao_dossier: 'Awaiting Dossier Approval',
                    aguarda_creacion_cliente: 'Awaiting Client Creation',
                    aguarda_creacion_codigo_phc: 'Awaiting PHC Code Creation',
                    aguarda_pagamento: 'Awaiting Payment',
                    follow_up: 'Follow up',
                    pedido_de_encomenda: 'Order Request',
                    encomenda_en_curso: 'Order in Progress',
                    encomenda_concluida: 'Order Completed',
                    rejeitada: 'Rejected'
                }
            };

            const statusT = statusOptions[lang] || statusOptions.pt;
            
            // Actualizar todas las opciones
            statusSelect.innerHTML = `
                <option value="">${statusT.all}</option>
                <option value="propuesta_en_curso">${statusT.propuesta_en_curso}</option>
                <option value="propuesta_enviada">${statusT.propuesta_enviada}</option>
                <option value="propuesta_en_edicion">${statusT.propuesta_en_edicion}</option>
                <option value="muestra_pedida">${statusT.muestra_pedida}</option>
                <option value="amostra_enviada">${statusT.amostra_enviada}</option>
                <option value="aguarda_dossier">${statusT.aguarda_dossier}</option>
                <option value="aguarda_aprovacao_dossier">${statusT.aguarda_aprovacao_dossier}</option>
                <option value="aguarda_creacion_cliente">${statusT.aguarda_creacion_cliente}</option>
                <option value="aguarda_creacion_codigo_phc">${statusT.aguarda_creacion_codigo_phc}</option>
                <option value="aguarda_pagamento">${statusT.aguarda_pagamento}</option>
                <option value="follow_up">${statusT.follow_up}</option>
                <option value="pedido_de_encomenda">${statusT.pedido_de_encomenda}</option>
                <option value="encomenda_en_curso">${statusT.encomenda_en_curso}</option>
                <option value="encomenda_concluida">${statusT.encomenda_concluida}</option>
                <option value="rejeitada">${statusT.rejeitada}</option>
            `;
        }
    }


    /**
     * Obtener etiquetas traducidas para los detalles de la propuesta
     */
    getDetailLabels() {
        const lang = this.currentLanguage;
        const labels = {
            pt: {
                client: 'Cliente',
                commercial: 'Comercial',
                proposalDate: 'Data da Proposta',
                status: 'Estado',
                changeStatus: 'Alterar estado...',
                lastUpdate: 'Última Atualização',
                modifications: 'Modificações',
                clickToViewHistory: 'Clique para ver histórico',
                total: 'Total',
                editProposal: 'Editar Proposta',
                printPDF: 'Imprimir PDF',
                viewHistory: 'Ver Modificações',
                viewStatusHistory: 'Ver alterações de estado',
                deleteProposal: 'Eliminar',
                articlesTitle: 'Artigos da Proposta',
                photo: 'Foto',
                name: 'Nome',
                quantity: 'Quantidade',
                unitPrice: 'Preço Unit.',
                totalPrice: 'Total',
                stock: 'Stock',
                deliveryTime: 'Prazo de Entrega',
                personalization: 'Personalização',
                observations: 'Observações',
                comments: 'Comentários',
                editComments: 'Editar',
                noComments: 'Nenhum comentário adicionado ainda.',
                commentsPlaceholder: 'Adicione comentários ou observações sobre esta proposta...',
                save: 'Guardar',
                cancel: 'Cancelar',
                followUpTitle: 'Follow up',
                followUpDate: 'Data follow up',
                futureFollowUpDate: 'Data follow up futuro',
                addFollowUp: 'Adicionar follow up',
                noFollowUps: 'Nenhum follow up registado.',
                followUpPhotos: 'Fotos',
                addPhoto: 'Adicionar foto',
                removePhoto: 'Remover'
            },
            es: {
                client: 'Cliente',
                commercial: 'Comercial',
                proposalDate: 'Fecha de Propuesta',
                status: 'Estado',
                changeStatus: 'Cambiar estado...',
                lastUpdate: 'Última Actualización',
                modifications: 'Modificaciones',
                clickToViewHistory: 'Click para ver historial',
                total: 'Total',
                editProposal: 'Editar Propuesta',
                printPDF: 'Imprimir PDF',
                viewHistory: 'Ver Modificaciones',
                viewStatusHistory: 'Ver cambios de estado',
                deleteProposal: 'Eliminar',
                articlesTitle: 'Artículos de la Propuesta',
                photo: 'Foto',
                name: 'Nombre',
                quantity: 'Cantidad',
                unitPrice: 'Precio Unit.',
                totalPrice: 'Total',
                stock: 'Stock',
                deliveryTime: 'Plazo de Entrega',
                personalization: 'Personalización',
                observations: 'Observaciones',
                comments: 'Comentarios',
                editComments: 'Editar',
                noComments: 'No se han agregado comentarios aún.',
                commentsPlaceholder: 'Agregue comentarios u observaciones sobre esta propuesta...',
                save: 'Guardar',
                cancel: 'Cancelar',
                followUpTitle: 'Follow up',
                followUpDate: 'Fecha follow up',
                futureFollowUpDate: 'Fecha follow up futuro',
                addFollowUp: 'Añadir follow up',
                noFollowUps: 'Ningún follow up registrado.',
                followUpPhotos: 'Fotos',
                addPhoto: 'Añadir foto',
                removePhoto: 'Quitar'
            },
            en: {
                client: 'Client',
                commercial: 'Commercial',
                proposalDate: 'Proposal Date',
                status: 'Status',
                changeStatus: 'Change status...',
                lastUpdate: 'Last Update',
                modifications: 'Modifications',
                clickToViewHistory: 'Click to view history',
                total: 'Total',
                editProposal: 'Edit Proposal',
                printPDF: 'Print PDF',
                viewHistory: 'View History',
                viewStatusHistory: 'View status changes',
                deleteProposal: 'Delete',
                articlesTitle: 'Proposal Articles',
                photo: 'Photo',
                name: 'Name',
                quantity: 'Quantity',
                unitPrice: 'Unit Price',
                totalPrice: 'Total',
                stock: 'Stock',
                deliveryTime: 'Delivery Time',
                personalization: 'Personalization',
                observations: 'Observations',
                comments: 'Comments',
                editComments: 'Edit',
                noComments: 'No comments added yet.',
                commentsPlaceholder: 'Add comments or observations about this proposal...',
                save: 'Save',
                cancel: 'Cancel',
                followUpTitle: 'Follow up',
                followUpDate: 'Follow up date',
                futureFollowUpDate: 'Future follow up date',
                addFollowUp: 'Add follow up',
                noFollowUps: 'No follow ups recorded.',
                followUpPhotos: 'Photos',
                addPhoto: 'Add photo',
                removePhoto: 'Remove'
            }
        };
        return labels[lang] || labels.pt;
    }

    async handleStatusChange(proposalId, newStatus) {
        if (!newStatus) {
            return;
        }

        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Normalizar el estado para manejar variaciones (muestra_pedida -> amostra_pedida)
        const normalizedStatus = this.normalizeStatusValue(newStatus);

        // Manejar diferentes estados con sus modales/formularios específicos
        // NO resetear el select aquí porque el modal puede cancelarse
        if (normalizedStatus === 'amostra_pedida' || newStatus === 'muestra_pedida') {
            this.openAmostraPedidaModal(proposal);
        } else if (normalizedStatus === 'amostra_enviada' || newStatus === 'amostra_enviada') {
            this.openAmostraEnviadaModal(proposal);
        } else if (normalizedStatus === 'aguarda_aprovacao_dossier') {
            this.openAguardaAprovacaoDossierModal(proposal);
        } else if (normalizedStatus === 'aguarda_pagamento') {
            this.openAguardaPagamentoModal(proposal);
        } else if (normalizedStatus === 'encomenda_en_curso') {
            this.openEncomendaEnCursoModal(proposal);
        } else if (normalizedStatus === 'pedido_de_encomenda') {
            this.openPedidoEncomendaModal(proposal);
        } else if (normalizedStatus === 'encomenda_concluida') {
            this.openEncomendaConcluidaModal(proposal);
        } else if (normalizedStatus === 'rejeitada') {
            this.openRejeitadaModal(proposal);
        } else {
            // Para otros estados, cambiar directamente
            await this.updateProposalStatus(proposalId, normalizedStatus);
            // Solo resetear el select después de actualizar el estado exitosamente
            this.resetStatusSelects(proposalId);
        }
    }

    /**
     * Normalizar valor de estado para manejar variaciones
     */
    normalizeStatusValue(status) {
        if (!status) return status;
        const statusLower = status.toLowerCase();
        // Mapear variaciones a valores consistentes
        if (statusLower === 'muestra_pedida' || statusLower === 'amostra_pedida') return 'amostra_pedida';
        if (statusLower === 'muestra_entregada' || statusLower === 'amostra_enviada') return 'amostra_enviada';
        if (statusLower === 'follow_up' || statusLower.includes('follow up')) return 'follow_up';
        return status;
    }

    /**
     * Resetear los selects de estado (usar después de confirmar o cancelar)
     */
    resetStatusSelects(proposalId) {
        const select = document.getElementById(`status-select-${proposalId}`);
        if (select) {
            select.value = '';
        }
        const selectInline = document.getElementById(`status-select-inline-${proposalId}`);
        if (selectInline) {
            // Restaurar el valor actual del estado de la propuesta
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                const currentStatus = this.normalizeStatusValue(proposal.estado_propuesta);
                selectInline.value = currentStatus || '';
            } else {
                selectInline.value = '';
            }
        }
    }

    openEncomendadoModal(proposal, isConcluida = false) {
        const modal = document.getElementById('changeStatusEncomendadoModal');
        const productsList = document.getElementById('encomendado-products-list');
        
        if (!modal || !productsList) {
            console.error('Modal elements not found');
            return;
        }

        // Guardar si es para "concluída"
        modal.setAttribute('data-is-concluida', isConcluida ? 'true' : 'false');

        // Limpiar lista anterior
        productsList.innerHTML = '';

        // Crear checkboxes para cada artículo
        proposal.articulos.forEach((articulo, index) => {
            const item = document.createElement('div');
            item.className = 'product-checkbox-item';
            // Usar el ID del artículo de la base de datos
            const articuloId = articulo.id || `temp-${index}`;
            // Marcar checkbox si el artículo ya está encomendado
            const isChecked = articulo.encomendado === true || articulo.encomendado === 'true';
            item.innerHTML = `
                <input type="checkbox" id="product-${proposal.id}-${index}" value="${articuloId}" data-articulo-id="${articuloId}" ${isChecked ? 'checked' : ''}>
                <label for="product-${proposal.id}-${index}" style="flex: 1; cursor: pointer;">
                    <strong>${articulo.nombre_articulo || '-'}</strong> 
                    (Ref: ${articulo.referencia_articulo || '-'}) - 
                    ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: ${articulo.cantidad || 0}
                </label>
            `;
            productsList.appendChild(item);
        });

        // Obtener datos de encomenda de los artículos ya encomendados
        const encomendadosArticulos = proposal.articulos.filter(a => a.encomendado === true || a.encomendado === 'true');
        let fechaEncomenda = '';
        let numeroEncomenda = '';

        if (encomendadosArticulos.length > 0) {
            // Usar la fecha y número del primer artículo encomendado (deberían ser iguales para todos)
            const primerEncomendado = encomendadosArticulos[0];
            fechaEncomenda = primerEncomendado.fecha_encomenda || '';
            numeroEncomenda = primerEncomendado.numero_encomenda || '';
        }

        // Limpiar o establecer inputs de números de encomenda
        const number1Input = document.getElementById('encomendado-number1-input');
        const number2Input = document.getElementById('encomendado-number2-input');
        const dateInput = document.getElementById('encomendado-date-input');
        
        if (number1Input) {
            // Si hay número de encomenda, separar por coma si tiene dos números
            if (numeroEncomenda) {
                const numeros = numeroEncomenda.split(',').map(n => n.trim());
                number1Input.value = numeros[0] || '';
                if (numeros.length > 1) {
                    number2Input.value = numeros[1] || '';
                } else {
                    number2Input.value = '';
                }
            } else {
            number1Input.value = '';
        }
        }
        if (number2Input && !numeroEncomenda) {
            number2Input.value = '';
        }
        if (dateInput) {
            // Usar fecha existente o establecer fecha por defecto como hoy
            dateInput.value = fechaEncomenda || new Date().toISOString().split('T')[0];
        }

        // Guardar el ID de la propuesta en el modal para usarlo al guardar
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones antes de mostrar el modal
        this.updateEncomendadoTranslations();

        // Mostrar modal
        modal.classList.add('active');
    }

    async openEncomendaConcluidaModal(proposal) {
        // Verificar el estado actual
        const currentStatus = (proposal.estado_propuesta || '').toLowerCase();
        const isFromEncomendado = currentStatus.includes('encomendado');
        
        // Verificar si ya tiene datos de encomenda (números y fecha)
        const hasEncomendaData = proposal.numeros_encomenda && proposal.data_encomenda;

        // Si viene de "encomendado" y ya tiene datos, solo cambiar el estado
        if (isFromEncomendado && hasEncomendaData) {
            await this.updateProposalStatus(proposal.id, 'encomenda_concluida');
        } else {
            // Si viene de otros estados (enviada, aguarda pagamento, aguarda aprovacao) 
            // o no tiene datos de encomenda, solo preguntar productos, sin números de encomenda
            // Esto es para casos donde tienen productos en stock y el cliente avanza solo con parte
            this.openEncomendaConcluidaProductsOnlyModal(proposal);
        }
    }

    /**
     * Abrir modal Pedido de Encomenda: listar productos de la propuesta con foto, PHC, fornecedor, cantidad;
     * si no tienen PHC, mostrar Referencia, Designação, Peso, Quantidade por caixa, Personalizado, Observaciones.
     */
    async openPedidoEncomendaModal(proposal) {
        const modal = document.getElementById('changeStatusPedidoEncomendaModal');
        const listEl = document.getElementById('pedido-encomenda-products-list');
        const subtitleEl = document.getElementById('pedido-encomenda-subtitle');
        if (!modal || !listEl) return;

        const lang = this.currentLanguage || 'pt';
        const t = {
            pt: { subtitle: 'Indique a quantidade a encomendar por produto. Produtos sem número PHC: preencha Referência, Designação, Peso, etc.', photo: 'Foto', phc: 'Nº PHC', fornecedor: 'Fornecedor', qty: 'Quantidade a encomendar', ref: 'Referência', designacao: 'Designação', peso: 'Peso', qtyCaixa: 'Quantidade por caixa', personalizado: 'Personalizado', personalizadoSim: 'Sim', personalizadoNao: 'Não', observacoes: 'Observações (personalizado)', dossierSection: 'Dossier / Logotipo', associateDossier: 'Incluir dossier da proposta neste artigo', hasLogo: 'Este artigo tem logotipo' },
            es: { subtitle: 'Indique la cantidad a encomendar por producto. Productos sin número PHC: rellene Referencia, Designación, Peso, etc.', photo: 'Foto', phc: 'Nº PHC', fornecedor: 'Fornecedor', qty: 'Cantidad a encomendar', ref: 'Referencia', designacao: 'Designación', peso: 'Peso', qtyCaixa: 'Cantidad por caja', personalizado: 'Personalizado', personalizadoSim: 'Sí', personalizadoNao: 'No', observacoes: 'Observaciones (personalizado)', dossierSection: 'Dossier / Logotipo', associateDossier: 'Incluir dossier de la propuesta en este artículo', hasLogo: 'Este artículo tiene logotipo' },
            en: { subtitle: 'Enter quantity to order per product. Products without PHC number: fill Reference, Designation, Weight, etc.', photo: 'Photo', phc: 'PHC No.', fornecedor: 'Supplier', qty: 'Qty to order', ref: 'Reference', designacao: 'Designation', peso: 'Weight', qtyCaixa: 'Qty per box', personalizado: 'Custom', personalizadoSim: 'Yes', personalizadoNao: 'No', observacoes: 'Notes (custom)', dossierSection: 'Dossier / Logo', associateDossier: 'Include proposal dossier with this item', hasLogo: 'This item has a logo' }
        };
        const L = t[lang] || t.pt;
        if (subtitleEl) subtitleEl.textContent = L.subtitle;

        modal.setAttribute('data-proposal-id', proposal.id);
        listEl.innerHTML = '';

        const articulos = proposal.articulos || [];
        if (articulos.length === 0) {
            listEl.innerHTML = '<p style="padding: var(--space-4); color: var(--text-secondary);">' + (lang === 'es' ? 'No hay productos en esta propuesta.' : lang === 'en' ? 'No products in this proposal.' : 'Não há produtos nesta proposta.') + '</p>';
            modal.classList.add('active');
            return;
        }

        const productMap = {};
        if (this.allProducts && this.allProducts.length > 0) {
            this.allProducts.forEach(p => {
                if (p.id) productMap[p.id] = p;
                if (p.phc_ref) productMap[p.phc_ref] = p;
            });
        }

        articulos.forEach((articulo, index) => {
            const product = productMap[articulo.referencia_articulo] || this.allProducts?.find(p => String(p.id) === String(articulo.referencia_articulo)) || this.allProducts?.find(p => String(p.phc_ref) === String(articulo.referencia_articulo));
            const hasPhc = product && (product.phc_ref || '').toString().trim() !== '';
            const phcRef = (product && product.phc_ref) ? String(product.phc_ref) : '';
            const fornecedor = (product && product.nombre_fornecedor) ? String(product.nombre_fornecedor) : '-';
            const fotoUrl = (product && product.foto) ? product.foto : '';
            const articuloId = (articulo.id || `art-${index}`).toString().replace(/"/g, '');
            const nomeArt = (articulo.nombre_articulo || '-').replace(/</g, '&lt;').replace(/"/g, '&quot;');

            const extraFields = !hasPhc ? `
                <div class="pedido-encomenda-extra" style="margin-top: 10px; padding: 10px; background: var(--bg-gray-100); border-radius: 8px; display: grid; gap: 8px; grid-template-columns: 1fr 1fr;">
                    <div><label style="font-size: 0.75rem; color: var(--text-secondary);">${L.ref}</label><input type="text" id="ge-ref-${articuloId}" class="form-input" style="width:100%;padding:6px;" value="${(articulo.referencia_articulo || '').replace(/"/g, '&quot;')}" placeholder=""></div>
                    <div><label style="font-size: 0.75rem; color: var(--text-secondary);">${L.designacao}</label><input type="text" id="ge-designacao-${articuloId}" class="form-input" style="width:100%;padding:6px;" value="${nomeArt}" placeholder=""></div>
                    <div><label style="font-size: 0.75rem; color: var(--text-secondary);">${L.peso}</label><input type="text" id="ge-peso-${articuloId}" class="form-input" style="width:100%;padding:6px;" placeholder=""></div>
                    <div><label style="font-size: 0.75rem; color: var(--text-secondary);">${L.qtyCaixa}</label><input type="number" id="ge-qtycaixa-${articuloId}" class="form-input" style="width:100%;padding:6px;" min="0" placeholder=""></div>
                    <div style="grid-column: 1 / -1;"><label style="font-size: 0.75rem; color: var(--text-secondary);">${L.personalizado}</label><select id="ge-personalizado-${articuloId}" class="form-input" style="width:100%;padding:6px;"><option value="false">${L.personalizadoNao}</option><option value="true">${L.personalizadoSim}</option></select></div>
                    <div style="grid-column: 1 / -1;"><label style="font-size: 0.75rem; color: var(--text-secondary);">${L.observacoes}</label><textarea id="ge-obs-${articuloId}" class="form-input" style="width:100%;padding:6px;min-height:60px;" placeholder=""></textarea></div>
                </div>
            ` : '';

            const hasDossier = proposal.presupuesto_dossier_id && ((proposal.dossier_documentos && proposal.dossier_documentos.length) || 0) > 0;
            const hasLogo = articulo.logo_url && String(articulo.logo_url).trim() !== '';
            const dossierLogoBlock = (hasDossier || hasLogo) ? `
                <div class="pedido-encomenda-dossier-logo" style="margin-top: 10px; padding: 10px; background: var(--bg-gray-100); border-radius: 8px; border-left: 3px solid var(--primary, #3b82f6);">
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">${L.dossierSection}</div>
                    ${hasDossier ? `<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem;"><input type="checkbox" id="ge-dossier-${articuloId}" class="form-input"> ${L.associateDossier}</label>` : ''}
                    ${hasLogo ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;"><i class="fas fa-image"></i> ${L.hasLogo}</div>` : ''}
                </div>
            ` : '';

            const row = document.createElement('div');
            row.className = 'pedido-encomenda-row';
            row.style.cssText = 'display: flex; align-items: flex-start; gap: 16px; padding: 16px; border-bottom: 1px solid var(--bg-gray-200);';
            row.innerHTML = `
                <div style="flex-shrink: 0;">
                    ${fotoUrl ? `<img src="${fotoUrl.replace(/"/g, '&quot;')}" alt="" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; background: var(--bg-gray-100);">` : `<div style="width: 80px; height: 80px; background: var(--bg-gray-200); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);"><i class="fas fa-image"></i></div>`}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">${nomeArt}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">${L.phc}: ${hasPhc ? phcRef : (lang === 'es' ? 'Sin PHC' : lang === 'en' ? 'No PHC' : 'Sem PHC')}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">${L.fornecedor}: ${(fornecedor || '-').replace(/</g, '&lt;')}</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-size: 0.8rem; white-space: nowrap;">${L.qty}</label>
                        <input type="number" id="ge-qty-${articuloId}" class="form-input" min="1" value="${articulo.cantidad || 1}" style="width: 100px; padding: 6px;">
                    </div>
                    ${extraFields}
                    ${dossierLogoBlock}
                </div>
            `;
            listEl.appendChild(row);
        });

        modal.classList.add('active');
    }

    closePedidoEncomendaModal() {
        const modal = document.getElementById('changeStatusPedidoEncomendaModal');
        if (modal) modal.classList.remove('active');
        this.resetStatusSelects(modal?.getAttribute('data-proposal-id') || '');
    }

    async savePedidoEncomendaGestaoCompras() {
        const modal = document.getElementById('changeStatusPedidoEncomendaModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        if (!proposalId || !this.supabase) {
            this.showNotification(this.currentLanguage === 'es' ? 'Error: falta propuesta o conexión.' : this.currentLanguage === 'pt' ? 'Erro: falta proposta ou ligação.' : 'Error: missing proposal or connection.', 'error');
            return;
        }

        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal || !proposal.articulos || proposal.articulos.length === 0) {
            this.closePedidoEncomendaModal();
            return;
        }

        const rows = [];
        proposal.articulos.forEach((articulo, index) => {
            const articuloId = (articulo.id && articulo.id.toString()) ? articulo.id.toString() : `art-${index}`;
            const qtyEl = document.getElementById(`ge-qty-${articuloId}`);
            const quantidade = qtyEl ? (parseInt(qtyEl.value, 10) || 1) : (articulo.cantidad || 1);

            const product = this.allProducts?.find(p => String(p.id) === String(articulo.referencia_articulo)) || this.allProducts?.find(p => String(p.phc_ref) === String(articulo.referencia_articulo));
            const hasPhc = product && (product.phc_ref || '').toString().trim() !== '';

            const dossierCheckEl = document.getElementById(`ge-dossier-${articuloId}`);
            const associateDossier = dossierCheckEl ? dossierCheckEl.checked : false;

            const row = {
                presupuesto_id: proposalId,
                presupuesto_articulo_id: articulo.id || null,
                phc_ref: (product && product.phc_ref) ? String(product.phc_ref) : null,
                nome_fornecedor: (product && product.nombre_fornecedor) ? String(product.nombre_fornecedor) : null,
                foto_url: (product && product.foto) ? product.foto : null,
                quantidade_encomendar: quantidade,
                nome_articulo: articulo.nombre_articulo || null,
                presupuesto_dossier_id: (proposal.presupuesto_dossier_id && associateDossier) ? proposal.presupuesto_dossier_id : null,
                logo_url: (articulo.logo_url && String(articulo.logo_url).trim() !== '') ? String(articulo.logo_url).trim() : null
            };

            if (!hasPhc) {
                const refEl = document.getElementById(`ge-ref-${articuloId}`);
                const designacaoEl = document.getElementById(`ge-designacao-${articuloId}`);
                const pesoEl = document.getElementById(`ge-peso-${articuloId}`);
                const qtyCaixaEl = document.getElementById(`ge-qtycaixa-${articuloId}`);
                const personalizadoEl = document.getElementById(`ge-personalizado-${articuloId}`);
                const obsEl = document.getElementById(`ge-obs-${articuloId}`);
                row.referencia = refEl ? refEl.value.trim() || null : null;
                row.designacao = designacaoEl ? designacaoEl.value.trim() || null : null;
                row.peso = pesoEl ? pesoEl.value.trim() || null : null;
                row.quantidade_por_caixa = qtyCaixaEl && qtyCaixaEl.value !== '' ? parseInt(qtyCaixaEl.value, 10) : null;
                row.personalizado = personalizadoEl ? personalizadoEl.value === 'true' : false;
                row.personalizado_observacoes = obsEl ? obsEl.value.trim() || null : null;
            }

            rows.push(row);
        });

        try {
            await this.supabase.from('gestao_compras').delete().eq('presupuesto_id', proposalId);
            const { error: insErr } = await this.supabase.from('gestao_compras').insert(rows);
            if (insErr) throw insErr;
            await this.updateProposalStatus(proposalId, 'pedido_de_encomenda');
            this.resetStatusSelects(proposalId);
            this.closePedidoEncomendaModal();
            await this.loadProposals();
            this.showNotification(this.currentLanguage === 'es' ? 'Guardado en Gestão Compras.' : this.currentLanguage === 'pt' ? 'Guardado em Gestão Compras.' : 'Saved to Gestão Compras.', 'success');
        } catch (e) {
            console.error('Error savePedidoEncomendaGestaoCompras:', e);
            this.showNotification(e.message || 'Error al guardar', 'error');
        }
    }

    openEncomendaConcluidaProductsOnlyModal(proposal) {
        const modal = document.getElementById('changeStatusEncomendaConcluidaModal');
        const productsList = document.getElementById('concluida-products-list');
        
        if (!modal || !productsList) {
            console.error('Modal elements not found');
            return;
        }

        // Limpiar lista anterior
        productsList.innerHTML = '';

        // Crear checkboxes para cada artículo
        proposal.articulos.forEach((articulo, index) => {
            const item = document.createElement('div');
            item.className = 'product-checkbox-item';
            // Usar el ID del artículo de la base de datos
            const articuloId = articulo.id || `temp-${index}`;
            // Marcar checkbox si el artículo ya está concluido
            const isChecked = articulo.concluido === true || articulo.concluido === 'true';
            item.innerHTML = `
                <input type="checkbox" id="concluida-product-${proposal.id}-${index}" value="${articuloId}" data-articulo-id="${articuloId}" ${isChecked ? 'checked' : ''}>
                <label for="concluida-product-${proposal.id}-${index}" style="flex: 1; cursor: pointer;">
                    <strong>${articulo.nombre_articulo || '-'}</strong> 
                    (Ref: ${articulo.referencia_articulo || '-'}) - 
                    ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: ${articulo.cantidad || 0}
                </label>
            `;
            productsList.appendChild(item);
        });

        // Guardar el ID de la propuesta en el modal
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateEncomendaConcluidaTranslations();

        // Mostrar modal
        modal.classList.add('active');
    }

    async saveEncomendaConcluidaStatus() {
        const modal = document.getElementById('changeStatusEncomendaConcluidaModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Proposal not found');
            return;
        }

        // Obtener productos seleccionados
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        const selectedArticleIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-articulo-id'));

        if (selectedArticleIds.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'Debe seleccionar al menos un producto' : 
                this.currentLanguage === 'pt' ?
                'Deve selecionar pelo menos um produto' :
                'You must select at least one product';
            this.showNotification(message, 'error');
            return;
        }

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Actualizar estado
            await this.updateProposalStatus(proposalId, 'encomenda_concluida');

            // Eliminar productos concluídos anteriores para este presupuesto
            const { error: deleteError } = await this.supabase
                .from('presupuestos_articulos_concluidos')
                .delete()
                .eq('presupuesto_id', proposalId);

            if (deleteError) {
                console.warn('Error al eliminar productos concluídos anteriores:', deleteError);
            }

            // Guardar productos concluídos (con los que el cliente avanzó)
            if (selectedArticleIds.length > 0) {
                const concluidosData = selectedArticleIds.map(articleId => ({
                    presupuesto_id: proposalId,
                    articulo_id: articleId
                }));

                const { error: insertError } = await this.supabase
                    .from('presupuestos_articulos_concluidos')
                    .insert(concluidosData);

                if (insertError) {
                    console.warn('Error al guardar productos concluídos:', insertError);
                    // Si la tabla no existe, mostrar mensaje pero continuar
                    if (!insertError.message.includes('does not exist')) {
                        throw insertError;
                    }
                }
            }

            // Cerrar modal
            this.closeEncomendaConcluidaModal();

        } catch (error) {
            console.error('Error al guardar estado encomenda concluída:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    closeEncomendaConcluidaModal() {
        const modal = document.getElementById('changeStatusEncomendaConcluidaModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateEncomendaConcluidaTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Marcar como Encomenda Concluída',
                productsLabel: 'Selecione os produtos com os quais o cliente avançou:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Marcar como Encomenda Concluída',
                productsLabel: 'Seleccione los productos con los que el cliente avanzó:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Mark as Order Completed',
                productsLabel: 'Select the products the client advanced with:',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'concluida-modal-title': t.title,
            'concluida-products-label': t.productsLabel,
            'concluida-cancel-btn': t.cancel,
            'concluida-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    openRejeitadaModal(proposal) {
        const modal = document.getElementById('changeStatusRejeitadaModal');
        
        if (!modal) {
            console.error('Modal not found');
            return;
        }

        // Limpiar selecciones anteriores
        const radios = modal.querySelectorAll('input[name="rejeitada-reason"]');
        radios.forEach(radio => radio.checked = false);
        
        const otherInput = document.getElementById('rejeitada-other-input');
        if (otherInput) {
            otherInput.value = '';
        }
        
        const otherGroup = document.getElementById('rejeitada-other-reason-group');
        if (otherGroup) {
            otherGroup.style.display = 'none';
        }

        // Agregar listener para mostrar/ocultar campo "Outro"
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'outro') {
                    if (otherGroup) {
                        otherGroup.style.display = 'block';
                    }
                } else {
                    if (otherGroup) {
                        otherGroup.style.display = 'none';
                    }
                }
            });
        });

        // Guardar el ID de la propuesta en el modal
        modal.setAttribute('data-proposal-id', proposal.id);

        // Mostrar modal
        modal.classList.add('active');
        this.updateRejeitadaTranslations();
    }

    async updateProposalStatus(proposalId, newStatus, additionalData = {}) {
        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Obtener el estado anterior y el historial actual para el registro
            const proposal = this.allProposals.find(p => p.id === proposalId);
            const estadoAnterior = proposal?.estado_propuesta || 'desconocido';
            const historialActual = proposal?.historial_modificaciones || [];
            
            // Validar que no se intente volver a estados que ya se han usado
            const newStatusLower = (newStatus || '').toLowerCase();
            const isPropuestaEnCurso = newStatusLower === 'propuesta_en_curso' || newStatusLower === 'propuesta en curso';
            const isPropuestaEnviada = newStatusLower === 'propuesta_enviada' || newStatusLower === 'propuesta enviada';
            
            if (isPropuestaEnCurso && this.hasPassedThroughStatus(proposal, 'propuesta_en_curso')) {
                const message = this.currentLanguage === 'es' ? 
                    'No se puede volver al estado "Propuesta en Curso" una vez que se ha salido de él' : 
                    this.currentLanguage === 'pt' ?
                    'Não é possível voltar ao estado "Proposta em Curso" uma vez que saiu dele' :
                    'Cannot return to "Proposal in Progress" status once it has been left';
                this.showNotification(message, 'error');
                return;
            }
            
            if (isPropuestaEnviada && this.hasPassedThroughStatus(proposal, 'propuesta_enviada')) {
                const message = this.currentLanguage === 'es' ? 
                    'No se puede volver al estado "Propuesta Enviada" una vez que se ha salido de él' : 
                    this.currentLanguage === 'pt' ?
                    'Não é possível voltar ao estado "Proposta Enviada" uma vez que saiu dele' :
                    'Cannot return to "Proposal Sent" status once it has been left';
                this.showNotification(message, 'error');
                return;
            }

            // Obtener el nombre del usuario actual desde user_roles
            let currentUserName = 'Sistema';
            try {
                const user = await window.authManager?.getCurrentUser();
                if (user && this.supabase) {
                    const { data: userRoleData, error: roleError } = await this.supabase
                        .from('user_roles')
                        .select('Name')
                        .eq('user_id', user.id)
                        .single();
                    
                    if (!roleError && userRoleData && userRoleData.Name) {
                        currentUserName = userRoleData.Name;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al obtener nombre del usuario:', error);
                // Fallback a localStorage
                currentUserName = localStorage.getItem('commercial_name') || 'Sistema';
            }

            // Crear el nuevo registro de modificación para historial_modificaciones
            const descripcion = this.getStatusChangeDescription(estadoAnterior, newStatus, additionalData);
            const nuevoRegistro = {
                fecha: new Date().toISOString(),
                tipo: 'cambio_estado',
                descripcion: descripcion,
                usuario: currentUserName
            };
            const nuevoHistorial = [...historialActual, nuevoRegistro];

            const fechaCambio = new Date().toISOString();

            // Si el nuevo estado es "propuesta enviada", guardar la fecha de envío
            // (newStatusLower ya está declarado arriba)
            
            // Actualizar TODOS los artículos del presupuesto en la tabla única
            // (ya que cada artículo contiene la información del presupuesto)
            const updateData = {
                estado_propuesta: newStatus,
                historial_modificaciones: nuevoHistorial,
                fecha_ultima_actualizacion: fechaCambio,
                ...additionalData
            };

            // Si el estado cambia a "propuesta enviada", guardar la fecha de envío
            if (isPropuestaEnviada) {
                updateData.fecha_envio_propuesta = fechaCambio;
            }
            // Al pasar a Follow up: quitar flag de webhook 15d para que al volver a estar sin follow-up se reenvíe
            if (newStatusLower === 'follow_up') {
                updateData.webhook_15d_sent_at = null;
            }
            // Al salir de Follow up: quitar flag de webhook fecha futuro vencida
            const estadoAnteriorLower = (estadoAnterior || '').toLowerCase();
            if ((estadoAnteriorLower === 'follow_up' || estadoAnteriorLower.includes('follow up')) && newStatusLower !== 'follow_up') {
                updateData.webhook_future_fu_sent_at = null;
            }

            const { error } = await this.supabase
                .from('presupuestos')
                .update(updateData)
                .eq('id', proposalId);

            if (error) {
                throw error;
            }

            // Si el estado cambia a "Follow up", crear el primer registro de follow-up si no existe ninguno
            if (newStatusLower === 'follow_up') {
                const followUps = proposal.follow_ups || [];
                if (followUps.length === 0) {
                    const today = new Date().toISOString().split('T')[0];
                    await this.supabase.from('presupuestos_follow_ups').insert({
                        presupuesto_id: proposalId,
                        fecha_follow_up: today,
                        observaciones: null,
                        fecha_follow_up_futuro: null
                    });
                }
            }

            console.log('✅ Estado y historial actualizados en todos los artículos del presupuesto');

            // Recargar propuestas
            await this.loadProposals();

            const message = this.currentLanguage === 'es' ? 
                'Estado actualizado correctamente' : 
                this.currentLanguage === 'pt' ?
                'Estado atualizado com sucesso' :
                'Status updated successfully';
            this.showNotification(message, 'success');

        } catch (error) {
            console.error('Error al actualizar estado:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al actualizar estado: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao atualizar estado: ${error.message}` :
                `Error updating status: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    /**
     * Obtener descripción del cambio de estado
     */
    getStatusChangeDescription(estadoAnterior, nuevoEstado, additionalData) {
        const statusNames = {
            'propuesta_en_curso': { es: 'Propuesta en Curso', pt: 'Proposta em Curso', en: 'Proposal in Progress' },
            'propuesta_enviada': { es: 'Propuesta Enviada', pt: 'Proposta Enviada', en: 'Proposal Sent' },
            'propuesta_en_edicion': { es: 'Propuesta en Edición', pt: 'Proposta em Edição', en: 'Proposal in Editing' },
            'muestra_pedida': { es: 'Muestra Pedida', pt: 'Amostra Pedida', en: 'Sample Requested' },
            'muestra_entregada': { es: 'Muestra Entregada', pt: 'Amostra Entregue', en: 'Sample Delivered' },
            'aguarda_dossier': { es: 'Aguarda Dossier', pt: 'Aguarda Dossier', en: 'Awaiting Dossier' },
            'aguarda_aprovacao_dossier': { es: 'Aguarda Aprobación de Dossier', pt: 'Aguarda Aprovação de Dossier', en: 'Awaiting Dossier Approval' },
            'aguarda_creacion_cliente': { es: 'Aguarda Creación del Cliente', pt: 'Aguarda Criação do Cliente', en: 'Awaiting Client Creation' },
            'aguarda_creacion_codigo_phc': { es: 'Aguarda Creación de Código PHC', pt: 'Aguarda Criação de Código PHC', en: 'Awaiting PHC Code Creation' },
            'aguarda_pagamento': { es: 'Aguarda Pagamento', pt: 'Aguarda Pagamento', en: 'Awaiting Payment' },
            'encomenda_en_curso': { es: 'Encomenda en Curso', pt: 'Encomenda em Curso', en: 'Order in Progress' },
            'encomenda_concluida': { es: 'Encomenda Concluída', pt: 'Encomenda Concluída', en: 'Order Completed' },
            'rejeitada': { es: 'Rechazada', pt: 'Rejeitada', en: 'Rejected' },
            'follow_up': { es: 'Follow up', pt: 'Follow up', en: 'Follow up' },
            // Compatibilidad con estados antiguos
            'propuesta enviada': { es: 'Propuesta Enviada', pt: 'Proposta Enviada', en: 'Proposal Sent' },
            'aguarda_aprovacao': { es: 'Aguarda Aprobación de Dossier', pt: 'Aguarda Aprovação de Dossier', en: 'Awaiting Dossier Approval' },
            'encomendado': { es: 'Encomendado', pt: 'Encomendado', en: 'Ordered' }
        };

        const lang = this.currentLanguage;
        const anteriorName = statusNames[estadoAnterior]?.[lang] || this.getStatusText(estadoAnterior);
        const nuevoName = statusNames[nuevoEstado]?.[lang] || this.getStatusText(nuevoEstado);

        let descripcion = lang === 'es' ? 
            `Estado cambiado de "${anteriorName}" a "${nuevoName}"` :
            lang === 'pt' ?
            `Estado alterado de "${anteriorName}" para "${nuevoName}"` :
            `Status changed from "${anteriorName}" to "${nuevoName}"`;

        // Agregar información adicional si existe
        if (additionalData.numeros_encomenda) {
            descripcion += lang === 'es' ? 
                `. Número(s) de pedido: ${additionalData.numeros_encomenda}` :
                lang === 'pt' ?
                `. Número(s) de encomenda: ${additionalData.numeros_encomenda}` :
                `. Order number(s): ${additionalData.numeros_encomenda}`;
        }

        if (additionalData.motivo_rechazo) {
            const motivo = additionalData.motivo_rechazo_otro || additionalData.motivo_rechazo;
            descripcion += lang === 'es' ? 
                `. Motivo: ${motivo}` :
                lang === 'pt' ?
                `. Motivo: ${motivo}` :
                `. Reason: ${motivo}`;
        }

        return descripcion;
    }

    /**
     * Registrar una modificación en el historial del presupuesto
     * @param {string} proposalId - ID del presupuesto
     * @param {string} tipo - Tipo de modificación (cambio_estado, producto_eliminado, cantidad_modificada, observacion_agregada, producto_agregado)
     * @param {string} descripcion - Descripción detallada del cambio
     */
    async registrarModificacion(proposalId, tipo, descripcion) {
        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Obtener el historial actual desde la base de datos
            const { data: proposalData, error: fetchError } = await this.supabase
                .from('presupuestos')
                .select('historial_modificaciones')
                .eq('id', proposalId)
                .single();

            if (fetchError) {
                console.warn('Error al obtener historial:', fetchError);
                return;
            }

            // Obtener proposal para fallback si es necesario
            const proposal = this.allProposals.find(p => p.id === proposalId);

            // Preparar el nuevo registro
            const nuevoRegistro = {
                fecha: new Date().toISOString(),
                tipo: tipo,
                descripcion: descripcion,
                usuario: localStorage.getItem('commercial_name') || 'Sistema'
            };

            // Agregar al historial existente o crear uno nuevo
            // Usar datos de la BD primero, luego fallback a proposal en memoria
            const historialActual = proposalData?.historial_modificaciones || proposal?.historial_modificaciones || [];
            const nuevoHistorial = [...historialActual, nuevoRegistro];

            // Actualizar el historial
            const { error: updateError } = await this.supabase
                .from('presupuestos')
                .update({ historial_modificaciones: nuevoHistorial })
                .eq('id', proposalId);

            if (updateError) {
                console.warn('Error al registrar modificación:', updateError);
            } else {
                console.log('✅ Modificación registrada:', nuevoRegistro);
            }
        } catch (error) {
            console.error('Error en registrarModificacion:', error);
        }
    }

    /**
     * Ver logotipos de la propuesta
     */
    viewProposalLogos(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Obtener logos de los artículos
        const logos = proposal.articulos
            .filter(art => art.logo_url && art.logo_url.trim() !== '')
            .map(art => ({
                nombre: art.nombre_articulo || 'Sin nombre',
                logoUrl: art.logo_url,
                cantidad: art.cantidad || 0,
                referencia: art.referencia_articulo || '-'
            }));

        if (logos.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'No hay logotipos en esta propuesta' : 
                this.currentLanguage === 'pt' ?
                'Não há logotipos nesta proposta' :
                'No logos in this proposal';
            this.showNotification(message, 'info');
            return;
        }

        const modal = document.getElementById('proposalLogosModal');
        const content = document.getElementById('proposalLogosContent');
        const title = document.getElementById('logos-modal-title');

        if (!modal || !content) {
            console.error('Modal de logos no encontrado');
            return;
        }

        // Traducciones
        const translations = {
            es: {
                title: 'Logotipos de la Propuesta',
                product: 'Producto',
                quantity: 'Cantidad',
                reference: 'Referencia',
                close: 'Cerrar'
            },
            pt: {
                title: 'Logotipos da Proposta',
                product: 'Produto',
                quantity: 'Quantidade',
                reference: 'Referência',
                close: 'Fechar'
            },
            en: {
                title: 'Proposal Logos',
                product: 'Product',
                quantity: 'Quantity',
                reference: 'Reference',
                close: 'Close'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        if (title) {
            title.textContent = t.title;
        }

        // Función auxiliar para detectar si es PDF
        const isPDF = (url) => {
            if (!url) return false;
            const urlLower = url.toLowerCase();
            return urlLower.endsWith('.pdf') || 
                   urlLower.includes('.pdf?') || 
                   urlLower.includes('content-type=application/pdf') ||
                   urlLower.includes('type=pdf');
        };

        // Generar HTML con los logos
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; padding: 20px 0;">
                ${logos.map((logo, index) => {
                    const isPdfFile = isPDF(logo.logoUrl);
                    const viewPdfText = this.currentLanguage === 'es' ? 'Ver PDF' : 
                                       this.currentLanguage === 'pt' ? 'Ver PDF' : 
                                       'View PDF';
                    
                    return `
                    <div style="
                        background: var(--bg-secondary, #1f2937);
                        border: 1px solid var(--border-color, #374151);
                        border-radius: 12px;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                    ">
                        <div style="
                            width: 100%;
                            height: 200px;
                            background: white;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                            border: 2px solid var(--border-color, #374151);
                            position: relative;
                        ">
                            ${isPdfFile ? `
                                <div style="text-align: center; padding: 20px; width: 100%;">
                                    <i class="fas fa-file-pdf" style="font-size: 3rem; color: #ef4444; margin-bottom: 10px;"></i>
                                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">PDF</div>
                                    <a href="${logo.logoUrl}" target="_blank" rel="noopener noreferrer" style="
                                        color: #3b82f6;
                                        text-decoration: none;
                                        padding: 8px 16px;
                                        background: #3b82f6;
                                        color: white;
                                        border-radius: 6px;
                                        display: inline-block;
                                        font-weight: 600;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">${viewPdfText}</a>
                                </div>
                            ` : `
                                <img src="${(logo.logoUrl || '').replace(/"/g, '&quot;')}" 
                                     alt="${(logo.nombre || '').replace(/"/g, '&quot;')}" 
                                     style="
                                         max-width: 100%;
                                         max-height: 100%;
                                         object-fit: contain;
                                         display: block;
                                     "
                                     onerror="
                                         var p = this.parentElement;
                                         if (p && !p.dataset.logoFallback) {
                                             p.dataset.logoFallback = '1';
                                             p.innerHTML = '<div style=\\'text-align: center; padding: 20px; width: 100%;\\'><i class=\\'fas fa-image\\' style=\\'font-size: 3rem; color: #6b7280; margin-bottom: 10px;\\'></i><div style=\\'color: #1f2937; font-size: 0.875rem;\\'>Imagen no disponible</div></div>';
                                         }
                                     ">
                            `}
                        </div>
                        <div style="width: 100%; text-align: center;">
                            <div style="
                                font-weight: 600;
                                color: var(--text-primary, #f9fafb);
                                margin-bottom: 8px;
                                font-size: 0.9rem;
                                word-break: break-word;
                            ">${logo.nombre}</div>
                            <div style="
                                font-size: 0.75rem;
                                color: var(--text-secondary, #9ca3af);
                                display: flex;
                                justify-content: space-between;
                                gap: 8px;
                                flex-wrap: wrap;
                            ">
                                <span>${t.quantity}: <strong>${logo.cantidad}</strong></span>
                                <span>${t.reference}: <strong>${logo.referencia}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Ver dossiers de la propuesta
     */
    viewProposalDossiers(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Obtener documentos del dossier
        const documentos = proposal.dossier_documentos || [];

        if (documentos.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'No hay documentos en el dossier de esta propuesta' : 
                this.currentLanguage === 'pt' ?
                'Não há documentos no dossier desta proposta' :
                'No documents in this proposal dossier';
            this.showNotification(message, 'info');
            return;
        }

        const modal = document.getElementById('proposalDossiersModal');
        const content = document.getElementById('proposalDossiersContent');
        const title = document.getElementById('dossiers-modal-title');

        if (!modal || !content) {
            console.error('Modal de dossiers no encontrado');
            return;
        }

        // Traducciones
        const translations = {
            es: {
                title: 'Documentos del Dossier',
                document: 'Documento',
                viewDocument: 'Ver Documento',
                viewPDF: 'Ver PDF',
                close: 'Cerrar'
            },
            pt: {
                title: 'Documentos do Dossier',
                document: 'Documento',
                viewDocument: 'Ver Documento',
                viewPDF: 'Ver PDF',
                close: 'Fechar'
            },
            en: {
                title: 'Dossier Documents',
                document: 'Document',
                viewDocument: 'View Document',
                viewPDF: 'View PDF',
                close: 'Close'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        if (title) {
            title.textContent = t.title;
        }

        // Función auxiliar para detectar si es PDF
        const isPDF = (url) => {
            if (!url) return false;
            const urlLower = url.toLowerCase();
            return urlLower.endsWith('.pdf') || 
                   urlLower.includes('.pdf?') || 
                   urlLower.includes('content-type=application/pdf') ||
                   urlLower.includes('type=pdf');
        };

        // Función auxiliar para detectar si es imagen
        const isImage = (url) => {
            if (!url) return false;
            const urlLower = url.toLowerCase();
            return urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i);
        };

        // Generar HTML con los documentos
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; padding: 20px 0;">
                ${documentos.map((docUrl, index) => {
                    const isPdfFile = isPDF(docUrl);
                    const isImgFile = isImage(docUrl);
                    const viewPdfText = t.viewPDF;
                    const viewDocText = t.viewDocument;
                    
                    return `
                    <div style="
                        background: var(--bg-secondary, #1f2937);
                        border: 1px solid var(--border-color, #374151);
                        border-radius: 12px;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                    ">
                        <div style="
                            width: 100%;
                            height: 200px;
                            background: white;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                            border: 2px solid var(--border-color, #374151);
                            position: relative;
                        ">
                            ${isPdfFile ? `
                                <div style="text-align: center; padding: 20px; width: 100%;">
                                    <i class="fas fa-file-pdf" style="font-size: 3rem; color: #ef4444; margin-bottom: 10px;"></i>
                                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">PDF</div>
                                    <a href="${docUrl}" target="_blank" rel="noopener noreferrer" style="
                                        color: #3b82f6;
                                        text-decoration: none;
                                        padding: 8px 16px;
                                        background: #3b82f6;
                                        color: white;
                                        border-radius: 6px;
                                        display: inline-block;
                                        font-weight: 600;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">${viewPdfText}</a>
                                </div>
                            ` : isImgFile ? `
                                <img src="${docUrl}" 
                                     alt="${t.document} ${index + 1}" 
                                     style="
                                         max-width: 100%;
                                         max-height: 100%;
                                         object-fit: contain;
                                         display: block;
                                     "
                                     onerror="
                                         const parent = this.parentElement;
                                         parent.innerHTML = '<div style=\\'text-align: center; padding: 20px; width: 100%;\\'><i class=\\'fas fa-file\\' style=\\'font-size: 3rem; color: #6b7280; margin-bottom: 10px;\\'></i><div style=\\'color: #1f2937; font-size: 0.875rem;\\'>Imagen no disponible</div><a href=\\'${docUrl}\\' target=\\'_blank\\' rel=\\'noopener noreferrer\\' style=\\'color: #3b82f6; text-decoration: none; margin-top: 10px; display: inline-block;\\'>Abrir enlace</a></div>';
                                         console.error('Error cargando documento:', '${docUrl}');
                                     ">
                            ` : `
                                <div style="text-align: center; padding: 20px; width: 100%;">
                                    <i class="fas fa-file" style="font-size: 3rem; color: #6b7280; margin-bottom: 10px;"></i>
                                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">${t.document}</div>
                                    <a href="${docUrl}" target="_blank" rel="noopener noreferrer" style="
                                        color: #3b82f6;
                                        text-decoration: none;
                                        padding: 8px 16px;
                                        background: #3b82f6;
                                        color: white;
                                        border-radius: 6px;
                                        display: inline-block;
                                        font-weight: 600;
                                        transition: all 0.2s;
                                    " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">${viewDocText}</a>
                                </div>
                            `}
                        </div>
                        <div style="width: 100%; text-align: center;">
                            <div style="
                                font-weight: 600;
                                color: var(--text-primary, #f9fafb);
                                margin-bottom: 8px;
                                font-size: 0.9rem;
                                word-break: break-word;
                            ">${t.document} ${index + 1}</div>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Ver historial de modificaciones de un presupuesto
     */
    viewModificationsHistory(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Solo mostrar ediciones de propuesta (no cambios de estado)
        const ediciones = proposal.ediciones_propuesta || [];
        const todosLosRegistros = ediciones.map(r => ({ ...r, tipo: 'edicion_propuesta', fuente: 'ediciones' }));
        
        // Crear el modal si no existe
        let modal = document.getElementById('modificationsHistoryModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modificationsHistoryModal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            `;
            modal.innerHTML = `
                <div style="
                    background: var(--bg-primary, #111827);
                    border-radius: 16px;
                    max-width: 700px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--border-color, #374151);
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid var(--border-color, #374151);
                    ">
                        <h2 id="modifications-modal-title" style="margin: 0; font-size: 1.25rem; color: var(--text-primary, #f9fafb);">Historial de Modificaciones</h2>
                        <button onclick="window.proposalsManager.closeModificationsModal()" style="
                            background: transparent;
                            border: 2px solid var(--border-color, #374151);
                            color: var(--text-primary, #f9fafb);
                            width: 36px;
                            height: 36px;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1rem;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='var(--bg-hover, #374151)'" onmouseout="this.style.background='transparent'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="modifications-history-content" style="
                        padding: 24px;
                        overflow-y: auto;
                        max-height: calc(80vh - 80px);
                    ">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Cerrar al hacer clic fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModificationsModal();
                }
            });
        }

        // Traducciones
        const translations = {
            es: {
                title: 'Historial de Modificaciones',
                noHistory: 'No hay modificaciones registradas para este presupuesto.',
                date: 'Fecha',
                type: 'Tipo',
                description: 'Descripción',
                user: 'Usuario',
                types: {
                    'cambio_estado': 'Cambio de Estado',
                    'edicion_propuesta': 'Edición de Propuesta',
                    'producto_eliminado': 'Producto Eliminado',
                    'producto_agregado': 'Producto Agregado',
                    'cantidad_modificada': 'Cantidad Modificada',
                    'observacion_agregada': 'Observación Agregada',
                    'comentario_agregado': 'Comentarios Añadidos',
                    'fecha_entrega_definida': 'Fecha Estimada de Entrega Definida',
                    'fecha_entrega_alterada': 'Fecha Estimada de Entrega Alterada',
                    'precio_modificado': 'Precio Modificado',
                    'eliminacion': 'Eliminación',
                    'agregado': 'Agregado',
                    'modificacion': 'Modificación'
                }
            },
            pt: {
                title: 'Edições de Proposta',
                noHistory: 'Não há edições registradas para este orçamento.',
                date: 'Data',
                type: 'Tipo',
                description: 'Descrição',
                user: 'Usuário',
                types: {
                    'cambio_estado': 'Alteração de Estado',
                    'edicion_propuesta': 'Edição de Proposta',
                    'producto_eliminado': 'Produto Eliminado',
                    'producto_agregado': 'Produto Adicionado',
                    'cantidad_modificada': 'Quantidade Modificada',
                    'observacion_agregada': 'Observação Adicionada',
                    'comentario_agregado': 'Comentários Adicionados',
                    'fecha_entrega_definida': 'Data Prevista de Entrega Definida',
                    'fecha_entrega_alterada': 'Data Prevista de Entrega Alterada',
                    'precio_modificado': 'Preço Modificado',
                    'eliminacion': 'Remoção',
                    'agregado': 'Adicionado',
                    'modificacion': 'Modificação'
                }
            },
            en: {
                title: 'Proposal Edits',
                noHistory: 'No edits recorded for this proposal.',
                date: 'Date',
                type: 'Type',
                description: 'Description',
                user: 'User',
                types: {
                    'cambio_estado': 'Status Change',
                    'edicion_propuesta': 'Proposal Edit',
                    'producto_eliminado': 'Product Removed',
                    'producto_agregado': 'Product Added',
                    'cantidad_modificada': 'Quantity Modified',
                    'observacion_agregada': 'Observation Added',
                    'comentario_agregado': 'Comments Added',
                    'fecha_entrega_definida': 'Expected Delivery Date Set',
                    'fecha_entrega_alterada': 'Expected Delivery Date Changed',
                    'precio_modificado': 'Price Modified',
                    'eliminacion': 'Removal',
                    'agregado': 'Added',
                    'modificacion': 'Modification'
                }
            }
        };

        const t = translations[this.currentLanguage] || translations.es;
        
        // Actualizar título
        document.getElementById('modifications-modal-title').textContent = t.title;

        // Generar contenido
        const contentDiv = document.getElementById('modifications-history-content');
        
        if (todosLosRegistros.length === 0) {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>${t.noHistory}</p>
                </div>
            `;
        } else {
            // Ordenar por fecha descendente (más reciente primero)
            const historialOrdenado = todosLosRegistros.length > 0 ? 
                [...todosLosRegistros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) : [];
            
            contentDiv.innerHTML = `
                <div class="modifications-timeline">
                    ${historialOrdenado.map(registro => {
                        const fecha = new Date(registro.fecha);
                        const fechaFormateada = fecha.toLocaleDateString(this.currentLanguage === 'es' ? 'es-ES' : this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                        const horaFormateada = fecha.toLocaleTimeString(this.currentLanguage === 'es' ? 'es-ES' : this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        const tipoTexto = t.types[registro.tipo] || registro.tipo;
                        const iconoTipo = this.getModificationIcon(registro.tipo);
                        const colorTipo = this.getModificationColor(registro.tipo);
                        
                        // Si es una edición de propuesta, mostrar detalles expandidos
                        if (registro.tipo === 'edicion_propuesta' && registro.cambios && registro.cambios.length > 0) {
                            return `
                                <div class="modification-item" style="
                                    display: flex;
                                    gap: 16px;
                                    padding: 16px;
                                    border-left: 3px solid ${colorTipo};
                                    background: var(--bg-gray-100);
                                    border-radius: 0 8px 8px 0;
                                    margin-bottom: 12px;
                                ">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: ${colorTipo}20;
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        flex-shrink: 0;
                                    ">
                                        <i class="${iconoTipo}" style="color: ${colorTipo};"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                            <span style="
                                                font-weight: 600;
                                                color: ${colorTipo};
                                                font-size: 0.9rem;
                                            ">${registro.titulo || tipoTexto}</span>
                                            <span style="
                                                font-size: 0.8rem;
                                                color: var(--text-secondary);
                                            ">${fechaFormateada} ${horaFormateada}</span>
                                        </div>
                                        <div style="margin: 8px 0; padding-left: 12px; border-left: 2px solid ${colorTipo}40;">
                                            ${registro.cambios.map(cambio => {
                                                const cambioIcono = this.getModificationIcon(cambio.tipo);
                                                const cambioColor = this.getModificationColor(cambio.tipo);
                                                return `
                                                    <div style="margin-bottom: 6px; font-size: 0.9rem; color: var(--text-primary);">
                                                        <i class="${cambioIcono}" style="color: ${cambioColor}; margin-right: 6px; font-size: 0.8rem;"></i>
                                                        ${cambio.descripcion}
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                        <span style="
                                            font-size: 0.8rem;
                                            color: var(--text-secondary);
                                        ">
                                            <i class="fas fa-user" style="margin-right: 4px;"></i>
                                            ${registro.usuario || 'Sistema'}
                                        </span>
                                    </div>
                                </div>
                            `;
                        } else {
                            // Renderizado normal para otros tipos
                            return `
                                <div class="modification-item" style="
                                    display: flex;
                                    gap: 16px;
                                    padding: 16px;
                                    border-left: 3px solid ${colorTipo};
                                    background: var(--bg-gray-100);
                                    border-radius: 0 8px 8px 0;
                                    margin-bottom: 12px;
                                ">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: ${colorTipo}20;
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        flex-shrink: 0;
                                    ">
                                        <i class="${iconoTipo}" style="color: ${colorTipo};"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                            <span style="
                                                font-weight: 600;
                                                color: ${colorTipo};
                                                font-size: 0.9rem;
                                            ">${tipoTexto}</span>
                                            <span style="
                                                font-size: 0.8rem;
                                                color: var(--text-secondary);
                                            ">${fechaFormateada} ${horaFormateada}</span>
                                        </div>
                                        ${(function() {
                                            const desc = (registro.descripcion || registro.titulo || '').trim();
                                            if (!desc) return '<p style="margin: 0 0 8px 0;"></p>';
                                            const partes = desc.split(/\s*;\s*/).filter(p => p.length > 0);
                                            if (partes.length <= 1) return `<p style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 0.95rem;">${(desc || '').replace(/</g, '&lt;')}</p>`;
                                            return `<ul style="margin: 0 0 8px 0; padding-left: 20px; list-style: none; color: var(--text-primary); font-size: 0.9rem;">${partes.map(p => `<li style="margin-bottom: 6px; position: relative;"><span style="position: absolute; left: -14px; color: var(--text-secondary);">•</span>${(p.trim() || '').replace(/</g, '&lt;')}</li>`).join('')}</ul>`;
                                        })()}
                                        <span style="font-size: 0.8rem; color: var(--text-secondary);">
                                            <i class="fas fa-user" style="margin-right: 4px;"></i>
                                            ${registro.usuario || 'Sistema'}
                                        </span>
                                    </div>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            `;
        }

        // Mostrar el modal
        modal.style.display = 'flex';
    }

    /**
     * Obtener icono según tipo de modificación
     */
    getModificationIcon(tipo) {
        const icons = {
            'cambio_estado': 'fas fa-exchange-alt',
            'edicion_propuesta': 'fas fa-edit',
            'producto_eliminado': 'fas fa-trash-alt',
            'producto_agregado': 'fas fa-plus-circle',
            'cantidad_modificada': 'fas fa-sort-numeric-up',
            'observacion_agregada': 'fas fa-comment-alt',
            'comentario_agregado': 'fas fa-comments',
            'fecha_entrega_definida': 'fas fa-calendar-plus',
            'fecha_entrega_alterada': 'fas fa-calendar-alt',
            'precio_modificado': 'fas fa-euro-sign',
            'eliminacion': 'fas fa-trash-alt',
            'agregado': 'fas fa-plus-circle',
            'modificacion': 'fas fa-pencil-alt'
        };
        return icons[tipo] || 'fas fa-edit';
    }

    /**
     * Obtener color según tipo de modificación
     */
    getModificationColor(tipo) {
        const colors = {
            'cambio_estado': '#3b82f6',
            'edicion_propuesta': '#f59e0b',
            'producto_eliminado': '#ef4444',
            'producto_agregado': '#10b981',
            'cantidad_modificada': '#f59e0b',
            'observacion_agregada': '#8b5cf6',
            'comentario_agregado': '#8b5cf6',
            'fecha_entrega_definida': '#059669',
            'fecha_entrega_alterada': '#0d9488',
            'precio_modificado': '#ec4899',
            'eliminacion': '#ef4444',
            'agregado': '#10b981',
            'modificacion': '#8b5cf6'
        };
        return colors[tipo] || '#6b7280';
    }

    /**
     * Alternar modo de edición de comentarios
     */
    toggleCommentsEdit(proposalId) {
        const displayDiv = document.getElementById(`comments-display-${proposalId}`);
        const editDiv = document.getElementById(`comments-edit-${proposalId}`);
        const textarea = document.getElementById(`comments-textarea-${proposalId}`);
        
        if (displayDiv && editDiv) {
            displayDiv.style.display = 'none';
            editDiv.style.display = 'block';
            if (textarea) {
                setTimeout(() => textarea.focus(), 100);
            }
        }
    }

    /**
     * Cancelar edición de comentarios
     */
    cancelCommentsEdit(proposalId) {
        const displayDiv = document.getElementById(`comments-display-${proposalId}`);
        const editDiv = document.getElementById(`comments-edit-${proposalId}`);
        const textarea = document.getElementById(`comments-textarea-${proposalId}`);
        
        if (displayDiv && editDiv && textarea) {
            // Restaurar el valor original
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                textarea.value = proposal.comentarios || '';
            }
            displayDiv.style.display = 'block';
            editDiv.style.display = 'none';
        }
    }

    /**
     * Guardar comentarios
     */
    async saveComments(proposalId) {
        const textarea = document.getElementById(`comments-textarea-${proposalId}`);
        if (!textarea) {
            console.error('Textarea no encontrado');
            return;
        }

        const newComments = textarea.value.trim();

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        const translations = {
            es: {
                success: 'Comentarios guardados correctamente',
                error: 'Error al guardar los comentarios'
            },
            pt: {
                success: 'Comentários guardados com sucesso',
                error: 'Erro ao guardar os comentários'
            },
            en: {
                success: 'Comments saved successfully',
                error: 'Error saving comments'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        try {
            const { data: row } = await this.supabase.from('presupuestos').select('historial_modificaciones').eq('id', proposalId).single();
            let historialActual = row?.historial_modificaciones;
            if (typeof historialActual === 'string') {
                try { historialActual = JSON.parse(historialActual); } catch (e) { historialActual = []; }
            }
            if (!Array.isArray(historialActual)) historialActual = [];
            const descComentario = this.currentLanguage === 'pt' ? 'Comentários adicionados ou alterados na proposta.' : this.currentLanguage === 'en' ? 'Comments added or updated on the proposal.' : 'Comentarios añadidos o modificados en la propuesta.';
            const nuevoRegistro = {
                fecha: new Date().toISOString(),
                tipo: 'comentario_agregado',
                descripcion: descComentario,
                usuario: localStorage.getItem('commercial_name') || 'Sistema'
            };
            const nuevoHistorial = [...historialActual, nuevoRegistro];

            let error = (await this.supabase
                .from('presupuestos')
                .update({ comentarios: newComments || null, historial_modificaciones: nuevoHistorial })
                .eq('id', proposalId)).error;

            if (error) {
                const soloComentarios = (await this.supabase
                    .from('presupuestos')
                    .update({ comentarios: newComments || null })
                    .eq('id', proposalId)).error;
                if (soloComentarios) throw error;
            }

            // Actualizar la propuesta en memoria
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                proposal.comentarios = newComments || null;
            }

            // Actualizar la visualización
            const displayDiv = document.getElementById(`comments-display-${proposalId}`);
            const editDiv = document.getElementById(`comments-edit-${proposalId}`);
            
            if (displayDiv) {
                const detailLabels = this.getDetailLabels();
                displayDiv.innerHTML = `
                    <p style="color: var(--text-primary, #111827); white-space: pre-wrap; word-wrap: break-word; min-height: 40px; padding: var(--space-2);">
                        ${newComments || `<span style="color: var(--text-secondary, #6b7280); font-style: italic;">${detailLabels.noComments}</span>`}
                    </p>
                `;
            }

            if (editDiv) {
                editDiv.style.display = 'none';
            }
            if (displayDiv) {
                displayDiv.style.display = 'block';
            }

            // Mostrar mensaje de éxito
            this.showSuccessMessage(t.success);

        } catch (error) {
            console.error('Error al guardar comentarios:', error);
            this.showErrorMessage(t.error);
        }
    }

    /**
     * Alternar modo de edición de detalles adicionales
     */
    toggleAdditionalDetailsEdit(proposalId) {
        const displayDiv = document.getElementById(`additional-details-display-${proposalId}`);
        const editDiv = document.getElementById(`additional-details-edit-${proposalId}`);
        
        if (displayDiv && editDiv) {
            displayDiv.style.display = 'none';
            editDiv.style.display = 'block';
        }
    }

    /**
     * Cancelar edición de detalles adicionales
     */
    cancelAdditionalDetailsEdit(proposalId) {
        const displayDiv = document.getElementById(`additional-details-display-${proposalId}`);
        const editDiv = document.getElementById(`additional-details-edit-${proposalId}`);
        
        if (displayDiv && editDiv) {
            // Recargar los datos originales
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                // Restaurar valores en los inputs
                const numeroClienteInput = document.getElementById(`numero-cliente-${proposalId}`);
                const tipoClienteInput = document.getElementById(`tipo-cliente-${proposalId}`);
                const paisInput = document.getElementById(`pais-${proposalId}`);
                const responsavelSelect = document.getElementById(`responsavel-${proposalId}`);
                const areaNegocioSelect = document.getElementById(`area-negocio-${proposalId}`);
                const reposicaoSelect = document.getElementById(`reposicao-${proposalId}`);
                const facturaProformaInput = document.getElementById(`factura-proforma-${proposalId}`);
                const fechaFacturaProformaInput = document.getElementById(`fecha-factura-proforma-${proposalId}`);
                const valorAdjudicacaoInput = document.getElementById(`valor-adjudicacao-${proposalId}`);
                const fechaAdjudicacaoInput = document.getElementById(`fecha-adjudicacao-${proposalId}`);
                const numeroGuiaPreparacaoInput = document.getElementById(`numero-guia-preparacao-${proposalId}`);
                const dataInicioProcurementInput = document.getElementById(`data-inicio-procurement-${proposalId}`);
                const dataPedidoCotacaoInput = document.getElementById(`data-pedido-cotacao-${proposalId}`);
                if (numeroClienteInput) numeroClienteInput.value = proposal.numero_cliente || '';
                if (tipoClienteInput) tipoClienteInput.value = proposal.tipo_cliente || '';
                if (paisInput) paisInput.value = proposal.pais || '';
                if (responsavelSelect) responsavelSelect.value = proposal.responsavel || '';
                if (areaNegocioSelect) areaNegocioSelect.value = proposal.area_negocio || '';
                if (reposicaoSelect) reposicaoSelect.value = proposal.reposicao ? 'true' : 'false';
                if (facturaProformaInput) facturaProformaInput.value = proposal.factura_proforma || '';
                if (fechaFacturaProformaInput) fechaFacturaProformaInput.value = proposal.fecha_factura_proforma ? proposal.fecha_factura_proforma.split('T')[0] : '';
                if (valorAdjudicacaoInput) valorAdjudicacaoInput.value = proposal.valor_adjudicacao || '';
                if (fechaAdjudicacaoInput) fechaAdjudicacaoInput.value = proposal.fecha_adjudicacao ? proposal.fecha_adjudicacao.split('T')[0] : '';
                if (numeroGuiaPreparacaoInput) numeroGuiaPreparacaoInput.value = proposal.numero_guia_preparacao || '';
            }
            
            displayDiv.style.display = 'block';
            editDiv.style.display = 'none';
        }
    }

    /**
     * Abrir formulario para añadir follow-up manual
     */
    openAddFollowUpForm(proposalId) {
        const form = document.getElementById(`add-follow-up-form-${proposalId}`);
        const dateInput = document.getElementById(`new-follow-up-date-${proposalId}`);
        if (form && dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
            form.style.display = 'block';
        }
    }

    /**
     * Cancelar formulario de añadir follow-up
     */
    cancelAddFollowUpForm(proposalId) {
        const form = document.getElementById(`add-follow-up-form-${proposalId}`);
        if (form) form.style.display = 'none';
        const observacoesEl = document.getElementById(`new-follow-up-observacoes-${proposalId}`);
        if (observacoesEl) observacoesEl.value = '';
    }

    /**
     * Confirmar y guardar nuevo follow-up (añadido manualmente)
     */
    async confirmAddFollowUp(proposalId) {
        const dateInput = document.getElementById(`new-follow-up-date-${proposalId}`);
        if (!dateInput || !dateInput.value) {
            const msg = this.currentLanguage === 'es' ? 'Indique la fecha del follow up.' : this.currentLanguage === 'pt' ? 'Indique a data do follow up.' : 'Enter the follow up date.';
            this.showNotification(msg, 'error');
            return;
        }
        const observacoesEl = document.getElementById(`new-follow-up-observacoes-${proposalId}`);
        const observacoes = observacoesEl && observacoesEl.value && observacoesEl.value.trim() !== '' ? observacoesEl.value.trim() : null;
        if (!this.supabase) await this.initializeSupabase();
        try {
            const { error } = await this.supabase.from('presupuestos_follow_ups').insert({
                presupuesto_id: proposalId,
                fecha_follow_up: dateInput.value,
                observaciones: observacoes,
                fecha_follow_up_futuro: null
            });
            if (error) throw error;
            const observacoesEl = document.getElementById(`new-follow-up-observacoes-${proposalId}`);
            if (observacoesEl) observacoesEl.value = '';
            this.cancelAddFollowUpForm(proposalId);
            await this.loadProposals();
            this.viewProposalDetails(proposalId);
            const msg = this.currentLanguage === 'es' ? 'Follow up añadido.' : this.currentLanguage === 'pt' ? 'Follow up adicionado.' : 'Follow up added.';
            this.showNotification(msg, 'success');
        } catch (error) {
            console.error('Error al añadir follow up:', error);
            this.showNotification(error.message || 'Error', 'error');
        }
    }

    /**
     * Guardar fecha follow up futuro de un follow-up (las observaciones no se editan tras guardar).
     */
    async saveFollowUpEntry(proposalId, followUpId) {
        const futuroEl = document.getElementById(`follow-up-futuro-${followUpId}`);
        const fechaFuturo = futuroEl && futuroEl.value ? futuroEl.value : null;
        if (!this.supabase) await this.initializeSupabase();
        try {
            const { error } = await this.supabase
                .from('presupuestos_follow_ups')
                .update({ fecha_follow_up_futuro: fechaFuturo })
                .eq('id', followUpId);
            if (error) throw error;
            await this.supabase.from('presupuestos').update({ webhook_future_fu_sent_at: null }).eq('id', proposalId);
            await this.loadProposals();
            this.viewProposalDetails(proposalId);
            const msg = this.currentLanguage === 'es' ? 'Guardado.' : this.currentLanguage === 'pt' ? 'Guardado.' : 'Saved.';
            this.showNotification(msg, 'success');
        } catch (error) {
            console.error('Error al guardar follow up:', error);
            this.showNotification(error.message || 'Error', 'error');
        }
    }

    /**
     * Manejar selección de archivo para foto de follow-up (slot 1 o 2)
     */
    async handleFollowUpPhotoInput(proposalId, followUpId, slot, event) {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            const msg = this.currentLanguage === 'es' ? 'Seleccione una imagen.' : this.currentLanguage === 'pt' ? 'Selecione uma imagem.' : 'Please select an image.';
            this.showNotification(msg, 'error');
            event.target.value = '';
            return;
        }
        await this.uploadFollowUpPhoto(proposalId, followUpId, slot, file);
        event.target.value = '';
    }

    /**
     * Subir una foto a follow-up-photos y guardar URL en el follow-up
     */
    async uploadFollowUpPhoto(proposalId, followUpId, slot, file) {
        if (!this.supabase) await this.initializeSupabase();
        const col = slot === 1 ? 'foto_url_1' : 'foto_url_2';
        const bucket = 'follow-up-photos';
        let storageClient = this.supabase;
        try {
            if (window.SUPABASE_CONFIG && typeof supabase !== 'undefined' && supabase.createClient) {
                storageClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
                    auth: { persistSession: true, autoRefreshToken: true },
                    global: { headers: {} }
                });
            }
        } catch (e) {
            storageClient = this.supabase;
        }
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const safeExt = ext || 'jpg';
        const fileName = `${followUpId}/${slot}_${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;
        try {
            const { error: uploadError } = await storageClient.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
            if (uploadError) throw uploadError;
            const { data: urlData } = storageClient.storage.from(bucket).getPublicUrl(fileName);
            const publicUrl = urlData?.publicUrl;
            if (!publicUrl) throw new Error('No se pudo obtener la URL pública');
            const { error: updateError } = await this.supabase
                .from('presupuestos_follow_ups')
                .update({ [col]: publicUrl })
                .eq('id', followUpId);
            if (updateError) throw updateError;
            await this.loadProposals();
            this.viewProposalDetails(proposalId);
            const msg = this.currentLanguage === 'es' ? 'Foto subida.' : this.currentLanguage === 'pt' ? 'Foto adicionada.' : 'Photo uploaded.';
            this.showNotification(msg, 'success');
        } catch (error) {
            console.error('Error al subir foto follow-up:', error);
            const msg = (error.message || 'Error').includes('Bucket not found') || (error.message || '').includes('not found')
                ? (this.currentLanguage === 'es' ? 'Cree el bucket "follow-up-photos" en Supabase (Storage).' : this.currentLanguage === 'pt' ? 'Crie o bucket "follow-up-photos" no Supabase (Storage).' : 'Create the "follow-up-photos" bucket in Supabase Storage.')
                : (error.message || 'Error');
            this.showNotification(msg, 'error');
        }
    }

    /**
     * Quitar una foto de un follow-up (borrar URL en BD; el archivo sigue en el bucket)
     */
    async removeFollowUpPhoto(proposalId, followUpId, slot) {
        if (!this.supabase) await this.initializeSupabase();
        const col = slot === 1 ? 'foto_url_1' : 'foto_url_2';
        try {
            const { error } = await this.supabase
                .from('presupuestos_follow_ups')
                .update({ [col]: null })
                .eq('id', followUpId);
            if (error) throw error;
            await this.loadProposals();
            this.viewProposalDetails(proposalId);
            const msg = this.currentLanguage === 'es' ? 'Foto quitada.' : this.currentLanguage === 'pt' ? 'Foto removida.' : 'Photo removed.';
            this.showNotification(msg, 'success');
        } catch (error) {
            console.error('Error al quitar foto follow-up:', error);
            this.showNotification(error.message || 'Error', 'error');
        }
    }

    /**
     * Guardar detalles adicionales
     */
    async saveAdditionalDetails(proposalId) {
        if (!this.supabase) {
            await this.initializeSupabase();
        }

        const translations = {
            es: {
                success: 'Detalles adicionales guardados correctamente',
                error: 'Error al guardar los detalles adicionales'
            },
            pt: {
                success: 'Detalhes adicionais guardados com sucesso',
                error: 'Erro ao guardar os detalhes adicionais'
            },
            en: {
                success: 'Additional details saved successfully',
                error: 'Error saving additional details'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        try {
            // Recopilar todos los valores de los campos
            const numeroCliente = document.getElementById(`numero-cliente-${proposalId}`)?.value.trim() || null;
            const tipoCliente = document.getElementById(`tipo-cliente-${proposalId}`)?.value.trim() || null;
            const pais = document.getElementById(`pais-${proposalId}`)?.value.trim() || null;
            const responsavel = document.getElementById(`responsavel-${proposalId}`)?.value || null;
            const areaNegocio = document.getElementById(`area-negocio-${proposalId}`)?.value || null;
            const reposicao = document.getElementById(`reposicao-${proposalId}`)?.value === 'true';
            const facturaProforma = document.getElementById(`factura-proforma-${proposalId}`)?.value.trim() || null;
            const fechaFacturaProforma = document.getElementById(`fecha-factura-proforma-${proposalId}`)?.value || null;
            const valorAdjudicacao = document.getElementById(`valor-adjudicacao-${proposalId}`)?.value ? parseFloat(document.getElementById(`valor-adjudicacao-${proposalId}`).value) : null;
            const fechaAdjudicacao = document.getElementById(`fecha-adjudicacao-${proposalId}`)?.value || null;
            const numeroGuiaPreparacao = document.getElementById(`numero-guia-preparacao-${proposalId}`)?.value.trim() || null;
            const dataInicioProcurement = document.getElementById(`data-inicio-procurement-${proposalId}`)?.value || null;
            const updateData = {
                numero_cliente: numeroCliente,
                tipo_cliente: tipoCliente,
                pais: pais,
                responsavel: responsavel,
                area_negocio: areaNegocio,
                reposicao: reposicao,
                factura_proforma: facturaProforma,
                fecha_factura_proforma: fechaFacturaProforma,
                valor_adjudicacao: valorAdjudicacao,
                fecha_adjudicacao: fechaAdjudicacao,
                numero_guia_preparacao: numeroGuiaPreparacao
            };

            const { error } = await this.supabase
                .from('presupuestos')
                .update(updateData)
                .eq('id', proposalId);

            if (error) {
                throw error;
            }

            // Actualizar la propuesta en memoria
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                Object.assign(proposal, updateData);
            }

            // Recargar los detalles para mostrar los cambios
            this.viewProposalDetails(proposalId);
            
            // Mostrar notificación de éxito
            this.showSuccessMessage(t.success);
        } catch (error) {
            console.error('Error al guardar detalles adicionales:', error);
            this.showErrorMessage(t.error);
        }
    }

    /**
     * Alternar modo de edición del nombre del cliente
     */
    toggleClientNameEdit(proposalId) {
        const displayDiv = document.getElementById(`client-name-display-${proposalId}`);
        const editDiv = document.getElementById(`client-name-edit-${proposalId}`);
        if (displayDiv && editDiv) {
            displayDiv.style.display = 'none';
            editDiv.style.display = 'block';
            const input = document.getElementById(`client-name-input-${proposalId}`);
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    /**
     * Cancelar edición del nombre del cliente
     */
    cancelClientNameEdit(proposalId) {
        const displayDiv = document.getElementById(`client-name-display-${proposalId}`);
        const editDiv = document.getElementById(`client-name-edit-${proposalId}`);
        if (displayDiv && editDiv) {
            displayDiv.style.display = 'flex';
            editDiv.style.display = 'none';
            const proposal = this.allProposals.find(p => p.id === proposalId);
            const input = document.getElementById(`client-name-input-${proposalId}`);
            if (input && proposal) input.value = proposal.nombre_cliente || '';
        }
    }

    /**
     * Guardar nombre del cliente
     */
    async saveClientName(proposalId) {
        if (!this.supabase) await this.initializeSupabase();
        const input = document.getElementById(`client-name-input-${proposalId}`);
        if (!input) return;
        const newName = (input.value || '').trim();
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) return;
        try {
            const { error } = await this.supabase
                .from('presupuestos')
                .update({ nombre_cliente: newName || null })
                .eq('id', proposalId);
            if (error) throw error;
            proposal.nombre_cliente = newName || null;
            const valueEl = document.getElementById(`client-name-value-${proposalId}`);
            if (valueEl) valueEl.textContent = newName || '-';
            this.cancelClientNameEdit(proposalId);
            const msg = this.currentLanguage === 'es' ? 'Nombre del cliente actualizado.' : this.currentLanguage === 'pt' ? 'Nome do cliente atualizado.' : 'Client name updated.';
            this.showNotification(msg, 'success');
        } catch (err) {
            console.error('Error al guardar nombre del cliente:', err);
            this.showNotification(err.message || 'Error al guardar', 'error');
        }
    }

    /**
     * Alternar modo de edición de procurement
     */
    toggleProcurementEdit(proposalId) {
        const displayDiv = document.getElementById(`procurement-display-${proposalId}`);
        const editDiv = document.getElementById(`procurement-edit-${proposalId}`);
        
        if (displayDiv && editDiv) {
            displayDiv.style.display = 'none';
            editDiv.style.display = 'block';
        }
    }

    /**
     * Cancelar edición de procurement
     */
    cancelProcurementEdit(proposalId) {
        const displayDiv = document.getElementById(`procurement-display-${proposalId}`);
        const editDiv = document.getElementById(`procurement-edit-${proposalId}`);
        
        if (displayDiv && editDiv) {
            // Recargar los datos originales
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                const dataInicioProcurementInput = document.getElementById(`data-inicio-procurement-${proposalId}`);
                const dataPedidoCotacaoInput = document.getElementById(`data-pedido-cotacao-${proposalId}`);
                const dataRespostaFornecedorInput = document.getElementById(`data-resposta-fornecedor-${proposalId}`);
                
                if (dataInicioProcurementInput) dataInicioProcurementInput.value = proposal.data_inicio_procurement ? proposal.data_inicio_procurement.split('T')[0] : '';
                if (dataPedidoCotacaoInput) dataPedidoCotacaoInput.value = proposal.data_pedido_cotacao_fornecedor ? proposal.data_pedido_cotacao_fornecedor.split('T')[0] : '';
                if (dataRespostaFornecedorInput) dataRespostaFornecedorInput.value = proposal.data_resposta_fornecedor ? proposal.data_resposta_fornecedor.split('T')[0] : '';
            }
            
            displayDiv.style.display = 'block';
            editDiv.style.display = 'none';
        }
    }

    /**
     * Guardar detalles de procurement
     */
    async saveProcurementDetails(proposalId) {
        if (!this.supabase) {
            await this.initializeSupabase();
        }

        const translations = {
            es: {
                success: 'Datos de procurement guardados correctamente',
                error: 'Error al guardar los datos de procurement'
            },
            pt: {
                success: 'Dados de procurement guardados com sucesso',
                error: 'Erro ao guardar os dados de procurement'
            },
            en: {
                success: 'Procurement details saved successfully',
                error: 'Error saving procurement details'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        try {
            const dataInicioProcurement = document.getElementById(`data-inicio-procurement-${proposalId}`)?.value || null;
            const dataPedidoCotacao = document.getElementById(`data-pedido-cotacao-${proposalId}`)?.value || null;
            const dataRespostaFornecedor = document.getElementById(`data-resposta-fornecedor-${proposalId}`)?.value || null;

            const updateData = {
                data_inicio_procurement: dataInicioProcurement,
                data_pedido_cotacao_fornecedor: dataPedidoCotacao,
                data_resposta_fornecedor: dataRespostaFornecedor
            };

            const { error } = await this.supabase
                .from('presupuestos')
                .update(updateData)
                .eq('id', proposalId);

            if (error) {
                throw error;
            }

            // Actualizar la propuesta en memoria
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                Object.assign(proposal, updateData);
            }

            // Recargar los detalles para mostrar los cambios
            this.viewProposalDetails(proposalId);
            
            // Mostrar notificación de éxito
            this.showSuccessMessage(t.success);
        } catch (error) {
            console.error('Error al guardar detalles de procurement:', error);
            this.showErrorMessage(t.error);
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccessMessage(message) {
        // Crear o actualizar mensaje de éxito
        let messageDiv = document.getElementById('success-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'success-message';
            messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                z-index: 10000;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            document.body.appendChild(messageDiv);
        }
        messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        messageDiv.style.display = 'flex';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    /**
     * Mostrar mensaje de error
     */
    showErrorMessage(message) {
        // Crear o actualizar mensaje de error
        let messageDiv = document.getElementById('error-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'error-message';
            messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
                z-index: 10000;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            document.body.appendChild(messageDiv);
        }
        messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        messageDiv.style.display = 'flex';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    /**
     * Ver historial de cambios de estado
     */
    viewStatusChangesHistory(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Mostrar cambios de estado, modificaciones de artículos, comentarios y fechas de entrega
        const historial = proposal.historial_modificaciones || [];
        const tiposEnAlteracoes = ['cambio_estado', 'modificacion_articulos', 'comentario_agregado', 'fecha_entrega_definida', 'fecha_entrega_alterada'];
        const todasLasModificaciones = historial.filter(r => tiposEnAlteracoes.includes(r.tipo));
        
        // Crear el modal si no existe
        let modal = document.getElementById('statusChangesHistoryModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'statusChangesHistoryModal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            `;
            modal.innerHTML = `
                <div style="
                    background: var(--bg-primary, #111827);
                    border-radius: 16px;
                    max-width: 700px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--border-color, #374151);
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid var(--border-color, #374151);
                    ">
                        <h2 id="status-changes-modal-title" style="margin: 0; font-size: 1.25rem; color: var(--text-primary, #f9fafb);">Cambios de Estado</h2>
                        <button onclick="window.proposalsManager.closeStatusChangesModal()" style="
                            background: transparent;
                            border: 2px solid var(--border-color, #374151);
                            color: var(--text-primary, #f9fafb);
                            width: 36px;
                            height: 36px;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1rem;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='var(--bg-hover, #374151)'" onmouseout="this.style.background='transparent'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="status-changes-history-content" style="
                        padding: 24px;
                        overflow-y: auto;
                        max-height: calc(80vh - 80px);
                    ">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Cerrar al hacer clic fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeStatusChangesModal();
                }
            });
        }

        // Traducciones
        const translations = {
            es: {
                title: 'Alteraciones',
                noHistory: 'No hay alteraciones registradas para este presupuesto.',
                date: 'Fecha',
                type: 'Tipo',
                description: 'Descripción',
                user: 'Usuario',
                cambioEstado: 'Cambio de Estado',
                modificacionArticulos: 'Modificación de Artículos',
                comentarioAgregado: 'Comentarios Añadidos',
                fechaEntregaDefinida: 'Fecha Estimada de Entrega Definida',
                fechaEntregaAlterada: 'Fecha Estimada de Entrega Alterada'
            },
            pt: {
                title: 'Alterações',
                noHistory: 'Não há alterações registradas para este orçamento.',
                date: 'Data',
                type: 'Tipo',
                description: 'Descrição',
                user: 'Usuário',
                cambioEstado: 'Alteração de Estado',
                modificacionArticulos: 'Modificação de Artigos',
                comentarioAgregado: 'Comentários Adicionados',
                fechaEntregaDefinida: 'Data Prevista de Entrega Definida',
                fechaEntregaAlterada: 'Data Prevista de Entrega Alterada'
            },
            en: {
                title: 'Changes',
                noHistory: 'No changes recorded for this proposal.',
                date: 'Date',
                type: 'Type',
                description: 'Description',
                user: 'User',
                cambioEstado: 'Status Change',
                modificacionArticulos: 'Article Modification',
                comentarioAgregado: 'Comments Added',
                fechaEntregaDefinida: 'Expected Delivery Date Set',
                fechaEntregaAlterada: 'Expected Delivery Date Changed'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;
        
        // Actualizar título
        document.getElementById('status-changes-modal-title').textContent = t.title;

        // Generar contenido
        const contentDiv = document.getElementById('status-changes-history-content');
        
        if (todasLasModificaciones.length === 0) {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-exchange-alt" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>${t.noHistory}</p>
                </div>
            `;
        } else {
            // Ordenar por fecha descendente (más reciente primero)
            const historialOrdenado = [...todasLasModificaciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            contentDiv.innerHTML = `
                <div class="status-changes-timeline">
                    ${historialOrdenado.map(registro => {
                        const fecha = new Date(registro.fecha);
                        const fechaFormateada = fecha.toLocaleDateString(this.currentLanguage === 'es' ? 'es-ES' : this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                        const horaFormateada = fecha.toLocaleTimeString(this.currentLanguage === 'es' ? 'es-ES' : this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        // Determinar tipo, icono y color según el tipo de modificación
                        let tipoTexto, iconoTipo, colorTipo;
                        if (registro.tipo === 'cambio_estado') {
                            tipoTexto = t.type + ': ' + t.cambioEstado;
                            iconoTipo = 'fas fa-exchange-alt';
                            colorTipo = '#3b82f6';
                        } else if (registro.tipo === 'modificacion_articulos') {
                            tipoTexto = t.type + ': ' + t.modificacionArticulos;
                            iconoTipo = 'fas fa-edit';
                            colorTipo = '#10b981';
                        } else if (registro.tipo === 'comentario_agregado') {
                            tipoTexto = t.type + ': ' + t.comentarioAgregado;
                            iconoTipo = 'fas fa-comments';
                            colorTipo = '#8b5cf6';
                        } else if (registro.tipo === 'fecha_entrega_definida') {
                            tipoTexto = t.type + ': ' + t.fechaEntregaDefinida;
                            iconoTipo = 'fas fa-calendar-plus';
                            colorTipo = '#059669';
                        } else if (registro.tipo === 'fecha_entrega_alterada') {
                            tipoTexto = t.type + ': ' + t.fechaEntregaAlterada;
                            iconoTipo = 'fas fa-calendar-alt';
                            colorTipo = '#0d9488';
                        } else {
                            tipoTexto = t.type + ': ' + (registro.tipo || 'Modificación');
                            iconoTipo = 'fas fa-info-circle';
                            colorTipo = '#6b7280';
                        }
                        
                        return `
                            <div class="status-change-item" style="
                                display: flex;
                                gap: 16px;
                                padding: 16px;
                                border-left: 3px solid ${colorTipo};
                                background: var(--bg-gray-100);
                                border-radius: 0 8px 8px 0;
                                margin-bottom: 12px;
                            ">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: ${colorTipo}20;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    flex-shrink: 0;
                                ">
                                    <i class="${iconoTipo}" style="color: ${colorTipo};"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                        <span style="
                                            font-weight: 600;
                                            color: ${colorTipo};
                                            font-size: 0.9rem;
                                        ">${tipoTexto}</span>
                                        <span style="
                                            font-size: 0.8rem;
                                            color: var(--text-secondary);
                                        ">${fechaFormateada} ${horaFormateada}</span>
                                    </div>
                                    <div style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 0.9rem;">
                                        ${(function() {
                                            const desc = (registro.descripcion || '').trim();
                                            if (!desc) return '';
                                            const partes = desc.split(/\s*;\s*/).filter(p => p.length > 0);
                                            if (partes.length <= 1) return `<p style="margin: 0;">${desc.replace(/</g, '&lt;')}</p>`;
                                            return `<ul style="margin: 0; padding-left: 20px; list-style: none;">
                                                ${partes.map(p => {
                                                    const text = p.trim().replace(/</g, '&lt;');
                                                    return `<li style="margin-bottom: 6px; padding-left: 0; position: relative;">
                                                        <span style="position: absolute; left: -14px; color: var(--text-secondary);">•</span>
                                                        ${text}
                                                    </li>`;
                                                }).join('')}
                                            </ul>`;
                                        })()}
                                    </div>
                                    <span style="
                                        font-size: 0.8rem;
                                        color: var(--text-secondary);
                                    ">
                                        <i class="fas fa-user" style="margin-right: 4px;"></i>
                                        ${registro.usuario || 'Sistema'}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Mostrar el modal
        modal.style.display = 'flex';
    }

    /**
     * Cerrar modal de cambios de estado
     */
    closeStatusChangesModal() {
        const modal = document.getElementById('statusChangesHistoryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Cerrar modal de historial de modificaciones
     */
    closeModificationsModal() {
        const modal = document.getElementById('modificationsHistoryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async saveEncomendadoStatus() {
        const modal = document.getElementById('changeStatusEncomendadoModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Proposal not found');
            return;
        }

        // Obtener productos seleccionados
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        const selectedArticleIds = Array.from(checkboxes)
            .map(cb => cb.getAttribute('data-articulo-id'))
            .filter(id => id && id !== 'null' && id !== 'undefined' && !id.toString().startsWith('temp-')); // Filtrar IDs inválidos

        console.log('📋 IDs de artículos seleccionados (filtrados):', selectedArticleIds);
        console.log('📋 Artículos de la propuesta:', proposal.articulos.map(a => ({ id: a.id, nombre: a.nombre_articulo })));

        if (selectedArticleIds.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'Debe seleccionar al menos un producto válido' : 
                this.currentLanguage === 'pt' ?
                'Deve selecionar pelo menos um produto válido' :
                'You must select at least one valid product';
            this.showNotification(message, 'error');
            return;
        }

        // Obtener números de encomenda
        const number1Input = document.getElementById('encomendado-number1-input');
        const number2Input = document.getElementById('encomendado-number2-input');
        const dateInput = document.getElementById('encomendado-date-input');
        const number1 = number1Input?.value.trim() || '';
        const number2 = number2Input?.value.trim() || '';
        const encomendaDate = dateInput?.value || '';

        if (!number1) {
            const message = this.currentLanguage === 'es' ? 
                'Debe ingresar el número de encomenda 1 (obligatorio)' : 
                this.currentLanguage === 'pt' ?
                'Deve inserir o número de encomenda 1 (obrigatório)' :
                'You must enter order number 1 (required)';
            this.showNotification(message, 'error');
            return;
        }

        if (!encomendaDate) {
            const message = this.currentLanguage === 'es' ? 
                'Debe seleccionar la fecha de encomenda (obligatorio)' : 
                this.currentLanguage === 'pt' ?
                'Deve selecionar a data de encomenda (obrigatória)' :
                'You must select the order date (required)';
            this.showNotification(message, 'error');
            return;
        }

        // Combinar números (si hay dos, separados por coma)
        const numbers = number2 ? `${number1}, ${number2}` : number1;

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Determinar el estado final (puede ser "encomendado" o "encomenda_concluida")
            const modal = document.getElementById('changeStatusEncomendadoModal');
            const isConcluida = modal?.getAttribute('data-is-concluida') === 'true';
            const finalStatus = isConcluida ? 'encomenda_concluida' : 'encomendado';

            // Actualizar estado de la propuesta, números de encomenda y fecha
            await this.updateProposalStatus(proposalId, finalStatus, {
                numeros_encomenda: numbers,
                data_encomenda: encomendaDate
            });

            // Actualizar artículos seleccionados en la tabla presupuestos_articulos
            if (selectedArticleIds.length > 0) {
                // Primero, desmarcar todos los artículos de esta propuesta como encomendados
                const { error: unmarkError } = await this.supabase
                    .from('presupuestos_articulos')
                    .update({
                        encomendado: false,
                        fecha_encomenda: null,
                        numero_encomenda: null,
                        cantidad_encomendada: null,
                        fecha_prevista_entrega: null
                    })
                .eq('presupuesto_id', proposalId);

                if (unmarkError) {
                    console.warn('⚠️ Error al desmarcar artículos anteriores:', unmarkError);
                }

                // Luego, marcar los artículos seleccionados como encomendados
                console.log('📦 Actualizando artículos encomendados:', {
                    proposalId,
                    selectedArticleIds,
                    encomendaDate,
                    numbers,
                    cantidadArticulos: selectedArticleIds.length
                });
                
                // Verificar que todos los IDs sean válidos (UUIDs)
                const validIds = selectedArticleIds.filter(id => {
                    // Verificar formato UUID básico
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    return id && uuidRegex.test(id);
                });
                
                if (validIds.length === 0) {
                    console.error('❌ No hay IDs válidos para actualizar. IDs recibidos:', selectedArticleIds);
                    const message = this.currentLanguage === 'es' ? 
                        'Error: No se encontraron IDs válidos de artículos' : 
                        this.currentLanguage === 'pt' ?
                        'Erro: Não foram encontrados IDs válidos de artigos' :
                        'Error: No valid article IDs found';
                    this.showNotification(message, 'error');
                    return;
                }
                
                if (validIds.length !== selectedArticleIds.length) {
                    console.warn('⚠️ Algunos IDs no son válidos:', {
                        total: selectedArticleIds.length,
                        validos: validIds.length,
                        invalidos: selectedArticleIds.filter(id => !validIds.includes(id))
                    });
                }
                
                // Obtener las cantidades de cada artículo desde la propuesta
                const articulosConCantidad = validIds.map(id => {
                    const articulo = proposal.articulos.find(a => a.id === id);
                    return {
                        id: id,
                        cantidad: articulo ? (parseInt(articulo.cantidad) || 0) : 0
                    };
                });

                // Actualizar cada artículo individualmente con su cantidad encomendada
                const updatePromises = articulosConCantidad.map(art => {
                    return this.supabase
                        .from('presupuestos_articulos')
                        .update({
                            encomendado: true,
                            fecha_encomenda: encomendaDate || null,
                            numero_encomenda: numbers || null,
                            cantidad_encomendada: art.cantidad
                        })
                        .eq('id', art.id)
                        .eq('presupuesto_id', proposalId);
                });

                const updateResults = await Promise.all(updatePromises);
                const updateError = updateResults.find(r => r.error)?.error;
                const updateData = updateResults.filter(r => r.data && r.data.length > 0).flatMap(r => r.data);

                if (updateError) {
                    console.error('❌ Error al actualizar artículos encomendados:', updateError);
                    console.error('❌ Detalles del error:', {
                        code: updateError.code,
                        message: updateError.message,
                        details: updateError.details,
                        hint: updateError.hint
                    });
                    const message = this.currentLanguage === 'es' ? 
                        `Error al actualizar artículos: ${updateError.message}` : 
                        this.currentLanguage === 'pt' ?
                        `Erro ao atualizar artigos: ${updateError.message}` :
                        `Error updating articles: ${updateError.message}`;
                    this.showNotification(message, 'error');
                } else {
                    console.log('✅ Artículos actualizados correctamente:', updateData?.length || 0, 'artículos');
                    if (updateData && updateData.length > 0) {
                        console.log('✅ Datos actualizados:', updateData);
                    } else {
                        console.warn('⚠️ No se actualizaron artículos. Verificar IDs:', validIds);
                    }
                    const message = this.currentLanguage === 'es' ? 
                        'Estado actualizado correctamente' : 
                        this.currentLanguage === 'pt' ?
                        'Estado atualizado com sucesso' :
                        'Status updated successfully';
                    this.showNotification(message, 'success');
                }
            }

            // Recargar propuestas para reflejar los cambios
            await this.loadProposals();

            // Cerrar modal
            this.closeEncomendadoModal();

        } catch (error) {
            console.error('Error al guardar estado encomendado:', error);
        }
    }

    async saveRejeitadaStatus() {
        const modal = document.getElementById('changeStatusRejeitadaModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener motivo seleccionado
        const selectedReason = modal.querySelector('input[name="rejeitada-reason"]:checked')?.value;

        if (!selectedReason) {
            const message = this.currentLanguage === 'es' ? 
                'Debe seleccionar un motivo de rechazo' : 
                this.currentLanguage === 'pt' ?
                'Deve selecionar um motivo de rejeição' :
                'You must select a rejection reason';
            this.showNotification(message, 'error');
            return;
        }

        const additionalData = {
            motivo_rechazo: selectedReason
        };

        if (selectedReason === 'outro') {
            const otherInput = document.getElementById('rejeitada-other-input');
            const otherReason = otherInput?.value.trim() || '';

            if (!otherReason) {
                const message = this.currentLanguage === 'es' ? 
                    'Debe especificar el motivo de rechazo' : 
                    this.currentLanguage === 'pt' ?
                    'Deve especificar o motivo de rejeição' :
                    'You must specify the rejection reason';
                this.showNotification(message, 'error');
                return;
            }

            additionalData.motivo_rechazo_otro = otherReason;
        }

        try {
            await this.updateProposalStatus(proposalId, 'rejeitada', additionalData);
            this.closeRejeitadaModal();
        } catch (error) {
            console.error('Error al guardar estado rejeitada:', error);
        }
    }

    closeEncomendadoModal() {
        const modal = document.getElementById('changeStatusEncomendadoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    closeRejeitadaModal() {
        const modal = document.getElementById('changeStatusRejeitadaModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateEncomendadoTranslations() {
        const lang = this.currentLanguage;
        const modal = document.getElementById('changeStatusEncomendadoModal');
        const isConcluida = modal?.getAttribute('data-is-concluida') === 'true';

        const translations = {
            pt: {
                titleEncomendado: 'Marcar como Encomendado',
                titleConcluida: 'Marcar como Encomenda Concluída',
                productsLabel: 'Selecione os produtos que foram encomendados:',
                number1Label: 'Número de Encomenda 1 *',
                number2Label: 'Número de Encomenda 2 (opcional)',
                dateLabel: 'Data de Encomenda *',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                titleEncomendado: 'Marcar como Encomendado',
                titleConcluida: 'Marcar como Encomenda Concluída',
                productsLabel: 'Seleccione los productos que fueron encomendados:',
                number1Label: 'Número de Encomenda 1 *',
                number2Label: 'Número de Encomenda 2 (opcional)',
                dateLabel: 'Fecha de Encomenda *',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                titleEncomendado: 'Mark as Ordered',
                titleConcluida: 'Mark as Order Completed',
                productsLabel: 'Select the products that were ordered:',
                number1Label: 'Order Number 1 *',
                number2Label: 'Order Number 2 (optional)',
                dateLabel: 'Order Date *',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;
        const title = isConcluida ? t.titleConcluida : t.titleEncomendado;

        const elements = {
            'encomendado-modal-title': title,
            'encomendado-products-label': t.productsLabel,
            'encomendado-number1-label': t.number1Label,
            'encomendado-number2-label': t.number2Label,
            'encomendado-date-label': t.dateLabel,
            'encomendado-cancel-btn': t.cancel,
            'encomendado-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    updateRejeitadaTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Marcar como Rejeitada',
                reasonLabel: 'Motivo da Rejeição:',
                precos: 'Preços',
                prazo: 'Prazo de entrega',
                outro: 'Outro',
                otherLabel: 'Especifique o motivo:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Marcar como Rechazada',
                reasonLabel: 'Motivo del Rechazo:',
                precos: 'Precios',
                prazo: 'Plazo de entrega',
                outro: 'Otro',
                otherLabel: 'Especifique el motivo:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Mark as Rejected',
                reasonLabel: 'Rejection Reason:',
                precos: 'Prices',
                prazo: 'Delivery time',
                outro: 'Other',
                otherLabel: 'Specify the reason:',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'rejeitada-modal-title': t.title,
            'rejeitada-reason-label': t.reasonLabel,
            'reason-precos-text': t.precos,
            'reason-prazo-text': t.prazo,
            'reason-outro-text': t.outro,
            'rejeitada-other-label': t.otherLabel,
            'rejeitada-cancel-btn': t.cancel,
            'rejeitada-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    /**
     * Obtiene la URL completa de una imagen de producto desde Supabase Storage
     * @param {string} imageUrl - Nombre del archivo o URL de la imagen
     * @returns {string|null} URL completa de la imagen o null si no es válida
     */
    getProductImageUrl(imageUrl) {
        // Validar que imageUrl sea una cadena válida
        if (!imageUrl) {
            return null;
        }
        
        // Si es un objeto, devolver null
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
        // Usar la configuración de Supabase desde window.SUPABASE_CONFIG
        const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) 
            ? window.SUPABASE_CONFIG.url 
            : null;
        
        if (!SUPABASE_URL) {
            console.error('Error: Configuración de Supabase no disponible');
            return trimmedUrl; // Devolver URL original si no hay configuración
        }
        
        // Si la ruta ya incluye "productos/", usarla directamente
        if (trimmedUrl.startsWith('productos/')) {
            return `${SUPABASE_URL}/storage/v1/object/public/product-images/${trimmedUrl}`;
        }
        
        // Si es solo el nombre del archivo, agregar el prefijo "productos/"
        return `${SUPABASE_URL}/storage/v1/object/public/product-images/productos/${trimmedUrl}`;
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.background = '#10b981';
        } else if (type === 'error') {
            notification.style.background = '#ef4444';
        } else {
            notification.style.background = '#3b82f6';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Mostrar descomposición del código de propuesta
     */
    showProposalCodeBreakdown(proposalId, codigoPropuesta, nombreComercial, nombreCliente, fechaPropuesta, version = 1) {
        const modal = document.getElementById('proposalCodeModal');
        const content = document.getElementById('codeBreakdownContent');
        
        if (!modal || !content) return;
        
        // Descomponer el código
        // Formato: DDMMIIPPYY (Día, Mes, Iniciales Comercial, Número Propuesta, Año)
        let breakdown = {};
        
        if (codigoPropuesta && codigoPropuesta.length >= 10) {
            breakdown = {
                dia: codigoPropuesta.substring(0, 2),
                mes: codigoPropuesta.substring(2, 4),
                inicialesComercial: codigoPropuesta.substring(4, 6),
                numeroPropuesta: codigoPropuesta.substring(6, 8),
                año: codigoPropuesta.substring(8, 10)
            };
        }
        
        // Construir HTML de descomposición
        let html = '';
        
        if (codigoPropuesta && codigoPropuesta.length >= 10) {
            const versionText = version > 1 ? ` V${version}` : '';
            html = `
                <div style="margin-bottom: var(--space-6);">
                    <div style="text-align: center; margin-bottom: var(--space-4);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--brand-blue, #2563eb); letter-spacing: 4px; font-family: monospace; margin-bottom: var(--space-2);">
                            ${codigoPropuesta}${versionText}
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">Código completo${versionText ? ` - Versão ${version}` : ''}</p>
                    </div>
                    
                    <div style="background: var(--bg-gray-50); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
                        <h4 style="margin: 0 0 var(--space-3) 0; color: var(--text-primary); font-size: 1rem; font-weight: 600;">
                            <i class="fas fa-info-circle" style="margin-right: 8px; color: var(--brand-blue, #2563eb);"></i>
                            Descomposición del Código
                        </h4>
                        
                        <div style="display: grid; gap: var(--space-3);">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--bg-gray-200);">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Día de creación</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Día del mes (2 dígitos)</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-blue, #2563eb); font-family: monospace;">
                                    ${breakdown.dia}
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--bg-gray-200);">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Mes de creación</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Mes del año (2 dígitos)</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-blue, #2563eb); font-family: monospace;">
                                    ${breakdown.mes}
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--bg-gray-200);">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Iniciales del Comercial</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${nombreComercial || 'N/A'}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Primera letra de las primeras 2 palabras</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-blue, #2563eb); font-family: monospace;">
                                    ${breakdown.inicialesComercial}
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--bg-gray-200);">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Número de Propuesta</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Número secuencial de propuesta del comercial</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Contador de propuestas de ${nombreComercial || 'este comercial'}</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-blue, #2563eb); font-family: monospace;">
                                    ${breakdown.numeroPropuesta}
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0;">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Año</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Últimos 2 dígitos del año</div>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-blue, #2563eb); font-family: monospace;">
                                    ${breakdown.año}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(198, 161, 91, 0.1) 100%); border-left: 4px solid var(--brand-blue, #2563eb); padding: var(--space-4); border-radius: var(--radius-md);">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
                            <i class="fas fa-lightbulb" style="margin-right: 8px; color: var(--brand-gold, #C6A15B);"></i>
                            Fórmula
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
                            El código se genera concatenando todos los elementos sin separadores:<br>
                            <strong style="color: var(--text-primary);">DD + MM + II + PP + YY</strong><br>
                            Donde DD = Día, MM = Mes, II = Iniciales Comercial, PP = Número de Propuesta del Comercial, YY = Año
                        </div>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div style="text-align: center; padding: var(--space-6);">
                    <i class="fas fa-info-circle" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: var(--space-4); opacity: 0.5;"></i>
                    <p style="color: var(--text-secondary);">
                        Esta propuesta fue creada antes de implementar el sistema de códigos.<br>
                        Se muestra el identificador UUID en su lugar.
                    </p>
                </div>
            `;
        }
        
        content.innerHTML = html;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ============================================
    // MODAL: Amostra Pedida
    // ============================================
    openAmostraPedidaModal(proposal) {
        const modal = document.getElementById('amostraPedidaModal');
        const productsList = document.getElementById('amostra-pedida-products-list');
        const notesField = document.getElementById('amostra-pedida-notes');
        
        if (!modal) {
            console.error('Modal amostra pedida not found');
            return;
        }

        // Limpiar lista anterior
        if (productsList) {
            productsList.innerHTML = '';
        }

        // Si hay artículos en la propuesta, crear checkboxes
        if (proposal.articulos && proposal.articulos.length > 0) {
            if (productsList) {
                proposal.articulos.forEach((articulo, index) => {
                    const item = document.createElement('div');
                    item.className = 'product-checkbox-item';
                    const articuloId = articulo.id || `temp-${index}`;
                    item.innerHTML = `
                        <input type="checkbox" id="amostra-product-${proposal.id}-${index}" value="${articuloId}" data-articulo-id="${articuloId}">
                        <label for="amostra-product-${proposal.id}-${index}" style="flex: 1; cursor: pointer;">
                            <strong>${articulo.nombre_articulo || '-'}</strong> 
                            (Ref: ${articulo.referencia_articulo || '-'}) - 
                            ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: ${articulo.cantidad || 0}
                        </label>
                    `;
                    productsList.appendChild(item);
                });
            }
        }

        // Limpiar campo de notas
        if (notesField) {
            notesField.value = '';
        }

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateAmostraPedidaTranslations();

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async saveAmostraPedidaStatus() {
        const modal = document.getElementById('amostraPedidaModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener artículos seleccionados
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        const selectedArticleIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-articulo-id'));

        // Obtener notas
        const notesField = document.getElementById('amostra-pedida-notes');
        const notes = notesField ? notesField.value.trim() : '';

        // Validar que haya al menos artículos seleccionados o notas
        if (selectedArticleIds.length === 0 && !notes) {
            const message = this.currentLanguage === 'es' ? 
                'Debe seleccionar al menos un artículo o agregar una nota' : 
                this.currentLanguage === 'pt' ?
                'Deve selecionar pelo menos um artigo ou adicionar uma nota' :
                'You must select at least one article or add a note';
            this.showNotification(message, 'error');
            return;
        }

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Guardar información de muestras pedidas
            const amostraData = {
                presupuesto_id: proposalId,
                articulos_seleccionados: selectedArticleIds,
                notas: notes || null
            };

            // Verificar si ya existe un registro para esta propuesta
            const { data: existing } = await this.supabase
                .from('presupuestos_amostras_pedidas')
                .select('id')
                .eq('presupuesto_id', proposalId)
                .single();

            if (existing) {
                // Actualizar registro existente
                await this.supabase
                    .from('presupuestos_amostras_pedidas')
                    .update(amostraData)
                    .eq('presupuesto_id', proposalId);
            } else {
                // Crear nuevo registro
                await this.supabase
                    .from('presupuestos_amostras_pedidas')
                    .insert([amostraData]);
            }

            // Actualizar estado de la propuesta
            await this.updateProposalStatus(proposalId, 'amostra_pedida');

            // Recargar propuestas para actualizar la vista
            await this.loadProposals();

            // Resetear el select después de actualizar
            this.resetStatusSelects(proposalId);

            // Cerrar modal
            this.closeAmostraPedidaModal();

        } catch (error) {
            console.error('Error al guardar amostra pedida:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    closeAmostraPedidaModal() {
        const modal = document.getElementById('amostraPedidaModal');
        if (modal) {
            const proposalId = modal.getAttribute('data-proposal-id');
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Resetear el select cuando se cierra el modal (por si se canceló)
            if (proposalId) {
                this.resetStatusSelects(proposalId);
            }
        }
    }

    updateAmostraPedidaTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Amostra Pedida',
                productsLabel: 'Selecione os artigos que requerem amostras:',
                notesLabel: 'Notas (informação adicional sobre os produtos):',
                notesPlaceholder: 'Adicione informações sobre os produtos que requerem amostras...',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Muestra Pedida',
                productsLabel: 'Seleccione los artículos que requieren muestras:',
                notesLabel: 'Notas (información adicional sobre los productos):',
                notesPlaceholder: 'Agregue información sobre los productos que requieren muestras...',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Sample Requested',
                productsLabel: 'Select the articles that require samples:',
                notesLabel: 'Notes (additional information about products):',
                notesPlaceholder: 'Add information about products that require samples...',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'amostra-pedida-modal-title': t.title,
            'amostra-pedida-products-label': t.productsLabel,
            'amostra-pedida-notes-label': t.notesLabel,
            'amostra-pedida-notes': t.notesPlaceholder,
            'amostra-pedida-cancel-btn': t.cancel,
            'amostra-pedida-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = text;
                } else {
                    element.textContent = text;
                }
            }
        });
    }

    // ============================================
    // MODAL: Amostra Enviada
    // ============================================
    openAmostraEnviadaModal(proposal) {
        const modal = document.getElementById('amostraEnviadaModal');
        const photosContainer = document.getElementById('amostra-enviada-photos-container');
        const productsContainer = document.getElementById('amostra-enviada-products-container');
        
        if (!modal) {
            console.error('Modal amostra enviada not found');
            return;
        }

        // Limpiar fotos anteriores
        if (photosContainer) {
            photosContainer.innerHTML = '';
        }

        // Cargar y mostrar artículos de la propuesta
        if (productsContainer && proposal.articulos) {
            productsContainer.innerHTML = '';
            
            proposal.articulos.forEach((articulo, index) => {
                const articuloId = articulo.id || `temp-${index}`;
                const item = document.createElement('div');
                item.className = 'product-checkbox-item';
                item.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; margin-bottom: 8px; border-radius: 6px; transition: background 0.2s;';
                item.onmouseover = function() { this.style.background = 'var(--bg-gray-100)'; };
                item.onmouseout = function() { this.style.background = 'transparent'; };
                
                item.innerHTML = `
                    <input type="checkbox" id="amostra-product-${proposal.id}-${index}" value="${articuloId}" data-articulo-id="${articuloId}" style="cursor: pointer;">
                    <label for="amostra-product-${proposal.id}-${index}" style="flex: 1; cursor: pointer; margin: 0;">
                        <strong>${articulo.nombre_articulo || '-'}</strong> 
                        ${articulo.referencia_articulo ? `(Ref: ${articulo.referencia_articulo})` : ''} - 
                        ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: ${articulo.cantidad || 1}
                    </label>
                `;
                productsContainer.appendChild(item);
            });
        }

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateAmostraEnviadaTranslations();

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async saveAmostraEnviadaStatus() {
        const modal = document.getElementById('amostraEnviadaModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener artículos seleccionados
        const productsContainer = document.getElementById('amostra-enviada-products-container');
        const selectedArticles = productsContainer ? 
            Array.from(productsContainer.querySelectorAll('input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.getAttribute('data-articulo-id')) : [];

        if (selectedArticles.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'Por favor seleccione al menos un artículo' : 
                this.currentLanguage === 'pt' ?
                'Por favor selecione pelo menos um artigo' :
                'Please select at least one article';
            this.showNotification(message, 'warning');
            return;
        }

        // Obtener fotos cargadas
        const photosContainer = document.getElementById('amostra-enviada-photos-container');
        const uploadedPhotos = photosContainer ? Array.from(photosContainer.querySelectorAll('img[data-url]')).map(img => img.getAttribute('data-url')) : [];

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            console.log('💾 Guardando amostras enviadas en presupuesto:', {
                proposalId,
                fotos_urls: uploadedPhotos,
                articulos_ids: selectedArticles
            });

            // Actualizar las columnas en la tabla presupuestos
            const { error: updateError } = await this.supabase
                .from('presupuestos')
                .update({
                    amostras_enviadas_fotos_urls: uploadedPhotos,
                    amostras_enviadas_articulos_ids: selectedArticles
                })
                .eq('id', proposalId);

            if (updateError) {
                console.error('❌ Error al actualizar presupuesto:', updateError);
                throw updateError;
            }

            // Actualizar estado de la propuesta
            await this.updateProposalStatus(proposalId, 'amostra_enviada');

            // Actualizar el objeto de la propuesta en memoria
            const proposal = this.allProposals.find(p => p.id === proposalId);
            if (proposal) {
                proposal.amostras_enviadas_fotos_urls = uploadedPhotos;
                proposal.amostras_enviadas_articulos_ids = selectedArticles;
            }

            // Cerrar modal
            this.closeAmostraEnviadaModal();

            const successMessage = this.currentLanguage === 'es' ? 
                'Muestra enviada guardada correctamente' : 
                this.currentLanguage === 'pt' ?
                'Amostra enviada guardada com sucesso' :
                'Sample sent saved successfully';
            this.showNotification(successMessage, 'success');

            console.log('✅ Amostras enviadas guardadas exitosamente');

        } catch (error) {
            console.error('❌ Error al guardar amostra enviada:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    closeAmostraEnviadaModal() {
        const modal = document.getElementById('amostraEnviadaModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Abrir modal para agregar más fotos a muestras enviadas (sin cambiar estado)
     */
    openAddAmostrasPhotosModal(proposalId) {
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Propuesta no encontrada:', proposalId);
            return;
        }

        // Obtener fotos existentes
        let existingPhotos = proposal.amostras_enviadas_fotos_urls || [];
        if (!Array.isArray(existingPhotos)) {
            existingPhotos = typeof existingPhotos === 'string' ? 
                (existingPhotos ? [existingPhotos] : []) : 
                [];
        }

        const modal = document.getElementById('addAmostrasPhotosModal');
        const photosContainer = document.getElementById('add-amostras-photos-container');
        
        if (!modal) {
            console.error('Modal add amostras photos not found');
            return;
        }

        // Limpiar fotos anteriores del modal
        if (photosContainer) {
            photosContainer.innerHTML = '';
        }

        // Mostrar fotos existentes en el modal
        if (photosContainer && Array.isArray(existingPhotos)) {
            existingPhotos.forEach((fotoUrl, index) => {
                const photoDiv = document.createElement('div');
                photoDiv.style.cssText = 'position: relative; width: 150px; height: 150px; border-radius: 8px; overflow: hidden; border: 2px solid var(--bg-gray-300);';
                photoDiv.innerHTML = `
                    <img src="${fotoUrl}" data-url="${fotoUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    <button type="button" onclick="removeAmostraPhotoFromModal(this)" style="position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times" style="font-size: 12px;"></i>
                    </button>
                `;
                photosContainer.appendChild(photoDiv);
            });
        }

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposalId);

        // Actualizar traducciones
        this.updateAddAmostrasPhotosTranslations();

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Guardar fotos adicionales de muestras enviadas (sin cambiar estado)
     */
    async saveAddAmostrasPhotos() {
        const modal = document.getElementById('addAmostrasPhotosModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener todas las fotos del contenedor (existentes + nuevas)
        const photosContainer = document.getElementById('add-amostras-photos-container');
        const allPhotos = photosContainer ? 
            Array.from(photosContainer.querySelectorAll('img[data-url]')).map(img => img.getAttribute('data-url')) : [];

        if (allPhotos.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'No hay fotos para guardar' : 
                this.currentLanguage === 'pt' ?
                'Não há fotos para guardar' :
                'No photos to save';
            this.showNotification(message, 'warning');
            return;
        }

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Actualizar solo las fotos (mantener los artículos existentes)
            const proposal = this.allProposals.find(p => p.id === proposalId);
            const existingArticles = proposal?.amostras_enviadas_articulos_ids || [];

            const { error: updateError } = await this.supabase
                .from('presupuestos')
                .update({
                    amostras_enviadas_fotos_urls: allPhotos,
                    amostras_enviadas_articulos_ids: existingArticles
                })
                .eq('id', proposalId);

            if (updateError) {
                console.error('❌ Error al actualizar fotos:', updateError);
                throw updateError;
            }

            // Actualizar el objeto de la propuesta en memoria
            if (proposal) {
                proposal.amostras_enviadas_fotos_urls = allPhotos;
            }

            // Cerrar modal
            this.closeAddAmostrasPhotosModal();

            // Recargar propuestas para actualizar la vista
            await this.loadProposals();

            const successMessage = this.currentLanguage === 'es' ? 
                'Fotos agregadas correctamente' : 
                this.currentLanguage === 'pt' ?
                'Fotos adicionadas com sucesso' :
                'Photos added successfully';
            this.showNotification(successMessage, 'success');

        } catch (error) {
            console.error('❌ Error al guardar fotos:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    closeAddAmostrasPhotosModal() {
        const modal = document.getElementById('addAmostrasPhotosModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateAddAmostrasPhotosTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Adicionar Fotos de Amostras',
                photosLabel: 'Fotos das amostras enviadas:',
                addPhoto: 'Adicionar Foto',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Agregar Fotos de Muestras',
                photosLabel: 'Fotos de las muestras enviadas:',
                addPhoto: 'Agregar Foto',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Add Sample Photos',
                photosLabel: 'Photos of sent samples:',
                addPhoto: 'Add Photo',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'add-amostras-photos-modal-title': t.title,
            'add-amostras-photos-label': t.photosLabel,
            'add-amostras-photos-add-btn': t.addPhoto,
            'add-amostras-photos-cancel-btn': t.cancel,
            'add-amostras-photos-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    showImageModal(imageUrl, title = '') {
        // Crear o reutilizar modal de imagen
        let modal = document.getElementById('imageModalAmostras');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'imageModalAmostras';
            modal.className = 'image-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                animation: fadeIn 0.3s;
            `;
            modal.innerHTML = `
                <div class="image-modal-content" style="
                    position: relative;
                    margin: auto;
                    padding: 20px;
                    width: 90%;
                    max-width: 1200px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    top: 50%;
                    transform: translateY(-50%);
                ">
                    <span class="image-modal-close" onclick="window.proposalsManager.closeImageModal()" style="
                        position: absolute;
                        top: 10px;
                        right: 25px;
                        color: #fff;
                        font-size: 40px;
                        font-weight: bold;
                        cursor: pointer;
                        z-index: 10001;
                        transition: opacity 0.2s;
                    ">&times;</span>
                    <img class="image-modal-img" src="" alt="" style="
                        max-width: 100%;
                        max-height: 80vh;
                        object-fit: contain;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                    ">
                    <div class="image-modal-title" style="
                        margin-top: 20px;
                        color: #fff;
                        font-size: 1.25rem;
                        font-weight: 600;
                        text-align: center;
                    "></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const modalImg = modal.querySelector('.image-modal-img');
        const modalTitle = modal.querySelector('.image-modal-title');
        
        if (modalImg) {
            modalImg.src = imageUrl;
            modalImg.alt = title || 'Imagen';
        }
        
        if (modalTitle) {
            modalTitle.textContent = title || '';
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Cerrar al hacer click fuera de la imagen
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                this.closeImageModal();
            }
        }.bind(this));
    }

    closeImageModal() {
        const modal = document.getElementById('imageModalAmostras');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    updateAmostraEnviadaTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Amostra Enviada',
                productsLabel: 'Selecione os artigos das amostras enviadas:',
                photosLabel: 'Fotos das amostras enviadas:',
                addPhoto: 'Adicionar Foto',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Muestra Enviada',
                productsLabel: 'Seleccione los artículos de las muestras enviadas:',
                photosLabel: 'Fotos de las muestras enviadas:',
                addPhoto: 'Agregar Foto',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Sample Sent',
                productsLabel: 'Select the articles of the sent samples:',
                photosLabel: 'Photos of sent samples:',
                addPhoto: 'Add Photo',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'amostra-enviada-modal-title': t.title,
            'amostra-enviada-products-label': t.productsLabel,
            'amostra-enviada-photos-label': t.photosLabel,
            'amostra-enviada-add-photo-btn': t.addPhoto,
            'amostra-enviada-cancel-btn': t.cancel,
            'amostra-enviada-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    // ============================================
    // MODAL: Aguarda Aprovação de Dossier
    // ============================================
    openAguardaAprovacaoDossierModal(proposal) {
        const modal = document.getElementById('aguardaAprovacaoDossierModal');
        const documentsContainer = document.getElementById('aguarda-dossier-documents-container');
        
        if (!modal) {
            console.error('Modal aguarda aprovação dossier not found');
            return;
        }

        // Limpiar documentos anteriores
        if (documentsContainer) {
            documentsContainer.innerHTML = '';
        }

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateAguardaAprovacaoDossierTranslations();

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async saveAguardaAprovacaoDossierStatus() {
        const modal = document.getElementById('aguardaAprovacaoDossierModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener documentos cargados (máximo 3)
        const documentsContainer = document.getElementById('aguarda-dossier-documents-container');
        const uploadedDocuments = documentsContainer ? Array.from(documentsContainer.querySelectorAll('[data-url]')).map(el => el.getAttribute('data-url')).slice(0, 3) : [];

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Guardar información de dossier
            const dossierData = {
                presupuesto_id: proposalId,
                documentos_urls: uploadedDocuments
            };

            // Verificar si ya existe un registro
            const { data: existing } = await this.supabase
                .from('presupuestos_dossiers')
                .select('id')
                .eq('presupuesto_id', proposalId)
                .single();

            if (existing) {
                await this.supabase
                    .from('presupuestos_dossiers')
                    .update(dossierData)
                    .eq('presupuesto_id', proposalId);
            } else {
                await this.supabase
                    .from('presupuestos_dossiers')
                    .insert([dossierData]);
            }

            // Actualizar estado de la propuesta
            await this.updateProposalStatus(proposalId, 'aguarda_aprovacao_dossier');

            // Cerrar modal
            this.closeAguardaAprovacaoDossierModal();

        } catch (error) {
            console.error('Error al guardar dossier:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    closeAguardaAprovacaoDossierModal() {
        const modal = document.getElementById('aguardaAprovacaoDossierModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateAguardaAprovacaoDossierTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Aguarda Aprovação de Dossier',
                documentsLabel: 'Documentos ou imagens do dossier (máximo 3):',
                addDocument: 'Adicionar Documento',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Aguarda Aprobación de Dossier',
                documentsLabel: 'Documentos o imágenes del dossier (máximo 3):',
                addDocument: 'Agregar Documento',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Awaiting Dossier Approval',
                documentsLabel: 'Dossier documents or images (maximum 3):',
                addDocument: 'Add Document',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'aguarda-dossier-modal-title': t.title,
            'aguarda-dossier-documents-label': t.documentsLabel,
            'aguarda-dossier-add-document-btn': t.addDocument,
            'aguarda-dossier-cancel-btn': t.cancel,
            'aguarda-dossier-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    // ============================================
    // MODAL: Aguarda Pagamento
    // ============================================
    openAguardaPagamentoModal(proposal) {
        const modal = document.getElementById('aguardaPagamentoModal');
        
        if (!modal) {
            console.error('Modal aguarda pagamento not found');
            return;
        }

        // Prellenar campos si ya existen datos
        const numeroClienteInput = document.getElementById('aguarda-pagamento-numero-cliente');
        const tipoClienteInput = document.getElementById('aguarda-pagamento-tipo-cliente');
        const numeroFacturaInput = document.getElementById('aguarda-pagamento-numero-factura');
        const valorAdjudicacionInput = document.getElementById('aguarda-pagamento-valor-adjudicacion');

        if (numeroClienteInput) {
            numeroClienteInput.value = proposal.numero_cliente || '';
        }
        if (tipoClienteInput) {
            tipoClienteInput.value = proposal.tipo_cliente || '';
        }
        if (numeroFacturaInput) {
            numeroFacturaInput.value = proposal.numero_factura_proforma || '';
        }
        if (valorAdjudicacionInput) {
            valorAdjudicacionInput.value = proposal.valor_adjudicacion || '';
        }

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateAguardaPagamentoTranslations();

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async saveAguardaPagamentoStatus() {
        const modal = document.getElementById('aguardaPagamentoModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener valores del formulario
        const numeroCliente = document.getElementById('aguarda-pagamento-numero-cliente')?.value.trim() || null;
        const tipoCliente = document.getElementById('aguarda-pagamento-tipo-cliente')?.value.trim() || null;
        const numeroFactura = document.getElementById('aguarda-pagamento-numero-factura')?.value.trim() || null;
        const valorAdjudicacion = document.getElementById('aguarda-pagamento-valor-adjudicacion')?.value.trim() || null;

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Actualizar datos de la propuesta
            const updateData = {};
            if (numeroCliente) updateData.numero_cliente = numeroCliente;
            if (tipoCliente) updateData.tipo_cliente = tipoCliente;
            if (numeroFactura) updateData.numero_factura_proforma = numeroFactura;
            if (valorAdjudicacion) updateData.valor_adjudicacion = parseFloat(valorAdjudicacion) || null;

            if (Object.keys(updateData).length > 0) {
                await this.supabase
                    .from('presupuestos')
                    .update(updateData)
                    .eq('id', proposalId);
            }

            // Actualizar estado de la propuesta
            await this.updateProposalStatus(proposalId, 'aguarda_pagamento');

            // Cerrar modal
            this.closeAguardaPagamentoModal();

        } catch (error) {
            console.error('Error al guardar aguarda pagamento:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    closeAguardaPagamentoModal() {
        const modal = document.getElementById('aguardaPagamentoModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateAguardaPagamentoTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Aguarda Pagamento',
                numeroClienteLabel: 'Número de Cliente:',
                tipoClienteLabel: 'Tipo de Cliente:',
                numeroFacturaLabel: 'Número de Factura Proforma:',
                valorAdjudicacionLabel: 'Valor de Adjudicação:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Aguarda Pagamento',
                numeroClienteLabel: 'Número de Cliente:',
                tipoClienteLabel: 'Tipo de Cliente:',
                numeroFacturaLabel: 'Número de Factura Proforma:',
                valorAdjudicacionLabel: 'Valor de Adjudicación:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Awaiting Payment',
                numeroClienteLabel: 'Client Number:',
                tipoClienteLabel: 'Client Type:',
                numeroFacturaLabel: 'Proforma Invoice Number:',
                valorAdjudicacionLabel: 'Award Value:',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'aguarda-pagamento-modal-title': t.title,
            'aguarda-pagamento-numero-cliente-label': t.numeroClienteLabel,
            'aguarda-pagamento-tipo-cliente-label': t.tipoClienteLabel,
            'aguarda-pagamento-numero-factura-label': t.numeroFacturaLabel,
            'aguarda-pagamento-valor-adjudicacion-label': t.valorAdjudicacionLabel,
            'aguarda-pagamento-cancel-btn': t.cancel,
            'aguarda-pagamento-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    // ============================================
    // MODAL: Encomenda en Curso
    // ============================================
    openEncomendaEnCursoModal(proposal) {
        const modal = document.getElementById('encomendaEnCursoModal');
        const productsList = document.getElementById('encomenda-en-curso-products-list');
        const fornecedoresContainer = document.getElementById('encomenda-en-curso-fornecedores');
        
        if (!modal) {
            console.error('Modal encomenda en curso not found');
            return;
        }

        // Limpiar lista anterior
        if (productsList) {
            productsList.innerHTML = '';
        }
        if (fornecedoresContainer) {
            fornecedoresContainer.innerHTML = '';
        }

        // Crear checkboxes para cada artículo con cantidad editable
        if (proposal.articulos && proposal.articulos.length > 0) {
            proposal.articulos.forEach((articulo, index) => {
                const item = document.createElement('div');
                item.className = 'product-checkbox-item';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '10px';
                item.style.marginBottom = '10px';
                
                const articuloId = articulo.id || `temp-${index}`;
                const isChecked = articulo.encomendado === true || articulo.encomendado === 'true';
                
                // Buscar fornecedor del producto
                // Buscar por ID, phc_ref o referencia_fornecedor
                const product = this.allProducts?.find(p => 
                    String(p.id) === String(articulo.referencia_articulo) ||
                    String(p.phc_ref) === String(articulo.referencia_articulo) ||
                    String(p.referencia_fornecedor) === String(articulo.referencia_articulo)
                );
                const fornecedor = product?.nombre_fornecedor || 'Sin fornecedor';
                
                item.innerHTML = `
                    <input type="checkbox" id="encomenda-curso-product-${proposal.id}-${index}" value="${articuloId}" data-articulo-id="${articuloId}" data-fornecedor="${fornecedor}" ${isChecked ? 'checked' : ''} onchange="window.proposalsManager.toggleEncomendaProduct('${proposal.id}', ${index}, '${fornecedor}')">
                    <label for="encomenda-curso-product-${proposal.id}-${index}" style="flex: 1; cursor: pointer;">
                        <strong>${articulo.nombre_articulo || '-'}</strong> 
                        (Ref: ${articulo.referencia_articulo || '-'}) - 
                        ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: 
                        <input type="number" min="1" value="${articulo.cantidad || 1}" data-articulo-id="${articuloId}" style="width: 60px; padding: 4px; margin-left: 5px;" onchange="window.proposalsManager.updateEncomendaQuantity('${proposal.id}', '${articuloId}', this.value)">
                    </label>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">Fornecedor: ${fornecedor}</span>
                `;
                if (productsList) {
                    productsList.appendChild(item);
                }
            });
        }

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateEncomendaEnCursoTranslations();

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    toggleEncomendaProduct(proposalId, index, fornecedor) {
        const checkbox = document.getElementById(`encomenda-curso-product-${proposalId}-${index}`);
        const fornecedoresContainer = document.getElementById('encomenda-en-curso-fornecedores');
        
        if (!checkbox || !fornecedoresContainer) return;

        if (checkbox.checked) {
            // Agregar campo de número de encomienda para este fornecedor si no existe
            const fornecedorId = `fornecedor-${fornecedor.replace(/\s+/g, '-').toLowerCase()}`;
            if (!document.getElementById(fornecedorId)) {
                const fornecedorDiv = document.createElement('div');
                fornecedorDiv.id = fornecedorId;
                fornecedorDiv.style.marginBottom = '15px';
                fornecedorDiv.innerHTML = `
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                        ${this.currentLanguage === 'es' ? 'Número de Encomienda' : this.currentLanguage === 'pt' ? 'Número de Encomenda' : 'Order Number'} - ${fornecedor}:
                    </label>
                    <input type="text" class="fornecedor-encomenda-number" data-fornecedor="${fornecedor}" placeholder="${this.currentLanguage === 'es' ? 'Número de encomienda...' : this.currentLanguage === 'pt' ? 'Número de encomenda...' : 'Order number...'}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; margin-top: 10px; font-weight: 600;">
                        ${this.currentLanguage === 'es' ? 'Fecha de Encomenda' : this.currentLanguage === 'pt' ? 'Data de Encomenda' : 'Order Date'} - ${fornecedor}:
                    </label>
                    <input type="date" class="fornecedor-encomenda-date" data-fornecedor="${fornecedor}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;">
                `;
                fornecedoresContainer.appendChild(fornecedorDiv);
            }
        }
    }

    updateEncomendaQuantity(proposalId, articuloId, newQuantity) {
        // Guardar la cantidad actualizada (se guardará al guardar el estado)
        const modal = document.getElementById('encomendaEnCursoModal');
        if (modal) {
            const quantityInput = modal.querySelector(`input[data-articulo-id="${articuloId}"]`);
            if (quantityInput) {
                quantityInput.setAttribute('data-updated-quantity', newQuantity);
            }
        }
    }

    async saveEncomendaEnCursoStatus() {
        const modal = document.getElementById('encomendaEnCursoModal');
        const proposalId = modal?.getAttribute('data-proposal-id');
        
        if (!proposalId) {
            console.error('Proposal ID not found');
            return;
        }

        // Obtener la propuesta desde allProposals
        const proposal = this.allProposals.find(p => p.id === proposalId);
        if (!proposal) {
            console.error('Proposal not found');
            const message = this.currentLanguage === 'es' ? 
                'Error: No se encontró la propuesta' : 
                this.currentLanguage === 'pt' ?
                'Erro: Proposta não encontrada' :
                'Error: Proposal not found';
            this.showNotification(message, 'error');
            return;
        }

        // Obtener productos seleccionados con sus cantidades actualizadas
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        const selectedProducts = Array.from(checkboxes).map(cb => {
            const articuloId = cb.getAttribute('data-articulo-id');
            const fornecedor = cb.getAttribute('data-fornecedor');
            const quantityInput = modal.querySelector(`input[data-articulo-id="${articuloId}"]`);
            const quantity = quantityInput ? parseInt(quantityInput.value) || parseInt(quantityInput.getAttribute('data-updated-quantity')) || 1 : 1;
            
            return {
                articulo_id: articuloId,
                fornecedor: fornecedor,
                quantidade: quantity
            };
        });

        if (selectedProducts.length === 0) {
            const message = this.currentLanguage === 'es' ? 
                'Debe seleccionar al menos un producto' : 
                this.currentLanguage === 'pt' ?
                'Deve selecionar pelo menos um produto' :
                'You must select at least one product';
            this.showNotification(message, 'error');
            return;
        }

        // Obtener números de encomienda por fornecedor
        const fornecedorNumbers = {};
        const numberInputs = modal.querySelectorAll('.fornecedor-encomenda-number');
        numberInputs.forEach(input => {
            const fornecedor = input.getAttribute('data-fornecedor');
            const number = input.value.trim();
            if (fornecedor && number) {
                fornecedorNumbers[fornecedor] = number;
            }
        });

        if (!this.supabase) {
            await this.initializeSupabase();
        }

        try {
            // Obtener IDs de artículos seleccionados (filtrar IDs inválidos)
            const selectedArticleIds = selectedProducts
                .map(p => p.articulo_id)
                .filter(id => id && id !== 'null' && id !== 'undefined' && !id.toString().startsWith('temp-'));

            console.log('📦 Actualizando artículos para encomenda en curso:', {
                proposalId,
                selectedArticleIds,
                fornecedorNumbers
            });

            // Validar IDs (UUIDs)
            const validIds = selectedArticleIds.filter(id => {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                return id && uuidRegex.test(id);
            });

            if (validIds.length === 0) {
                console.error('❌ No hay IDs válidos para actualizar');
                const message = this.currentLanguage === 'es' ? 
                    'Error: No se encontraron IDs válidos de artículos' : 
                    this.currentLanguage === 'pt' ?
                    'Erro: Não foram encontrados IDs válidos de artigos' :
                    'Error: No valid article IDs found';
                this.showNotification(message, 'error');
                return;
            }

            // Combinar números de encomenda por fornecedor (si hay múltiples, separados por coma)
            const allNumbers = Object.values(fornecedorNumbers).filter(n => n && n.trim() !== '');
            const combinedNumbers = allNumbers.length > 0 ? allNumbers.join(', ') : null;

            // Obtener fechas de encomenda por fornecedor
            const fornecedorDates = {};
            const dateInputs = modal.querySelectorAll('.fornecedor-encomenda-date');
            dateInputs.forEach(input => {
                const fornecedor = input.getAttribute('data-fornecedor');
                const date = input.value.trim();
                if (fornecedor && date) {
                    fornecedorDates[fornecedor] = date;
                }
            });

            // Obtener la fecha de encomenda (usar la primera fecha encontrada o fecha actual)
            let encomendaDate = null;
            const dates = Object.values(fornecedorDates).filter(d => d && d.trim() !== '');
            if (dates.length > 0) {
                encomendaDate = dates[0]; // Usar la primera fecha encontrada
            } else {
                // Si no hay fecha ingresada, usar la fecha actual
                encomendaDate = new Date().toISOString().split('T')[0];
            }

            // Primero, desmarcar todos los artículos de esta propuesta como encomendados
            const { error: unmarkError } = await this.supabase
                .from('presupuestos_articulos')
                .update({
                    encomendado: false,
                    fecha_encomenda: null,
                    numero_encomenda: null
                })
                .eq('presupuesto_id', proposalId);

            if (unmarkError) {
                console.warn('⚠️ Error al desmarcar artículos anteriores:', unmarkError);
            }

            // Obtener las cantidades de cada artículo seleccionado
            const articulosConCantidad = validIds.map(id => {
                const selectedProduct = selectedProducts.find(p => p.articulo_id === id);
                const articulo = proposal.articulos.find(a => a.id === id);
                // Usar la cantidad del producto seleccionado si está disponible, sino la cantidad del artículo
                const cantidad = selectedProduct?.quantidade || (articulo ? (parseInt(articulo.cantidad) || 0) : 0);
                return {
                    id: id,
                    cantidad: cantidad
                };
            });

            // Actualizar cada artículo individualmente con su cantidad encomendada
            const updatePromises = articulosConCantidad.map(art => {
                return this.supabase
                    .from('presupuestos_articulos')
                    .update({
                        encomendado: true,
                        fecha_encomenda: encomendaDate,
                        numero_encomenda: combinedNumbers,
                        cantidad_encomendada: art.cantidad
                    })
                    .eq('id', art.id)
                    .eq('presupuesto_id', proposalId);
            });

            const updateResults = await Promise.all(updatePromises);
            const updateError = updateResults.find(r => r.error)?.error;
            const updateData = updateResults.filter(r => r.data && r.data.length > 0).flatMap(r => r.data);

            if (updateError) {
                console.error('❌ Error al actualizar artículos encomendados:', updateError);
                console.error('❌ Detalles del error:', {
                    code: updateError.code,
                    message: updateError.message,
                    details: updateError.details,
                    hint: updateError.hint
                });
                const message = this.currentLanguage === 'es' ? 
                    `Error al actualizar artículos: ${updateError.message}` : 
                    this.currentLanguage === 'pt' ?
                    `Erro ao atualizar artigos: ${updateError.message}` :
                    `Error updating articles: ${updateError.message}`;
                this.showNotification(message, 'error');
                return;
            }

            console.log('✅ Artículos actualizados correctamente:', updateData?.length || 0, 'artículos');

            // Actualizar estado de la propuesta
            await this.updateProposalStatus(proposalId, 'encomenda_en_curso');

            // Recargar propuestas para reflejar los cambios
            await this.loadProposals();

            const message = this.currentLanguage === 'es' ? 
                'Estado actualizado correctamente' : 
                this.currentLanguage === 'pt' ?
                'Estado atualizado com sucesso' :
                'Status updated successfully';
            this.showNotification(message, 'success');

            // Cerrar modal
            this.closeEncomendaEnCursoModal();
        } catch (error) {
            console.error('Error al guardar encomenda en curso:', error);
            const message = this.currentLanguage === 'es' ? 
                `Error al guardar: ${error.message}` : 
                this.currentLanguage === 'pt' ?
                `Erro ao guardar: ${error.message}` :
                `Error saving: ${error.message}`;
            this.showNotification(message, 'error');
        }
    }

    /**
     * Guardar fechas previstas de entrega de artículos encomendados
     */
    async saveEncomendaDates(proposalId) {
        if (!this.supabase) {
            await this.initializeSupabase();
        }

        const translations = {
            es: {
                success: 'Fechas previstas de entrega guardadas correctamente',
                error: 'Error al guardar las fechas previstas de entrega',
                noArticles: 'No hay artículos encomendados para actualizar'
            },
            pt: {
                success: 'Datas previstas de entrega guardadas com sucesso',
                error: 'Erro ao guardar as datas previstas de entrega',
                noArticles: 'Não há artigos encomendados para atualizar'
            },
            en: {
                success: 'Expected delivery dates saved successfully',
                error: 'Error saving expected delivery dates',
                noArticles: 'No ordered articles to update'
            }
        };

        const t = translations[this.currentLanguage] || translations.es;

        try {
            const proposal = this.allProposals.find(p => p.id === proposalId);
            const articulosEncomendados = (proposal?.articulos || []).filter(a => a.encomendado === true || a.encomendado === 'true');

            const fechaInputs = document.querySelectorAll(`input[id^="fecha-prevista-entrega-"]`);
            if (fechaInputs.length === 0) {
                this.showNotification(t.noArticles, 'warning');
                return;
            }

            const formatDateForDesc = (val) => {
                if (!val) return '';
                const d = typeof val === 'string' ? val.split('T')[0] : val;
                return new Date(d).toLocaleDateString(this.currentLanguage === 'es' ? 'es-ES' : this.currentLanguage === 'pt' ? 'pt-PT' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };
            const usuario = localStorage.getItem('commercial_name') || 'Sistema';
            const entradasHistorial = [];

            for (const input of Array.from(fechaInputs)) {
                const articuloId = input.getAttribute('data-articulo-id');
                const nuevaFecha = input.value || null;
                if (!articuloId) continue;
                const articulo = articulosEncomendados.find(a => a.id === articuloId);
                const nombreArt = articulo?.nombre_articulo || articuloId;
                const fechaAntigua = articulo?.fecha_prevista_entrega ? (articulo.fecha_prevista_entrega.split ? articulo.fecha_prevista_entrega.split('T')[0] : articulo.fecha_prevista_entrega) : null;
                const fechaAntiguaStr = formatDateForDesc(fechaAntigua);
                const nuevaFechaStr = formatDateForDesc(nuevaFecha);

                if (nuevaFecha && !fechaAntigua) {
                    const desc = this.currentLanguage === 'pt' ? `Data prevista de entrega definida para "${nombreArt}": ${nuevaFechaStr}. (${usuario})` : this.currentLanguage === 'en' ? `Expected delivery date set for "${nombreArt}": ${nuevaFechaStr}. (${usuario})` : `Fecha estimada de entrega definida para "${nombreArt}": ${nuevaFechaStr}. (${usuario})`;
                    entradasHistorial.push({ fecha: new Date().toISOString(), tipo: 'fecha_entrega_definida', descripcion: desc, usuario });
                } else if (fechaAntigua && nuevaFecha && fechaAntiguaStr !== nuevaFechaStr) {
                    const desc = this.currentLanguage === 'pt' ? `Data prevista de entrega alterada para "${nombreArt}": de ${fechaAntiguaStr} para ${nuevaFechaStr}. (${usuario})` : this.currentLanguage === 'en' ? `Expected delivery date changed for "${nombreArt}": from ${fechaAntiguaStr} to ${nuevaFechaStr}. (${usuario})` : `Fecha estimada de entrega alterada para "${nombreArt}": de ${fechaAntiguaStr} a ${nuevaFechaStr}. (${usuario})`;
                    entradasHistorial.push({ fecha: new Date().toISOString(), tipo: 'fecha_entrega_alterada', descripcion: desc, usuario });
                }
            }

            const updatePromises = Array.from(fechaInputs).map(input => {
                const articuloId = input.getAttribute('data-articulo-id');
                const fechaPrevista = input.value || null;
                if (!articuloId) return Promise.resolve({ error: null });
                return this.supabase
                    .from('presupuestos_articulos')
                    .update({ fecha_prevista_entrega: fechaPrevista })
                    .eq('id', articuloId)
                    .eq('presupuesto_id', proposalId);
            });

            const updateResults = await Promise.all(updatePromises);
            const errors = updateResults.filter(r => r.error);
            if (errors.length > 0) {
                console.error('❌ Errores al actualizar fechas:', errors);
                throw new Error(errors[0].error?.message || 'Error al actualizar fechas');
            }

            if (entradasHistorial.length > 0) {
                const { data: row } = await this.supabase.from('presupuestos').select('historial_modificaciones').eq('id', proposalId).single();
                const historialActual = row?.historial_modificaciones || [];
                const nuevoHistorial = [...historialActual, ...entradasHistorial];
                await this.supabase.from('presupuestos').update({ historial_modificaciones: nuevoHistorial }).eq('id', proposalId);
            }

            await this.loadProposals();

            // Recargar los detalles para mostrar los cambios
            this.viewProposalDetails(proposalId);

            // Mostrar notificación de éxito
            this.showNotification(t.success, 'success');
        } catch (error) {
            console.error('Error al guardar fechas previstas de entrega:', error);
            this.showNotification(t.error, 'error');
        }
    }

    closeEncomendaEnCursoModal() {
        const modal = document.getElementById('encomendaEnCursoModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateEncomendaEnCursoTranslations() {
        const lang = this.currentLanguage;
        const translations = {
            pt: {
                title: 'Encomenda em Curso',
                productsLabel: 'Selecione os artigos que foram encomendados:',
                fornecedoresLabel: 'Números de Encomenda por Fornecedor:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            es: {
                title: 'Encomenda en Curso',
                productsLabel: 'Seleccione los artículos que fueron encomendados:',
                fornecedoresLabel: 'Números de Encomenda por Fornecedor:',
                cancel: 'Cancelar',
                save: 'Guardar'
            },
            en: {
                title: 'Order in Progress',
                productsLabel: 'Select the articles that were ordered:',
                fornecedoresLabel: 'Order Numbers by Supplier:',
                cancel: 'Cancel',
                save: 'Save'
            }
        };

        const t = translations[lang] || translations.pt;

        const elements = {
            'encomenda-en-curso-modal-title': t.title,
            'encomenda-en-curso-products-label': t.productsLabel,
            'encomenda-en-curso-fornecedores-label': t.fornecedoresLabel,
            'encomenda-en-curso-cancel-btn': t.cancel,
            'encomenda-en-curso-save-text': t.save
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
    }

    // ============================================
    // MODAL: Encomenda Concluída (mejorado)
    // ============================================
    async openEncomendaConcluidaModal(proposal) {
        // Verificar si pasó por "Encomenda en curso"
        const currentStatus = (proposal.estado_propuesta || '').toLowerCase();
        const passedEncomendaEnCurso = currentStatus.includes('encomenda') && currentStatus.includes('curso');

        if (passedEncomendaEnCurso) {
            // Cargar artículos ya encomendados
            if (!this.supabase) {
                await this.initializeSupabase();
            }

            try {
                const { data: articulosEncomendados } = await this.supabase
                    .from('presupuestos_articulos_encomendados')
                    .select('*')
                    .eq('presupuesto_id', proposal.id);

                // Mostrar modal con artículos ya encomendados y permitir agregar más
                this.openEncomendaConcluidaWithEncomendadosModal(proposal, articulosEncomendados || []);
            } catch (error) {
                console.error('Error al cargar artículos encomendados:', error);
                // Si hay error, mostrar modal normal
                this.openEncomendaConcluidaProductsOnlyModal(proposal);
            }
        } else {
            // Si no pasó por "Encomenda en curso", mostrar modal para seleccionar todos los productos
            this.openEncomendaConcluidaProductsOnlyModal(proposal);
        }
    }

    openEncomendaConcluidaWithEncomendadosModal(proposal, articulosEncomendados) {
        const modal = document.getElementById('changeStatusEncomendaConcluidaModal');
        const productsList = document.getElementById('concluida-products-list');
        
        if (!modal || !productsList) {
            console.error('Modal elements not found');
            return;
        }

        // Limpiar lista anterior
        productsList.innerHTML = '';

        // Crear sección de artículos ya encomendados (solo lectura)
        const encomendadosSet = new Set(articulosEncomendados.map(a => a.articulo_id));
        
        const encomendadosSection = document.createElement('div');
        encomendadosSection.style.marginBottom = '20px';
        encomendadosSection.style.padding = '15px';
        encomendadosSection.style.background = 'var(--bg-gray-100, #f3f4f6)';
        encomendadosSection.style.borderRadius = '8px';
        encomendadosSection.innerHTML = `
            <h4 style="margin-bottom: 10px; font-weight: 600;">
                ${this.currentLanguage === 'es' ? 'Artículos ya Encomendados:' : this.currentLanguage === 'pt' ? 'Artigos já Encomendados:' : 'Already Ordered Articles:'}
            </h4>
        `;

        proposal.articulos.forEach((articulo, index) => {
            if (encomendadosSet.has(articulo.id)) {
                const encomendado = articulosEncomendados.find(a => a.articulo_id === articulo.id);
                const item = document.createElement('div');
                item.style.padding = '8px';
                item.style.marginBottom = '5px';
                item.style.background = 'white';
                item.style.borderRadius = '4px';
                item.innerHTML = `
                    <strong>${articulo.nombre_articulo || '-'}</strong> 
                    (Ref: ${articulo.referencia_articulo || '-'}) - 
                    ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: ${encomendado?.quantidade || articulo.cantidad || 0}
                    ${encomendado?.fornecedor ? ` - Fornecedor: ${encomendado.fornecedor}` : ''}
                `;
                encomendadosSection.appendChild(item);
            }
        });

        productsList.appendChild(encomendadosSection);

        // Crear sección de artículos faltantes (seleccionables)
        const faltantesSection = document.createElement('div');
        faltantesSection.style.marginTop = '20px';
        faltantesSection.innerHTML = `
            <h4 style="margin-bottom: 10px; font-weight: 600;">
                ${this.currentLanguage === 'es' ? 'Artículos Faltantes (seleccionar si se avanzó con más):' : this.currentLanguage === 'pt' ? 'Artigos Faltantes (selecionar se avançou com mais):' : 'Missing Articles (select if advanced with more):'}
            </h4>
        `;

        proposal.articulos.forEach((articulo, index) => {
            if (!encomendadosSet.has(articulo.id)) {
                const item = document.createElement('div');
                item.className = 'product-checkbox-item';
                const articuloId = articulo.id || `temp-${index}`;
                const isChecked = articulo.concluido === true || articulo.concluido === 'true';
                item.innerHTML = `
                    <input type="checkbox" id="concluida-product-${proposal.id}-${index}" value="${articuloId}" data-articulo-id="${articuloId}" ${isChecked ? 'checked' : ''}>
                    <label for="concluida-product-${proposal.id}-${index}" style="flex: 1; cursor: pointer;">
                        <strong>${articulo.nombre_articulo || '-'}</strong> 
                        (Ref: ${articulo.referencia_articulo || '-'}) - 
                        ${this.currentLanguage === 'es' ? 'Cantidad' : this.currentLanguage === 'pt' ? 'Quantidade' : 'Quantity'}: 
                        <input type="number" min="1" value="${articulo.cantidad || 1}" data-articulo-id="${articuloId}" style="width: 60px; padding: 4px; margin-left: 5px;">
                    </label>
                `;
                faltantesSection.appendChild(item);
            }
        });

        productsList.appendChild(faltantesSection);

        // Guardar el ID de la propuesta
        modal.setAttribute('data-proposal-id', proposal.id);

        // Actualizar traducciones
        this.updateEncomendaConcluidaTranslations();

        // Mostrar modal
        modal.classList.add('active');
    }
}

// Funciones globales para cerrar modales
function closeProposalDetails() {
    const modal = document.getElementById('proposalDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function closeEncomendadoModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeEncomendadoModal();
    }
}

function closeEncomendaConcluidaModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeEncomendaConcluidaModal();
    }
}

function saveEncomendaConcluidaStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveEncomendaConcluidaStatus();
    }
}

function closeRejeitadaModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeRejeitadaModal();
    }
}

function saveEncomendadoStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveEncomendadoStatus();
    }
}

function saveRejeitadaStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveRejeitadaStatus();
    }
}

// Funciones globales para modales de amostra enviada
function closeAmostraPedidaModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeAmostraPedidaModal();
    }
}

function saveAmostraPedidaStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveAmostraPedidaStatus();
    }
}

function closeAmostraEnviadaModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeAmostraEnviadaModal();
    }
}

function saveAmostraEnviadaStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveAmostraEnviadaStatus();
    }
}

function addAmostraPhoto() {
    const input = document.getElementById('amostra-enviada-photo-input');
    if (input) {
        input.click();
    }
}

function addAmostraPhotoToModal() {
    const input = document.getElementById('add-amostras-photo-input');
    if (input) {
        input.click();
    }
}

function removeAmostraPhotoFromModal(button) {
    button.closest('div').remove();
}

async function handleAddAmostraPhotoUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const container = document.getElementById('add-amostras-photos-container');
    if (!container) return;

    // Limitar a 10 fotos máximo
    const existingPhotos = container.querySelectorAll('img[data-url]').length;
    if (existingPhotos + files.length > 10) {
        const message = window.proposalsManager?.currentLanguage === 'es' ? 
            'Máximo 10 fotos permitidas' : 
            window.proposalsManager?.currentLanguage === 'pt' ?
            'Máximo 10 fotos permitidas' :
            'Maximum 10 photos allowed';
        alert(message);
        return;
    }

    if (!window.proposalsManager || !window.proposalsManager.supabase) {
        await window.proposalsManager.initializeSupabase();
    }

    // Crear un cliente específico para Storage sin headers globales que interfieran
    let storageClient;
    try {
        if (window.SUPABASE_CONFIG && typeof supabase !== 'undefined' && supabase.createClient) {
            storageClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                },
                global: {
                    headers: {}
                }
            });
        } else {
            storageClient = window.proposalsManager.supabase;
        }
    } catch (e) {
        console.warn('⚠️ No se pudo crear cliente específico para Storage, usando cliente existente:', e);
        storageClient = window.proposalsManager.supabase;
    }

    for (const originalFile of files) {
        try {
            const fileExt = originalFile.name.split('.').pop().toLowerCase();
            const mimeTypeMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'avif': 'image/avif',
                'bmp': 'image/bmp',
                'svg': 'image/svg+xml'
            };
            const correctMimeType = mimeTypeMap[fileExt] || 'image/jpeg';
            
            let fileToUpload = originalFile;
            const needsCorrection = !originalFile.type || 
                                   !originalFile.type.startsWith('image/') || 
                                   originalFile.type === 'application/json' ||
                                   originalFile.type === 'application/octet-stream';
            
            if (needsCorrection) {
                fileToUpload = new File([originalFile], originalFile.name, { 
                    type: correctMimeType,
                    lastModified: originalFile.lastModified || Date.now()
                });
            }

            const fileName = `amostras/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { data, error } = await storageClient.storage
                .from('product-images')
                .upload(fileName, fileToUpload, {
                    contentType: correctMimeType,
                    upsert: false
                });

            if (error) throw error;

            const { data: urlData } = storageClient.storage
                .from('product-images')
                .getPublicUrl(fileName);

            if (!urlData || !urlData.publicUrl) {
                throw new Error('No se pudo obtener la URL pública de la imagen');
            }

            const publicUrl = urlData.publicUrl;

            // Crear elemento de imagen
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = 'position: relative; width: 150px; height: 150px; border-radius: 8px; overflow: hidden; border: 2px solid var(--bg-gray-300);';
            imgDiv.innerHTML = `
                <img src="${publicUrl}" data-url="${publicUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="removeAmostraPhotoFromModal(this)" style="position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 12px;"></i>
                </button>
            `;
            container.appendChild(imgDiv);
        } catch (error) {
            console.error('Error al subir foto:', error);
            const message = window.proposalsManager?.currentLanguage === 'es' ? 
                `Error al subir foto: ${error.message}` : 
                window.proposalsManager?.currentLanguage === 'pt' ?
                `Erro ao fazer upload da foto: ${error.message}` :
                `Error uploading photo: ${error.message}`;
            alert(message);
        }
    }

    // Limpiar input
    event.target.value = '';
}

function closeAddAmostrasPhotosModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeAddAmostrasPhotosModal();
    }
}

function saveAddAmostrasPhotos() {
    if (window.proposalsManager) {
        window.proposalsManager.saveAddAmostrasPhotos();
    }
}

async function handleAmostraPhotoUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const container = document.getElementById('amostra-enviada-photos-container');
    if (!container) return;

    // Limitar a 10 fotos máximo
    const existingPhotos = container.querySelectorAll('img[data-url]').length;
    if (existingPhotos + files.length > 10) {
        const message = window.proposalsManager?.currentLanguage === 'es' ? 
            'Máximo 10 fotos permitidas' : 
            window.proposalsManager?.currentLanguage === 'pt' ?
            'Máximo 10 fotos permitidas' :
            'Maximum 10 photos allowed';
        alert(message);
        return;
    }

    if (!window.proposalsManager || !window.proposalsManager.supabase) {
        await window.proposalsManager.initializeSupabase();
    }

    // Crear un cliente específico para Storage sin headers globales que interfieran
    // Esto evita que headers como 'Content-Type': 'application/json' afecten las subidas
    let storageClient;
    try {
        if (window.SUPABASE_CONFIG && typeof supabase !== 'undefined' && supabase.createClient) {
            storageClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                },
                global: {
                    headers: {}
                }
            });
            console.log('✅ Cliente específico para Storage creado');
        } else {
            // Fallback: usar el cliente existente
            console.log('⚠️ Usando cliente existente para Storage');
            storageClient = window.proposalsManager.supabase;
        }
    } catch (e) {
        console.warn('⚠️ No se pudo crear cliente específico para Storage, usando cliente existente:', e);
        storageClient = window.proposalsManager.supabase;
    }

    for (const originalFile of files) {
        try {
            console.log('📤 Iniciando subida de foto:', {
                name: originalFile.name,
                type: originalFile.type,
                size: originalFile.size
            });

            // Obtener extensión del archivo
            const fileExt = originalFile.name.split('.').pop().toLowerCase();
            
            // Mapeo de extensiones a tipos MIME
            const mimeTypeMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'avif': 'image/avif',
                'bmp': 'image/bmp',
                'svg': 'image/svg+xml'
            };

            // Determinar el tipo MIME correcto basado en la extensión
            const correctMimeType = mimeTypeMap[fileExt] || 'image/jpeg';
            
            // Validar y corregir tipo MIME si es necesario
            let fileToUpload = originalFile;
            const needsCorrection = !originalFile.type || 
                                   !originalFile.type.startsWith('image/') || 
                                   originalFile.type === 'application/json' ||
                                   originalFile.type === 'application/octet-stream';
            
            if (needsCorrection) {
                console.log(`🔧 Corrigiendo tipo MIME de "${originalFile.type || 'sin tipo'}" a "${correctMimeType}"`);
                // Crear un nuevo File con el tipo MIME correcto
                fileToUpload = new File([originalFile], originalFile.name, { 
                    type: correctMimeType,
                    lastModified: originalFile.lastModified || Date.now()
                });
            } else if (originalFile.type !== correctMimeType) {
                // Si el tipo es válido pero no coincide con la extensión, usar el tipo correcto
                console.log(`🔧 Ajustando tipo MIME de "${originalFile.type}" a "${correctMimeType}" basado en extensión`);
                fileToUpload = new File([originalFile], originalFile.name, { 
                    type: correctMimeType,
                    lastModified: originalFile.lastModified || Date.now()
                });
            }

            // Verificar que el tipo MIME sea correcto antes de subir
            if (!fileToUpload.type || !fileToUpload.type.startsWith('image/')) {
                throw new Error(`Tipo MIME inválido: ${fileToUpload.type}. El archivo debe ser una imagen.`);
            }

            console.log('✅ Archivo preparado para subida:', {
                name: fileToUpload.name,
                type: fileToUpload.type,
                size: fileToUpload.size
            });

            // Subir imagen a Supabase Storage en el bucket product-images
            const fileName = `amostras/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            console.log('📤 Subiendo a Supabase Storage:', {
                bucket: 'product-images',
                fileName: fileName,
                contentType: fileToUpload.type
            });

            const { data, error } = await storageClient.storage
                .from('product-images')
                .upload(fileName, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: fileToUpload.type
                });

            if (error) {
                console.error('❌ Error de Supabase Storage:', error);
                // Proporcionar mensajes de error más descriptivos
                if (error.message && (error.message.includes('Bucket not found') || error.message.includes('not found'))) {
                    throw new Error('El bucket "product-images" no existe. Por favor, créalo en Supabase Dashboard > Storage.');
                } else if (error.message && error.message.includes('row-level security policy')) {
                    throw new Error('Error de permisos: No tienes permiso para subir imágenes. Verifica las políticas RLS del bucket "product-images".');
                } else {
                    throw new Error(`Error al subir la imagen: ${error.message || JSON.stringify(error)}`);
                }
            }

            console.log('✅ Archivo subido exitosamente:', data);

            // Obtener URL pública
            const { data: urlData } = storageClient.storage
                .from('product-images')
                .getPublicUrl(fileName);

            if (!urlData || !urlData.publicUrl) {
                throw new Error('No se pudo obtener la URL pública de la imagen');
            }

            const publicUrl = urlData.publicUrl;
            console.log('✅ URL pública obtenida:', publicUrl);

            // Crear elemento de imagen
            const imgDiv = document.createElement('div');
            imgDiv.style.position = 'relative';
            imgDiv.style.display = 'inline-block';
            imgDiv.style.margin = '5px';
            imgDiv.innerHTML = `
                <img src="${publicUrl}" data-url="${publicUrl}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid var(--bg-gray-300);">
                <button type="button" onclick="removeAmostraPhoto(this)" style="position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-times" style="font-size: 12px;"></i>
                </button>
            `;
            container.appendChild(imgDiv);
        } catch (error) {
            console.error('Error al subir foto:', error);
            const message = window.proposalsManager?.currentLanguage === 'es' ? 
                `Error al subir foto: ${error.message}` : 
                window.proposalsManager?.currentLanguage === 'pt' ?
                `Erro ao fazer upload da foto: ${error.message}` :
                `Error uploading photo: ${error.message}`;
            alert(message);
        }
    }

    // Limpiar input
    event.target.value = '';
}

function removeAmostraPhoto(button) {
    button.closest('div').remove();
}

// Funciones globales para modal de aguarda aprovação de dossier
function closeAguardaAprovacaoDossierModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeAguardaAprovacaoDossierModal();
    }
}

function saveAguardaAprovacaoDossierStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveAguardaAprovacaoDossierStatus();
    }
}

function addDossierDocument() {
    const input = document.getElementById('aguarda-dossier-document-input');
    if (input) {
        input.click();
    }
}

async function handleDossierDocumentUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const container = document.getElementById('aguarda-dossier-documents-container');
    if (!container) return;

    // Limitar a 3 documentos máximo
    const existingDocs = container.querySelectorAll('[data-url]').length;
    if (existingDocs + files.length > 3) {
        const message = window.proposalsManager?.currentLanguage === 'es' ? 
            'Máximo 3 documentos permitidos' : 
            window.proposalsManager?.currentLanguage === 'pt' ?
            'Máximo 3 documentos permitidos' :
            'Maximum 3 documents allowed';
        alert(message);
        return;
    }

    if (!window.proposalsManager || !window.proposalsManager.supabase) {
        await window.proposalsManager.initializeSupabase();
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
            if (window.proposalsManager.supabase && window.proposalsManager.supabase.auth) {
                const { data: { session } } = await window.proposalsManager.supabase.auth.getSession();
                if (session) {
                    await storageClient.auth.setSession(session);
                }
            }
        } else {
            // Fallback al cliente compartido si no podemos crear uno nuevo
            storageClient = window.proposalsManager.supabase;
        }
    } catch (error) {
        console.warn('⚠️ No se pudo crear cliente específico para Storage, usando cliente compartido:', error);
        storageClient = window.proposalsManager.supabase;
    }

    for (const file of files) {
        try {
            // Subir documento a Supabase Storage
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `dossiers/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            // Obtener el tipo MIME del archivo
            let contentType = file.type;
            
            // Si el archivo no tiene tipo MIME, intentar determinarlo por extensión
            if (!contentType || contentType === 'application/octet-stream' || contentType === 'application/json') {
                const mimeTypes = {
                    'pdf': 'application/pdf',
                    'png': 'image/png',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'xls': 'application/vnd.ms-excel',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'txt': 'text/plain',
                    'zip': 'application/zip',
                    'rar': 'application/x-rar-compressed'
                };
                contentType = mimeTypes[fileExt] || 'application/octet-stream';
            }
            
            // Crear un nuevo File object con el tipo MIME correcto para evitar que Supabase lo detecte como JSON
            let finalFile = file;
            if (!file.type || file.type === 'application/json' || file.type === 'application/octet-stream') {
                console.log(`🔧 Corrigiendo tipo MIME de "${file.type}" a "${contentType}"`);
                finalFile = new File([file], file.name, { type: contentType });
            }
            
            // Subir con el tipo MIME correcto al mismo bucket que los logos usando el cliente específico
            const { data, error } = await storageClient.storage
                .from('proposal-logos')
                .upload(fileName, finalFile, {
                    contentType: contentType,
                    upsert: false
                });

            if (error) throw error;

            // Obtener URL pública usando el mismo cliente
            const { data: { publicUrl } } = storageClient.storage
                .from('proposal-logos')
                .getPublicUrl(fileName);

            // Crear elemento de documento
            const docDiv = document.createElement('div');
            docDiv.style.position = 'relative';
            docDiv.style.display = 'inline-block';
            docDiv.style.margin = '5px';
            
            if (file.type.startsWith('image/')) {
                docDiv.innerHTML = `
                    <img src="${publicUrl}" data-url="${publicUrl}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid var(--bg-gray-300);">
                    <button type="button" onclick="removeDossierDocument(this)" style="position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-times" style="font-size: 12px;"></i>
                    </button>
                `;
            } else {
                docDiv.innerHTML = `
                    <div style="width: 150px; height: 150px; border: 2px solid var(--bg-gray-300); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; background: var(--bg-gray-100);">
                        <i class="fas fa-file" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 10px;"></i>
                        <span style="font-size: 12px; color: var(--text-secondary); text-align: center; word-break: break-word;">${file.name}</span>
                    </div>
                    <a href="${publicUrl}" target="_blank" data-url="${publicUrl}" style="position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none;">
                        <i class="fas fa-times" style="font-size: 12px;"></i>
                    </a>
                `;
            }
            container.appendChild(docDiv);
        } catch (error) {
            console.error('Error al subir documento:', error);
            const message = window.proposalsManager?.currentLanguage === 'es' ? 
                `Error al subir documento: ${error.message}` : 
                window.proposalsManager?.currentLanguage === 'pt' ?
                `Erro ao fazer upload do documento: ${error.message}` :
                `Error uploading document: ${error.message}`;
            alert(message);
        }
    }

    // Limpiar input
    event.target.value = '';
}

function removeDossierDocument(button) {
    button.closest('div').remove();
}

// Funciones globales para modal de aguarda pagamento
function closeAguardaPagamentoModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeAguardaPagamentoModal();
    }
}

function saveAguardaPagamentoStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveAguardaPagamentoStatus();
    }
}

// Funciones globales para modal de encomenda en curso
function closeEncomendaEnCursoModal() {
    if (window.proposalsManager) {
        window.proposalsManager.closeEncomendaEnCursoModal();
    }
}

function saveEncomendaEnCursoStatus() {
    if (window.proposalsManager) {
        window.proposalsManager.saveEncomendaEnCursoStatus();
    }
}

/**
 * Cerrar modal de código de propuesta
 */
function closeProposalCodeModal() {
    const modal = document.getElementById('proposalCodeModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Funciones globales
function applyFilters() {
    if (window.proposalsManager) {
        window.proposalsManager.applyFilters();
    }
}

function clearFilters() {
    if (window.proposalsManager) {
        window.proposalsManager.clearFilters();
    }
}

function closeProposalDetails() {
    const modal = document.getElementById('proposalDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, inicializando ProposalsManager...');
    
    try {
    window.proposalsManager = new ProposalsManager();
        console.log('✅ ProposalsManager creado');
    } catch (error) {
        console.error('❌ Error al crear ProposalsManager:', error);
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        const noProposals = document.getElementById('noProposals');
        if (noProposals) {
            noProposals.style.display = 'block';
            noProposals.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: var(--danger-500); font-size: 3rem; margin-bottom: var(--space-4);"></i>
                <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-2);">Error al inicializar la página</p>
                <p style="font-size: 0.875rem; color: var(--text-secondary);">${error.message}</p>
                <button onclick="location.reload()" style="margin-top: var(--space-4); padding: var(--space-3) var(--space-5); background: var(--brand-blue); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
                    Recargar Página
                </button>
            `;
        }
    }

    // Escuchar cambios de idioma
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            window.proposalsManager.currentLanguage = localStorage.getItem('language') || 'pt';
            window.proposalsManager.updateTranslations();
            window.proposalsManager.renderProposals();
        });
    }

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('proposalDetailsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProposalDetails();
            }
        });
    }

    // Cerrar modal de código al hacer clic fuera
    const codeModal = document.getElementById('proposalCodeModal');
    if (codeModal) {
        codeModal.addEventListener('click', (e) => {
            if (e.target === codeModal) {
                closeProposalCodeModal();
            }
        });
    }

    // Cerrar modal de logos al hacer clic fuera
    const logosModal = document.getElementById('proposalLogosModal');
    if (logosModal) {
        logosModal.addEventListener('click', (e) => {
            if (e.target === logosModal) {
                closeProposalLogosModal();
            }
        });
    }

});

/**
 * Cerrar modal de código de propuesta
 */
function closeProposalCodeModal() {
    const modal = document.getElementById('proposalCodeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cerrar modal de logotipos de propuesta
 */
function closeProposalLogosModal() {
    const modal = document.getElementById('proposalLogosModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function closeProposalDossiersModal() {
    const modal = document.getElementById('proposalDossiersModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Función global para cambiar idioma (llamada desde los botones de bandera)
 */
function changeLanguage(lang) {
    // Guardar idioma en localStorage
    localStorage.setItem('language', lang);
    
    // Actualizar botones de idioma
    document.querySelectorAll('.flag-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-lang="${lang}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Actualizar el sistema de traducción global si existe
    if (window.translationSystem) {
        window.translationSystem.setLanguage(lang);
    }
    
    // Actualizar el ProposalsManager
    if (window.proposalsManager) {
        window.proposalsManager.currentLanguage = lang;
        window.proposalsManager.updateTranslations();
        window.proposalsManager.renderProposals();
    }
}
