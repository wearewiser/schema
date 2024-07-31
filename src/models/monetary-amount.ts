/**
 * Represents a monetary amount, including currency and value information.
 */
export interface MonetaryAmount {
  /**
   * The currency of the monetary amount.
   * @example "USD"
   */
  currency: string;

  /**
   * The value of the monetary amount, could be a range.
   * @example "50,000 - 70,000"
   */
  value: string;
}