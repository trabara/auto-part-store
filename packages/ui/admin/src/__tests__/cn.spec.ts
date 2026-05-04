import { cn } from "../utils/cn";

describe("cn", () => {
  it("returns an empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("joins multiple class strings with a space", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out falsy values: undefined", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("filters out falsy values: null", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("filters out falsy values: false", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("handles a mix of truthy and falsy values", () => {
    expect(cn(undefined, null, false, "only-me")).toBe("only-me");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  it("handles a single class string", () => {
    expect(cn("single")).toBe("single");
  });

  it("preserves class strings with internal spaces", () => {
    expect(cn("foo bar", "baz")).toBe("foo bar baz");
  });
});
