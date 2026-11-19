import { Place } from "./place";

/**
 * The allow list of fields a tenant may add to {@link BaseJobPosting}.
 *
 * Each entry is one extension. A tenant chooses extensions by key, for example
 * `JobPosting<"employmentSubunit" | "postingId">`. A field goes here only when
 * schema.org `JobPosting` has no property for it. Otherwise it goes on
 * {@link BaseJobPosting} as an optional field.
 */
export interface Extensions {
  /**
   * The finer organizational level. `employment_unit` holds the coarser one.
   */
  employmentSubunit: {
    /**
     * The team or sub-department within `employment_unit`.
     * @example "Frontend"
     */
    employment_subunit?: string | undefined;
  };

  /**
   * The contract basis. `employment_type` keeps the time basis.
   */
  contractType: {
    /**
     * Permanent, fixed term, intern and so on.
     * @example "Fixed Term"
     */
    contract_type?: string | undefined;
  };

  /**
   * The end of a fixed-term contract.
   */
  contractEnd: {
    /**
     * The date the contract ends.
     * @example "2025-03-31"
     */
    contract_end?: string | undefined;
  };

  /**
   * When the posting last changed in the ATS.
   */
  dateUpdated: {
    /**
     * The date the posting was last updated.
     * @example "2024-08-15T09:30:00Z"
     */
    date_updated?: string | undefined;
  };

  /**
   * The ATS's id for the posting, as distinct from the requisition.
   */
  postingId: {
    /**
     * The posting id.
     * @example "744000012345678"
     */
    posting_id?: string | undefined;
  };

  /**
   * The ATS's uuid for the posting.
   */
  postingUuid: {
    /**
     * The posting uuid.
     * @example "3f1c2b8e-6d1a-4c5e-9f0a-1b2c3d4e5f60"
     */
    posting_uuid?: string | undefined;
  };

  /**
   * A second location beside `job_location`.
   */
  officeLocation: {
    /**
     * The office the job reports to.
     * @example { address: { city: "Atlanta", region: "GA", country: "United States" } }
     */
    office_location?: Place | undefined;
  };

  /**
   * Search terms for the job's location.
   */
  locationKeys: {
    /**
     * Location terms that widen location search. Never displayed.
     * @example ["London", "Greater London", "UK"]
     */
    location_keys: string[];
  };

  /**
   * Search terms for the job's team.
   */
  searchKeys: {
    /**
     * Team terms that widen keyword search. Never displayed.
     * @example ["engineering", "software", "developer"]
     */
    search_keys: string[];
  };

  /**
   * Hides the posting from listings and feeds.
   */
  unlisted: {
    /**
     * True when the posting can be reached by id but is not listed.
     * @example false
     */
    unlisted: boolean;
  };

  /**
   * Description sections kept beside `job_description`.
   */
  descriptionSections: {
    /**
     * The corporate description.
     * @example "<p>About the company...</p>"
     */
    job_description_corporate: string;
    /**
     * The organization description.
     * @example "<p>About the team...</p>"
     */
    job_description_organization: string;
    /**
     * The short description.
     * @example "Build and run our checkout."
     */
    job_description_short: string;
  };

  /**
   * The company within the group that offers the job.
   */
  companyName: {
    /**
     * The company name.
     * @example "IQVIA RDS Inc."
     */
    company_name: string;
  };

  /**
   * The ATS's job profile.
   */
  jobProfile: {
    /**
     * The job profile.
     * @example "40012 - Clinical Research Associate"
     */
    job_profile: string;
    /**
     * The code part of the job profile.
     * @example "40012"
     */
    job_profile_code?: string | undefined;
    /**
     * The name part of the job profile.
     * @example "Clinical Research Associate"
     */
    job_profile_name?: string | undefined;
  };

  /**
   * The job family as the ATS sends it, before mapping to `employment_unit`.
   */
  rawJobFamily: {
    /**
     * The source job family.
     * @example "Clinical Operations"
     */
    raw_job_family?: string | undefined;
    /**
     * The source job sub-family.
     * @example "Clinical Monitoring"
     */
    raw_job_sub_family?: string | undefined;
  };

  /**
   * `application_url` for each careers-site locale. Null when there is no localized URL.
   */
  localeUrls: {
    /**
     * Spanish.
     * @example "https://example.wd1.myworkdayjobs.com/es/careers/job/R123"
     */
    application_url_es: string | null;
    /**
     * Japanese.
     * @example "https://example.wd1.myworkdayjobs.com/ja-JP/careers/job/R123"
     */
    application_url_ja: string | null;
    /**
     * German.
     * @example "https://example.wd1.myworkdayjobs.com/de-DE/careers/job/R123"
     */
    application_url_de: string | null;
    /**
     * Chinese.
     * @example "https://example.wd1.myworkdayjobs.com/zh-CN/careers/job/R123"
     */
    application_url_cn: string | null;
    /**
     * French.
     * @example "https://example.wd1.myworkdayjobs.com/fr-FR/careers/job/R123"
     */
    application_url_fr: string | null;
  };

  /**
   * A careers-site URL filtered to the job's business.
   */
  businessFilterUrl: {
    /**
     * The filtered URL. Null when the job has no business.
     * @example "https://jobs.example.com/jobs?businesses=Labs"
     */
    business_filter_url: string | null;
  };

  /**
   * The posting's careers-site URL tagged for LinkedIn.
   */
  linkedinUrl: {
    /**
     * The URL to use in the LinkedIn feed.
     * @example "https://careers.example.com/jobs/JR0001?utm_source=linkedIn"
     */
    linkedin_job_description_url: string;
  };
}

/**
 * The key of an entry in {@link Extensions}.
 */
export type ExtensionKey = keyof Extensions;
