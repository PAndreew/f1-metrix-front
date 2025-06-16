import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["tailwind.config.js", "postcss.config.js"], // Target your JS config files
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js global variables like `require`, `module`
      },
      sourceType: "commonjs", // Indicate these files are CommonJS
    },
    rules: {
      // Disable rules that conflict with CommonJS `require`
      "@typescript-eslint/no-var-requires": "off",    // If using TypeScript ESLint parser for these files
      "@typescript-eslint/no-require-imports": "off", // If using TypeScript ESLint parser for these files
      "import/no-commonjs": "off", // If you have eslint-plugin-import and it complains
      // Add any other specific rules you need to disable for these config files
    },
  },
];

export default eslintConfig;
