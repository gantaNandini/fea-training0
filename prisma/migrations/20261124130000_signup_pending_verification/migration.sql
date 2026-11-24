-- Migration: add SignupVerification for the new pending-signup flow.
-- A pending sign-up row is created when the user submits the registration form
-- and deleted (along with account creation) when the correct code is entered.
-- EmailVerificationCode from the previous migration (20261124120000) is kept
-- because it was already applied to the production database.

CREATE TABLE "SignupVerification" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "codeHash"     TEXT NOT NULL,
    "attempts"     INTEGER NOT NULL DEFAULT 0,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "lastSentAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignupVerification_email_key" ON "SignupVerification"("email");
