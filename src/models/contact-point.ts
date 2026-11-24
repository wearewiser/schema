import type { z } from "zod";
import type { ContactPointSchema } from "../zod/entities";

/**
 * Represents contact information for a person or organization.
 *
 * The output type of `ContactPointSchema` in `@wiser/schema/zod`, which holds the field
 * documentation. The import is type-only: the root entry does not load Zod at
 * runtime, but its declarations need Zod's types.
 *
 * @interface
 */
export type ContactPoint = z.output<typeof ContactPointSchema>;
