# Análisis del informe de recursos internacionales SIFE

## Alcance y procedencia

Se ha analizado íntegramente `../INVESTIGACIONES/Informe_recursos_internacionales_SIFE.docx`, con corte documental de 3 de septiembre de 2026 y SHA-256 `90f8823451c7d19ff1f6cf11e5330cfce199ff996d88fc8d69ccb0157b3930a1`.

El resultado es una Biblioteca separada del repositorio normativo: 37 referencias con ficha, agrupadas en cinco colecciones, nueve temas y cinco niveles de autoridad. Cada ficha registra emisor, fecha, naturaleza, prioridad, transferibilidad, resumen, relevancia para SIFE, cautela, fuente oficial y documentos preservados.

## Criterio jurídico-editorial

La Biblioteca no amplía automáticamente el Derecho aplicable al SIFE:

- **Norma vinculante o tratado:** exige comprobar ámbito, parte, calendario y relación con el Derecho español.
- **Soft law:** orienta principios y reformas, pero no crea por sí solo obligaciones autonómicas.
- **Marco técnico:** requiere adaptación, pilotaje, validación y control de versiones.
- **Evidencia comparada:** permite formular hipótesis e indicadores; no prueba por sí sola causalidad o transferibilidad.
- **Modelo nacional:** sirve para comparar alternativas, no para trasplantar literalmente otra arquitectura institucional.

## Preservación documental

Se sirven 23 PDF oficiales en 19 fichas: 22 se descargan mediante `pnpm run import:library` y DigCompEdu reutiliza la copia oficial ya admitida en el corpus. Las 18 fichas restantes enlazan la fuente oficial o un servicio vivo.

No se fabrican PDF cuando el recurso es una plataforma, una red o una página mantenida en línea. Tampoco se sustituye una fuente oficial que limita la descarga automatizada por una copia de terceros no controlada. Estas circunstancias aparecen en la propia ficha.

El manifiesto de descargas se guarda en `../SIFE normativa/08_biblioteca_internacional/10_metadatos/MANIFIESTO_DESCARGAS.json` con URL, tamaño y SHA-256. El generador vuelve a calcular la huella al copiar cada archivo a la web y al paquete Knowledge.

## Temas de consulta

1. Formación y desarrollo profesional.
2. Innovación y transferencia.
3. Competencia digital e inteligencia artificial.
4. Redes y apoyo territorial.
5. Inclusión y equidad.
6. Liderazgo, inducción y bienestar.
7. Reconocimiento y microcredenciales.
8. Evaluación e impacto.
9. Gobernanza y planificación.

El catálogo reproducible está en [`catalog/biblioteca-internacional-2026-09-03.json`](./catalog/biblioteca-internacional-2026-09-03.json).
