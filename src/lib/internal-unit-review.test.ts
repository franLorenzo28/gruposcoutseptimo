import { describe, expect, it } from "vitest";
import { isSupportedInternalUnit, needsInternalUnitReview } from "./internal-unit-review";

describe("needsInternalUnitReview", () => {
  const activeMember = { account_status: "activo", internal_access: true, role: "user" };

  it("flags active internal accounts without an assigned unit", () => {
    expect(needsInternalUnitReview(activeMember)).toBe(true);
    expect(needsInternalUnitReview({ ...activeMember, rol_adulto: "Familia" })).toBe(true);
    expect(needsInternalUnitReview({ ...activeMember, rol_adulto: "Educador/a", educador_aprobado: false })).toBe(true);
  });

  it("does not flag accounts with a unit, inactive accounts or public accounts", () => {
    expect(needsInternalUnitReview({ ...activeMember, internal_unit: "rover" })).toBe(false);
    expect(needsInternalUnitReview({ ...activeMember, internal_unit: "caminantes" })).toBe(true);
    expect(needsInternalUnitReview({ ...activeMember, account_status: "pendiente_aprobacion" })).toBe(false);
    expect(needsInternalUnitReview({ ...activeMember, internal_access: false })).toBe(false);
  });

  it("does not flag global administrators or approved educators with units", () => {
    expect(needsInternalUnitReview({ ...activeMember, role: "admin" })).toBe(false);
    expect(needsInternalUnitReview({ ...activeMember, role: "mod" })).toBe(false);
    expect(needsInternalUnitReview({ ...activeMember, rol_adulto: "Educador/a", educador_aprobado: true, rama_que_educa: "Manada" })).toBe(false);
    expect(needsInternalUnitReview({ ...activeMember, rol_adulto: "Educador/a", educador_aprobado: true, rama_que_educa: "desconocida" })).toBe(true);
  });
});

it("accepts only current internal units", () => {
  expect(isSupportedInternalUnit("rover")).toBe(true);
  expect(isSupportedInternalUnit("caminantes")).toBe(false);
  expect(isSupportedInternalUnit(null)).toBe(false);
});
