import { z } from "zod";
// Type-only import so the {@link JobPosting} below resolves for TypeDoc and editors.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JobPosting } from "../models";
import { ContactPointSchema, MonetaryAmountSchema, OrganizationSchema, PlaceSchema } from "./entities";

// Opt-in runtime validation. The root entry, `@wiser/schema`, does not load this
// module at runtime. Its JobPosting type is inferred from BaseJobPostingSchema,
// so its declarations import this module's types and Zod's, type-only.

export { ContactPointSchema, MonetaryAmountSchema, OrganizationSchema, PlaceSchema, PostalAddressSchema } from "./entities";
export { EXTENSION_KEYS, extensionSchemas } from "./extensions";
export type { ExtensionKey } from "./extensions";

/**
 * Validates a {@link JobPosting} with no extensions. Unknown keys are stripped.
 * It is the source of `JobPosting`, which is its output type.
 *
 * To validate the fields of extensions too, extend it with their shapes. The
 * output has the same fields as `JobPosting<K>` for the extensions added.
 * @example
 * ```ts
 * const VacancySchema = BaseJobPostingSchema.extend({
 *   ...extensionSchemas.unlisted.shape,
 *   ...extensionSchemas.postingId.shape,
 * });
 * const vacancy = VacancySchema.parse(row); // throws if the row has no `unlisted`
 * vacancy.unlisted; // boolean
 * vacancy.posting_id; // string | undefined
 * ```
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
   * The location where the job is available, or a list of locations when there
   * are several. A single location stays a single object; a list stays a list.
   * @example { address: { street_address: "123 Main St", address_locality: "Tech City", address_region: "TX", postal_code: "12345", address_country: "USA" } }
   * @example [{ address: { city: "London" } }, { address: { city: "Leeds" } }]
   */
  job_location: z.union([PlaceSchema, z.array(PlaceSchema)]),

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
