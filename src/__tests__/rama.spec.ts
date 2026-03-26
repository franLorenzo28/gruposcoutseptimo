import { describe, it, expect } from "vitest";
import { getRamaFromProfile, getRamaLabel } from "@/lib/rama";

describe("rama helpers", () => {
  it("prioriza rama_que_educa con variantes de texto", () => {
    expect(getRamaFromProfile({ edad: 25, rama_que_educa: "Caminantes" })).toBe("tropa");
    expect(getRamaFromProfile({ edad: 25, rama_que_educa: "Lobatos" })).toBe("manada");
  });

  it("usa campos legacy cuando no hay rama_que_educa", () => {
    expect(getRamaFromProfile({ edad: 26, patrulla: "Adler" })).toBe("tropa");
    expect(getRamaFromProfile({ edad: 26, equipo_pioneros: "Mision" })).toBe("pioneros");
  });

  it("cae por edad para beneficiarios", () => {
    expect(getRamaFromProfile({ edad: 9 })).toBe("manada");
    expect(getRamaFromProfile({ edad: 13 })).toBe("tropa");
    expect(getRamaFromProfile({ edad: 16 })).toBe("pioneros");
    expect(getRamaFromProfile({ edad: 19 })).toBe("rovers");
  });

  it("prioriza edad en beneficiarios aunque existan campos legacy", () => {
    expect(getRamaFromProfile({ edad: 19, patrulla: "Adler" })).toBe("rovers");
    expect(getRamaFromProfile({ edad: 20, seisena: "Roja" })).toBe("rovers");
  });

  it("retorna sin-rama para edad nula", () => {
    expect(getRamaFromProfile({ edad: null })).toBe("sin-rama");
    expect(getRamaLabel({ edad: null })).toBe("Sin rama");
  });
});
