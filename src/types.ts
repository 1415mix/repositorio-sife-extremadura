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

export type LibraryFile = {
  label: string;
  language: string;
  fuenteLocal: string;
  archivoServido: string;
  sha256: string;
};

export type LibraryResource = {
  id: string;
  titulo: string;
  grupo: string;
  nivelAutoridad: string;
  emisor: string;
  fecha: string;
  naturaleza: string;
  temas: string[];
  prioridad: string;
  transferibilidad: string;
  resumen: string;
  relevanciaSife: string;
  cautela: string;
  fuenteOficial: string;
  restriccionAutomatizada?: boolean;
  archivosServidos: LibraryFile[];
  verificadoEn: string;
  textoIndexable: string;
};

export type LibraryData = {
  report: {
    title: string;
    fileName: string;
    sha256: string;
    cutoff: string;
    analyzedAt: string;
    references: number;
    preservedResources: number;
    linkOnly: number;
    preservedFiles: number;
    note: string;
  };
  themes: Array<{ id: string; label: string }>;
  groups: Array<{ id: string; label: string }>;
  authorityLevels: Array<{ id: string; label: string; rule: string }>;
  resources: LibraryResource[];
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
  library: LibraryData;
  documents: DocumentRecord[];
  procedures: ProcedureRecord[];
  cautions: Array<{ title: string; type: string; body: string }>;
  relations: RelationRecord[];
};

export type SectionId = "inicio" | "repositorio" | "biblioteca" | "asistente" | "procedimientos" | "relaciones" | "cautelas";
