import type { z } from "zod";
import type { ContactPointSchema } from "../zod";

/**
 * Represents contact information for a person or organization.
 */
export interface ContactPoint extends z.output<typeof ContactPointSchema> {}
