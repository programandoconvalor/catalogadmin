# Corrección de Firebase Storage para imágenes de productos

## Qué se cambió
- Se agregó `storage.rules` para la ruta que usa el código actual:
  `tenants/{tenantId}/{normal|vip}/products/images/{fileName}`.
- No se modificaron `environment.ts`, Firebase Authentication, `firebase.ts`, el contexto del tenant ni las reglas de Firestore.
- La regla permite leer imágenes a usuarios con asignación activa en `userTenants`.
- Solo `owner`, `admin` y `editor` pueden subir, reemplazar o eliminar imágenes.
- Se permiten imágenes JPEG, PNG y WEBP de hasta 5 MB, coincidiendo con la validación del servicio Angular.

## Pasos obligatorios en Firebase Console
1. Abre el proyecto `catalogosflorerias`.
2. Ve a **Storage → Rules** (NO a Firestore Database → Rules).
3. Copia el contenido completo de `storage.rules` y pulsa **Publish**.
4. Recarga `http://localhost:4200/catalogos/normal`.
5. Intenta crear un producto con una imagen JPG, PNG o WEBP menor o igual a 5 MB.

## Nota importante
Las reglas de Firestore y las de Firebase Storage son independientes. Publicar reglas en Firestore no autoriza las subidas a Storage. Estas reglas de Storage consultan el documento `userTenants/{uid}` de Firestore para comprobar tenant, estado y rol. No conceden acceso a otros tenants.

La compilación del proyecto no se declara verificada en este paquete. El cambio que corrige el error `storage/unauthorized` es la regla de Storage; publicar el archivo en el lugar correcto es necesario para que tenga efecto.
