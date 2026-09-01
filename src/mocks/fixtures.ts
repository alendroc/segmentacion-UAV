/**
 * Carga de los fixtures generados y adaptacion al modelo de dominio.
 *
 * Los archivos se importan como texto (`?raw`) y se parsean aqui, no se
 * importan como modulo: asi el GeoJSON del repositorio es exactamente el mismo
 * archivo que abre QGIS, sin transformaciones de por medio.
 */
import copasRaw from "./fixtures/lote-norte.geojson?raw";
import areaRaw from "./fixtures/lote-norte-area.geojson?raw";
import type { AreaInteres, Copa, OrigenCopa } from "../api/types";

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
  properties: { id: string; areaHa: number };
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
