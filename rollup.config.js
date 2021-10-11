import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import html from "@web/rollup-plugin-html";
import bundleExtension from "./scripts/rollup-bundle-extension";
import { terser } from "rollup-plugin-terser";
import { sync as glob } from "glob";
import path from "path";
import clean from "./scripts/clean";
import copy from "rollup-plugin-copy";

const sharedPlugins = [
  typescript({ typescript: require("typescript") }),
  // resolve + commonjs cause dependencies to be bundled with the code
  // instead of as external chunks
  resolve({
    browser: true,
  }),
  commonjs(),
  terser({ ecma: 2020 }),
];

/** @returns {import("rollup").RollupOptions} */
const content = (/** @type {string} */ input) => ({
  input,
  plugins: [...sharedPlugins],
  output: { file: path.join("build/content", path.basename(input, path.extname(input)) + ".js"), format: "iife" },
});

/** @type {import("rollup").RollupOptions[]} */
const options = [
  /* background, options, popup + manifest */ {
    output: { dir: "build" },
    plugins: [
      clean({ dir: "build" }),
      ...sharedPlugins,
      html({
        rootDir: "src",
        flattenOutput: false,
        input: ["background/index.html", "options/index.html", "popup/index.html"],
      }),
      bundleExtension(
        { iconDir: "src/icons" },
      ),
      copy({
        targets: [
          { src: "src/content/style/*.css", dest: "build/content/style" }
        ]
      }),
    ],
  },
  ...glob("src/content/**/*.ts").map(content),
];

export default options;
