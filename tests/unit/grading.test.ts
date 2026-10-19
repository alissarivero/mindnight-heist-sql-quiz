import { describe, expect, it } from "vitest";
import { gradeResult, normalizeCell } from "@/lib/grading";

describe("normalizeCell", () => {
  it("canonicalizes numbers", () => {
    expect(normalizeCell("21.000000")).toBe("21");
    expect(normalizeCell(21)).toBe("21");
    expect(normalizeCell("0.610")).toBe("0.61");
  });
  it("normalizes timestamps and nulls", () => {
    expect(normalizeCell("2026-03-14T00:41:00")).toBe("2026-03-14 00:41:00");
    expect(normalizeCell(null)).toBe("NULL");
  });
});

describe("gradeResult", () => {
  const expected = [["Ann", "1"], ["Bob", "2"]];

  it("ignores row order and numeric formatting", () => {
    expect(gradeResult([["Bob", 2], ["Ann", "1.0"]], 2, expected).match).toBe(true);
  });
  it("reports missing and extra rows", () => {
    const g = gradeResult([["Ann", 1], ["Cat", 3]], 2, expected);
    expect(g.match).toBe(false);
    expect(g.missing).toEqual([["Bob", "2"]]);
    expect(g.extra).toEqual([["Cat", "3"]]);
  });
  it("treats duplicates as a multiset", () => {
    expect(gradeResult([["Ann", 1], ["Ann", 1], ["Bob", 2]], 2, expected).extra).toEqual([["Ann", "1"]]);
  });
  it("requires the same column count", () => {
    expect(gradeResult([["Ann"], ["Bob"]], 1, expected).match).toBe(false);
  });
});
