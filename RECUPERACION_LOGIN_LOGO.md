RECUPERACIÓN DE LOGIN + LOGO

Esta versión parte del ZIP original catalogadmin_V1.zip, que conserva la configuración Firebase original.
Se conservaron las reglas y el flujo de login del proyecto base.
Cambios de código limitados a:
- profile.component.ts: al guardar el perfil general, sincroniza nombre y logoUrl con tenants/{tenantId}.
- tenant-context.service.ts: método updateTenantBranding para refrescar la marca en memoria.

IMPORTANTE: No reemplaza las reglas publicadas en Firebase.
Usa esta carpeta como proyecto completo separado.
