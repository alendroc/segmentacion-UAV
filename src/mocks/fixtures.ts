/**
 * Carga de los fixtures generados y adaptacion al modelo de dominio.
 *
 * Los archivos se importan como texto (`?raw`) y se parsean aqui, no se
 * importan como modulo: asi el GeoJSON del repositorio es exactamente el mismo
 * archivo que abre QGIS, sin transformaciones de por medio.
 */
import copasRaw from "./fixtures/lote-norte.geojson?raw";
import areaRaw from "./fixtures/lote-norte-area.geojson?raw";
import type {
  AreaInteres,
  Copa,
  ExtensionGeografica,
  OrigenCopa,
  Ortomosaico,
} from "../api/types";

interface FeatureCopa {
  geometry: GeoJSON.Polygon;
  properties: {
    id: string;
    confianza: number;
    areaM2: number;
    diametroM: number;
    centroide: [number, number];
    origen: OrigenCopa;
    eliminada: boolean;
  };
}

interface FeatureArea {
  geometry: GeoJSON.Polygon;
  properties: { id: string; areaHa: number; extension: ExtensionGeografica };
}

interface Coleccion<T> {
  features: T[];
}

/** Proyecto al que pertenece el levantamiento simulado. */
export const PROYECTO_CON_DATOS = "pr-001";

const coleccionCopas = JSON.parse(copasRaw) as Coleccion<FeatureCopa>;
const coleccionArea = JSON.parse(areaRaw) as Coleccion<FeatureArea>;

export const COPAS: Copa[] = coleccionCopas.features.map((feature) => ({
  id: feature.properties.id,
  proyectoId: PROYECTO_CON_DATOS,
  geometria: feature.geometry,
  confianza: feature.properties.confianza,
  areaM2: feature.properties.areaM2,
  diametroM: feature.properties.diametroM,
  centroide: feature.properties.centroide,
  origen: feature.properties.origen,
  eliminada: feature.properties.eliminada,
}));

const featureArea = coleccionArea.features[0];

export const AREA_DE_INTERES: AreaInteres = {
  id: featureArea.properties.id,
  proyectoId: PROYECTO_CON_DATOS,
  geometria: featureArea.geometry,
  areaHa: featureArea.properties.areaHa,
};

/**
 * Ortomosaico del levantamiento simulado.
 *
 * Los metadatos describen el ortomosaico que existiria: COG en EPSG:5367 a
 * 5 cm/pixel y ~1.6 GB, que es el peso del archivo real del proyecto. Lo que
 * `urlCog` sirve, en cambio, es el fondo sintetico generado por
 * `npm run fixtures`. La distincion queda escrita en los mensajes de
 * validacion, que la interfaz muestra.
 */
export const ORTOMOSAICO: Ortomosaico = {
  id: "om-001",
  proyectoId: PROYECTO_CON_DATOS,
  nombreArchivo: "lote-norte-2026-04-15.tif",
  tamanoBytes: 1_717_986_918,
  formato: "COG",
  crs: "EPSG:5367",
  resolucionCmPorPixel: 5,
  extension: featureArea.properties.extension,
  urlCog: "/simulacion/lote-norte-fondo.svg",
  validacion: {
    formato: "valido",
    crs: "valido",
    resolucion: "valido",
    mensajes: [
      "Imagen de fondo sustituta: no hay ortomosaico real disponible.",
      "El archivo servido es una simulacion generada con la misma semilla que las copas.",
    ],
  },
  /*
   * Metadatos leidos del EXIF y el XMP de DJI_20260415111419_0054.JPG, el
   * fotograma real del vuelo. Ver datos-fuente/LEEME.md.
   * GSD = 52.597 x 35.9 / (35 x 8192) = 0.659 cm/pixel.
   * Huella = 8192 x 0.00659 = 53.9 m por 5460 x 0.00659 = 36.0 m.
   */
  vuelo: {
    camara: "DJI Zenmuse P1",
    distanciaFocalMm: 35,
    alturaVueloM: 52.597,
    latitud: 10.268296,
    longitud: -85.736666,
    gsdCmPorPixel: 0.659,
    huellaM: [53.9, 36.0],
    urlFotograma: "/simulacion/vuelo-lote-norte.jpg",
    urlMiniatura: "/simulacion/vuelo-lote-norte-mini.jpg",
  },
  subidoEn: "2026-04-15T17:14:19.000Z",
};
