/*
  Warnings:

  - The values [CANCELLED] on the enum `LetterStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `partnerId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[coupleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LetterStatus_new" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'OPENED');
ALTER TABLE "public"."Letter" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Letter" ALTER COLUMN "status" TYPE "public"."LetterStatus_new" USING ("status"::text::"public"."LetterStatus_new");
ALTER TYPE "public"."LetterStatus" RENAME TO "LetterStatus_old";
ALTER TYPE "public"."LetterStatus_new" RENAME TO "LetterStatus";
DROP TYPE "public"."LetterStatus_old";
ALTER TABLE "public"."Letter" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "UserToPartner_fk";

-- DropIndex
DROP INDEX "public"."User_partnerId_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "partnerId",
ADD COLUMN     "coupleId" TEXT;

-- CreateTable
CREATE TABLE "public"."Couple" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letterFrequency" INTEGER,
    "letterStreak" INTEGER,
    "initiator" TEXT,

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Couple_user1Id_key" ON "public"."Couple"("user1Id");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_user2Id_key" ON "public"."Couple"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_user1Id_user2Id_key" ON "public"."Couple"("user1Id", "user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "User_coupleId_key" ON "public"."User"("coupleId");

-- AddForeignKey
ALTER TABLE "public"."Couple" ADD CONSTRAINT "Couple_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Couple" ADD CONSTRAINT "Couple_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
