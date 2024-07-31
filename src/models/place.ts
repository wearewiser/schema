import { PostalAddress } from "./postal-address";

/**
 * Represents a physical location, typically where a job is based or an event occurs.
 */
export interface Place {
  /**
   * The address of the place, using a structured postal address.
   * @example { street_address: "123 Main St", address_locality: "Tech City", address_region: "TX", postal_code: "12345", address_country: "USA" }
   */
  address: PostalAddress;

  /**
   * Additional details about the place (optional).
   * @example "Office Building"
   */
  additional_info?: string;
}