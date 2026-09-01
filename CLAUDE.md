# CLAUDE.md

Contexto y reglas para trabajar en este repositorio. Leé este archivo completo antes de
escribir código.

---

## 1. Qué es este proyecto

Prototipo de interfaz web para un sistema de **segmentación por instancia y conteo de copas
individuales de árboles** en imágenes de VANT del bosque tropical seco de la Región Chorotega,
Costa Rica. Corresponde al Trabajo Final de Graduación G51, Licenciatura en Informática,
Universidad Nacional.

**El modelo de aprendizaje profundo todavía no existe.** No está entrenado y no hay back end.
Este repositorio construye únicamente la capa de presentación, operando contra una API simulada.
El objetivo es validar los requerimientos de visualización y corrección antes de que el modelo
esté disponible.

No entrenés modelos. No implementés inferencia. No escribas código de Python. Si una tarea
parece requerirlo, es señal de que se salió del alcance: pará y avisá.

---

## 2. La regla de oro

**El front end se comunica siempre por HTTP contra endpoints, nunca contra datos incrustados.**

Los datos sintéticos se sirven mediante MSW (Mock Service Worker), que intercepta las peticiones
a nivel de red. El código de la interfaz no sabe —y no debe poder saber— que el back end no
existe.

Consecuencia práctica, y es una regla dura:

> Ningún archivo dentro de `src/features/`, `src/components/` o `src/store/` puede importar
> nada de `src/mocks/`.

Si necesitás datos en un componente, pedilos por el cliente de API. Si te ves tentado a importar
un fixture directamente, la solución correcta es agregar un handler a MSW.

Cuando el back end real exista, se apaga MSW con una variable de entorno y no cambia nada más.

---

## 3. Stack fijo

| Capa | Herramienta | Nota |
|---|---|---|
| Base | Vite + React 19 + TypeScript | modo `strict` activado |
| Mapa | OpenLayers | elegido por edición de geometrías y soporte de CRS arbitrario |
| Proyecciones | proj4 + ol/proj/proj4 | registra EPSG:5367 |
| Estado del servidor | TanStack Query | caché, reintentos, sondeo del progreso |
| Estado de UI | Zustand | herramienta activa, filtros, selección |
| API simulada | MSW | handlers espejo de los endpoints reales |
| Geometría | Turf.js | área, centroide, unión |
| Pruebas | Vitest + Testing Library | Playwright solo en la fase final |
| Estilos | Tailwind CSS v4 | configuración CSS-first con `@theme`, sin `tailwind.config.js` |
| Componentes | shadcn/ui | **no es una dependencia**: el CLI copia el código a `src/components/ui/` |
| Primitivas | Radix UI | accesibilidad y teclado; se instalan por componente |
| Animación | Motion | acotada; ver §6 bis |
| Iconos | lucide-react | |
| Enrutamiento | react-router-dom | cinco pantallas con URL propia y enlazable |
| Linter | oxlint | viene con el andamiaje de Vite; sustituye a ESLint |

**No agregues dependencias sin preguntar primero.** Cada una hay que justificarla por escrito en
el informe del TFG; el apéndice A de este archivo lleva ese registro. En particular: no instalés
Leaflet, Mapbox, MapLibre, Redux ni ORMs.

Sobre shadcn/ui: **no es una librería de componentes instalada**. El CLI copia el código fuente a
`src/components/ui/` y a partir de ahí es código propio del repositorio, versionado y
modificable. Lo que sí son dependencias reales son Tailwind, Radix, `cva`, `clsx`,
`tailwind-merge`, `lucide-react` y `motion`.

**Animate UI queda diferido a la Fase 9.** Es un proyecto joven y su superficie es más difícil de
justificar por escrito que la de shadcn. Si en la Fase 9 sobra tiempo, se evalúa entonces.

Excepción prevista: si Turf no resuelve la división de polígono por línea, se permite
`polygon-splitter` o una implementación propia de recorte por semiplano. Preguntá antes.

