export type PricedPart = {
  priceUsd: number
}

export function totalPriceUsd(
  parts: readonly (PricedPart | null | undefined)[],
): number {
  return parts.reduce((total, part) => total + (part?.priceUsd ?? 0), 0)
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatUsd(priceUsd: number): string {
  return usd.format(priceUsd)
}
