const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats a stored amount (Postgres numeric arrives as a number or a string) as dollars. */
export function formatMoney(value: unknown): string {
  return usd.format(Number(value ?? 0));
}
