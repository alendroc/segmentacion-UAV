import type { Copa, ExtensionGeografica } from "@/shared/api/types";
import { aparienciaDeCopa } from "@/entities/copa";

export interface PropsMiniaturaCopa {
  copa: Copa;
  /** Imagen de fondo georreferenciada y su extension, del ortomosaico. */
  urlImagen: string;
  extension: ExtensionGeografica;
  /** Cuantos radios de copa se ven alrededor. */
  holgura?: number;
}

/**
 * Recorte del ortomosaico alrededor de una copa, con su poligono encima.
 *
 * Es la vista que responde a "quiero ver la segmentacion de este arbol": el
 * mapa completo muestra el conjunto, esto muestra un individuo.
 *
 * El SVG trabaja en un espacio local en metros donde el eje Y crece hacia
 * abajo, al reves que EPSG:5367. La conversion es u = X - minX, v = maxY - Y.
 */
export function MiniaturaCopa({
  copa,
  urlImagen,
  extension,
  holgura = 2.1,
}: PropsMiniaturaCopa) {
  const anchoM = extension.maxX - extension.minX;
  const altoM = extension.maxY - extension.minY;

  const u = (x: number) => x - extension.minX;
  const v = (y: number) => extension.maxY - y;

  const radio = copa.diametroM / 2;
  const lado = radio * 2 * holgura;
  const centroU = u(copa.centroide[0]);
  const centroV = v(copa.centroide[1]);

  const puntos = (copa.geometria.coordinates[0] as [number, number][])
    .map(([x, y]) => `${u(x).toFixed(3)},${v(y).toFixed(3)}`)
    .join(" ");

  const apariencia = aparienciaDeCopa(copa);
  const color = `var(--${apariencia.token})`;

  return (
    <svg
      viewBox={`${centroU - lado / 2} ${centroV - lado / 2} ${lado} ${lado}`}
      className="aspect-square w-full rounded-md border bg-muted"
      role="img"
      aria-label={`Recorte de la imagen centrado en la copa ${copa.id}, con su poligono de segmentacion`}
    >
      <image
        href={urlImagen}
        x={0}
        y={0}
        width={anchoM}
        height={altoM}
        preserveAspectRatio="none"
      />
      <polygon
        points={puntos}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={lado / 110}
        strokeDasharray={apariencia.discontinuo ? `${lado / 40} ${lado / 55}` : undefined}
        vectorEffect="non-scaling-stroke"
        strokeOpacity={apariencia.opacidad}
      />
      {(copa.geometria.coordinates[0] as [number, number][]).map(([x, y], i) => (
        <circle
          key={i}
          cx={u(x)}
          cy={v(y)}
          r={lado / 130}
          fill={color}
          fillOpacity={apariencia.opacidad}
        />
      ))}
      <circle
        cx={centroU}
        cy={centroV}
        r={lado / 150}
        fill="var(--background)"
        stroke={color}
        strokeWidth={lado / 300}
      />
    </svg>
  );
}
