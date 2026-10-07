// Reading catalog files for the scripts: a file, or every *.json of a folder
// (whose other JSON files, a model map or a fetch report, are not catalogs).
import fs from "node:fs";
import path from "node:path";

export type Target = { file: string; data?: unknown; error?: string; inFolder: boolean };

const read = (file: string, inFolder: boolean): Target => {
  try {
    return { file, data: JSON.parse(fs.readFileSync(file, "utf8")), inFolder };
  } catch (error) {
    return { file, error: `not valid JSON (${(error as Error).message})`, inFolder };
  }
};

/** A file, or every *.json of a folder. */
export const targetsOf = (target: string): Target[] =>
  fs.statSync(target).isDirectory()
    ? fs
        .readdirSync(target)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => read(path.join(target, f), true))
    : [read(target, false)];

/** A folder's other JSON files (a model map, a fetch report) are not catalogs. */
export const isCatalog = (data: unknown) =>
  typeof data === "object" && data !== null && String((data as { format?: unknown }).format ?? "").startsWith("vehicle-catalog@");

