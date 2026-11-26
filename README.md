# @wiser/schema

> Generated with `npm init nodets@0.0.0`.

The public models used by Wiser for the integration of ATS job information into public job websites.

## Usage

Install these models from [@wiser/schema](https://www.npmjs.com/package/@wiser/schema) by running the following in your TypeScript project

```bash
$ npm install --save-dev @wiser/schema
```

and import the type you need. Both options are type-only and load nothing at runtime.

**Base `JobPosting`.** Use `JobPosting` from the package root for the fields every tenant has:

```typescript
import type { JobPosting } from '@wiser/schema';

const vacancies: JobPosting[] = await fetchVacancies();
```

**Extra tenant fields.** Use `JobPostingWithExtensions<K>` from `@wiser/schema/zod` when a tenant also sends fields from extensions, named by their keys in `extensionSchemas`. The extension fields are optional in the type.

```typescript
import type { JobPostingWithExtensions } from '@wiser/schema/zod';

type Vacancy = JobPostingWithExtensions<'employmentSubunit' | 'postingId'>;

const vacancies: Vacancy[] = await fetchVacancies();
vacancies[0].posting_id; // string | undefined
```

A `Vacancy` is also a `JobPosting`. Type checking the `@wiser/schema/zod` import has the requirements listed under "Receiving untrusted data?" below.

Each model is the output type of its schema in `@wiser/schema/zod`, which holds its field documentation: `JobPosting` of `BaseJobPostingSchema`, `Organization` of `OrganizationSchema`, and likewise `Place`, `PostalAddress`, `ContactPoint` and `MonetaryAmount`. The root entry loads no Zod code at runtime, but its declarations import Zod's types. So type checking any import from `@wiser/schema`, even `Organization` alone, or from a model path such as `@wiser/schema/lib/models/place`, needs either:

- TypeScript 5.4 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`); or
- TypeScript 5.0 or later with `skipLibCheck`.

TypeScript 4.9 and earlier cannot read Zod's declarations. The model paths under `@wiser/schema/lib/models/` still export the same names.

Changes from the earlier interfaces:

- The models are type aliases, not interfaces, so none of them can be augmented: `declare module '@wiser/schema' { interface JobPosting { ... } }`, or the same for `Organization`, `Place` or another model, fails with "Duplicate identifier". For `JobPosting`, use `JobPostingWithExtensions` (see above); otherwise use an intersection such as `JobPosting & { tenant_field: string }`. `extends` and `implements` still work.
- `job_location` is `Place | Place[]`. Code that reads it as one `Place` must narrow it first, for example with `Array.isArray`.
- Nested objects are the root models: `hiring_organization` is an `Organization`, a `job_location` entry a `Place`, its `address` a `PostalAddress`, `salary` and `estimated_salary` a `MonetaryAmount`, and `application_contact` a `ContactPoint`.
- With `exactOptionalPropertyTypes`, the optional fields of every model accept an explicit `undefined`. So `JobPosting`, `Organization`, `Place` and `PostalAddress` are not assignable to a type whose optional fields exclude `undefined`, such as the earlier interfaces. `ContactPoint` and `MonetaryAmount` have no optional fields and are unaffected.

## Receiving untrusted data? (optional)

The types above describe values you already trust. For rows from outside, such as an ATS feed or an API request, validate once at ingestion with `@wiser/schema/zod`, which uses [Zod](https://zod.dev) 4, a dependency of this package. The result is typed as `JobPostingWithExtensions` for the keys you chose, and the rest of your code can use that type without checking again. This is opt-in: `@wiser/schema` does not load Zod at runtime. The validation import does run at runtime, so if you validate, install the package as a production dependency instead:

```bash
$ npm install --save-prod @wiser/schema
```

```typescript
import { jobPostingSchema } from '@wiser/schema/zod';

const schema = jobPostingSchema(['employmentSubunit', 'postingId']);

const vacancy = schema.parse(row); // throws if the row is invalid
const result = schema.safeParse(row); // or check result.success instead of catching
```

Fields outside the base and the chosen extensions are stripped from the result.

- `jobPostingSchema(keys)` validates a `JobPosting` plus the fields of the chosen extensions, listed in `extensionSchemas`. It throws on an unknown key or on an extension that redefines a field. The schema requires the fields an extension requires, though the type makes them optional.
- `BaseJobPostingSchema`, `extensionSchemas`, `EXTENSION_KEYS` and the model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema`, `MonetaryAmountSchema`) are also exported.
- Type checking this entry needs TypeScript 5.5 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`), or `skipLibCheck`.
- To combine these schemas with your own Zod code, such as `z.array(PlaceSchema)` or `.extend(...)`, check with `npm ls zod` that your project and this package share one installed copy of Zod. A compatible range such as `^4.6.6` does not guarantee that: a lockfile or a pin can still leave two installs. If there are two, align your installed `zod` version with the one listed under `@wiser/schema`. Two copies at different versions can fail to type check together.
- From a native ES module, import `@wiser/schema/lib/zod/index.js`.

### Adding a field a consumer asks for (maintainers)

1. **Base or extension.** A field goes in `extensionSchemas` only when schema.org `JobPosting` has no property for it, as the comment on `extensionSchemas` says. A field schema.org has belongs in `BaseJobPostingSchema` in `src/zod/index.ts`, which changes the root `JobPosting` for everyone. The nested models' schemas, such as `PlaceSchema`, are in `src/zod/entities.ts` and change the root models in the same way.
2. **Existing group or new key.** Add the field to an existing group in `src/zod/extensions.ts` when it belongs with that group's fields, such as another locale in `localeUrls`. Make it optional there: a required field would reject rows from tenants that already use the key. Add a new key when the field stands on its own or a tenant may want it without the group.
3. **Conventions.** Keys are camelCase; fields are snake_case like the base fields. Give the key a one-line doc and each field a doc with an `@example`. Use `.optional()` when the ATS may omit the field, required when the extension means nothing without it, and `.nullable()` when the ATS sends `null` for "none". A field name must not repeat a base field or another extension's field: `jobPostingSchema` throws when both are chosen.
4. **Derived, do not edit.** `ExtensionKey`, `Extensions`, `EXTENSION_KEYS`, `JobPostingWithExtensions` and the keys `jobPostingSchema` accepts all follow `extensionSchemas`.
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
