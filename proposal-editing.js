function parseEditingProposalFromStorage() {
    try {
        const raw = localStorage.getItem('editing_proposal');
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function getEditingProposalContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    const storedProposal = parseEditingProposalFromStorage();
    const proposalId = editId || storedProposal?.id || null;

    if (!proposalId && !storedProposal) {
        return null;
    }

    const codigoPropuesta = storedProposal?.codigo_propuesta || (proposalId ? String(proposalId).substring(0, 8).toUpperCase() : '');
    const clientName = storedProposal?.nombre_cliente || '';

    return {
        proposalId: proposalId,
        codigoPropuesta: codigoPropuesta,
        clientName: clientName,
        data: storedProposal
    };
}

function buildEditingCartUrl() {
    const context = getEditingProposalContext();
    if (!context || !context.proposalId) return 'carrito-compras.html';
    return `carrito-compras.html?edit=${encodeURIComponent(context.proposalId)}`;
}

function cancelEditingProposal(options = {}) {
    const {
        redirectTo = 'consultar-propuestas.html',
        clearCart = true
    } = options;

    try {
        localStorage.removeItem('editing_proposal');
        if (clearCart) {
            localStorage.setItem('eppo_cart', '[]');
        }
    } catch (_) {}

    if (window.cartManager) {
        window.cartManager.editingProposalId = null;
        window.cartManager.editingProposalData = null;
    }

    if (redirectTo) {
        window.location.href = redirectTo;
    }
}

window.proposalEditing = {
    getContext: getEditingProposalContext,
    buildCartUrl: buildEditingCartUrl,
    cancel: cancelEditingProposal
};
