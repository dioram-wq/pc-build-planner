export type PricedPart = {
  priceUsd: number
}

export type PriceBreakdownSlot = {
  category: string
  part?: {
    name: string
    priceUsd?: number | null
  } | null
}

export type PriceBreakdownLine = {
  category: string
  name: string
  priceUsd: number | null
}

export function applyPrices<T extends { id: string }>(
  parts: readonly T[],
  prices: Readonly<Record<string, number>>,
): Array<T & PricedPart> {
  return parts.map((part) => ({
    ...part,
    priceUsd: prices[part.id] ?? 0,
  }))
}

function finitePrice(priceUsd: number | null | undefined): number | null {
  if (typeof priceUsd !== 'number' || !Number.isFinite(priceUsd)) return null
  return priceUsd
}

export function buildPriceBreakdown(
  slots: readonly PriceBreakdownSlot[],
): PriceBreakdownLine[] {
  const lines: PriceBreakdownLine[] = []
  for (const slot of slots) {
    if (!slot.part) continue
    lines.push({
      category: slot.category,
      name: slot.part.name,
      priceUsd: finitePrice(slot.part.priceUsd),
    })
  }
  return lines
}

export function totalPriceUsd(
  parts: readonly ({ priceUsd?: number | null } | null | undefined)[],
): number {
  // Sum the same lines the breakdown renders, so a missing price cannot
  // land in one place and not the other.
  return buildPriceBreakdown(
    parts.map((part, index) => ({
      category: String(index),
      part:
        part == null
          ? null
          : {
              name: '',
              priceUsd: part.priceUsd,
            },
    })),
  ).reduce((total, line) => total + (line.priceUsd ?? 0), 0)
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatUsd(priceUsd: number): string {
  return usd.format(priceUsd)
}
