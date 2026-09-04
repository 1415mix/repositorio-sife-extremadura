import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "public", "data", "repository.json");
if (!fs.existsSync(file)) throw new Error('Falta public/data/repository.json; ejecuta "npm run build:data".');
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const ids = new Set(data.documents.map((document) => document.id));
if (ids.size !== data.documents.length) throw new Error("Hay IDs documentales duplicados.");
if (data.masterReport.references !== 47 || data.masterReport.integrated !== 47) throw new Error("Cobertura incompleta del informe maestro.");
const reportDocuments = data.documents.filter((document) => document.informeMaestro);
const reportIds = new Set(reportDocuments.map((document) => document.informeMaestro.id));
if (reportDocuments.length !== 47 || reportIds.size !== 47) throw new Error("Las referencias del informe maestro no son 47 fichas únicas.");
const reportPreserved = reportDocuments.filter((document) => document.archivoServido).length;
if (reportPreserved !== data.masterReport.preserved || data.masterReport.linkOnly !== 47 - reportPreserved) throw new Error("El resumen de preservación del informe no coincide con las fichas.");
if (data.library.report.references !== 37 || data.library.resources.length !== 37) throw new Error("Cobertura incompleta del informe de recursos internacionales.");
if (data.library.report.sha256 !== "90f8823451c7d19ff1f6cf11e5330cfce199ff996d88fc8d69ccb0157b3930a1") throw new Error("Huella del informe de recursos internacionales no válida.");
const libraryIds = new Set(data.library.resources.map((resource) => resource.id));
if (libraryIds.size !== 37) throw new Error("Hay IDs duplicados en la Biblioteca.");
const libraryThemes = new Set(data.library.themes.map((theme) => theme.id));
const libraryGroups = new Set(data.library.groups.map((group) => group.id));
const libraryAuthorities = new Set(data.library.authorityLevels.map((level) => level.id));
let libraryFiles = 0;
let libraryPreservedResources = 0;
for (const resource of data.library.resources) {
  if (!libraryGroups.has(resource.grupo) || !libraryAuthorities.has(resource.nivelAutoridad)) throw new Error(`Clasificación de Biblioteca inválida: ${resource.id}`);
  if (!resource.temas?.length || resource.temas.some((theme) => !libraryThemes.has(theme))) throw new Error(`Temas de Biblioteca inválidos: ${resource.id}`);
  if (!resource.resumen || !resource.relevanciaSife || !resource.cautela || !resource.textoIndexable) throw new Error(`Ficha de Biblioteca incompleta: ${resource.id}`);
  if (!/^https:\/\//.test(resource.fuenteOficial) || !resource.verificadoEn) throw new Error(`Trazabilidad de Biblioteca incompleta: ${resource.id}`);
  if (resource.archivosServidos.length) libraryPreservedResources += 1;
  for (const preserved of resource.archivosServidos) {
    libraryFiles += 1;
    validatePublicFile(preserved.archivoServido, preserved.sha256, `Biblioteca ${resource.id}`);
  }
}
if (libraryFiles !== 23 || data.library.report.preservedFiles !== libraryFiles) throw new Error("La Biblioteca debe preservar sus 23 documentos verificados.");
if (data.library.report.preservedResources !== libraryPreservedResources || data.library.report.linkOnly !== 37 - libraryPreservedResources) throw new Error("El resumen de preservación de la Biblioteca no coincide con las fichas.");
for (const required of ["decreto-69-2007", "plan-regional-2025-2026", "orden-31-10-2000", "registro-rfp", "red-cpr", "complemento-formacion"]) {
  if (!ids.has(required)) throw new Error(`Falta documento crítico: ${required}`);
}
for (const relation of data.relations) {
  if (!ids.has(relation.source) || !ids.has(relation.target)) throw new Error(`Relación huérfana: ${relation.source} -> ${relation.target}`);
  const allowed = new Set(["fundamenta", "regula", "desarrolla", "modifica", "aprueba", "convoca", "sustituye", "ejecuta"]);
  if (!allowed.has(relation.tipo)) throw new Error(`Tipo de relación no admitido: ${relation.tipo}`);
}
const procedureIds = new Set(data.procedures.map((procedure) => procedure.id));
for (const required of ["buscar-actividad", "consultar-historial", "reconocer-actividad", "complemento-sexenio", "formacion-centros", "estancia-fp", "innovacion-educativa", "contactar-cpr"]) {
  if (!procedureIds.has(required)) throw new Error(`Falta procedimiento crítico: ${required}`);
}
for (const document of data.documents) {
  if (!document.tipoFuente || !document.verificadoEn) throw new Error(`Trazabilidad incompleta: ${document.id}`);
  if ((document.bloque === "convocatorias_temporales" || document.id === "plan-regional-2025-2026") && !document.curso) throw new Error(`Curso ausente en referencia temporal: ${document.id}`);
  if (document.informeMaestro && (!document.informeMaestro.confianza || !document.informeMaestro.cola || !document.informeMaestro.origenCorpus)) throw new Error(`Metadatos del informe incompletos: ${document.id}`);
  if (document.archivoServido) {
    validatePublicFile(document.archivoServido, document.sha256, document.id);
  }
}
const serialized = JSON.stringify(data);
const forbidden = ["g-6a47fc9b094081919953f51f2286b94a", "siad-logo", "atencion-diversidad"];
for (const token of forbidden) if (serialized.toLowerCase().includes(token)) throw new Error(`Resto SIAD detectado: ${token}`);
if (data.assistant.status !== "knowledge_prepared" || data.assistant.url !== null) throw new Error("Estado del asistente no válido.");
if (!process.argv.includes("--web")) {
  validateKnowledge(path.resolve(root, "..", "SIFE normativa - Knowledge GPT"));
  validateKnowledge(path.resolve(root, "..", "SIFE normativa - Knowledge GPT 20 archivos"));
}
console.log(`Validación correcta: ${data.documents.length} documentos normativos, ${data.library.resources.length} recursos de Biblioteca, ${data.procedures.length} procedimientos, ${data.relations.length} relaciones.`);

function validatePublicFile(servedPath, expectedHash, label) {
  const relative = decodeURIComponent(servedPath).replace(/^\/+/, "");
  const local = path.resolve(root, "public", relative);
  const publicRoot = path.resolve(root, "public") + path.sep;
  if (!local.startsWith(publicRoot)) throw new Error(`Ruta pública fuera de destino: ${label}`);
  if (!fs.existsSync(local)) throw new Error(`Archivo público ausente: ${label}`);
  if (!/^[a-f0-9]{64}$/.test(expectedHash ?? "")) throw new Error(`SHA-256 ausente: ${label}`);
  const actualHash = crypto.createHash("sha256").update(fs.readFileSync(local)).digest("hex");
  if (actualHash !== expectedHash) throw new Error(`SHA-256 no coincide: ${label}`);
}

function validateKnowledge(directory) {
  const manifestPath = path.join(directory, "MANIFIESTO.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`Falta manifiesto Knowledge en ${directory}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const fileCount = fs.readdirSync(directory).filter((name) => !name.startsWith(".")).length;
  if (manifest.fileCount !== fileCount) throw new Error(`Recuento Knowledge incoherente en ${directory}`);
  for (const entry of [...manifest.textSources, ...manifest.pdfSources]) {
    const filePath = path.join(directory, entry.name);
    if (!fs.existsSync(filePath)) throw new Error(`Archivo Knowledge ausente: ${entry.name}`);
    const actual = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
    if (actual !== entry.sha256) throw new Error(`Hash Knowledge incorrecto: ${entry.name}`);
  }
}
