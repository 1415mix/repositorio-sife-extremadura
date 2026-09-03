import fs from "node:fs";
import path from "node:path";

export function loadCatalog(appRoot) {
  const workspaceRoot = path.resolve(appRoot, "..");
  const sourceRoot = path.join(workspaceRoot, "SIFE normativa");
  const basePath = path.join(sourceRoot, "00_indice", "catalogo-fuente.json");
  const expansionPath = path.join(appRoot, "catalog", "informe-maestro-2026-09-03.json");
  const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const expansion = JSON.parse(fs.readFileSync(expansionPath, "utf8"));

  const documents = [
    ...base.documents.map((document) => ({ ...document, ...(expansion.overrides[document.id] ?? {}) })),
    ...expansion.documents.map(expandDocument)
  ];
  const documentIds = new Set(documents.map((document) => document.id));
  if (documentIds.size !== documents.length) throw new Error("La ampliación del informe maestro contiene IDs duplicados.");

  const reportEntries = expansion.report.entries;
  const reportIds = new Set(reportEntries.map((entry) => entry.id));
  if (reportIds.size !== reportEntries.length || reportEntries.length !== expansion.report.referenceCount) {
    throw new Error("El inventario del informe maestro no contiene el número esperado de referencias únicas.");
  }
  const reportByAppId = new Map();
  for (const entry of reportEntries) {
    if (!documentIds.has(entry.appId)) throw new Error(`Referencia del informe sin ficha: ${entry.id} -> ${entry.appId}`);
    reportByAppId.set(entry.appId, entry);
  }

  const enrichedDocuments = documents.map((document) => {
    const reportEntry = reportByAppId.get(document.id);
    return reportEntry ? {
      ...document,
      informeMaestro: {
        id: reportEntry.id,
        confianza: reportEntry.confidence,
        cola: reportEntry.queue,
        origenCorpus: reportEntry.corpusOrigin,
        ...(reportEntry.note ? { nota: reportEntry.note } : {})
      }
    } : document;
  });

  const relations = uniqueRelations([...base.relations, ...expansion.relations]);
  return {
    sourceRoot,
    expansion,
    catalog: {
      ...base,
      checkedAt: expansion.checkedAt,
      closureNote: expansion.closureNote,
      documents: enrichedDocuments,
      relations,
      cautions: [...base.cautions, ...expansion.cautions],
      masterReport: expansion.report,
      compactKnowledgeIds: expansion.compactKnowledgeIds
    }
  };
}

function expandDocument(document) {
  return {
    curso: null,
    prioridad: "Contextual",
    materias: [],
    relacionSIFE: document.resumenTecnico,
    aspectosClave: [],
    articulosApartadosRelevantes: [],
    modificacionesPosteriores: [],
    normativaRelacionada: [],
    ...document
  };
}

function uniqueRelations(relations) {
  const seen = new Set();
  return relations.filter((relation) => {
    const key = `${relation.source}|${relation.tipo}|${relation.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
