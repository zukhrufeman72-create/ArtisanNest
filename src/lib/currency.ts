export function formatPrice(price: number): string {
  return `Rs. ${Math.round(price).toLocaleString('en-PK')}`
}

export function formatPriceCompact(price: number): string {
  return `Rs. ${Math.round(price).toLocaleString()}`
}
