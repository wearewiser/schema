# @wiser/schema

> Generated with `npm init nodets@0.0.0`.

The public models used by Wiser for the integration of ATS job information into public job websites.

## Usage

Install [@wiser/schema](https://www.npmjs.com/package/@wiser/schema) in your TypeScript project.

If you only import the types from `@wiser/schema`, a development dependency is enough, because the types are erased at build time:

```bash
$ npm install --save-dev @wiser/schema
```

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

#### Adding a field

1. If schema.org [JobPosting](https://schema.org/JobPosting) has the property, add it to `BaseJobPosting` as an optional field under the schema.org name in snake_case. Declare optional fields as `name?: T | undefined`, because Zod keeps a key that is given as `undefined`.
2. Otherwise, add an entry to `Extensions` in `src/models/extensions.ts`, with TSDoc, and a matching schema to `extensionSchemas` in `src/zod/index.ts`. The build fails if the extension has no schema or the schema's output does not fit the type. `npm test` runs `npm run typecheck` first, which fails unless each schema's inferred type exactly equals its type, with `exactOptionalPropertyTypes` on.
3. A field must not reuse the name of a base field or another extension's field. `jobPostingSchema` throws if it does.

### Validation with Zod

Zod schemas are published from `@wiser/schema/zod`, built on Zod 4, which is a dependency of this package. Your project can stay on Zod 3: npm installs Zod 4 alongside it for this package. The root export, `@wiser/schema`, is types only and does not load Zod.

```typescript
import { jobPostingSchema } from '@wiser/schema/zod';

const schema = jobPostingSchema(['employmentSubunit', 'postingId']);
const vacancy = schema.parse(row); // JobPosting<'employmentSubunit' | 'postingId'>
```

- `jobPostingSchema(keys)` builds the schema for the base type plus the chosen extensions. Fields outside those are stripped from the row. With a literal list of keys the output type is exactly `JobPosting<K>`. With a list built at runtime, such as keys read from config, the extension fields are typed as optional, because the type cannot know which were chosen.
- `BaseJobPostingSchema`, `extensionSchemas`, `EXTENSION_KEYS` and the model schemas (`PlaceSchema`, `PostalAddressSchema`, `OrganizationSchema`, `ContactPointSchema` and `MonetaryAmountSchema`) are also exported.
- The schemas mirror the types exactly: strings have no minimum length and no date or URL format.

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
Generates the TSDocs for the current project. It first applies `patches/typedoc+0.28.20.patch` with patch-package. The repo overrides minimatch to 11 for a security fix, and TypeDoc 0.28.20 calls `matchOne()`, which minimatch 11 removed. The patch is the fix from [TypeStrong/typedoc#3151](https://github.com/TypeStrong/typedoc/pull/3151); remove it, and patch-package, once a TypeDoc release includes that fix.
