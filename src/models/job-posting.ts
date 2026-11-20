import { ContactPoint } from "./contact-point";
import { ExtensionKey, Extensions } from "./extensions";
import { MonetaryAmount } from "./monetary-amount";
import { Organization } from "./organization";
import { Place } from "./place";

/**
 * Represents a job vacancy or opportunity offered by an organization.
 *
 * These are the fields every tenant may use. Fields that only some tenants need are
 * listed in {@link Extensions} and added with {@link JobPosting}.
 */
export interface BaseJobPosting {
  /**
   * An ID for the job requistion.
   * @example "JR0001"
   */
  job_req_id: string;

  /**
   * An ID for the job requistion's specific instance when multiple jobs exist.
   * @example "JR0001-01"
   */
  instance_id?: string | undefined;

  /**
   * A title for the job vacancy.
   * @example "Software Engineer"
   */
  job_title: string;

  /**
   * The name of the company or organization offering the job.
   * @example { name: "Tech Corp", url: "https://techcorp.com" }
   */
  hiring_organization: Organization;

  /**
   * A description of the job vacancy.
   * @example "Develop and maintain software applications."
   */
  job_description: string;

  /**
   * The location where the job is available.
   * @example { address: { street_address: "123 Main St", city: "Tech City", region: "TX", postal_code: "12345", country: "USA" } }
   */
  job_location: Place;

  /**
   * Whether the job is remote, hybrid or office-based, as the tenant's ATS words it.
   * Free text for now. schema.org `jobLocationType`.
   * @example "Hybrid"
   */
  job_location_type?: string | undefined;

  /**
   * The URL to apply for the job.
   * @example "https://techcorp.com/careers/apply"
   */
  application_url: string;

  /**
   * The URL of the posting's page on the careers site. schema.org `url`.
   * @example "https://techcorp.com/careers/jobs/JR0001"
   */
  url?: string | undefined;

  /**
   * The monetary amount offered for the job, can be a salary range or hourly rate.
   * @example { currency: "USD", value: "50,000 - 70,000" }
   */
  salary?: MonetaryAmount | undefined;

  /**
   * The type of employment (e.g., full-time, part-time, contract).
   * @example "Full-time"
   */
  employment_type?: string | undefined;

  /**
   * The typical working hours for the job. schema.org `workHours`.
   * @example "37.5"
   */
  work_hours?: string | undefined;

  /**
   * Educational qualifications required for the job.
   * @example "Bachelor's degree in Computer Science or related field"
   */
  education_requirements?: string | undefined;

  /**
   * Experience requirements for the job.
   * @example "2+ years of experience in software development"
   */
  experience_requirements?: string | undefined;

  /**
   * Special qualifications or skills required for the job.
   * @example "Proficiency in JavaScript, experience with React"
   */
  qualifications?: string | undefined;

  /**
   * Any additional benefits offered with the job.
   * @example "Health insurance, 401(k), paid time off"
   * @deprecated Use `job_benefits`, which replaced `benefits` in schema.org.
   */
  benefits?: string | undefined;

  /**
   * The location requirements for the applicant.
   * @example "Applicants must reside in the United States."
   */
  applicant_location_requirements?: string | undefined;

  /**
   * Contact information for the application process.
   * @example { name: "Jane Doe", email: "jane.doe@techcorp.com" }
   */
  application_contact?: ContactPoint | undefined;

  /**
   * Requirements related to eligibility to work in the job's country.
   * @example "Must be authorized to work in the United States."
   */
  eligibility_to_work_requirement?: string | undefined;

  /**
   * Overview or description of the employer.
   * @example "Tech Corp is a leading software company..."
   */
  employer_overview?: string | undefined;

  /**
   * The organizational unit or department offering the job.
   * @example "Software Development"
   */
  employment_unit?: string | undefined;

  /**
   * The estimated salary range for the job.
   * @example { currency: "USD", value: "55,000 - 75,000" }
   */
  estimated_salary?: MonetaryAmount | undefined;

  /**
   * Compensation beyond base salary, such as bonuses or incentives.
   * @example "Annual bonus based on performance."
   */
  incentive_compensation?: string | undefined;

  /**
   * The industry associated with the job.
   * @example "Information Technology"
   */
  industry?: string | undefined;

  /**
   * The specific job benefits offered.
   * @example "Health insurance, retirement plan"
   */
  job_benefits?: string | undefined;

  /**
   * Physical requirements for the job.
   * @example "Must be able to lift 50 pounds."
   */
  physical_requirement?: string | undefined;

  /**
   * Responsibilities associated with the job.
   * @example "Develop and maintain web applications."
   */
  responsibilities?: string | undefined;

  /**
   * Skills required for the job.
   * @example "JavaScript, HTML, CSS"
   */
  skills?: string | undefined;

  /**
   * The start date for the job.
   * @example "2024-09-15T00:00:00Z"
   */
  job_start_date?: string | undefined;

  /**
   * The date when the job posting was published.
   * @example "2024-08-01T00:00:00Z"
   */
  date_posted: string;

  /**
   * The date after which the posting is no longer valid. schema.org `validThrough`.
   * @example "2024-09-01T00:00:00Z"
   */
  valid_through?: string | undefined;
}

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