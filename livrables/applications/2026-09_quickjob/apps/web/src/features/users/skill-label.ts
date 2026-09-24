/**
 * Les compétences sont seedées avec des clés du type "skill.plumbing" (voir
 * la migration 20260924090000). On en dérive la clé de traduction plate
 * utilisée dans messages/{locale}.json, namespace "skills" : "plumbing".
 */
export function skillTranslationKey(skillKey: string): string {
  return skillKey.split('.').pop() ?? skillKey;
}
