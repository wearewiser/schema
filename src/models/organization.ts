import type { z } from "zod";
import type { OrganizationSchema } from "../zod";

/**
 * Represents an organization or company offering a job or other services.
 */
export interface Organization extends z.output<typeof OrganizationSchema> {}
