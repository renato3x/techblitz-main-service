/*
  Warnings:

  - You are about to drop the `account_deletion_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account_deletion_tokens" DROP CONSTRAINT "account_deletion_tokens_user_id_fkey";

-- DropTable
DROP TABLE "account_deletion_tokens";

-- CreateTable
CREATE TABLE "account_deletion_codes" (
    "id" SERIAL NOT NULL,
    "code" CHAR(5) NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_deletion_codes_user_id_key" ON "account_deletion_codes"("user_id");

-- AddForeignKey
ALTER TABLE "account_deletion_codes" ADD CONSTRAINT "account_deletion_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