---

## 4. Estructura de carpetas

```
src/
  api/
    types.ts          Modelos de dominio. Fuente única de verdad.
    client.ts         fetch tipado. Única puerta al back end.
    endpoints.ts      Funciones por endpoint. Nada de fetch suelto fuera de aquí.
  mocks/
    browser.ts        setupWorker
    server.ts         setupServer, para las pruebas
    handlers.ts       Handlers MSW
    fixtures.ts       Carga los fixtures y los adapta al modelo de dominio
    generador.ts      Generación sintética con semilla fija
    fondoSimulado.ts  Ortomosaico sustituto en SVG. Ver §9
    fixtures/         GeoJSON producido por el generador
  features/
    proyectos/        RF-01
    carga/            RF-02 a RF-05
    procesamiento/    RF-06 a RF-12
    visor/            RF-13 a RF-22
      estilosCopa.ts  Estado de una copa y su apariencia. Sin React
      PanelDetalle.tsx
      MiniaturaCopa.tsx  Recorte del ortomosaico alrededor de una copa
    exportacion/      RF-23 a RF-25
  components/
    layout/
      Shell.tsx       Cabecera, migas de pan y pasos del flujo
      MigasDePan.tsx  Camino de vuelta al inicio desde cualquier punto
      AccionesDePaso.tsx  Anterior / siguiente / salir al inicio
    mapa/
      contextoMapa.ts Instancia de OL compartida con las capas hijas
      MapaBase.tsx    Instancia de OL, proyección, capa de fondo
      CapaCopas.tsx   Capa vectorial y estilos por estado
      useDibujo.ts    Draw / Modify / Snap
      useDivision.ts  Corte de polígono por línea
    ui/               Botones, paneles, campos. Sin lógica de dominio.
  store/
    uiStore.ts
  hooks/
    useMovimientoReducido.ts  Preferencia de movimiento. Único lector. Ver §6 bis
  lib/
    utils.ts          Helper `cn()` que crea shadcn. No lo borrés: lo usan todos los componentes
    geometriaPlana.ts Área, diámetro, centroide. SIN IMPORTS. Ver la nota de abajo
    geo.ts            Registro de EPSG:5367, transformaciones de CRS. Reexporta geometriaPlana
    colores.ts        Puente entre los tokens del tema y el lienzo del mapa
    pasos.ts          El flujo de trabajo, declarado una sola vez
    formato.ts        Formateo de números y coordenadas
  test/
    setup.ts          Arranque de Vitest. Registra MSW para TODAS las pruebas
    utils.tsx         `renderConProveedores()`
```

`src/components/ui/` es exactamente el destino por defecto de shadcn: no hay que mover nada. Ese
directorio es código vendorizado; se regenera con el CLI y no se edita a mano.

`src/test/setup.ts` es el único punto donde se registra MSW en las pruebas. Gracias a eso, ni
siquiera los archivos de prueba de `features/` necesitan importar `mocks/` y la regla de oro se
verifica con un solo `grep`.

`scripts/generar-fixtures.ts` vive fuera de `src/` y se ejecuta con `npm run fixtures`.

`datos-fuente/` guarda el material original del vuelo —fotogramas de la cámara, y en su día el
ortomosaico— **fuera de `public/`**, para que no se copie al build, y fuera del repositorio por
peso. Ver `datos-fuente/LEEME.md`. Lo que la aplicación sirve son las versiones reducidas de
`public/simulacion/`.

**Por qué `geometriaPlana.ts` está separado de `geo.ts`.** El script de fixtures corre bajo Node
plano y no puede cargar proj4 ni OpenLayers. La matemática pura, que no necesita ninguna de las
dos, vive en un archivo sin un solo `import`; `geo.ts` la reexporta para que el resto de la
aplicación siga teniendo una sola puerta.

