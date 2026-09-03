# Repositorio SIFE Extremadura

PWA de consulta jurídico-operativa sobre el Servicio de Innovación, Formación del Profesorado y Emprendimiento (SIFE). La aplicación se genera desde un corpus canónico externo a la web para mantener sincronizadas las fichas, los PDF y el paquete Knowledge.

Web pública: https://repositorio-sife-extremadura.pages.dev/

## Desarrollo

Requiere Node.js 20 o posterior.

```bash
pnpm install
pnpm run build:data
pnpm run dev
```

## Validación y compilación

```bash
pnpm run build
pnpm run check:links
pnpm run test:e2e
```

`pnpm run build` regenera los dos paquetes Knowledge, copia únicamente los PDF admitidos, calcula las huellas SHA-256, valida el catálogo y compila la PWA.

## Informe maestro SIFE

La ampliación con corte de 3 de septiembre de 2026 integra las 47 referencias de `Informe_maestro_catalogo_documental_SIFE.docx`: 38 cuentan con PDF oficial preservado y 9 permanecen como enlaces contextuales. Se añaden además dos fichas de control para resolver la discordancia AP-10 y la corrección del Decreto 112/2026.

El catálogo se compone de la fuente base externa y de [`catalog/informe-maestro-2026-09-03.json`](./catalog/informe-maestro-2026-09-03.json). Para reproducir o comprobar las descargas oficiales:

```bash
pnpm run import:master-report
pnpm run build
```

El importador no sobrescribe un archivo si su contenido remoto cambia: exige revisión manual. Consulta [`ANALISIS_INFORME_MAESTRO.md`](./ANALISIS_INFORME_MAESTRO.md) para las correcciones de contraste.

## Principios editoriales

- BOE, DOE y Junta son las fuentes jurídicas primarias.
- El portal SIFE y RFP son fuentes operativas.
- Curso, vigencia y fecha de comprobación son visibles.
- La confianza del informe es trazabilidad documental y no equivale a vigencia jurídica.
- Las relaciones se declaran manualmente; no se infieren por coincidencia textual.
- No se tratan datos personales ni se simulan trámites.

Consulta [MANTENIMIENTO.md](./MANTENIMIENTO.md) y [DESPLIEGUE.md](./DESPLIEGUE.md) antes de publicar.
