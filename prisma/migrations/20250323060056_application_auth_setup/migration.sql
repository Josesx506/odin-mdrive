/*
  Warnings:

  - Added the required column `password` to the `DriveUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriveUser" ADD COLUMN     "password" TEXT NOT NULL;
