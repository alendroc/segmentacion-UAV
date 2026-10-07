/**
 * Geometria plana sobre coordenadas proyectadas en metros.
 *
 * ESTE ARCHIVO NO IMPORTA NADA, y no debe hacerlo. Lo consumen dos mundos
 * distintos: el navegador a traves de `lib/geo.ts`, y el script
 * `scripts/generar-fixtures.ts` bajo Node plano, que no puede cargar proj4 ni
 * OpenLayers.
 *
 * Todas las funciones asumen coordenadas en EPSG:5367 (CR05 / CRTM05), en
 * metros. Aplicarlas sobre grados da resultados sin sentido.
 */

export type Posicion = [number, number];
/** Anillo cerrado: el ultimo vertice repite el primero. */
export type Anillo = Posicion[];

/** Quita el vertice de cierre si esta presente. */
function verticesAbiertos(anillo: readonly Posicion[]): Posicion[] {
  if (anillo.length < 2) return [...anillo];
  const primero = anillo[0];
  const ultimo = anillo[anillo.length - 1];
  const cerrado = primero[0] === ultimo[0] && primero[1] === ultimo[1];
  return cerrado ? anillo.slice(0, -1) : [...anillo];
}

/**
 * Doble del area con signo (formula del cordon de zapato). Positivo si los
 * vertices van en sentido antihorario.
 *
 * TODAS las operaciones se hacen respecto de un origen local, el primer
 * vertice. No es un detalle de estilo: en EPSG:5367 una copa vive alrededor de
 * (340 000, 1 122 000), los productos cruzados rondan 3.8e11 y su diferencia se
 * pierde en la precision del double. Restando el origen primero, las
 * coordenadas quedan en el orden de los metros y la cancelacion desaparece.
 * El area y el centroide son invariantes ante traslacion, asi que el resultado
 * es el mismo, solo que bien calculado.
 */
function dobleAreaConSigno(anillo: readonly Posicion[]): number {
  const v = verticesAbiertos(anillo);
  if (v.length < 3) return 0;

  const [ox, oy] = v[0];
  let suma = 0;
  for (let i = 0; i < v.length; i += 1) {
    const [x1, y1] = v[i];
    const [x2, y2] = v[(i + 1) % v.length];
    suma += (x1 - ox) * (y2 - oy) - (x2 - ox) * (y1 - oy);
  }
  return suma;
}

/** Area en metros cuadrados del anillo exterior. */
export function areaAnilloM2(anillo: readonly Posicion[]): number {
  return Math.abs(dobleAreaConSigno(anillo)) / 2;
}

/**
 * Centroide geometrico (centro de masa del poligono, no de sus vertices).
 *
 * Igual que el area, se calcula respecto del primer vertice y se devuelve el
 * origen al final. Sin esa traslacion el resultado puede caer metros fuera de
 * la copa, y el centroide georreferenciado es justo lo que RF-15 muestra.
 */
export function centroideAnillo(anillo: readonly Posicion[]): Posicion {
  const v = verticesAbiertos(anillo);
  if (v.length === 0) return [0, 0];

  const [ox, oy] = v[0];
  const doble = dobleAreaConSigno(v);

  if (doble === 0) {
    // Poligono degenerado: se cae al promedio de vertices para no dividir por cero.
    const suma = v.reduce<Posicion>(
      (acc, [x, y]) => [acc[0] + (x - ox), acc[1] + (y - oy)],
      [0, 0],
    );
    return [ox + suma[0] / v.length, oy + suma[1] / v.length];
  }

  let cx = 0;
  let cy = 0;
  for (let i = 0; i < v.length; i += 1) {
    const [x1, y1] = v[i];
    const [x2, y2] = v[(i + 1) % v.length];
    const ax = x1 - ox;
    const ay = y1 - oy;
    const bx = x2 - ox;
    const by = y2 - oy;
    const cruz = ax * by - bx * ay;
    cx += (ax + bx) * cruz;
    cy += (ay + by) * cruz;
  }

  return [ox + cx / (3 * doble), oy + cy / (3 * doble)];
}

/**
 * Diametro de copa a partir del area.
 *
 * DECISION METODOLOGICA: se usa el **diametro de circulo equivalente**,
 * 2*raiz(A/pi), es decir el diametro del circulo que tiene la misma area que la
 * copa. Se prefiere sobre el promedio de dos anchos perpendiculares porque no
 * depende de la orientacion en que se midan esos anchos y es reproducible a
 * partir de la sola geometria. Queda anotado en CLAUDE.md seccion 5.
 */
export function diametroEquivalenteM(areaM2: number): number {
  return 2 * Math.sqrt(areaM2 / Math.PI);
}

/** Envolvente del anillo: [minX, minY, maxX, maxY]. */
export function envolvente(
  anillo: readonly Posicion[],
): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of anillo) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}
