import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Next.js build artifacts
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy Babel/UMD views — not yet migrated to src/; linted when moved
    "00-command-center/**",
    "01-clients/**",
    "02-onboarding/**",
    "03-campaigns/**",
    "04-pages/**",
    "05-leads/**",
    "06-conversations/**",
    "07-escalations/**",
    "08-bookings/**",
    "09-enrollments/**",
    "10-reporting/**",
    "11-automation-rules/**",
    "13-integrations/**",
    "14-settings/**",
    "15-insights/**",
    "90-shell/**",
    "91-auth/**",
    "92-design/**",
    "93-hooks/**",
    "99-agents/**",
    "schools/**",
    "dashboard/**",
  ]),
]);

export default eslintConfig;
