export const SCHOOL_CATEGORY_ORDER = ['SRAI', 'SRA', 'KAFAI', 'SRI'] as const;

export function schoolCategoryRank(category: string | null | undefined) {
  const rank = SCHOOL_CATEGORY_ORDER.indexOf((category ?? '').toUpperCase() as (typeof SCHOOL_CATEGORY_ORDER)[number]);
  return rank === -1 ? SCHOOL_CATEGORY_ORDER.length : rank;
}
