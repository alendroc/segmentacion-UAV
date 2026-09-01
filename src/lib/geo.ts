/**
 * Sistema de referencia y transformaciones.
 *
 * Todo se almacena y se calcula en EPSG:5367 (CR05 / CRTM05), en metros
 * (CLAUDE.md, seccion 5). Nunca en EPSG:4326 ni en Web Mercator: introducen
 * error sistematico y este es un trabajo forestal donde las areas de copa
 * importan.
 *
 * La matematica plana vive en `geometriaPlana.ts`, que no importa nada y por
 * eso puede usarla tambien el generador de fixtures bajo Node. Aqui se
 * reexporta para que el resto de la aplicacion tenga una sola puerta.
 */
import { get as obtenerProyeccionRegistrada } from "ol/proj";
import { register } from "ol/proj/proj4";
import type Projection from "ol/proj/Projection";
import proj4 from "proj4";
import { envolvente, type Posicion } from "./geometriaPlana";

export * from "./geometriaPlana";

/** Codigo EPSG del sistema oficial de Costa Rica. */
export const CRTM05 = "EPSG:5367";
export const WGS84 = "EPSG:4326";

/**
 * CR05 / CRTM05: Mercator transversa, meridiano central -84, factor de escala
 * 0.9996, falso este 500 000 m, elipsoide WGS84.
 */
const DEFINICION_CRTM05 =
  "+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9996 +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs";

/**
 * Area de uso de CR05 / CRTM05: Costa Rica, continental y marina, proyectada
 * a metros. Una proyeccion registrada via proj4 llega a OpenLayers SIN
 * extension, y sin ella OL no puede derivar su escalera de niveles de zoom.
 */
const EXTENSION_CRTM05: [number, number, number, number] = [
  145_083, 553_234, 788_320, 1_306_432,
];

let registrado = false;

/**
 * Registra EPSG:5367 en proj4 y en OpenLayers. Idempotente: se puede llamar
 * desde donde sea sin miedo a duplicar.
 */
export function registrarProyecciones(): void {
  if (registrado) return;
  proj4.defs(CRTM05, DEFINICION_CRTM05);
  register(proj4);

  const proyeccion = obtenerProyeccionRegistrada(CRTM05);
  if (proyeccion) {
    proyeccion.setExtent(EXTENSION_CRTM05);
    proyeccion.setWorldExtent([-87.2, 5.0, -81.4, 11.8]);
  }

  registrado = true;
}

/** Proyeccion de OpenLayers para CRTM05. Registra si hace falta. */
export function proyeccionCrtm05(): Projection {
  registrarProyecciones();
  const proyeccion = obtenerProyeccionRegistrada(CRTM05);
  if (!proyeccion) {
    throw new Error("No fue posible registrar la proyeccion " + CRTM05 + ".");
  }
  return proyeccion;
}

/** De CRTM05 a longitud/latitud. Solo para mostrar o para comprobar. */
export function aWgs84(posicion: Posicion): Posicion {
  registrarProyecciones();
  const [lon, lat] = proj4(CRTM05, WGS84, [posicion[0], posicion[1]]);
  return [lon, lat];
}

/** De longitud/latitud a CRTM05. */
export function desdeWgs84(posicion: Posicion): Posicion {
  registrarProyecciones();
  const [x, y] = proj4(WGS84, CRTM05, [posicion[0], posicion[1]]);
  return [x, y];
}

/** Extension de un poligono, en el formato [minX, minY, maxX, maxY] de OL. */
export function extensionDePoligono(
  poligono: GeoJSON.Polygon,
): [number, number, number, number] {
  return envolvente(poligono.coordinates[0] as Posicion[]);
}
