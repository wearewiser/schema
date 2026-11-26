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

The types above describe values you already trust. For rows from outside, such as an ATS feed or an API request, validate once at ingestion with `@wiser/schema/zod`, which uses [Zod](https://zod.dev) 4, a dependency of this package. This is opt-in: `@wiser/schema` does not load Zod at runtime. The validation import does run at runtime, so if you validate, install the package as a production dependency instead:

```bash
$ npm install --save-prod @wiser/schema
```

**Base fields only.** `BaseJobPostingSchema` validates a `JobPosting`:

```typescript
import { BaseJobPostingSchema } from '@wiser/schema/zod';

const vacancy = BaseJobPostingSchema.parse(row); // a JobPosting; throws if the row is invalid
const result = BaseJobPostingSchema.safeParse(row); // or check result.success instead of catching
```

**One extension.** Each entry of `extensionSchemas` is a Zod object schema with the fields of one extension. Add its shape to the base with Zod's own `.extend`:

```typescript
import { BaseJobPostingSchema, extensionSchemas } from '@wiser/schema/zod';

const UnlistedSchema = BaseJobPostingSchema.extend(extensionSchemas.unlisted.shape);
```

**Several extensions.** Spread their shapes into one object:

```typescript
import { BaseJobPostingSchema, extensionSchemas } from '@wiser/schema/zod';

const VacancySchema = BaseJobPostingSchema.extend({
  ...extensionSchemas.unlisted.shape,
  ...extensionSchemas.postingId.shape,
});

const vacancy = VacancySchema.parse(row); // throws if the row is invalid, for example if it has no `unlisted`
vacancy.job_req_id; // string
vacancy.unlisted; // boolean
vacancy.posting_id; // string | undefined
vacancy.contract_type; // compile error: the shape of 'contractType' was not added
```

The schema validates the base fields and each added extension as it is declared:

- A row that lacks a required field, such as `unlisted`, is rejected. So is a row with a field of the wrong type.
- An optional field, such as `posting_id`, may be absent.
- `null` is accepted only for a nullable field. A required nullable field, such as `business_filter_url`, accepts `null` but must be present.
- Fields outside the base and the added extensions are stripped from the result.

Zod infers the result's type from the schema, so the type is exact. It has the same fields as `JobPosting<K>` for the extensions added: `vacancy` above is a `JobPosting<'unlisted' | 'postingId'>`, and a function that returns it can say so:

```typescript
import type { JobPosting } from '@wiser/schema';

const parseVacancy = (row: unknown): JobPosting<'unlisted' | 'postingId'> => VacancySchema.parse(row);
```

The extensions a schema validates are the shapes written into it. The package has no function that builds a schema from a list of keys.

- `BaseJobPostingSchema` validates a `JobPosting`. `extensionSchemas` holds one schema per extension, by key. `EXTENSION_KEYS` lists the keys and `ExtensionKey` is their union.
- No extension repeats a field name of the base or of another extension, so the shapes can be added together in any order.
- The model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema`, `MonetaryAmountSchema`) are also exported.
- Type checking this entry needs TypeScript 5.5 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`), or `skipLibCheck`.
- The examples above use only this package's schemas and need no `zod` of your own. To pass these schemas to your own `zod` import, such as `z.array(PlaceSchema)`, check with `npm ls zod` that your project and this package share one installed copy of Zod. A compatible range such as `^4.6.6` does not guarantee that: a lockfile or a pin can still leave two installs. If there are two, align your installed `zod` version with the one listed under `@wiser/schema`. Two copies at different versions can fail to type check together.
- From a native ES module, import `@wiser/schema/lib/zod/index.js`.

### Adding a field a consumer asks for (maintainers)

1. **Base or extension.** A field goes in `extensionSchemas` only when schema.org `JobPosting` has no property for it, as the comment on `extensionSchemas` says. A field schema.org has belongs in `BaseJobPostingSchema` in `src/zod/index.ts`, which changes the root `JobPosting` for everyone. The nested models' schemas, such as `PlaceSchema`, are in `src/zod/entities.ts` and change the root models in the same way.
2. **Existing group or new key.** Add the field to an existing group in `src/zod/extensions.ts` when it belongs with that group's fields, such as another locale in `localeUrls`. Make it optional there: a required field would reject rows from tenants that already use the key, and would be required in their `JobPosting<K>`. Add a new key when the field stands on its own or a tenant may want it without the group.
3. **Conventions.** Keys are camelCase; fields are snake_case like the base fields. Give the key a one-line doc and each field a doc with an `@example`. Use `.optional()` when the ATS may omit the field, required when the extension means nothing without it, and `.nullable()` when the ATS sends `null` for "none".
4. **Unique field names.** A field name must not repeat a base field or another extension's field. Nothing fails at runtime when one does: consumers combine the shapes with `.extend` and object spread, which replace a field of the same name without an error, so their schema would validate one definition and silently drop the other. The test "repeats no field name of the base or of another extension" in `src/zod/index.spec.ts` is the only guard. Do not remove or weaken it.
5. **Derived, do not edit.** `ExtensionKey`, `EXTENSION_KEYS` and the fields `JobPosting<K>` adds all follow `extensionSchemas`.
6. **Tests** in `src/zod/index.spec.ts`: add the field to the row in "accepts a row with the fields of every extension". For a new kind of field, also check with a schema that adds the extension's shape that the field is kept, that a wrong type is rejected, and that a missing required field is rejected.
7. **Verify** with `npm ci`, then `npm test`, `npm run lint`, `npm run build` and `npm run docs`.

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
