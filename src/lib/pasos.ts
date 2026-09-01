/**
 * El flujo de trabajo, declarado una sola vez.
 *
 * Lo consumen la navegacion del proyecto, las migas de pan y el boton de
 * "siguiente paso". Si se declara en varios sitios, tarde o temprano se
 * contradicen.
 */

export type ClavePaso = "carga" | "procesamiento" | "visor" | "exportacion";

export interface Paso {
  numero: number;
  clave: ClavePaso;
  etiqueta: string;
  /** Que hace la persona usuaria en este paso. */
  proposito: string;
}

export const PASOS: readonly Paso[] = [
  {
    numero: 1,
    clave: "carga",
    etiqueta: "Carga",
    proposito: "Subir el ortomosaico y validar formato, CRS y resolucion",
  },
  {
    numero: 2,
    clave: "procesamiento",
    etiqueta: "Procesamiento",
    proposito: "Ejecutar la deteccion y seguir su avance",
  },
  {
    numero: 3,
    clave: "visor",
    etiqueta: "Visor",
    proposito: "Revisar y corregir las copas detectadas",
  },
  {
    numero: 4,
    clave: "exportacion",
    etiqueta: "Exportacion",
    proposito: "Descargar los resultados",
  },
];

export function rutaDePaso(proyectoId: string, clave: ClavePaso): string {
  return `/proyectos/${proyectoId}/${clave}`;
}

/** Deduce el paso a partir del ultimo segmento de la ruta. */
export function pasoDesdeRuta(pathname: string): Paso | null {
  const ultimo = pathname.split("/").filter(Boolean).pop();
  return PASOS.find((paso) => paso.clave === ultimo) ?? null;
}

export function pasoSiguiente(clave: ClavePaso): Paso | null {
  const indice = PASOS.findIndex((paso) => paso.clave === clave);
  return indice >= 0 && indice < PASOS.length - 1 ? PASOS[indice + 1] : null;
}

export function pasoAnterior(clave: ClavePaso): Paso | null {
  const indice = PASOS.findIndex((paso) => paso.clave === clave);
  return indice > 0 ? PASOS[indice - 1] : null;
}
