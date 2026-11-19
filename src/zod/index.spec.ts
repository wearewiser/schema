import { expect } from 'chai';
import { z } from 'zod';
import {
  BaseJobPosting,
  ContactPoint,
  ExtensionKey,
  Extensions,
  JobPosting,
  MonetaryAmount,
  Organization,
  Place,
  PostalAddress,
} from '../models';
import {
  BaseJobPostingSchema,
  ContactPointSchema,
  EXTENSION_KEYS,
  extensionSchemas,
  jobPostingSchema,
  MonetaryAmountSchema,
  OrganizationSchema,
  PlaceSchema,
  PostalAddressSchema,
} from '.';

// Compile-time checks. `npm test` runs `npm run typecheck` first, so a mismatch
// or a `@ts-expect-error` that no longer finds an error fails the test run.
// The interfaces are the source of truth for each schema's inferred type.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
function assertType<T extends true>(): T | undefined {
  return undefined;
}
assertType<Equals<z.infer<typeof ContactPointSchema>, ContactPoint>>();
assertType<Equals<z.infer<typeof MonetaryAmountSchema>, MonetaryAmount>>();
assertType<Equals<z.infer<typeof OrganizationSchema>, Organization>>();
assertType<Equals<z.infer<typeof PostalAddressSchema>, PostalAddress>>();
assertType<Equals<z.infer<typeof PlaceSchema>, Place>>();
assertType<Equals<z.infer<typeof BaseJobPostingSchema>, BaseJobPosting>>();
assertType<
  { [K in ExtensionKey]: Equals<z.infer<(typeof extensionSchemas)[K]>, Extensions[K]> }[ExtensionKey]
>();
assertType<Equals<(typeof EXTENSION_KEYS)[number], ExtensionKey>>();

// jobPostingSchema's output type must not claim extension fields that may be absent.
const literalSchema = jobPostingSchema(['postingId', 'unlisted']);
assertType<Equals<z.infer<typeof literalSchema>, JobPosting<'postingId' | 'unlisted'>>>();
const omittedSchema = jobPostingSchema();
assertType<Equals<z.infer<typeof omittedSchema>, BaseJobPosting>>();
const emptySchema = jobPostingSchema([]);
assertType<Equals<z.infer<typeof emptySchema>, BaseJobPosting>>();

const minimal: BaseJobPosting = {
  job_req_id: '',
  job_title: '',
  hiring_organization: { name: '' },
  job_description: '',
  job_location: { address: {} },
  application_url: '',
  date_posted: '',
};

describe('@wiser/schema/zod', () => {
  describe('BaseJobPostingSchema', () => {
    it('accepts a minimal row with empty strings', () => {
      expect(BaseJobPostingSchema.parse(minimal)).to.deep.equal(minimal);
    });

    it('rejects a row missing a required field', () => {
      const { date_posted: _omitted, ...row } = minimal;
      const result = BaseJobPostingSchema.safeParse(row);
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['date_posted']);
    });

    it('strips unknown keys, including nested ones', () => {
      const row = {
        ...minimal,
        remote_type: 'Remote',
        job_location: { address: { city: 'London', virtual: false } },
      };
      expect(BaseJobPostingSchema.parse(row)).to.deep.equal({
        ...minimal,
        job_location: { address: { city: 'London' } },
      });
    });
  });

  describe('extensionSchemas', () => {
    it('has one schema for each key in EXTENSION_KEYS', () => {
      expect(EXTENSION_KEYS).to.have.length(17);
      expect(new Set(EXTENSION_KEYS).size).to.equal(EXTENSION_KEYS.length);
      expect(Object.keys(extensionSchemas)).to.deep.equal([...EXTENSION_KEYS]);
    });
  });

  describe('jobPostingSchema', () => {
    it('is the base schema with no extensions', () => {
      const row = { ...minimal, posting_id: 'P1' };
      expect(jobPostingSchema().parse(row)).to.deep.equal(minimal);
    });

    it('keeps the fields of the chosen extensions and strips the others', () => {
      const schema = jobPostingSchema(['postingId', 'unlisted']);
      const row = { ...minimal, posting_id: 'P1', unlisted: true, contract_type: 'Permanent' };
      expect(schema.parse(row)).to.deep.equal({ ...minimal, posting_id: 'P1', unlisted: true });
    });

    it('rejects a row missing a required extension field', () => {
      const result = jobPostingSchema(['unlisted']).safeParse(minimal);
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['unlisted']);
    });

    it('builds with every extension without a field collision', () => {
      expect(() => jobPostingSchema(EXTENSION_KEYS)).not.to.throw();
    });

    describe('with keys only known at runtime', () => {
      it('makes the fields of a list built at runtime optional', () => {
        const keys: ExtensionKey[] = JSON.parse('[]');
        const row = jobPostingSchema(keys).parse(minimal);
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        assertType<Equals<typeof row.location_keys, string[] | undefined>>();
        expect(row).to.deep.equal(minimal);
      });

      it('types the fields of EXTENSION_KEYS as optional and still checks them at runtime', () => {
        const schema = jobPostingSchema(EXTENSION_KEYS);
        assertType<Equals<z.infer<typeof schema>['company_name'], string | undefined>>();
        expect(schema.safeParse(minimal).success).to.equal(false);
      });

      it('makes the fields of a tuple element that is a union optional', () => {
        const key = JSON.parse('"postingId"') as 'postingId' | 'unlisted';
        const row = jobPostingSchema([key]).parse({ ...minimal, posting_id: 'P1' });
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        expect(row).to.deep.equal({ ...minimal, posting_id: 'P1' });
      });

      it('keeps the fields of the literal keys beside them required', () => {
        const key = JSON.parse('"postingId"') as ExtensionKey;
        const row = jobPostingSchema(['unlisted', key]).parse({ ...minimal, unlisted: false });
        assertType<Equals<typeof row.unlisted, boolean>>();
        assertType<Equals<typeof row.job_req_id, string>>();
        assertType<Equals<typeof row.location_keys, string[] | undefined>>();
        expect(row).to.deep.equal({ ...minimal, unlisted: false });
      });
    });

    it('accepts the same extension twice', () => {
      expect(() => jobPostingSchema(['postingId', 'postingId'])).not.to.throw();
    });

    it('throws on a key that is not in Extensions', () => {
      // @ts-expect-error "nope" is not in Extensions.
      expect(() => jobPostingSchema(['nope'])).to.throw('Unknown JobPosting extension "nope"');
    });

    it('does not take a type argument without keys', () => {
      // @ts-expect-error The type argument would claim fields the schema does not have.
      const schema = jobPostingSchema<readonly ['unlisted']>();
      expect(schema.parse(minimal)).to.deep.equal(minimal);
    });

    describe('with an extension that collides', () => {
      const schemas = extensionSchemas as Record<string, z.ZodObject>;
      afterEach(() => {
        delete schemas.clash;
      });

      it('throws when it redefines a base field', () => {
        schemas.clash = z.object({ job_title: z.number() });
        expect(() => jobPostingSchema(['clash' as ExtensionKey])).to.throw(
          'JobPosting extension "clash" redefines the field "job_title"',
        );
      });

      it("throws when it redefines another extension's field", () => {
        schemas.clash = z.object({ posting_id: z.number() });
        expect(() => jobPostingSchema(['postingId', 'clash' as ExtensionKey])).to.throw(
          'JobPosting extension "clash" redefines the field "posting_id"',
        );
      });
    });
  });
});
