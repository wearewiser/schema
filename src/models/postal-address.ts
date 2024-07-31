/**
 * Represents a postal address, providing detailed information about a specific location.
 */
export interface PostalAddress {
  /**
   * The street address.
   * @example "123 Main St"
   */
  street_address: string;

  /**
   * The locality (city or town).
   * @example "Tech City"
   */
  address_locality: string;

  /**
   * The region (state or province).
   * @example "TX"
   */
  address_region: string;

  /**
   * The postal code.
   * @example "12345"
   */
  postal_code: string;

  /**
   * The country.
   * @example "USA"
   */
  address_country: string;
}
