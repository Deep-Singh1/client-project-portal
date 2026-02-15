import { describe, it, expect } from "vitest";
import { TicketCommentCreateSchema } from "@/lib/requestSchemas";

describe("TicketCommentCreateSchema", () => {
  it("accepts { body } and normalizes", () => {
    const out = TicketCommentCreateSchema.parse({ body: "  hello  " });
    expect(out).toEqual({ body: "hello" });
  });

  it("accepts legacy { message } and normalizes to body", () => {
    const out = TicketCommentCreateSchema.parse({ message: "  hi  " });
    expect(out).toEqual({ body: "hi" });
  });

  it("rejects missing body/message", () => {
    const res = TicketCommentCreateSchema.safeParse({});
    expect(res.success).toBe(false);
  });
});
