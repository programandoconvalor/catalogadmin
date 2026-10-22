# Admin Catálogo Admin Catálogo

Panel de administración para gestionar los catálogos digitales de **Admin Catálogo**. La aplicación permite administrar productos, categorías, imágenes y zonas de entrega desde una interfaz web desarrollada con Angular, Tailwind CSS y Firebase.

El proyecto está diseñado para mantener separados los catálogos Normal y VIP, facilitando la administración de sus productos, categorías y zonas de entrega.

## Características principales

### Gestión de productos

- Crear, consultar, editar y eliminar productos.
- Administrar códigos, SKU, nombres, descripciones y precios.
- Organizar productos por categorías.
- Configurar estados activo e inactivo.
- Controlar la disponibilidad para venta.
- Definir el orden de aparición de los productos.
- Configurar presentaciones y precios individuales.
- Administrar los elementos incluidos en cada producto.
- Subir y actualizar imágenes de productos.
- Buscar, filtrar y ordenar productos.
- Visualizar productos en formato de tarjetas o lista.

### Gestión de categorías

- Crear, editar y eliminar categorías.
- Configurar el nombre, estado y orden de aparición.
- Mantener las categorías separadas por catálogo.
- Administrar las categorías desde el panel correspondiente a cada catálogo.

### Gestión de zonas de entrega

- Crear, consultar, editar y eliminar zonas de entrega.
- Configurar nombre, estado y orden de aparición.
- Mantener independientes las zonas de los catálogos Normal y VIP.
- Identificar cada zona mediante `catalogId`.
- Validar la pertenencia de una zona al catálogo antes de actualizarla o eliminarla.
- Administrar las zonas sin un campo de descripción.

**Importante:** las zonas de entrega de Catálogo Normal y Catálogo VIP son independientes. Los cambios realizados en un catálogo no deben modificar las zonas del otro.

### Administración de imágenes

- Cargar imágenes desde el panel de administración.
- Mostrar una vista previa antes de guardar.
- Validar los archivos de imagen admitidos.
- Mostrar el progreso de carga.
- Almacenar las imágenes en Firebase Storage.
- Guardar las referencias de las imágenes junto con los datos de los productos en Firestore.

### Experiencia de usuario

- Interfaz adaptable a dispositivos móviles y escritorio.
- Formularios con validaciones.
- Ventanas modales para crear y editar registros.
- Confirmación antes de eliminar registros.
- Notificaciones de éxito y error.
- Indicadores de carga y guardado.
- Navegación desde el panel administrativo.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Angular | Framework de la aplicación |
| TypeScript | Lenguaje de programación |
| Tailwind CSS | Estilos y diseño de la interfaz |
| Firebase Authentication | Autenticación de usuarios |
| Cloud Firestore | Almacenamiento de productos, categorías y zonas |
| Firebase Storage | Almacenamiento de imágenes |
| Angular Reactive Forms | Formularios y validaciones |
| Git y GitHub | Control de versiones y repositorio |

## Arquitectura de datos

La aplicación utiliza una estructura organizada por tenant y catálogo.

La estructura de Firestore contempla las siguientes rutas:

```text
tenants/
└── cielitodeflores/
    ├── categories/
    ├── catalogs/
    │   ├── normal/
    │   │   └── items/
    │   └── vip/
    │       └── items/
    └── deliveryZones/
```

Las categorías se identifican mediante `catalogId` para separar Normal y VIP. Las zonas de entrega también utilizan `catalogId` para distinguir a qué catálogo pertenece cada registro.

La colección de zonas puede ser compartida a nivel de tenant, pero las consultas y operaciones deben respetar el catálogo correspondiente.

## Catálogos

