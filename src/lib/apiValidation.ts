// FILE: src/lib/apiValidation.ts
import { ZodError, ZodTypeAny, z } from "zod";
import { jsonError } from "@/lib/apiGuards";

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

function zodDetails(err: ZodError) {
  // keep it small + readable
  return err.issues.slice(0, 8).map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema, body: unknown) {
  if (body === undefined) {
    return { ok: false as const, response: jsonError(400, "Invalid JSON body") };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      response: jsonError(400, "Invalid request body", zodDetails(parsed.error)),
    };
  }

  return { ok: true as const, data: parsed.data as z.infer<TSchema> };
}
