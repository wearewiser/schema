import type { z } from "zod";
import type { MonetaryAmountSchema } from "../zod";

/**
 * Represents a monetary amount, including currency and value information.
 */
export interface MonetaryAmount extends z.output<typeof MonetaryAmountSchema> {}
