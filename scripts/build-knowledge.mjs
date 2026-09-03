import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "./catalog-loader.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..");
const knowledgeRoot = path.join(workspaceRoot, "SIFE normativa - Knowledge GPT");
const compactRoot = path.join(workspaceRoot, "SIFE normativa - Knowledge GPT 20 archivos");
const { sourceRoot, catalog } = loadCatalog(appRoot);

for (const dir of [knowledgeRoot, compactRoot]) fs.mkdirSync(dir, { recursive: true });
for (const name of fs.readdirSync(knowledgeRoot)) {
  if (name.toLowerCase().endsWith(".pdf") || name === "MANIFIESTO.json" || name === "10_CATALOGO_INFORME_MAESTRO.md") fs.rmSync(path.join(knowledgeRoot, name));
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

const textFiles = fs.readdirSync(knowledgeRoot).filter((name) => /^0\d_.*\.md$/i.test(name)).sort();
const allTextFiles = [...textFiles, reportIndexName];
if (allTextFiles.length !== 11) throw new Error(`Se esperaban 11 Markdown Knowledge y hay ${allTextFiles.length}.`);
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
  note: "La carga en el GPT es manual. Verificar cada nueva versión antes de sustituir el Knowledge online.",
  pdfSources: pdfEntries
};
const fullManifest = { ...sharedManifest, packageType: "completo", fileCount: textEntries.length + pdfEntries.length + 1, textSources: textEntries };
const compactManifest = { ...sharedManifest, packageType: "compacto", fileCount: compactPdfEntries.length + 2, pdfSources: compactPdfEntries, textSources: [{ name: compactTextName, sha256: compactTextHash }], derivedFrom: allTextFiles };
fs.writeFileSync(path.join(knowledgeRoot, "MANIFIESTO.json"), `${JSON.stringify(fullManifest, null, 2)}\n`);
fs.writeFileSync(path.join(compactRoot, "MANIFIESTO.json"), `${JSON.stringify(compactManifest, null, 2)}\n`);
const compactCount = fs.readdirSync(compactRoot).length;
if (compactCount > 20) throw new Error(`El paquete compacto tiene ${compactCount} archivos; máximo 20.`);
console.log(`Knowledge completo: ${allTextFiles.length + pdfEntries.length + 1} archivos. Compacto: ${compactCount} archivos.`);
