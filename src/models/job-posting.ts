import { ContactPoint } from "./contact-point";
import { MonetaryAmount } from "./monetary-amount";
import { Organization } from "./organization";
import { Place } from "./place";

/**
 * Represents a job vacancy or opportunity offered by an organization.
 */
export interface JobPosting {
  /**
   * An ID for the job requistion.
   * @example "JR0001"
   */
  job_req_id: string;

  /**
   * An ID for the job requistion's specific instance when multiple jobs exist.
   * @example "JR0001-01"
   */
  instance_id?: string;

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
   * @example { address: { street_address: "123 Main St", address_locality: "Tech City", address_region: "TX", postal_code: "12345", address_country: "USA" } }
   */
  job_location: Place;

  /**
   * The URL to apply for the job.
   * @example "https://techcorp.com/careers/apply"
   */
  application_url: string;

  /**
   * The monetary amount offered for the job, can be a salary range or hourly rate.
   * @example { currency: "USD", value: "50,000 - 70,000" }
   */
  salary?: MonetaryAmount;

  /**
   * The type of employment (e.g., full-time, part-time, contract).
   * @example "Full-time"
   */
  employment_type?: string;

  /**
   * Educational qualifications required for the job.
   * @example "Bachelor's degree in Computer Science or related field"
   */
  education_requirements?: string;

  /**
   * Experience requirements for the job.
   * @example "2+ years of experience in software development"
   */
  experience_requirements?: string;

  /**
   * Special qualifications or skills required for the job.
   * @example "Proficiency in JavaScript, experience with React"
   */
  qualifications?: string;

  /**
   * Any additional benefits offered with the job.
   * @example "Health insurance, 401(k), paid time off"
   */
  benefits?: string;

  /**
   * The location requirements for the applicant.
   * @example "Applicants must reside in the United States."
   */
  applicant_location_requirements?: string;

  /**
   * Contact information for the application process.
   * @example { name: "Jane Doe", email: "jane.doe@techcorp.com" }
   */
  application_contact?: ContactPoint;

  /**
   * Requirements related to eligibility to work in the job's country.
   * @example "Must be authorized to work in the United States."
   */
  eligibility_to_work_requirement?: string;

  /**
   * Overview or description of the employer.
   * @example "Tech Corp is a leading software company..."
   */
  employer_overview?: string;

  /**
   * The organizational unit or department offering the job.
   * @example "Software Development"
   */
  employment_unit?: string;

  /**
   * The estimated salary range for the job.
   * @example { currency: "USD", value: "55,000 - 75,000" }
   */
  estimated_salary?: MonetaryAmount;

  /**
   * Compensation beyond base salary, such as bonuses or incentives.
   * @example "Annual bonus based on performance."
   */
  incentive_compensation?: string;

  /**
   * The industry associated with the job.
   * @example "Information Technology"
   */
  industry?: string;

  /**
   * The specific job benefits offered.
   * @example "Health insurance, retirement plan"
   */
  job_benefits?: string;

  /**
   * Physical requirements for the job.
   * @example "Must be able to lift 50 pounds."
   */
  physical_requirement?: string;

  /**
   * Responsibilities associated with the job.
   * @example "Develop and maintain web applications."
   */
  responsibilities?: string;

  /**
   * Skills required for the job.
   * @example "JavaScript, HTML, CSS"
   */
  skills?: string;

  /**
   * The start date for the job.
   * @example "2024-09-15T00:00:00Z"
   */
  job_start_date?: string;

  /**
   * The date when the job posting was published.
   * @example "2024-08-01T00:00:00Z"
   */
  date_posted: string;

}