// FILE: src/app/api/openapi/route.ts
import { NextResponse } from "next/server";
import { openapiSpec } from "@/lib/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(openapiSpec, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
