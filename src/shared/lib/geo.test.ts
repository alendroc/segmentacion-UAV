import { describe, expect, it } from "vitest";
import {
  aWgs84,
  CRTM05,
  desdeWgs84,
  extensionDePoligono,
  proyeccionCrtm05,
  type Posicion,
} from "@/shared/lib/geo";

/** Centro del lote simulado, en el centro del area de interes. */
const CENTRO_LOTE: Posicion = [340_900, 1_122_100];

describe("geo", () => {
  it("registra EPSG:5367 con unidades en metros", () => {
    const proyeccion = proyeccionCrtm05();
    expect(proyeccion.getCode()).toBe(CRTM05);
    expect(proyeccion.getUnits()).toBe("m");
  });

  it("es idempotente al registrar", () => {
    expect(proyeccionCrtm05()).toBe(proyeccionCrtm05());
  });

  it("situa el lote en Guanacaste", () => {
    const [lon, lat] = aWgs84(CENTRO_LOTE);
    expect(lat).toBeGreaterThan(10.0);
    expect(lat).toBeLessThan(10.3);
    expect(lon).toBeGreaterThan(-85.7);
    expect(lon).toBeLessThan(-85.2);
  });

  it("va y vuelve sin perder mas de un milimetro", () => {
    const vuelta = desdeWgs84(aWgs84(CENTRO_LOTE));
    expect(vuelta[0]).toBeCloseTo(CENTRO_LOTE[0], 3);
    expect(vuelta[1]).toBeCloseTo(CENTRO_LOTE[1], 3);
  });

  it("deriva la extension de un poligono", () => {
    const poligono: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [340_840, 1_122_050],
          [340_960, 1_122_050],
          [340_960, 1_122_150],
          [340_840, 1_122_150],
          [340_840, 1_122_050],
        ],
      ],
    };
    expect(extensionDePoligono(poligono)).toEqual([
      340_840, 1_122_050, 340_960, 1_122_150,
    ]);
  });

  it("reexporta la geometria plana", async () => {
    const geo = await import("@/shared/lib/geo");
    expect(typeof geo.areaAnilloM2).toBe("function");
    expect(typeof geo.centroideAnillo).toBe("function");
  });
});

describe("geo — extension de la proyeccion", () => {
  /*
   * Una proyeccion registrada por proj4 llega a OpenLayers sin extension, y sin
   * ella OL no puede derivar los niveles de zoom. Esta prueba evita que la
   * declaracion se pierda en un refactor.
   */
  it("declara el area de uso de CRTM05", () => {
    const extension = proyeccionCrtm05().getExtent();
    expect(extension).not.toBeNull();

    const [minX, minY, maxX, maxY] = extension;
    // El lote simulado tiene que caer dentro del area declarada.
    expect(minX).toBeLessThan(340_840);
    expect(maxX).toBeGreaterThan(340_960);
    expect(minY).toBeLessThan(1_122_050);
    expect(maxY).toBeGreaterThan(1_122_150);
  });
});
