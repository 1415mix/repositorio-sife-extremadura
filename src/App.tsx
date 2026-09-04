import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Boxes,
  CalendarClock,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  Grid2X2,
  Home,
  Info,
  LayoutList,
  Library,
  Link2,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import type { DocumentRecord, LibraryResource, ProcedureRecord, RelationRecord, RepositoryData, SectionId } from "./types";

const sections: Array<{ id: SectionId; label: string; shortLabel: string; icon: typeof Home; showInMenu?: boolean }> = [
  { id: "inicio", label: "Inicio", shortLabel: "Inicio", icon: Home },
  { id: "repositorio", label: "Repositorio", shortLabel: "Repositorio", icon: BookOpen },
  { id: "asistente", label: "GPT SIFE Normativa", shortLabel: "GPT SIFE", icon: Sparkles, showInMenu: false },
  { id: "procedimientos", label: "Procedimientos", shortLabel: "Trámites", icon: FileCheck2 },
  { id: "relaciones", label: "Relaciones", shortLabel: "Relaciones", icon: Network },
  { id: "biblioteca", label: "Biblioteca", shortLabel: "Biblioteca", icon: Library },
  { id: "cautelas", label: "Vigencia y cautelas", shortLabel: "Vigencia", icon: ShieldCheck }
];

const blockLabels: Record<string, string> = {
  marco_general: "Marco general",
  sistema_formacion: "Sistema de formación",
  organizacion_cpr: "Organización SIFE y CPR",
  planificacion: "Planificación",
  modalidades_formativas: "Modalidades formativas",
  registro_reconocimiento: "Registro y reconocimiento",
  innovacion_programas: "Innovación y programas",
  ayudas_estancias_convenios: "Ayudas, estancias y convenios",
  convocatorias_temporales: "Convocatorias temporales",
  guias_modelos: "Guías y modelos",
  comparacion_marcos: "Comparación y marcos internacionales"
};

type StateKind = "current" | "temporary" | "historical" | "reference";

function App() {
  const [data, setData] = useState<RepositoryData | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState<SectionId>(() => sectionFromHash());
  const [repositoryQuery, setRepositoryQuery] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/data/repository.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<RepositoryData>;
      })
      .then(setData)
      .catch(() => setError("No se pudo cargar el catálogo. Comprueba la conexión o vuelve a intentarlo."));
  }, []);

  useEffect(() => {
    const onHashChange = () => setActive(sectionFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        globalSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const navigate = (section: SectionId) => {
    setActive(section);
    window.history.pushState(null, "", `#${section}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => mainRef.current?.focus());
  };

  const searchRepository = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRepositoryQuery(globalQuery.trim());
    navigate("repositorio");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); navigate("inicio"); }} aria-label="SIFE Normativa, ir al inicio">
          <img src="/brand/sife-logo.png" width="360" height="61" alt="Servicio de Innovación, Formación del Profesorado y Emprendimiento" />
        </a>
        <form className="global-search" role="search" onSubmit={searchRepository}>
          <Search size={19} aria-hidden="true" />
          <label className="visually-hidden" htmlFor="global-search">Buscar normativa</label>
          <input ref={globalSearchRef} id="global-search" value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Buscar normativa SIFE…" />
          <kbd aria-hidden="true">⌘ K</kbd>
          <button type="submit">Buscar</button>
        </form>
        <a className="topbar-status" href="https://formacion.educarex.es/" target="_blank" rel="noreferrer" title={data ? `Catálogo ${data.catalogVersion}` : "Cargando catálogo"}>
          <span className="status-dot" aria-hidden="true" />
          <span>{data ? `Verificado ${formatDate(data.checkedAt)}` : "Cargando"}</span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </header>

      <aside className="sidebar">
        <p className="sidebar-label">Menú principal</p>
        <SectionLinks active={active} navigate={navigate} />
        <div className="sidebar-source">
          <ShieldCheck size={23} aria-hidden="true" />
          <p>Fuentes oficiales</p>
          <strong>BOE · DOE · Junta</strong>
          <span>{data ? `Comprobado el ${formatDate(data.checkedAt)}` : "Cargando catálogo…"}</span>
        </div>
      </aside>

      <div className="page-region">
        <main id="contenido" tabIndex={-1} ref={mainRef}>
          {error && <LoadError message={error} />}
          {!error && !data && <Loading />}
          {data && active === "inicio" && <HomeSection data={data} navigate={navigate} />}
          {data && active === "repositorio" && <RepositorySection data={data} query={repositoryQuery} setQuery={setRepositoryQuery} />}
          {data && active === "biblioteca" && <LibrarySection data={data} />}
          {data && active === "asistente" && <AssistantSection data={data} navigate={navigate} />}
          {data && active === "procedimientos" && <ProceduresSection procedures={data.procedures} />}
          {data && active === "relaciones" && <RelationsSection data={data} />}
          {data && active === "cautelas" && <CautionsSection data={data} />}
        </main>

        <footer>
          <p>Herramienta independiente de consulta. No sustituye al BOE, DOE, la sede electrónica ni al órgano gestor.</p>
          <a href="https://formacion.educarex.es/" target="_blank" rel="noreferrer">Portal oficial SIFE <ExternalLink size={14} aria-hidden="true" /></a>
        </footer>
      </div>

      <nav className="mobile-nav" aria-label="Secciones principales">
        <SectionLinks active={active} navigate={navigate} />
      </nav>
    </div>
  );
}

function SectionLinks({ active, navigate }: { active: SectionId; navigate: (id: SectionId) => void }) {
  return <>{sections.filter((section) => section.showInMenu !== false).map((section) => {
    const Icon = section.icon;
    return (
      <a
        key={section.id}
        href={`#${section.id}`}
        className={active === section.id ? "active" : ""}
        aria-label={section.label}
        aria-current={active === section.id ? "page" : undefined}
        onClick={(event) => { event.preventDefault(); navigate(section.id); }}
      >
        <Icon size={20} aria-hidden="true" />
        <span className="nav-label" aria-hidden="true">{section.label}</span>
        <span className="mobile-label" aria-hidden="true">{section.shortLabel}</span>
      </a>
    );
  })}</>;
}

