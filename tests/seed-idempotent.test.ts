import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("seed file is idempotent (demo rows have stable ids)", () => {
  it("contains stable demo ids + uses skipDuplicates", () => {
    const seedPath = path.join(process.cwd(), "prisma", "seed.mjs");
    const text = fs.readFileSync(seedPath, "utf8");

    // comments
    expect(text).toContain('id: "demo-comment-1"');
    expect(text).toContain('id: "demo-comment-2"');

    // milestones
    expect(text).toContain('id: "demo-ms-1"');
    expect(text).toContain('id: "demo-ms-2"');

    // docs
    expect(text).toContain('id: "demo-doc-1"');
    expect(text).toContain('id: "demo-doc-2"');

    // notifications
    expect(text).toContain('id: "demo-notif-1"');
    expect(text).toContain('id: "demo-notif-2"');

    // ensure we still keep skipDuplicates enabled
    expect(text).toContain("skipDuplicates: true");
  });
});
