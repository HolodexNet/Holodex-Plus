import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import html from "@web/rollup-plugin-html";
import manifest from "./scripts/generate-manifest";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";

const sharedPlugins = [
  typescript({ typescript: require("typescript") }),
  // resolve + commonjs cause dependencies to be bundled with the code
  // instead of as external chunks
  resolve(),
  commonjs(),
  terser({ ecma: 2020 }),
];

/** @returns {import("rollup").RollupOptions} */
const content = (/** @type {string} */ input, /** @type {string} */ output) => ({
  input,
  plugins: [...sharedPlugins],
  output: { file: output, format: "iife" },
});

/** @type {import("rollup").RollupOptions[]} */
const options = [
  /* background, options, popup + manifest */ {
    output: { dir: "build" },
    plugins: [
      ...sharedPlugins,
      html({
        rootDir: "src",
        flattenOutput: false,
        input: ["background/index.html", "options/index.html", "popup/index.html"],
      }),
      manifest({
        name: "Holodex Plus",
        version: pkg.version,
        description: pkg.description,
        content: [
          { matches: ["*://*.holodex.net/*"], path: "content/holodex.js" },
          { matches: ["*://*.youtube.com/*"], path: "content/youtube.js", allFrames: true },
        ],
        accessible: ["content/yt-embed-inject.js"],
        iconDir: "src/icons",
      }),
    ],
  },
  content("src/content/holodex.ts", "build/content/holodex.js"),
  content("src/content/youtube.ts", "build/content/youtube.js"),
  content("src/content/yt-embed-inject.ts", "build/content/yt-embed-inject.js"),
];

export default options;
