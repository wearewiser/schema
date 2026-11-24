# @wiser/schema

> Generated with `npm init nodets@0.0.0`.

The public models used by Wiser for the integration of ATS job information into public job websites.

## Usage

Install [@wiser/schema](https://www.npmjs.com/package/@wiser/schema) in your TypeScript project.

If you only import the types from `@wiser/schema`, a development dependency is enough, because the types are erased at build time:

```bash
$ npm install --save-dev @wiser/schema
```

The types are generated from the Zod schemas, so even a project that imports only types from `@wiser/schema` type checks Zod's declarations. Zod is a dependency of this package, so npm installs it with it; you do not install it yourself. Type checking needs TypeScript 5.5 or later, and:

- Default imports of CommonJS modules, which Zod's declarations use. `module` set to `node16` or `nodenext`, `moduleResolution` set to `bundler`, `esModuleInterop` or `allowSyntheticDefaultImports` each allow them. With `module: commonjs` and `moduleResolution: node` and none of these, `tsc` reports TS1259 errors inside `node_modules/zod`.
- ES2015 library types and a global `URL`. Any `target` works, ES5 included, when `lib` includes ES2015 or later and either the `dom` lib or `@types/node` declares `URL`. The default `lib` for `target: ES5` lacks ES2015.

`skipLibCheck` skips both checks.

If you use the runtime validation from `@wiser/schema/zod` (see [Validation with Zod](#validation-with-zod)), install it as a production dependency so it is still present when you deploy with `npm ci --omit=dev`:

```bash
$ npm install --save-prod @wiser/schema
```

Then import the models into your project

```typescript
import { JobPosting } from '@wiser/schema';

// ...

const vacancies: JobPosting[] = await fetchVacancies();
```

### Extensions

`JobPosting` with no type argument is the base type, [BaseJobPosting](https://wearewiser.github.io/schema/interfaces/BaseJobPosting.html). A tenant that needs more fields chooses them by key from the [Extensions](https://wearewiser.github.io/schema/interfaces/Extensions.html) allow list:

```typescript
import { JobPosting } from '@wiser/schema';

type Vacancy = JobPosting<'employmentSubunit' | 'postingId'>;
```

A key that is not in `Extensions`, or a field from an extension that was not chosen, fails to compile.

| Key | Fields |
| - | - |
| `employmentSubunit` | `employment_subunit?: string` |
| `contractType` | `contract_type?: string` |
| `contractEnd` | `contract_end?: string` |
| `dateUpdated` | `date_updated?: string` |
| `postingId` | `posting_id?: string` |
| `postingUuid` | `posting_uuid?: string` |
| `officeLocation` | `office_location?: Place` |
| `locationKeys` | `location_keys: string[]` |
| `searchKeys` | `search_keys: string[]` |
| `unlisted` | `unlisted: boolean` |
| `descriptionSections` | `job_description_corporate: string`, `job_description_organization: string`, `job_description_short: string` |
| `companyName` | `company_name: string` |
| `jobProfile` | `job_profile: string`, `job_profile_code?: string`, `job_profile_name?: string` |
| `rawJobFamily` | `raw_job_family?: string`, `raw_job_sub_family?: string` |
| `localeUrls` | `application_url_es`, `application_url_ja`, `application_url_de`, `application_url_cn`, `application_url_fr` (all `string \| null`) |
| `businessFilterUrl` | `business_filter_url: string \| null` |
| `linkedinUrl` | `linkedin_job_description_url: string` |

#### Augmenting the models

The models are interfaces, so declaration merging still adds fields to the interface it names. A nested field is typed by its schema, not by the named interface: `job_location` is the output of `PlaceSchema`, not `Place`. So augmenting `Place` or `PostalAddress` does not change `job_location`, `office_location` or their `address`. Before the types were generated from the schemas, those fields were typed as `Place`, and such an augmentation reached them. To extend a nested field, extend the posting type instead:

```typescript
import { JobPosting, Place } from '@wiser/schema';

interface Vacancy extends JobPosting {
  job_location: Place & { virtual: boolean };
}
```

#### Adding a field

The schemas in `src/zod/index.ts` are the source of truth. Each exported type, such as `BaseJobPosting` or `Extensions`, is the output of its schema, and the TSDoc on a schema's field is the TSDoc of the type's field. Add a field there, with TSDoc:

1. If schema.org [JobPosting](https://schema.org/JobPosting) has the property, add it to `BaseJobPostingSchema` as an optional field under the schema.org name in snake_case.
2. Otherwise, add an entry to `extensionSchemas`. Its key becomes an `ExtensionKey`, and its fields the fields of that entry in `Extensions`.
3. A field must not reuse the name of a base field or another extension's field. `jobPostingSchema` throws if it does, and a test builds the schema with every extension.

### Validation with Zod

Zod schemas are published from `@wiser/schema/zod`, built on Zod 4, which is a dependency of this package. Your project can stay on Zod 3: npm installs Zod 4 alongside it for this package. The root export, `@wiser/schema`, is types only and does not load Zod.

```typescript
import { jobPostingSchema } from '@wiser/schema/zod';

const schema = jobPostingSchema(['employmentSubunit', 'postingId']);
const vacancy = schema.parse(row); // JobPosting<'employmentSubunit' | 'postingId'>
```

- `jobPostingSchema(keys)` builds the schema for the base type plus the chosen extensions. Fields outside those are stripped from the row. With a literal list of keys the output type is exactly `JobPosting<K>`. With any other list, such as keys read from config, a literal list with a key of a union type or `any` in it, or a tuple with optional elements, the fields of every extension that may be in the list are typed as optional, because the type cannot know which were chosen. The schema still requires the required fields of the extensions it was built with.
- `BaseJobPostingSchema`, `extensionSchemas`, `EXTENSION_KEYS` and the model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema` and `MonetaryAmountSchema`) are also exported.
- Strings have no minimum length and no date or URL format.

## Models

- [ContactPoint](https://wearewiser.github.io/schema/interfaces/ContactPoint.html) - Represents contact information for a person or organization.
- [BaseJobPosting](https://wearewiser.github.io/schema/interfaces/BaseJobPosting.html) - The fields of a job posting that every tenant may use.
- [Extensions](https://wearewiser.github.io/schema/interfaces/Extensions.html) - The allow list of fields a tenant may add to `BaseJobPosting`.
- [JobPosting](https://wearewiser.github.io/schema/types/JobPosting.html) - Represents a job vacancy or opportunity offered by an organization, with the chosen extensions.
- [MonetaryAmount](https://wearewiser.github.io/schema/interfaces/MonetaryAmount.html) - Represents a monetary amount, including currency and value information.
- [Organization](https://wearewiser.github.io/schema/interfaces/Organization.html) - Represents an organization or company offering a job or other services.
- [Place](https://wearewiser.github.io/schema/interfaces/Place.html) - Represents a physical location, typically where a job is based or an event occurs.
- [PostalAddress](https://wearewiser.github.io/schema/interfaces/PostalAddress.html) - Represents a postal address, providing detailed information about a specific location.

## Development Scripts

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