- **Catálogo Normal:** [https://cielitodeflores.vercel.app/](https://cielitodeflores.vercel.app/)
- **Catálogo VIP:** [https://cielitodefloresvip.vercel.app/](https://cielitodefloresvip.vercel.app/)

## Requisitos previos

Antes de ejecutar el proyecto localmente, instala:

- Node.js compatible con la versión de Angular del proyecto.
- npm.
- Angular CLI, si lo necesitas para ejecutar los comandos globales.
- Una cuenta y un proyecto de Firebase con los servicios requeridos habilitados.

Puedes comprobar las versiones instaladas con:

```bash
node --version
npm --version
ng version
```

## Instalación

### 1. Clonar el repositorio

Sustituye `USUARIO` por el nombre de usuario u organización de GitHub donde se encuentra el repositorio.

```bash
git clone https://github.com/USUARIO/admincatalogofloreria.git
```

### 2. Entrar al proyecto

```bash
cd admincatalogofloreria
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar Firebase

Configura los valores de Firebase en los archivos de entorno correspondientes a la estructura actual del proyecto.

La aplicación requiere la configuración apropiada para los servicios que utiliza:

- Firebase Authentication.
- Cloud Firestore.
- Firebase Storage.

No publiques claves privadas, contraseñas, tokens ni credenciales administrativas en el repositorio.

### 5. Ejecutar en desarrollo

```bash
npm start
```

Si el proyecto no define el script `start`, puedes utilizar:

```bash
ng serve
```

Abre en el navegador la dirección local indicada por Angular CLI, normalmente:

[http://localhost:4200](http://localhost:4200)

## Seguridad y separación de catálogos

La aplicación debe mantener las siguientes reglas:

1. Los productos pertenecen al catálogo correspondiente.
2. Las categorías se consultan y administran de acuerdo con su `catalogId`.
3. Las zonas de entrega se consultan filtrando por `catalogId`.
4. Las operaciones de actualización y eliminación deben comprobar la pertenencia de la zona al catálogo solicitado.
5. Las reglas de seguridad de Firestore deben impedir el acceso no autorizado a los datos.
6. Las credenciales de Firebase y los permisos deben configurarse correctamente para cada entorno.

Las validaciones del frontend mejoran la experiencia de uso, pero no sustituyen las reglas de seguridad del backend.

## Estructura general del proyecto

```text
src/
└── app/
    ├── core/
    │   ├── catalog/
    │   │   ├── catalog.service.ts
    │   │   ├── category.service.ts
    │   │   └── delivery-zone.service.ts
    │   ├── firebase/
    │   ├── models/
    │   │   ├── catalog-item.model.ts
    │   │   ├── category.model.ts
    │   │   └── delivery-zone.model.ts
    │   ├── notifications/
    │   ├── storage/
    │   └── tenant/
    ├── pages/
    │   └── catalog/
    │       ├── catalog-page.component.ts
    │       ├── catalog-page.component.html
    │       └── catalog-page.component.scss
    └── shared/
```

La estructura es orientativa y debe ajustarse si las rutas reales del repositorio difieren.

## Scripts disponibles

Consulta la sección `scripts` de `package.json` para conocer los comandos definidos en el proyecto.

Los comandos habituales de Angular incluyen:

```bash
npm start
ng serve
ng build
```

Para generar una compilación de producción:

```bash
ng build
```

El directorio de salida depende de la configuración del proyecto Angular.

## Despliegue

El proyecto puede desplegarse en una plataforma compatible con aplicaciones Angular, como Vercel u otro servicio de hosting estático.

Antes de publicar:

- Configura las variables y los entornos de Firebase.
- Verifica las reglas de Firestore y Storage.
- Comprueba el funcionamiento del inicio de sesión.
- Prueba las operaciones CRUD de productos y categorías.
- Verifica que Normal y VIP mantengan sus zonas de entrega independientes.
- Ejecuta una compilación de producción y revisa posibles errores.

## Proyecto base y atribución

Esta aplicación utiliza como base visual y estructural la plantilla **TailAdmin Angular**, adaptada para las necesidades de administración de catálogos de Admin Catálogo.

- Sitio oficial: [https://tailadmin.com/](https://tailadmin.com/)
- Repositorio original de Angular: [https://github.com/TailAdmin/free-angular-tailwind-dashboard](https://github.com/TailAdmin/free-angular-tailwind-dashboard)

Consulta la licencia original de Administración de Catálogos para Florerías y conserva los avisos de atribución aplicables a los componentes y dependencias utilizados.

## Estado del proyecto

Panel administrativo en desarrollo continuo para gestionar los catálogos digitales de Admin Catálogo.

Las funcionalidades disponibles y su configuración definitiva deben verificarse contra la versión publicada en el repositorio.

---

Desarrollado para la administración de catálogos digitales de **Admin Catálogo**. por Juan Carlos Zepeda
