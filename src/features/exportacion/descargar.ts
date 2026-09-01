/**
 * Descarga de un texto generado en el cliente.
 *
 * Aparte de `formatos.ts` a proposito: aquello es logica pura y probable, esto
 * toca el DOM y no lo es.
 */
export function descargarTexto(
  nombre: string,
  contenido: string,
  tipoMime: string,
): void {
  const blob = new Blob([contenido], { type: `${tipoMime};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  // El navegador necesita la URL hasta que arranca la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
