import { normalizeDateToISO } from "../utils/date";

describe("normalizeDateToISO", () => {
  it("returns null for null input", () => {
    expect(normalizeDateToISO(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(normalizeDateToISO(undefined)).toBeNull();
  });

  it("normalizes a Date object to midnight UTC", () => {
    const result = normalizeDateToISO(new Date("2024-03-15T14:30:00Z"));
    expect(result).toBe("2024-03-15T00:00:00.000Z");
  });

  it("normalizes a date string to midnight UTC", () => {
    const result = normalizeDateToISO("2024-03-15");
    expect(result).toBe("2024-03-15T00:00:00.000Z");
  });

  it("normalizes a date string with time to midnight UTC", () => {
    const result = normalizeDateToISO("2024-06-01T23:59:59Z");
    expect(result).toBe("2024-06-01T00:00:00.000Z");
  });

  it("returns an ISO string (not null) for a Date already at midnight UTC", () => {
    const result = normalizeDateToISO(new Date("2024-01-01T00:00:00.000Z"));
    expect(result).toBe("2024-01-01T00:00:00.000Z");
  });

  it("does not mutate the original Date object", () => {
    const original = new Date("2024-03-15T14:30:00Z");
    const originalTime = original.getTime();
    normalizeDateToISO(original);
    expect(original.getTime()).toBe(originalTime);
  });
});
