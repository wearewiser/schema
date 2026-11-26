# @wiser/schema

> Generated with `npm init nodets@0.0.0`.

The public models used by Wiser for the integration of ATS job information into public job websites.

## Usage

Install these models from [@wiser/schema](https://www.npmjs.com/package/@wiser/schema) by running the following in your TypeScript project

```bash
$ npm install --save-dev @wiser/schema
```

and import `JobPosting` from the package root. It is one type for every tenant, it is type-only, and it loads nothing at runtime.

**Base `JobPosting`.** `JobPosting` alone has the fields every tenant has:

```typescript
import type { JobPosting } from '@wiser/schema';

const vacancies: JobPosting[] = await fetchVacancies();
```

**Extra tenant fields.** When a tenant also sends fields from extensions, name the extensions by their keys in `extensionSchemas`. `JobPosting<K>` adds the fields of all the named extensions, each as its extension declares it: a required field stays required, an optional one optional and a nullable one nullable.

```typescript
import type { JobPosting } from '@wiser/schema';

type Vacancy = JobPosting<'unlisted' | 'postingId' | 'businessFilterUrl'>;

const vacancies: Vacancy[] = await fetchVacancies();
vacancies[0].unlisted; // boolean
vacancies[0].posting_id; // string | undefined
vacancies[0].business_filter_url; // string | null
```

A `Vacancy` is also a `JobPosting`. A key that is not in `extensionSchemas` is a compile error. `ExtensionKey`, the union of the keys, is a type-only import from `@wiser/schema/zod`; type checking that import has the requirements listed under "Receiving untrusted data?" below.

Each model is the output type of its schema in `@wiser/schema/zod`, which holds its field documentation: `JobPosting` with no keys of `BaseJobPostingSchema`, `Organization` of `OrganizationSchema`, and likewise `Place`, `PostalAddress`, `ContactPoint` and `MonetaryAmount`. The root entry loads no Zod code at runtime, but its declarations import Zod's types. So type checking any import from `@wiser/schema`, even `Organization` alone, or from a model path such as `@wiser/schema/lib/models/place`, needs either:

- TypeScript 5.4 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`); or
- TypeScript 5.0 or later with `skipLibCheck`.

TypeScript 4.9 and earlier cannot read Zod's declarations. The model paths under `@wiser/schema/lib/models/` still export the same names.

Changes from the earlier interfaces:

- The models are type aliases, not interfaces, so none of them can be augmented: `declare module '@wiser/schema' { interface JobPosting { ... } }`, or the same for `Organization`, `Place` or another model, fails with "Duplicate identifier". For `JobPosting`, name the extensions as `JobPosting<K>` (see above); otherwise use an intersection such as `JobPosting & { tenant_field: string }`. `extends` and `implements` still work.
- `job_location` is `Place | Place[]`. Code that reads it as one `Place` must narrow it first, for example with `Array.isArray`.
- Nested objects are the root models: `hiring_organization` is an `Organization`, a `job_location` entry a `Place`, its `address` a `PostalAddress`, `salary` and `estimated_salary` a `MonetaryAmount`, and `application_contact` a `ContactPoint`.
- With `exactOptionalPropertyTypes`, the optional fields of every model accept an explicit `undefined`. So `JobPosting`, `Organization`, `Place` and `PostalAddress` are not assignable to a type whose optional fields exclude `undefined`, such as the earlier interfaces. `ContactPoint` and `MonetaryAmount` have no optional fields and are unaffected.

## Receiving untrusted data? (optional)

The types above describe values you already trust. For rows from outside, such as an ATS feed or an API request, validate once at ingestion with `@wiser/schema/zod`, which uses [Zod](https://zod.dev) 4, a dependency of this package. This is opt-in: `@wiser/schema` does not load Zod at runtime, so install the package as a production dependency if you validate.

```typescript
import { jobPostingSchema } from '@wiser/schema/zod';

const schema = jobPostingSchema(['unlisted', 'postingId']);

const vacancy = schema.parse(row); // throws if the row is invalid, for example if it has no `unlisted`
const result = schema.safeParse(row); // or check result.success instead of catching
```

The schema validates each chosen extension as it is declared. A row that lacks a required field, such as `unlisted`, is rejected. `null` is accepted only for a nullable field. Fields outside the base and the chosen extensions are stripped from the result.

**The result's type is not `JobPosting<K>`.** The two types differ in the extension fields only:

| | Base fields | Fields of the extensions `K` |
| --- | --- | --- |
| `JobPosting<K>`, type-only | as `JobPosting` has them | as each extension declares them: required, optional or nullable |
| `jobPostingSchema(keys)` result | as `JobPosting` has them | each optional |

```typescript
vacancy.job_req_id; // string
vacancy.unlisted; // boolean | undefined, though the schema above rejects a row without it
vacancy.posting_id; // string | undefined
vacancy.contract_type; // compile error: 'contractType' was not chosen
```

The result's type is `JobPostingSchemaOutput<K>`, which is `JobPosting & Partial<JobPosting<K>>`. It is the same for every list of keys: an array literal in the call, an `as const` tuple, or a list built at runtime. The type of a list does not prove which keys the list holds when the schema is built, so the result's type promises none of the extension fields. Only the type is cautious. Validation is as strict as described above.

The result is a `JobPosting`, so code that needs only the base fields takes it as it is. Code that reads an extension field checks it as it would any optional field. When the list holds the key of a required field, that check always passes, as the schema has already rejected a row without the field.

`K` is every key the list may hold. For a list typed `ExtensionKey[]`, the result has the fields of every extension, each optional, and likewise for a list or a key typed `any`. No list, `[]` and `undefined` give the base `JobPosting`. A branded key, such as the output of `z.literal('unlisted').brand()`, counts as its key, in `JobPosting<K>` too.

- `jobPostingSchema(keys)` validates a `JobPosting` plus the fields of the chosen extensions, listed in `extensionSchemas`. It throws on an unknown key or on an extension that redefines a field.
- `JobPostingSchemaOutput<K>` is the type of the result for the keys `K`. The declaration of a generic function that wraps `jobPostingSchema` names it. For example, `<K extends ExtensionKey>(keys: readonly K[], row: unknown) => jobPostingSchema(keys).parse(row)` returns `JobPostingSchemaOutput<K>`. A function that returns the schema instead returns a `z.ZodType` of it.
- `BaseJobPostingSchema`, `extensionSchemas`, `EXTENSION_KEYS` and the model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema`, `MonetaryAmountSchema`) are also exported.
- Type checking this entry needs TypeScript 5.5 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`), or `skipLibCheck`.
- From a native ES module, import `@wiser/schema/lib/zod/index.js`.

### Adding a field a consumer asks for (maintainers)

1. **Base or extension.** A field goes in `extensionSchemas` only when schema.org `JobPosting` has no property for it, as the comment on `extensionSchemas` says. A field schema.org has belongs in `BaseJobPostingSchema` in `src/zod/index.ts`, which changes the root `JobPosting` for everyone. The nested models' schemas, such as `PlaceSchema`, are in `src/zod/entities.ts` and change the root models in the same way.
2. **Existing group or new key.** Add the field to an existing group in `src/zod/extensions.ts` when it belongs with that group's fields, such as another locale in `localeUrls`. Make it optional there: a required field would reject rows from tenants that already use the key, and would be required in their `JobPosting<K>`. Add a new key when the field stands on its own or a tenant may want it without the group.
3. **Conventions.** Keys are camelCase; fields are snake_case like the base fields. Give the key a one-line doc and each field a doc with an `@example`. Use `.optional()` when the ATS may omit the field, required when the extension means nothing without it, and `.nullable()` when the ATS sends `null` for "none". A field name must not repeat a base field or another extension's field: `jobPostingSchema` throws when both are chosen.
4. **Derived, do not edit.** `ExtensionKey`, `EXTENSION_KEYS`, the fields `JobPosting<K>` adds and the keys `jobPostingSchema` accepts all follow `extensionSchemas`.
5. **Tests** in `src/zod/index.spec.ts`: the field is kept when its key is chosen and stripped when it is not, a wrong type is rejected, and so is a missing required field. Add the field to the row in "accepts a row with the fields of every extension"; "builds with every extension without a field collision" catches name clashes.
6. **Verify** with `npm ci`, then `npm test`, `npm run lint`, `npm run build` and `npm run docs`.

For example, a new key for a field schema.org lacks:

```typescript
  /**
   * The requisition's hiring manager.
   */
  hiringManager: z.object({
    /**
     * The hiring manager's name.
     * @example "Jane Doe"
     */
    hiring_manager: z.string().optional(),
  }),
