import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..");
const sourceRoot = path.join(workspaceRoot, "SIFE normativa");
const sourceFile = path.join(sourceRoot, "00_indice", "catalogo-fuente.json");
const publicRoot = path.join(appRoot, "public");
const repositoryTarget = path.join(publicRoot, "repository", "SIFE normativa");
const dataTarget = path.join(publicRoot, "data", "repository.json");

const raw = fs.readFileSync(sourceFile, "utf8");
const source = JSON.parse(raw);
validateSource(source);

if (!repositoryTarget.startsWith(path.join(appRoot, "public", "repository"))) {
  throw new Error("Destino de repositorio público no seguro.");
}
fs.rmSync(repositoryTarget, { recursive: true, force: true });
fs.mkdirSync(repositoryTarget, { recursive: true });
fs.mkdirSync(path.dirname(dataTarget), { recursive: true });

const documents = source.documents.map((document) => {
  let archivoServido;
  let sha256;
  let fuenteLocal;
  if (document.archivoOrigen) {
    const sourcePath = path.join(sourceRoot, document.archivoOrigen);
    if (!sourcePath.startsWith(sourceRoot + path.sep) || !fs.existsSync(sourcePath)) {
      throw new Error(`Archivo fuente ausente o fuera del repositorio: ${document.archivoOrigen}`);
    }
    const targetPath = path.join(repositoryTarget, document.archivoOrigen);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    const bytes = fs.readFileSync(sourcePath);
    sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    fuenteLocal = `SIFE normativa/${document.archivoOrigen}`;
    archivoServido = `/repository/${encodePath(fuenteLocal)}`;
  }

  const { archivoOrigen: _archivoOrigen, ...clean } = document;
  return {
    ...clean,
    verificadoEn: source.checkedAt,
    ...(fuenteLocal ? { fuenteLocal } : {}),
    ...(archivoServido ? { archivoServido } : {}),
    ...(sha256 ? { sha256 } : {}),
    textoIndexable: normalize([
      document.titulo,
      document.bloque,
      document.tipo,
      document.curso,
      document.organoEmisor,
      document.estado,
      document.ambito,
      document.prioridad,
      document.materias.join(" "),
      document.naturaleza,
      document.relacionSIFE,
      document.resumenTecnico,
      document.aspectosClave.join(" "),
      document.articulosApartadosRelevantes.join(" "),
      document.modificacionesPosteriores.join(" ")
    ].filter(Boolean).join(" "))
  };
});

const versionMaterial = JSON.stringify({ source, hashes: documents.map(({ id, sha256 }) => [id, sha256 ?? null]) });
const catalogVersion = crypto.createHash("sha256").update(versionMaterial).digest("hex").slice(0, 12);
const payload = {
  generatedAt: `${source.checkedAt}T00:00:00+02:00`,
  checkedAt: source.checkedAt,
  closureNote: source.closureNote,
  catalogVersion,
  officialPortal: source.officialPortal,
  assistant: { status: "knowledge_prepared", url: null },
  documents,
  procedures: source.procedures,
  cautions: source.cautions,
  relations: source.relations,
  sourceManifest: documents.map((document) => ({
    id: document.id,
    tipoFuente: document.tipoFuente,
    fuenteOficial: document.fuenteOficial,
    verificadoEn: document.verificadoEn,
    ...(document.sha256 ? { sha256: document.sha256 } : {}),
    ...(document.archivoServido ? { archivoServido: document.archivoServido } : {})
  }))
};

fs.writeFileSync(dataTarget, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`SIFE: ${documents.length} fichas, ${payload.relations.length} relaciones y ${payload.procedures.length} procedimientos. Versión ${catalogVersion}.`);

function validateSource(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.checkedAt)) throw new Error("checkedAt no válido.");
  const ids = new Set();
  for (const document of value.documents) {
    if (!document.id || ids.has(document.id)) throw new Error(`ID ausente o duplicado: ${document.id}`);
    ids.add(document.id);
    if (!/^https:\/\//.test(document.fuenteOficial)) throw new Error(`Fuente no HTTPS: ${document.id}`);
    for (const field of ["titulo", "bloque", "tipo", "estado", "prioridad", "naturaleza", "resumenTecnico", "tipoFuente"]) {
      if (!document[field]) throw new Error(`Campo ${field} ausente en ${document.id}`);
    }
  }
  for (const relation of value.relations) {
    if (!ids.has(relation.source) || !ids.has(relation.target)) {
      throw new Error(`Relación huérfana: ${relation.source} -> ${relation.target}`);
    }
  }
  const procedureIds = new Set();
  for (const procedure of value.procedures) {
    if (!procedure.id || procedureIds.has(procedure.id)) throw new Error(`Procedimiento duplicado: ${procedure.id}`);
    procedureIds.add(procedure.id);
    if (!procedure.steps?.length || !procedure.documents?.length) throw new Error(`Procedimiento incompleto: ${procedure.id}`);
  }
}

function encodePath(relativePath) {
  return relativePath.split(path.sep).map(encodeURIComponent).join("/");
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
