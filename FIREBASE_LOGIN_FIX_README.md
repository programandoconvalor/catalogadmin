# Corrección de inicio de sesión Firebase

## Cambios
- `src/app/core/tenant/tenant-context.service.ts`: si existe una asignación activa en `userTenants/{uid}` pero falta el documento espejo en `tenants/{tenantId}/members/{uid}`, el contexto usa el rol/estado de `userTenants` y registra una advertencia.
- `firestore.rules.corrected.txt`: usa `userTenants` como fuente de autorización para el tenant y sus datos. Los clientes no pueden escribir `userTenants`.

## Pasos para probar
1. Descomprime el ZIP y abre `catalogadmin_V1` en VS Code.
2. En Firebase Console, abre `catalogosflorerias` → Firestore Database → Rules. Copia `firestore.rules.corrected.txt` y pulsa **Publish**.
3. En la terminal, ejecuta `npm install` si hace falta y luego `npm start`.
4. Prueba iniciar sesión.

## Nota de seguridad
`userTenants` se convierte en la fuente de verdad para el rol. Sus escrituras desde el cliente están denegadas; crea o cambia asignaciones solo desde una herramienta administrativa confiable o backend con Firebase Admin SDK. El archivo local de reglas no se publica automáticamente.
