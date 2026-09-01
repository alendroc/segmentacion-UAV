import { describe, expect, it } from "vitest";
import type { Copa, Proyecto } from "@/api/types";
import {
  CRS_URN,
  generarCsv,
  generarGeoJson,
  nombreArchivo,
  type Procedencia,
} from "@/features/exportacion/formatos";
import { FILTROS_INICIALES } from "@/features/visor/metricas";

const PROYECTO: Proyecto = {
  id: "pr-001",
  nombre: "Lote Norte",
  descripcion: "",
  sitio: "Nicoya, Guanacaste",
  creadoEn: "2026-03-11T15:20:00.000Z",
  actualizadoEn: "2026-04-02T18:05:00.000Z",
  estado: "completado",
  ortomosaicoId: "om-001",
  totalCopas: 2,
  urlMiniatura: null,
};

const COPAS: Copa[] = [
  {
    id: "co-001",
    proyectoId: "pr-001",
    geometria: {
      type: "Polygon",
      coordinates: [
        [
          [340_900, 1_122_100],
          [340_903, 1_122_100],
          [340_903, 1_122_103],
          [340_900, 1_122_100],
        ],
      ],
    },
    confianza: 0.8765,
    areaM2: 4.5,
    diametroM: 2.394,
    centroide: [340_902, 1_122_101],
    origen: "automatico",
    eliminada: false,
  },
  {
    id: "co-002",
    proyectoId: "pr-001",
    geometria: { type: "Polygon", coordinates: [[]] },
    confianza: null,
    areaM2: 12.25,
    diametroM: 3.949,
    centroide: [340_910, 1_122_120],
    origen: "manual",
    eliminada: false,
  },
];

const PROCEDENCIA: Procedencia = {
  proyecto: PROYECTO,
  filtros: { ...FILTROS_INICIALES, confianzaMinima: 0.5 },
  exportadas: 2,
  totales: 5,
  eliminadas: 1,
  generadoEn: new Date("2026-09-01T12:00:00.000Z"),
};

describe("GeoJSON exportado", () => {
  const texto = generarGeoJson(COPAS, PROCEDENCIA);
  const objeto = JSON.parse(texto);

  it("declara EPSG:5367 y no reproyecta a WGS84", () => {
    expect(objeto.crs.properties.name).toBe(CRS_URN);
    // Coordenadas en metros, de seis y siete cifras: no son grados.
    const [x, y] = objeto.features[0].geometry.coordinates[0][0];
    expect(x).toBeGreaterThan(100_000);
    expect(y).toBeGreaterThan(1_000_000);
  });

  /* Criterio 3 de la Fase 8. */
  it("declara cuantas copas de cuantas salieron", () => {
    expect(objeto.metadata.copasExportadas).toBe(2);
    expect(objeto.metadata.copasRegistradas).toBe(5);
    expect(objeto.metadata.copasDescartadas).toBe(1);
    expect(objeto.metadata.filtroConfianzaMinima).toBe(0.5);
  });

  it("avisa de que los datos son simulados", () => {
    expect(objeto.metadata.datosSimulados).toBe(true);
    expect(objeto.metadata.advertencia).toMatch(/simulados/i);
  });

  it("lleva una feature por copa, con sus atributos", () => {
    expect(objeto.features).toHaveLength(2);
    expect(objeto.features[0].properties.id).toBe("co-001");
    expect(objeto.features[1].properties.confianza).toBeNull();
    expect(objeto.features[1].properties.origen).toBe("manual");
  });

  it("es JSON valido y termina en salto de linea", () => {
    expect(() => JSON.parse(texto)).not.toThrow();
    expect(texto.endsWith("\n")).toBe(true);
  });
});

describe("CSV exportado", () => {
  const texto = generarCsv(COPAS, PROCEDENCIA);
  const lineas = texto.replace("﻿", "").split("\r\n");
  const cabecera = lineas.find((l) => l.startsWith("id;"));
  const filas = lineas.filter((l) => /^co-/.test(l));

  it("empieza con BOM para que Excel lo lea como UTF-8", () => {
    expect(texto.charCodeAt(0)).toBe(0xfeff);
  });

  it("usa punto y coma como separador y coma decimal", () => {
    expect(cabecera).toBe(
      "id;confianza;area_m2;diametro_m;centroide_este;centroide_norte;origen",
    );
    expect(filas[0]).toContain("4,500");
    expect(filas[0]).not.toContain("4.500");
  });

  /* Criterio 2 de la Fase 8: una fila por copa. */
  it("escribe una fila por copa", () => {
    expect(filas).toHaveLength(2);
    expect(filas[0].split(";")[0]).toBe("co-001");
  });

  it("deja la confianza vacia cuando la copa es manual", () => {
    const campos = filas[1].split(";");
    expect(campos[0]).toBe("co-002");
    expect(campos[1]).toBe("");
    expect(campos[6]).toBe("Manual");
  });

  it("incluye la procedencia como comentarios", () => {
    expect(texto).toContain("# copasExportadas;2");
    expect(texto).toContain("# copasRegistradas;5");
    expect(texto).toContain("# crs;EPSG:5367");
  });
});

describe("nombre de archivo", () => {
  it("usa un nombre legible, sin tildes ni espacios", () => {
    expect(
      nombreArchivo(
        { ...PROYECTO, nombre: "Quebrada Hondá Sur" },
        "geojson",
        new Date("2026-09-01T12:00:00.000Z"),
      ),
    ).toBe("copas-quebrada-honda-sur-2026-09-01.geojson");
  });
});
