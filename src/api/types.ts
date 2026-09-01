/**
 * Modelos de dominio. Fuente unica de verdad (CLAUDE.md, seccion 5).
 * Si un tipo cambia, cambia aqui y se propaga. No dupliqueis definiciones.
 *
 * Toda coordenada de este archivo esta en EPSG:5367 (CR05 / CRTM05), en metros.
 */

/* ------------------------------------------------------------------ */
/* Geometria compartida                                                */
/* ------------------------------------------------------------------ */

/** Envolvente en EPSG:5367, en metros. */
export interface ExtensionGeografica {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/* ------------------------------------------------------------------ */
/* Copa                                                                */
/* ------------------------------------------------------------------ */

export type OrigenCopa = "automatico" | "manual" | "corregido";

export interface Copa {
  id: string;
  proyectoId: string;
  geometria: GeoJSON.Polygon; // coordenadas en EPSG:5367
  confianza: number | null; // null cuando origen !== "automatico"
  areaM2: number;
  diametroM: number;
  centroide: [number, number];
  origen: OrigenCopa;
  /**
   * Borrado logico (seccion 5). El registro se conserva marcado para que la
   * exportacion pueda reportar cuantas detecciones se descartaron.
   */
  eliminada: boolean;
}

/** Area de interes del levantamiento. Denominador de la densidad de RF-18. */
export interface AreaInteres {
  id: string;
  proyectoId: string;
  geometria: GeoJSON.Polygon;
  areaHa: number;
}

/* ------------------------------------------------------------------ */
/* Proyecto                                                            */
/* ------------------------------------------------------------------ */

export type EstadoProyecto =
  | "sin_ortomosaico"
  | "ortomosaico_cargado"
  | "procesando"
  | "completado"
  | "error_georreferencia";

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  /** Sitio del levantamiento, p. ej. "Lote Norte, Nicoya, Guanacaste". */
  sitio: string;
  creadoEn: string; // ISO 8601
  actualizadoEn: string; // ISO 8601
  estado: EstadoProyecto;
  ortomosaicoId: string | null;
  /** null mientras no se haya ejecutado la deteccion. */
  totalCopas: number | null;
  /** Miniatura para la lista de proyectos. */
  urlMiniatura: string | null;
}

export interface NuevoProyecto {
  nombre: string;
  descripcion: string;
  sitio: string;
}

/* ------------------------------------------------------------------ */
/* Ortomosaico                                                         */
/* ------------------------------------------------------------------ */

export type ResultadoValidacion = "valido" | "advertencia" | "invalido";

/** Validacion simulada de formato, CRS y resolucion (RF-03 a RF-05). */
export interface ValidacionOrtomosaico {
  formato: ResultadoValidacion;
  crs: ResultadoValidacion;
  resolucion: ResultadoValidacion;
  mensajes: string[];
}

/**
 * Metadatos del vuelo, leidos del EXIF y el XMP de los fotogramas originales.
 * Es lo que permite auditar la georreferenciacion sin abrir los archivos.
 */
export interface MetadatosVuelo {
  camara: string;
  distanciaFocalMm: number;
  /** Altura sobre el terreno, en metros. */
  alturaVueloM: number;
  latitud: number;
  longitud: number;
  gsdCmPorPixel: number;
  /** Huella en el suelo de un fotograma: [ancho, alto] en metros. */
  huellaM: [number, number];
  /** Fotograma de muestra del vuelo. */
  urlFotograma: string;
  urlMiniatura: string;
}

export interface Ortomosaico {
  id: string;
  proyectoId: string;
  nombreArchivo: string;
  tamanoBytes: number;
  formato: "GeoTIFF" | "COG";
  /** Codigo EPSG declarado en el archivo, p. ej. "EPSG:5367". */
  crs: string;
  resolucionCmPorPixel: number;
  extension: ExtensionGeografica;
  /** URL del COG servido con soporte de rangos HTTP. */
  urlCog: string;
  validacion: ValidacionOrtomosaico;
  vuelo: MetadatosVuelo | null;
  subidoEn: string; // ISO 8601
}

/* ------------------------------------------------------------------ */
/* Trabajo de inferencia                                               */
/* ------------------------------------------------------------------ */

export type EstadoTrabajo =
  | "en_cola"
  | "ejecutando"
  | "completado"
  | "fallido"
  | "cancelado";

export type NivelBitacora = "info" | "advertencia" | "error";

export interface EntradaBitacora {
  momento: string; // ISO 8601
  nivel: NivelBitacora;
  mensaje: string;
}

export interface TrabajoInferencia {
  id: string;
  proyectoId: string;
  ortomosaicoId: string;
  estado: EstadoTrabajo;
  /** Porcentaje de avance, 0 a 100. */
  progreso: number;
  /** Etapa legible, p. ej. "Teselando el ortomosaico". */
  etapa: string;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  copasDetectadas: number | null;
  bitacora: EntradaBitacora[];
}

/* ------------------------------------------------------------------ */
/* Errores                                                             */
/* ------------------------------------------------------------------ */

/** Cuerpo de error que devuelve el back end (real y simulado). */
export interface RespuestaError {
  mensaje: string;
  detalle: string | null;
}
