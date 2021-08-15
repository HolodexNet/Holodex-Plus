/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  mount: {
    public: { url: "/" },
    src: { url: "/" },
  },
  plugins: [
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-svelte",
    "@snowpack/plugin-typescript",
    [
      "@snowpack/plugin-run-script",
      { cmd: "node scripts/generate-manifest.js " },
    ],
  ],
  optimize: {
    /* Example: Bundle your final build: */
    bundle: true,
    minify: true,
    splitting: true,
    treeshake: true,
    target: "es2020",
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    metaUrlPath: "snowpack_",
    clean: true,
    /* ... */
  },
};