```

## Models

- [ContactPoint](https://wearewiser.github.io/schema/interfaces/ContactPoint.html) - Represents contact information for a person or organization.
- [JobPosting](https://wearewiser.github.io/schema/interfaces/JobPosting.html) - Represents a job vacancy or opportunity offered by an organization.
- [MonetaryAmount](https://wearewiser.github.io/schema/interfaces/MonetaryAmount.html) - Represents a monetary amount, including currency and value information.
- [Organization](https://wearewiser.github.io/schema/interfaces/Organization.html) - Represents an organization or company offering a job or other services.
- [Place](https://wearewiser.github.io/schema/interfaces/Place.html) - Represents a physical location, typically where a job is based or an event occurs.
- [PostalAddress](https://wearewiser.github.io/schema/interfaces/PostalAddress.html) - Represents a postal address, providing detailed information about a specific location.

## Development Scripts

### npm start
Builds the script and runs it. Watches the project directory for changes, and reruns the script when file changes are detected.

### npm run build
Builds the project and outputs it to the `./lib/` directory.

### npm run lint
Runs the linter.

### npm run test
Runs the unit tests.

### npm run test:watch
Runs the unit tests with watchers on the directory. Reruns when file changes are detected.

### npm run coverage
Generates a coverage report.

### npm run tsc
Builds the project and outputs it to the `./dist/` directory. Compiled with TypeScript and outputs JavaScript files.

### npm run clean
Cleans the project directory of all compilation artifacts.

### npm run docs
Generates the TSDocs for the current project.
