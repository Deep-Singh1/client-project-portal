import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("demo123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects/);
}

async function openProject(page: Page, projectName: string) {
  await page.getByRole("link", { name: projectName }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
}

test("Client can approve a ready milestone", async ({ page }) => {
  await login(page, "client@demo.com");
  await openProject(page, "Website Redesign");

  // switch to milestones
  await page.getByRole("tab", { name: "Milestones" }).click();

  // approve first ready milestone
  await page.getByRole("button", { name: "Approve" }).first().click();

  // Toast should confirm
  await expect(page.getByText("Milestone approved")).toBeVisible();
});

test("Consultant can create a ticket", async ({ page }) => {
  await login(page, "consultant@demo.com");
  await openProject(page, "Website Redesign");

  await page.getByRole("button", { name: "+ New ticket" }).click();
  await expect(page.getByRole("heading", { name: "New ticket" })).toBeVisible();

  const title = `E2E Ticket ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Created by Playwright E2E");
  await page.getByRole("button", { name: "Save" }).click();

  // Ticket should appear in list
  await expect(page.getByText(title)).toBeVisible();
});

test("Admin can see multiple projects", async ({ page }) => {
  await login(page, "admin@demo.com");

  // Admin should see all seeded projects, not just client ones.
  await expect(page.getByRole("link", { name: "Website Redesign" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Client Analytics Setup" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mobile App MVP" })).toBeVisible();
});
