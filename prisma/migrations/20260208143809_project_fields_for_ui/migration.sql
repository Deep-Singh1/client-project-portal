/*
  Warnings:

  - You are about to drop the column `clientName` on the `Project` table. All the data in the column will be lost.
  - Added the required column `clientEmail` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "clientName",
ADD COLUMN     "clientEmail" TEXT NOT NULL,
ADD COLUMN     "consultantEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "customer" TEXT NOT NULL;
