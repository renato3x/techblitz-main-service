-- AlterTable
ALTER TABLE "users" ADD COLUMN     "total_followers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_following" INTEGER NOT NULL DEFAULT 0;
