import { expect } from 'chai';
import { execFileSync } from 'child_process';
import { z } from 'zod';
import { ContactPoint, JobPosting, MonetaryAmount, Organization, Place, PostalAddress } from '../models';
import {
  BaseJobPostingSchema,
  ContactPointSchema,
  EXTENSION_KEYS,
  ExtensionKey,
  extensionSchemas,
  jobPostingSchema,
  JobPostingWithExtensions,
  MonetaryAmountSchema,
  OrganizationSchema,
  PlaceSchema,
  PostalAddressSchema,
} from '.';

// Compile-time checks. ts-node type checks this file when mocha loads it, so a
// mismatch or a `@ts-expect-error` that no longer finds an error fails the run.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
function assertType<T extends true>(): T | undefined {
  return undefined;
}

// Each schema's output is exactly the root model it validates.
assertType<Equals<z.output<typeof ContactPointSchema>, ContactPoint>>();
assertType<Equals<z.output<typeof MonetaryAmountSchema>, MonetaryAmount>>();
assertType<Equals<z.output<typeof OrganizationSchema>, Organization>>();
assertType<Equals<z.output<typeof PostalAddressSchema>, PostalAddress>>();
assertType<Equals<z.output<typeof PlaceSchema>, Place>>();
assertType<Equals<z.output<typeof BaseJobPostingSchema>, JobPosting>>();
assertType<Equals<(typeof EXTENSION_KEYS)[number], ExtensionKey>>();

const minimal: JobPosting = {
  job_req_id: '',
  job_title: '',
  hiring_organization: { name: '' },
  job_description: '',
  job_location: { address: {} },
  application_url: '',
  date_posted: '',
};

describe('@wiser/schema/zod', () => {
  it('is not loaded by the root entry', () => {
    // A fresh process, because this spec has already loaded Zod.
    const script =
      "require('./src'); console.log(Object.keys(require.cache).some((p) => /[\\\\/]node_modules[\\\\/]zod[\\\\/]/.test(p)))";
    const loadsZod = execFileSync(process.execPath, ['-r', 'ts-node/register', '-e', script], { encoding: 'utf8' });
    expect(loadsZod.trim()).to.equal('false');
  }).timeout(30000);

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
      const row = { ...minimal, remote_type: 'Remote', job_location: { address: { city: 'London', virtual: false } } };
      expect(BaseJobPostingSchema.parse(row)).to.deep.equal({ ...minimal, job_location: { address: { city: 'London' } } });
    });

    it('keeps the optional url, valid_through, work_hours and job_location_type', () => {
      const row: JobPosting = {
        ...minimal,
        hiring_organization: { name: 'Tech Corp', url: 'https://techcorp.com' },
        application_url: 'https://techcorp.com/apply',
        url: 'https://techcorp.com/careers/jobs/JR0001',
        valid_through: '2024-09-01T00:00:00Z',
        work_hours: '37.5',
        job_location_type: 'Hybrid',
      };
      const parsed = BaseJobPostingSchema.parse(row);
      assertType<Equals<typeof parsed.url, string | undefined>>();
      assertType<Equals<typeof parsed.valid_through, string | undefined>>();
      assertType<Equals<typeof parsed.work_hours, string | undefined>>();
      assertType<Equals<typeof parsed.job_location_type, string | undefined>>();
      expect(parsed).to.deep.equal(row);
      // The root url is the posting's page, not the organization's or the application's.
      expect(parsed.url).to.equal('https://techcorp.com/careers/jobs/JR0001');
      expect(parsed.hiring_organization.url).to.equal('https://techcorp.com');
      expect(parsed.application_url).to.equal('https://techcorp.com/apply');
    });

    it('leaves url, valid_through, work_hours and job_location_type out when absent', () => {
      const parsed = BaseJobPostingSchema.parse({ ...minimal, hiring_organization: { name: 'Tech Corp', url: 'https://techcorp.com' } });
      for (const key of ['url', 'valid_through', 'work_hours', 'job_location_type']) {
        expect(parsed).to.not.have.property(key);
      }
    });
  });

  describe('jobPostingSchema', () => {
    it('is the base schema with no extensions', () => {
      const row = jobPostingSchema().parse({ ...minimal, posting_id: 'P1' });
      assertType<Equals<typeof row, z.output<typeof BaseJobPostingSchema>>>();
      expect(row).to.deep.equal(minimal);
    });

    it('keeps the fields of the chosen extensions and strips the others', () => {
      const schema = jobPostingSchema(['postingId', 'unlisted']);
      const row = { ...minimal, posting_id: 'P1', unlisted: true, contract_type: 'Permanent' };
      expect(schema.parse(row)).to.deep.equal({ ...minimal, posting_id: 'P1', unlisted: true });
    });

    it('rejects a row missing a required field of a chosen extension', () => {
      const result = jobPostingSchema(['unlisted']).safeParse(minimal);
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['unlisted']);
    });

    it('rejects an extension field of the wrong type', () => {
      const result = jobPostingSchema(['locationKeys']).safeParse({ ...minimal, location_keys: 'London' });
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['location_keys']);
    });

    it('accepts a row with the fields of every extension and strips nothing', () => {
      const row = {
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

    it('types extension fields as optional and base fields as the model', () => {
      const literal = jobPostingSchema(['unlisted']).parse({ ...minimal, unlisted: true });
      assertType<Equals<typeof literal.unlisted, boolean | undefined>>();
      assertType<Equals<typeof literal.job_req_id, string>>();
      // @ts-expect-error contract_type belongs to contractType, which was not chosen.
      expect(literal.contract_type).to.equal(undefined);

      const keys: ExtensionKey[] = JSON.parse('["unlisted"]');
      const dynamic = jobPostingSchema(keys);
      assertType<Equals<z.output<typeof dynamic>, JobPostingWithExtensions<ExtensionKey>>>();
      expect(dynamic.safeParse(minimal).success).to.equal(false);

      const anyKey = jobPostingSchema([JSON.parse('"unlisted"')]).parse({ ...minimal, unlisted: true });
      assertType<Equals<typeof anyKey.job_req_id, string>>();
      assertType<Equals<typeof anyKey.company_name, string | undefined>>();
    });

    it('accepts the same extension twice', () => {
      expect(() => jobPostingSchema(['postingId', 'postingId'])).not.to.throw();
    });

    it('throws on a key that is not an extension', () => {
      // @ts-expect-error "nope" is not an extension key.
      expect(() => jobPostingSchema(['nope'])).to.throw('Unknown JobPosting extension "nope"');
    });

    it('builds with every extension without a field collision', () => {
      expect(EXTENSION_KEYS).to.deep.equal(Object.keys(extensionSchemas));
      expect(() => jobPostingSchema(EXTENSION_KEYS)).not.to.throw();
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
