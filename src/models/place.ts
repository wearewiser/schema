import type { z } from "zod";
import type { PlaceSchema } from "../zod/entities";

/**
 * Represents a physical location, typically where a job is based or an event occurs.
 *
 * The output type of `PlaceSchema` in `@wiser/schema/zod`, which holds the field
 * documentation. The import is type-only: the root entry does not load Zod at
 * runtime, but its declarations need Zod's types.
 *
 * @interface
 */
export type Place = z.output<typeof PlaceSchema>;
