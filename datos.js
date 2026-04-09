(function () {
    const ESTADOS_ABIERTO = new Set([
        'propuesta_en_edicion',
        'propuesta_enviada',
        'amostra_enviada',
        'amostra_pedida',
        'aguarda_dossier',
        'follow_up'
    ]);

    const ESTADOS_AVANZADO = new Set([
        'aguarda_aprovacao_dossier',
        'aguarda_creacion_cliente',
        'aguarda_creacion_codigo_phc',
        'aguarda_pagamento',
        'pedido_de_encomenda',
        'encomenda_en_curso',
        'proposta_parcialmente_adjudicada',
        'proposta_adjudicada'
    ]);

    function normalizeStatus(status) {
        const s = (status || '').toString().toLowerCase().trim();
        if (!s) return '';
        if (s === 'follow_up' || s.includes('follow up')) return 'follow_up';
        if (s.includes('parcial') && s.includes('adjudicada')) return 'proposta_parcialmente_adjudicada';
        if (s.includes('adjudicada')) return 'proposta_adjudicada';
        if (s.includes('amostra') && s.includes('enviada')) return 'amostra_enviada';
        if ((s.includes('muestra') && s.includes('enviada')) || (s.includes('muestra') && s.includes('entregada'))) return 'amostra_enviada';
        if (s.includes('amostra') && s.includes('pedida')) return 'amostra_pedida';
        if (s.includes('muestra') && s.includes('pedida')) return 'amostra_pedida';
        if (s.includes('aguarda') && s.includes('dossier') && (s.includes('aprovacao') || s.includes('aprovação'))) return 'aguarda_aprovacao_dossier';
        if (s.includes('aguarda') && s.includes('dossier')) return 'aguarda_dossier';
        if (s.includes('aguarda') && (s.includes('creacion') || s.includes('criação')) && s.includes('cliente')) return 'aguarda_creacion_cliente';
        if (s.includes('aguarda') && (s.includes('creacion') || s.includes('criação')) && (s.includes('codigo') || s.includes('código')) && s.includes('phc')) return 'aguarda_creacion_codigo_phc';
        if (s.includes('aguarda') && s.includes('pagamento')) return 'aguarda_pagamento';
        if (s.includes('pedido') && s.includes('encomenda')) return 'pedido_de_encomenda';
        if (s.includes('encomenda') && (s.includes('em curso') || s.includes('en curso'))) return 'encomenda_en_curso';
        if (s.includes('propuesta') && s.includes('edicion')) return 'propuesta_en_edicion';
        if (s.includes('proposta') && s.includes('edição')) return 'propuesta_en_edicion';
        if (s.includes('propuesta') && s.includes('enviada')) return 'propuesta_enviada';
        if (s.includes('proposta') && s.includes('enviada')) return 'propuesta_enviada';
        return s.replace(/\s+/g, '_');
    }

    function productDupKey(art) {
        const ref = (art.referencia_articulo || '').toString().trim().toLowerCase();
        if (ref) return `ref:${ref}`;
        const name = (art.nombre_articulo || '').toString().trim().toLowerCase();
        return `name:${name}`;
    }

    function normalizeText(value) {
        return (value || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function parseCategories(raw) {
        if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
            } catch (_) {
                return [];
            }
        }
        return [];
    }

    function pickCategoryKey(product, art) {
        const directCategory = (product?.categoria || product?.category || '').toString().trim();
        if (directCategory) return `cat:${normalizeText(directCategory)}`;

        const extraCategories = parseCategories(product?.categorias);
        const firstExtra = extraCategories.find(Boolean);
        if (firstExtra) return `cat:${normalizeText(firstExtra)}`;

        const customType = (art?.tipo_personalizacion || '').toString().trim().toLowerCase();
        if (customType === 'pedido especial') return `item:${productDupKey(art)}`;

        return `item:${productDupKey(art)}`;
    }

    function num(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }

    function money(v) {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num(v));
    }

    function escapeHtml(value) {
        return (value || '')
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatStateLabel(value) {
        return (value || '')
            .toString()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function getProposalDisplayName(proposal) {
        return proposal?.nombre_cliente
            || proposal?.commercial_name
            || proposal?.codigo_propuesta
            || `Propuesta ${proposal?.id || ''}`.trim();
    }

    function consolidateProposalLines(lines, productById, productsByName) {
        const minLineByKey = new Map();
        (lines || []).forEach(line => {
            const key = productDupKey(line);
            const qty = Math.max(0, num(line.cantidad));
            const price = Math.max(0, num(line.precio));
            const lineTotal = qty * price;
            const existing = minLineByKey.get(key);
            const shouldReplace = !existing
                || qty < existing.qty
                || (qty === existing.qty && price < existing.price)
                || (qty === existing.qty && price === existing.price && lineTotal < existing.lineTotal);
            if (shouldReplace) {
                minLineByKey.set(key, { line, qty, price, lineTotal });
            }
        });

        const minLineByCategory = new Map();
        minLineByKey.forEach((entry) => {
            const refId = entry.line?.referencia_articulo != null ? String(entry.line.referencia_articulo) : '';
            const byRef = refId ? productById.get(refId) : null;
            const normalizedName = normalizeText(entry.line?.nombre_articulo);
            const byName = !byRef && normalizedName ? (productsByName.get(normalizedName) || [])[0] : null;
            const product = byRef || byName || null;
            const categoryKey = pickCategoryKey(product, entry.line);
            const existing = minLineByCategory.get(categoryKey);
            if (!existing || entry.lineTotal < existing.lineTotal) {
                minLineByCategory.set(categoryKey, {
                    ...entry,
                    product,
                    categoryKey
                });
            }
        });

        return Array.from(minLineByCategory.values()).sort((a, b) => b.lineTotal - a.lineTotal);
    }

    async function getClient() {
        if (window.universalSupabase?.getClient) return window.universalSupabase.getClient();
        return null;
    }

    async function enforceAdmin() {
        const isAuth = window.authManager && await window.authManager.requireAuth('login.html');
        if (!isAuth) return false;
        const role = typeof window.getUserRole === 'function' ? await window.getUserRole() : null;
        if ((role || '').toString().toLowerCase() !== 'admin') {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    function buildInfoHtml(type) {
        const states = type === 'abierto'
            ? [
                'proposta em edição',
                'proposta enviada',
                'amostra enviada',
                'amostra pedida',
                'aguarda dossier',
                'follow up'
            ]
            : [
                'aguarda aprovação de dossier',
                'aguarda criação de cliente',
                'aguarda criação do código PHC',
                'aguarda pagamento',
                'pedido de encomenda',
                'encomenda em curso',
                'proposta parcialmente adjudicada',
                'proposta adjudicada'
            ];

        return `
            <p><strong>Estados incluidos:</strong></p>
            <ul>${states.map(s => `<li>${s}</li>`).join('')}</ul>
            <p style="margin-top:.75rem;"><strong>Regla de duplicados:</strong></p>
            <ul>
                <li>Si un producto aparece repetido dentro de una propuesta, se considera solo la línea con la menor cantidad.</li>
                <li>El valor se calcula de forma conservadora con esa línea: cantidad x precio.</li>
            </ul>
        `;
    }

    function setupInfoModal() {
        const modal = document.getElementById('datosInfoModal');
        const title = document.getElementById('datosInfoTitle');
        const body = document.getElementById('datosInfoBody');
        const closeBtn = document.getElementById('datosInfoClose');
        if (!modal || !title || !body || !closeBtn) return;

        document.querySelectorAll('.datos-info-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-card');
                title.textContent = type === 'abierto'
                    ? 'Qué incluye: Valor abierto (propuestas enviadas)'
                    : 'Qué incluye: Valor en estados avanzados';
                body.innerHTML = buildInfoHtml(type);
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function setupDetailModal() {
        const modal = document.getElementById('datosDetailModal');
        const closeTop = document.getElementById('datosDetailCloseTop');
        const closeBottom = document.getElementById('datosDetailCloseBottom');
        if (!modal || !closeTop || !closeBottom) return;

        const close = () => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        };

        closeTop.addEventListener('click', close);
        closeBottom.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) close();
        });
    }

    function renderPreviewLines(entries) {
        if (!entries.length) {
            return '<div class="datos-detail-empty">Sin artículos contabilizados.</div>';
        }

        return `
            <div class="datos-preview-title">Artículos contabilizados en este valor</div>
            <div class="datos-preview-list">
                ${entries.map((entry) => `
                    <div class="datos-preview-row">
                        <span class="datos-preview-name">${escapeHtml(entry.line?.nombre_articulo || 'Artículo sin nombre')}</span>
                        <span class="datos-preview-meta">${escapeHtml(`${num(entry.qty)} x ${money(entry.price)} = ${money(entry.lineTotal)}`)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function openDetailModal(type, calc) {
        const modal = document.getElementById('datosDetailModal');
        const title = document.getElementById('datosDetailTitle');
        const subtitle = document.getElementById('datosDetailSubtitle');
        const body = document.getElementById('datosDetailBody');
        if (!modal || !title || !subtitle || !body) return;

        const isOpen = type === 'abierto';
        title.textContent = isOpen ? 'Detalle de valor abierto' : 'Detalle de estados avanzados';
        subtitle.textContent = `${calc.countedProposals} propuestas · ${money(calc.total)}. Pasa el cursor por una propuesta para ver los artículos contabilizados.`;

        if (!calc.details.length) {
            body.innerHTML = '<div class="datos-detail-empty">No hay propuestas en esta categoría.</div>';
        } else {
            body.innerHTML = `
                <div class="datos-detail-list">
                    ${calc.details.map((detail) => `
                        <div class="datos-detail-item">
                            <div class="datos-detail-main">
                                <div>
                                    <div class="datos-detail-client">${escapeHtml(getProposalDisplayName(detail.proposal))}</div>
                                    <div class="datos-detail-code">${escapeHtml(detail.proposal?.codigo_propuesta || 'Sin código')}</div>
                                    <div class="datos-detail-state">${escapeHtml(formatStateLabel(normalizeStatus(detail.proposal?.estado_propuesta)))}</div>
                                </div>
                                <div class="datos-detail-amount">${money(detail.total)}</div>
                            </div>
                            <div class="datos-detail-preview">
                                ${renderPreviewLines(detail.entries)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    async function loadDatos() {
        const loadingEl = document.getElementById('datosLoading');
        const errorEl = document.getElementById('datosError');
        const gridEl = document.getElementById('datosGrid');
        try {
            if (!(await enforceAdmin())) return;
            const client = await getClient();
            if (!client) throw new Error('No se pudo inicializar Supabase.');

            const { data: propuestas, error: pErr } = await client
                .from('presupuestos')
                .select('id, estado_propuesta, codigo_propuesta, nombre_cliente, commercial_name');
            if (pErr) throw pErr;

            const abiertoIds = [];
            const avanzadoIds = [];
            const allIds = [];

            (propuestas || []).forEach(p => {
                const st = normalizeStatus(p.estado_propuesta);
                if (ESTADOS_ABIERTO.has(st)) {
                    abiertoIds.push(p.id);
                    allIds.push(p.id);
                } else if (ESTADOS_AVANZADO.has(st)) {
                    avanzadoIds.push(p.id);
                    allIds.push(p.id);
                }
            });

            const uniqueAllIds = [...new Set(allIds)];
            const articulosByProposal = {};
            const productById = new Map();
            const productsByName = new Map();

            const { data: products, error: productsErr } = await client
                .from('products')
                .select('id, nombre, categoria, categorias')
                .limit(10000);
            if (productsErr) throw productsErr;

            (products || []).forEach(product => {
                productById.set(String(product.id), product);
                const normalizedName = normalizeText(product.nombre);
                if (!normalizedName) return;
                if (!productsByName.has(normalizedName)) {
                    productsByName.set(normalizedName, []);
                }
                productsByName.get(normalizedName).push(product);
            });

            if (uniqueAllIds.length > 0) {
                const chunkSize = 200;
                for (let i = 0; i < uniqueAllIds.length; i += chunkSize) {
                    const chunk = uniqueAllIds.slice(i, i + chunkSize);
                    const { data: arts, error: aErr } = await client
                        .from('presupuestos_articulos')
                        .select('id, presupuesto_id, nombre_articulo, referencia_articulo, cantidad, precio')
                        .in('presupuesto_id', chunk);
                    if (aErr) throw aErr;
                    (arts || []).forEach(a => {
                        const pid = a.presupuesto_id;
                        if (!articulosByProposal[pid]) articulosByProposal[pid] = [];
                        articulosByProposal[pid].push(a);
                    });
                }
            }

            const proposalsById = new Map((propuestas || []).map((proposal) => [String(proposal.id), proposal]));
            const computeTotal = (proposalIds) => {
                let total = 0;
                const details = [];

                (proposalIds || []).forEach((pid) => {
                    const lines = articulosByProposal[pid] || [];
                    if (!lines.length) return;

                    const entries = consolidateProposalLines(lines, productById, productsByName);
                    if (!entries.length) return;

                    const proposalTotal = entries.reduce((sum, entry) => sum + entry.lineTotal, 0);
                    total += proposalTotal;
                    details.push({
                        proposal: proposalsById.get(String(pid)) || { id: pid },
                        total: proposalTotal,
                        entries
                    });
                });

                details.sort((a, b) => b.total - a.total);
                return { total, countedProposals: details.length, details };
            };

            const openCalc = computeTotal(abiertoIds);
            const advCalc = computeTotal(avanzadoIds);

            const valorAbiertoEl = document.getElementById('valorAbierto');
            const valorAvanzadoEl = document.getElementById('valorAvanzado');
            const metaAbiertoEl = document.getElementById('metaAbierto');
            const metaAvanzadoEl = document.getElementById('metaAvanzado');

            if (valorAbiertoEl) valorAbiertoEl.textContent = money(openCalc.total);
            if (valorAvanzadoEl) valorAvanzadoEl.textContent = money(advCalc.total);
            if (metaAbiertoEl) metaAbiertoEl.textContent = `${openCalc.countedProposals} propuestas`;
            if (metaAvanzadoEl) metaAvanzadoEl.textContent = `${advCalc.countedProposals} propuestas`;

            const cardAbierto = document.getElementById('cardAbierto');
            const cardAvanzado = document.getElementById('cardAvanzado');
            const bindCard = (element, type, calc) => {
                if (!element) return;
                element.addEventListener('click', (event) => {
                    if (event.target.closest('.datos-info-btn')) return;
                    openDetailModal(type, calc);
                });
                element.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetailModal(type, calc);
                    }
                });
            };
            bindCard(cardAbierto, 'abierto', openCalc);
            bindCard(cardAvanzado, 'avanzado', advCalc);

            if (loadingEl) loadingEl.style.display = 'none';
            if (gridEl) gridEl.style.display = 'grid';
        } catch (e) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = e?.message || 'Error al cargar indicadores.';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupInfoModal();
        setupDetailModal();
        loadDatos();
    });
})();
