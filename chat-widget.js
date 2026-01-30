/**
 * Chat Widget para EPPO
 * Componente de chat flotante que se comunica con N8N
 */

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.webhookUrl = 'https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f77h';
        this.userName = null;
        this.userRole = null;
        this.supabase = null;
        this.sessionId = this.generateSessionId();
        this.init();
    }

    generateSessionId() {
        // Generar un ID único para la sesión de chat
        // Usar timestamp + random para garantizar unicidad
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async init() {
        await this.initializeSupabase();
        await this.loadUserInfo();
        this.createChatWidget();
        this.setupEventListeners();
    }

    async initializeSupabase() {
        try {
            if (window.universalSupabase) {
                this.supabase = await window.universalSupabase.getClient();
            } else if (window.cartManager?.supabase) {
                this.supabase = window.cartManager.supabase;
            } else {
                console.warn('⚠️ Supabase no disponible para el chat');
            }
        } catch (error) {
            console.error('❌ Error inicializando Supabase para chat:', error);
        }
    }

    async loadUserInfo() {
        try {
            const user = await window.authManager?.getCurrentUser();
            if (user && this.supabase) {
                const { data: userRoleData, error: roleError } = await this.supabase
                    .from('user_roles')
                    .select('"Name", role')
                    .eq('user_id', user.id)
                    .single();

                if (!roleError && userRoleData) {
                    this.userName = userRoleData.Name || 'Usuario';
                    this.userRole = userRoleData.role || 'comercial';
                } else {
                    this.userName = user.email || 'Usuario';
                    this.userRole = 'comercial';
                }
            } else {
                this.userName = 'Usuario';
                this.userRole = 'comercial';
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar información del usuario para chat:', error);
            this.userName = 'Usuario';
            this.userRole = 'comercial';
        }
    }

    createChatWidget() {
        // Crear contenedor del chat
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-widget-container';
        chatContainer.innerHTML = `
            <div id="chat-widget-button" class="chat-widget-button">
                <i class="fas fa-comments"></i>
            </div>
            <div id="chat-widget-window" class="chat-widget-window" style="display: none;">
                <div class="chat-widget-header">
                    <div class="chat-widget-header-content">
                        <i class="fas fa-robot"></i>
                        <span id="chat-widget-title">Asistente EPPO</span>
                    </div>
                    <button id="chat-widget-close" class="chat-widget-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="chat-widget-messages" class="chat-widget-messages"></div>
                <div class="chat-widget-input-container">
                    <input 
                        type="text" 
                        id="chat-widget-input" 
                        class="chat-widget-input" 
                        placeholder="Escribe tu mensaje..."
                    />
                    <button id="chat-widget-send" class="chat-widget-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);
    }

    setupEventListeners() {
        const button = document.getElementById('chat-widget-button');
        const closeButton = document.getElementById('chat-widget-close');
        const sendButton = document.getElementById('chat-widget-send');
        const input = document.getElementById('chat-widget-input');

        if (button) {
            button.addEventListener('click', () => this.toggleChat());
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeChat());
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('chat-widget-window');
        const button = document.getElementById('chat-widget-button');
        
        if (this.isOpen) {
            window.style.display = 'flex';
            button.style.display = 'none';
            const input = document.getElementById('chat-widget-input');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        } else {
            this.closeChat();
        }
    }

    closeChat() {
        this.isOpen = false;
        const window = document.getElementById('chat-widget-window');
        const button = document.getElementById('chat-widget-button');
        
        if (window) window.style.display = 'none';
        if (button) button.style.display = 'flex';
    }

    async sendMessage() {
        const input = document.getElementById('chat-widget-input');
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        // Limpiar input
        input.value = '';

        // Agregar mensaje del usuario al chat
        this.addMessage('user', message);

        // Mostrar indicador de escritura
        this.showTypingIndicator();

        try {
            // Construir mensaje completo con información del usuario
            const fullMessage = `[Usuario: ${this.userName || 'Usuario'}, Rol: ${this.userRole || 'comercial'}] ${message}`;

            // Enviar mensaje al webhook de N8N
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: fullMessage,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Intentar obtener la respuesta como texto primero
            const responseText = await response.text();
            let assistantMessage = 'Lo siento, no pude procesar tu mensaje.';
            
            // Intentar parsear como JSON
            try {
                const data = JSON.parse(responseText);
                assistantMessage = data.response || data.message || data.text || data.answer || data.content || responseText;
            } catch (jsonError) {
                // Si no es JSON válido, usar el texto directamente
                console.log('⚠️ Respuesta no es JSON, usando texto directo:', responseText);
                assistantMessage = responseText || 'Lo siento, no pude procesar tu mensaje.';
            }
            
            // Ocultar indicador de escritura
            this.hideTypingIndicator();

            // Agregar respuesta del asistente
            this.addMessage('assistant', assistantMessage);

        } catch (error) {
            console.error('❌ Error enviando mensaje al chat:', error);
            this.hideTypingIndicator();
            
            const lang = localStorage.getItem('language') || 'es';
            const errorMessage = lang === 'pt' 
                ? 'Desculpe, ocorreu um erro ao enviar a mensagem. Por favor, tente novamente.'
                : lang === 'es'
                ? 'Lo siento, ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.'
                : 'Sorry, an error occurred while sending the message. Please try again.';
            
            this.addMessage('assistant', errorMessage);
        }
    }

    addMessage(type, content) {
        const messagesContainer = document.getElementById('chat-widget-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-message-${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'chat-message-content';
        
        // Formatear el contenido para mejor visualización
        if (type === 'assistant') {
            messageContent.innerHTML = this.formatMessage(content);
        } else {
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // Scroll al final
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Guardar mensaje en el historial
        this.messages.push({ type, content, timestamp: new Date() });
    }

    formatMessage(text) {
        if (!text) return '';
        
        // Escapar HTML para seguridad
        let formatted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Detectar y formatear títulos (líneas que terminan con ":")
        formatted = formatted.replace(/^(.+):$/gm, '<strong class="chat-title">$1:</strong>');
        
        // Detectar listas numeradas (1., 2., etc.)
        formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="chat-list-item"><span class="chat-list-number">$1.</span><span class="chat-list-text">$2</span></div>');
        
        // Detectar listas con viñetas (-, •, *)
        formatted = formatted.replace(/^[-•*]\s+(.+)$/gm, '<div class="chat-list-item"><span class="chat-bullet">•</span><span class="chat-list-text">$1</span></div>');
        
        // Detectar secciones con "**" (títulos en negrita)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Detectar texto en cursiva con "*"
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convertir saltos de línea en <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Detectar bloques de notas/atención
        formatted = formatted.replace(/Notas?\s*\/\s*Atenção?:/gi, '<div class="chat-note-header">Notas / Atenção:</div>');
        formatted = formatted.replace(/Notas?\s*\/\s*Atención?:/gi, '<div class="chat-note-header">Notas / Atención:</div>');
        formatted = formatted.replace(/Notes?\s*\/\s*Attention?:/gi, '<div class="chat-note-header">Notes / Attention:</div>');
        
        // Detectar secciones "Passos:" o "Steps:"
        formatted = formatted.replace(/Passos?:/gi, '<div class="chat-section-header">Passos:</div>');
        formatted = formatted.replace(/Pasos?:/gi, '<div class="chat-section-header">Pasos:</div>');
        formatted = formatted.replace(/Steps?:/gi, '<div class="chat-section-header">Steps:</div>');
        
        return formatted;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-widget-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'chat-typing-indicator';
        typingDiv.className = 'chat-message chat-message-assistant';
        typingDiv.innerHTML = `
            <div class="chat-message-content">
                <span class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('chat-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Inicializar el chat cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que authManager esté disponible
    if (window.authManager) {
        window.chatWidget = new ChatWidget();
    } else {
        // Si authManager no está disponible, esperar un poco
        setTimeout(() => {
            if (window.authManager) {
                window.chatWidget = new ChatWidget();
            } else {
                console.warn('⚠️ AuthManager no disponible, chat no se inicializará');
            }
        }, 1000);
    }
});

