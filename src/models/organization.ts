import type { z } from "zod";
import type { OrganizationSchema } from "../zod/entities";

/**
 * Represents an organization or company offering a job or other services.
 *
 * The output type of `OrganizationSchema` in `@wiser/schema/zod`, which holds the field
 * documentation. The import is type-only: the root entry does not load Zod at
 * runtime, but its declarations need Zod's types.
 *
 * @interface
 */
export type Organization = z.output<typeof OrganizationSchema>;