Una carpeta por `feature`, y cada `feature` es dueña de sus pantallas y sus hooks. Lo compartido
sube a `components/ui` o a `lib`.

---

## 5. Dominio: reglas que no se negocian

**Sistema de referencia.** Todo se almacena y se calcula en **EPSG:5367 (CR05 / CRTM05)**.
Registralo con proj4 al arrancar la aplicación. Nunca calculés área ni distancia en EPSG:4326 ni
en Web Mercator: introduce error sistemático y este es un trabajo forestal donde las áreas de
copa importan.

**Modelo de datos.** `src/api/types.ts` es la fuente única de verdad. Si un tipo cambia, cambia
ahí y se propaga. No dupliqués definiciones.

```ts
export type OrigenCopa = "automatico" | "manual" | "corregido";

export interface Copa {
  id: string;
  proyectoId: string;
  geometria: GeoJSON.Polygon;   // coordenadas en EPSG:5367
  confianza: number | null;      // null cuando origen !== "automatico"
  areaM2: number;
  diametroM: number;
  centroide: [number, number];
  origen: OrigenCopa;
  eliminada: boolean;            // borrado lógico; ver "Eliminación" más abajo
}
```

El campo `origen` existe desde el primer día. Es el requerimiento RF-22 y no se agrega después.
El campo `eliminada` tampoco: es lo que hace posible la regla de eliminación de esta misma
sección.

**Diámetro de copa.** `diametroM` es el **diámetro de círculo equivalente**, `2·√(A/π)`. Se
prefiere sobre el promedio de dos anchos perpendiculares porque no depende de la orientación en
que se midan y es reproducible a partir de la sola geometría. Hay que poder defenderlo en el
informe.

**Aritmética de coordenadas.** Toda fórmula que combine coordenadas proyectadas se calcula
**respecto de un origen local**, restando el primer vértice antes de operar. En EPSG:5367 una copa
vive alrededor de (340 000, 1 122 000): los productos cruzados rondan 3.8·10¹¹ y la diferencia se
pierde en la precisión del `double`. Sin esa traslación, el centroide llega a caer metros fuera
del polígono. `geometriaPlana.ts` ya lo hace; cualquier función nueva tiene que hacerlo también.

**Umbral de confianza baja.** 0.70. El generador separa las dos poblaciones en 0.62 y 0.72, así
que ese valor las distingue sin ambigüedad. Vive en `features/visor/estilosCopa.ts` y no se
duplica.

**Filtros.** Los filtros de confianza y área **ocultan**, no borran. El conteo visible se
recalcula; el dato persiste.

**Eliminación.** Eliminar una detección es borrado lógico, no físico. El registro conserva la
copa marcada para que la exportación pueda reportar cuántas se descartaron.

---

## 6. Convenciones de código

- TypeScript estricto. **Prohibido `any`.** Si no sabés el tipo, definilo.
- Componentes funcionales con hooks. Sin componentes de clase.
- Nombres de dominio en español (`Copa`, `Proyecto`, `areaM2`, `confianza`). Nombres técnicos en
  inglés cuando es convención del ecosistema (`useEffect`, `queryKey`, `handlers`).
- Estilos con clases utilitarias de Tailwind. Variantes de componente con `cva`. La composición
  de clases va siempre por el helper `cn()` de `src/lib/utils.ts`, nunca por concatenación de
  strings. Sin CSS-in-JS y sin `*.module.css`. El CSS suelto se reserva para los tokens del tema
  y para las anulaciones de `ol/ol.css`.
- Un componente por archivo. Si un archivo pasa de ~200 líneas, partilo.
- Sin comentarios que expliquen lo obvio. Comentá el *porqué*, no el *qué*.
- Los textos visibles al usuario van en español de Costa Rica, con tratamiento formal.

**Accesibilidad**: todo control operable con teclado, `aria-label` en los botones de icono, foco
visible. Las herramientas del mapa tienen atajos: V navegar, S seleccionar, A agregar,
D dividir, U unir, E eliminar.

