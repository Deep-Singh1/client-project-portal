import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";

function getModel(name: string) {
  const m = Prisma.dmmf.datamodel.models.find((x) => x.name === name);
  expect(m, `Model ${name} not found in Prisma DMMF`).toBeTruthy();
  return m!;
}

function hasSingleUnique(model: any, fieldName: string) {
  // Prisma can represent single-field uniqueness either directly on the field (isUnique),
  // or via uniqueFields/uniqueIndexes depending on generator internals.
  const f = model.fields.find((x: any) => x.name === fieldName);

  const byFieldFlag = Boolean(f?.isUnique);
  const byUniqueFields =
    (model.uniqueFields ?? []).some(
      (u: string[]) => u.length === 1 && u[0] === fieldName
    );
  const byUniqueIndexes =
    (model.uniqueIndexes ?? []).some(
      (idx: any) => idx.fields?.length === 1 && idx.fields[0] === fieldName
    );

  return byFieldFlag || byUniqueFields || byUniqueIndexes;
}

describe("Prisma schema invariants (portfolio safety checks)", () => {
  it("Project has id @id and name is unique (seed/upsert safety)", () => {
    const project = getModel("Project");

    const idField = project.fields.find((f: any) => f.name === "id");
    expect(idField?.isId).toBe(true);

    expect(hasSingleUnique(project, "name")).toBe(true);
  });

  it("Ticket.status/priority fields are enums (not free-text)", () => {
    const ticket = getModel("Ticket");

    const status = ticket.fields.find((f: any) => f.name === "status");
    const priority = ticket.fields.find((f: any) => f.name === "priority");

    expect(status?.kind).toBe("enum");
    expect(priority?.kind).toBe("enum");

    const enumNames = new Set(Prisma.dmmf.datamodel.enums.map((e) => e.name));
    expect(enumNames.has("TicketStatus")).toBe(true);
    expect(enumNames.has("TicketPriority")).toBe(true);
  });
});
