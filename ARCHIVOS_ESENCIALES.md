# 📁 Archivos Esenciales para Vercel

## ✅ Archivos que DEBEN estar en GitHub

Estos archivos son **OBLIGATORIOS** para que Vercel funcione:

1. **`index.html`** ⭐ CRÍTICO
   - El archivo principal de la aplicación
   - Debe estar en la raíz del proyecto

2. **`vercel.json`** ⭐ CRÍTICO
   - Configuración de Vercel
   - Maneja CORS y rutas

3. **`README.md`** (Recomendado)
   - Documentación del proyecto

4. **`.gitignore`** (Recomendado)
   - Protege archivos sensibles

## ❌ Archivos que NO deben estar

Estos archivos están protegidos por `.gitignore`:

- `server/.env` - Información confidencial
- `node_modules/` - Dependencias (muy pesado)
- Archivos temporales

## 🔍 Verificar Antes de Subir

Antes de conectar con Vercel, verifica en GitHub que veas:

```
✅ index.html
✅ vercel.json
✅ README.md
✅ .gitignore
```

Si alguno falta, el despliegue fallará.

## 📋 Estructura Mínima

```
chat-web/
├── index.html          ← OBLIGATORIO
├── vercel.json         ← OBLIGATORIO
├── README.md           ← Recomendado
├── .gitignore          ← Recomendado
└── (otros archivos)
```

