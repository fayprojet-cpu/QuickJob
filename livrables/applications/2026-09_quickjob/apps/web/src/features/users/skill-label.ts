/**
 * Les compétences sont seedées avec des clés du type "skill.plumbing" (voir
 * la migration 20260924090000). On en dérive la clé de traduction plate
 * utilisée dans messages/{locale}.json, namespace "skills" : "plumbing".
 */
export function skillTranslationKey(skillKey: string): string {
  return skillKey.split('.').pop() ?? skillKey;
}

/**
 * Regroupement purement visuel (comme les catégories dépliables façon
 * Fiverr) — n'affecte pas les données, seulement l'ordre/groupe d'affichage
 * du catalogue Skill dans le sélecteur. Une compétence non listée ici
 * tombe dans "other" (reste visible, juste pas classée).
 */
const SKILL_GROUPS: Record<string, string[]> = {
  construction: [
    'plumbing', 'electricity', 'carpentry', 'masonry', 'painting', 'welding',
    'tiling', 'roofing', 'plastering', 'glazing', 'upholstery', 'refrigeration',
    'aluminumWork', 'metalwork',
  ],
  home: [
    'cleaningServices', 'laundry', 'childcare', 'eldercare', 'gardening',
    'movingHelp', 'heavy_lifting',
  ],
  transport: ['driving', 'motorcycleDelivery', 'driving_license', 'mechanics', 'motorcycleMechanics'],
  beauty: ['hairdressing', 'barbering', 'massage', 'makeupArtist'],
  food: ['cooking', 'baking'],
  events: [
    'eventPlanning', 'djMusic', 'decoration', 'mcHosting', 'photography',
    'videography', 'jewelryMaking', 'leatherwork', 'pottery', 'weaving',
    'tailoring', 'shoemaking',
  ],
  digital: ['computerRepair', 'phoneRepair', 'graphicDesign', 'webDevelopment', 'dataEntry', 'virtualAssistant'],
  admin: ['tutoring', 'translation', 'accounting', 'customer_service', 'sales'],
  otherTrades: ['security', 'farming', 'animalHusbandry'],
};

export interface SkillGroup {
  groupKey: string;
  slugs: string[];
}

/** Regroupe une liste de slugs de compétences par catégorie visuelle. */
export function groupSkillSlugs(slugs: string[]): SkillGroup[] {
  const remaining = new Set(slugs);
  const groups: SkillGroup[] = [];

  for (const [groupKey, groupSlugs] of Object.entries(SKILL_GROUPS)) {
    const present = groupSlugs.filter((slug) => remaining.has(slug));
    present.forEach((slug) => remaining.delete(slug));
    if (present.length > 0) {
      groups.push({ groupKey, slugs: present });
    }
  }

  if (remaining.size > 0) {
    groups.push({ groupKey: 'other', slugs: [...remaining] });
  }

  return groups;
}
