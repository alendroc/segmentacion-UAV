import { area as areaTurf } from "@turf/area";
import { polygon } from "@turf/helpers";
import proj4 from "proj4";
import { beforeAll, describe, expect, it } from "vitest";
import { areaAnilloM2, type Posicion } from "@/lib/geometriaPlana";
import {
  AREA_INTERES,
  generar,
  LIMITES,
  SEMILLA,
  type ResultadoGenerador,
} from "@/mocks/generador";

const CRTM05 =
  "+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9996 +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs";

let resultado: ResultadoGenerador;

beforeAll(() => {
  proj4.defs("EPSG:5367", CRTM05);
  resultado = generar(SEMILLA);
});


describe("generador — reproducibilidad", () => {
  it("produce exactamente el mismo resultado con la misma semilla", () => {
    expect(generar(SEMILLA)).toEqual(generar(SEMILLA));
  });

  it("produce un resultado distinto con otra semilla", () => {
    expect(generar(SEMILLA + 1)).not.toEqual(generar(SEMILLA));
  });
});

describe("generador — dosel", () => {
  it("genera entre 120 y 180 copas", () => {
    expect(resultado.copas.length).toBeGreaterThanOrEqual(120);
    expect(resultado.copas.length).toBeLessThanOrEqual(180);
  });

  it("cubre un area de interes de 1.2 ha", () => {
    expect(resultado.areaHa).toBeCloseTo(1.2, 4);
  });

  it("deja claros en el dosel", () => {
    // Sin huecos el resultado seria una nube uniforme, que no es el bosque
    // tropical seco (CLAUDE.md seccion 9).
    expect(resultado.claros.length).toBeGreaterThanOrEqual(4);
  });

  it("no coloca ninguna copa dentro de un claro", () => {
    for (const copa of resultado.copas) {
      for (const claro of resultado.claros) {
        const dx = copa.centroide[0] - claro.centro[0];
        const dy = copa.centroide[1] - claro.centro[1];
        // Holgura de un radio de copa: el centro esta fuera, el follaje puede asomarse.
        expect(Math.hypot(dx, dy)).toBeGreaterThan(claro.radio - LIMITES.RADIO_MAX);
      }
    }
  });

  it("mantiene todas las copas dentro del area de interes", () => {
    for (const copa of resultado.copas) {
      const [x, y] = copa.centroide;
      expect(x).toBeGreaterThan(AREA_INTERES.minX);
      expect(x).toBeLessThan(AREA_INTERES.maxX);
      expect(y).toBeGreaterThan(AREA_INTERES.minY);
      expect(y).toBeLessThan(AREA_INTERES.maxY);
    }
  });
});

describe("generador — forma de las copas", () => {
  it("usa entre 11 y 16 vertices, con el anillo cerrado", () => {
    for (const copa of resultado.copas) {
      const anillo = copa.geometria.coordinates[0];
      const vertices = anillo.length - 1;
      expect(vertices).toBeGreaterThanOrEqual(LIMITES.VERTICES_MIN);
      expect(vertices).toBeLessThanOrEqual(LIMITES.VERTICES_MAX);
      expect(anillo[0]).toEqual(anillo[anillo.length - 1]);
    }
  });

  it("mantiene el radio equivalente entre 1.8 y 4.2 metros", () => {
    for (const copa of resultado.copas) {
      const radio = copa.diametroM / 2;
      expect(radio).toBeGreaterThanOrEqual(LIMITES.RADIO_MIN);
      expect(radio).toBeLessThanOrEqual(LIMITES.RADIO_MAX);
    }
  });

  it("mantiene cada vertice a una distancia verosimil del centroide", () => {
    // El centroide del poligono no coincide exactamente con el centro que lo
    // genero, asi que se admite una holgura de 0.5 m sobre los radios limite.
    for (const copa of resultado.copas) {
      for (const punto of copa.geometria.coordinates[0]) {
        const d = Math.hypot(
          punto[0] - copa.centroide[0],
          punto[1] - copa.centroide[1],
        );
        expect(d).toBeGreaterThan(LIMITES.RADIO_MIN - 0.5);
        expect(d).toBeLessThan(LIMITES.RADIO_MAX + 0.5);
      }
    }
  });
});

