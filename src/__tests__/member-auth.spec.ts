import { describe, expect, it } from "vitest";
import {
  mapEducatorRamaToMiembroRama,
  mapEducatorRamasToMiembroRamas,
  resolveMemberAccessFromProfile,
} from "@/lib/member-auth";

describe("member auth access rules", () => {
  it("beneficiarios menores de 21 ingresan por rama de edad sin admin", () => {
    const result = resolveMemberAccessFromProfile({ edad: 16 });
    expect(result.allowed).toBe(true);
    expect(result.rama).toBe("pioneros");
    expect(result.isRamaAdmin).toBe(false);
    expect(result.accessType).toBe("beneficiario");
  });

  it("adultos sin rol no pueden ingresar", () => {
    const result = resolveMemberAccessFromProfile({ edad: 24, rol_adulto: "" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("rol");
  });

  it("adultos no educadores no tienen acceso al area de miembros", () => {
    const result = resolveMemberAccessFromProfile({
      edad: 35,
      rol_adulto: "Miembro del Comite",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("exclusiva");
  });

  it("educador adulto con rama asignada obtiene admin de su dashboard", () => {
    const result = resolveMemberAccessFromProfile({
      edad: 29,
      rol_adulto: "Educador/a",
      rama_que_educa: "tropa",
    });
    expect(result.allowed).toBe(true);
    expect(result.rama).toBe("tropa");
    expect(result.isRamaAdmin).toBe(true);
    expect(result.accessType).toBe("educador");
  });

  it("educador adulto puede deducir rama por campos legacy", () => {
    const result = resolveMemberAccessFromProfile({
      edad: 30,
      rol_adulto: "Educador/a",
      seisena: "Roja",
    });
    expect(result.allowed).toBe(true);
    expect(result.rama).toBe("lobatos");
    expect(result.isRamaAdmin).toBe(true);
  });

  it("mapea ramas de educador a ramas de miembros", () => {
    expect(mapEducatorRamaToMiembroRama("manada")).toBe("lobatos");
    expect(mapEducatorRamaToMiembroRama("tropa")).toBe("tropa");
    expect(mapEducatorRamaToMiembroRama("pioneros")).toBe("pioneros");
    expect(mapEducatorRamaToMiembroRama("rovers")).toBe("rover");
  });

  it("admite multiples unidades de educador", () => {
    const ramas = mapEducatorRamasToMiembroRamas("manada,tropa;rovers");
    expect(ramas).toEqual(["lobatos", "tropa", "rover"]);
  });
});
