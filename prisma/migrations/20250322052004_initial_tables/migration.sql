-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'GUEST', 'ADMIN');

-- CreateTable
CREATE TABLE "DriveUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "dirName" TEXT DEFAULT 'root',

    CONSTRAINT "DriveUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFile" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DriveFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriveUser_email_key" ON "DriveUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFile_url_key" ON "DriveFile"("url");

-- AddForeignKey
ALTER TABLE "DriveFile" ADD CONSTRAINT "DriveFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "DriveUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
