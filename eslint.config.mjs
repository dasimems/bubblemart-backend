import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ],
      "no-use-before-define": "error",
      "use-isnan": "error",
      camelcase: [
        "error",
        {
          properties: "always", // Enforce camelcase for object properties
          ignoreDestructuring: true, // Ignore destructuring, as it's common for imports
          ignoreImports: true, // Allow camelCase for imports (useful for TypeScript types)
          ignoreGlobals: false // You can decide whether to allow camelCase for global variables
        }
      ],
      curly: "error",
      "default-case": "error",
      "default-case-last": "error",
      eqeqeq: "error",
      "guard-for-in": "error",
      "no-alert": "error",
      "no-else-return": "error",
      "no-empty": "error",
      "no-invalid-this": "error",
      // "no-nested-ternary": "error",
      "no-redeclare": "error",
      // "no-undef-init": "error",
      "no-var": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-destructuring": "error"
    }
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended
];
