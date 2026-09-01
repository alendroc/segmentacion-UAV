/**
 * Unica puerta al back end (CLAUDE.md, seccion 2).
 *
 * Ningun otro archivo del repositorio puede llamar a fetch. Cuando el back end
 * real exista se apaga MSW con VITE_USE_MOCKS y este archivo no cambia.
 */
import type { RespuestaError } from "./types";

const BASE_URL: string = import.meta.env.VITE_API_URL || "/api";

export class ErrorApi extends Error {
  readonly status: number;
  readonly detalle: string | null;

  constructor(status: number, mensaje: string, detalle: string | null = null) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.detalle = detalle;
  }
}

function esRespuestaError(valor: unknown): valor is RespuestaError {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "mensaje" in valor &&
    typeof (valor as { mensaje: unknown }).mensaje === "string"
  );
}

/**
 * Peticion tipada. Lanza ErrorApi ante cualquier respuesta no exitosa para que
 * TanStack Query pueda decidir si reintenta.
 */
export async function request<T>(
  ruta: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${ruta}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (causa) {
    // Fallo de red: el servidor no respondio del todo.
    throw new ErrorApi(
      0,
      "No fue posible comunicarse con el servidor.",
      causa instanceof Error ? causa.message : null,
    );
  }

  if (!respuesta.ok) {
    let mensaje = `La solicitud fallo con codigo ${respuesta.status}.`;
    let detalle: string | null = null;

    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (esRespuestaError(cuerpo)) {
      mensaje = cuerpo.mensaje;
      detalle = cuerpo.detalle;
    }

    throw new ErrorApi(respuesta.status, mensaje, detalle);
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  return (await respuesta.json()) as T;
}

/** Azucar para los verbos con cuerpo. */
export function requestConCuerpo<T>(
  metodo: "POST" | "PATCH" | "PUT",
  ruta: string,
  cuerpo: unknown,
): Promise<T> {
  return request<T>(ruta, { method: metodo, body: JSON.stringify(cuerpo) });
}
