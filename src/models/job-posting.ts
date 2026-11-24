import type { z } from "zod";
import type { BaseJobPostingSchema } from "../zod";
import type { ExtensionKey, Extensions } from "./extensions";

/**
 * Represents a job vacancy or opportunity offered by an organization.
 *
 * These are the fields every tenant may use. Fields that only some tenants need are
 * listed in {@link Extensions} and added with {@link JobPosting}.
 */
export interface BaseJobPosting extends z.output<typeof BaseJobPostingSchema> {}

/**
 * Turns a union of object types into the intersection of those types.
 */
type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Represents a job vacancy or opportunity offered by an organization, with the
 * fields of the chosen {@link Extensions}.
 *
 * With no argument it is exactly {@link BaseJobPosting}. A key that is not in
 * {@link Extensions} does not compile.
 *
 * @typeParam K - The keys of the extensions the tenant uses.
 * @example
 * ```ts
 * type Vacancy = JobPosting<"employmentSubunit" | "postingId">;
 * ```
 */
export type JobPosting<K extends ExtensionKey = never> =
  [K] extends [never] ? BaseJobPosting : BaseJobPosting & UnionToIntersection<Extensions[K]>;
