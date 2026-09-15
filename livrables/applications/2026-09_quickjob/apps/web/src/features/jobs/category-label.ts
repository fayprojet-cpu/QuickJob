/**
 * Les catégories sont seedées avec des clés i18n du type "category.delivery"
 * (voir prisma/seed.ts). On en dérive la clé de traduction plate utilisée
 * dans messages/{locale}.json : "category_delivery".
 */
export function categoryTranslationKey(categoryKey: string): string {
  const slug = categoryKey.split('.').pop() ?? categoryKey;
  return `category_${slug}`;
}
