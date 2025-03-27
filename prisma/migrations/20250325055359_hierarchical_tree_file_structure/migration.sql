/*
  Warnings:

  - You are about to drop the `DriveFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('FOLDER', 'FILE');

-- DropForeignKey
ALTER TABLE "DriveFile" DROP CONSTRAINT "DriveFile_ownerId_fkey";

-- DropTable
DROP TABLE "DriveFile";

-- CreateTable
CREATE TABLE "DriveItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "DriveItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriveItem_url_key" ON "DriveItem"("url");

-- CreateIndex
CREATE UNIQUE INDEX "DriveItem_name_parentId_ownerId_key" ON "DriveItem"("name", "parentId", "ownerId");

-- AddForeignKey
ALTER TABLE "DriveItem" ADD CONSTRAINT "DriveItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "DriveUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveItem" ADD CONSTRAINT "DriveItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DriveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
