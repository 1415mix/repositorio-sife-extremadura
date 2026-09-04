import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..");
const sourceRoot = path.join(workspaceRoot, "SIFE normativa");
const reportPath = path.join(workspaceRoot, "INVESTIGACIONES", "Informe_recursos_internacionales_SIFE.docx");
const catalogPath = path.join(appRoot, "catalog", "biblioteca-internacional-2026-09-03.json");
const manifestPath = path.join(sourceRoot, "08_biblioteca_internacional", "10_metadatos", "MANIFIESTO_DESCARGAS.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

if (!fs.existsSync(reportPath)) throw new Error(`No se encuentra el informe: ${reportPath}`);
const reportHash = sha256(fs.readFileSync(reportPath));
if (reportHash !== catalog.report.sha256) {
  throw new Error(`El informe analizado no coincide con el catálogo (${reportHash}).`);
}
validateCatalog(catalog);

const entries = [];
for (const download of catalog.downloads) {
  const target = resolveInside(sourceRoot, download.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  let bytes;
  let downloaded = false;
  if (fs.existsSync(target)) {
    bytes = fs.readFileSync(target);
    if (!isPdf(bytes)) bytes = undefined;
  }
  if (!bytes) {
    bytes = await downloadPdf(download);
    fs.writeFileSync(target, bytes);
    downloaded = true;
  }
  entries.push({
    id: download.id,
    file: download.file,
    downloadUrl: download.downloadUrl,
    sha256: sha256(bytes),
    bytes: bytes.length,
    action: downloaded ? "descargado" : "conservado"
  });
  console.log(`${download.id}: ${downloaded ? "descargado" : "ya disponible"} (${formatBytes(bytes.length)})`);
}

const manifest = {
  generatedAt: catalog.checkedAt,
  report: {
    fileName: catalog.report.fileName,
    sha256: reportHash,
    cutoff: catalog.report.cutoff,
    references: catalog.resources.length
  },
  note: "Solo se preservan archivos públicos obtenidos de fuentes oficiales. Los servicios vivos y las fuentes con restricciones de descarga permanecen enlazados en sus fichas.",
  files: entries
};
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Biblioteca importada: ${catalog.resources.length} fichas, ${entries.length} descargas verificadas. Manifiesto: ${manifestPath}`);

async function downloadPdf(download) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(download.downloadUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": "SIFE-Normativa/1.0 (+catalogo-documental; contacto institucional)",
          ...(download.headers ?? {})
        },
        signal: AbortSignal.timeout(120_000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!isPdf(bytes)) {
        const contentType = response.headers.get("content-type") ?? "desconocido";
        throw new Error(`respuesta no PDF (${contentType})`);
      }
      return bytes;
    } catch (error) {
      lastError = error;
      console.warn(`${download.id}: intento ${attempt}/3 fallido: ${error.message}`);
    }
  }
  throw new Error(`No se pudo descargar ${download.id} desde ${download.downloadUrl}: ${lastError?.message}`);
}

function validateCatalog(value) {
  if (value.report.referenceCount !== 37 || value.resources.length !== 37) throw new Error("El catálogo debe contener 37 referencias.");
  const ids = new Set();
  const themes = new Set(value.themes.map((theme) => theme.id));
  const groups = new Set(value.groups.map((group) => group.id));
  const authorities = new Set(value.authorityLevels.map((level) => level.id));
  const referencedFiles = new Set();
  for (const resource of value.resources) {
    if (!resource.id || ids.has(resource.id)) throw new Error(`ID duplicado o ausente: ${resource.id}`);
    ids.add(resource.id);
    if (!groups.has(resource.grupo)) throw new Error(`Colección desconocida en ${resource.id}`);
    if (!authorities.has(resource.nivelAutoridad)) throw new Error(`Autoridad desconocida en ${resource.id}`);
    if (!resource.temas?.length || resource.temas.some((id) => !themes.has(id))) throw new Error(`Temas no válidos en ${resource.id}`);
    if (!/^https:\/\//.test(resource.fuenteOficial)) throw new Error(`Fuente no HTTPS en ${resource.id}`);
    for (const file of resource.archivos ?? []) referencedFiles.add(file.file);
  }
  const downloadFiles = new Set();
  for (const download of value.downloads) {
    if (!referencedFiles.has(download.file)) throw new Error(`Descarga no vinculada a una ficha: ${download.file}`);
    if (downloadFiles.has(download.file)) throw new Error(`Descarga duplicada: ${download.file}`);
    downloadFiles.add(download.file);
  }
}

function resolveInside(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error(`Ruta fuera del repositorio: ${relative}`);
  return target;
}

function isPdf(bytes) {
  return bytes?.subarray(0, 5).toString("ascii") === "%PDF-";
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function formatBytes(value) {
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
