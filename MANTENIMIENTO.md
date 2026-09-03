# Mantenimiento del catálogo

## Flujo obligatorio

1. **Investigar.** Revisar DOE, BOE, Junta y portal SIFE. Buscar publicación nueva, modificación, corrección, resolución y cierre de plazo.
2. **Admitir.** Confirmar autoridad, URL directa, naturaleza y ausencia de datos personales. Una noticia solo puede quedar como contexto operativo.
3. **Actualizar.** Editar `../SIFE normativa/00_indice/catalogo-fuente.json` y añadir el PDF público en su bloque cuando proceda. No sustituir un archivo anterior sin dejar trazabilidad del cambio.
4. **Relacionar.** Añadir solo relaciones expresas de tipo `fundamenta`, `regula`, `desarrolla`, `modifica`, `aprueba`, `convoca`, `sustituye` o `ejecuta`.
5. **Regenerar.** Ejecutar `npm run build`. La salida debe ser determinista mientras no cambie la fuente.
6. **Validar.** Ejecutar `npm run check:links` y `npm run test:e2e`. Revisar manualmente Decreto 69/2007, Plan Regional, registro, reconocimiento, CPR y complemento.
7. **Versionar.** Comprobar `git diff`, documentar el cambio y crear un commit descriptivo.
8. **Publicar.** Subir el repositorio y desplegar Cloudflare Pages con `npm run build:web` y directorio `dist`.
9. **Comprobar producción.** Abrir la URL con un parámetro de cache-busting, comparar versión y recuentos, probar búsquedas, PDF y navegación sin conexión.
10. **Actualizar GPT por separado.** Volver a cargar manualmente el paquete Knowledge. El despliegue web no modifica el GPT.

## Cierre temporal

Antes de cada versión debe buscarse expresamente el Plan Regional del curso nuevo. Si no existe evidencia, se mantiene un vacío declarado y nunca se extrapola el plan anterior.

## Privacidad

No incorporar historiales RFP, credenciales, expedientes, solicitudes cumplimentadas, certificados personales, datos Rayuela ni documentación de terceros.

