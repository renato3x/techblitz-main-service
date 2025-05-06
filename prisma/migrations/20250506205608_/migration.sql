/*
  Warnings:

  - You are about to drop the column `expired_at` on the `account_recovery_tokens` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `account_recovery_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_recovery_tokens" DROP COLUMN "expired_at",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;
