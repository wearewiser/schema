import { z } from "zod";
import type { ContactPoint, JobPosting, MonetaryAmount, Organization, Place, PostalAddress } from "../models";

// Opt-in runtime validation. The root entry, `@wiser/schema`, does not import
// this module, so it neither loads Zod nor needs Zod's type declarations.

/**
 * Validates a {@link ContactPoint}.
 */
export const ContactPointSchema = z.object({
  name: z.string(),
  email: z.string(),
}) satisfies z.ZodType<ContactPoint>;

/**
 * Validates a {@link MonetaryAmount}.
 */
export const MonetaryAmountSchema = z.object({
  currency: z.string(),
  value: z.string(),
}) satisfies z.ZodType<MonetaryAmount>;

/**
 * Validates an {@link Organization}.
 */
export const OrganizationSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
}) satisfies z.ZodType<Organization>;

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
}) satisfies z.ZodType<PostalAddress>;

/**
 * Validates a {@link Place}.
 */
export const PlaceSchema = z.object({
  address: PostalAddressSchema,
  additional_info: z.string().optional(),
}) satisfies z.ZodType<Place>;

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
  application_url: z.string(),
  salary: MonetaryAmountSchema.optional(),
  employment_type: z.string().optional(),
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
}) satisfies z.ZodType<JobPosting>;

/**
 * The allow list of extensions a tenant may add to a {@link JobPosting}, one
 * schema per extension. Unknown keys are stripped.
 *
 * A field goes here only when schema.org `JobPosting` has no property for it.
 */
export const extensionSchemas = {
  /**
   * The finer organizational level. `employment_unit` holds the coarser one.
   */
  employmentSubunit: z.object({
    /**
     * The team or sub-department within `employment_unit`.
     * @example "Frontend"
     */
    employment_subunit: z.string().optional(),
  }),

  /**
   * The contract basis. `employment_type` keeps the time basis.
   */
  contractType: z.object({
    /**
     * Permanent, fixed term, intern and so on.
     * @example "Fixed Term"
     */
    contract_type: z.string().optional(),
  }),

  /**
   * The end of a fixed-term contract.
   */
  contractEnd: z.object({
    /**
     * The date the contract ends.
     * @example "2025-03-31"
     */
    contract_end: z.string().optional(),
  }),

  /**
   * When the posting last changed in the ATS.
   */
  dateUpdated: z.object({
    /**
     * The date the posting was last updated.
     * @example "2024-08-15T09:30:00Z"
     */
    date_updated: z.string().optional(),
  }),

  /**
   * The ATS's id for the posting, as distinct from the requisition.
   */
  postingId: z.object({
    /**
     * The posting id.
     * @example "744000012345678"
     */
    posting_id: z.string().optional(),
  }),

  /**
   * The ATS's uuid for the posting.
   */
  postingUuid: z.object({
    /**
     * The posting uuid.
     * @example "3f1c2b8e-6d1a-4c5e-9f0a-1b2c3d4e5f60"
     */
    posting_uuid: z.string().optional(),
  }),

  /**
   * A second location beside `job_location`.
   */
  officeLocation: z.object({
    /**
     * The office the job reports to.
     * @example { address: { city: "Atlanta", region: "GA", country: "United States" } }
     */
    office_location: PlaceSchema.optional(),
  }),

  /**
   * Search terms for the job's location.
   */
  locationKeys: z.object({
    /**
     * Location terms that widen location search. Never displayed.
     * @example ["London", "Greater London", "UK"]
     */
    location_keys: z.array(z.string()),
  }),

  /**
   * Search terms for the job's team.
   */
  searchKeys: z.object({
    /**
     * Team terms that widen keyword search. Never displayed.
     * @example ["engineering", "software", "developer"]
     */
    search_keys: z.array(z.string()),
  }),

  /**
   * Hides the posting from listings and feeds.
   */
  unlisted: z.object({
    /**
     * True when the posting can be reached by id but is not listed.
     * @example false
     */
    unlisted: z.boolean(),
  }),

  /**
   * Description sections kept beside `job_description`.
   */
  descriptionSections: z.object({
    /**
     * The corporate description.
     * @example "<p>About the company...</p>"
     */
    job_description_corporate: z.string(),
    /**
     * The organization description.
     * @example "<p>About the team...</p>"
     */
    job_description_organization: z.string(),
    /**
     * The short description.
     * @example "Build and run our checkout."
     */
    job_description_short: z.string(),
  }),

  /**
   * The company within the group that offers the job.
   */
  companyName: z.object({
    /**
     * The company name.
     * @example "Example Holdings Ltd"
     */
    company_name: z.string(),
  }),

  /**
   * The ATS's job profile.
   */
  jobProfile: z.object({
    /**
     * The job profile.
     * @example "40012 - Clinical Research Associate"
     */
    job_profile: z.string(),
    /**
     * The code part of the job profile.
     * @example "40012"
     */
    job_profile_code: z.string().optional(),
    /**
     * The name part of the job profile.
     * @example "Clinical Research Associate"
     */
    job_profile_name: z.string().optional(),
  }),

  /**
   * The job family as the ATS sends it, before mapping to `employment_unit`.
   */
  rawJobFamily: z.object({
    /**
     * The source job family.
     * @example "Clinical Operations"
     */
    raw_job_family: z.string().optional(),
    /**
     * The source job sub-family.
     * @example "Clinical Monitoring"
     */
    raw_job_sub_family: z.string().optional(),
  }),

  /**
   * `application_url` for each careers-site locale. Null when there is no localized URL.
   */
  localeUrls: z.object({
    /**
     * Spanish.
     * @example "https://example.wd1.myworkdayjobs.com/es/careers/job/R123"
     */
    application_url_es: z.string().nullable(),
    /**
     * Japanese.
     * @example "https://example.wd1.myworkdayjobs.com/ja-JP/careers/job/R123"
     */
    application_url_ja: z.string().nullable(),
    /**
     * German.
     * @example "https://example.wd1.myworkdayjobs.com/de-DE/careers/job/R123"
     */
    application_url_de: z.string().nullable(),
    /**
     * Chinese.
     * @example "https://example.wd1.myworkdayjobs.com/zh-CN/careers/job/R123"
     */
    application_url_cn: z.string().nullable(),
    /**
     * French.
     * @example "https://example.wd1.myworkdayjobs.com/fr-FR/careers/job/R123"
     */
    application_url_fr: z.string().nullable(),
  }),

  /**
   * A careers-site URL filtered to the job's business.
   */
  businessFilterUrl: z.object({
    /**
     * The filtered URL. Null when the job has no business.
     * @example "https://jobs.example.com/jobs?businesses=Labs"
     */
    business_filter_url: z.string().nullable(),
  }),

  /**
   * The posting's careers-site URL tagged for LinkedIn.
   */
  linkedinUrl: z.object({
    /**
     * The URL to use in the LinkedIn feed.
     * @example "https://careers.example.com/jobs/JR0001?utm_source=linkedIn"
     */
    linkedin_job_description_url: z.string(),
  }),
};

/**
 * The key of an entry in {@link extensionSchemas}.
 */
export type ExtensionKey = keyof typeof extensionSchemas;

/**
 * The fields each extension adds, by key.
 */
export type Extensions = { [K in ExtensionKey]: z.output<(typeof extensionSchemas)[K]> };

/**
 * Every key in {@link extensionSchemas}.
 */
export const EXTENSION_KEYS = Object.keys(extensionSchemas) as readonly ExtensionKey[];

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
