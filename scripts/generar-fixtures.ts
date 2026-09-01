/**
 * Escribe los fixtures del levantamiento simulado.
 *
 *   npm run fixtures
 *
 * Corre bajo Node plano: v22 hace type stripping de forma nativa y el proyecto
 * compila con `erasableSyntaxOnly`, asi que no hace falta tsx ni ts-node.
 *
 * Dos ejecuciones seguidas tienen que producir archivos identicos byte a byte
 * (PLAN.md, Fase 2, criterio 1). De ahi el orden fijo de claves, el redondeo
 * estable y el salto de linea explicito.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  anilloAreaInteres,
  generar,
  SEMILLA,
  type CopaSintetica,
} from "../src/mocks/generador.ts";
import { generarFondoSvg } from "../src/mocks/fondoSimulado.ts";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Miembro `crs` en la forma anterior a RFC 7946.
 *
 * El RFC lo elimino y obliga a WGS84, pero almacenar en WGS84 esta prohibido
 * por CLAUDE.md seccion 5: introduciria error sistematico en las areas de copa.
 * QGIS sigue leyendo esta forma, asi que se declara a proposito.
 */
const CRS = {
  type: "name",
  properties: { name: "urn:ogc:def:crs:EPSG::5367" },
} as const;

function escribir(rutaRelativa: string, contenido: string): void {
  const destino = join(RAIZ, rutaRelativa);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido, "utf8");
  const kb = (Buffer.byteLength(contenido, "utf8") / 1024).toFixed(1);
  console.log("  " + rutaRelativa + "  (" + kb + " KB)");
}

function comoJson(valor: unknown): string {
  return JSON.stringify(valor, null, 2) + "\n";
}

function copaAFeature(copa: CopaSintetica) {
  return {
    type: "Feature",
    id: copa.id,
    geometry: copa.geometria,
    properties: {
      id: copa.id,
      confianza: copa.confianza,
      areaM2: copa.areaM2,
      diametroM: copa.diametroM,
      centroide: copa.centroide,
      origen: copa.origen,
      eliminada: copa.eliminada,
    },
  };
}

const resultado = generar(SEMILLA);

console.log("Generando fixtures con semilla " + SEMILLA + ":");

escribir(
  "src/mocks/fixtures/lote-norte.geojson",
  comoJson({
    type: "FeatureCollection",
    crs: CRS,
    features: resultado.copas.map(copaAFeature),
  }),
);

escribir(
  "src/mocks/fixtures/lote-norte-area.geojson",
  comoJson({
    type: "FeatureCollection",
    crs: CRS,
    features: [
      {
        type: "Feature",
        id: "ai-001",
        geometry: { type: "Polygon", coordinates: [anilloAreaInteres()] },
        properties: {
          id: "ai-001",
          areaHa: resultado.areaHa,
          extension: resultado.areaInteres,
        },
      },
    ],
  }),
);

escribir("public/simulacion/lote-norte-fondo.svg", generarFondoSvg(resultado));

console.log(
  "Listo: " +
    resultado.copas.length +
    " copas sobre " +
    resultado.areaHa +
    " ha, con " +
    resultado.claros.length +
    " claros.",
);
