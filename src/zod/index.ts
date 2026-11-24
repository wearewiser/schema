import { z } from "zod";
import type { BaseJobPosting, ExtensionKey, JobPosting } from "../models";

// These schemas are the source of truth. The types exported from `@wiser/schema`
// are their outputs, and the TSDoc on each field here is the TSDoc of that type's field.

/**
 * Validates a {@link ContactPoint}.
 */
export const ContactPointSchema = z.object({
  /**
   * The name of the contact person.
   * @example "Jane Doe"
   */
  name: z.string(),

  /**
   * The email address of the contact person.
   * @example "jane.doe@techcorp.com"
   */
  email: z.string(),
});

/**
 * Validates a {@link MonetaryAmount}.
 */
export const MonetaryAmountSchema = z.object({
  /**
   * The currency of the monetary amount.
   * @example "USD"
   */
  currency: z.string(),

  /**
   * The value of the monetary amount, could be a range.
   * @example "50,000 - 70,000"
   */
  value: z.string(),
});

/**
 * Validates an {@link Organization}.
 */
export const OrganizationSchema = z.object({
  /**
   * The name of the organization.
   * @example "Tech Corp"
   */
  name: z.string(),

  /**
   * The URL of the organization.
   * @example "https://techcorp.com"
   */
  url: z.string().optional(),
});

/**
 * Validates a {@link PostalAddress}.
 */
export const PostalAddressSchema = z.object({
  /**
   * The street address.
   * @example "123 Main St"
   */
  street_address: z.string().optional(),

  /**
   * The locality (city or town).
   * @example "Tech City"
   */
  city: z.string().optional(),

  /**
   * The region (state or province).
   * @example "TX"
   */
  region: z.string().optional(),

  /**
   * The postal code.
   * @example "12345"
   */
  postal_code: z.string().optional(),

  /**
   * The country.
   * @example "USA"
   */
  country: z.string().optional(),

  /**
   * The country code.
   * @example "US"
   */
  country_code: z.string().optional(),
});

/**
 * Validates a {@link Place}.
 */
export const PlaceSchema = z.object({
  /**
   * The address of the place, using a structured postal address.
   * @example { street_address: "123 Main St", city: "Tech City", region: "TX", postal_code: "12345", country: "USA" }
   */
  address: PostalAddressSchema,

  /**
   * Additional details about the place (optional).
   * @example "Office Building"
   */
  additional_info: z.string().optional(),
});

/**
 * Validates a {@link BaseJobPosting}. Unknown keys are stripped.
 */
