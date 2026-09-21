-- AlterTable: la rémunération d'une mission devient optionnelle ("À négocier")
ALTER TABLE "jobs" ALTER COLUMN "salaryAmount" DROP NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "salaryCurrency" DROP NOT NULL;
