-- CreateTable
CREATE TABLE "account_recovery_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_recovery_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_recovery_tokens_token_key" ON "account_recovery_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_recovery_tokens_user_id_key" ON "account_recovery_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "account_recovery_tokens" ADD CONSTRAINT "account_recovery_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
