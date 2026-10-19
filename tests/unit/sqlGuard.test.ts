import { describe, expect, it } from "vitest";
import { checkSingleStatement } from "@/lib/sqlGuard";

describe("checkSingleStatement", () => {
  it("accepts one statement, with or without a trailing semicolon", () => {
    expect(checkSingleStatement("SELECT 1")).toBeNull();
    expect(checkSingleStatement("SELECT 1;  \n")).toBeNull();
  });
  it("ignores semicolons inside strings, identifiers, and comments", () => {
    expect(checkSingleStatement("SELECT 'a;b', \"x;y\" -- c;d\nFROM t /* e;f */")).toBeNull();
    expect(checkSingleStatement("SELECT $tag$ ; $tag$")).toBeNull();
  });
  it("rejects stacked statements", () => {
    expect(checkSingleStatement("SELECT 1; DROP TABLE heist.suspects")).toMatch(/One statement/);
    expect(checkSingleStatement("SELECT ';'; DELETE FROM x;")).toMatch(/One statement/);
  });
  it("rejects empty input", () => {
    expect(checkSingleStatement("  -- just a comment  ")).toMatch(/Write a query/);
  });
});
