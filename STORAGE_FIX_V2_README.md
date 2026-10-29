# Storage Fix V2 — imágenes de productos

Este parche NO cambia Firebase Authentication, firebase.ts, environment.ts, TenantContextService ni las reglas de Firestore.

## Aplicar reglas
1. Firebase Console → proyecto `catalogosflorerias` → Storage → Rules.
2. Sustituye las reglas de Storage por el contenido de `storage.rules`.
3. Pulsa Publish.
4. Si Firebase muestra un aviso para habilitar permisos entre Cloud Storage y Cloud Firestore, acepta la habilitación. Es necesario porque las reglas usan `firestore.get()`.
5. Recarga la app y prueba subir una imagen JPG/PNG/WEBP de hasta 5 MB.

## Permisos
- Leer imágenes: owner, admin, editor, viewer con asignación activa.
- Crear, reemplazar o borrar imágenes: owner, admin, editor con asignación activa.
- Ruta: `tenants/{tenantId}/{normal|vip}/products/images/{fileName}`.

## Si continúa `storage/unauthorized`
No cambies las reglas de Firestore ni abras Storage a todo el mundo. Confirma:
- Que estas reglas se publicaron en **Storage → Rules**, no Firestore → Rules.
- Que aceptaste habilitar los permisos de integración Firestore/Storage.
- Que el documento `userTenants/{UID}` contiene `tenantId: cielitodeflores`, `status: active` y `role: owner`.