describe("generador — atributos", () => {
  it("marca todas las detecciones como automaticas y no eliminadas", () => {
    for (const copa of resultado.copas) {
      expect(copa.origen).toBe("automatico");
      expect(copa.eliminada).toBe(false);
      expect(copa.confianza).not.toBeNull();
    }
  });

  it("asigna identificadores unicos y ordenados", () => {
    const ids = resultado.copas.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("co-001");
  });

  it("sesga la confianza hacia valores altos con una cola baja del 15 al 20 %", () => {
    const confianzas = resultado.copas.map((c) => c.confianza ?? 0);
    const bajas = confianzas.filter((c) => c < 0.7).length;
    const proporcion = bajas / confianzas.length;

    expect(proporcion).toBeGreaterThanOrEqual(0.15);
    expect(proporcion).toBeLessThanOrEqual(0.2);
    expect(Math.min(...confianzas)).toBeGreaterThan(0);
    expect(Math.max(...confianzas)).toBeLessThanOrEqual(1);
  });
});

describe("generador — geometria declarada", () => {
  /*
   * Criterio 3 de la Fase 2, parte vinculante: el area almacenada tiene que
   * salir exactamente de la geometria que se escribe al archivo. Se compara
   * contra el calculo plano en EPSG:5367, que es el que exige CLAUDE.md
   * seccion 5. La tolerancia es la del redondeo a tres decimales.
   */
  it("declara un areaM2 que coincide con su geometria", () => {
    for (const copa of resultado.copas) {
      const anillo = copa.geometria.coordinates[0] as Posicion[];
      expect(Math.abs(areaAnilloM2(anillo) - copa.areaM2)).toBeLessThan(0.001);
    }
  });

  it("declara un diametroM coherente con su areaM2", () => {
    for (const copa of resultado.copas) {
      const esperado = 2 * Math.sqrt(copa.areaM2 / Math.PI);
      expect(Math.abs(esperado - copa.diametroM)).toBeLessThan(0.001);
    }
  });

  /*
   * Criterio 3, parte de contraste. NO se puede exigir 0.01 m2 contra Turf, y
   * no es un defecto del generador:
   *
   *   - `areaM2` es area PLANA en EPSG:5367, que es lo que manda la seccion 5.
   *   - `@turf/area` calcula area geodesica sobre una ESFERA de radio 6378137,
   *     no sobre el elipsoide WGS84.
   *
   * Son dos magnitudes distintas. La aproximacion esferica sola ya introduce
   * unas cuatro decimas de por ciento a esta latitud: sobre una copa de 27 m2
   * son ~0.11 m2, diez veces la tolerancia pedida. Turf sirve como contraste
   * independiente de que la georreferenciacion es la que creemos, no como
   * referencia de area. Queda anotado en PLAN.md.
   */
  it("concuerda con el area geodesica de Turf dentro del 1 %", () => {
    for (const copa of resultado.copas) {
      const anillo = copa.geometria.coordinates[0] as Posicion[];
      const enWgs84 = anillo.map((p) => proj4("EPSG:5367", "EPSG:4326", p));
      const geodesica = areaTurf(polygon([enWgs84]));
      const relativa = Math.abs(geodesica - copa.areaM2) / copa.areaM2;
      expect(relativa).toBeLessThan(0.01);
    }
  });
});

describe("generador — georreferenciacion", () => {
  /*
   * Sustituye al criterio 2 de la Fase 2 ("abre en QGIS con la
   * georreferenciacion esperada"), que no se puede automatizar aqui. Comprueba
   * lo mismo que uno miraria en QGIS: que el lote cae donde dice caer.
   */
  it("situa el area de interes en Guanacaste", () => {
    const centro: Posicion = [
      (AREA_INTERES.minX + AREA_INTERES.maxX) / 2,
      (AREA_INTERES.minY + AREA_INTERES.maxY) / 2,
    ];
    const [lon, lat] = proj4("EPSG:5367", "EPSG:4326", centro);

    // Nicoya, Guanacaste.
    expect(lat).toBeGreaterThan(10.0);
    expect(lat).toBeLessThan(10.3);
    expect(lon).toBeGreaterThan(-85.7);
    expect(lon).toBeLessThan(-85.2);
  });

  it("mantiene las copas en coordenadas CRTM05 y no en grados", () => {
    for (const copa of resultado.copas) {
      // Un grado nunca pasa de 180; estos son metros de seis y siete cifras.
      expect(copa.centroide[0]).toBeGreaterThan(100_000);
      expect(copa.centroide[1]).toBeGreaterThan(1_000_000);
    }
  });
});
