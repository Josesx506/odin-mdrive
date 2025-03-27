-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'GUEST', 'ADMIN');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('FOLDER', 'FILE');

-- CreateTable
CREATE TABLE "DriveSession" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveExpiry" (
    "id" SERIAL NOT NULL,
    "downloadId" TEXT NOT NULL,
    "privateUrl" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,

    CONSTRAINT "DriveExpiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "DriveUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "url" TEXT,
    "mimeType" TEXT,
    "fileSize" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "DriveItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriveSession_sid_key" ON "DriveSession"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "DriveExpiry_downloadId_key" ON "DriveExpiry"("downloadId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveUser_email_key" ON "DriveUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DriveItem_url_key" ON "DriveItem"("url");

-- CreateIndex
CREATE INDEX "DriveItem_parentId_idx" ON "DriveItem"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveItem_name_parentId_ownerId_key" ON "DriveItem"("name", "parentId", "ownerId");

-- AddForeignKey
ALTER TABLE "DriveItem" ADD CONSTRAINT "DriveItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "DriveUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveItem" ADD CONSTRAINT "DriveItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DriveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

