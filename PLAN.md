# PLAN.md

Plan de construcción por fases. **Una fase a la vez.** No adelantar trabajo de fases
posteriores. Cada fase cierra cuando todos sus criterios de aceptación se cumplen y
`npm run typecheck && npm run lint && npm run test` pasa limpio.

Los identificadores RF corresponden al catálogo de requerimientos del informe del TFG. Los
criterios de aceptación están redactados para poder verificarse a mano en el navegador.

---

## Fase 1 — Andamiaje y contrato de datos — **COMPLETADA**

**Objetivo.** Que el navegador muestre datos que llegaron por una petición HTTP interceptada.

**Archivos**
- `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `.oxlintrc.json`
- `src/api/types.ts` — `Proyecto`, `Ortomosaico`, `Copa`, `TrabajoInferencia`, `EstadoTrabajo`
- `src/api/client.ts` — `request<T>()` tipado, `ErrorApi`, base URL por env
- `src/api/endpoints.ts` — firmas de todos los endpoints previstos, aunque devuelvan vacío
- `src/mocks/browser.ts`, `src/mocks/server.ts`, `src/mocks/handlers.ts` — el worker arranca solo
  si `VITE_USE_MOCKS === "true"`
- `src/index.css` — tokens del tema, las dos familias de color de CLAUDE.md §6 ter
- `src/components/ui/` — 14 componentes de shadcn
- `src/components/layout/` — `Shell`, `AvisoSimulacion`, `AlternarTema`, `PantallaPendiente`
- `src/features/proyectos/` — `ProyectosPage`, `useProyectos`, `estadoProyecto`
- `src/features/{carga,procesamiento,visor,exportacion}/` — pantallas marcadoras
- `src/store/uiStore.ts`, `src/lib/formato.ts`, `src/hooks/useMovimientoReducido.ts`
- `src/test/setup.ts`, `src/test/utils.tsx`
- `src/App.tsx` con enrutamiento entre las cinco pantallas

**Criterios de aceptación**
1. `GET /api/proyectos` responde desde MSW y su resultado se ve en pantalla.
2. En la pestaña Red del navegador aparece la petición. No hay datos incrustados en componentes.
3. `grep -r "from.*mocks" src/features src/components src/store` no devuelve nada.
4. `npm run build` compila sin errores.

**Resultado (1 de setiembre de 2026).** Los cuatro criterios se cumplen, verificados en el
navegador. `typecheck`, `lint`, `test` (8 pruebas) y `build` pasan limpio.

**Nota.** Definí los tipos completos aunque las pantallas estén vacías. El contrato primero.

**Deuda consciente que hereda la Fase 2.** Los handlers de copas, trabajos y ortomosaico
devuelven vacío. Se llenan con el generador sintético de la Fase 2 y con las pantallas de la
Fase 8. Las funciones de `endpoints.ts` ya existen todas y no cambian de firma.

---

## Fase 2 — Generador de datos sintéticos — **COMPLETADA**

**Objetivo.** Producir copas sintéticas creíbles, reproducibles y georreferenciadas.

**Archivos**
- `src/mocks/generador.ts` — PRNG con semilla fija, sin `Math.random()`
- `src/mocks/fixtures/lote-norte.geojson`
- `scripts/generar-fixtures.ts` con entrada en `npm run fixtures`

**Requisitos del generador**
- Salida GeoJSON `FeatureCollection` en EPSG:5367, con `crs` declarado.
- Entre 120 y 180 copas sobre un área de interés de ~1.2 ha.
- Dosel abierto y discontinuo: dejar huecos, no una retícula uniforme.
- Polígonos irregulares de 11 a 16 vértices, radios entre 1.8 y 4.2 m.
- Confianza sesgada hacia valores altos, con una cola baja del 15 al 20 %.
- Propiedades por copa: `id`, `confianza`, `areaM2`, `diametroM`, `centroide`, `origen`.

**Criterios de aceptación**
1. Ejecutar `npm run fixtures` dos veces produce archivos byte a byte idénticos.
2. El GeoJSON abre correctamente en QGIS con la georreferenciación esperada.
3. Prueba unitaria: el área calculada por Turf coincide con `areaM2` dentro de 0.01 m².

**Resultado (1 de setiembre de 2026).** 131 copas sobre 1.2 ha en Nicoya, con 6 claros, cobertura
del 29 % y densidad de 109 copas/ha.

1. **Cumple.** Hashes idénticos en dos pasadas seguidas de los tres artefactos.
2. **Sustituido.** No hay QGIS disponible. En su lugar hay una prueba que reproyecta el centro del
   área de interés con proj4 y comprueba que cae en Guanacaste. Verifica lo mismo que uno miraría
   en QGIS, pero no es el criterio literal.
3. **No es satisfacible como está escrito, y no por culpa del generador.** `@turf/area` calcula
   área geodésica sobre una **esfera** de radio 6 378 137 m, no sobre el elipsoide WGS84, mientras
   que `areaM2` es área **plana** en EPSG:5367, que es lo que exige CLAUDE.md §5. Son dos
   magnitudes distintas: la diferencia medida es de hasta 0.43 %, unos 0.2 m² en las copas
   grandes, veinte veces la tolerancia pedida. El criterio se desdobla:
   - **Vinculante**: `areaM2` contra una implementación plana independiente. Coincidencia exacta
     dentro del redondeo a tres decimales. **Cumple.**
   - **De contraste**: contra `turf.area` del polígono reproyectado, con tolerancia del 1 %.
     **Cumple.** Sirve para confirmar la georreferenciación, no para medir área.

**Hallazgo.** Se corrigió un fallo de cancelación catastrófica de punto flotante en el cálculo del
centroide, que lo desplazaba hasta dos metros. Ver CLAUDE.md §5, "Aritmética de coordenadas".

**Artefacto adicional.** `public/simulacion/lote-norte-fondo.svg`: ortomosaico sustituto generado
con la misma semilla, para que la Fase 3 tenga fondo. Ver la Fase 3.

---

## Fase 3 — Mapa base — **CERRADA A MEDIAS**

**Objetivo.** Navegación cartográfica real. **Es la fase de mayor riesgo técnico.**

**Cubre.** RF-14 parcial.

**Archivos**
- `src/lib/geo.ts` — registro de EPSG:5367 con proj4, transformaciones, área, centroide
- `src/components/mapa/MapaBase.tsx`
- `src/features/visor/VisorPage.tsx`

**Alcance**
- Proyección EPSG:5367 registrada y usada como proyección de la vista.
- Capa de fondo con la fuente `GeoTIFF` de OpenLayers apuntando a un COG servido con soporte de
  rangos HTTP. Para desarrollo sirve un COG pequeño de prueba.
- Desplazamiento, acercamiento, barra de escala, lectura de coordenadas en CRTM05.
- Sin copas todavía.

**Criterios de aceptación**
1. La barra de escala muestra metros y se recalcula al acercar.
2. Las coordenadas bajo el puntero corresponden a CRTM05 y son verosímiles para Guanacaste.
3. Un COG de al menos 200 MB se navega con fluidez, cargando solo el área visible.

**Si el punto 3 falla, pará y avisá antes de seguir.** Es el riesgo principal del proyecto y
debe resolverse ahora, no en la última fase.

**Resultado (1 de setiembre de 2026). La fase queda CERRADA A MEDIAS.**

1. **Cumple.** La barra marca metros y la escala cambia con la resolución (1:730 a 1:716 al pasar
   de 0.204 a 0.2 m/píxel).
2. **Cumple.** La lectura bajo el puntero da valores del orden de 340 780 E, 1 122 150 N, con
   rótulo de este y norte en vez de grados.
3. **NO SE PUEDE VERIFICAR. No hay ningún ortomosaico.** Se sustituyó el fondo por un SVG
   sintético georreferenciado y se dejó en `MapaBase.tsx` el punto de conexión de la fuente
   `GeoTIFF` escrito y documentado. **El riesgo principal del proyecto sigue abierto**, y la
   interfaz lo dice de forma visible en el visor.

**Nota sobre la verificación en navegador automatizado.** El zoom de OpenLayers es una animación
sobre `requestAnimationFrame`, que el navegador congela en pestañas ocultas
(`document.visibilityState === "hidden"`). El zoom con los botones y con la rueda hay que
comprobarlo a mano, con la pestaña al frente.

**Mejora incorporada.** Una proyección registrada por proj4 llega a OpenLayers sin extensión, y
sin ella OL no puede derivar su escalera de niveles de zoom. `geo.ts` declara el área de uso de
CRTM05, con prueba que lo protege.

---

## Fase 4 — Copas y panel de detalle ← **siguiente**

**Cubre.** RF-13, RF-14, RF-15, RF-17.

**Archivos**
- `src/components/mapa/CapaCopas.tsx`
- `src/features/visor/PanelDetalle.tsx`
- `src/features/visor/useCopas.ts` (TanStack Query)

**Alcance**
- Capa vectorial con estilos por estado: automática, confianza baja, manual o corregida.
- Selección por clic, resaltado de la copa activa.
- Panel con identificador, área, diámetro medio, centroide georreferenciado, confianza y origen.
- Conteo total visible.

**Criterios de aceptación**
1. Los polígonos se alinean con las copas visibles en la imagen de fondo.
2. Al seleccionar una copa se despliegan todos sus atributos registrados.
3. El conteo mostrado coincide con la cantidad de polígonos renderizados.
4. Los valores de área y diámetro son consistentes con la geometría (verificado en prueba).

---

## Fase 5 — Filtros y métricas agregadas

**Cubre.** RF-16, RF-18.

**Alcance**
- Deslizadores de confianza mínima y área mínima.
- Recálculo en vivo de conteo, densidad por hectárea, área de copa media y cobertura.
- Los filtros ocultan; no modifican ni borran datos.

**Criterios de aceptación**
1. Mover un filtro actualiza el conteo de forma coherente y sin volver a pedir datos al servidor.
2. La densidad equivale al conteo visible dividido entre la superficie del área de interés.
3. Restaurar los filtros al valor inicial devuelve exactamente el conteo original.

---

## Fase 6 — Corrección manual, parte uno

**Cubre.** RF-19, RF-20, RF-22.

**Archivos**
- `src/components/mapa/useDibujo.ts`
- `src/features/visor/BarraHerramientas.tsx`
- `src/store/uiStore.ts` — herramienta activa e historial

**Alcance**
- Eliminar detección con borrado lógico.
- Agregar copa trazando vértices con la interacción `Draw` de OpenLayers, con `Snap`.
- Toda copa creada o modificada a mano queda con `origen` distinto de `"automatico"`.
- Historial de deshacer con Ctrl+Z, mínimo 20 pasos.

**Criterios de aceptación**
1. Eliminar reduce el conteo en una unidad y el cambio persiste al recargar (vía PATCH al mock).
2. Agregar aumenta el conteo en una unidad y la geometría se almacena con la misma estructura
   que las detecciones automáticas.
3. El campo `origen` distingue correctamente ambos casos.
4. Ctrl+Z revierte la última operación sin dejar estado inconsistente.

---

## Fase 7 — Corrección manual, parte dos

**Cubre.** RF-21.

> **La fase más difícil. Asignala a quien mejor maneje geometría computacional y dale tiempo
> completo.**

**Archivos**
- `src/components/mapa/useDivision.ts`
- `src/lib/geo.ts` — funciones `dividirPorLinea()` y `unirCopas()`

**Alcance**
- **Dividir**: seleccionar una copa que agrupó dos árboles y trazar una línea de corte. Turf no
  trae esta operación. Implementar recorte por semiplano (Sutherland–Hodgman aplicado dos veces)
  o usar `polygon-splitter` previa consulta.
- **Unir**: seleccionar dos copas que fragmentaron un mismo árbol y fusionarlas. `turf.union`
  resuelve el caso de polígonos que se tocan; para polígonos disjuntos usar envolvente convexa
  del conjunto de vértices.
- Ambas operaciones actualizan el conteo y recalculan área, diámetro y centroide.

**Criterios de aceptación**
1. Dividir una copa produce dos polígonos válidos, sin autointersecciones, y aumenta el conteo
   en una unidad.
2. La suma de las áreas resultantes es igual al área original dentro de 0.05 m².
3. Unir dos copas produce un polígono válido y reduce el conteo en una unidad.
4. Si la línea de corte no atraviesa el polígono, la operación se rechaza con mensaje al usuario
   y sin alterar el estado.
5. Pruebas unitarias con polígonos cóncavos, no solo convexos.

---

## Fase 8 — Flujo completo y exportación

**Cubre.** RF-01 a RF-12, RF-23, RF-24, RF-25.

**Alcance**
- Pantalla de proyectos, incluyendo estados de lista vacía, en proceso y error de
  georreferencia.
- Pantalla de carga con validación simulada de formato, CRS y resolución.
- Pantalla de procesamiento: MSW devuelve un `TrabajoInferencia` cuyo progreso avanza; el front
  end lo consulta por sondeo con TanStack Query y muestra barra y bitácora.
- Exportación en el cliente: GeoJSON con CRS declarado y CSV de atributos.
- GeoPackage y reporte PDF quedan **deshabilitados con explicación visible**: son
  responsabilidad del back end. No simular su descarga.
- Aviso permanente y visible de que los datos son simulados.

**Criterios de aceptación**
1. El GeoJSON exportado abre en QGIS con la georreferenciación correcta.
2. El CSV abre en una hoja de cálculo con una fila por copa y encabezados legibles.
3. La exportación incluye únicamente las detecciones visibles con los filtros activos, y el
   archivo declara cuántas de cuántas se exportaron.
4. Durante el procesamiento el usuario puede navegar por la aplicación sin bloqueo.
5. Los tres estados de la lista de proyectos se pueden reproducir desde el mock.

---

## Fase 9 — Cierre (opcional, si queda tiempo)

- Pruebas de extremo a extremo con Playwright cubriendo el recorrido completo.
- Revisión de accesibilidad por teclado en todo el flujo.
- `README.md` con instrucciones de ejecución y una sección que documente qué es simulado y qué
  sería real, redactada para el anexo del informe.

---

## Trazabilidad — resumen

| Fase | Requerimientos |
|---|---|
| 1 | contrato de datos |
| 2 | datos sintéticos |
| 3 | RF-14 (parcial) |
| 4 | RF-13, RF-14, RF-15, RF-17 |
| 5 | RF-16, RF-18 |
| 6 | RF-19, RF-20, RF-22 |
| 7 | RF-21 |
| 8 | RF-01 a RF-12, RF-23, RF-24, RF-25 |
