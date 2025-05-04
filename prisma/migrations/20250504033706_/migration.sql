-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('USER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Roles" NOT NULL DEFAULT 'USER';
