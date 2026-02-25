# 🧪 Como Testar o Webhook do n8n

## ✅ Verificar se a URL de Teste Funciona

### 1. No n8n - Configuração do Webhook

Para que a URL de teste funcione, você precisa:

1. **Abrir o nodo Webhook no n8n**
2. **Clicar no botão "Listen for test event"** (botão vermelho/laranja)
3. Isso ativa o modo de teste do webhook
4. O webhook de teste só funciona enquanto você está com o botão ativo

### 2. Diferença entre Production e Test

- **Production URL**: Funciona quando o workflow está **ATIVO**
- **Test URL**: Funciona quando você clica em **"Listen for test event"** no nodo Webhook

### 3. Testar Manualmente

Pode testar a URL de teste diretamente:

```bash
curl -X POST https://groupegmpi.app.n8n.cloud/webhook-test/761b05cc-158e-4140-9f11-8be71f4d2f3a \
  -H "Content-Type: application/json" \
  -d '{"message": "teste", "sessionId": "test"}'
```

**Importante**: A URL de teste só funciona se você tiver clicado em "Listen for test event" no n8n.

## 🔍 Diagnóstico

O código agora mostra nos logs:
- Qual URL está sendo tentada (PRODUCTION ou TEST)
- Status da resposta
- Qual URL funcionou (se houver sucesso)
- Detalhes dos erros

## ⚠️ Recomendação

Para uso em produção:
- Use sempre a **Production URL**
- Mantenha o workflow **ATIVO**
- A URL de teste é apenas para desenvolvimento/testes

## 🐛 Se a URL de Teste Não Funcionar

1. Verifique se clicou em "Listen for test event" no n8n
2. Verifique se o método HTTP é POST (não GET)
3. Verifique se o workflow está salvo
4. Tente a Production URL (mais confiável)