export const BaseJobPostingSchema = z.object({
  /**
   * An ID for the job requistion.
   * @example "JR0001"
   */
  job_req_id: z.string(),

  /**
   * An ID for the job requistion's specific instance when multiple jobs exist.
   * @example "JR0001-01"
   */
  instance_id: z.string().optional(),

  /**
   * A title for the job vacancy.
   * @example "Software Engineer"
   */
  job_title: z.string(),

  /**
   * The name of the company or organization offering the job.
   * @example { name: "Tech Corp", url: "https://techcorp.com" }
   */
  hiring_organization: OrganizationSchema,

  /**
   * A description of the job vacancy.
   * @example "Develop and maintain software applications."
   */
  job_description: z.string(),

  /**
   * The location where the job is available.
   * @example { address: { street_address: "123 Main St", city: "Tech City", region: "TX", postal_code: "12345", country: "USA" } }
   */
  job_location: PlaceSchema,

  /**
   * Whether the job is remote, hybrid or office-based, as the tenant's ATS words it.
   * Free text for now. schema.org `jobLocationType`.
   * @example "Hybrid"
   */
  job_location_type: z.string().optional(),

  /**
   * The URL to apply for the job.
   * @example "https://techcorp.com/careers/apply"
   */
  application_url: z.string(),

  /**
   * The URL of the posting's page on the careers site. schema.org `url`.
   * @example "https://techcorp.com/careers/jobs/JR0001"
   */
  url: z.string().optional(),

  /**
   * The monetary amount offered for the job, can be a salary range or hourly rate.
   * @example { currency: "USD", value: "50,000 - 70,000" }
   */
  salary: MonetaryAmountSchema.optional(),

  /**
   * The type of employment (e.g., full-time, part-time, contract).
   * @example "Full-time"
   */
  employment_type: z.string().optional(),

  /**
   * The typical working hours for the job. schema.org `workHours`.
   * @example "37.5"
   */
  work_hours: z.string().optional(),

  /**
   * Educational qualifications required for the job.
   * @example "Bachelor's degree in Computer Science or related field"
   */
  education_requirements: z.string().optional(),

  /**
   * Experience requirements for the job.
   * @example "2+ years of experience in software development"
   */
  experience_requirements: z.string().optional(),

  /**
   * Special qualifications or skills required for the job.
   * @example "Proficiency in JavaScript, experience with React"
   */
  qualifications: z.string().optional(),

  /**
   * Any additional benefits offered with the job.
   * @example "Health insurance, 401(k), paid time off"
   * @deprecated Use `job_benefits`, which replaced `benefits` in schema.org.
   */
  benefits: z.string().optional(),

  /**
   * The location requirements for the applicant.
   * @example "Applicants must reside in the United States."
   */
  applicant_location_requirements: z.string().optional(),

  /**
   * Contact information for the application process.
   * @example { name: "Jane Doe", email: "jane.doe@techcorp.com" }
   */
  application_contact: ContactPointSchema.optional(),

  /**
   * Requirements related to eligibility to work in the job's country.
   * @example "Must be authorized to work in the United States."
   */
  eligibility_to_work_requirement: z.string().optional(),

  /**
   * Overview or description of the employer.
   * @example "Tech Corp is a leading software company..."
   */
  employer_overview: z.string().optional(),

  /**
   * The organizational unit or department offering the job.
   * @example "Software Development"
   */
  employment_unit: z.string().optional(),

  /**
   * The estimated salary range for the job.
   * @example { currency: "USD", value: "55,000 - 75,000" }
   */
  estimated_salary: MonetaryAmountSchema.optional(),

  /**
   * Compensation beyond base salary, such as bonuses or incentives.
   * @example "Annual bonus based on performance."
   */
  incentive_compensation: z.string().optional(),

  /**
   * The industry associated with the job.
   * @example "Information Technology"
   */
  industry: z.string().optional(),

  /**
   * The specific job benefits offered.
   * @example "Health insurance, retirement plan"
   */
  job_benefits: z.string().optional(),

  /**
   * Physical requirements for the job.
   * @example "Must be able to lift 50 pounds."
   */
  physical_requirement: z.string().optional(),

  /**
   * Responsibilities associated with the job.
   * @example "Develop and maintain web applications."
   */
  responsibilities: z.string().optional(),

  /**
   * Skills required for the job.
   * @example "JavaScript, HTML, CSS"
   */
  skills: z.string().optional(),

  /**
   * The start date for the job.
   * @example "2024-09-15T00:00:00Z"
   */
  job_start_date: z.string().optional(),

  /**
   * The date when the job posting was published.
   * @example "2024-08-01T00:00:00Z"
   */
  date_posted: z.string(),

  /**
   * The date after which the posting is no longer valid. schema.org `validThrough`.
   * @example "2024-09-01T00:00:00Z"
   */
  valid_through: z.string().optional(),
});

/**
 * One schema per entry in {@link Extensions}. Unknown keys are stripped.
 *
 * A field goes here only when schema.org `JobPosting` has no property for it.
 * Otherwise it goes on {@link BaseJobPostingSchema} as an optional field.
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
     * @example "IQVIA RDS Inc."
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
 * Every key in {@link Extensions}.
 */
export const EXTENSION_KEYS = Object.keys(extensionSchemas) as readonly ExtensionKey[];

/**
 * True when T is a single type rather than a union.
 */
type IsSingle<T, All = T> = T extends unknown ? ([All] extends [T] ? true : false) : never;

/**
 * True when the list T names its extensions exactly: one tuple, such as
 * `readonly ["postingId", "unlisted"]`, whose every element is a single key.
 */
type IsExact<T extends readonly ExtensionKey[]> = IsSingle<T> extends true
  ? number extends T["length"]
    ? false
    : [{ [I in keyof T]: IsSingle<T[I]> }[number]] extends [true]
      ? true
      : false
  : false;

/**
 * The output of {@link jobPostingSchema} for the list T. It is exactly
 * `JobPosting<K>` for an exact list. Otherwise every field of every extension
 * that may be in the list is optional.
 */
type JobPostingSchemaOutput<T extends readonly ExtensionKey[]> = IsExact<T> extends true
  ? JobPosting<T[number]>
  : BaseJobPosting & Partial<JobPosting<T[number]>>;

/**
 * Builds the schema for a {@link JobPosting} with the chosen extensions.
 * Fields outside the base and the chosen extensions are stripped.
 *
 * With a literal list of keys the output is exactly `JobPosting<K>`. With any
 * other list, such as `string[]` from config cast to `ExtensionKey[]`, the fields
 * of every extension that may be in the list are optional. Either way the schema
 * still requires the required fields of the extensions it was built with.
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
export function jobPostingSchema(): z.ZodType<BaseJobPosting>;
export function jobPostingSchema<const T extends readonly ExtensionKey[]>(
  extensions: T,
): z.ZodType<JobPostingSchemaOutput<T>>;
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
