// FILE: tests/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateBody } from "@/lib/apiValidation";
import { TicketCreateSchema, DocCreateSchema } from "@/lib/requestSchemas";

describe("Zod validation + error shape", () => {
  it("rejects empty ticket title with 400 + details", async () => {
    const v = validateBody(TicketCreateSchema, { title: "" });

    expect(v.ok).toBe(false);
    // @ts-expect-error: v.response exists when ok=false
    const json = await v.response.json();

    expect(json.ok).toBe(false);
    expect(json.error.message).toBe("Invalid request body");
    expect(Array.isArray(json.error.details)).toBe(true);
    expect(json.error.details.length).toBeGreaterThan(0);
  });

  it("rejects invalid doc category", async () => {
    const v = validateBody(DocCreateSchema, { title: "X", category: "FakeCategory" });

    expect(v.ok).toBe(false);
    // @ts-expect-error: v.response exists when ok=false
    const json = await v.response.json();

    expect(json.ok).toBe(false);
    expect(json.error.message).toBe("Invalid request body");
  });
});