function HomeSection({ data, navigate }: { data: RepositoryData; navigate: (id: SectionId) => void }) {
  const localDocuments = data.documents.filter((document) => document.archivoServido);
  const currentDocuments = data.documents.filter((document) => stateKind(document.estado) === "current");
  const latest = [...data.documents]
    .filter((document) => !["Servicio electrónico", "Portal institucional", "Directorio institucional"].includes(document.tipo))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><GraduationCap size={17} aria-hidden="true" /> Formación permanente e innovación educativa</p>
          <h1>La normativa SIFE, ordenada para poder usarla</h1>
          <p className="hero-lead">Normas, planes, convocatorias y procedimientos de Extremadura con fuente oficial, curso, vigencia y relaciones verificadas.</p>
          <div className="button-row">
            <button className="button primary" onClick={() => navigate("repositorio")}><Search size={18} aria-hidden="true" /> Explorar el repositorio</button>
            <a className="button secondary" href="https://rfp.educarex.es/planformacion" target="_blank" rel="noreferrer">Buscar actividades <ExternalLink size={17} aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="verification-card" aria-label="Criterio de verificación">
          <ShieldCheck size={29} aria-hidden="true" />
          <p className="overline">Cierre documental</p>
          <strong>{formatDate(data.checkedAt)}</strong>
          <p>{data.closureNote}</p>
        </aside>
      </section>

      <section className="stats" aria-label="Cifras del repositorio">
        <Stat value={data.documents.length} label="fichas trazables" />
        <Stat value={localDocuments.length + data.library.report.preservedFiles} label="PDF preservados" />
        <Stat value={data.library.resources.length} label="recursos internacionales" />
        <Stat value={data.procedures.length} label="procedimientos" />
      </section>

      <section className="quick-access" aria-labelledby="accesos-title">
        <div className="section-heading">
          <div><p className="overline">Servicios reales</p><h2 id="accesos-title">Accesos operativos</h2></div>
        </div>
        <div className="access-grid">
          <AccessCard icon={<Search />} title="Oferta formativa" body="Busca actividades por CPR, modalidad, fechas o temática." href="https://rfp.educarex.es/planformacion" />
          <AccessCard icon={<FileCheck2 />} title="Historial RFP" body="Consulta el historial personal en el servicio oficial." href="https://rfp.educarex.es/" />
          <AccessCard icon={<Boxes />} title="Red de CPR" body="Localiza el centro de profesores y recursos de referencia." href="https://formacion.educarex.es/cprsite/" />
          <button className="access-card" onClick={() => navigate("biblioteca")}><span className="access-icon"><Library /></span><span><strong>Biblioteca internacional</strong><small>Explora marcos, evidencias y modelos comparables.</small></span><ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </section>

      <section aria-labelledby="novedades-title">
        <div className="section-heading">
          <div><p className="overline">Catálogo curado</p><h2 id="novedades-title">Incorporaciones recientes</h2></div>
          <span className="count-label">{currentDocuments.length} referencias vigentes o activas</span>
        </div>
        <div className="document-grid compact-grid">
          {latest.map((document) => <DocumentSummary key={document.id} document={document} />)}
        </div>
      </section>

      <section className="callout temporal-callout">
        <CalendarClock aria-hidden="true" />
        <div><h2>Plan Regional 2026/2027 pendiente de publicación localizada</h2><p>El último plan localizado es 2025/2026 y su vigencia temporal ha finalizado. El repositorio no lo extrapola al nuevo curso.</p></div>
        <button className="text-button" onClick={() => navigate("cautelas")}>Ver cautelas <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
    </>
  );
}

