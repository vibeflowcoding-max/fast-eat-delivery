# 🚀 Guía de Comandos Expo & EAS (Fast Eat Delivery)

Esta guía contiene los comandos esenciales para el desarrollo, compilación y despliegue de la aplicación.

---

## 💻 Desarrollo Local

### 1. Iniciar servidor de desarrollo
```bash
npx expo start
```
Abre el menú de Expo. Desde aquí puedes presionar `a` para Android, `i` para iOS o `w` para Web.

### 2. Iniciar limpiando caché
```bash
npx expo start -c
```
Úsalo si notas comportamientos extraños en el bundle o si cambiaste algo en `app.json`.

### 3. Forzar el uso de Expo Go
```bash
npx expo start --go
```
Útil si no tienes instalada la "Development Build" nativa en tu teléfono, aunque algunas funciones nativas personalizadas podrían no funcionar.

---

## 📱 Ejecución Nativa Local (Requiere JDK para Android) Version 17

Estos comandos compilan la app en tu propia computadora e intentan instalarla en un emulador o dispositivo conectado.

### 1. Ejecutar en Android (Local)
```bash
npx expo run:android
```

### 2. Ejecutar en iOS (Local - Solo macOS)
```bash
npx expo run:ios
```

---

## 🏗️ Compilación con EAS Build (En la Nube)

EAS Build permite crear instaladores sin usar los recursos de tu computadora.

### 1. Crear APK para pruebas (Android)
```bash
npx eas build --profile preview --platform android
```
Esto generará un archivo `.apk` descargable que puedes instalar directamente en cualquier teléfono Android. El perfil `preview` está configurado en tu `eas.json`.

### 2. Crear Development Build (Para desarrollo con `expo-dev-client`)
```bash
npx eas build --profile development --platform android
```
Crea la aplicación nativa personalizada que necesitas para usar el modo de desarrollo nativo sin Expo Go.

### 3. Compilar para Producción (Play Store / App Store)
```bash
npx eas build --profile production --platform all
```
Genera los archivos `.aab` (Android) y `.ipa` (iOS) listos para subir a las tiendas.

---

## 🚀 Subida a Tiendas (EAS Submit)

### 1. Subir a Google Play o App Store
```bash
npx eas submit --platform android
# o
npx eas submit --platform ios
```
Este comando te guiará para subir el archivo generado en el paso anterior a las consolas de desarrollador.

---

## 🧹 Mantenimiento y Solución de Problemas

### Borrar carpetas nativas y regenerar (Prebuild)
Si tienes problemas con las carpetas `android/` o `ios/`, puedes borrarlas y dejar que Expo las recree:
```bash
rm -rf android ios
npx expo prebuild
```

### Reinstalar dependencias desde cero
```bash
rm -rf node_modules package-lock.json
npm install

OR

rm -rf android && npx expo prebuild --platform android && npx expo run:android

```

---

## 🔍 Versiones Actuales del Entorno
- **JDK:** 17 (Instalado en `/opt/homebrew/opt/openjdk@17`)
- **Node:** v22.14.0
- **Expo SDK:** 54.0.33
