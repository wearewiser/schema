/**
 * Represents a postal address, providing detailed information about a specific location.
 */
export interface PostalAddress {
  /**
   * The street address.
   * @example "123 Main St"
   */
  street_address?: string | undefined;

  /**
   * The locality (city or town).
   * @example "Tech City"
   */
  city?: string | undefined;

  /**
   * The region (state or province).
   * @example "TX"
   */
  region?: string | undefined;

  /**
   * The postal code.
   * @example "12345"
   */
  postal_code?: string | undefined;

  /**
   * The country.
   * @example "USA"
   */
  country?: string | undefined;

  /**
   * The country code.
   * @example "US"
   */
  country_code?: string | undefined;
}
