import { z } from "zod";
import type { ContactPoint, MonetaryAmount, Organization, Place, PostalAddress } from "../models";

/**
 * Validates a {@link ContactPoint}.
 */
export const ContactPointSchema = z.object({
  name: z.string(),
  email: z.string(),
}) satisfies z.ZodType<ContactPoint>;

/**
 * Validates a {@link MonetaryAmount}.
 */
export const MonetaryAmountSchema = z.object({
  currency: z.string(),
  value: z.string(),
}) satisfies z.ZodType<MonetaryAmount>;

/**
 * Validates an {@link Organization}.
 */
export const OrganizationSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
}) satisfies z.ZodType<Organization>;

/**
 * Validates a {@link PostalAddress}.
 */
export const PostalAddressSchema = z.object({
  street_address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
}) satisfies z.ZodType<PostalAddress>;

/**
 * Validates a {@link Place}.
 */
export const PlaceSchema = z.object({
  address: PostalAddressSchema,
  additional_info: z.string().optional(),
}) satisfies z.ZodType<Place>;
