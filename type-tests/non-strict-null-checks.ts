// Compile-time checks for consumers without strictNullChecks, where an optional
// tuple element such as `["unlisted"?]` is a valid list of keys. `npm run typecheck`
// compiles this file with type-tests/tsconfig.json.
import type { z } from "zod";
import type { BaseJobPosting } from "../src";
import { jobPostingSchema } from "../src/zod";

declare const base: BaseJobPosting;

// The key may be absent, so the field must not be required.
declare const optional: readonly ["unlisted"?];
export const optionalSchema = jobPostingSchema(optional);
export const withoutOptional: z.output<typeof optionalSchema> = base;

declare const mixed: readonly ["postingId", "unlisted"?];
export const mixedSchema = jobPostingSchema(mixed);
export const withoutMixed: z.output<typeof mixedSchema> = base;

// Control: a literal list still requires the field.
export const literalSchema = jobPostingSchema(["unlisted"]);
// @ts-expect-error unlisted is required by the unlisted extension.
export const withoutLiteral: z.output<typeof literalSchema> = base;
