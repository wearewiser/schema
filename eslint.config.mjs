import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ["lib/", "docs/", "coverage/", "**/*.spec.*"] },
  js.configs.recommended,
  ...tseslint.configs["flat/recommended"],
];
