import { z } from "zod";
import type { JobPosting } from "../models";
import { ContactPointSchema, MonetaryAmountSchema, OrganizationSchema, PlaceSchema } from "./entities";
import { extensionSchemas } from "./extensions";
import type { ExtensionKey, Extensions } from "./extensions";

// Opt-in runtime validation. The root entry, `@wiser/schema`, does not import
// this module, so it neither loads Zod nor needs Zod's type declarations.

export { ContactPointSchema, MonetaryAmountSchema, OrganizationSchema, PlaceSchema, PostalAddressSchema } from "./entities";
export { EXTENSION_KEYS, extensionSchemas } from "./extensions";
export type { ExtensionKey, Extensions } from "./extensions";

/**
 * Validates a {@link JobPosting} with no extensions. Unknown keys are stripped.
 */
export const BaseJobPostingSchema = z.object({
  job_req_id: z.string(),
  instance_id: z.string().optional(),
  job_title: z.string(),
  hiring_organization: OrganizationSchema,
  job_description: z.string(),
  job_location: PlaceSchema,
  job_location_type: z.string().optional(),
  application_url: z.string(),
  url: z.string().optional(),
  salary: MonetaryAmountSchema.optional(),
  employment_type: z.string().optional(),
  work_hours: z.string().optional(),
  education_requirements: z.string().optional(),
  experience_requirements: z.string().optional(),
  qualifications: z.string().optional(),
  benefits: z.string().optional(),
  applicant_location_requirements: z.string().optional(),
  application_contact: ContactPointSchema.optional(),
  eligibility_to_work_requirement: z.string().optional(),
  employer_overview: z.string().optional(),
  employment_unit: z.string().optional(),
  estimated_salary: MonetaryAmountSchema.optional(),
  incentive_compensation: z.string().optional(),
  industry: z.string().optional(),
  job_benefits: z.string().optional(),
  physical_requirement: z.string().optional(),
  responsibilities: z.string().optional(),
  skills: z.string().optional(),
  job_start_date: z.string().optional(),
  date_posted: z.string(),
  valid_through: z.string().optional(),
}) satisfies z.ZodType<JobPosting>;

/**
 * Turns a union of object types into the intersection of those types.
 */
type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * The output of {@link BaseJobPostingSchema}. It matches {@link JobPosting}, but
 * it comes from the validator, so augmenting `JobPosting` does not change it and
 * an optional field may hold `undefined`, as Zod keeps a key given as undefined.
 */
export type BaseJobPostingOutput = z.output<typeof BaseJobPostingSchema>;

/**
 * The output of {@link jobPostingSchema} for the extensions K: the base output
 * plus the fields of the extensions K, each optional.
 *
 * The fields are optional even when an extension requires them, because the
 * type cannot tell which keys a list built at runtime holds. The schema still
 * requires them. A key typed `any` counts as every key.
 */
export type JobPostingWithExtensions<K extends ExtensionKey> = [K] extends [never]
  ? BaseJobPostingOutput
  : BaseJobPostingOutput & Partial<UnionToIntersection<Extensions[unknown extends K ? ExtensionKey : K]>>;

/**
 * Builds the schema for a {@link JobPosting} with the chosen extensions.
 * Fields outside the base and the chosen extensions are stripped.
 *
 * @param extensions - The keys of the extensions the tenant uses.
 * @throws Error if a key is not in {@link extensionSchemas}, or if a chosen
 * extension redefines a base field or another chosen extension's field.
 * @example
 * ```ts
 * const schema = jobPostingSchema(["employmentSubunit", "postingId"]);
 * const vacancy = schema.parse(row);
 * ```
 */
export function jobPostingSchema<K extends ExtensionKey = never>(
  extensions?: readonly K[],
): z.ZodType<JobPostingWithExtensions<K>>;
export function jobPostingSchema(extensions: readonly ExtensionKey[] = []): z.ZodType {
  const shape: Record<string, z.ZodType> = { ...BaseJobPostingSchema.shape };
  for (const key of new Set(extensions)) {
    if (!Object.prototype.hasOwnProperty.call(extensionSchemas, key)) {
      throw new Error(`Unknown JobPosting extension "${key}".`);
    }
    const fields: Record<string, z.ZodType> = extensionSchemas[key].shape;
    for (const field of Object.keys(fields)) {
      if (Object.prototype.hasOwnProperty.call(shape, field)) {
        throw new Error(`JobPosting extension "${key}" redefines the field "${field}".`);
      }
      shape[field] = fields[field];
    }
  }
  return z.object(shape);
}
