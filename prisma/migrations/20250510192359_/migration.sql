/*
  Warnings:

  - You are about to drop the column `token` on the `account_deletion_tokens` table. All the data in the column will be lost.
  - Added the required column `code` to the `account_deletion_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_deletion_tokens" DROP COLUMN "token",
ADD COLUMN     "code" CHAR(5) NOT NULL;
