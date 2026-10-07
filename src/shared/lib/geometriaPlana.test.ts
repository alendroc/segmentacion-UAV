import { describe, expect, it } from "vitest";
import {
  areaAnilloM2,
  centroideAnillo,
  diametroEquivalenteM,
  envolvente,
  type Posicion,
} from "@/shared/lib/geometriaPlana";

/** Cuadrado de 4 m de lado, centrado en el origen. */
const CUADRADO: Posicion[] = [
  [-2, -2],
  [2, -2],
  [2, 2],
  [-2, 2],
  [-2, -2],
];

/** Traslada un anillo. El area y el centroide tienen que acompanar. */
function trasladar(anillo: Posicion[], dx: number, dy: number): Posicion[] {
  return anillo.map(([x, y]) => [x + dx, y + dy]);
}

describe("geometriaPlana", () => {
  it("calcula el area de un cuadrado", () => {
    expect(areaAnilloM2(CUADRADO)).toBeCloseTo(16, 10);
  });

  it("acepta anillos sin el vertice de cierre", () => {
    expect(areaAnilloM2(CUADRADO.slice(0, -1))).toBeCloseTo(16, 10);
  });

  it("da el mismo area en sentido horario y antihorario", () => {
    const horario = [...CUADRADO].reverse();
    expect(areaAnilloM2(horario)).toBeCloseTo(areaAnilloM2(CUADRADO), 10);
  });

  it("ubica el centroide de un cuadrado en su centro", () => {
    const [x, y] = centroideAnillo(CUADRADO);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it("ubica el centroide de un triangulo en el promedio de sus vertices", () => {
    const triangulo: Posicion[] = [
      [0, 0],
      [6, 0],
      [0, 3],
      [0, 0],
    ];
    const [x, y] = centroideAnillo(triangulo);
    expect(x).toBeCloseTo(2, 10);
    expect(y).toBeCloseTo(1, 10);
  });

  /*
   * Regresion. Con coordenadas de EPSG:5367 los productos cruzados rondan
   * 3.8e11 y la formula ingenua pierde la diferencia en la precision del
   * double: el centroide llegaba a caer metros fuera del poligono. El area y el
   * centroide son invariantes ante traslacion, y esta prueba lo exige.
   */
  it("no pierde precision con coordenadas CRTM05 de siete cifras", () => {
    const dx = 340_900;
    const dy = 1_122_100;
    const lejos = trasladar(CUADRADO, dx, dy);

    expect(areaAnilloM2(lejos)).toBeCloseTo(16, 6);

    const [x, y] = centroideAnillo(lejos);
    expect(x - dx).toBeCloseTo(0, 6);
    expect(y - dy).toBeCloseTo(0, 6);
  });

  it("mantiene la precision en un poligono irregular lejos del origen", () => {
    // Once vertices en circulo de radio 3, como una copa real.
    const radio = 3;
    const anillo: Posicion[] = [];
    for (let i = 0; i < 11; i += 1) {
      const a = (i * 2 * Math.PI) / 11;
      anillo.push([Math.cos(a) * radio, Math.sin(a) * radio]);
    }
    anillo.push([anillo[0][0], anillo[0][1]]);

    const lejos = trasladar(anillo, 340_877, 1_122_138);
    const [x, y] = centroideAnillo(lejos);

    expect(x - 340_877).toBeCloseTo(0, 6);
    expect(y - 1_122_138).toBeCloseTo(0, 6);
    expect(areaAnilloM2(lejos)).toBeCloseTo(areaAnilloM2(anillo), 6);
  });

  it("deriva el diametro de circulo equivalente a partir del area", () => {
    // Un circulo de radio 3 tiene area 9*pi y diametro 6.
    expect(diametroEquivalenteM(9 * Math.PI)).toBeCloseTo(6, 10);
  });

  it("calcula la envolvente", () => {
    expect(envolvente(CUADRADO)).toEqual([-2, -2, 2, 2]);
  });
});
