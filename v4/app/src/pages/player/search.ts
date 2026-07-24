// ─────────────────────────────────────────────
// SEARCH RANKING
// ─────────────────────────────────────────────
// Small pure relevance ranking for player search. Replaces raw substring
// filtering with a scored, stably sorted list.
//
// Scoring model (higher = better, 0 = not a match):
//   exact title match        100
//   title prefix match        70
//   title substring match     40
//   artist exact match        30
//   artist prefix match       20
//   artist substring match    10
// Boosts (added on top of any title/artist match):
//   currently playing track  +15
//   liked track              + 8
// All comparisons are case-insensitive and whitespace-trimmed.

export interface RankableItem {
  id: string;
  title: string;
  artist: string;
}

export interface RankBoosts {
  isCurrent?: boolean;
  isLiked?: boolean;
}

/** Relevance score for one item; 0 means "does not match this query". */
export function rankScore(item: RankableItem, query: string, boosts: RankBoosts = {}): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const title = item.title.toLowerCase();
  const artist = item.artist.toLowerCase();

  let score = 0;
  if (title === q) score = 100;
  else if (title.startsWith(q)) score = 70;
  else if (title.includes(q)) score = 40;

  if (artist === q) score = Math.max(score, 30);
  else if (artist.startsWith(q)) score = Math.max(score, 20);
  else if (artist.includes(q)) score = Math.max(score, 10);

  if (score === 0) return 0;
  if (boosts.isCurrent) score += 15;
  if (boosts.isLiked) score += 8;
  return score;
}

/**
 * Filter + rank a candidate list. Stable: equal scores keep input order
 * (Array.prototype.sort is stable in modern JS).
 */
export function rankSearch<T extends RankableItem>(
  items: T[],
  query: string,
  boostsFor: (item: T) => RankBoosts = () => ({}),
): T[] {
  return items
    .map((item) => ({ item, score: rankScore(item, query, boostsFor(item)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
