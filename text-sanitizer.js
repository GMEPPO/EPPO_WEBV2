(() => {
    const suspiciousPattern = /[ÃÂâðï�]/;
    const attributeNames = ['placeholder', 'title', 'aria-label', 'alt'];

    function suspiciousScore(value) {
        return (String(value || '').match(/[ÃÂâðï�]/g) || []).length;
    }

    function decodeLatin1Utf8(value) {
        try {
            return decodeURIComponent(escape(value));
        } catch (_) {
            return value;
        }
    }

    function applyReplacements(value) {
        const replacements = [
            ['Â°C', '°C'],
            ['â‚¬', '€'],
            ['â€”', '—'],
            ['â€“', '–'],
            ['â€œ', '"'],
            ['â€', '"'],
            ['â€˜', "'"],
            ['â€™', "'"],
            ['â€¦', '...'],
            ['ðŸŒ', '🌐'],
            ['ðŸ“¦', '📦'],
            ['ðŸ“‹', '📋'],
            ['ðŸ”„', '🔄'],
            ['ðŸ”', '🔍'],
            ['ðŸ’°', '💰'],
            ['ðŸ’¾', '💾'],
            ['ðŸ“¤', '📤'],
            ['ðŸ”§', '🔧'],
            ['âœ…', '✅'],
            ['âŒ', '❌'],
            ['âš ï¸', '⚠️'],
            ['Â¿', '¿'],
            ['Â¡', '¡'],
            ['Ã¡', 'á'],
            ['Ãà', 'à'],
            ['Ã¢', 'â'],
            ['Ã£', 'ã'],
            ['Ãä', 'ä'],
            ['Ãé', 'é'],
            ['Ãè', 'è'],
            ['Ãê', 'ê'],
            ['Ãë', 'ë'],
            ['Ãí', 'í'],
            ['Ãì', 'ì'],
            ['Ãî', 'î'],
            ['Ãï', 'ï'],
            ['Ãó', 'ó'],
            ['Ãò', 'ò'],
            ['Ãô', 'ô'],
            ['Ãõ', 'õ'],
            ['Ãö', 'ö'],
            ['Ãú', 'ú'],
            ['Ãù', 'ù'],
            ['Ãû', 'û'],
            ['Ã¼', 'ü'],
            ['Ã§', 'ç'],
            ['Ã‡', 'Ç'],
            ['Ã±', 'ñ'],
            ['Ã‘', 'Ñ'],
            ['Ã', 'Á'],
            ['Ã‰', 'É'],
            ['Ã', 'Í'],
            ['Ã“', 'Ó'],
            ['Ãš', 'Ú'],
            ['Ã€', 'À'],
            ['Ã‚', 'Â'],
            ['ÃƒÂ¡', 'á'],
            ['ÃƒÂ£', 'ã'],
            ['ÃƒÂ§', 'ç'],
            ['ÃƒÂ©', 'é'],
            ['ÃƒÂ­', 'í'],
            ['ÃƒÂ³', 'ó'],
            ['ÃƒÂº', 'ú'],
            ['ÃƒÂª', 'ê'],
            ['ÃƒÂ´', 'ô'],
            ['ÃƒÂµ', 'õ'],
            ['ÃƒÂ¢', 'â'],
            ['ÃƒÂ§ÃƒÂ£o', 'ção'],
            ['ÃƒÂ§ÃƒÂµes', 'ções'],
            ['ÃƒÂµes', 'ões'],
            ['ÃƒÂ£o', 'ão'],
            ['ÃƒÂªncia', 'ência'],
            ['ÃƒÂ¡rio', 'ário'],
            ['ÃƒÂ¡vel', 'ável'],
            ['ÃƒÂ±', 'ñ'],
            ['ÃƒÂ¼', 'ü'],
            ['Ã‚', '']
        ];

        let output = value;
        replacements.forEach(([search, replace]) => {
            output = output.split(search).join(replace);
        });
        return output;
    }

    function repairText(value) {
        if (typeof value !== 'string' || !suspiciousPattern.test(value)) return value;

        let repaired = value;
        for (let i = 0; i < 3; i += 1) {
            const decoded = decodeLatin1Utf8(repaired);
            if (decoded === repaired) break;
            if (suspiciousScore(decoded) > suspiciousScore(repaired)) break;
            repaired = decoded;
        }

        return applyReplacements(repaired);
    }

    function sanitizeDeep(value) {
        if (typeof value === 'string') return repairText(value);
        if (Array.isArray(value)) return value.map(item => sanitizeDeep(item));
        if (value && typeof value === 'object') {
            const clone = {};
            Object.entries(value).forEach(([key, nested]) => {
                clone[key] = sanitizeDeep(nested);
            });
            return clone;
        }
        return value;
    }

    function sanitizeNode(node) {
        if (!node) return;

        if (node.nodeType === Node.TEXT_NODE) {
            const current = node.textContent || '';
            const repaired = repairText(current);
            if (repaired !== current) node.textContent = repaired;
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        attributeNames.forEach(attr => {
            if (node.hasAttribute(attr)) {
                const current = node.getAttribute(attr);
                const repaired = repairText(current);
                if (repaired !== current) node.setAttribute(attr, repaired);
            }
        });

        Array.from(node.childNodes).forEach(child => sanitizeNode(child));
    }

    function sanitizeDocument(root = document.body) {
        if (document.title) {
            document.title = repairText(document.title);
        }
        if (!root) return;
        sanitizeNode(root);
    }

    function installDialogWrappers() {
        const originalAlert = typeof window.alert === 'function' ? window.alert.bind(window) : null;
        const originalConfirm = typeof window.confirm === 'function' ? window.confirm.bind(window) : null;

        if (originalAlert) {
            window.alert = function patchedAlert(message) {
                return originalAlert(repairText(String(message ?? '')));
            };
        }

        if (originalConfirm) {
            window.confirm = function patchedConfirm(message) {
                return originalConfirm(repairText(String(message ?? '')));
            };
        }
    }

    function installMutationObserver() {
        if (window.__eppoTextSanitizerInstalled) return;
        window.__eppoTextSanitizerInstalled = true;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'characterData') {
                    sanitizeNode(mutation.target);
                } else if (mutation.type === 'attributes') {
                    sanitizeNode(mutation.target);
                } else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => sanitizeNode(node));
                }
            });
        });

        const start = () => {
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: attributeNames
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }

    window.EPPOTextSanitizer = {
        repairText,
        sanitizeDeep,
        sanitizeNode,
        sanitizeDocument
    };

    installDialogWrappers();
    installMutationObserver();

    document.addEventListener('DOMContentLoaded', () => {
        if (window.translationSystem && window.translationSystem.translations) {
            window.translationSystem.translations = sanitizeDeep(window.translationSystem.translations);
        }
        sanitizeDocument(document.body);
    });
})();
