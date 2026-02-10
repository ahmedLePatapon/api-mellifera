-- CreateEnum
CREATE TYPE "roles" AS ENUM ('APICULTEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "types_ruche" AS ENUM ('DADANT', 'LANGSTROTH', 'WARRE', 'VOIRNOT', 'KENYANE', 'AUTRE');

-- CreateEnum
CREATE TYPE "statuts_ruche" AS ENUM ('ACTIVE', 'INACTIVE', 'MORTE', 'VENDUE', 'ESSAIMEE');

-- CreateEnum
CREATE TYPE "etats_general" AS ENUM ('EXCELLENT', 'BON', 'MOYEN', 'FAIBLE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "niveaux_reserve" AS ENUM ('ABONDANT', 'SUFFISANT', 'FAIBLE', 'VIDE');

-- CreateEnum
CREATE TYPE "comportements" AS ENUM ('CALME', 'AGITE', 'AGRESSIF', 'NORMAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "roles" NOT NULL DEFAULT 'APICULTEUR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruchers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ruchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruches" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "types_ruche" NOT NULL DEFAULT 'DADANT',
    "statut" "statuts_ruche" NOT NULL DEFAULT 'ACTIVE',
    "date_achat" TIMESTAMP(3),
    "notes" TEXT,
    "rucher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ruches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "etat_general" "etats_general" NOT NULL,
    "niveau_reserve" "niveaux_reserve",
    "comportement" "comportements",
    "presence_reine" BOOLEAN,
    "nombre_cadres" INTEGER,
    "presence_maladie" BOOLEAN DEFAULT false,
    "description_maladie" TEXT,
    "traitement_applique" TEXT,
    "recolte_kg" DOUBLE PRECISION,
    "notes" TEXT,
    "ruche_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "ruchers_user_id_idx" ON "ruchers"("user_id");

-- CreateIndex
CREATE INDEX "ruches_rucher_id_idx" ON "ruches"("rucher_id");

-- CreateIndex
CREATE INDEX "inspections_ruche_id_idx" ON "inspections"("ruche_id");

-- CreateIndex
CREATE INDEX "inspections_date_idx" ON "inspections"("date");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "ruchers" ADD CONSTRAINT "ruchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruches" ADD CONSTRAINT "ruches_rucher_id_fkey" FOREIGN KEY ("rucher_id") REFERENCES "ruchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_ruche_id_fkey" FOREIGN KEY ("ruche_id") REFERENCES "ruches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
