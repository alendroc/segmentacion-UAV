# Datos fuente

Material original del vuelo, **fuera de `public/`** para que no se copie al build.
No se versiona: son archivos pesados. Ver `.gitignore`.

## DJI_20260415111419_0054.JPG

Fotograma nadir del vuelo, 25.2 MB. Es el insumo real del que salen las
versiones reducidas que sí usa la aplicación.

| Dato | Valor | De dónde sale |
|---|---|---|
| Cámara | DJI Zenmuse P1 | EXIF `Make` / `Model` |
| Resolución | 8192 × 5460 px | SOF del JPEG |
| Distancia focal | 35 mm | EXIF `FocalLength` |
| Apertura | f/6.3 | EXIF `FNumber` |
| Posición | 10.268296 N, −85.736666 O | XMP `GpsLatitude` / `GpsLongitude` |
| Altura sobre el terreno | 52.597 m | XMP `RelativeAltitude` |
| Altura absoluta | 96.709 m | XMP `AbsoluteAltitude` |
| Cabeceo del gimbal | −89.90° (nadir) | XMP `GimbalPitchDegree` |

**Derivados**, con sensor de fotograma completo de 35.9 × 24 mm:

- GSD = 52.597 × 35.9 / (35 × 8192) = **0.659 cm/píxel**
- Huella = 8192 × 0.00659 = **53.9 m** × 5460 × 0.00659 = **36.0 m** = **0.194 ha**

## Versiones reducidas

Generadas con el lienzo del navegador y guardadas en `public/simulacion/`:

- `vuelo-lote-norte.jpg` — 1400 × 933, 390 KB. Vista del fotograma en la pantalla de carga.
- `vuelo-lote-norte-mini.jpg` — 560 × 373, 53 KB. Miniatura de la tarjeta de proyecto.

## Advertencia

Es **un fotograma suelto, no un ortomosaico**: no está ortorrectificado ni unido
a otros, y cubre 0.19 ha frente a las 1.2 ha del área de interés simulada. Las
copas sintéticas **no corresponden a los árboles de esta foto**.
