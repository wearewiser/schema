import type { z } from "zod";
import type { BaseJobPostingSchema } from "../zod";

/**
 * Represents a job vacancy or opportunity offered by an organization.
 *
 * The output type of `BaseJobPostingSchema` in `@wiser/schema/zod`, which holds
 * the field documentation. The import is type-only: the root entry does not load
 * Zod at runtime, but its declarations need Zod's types.
 *
 * @interface
 */
export type JobPosting = z.output<typeof BaseJobPostingSchema>;
