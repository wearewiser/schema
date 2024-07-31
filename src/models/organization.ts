/**
 * Represents an organization or company offering a job or other services.
 */
export interface Organization {
  /**
   * The name of the organization.
   * @example "Tech Corp"
   */
  name: string;

  /**
   * The URL of the organization.
   * @example "https://techcorp.com"
   */
  url?: string;
}