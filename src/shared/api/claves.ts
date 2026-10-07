/**
 * Claves de caché de TanStack Query compartidas entre entidades. Viven aquí
 * porque entities/trabajo y features/crear-proyecto invalidan la lista de
 * proyectos sin poder importar entities/proyecto.
 */
export const claveProyectos = ["proyectos"] as const;

export function claveProyecto(proyectoId: string) {
  return ["proyecto", proyectoId] as const;
}
