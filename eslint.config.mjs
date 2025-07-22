import libraryConfig from "@fjell/eslint-config/library";

export default [
  {
    ignores: ["**/dist", "**/node_modules"],
  },
  ...libraryConfig,
];
