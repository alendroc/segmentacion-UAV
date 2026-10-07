import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import { useEffect, useRef } from "react";
import type { Copa } from "@/shared/api/types";
import { useMapa } from "./contextoMapa";
import { aparienciaDeCopa } from "@/entities/copa";
import { tokenColor, tokenColorAlpha } from "@/shared/lib/colores";
import { CRTM05 } from "@/shared/lib/geo";

export interface PropsCapaCopas {
  copas: Copa[];
  seleccionadaId: string | null;
  onSeleccionar: (copaId: string | null) => void;
}

const formato = new GeoJSON({
  dataProjection: CRTM05,
  featureProjection: CRTM05,
});

function estiloDeCopa(copa: Copa, seleccionada: boolean): Style {
  const apariencia = aparienciaDeCopa(copa);
  const color = tokenColor(apariencia.token);

  return new Style({
    stroke: new Stroke({
      color: seleccionada ? tokenColor("foreground") : color,
      width: seleccionada ? 3.2 : 1.8,
      lineDash: apariencia.discontinuo ? [5, 4] : undefined,
    }),
    fill: new Fill({
      color: seleccionada
        ? tokenColorAlpha(apariencia.token, 0.45)
        : tokenColorAlpha(apariencia.token, apariencia.opacidad * 0.14),
    }),
  });
}

/**
 * Capa vectorial de copas sobre el mapa (RF-13, RF-14).
 *
 * No renderiza nada en el DOM de React: toma la instancia de OpenLayers del
 * contexto de `MapaBase` y le agrega su capa.
 */
export function CapaCopas({
  copas,
  seleccionadaId,
  onSeleccionar,
}: PropsCapaCopas) {
  const mapa = useMapa();

  // La funcion de estilo vive dentro del efecto que crea la capa, pero tiene
  // que leer la seleccion actual. Con una referencia nunca queda obsoleta y la
  // capa no se reconstruye en cada clic.
  const refSeleccion = useRef(seleccionadaId);
  const refSeleccionar = useRef(onSeleccionar);

  // Las referencias se actualizan en un efecto, nunca durante el render. Este
  // efecto se declara antes que el de repintado, asi que corre antes.
  useEffect(() => {
    refSeleccion.current = seleccionadaId;
    refSeleccionar.current = onSeleccionar;
  }, [seleccionadaId, onSeleccionar]);

  useEffect(() => {
    if (!mapa) return;

    const fuente = new VectorSource({
      features: copas.map((copa) => {
        const rasgo = new Feature({
          geometry: formato.readGeometry(copa.geometria),
        });
        rasgo.setId(copa.id);
        rasgo.set("copa", copa);
        return rasgo;
      }),
    });

    const capa = new VectorLayer({
      source: fuente,
      style: (rasgo) => {
        const copa = rasgo.get("copa") as Copa;
        return estiloDeCopa(copa, copa.id === refSeleccion.current);
      },
      zIndex: 10, // Siempre encima de la imagen de fondo.
    });

    mapa.addLayer(capa);

    const alHacerClic = (evento: MapBrowserEvent) => {
      const rasgo = mapa.forEachFeatureAtPixel(
        evento.pixel,
        (candidato) => candidato,
        { layerFilter: (l) => l === capa, hitTolerance: 3 },
      );
      const copa = rasgo?.get("copa") as Copa | undefined;
      refSeleccionar.current(copa ? copa.id : null);
    };

    const alMover = (evento: MapBrowserEvent) => {
      if (evento.dragging) return;
      const elemento = mapa.getTargetElement();
      if (!elemento) return;
      const hay = mapa.hasFeatureAtPixel(evento.pixel, {
        layerFilter: (l) => l === capa,
        hitTolerance: 3,
      });
      elemento.style.cursor = hay ? "pointer" : "";
    };

    mapa.on("click", alHacerClic);
    mapa.on("pointermove", alMover);

    return () => {
      mapa.un("click", alHacerClic);
      mapa.un("pointermove", alMover);
      mapa.removeLayer(capa);
      capa.dispose();
    };
  }, [mapa, copas]);

  // Un repintado basta: la funcion de estilo ya lee la referencia.
  useEffect(() => {
    if (!mapa) return;
    mapa.getLayers().forEach((capa) => {
      if (capa instanceof VectorLayer) capa.changed();
    });
  }, [mapa, seleccionadaId]);

  return null;
}
