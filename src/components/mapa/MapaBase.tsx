import "ol/ol.css";
import ScaleLine from "ol/control/ScaleLine";
import { defaults as controlesPorDefecto } from "ol/control/defaults";
import ImageLayer from "ol/layer/Image";
import Map from "ol/Map";
import ImageStatic from "ol/source/ImageStatic";
import View from "ol/View";
import { useEffect, useRef, useState } from "react";
import { proyeccionCrtm05, type Posicion } from "@/lib/geo";
import { formatearCoordenada } from "@/lib/formato";
import { cn } from "@/lib/utils";

export interface PropsMapaBase {
  /** Imagen de fondo georreferenciada, tal como la declara el ortomosaico. */
  urlImagen: string;
  /** Extension del ortomosaico en EPSG:5367: [minX, minY, maxX, maxY]. */
  extension: [number, number, number, number];
  className?: string;
}

/**
 * Instancia de OpenLayers en EPSG:5367.
 *
 * SOBRE LA CAPA DE FONDO. El destino de este proyecto es un COG servido con
 * soporte de rangos HTTP, leido con la fuente `GeoTIFF` de OpenLayers, que
 * descarga solo las teselas visibles. Mientras no exista el archivo, se carga
 * la imagen completa con `ImageStatic`. Cambiar de una a otra es sustituir la
 * construccion de la fuente:
 *
 *   import GeoTIFF from "ol/source/GeoTIFF";
 *   const fuente = new GeoTIFF({
 *     sources: [{ url: urlImagen }],
 *     projection: proyeccion,
 *     convertToRGB: true,
 *   });
 *   // y la capa pasa a ser TileLayer en vez de ImageLayer.
 *
 * El resto del componente no cambia. El criterio 3 de la Fase 3 —navegar un
 * COG de 200 MB con fluidez— sigue SIN VERIFICAR hasta que haya un ortomosaico
 * real: es el riesgo principal del proyecto y no se puede dar por resuelto.
 */
export function MapaBase({ urlImagen, extension, className }: PropsMapaBase) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [coordenada, setCoordenada] = useState<Posicion | null>(null);
  const claveExtension = extension.join(",");

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;

    const [minX, minY, maxX, maxY] = claveExtension.split(",").map(Number) as [
      number,
      number,
      number,
      number,
    ];
    const proyeccion = proyeccionCrtm05();

    // Margen del 15 % para que el lote no quede pegado al borde del visor.
    const margenX = (maxX - minX) * 0.15;
    const margenY = (maxY - minY) * 0.15;

    const vista = new View({
      projection: proyeccion,
      center: [(minX + maxX) / 2, (minY + maxY) / 2],
      resolution: 0.05,
      minResolution: 0.005,
      maxResolution: 1,
      extent: [minX - margenX, minY - margenY, maxX + margenX, maxY + margenY],
      showFullExtent: true,
      constrainResolution: false,
    });

    const mapa = new Map({
      target: elemento,
      layers: [
        new ImageLayer({
          source: new ImageStatic({
            url: urlImagen,
            imageExtent: [minX, minY, maxX, maxY],
            projection: proyeccion,
          }),
        }),
      ],
      view: vista,
      controls: controlesPorDefecto({ rotate: false }).extend([
        new ScaleLine({ units: "metric", bar: true, steps: 4, text: true }),
      ]),
    });

    vista.fit([minX, minY, maxX, maxY], { padding: [24, 24, 24, 24] });

    // La lectura de coordenadas se limita a un cuadro por refresco: sin esto,
    // pointermove dispara un render por cada pixel recorrido.
    let pendiente = false;
    const alMover = (evento: { coordinate: number[] }) => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        setCoordenada([evento.coordinate[0], evento.coordinate[1]]);
      });
    };
    mapa.on("pointermove", alMover);
    const alSalir = () => setCoordenada(null);
    elemento.addEventListener("pointerleave", alSalir);

    return () => {
      elemento.removeEventListener("pointerleave", alSalir);
      mapa.setTarget(undefined);
      mapa.dispose();
    };
  }, [urlImagen, claveExtension]);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border", className)}>
      <div
        ref={contenedor}
        tabIndex={0}
        role="application"
        aria-label="Mapa del ortomosaico. Use las flechas para desplazarse y las teclas mas y menos para acercar."
        className="size-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <p
        aria-live="off"
        className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-background/85 px-2 py-1 font-mono text-xs text-muted-foreground tabular-nums backdrop-blur"
      >
        {coordenada
          ? formatearCoordenada(coordenada)
          : "Mueva el puntero sobre el mapa"}
        <span className="ml-2 opacity-70">CRTM05</span>
      </p>
    </div>
  );
}
