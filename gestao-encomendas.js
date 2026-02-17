/**
 * Gestão de Encomendas – listado por propuesta y detalles con campos editables por artículo.
 * No modifica otras páginas; página independiente.
 */
(function () {
    const TEXTS = {
        pt: {
            loading: 'A carregar...',
            empty: 'Nenhum pedido de encomenda.',
            numPropuesta: 'Nº Propuesta',
            responsable: 'Responsable',
            fornecedores: 'Fornecedores',
            detalles: 'Detalhes',
            voltar: 'Voltar',
            productoRef: 'Producto / Referência',
            cantidad: 'Cantidad',
            precio: 'Precio',
            fornecedor: 'Fornecedor',
            numEncomenda: 'Nº Encomenda',
            fechaEncomenda: 'Fecha Encomenda',
            previsaoEntrega: 'Previsão Entrega',
            desconto: 'Desconto %',
            guardar: 'Guardar',
            guardado: 'Guardado.',
            error: 'Erro ao guardar.',
            errorCarga: 'Erro ao carregar dados.',
            pendientes: 'Pedidos pendientes',
            enCurso: 'Pedidos en curso',
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
            semPhc: 'Sem PHC'
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
            semPhc: 'Sin PHC'
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
            semPhc: 'No PHC'
        }
    };

    let supabase = null;
    let lang = 'pt';
    let listData = []; // { presupuesto_id, codigo_propuesta, responsavel, fornecedores: string[], isEnCurso: boolean }
    let currentTab = 'pendientes'; // 'pendientes' | 'encurso'

    function t(key) {
        return (TEXTS[lang] || TEXTS.pt)[key] || key;
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
                .select('presupuesto_id, nome_fornecedor, presupuesto_articulo_id');

            if (error) throw error;

            const byPresupuesto = {};
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
            });

            const presupuestoIds = Object.keys(byPresupuesto);
            if (presupuestoIds.length === 0) {
                setLoading(false);
                setEmpty(true);
                return;
            }

            const { data: presupuestos, error: errPres } = await client
                .from('presupuestos')
                .select('id, codigo_propuesta, responsavel, estado_propuesta')
                .in('id', presupuestoIds);

            if (errPres) throw errPres;

            const { data: articulos, error: errArt } = await client
                .from('presupuestos_articulos')
                .select('id, presupuesto_id, numero_encomenda')
                .in('presupuesto_id', presupuestoIds);

            if (errArt) throw errArt;
            const articuloNumeroMap = {};
            (articulos || []).forEach(a => {
                articuloNumeroMap[a.id] = (a.numero_encomenda || '').trim();
            });

            listData = (presupuestos || []).map(p => {
                const info = byPresupuesto[p.id] || { fornecedores: [], articuloIds: new Set() };
                const articuloIds = Array.from(info.articuloIds || []);
                const isEnCurso = articuloIds.length > 0 && articuloIds.every(aid => (articuloNumeroMap[aid] || '').trim() !== '');
                return {
                    presupuesto_id: p.id,
                    codigo_propuesta: p.codigo_propuesta || '-',
                    responsavel: p.responsavel || '-',
                    fornecedores: info.fornecedores,
                    isEnCurso: !!isEnCurso,
                    estado_propuesta: p.estado_propuesta || ''
                };
            });

            await syncEstadoEncursoOnLoad(client, listData);
            renderList();
        } catch (e) {
            console.error('loadList:', e);
            showNotification(e.message || t('errorCarga'), 'error');
            setEmpty(true);
        } finally {
            setLoading(false);
        }
    }

    function renderList() {
        const tbody = document.getElementById('ge-tbody');
        if (!tbody) return;
        const filtered = currentTab === 'encurso'
            ? listData.filter(row => row.isEnCurso)
            : listData.filter(row => !row.isEnCurso);
        tbody.innerHTML = '';
        filtered.forEach(row => {
            const tr = document.createElement('tr');
            const tagsHtml = row.fornecedores.map(f => `<span class="ge-tag">${escapeHtml(f)}</span>`).join('');
            tr.innerHTML = `
                <td>${escapeHtml(row.codigo_propuesta)}</td>
                <td>${escapeHtml(row.responsavel)}</td>
                <td><div class="ge-tags">${tagsHtml || '<span class="ge-tag">-</span>'}</div></td>
                <td><button type="button" class="ge-btn ge-btn-primary" data-presupuesto-id="${row.presupuesto_id}">${t('detalles')}</button></td>
            `;
            tr.querySelector('button').addEventListener('click', () => showDetails(row.presupuesto_id));
            tbody.appendChild(tr);
        });
        setEmpty(filtered.length === 0);
    }

    async function showDetails(presupuestoId) {
        const proposal = listData.find(p => p.presupuesto_id === presupuestoId);
        if (proposal && proposal.isEnCurso) {
            showDetailsEnCurso(presupuestoId);
            return;
        }
        showDetailsPendientes(presupuestoId);
    }

    async function showDetailsPendientes(presupuestoId) {
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

            blocksEl.innerHTML = '';
            Object.keys(byFornecedor).sort().forEach(fornecedorName => {
                const rows = byFornecedor[fornecedorName];
                const articuloIds = rows.map(r => r.presupuesto_articulo_id).filter(Boolean);
                const firstArt = articuloIds.length && articuloMap[articuloIds[0]] ? articuloMap[articuloIds[0]] : null;
                const numero = firstArt ? (firstArt.numero_encomenda || '') : '';
                const fecha = firstArt && firstArt.fecha_encomenda ? firstArt.fecha_encomenda.split('T')[0] : '';

                const block = document.createElement('div');
                block.className = 'ge-fornecedor-block';
                block.innerHTML = `
                    <div class="ge-fornecedor-title">${t('fornecedor')}: ${escapeHtml(fornecedorName)}</div>
                    <div class="ge-fornecedor-form">
                        <div>
                            <label>${t('numEncomenda')}</label>
                            <input type="text" class="ge-editable ge-fn-numero" value="${escapeAttr(numero)}" placeholder="-">
                        </div>
                        <div>
                            <label>${t('fechaEncomenda')}</label>
                            <input type="date" class="ge-editable ge-fn-fecha" value="${escapeAttr(fecha)}">
                        </div>
                        <div style="align-self: flex-end;">
                            <button type="button" class="ge-btn ge-btn-primary ge-save-fornecedor">${t('guardar')}</button>
                        </div>
                    </div>
                    <div class="ge-table-wrap">
                        <table class="ge-table">
                            <thead><tr><th>${t('productoRef')}</th><th>${t('cantidad')}</th><th>${t('precio')}</th><th>${t('desconto')}</th><th>${t('previsaoEntrega')}</th></tr></thead>
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

                    const tr = document.createElement('tr');
                    tr.setAttribute('data-articulo-id', articuloId);
                    tr.innerHTML = `
                        <td style="vertical-align: top; min-width: 220px;">${productDetailsHtml}</td>
                        <td>${gc.quantidade_encomendar ?? '-'}</td>
                        <td>${preco}</td>
                        <td>${desconto}</td>
                        <td>${hasArticuloId ? `<input type="date" class="ge-editable ge-row-previsao" data-articulo-id="${articuloId}" value="${escapeAttr(previsaoVal)}">` : '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
                const saveBtn = block.querySelector('.ge-save-fornecedor');
                if (saveBtn) saveBtn.addEventListener('click', () => saveFornecedorGroup(block, articuloIds, presupuestoId));
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
                .select('presupuesto_articulo_id')
                .eq('presupuesto_id', presupuestoId);
            if (gcErr || !gcRows || gcRows.length === 0) return;
            const articuloIds = [...new Set((gcRows || []).map(r => r.presupuesto_articulo_id).filter(Boolean))];
            if (articuloIds.length === 0) return;

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

            blocksEl.innerHTML = '';
            Object.keys(byFornecedor).sort().forEach(fornecedorName => {
                const rows = byFornecedor[fornecedorName];
                const block = document.createElement('div');
                block.className = 'ge-fornecedor-block';
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
                    <div style="margin-top: 8px;">
                        <button type="button" class="ge-btn ge-btn-primary ge-save-encurso">${t('guardar')}</button>
                    </div>
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

                    const tr = document.createElement('tr');
                    tr.setAttribute('data-articulo-id', articuloId);
                    tr.innerHTML = `
                        <td style="vertical-align: top; min-width: 220px;">${productDetailsHtml}</td>
                        <td>${escapeHtml(numero)}</td>
                        <td>${escapeHtml(fechaEnc)}</td>
                        <td>${hasArticuloId ? `<input type="date" class="ge-editable ge-encurso-previsao" data-articulo-id="${articuloId}" value="${escapeAttr(previsaoVal)}">` : '-'}</td>
                        <td>${hasArticuloId ? `<textarea class="ge-obs-input ge-encurso-obs" data-articulo-id="${articuloId}" rows="2">${escapeHtml(obsVal)}</textarea>` : '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
                const saveBtn = block.querySelector('.ge-save-encurso');
                if (saveBtn) saveBtn.addEventListener('click', () => saveEnCursoBlock(block));
                blocksEl.appendChild(block);
            });
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

    function buildProductDetailsHtml(gc, options) {
        const { showFaltaBadge = false } = options || {};
        const refFornecedor = (gc.referencia || '').trim() || '-';
        const hasPhc = (gc.phc_ref || '').trim() !== '';
        const phcLabel = hasPhc ? (gc.phc_ref || '').trim() : t('semPhc');
        const isSemPhc = !!(gc.referencia || gc.designacao);
        const faltaCriarCodigo = showFaltaBadge && isSemPhc && !hasPhc;
        const faltaBadge = faltaCriarCodigo ? ` <span class="ge-badge-falta" style="display:inline-block;margin-left:6px;padding:2px 8px;font-size:0.7rem;background:#b91c1c;color:#fff;border-radius:4px;">${t('faltaCriarCodigo')}</span>` : '';
        let html = `<div class="ge-product-details" style="font-size: 0.875rem;">`;
        html += `<div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(gc.nome_articulo || gc.designacao || refFornecedor || '-')}${faltaBadge}</div>`;
        html += `<div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 6px;">${t('refFornecedor')}: ${escapeHtml(refFornecedor)}</div>`;
        html += `<div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 6px;">${t('refPhc')}: ${hasPhc ? escapeHtml(phcLabel) : `<span style="color: #f59e0b;">${escapeHtml(phcLabel)}</span>`}</div>`;
        if (isSemPhc) {
            html += `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #334155; font-size: 0.8rem; color: #cbd5e1;">`;
            html += `<div><strong>${t('designacao')}:</strong> ${escapeHtml((gc.designacao || '').trim() || '-')}</div>`;
            html += `<div><strong>${t('peso')}:</strong> ${escapeHtml((gc.peso || '').trim() || '-')}</div>`;
            html += `<div><strong>${t('qtyCaixa')}:</strong> ${gc.quantidade_por_caixa != null ? escapeHtml(String(gc.quantidade_por_caixa)) : '-'}</div>`;
            html += `<div><strong>${t('personalizado')}:</strong> ${gc.personalizado ? t('sim') : t('nao')}</div>`;
            if ((gc.personalizado_observacoes || '').trim()) {
                html += `<div style="margin-top: 4px;"><strong>${t('observaciones')}:</strong> ${escapeHtml((gc.personalizado_observacoes || '').trim())}</div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    }

    function updateTexts() {
        const loadEl = document.getElementById('ge-loading-text');
        const emptyEl = document.getElementById('ge-empty-text');
        const backEl = document.getElementById('ge-back-text');
        if (loadEl) loadEl.textContent = t('loading');
        if (emptyEl) emptyEl.textContent = t('empty');
        const thNum = document.getElementById('ge-th-num');
        if (thNum) thNum.textContent = t('numPropuesta');
        const thResp = document.getElementById('ge-th-resp');
        if (thResp) thResp.textContent = t('responsable');
        const thForn = document.getElementById('ge-th-forn');
        if (thForn) thForn.textContent = t('fornecedores');
        if (backEl) backEl.textContent = t('voltar');
        const tabPend = document.getElementById('ge-tab-pendientes-text');
        if (tabPend) tabPend.textContent = t('pendientes');
        const tabEncurso = document.getElementById('ge-tab-encurso-text');
        if (tabEncurso) tabEncurso.textContent = t('enCurso');
        document.querySelectorAll('.ge-save-fornecedor').forEach(btn => { btn.textContent = t('guardar'); });
        document.querySelectorAll('.ge-save-encurso').forEach(btn => { btn.textContent = t('guardar'); });
    }

    function init() {
        const backBtn = document.getElementById('ge-back-btn');
        if (backBtn) backBtn.addEventListener('click', backToList);

        document.querySelectorAll('.ge-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabVal = tab.getAttribute('data-tab');
                if (!tabVal || tabVal === currentTab) return;
                currentTab = tabVal;
                document.querySelectorAll('.ge-tab').forEach(t => t.classList.remove('ge-tab-active'));
                tab.classList.add('ge-tab-active');
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
