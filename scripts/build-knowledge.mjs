import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..");
const sourceRoot = path.join(workspaceRoot, "SIFE normativa");
const knowledgeRoot = path.join(workspaceRoot, "SIFE normativa - Knowledge GPT");
const compactRoot = path.join(workspaceRoot, "SIFE normativa - Knowledge GPT 20 archivos");
const catalog = JSON.parse(fs.readFileSync(path.join(sourceRoot, "00_indice", "catalogo-fuente.json"), "utf8"));

for (const dir of [knowledgeRoot, compactRoot]) fs.mkdirSync(dir, { recursive: true });
for (const name of fs.readdirSync(knowledgeRoot)) {
  if (name.toLowerCase().endsWith(".pdf") || name === "MANIFIESTO.json") fs.rmSync(path.join(knowledgeRoot, name));
}
for (const name of fs.readdirSync(compactRoot)) fs.rmSync(path.join(compactRoot, name), { recursive: true, force: true });

const textFiles = fs.readdirSync(knowledgeRoot).filter((name) => /^0\d_.*\.md$/i.test(name)).sort();
if (textFiles.length !== 10) throw new Error(`Se esperaban 10 Markdown Knowledge y hay ${textFiles.length}.`);
const textEntries = textFiles.map((name) => {
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
  fs.copyFileSync(sourcePath, path.join(compactRoot, name));
  return { id: document.id, name, sha256, fuenteOficial: document.fuenteOficial };
});

const merged = textFiles.map((name) => `\n\n---\n\n# Fuente interna: ${name}\n\n${fs.readFileSync(path.join(knowledgeRoot, name), "utf8").trim()}`).join("");
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
const compactManifest = { ...sharedManifest, packageType: "compacto", fileCount: pdfEntries.length + 2, textSources: [{ name: compactTextName, sha256: compactTextHash }], derivedFrom: textFiles };
fs.writeFileSync(path.join(knowledgeRoot, "MANIFIESTO.json"), `${JSON.stringify(fullManifest, null, 2)}\n`);
fs.writeFileSync(path.join(compactRoot, "MANIFIESTO.json"), `${JSON.stringify(compactManifest, null, 2)}\n`);
const compactCount = fs.readdirSync(compactRoot).length;
if (compactCount > 20) throw new Error(`El paquete compacto tiene ${compactCount} archivos; máximo 20.`);
console.log(`Knowledge completo: ${textFiles.length + pdfEntries.length + 1} archivos. Compacto: ${compactCount} archivos.`);
