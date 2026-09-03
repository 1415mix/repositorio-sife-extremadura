export type DocumentRecord = {
  id: string;
  titulo: string;
  bloque: string;
  tipo: string;
  fecha: string;
  curso?: string | null;
  organoEmisor: string;
  estado: string;
  ambito: string;
  prioridad: string;
  materias: string[];
  naturaleza: string;
  relacionSIFE: string;
  resumenTecnico: string;
  aspectosClave: string[];
  articulosApartadosRelevantes: string[];
  modificacionesPosteriores: string[];
  normativaRelacionada: string[];
  tipoFuente: string;
  fuenteOficial: string;
  verificadoEn: string;
  fuenteLocal?: string;
  archivoServido?: string;
  sha256?: string;
  informeMaestro?: {
    id: string;
    confianza: string;
    cola: string;
    origenCorpus: string;
    nota?: string;
  };
  textoIndexable: string;
};

export type MasterReportSummary = {
  title: string;
  fileName: string;
  sha256: string;
  cutoff: string;
  analyzedAt: string;
  references: number;
  integrated: number;
  preserved: number;
  linkOnly: number;
  supplemental: number;
  discrepancies: Array<{ id: string; title: string; note: string }>;
};

export type ProcedureRecord = {
  id: string;
  title: string;
  categoria: string;
  materias: string[];
  summary: string;
  steps: string[];
  caution: string;
  documents: Array<{ label: string; url: string }>;
};

export type RelationRecord = {
  source: string;
  target: string;
  tipo: "fundamenta" | "regula" | "desarrolla" | "modifica" | "aprueba" | "convoca" | "sustituye" | "ejecuta";
};

export type RepositoryData = {
  generatedAt: string;
  checkedAt: string;
  closureNote: string;
  catalogVersion: string;
  officialPortal: string;
  assistant: { status: "knowledge_prepared"; url: string | null };
  masterReport: MasterReportSummary;
  documents: DocumentRecord[];
  procedures: ProcedureRecord[];
  cautions: Array<{ title: string; type: string; body: string }>;
  relations: RelationRecord[];
};

export type SectionId = "inicio" | "repositorio" | "asistente" | "procedimientos" | "relaciones" | "cautelas";