function LibrarySection({ data }: { data: RepositoryData }) {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("all");
  const [group, setGroup] = useState("all");
  const [authority, setAuthority] = useState("all");
  const [priority, setPriority] = useState("all");
  const [selected, setSelected] = useState<LibraryResource | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const priorities = useMemo(() => unique(data.library.resources.map((resource) => resource.prioridad)), [data.library.resources]);
  const themes = useMemo(() => new Map(data.library.themes.map((item) => [item.id, item.label])), [data.library.themes]);
  const groups = useMemo(() => new Map(data.library.groups.map((item) => [item.id, item.label])), [data.library.groups]);
  const authorities = useMemo(() => new Map(data.library.authorityLevels.map((item) => [item.id, item])), [data.library.authorityLevels]);
  const filtered = useMemo(() => data.library.resources.filter((resource) => {
    const normalizedQuery = normalize(query);
    return (!normalizedQuery || resource.textoIndexable.includes(normalizedQuery))
      && (theme === "all" || resource.temas.includes(theme))
      && (group === "all" || resource.grupo === group)
      && (authority === "all" || resource.nivelAutoridad === authority)
      && (priority === "all" || resource.prioridad === priority);
  }), [data.library.resources, query, theme, group, authority, priority]);
  const hasFilters = Boolean(query || theme !== "all" || group !== "all" || authority !== "all" || priority !== "all");
  const clear = () => { setQuery(""); setTheme("all"); setGroup("all"); setAuthority("all"); setPriority("all"); };
  const openDetail = (resource: LibraryResource) => {
    setSelected(resource);
    requestAnimationFrame(() => detailRef.current?.focus());
  };

  return (
    <section aria-labelledby="library-title">
      <PageHeading eyebrow="Evidencia, marcos y comparación" title="Biblioteca internacional" description="Recursos seleccionados para modernizar la formación, la innovación y el apoyo al profesorado, con lectura crítica y transferencia al contexto SIFE." />
      <aside className="library-report-panel" aria-label="Cobertura del informe de recursos internacionales">
        <div>
          <p className="overline">Informe analizado · corte {formatDate(data.library.report.cutoff)}</p>
          <h2>{data.library.report.references} recursos con ficha funcional</h2>
          <p>{data.library.report.preservedFiles} documentos oficiales preservados en {data.library.report.preservedResources} fichas; {data.library.report.linkOnly} recursos se mantienen como enlace a la fuente o servicio vivo.</p>
        </div>
        <div className="library-boundary"><Info size={20} aria-hidden="true" /><p><strong>Biblioteca de orientación.</strong> Estos recursos no amplían por sí mismos la normativa SIFE aplicable.</p></div>
      </aside>

      <div className="filter-panel library-filters">
        <label className="search-field"><span>Buscar en la biblioteca</span><div><Search size={19} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: IA, inclusión, microcredenciales, evaluación…" /></div></label>
        <div className="filter-row library-filter-row">
          <SelectFilter label="Tema" value={theme} onChange={setTheme} options={data.library.themes.map((item) => ({ value: item.id, label: item.label }))} />
          <SelectFilter label="Colección" value={group} onChange={setGroup} options={data.library.groups.map((item) => ({ value: item.id, label: item.label }))} />
          <SelectFilter label="Autoridad" value={authority} onChange={setAuthority} options={data.library.authorityLevels.map((item) => ({ value: item.id, label: item.label }))} />
          <SelectFilter label="Prioridad" value={priority} onChange={setPriority} options={priorities.map((value) => ({ value, label: value }))} />
          {hasFilters && <button className="clear-button" onClick={clear}><X size={16} aria-hidden="true" /> Limpiar</button>}
        </div>
      </div>

      <div className="results-bar" aria-live="polite"><p><strong>{filtered.length}</strong> {filtered.length === 1 ? "recurso" : "recursos"}</p></div>
      {filtered.length ? (
        <div className="library-grid">
          {filtered.map((resource) => (
            <LibraryCard key={resource.id} resource={resource} themes={themes} groupLabel={groups.get(resource.grupo) ?? resource.grupo} authorityLabel={authorities.get(resource.nivelAutoridad)?.label ?? resource.nivelAutoridad} onOpen={() => openDetail(resource)} />
          ))}
        </div>
      ) : (
        <div className="empty-state"><CircleHelp aria-hidden="true" /><h2>No hay coincidencias</h2><p>Prueba con otro tema, colección o término de búsqueda.</p><button className="button secondary" onClick={clear}>Limpiar filtros</button></div>
      )}
      {selected && <LibraryDetail resource={selected} themes={themes} groupLabel={groups.get(selected.grupo) ?? selected.grupo} authority={authorities.get(selected.nivelAutoridad)} onClose={() => setSelected(null)} detailRef={detailRef} />}
    </section>
  );
}

