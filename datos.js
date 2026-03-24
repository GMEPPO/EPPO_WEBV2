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
                .select('id, estado_propuesta, codigo_propuesta');
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

            const computeTotal = (proposalIds) => {
                let total = 0;
                let countedProposals = 0;
                (proposalIds || []).forEach(pid => {
                    const lines = articulosByProposal[pid] || [];
                    if (!lines.length) return;
                    countedProposals += 1;

                    const minLineByKey = new Map();
                    lines.forEach(line => {
                        const key = productDupKey(line);
                        const qty = Math.max(0, num(line.cantidad));
                        const existing = minLineByKey.get(key);
                        if (!existing || qty < existing.qty) {
                            minLineByKey.set(key, {
                                qty,
                                price: num(line.precio)
                            });
                        }
                    });
                    minLineByKey.forEach(v => {
                        total += v.qty * v.price;
                    });
                });
                return { total, countedProposals };
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
        loadDatos();
    });
})();
