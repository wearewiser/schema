import type { z } from "zod";
import type { PostalAddressSchema } from "../zod/entities";

/**
 * Represents a postal address, providing detailed information about a specific location.
 *
 * The output type of `PostalAddressSchema` in `@wiser/schema/zod`, which holds the field
 * documentation. The import is type-only: the root entry does not load Zod at
 * runtime, but its declarations need Zod's types.
 *
 * @interface
 */
export type PostalAddress = z.output<typeof PostalAddressSchema>;
