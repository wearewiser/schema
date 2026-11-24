import { z } from "zod";

/**
 * Validates a `ContactPoint`. Unknown keys are stripped.
 * It is the source of `ContactPoint`, which is its output type.
 */
export const ContactPointSchema = z.object({
  /**
   * The name of the contact person.
   * @example "Jane Doe"
   */
  name: z.string(),

  /**
   * The email address of the contact person.
   * @example "jane.doe@techcorp.com"
   */
  email: z.string(),
});

/**
 * Validates a `MonetaryAmount`. Unknown keys are stripped.
 * It is the source of `MonetaryAmount`, which is its output type.
 */
export const MonetaryAmountSchema = z.object({
  /**
   * The currency of the monetary amount.
   * @example "USD"
   */
  currency: z.string(),

  /**
   * The value of the monetary amount, could be a range.
   * @example "50,000 - 70,000"
   */
  value: z.string(),
});

/**
 * Validates an `Organization`. Unknown keys are stripped.
 * It is the source of `Organization`, which is its output type.
 */
export const OrganizationSchema = z.object({
  /**
   * The name of the organization.
   * @example "Tech Corp"
   */
  name: z.string(),

  /**
   * The URL of the organization.
   * @example "https://techcorp.com"
   */
  url: z.string().optional(),
});

/**
 * Validates a `PostalAddress`. Unknown keys are stripped.
 * It is the source of `PostalAddress`, which is its output type.
 */
export const PostalAddressSchema = z.object({
  /**
   * The street address.
   * @example "123 Main St"
   */
  street_address: z.string().optional(),

  /**
   * The locality (city or town).
   * @example "Tech City"
   */
  city: z.string().optional(),

  /**
   * The region (state or province).
   * @example "TX"
   */
  region: z.string().optional(),

  /**
   * The postal code.
   * @example "12345"
   */
  postal_code: z.string().optional(),

  /**
   * The country.
   * @example "USA"
   */
  country: z.string().optional(),

  /**
   * The country.
   * @example "USA"
   */
  country_code: z.string().optional(),
});

/**
 * Validates a `Place`. Unknown keys are stripped.
 * It is the source of `Place`, which is its output type.
 */
export const PlaceSchema = z.object({
  /**
   * The address of the place, using a structured postal address.
   * @example { street_address: "123 Main St", address_locality: "Tech City", address_region: "TX", postal_code: "12345", address_country: "USA" }
   */
  address: PostalAddressSchema,

  /**
   * Additional details about the place (optional).
   * @example "Office Building"
   */
  additional_info: z.string().optional(),
});
