# Mantenimiento del catálogo

## Flujo obligatorio

1. **Investigar.** Revisar DOE, BOE, Junta y portal SIFE. Buscar publicación nueva, modificación, corrección, resolución y cierre de plazo.
2. **Admitir.** Confirmar autoridad, URL directa, naturaleza y ausencia de datos personales. Una noticia solo puede quedar como contexto operativo.
3. **Actualizar.** Editar `../SIFE normativa/00_indice/catalogo-fuente.json` para el catálogo base o `catalog/informe-maestro-2026-09-03.json` para la colección auditada. Añadir el PDF público en su bloque cuando proceda. No sustituir un archivo anterior sin dejar trazabilidad del cambio.
4. **Relacionar.** Añadir solo relaciones expresas de tipo `fundamenta`, `regula`, `desarrolla`, `modifica`, `aprueba`, `convoca`, `sustituye` o `ejecuta`.
5. **Descargar.** Si cambia la colección del informe, ejecutar `pnpm run import:master-report`. Un cambio de hash detiene la importación y debe investigarse antes de admitirlo.
6. **Regenerar.** Ejecutar `pnpm run build`. La salida debe ser determinista mientras no cambie la fuente.
7. **Validar.** Ejecutar `pnpm run check:links` y `pnpm run test:e2e`. Revisar manualmente Decreto 69/2007, Plan Regional, registro, reconocimiento, CPR, complemento y el filtro de 47 referencias del informe.
8. **Versionar.** Comprobar `git diff`, documentar el cambio y crear un commit descriptivo.
9. **Publicar.** Subir el repositorio y desplegar Cloudflare Pages con `pnpm run build:web` y directorio `dist`.
10. **Comprobar producción.** Abrir la URL con un parámetro de cache-busting, comparar versión y recuentos, probar búsquedas, PDF y navegación sin conexión.
11. **Actualizar GPT por separado.** Volver a cargar manualmente el paquete Knowledge. El despliegue web no modifica el GPT.

## Manifiestos

- Descargas: `../SIFE normativa/07_informe_maestro/10_Metadatos_y_registro_de_cambios/MANIFIESTO_DESCARGAS.json`.
- Aplicación: `public/data/repository.json`, con manifiesto de fuente por ficha.
- Knowledge completo y compacto: `MANIFIESTO.json` dentro de cada paquete.

## Cierre temporal

Antes de cada versión debe buscarse expresamente el Plan Regional del curso nuevo. Si no existe evidencia, se mantiene un vacío declarado y nunca se extrapola el plan anterior.

## Privacidad

No incorporar historiales RFP, credenciales, expedientes, solicitudes cumplimentadas, certificados personales, datos Rayuela ni documentación de terceros.
