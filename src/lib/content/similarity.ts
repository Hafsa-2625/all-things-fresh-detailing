/**
 * Word 3-gram Jaccard similarity, used to keep near-duplicate city pages from being published
 * (ATF Backend Spec §5: "the admin blocks publishing a location page whose body text is more
 * than 70% similar to any other location page").
 *
 * The city name is neutralised first, so swapping only the city name still reads as duplicate.
 */
export const LOCATION_SIMILARITY_LIMIT = 0.7;

function shingles(body: string, cityName?: string): Set<string> {
  const normalised = (cityName ? body.replaceAll(new RegExp(cityName, "gi"), " city ") : body)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const grams = new Set<string>();
  for (let index = 0; index + 3 <= normalised.length; index += 1) grams.add(normalised.slice(index, index + 3).join(" "));
  return grams;
}

/** 0–1, where 1 is identical. Texts shorter than three words compare as 0. */
export function textSimilarity(a: string, aCity: string | undefined, b: string, bCity: string | undefined): number {
  const first = shingles(a, aCity);
  const second = shingles(b, bCity);
  if (!first.size || !second.size) return 0;
  let shared = 0;
  for (const gram of first) if (second.has(gram)) shared += 1;
  return shared / (first.size + second.size - shared);
}

export interface LocationLike { id?: string; city?: string | null; local_intro?: string | null }

/** The closest other location, so the admin can name it when refusing to publish. */
export function closestLocation(candidate: LocationLike, others: LocationLike[]): { score: number; city: string } | null {
  let best: { score: number; city: string } | null = null;
  for (const other of others) {
    if (other.id && candidate.id && other.id === candidate.id) continue;
    const score = textSimilarity(candidate.local_intro ?? "", candidate.city ?? undefined, other.local_intro ?? "", other.city ?? undefined);
    if (!best || score > best.score) best = { score, city: other.city ?? "another city" };
  }
  return best;
}