function LibraryCard({ resource, themes, groupLabel, authorityLabel, onOpen }: { resource: LibraryResource; themes: Map<string, string>; groupLabel: string; authorityLabel: string; onOpen: () => void }) {
  return (
    <article className="library-card">
      <div className="card-top"><span className={`priority-badge ${normalize(resource.prioridad)}`}>{resource.prioridad}</span><span className="report-id">{resource.id}</span></div>
      <p className="document-type">{groupLabel}</p>
      <h2>{resource.titulo}</h2>
      <p className="library-meta">{resource.emisor} · {resource.fecha}</p>
      <p>{resource.resumen}</p>
      <div className="tag-row">{resource.temas.slice(0, 3).map((id) => <span key={id}>{themes.get(id) ?? id}</span>)}</div>
      <div className="library-card-footer"><span>{authorityLabel}</span>{resource.archivosServidos.length > 0 && <span><Download size={14} aria-hidden="true" /> {resource.archivosServidos.length} {resource.archivosServidos.length === 1 ? "archivo" : "archivos"}</span>}</div>
      <button className="card-link" onClick={onOpen}>Ver ficha completa <ArrowRight size={16} aria-hidden="true" /></button>
    </article>
  );
}

function LibraryDetail({ resource, themes, groupLabel, authority, onClose, detailRef }: { resource: LibraryResource; themes: Map<string, string>; groupLabel: string; authority?: { id: string; label: string; rule: string }; onClose: () => void; detailRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div className="document-detail library-detail" role="dialog" aria-modal="true" aria-labelledby="library-detail-title" tabIndex={-1} ref={detailRef} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
        <button className="close-button" aria-label="Cerrar ficha de biblioteca" onClick={onClose}><X /></button>
        <div className="card-top"><span className={`priority-badge ${normalize(resource.prioridad)}`}>Prioridad {resource.prioridad}</span><span className="report-id">{resource.id}</span></div>
        <p className="document-type">{groupLabel}</p>
        <h2 id="library-detail-title">{resource.titulo}</h2>
        <p className="detail-summary">{resource.resumen}</p>
        <dl className="metadata">
          <div><dt>Emisor</dt><dd>{resource.emisor}</dd></div>
          <div><dt>Fecha</dt><dd>{resource.fecha}</dd></div>
          <div><dt>Naturaleza</dt><dd>{resource.naturaleza}</dd></div>
          <div><dt>Transferibilidad</dt><dd>{resource.transferibilidad}</dd></div>
          <div><dt>Nivel de autoridad</dt><dd>{authority?.label ?? resource.nivelAutoridad}</dd></div>
          <div><dt>Verificado</dt><dd>{formatDate(resource.verificadoEn)}</dd></div>
        </dl>
        {authority && <div className="notice neutral"><ShieldCheck size={19} aria-hidden="true" /><p><strong>Criterio de lectura:</strong> {authority.rule}</p></div>}
        <h3>Temas</h3><div className="tag-row detail-tags">{resource.temas.map((id) => <span key={id}>{themes.get(id) ?? id}</span>)}</div>
        <h3>Relevancia para SIFE</h3><p>{resource.relevanciaSife}</p>
        <div className="notice warning"><AlertTriangle size={19} aria-hidden="true" /><p><strong>Cautela:</strong> {resource.cautela}</p></div>
        <h3>Consulta y documentos</h3>
        <div className="detail-actions">
          <a className="button primary" href={resource.fuenteOficial} target="_blank" rel="noreferrer">Fuente oficial <ExternalLink size={17} aria-hidden="true" /></a>
          {resource.archivosServidos.map((file) => <a className="button secondary" key={file.archivoServido} href={file.archivoServido} target="_blank" rel="noreferrer">{file.label} <Download size={17} aria-hidden="true" /></a>)}
        </div>
        {resource.archivosServidos.length === 0 && <p className="library-link-note">No se conserva una copia local: la ficha enlaza el servicio vivo o la fuente oficial disponible.</p>}
        {resource.restriccionAutomatizada && <p className="library-link-note">La fuente limitó alguna comprobación o descarga automatizada; utiliza el enlace oficial para la versión más reciente.</p>}
        {resource.archivosServidos.map((file) => <p className="hash" key={file.sha256}><strong>{file.label} · SHA-256</strong><code>{file.sha256}</code></p>)}
      </div>
    </div>
  );
}