### 6 bis. Política de movimiento

La animación es discreta y acotada: transiciones de pantalla, apertura de paneles y feedback de
acción. **Cero animación sobre el canvas del mapa**: el ortomosaico es un COG de ~1.6 GB y el
repintado compite con la carga por rangos HTTP.

La preferencia `prefers-reduced-motion` se lee en un solo lugar, el hook
`useMovimientoReducido()`, y además `src/index.css` la respeta de forma global. Ninguna
información puede depender de que una animación ocurra.

### 6 ter. Las dos familias de color

El tema vive en `src/index.css` y está partido en dos familias que **no se mezclan nunca**:

**Familia A, el chrome de la interfaz.** Verdes y tierras desaturados, en los nombres de token que
espera shadcn (`--background`, `--primary`, `--muted`, `--border`, `--ring`…). Se redefine en
`.dark`.

**Familia B, la semántica cartográfica.** `--copa-automatica`, `--copa-confianza-baja`,
`--copa-manual`, `--copa-corregida` y `--copa-eliminada`. Son deliberadamente **no verdes**: el
ortomosaico es vegetación verde y un polígono verde sobre dosel verde no se lee. Se declaran una
sola vez y **no se redefinen en `.dark`**: el significado de un color de copa no puede depender
del tema que eligió la persona usuaria.

La distinción tampoco se apoya solo en el color. `confianza baja` lleva además trazo discontinuo
y `eliminada` opacidad reducida, para no depender de la percepción cromática.

---

