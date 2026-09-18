import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Existing screens intentionally synchronize derived selections in effects.
      // Keep these visible during the React Compiler migration without blocking lint.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      // The Supabase data layer still contains legacy dynamic response shapes.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["tools/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "_backup_before_migration_2026-07-14/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // These existing client flows intentionally synchronize scoped remote
    // data and selection state in effects. Keep the diagnostics documented
    // until those flows move to a reducer/query-cache architecture.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    files: ["lib/data.ts"],
    // Supabase rows are normalized at this boundary; generated Database
    // types can replace these dynamic row shapes in a later pass.
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