function RepositorySection({ data, query, setQuery }: { data: RepositoryData; query: string; setQuery: (value: string) => void }) {
  const [block, setBlock] = useState("all");
  const [status, setStatus] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [collection, setCollection] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(() => unique(data.documents.map((document) => document.bloque)), [data.documents]);
  const sources = useMemo(() => unique(data.documents.map((document) => document.tipoFuente)), [data.documents]);
  const filtered = useMemo(() => data.documents.filter((document) => {
    const normalizedQuery = normalize(query);
    return (!normalizedQuery || document.textoIndexable.includes(normalizedQuery))
      && (block === "all" || document.bloque === block)
      && (status === "all" || stateKind(document.estado) === status)
      && (sourceType === "all" || document.tipoFuente === sourceType)
      && (collection === "all" || (collection === "master" ? Boolean(document.informeMaestro) : !document.informeMaestro));
  }), [data.documents, query, block, status, sourceType, collection]);

  const clear = () => { setQuery(""); setBlock("all"); setStatus("all"); setSourceType("all"); setCollection("all"); };
  const hasFilters = Boolean(query || block !== "all" || status !== "all" || sourceType !== "all" || collection !== "all");
  const openDetail = (document: DocumentRecord) => {
    setSelected(document);
    requestAnimationFrame(() => detailRef.current?.focus());
  };
  const showMasterReport = () => {
    setQuery("");
    setBlock("all");
    setStatus("all");
    setSourceType("all");
    setCollection("master");
  };

  return (
    <section aria-labelledby="repo-title">
      <PageHeading eyebrow="Fuentes públicas verificadas" title="Repositorio documental" description="Busca por materia, órgano, título o contenido. Cada ficha distingue fuente, curso, estado y copia local preservada cuando existe." />
      <aside className="master-report-panel" aria-label="Cobertura del Informe maestro SIFE">
        <div>
          <p className="overline">Colección auditada · corte {formatDate(data.masterReport.cutoff)}</p>
          <h2>Informe maestro SIFE incorporado</h2>
          <p>Sus <strong>{data.masterReport.integrated} referencias</strong> tienen ficha funcional: {data.masterReport.preserved} con PDF oficial preservado y {data.masterReport.linkOnly} como enlace contextual. La confianza documental no equivale a vigencia jurídica.</p>
        </div>
        <button className="button secondary" onClick={showMasterReport}><FileCheck2 size={17} aria-hidden="true" /> Ver las {data.masterReport.references} referencias</button>
      </aside>
      <div className="filter-panel">
        <label className="search-field"><span>Buscar en el catálogo</span><div><Search size={19} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: reconocimiento, CPR, Decreto 69/2007…" /></div></label>
        <div className="filter-row">
          <SelectFilter label="Bloque" value={block} onChange={setBlock} options={blocks.map((value) => ({ value, label: blockLabels[value] ?? value }))} />
          <SelectFilter label="Estado" value={status} onChange={setStatus} options={[{ value: "current", label: "Vigente o activo" }, { value: "temporary", label: "Temporal / comprobar" }, { value: "historical", label: "Finalizado o histórico" }, { value: "reference", label: "Referencia / contexto" }]} />
          <SelectFilter label="Tipo de fuente" value={sourceType} onChange={setSourceType} options={sources.map((value) => ({ value, label: value }))} />
          <SelectFilter label="Colección" value={collection} onChange={setCollection} options={[{ value: "master", label: "Informe maestro" }, { value: "other", label: "Catálogo complementario" }]} />
          {hasFilters && <button className="clear-button" onClick={clear}><X size={16} aria-hidden="true" /> Limpiar</button>}
        </div>
      </div>
      <div className="results-bar" aria-live="polite">
        <p><strong>{filtered.length}</strong> {filtered.length === 1 ? "resultado" : "resultados"}</p>
        <div className="view-toggle" aria-label="Vista del repositorio">
          <button aria-label="Vista de parrilla" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={18} /></button>
          <button aria-label="Vista de lista" aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutList size={19} /></button>
        </div>
      </div>
      {filtered.length ? (
        <div className={view === "grid" ? "document-grid" : "document-list"}>
          {filtered.map((document) => <DocumentCard key={document.id} document={document} onOpen={() => openDetail(document)} />)}
        </div>
      ) : (
        <div className="empty-state"><CircleHelp aria-hidden="true" /><h2>No hay coincidencias</h2><p>Prueba con menos filtros o una búsqueda más general.</p><button className="button secondary" onClick={clear}>Limpiar filtros</button></div>
      )}
      {selected && <DocumentDetail document={selected} onClose={() => setSelected(null)} detailRef={detailRef} />}
    </section>
  );
}

