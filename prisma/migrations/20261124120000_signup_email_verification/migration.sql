-- Migration: REQ-123A — email verification code for new sign-ups.
-- Creates the EmailVerificationCode table. The 6-digit code is bcrypt-hashed
-- before storage; emailVerified is set on the User when the code is consumed.

CREATE TABLE "EmailVerificationCode" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "codeHash"  TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailVerificationCode_userId_idx" ON "EmailVerificationCode"("userId");

ALTER TABLE "EmailVerificationCode" ADD CONSTRAINT "EmailVerificationCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
