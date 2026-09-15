/**
 * Seed minimal — référentiels indispensables pour démarrer en local
 * (aucune donnée régionale n'est en dur dans le code applicatif : elle vit
 * ici, en données, et reste éditable depuis l'admin).
 * Idempotent (upsert) : peut être relancé sans dupliquer.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedCurrencies(): Promise<void> {
  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
    { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
    { code: 'XOF', symbol: 'CFA', name: 'Franc CFA (UEMOA)', decimals: 0 },
  ];
  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }
}

async function seedCountries(): Promise<void> {
  const countries = [
    { code: 'FR', name: 'France', dialCode: '+33', defaultCurrency: 'EUR', defaultLocale: 'fr' },
    {
      code: 'CI',
      name: "Côte d'Ivoire",
      dialCode: '+225',
      defaultCurrency: 'XOF',
      defaultLocale: 'fr-CI',
    },
    {
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      defaultCurrency: 'USD',
      defaultLocale: 'en',
    },
  ];
  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }
}

async function seedMarkets(): Promise<void> {
  const markets = [
    { countryCode: 'FR', name: 'France', defaultCurrency: 'EUR', defaultLocale: 'fr', isActive: true },
    {
      countryCode: 'CI',
      name: "Côte d'Ivoire",
      defaultCurrency: 'XOF',
      defaultLocale: 'fr-CI',
      isActive: true,
    },
    { countryCode: 'US', name: 'United States', defaultCurrency: 'USD', defaultLocale: 'en', isActive: false },
  ];
  for (const market of markets) {
    await prisma.market.upsert({
      where: { countryCode: market.countryCode },
      update: market,
      create: market,
    });
  }
}

async function seedSystemConfig(): Promise<void> {
  const globalConfigs: Array<{ key: string; value: unknown }> = [
    { key: 'commission_rate', value: 0.15 },
    { key: 'supported_currencies', value: ['EUR', 'USD', 'XOF'] },
    { key: 'kyc_required', value: false },
  ];
  for (const config of globalConfigs) {
    // Le champ composite `@@unique([countryCode, key])` n'accepte pas `null`
    // dans le raccourci `where` de Prisma (les valeurs NULL ne participent
    // pas à l'égalité SQL) : on résout donc l'upsert manuellement.
    const existing = await prisma.systemConfig.findFirst({
      where: { countryCode: null, key: config.key },
    });
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { value: config.value as never },
      });
    } else {
      await prisma.systemConfig.create({
        data: { countryCode: null, key: config.key, value: config.value as never },
      });
    }
  }
}

async function seedJobCategories(): Promise<void> {
  const categories = [
    { key: 'category.delivery', labelKey: 'category.delivery.label' },
    { key: 'category.cleaning', labelKey: 'category.cleaning.label' },
    { key: 'category.moving', labelKey: 'category.moving.label' },
    { key: 'category.events', labelKey: 'category.events.label' },
    { key: 'category.handyman', labelKey: 'category.handyman.label' },
  ];
  for (const [index, category] of categories.entries()) {
    await prisma.jobCategory.upsert({
      where: { key: category.key },
      update: { labelKey: category.labelKey, sortOrder: index },
      create: { ...category, sortOrder: index },
    });
  }
}

async function seedSkills(): Promise<void> {
  const skills = [
    { key: 'skill.driving_license', labelKey: 'skill.driving_license.label' },
    { key: 'skill.heavy_lifting', labelKey: 'skill.heavy_lifting.label' },
    { key: 'skill.customer_service', labelKey: 'skill.customer_service.label' },
  ];
  for (const skill of skills) {
    await prisma.skill.upsert({ where: { key: skill.key }, update: skill, create: skill });
  }
}

/**
 * Compte admin de démo — optionnel : ne s'exécute que si les identifiants
 * sont fournis via l'environnement (jamais de mot de passe en dur ici).
 */
async function seedAdminUser(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ℹ SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD absents — admin de démo non créé.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    create: {
      email,
      passwordHash,
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      locale: 'en',
    },
  });
}

async function main(): Promise<void> {
  await seedCurrencies();
  await seedCountries();
  await seedMarkets();
  await seedSystemConfig();
  await seedJobCategories();
  await seedSkills();
  await seedAdminUser();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
