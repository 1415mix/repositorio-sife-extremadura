# Repositorio SIFE Extremadura

PWA de consulta jurídico-operativa sobre el Servicio de Innovación, Formación del Profesorado y Emprendimiento (SIFE). La aplicación se genera desde un corpus canónico externo a la web para mantener sincronizadas las fichas, los PDF y el paquete Knowledge.

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

## Principios editoriales

- BOE, DOE y Junta son las fuentes jurídicas primarias.
- El portal SIFE y RFP son fuentes operativas.
- Curso, vigencia y fecha de comprobación son visibles.
- Las relaciones se declaran manualmente; no se infieren por coincidencia textual.
- No se tratan datos personales ni se simulan trámites.

Consulta [MANTENIMIENTO.md](./MANTENIMIENTO.md) y [DESPLIEGUE.md](./DESPLIEGUE.md) antes de publicar.
