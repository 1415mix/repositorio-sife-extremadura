import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog } from "./catalog-loader.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const { sourceRoot, expansion } = loadCatalog(appRoot);
const results = [];

for (const item of expansion.downloads) {
  const target = safeSourcePath(item.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const bytes = item.copyFrom
    ? fs.readFileSync(safeSourcePath(item.copyFrom))
    : Buffer.from(await downloadPdf(item.downloadUrl));
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error(`La fuente no es un PDF: ${item.id}`);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  let status = "descargado";
  if (fs.existsSync(target)) {
    const current = crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
    if (current !== sha256) throw new Error(`La fuente remota cambió y requiere revisión manual: ${item.id}`);
    status = "sin cambios";
  } else {
    fs.writeFileSync(target, bytes);
  }
  results.push({ id: item.id, file: item.file, source: item.downloadUrl ?? item.copyFrom, bytes: bytes.length, sha256, status });
  console.log(`${item.id}: ${status} (${bytes.length} bytes)`);
}

const manifestPath = safeSourcePath("07_informe_maestro/10_Metadatos_y_registro_de_cambios/MANIFIESTO_DESCARGAS.json");
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify({ generatedAt: expansion.checkedAt, reportSha256: expansion.report.sha256, files: results }, null, 2)}\n`);
console.log(`Manifiesto: ${manifestPath}`);

async function downloadPdf(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "SIFE-Normativa/1.0 (archivo documental público)" },
        signal: AbortSignal.timeout(90_000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw new Error(`No se pudo descargar ${url} tras 3 intentos`, { cause: lastError });
}

function safeSourcePath(relativePath) {
  const target = path.resolve(sourceRoot, relativePath);
  if (!target.startsWith(sourceRoot + path.sep)) throw new Error(`Ruta fuera del corpus: ${relativePath}`);
  return target;
}
