import { expect } from 'chai';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as ts from 'typescript';
import { z } from 'zod';
import { ContactPoint, JobPosting, MonetaryAmount, Organization, Place, PostalAddress } from '../models';
import {
  BaseJobPostingOutput,
  BaseJobPostingSchema,
  ContactPointSchema,
  EXTENSION_KEYS,
  ExtensionKey,
  extensionSchemas,
  jobPostingSchema,
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
// As the extensions declare them, and as a list that may not hold their keys gives them.
type Declared = { unlisted: boolean; posting_id?: string | undefined; business_filter_url: string | null };
type AllOptional = {
  unlisted?: boolean | undefined;
  posting_id?: string | undefined;
  business_filter_url?: string | null | undefined;
};

// JobPosting with no keys is the base. With keys it adds the fields of those
// extensions together, as their schemas declare them.
assertType<Equals<JobPosting, z.output<typeof BaseJobPostingSchema>>>();
assertType<Equals<JobPosting, BaseJobPostingOutput>>();
assertType<Equals<JobPosting<never>, JobPosting>>();
assertType<Equals<ChosenFields<JobPosting>, {}>>();
assertType<Equals<ChosenFields<JobPosting<Chosen>>, Declared>>();
assertType<Equals<ChosenFields<JobPosting<'unlisted'>>, { unlisted: boolean }>>();
assertType<Equals<JobPosting<Chosen>['job_location'], Place | Place[]>>();
assertType<JobPosting<Chosen> extends JobPosting<'unlisted'> ? true : false>();
assertType<JobPosting<Chosen> extends JobPosting ? true : false>();
// A key typed `any` counts as every key instead of making the type `any`.
assertType<Equals<JobPosting<any>, JobPosting<ExtensionKey>>>();

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

    describe('output type', () => {
      const row = { ...minimal, unlisted: true, posting_id: 'P1', business_filter_url: null };

      it('is the JobPosting with the keys of a fixed list', () => {
        const inline = jobPostingSchema(['unlisted', 'postingId', 'businessFilterUrl']);
        assertType<Equals<z.output<typeof inline>, JobPosting<Chosen>>>();
        assertType<Equals<ChosenFields<z.output<typeof inline>>, Declared>>();

        const fixed = ['unlisted', 'postingId', 'businessFilterUrl'] as const;
        const fromConst = jobPostingSchema(fixed);
        assertType<Equals<z.output<typeof fromConst>, JobPosting<Chosen>>>();

        const declared: readonly ['businessFilterUrl', 'unlisted', 'postingId'] = ['businessFilterUrl', 'unlisted', 'postingId'];
        const fromDeclared = jobPostingSchema(declared);
        assertType<Equals<z.output<typeof fromDeclared>, JobPosting<Chosen>>>();

        const repeated = jobPostingSchema(['unlisted', 'unlisted']);
        assertType<Equals<z.output<typeof repeated>, JobPosting<'unlisted'>>>();

        const parsed = inline.parse(row);
        assertType<Equals<typeof parsed.job_req_id, string>>();
        // @ts-expect-error contract_type belongs to contractType, which was not chosen.
        expect(parsed.contract_type).to.equal(undefined);
        expect(parsed).to.deep.equal(row);
        // The schema requires what the type requires.
        expect(inline.safeParse(minimal).success).to.equal(false);
        expect(fromConst.safeParse(minimal).success).to.equal(false);
      });

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

      // For each list below, the type allows a list that lacks a key, so no
      // extension field can be promised. `held` is what each list holds.
      it('makes the extension fields optional for a list built at runtime', () => {
        const held = '["postingId"]';

        const wide: ExtensionKey[] = JSON.parse(held);
        const fromWide = jobPostingSchema(wide);
        assertType<Equals<ChosenFields<z.output<typeof fromWide>>, AllOptional>>();
        assertType<Equals<z.output<typeof fromWide>['company_name'], string | undefined>>();
        assertType<Equals<z.output<typeof fromWide>['job_req_id'], string>>();
        // The list does not hold "unlisted", so the row without it is valid.
        expect(fromWide.parse(minimal)).to.deep.equal(minimal);

        const narrow: Chosen[] = JSON.parse(held);
        const fromNarrow = jobPostingSchema(narrow);
        assertType<Equals<ChosenFields<z.output<typeof fromNarrow>>, AllOptional>>();
        // @ts-expect-error company_name belongs to companyName, which the list cannot hold.
        expect(fromNarrow.parse(minimal).company_name).to.equal(undefined);

        const everyKey = jobPostingSchema(EXTENSION_KEYS);
        assertType<Equals<ChosenFields<z.output<typeof everyKey>>, AllOptional>>();

        const unionSlot: readonly [Chosen, Chosen] = JSON.parse('["postingId", "postingId"]');
        const fromUnionSlot = jobPostingSchema(unionSlot);
        assertType<Equals<ChosenFields<z.output<typeof fromUnionSlot>>, AllOptional>>();
        expect(fromUnionSlot.parse(minimal)).to.deep.equal(minimal);

        const inlineUnionSlot = jobPostingSchema([wide[0], 'businessFilterUrl']);
        assertType<Equals<ChosenFields<z.output<typeof inlineUnionSlot>>, AllOptional>>();

        const tupleUnion: readonly ['unlisted', 'businessFilterUrl'] | readonly ['postingId'] = JSON.parse(held);
        const fromTupleUnion = jobPostingSchema(tupleUnion);
        assertType<Equals<ChosenFields<z.output<typeof fromTupleUnion>>, AllOptional>>();
        expect(fromTupleUnion.parse(minimal)).to.deep.equal(minimal);

        const rest: readonly ['postingId', ...('unlisted' | 'businessFilterUrl')[]] = JSON.parse(held);
        const fromRest = jobPostingSchema(rest);
        assertType<Equals<ChosenFields<z.output<typeof fromRest>>, AllOptional>>();
        expect(fromRest.parse(minimal)).to.deep.equal(minimal);

        const fromSpread = jobPostingSchema(['postingId', ...narrow]);
        assertType<Equals<ChosenFields<z.output<typeof fromSpread>>, AllOptional>>();

        const maybe: readonly ['unlisted', 'postingId', 'businessFilterUrl'] | undefined = JSON.parse('null') ?? undefined;
        const fromMaybe = jobPostingSchema(maybe);
        assertType<Equals<ChosenFields<z.output<typeof fromMaybe>>, AllOptional>>();
        expect(fromMaybe.parse(minimal)).to.deep.equal(minimal);

        function build<K extends ExtensionKey>(keys: readonly K[]) {
          return jobPostingSchema(keys);
        }
        const fromGeneric = build<Chosen>(narrow);
        assertType<Equals<ChosenFields<z.output<typeof fromGeneric>>, AllOptional>>();
      });

      it('makes the extension fields optional for a mutable tuple, which can lose a key', () => {
        const keys: ['postingId', 'unlisted', 'businessFilterUrl'] = ['postingId', 'unlisted', 'businessFilterUrl'];
        keys.pop();
        keys.pop();
        const schema = jobPostingSchema(keys);
        assertType<Equals<ChosenFields<z.output<typeof schema>>, AllOptional>>();
        expect(schema.parse(minimal)).to.deep.equal(minimal);
      });

      it('makes the fields of every extension optional for a list or a key typed any', () => {
        const anyList = jobPostingSchema(JSON.parse('["postingId"]'));
        assertType<Equals<ChosenFields<z.output<typeof anyList>>, AllOptional>>();
        assertType<Equals<z.output<typeof anyList>['company_name'], string | undefined>>();
        assertType<Equals<z.output<typeof anyList>['job_req_id'], string>>();
        expect(anyList.parse(minimal)).to.deep.equal(minimal);

        const anyKey = jobPostingSchema([JSON.parse('"postingId"'), 'businessFilterUrl']);
        assertType<Equals<ChosenFields<z.output<typeof anyKey>>, AllOptional>>();
        assertType<Equals<z.output<typeof anyKey>['company_name'], string | undefined>>();
        // @ts-expect-error not_a_field is in no extension, so the output is not `any`.
        expect(anyKey.parse({ ...minimal, business_filter_url: null }).not_a_field).to.equal(undefined);
      });

      it('counts a branded key as its key', () => {
        const key = z.literal('unlisted').brand<'TenantKey'>().parse('unlisted');
        type Branded = typeof key;
        assertType<Equals<JobPosting<Branded | 'businessFilterUrl'>, JobPosting<'unlisted' | 'businessFilterUrl'>>>();
        assertType<Equals<ChosenFields<JobPosting<Branded | 'businessFilterUrl'>>, { unlisted: boolean; business_filter_url: string | null }>>();

        const fixed = jobPostingSchema([key, 'businessFilterUrl']);
        assertType<Equals<z.output<typeof fixed>, JobPosting<'unlisted' | 'businessFilterUrl'>>>();
        expect(fixed.safeParse({ ...minimal, business_filter_url: null }).success).to.equal(false);
        expect(fixed.parse(row)).to.deep.equal({ ...minimal, unlisted: true, business_filter_url: null });

        // A list of branded keys may be empty, so it promises no field.
        const list: Branded[] = [];
        const fromList = jobPostingSchema(list);
        assertType<Equals<ChosenFields<z.output<typeof fromList>>, { unlisted?: boolean | undefined }>>();
        expect(fromList.parse(minimal)).to.deep.equal(minimal);

        // A slot branded over two keys holds only one of them.
        const either = z.enum(['unlisted', 'postingId']).brand<'TenantKey'>().parse('postingId');
        const fromEither = jobPostingSchema([either, 'businessFilterUrl']);
        assertType<Equals<ChosenFields<z.output<typeof fromEither>>, AllOptional>>();
        expect(fromEither.parse({ ...minimal, business_filter_url: null })).to.not.have.property('unlisted');
      });

      // A generic function that returns the output does not know the list type,
      // so its declaration carries the output type unresolved. The declaration
      // must name JobPostingSchemaOutput. Spelled out instead, the type repeats
      // its per-slot check until the compiler gives up and writes `any`, and a
      // consumer of that declaration takes tens of seconds to type check.
      it('is named in the declaration of a generic function that returns it', () => {
        const producer = compile(
          {
            'declaration-producer.ts': `
              import { jobPostingSchema, type ExtensionKey } from '.';
              export const read = <const T extends readonly ExtensionKey[]>(keys: T) => jobPostingSchema(keys).parse({});
              export const readWith = <K extends ExtensionKey>(key: K) => jobPostingSchema([key, 'postingId']).parse({});
              export const build = <K extends ExtensionKey>(keys: readonly K[]) => jobPostingSchema(keys);
            `,
          },
          'declaration-producer.ts',
        );
        expect(producer.errors).to.deep.equal([]);
        expect(producer.declaration).to.include('JobPostingSchemaOutput<T>');
        expect(producer.declaration).to.include('JobPostingSchemaOutput<readonly [K, "postingId"]>');
        expect(producer.declaration).to.include('JobPostingSchemaOutput<readonly K[]>');
        expect(producer.declaration).to.not.match(/\binfer\b|\bany\b/);

        // The inference still works for a consumer that sees only the declaration.
        const consumer = compile(
          {
            'declaration-producer.d.ts': producer.declaration,
            'declaration-consumer.ts': `
              import { read, readWith, build } from './declaration-producer';
              export const required: boolean = read(['unlisted']).unlisted;
              // @ts-expect-error unlisted is a boolean, so the output is not \`any\`.
              export const notAny: string = read(['unlisted']).unlisted;
              // @ts-expect-error posting_id belongs to postingId, which was not chosen.
              export const notChosen = read(['unlisted']).posting_id;
              export const nullable: string | null = readWith('businessFilterUrl').business_filter_url;
              export const optional: boolean | undefined = build(['unlisted'] as 'unlisted'[]).parse({}).unlisted;
              // @ts-expect-error a list built at runtime does not promise unlisted.
              export const notPromised: boolean = build(['unlisted'] as 'unlisted'[]).parse({}).unlisted;
            `,
          },
          'declaration-consumer.ts',
        );
        expect(consumer.errors).to.deep.equal([]);
      }).timeout(60000);

      it('does not compile for a tuple with an optional slot', () => {
        const optional: readonly ['postingId', second?: 'unlisted'] = ['postingId'];
        // @ts-expect-error the optional slot may hold undefined, which is not a key.
        const schema = jobPostingSchema(optional);
        expect(schema.parse(minimal)).to.deep.equal(minimal);
      });
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
