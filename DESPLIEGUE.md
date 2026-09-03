# Publicación

## GitHub

Repositorio: https://github.com/1415mix/repositorio-sife-extremadura

La carpeta tiene historial Git propio. No se debe copiar `.git` ni ramas del proyecto SIAD.

## Cloudflare Pages

- URL de producción: https://repositorio-sife-extremadura.pages.dev/
- Nombre: `repositorio-sife-extremadura`
- Comando de compilación: `pnpm run build:web`
- Directorio de salida: `dist`
- Versión de Node recomendada: 22

La primera compilación completa (`pnpm run build`) debe realizarse antes de enviar cambios para que `public/data/repository.json` y las copias documentales estén versionadas. En Cloudflare se usa `build:web` porque el corpus canónico y los paquetes Knowledge viven fuera de la raíz del repositorio web.

## Verificación posterior

1. Abrir `https://repositorio-sife-extremadura.pages.dev/?v=<commit>`.
2. Confirmar versión del catálogo, 59 fichas, 46 PDF, 14 procedimientos, 46 relaciones y las 47 referencias del Informe maestro.
3. Buscar `Decreto 69/2007`, `Plan Regional`, `registro`, `reconocimiento`, `CPR` y `complemento`.
4. Abrir una fuente oficial y una copia PDF preservada.
5. Recargar sin red una página ya visitada y comprobar el catálogo cacheado.
6. Verificar móvil, teclado y foco visible.

No anunciar el despliegue como publicado hasta que estos pasos hayan sido comprobados sobre producción.

## Estado verificado

Ampliación del Informe maestro comprobada en producción el 4 de septiembre de 2026. La interfaz móvil y de escritorio, `repository.json`, el manifest, el service worker y cuatro copias PDF —incluidas DigCompEdu y la referencia de Galicia— respondieron correctamente. El catálogo remoto coincidió con el SHA-256 local y declaró 59 fichas, 46 PDF, 14 procedimientos, 46 relaciones y 47/47 referencias del informe. El Knowledge del GPT continúa siendo una carga manual separada.

### Cautela sobre el disparador Git

El proyecto conserva GitHub como fuente y tiene activados los despliegues de producción para `main`. Durante la primera publicación, el webhook no reaccionó al `push`; los dos primeros builds se iniciaron mediante el API oficial de Pages tomando el `HEAD` limpio de `main`. Si un futuro `push` no genera un despliegue, hay que revisar que la aplicación **Cloudflare Pages** tenga acceso al repositorio nuevo en la configuración de aplicaciones instaladas de GitHub y, hasta entonces, iniciar el build desde Pages sin subir `dist` manualmente.
