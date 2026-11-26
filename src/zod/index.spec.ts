import { expect } from 'chai';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as ts from 'typescript';
import { z } from 'zod';
import { ContactPoint, JobPosting, MonetaryAmount, Organization, Place, PostalAddress } from '../models';
import {
  BaseJobPostingSchema,
  ContactPointSchema,
  EXTENSION_KEYS,
  ExtensionKey,
  extensionSchemas,
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

// The root models are the schemas' outputs, so nested objects are exactly the
// root models of the same name.
assertType<Equals<JobPosting['hiring_organization'], Organization>>();
assertType<Equals<JobPosting['job_location'], Place | Place[]>>();
assertType<Equals<Place['address'], PostalAddress>>();
assertType<Equals<JobPosting['salary'], MonetaryAmount | undefined>>();
assertType<Equals<JobPosting['estimated_salary'], MonetaryAmount | undefined>>();
assertType<Equals<JobPosting['application_contact'], ContactPoint | undefined>>();
assertType<Equals<(typeof EXTENSION_KEYS)[number], ExtensionKey>>();

// The three extensions the type checks choose: one with a required field, one
// with an optional field and one with a nullable field.
type Chosen = 'unlisted' | 'postingId' | 'businessFilterUrl';
// The fields of those extensions as the type T has them, with their optionality.
type ChosenFields<T> = Pick<T, Extract<keyof T, 'unlisted' | 'posting_id' | 'business_filter_url'>>;
// As the extensions declare them.
type Declared = { unlisted: boolean; posting_id?: string | undefined; business_filter_url: string | null };

// JobPosting with no keys is the base. With keys it adds the fields of those
// extensions together, as their schemas declare them.
assertType<Equals<JobPosting, z.output<typeof BaseJobPostingSchema>>>();
assertType<Equals<JobPosting<never>, JobPosting>>();
assertType<Equals<ChosenFields<JobPosting>, {}>>();
assertType<Equals<ChosenFields<JobPosting<Chosen>>, Declared>>();
assertType<Equals<ChosenFields<JobPosting<'unlisted'>>, { unlisted: boolean }>>();
assertType<Equals<JobPosting<Chosen>['job_location'], Place | Place[]>>();
assertType<JobPosting<Chosen> extends JobPosting<'unlisted'> ? true : false>();
assertType<JobPosting<Chosen> extends JobPosting ? true : false>();
// A key typed `any` counts as every key instead of making the type `any`.
assertType<Equals<JobPosting<any>, JobPosting<ExtensionKey>>>();

// The fields of T as one object type, so that a schema's output, which is one
// object type, can be compared with JobPosting<K>, which is an intersection.
type Fields<T> = { [P in keyof T]: T[P] };

// Type checks sources as if they were files in this directory, without writing
// them. Returns the errors and the declaration emitted for the entry source.
function compile(sources: Record<string, string>, entry: string): { errors: string[]; declaration: string } {
  const options: ts.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    esModuleInterop: true,
    skipLibCheck: true,
    types: [],
    declaration: true,
    emitDeclarationOnly: true,
  };
  const here = (name: string) => path.join(__dirname, name).replace(/\\/g, '/');
  const virtual = new Map(Object.keys(sources).map((name) => [here(name), sources[name]]));
  const host = ts.createCompilerHost(options);
  const onDisk = { fileExists: host.fileExists, readFile: host.readFile, getSourceFile: host.getSourceFile };
  host.fileExists = (file) => virtual.has(file) || onDisk.fileExists(file);
  host.readFile = (file) => virtual.get(file) ?? onDisk.readFile(file);
  host.getSourceFile = (file, languageVersion, ...rest) => {
    const text = virtual.get(file);
    return text === undefined ? onDisk.getSourceFile(file, languageVersion, ...rest) : ts.createSourceFile(file, text, languageVersion);
  };
  let declaration = '';
  host.writeFile = (_file, text) => {
    declaration = text;
  };
  const program = ts.createProgram([here(entry)], options, host);
  const emitted = program.emit(program.getSourceFile(here(entry)));
  const errors = [...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics].map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  );
  return { errors, declaration };
}

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

  it('exports a schema for each nested model that strips unknown keys', () => {
    const contact: ContactPoint = { name: 'Jane Doe', email: 'jane.doe@techcorp.com' };
    const amount: MonetaryAmount = { currency: 'USD', value: '50,000 - 70,000' };
    const organization: Organization = { name: 'Tech Corp' };
    const address: PostalAddress = { city: 'London', country_code: 'GB' };
    const place: Place = { address, additional_info: 'HQ' };
    expect(ContactPointSchema.parse({ ...contact, phone: '' })).to.deep.equal(contact);
    expect(MonetaryAmountSchema.parse({ ...amount, unit: 'YEAR' })).to.deep.equal(amount);
    expect(OrganizationSchema.parse({ ...organization, logo: '' })).to.deep.equal(organization);
    expect(PostalAddressSchema.parse({ ...address, virtual: false })).to.deep.equal(address);
    expect(PlaceSchema.parse({ ...place, geo: {} })).to.deep.equal(place);
    expect(PlaceSchema.safeParse({ additional_info: 'HQ' }).success).to.equal(false);
  });

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

    describe('job_location', () => {
      it('keeps a single location as an object', () => {
        const parsed = BaseJobPostingSchema.parse({ ...minimal, job_location: { address: { city: 'London' } } });
        expect(parsed.job_location).to.deep.equal({ address: { city: 'London' } });
      });

      it('keeps several locations as an array, in order', () => {
        const job_location: Place[] = [{ address: { city: 'London' } }, { address: { city: 'Leeds' }, additional_info: 'Hybrid' }];
        const row: JobPosting = { ...minimal, job_location };
        expect(BaseJobPostingSchema.parse(row).job_location).to.deep.equal(job_location);
        expect(BaseJobPostingSchema.parse({ ...minimal, job_location: [] }).job_location).to.deep.equal([]);
      });

      it('rejects an array with a malformed location', () => {
        const result = BaseJobPostingSchema.safeParse({ ...minimal, job_location: [{ address: {} }, { address: 'Leeds' }] });
        expect(result.success).to.equal(false);
        expect(result.error?.issues[0].path).to.deep.equal(['job_location']);
      });

      it('is required', () => {
        const { job_location: _omitted, ...row } = minimal;
        const result = BaseJobPostingSchema.safeParse(row);
        expect(result.success).to.equal(false);
        expect(result.error?.issues[0].path).to.deep.equal(['job_location']);
      });
    });

    it('leaves url, valid_through, work_hours and job_location_type out when absent', () => {
      const parsed = BaseJobPostingSchema.parse({ ...minimal, hiring_organization: { name: 'Tech Corp', url: 'https://techcorp.com' } });
      for (const key of ['url', 'valid_through', 'work_hours', 'job_location_type']) {
        expect(parsed).to.not.have.property(key);
      }
    });
  });

  // The README examples: the base extended with the shapes of the extensions a
  // tenant uses. Zod infers the output, which has the fields of JobPosting<K>.
  describe('BaseJobPostingSchema extended with extension shapes', () => {
    const UnlistedSchema = BaseJobPostingSchema.extend(extensionSchemas.unlisted.shape);
    const VacancySchema = BaseJobPostingSchema.extend({
      ...extensionSchemas.unlisted.shape,
      ...extensionSchemas.postingId.shape,
    });
    // An extension whose field is required and nullable.
    const FilteredSchema = BaseJobPostingSchema.extend(extensionSchemas.businessFilterUrl.shape);

    assertType<Equals<Fields<z.output<typeof UnlistedSchema>>, Fields<JobPosting<'unlisted'>>>>();
    assertType<Equals<Fields<z.output<typeof VacancySchema>>, Fields<JobPosting<'unlisted' | 'postingId'>>>>();
    assertType<Equals<Fields<z.output<typeof FilteredSchema>>, Fields<JobPosting<'businessFilterUrl'>>>>();

    it('keeps the fields of one extension and strips the others', () => {
      const parsed = UnlistedSchema.parse({ ...minimal, unlisted: true, posting_id: 'P1', remote_type: 'Remote' });
      assertType<Equals<typeof parsed.unlisted, boolean>>();
      // @ts-expect-error posting_id belongs to postingId, which was not added.
      expect(parsed.posting_id).to.equal(undefined);
      expect(parsed).to.deep.equal({ ...minimal, unlisted: true });
    });

    it('keeps the fields of several extensions and strips the others', () => {
      const row = { ...minimal, unlisted: true, posting_id: 'P1' };
      const parsed = VacancySchema.parse({ ...row, contract_type: 'Permanent' });
      assertType<Equals<typeof parsed.unlisted, boolean>>();
      assertType<Equals<typeof parsed.posting_id, string | undefined>>();
      // @ts-expect-error contract_type belongs to contractType, which was not added.
      expect(parsed.contract_type).to.equal(undefined);
      expect(parsed).to.deep.equal(row);
    });

    it('rejects a row missing a required field of an added extension', () => {
      for (const schema of [UnlistedSchema, VacancySchema]) {
        const result = schema.safeParse(minimal);
        expect(result.success).to.equal(false);
        expect(result.error?.issues[0].path).to.deep.equal(['unlisted']);
      }
    });

    it('rejects an extension field of the wrong type', () => {
      const result = VacancySchema.safeParse({ ...minimal, unlisted: 'yes', posting_id: 'P1' });
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['unlisted']);
    });

    it('leaves an optional extension field out when absent, and does not accept null for it', () => {
      const row = { ...minimal, unlisted: false };
      expect(VacancySchema.parse(row)).to.deep.equal(row);
      expect(VacancySchema.safeParse({ ...row, posting_id: null }).success).to.equal(false);
    });

    it('accepts null for a required nullable field, but not its omission', () => {
      const row = { ...minimal, business_filter_url: null };
      const parsed = FilteredSchema.parse(row);
      assertType<Equals<typeof parsed.business_filter_url, string | null>>();
      expect(parsed).to.deep.equal(row);
      const result = FilteredSchema.safeParse(minimal);
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['business_filter_url']);
    });

    it('still validates the base fields', () => {
      const { date_posted: _omitted, ...row } = { ...minimal, unlisted: true };
      const result = VacancySchema.safeParse(row);
      expect(result.success).to.equal(false);
      expect(result.error?.issues[0].path).to.deep.equal(['date_posted']);
    });

    // A package that exports a schema built this way, and a parser annotated
    // with JobPosting<K>, must emit a declaration its consumers can read: the
    // parser's return type by name, and the schema's output with the same fields.
    it('emits a declaration that gives a consumer the same types', () => {
      const producer = compile(
        {
          'declaration-producer.ts': `
            import type { JobPosting } from '../models';
            import { BaseJobPostingSchema, extensionSchemas } from '.';
            export const VacancySchema = BaseJobPostingSchema.extend({
              ...extensionSchemas.unlisted.shape,
              ...extensionSchemas.postingId.shape,
            });
            export const parseVacancy = (row: unknown): JobPosting<'unlisted' | 'postingId'> => VacancySchema.parse(row);
          `,
        },
        'declaration-producer.ts',
      );
      expect(producer.errors).to.deep.equal([]);
      expect(producer.declaration).to.include('parseVacancy: (row: unknown) => JobPosting<"unlisted" | "postingId">');
      expect(producer.declaration).to.not.match(/\bany\b/);

      const consumer = compile(
        {
          'declaration-producer.d.ts': producer.declaration,
          'declaration-consumer.ts': `
            import type { JobPosting } from '../models';
            import { VacancySchema, parseVacancy } from './declaration-producer';
            export const exact: JobPosting<'unlisted' | 'postingId'> = VacancySchema.parse({});
            export const base: JobPosting = parseVacancy({});
            for (const vacancy of [VacancySchema.parse({}), parseVacancy({})]) {
              const required: boolean = vacancy.unlisted;
              const optional: string | undefined = vacancy.posting_id;
              // @ts-expect-error posting_id may be absent.
              const notPromised: string = vacancy.posting_id;
              // @ts-expect-error unlisted is a boolean, so the type is not \`any\`.
              const notAny: string = vacancy.unlisted;
              // @ts-expect-error contract_type belongs to contractType, which was not added.
              const notAdded = vacancy.contract_type;
            }
          `,
        },
        'declaration-consumer.ts',
      );
      expect(consumer.errors).to.deep.equal([]);
    }).timeout(60000);
  });

  describe('extensionSchemas', () => {
    it('has every key in EXTENSION_KEYS', () => {
      expect(EXTENSION_KEYS).to.deep.equal(Object.keys(extensionSchemas));
    });

    // `.extend` and object spread replace a field of the same name without an
    // error, so a repeated name would silently change what a schema validates.
    // Nothing checks this at runtime. This test is the only guard.
    it('repeats no field name of the base or of another extension', () => {
      const owners = new Map<string, string>();
      const repeated: string[] = [];
      const claim = (owner: string, shape: object) => {
        for (const field of Object.keys(shape)) {
          const first = owners.get(field);
          if (first === undefined) {
            owners.set(field, owner);
          } else {
            repeated.push(`${field} is in both ${first} and ${owner}`);
          }
        }
      };
      claim('BaseJobPostingSchema', BaseJobPostingSchema.shape);
      for (const key of EXTENSION_KEYS) {
        claim(key, extensionSchemas[key].shape);
      }
      expect(repeated).to.deep.equal([]);
    });

    it('accepts a row with the fields of every extension, each field kept by one extension', () => {
      const fields = {
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
      let kept = {};
      for (const key of EXTENSION_KEYS) {
        kept = { ...kept, ...extensionSchemas[key].parse({ ...minimal, ...fields }) };
      }
      expect(kept).to.deep.equal(fields);
    });
  });
});
