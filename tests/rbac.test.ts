// FILE: tests/rbac.test.ts
import { describe, it, expect } from "vitest";
import { canSeeProject, canManage, canApprove } from "@/lib/serverSession";

describe("RBAC helpers", () => {
  const project = {
    clientEmail: "client@demo.com",
    consultantEmails: ["consultant@demo.com"],
  };

  it("client can see own project", () => {
    expect(canSeeProject(project, { email: "client@demo.com", role: "client" })).toBe(true);
    expect(canSeeProject(project, { email: "someone@else.com", role: "client" })).toBe(false);
  });

  it("consultant can see assigned project", () => {
    expect(canSeeProject(project, { email: "consultant@demo.com", role: "consultant" })).toBe(true);
    expect(canSeeProject(project, { email: "x@demo.com", role: "consultant" })).toBe(false);
  });

  it("admin can see everything", () => {
    expect(canSeeProject(project, { email: "admin@demo.com", role: "admin" })).toBe(true);
  });

  it("manage/approve rules", () => {
    expect(canManage({ email: "c@demo.com", role: "consultant" })).toBe(true);
    expect(canManage({ email: "a@demo.com", role: "admin" })).toBe(true);
    expect(canManage({ email: "x@demo.com", role: "client" })).toBe(false);

    expect(canApprove({ email: "x@demo.com", role: "client" })).toBe(true);
    expect(canApprove({ email: "a@demo.com", role: "admin" })).toBe(true);
    expect(canApprove({ email: "c@demo.com", role: "consultant" })).toBe(false);
  });
});
