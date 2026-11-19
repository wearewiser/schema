import { z } from "zod";
import type { ExtensionKey, Extensions, JobPosting } from "../models";

/**
 * Validates a {@link ContactPoint}.
 */
export const ContactPointSchema = z.object({
  name: z.string(),
  email: z.string(),
});

/**
 * Validates a {@link MonetaryAmount}.
 */
export const MonetaryAmountSchema = z.object({
  currency: z.string(),
  value: z.string(),
});

/**
 * Validates an {@link Organization}.
 */
export const OrganizationSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
});

/**
 * Validates a {@link PostalAddress}.
 */
export const PostalAddressSchema = z.object({
  street_address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
});

/**
 * Validates a {@link Place}.
 */
export const PlaceSchema = z.object({
  address: PostalAddressSchema,
  additional_info: z.string().optional(),
});

/**
 * Validates a {@link BaseJobPosting}. Unknown keys are stripped.
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
});

/**
 * One schema per entry in {@link Extensions}. Unknown keys are stripped.
 */
export const extensionSchemas = {
  employmentSubunit: z.object({ employment_subunit: z.string().optional() }),
  contractType: z.object({ contract_type: z.string().optional() }),
  contractEnd: z.object({ contract_end: z.string().optional() }),
  dateUpdated: z.object({ date_updated: z.string().optional() }),
  postingId: z.object({ posting_id: z.string().optional() }),
  postingUuid: z.object({ posting_uuid: z.string().optional() }),
  officeLocation: z.object({ office_location: PlaceSchema.optional() }),
  locationKeys: z.object({ location_keys: z.array(z.string()) }),
  searchKeys: z.object({ search_keys: z.array(z.string()) }),
  unlisted: z.object({ unlisted: z.boolean() }),
  descriptionSections: z.object({
    job_description_corporate: z.string(),
    job_description_organization: z.string(),
    job_description_short: z.string(),
  }),
  companyName: z.object({ company_name: z.string() }),
  jobProfile: z.object({
    job_profile: z.string(),
    job_profile_code: z.string().optional(),
    job_profile_name: z.string().optional(),
  }),
  rawJobFamily: z.object({
    raw_job_family: z.string().optional(),
    raw_job_sub_family: z.string().optional(),
  }),
  localeUrls: z.object({
    application_url_es: z.string().nullable(),
    application_url_ja: z.string().nullable(),
    application_url_de: z.string().nullable(),
    application_url_cn: z.string().nullable(),
    application_url_fr: z.string().nullable(),
  }),
  businessFilterUrl: z.object({ business_filter_url: z.string().nullable() }),
  linkedinUrl: z.object({ linkedin_job_description_url: z.string() }),
} satisfies { [K in ExtensionKey]: z.ZodType<Extensions[K]> };

/**
 * Every key in {@link Extensions}.
 */
export const EXTENSION_KEYS = Object.keys(extensionSchemas) as readonly ExtensionKey[];

/**
 * Builds the schema for a {@link JobPosting} with the chosen extensions.
 * Fields outside the base and the chosen extensions are stripped.
 *
 * @param extensions - The keys of the extensions the tenant uses.
 * @throws Error if a key is not in {@link Extensions}, or if a chosen extension
 * redefines a base field or another chosen extension's field.
 * @example
 * ```ts
 * const schema = jobPostingSchema(["employmentSubunit", "postingId"]);
 * const vacancy = schema.parse(row); // JobPosting<"employmentSubunit" | "postingId">
 * ```
 */
export function jobPostingSchema<const K extends ExtensionKey = never>(
  extensions: readonly K[] = [],
): z.ZodType<JobPosting<K>> {
  const shape: Record<string, z.ZodType> = { ...BaseJobPostingSchema.shape };
  for (const key of new Set<ExtensionKey>(extensions)) {
    if (!Object.prototype.hasOwnProperty.call(extensionSchemas, key)) {
      throw new Error(`Unknown JobPosting extension "${key}".`);
    }
    for (const [field, schema] of Object.entries(extensionSchemas[key].shape)) {
      if (field in shape) {
        throw new Error(`JobPosting extension "${key}" redefines the field "${field}".`);
      }
      shape[field] = schema;
    }
  }
  return z.object(shape) as unknown as z.ZodType<JobPosting<K>>;
}
