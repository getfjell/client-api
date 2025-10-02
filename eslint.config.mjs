import libraryConfig from "@fjell/eslint-config/library";

export default [
  {
    ignores: ["**/dist", "**/node_modules"],
  },
  ...libraryConfig,
  {
    // Relax undefined rule for tests
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "no-undefined": "off",
    },
  },
];
