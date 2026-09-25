import "server-only";
import { listRecordsBy } from "@/lib/operations/store";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Active email destinations from `notification_rules` for this event, merged with an optional env-var fallback list. */
export async function recipientsForEvent(event: string, envFallback?: string): Promise<string[]> {
  const rules = await listRecordsBy("notification_rules", "event", event, 50);
  const fromRules = rules.filter((rule) => rule.active !== false && rule.channel === "email").map((rule) => String(rule.destination));
  const fromEnv = (envFallback ?? "").split(",");
  const unique = new Set([...fromRules, ...fromEnv].map((value) => value.trim().toLowerCase()).filter((value) => EMAIL_PATTERN.test(value)));
  return [...unique].slice(0, 20);
}
