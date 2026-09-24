-- Profil polyvalent (côté travailleur) : compétences (catalogue Skill déjà
-- présent mais jamais utilisé jusqu'ici, relié à User via UserSkill),
-- missions simples acceptées, disponibilité, et zone (localisation +
-- rayon). N'AFFECTE AUCUN champ de paiement/salaire/escrow.

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "canDoGeneral" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "acceptedCategoryKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "availableNow" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "latitude" DECIMAL(9,6),
  ADD COLUMN "longitude" DECIMAL(9,6),
  ADD COLUMN "travelRadiusKm" INTEGER;

-- CreateTable
CREATE TABLE "user_skills" (
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateIndex
CREATE INDEX "user_skills_skillId_idx" ON "user_skills"("skillId");

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed : catalogue large de métiers/professions (idempotent — ignore si déjà
-- présent). Volontairement large pour ne pas enfermer la plateforme dans une
-- liste restreinte ; reste extensible plus tard sans migration de schéma
-- (juste de nouvelles lignes).
INSERT INTO "skills" ("id", "key", "labelKey", "isActive")
VALUES
  (gen_random_uuid(), 'skill.plumbing', 'skill.plumbing.label', true),
  (gen_random_uuid(), 'skill.electricity', 'skill.electricity.label', true),
  (gen_random_uuid(), 'skill.carpentry', 'skill.carpentry.label', true),
  (gen_random_uuid(), 'skill.tailoring', 'skill.tailoring.label', true),
  (gen_random_uuid(), 'skill.masonry', 'skill.masonry.label', true),
  (gen_random_uuid(), 'skill.painting', 'skill.painting.label', true),
  (gen_random_uuid(), 'skill.mechanics', 'skill.mechanics.label', true),
  (gen_random_uuid(), 'skill.motorcycleMechanics', 'skill.motorcycleMechanics.label', true),
  (gen_random_uuid(), 'skill.hairdressing', 'skill.hairdressing.label', true),
  (gen_random_uuid(), 'skill.barbering', 'skill.barbering.label', true),
  (gen_random_uuid(), 'skill.cooking', 'skill.cooking.label', true),
  (gen_random_uuid(), 'skill.baking', 'skill.baking.label', true),
  (gen_random_uuid(), 'skill.gardening', 'skill.gardening.label', true),
  (gen_random_uuid(), 'skill.welding', 'skill.welding.label', true),
  (gen_random_uuid(), 'skill.driving', 'skill.driving.label', true),
  (gen_random_uuid(), 'skill.motorcycleDelivery', 'skill.motorcycleDelivery.label', true),
  (gen_random_uuid(), 'skill.security', 'skill.security.label', true),
  (gen_random_uuid(), 'skill.photography', 'skill.photography.label', true),
  (gen_random_uuid(), 'skill.videography', 'skill.videography.label', true),
  (gen_random_uuid(), 'skill.graphicDesign', 'skill.graphicDesign.label', true),
  (gen_random_uuid(), 'skill.webDevelopment', 'skill.webDevelopment.label', true),
  (gen_random_uuid(), 'skill.computerRepair', 'skill.computerRepair.label', true),
  (gen_random_uuid(), 'skill.phoneRepair', 'skill.phoneRepair.label', true),
  (gen_random_uuid(), 'skill.tutoring', 'skill.tutoring.label', true),
  (gen_random_uuid(), 'skill.childcare', 'skill.childcare.label', true),
  (gen_random_uuid(), 'skill.eldercare', 'skill.eldercare.label', true),
  (gen_random_uuid(), 'skill.cleaningServices', 'skill.cleaningServices.label', true),
  (gen_random_uuid(), 'skill.laundry', 'skill.laundry.label', true),
  (gen_random_uuid(), 'skill.shoemaking', 'skill.shoemaking.label', true),
  (gen_random_uuid(), 'skill.tiling', 'skill.tiling.label', true),
  (gen_random_uuid(), 'skill.roofing', 'skill.roofing.label', true),
  (gen_random_uuid(), 'skill.plastering', 'skill.plastering.label', true),
  (gen_random_uuid(), 'skill.glazing', 'skill.glazing.label', true),
  (gen_random_uuid(), 'skill.upholstery', 'skill.upholstery.label', true),
  (gen_random_uuid(), 'skill.refrigeration', 'skill.refrigeration.label', true),
  (gen_random_uuid(), 'skill.aluminumWork', 'skill.aluminumWork.label', true),
  (gen_random_uuid(), 'skill.metalwork', 'skill.metalwork.label', true),
  (gen_random_uuid(), 'skill.jewelryMaking', 'skill.jewelryMaking.label', true),
  (gen_random_uuid(), 'skill.leatherwork', 'skill.leatherwork.label', true),
  (gen_random_uuid(), 'skill.pottery', 'skill.pottery.label', true),
  (gen_random_uuid(), 'skill.weaving', 'skill.weaving.label', true),
  (gen_random_uuid(), 'skill.eventPlanning', 'skill.eventPlanning.label', true),
  (gen_random_uuid(), 'skill.djMusic', 'skill.djMusic.label', true),
  (gen_random_uuid(), 'skill.decoration', 'skill.decoration.label', true),
  (gen_random_uuid(), 'skill.mcHosting', 'skill.mcHosting.label', true),
  (gen_random_uuid(), 'skill.farming', 'skill.farming.label', true),
  (gen_random_uuid(), 'skill.animalHusbandry', 'skill.animalHusbandry.label', true),
  (gen_random_uuid(), 'skill.accounting', 'skill.accounting.label', true),
  (gen_random_uuid(), 'skill.translation', 'skill.translation.label', true),
  (gen_random_uuid(), 'skill.dataEntry', 'skill.dataEntry.label', true),
  (gen_random_uuid(), 'skill.virtualAssistant', 'skill.virtualAssistant.label', true),
  (gen_random_uuid(), 'skill.sales', 'skill.sales.label', true),
  (gen_random_uuid(), 'skill.massage', 'skill.massage.label', true),
  (gen_random_uuid(), 'skill.makeupArtist', 'skill.makeupArtist.label', true),
  (gen_random_uuid(), 'skill.movingHelp', 'skill.movingHelp.label', true)
ON CONFLICT ("key") DO NOTHING;
