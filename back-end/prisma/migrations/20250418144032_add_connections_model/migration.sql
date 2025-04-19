-- CreateTable
CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "connectionId" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contacts" (
    "id" VARCHAR(64) NOT NULL,
    "integrationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "timezone" TEXT,
    "isAdmin" BOOLEAN DEFAULT false,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connections" (
    "id" VARCHAR(64) NOT NULL,
    "provider_config_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "Contacts_integrationId_idx" ON "Contacts"("integrationId");

-- CreateIndex
CREATE INDEX "Connections_provider_config_key_idx" ON "Connections"("provider_config_key");
