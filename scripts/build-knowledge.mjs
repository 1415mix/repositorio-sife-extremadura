import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "./catalog-loader.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..");
const knowledgeRoot = path.join(workspaceRoot, "SIFE normativa - Knowledge GPT");
const compactRoot = path.join(workspaceRoot, "SIFE normativa - Knowledge GPT 20 archivos");
const { sourceRoot, catalog, library } = loadCatalog(appRoot);

for (const dir of [knowledgeRoot, compactRoot]) fs.mkdirSync(dir, { recursive: true });
for (const name of fs.readdirSync(knowledgeRoot)) {
  if (name.toLowerCase().endsWith(".pdf") || name === "MANIFIESTO.json" || name === "10_CATALOGO_INFORME_MAESTRO.md" || name === "11_BIBLIOTECA_INTERNACIONAL.md") fs.rmSync(path.join(knowledgeRoot, name));
}
for (const name of fs.readdirSync(compactRoot)) fs.rmSync(path.join(compactRoot, name), { recursive: true, force: true });

const reportIndexName = "10_CATALOGO_INFORME_MAESTRO.md";
const reportRows = catalog.documents.map((document) => {
  const reportId = document.informeMaestro?.id ?? "Complementario";
  const preservation = document.archivoOrigen ? "PDF preservado" : "Enlace oficial";
  return `- **${reportId} — ${document.titulo}** (${document.estado}; ${preservation}). Fuente: ${document.fuenteOficial}`;
}).join("\n");
const discrepancyRows = catalog.masterReport.discrepancies.map((item) => `- **${item.title}:** ${item.body}`).join("\n");
const reportIndex = `# Catálogo auditado del Informe maestro SIFE\n\nCorte documental del informe: ${catalog.masterReport.cutoff}. Análisis e incorporación: ${catalog.masterReport.analyzedAt}. Se incorporan sus ${catalog.masterReport.entries.length} referencias, conservando como enlace las fuentes sin PDF oficial descargable. La confianza documental no equivale a vigencia jurídica.\n\n## Correcciones y cautelas de la auditoría\n\n${discrepancyRows}\n\n## Fichas del catálogo\n\n${reportRows}\n`;
fs.writeFileSync(path.join(knowledgeRoot, reportIndexName), reportIndex);

const libraryIndexName = "11_BIBLIOTECA_INTERNACIONAL.md";
const themeById = new Map(library.themes.map((theme) => [theme.id, theme.label]));
const groupById = new Map(library.groups.map((group) => [group.id, group.label]));
const authorityById = new Map(library.authorityLevels.map((level) => [level.id, level]));
const libraryRows = library.resources.map((resource) => {
  const authority = authorityById.get(resource.nivelAutoridad);
  const files = resource.archivos?.length
    ? resource.archivos.map((file) => `  - Documento preservado: ${file.label} (${file.language}).`).join("\n")
    : "  - Sin copia local: consultar la fuente oficial o el servicio vivo.";
  return `## ${resource.id} — ${resource.titulo}\n\n- **Colección:** ${groupById.get(resource.grupo)}\n- **Emisor y fecha:** ${resource.emisor}; ${resource.fecha}\n- **Naturaleza / autoridad:** ${resource.naturaleza}; ${authority?.label}\n- **Prioridad / transferibilidad:** ${resource.prioridad}; ${resource.transferibilidad}\n- **Temas:** ${resource.temas.map((id) => themeById.get(id)).join("; ")}\n- **Resumen:** ${resource.resumen}\n- **Relevancia SIFE:** ${resource.relevanciaSife}\n- **Cautela:** ${resource.cautela}\n- **Criterio de lectura:** ${authority?.rule}\n- **Fuente oficial:** ${resource.fuenteOficial}\n${files}`;
}).join("\n\n");
const libraryIndex = `# Biblioteca internacional SIFE\n\nFuente de selección: **${library.report.title}**. Corte: ${library.report.cutoff}; análisis: ${library.report.analyzedAt}; ${library.resources.length} referencias. Esta colección sirve para orientación, evidencia y comparación. No convierte el soft law, los marcos técnicos, la evidencia comparada o los modelos nacionales en normativa autonómica aplicable.\n\n## Niveles de autoridad\n\n${library.authorityLevels.map((level) => `- **${level.label}:** ${level.rule}`).join("\n")}\n\n${libraryRows}\n`;
fs.writeFileSync(path.join(knowledgeRoot, libraryIndexName), libraryIndex);

