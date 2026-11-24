/**
 * Represents contact information for a person or organization.
 */
export interface ContactPoint {
  /**
   * The name of the contact person.
   * @example "Jane Doe"
   */
  name: string;

  /**
   * The email address of the contact person.
   * @example "jane.doe@techcorp.com"
   */
  email: string;
}