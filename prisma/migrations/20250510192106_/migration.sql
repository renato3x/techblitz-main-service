-- CreateTable
CREATE TABLE "account_deletion_tokens" (
    "id" SERIAL NOT NULL,
    "token" CHAR(5) NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_deletion_tokens_user_id_key" ON "account_deletion_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "account_deletion_tokens" ADD CONSTRAINT "account_deletion_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
