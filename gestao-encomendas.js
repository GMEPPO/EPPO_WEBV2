/**
 * Gestão de Encomendas – listado por propuesta y detalles con campos editables por artículo.
 * No modifica otras páginas; página independiente.
 */
(function () {
    const TEXTS = {
        pt: {
            loading: 'A carregar...',
            empty: 'Nenhuma encomenda.',
            numPropuesta: 'Nº Proposta',
            responsable: 'Responsável',
            fornecedores: 'Fornecedores',
            detalles: 'Detalhes',
            voltar: 'Voltar',
            productoRef: 'Produto / Referência',
            cantidad: 'Quantidade',
            precio: 'Preço',
            fornecedor: 'Fornecedor',
            numEncomenda: 'Nº Encomenda',
            fechaEncomenda: 'Data da encomenda',
            previsaoEntrega: 'Previsão de entrega',
            desconto: 'Desconto %',
            guardar: 'Guardar',
            guardado: 'Guardado.',
            error: 'Erro ao guardar.',
            errorCarga: 'Erro ao carregar dados.',
            pendientes: 'Pedidos pendentes',
            enCurso: 'Pedidos em curso',
            nuevosProveedores: 'Contactos com novos fornecedores',
            refPhc: 'Ref. PHC',
            observaciones: 'Observações',
            faltaCriarCodigo: 'Falta criar código PHC',
            refFornecedor: 'Ref. fornecedor',
            designacao: 'Designação',
            peso: 'Peso',
            qtyCaixa: 'Qtd. por caixa',
            personalizado: 'Personalizado',
            sim: 'Sim',
            nao: 'Não',
            semPhc: 'Sem PHC',
            obrigatorioPhcSemCodigo: 'É obrigatório preencher a Ref. PHC para todos os produtos sem código PHC para guardar e colocar a encomenda em curso.',
            tipo: 'Tipo',
            estado: 'Estado',
            solicitudPrecios: 'Pedido de preços',
            solicitudMuestras: 'Pedido de amostras',
            solicitudReunion: 'Pedido de reunião',
            pedidosNuevosProveedores: 'Contactos com novos fornecedores',
            contactoFinalizado: 'Contacto finalizado',
            marcarContactoFinalizado: 'Marcar como contacto finalizado',
            nenhumRegisto: 'Nenhum registo.',
            erroCarregar: 'Erro ao carregar.',
            fotos: 'Fotos',
            verFotos: 'Ver fotos',
            fechar: 'Fechar',
            tipoEncomienda: 'Encomenda',
            tipoPedidoAmostra: 'Solicitar amostras',
            tipoPedidoEspecial: 'Pedido especial',
            tipoCriacaoCodigos: 'Criação de códigos',
            tipoReclamacao: 'Reclamação',
            tipoPedidoPrecosNovos: 'Pedido de preços (novos fornecedores)',
            tipoSolicitarAmostrasFornec: 'Solicitar amostras (fornecedores)',
            tipoPropostaNormal: 'Proposta',
            contactoFornecedor: 'Contacto fornecedor',
            marcarFinalizado: 'Marcar como finalizado',
            anexosDocumentos: 'Anexos e documentos',
            historicoEmails: 'Histórico de emails',
            verDescargar: 'Ver / Descargar',
            ver: 'Ver',
            descargar: 'Descarregar',
            nenhumAnexo: 'Nenhum anexo.',
            anexos: 'Anexos',
            historico: 'Histórico',
            encomendasConcluidas: 'Encomendas concluídas',
            contactosFinalizados: 'Contactos finalizados',
            concluirTarefa: 'Concluir tarefa',
            confirmarConcluir: 'Quer marcar esta encomenda como concluída? Ela passará para o Histórico.',
            searchPlaceholder: 'Buscar por proposta, responsável, fornecedor, tipo...',
            valorTransportes: 'Valor transportes',
            temCliche: 'Cliché',
            precoCliche: 'Preço cliché'
        },
        es: {
            loading: 'Cargando...',
            empty: 'Ningún pedido de encomenda.',
            numPropuesta: 'Nº Propuesta',
            responsable: 'Responsable',
            fornecedores: 'Fornecedores',
            detalles: 'Detalles',
            voltar: 'Volver',
            productoRef: 'Producto / Referencia',
            cantidad: 'Cantidad',
            precio: 'Precio',
            fornecedor: 'Fornecedor',
            numEncomenda: 'Nº Encomenda',
            fechaEncomenda: 'Fecha Encomenda',
            previsaoEntrega: 'Previsión Entrega',
            desconto: 'Descuento %',
            guardar: 'Guardar',
            guardado: 'Guardado.',
            error: 'Error al guardar.',
            errorCarga: 'Error al cargar datos.',
            pendientes: 'Pedidos pendientes',
            enCurso: 'Pedidos en curso',
            nuevosProveedores: 'Pedidos nuevos proveedores',
            refPhc: 'Ref. PHC',
            observaciones: 'Observaciones',
            faltaCriarCodigo: 'Falta crear código PHC',
            refFornecedor: 'Ref. fornecedor',
            designacao: 'Designación',
            peso: 'Peso',
            qtyCaixa: 'Cant. por caja',
            personalizado: 'Personalizado',
            sim: 'Sí',
            nao: 'No',
            semPhc: 'Sin PHC',
            obrigatorioPhcSemCodigo: 'Es obligatorio rellenar la Ref. PHC para todos los productos sin código PHC para guardar y dejar la encomienda en curso.',
            tipo: 'Tipo',
            estado: 'Estado',
            solicitudPrecios: 'Solicitud de precios',
            solicitudMuestras: 'Solicitud de muestras',
            solicitudReunion: 'Solicitud de reunión',
            pedidosNuevosProveedores: 'Pedidos nuevos proveedores',
            contactoFinalizado: 'Contacto finalizado',
            marcarContactoFinalizado: 'Marcar como contacto finalizado',
            nenhumRegisto: 'Ningún registro.',
            erroCarregar: 'Error al cargar.',
            fotos: 'Fotos',
            verFotos: 'Ver fotos',
            fechar: 'Cerrar',
            tipoEncomienda: 'Encomienda',
            tipoPedidoAmostra: 'Solicitar muestras',
            tipoPedidoEspecial: 'Pedido especial',
            tipoCriacaoCodigos: 'Creación de códigos',
            tipoReclamacao: 'Reclamación',
            tipoPedidoPrecosNovos: 'Pedido de precios (nuevos proveedores)',
            tipoSolicitarAmostrasFornec: 'Solicitar muestras (proveedores)',
            tipoPropostaNormal: 'Propuesta',
            contactoFornecedor: 'Contacto proveedor',
            marcarFinalizado: 'Marcar como finalizado',
            anexosDocumentos: 'Anexos y documentos',
            historicoEmails: 'Histórico de emails',
            verDescargar: 'Ver / Descargar',
            ver: 'Ver',
            descargar: 'Descargar',
            nenhumAnexo: 'Ningún anexo.',
            anexos: 'Anexos',
            historico: 'Histórico',
            encomendasConcluidas: 'Encomendas concluídas',
            contactosFinalizados: 'Contactos finalizados',
            concluirTarefa: 'Concluir tarea',
            confirmarConcluir: '¿Marcar esta encomienda como concluida? Pasará al Histórico.',
            searchPlaceholder: 'Buscar por propuesta, responsable, proveedor, tipo...',
            valorTransportes: 'Valor transportes',
            temCliche: 'Clisé',
            precoCliche: 'Precio clisé'
        },
        en: {
            loading: 'Loading...',
            empty: 'No order requests.',
            numPropuesta: 'Proposal No.',
            responsable: 'Responsible',
            fornecedores: 'Suppliers',
            detalles: 'Details',
            voltar: 'Back',
            productoRef: 'Product / Reference',
            cantidad: 'Qty',
            precio: 'Price',
            fornecedor: 'Supplier',
            numEncomenda: 'Order No.',
            fechaEncomenda: 'Order Date',
            previsaoEntrega: 'Expected Delivery',
            desconto: 'Discount %',
            guardar: 'Save',
            guardado: 'Saved.',
            error: 'Error saving.',
            errorCarga: 'Error loading data.',
            pendientes: 'Pending orders',
            enCurso: 'Orders in progress',
            nuevosProveedores: 'New supplier contacts',
            refPhc: 'PHC Ref.',
            observaciones: 'Observations',
            faltaCriarCodigo: 'PHC code must be created',
            refFornecedor: 'Supplier ref.',
            designacao: 'Designation',
            peso: 'Weight',
            qtyCaixa: 'Qty per box',
            personalizado: 'Custom',
            sim: 'Yes',
            nao: 'No',
            semPhc: 'No PHC',
            obrigatorioPhcSemCodigo: 'PHC Ref. is required for all products without PHC code to save and move the order to in progress.',
            tipo: 'Type',
            estado: 'Status',
            solicitudPrecios: 'Price request',
            solicitudMuestras: 'Sample request',
            solicitudReunion: 'Meeting request',
            pedidosNuevosProveedores: 'New supplier contacts',
            contactoFinalizado: 'Contact completed',
            marcarContactoFinalizado: 'Mark as contact completed',
            nenhumRegisto: 'No records.',
            erroCarregar: 'Error loading.',
            fotos: 'Photos',
            verFotos: 'View photos',
            fechar: 'Close',
            tipoEncomienda: 'Order',
            tipoPedidoAmostra: 'Request samples',
            tipoPedidoEspecial: 'Special order',
            tipoCriacaoCodigos: 'Code creation',
            tipoReclamacao: 'Claim',
            tipoPedidoPrecosNovos: 'Price request (new suppliers)',
            tipoSolicitarAmostrasFornec: 'Request samples (suppliers)',
            tipoPropostaNormal: 'Proposal',
            contactoFornecedor: 'Supplier contact',
            marcarFinalizado: 'Mark as completed',
            anexosDocumentos: 'Attachments and documents',
            historicoEmails: 'Email history',
            verDescargar: 'View / Download',
            ver: 'View',
            descargar: 'Download',
            nenhumAnexo: 'No attachments.',
            anexos: 'Attachments',
            historico: 'History',
            encomendasConcluidas: 'Completed orders',
            contactosFinalizados: 'Closed contacts',
            concluirTarefa: 'Complete task',
            confirmarConcluir: 'Mark this order as completed? It will move to History.',
            searchPlaceholder: 'Search by proposal, responsible, supplier, type...',
            valorTransportes: 'Transport value',
            temCliche: 'Cliché',
            precoCliche: 'Cliché price'
        }
    };

    let supabase = null;
    let lang = 'pt';
    let listData = []; // { source: 'presupuesto'|'contacto_fornecedores', presupuesto_id?, contacto_id?, codigo_propuesta, responsavel, fornecedores: string[], tipoLabel, isEnCurso: boolean }
    let historicoListData = []; // { source: 'presupuesto'|'contacto_fornecedores', presupuesto_id?, contacto_id?, codigo_propuesta, responsavel, fornecedores: string[], tipoLabel, dataConclusao? }
    let enComendaNumeroMap = {}; // key: presupuesto_id + '|' + fornecedor -> numero_encomenda (para vista en curso)
    let currentTab = 'pendientes'; // 'pendientes' | 'encurso' | 'historico'
    let listSearchQuery = '';
    let geReadOnly = false; // true para admin: solo ver, no editar

    function t(key) {
        return (TEXTS[lang] || TEXTS.pt)[key] || key;
    }

    /** Tipos que corresponden a pedido de encomenda / creación de códigos. Solo estos deben aparecer en Gestão de Encomendas cuando no tienen filas en gestao_compras. */
    const TIPOS_PERMITIDOS_GE = ['encomienda', 'pedido_muestra', 'pedido_especial', 'criacao_codigos'];

    function isTipoPermitidoParaGestaoEncomendas(tipoRegistro) {
        if (!tipoRegistro || typeof tipoRegistro !== 'string') return false;
        return TIPOS_PERMITIDOS_GE.includes((tipoRegistro || '').trim().toLowerCase());
    }

    function getTipoLabelPresupuesto(tipoRegistro) {
        if (!tipoRegistro) return t('tipoPropostaNormal');
        const map = { encomienda: 'tipoEncomienda', pedido_muestra: 'tipoPedidoAmostra', pedido_especial: 'tipoPedidoEspecial', criacao_codigos: 'tipoCriacaoCodigos' };
        return t(map[tipoRegistro] || 'tipoPropostaNormal');
    }

    function getTipoLabelContacto(tipoPedido) {
        const map = { solicitud_precios: 'tipoPedidoPrecosNovos', reclamacao: 'tipoReclamacao', solicitud_muestras: 'tipoSolicitarAmostrasFornec' };
        return t(map[tipoPedido] || 'contactoFornecedor');
    }

    function setLoading(show) {
        const el = document.getElementById('ge-loading');
        const table = document.getElementById('ge-table');
        const empty = document.getElementById('ge-empty');
        if (el) el.style.display = show ? 'block' : 'none';
        if (table) table.style.display = show ? 'none' : 'table';
        if (empty) empty.style.display = 'none';
        const text = document.getElementById('ge-loading-text');
        if (text) text.textContent = t('loading');
    }

    function setEmpty(show) {
        const el = document.getElementById('ge-empty');
        const table = document.getElementById('ge-table');
        if (el) el.style.display = show ? 'block' : 'none';
        if (table) table.style.display = show ? 'none' : 'table';
        const text = document.getElementById('ge-empty-text');
        if (text) text.textContent = t('empty');
    }

    function showNotification(message, type) {
        if (window.proposalsManager && typeof window.proposalsManager.showNotification === 'function') {
            window.proposalsManager.showNotification(message, type);
            return;
        }
        alert(message);
    }

    async function getClient() {
        if (supabase) return supabase;
        if (window.universalSupabase) {
            supabase = await window.universalSupabase.getClient();
            return supabase;
        }
        return null;
    }

    async function loadList() {
        const client = await getClient();
        if (!client) {
            setLoading(false);
            setEmpty(true);
            showNotification(t('errorCarga'), 'error');
            return;
        }
        setLoading(true);

        try {
            const { data: rows, error } = await client
                .from('gestao_compras')
                .select('presupuesto_id, nome_fornecedor, presupuesto_articulo_id, tipo');

            if (error) throw error;

            const byPresupuesto = {};
            const tipoByPresupuesto = {};
            (rows || []).forEach(r => {
                const id = r.presupuesto_id;
                if (!byPresupuesto[id]) {
                    byPresupuesto[id] = { presupuesto_id: id, fornecedores: [], articuloIds: new Set() };
                }
                const fn = (r.nome_fornecedor || '').trim();
                if (fn && !byPresupuesto[id].fornecedores.includes(fn)) {
                    byPresupuesto[id].fornecedores.push(fn);
                }
                if (r.presupuesto_articulo_id) byPresupuesto[id].articuloIds.add(r.presupuesto_articulo_id);
                if (id && r.tipo && typeof r.tipo === 'string' && r.tipo.trim() !== '' && !tipoByPresupuesto[id]) {
                    tipoByPresupuesto[id] = r.tipo.trim();
                }
            });

            const presupuestoIds = Object.keys(byPresupuesto);
            if (presupuestoIds.length === 0) {
                listData = [];
            } else {

            const { data: presupuestos, error: errPres } = await client
                .from('presupuestos')
                .select('id, codigo_propuesta, responsavel, estado_propuesta, tipo_registro_directo')
                .in('id', presupuestoIds);

            if (errPres) throw errPres;

            const { data: articulos, error: errArt } = await client
                .from('presupuestos_articulos')
                .select('id, presupuesto_id, numero_encomenda')
                .in('presupuesto_id', presupuestoIds);

            if (errArt) throw errArt;
            const articuloNumeroMap = {};
            const articulosCountByPresupuesto = {};
            (articulos || []).forEach(a => {
                articuloNumeroMap[a.id] = (a.numero_encomenda || '').trim();
                const pid = a.presupuesto_id;
                if (pid) articulosCountByPresupuesto[pid] = (articulosCountByPresupuesto[pid] || 0) + 1;
            });

            enComendaNumeroMap = {};
            (rows || []).forEach(r => {
                const fn = (r.nome_fornecedor || '').trim();
                const pid = r.presupuesto_id;
                const aid = r.presupuesto_articulo_id;
                if (pid && fn && aid && !(pid + '|' + fn in enComendaNumeroMap)) {
                    const key = pid + '|' + fn;
                    const num = (articuloNumeroMap[aid] || '').trim();
                    enComendaNumeroMap[key] = num || '-';
                }
            });

            listData = (presupuestos || []).map(p => {
                const info = byPresupuesto[p.id] || { fornecedores: [], articuloIds: new Set() };
                const articuloIds = Array.from(info.articuloIds || []);
                const totalArticulos = articulosCountByPresupuesto[p.id] || 0;
                const hasArticulosPendientes = totalArticulos > articuloIds.length;
                const isEnCurso = articuloIds.length > 0 && articuloIds.every(aid => (articuloNumeroMap[aid] || '').trim() !== '');
                const tipoFromGestao = tipoByPresupuesto[p.id];
                const tipoLabel = (tipoFromGestao && (tipoFromGestao || '').trim() !== '')
                    ? tipoFromGestao.trim()
                    : getTipoLabelPresupuesto(p.tipo_registro_directo);
                return {
                    source: 'presupuesto',
                    presupuesto_id: p.id,
                    codigo_propuesta: p.codigo_propuesta || '-',
                    responsavel: p.responsavel || '-',
                    fornecedores: info.fornecedores,
                    tipoLabel: tipoLabel,
                    isEnCurso: !!isEnCurso,
                    hasArticulosPendientes: !!hasArticulosPendientes,
                    estado_propuesta: p.estado_propuesta || ''
                };
            });

            await syncEstadoEncursoOnLoad(client, listData);
            }

            const presupuestoIdsSet = new Set(presupuestoIds || []);
            const { data: presupuestosPendientes, error: errPend } = await client
                .from('presupuestos')
                .select('id, codigo_propuesta, responsavel, estado_propuesta, tipo_registro_directo')
                .or('estado_propuesta.eq.pedido_de_encomenda,estado_propuesta.eq.encomenda_en_curso');
            if (!errPend && presupuestosPendientes && presupuestosPendientes.length > 0) {
                const idsSinGc = presupuestosPendientes.filter(pp => !presupuestoIdsSet.has(pp.id)).map(pp => pp.id);
                if (idsSinGc.length > 0) {
                    const { data: artPend, error: errArtPend } = await client
                        .from('presupuestos_articulos')
                        .select('id, presupuesto_id')
                        .in('presupuesto_id', idsSinGc);
                    const countByPresupuesto = {};
                    (artPend || []).forEach(a => {
                        const pid = a.presupuesto_id;
                        if (pid) countByPresupuesto[pid] = (countByPresupuesto[pid] || 0) + 1;
                    });
                    idsSinGc.forEach(pid => {
                        if ((countByPresupuesto[pid] || 0) > 0) {
                            const pp = presupuestosPendientes.find(p => p.id === pid);
                            // Solo incluir si el tipo es de encomenda/creación de códigos; excluir propuestas normales ("Proposta")
                            if (pp && !listData.some(r => r.source === 'presupuesto' && r.presupuesto_id === pid) && isTipoPermitidoParaGestaoEncomendas(pp.tipo_registro_directo)) {
                                listData.push({
                                    source: 'presupuesto',
                                    presupuesto_id: pp.id,
                                    codigo_propuesta: pp.codigo_propuesta || '-',
                                    responsavel: pp.responsavel || '-',
                                    fornecedores: [],
                                    tipoLabel: getTipoLabelPresupuesto(pp.tipo_registro_directo),
                                    isEnCurso: false,
                                    hasArticulosPendientes: true,
                                    estado_propuesta: pp.estado_propuesta || ''
                                });
                            }
                        }
                    });
                }
            }

            const { data: contactosCf, error: errCf } = await client
                .from('contacto_nuevos_proveedores')
                .select('id, nombre_proveedor, tipo_pedido, observaciones, responsable')
                .eq('estado', 'pedidos_nuevos_proveedores')
                .order('created_at', { ascending: false });
            if (!errCf && contactosCf && contactosCf.length > 0) {
                contactosCf.forEach(c => {
                    listData.push({
                        source: 'contacto_fornecedores',
                        contacto_id: c.id,
                        codigo_propuesta: t('contactoFornecedor') + ' – ' + (c.nombre_proveedor || '-'),
                        responsavel: c.responsable || '-',
                        fornecedores: [(c.nombre_proveedor || '').trim()].filter(Boolean),
                        tipoLabel: getTipoLabelContacto(c.tipo_pedido),
                        isEnCurso: false
                    });
                });
            }

            renderList();
            updateTabCounts();
        } catch (e) {
            console.error('loadList:', e);
            showNotification(e.message || t('errorCarga'), 'error');
            setEmpty(true);
        } finally {
            setLoading(false);
        }
    }

    async function loadHistorico() {
        const client = await getClient();
        if (!client) return;
        setLoading(true);
        try {
            historicoListData = [];
            const { data: presupuestosConcluidos, error: errPres } = await client
                .from('presupuestos')
                .select('id, codigo_propuesta, responsavel, estado_propuesta')
                .or('estado_propuesta.ilike.%concluida%,estado_propuesta.ilike.%concluída%')
                .order('updated_at', { ascending: false });
            if (!errPres && presupuestosConcluidos && presupuestosConcluidos.length > 0) {
                const ids = presupuestosConcluidos.map(p => p.id);
                const { data: gcRows } = await client.from('gestao_compras').select('presupuesto_id, nome_fornecedor, tipo').in('presupuesto_id', ids);
                const tipoByPresupuesto = {};
                const fornecedoresByPresupuesto = {};
                const presupuestoIdsComGestao = new Set();
                (gcRows || []).forEach(r => {
                    if (r.presupuesto_id) presupuestoIdsComGestao.add(r.presupuesto_id);
                    if (r.presupuesto_id && r.tipo && (r.tipo || '').trim() !== '' && !tipoByPresupuesto[r.presupuesto_id]) tipoByPresupuesto[r.presupuesto_id] = r.tipo.trim();
                    if (r.presupuesto_id && r.nome_fornecedor) {
                        if (!fornecedoresByPresupuesto[r.presupuesto_id]) fornecedoresByPresupuesto[r.presupuesto_id] = [];
                        const fn = (r.nome_fornecedor || '').trim();
                        if (fn && !fornecedoresByPresupuesto[r.presupuesto_id].includes(fn)) fornecedoresByPresupuesto[r.presupuesto_id].push(fn);
                    }
                });
                presupuestosConcluidos.forEach(p => {
                    if (!presupuestoIdsComGestao.has(p.id)) return;
                    historicoListData.push({
                        source: 'presupuesto',
                        presupuesto_id: p.id,
                        codigo_propuesta: p.codigo_propuesta || '-',
                        responsavel: p.responsavel || '-',
                        fornecedores: fornecedoresByPresupuesto[p.id] || [],
                        tipoLabel: tipoByPresupuesto[p.id] || (lang === 'es' ? 'Encomenda Concluída' : lang === 'en' ? 'Order Completed' : 'Encomenda Concluída')
                    });
                });
            }
            const { data: contactosFinalizados, error: errCf } = await client
                .from('contacto_nuevos_proveedores')
                .select('id, nombre_proveedor, tipo_pedido, responsable')
                .eq('estado', 'contacto_finalizado')
                .order('updated_at', { ascending: false });
            if (!errCf && contactosFinalizados && contactosFinalizados.length > 0) {
                contactosFinalizados.forEach(c => {
                    historicoListData.push({
                        source: 'contacto_fornecedores',
                        contacto_id: c.id,
                        codigo_propuesta: t('contactoFornecedor') + ' – ' + (c.nombre_proveedor || '-'),
                        responsavel: c.responsable || '-',
                        fornecedores: [(c.nombre_proveedor || '').trim()].filter(Boolean),
                        tipoLabel: getTipoLabelContacto(c.tipo_pedido)
                    });
                });
            }
            historicoListData.sort((a, b) => {
                const ac = (a.codigo_propuesta || '').toLowerCase();
                const bc = (b.codigo_propuesta || '').toLowerCase();
                return bc.localeCompare(ac);
            });
            renderList();
            updateTabCounts();
        } catch (e) {
            console.error('loadHistorico:', e);
            showNotification(e.message || t('errorCarga'), 'error');
            setEmpty(true);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Para "Encomendas em curso": una fila por (fornecedor, propuesta), ordenado por fornecedor.
     * Así el Nº Proposta y el Responsável quedan asociados a cada línea por fornecedor.
     */
    function getEnCursoRowsByFornecedor() {
        const enCurso = listData.filter(row => row.source === 'presupuesto' && row.isEnCurso);
        const rows = [];
        enCurso.forEach(row => {
            (row.fornecedores || []).forEach(fornecedor => {
                const name = (fornecedor || '').trim();
                if (name) {
                    const key = row.presupuesto_id + '|' + name;
                    rows.push({
                        fornecedor: name,
                        codigo_propuesta: row.codigo_propuesta,
                        responsavel: row.responsavel,
                        presupuesto_id: row.presupuesto_id,
                        numero_encomenda: enComendaNumeroMap[key] || '-',
                        tipoLabel: row.tipoLabel || t('tipoPropostaNormal')
                    });
                }
            });
            if (!row.fornecedores || row.fornecedores.length === 0) {
                rows.push({
                    fornecedor: '-',
                    codigo_propuesta: row.codigo_propuesta,
                    responsavel: row.responsavel,
                    presupuesto_id: row.presupuesto_id,
                    numero_encomenda: enComendaNumeroMap[row.presupuesto_id + '|-'] || '-',
                    tipoLabel: row.tipoLabel || t('tipoPropostaNormal')
                });
            }
        });
        rows.sort((a, b) => {
            const c = (a.fornecedor || '').localeCompare(b.fornecedor || '', undefined, { sensitivity: 'base' });
            return c !== 0 ? c : (a.codigo_propuesta || '').localeCompare(b.codigo_propuesta || '');
        });
        return rows;
    }

    function updateTabCounts() {
        const pendientesCount = listData.filter(r => r.source === 'contacto_fornecedores' || !r.isEnCurso).length;
        const enCursoCount = getEnCursoRowsByFornecedor().length;
        const elP = document.getElementById('ge-tab-pendientes-count');
        const elE = document.getElementById('ge-tab-encurso-count');
        const elH = document.getElementById('ge-tab-historico-count');
        if (elP) elP.textContent = String(pendientesCount);
        if (elE) elE.textContent = String(enCursoCount);
        if (elH) elH.textContent = String(historicoListData.length);
    }

    function matchesListSearch(row, isEnCursoRow) {
        if (!listSearchQuery || listSearchQuery.length === 0) return true;
        const q = listSearchQuery.toLowerCase();
        const str = (s) => (s != null ? String(s).toLowerCase() : '');
        if (isEnCursoRow) {
            const a = str(row.codigo_propuesta) + ' ' + str(row.responsavel) + ' ' + str(row.fornecedor) + ' ' + str(row.numero_encomenda) + ' ' + str(row.tipoLabel);
            return a.indexOf(q) !== -1;
        }
        const fornecedoresStr = (row.fornecedores && Array.isArray(row.fornecedores)) ? row.fornecedores.map(f => str(f)).join(' ') : '';
        const a = str(row.codigo_propuesta) + ' ' + str(row.responsavel) + ' ' + fornecedoresStr + ' ' + str(row.tipoLabel);
        return a.indexOf(q) !== -1;
    }

    function updateTableHeaderForTab() {
        const thTipo = document.getElementById('ge-th-tipo');
        const thResp = document.getElementById('ge-th-resp');
        const thForn = document.getElementById('ge-th-forn');
        const thNumEnc = document.getElementById('ge-th-numenc');
        if (thTipo) thTipo.textContent = t('tipo');
        if (!thResp || !thForn) return;
        if (thNumEnc) thNumEnc.style.display = 'none';
        if (currentTab === 'encurso') {
            thResp.textContent = t('fornecedor');
            thForn.textContent = t('responsable');
            if (thNumEnc) {
                thNumEnc.textContent = t('numEncomenda');
                thNumEnc.style.display = '';
            }
        } else {
            thResp.textContent = t('responsable');
            thForn.textContent = t('fornecedores');
        }
    }

    function renderList() {
        const tbody = document.getElementById('ge-tbody');
        if (!tbody) return;
        updateTableHeaderForTab();

        if (currentTab === 'encurso') {
            let rows = getEnCursoRowsByFornecedor();
            rows = rows.filter(row => matchesListSearch(row, true));
            tbody.innerHTML = '';
            rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escapeHtml(row.tipoLabel || '')}</td>
                    <td>${escapeHtml(row.fornecedor)}</td>
                    <td>${escapeHtml(row.responsavel)}</td>
                    <td>${escapeHtml(row.numero_encomenda || '-')}</td>
                    <td><button type="button" class="ge-btn ge-btn-primary" data-presupuesto-id="${row.presupuesto_id}">${t('detalles')}</button></td>
                `;
                tr.querySelector('button').addEventListener('click', () => showDetails(row.presupuesto_id));
                tbody.appendChild(tr);
            });
            setEmpty(rows.length === 0);
        } else if (currentTab === 'historico') {
            const historicoFiltered = historicoListData.filter(row => matchesListSearch(row, false));
            tbody.innerHTML = '';
            historicoFiltered.forEach(row => {
                const tr = document.createElement('tr');
                const tagsHtml = (row.fornecedores || []).map(f => `<span class="ge-tag">${escapeHtml(f)}</span>`).join('');
                const isContacto = row.source === 'contacto_fornecedores';
                const btnData = isContacto ? `data-contacto-id="${row.contacto_id}"` : `data-presupuesto-id="${row.presupuesto_id}"`;
                tr.innerHTML = `
                    <td>${escapeHtml(row.tipoLabel || '')}</td>
                    <td>${escapeHtml(row.responsavel)}</td>
                    <td><div class="ge-tags">${tagsHtml || '<span class="ge-tag">-</span>'}</div></td>
                    <td><button type="button" class="ge-btn ge-btn-primary" ${btnData}>${t('detalles')}</button></td>
                `;
                const btn = tr.querySelector('button');
                if (isContacto) btn.addEventListener('click', () => showDetailsContactoFornecedores(row.contacto_id));
                else btn.addEventListener('click', () => showDetailsHistoricoPresupuesto(row.presupuesto_id));
                tbody.appendChild(tr);
            });
            setEmpty(historicoFiltered.length === 0);
        } else {
            // Solo pendientes: contactos + propuestas que aún no tienen todos los nº encomenda (no isEnCurso)
            let filtered = listData.filter(row => row.source === 'contacto_fornecedores' || !row.isEnCurso);
            filtered = filtered.filter(row => matchesListSearch(row, false));
            tbody.innerHTML = '';
            filtered.forEach(row => {
                const tr = document.createElement('tr');
                const tagsHtml = (row.fornecedores || []).map(f => `<span class="ge-tag">${escapeHtml(f)}</span>`).join('');
                const isContacto = row.source === 'contacto_fornecedores';
                const btnData = isContacto ? `data-contacto-id="${row.contacto_id}"` : `data-presupuesto-id="${row.presupuesto_id}"`;
                tr.innerHTML = `
                    <td>${escapeHtml(row.tipoLabel || '')}</td>
                    <td>${escapeHtml(row.responsavel)}</td>
                    <td><div class="ge-tags">${tagsHtml || '<span class="ge-tag">-</span>'}</div></td>
                    <td><button type="button" class="ge-btn ge-btn-primary" ${btnData}>${t('detalles')}</button></td>
                `;
                const btn = tr.querySelector('button');
                if (isContacto) btn.addEventListener('click', () => showDetailsContactoFornecedores(row.contacto_id));
                else btn.addEventListener('click', () => showDetails(row.presupuesto_id));
                tbody.appendChild(tr);
            });
            setEmpty(filtered.length === 0);
        }
    }

    function parseFotosUrls(val) {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (_) {
                return [];
            }
        }
        return [];
    }

    function getFileTypeFromUrl(url) {
        if (!url || typeof url !== 'string') return 'document';
        const path = url.split('?')[0].toLowerCase();
        if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/i.test(path)) return 'image';
        if (/\.pdf(\?|$)/i.test(path)) return 'pdf';
        if (/\.(msg|eml)(\?|$)/i.test(path)) return 'email';
        return 'document';
    }

    function getFilenameFromUrl(url) {
        if (!url || typeof url !== 'string') return 'documento';
        try {
            const path = decodeURIComponent(url.split('?')[0]);
            const name = path.split('/').pop() || 'documento';
            return name.replace(/[<>:"/\\|?*]/g, '_') || 'documento';
        } catch (_) {
            return 'documento';
        }
    }

    function buildDocPreviewCard(url, label) {
        const safe = escapeAttr(url);
        const type = getFileTypeFromUrl(url);
        const filename = getFilenameFromUrl(url);
        const safeFilename = escapeAttr(filename);
        const thumbSize = '44px';
        let preview = '';
        if (type === 'image') {
            preview = '<div class="ge-doc-preview-thumb" style="width:' + thumbSize + ';height:' + thumbSize + ';border-radius:6px;overflow:hidden;background:#334155;flex-shrink:0;position:relative;">' +
                '<span class="ge-thumb-fallback" style="display:none;position:absolute;inset:0;flex:1;align-items:center;justify-content:center;color:#64748b;font-size:1rem;"><i class="fas fa-image"></i></span>' +
                '<img src="' + safe + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';var f=this.parentElement.querySelector(\'.ge-thumb-fallback\');if(f)f.style.display=\'flex\';"></div>';
        } else {
            const icon = type === 'pdf' ? 'fa-file-pdf' : type === 'email' ? 'fa-envelope' : 'fa-file';
            const iconColor = type === 'pdf' ? '#ef4444' : type === 'email' ? '#3b82f6' : '#94a3b8';
            preview = '<div class="ge-doc-preview-icon" style="width:' + thumbSize + ';height:' + thumbSize + ';border-radius:6px;background:#334155;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + icon + '" style="font-size:1.15rem;color:' + iconColor + ';"></i></div>';
        }
        return '<div class="ge-doc-card" style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#1e293b;border-radius:6px;border:1px solid #334155;">' +
            preview +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.7rem;color:#e2e8f0;margin-bottom:4px;">' + escapeHtml(label || filename) + '</div>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
            '<a href="' + safe + '" target="_blank" rel="noopener noreferrer" class="ge-btn ge-btn-secondary" style="padding:2px 6px;font-size:0.65rem;"><i class="fas fa-external-link-alt"></i> ' + escapeHtml(t('ver')) + '</a>' +
            '<button type="button" class="ge-btn ge-btn-secondary ge-download-doc" data-download-url="' + safe + '" data-download-filename="' + safeFilename + '" style="padding:2px 6px;font-size:0.65rem;"><i class="fas fa-download"></i> ' + escapeHtml(t('descargar')) + '</button>' +
            '</div></div></div>';
    }

    function showFotosModal(urls) {
        if (!urls || urls.length === 0) return;
        let overlay = document.getElementById('ge-fotos-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ge-fotos-modal-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
            overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFotosModal(); });
            document.body.appendChild(overlay);
        }
        const wrap = document.createElement('div');
        wrap.style.cssText = 'background:#1e293b;border-radius:12px;max-width:90vw;max-height:85vh;overflow:auto;padding:1.5rem;border:1px solid #334155;';
        wrap.addEventListener('click', (e) => e.stopPropagation());
        const title = document.createElement('div');
        title.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;';
        title.innerHTML = '<span style="font-weight:600;color:#f1f5f9;">' + escapeHtml(t('fotos')) + '</span><button type="button" class="ge-btn ge-btn-secondary" id="ge-fotos-modal-close"><i class="fas fa-times"></i> ' + escapeHtml(t('fechar')) + '</button>';
        wrap.appendChild(title);
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;';
        urls.forEach(url => {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            const img = document.createElement('img');
            img.src = url;
            img.alt = '';
            img.style.cssText = 'width:100%;height:160px;object-fit:cover;border-radius:8px;border:1px solid #475569;';
            a.appendChild(img);
            grid.appendChild(a);
        });
        wrap.appendChild(grid);
        overlay.innerHTML = '';
        overlay.appendChild(wrap);
        document.getElementById('ge-fotos-modal-close').addEventListener('click', closeFotosModal);
        overlay.style.display = 'flex';
    }
    function closeFotosModal() {
        const overlay = document.getElementById('ge-fotos-modal-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    async function showDetails(presupuestoId) {
        const proposal = listData.find(p => p.presupuesto_id === presupuestoId);
        if (proposal && proposal.isEnCurso) {
            showDetailsEnCurso(presupuestoId);
            return;
        }
        showDetailsPendientes(presupuestoId);
    }

    async function showDetailsContactoFornecedores(contactoId) {
        const client = await getClient();
        if (!client) return;

        const listView = document.getElementById('ge-list-view');
        const detailsView = document.getElementById('ge-details-view');
        if (listView) listView.classList.add('hidden');
        if (detailsView) detailsView.classList.add('active');

        const row = listData.find(p => p.contacto_id === contactoId);
        const titleEl = document.getElementById('ge-detail-title');
        if (titleEl) titleEl.textContent = (row ? row.codigo_propuesta : t('contactoFornecedor')) + ' – ' + t('detalles');

        const blocksEl = document.getElementById('ge-detail-blocks');
        if (!blocksEl) return;
        blocksEl.innerHTML = '<div class="ge-loading">' + t('loading') + '</div>';

        try {
            const { data: c, error } = await client.from('contacto_nuevos_proveedores').select('*').eq('id', contactoId).single();
            if (error || !c) throw error || new Error('Registo não encontrado');

            const fotosUrls = parseFotosUrls(c.fotos_urls);
            let fotosHtml = '';
            if (fotosUrls.length > 0) {
                fotosUrls.forEach(url => {
                    const isPdf = (url || '').toLowerCase().includes('.pdf') || (url || '').toLowerCase().indexOf('pdf') !== -1;
                    if (isPdf) {
                        fotosHtml += '<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener" class="ge-btn ge-btn-secondary" style="margin-right:8px;margin-bottom:8px;"><i class="fas fa-file-pdf"></i> PDF</a>';
                    } else {
                        fotosHtml += '<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener" style="display:inline-block;margin-right:8px;margin-bottom:8px;"><img src="' + escapeAttr(url) + '" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #475569;"></a>';
                    }
                });
            } else {
                fotosHtml = '<span style="color:#94a3b8;">-</span>';
            }

            const btnHtml = geReadOnly ? '' : `<button type="button" class="ge-btn ge-btn-primary" id="ge-cf-marcar-finalizado">${t('marcarFinalizado')}</button>`;
            blocksEl.innerHTML = `
                <div class="ge-fornecedor-block">
                    <div class="ge-fornecedor-title">${t('contactoFornecedor')}</div>
                    <div style="display:grid;gap:1rem;margin-bottom:1rem;">
                        <div><label style="font-size:0.8rem;color:#94a3b8;">${t('fornecedor')}</label><div style="font-weight:600;color:#f1f5f9;">${escapeHtml(c.nombre_proveedor || '-')}</div></div>
                        <div><label style="font-size:0.8rem;color:#94a3b8;">${t('tipo')}</label><div style="font-weight:600;color:#f1f5f9;">${escapeHtml(getTipoLabelContacto(c.tipo_pedido))}</div></div>
                        <div><label style="font-size:0.8rem;color:#94a3b8;">${t('observaciones')}</label><div style="color:#e2e8f0;white-space:pre-wrap;">${escapeHtml(c.observaciones || '-')}</div></div>
                        <div><label style="font-size:0.8rem;color:#94a3b8;">${t('fotos')}</label><div style="margin-top:4px;">${fotosHtml}</div></div>
                    </div>
                    ${btnHtml}
                </div>
            `;
            const cfBtn = document.getElementById('ge-cf-marcar-finalizado');
            if (cfBtn && !geReadOnly) cfBtn.addEventListener('click', () => markContactoFinalizado(contactoId));
        } catch (e) {
            console.error('showDetailsContactoFornecedores:', e);
            blocksEl.innerHTML = '<div style="color:#f87171;">' + escapeHtml(e.message || t('erroCarregar')) + '</div>';
        }
    }

    async function markContactoFinalizado(contactoId) {
        if (!contactoId) return;
        const client = await getClient();
        if (!client) return;
        try {
            const { error } = await client.from('contacto_nuevos_proveedores').update({ estado: 'contacto_finalizado' }).eq('id', contactoId);
            if (error) throw error;
            showNotification(t('guardado'), 'success');
            const listView = document.getElementById('ge-list-view');
            const detailsView = document.getElementById('ge-details-view');
            if (listView) listView.classList.remove('hidden');
            if (detailsView) detailsView.classList.remove('active');
            await loadList();
        } catch (e) {
            showNotification(e.message || t('error'), 'error');
        }
    }

    async function showDetailsHistoricoPresupuesto(presupuestoId) {
        await showDetailsPendientes(presupuestoId);
    }

    async function showDetailsPendientes(presupuestoId) {
        const client = await getClient();
        if (!client) return;

        const listView = document.getElementById('ge-list-view');
        const detailsView = document.getElementById('ge-details-view');
        if (listView) listView.classList.add('hidden');
        if (detailsView) detailsView.classList.add('active');

        let proposal = listData.find(p => p.presupuesto_id === presupuestoId);
        if (!proposal && presupuestoId) {
            const { data: presupuestoRow } = await client.from('presupuestos').select('id, codigo_propuesta, responsavel').eq('id', presupuestoId).single();
            if (presupuestoRow) {
                proposal = { presupuesto_id: presupuestoRow.id, codigo_propuesta: presupuestoRow.codigo_propuesta || '-', responsavel: presupuestoRow.responsavel || '-' };
            }
        }
        const titleEl = document.getElementById('ge-detail-title');
        if (titleEl) titleEl.textContent = (proposal ? proposal.codigo_propuesta : presupuestoId) + ' – ' + t('detalles');

        const blocksEl = document.getElementById('ge-detail-blocks');
        if (!blocksEl) return;
        blocksEl.innerHTML = '<div class="ge-loading">' + t('loading') + '</div>';

        try {
            const { data: gcRows, error: gcErr } = await client
                .from('gestao_compras')
                .select('*')
                .eq('presupuesto_id', presupuestoId);

            if (gcErr) throw gcErr;

            const { data: articulos, error: artErr } = await client
                .from('presupuestos_articulos')
                .select('id, numero_encomenda, fecha_encomenda, fecha_prevista_entrega')
                .eq('presupuesto_id', presupuestoId);

            if (artErr) throw artErr;

            const articuloMap = {};
            (articulos || []).forEach(a => { articuloMap[a.id] = a; });

            // Agrupar por fornecedor: Nº Encomenda y Fecha Encomenda compartidos; Previsão Entrega por artículo
            const byFornecedor = {};
            (gcRows || []).forEach(gc => {
                const fn = (gc.nome_fornecedor || '').trim() || '-';
                if (!byFornecedor[fn]) byFornecedor[fn] = [];
                byFornecedor[fn].push(gc);
            });

            const codigoPropuesta = (proposal && proposal.codigo_propuesta) ? proposal.codigo_propuesta : (presupuestoId ? String(presupuestoId).substring(0, 8) : '-');
            const responsavelVal = (proposal && proposal.responsavel) ? proposal.responsavel : '-';
            let numeroPropostaBlock = '<div class="ge-fornecedor-block" style="margin-bottom:1rem;"><div style="display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:center;"><div><span style="font-size:0.8rem;color:#94a3b8;">' + t('numPropuesta') + '</span><div style="font-weight:600;color:#f1f5f9;font-size:1.1rem;">' + escapeHtml(codigoPropuesta) + '</div></div><div><span style="font-size:0.8rem;color:#94a3b8;">' + t('responsable') + '</span><div style="font-weight:600;color:#f1f5f9;">' + escapeHtml(responsavelVal) + '</div></div></div></div>';

            blocksEl.innerHTML = numeroPropostaBlock;
            Object.keys(byFornecedor).sort().forEach(fornecedorName => {
                const rows = byFornecedor[fornecedorName];
                const articuloIds = rows.map(r => r.presupuesto_articulo_id).filter(Boolean);
                const firstArt = articuloIds.length && articuloMap[articuloIds[0]] ? articuloMap[articuloIds[0]] : null;
                const numero = firstArt ? (firstArt.numero_encomenda || '') : '';
                const fecha = firstArt && firstArt.fecha_encomenda ? firstArt.fecha_encomenda.split('T')[0] : '';

                const block = document.createElement('div');
                block.className = 'ge-fornecedor-block';
                const formHtml = geReadOnly
                    ? `<div class="ge-fornecedor-form" style="display:grid;gap:0.5rem;margin-bottom:1rem;">
                        <div><label style="font-size:0.8rem;color:#94a3b8;">${t('numEncomenda')}</label><div style="font-weight:500;color:#f1f5f9;">${escapeHtml(numero || '-')}</div></div>
                        <div><label style="font-size:0.8rem;color:#94a3b8;">${t('fechaEncomenda')}</label><div style="font-weight:500;color:#f1f5f9;">${escapeHtml(fecha || '-')}</div></div>
                    </div>`
                    : `<div class="ge-fornecedor-form">
                        <div><label>${t('numEncomenda')}</label><input type="text" class="ge-editable ge-fn-numero" value="${escapeAttr(numero)}" placeholder="-"></div>
                        <div><label>${t('fechaEncomenda')}</label><input type="date" class="ge-editable ge-fn-fecha" value="${escapeAttr(fecha)}"></div>
                        <div style="align-self: flex-end;"><button type="button" class="ge-btn ge-btn-primary ge-save-fornecedor">${t('guardar')}</button></div>
                    </div>`;
                block.innerHTML = `
                    <div class="ge-fornecedor-title">${t('fornecedor')}: ${escapeHtml(fornecedorName)}</div>
                    ${formHtml}
                    <div class="ge-table-wrap">
                        <table class="ge-table">
                            <thead><tr><th>${t('productoRef')}</th><th>${t('refPhc')}</th><th>${t('cantidad')}</th><th>${t('precio')}</th><th>${t('desconto')}</th><th>${t('previsaoEntrega')}</th></tr></thead>
                            <tbody class="ge-fornecedor-tbody"></tbody>
                        </table>
                    </div>
                `;
                const tbody = block.querySelector('.ge-fornecedor-tbody');
                rows.forEach(gc => {
                    const preco = gc.precio_custo != null ? formatNumber(gc.precio_custo) : '-';
                    const desconto = gc.porcentaje_descuento != null ? formatNumber(gc.porcentaje_descuento) + '%' : '-';
                    const articuloId = (gc.presupuesto_articulo_id || '').toString();
                    const art = articuloId && articuloMap[articuloId] ? articuloMap[articuloId] : null;
                    const previsaoVal = art && art.fecha_prevista_entrega ? (typeof art.fecha_prevista_entrega === 'string' ? art.fecha_prevista_entrega.split('T')[0] : art.fecha_prevista_entrega) : '';
                    const hasArticuloId = articuloId && articuloId !== 'undefined';
                    const productDetailsHtml = buildProductDetailsHtml(gc, { showFaltaBadge: true });
                    const hasPhc = (gc.phc_ref || '').trim() !== '';
                    const isSemPhc = !!(gc.referencia || gc.designacao);
                    const needsPhcInput = isSemPhc && !hasPhc;
                    const gcId = (gc.id || '').toString();
                    const phcCell = geReadOnly
                        ? escapeHtml((gc.phc_ref || '').trim() || '-')
                        : (needsPhcInput
                            ? `<input type="text" class="ge-editable ge-phc-ref-input" data-gc-id="${escapeAttr(gcId)}" value="${escapeAttr((gc.phc_ref || '').trim())}" placeholder="${escapeAttr(t('refPhc'))}" style="min-width: 100px;">`
                            : escapeHtml((gc.phc_ref || '').trim() || '-'));
                    const previsaoCell = geReadOnly
                        ? (hasArticuloId ? escapeHtml(previsaoVal || '-') : '-')
                        : (hasArticuloId ? `<input type="date" class="ge-editable ge-row-previsao" data-articulo-id="${articuloId}" value="${escapeAttr(previsaoVal)}">` : '-');

                    const tr = document.createElement('tr');
                    tr.setAttribute('data-articulo-id', articuloId);
                    if (gcId) tr.setAttribute('data-gc-id', gcId);
                    if (needsPhcInput) tr.setAttribute('data-sem-phc', '1');
                    tr.innerHTML = `
                        <td class="ge-td-product" style="vertical-align: top;">${productDetailsHtml}</td>
                        <td style="vertical-align: top;">${phcCell}</td>
                        <td>${gc.quantidade_encomendar ?? '-'}</td>
                        <td>${preco}</td>
                        <td>${desconto}</td>
                        <td>${previsaoCell}</td>
                    `;
                    tbody.appendChild(tr);
                });
                const saveBtn = block.querySelector('.ge-save-fornecedor');
                if (saveBtn && !geReadOnly) saveBtn.addEventListener('click', () => saveFornecedorGroup(block, articuloIds, presupuestoId));
                blocksEl.appendChild(block);
            });
        } catch (e) {
            console.error('showDetailsPendientes:', e);
            blocksEl.innerHTML = '<div style="color: var(--danger-500);">' + escapeHtml(e.message || t('errorCarga')) + '</div>';
        }
    }

    async function saveFornecedorGroup(block, articuloIds, presupuestoId) {
        if (!articuloIds || articuloIds.length === 0) {
            showNotification(t('error'), 'error');
            return;
        }
        const client = await getClient();
        if (!client) return;

        const phcInputs = block.querySelectorAll('.ge-phc-ref-input');
        for (const input of phcInputs) {
            if (!(input.value || '').trim()) {
                showNotification(t('obrigatorioPhcSemCodigo'), 'error');
                input.focus();
                return;
            }
        }

        const numEl = block.querySelector('.ge-fn-numero');
        const fechaEl = block.querySelector('.ge-fn-fecha');
        const numero_encomenda = numEl ? numEl.value.trim() || null : null;
        const fecha_encomenda = fechaEl && fechaEl.value ? fechaEl.value : null;

        const tbody = block.querySelector('.ge-fornecedor-tbody');
        const rows = tbody ? tbody.querySelectorAll('tr[data-articulo-id]') : [];

        try {
            for (const tr of rows) {
                const articuloId = tr.getAttribute('data-articulo-id');
                if (!articuloId || articuloId === 'undefined') continue;
                const previsaoEl = tr.querySelector('.ge-row-previsao');
                const fecha_prevista_entrega = previsaoEl && previsaoEl.value ? previsaoEl.value : null;

                const { error } = await client
                    .from('presupuestos_articulos')
                    .update({
                        numero_encomenda,
                        fecha_encomenda: fecha_encomenda || null,
                        fecha_prevista_entrega: fecha_prevista_entrega || null
                    })
                    .eq('id', articuloId);

                if (error) throw error;
            }
            for (const input of phcInputs) {
                const gcId = input.getAttribute('data-gc-id');
                const phcRef = (input.value || '').trim() || null;
                if (!gcId) continue;
                const { error } = await client
                    .from('gestao_compras')
                    .update({ phc_ref: phcRef })
                    .eq('id', gcId);
                if (error) throw error;
            }
            showNotification(t('guardado'), 'success');

            if (presupuestoId) {
                await tryMoveProposalToEncomendaEnCurso(client, presupuestoId);
            }
        } catch (e) {
            console.error('saveFornecedorGroup:', e);
            showNotification(e.message || t('error'), 'error');
        }
    }

    function isEstadoPedidoEncomenda(estado) {
        const e = (estado || '').toLowerCase();
        return e.includes('pedido') && e.includes('encomenda') && !e.includes('en curso') && !e.includes('em curso');
    }

    async function updatePresupuestoToEncomendaEnCurso(client, presupuestoId, options) {
        const { notify = true, reload = true } = options || {};
        try {
            const { error: updateErr } = await client
                .from('presupuestos')
                .update({ estado_propuesta: 'encomenda_en_curso' })
                .eq('id', presupuestoId);
            if (updateErr) return false;
            if (notify) window.dispatchEvent(new CustomEvent('gestao-encomendas-estado-actualizado', { detail: { presupuestoId } }));
            if (reload && window.gestaoEncomendasReload) window.gestaoEncomendasReload();
            return true;
        } catch (e) {
            console.warn('updatePresupuestoToEncomendaEnCurso:', e);
            return false;
        }
    }

    async function tryMoveProposalToEncomendaEnCurso(client, presupuestoId) {
        try {
            const { data: gcRows, error: gcErr } = await client
                .from('gestao_compras')
                .select('id, presupuesto_articulo_id, referencia, designacao, phc_ref')
                .eq('presupuesto_id', presupuestoId);
            if (gcErr || !gcRows || gcRows.length === 0) return;
            const articuloIds = [...new Set((gcRows || []).map(r => r.presupuesto_articulo_id).filter(Boolean))];
            if (articuloIds.length === 0) return;

            const semPhcWithoutRef = (gcRows || []).filter(gc => {
                const isSemPhc = !!((gc.referencia || '').trim() || (gc.designacao || '').trim());
                const hasPhc = ((gc.phc_ref || '').trim() !== '');
                return isSemPhc && !hasPhc;
            });
            if (semPhcWithoutRef.length > 0) return;

            const { data: articulos, error: artErr } = await client
                .from('presupuestos_articulos')
                .select('id, numero_encomenda')
                .in('id', articuloIds);
            if (artErr || !articulos || articulos.length === 0) return;
            const allHaveNumero = articulos.every(a => (a.numero_encomenda || '').trim() !== '');
            if (!allHaveNumero) return;

            const { data: presupuesto, error: presErr } = await client
                .from('presupuestos')
                .select('estado_propuesta')
                .eq('id', presupuestoId)
                .single();
            if (presErr || !presupuesto) return;
            if (!isEstadoPedidoEncomenda(presupuesto.estado_propuesta)) return;

            await updatePresupuestoToEncomendaEnCurso(client, presupuestoId);
        } catch (e) {
            console.warn('tryMoveProposalToEncomendaEnCurso:', e);
        }
    }

    async function syncEstadoEncursoOnLoad(client, listData) {
        const toUpdate = (listData || []).filter(p => p.isEnCurso && isEstadoPedidoEncomenda(p.estado_propuesta));
        let any = false;
        for (const p of toUpdate) {
            const ok = await updatePresupuestoToEncomendaEnCurso(client, p.presupuesto_id, { notify: false, reload: false });
            if (ok) any = true;
        }
        if (any) {
            window.dispatchEvent(new CustomEvent('gestao-encomendas-estado-actualizado', { detail: {} }));
            if (window.gestaoEncomendasReload) window.gestaoEncomendasReload();
        }
    }

    async function showDetailsEnCurso(presupuestoId) {
        const client = await getClient();
        if (!client) return;

        const listView = document.getElementById('ge-list-view');
        const detailsView = document.getElementById('ge-details-view');
        if (listView) listView.classList.add('hidden');
        if (detailsView) detailsView.classList.add('active');

        const proposal = listData.find(p => p.presupuesto_id === presupuestoId);
        const titleEl = document.getElementById('ge-detail-title');
        if (titleEl) titleEl.textContent = (proposal ? proposal.codigo_propuesta : presupuestoId) + ' – ' + t('detalles');

        const blocksEl = document.getElementById('ge-detail-blocks');
        if (!blocksEl) return;
        blocksEl.innerHTML = '<div class="ge-loading">' + t('loading') + '</div>';

        try {
            const { data: gcRows, error: gcErr } = await client
                .from('gestao_compras')
                .select('*')
                .eq('presupuesto_id', presupuestoId);
            if (gcErr) throw gcErr;

            const { data: articulos, error: artErr } = await client
                .from('presupuestos_articulos')
                .select('id, numero_encomenda, fecha_encomenda, fecha_prevista_entrega, observaciones')
                .eq('presupuesto_id', presupuestoId);
            if (artErr) throw artErr;

            const articuloMap = {};
            (articulos || []).forEach(a => { articuloMap[a.id] = a; });

            const byFornecedor = {};
            (gcRows || []).forEach(gc => {
                const fn = (gc.nome_fornecedor || '').trim() || '-';
                if (!byFornecedor[fn]) byFornecedor[fn] = [];
                byFornecedor[fn].push(gc);
            });

            const codigoPropuestaEc = (proposal && proposal.codigo_propuesta) ? proposal.codigo_propuesta : (presupuestoId ? String(presupuestoId).substring(0, 8) : '-');
            const responsavelEc = (proposal && proposal.responsavel) ? proposal.responsavel : '-';
            const numeroPropostaBlockEc = '<div class="ge-fornecedor-block" style="margin-bottom:1rem;"><div style="display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:center;"><div><span style="font-size:0.8rem;color:var(--text-secondary);">' + t('numPropuesta') + '</span><div style="font-weight:600;color:var(--text-primary);font-size:1.1rem;">' + escapeHtml(codigoPropuestaEc) + '</div></div><div><span style="font-size:0.8rem;color:var(--text-secondary);">' + t('responsable') + '</span><div style="font-weight:600;color:var(--text-primary);">' + escapeHtml(responsavelEc) + '</div></div></div></div>';

            const concluirBlockHtml = geReadOnly ? '' : ('<div class="ge-fornecedor-block" style="margin-bottom:1.5rem;"><button type="button" class="ge-btn ge-btn-success" id="ge-btn-concluir-encurso"><i class="fas fa-check-circle"></i> <span id="ge-btn-concluir-text">' + escapeHtml(t('concluirTarefa')) + '</span></button></div>');
            blocksEl.innerHTML = numeroPropostaBlockEc + concluirBlockHtml;
            Object.keys(byFornecedor).sort().forEach(fornecedorName => {
                const rows = byFornecedor[fornecedorName];
                const block = document.createElement('div');
                block.className = 'ge-fornecedor-block';
                const saveBtnHtml = geReadOnly ? '' : '<div style="margin-top: 8px;"><button type="button" class="ge-btn ge-btn-primary ge-save-encurso">' + t('guardar') + '</button></div>';
                block.innerHTML = `
                    <div class="ge-fornecedor-title">${t('fornecedor')}: ${escapeHtml(fornecedorName)}</div>
                    <div class="ge-table-wrap">
                        <table class="ge-table">
                            <thead><tr>
                                <th>${t('productoRef')} / ${t('detalles')}</th>
                                <th>${t('numEncomenda')}</th>
                                <th>${t('fechaEncomenda')}</th>
                                <th>${t('previsaoEntrega')}</th>
                                <th>${t('observaciones')}</th>
                            </tr></thead>
                            <tbody class="ge-encurso-tbody"></tbody>
                        </table>
                    </div>
                    ${saveBtnHtml}
                `;
                const tbody = block.querySelector('.ge-encurso-tbody');
                rows.forEach(gc => {
                    const articuloId = (gc.presupuesto_articulo_id || '').toString();
                    const art = articuloId && articuloMap[articuloId] ? articuloMap[articuloId] : null;
                    const numero = art ? (art.numero_encomenda || '') : '';
                    const fechaEnc = art && art.fecha_encomenda ? (typeof art.fecha_encomenda === 'string' ? art.fecha_encomenda.split('T')[0] : art.fecha_encomenda) : '';
                    const previsaoVal = art && art.fecha_prevista_entrega ? (typeof art.fecha_prevista_entrega === 'string' ? art.fecha_prevista_entrega.split('T')[0] : art.fecha_prevista_entrega) : '';
                    const obsVal = (art && art.observaciones != null ? art.observaciones : '') || '';
                    const hasArticuloId = articuloId && articuloId !== 'undefined';
                    const productDetailsHtml = buildProductDetailsHtml(gc, { showFaltaBadge: true });
                    const previsaoCell = geReadOnly ? (hasArticuloId ? escapeHtml(previsaoVal || '-') : '-') : (hasArticuloId ? `<input type="date" class="ge-editable ge-encurso-previsao" data-articulo-id="${articuloId}" value="${escapeAttr(previsaoVal)}">` : '-');
                    const obsCell = geReadOnly ? (hasArticuloId ? escapeHtml(obsVal || '-') : '-') : (hasArticuloId ? `<textarea class="ge-obs-input ge-encurso-obs" data-articulo-id="${articuloId}" rows="2">${escapeHtml(obsVal)}</textarea>` : '-');

                    const tr = document.createElement('tr');
                    tr.setAttribute('data-articulo-id', articuloId);
                    tr.innerHTML = `
                        <td class="ge-td-product" style="vertical-align: top;">${productDetailsHtml}</td>
                        <td>${escapeHtml(numero)}</td>
                        <td>${escapeHtml(fechaEnc)}</td>
                        <td>${previsaoCell}</td>
                        <td>${obsCell}</td>
                    `;
                    tbody.appendChild(tr);
                });
                const saveBtn = block.querySelector('.ge-save-encurso');
                if (saveBtn && !geReadOnly) saveBtn.addEventListener('click', () => saveEnCursoBlock(block));
                blocksEl.appendChild(block);
            });
            const concluirBtn = document.getElementById('ge-btn-concluir-encurso');
            if (concluirBtn && !geReadOnly) concluirBtn.addEventListener('click', () => concluirEncomendaEnCurso(presupuestoId));
        } catch (e) {
            console.error('showDetailsEnCurso:', e);
            blocksEl.innerHTML = '<div style="color: var(--danger-500);">' + escapeHtml(e.message || t('errorCarga')) + '</div>';
        }
    }

    async function saveEnCursoBlock(block) {
        const client = await getClient();
        if (!client) return;
        const tbody = block.querySelector('.ge-encurso-tbody');
        const rows = tbody ? tbody.querySelectorAll('tr[data-articulo-id]') : [];
        try {
            for (const tr of rows) {
                const articuloId = tr.getAttribute('data-articulo-id');
                if (!articuloId || articuloId === 'undefined') continue;
                const previsaoEl = tr.querySelector('.ge-encurso-previsao');
                const obsEl = tr.querySelector('.ge-encurso-obs');
                const fecha_prevista_entrega = previsaoEl && previsaoEl.value ? previsaoEl.value : null;
                const observaciones = obsEl ? (obsEl.value || '').trim() || null : null;
                const { error } = await client
                    .from('presupuestos_articulos')
                    .update({ fecha_prevista_entrega: fecha_prevista_entrega || null, observaciones })
                    .eq('id', articuloId);
                if (error) throw error;
            }
            showNotification(t('guardado'), 'success');
        } catch (e) {
            console.error('saveEnCursoBlock:', e);
            showNotification(e.message || t('error'), 'error');
        }
    }

    async function concluirEncomendaEnCurso(presupuestoId) {
        if (!presupuestoId) return;
        if (!confirm(t('confirmarConcluir'))) return;
        const client = await getClient();
        if (!client) return;
        try {
            const { error } = await client
                .from('presupuestos')
                .update({
                    estado_propuesta: 'encomenda_concluida',
                    fecha_ultima_actualizacion: new Date().toISOString()
                })
                .eq('id', presupuestoId);
            if (error) throw error;
            backToList();
            await loadList();
            await loadHistorico();
            showNotification(lang === 'es' ? 'Encomienda marcada como concluida. Aparecerá en Histórico.' : lang === 'en' ? 'Order marked as completed. It will appear in History.' : 'Encomenda marcada como concluída. Aparecerá no Histórico.', 'success');
        } catch (e) {
            console.error('concluirEncomendaEnCurso:', e);
            showNotification(e.message || t('error'), 'error');
        }
    }

    function backToList() {
        const listView = document.getElementById('ge-list-view');
        const detailsView = document.getElementById('ge-details-view');
        if (listView) listView.classList.remove('hidden');
        if (detailsView) detailsView.classList.remove('active');
    }

    function escapeHtml(s) {
        if (s == null) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }
    function escapeAttr(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function formatNumber(n) {
        if (n == null) return '-';
        return Number(n).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }

    function buildAnexosLinksForProduct(gc, wrapInDiv) {
        const anexosUrls = parseFotosUrls(gc.personalizado_anexos_urls);
        const historicoUrl = (gc.historico_emails_url || '').trim();
        if (anexosUrls.length === 0 && !historicoUrl) return '';
        let html = wrapInDiv !== false ? '<div class="ge-product-anexos" style="font-size:0.75rem;">' : '';
        html += '<div style="color:var(--text-secondary);margin-bottom:6px;"><strong>' + escapeHtml(t('anexos')) + ':</strong></div>';
        html += '<div class="ge-anexos-list">';
        anexosUrls.forEach((url, i) => {
            html += buildDocPreviewCard(url, t('verDescargar') + (anexosUrls.length > 1 ? ' ' + (i + 1) : ''));
        });
        if (historicoUrl) {
            html += buildDocPreviewCard(historicoUrl, t('historicoEmails'));
        }
        html += '</div>';
        if (wrapInDiv !== false) html += '</div>';
        return html;
    }

    function buildProductDetailsHtml(gc, options) {
        const { showFaltaBadge = false } = options || {};
        const refFornecedor = (gc.referencia || '').trim() || '-';
        const hasPhc = (gc.phc_ref || '').trim() !== '';
        const phcLabel = hasPhc ? (gc.phc_ref || '').trim() : t('semPhc');
        const isSemPhc = !!(gc.referencia || gc.designacao);
        const faltaCriarCodigo = showFaltaBadge && isSemPhc && !hasPhc;
        const faltaBadge = faltaCriarCodigo ? ` <span class="ge-badge-falta" style="display:inline-block;margin-left:6px;padding:2px 8px;font-size:0.7rem;background:var(--danger-500);color:var(--text-white);border-radius:4px;">${t('faltaCriarCodigo')}</span>` : '';
        let infoHtml = `<div class="ge-product-info" style="font-size: 0.95rem;">`;
        infoHtml += `<div style="font-weight: 600; margin-bottom: 4px; font-size: 1rem;">${escapeHtml(gc.nome_articulo || gc.designacao || refFornecedor || '-')}${faltaBadge}</div>`;
        infoHtml += `<div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 2px;">${t('refFornecedor')}: ${escapeHtml(refFornecedor)}</div>`;
        infoHtml += `<div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">${t('refPhc')}: ${hasPhc ? escapeHtml(phcLabel) : `<span style="color: var(--accent-500);">${escapeHtml(phcLabel)}</span>`}</div>`;
        if (isSemPhc) {
            infoHtml += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--bg-gray-200); font-size: 0.85rem; color: var(--text-secondary); display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; align-items: baseline;">`;
            infoHtml += `<span><strong>${t('designacao')}:</strong></span><span>${escapeHtml((gc.designacao || '').trim() || '-')}</span>`;
            infoHtml += `<span><strong>${t('peso')}:</strong></span><span>${escapeHtml((gc.peso || '').trim() || '-')}</span>`;
            infoHtml += `<span><strong>${t('qtyCaixa')}:</strong></span><span>${gc.quantidade_por_caixa != null ? escapeHtml(String(gc.quantidade_por_caixa)) : '-'}</span>`;
            infoHtml += `<span><strong>${t('personalizado')}:</strong></span><span>${gc.personalizado ? t('sim') : t('nao')}</span>`;
            if (gc.valor_transportes != null && gc.valor_transportes !== '') {
                const vt = Number(gc.valor_transportes);
                if (!isNaN(vt)) { infoHtml += `<span><strong>${t('valorTransportes')}:</strong></span><span>${formatNumber(vt)}</span>`; }
            }
            if (gc.tem_cliche != null) {
                infoHtml += `<span><strong>${t('temCliche')}:</strong></span><span>${gc.tem_cliche ? t('sim') : t('nao')}`;
                if (gc.tem_cliche && gc.preco_cliche != null && gc.preco_cliche !== '') {
                    const pc = Number(gc.preco_cliche);
                    if (!isNaN(pc)) infoHtml += ` — ${t('precoCliche')}: ${formatNumber(pc)}`;
                }
                infoHtml += `</span>`;
            }
            if ((gc.personalizado_observacoes || '').trim()) {
                infoHtml += `<span style="grid-column: 1 / -1; margin-top: 4px;"><strong>${t('observaciones')}:</strong> ${escapeHtml((gc.personalizado_observacoes || '').trim())}</span>`;
            }
            infoHtml += `</div>`;
        } else {
            if (gc.valor_transportes != null && gc.valor_transportes !== '') {
                const vt = Number(gc.valor_transportes);
                if (!isNaN(vt)) infoHtml += `<div style="margin-top: 4px; font-size: 0.85rem; color: var(--text-secondary);"><strong>${t('valorTransportes')}:</strong> ${formatNumber(vt)}</div>`;
            }
            if (gc.tem_cliche != null) {
                infoHtml += `<div style="font-size: 0.85rem; color: var(--text-secondary);"><strong>${t('temCliche')}:</strong> ${gc.tem_cliche ? t('sim') : t('nao')}`;
                if (gc.tem_cliche && gc.preco_cliche != null && gc.preco_cliche !== '') {
                    const pc = Number(gc.preco_cliche);
                    if (!isNaN(pc)) infoHtml += ` — ${t('precoCliche')}: ${formatNumber(pc)}`;
                }
                infoHtml += `</div>`;
            }
        }
        infoHtml += `</div>`;
        const anexosHtml = buildAnexosLinksForProduct(gc);
        return `<div class="ge-product-details">${infoHtml}${anexosHtml}</div>`;
    }

    function updateTexts() {
        const loadEl = document.getElementById('ge-loading-text');
        const emptyEl = document.getElementById('ge-empty-text');
        const backEl = document.getElementById('ge-back-text');
        const searchInput = document.getElementById('ge-search-input');
        if (loadEl) loadEl.textContent = t('loading');
        if (searchInput) searchInput.placeholder = t('searchPlaceholder');
        if (emptyEl) emptyEl.textContent = t('empty');
        updateTableHeaderForTab();
        const thFotos = document.getElementById('ge-th-fotos');
        if (thFotos) thFotos.textContent = t('fotos');
        if (backEl) backEl.textContent = t('voltar');
        const tabPend = document.getElementById('ge-tab-pendientes-text');
        if (tabPend) tabPend.textContent = t('pendientes');
        const tabEncurso = document.getElementById('ge-tab-encurso-text');
        if (tabEncurso) tabEncurso.textContent = t('enCurso');
        const tabHistorico = document.getElementById('ge-tab-historico-text');
        if (tabHistorico) tabHistorico.textContent = t('historico');
        document.querySelectorAll('.ge-save-fornecedor').forEach(btn => { btn.textContent = t('guardar'); });
        document.querySelectorAll('.ge-save-encurso').forEach(btn => { btn.textContent = t('guardar'); });
    }

    async function init() {
        const isAuth = window.authManager && await window.authManager.requireAuth('login.html');
        if (!isAuth) {
            return;
        }
        const role = typeof window.getUserRole === 'function' ? await window.getUserRole() : null;
        geReadOnly = (role || '').toString().toLowerCase() === 'admin';

        const backBtn = document.getElementById('ge-back-btn');
        if (backBtn) backBtn.addEventListener('click', backToList);

        document.body.addEventListener('click', async function geDownloadDocHandler(e) {
            const btn = e.target && e.target.closest && e.target.closest('.ge-download-doc');
            if (!btn || !btn.getAttribute('data-download-url')) return;
            e.preventDefault();
            const url = btn.getAttribute('data-download-url');
            const filename = btn.getAttribute('data-download-filename') || 'documento';
            try {
                const res = await fetch(url, { method: 'GET', mode: 'cors' });
                if (!res.ok) throw new Error('Network error');
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } catch (err) {
                window.open(url, '_blank');
            }
        });

        const searchInput = document.getElementById('ge-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                listSearchQuery = (searchInput.value || '').trim();
                renderList();
            });
        }

        document.querySelectorAll('.ge-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabVal = tab.getAttribute('data-tab');
                if (!tabVal || tabVal === currentTab) return;
                currentTab = tabVal;
                document.querySelectorAll('.ge-tab').forEach(t => t.classList.remove('ge-tab-active'));
                tab.classList.add('ge-tab-active');
                const wrapMain = document.getElementById('ge-table-wrap-main');
                if (wrapMain) wrapMain.style.display = 'block';
                if (tabVal === 'historico') {
                    loadHistorico();
                    return;
                }
                renderList();
            });
        });

        if (document.documentElement.lang === 'es') lang = 'es';
        else if (document.documentElement.lang === 'en') lang = 'en';
        if (window.currentLanguage) lang = window.currentLanguage;
        updateTexts();

        (async () => {
            const client = await getClient();
            if (client) loadList();
            else {
                window.addEventListener('supabase-config-ready', loadList);
                setTimeout(loadList, 1500);
            }
        })();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.gestaoEncomendasReload = loadList;
})();
