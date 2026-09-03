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
    const relative = decodeURIComponent(document.archivoServido).replace(/^\/+/, "");
    const local = path.resolve(root, "public", relative);
    const publicRoot = path.resolve(root, "public") + path.sep;
    if (!local.startsWith(publicRoot)) throw new Error(`Ruta pública fuera de destino: ${document.id}`);
    if (!fs.existsSync(local)) throw new Error(`Archivo público ausente: ${document.id}`);
    if (!/^[a-f0-9]{64}$/.test(document.sha256 ?? "")) throw new Error(`SHA-256 ausente: ${document.id}`);
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
console.log(`Validación correcta: ${data.documents.length} documentos, ${data.procedures.length} procedimientos, ${data.relations.length} relaciones.`);

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
