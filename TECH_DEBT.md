# 📌 Technical Debt & Pending Tasks

## 1. Expo New Architecture (Fabric)
- **Estado Actual**: Habilitada (`newArchEnabled: true` en `app.json`).
- **Razón**: `react-native-reanimated` v4 requiere la Nueva Arquitectura para compilar en React Native 0.81.5.
- **Acción Pendiente**: Si vuelven a aparecer errores de SVG (como `topSvgLayout`), deberán resolverse mediante parches o actualizaciones de librería, no desactivando la arquitectura global.

---
*Ultima actualización: 2026-03-06*
