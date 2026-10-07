import { describe, expect, it } from "vitest";
import {
  formatearArea,
  formatearBytes,
  formatearConfianza,
  formatearCoordenada,
  formatearMetros,
} from "@/shared/lib/formato";

describe("formato", () => {
  it("redondea el area a dos decimales con la coma de es-CR", () => {
    expect(formatearArea(12.456)).toBe("12,46 m²");
  });

  it("formatea longitudes en metros", () => {
    expect(formatearMetros(3.9)).toBe("3,90 m");
  });

  it("distingue la confianza ausente de la confianza cero", () => {
    expect(formatearConfianza(null)).toBe("No aplica");
    expect(formatearConfianza(0)).toBe("0,0%");
    expect(formatearConfianza(0.873)).toBe("87,3%");
  });

  it("rotula las coordenadas CRTM05 como este y norte, no como grados", () => {
    const texto = formatearCoordenada([352_140, 1_128_930]);
    expect(texto).toContain("E,");
    expect(texto).toContain("N");
    expect(texto).not.toContain("°");
  });

  it("escala los tamanos de archivo hasta gigabytes", () => {
    expect(formatearBytes(512)).toBe("512 B");
    expect(formatearBytes(1024)).toBe("1,00 KB");
    expect(formatearBytes(1.6 * 1024 ** 3)).toBe("1,60 GB");
  });
});
