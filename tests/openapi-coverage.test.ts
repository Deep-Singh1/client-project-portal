import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { openapiSpec } from "@/lib/openapi";

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function routeFileToOpenApiPath(file: string) {
  const apiRoot = path.join(process.cwd(), "src", "app", "api");
  const dir = path.dirname(file);
  let rel = path.relative(apiRoot, dir);

  // normalize windows separators
  rel = rel.split(path.sep).join("/");

  let p = rel === "" || rel === "." ? "/api" : `/api/${rel}`;
  p = p.replace(/\[([^\]]+)\]/g, "{$1}");
  return p;
}

describe("OpenAPI spec covers all API routes", () => {
  it("documents every src/app/api/**/route.ts path (and no extras)", () => {
    const apiRoot = path.join(process.cwd(), "src", "app", "api");
    const routeFiles = walk(apiRoot).filter((f) => f.endsWith("route.ts"));

    const expected = routeFiles.map(routeFileToOpenApiPath).sort();
    const actual = Object.keys(openapiSpec.paths).sort();

    expect(actual).toEqual(expected);
  });
});
