# Guía de Despliegue Web (FastEat Delivery)

Este proyecto utiliza **Expo Router** con `web.output: 'server'`, lo que significa que requiere un entorno de ejecución de Node.js para las Rutas de API (como la de Google Maps) y SSR.

## Opción 1: Vercel (Recomendado)

Vercel es la plataforma que mejor soporta las características modernas de Expo Web.

### 1. Preparación
Instala el adaptador de Vercel para Expo:
```bash
npm install @expo/vercel-adapter
```

### 2. Configuración (`vercel.json`)
Crea un archivo `vercel.json` en la raíz con:
```json
{
  "extends": "expo/vercel.json"
}
```

### 3. Despliegue
1. Conecta tu repositorio de GitHub a Vercel.
2. Configura las **Variables de Entorno** en el dashboard de Vercel:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Comando de Build: `npx expo export --platform web`
4. Directorio de Salida: `.vercel/output`

---

## Opción 2: Render

En Render, debes desplegarlo como un **Web Service**.

### 1. Build & Start
Configura estos comandos en Render:
- **Build Command**: `npm install && npx expo export --platform web`
- **Start Command**: `npx expo start --web` (O usando un servidor de archivos estáticos si cambias `web.output` a `static`)

> [!IMPORTANT]
> Como usas `web.output: 'server'`, Render necesita ejecutar el servidor de Expo. Asegúrate de que el **Plan** de Render tenga suficiente memoria para el proceso de Expo.

### 2. Variables de Entorno
Agrega las mismas variables (`EXPO_PUBLIC_*`) en la pestaña "Environment" de Render.


---

## Seguridad de Google Maps (Privacidad de API Key)

Hemos configurado un sistema híbrido para proteger tu API Key:

1.  **En Desarrollo (Móvil)**: La app usa `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` para llamar directamente a Google. Esto facilita el desarrollo local.
2.  **En Producción (Web y Móvil)**: La app llama a tu propio servidor (el Proxy `/maps`). Esto permite que la API Key real (`GOOGLE_MAPS_API_KEY`) sea **privada** y nunca se exponga al público.

### Variable Requerida para Móvil en Producción
Para que la App Móvil pueda encontrar tu servidor en producción, debes agregar esta variable en tu archivo `.env` (local) y en los secretos de Vercel/Render (producción):

- `EXPO_PUBLIC_BASE_URL`: La URL de tu sitio web (ej: `https://fasteat.vercel.app`). **IMPORTANTE**: No incluyas `/maps` al final, solo el dominio.

### Resumen de Variables en Vercel/Render:
- `EXPO_PUBLIC_SUPABASE_URL`: (Público) URL de tu proyecto.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: (Público) Key anónima.
- `GOOGLE_MAPS_API_KEY`: (**Privado**) Tu clave de Google Maps (sin el prefijo EXPO_PUBLIC).
- `EXPO_PUBLIC_BASE_URL`: (Público) La URL de tu despliegue para que el móvil sepa dónde está el proxy.

---

## Recordatorios Importantes

- **Supabase Auth**: Asegúrate de agregar la URL de tu despliegue (ej. `https://fast-eat-delivery.vercel.app`) en la lista de "Redirect URLs" en el dashboard de **Supabase > Auth > URL Configuration**.
- **Google Maps**: Verifica que tu API Key tenga permitido el dominio de tu despliegue en la [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials).
- **PWA**: El despliegue automático generará el `manifest.json` y el Service Worker para que tus repartidores puedan "Instalar" la app desde el navegador.
