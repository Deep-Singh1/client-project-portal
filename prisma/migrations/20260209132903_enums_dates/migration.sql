/*
  Warnings:

  - The `category` column on the `Doc` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Milestone` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `uploadedAt` on the `Doc` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dueDate` on the `Milestone` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('DRAFT', 'READY_FOR_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "DocCategory" AS ENUM ('CONTRACT', 'INVOICE', 'TECHNICAL', 'OTHER');

-- ✅ Doc: convert category (String -> enum) without dropping data
-- Doc.category: remove old default, convert, then set new default
ALTER TABLE "Doc" ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "Doc"
  ALTER COLUMN "category" TYPE "DocCategory"
  USING (
    CASE
      WHEN "category" ILIKE 'contract' THEN 'CONTRACT'
      WHEN "category" ILIKE 'invoice' THEN 'INVOICE'
      WHEN "category" ILIKE 'technical' THEN 'TECHNICAL'
      ELSE 'OTHER'
    END
  )::"DocCategory";

ALTER TABLE "Doc" ALTER COLUMN "category" SET DEFAULT 'CONTRACT';


-- ✅ Doc: convert uploadedAt (String -> timestamp) without dropping data
ALTER TABLE "Doc"
  ALTER COLUMN "uploadedAt" TYPE TIMESTAMP(3)
  USING ("uploadedAt"::timestamp);

-- ✅ Milestone: convert dueDate (String -> timestamp) without dropping data
ALTER TABLE "Milestone"
  ALTER COLUMN "dueDate" TYPE TIMESTAMP(3)
  USING ("dueDate"::timestamp);

-- ✅ Milestone: convert status (String -> enum) without dropping data
ALTER TABLE "Milestone" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Milestone"
  ALTER COLUMN "status" TYPE "MilestoneStatus"
  USING (
    CASE
      WHEN "status" ILIKE 'approved' THEN 'APPROVED'
      WHEN "status" ILIKE 'ready for approval' OR "status" ILIKE 'ready_for_approval' THEN 'READY_FOR_APPROVAL'
      WHEN "status" ILIKE 'planned' OR "status" ILIKE 'draft' THEN 'DRAFT'
      ELSE 'DRAFT'
    END
  )::"MilestoneStatus";

ALTER TABLE "Milestone" ALTER COLUMN "status" SET DEFAULT 'DRAFT';


-- ✅ Project: convert status (String -> enum)
ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Project"
  ALTER COLUMN "status" TYPE "ProjectStatus"
  USING (
    CASE
      WHEN "status" ILIKE 'active' THEN 'ACTIVE'
      WHEN "status" ILIKE 'on hold' OR "status" ILIKE 'hold' OR "status" ILIKE 'on_hold' THEN 'ON_HOLD'
      WHEN "status" ILIKE 'completed' OR "status" ILIKE 'done' THEN 'COMPLETED'
      ELSE 'ACTIVE'
    END
  )::"ProjectStatus";

ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';


-- ✅ Ticket: convert status (String -> enum)
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Ticket"
  ALTER COLUMN "status" TYPE "TicketStatus"
  USING (
    CASE
      WHEN "status" ILIKE 'open' THEN 'OPEN'
      WHEN "status" ILIKE 'in progress' OR "status" ILIKE 'in_progress' THEN 'IN_PROGRESS'
      WHEN "status" ILIKE 'in review' OR "status" ILIKE 'in_review' THEN 'IN_REVIEW'
      WHEN "status" ILIKE 'blocked' THEN 'BLOCKED'
      WHEN "status" ILIKE 'done' THEN 'DONE'
      ELSE 'OPEN'
    END
  )::"TicketStatus";

ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'OPEN';


ALTER TABLE "Ticket" ALTER COLUMN "priority" DROP DEFAULT;

ALTER TABLE "Ticket"
  ALTER COLUMN "priority" TYPE "TicketPriority"
  USING (
    CASE
      WHEN "priority" ILIKE 'low' THEN 'LOW'
      WHEN "priority" ILIKE 'medium' THEN 'MEDIUM'
      WHEN "priority" ILIKE 'high' THEN 'HIGH'
      WHEN "priority" ILIKE 'urgent' THEN 'URGENT'
      ELSE 'MEDIUM'
    END
  )::"TicketPriority";

ALTER TABLE "Ticket" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

