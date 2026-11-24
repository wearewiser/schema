import type { z } from "zod";
import type { extensionSchemas } from "../zod";

/**
 * The output of each schema in `extensionSchemas`.
 */
type ExtensionOutputs = {
  [K in keyof typeof extensionSchemas]: z.output<(typeof extensionSchemas)[K]>;
};

/**
 * The allow list of fields a tenant may add to {@link BaseJobPosting}.
 *
 * Each entry is one extension. A tenant chooses extensions by key, for example
 * `JobPosting<"employmentSubunit" | "postingId">`. A field goes here only when
 * schema.org `JobPosting` has no property for it. Otherwise it goes on
 * {@link BaseJobPosting} as an optional field.
 */
export interface Extensions extends ExtensionOutputs {}

/**
 * The key of an entry in {@link Extensions}.
 */
export type ExtensionKey = keyof Extensions;
