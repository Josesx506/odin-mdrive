-- CreateTable
CREATE TABLE "DriveExpiry" (
    "id" SERIAL NOT NULL,
    "downloadId" TEXT NOT NULL,
    "privateUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveExpiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriveExpiry_downloadId_key" ON "DriveExpiry"("downloadId");
