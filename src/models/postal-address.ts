import type { z } from "zod";
import type { PostalAddressSchema } from "../zod";

/**
 * Represents a postal address, providing detailed information about a specific location.
 */
export interface PostalAddress extends z.output<typeof PostalAddressSchema> {}
