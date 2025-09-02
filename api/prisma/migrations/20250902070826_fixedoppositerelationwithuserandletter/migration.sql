/*
  Warnings:

  - You are about to drop the column `recipientName` on the `Letter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Letter" DROP COLUMN "recipientName";

-- AddForeignKey
ALTER TABLE "public"."Letter" ADD CONSTRAINT "Letter_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
