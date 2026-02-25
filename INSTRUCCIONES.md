# 🚀 Instrucciones para Ejecutar la Aplicación

## ✅ Opción 1: Abrir HTML directamente (MÁS FÁCIL)

1. **Abre el archivo `index.html`** directamente en tu navegador (doble clic)
2. **Inicia el servidor backend** (necesario para que funcione el chat):
   ```powershell
   cd server
   npm install  # Solo la primera vez
   npm start
   ```
3. ¡Listo! El chat debería funcionar.

**Nota**: El archivo `index.html` en la raíz del proyecto es standalone y funciona sin necesidad de instalar React o ejecutar servidores de desarrollo.

## 🔧 Opción 2: Usar React con servidor de desarrollo

Si prefieres la versión con React compilado:

## 📋 Pasos para Ejecutar

### 1. Instalar Dependencias

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Instalar dependencias del servidor
cd server
npm install

# Instalar dependencias del cliente
cd ../client
npm install
```

### 2. Configurar Variables de Entorno

El archivo `.env` ya está creado con la URL del webhook de n8n. **NO** lo subas a GitHub (ya está en `.gitignore`).

### 3. Ejecutar la Aplicación

Necesitas **DOS terminales** abiertas:

**Terminal 1 - Servidor Backend:**
```powershell
cd server
npm start
```
Deberías ver: `Servidor corriendo en http://localhost:5000`

**Terminal 2 - Cliente Frontend:**
```powershell
cd client
npm start
```
Esto abrirá automáticamente el navegador en `http://localhost:3000`

### 4. Acceder a la Aplicación

✅ **CORRECTO**: Abre `http://localhost:3000` en el navegador  
❌ **INCORRECTO**: Abrir `index.html` directamente desde el explorador de archivos

## 🔒 Seguridad

- ✅ El archivo `.env` está en `.gitignore` y **NO** se subirá a GitHub
- ✅ La URL del webhook es información confidencial y está protegida
- ⚠️ **NUNCA** subas el archivo `server/.env` al repositorio

## 🐛 Solución de Problemas

### "El index no muestra nada"
- **Causa**: Estás abriendo el HTML directamente
- **Solución**: Ejecuta `npm start` en la carpeta `client` y abre `http://localhost:3000`

### "Error al conectar con n8n"
- Verifica que n8n esté corriendo y el webhook esté activo
- Verifica la URL en `server/.env`

### "Puerto ya en uso"
- Cambia el puerto en `server/.env` (PORT=5001)
- O cierra la aplicación que está usando el puerto

## 📝 Notas

- El servidor backend debe estar corriendo antes de usar el chat
- Si cambias algo en el código, React se recargará automáticamente
- Para detener los servidores, presiona `Ctrl+C` en cada terminal

