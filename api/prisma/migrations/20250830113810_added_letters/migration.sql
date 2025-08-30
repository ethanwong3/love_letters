-- CreateEnum
CREATE TYPE "public"."LetterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Letter" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "songUrl" TEXT NOT NULL,
    "status" "public"."LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Letter" ADD CONSTRAINT "Letter_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
