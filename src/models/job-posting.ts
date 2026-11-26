import type { z } from "zod";
import type { BaseJobPostingSchema } from "../zod";
import type { ExtensionKey, Extensions, PlainKeys, UnionToIntersection } from "../zod/extensions";

/**
 * Represents a job vacancy or opportunity offered by an organization.
 *
 * `JobPosting` alone has the fields every tenant has. `JobPosting<K>` adds the
 * fields of the extensions K, a union of keys of `extensionSchemas` in
 * `@wiser/schema/zod`, as each extension declares them: a required field stays
 * required, an optional one optional and a nullable one nullable.
 *
 * The base is the output type of `BaseJobPostingSchema` in `@wiser/schema/zod`,
 * which holds the field documentation. The imports are type-only: the root
 * entry does not load Zod at runtime, but its declarations need Zod's types.
 *
 * @typeParam K - The keys of the extensions the tenant uses. None by default.
 * A key typed `any` counts as every key, and a branded key as its key.
 * @example
 * ```ts
 * type Vacancy = JobPosting<"postingId" | "unlisted">;
 * // The base fields, plus posting_id?: string and unlisted: boolean.
 * ```
 *
 * @interface
 */
export type JobPosting<K extends ExtensionKey = never> = z.output<typeof BaseJobPostingSchema> &
  UnionToIntersection<Extensions[PlainKeys<K>]>;