## 7. Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # compilación de producción — debe pasar sin errores de TS
npm run fixtures   # regenera los datos sintéticos. Debe dar archivos idénticos
npm run test       # Vitest, una pasada
npm run test:watch # Vitest en modo continuo
npm run lint       # oxlint
npm run typecheck  # tsc -b --noEmit
```

Antes de dar por terminada cualquier tarea: `npm run typecheck && npm run lint && npm run test`.
Si alguno falla, la tarea no está terminada.

---

## 8. Cómo trabajar

1. Leé `PLAN.md` y trabajá **una sola fase a la vez**. No adelantés fases.
2. Al empezar una fase, decí qué archivos vas a crear o modificar y esperá confirmación.
3. Al terminar, corré las verificaciones y reportá el resultado contra los criterios de
   aceptación de esa fase, uno por uno.
4. Si un criterio no se cumple, decilo explícitamente. No lo des por bueno.
5. Si encontrás una contradicción entre `PLAN.md` y este archivo, `CLAUDE.md` manda. Avisá.

**No hagas commit sin que se te pida.** No creés ramas ni hagas push por iniciativa propia.

---

## 9. Advertencias específicas

- El ortomosaico real pesa ~1.6 GB. No intentés cargarlo completo en el navegador. La ruta es
  COG servido con soporte de rangos HTTP, mediante la fuente `GeoTIFF` de OpenLayers. Esto se
  prueba en la Fase 3, no al final.
- Los datos sintéticos usan **semilla fija**. La misma semilla debe producir siempre las mismas
  copas: los fixtures sirven también como datos de prueba automatizada.
- El bosque tropical seco tiene dosel **abierto y discontinuo**, con parte del arbolado
  caducifolio. Si generás datos o gráficos de ejemplo, respetá esa condición: no es decorado,
  es lo que diferencia este caso de la selva húmeda donde se entrenó detectree2.
- La interfaz debe indicar de forma visible y permanente que los datos son simulados y que no hay
  modelo ejecutándose. No lo quités.

---

## Apéndice A. Dependencias y su justificación

Registro exigido por §3. Cada entrada se traslada al informe del TFG.

| Paquete | Por qué está |
|---|---|
| `tailwindcss`, `@tailwindcss/vite` | Sistema de tokens de diseño con tema claro y oscuro coherente. Prerrequisito de shadcn |
| shadcn/ui *(código copiado, no dependencia)* | Componentes accesibles cuyo código queda en el repositorio y bajo control del autor |
| `radix-ui` | Accesibilidad por teclado y `aria-*` correctos, exigidos por §6 |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variantes tipadas y composición de clases sin colisiones |
| `lucide-react` | Iconografía consistente para la barra de herramientas del visor |
| `motion` | Transiciones acotadas por §6 bis, con respeto a `prefers-reduced-motion` |
| `react-router-dom` | Cinco pantallas con URL propia y enlazable; el proyecto se navega por identificador |
| `@tanstack/react-query` | Estado del servidor: caché, reintentos y sondeo del progreso de inferencia |
| `zustand` | Estado de interfaz: herramienta activa, filtros, selección, historial |
| `msw` | API simulada a nivel de red, condición para la regla de oro de §2 |
| `@types/geojson` | Tipos de `GeoJSON.Polygon` que usa el modelo de dominio de §5 |
| `vitest`, `jsdom`, `@testing-library/*` | Pruebas unitarias y de componente |
| `oxlint` | Linter del andamiaje de Vite. Sustituye a ESLint y evita seis dependencias más |
| `ol` | Mapa: edición de geometrías y soporte de CRS arbitrario |
| `proj4`, `@types/proj4` | Registro de EPSG:5367 y transformaciones |
| `@turf/area`, `@turf/helpers` | Solo en pruebas: contraste independiente del área. Ver la nota de §5 |

Pendiente de instalar en la Fase 7, ya previsto en §3: el resto de `@turf/*` para unión y
división de polígonos.

---

## Apéndice B. Registro de enmiendas

**1 de setiembre de 2026 — adopción de shadcn/ui.** Se levantó la prohibición de Tailwind y de
las librerías de componentes que traía §3, y se sustituyó la regla de CSS modules de §6. Motivo:
construir a mano componentes accesibles para las cinco pantallas consumía tiempo que el proyecto
necesita en las Fases 3 y 7, que son las de riesgo técnico real. Se agregaron §6 bis y §6 ter.

**1 de setiembre de 2026 — React 19 y oxlint.** El andamiaje de `create-vite` 9 genera React 19 y
oxlint. Se aceptaron ambos: React 19 es lo que soporta shadcn hoy, y oxlint cubre `npm run lint`
sin sumar dependencias. §3 y §7 quedaron actualizados.

**1 de setiembre de 2026 — geometría plana separada de `geo.ts`.** El script de fixtures corre
bajo Node plano y no puede cargar proj4 ni OpenLayers, así que la matemática pura se movió a
`lib/geometriaPlana.ts`, sin ningún `import`. `geo.ts` la reexporta. Ver §4.

**1 de setiembre de 2026 — el área de Turf no es referencia de área.** Turf mide sobre una esfera,
no sobre el elipsoide. Para las áreas de copa manda el cálculo plano en EPSG:5367. Ver §5 y el
resultado de la Fase 2 en `PLAN.md`.

**1 de setiembre de 2026 — fondo del mapa sustituto.** Sin ortomosaico disponible, el visor carga
un SVG sintético georreferenciado generado con la misma semilla que las copas. El punto de
conexión del COG queda escrito en `MapaBase.tsx`. El criterio de rendimiento sobre COG de la
Fase 3 **sigue sin verificar**: es el riesgo principal del proyecto.

**1 de setiembre de 2026 — fotograma real del vuelo.** Se incorporó `DJI_20260415111419_0054.JPG`,
una toma nadir real de Guanacaste con Zenmuse P1. Vive en `datos-fuente/`, fuera de `public/` y
fuera del repositorio: 25 MB en `public/` acababan copiados al build. La aplicación sirve dos
versiones reducidas desde `public/simulacion/`. **No es un ortomosaico**: es un fotograma suelto
de 0.19 ha, y las copas sintéticas no corresponden a sus árboles. Ver `datos-fuente/LEEME.md`.
