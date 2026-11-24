# @wiser/schema

> Generated with `npm init nodets@0.0.0`.

The public models used by Wiser for the integration of ATS job information into public job websites.

## Usage

Install these models from [@wiser/schema](https://www.npmjs.com/package/@wiser/schema) by running the following in your TypeScript project

```bash
$ npm install --save-dev @wiser/schema
```

and import the models into your project

```typescript
import { JobPosting } from '@wiser/schema';

// ...

const vacancies: JobPosting[] = await fetchVacancies();
```

`JobPosting` is the output type of `BaseJobPostingSchema` in `@wiser/schema/zod`, which holds its field documentation. Importing it loads no Zod code at runtime, but its declarations import Zod's types, so type checking it needs either:

- TypeScript 5.4 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`); or
- TypeScript 5.0 or later with `skipLibCheck`.

TypeScript 4.9 and earlier cannot read Zod's declarations. The other models are unchanged interfaces with no such requirement.

Changes from the earlier `JobPosting` interface:

- It is a type alias, not an interface, so it can no longer be augmented: `declare module '@wiser/schema' { interface JobPosting { ... } }` fails with "Duplicate identifier 'JobPosting'". Use an extension (see below) or an intersection such as `JobPosting & { tenant_field: string }`. `extends JobPosting` and `implements JobPosting` still work.
- `job_location` is `Place | Place[]`. Code that reads it as one `Place` must narrow it first, for example with `Array.isArray`.
- Its nested objects come from the Zod schemas, not the `Organization`, `Place`, `PostalAddress`, `ContactPoint` and `MonetaryAmount` interfaces, so augmenting those interfaces does not change `JobPosting`.
- With `exactOptionalPropertyTypes`, its optional fields, nested ones included, accept an explicit `undefined`. As a result, its nested objects are not assignable to those interfaces, and it is not assignable to a type whose optional fields exclude `undefined`.

## Validation with Zod (optional)

`@wiser/schema/zod` validates rows at runtime with [Zod](https://zod.dev) 4, which is a dependency of this package. It is opt-in: `@wiser/schema` does not load it at runtime. Install the package as a production dependency if you use it.

```typescript
import { jobPostingSchema } from '@wiser/schema/zod';

const schema = jobPostingSchema(['employmentSubunit', 'postingId']);
const vacancy = schema.parse(row); // throws if the row is invalid; unknown fields are stripped
```

- `jobPostingSchema(keys)` validates a `JobPosting` plus the fields of the chosen extensions, listed in `extensionSchemas`. It throws on an unknown key or on an extension that redefines a field. In the output type, extension fields are optional; the schema still requires the required ones.
- `BaseJobPostingSchema`, `extensionSchemas`, `EXTENSION_KEYS` and the model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema`, `MonetaryAmountSchema`) are also exported.
- Type checking this entry needs TypeScript 5.5 or later, `lib` with ES2015 and a `URL` global (`dom` or `@types/node`), and default imports of CommonJS modules (`esModuleInterop`, `allowSyntheticDefaultImports`, or `module` `node16`/`nodenext`), or `skipLibCheck`.
- From a native ES module, import `@wiser/schema/lib/zod/index.js`.

### Adding a field a consumer asks for (maintainers)

1. **Base or extension.** Add it to `BaseJobPostingSchema` in `src/zod/index.ts` only when it is a schema.org `JobPosting` property that every consumer shares. That changes the root `JobPosting` for everyone. Otherwise it is an extension.
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
