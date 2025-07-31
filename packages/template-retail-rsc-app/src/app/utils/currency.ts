/**
 * Format a number as a currency string
 * @param price - The price to format
 * @param locale - The locale to use for formatting (default: en-US)
 * @param currency - The currency code to use (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  price: number,
  locale = 'en-US',
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(price);
}