const textFiles = fs.readdirSync(knowledgeRoot).filter((name) => /^0\d_.*\.md$/i.test(name)).sort();
const allTextFiles = [...textFiles, reportIndexName, libraryIndexName];
if (allTextFiles.length !== 12) throw new Error(`Se esperaban 12 Markdown Knowledge y hay ${allTextFiles.length}.`);
const textEntries = allTextFiles.map((name) => {
  const bytes = fs.readFileSync(path.join(knowledgeRoot, name));
  return { name, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
});

const pdfEntries = catalog.documents.filter((document) => document.archivoOrigen).map((document, index) => {
  const sourcePath = path.join(sourceRoot, document.archivoOrigen);
  if (!fs.existsSync(sourcePath)) throw new Error(`Falta ${document.archivoOrigen}`);
  const name = `${String(index + 10).padStart(2, "0")}_${path.basename(document.archivoOrigen)}`;
  const bytes = fs.readFileSync(sourcePath);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  fs.copyFileSync(sourcePath, path.join(knowledgeRoot, name));
  return { id: document.id, name, sha256, fuenteOficial: document.fuenteOficial };
});

const libraryPdfEntries = library.resources.flatMap((resource) => (resource.archivos ?? []).map((file, fileIndex) => {
  const sourcePath = path.join(sourceRoot, file.file);
  if (!fs.existsSync(sourcePath)) throw new Error(`Falta el recurso de Biblioteca ${file.file}; ejecuta npm run import:library.`);
  const bytes = fs.readFileSync(sourcePath);
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error(`El recurso de Biblioteca no es PDF: ${file.file}`);
  const suffix = resource.archivos.length > 1 ? `_${fileIndex + 1}` : "";
  const name = `LIB_${resource.id.replace(/-/g, "_")}${suffix}_${path.basename(file.file)}`;
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  fs.copyFileSync(sourcePath, path.join(knowledgeRoot, name));
  return { id: resource.id, name, sha256, fuenteOficial: resource.fuenteOficial, collection: "biblioteca_internacional" };
}));

const compactIds = new Set(catalog.compactKnowledgeIds);
const compactPdfEntries = pdfEntries.filter((entry) => compactIds.has(entry.id));
if (compactPdfEntries.length !== compactIds.size) throw new Error("La selección Knowledge compacta contiene IDs sin PDF preservado.");
for (const entry of compactPdfEntries) {
  fs.copyFileSync(path.join(knowledgeRoot, entry.name), path.join(compactRoot, entry.name));
}

const merged = allTextFiles.map((name) => `\n\n---\n\n# Fuente interna: ${name}\n\n${fs.readFileSync(path.join(knowledgeRoot, name), "utf8").trim()}`).join("");
const compactText = `# SIFE Normativa Extremadura — base textual consolidada\n\nPaquete preparado el ${catalog.checkedAt}. Contiene instrucciones, índice de vigencia, resúmenes y procedimientos. Las normas y convocatorias prioritarias se mantienen como PDF independientes.${merged}\n`;
const compactTextName = "00_BASE_TEXTUAL_SIFE_KNOWLEDGE.md";
fs.writeFileSync(path.join(compactRoot, compactTextName), compactText);
const compactTextHash = crypto.createHash("sha256").update(compactText).digest("hex");

const sharedManifest = {
  generatedAt: catalog.checkedAt,
  note: "La carga en el GPT es manual. Verificar cada nueva versión antes de sustituir el Knowledge online. La Biblioteca internacional es orientación y comparación, no normativa SIFE aplicable."
};
const fullPdfEntries = [...pdfEntries, ...libraryPdfEntries];
const fullManifest = { ...sharedManifest, packageType: "completo", fileCount: textEntries.length + fullPdfEntries.length + 1, textSources: textEntries, pdfSources: fullPdfEntries, librarySources: libraryPdfEntries };
const compactManifest = { ...sharedManifest, packageType: "compacto", fileCount: compactPdfEntries.length + 2, pdfSources: compactPdfEntries, textSources: [{ name: compactTextName, sha256: compactTextHash }], derivedFrom: allTextFiles };
fs.writeFileSync(path.join(knowledgeRoot, "MANIFIESTO.json"), `${JSON.stringify(fullManifest, null, 2)}\n`);
fs.writeFileSync(path.join(compactRoot, "MANIFIESTO.json"), `${JSON.stringify(compactManifest, null, 2)}\n`);
const compactCount = fs.readdirSync(compactRoot).length;
if (compactCount > 20) throw new Error(`El paquete compacto tiene ${compactCount} archivos; máximo 20.`);
console.log(`Knowledge completo: ${allTextFiles.length + fullPdfEntries.length + 1} archivos (${libraryPdfEntries.length} PDF de Biblioteca). Compacto: ${compactCount} archivos.`);
