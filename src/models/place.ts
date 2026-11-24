import type { z } from "zod";
import type { PlaceSchema } from "../zod";

/**
 * Represents a physical location, typically where a job is based or an event occurs.
 */
export interface Place extends z.output<typeof PlaceSchema> {}
