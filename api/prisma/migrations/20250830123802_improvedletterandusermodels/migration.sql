/*
  Warnings:

  - A unique constraint covering the columns `[partnerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "public"."_UserToFriends" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserToFriends_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserToFriends_B_index" ON "public"."_UserToFriends"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_partnerId_key" ON "public"."User"("partnerId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "UserToPartner_fk" FOREIGN KEY ("partnerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserToFriends" ADD CONSTRAINT "_UserToFriends_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserToFriends" ADD CONSTRAINT "_UserToFriends_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
