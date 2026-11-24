import { expect } from 'chai';
import { execFileSync } from 'child_process';
import { BaseJobPosting, JobPosting, Place } from '.';

// These tests are checked by the compiler. `npm test` runs `npm run typecheck`
// first, so a `@ts-expect-error` that no longer finds an error fails the test run.

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

const base: BaseJobPosting = {
  job_req_id: 'JR0001',
  job_title: 'Software Engineer',
  hiring_organization: { name: 'Tech Corp' },
  job_description: 'Develop and maintain software applications.',
  job_location: { address: { city: 'Tech City' } },
  application_url: 'https://techcorp.com/careers/apply',
  date_posted: '2024-08-01',
};

// The patterns the proxies use today.
interface ExtendedVacancy extends JobPosting {
  posting_id?: string;
  valid_through?: string;
}
type IntersectedVacancy = JobPosting & { unlisted: boolean };
type MinVacancy = Pick<JobPosting, 'job_req_id' | 'job_title' | 'job_location' | 'date_posted'>;
interface ExtendedPlace extends Place {
  address: Place['address'] & { virtual: boolean };
}
interface ExtendedVacancyWithPlace extends JobPosting {
  job_location: ExtendedPlace;
}

describe('@wiser/schema', () => {
  it('does not load Zod at runtime', () => {
    // A fresh process, because the Zod specs load Zod into this one.
    const script =
      "require('./src'); console.log(Object.keys(require.cache).some((p) => /[\\\\/]node_modules[\\\\/]zod[\\\\/]/.test(p)))";
    const loadsZod = execFileSync(process.execPath, ['-r', 'ts-node/register', '-e', script], { encoding: 'utf8' });
    expect(loadsZod.trim()).to.equal('false');
  }).timeout(30000);

  describe('JobPosting', () => {
    it('is exactly BaseJobPosting with no argument', () => {
      const same: Equals<JobPosting, BaseJobPosting> = true;
      const fromBase: JobPosting = base;
      const toBase: BaseJobPosting = fromBase;
      expect([same, toBase]).to.deep.equal([true, base]);
    });

    it('adds the fields of the chosen extensions', () => {
      const row: JobPosting<'postingId' | 'unlisted' | 'locationKeys'> = {
        ...base,
        posting_id: 'P1',
        unlisted: false,
        location_keys: ['London'],
      };
      expect(row.location_keys).to.deep.equal(['London']);
    });

    it('rejects a key that is not in Extensions', () => {
      // @ts-expect-error "notAnExtension" is not in Extensions.
      const row: JobPosting<'notAnExtension'> = base;
      expect(row).to.equal(base);
    });

    it('rejects a field from an extension that was not chosen', () => {
      const row: JobPosting<'postingId'> = {
        ...base,
        // @ts-expect-error contract_type belongs to contractType, which was not chosen.
        contract_type: 'Permanent',
      };
      expect(row.job_req_id).to.equal('JR0001');
    });

    it('requires the required fields of a chosen extension', () => {
      // @ts-expect-error unlisted is required by the unlisted extension.
      const row: JobPosting<'unlisted'> = base;
      expect(row).to.equal(base);
    });

    it('supports the patterns the proxies use', () => {
      const extended: ExtendedVacancy = { ...base, posting_id: 'P1', valid_through: '2024-09-01' };
      const intersected: IntersectedVacancy = { ...base, unlisted: true };
      const min: MinVacancy = extended;
      const withPlace: ExtendedVacancyWithPlace = {
        ...base,
        job_location: { address: { city: 'London', virtual: false } },
      };
      const asBase: JobPosting[] = [extended, intersected, withPlace];
      expect(asBase).to.have.length(3);
      expect(min.job_req_id).to.equal('JR0001');
    });
  });
});