function AssistantSection({ data, navigate }: { data: RepositoryData; navigate: (id: SectionId) => void }) {
  return (
    <section aria-labelledby="assistant-title">
      <PageHeading eyebrow="Asistente documental" title="GPT SIFE Normativa" description="Base Knowledge preparada para crear un GPT separado que responda con trazabilidad y declare los límites del corpus." />
      <div className="assistant-layout">
        <div className="assistant-card">
          <div className="assistant-orb"><Sparkles aria-hidden="true" /></div>
          <span className="pill current"><Check size={14} aria-hidden="true" /> Knowledge preparado</span>
          <h2>Contenido listo para carga manual</h2>
          <p>Incluye instrucciones, índice de vigencia, resúmenes temáticos, procedimientos, manifiesto y los PDF públicos admitidos.</p>
          <div className="notice neutral"><Info size={19} aria-hidden="true" /><p>No existe todavía una URL pública del GPT. Se mostrará un acceso solo cuando sea real y esté verificado.</p></div>
          <button className="button secondary" onClick={() => navigate("repositorio")}><BookOpen size={18} aria-hidden="true" /> Consultar las fuentes</button>
        </div>
        <div className="principles-panel">
          <h2>Cómo debe responder</h2>
          <ul className="check-list">
            <li><Check aria-hidden="true" /> Solo desde fuentes incorporadas</li>
            <li><Check aria-hidden="true" /> Cita título, fecha, órgano y enlace</li>
            <li><Check aria-hidden="true" /> Distingue norma, orientación y convocatoria</li>
            <li><Check aria-hidden="true" /> Señala vigencia, curso y vacíos</li>
            <li><Check aria-hidden="true" /> No accede a RFP, Rayuela ni expedientes</li>
          </ul>
          <div className="package-facts">
            <div><strong>{data.documents.filter((item) => item.archivoServido).length + data.library.report.preservedFiles}</strong><span>PDF en paquete completo</span></div>
            <div><strong>20</strong><span>archivos en variante compacta</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProceduresSection({ procedures }: { procedures: ProcedureRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => unique(procedures.map((procedure) => procedure.categoria)), [procedures]);
  const filtered = procedures.filter((procedure) => {
    const haystack = normalize([procedure.title, procedure.summary, procedure.categoria, ...procedure.materias].join(" "));
    return (!query || haystack.includes(normalize(query))) && (category === "all" || procedure.categoria === category);
  });

  return (
    <section aria-labelledby="procedures-title">
      <PageHeading eyebrow="De la consulta a la actuación" title="Procedimientos prácticos" description="Itinerarios de consulta enlazados con la norma, la convocatoria, el modelo y el trámite oficial disponibles." />
      <div className="procedure-tools">
        <label className="search-field"><span>Buscar procedimiento</span><div><Search size={19} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: sexenio, estancia, innovación…" /></div></label>
        <div className="category-chips" aria-label="Filtrar por categoría">
          <button className={category === "all" ? "active" : ""} aria-pressed={category === "all"} onClick={() => setCategory("all")}>Todos</button>
          {categories.map((value) => <button key={value} className={category === value ? "active" : ""} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}
        </div>
      </div>
      <p className="result-intro" aria-live="polite">{filtered.length} procedimientos</p>
      <div className="procedure-list">
        {filtered.map((procedure) => <ProcedureCard key={procedure.id} procedure={procedure} />)}
      </div>
    </section>
  );
}

function RelationsSection({ data }: { data: RepositoryData }) {
  const [selectedId, setSelectedId] = useState("decreto-69-2007");
  const documentById = useMemo(() => new Map(data.documents.map((document) => [document.id, document])), [data.documents]);
  const related = data.relations.filter((relation) => relation.source === selectedId || relation.target === selectedId);
  const selected = documentById.get(selectedId)!;
  const relationTypes = unique(data.relations.map((relation) => relation.tipo));
  const graphDocuments = data.documents.filter((document) => data.relations.some((relation) => relation.source === document.id || relation.target === document.id));

  return (
    <section aria-labelledby="relations-title">
      <PageHeading eyebrow="Conexiones comprobadas" title="Mapa de relaciones" description="El grafo recoge solo vínculos jurídicos u operativos expresos; no crea relaciones por coincidencias de texto." />
      <div className="legend" aria-label="Tipos de relación">{relationTypes.map((type) => <span key={type}><i className={`relation-dot ${type}`} />{type}</span>)}</div>
      <div className="graph-layout">
        <div className="node-map" aria-label="Nodos del grafo">
          {Object.entries(blockLabels).map(([block, label]) => {
            const nodes = graphDocuments.filter((document) => document.bloque === block);
            if (!nodes.length) return null;
            return <div className="node-cluster" key={block}><h2>{label}</h2><div>{nodes.map((document) => <button key={document.id} className={selectedId === document.id ? "selected" : ""} aria-pressed={selectedId === document.id} onClick={() => setSelectedId(document.id)}>{shortTitle(document.titulo)}</button>)}</div></div>;
          })}
        </div>
        <aside className="relation-detail">
          <p className="overline">Nodo seleccionado</p>
          <h2>{selected.titulo}</h2>
          <p>{selected.resumenTecnico}</p>
          <a href={selected.fuenteOficial} target="_blank" rel="noreferrer">Abrir fuente oficial <ExternalLink size={15} aria-hidden="true" /></a>
          <h3>Relaciones ({related.length})</h3>
          <ul className="relation-list">
            {related.map((relation, index) => <RelationItem key={`${relation.source}-${relation.target}-${index}`} relation={relation} selectedId={selectedId} documents={documentById} onSelect={setSelectedId} />)}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function CautionsSection({ data }: { data: RepositoryData }) {
  const stateCounts = data.documents.reduce<Record<string, number>>((acc, document) => {
    const key = stateKind(document.estado);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <section aria-labelledby="cautions-title">
      <PageHeading eyebrow="Lectura responsable" title="Vigencia y cautelas" description="Las etiquetas evitan confundir el marco estable, los servicios activos y las convocatorias que ya terminaron." />
      <div className="state-grid">
        <StateCard kind="current" value={stateCounts.current ?? 0} title="Vigente o activo" body="Norma vigente, marco aplicable o servicio operativo en la fecha de comprobación." />
        <StateCard kind="temporary" value={stateCounts.temporary ?? 0} title="Temporal o a comprobar" body="Convocatoria o referencia cuyo plazo o efecto exige revisión en la fuente oficial." />
        <StateCard kind="historical" value={stateCounts.historical ?? 0} title="Finalizado o histórico" body="Útil como antecedente, pero no acredita plazo, oferta o requisitos actuales." />
        <StateCard kind="reference" value={stateCounts.reference ?? 0} title="Referencia o contexto" body="Marco comparado, portal u orientación que no constituye normativa SIFE aplicable." />
      </div>
      <div className="caution-list">
        {data.cautions.map((caution) => <article key={caution.title}><AlertTriangle aria-hidden="true" /><div><p className="overline">{caution.type}</p><h2>{caution.title}</h2><p>{caution.body}</p></div></article>)}
      </div>
      <div className="notice strong"><ShieldCheck aria-hidden="true" /><div><h2>Antes de tramitar</h2><p>Comprueba en la publicación oficial el plazo, el curso, las personas destinatarias, los anexos y el canal de presentación. Este repositorio no registra solicitudes ni accede a expedientes.</p></div></div>
    </section>
  );
}

function DocumentCard({ document, onOpen }: { document: DocumentRecord; onOpen: () => void }) {
  const kind = stateKind(document.estado);
  return (
    <article className="document-card">
      <div className="card-top"><span className={`pill ${kind}`}>{stateLabel(kind)}</span>{document.informeMaestro ? <span className="report-id">{document.informeMaestro.id}</span> : document.curso && <span className="course">{document.curso}</span>}</div>
      <p className="document-type">{document.tipo} · {document.tipoFuente}</p>
      <h2>{document.titulo}</h2>
      <p>{document.resumenTecnico}</p>
      <div className="tag-row">{document.materias.slice(0, 3).map((matter) => <span key={matter}>{matter}</span>)}</div>
      <button className="card-link" onClick={onOpen}>Ver ficha trazable <ArrowRight size={16} aria-hidden="true" /></button>
    </article>
  );
}

function DocumentDetail({ document, onClose, detailRef }: { document: DocumentRecord; onClose: () => void; detailRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div className="document-detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1} ref={detailRef} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
        <button className="close-button" aria-label="Cerrar ficha" onClick={onClose}><X /></button>
        <div className="card-top"><span className={`pill ${stateKind(document.estado)}`}>{document.estado}</span>{document.curso && <span className="course">Curso {document.curso}</span>}</div>
        <p className="document-type">{blockLabels[document.bloque] ?? document.bloque}</p>
        <h2 id="detail-title">{document.titulo}</h2>
        <p className="detail-summary">{document.resumenTecnico}</p>
        <dl className="metadata">
          <div><dt>Fecha</dt><dd>{formatDate(document.fecha)}</dd></div>
          <div><dt>Órgano</dt><dd>{document.organoEmisor}</dd></div>
          <div><dt>Fuente</dt><dd>{document.tipoFuente}</dd></div>
          <div><dt>Verificado</dt><dd>{formatDate(document.verificadoEn)}</dd></div>
          {document.informeMaestro && <div><dt>Informe maestro</dt><dd>{document.informeMaestro.id} · cola {document.informeMaestro.cola}</dd></div>}
          {document.informeMaestro && <div><dt>Confianza documental</dt><dd>{document.informeMaestro.confianza} · corpus {document.informeMaestro.origenCorpus}</dd></div>}
        </dl>
        {document.informeMaestro?.nota && <div className="notice audit"><Info size={19} aria-hidden="true" /><p>{document.informeMaestro.nota}</p></div>}
        <h3>Relevancia para SIFE</h3><p>{document.relacionSIFE}</p>
        {document.aspectosClave.length > 0 && <><h3>Aspectos clave</h3><ul>{document.aspectosClave.map((item) => <li key={item}>{item}</li>)}</ul></>}
        {document.articulosApartadosRelevantes.length > 0 && <><h3>Referencias concretas</h3><ul>{document.articulosApartadosRelevantes.map((item) => <li key={item}>{item}</li>)}</ul></>}
        <div className="detail-actions">
          <a className="button primary" href={document.fuenteOficial} target="_blank" rel="noreferrer">Fuente oficial <ExternalLink size={17} aria-hidden="true" /></a>
          {document.archivoServido && <a className="button secondary" href={document.archivoServido} target="_blank" rel="noreferrer">Copia preservada <Download size={17} aria-hidden="true" /></a>}
        </div>
        {document.sha256 && <p className="hash"><strong>SHA-256</strong><code>{document.sha256}</code></p>}
      </div>
    </div>
  );
}

function ProcedureCard({ procedure }: { procedure: ProcedureRecord }) {
  return (
    <details className="procedure-card">
      <summary><div><span>{procedure.categoria}</span><h2>{procedure.title}</h2><p>{procedure.summary}</p></div><ChevronDown className="chevron" aria-hidden="true" /></summary>
      <div className="procedure-body">
        <h3>Pasos</h3>
        <ol>{procedure.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
        <div className="notice warning"><AlertTriangle size={19} aria-hidden="true" /><p>{procedure.caution}</p></div>
        <h3>Documentos y trámites</h3>
        <div className="source-links">{procedure.documents.map((document) => <a href={document.url} key={`${document.label}-${document.url}`} target="_blank" rel="noreferrer"><Link2 size={16} aria-hidden="true" />{document.label}<ExternalLink size={14} aria-hidden="true" /></a>)}</div>
      </div>
    </details>
  );
}

function RelationItem({ relation, selectedId, documents, onSelect }: { relation: RelationRecord; selectedId: string; documents: Map<string, DocumentRecord>; onSelect: (id: string) => void }) {
  const outgoing = relation.source === selectedId;
  const otherId = outgoing ? relation.target : relation.source;
  const other = documents.get(otherId)!;
  return <li><span className={`relation-badge ${relation.tipo}`}>{outgoing ? relation.tipo : `${relation.tipo} a`}</span><button onClick={() => onSelect(otherId)}>{shortTitle(other.titulo)} <ArrowRight size={14} aria-hidden="true" /></button></li>;
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>;
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="select-filter"><span>{label}</span><div><Filter size={16} aria-hidden="true" /><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="all">Todos</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></label>;
}

function DocumentSummary({ document }: { document: DocumentRecord }) {
  return <article className="summary-card"><span className={`pill ${stateKind(document.estado)}`}>{document.curso ?? document.tipo}</span><h3>{document.titulo}</h3><p>{formatDate(document.fecha)} · {document.tipoFuente}</p><a href={document.fuenteOficial} target="_blank" rel="noreferrer" aria-label={`Abrir fuente oficial: ${document.titulo}`}>Fuente oficial <ExternalLink size={14} aria-hidden="true" /></a></article>;
}

function AccessCard({ icon, title, body, href }: { icon: ReactNode; title: string; body: string; href: string }) {
  return <a className="access-card" href={href} target="_blank" rel="noreferrer"><span className="access-icon">{icon}</span><span><strong>{title}</strong><small>{body}</small></span><ExternalLink size={17} aria-hidden="true" /></a>;
}

function Stat({ value, label }: { value: number; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div>; }

function StateCard({ kind, value, title, body }: { kind: string; value: number; title: string; body: string }) { return <article className={`state-card ${kind}`}><strong>{value}</strong><h2>{title}</h2><p>{body}</p></article>; }

function Loading() { return <div className="loading" role="status"><span /><p>Cargando catálogo SIFE…</p></div>; }

function LoadError({ message }: { message: string }) { return <div className="empty-state"><AlertTriangle aria-hidden="true" /><h1>Catálogo no disponible</h1><p>{message}</p><button className="button primary" onClick={() => location.reload()}>Reintentar</button></div>; }

function sectionFromHash(): SectionId {
  const value = location.hash.replace("#", "") as SectionId;
  return sections.some((section) => section.id === value) ? value : "inicio";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }

function unique(values: string[]) { return [...new Set(values)].sort((a, b) => a.localeCompare(b, "es")); }

function stateKind(state: string): StateKind {
  const value = normalize(state);
  if (value.includes("referencia comparada") || value.includes("marco de referencia") || value.includes("portal normativo comparado")) return "reference";
  if (value.includes("finalizada") || value.includes("historica") || value.includes("cerrado") || value.includes("resuelta") || value.includes("derogad")) return "historical";
  if (value.includes("comprobar") || value.includes("temporal")) return "temporary";
  return "current";
}

function stateLabel(kind: StateKind) { return kind === "current" ? "Vigente / activo" : kind === "temporary" ? "Comprobar" : kind === "reference" ? "Referencia / contexto" : "Histórico / finalizado"; }

function shortTitle(title: string) { return title.length > 58 ? `${title.slice(0, 55)}…` : title; }

export default App;
