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
  jobPostingSchema,
  JobPostingSchemaOutput,
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
// As the extensions declare them, and as the output of jobPostingSchema has them.
type Declared = { unlisted: boolean; posting_id?: string | undefined; business_filter_url: string | null };
type AllOptional = {
  unlisted?: boolean | undefined;
  posting_id?: string | undefined;
  business_filter_url?: string | null | undefined;
};

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

// The output of jobPostingSchema has every base field as JobPosting has it, and
// the fields of the chosen extensions, each optional. So it is a JobPosting,
// but not a JobPosting<K> until the required fields are known to be there.
assertType<Equals<ChosenFields<JobPostingSchemaOutput<Chosen>>, AllOptional>>();
assertType<Equals<JobPostingSchemaOutput<Chosen>['job_req_id'], string>>();
assertType<JobPostingSchemaOutput<Chosen> extends JobPosting ? true : false>();
assertType<JobPostingSchemaOutput<Chosen> extends JobPosting<Chosen> ? false : true>();
assertType<JobPosting<Chosen> extends JobPostingSchemaOutput<Chosen> ? true : false>();

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

    it('accepts null for a nullable field of a chosen extension', () => {
      const row = { ...minimal, business_filter_url: null };
      expect(jobPostingSchema(['businessFilterUrl']).parse(row)).to.deep.equal(row);
      // A field that is not nullable does not accept null.
      expect(jobPostingSchema(['postingId']).safeParse({ ...minimal, posting_id: null }).success).to.equal(false);
    });

    describe('output type', () => {
      const row = { ...minimal, unlisted: true, posting_id: 'P1', business_filter_url: null };

      it('is the base JobPosting with no list, an empty list or undefined', () => {
        const omitted = jobPostingSchema();
        const empty = jobPostingSchema([]);
        const given = jobPostingSchema(undefined);
        const emptyOrNone = jobPostingSchema(JSON.parse('[]') as readonly [] | undefined);
        assertType<Equals<z.output<typeof omitted>, JobPosting>>();
        assertType<Equals<z.output<typeof empty>, JobPosting>>();
        assertType<Equals<z.output<typeof given>, JobPosting>>();
        assertType<Equals<z.output<typeof emptyOrNone>, JobPosting>>();
        for (const schema of [omitted, empty, given, emptyOrNone]) {
          expect(schema.parse(row)).to.deep.equal(minimal);
        }
      });

      it('makes the fields of the chosen extensions optional, however the list is written', () => {
        const inline = jobPostingSchema(['unlisted', 'postingId', 'businessFilterUrl']);
        const fixed = ['unlisted', 'postingId', 'businessFilterUrl'] as const;
        const fromConst = jobPostingSchema(fixed);
        const dynamic: Chosen[] = JSON.parse('["unlisted", "postingId", "businessFilterUrl"]');
        const fromDynamic = jobPostingSchema(dynamic);
        assertType<Equals<z.output<typeof inline>, JobPostingSchemaOutput<Chosen>>>();
        assertType<Equals<z.output<typeof fromConst>, JobPostingSchemaOutput<Chosen>>>();
        assertType<Equals<z.output<typeof fromDynamic>, JobPostingSchemaOutput<Chosen>>>();

        const parsed = inline.parse(row);
        assertType<Equals<ChosenFields<typeof parsed>, AllOptional>>();
        assertType<Equals<typeof parsed.job_req_id, string>>();
        // @ts-expect-error contract_type belongs to contractType, which was not chosen.
        expect(parsed.contract_type).to.equal(undefined);
        expect(parsed).to.deep.equal(row);

        // Only the type is optional. Each schema still requires `unlisted` and
        // `business_filter_url`, which the minimal row lacks.
        for (const schema of [inline, fromConst, fromDynamic]) {
          expect(schema.safeParse(minimal).success).to.equal(false);
          expect(schema.parse(row)).to.deep.equal(row);
        }
      });

      it('narrows to the keys the list may hold, and requires the fields of those it does hold', () => {
        const wide: ExtensionKey[] = JSON.parse('["postingId"]');
        const fromWide = jobPostingSchema(wide);
        assertType<Equals<z.output<typeof fromWide>, JobPostingSchemaOutput<ExtensionKey>>>();
        assertType<Equals<z.output<typeof fromWide>['company_name'], string | undefined>>();
        // The list does not hold "unlisted", so the row without it is valid.
        expect(fromWide.parse(minimal)).to.deep.equal(minimal);

        const holdsUnlisted: ExtensionKey[] = JSON.parse('["unlisted"]');
        const fromHoldsUnlisted = jobPostingSchema(holdsUnlisted);
        expect(fromHoldsUnlisted.safeParse(minimal).success).to.equal(false);
        expect(fromHoldsUnlisted.parse({ ...minimal, unlisted: true })).to.deep.equal({ ...minimal, unlisted: true });

        const narrow: Chosen[] = JSON.parse('["postingId"]');
        // @ts-expect-error company_name belongs to companyName, which the list cannot hold.
        expect(jobPostingSchema(narrow).parse(minimal).company_name).to.equal(undefined);
      });

      it('promises no extension field for a list or a key typed any', () => {
        const anyList = jobPostingSchema(JSON.parse('["postingId"]'));
        assertType<Equals<z.output<typeof anyList>, JobPosting>>();
        expect(anyList.parse(minimal)).to.deep.equal(minimal);

        const anyKey = jobPostingSchema([JSON.parse('"postingId"'), 'businessFilterUrl']);
        assertType<Equals<ChosenFields<z.output<typeof anyKey>>, AllOptional>>();
        assertType<Equals<z.output<typeof anyKey>['company_name'], string | undefined>>();
        assertType<Equals<z.output<typeof anyKey>['job_req_id'], string>>();
        // @ts-expect-error not_a_field is in no extension, so the output is not `any`.
        expect(anyKey.parse({ ...minimal, business_filter_url: null }).not_a_field).to.equal(undefined);
      });

      it('counts a branded key as its key', () => {
        const key = z.literal('unlisted').brand<'TenantKey'>().parse('unlisted');
        type Branded = typeof key;
        assertType<Equals<JobPosting<Branded | 'businessFilterUrl'>, JobPosting<'unlisted' | 'businessFilterUrl'>>>();
        assertType<Equals<ChosenFields<JobPosting<Branded | 'businessFilterUrl'>>, { unlisted: boolean; business_filter_url: string | null }>>();

        const schema = jobPostingSchema([key, 'businessFilterUrl']);
        assertType<
          Equals<ChosenFields<z.output<typeof schema>>, { unlisted?: boolean | undefined; business_filter_url?: string | null | undefined }>
        >();
        expect(schema.safeParse({ ...minimal, business_filter_url: null }).success).to.equal(false);
        expect(schema.parse(row)).to.deep.equal({ ...minimal, unlisted: true, business_filter_url: null });
      });

      // A generic function that returns the output does not know the keys, so
      // its declaration carries the output type unresolved. The declaration
      // must stay compact by naming JobPostingSchemaOutput, and a consumer that
      // sees only the declaration must get the same types.
      it('is named in the declaration of a function that returns it', () => {
        const producer = compile(
          {
            'declaration-producer.ts': `
              import { jobPostingSchema, type ExtensionKey } from '.';
              export const read = <K extends ExtensionKey>(keys: readonly K[]) => jobPostingSchema(keys).parse({});
              export const readWith = <K extends ExtensionKey>(key: K) => jobPostingSchema([key, 'postingId']).parse({});
              export const build = <K extends ExtensionKey>(keys: readonly K[]) => jobPostingSchema(keys);
              export const fixed = jobPostingSchema(['unlisted']);
            `,
          },
          'declaration-producer.ts',
        );
        expect(producer.errors).to.deep.equal([]);
        expect(producer.declaration).to.include('JobPostingSchemaOutput<K>');
        expect(producer.declaration).to.include('JobPostingSchemaOutput<"postingId" | K>');
        expect(producer.declaration).to.include('JobPostingSchemaOutput<"unlisted">');
        // Neither spelled out field by field nor given up on as `any`.
        expect(producer.declaration).to.not.match(/\bany\b|job_req_id/);

        const consumer = compile(
          {
            'declaration-producer.d.ts': producer.declaration,
            'declaration-consumer.ts': `
              import type { JobPosting } from '../models';
              import { read, readWith, build, fixed } from './declaration-producer';
              export const base: JobPosting = read(['unlisted']);
              export const required: string = read(['unlisted']).job_req_id;
              export const optional: boolean | undefined = read(['unlisted']).unlisted;
              // @ts-expect-error the output does not promise unlisted.
              export const notPromised: boolean = read(['unlisted']).unlisted;
              // @ts-expect-error unlisted is a boolean, so the output is not \`any\`.
              export const notAny: string | undefined = read(['unlisted']).unlisted;
              // @ts-expect-error posting_id belongs to postingId, which was not chosen.
              export const notChosen = read(['unlisted']).posting_id;
              export const nullable: string | null | undefined = readWith('businessFilterUrl').business_filter_url;
              export const added: string | undefined = readWith('businessFilterUrl').posting_id;
              export const dynamic: boolean | undefined = build(['unlisted'] as 'unlisted'[]).parse({}).unlisted;
              // @ts-expect-error the output is not the exact JobPosting<'unlisted'>.
              export const exact: JobPosting<'unlisted'> = fixed.parse({});
              export const checked = (row: unknown): JobPosting<'unlisted'> | undefined => {
                const parsed = fixed.parse(row);
                return parsed.unlisted === undefined ? undefined : { ...parsed, unlisted: parsed.unlisted };
              };
            `,
          },
          'declaration-consumer.ts',
        );
        expect(consumer.errors).to.deep.equal([]);
      }).timeout(60000);
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
