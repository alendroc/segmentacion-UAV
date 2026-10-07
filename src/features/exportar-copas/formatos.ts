/**
 * Generacion de los archivos de exportacion, en el cliente (RF-23, RF-24).
 *
 * Funciones puras: reciben las copas ya filtradas y devuelven texto. Nada de
 * descargas ni de DOM aqui, para que se puedan probar de verdad.
 */
import type { Copa, Proyecto } from "@/shared/api/types";
import type { Filtros } from "@/entities/copa";

/** Sistema de referencia declarado en todo lo que sale de aqui. */
export const CRS_URN = "urn:ogc:def:crs:EPSG::5367";

export interface Procedencia {
  proyecto: Proyecto;
  filtros: Filtros;
  /** Copas que se exportan. */
  exportadas: number;
  /** Copas registradas en total, incluidas las ocultas y las eliminadas. */
  totales: number;
  eliminadas: number;
  generadoEn: Date;
}

/** Bloque comun que hace auditable cualquier archivo exportado. */
function bloqueProcedencia(p: Procedencia) {
  return {
    proyecto: p.proyecto.nombre,
    proyectoId: p.proyecto.id,
    sitio: p.proyecto.sitio,
    generadoEn: p.generadoEn.toISOString(),
    crs: "EPSG:5367",
    copasExportadas: p.exportadas,
    copasRegistradas: p.totales,
    copasDescartadas: p.eliminadas,
    filtroConfianzaMinima: p.filtros.confianzaMinima,
    filtroAreaMinimaM2: p.filtros.areaMinima,
    datosSimulados: true,
    advertencia:
      "Datos simulados. No hay ningun modelo de aprendizaje profundo entrenado; " +
      "las detecciones provienen de un generador sintetico con semilla fija.",
  };
}

/**
 * GeoJSON en EPSG:5367.
 *
 * El miembro `crs` es la forma anterior a RFC 7946. El RFC lo elimino y obliga
 * a WGS84, pero almacenar en WGS84 esta prohibido por CLAUDE.md §5: introduciria
 * error sistematico en las areas de copa. QGIS sigue leyendo esta forma.
 */
export function generarGeoJson(copas: Copa[], p: Procedencia): string {
  return (
    JSON.stringify(
      {
        type: "FeatureCollection",
        name: p.proyecto.nombre,
        crs: { type: "name", properties: { name: CRS_URN } },
        metadata: bloqueProcedencia(p),
        features: copas.map((copa) => ({
          type: "Feature",
          id: copa.id,
          geometry: copa.geometria,
          properties: {
            id: copa.id,
            confianza: copa.confianza,
            areaM2: copa.areaM2,
            diametroM: copa.diametroM,
            centroideX: copa.centroide[0],
            centroideY: copa.centroide[1],
            origen: copa.origen,
          },
        })),
      },
      null,
      2,
    ) + "\n"
  );
}

const ENCABEZADOS = [
  "id",
  "confianza",
  "area_m2",
  "diametro_m",
  "centroide_este",
  "centroide_norte",
  "origen",
] as const;

const NOMBRE_ORIGEN: Record<Copa["origen"], string> = {
  automatico: "Automatica",
  manual: "Manual",
  corregido: "Corregida",
};

/**
 * CSV de atributos, una fila por copa.
 *
 * Formato pensado para abrirse de doble clic en Excel configurado en espanol:
 * separador punto y coma, coma decimal y BOM UTF-8. Con coma como separador y
 * punto decimal, Excel en es-CR mete todo en una sola columna.
 */
export function generarCsv(copas: Copa[], p: Procedencia): string {
  const n = (valor: number, decimales: number) =>
    valor.toFixed(decimales).replace(".", ",");

  const filas = copas.map((copa) =>
    [
      copa.id,
      copa.confianza === null ? "" : n(copa.confianza, 4),
      n(copa.areaM2, 3),
      n(copa.diametroM, 3),
      n(copa.centroide[0], 3),
      n(copa.centroide[1], 3),
      NOMBRE_ORIGEN[copa.origen],
    ].join(";"),
  );

  // Comentarios de procedencia antes de la cabecera. Las hojas de calculo los
  // muestran como filas; es preferible a perder la trazabilidad del archivo.
  const cabecera = Object.entries(bloqueProcedencia(p)).map(
    ([clave, valor]) => `# ${clave};${String(valor)}`,
  );

  return (
    "﻿" +
    [...cabecera, ENCABEZADOS.join(";"), ...filas].join("\r\n") +
    "\r\n"
  );
}

export function nombreArchivo(
  proyecto: Proyecto,
  extension: string,
  generadoEn: Date,
): string {
  const fecha = generadoEn.toISOString().slice(0, 10);
  const base = proyecto.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `copas-${base}-${fecha}.${extension}`;
}
