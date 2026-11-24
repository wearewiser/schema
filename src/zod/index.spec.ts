import { expect } from 'chai';
import { z } from 'zod';
import { BaseJobPosting, ExtensionKey, JobPosting, Place } from '../models';
import { BaseJobPostingSchema, EXTENSION_KEYS, extensionSchemas, jobPostingSchema } from '.';

// Compile-time checks. `npm test` runs `npm run typecheck` first, so a mismatch
// or a `@ts-expect-error` that no longer finds an error fails the test run.
// The exported types are the outputs of these schemas, so only jobPostingSchema's
// output, which is typed by hand, needs checking here.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
function assertType<T extends true>(): T | undefined {
  return undefined;
}
assertType<Equals<(typeof EXTENSION_KEYS)[number], ExtensionKey>>();

// jobPostingSchema's output type must not claim extension fields that may be absent.
const literalSchema = jobPostingSchema(['postingId', 'unlisted']);
assertType<Equals<z.infer<typeof literalSchema>, JobPosting<'postingId' | 'unlisted'>>>();
const omittedSchema = jobPostingSchema();
assertType<Equals<z.infer<typeof omittedSchema>, BaseJobPosting>>();
const emptySchema = jobPostingSchema([]);
assertType<Equals<z.infer<typeof emptySchema>, BaseJobPosting>>();
const constKeys = ['locationKeys'] as const;
const constSchema = jobPostingSchema(constKeys);
assertType<Equals<z.infer<typeof constSchema>, JobPosting<'locationKeys'>>>();

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

    it('accepts a row with the fields of every extension and strips nothing', () => {
      const row: JobPosting<ExtensionKey> = {
        ...minimal,
        employment_subunit: 'Frontend',
        contract_type: 'Fixed Term',
        contract_end: '2025-03-31',
        date_updated: '2024-08-15',
        posting_id: 'P1',
        posting_uuid: 'U1',
        office_location: { address: { city: 'Atlanta' }, additional_info: 'HQ' },
        location_keys: ['London', 'UK'],
        search_keys: [],
        unlisted: false,
        job_description_corporate: '',
        job_description_organization: '',
        job_description_short: '',
        company_name: 'Example Ltd',
        job_profile: '40012 - Analyst',
        job_profile_code: '40012',
        job_profile_name: 'Analyst',
        raw_job_family: 'Operations',
        raw_job_sub_family: 'Monitoring',
        application_url_es: 'https://example.com/es',
        application_url_ja: null,
        application_url_de: null,
        application_url_cn: null,
        application_url_fr: null,
        business_filter_url: null,
        linkedin_job_description_url: 'https://example.com/jobs/1?utm_source=linkedIn',
      };
      expect(jobPostingSchema(EXTENSION_KEYS).parse(row)).to.deep.equal(row);
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

      it('keeps base fields typed and extension fields optional for keys typed any', () => {
        const fromElement = jobPostingSchema([JSON.parse('"unlisted"')]);
        const fromList = jobPostingSchema(JSON.parse('["unlisted"]'));
        const anyKeys: any[] = JSON.parse('["unlisted"]'); // eslint-disable-line @typescript-eslint/no-explicit-any
        const fromAnyArray = jobPostingSchema(anyKeys);
        type Dynamic = BaseJobPosting & Partial<JobPosting<ExtensionKey>>;
        assertType<Equals<z.infer<typeof fromElement>, Dynamic>>();
        assertType<Equals<z.infer<typeof fromList>, Dynamic>>();
        assertType<Equals<z.infer<typeof fromAnyArray>, Dynamic>>();
        const row = fromElement.parse({ ...minimal, unlisted: true });
        assertType<Equals<typeof row.job_req_id, string>>();
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        expect(row).to.deep.equal({ ...minimal, unlisted: true });
        expect(fromList.safeParse(minimal).success).to.equal(false);
      });

      it('makes the fields of a tuple element that is a union optional', () => {
        const key = JSON.parse('"postingId"') as 'postingId' | 'unlisted';
        const row = jobPostingSchema([key]).parse({ ...minimal, posting_id: 'P1' });
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        expect(row).to.deep.equal({ ...minimal, posting_id: 'P1' });
      });

      it('makes the fields of literal keys beside a runtime key optional too', () => {
        const key = JSON.parse('"postingId"') as ExtensionKey;
        const schema = jobPostingSchema(['unlisted', key]);
        const row = schema.parse({ ...minimal, unlisted: false });
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        assertType<Equals<typeof row.job_req_id, string>>();
        assertType<Equals<typeof row.location_keys, string[] | undefined>>();
        expect(row).to.deep.equal({ ...minimal, unlisted: false });
        expect(schema.safeParse(minimal).success).to.equal(false);
      });

      it('makes the fields of an extension in only some lists of a union optional', () => {
        const keys = JSON.parse('false') ? (['unlisted'] as const) : ([] as const);
        const row = jobPostingSchema(keys).parse(minimal);
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        expect(row).to.deep.equal(minimal);
      });

      it('makes the fields of an extension in every list of a union optional', () => {
        const keys = JSON.parse('false')
          ? (['unlisted', 'locationKeys'] as const)
          : (['locationKeys'] as const);
        const row = jobPostingSchema(keys).parse({ ...minimal, location_keys: [] });
        assertType<Equals<typeof row.location_keys, string[] | undefined>>();
        assertType<Equals<typeof row.unlisted, boolean | undefined>>();
        expect(row).to.deep.equal({ ...minimal, location_keys: [] });
      });
    });

    describe('with an optional field given as undefined', () => {
      // Zod keeps the key, so its output, and so the exported types, declare optional
      // fields as `T | undefined`. tsconfig.json sets exactOptionalPropertyTypes, so
      // these checks hold under it.
      it('keeps the key and types its value as possibly undefined', () => {
        const parsed = jobPostingSchema().parse({ ...minimal, work_hours: undefined });
        expect('work_hours' in parsed).to.equal(true);
        if ('work_hours' in parsed) {
          assertType<Equals<typeof parsed.work_hours, string | undefined>>();
          expect(parsed.work_hours).to.equal(undefined);
        }
        const asInterface: BaseJobPosting = parsed;
        expect(asInterface).to.deep.equal({ ...minimal, work_hours: undefined });
      });

      it('does the same for nested and extension fields', () => {
        const parsed = jobPostingSchema(['postingId', 'officeLocation']).parse({
          ...minimal,
          job_location: { address: { city: undefined } },
          posting_id: undefined,
          office_location: undefined,
        });
        expect(['city' in parsed.job_location.address, 'posting_id' in parsed, 'office_location' in parsed])
          .to.deep.equal([true, true, true]);
        if ('posting_id' in parsed && 'office_location' in parsed && 'city' in parsed.job_location.address) {
          assertType<Equals<typeof parsed.posting_id, string | undefined>>();
          assertType<Equals<typeof parsed.office_location, Place | undefined>>();
          assertType<Equals<typeof parsed.job_location.address.city, string | undefined>>();
        }
        const asInterface: JobPosting<'postingId' | 'officeLocation'> = parsed;
        expect(asInterface.posting_id).to.equal(undefined);
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
