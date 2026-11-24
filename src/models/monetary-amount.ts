import type { z } from "zod";
import type { MonetaryAmountSchema } from "../zod/entities";

/**
 * Represents a monetary amount, including currency and value information.
 *
 * The output type of `MonetaryAmountSchema` in `@wiser/schema/zod`, which holds the field
 * documentation. The import is type-only: the root entry does not load Zod at
 * runtime, but its declarations need Zod's types.
 *
 * @interface
 */
export type MonetaryAmount = z.output<typeof MonetaryAmountSchema>;
