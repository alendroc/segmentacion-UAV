/**
 * Fondo simulado del mapa: un "ortomosaico" sintetico en SVG.
 *
 * NO ES UN ORTOMOSAICO. Es un sustituto de desarrollo, generado con la misma
 * semilla y sobre las mismas posiciones que las copas, para que la Fase 3 tenga
 * un fondo georreferenciado mientras no exista un COG real. Su valor concreto
 * es que hace verificable el criterio 1 de la Fase 4: que los poligonos se
 * alineen con las copas visibles en la imagen.
 *
 * Se eligio SVG y no un raster porque es texto plano: se genera sin ninguna
 * dependencia de imagen y sale byte a byte identico en cada ejecucion.
 *
 * El dosel refleja la condicion del bosque tropical seco (CLAUDE.md seccion 9):
 * abierto, discontinuo, y con parte del arbolado caducifolio, que en la epoca
 * seca se ve ocre y no verde.
 */
import { centroideAnillo, type Posicion } from "../lib/geometriaPlana.ts";
import { crearAzar, type ResultadoGenerador } from "./generador.ts";

/** Resolucion del ortomosaico simulado. Un vuelo de VANT tipico ronda esto. */
export const RESOLUCION_M_POR_PIXEL = 0.05;

const SUELO_BASE = "#b3975f";
const SUELO_MANCHAS = ["#a68a55", "#c0a878", "#9a8250", "#cbb78b", "#ab9a6b"];
const DOSEL_VERDE = ["#4a6b34", "#3f5c2c", "#557a3b", "#628843", "#456630"];
const DOSEL_CADUCIFOLIO = ["#a8873f", "#8f6f38", "#b99a56", "#7d6634"];
const SOMBRA = "#3c3220";

/** Proporcion del arbolado sin hoja en la epoca seca. */
const PROPORCION_CADUCIFOLIA = 0.32;

function n1(valor: number): string {
  return (Math.round(valor * 10) / 10).toString();
}

function elegir<T>(azar: () => number, opciones: readonly T[]): T {
  return opciones[Math.floor(azar() * opciones.length)];
}

export function generarFondoSvg(resultado: ResultadoGenerador): string {
  const { minX, minY, maxX, maxY } = resultado.areaInteres;
  const ancho = Math.round((maxX - minX) / RESOLUCION_M_POR_PIXEL);
  const alto = Math.round((maxY - minY) / RESOLUCION_M_POR_PIXEL);

  // El eje Y del SVG crece hacia abajo; el de EPSG:5367, hacia arriba.
  const aPixel = ([x, y]: Posicion): [number, number] => [
    (x - minX) / RESOLUCION_M_POR_PIXEL,
    (maxY - y) / RESOLUCION_M_POR_PIXEL,
  ];

  // PRNG propio, derivado de la semilla del levantamiento: dibujar el fondo no
  // debe alterar la secuencia con la que se generaron las copas.
  const azar = crearAzar(0x5f3a ^ resultado.copas.length);

  const partes: string[] = [];
  partes.push(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      ancho +
      '" height="' +
      alto +
      '" viewBox="0 0 ' +
      ancho +
      " " +
      alto +
      '">',
  );
  partes.push(
    '<rect width="' + ancho + '" height="' + alto + '" fill="' + SUELO_BASE + '"/>',
  );

  // Variacion del suelo: pasto seco, roca y sombra de relieve.
  partes.push('<g opacity="0.35">');
  for (let i = 0; i < 320; i += 1) {
    const cx = azar() * ancho;
    const cy = azar() * alto;
    const rx = 12 + azar() * 110;
    const ry = rx * (0.4 + azar() * 0.8);
    partes.push(
      '<ellipse cx="' +
        n1(cx) +
        '" cy="' +
        n1(cy) +
        '" rx="' +
        n1(rx) +
        '" ry="' +
        n1(ry) +
        '" fill="' +
        elegir(azar, SUELO_MANCHAS) +
        '"/>',
    );
  }
  partes.push("</g>");

  // Copas. Se dibujan sobre el mismo contorno que el GeoJSON, expandido un 6 %
  // desde el centroide: el follaje visible desborda un poco la deteccion, que
  // es justo lo que se observa en un ortomosaico real.
  for (const copa of resultado.copas) {
    const anillo = copa.geometria.coordinates[0] as Posicion[];
    const centro = centroideAnillo(anillo);

    const puntos = anillo.map((posicion) => {
      const expandido: Posicion = [
        centro[0] + (posicion[0] - centro[0]) * 1.06,
        centro[1] + (posicion[1] - centro[1]) * 1.06,
      ];
      const [px, py] = aPixel(expandido);
      return n1(px) + "," + n1(py);
    });
    const d = "M" + puntos.join("L") + "Z";

    const caducifolia = azar() < PROPORCION_CADUCIFOLIA;
    const color = caducifolia
      ? elegir(azar, DOSEL_CADUCIFOLIO)
      : elegir(azar, DOSEL_VERDE);

    // Sombra proyectada hacia el suroeste, coherente en todas las copas.
    const desplazamiento = 0.55 / RESOLUCION_M_POR_PIXEL;
    partes.push(
      '<path d="' +
        d +
        '" fill="' +
        SOMBRA +
        '" opacity="0.4" transform="translate(' +
        n1(-desplazamiento) +
        "," +
        n1(desplazamiento) +
        ')"/>',
    );
    partes.push('<path d="' + d + '" fill="' + color + '"/>');

    // Brillo del lado iluminado.
    const [cx, cy] = aPixel(centro);
    const radioPx = (copa.diametroM / 2 / RESOLUCION_M_POR_PIXEL) * 0.5;
    partes.push(
      '<ellipse cx="' +
        n1(cx + radioPx * 0.4) +
        '" cy="' +
        n1(cy - radioPx * 0.4) +
        '" rx="' +
        n1(radioPx) +
        '" ry="' +
        n1(radioPx * 0.8) +
        '" fill="#ffffff" opacity="0.12"/>',
    );
  }

  partes.push("</svg>");
  return partes.join("\n") + "\n";
}
