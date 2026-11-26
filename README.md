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

The types above describe values you already trust. For rows from outside, such as an ATS feed or an API request, validate once at ingestion with `@wiser/schema/zod`, which uses [Zod](https://zod.dev) 4, a dependency of this package. The result is typed as `JobPosting` with the keys you chose, and the rest of your code can use that type without checking again. This is opt-in: `@wiser/schema` does not load Zod at runtime, so install the package as a production dependency if you validate.

```typescript
import { jobPostingSchema } from '@wiser/schema/zod';

const schema = jobPostingSchema(['unlisted', 'postingId']);

const vacancy = schema.parse(row); // a JobPosting<'unlisted' | 'postingId'>; throws if the row is invalid
const result = schema.safeParse(row); // or check result.success instead of catching
```

Fields outside the base and the chosen extensions are stripped from the result.

The type of the result follows the list of keys you pass:

- **A fixed list** gives the same `JobPosting<K>` you would write by hand. A fixed list is an array literal written in the call, an `as const` tuple, or a value whose type is a `readonly` tuple with one key in each slot. No list, `[]` and `undefined` give the base `JobPosting`.
- **A list built at runtime** gives `JobPosting & Partial<JobPosting<K>>`, where K is every key the list may hold: the base fields as usual, and the fields of those extensions all optional. The type cannot tell which keys such a list holds, so it promises none of their fields. The schema still requires the required fields of the keys the list does hold.

```typescript
import { jobPostingSchema, type ExtensionKey } from '@wiser/schema/zod';

const keys: ExtensionKey[] = tenant.extensions; // known only at runtime
const vacancy = jobPostingSchema(keys).parse(row);
vacancy.unlisted; // boolean | undefined: the list may not hold 'unlisted'
```

A list counts as built at runtime when its type is an array such as `ExtensionKey[]`, a tuple with a rest element, a union of tuples, a tuple with a slot that is a union of keys, a list that may be `undefined`, or a mutable tuple, which `pop` can shorten. A list or a key typed `any` counts as holding every key. A branded key, such as the output of `z.literal('unlisted').brand()`, counts as its key, in `JobPosting<K>` too. A tuple with an optional slot does not compile. To get the exact type, fix the list with `as const`.

- `jobPostingSchema(keys)` validates a `JobPosting` plus the fields of the chosen extensions, listed in `extensionSchemas`. It throws on an unknown key or on an extension that redefines a field. It validates the same fields whichever type the list gives.
- `JobPostingSchemaOutput<T>` is the type of the result for a list of type `T`. A generic function that wraps `jobPostingSchema` returns it, and the function's declaration names it.
- `BaseJobPostingSchema`, `extensionSchemas`, `EXTENSION_KEYS` and the model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema`, `MonetaryAmountSchema`) are also exported.
- Type checking this entry needs TypeScript 5.5 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`), or `skipLibCheck`.
- From a native ES module, import `@wiser/schema/lib/zod/index.js`.

### Migrating from `JobPostingWithExtensions`

`JobPosting<K>` replaces `JobPostingWithExtensions<K>`, which made every extension field optional. The old alias is still exported from `@wiser/schema/zod` with the same meaning, but it is deprecated.

- **The type.** Replace `JobPostingWithExtensions<K>` from `@wiser/schema/zod` with `JobPosting<K>` from `@wiser/schema`. Required extension fields become required: `unlisted` is `boolean`, not `boolean | undefined`. Code that reads a posting still compiles. Code that builds one must now set those fields. To keep the old type exactly, write `JobPosting & Partial<JobPosting<K>>`.
- **`jobPostingSchema` with a fixed list.** The result was `JobPostingWithExtensions<K>` and is now `JobPosting<K>`. This is the one deliberate incompatibility: a value you build and annotate with the schema's output type must now set the required extension fields. The new result is still assignable to `JobPostingWithExtensions<K>`, so code that names the old alias compiles.
- **`jobPostingSchema` with a list built at runtime.** Nothing to change. The extension fields are optional as before, and the result and `JobPostingWithExtensions<K>` are assignable to each other.
- **`jobPostingSchema<K>(keys)` with a type argument.** It still compiles and still makes every extension field optional, but it is deprecated. Leave out the type argument so that the type follows the list.

Validation itself has not changed: the schema checks the same fields as before.

### Adding a field a consumer asks for (maintainers)

1. **Base or extension.** A field goes in `extensionSchemas` only when schema.org `JobPosting` has no property for it, as the comment on `extensionSchemas` says. A field schema.org has belongs in `BaseJobPostingSchema` in `src/zod/index.ts`, which changes the root `JobPosting` for everyone. The nested models' schemas, such as `PlaceSchema`, are in `src/zod/entities.ts` and change the root models in the same way.
2. **Existing group or new key.** Add the field to an existing group in `src/zod/extensions.ts` when it belongs with that group's fields, such as another locale in `localeUrls`. Make it optional there: a required field would reject rows from tenants that already use the key, and would be required in their `JobPosting<K>`. Add a new key when the field stands on its own or a tenant may want it without the group.
3. **Conventions.** Keys are camelCase; fields are snake_case like the base fields. Give the key a one-line doc and each field a doc with an `@example`. Use `.optional()` when the ATS may omit the field, required when the extension means nothing without it, and `.nullable()` when the ATS sends `null` for "none". A field name must not repeat a base field or another extension's field: `jobPostingSchema` throws when both are chosen.
4. **Derived, do not edit.** `ExtensionKey`, `Extensions`, `EXTENSION_KEYS`, the fields `JobPosting<K>` adds, the deprecated `JobPostingWithExtensions` and the keys `jobPostingSchema` accepts all follow `extensionSchemas`.
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
