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
