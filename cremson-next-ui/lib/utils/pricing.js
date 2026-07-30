/**
 * Calculates the effective unit price for a given product and quantity.
 * If bulk pricing is enabled and applicable, returns the bulk tier unit price.
 * Otherwise returns product.price.
 */
export function getEffectiveUnitPrice(product, quantity = 1) {
  if (!product) return 0;
  
  if (product.enable_bulk_pricing || product.enableBulkPricing) {
    let rawTiers = product.bulk_pricing || product.bulkPricing;
    let tiers = [];
    if (Array.isArray(rawTiers)) {
      tiers = rawTiers;
    } else if (typeof rawTiers === "string") {
      try {
        tiers = JSON.parse(rawTiers);
      } catch {}
    }

    if (Array.isArray(tiers) && tiers.length > 0) {
      // Sort tiers descending by min_qty so we match the highest applicable tier
      const sortedTiers = [...tiers].sort((a, b) => Number(b.min_qty) - Number(a.min_qty));
      const applicableTier = sortedTiers.find((t) => quantity >= Number(t.min_qty));
      if (applicableTier && !isNaN(Number(applicableTier.price))) {
        return Number(applicableTier.price);
      }
    }
  }

  return Number(product.price) || 0;
}

/**
 * Calculates total item price based on quantity * effective unit price.
 */
export function getItemTotalPrice(product, quantity = 1) {
  return getEffectiveUnitPrice(product, quantity) * quantity;
}
