# 🔧 Solução: Erro do Webhook do n8n

## ❌ Erro Comum

```
O webhook do n8n não está registrado ou o workflow não está ativo
```

## ✅ Soluções

### 1. Verificar se o Workflow está Ativo

1. Abra o n8n
2. Encontre o workflow com o webhook
3. **Verifique o toggle no canto superior direito** - deve estar **ATIVO** (verde/azul)
4. Se estiver inativo, clique para ativar

### 2. Verificar Configuração do Webhook

No n8n, no nodo Webhook:

1. **Método HTTP**: Deve ser **POST** (não GET)
2. **Path**: Deve ser o ID do webhook: `761b05cc-158e-4140-9f11-8be71f4d2f3a`
3. **Response Mode**: Pode ser "Last Node" ou "Using 'Respond to Webhook' Node"

### 3. Verificar a URL

A URL deve ser a **Production URL**, não a Test URL:

✅ **Correto**: `https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f3a`

❌ **Incorreto**: `https://groupegmpi.app.n8n.cloud/webhook-test/761b05cc-158e-4140-9f11-8be71f4d2f3a`

### 4. Testar o Webhook Diretamente

Pode testar o webhook usando curl ou Postman:

```bash
curl -X POST https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f3a \
  -H "Content-Type: application/json" \
  -d '{"message": "teste", "sessionId": "test"}'
```

Se funcionar, deve retornar uma resposta do workflow.

### 5. Verificar Logs do n8n

1. No n8n, vá para "Executions"
2. Veja se há execuções recentes
3. Se não houver, o webhook não está recebendo as requisições

## 🔍 Diagnóstico

O código agora mostra mais informações no console do servidor (Vercel):
- Status HTTP da resposta
- Primeiros 200 caracteres da resposta
- Erros de rede

Verifique os logs do Vercel para mais detalhes.

## ⚠️ Notas Importantes

- O workflow **DEVE** estar ativo para funcionar
- O método HTTP **DEVE** ser POST
- Use sempre a **Production URL**, nunca a Test URL
- O webhook funciona mesmo sem autenticação (se configurado assim)

## 🐛 Se Ainda Não Funcionar

1. Verifique se o n8n está acessível
2. Verifique se há firewall bloqueando
3. Teste o webhook diretamente (curl/Postman)
4. Verifique os logs do n8n para ver se recebe as requisições

