# Corrección de Firebase API Key — V11

## Qué se corrigió

En las dos configuraciones Angular se corrigió un posible error de transcripción en la API key: el carácter después de `GC` estaba escrito como letra minúscula `l`; se cambió por el número `1`, de acuerdo con la clave visible en la petición de la captura.

Archivos actualizados:
- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

## Pasos de validación

1. Descomprime este ZIP y abre la carpeta `catalogadmin_V1`.
2. Ejecuta `npm install` si es la primera vez o si no existe `node_modules`.
3. Ejecuta `npm start` (la configuración de `serve` usa desarrollo).
4. Recarga `http://localhost:4200/signin` y prueba iniciar sesión.
5. Si aún aparece `API_KEY_INVALID`, entra a Firebase Console → Configuración del proyecto → General → Tus aplicaciones → aplicación web, copia de nuevo la configuración completa y reemplaza `apiKey` en ambos archivos. Confirma también en Google Cloud Console que la clave no esté eliminada/deshabilitada y que sus restricciones permitan las API de Firebase Authentication necesarias.

## Importante

La API key de Firebase para una aplicación web no sustituye la contraseña ni concede por sí sola acceso a Firestore. Las operaciones CRUD siguen sujetas a Authentication y a las reglas de seguridad de Firestore. No uses reglas públicas para solucionar errores de autenticación.

No se puede confirmar desde el ZIP que Google acepte la clave ni probar el inicio de sesión contra tu proyecto remoto; esa validación requiere ejecutar la app con una clave válida y un usuario existente en Firebase Authentication.
