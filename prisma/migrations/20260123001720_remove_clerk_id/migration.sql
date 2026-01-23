/*
  Warnings:

  - You are about to drop the column `clerkId` on the `User` table. All the data in the column will be lost.
  - Made the column `firebaseUid` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_clerkId_idx";

-- DropIndex
DROP INDEX "User_clerkId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkId",
ALTER COLUMN "firebaseUid" SET NOT NULL;

-- CreateIndex
CREATE INDEX "User_firebaseUid_idx" ON "User"("firebaseUid");
