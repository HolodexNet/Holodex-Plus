import path from "path";
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
  terser(),
];

/** @type {import("rollup").RollupOptions[]} */
const options = [
  /* background, options, popup + manifest */ {
    output: { dir: "build" },
    plugins: [
      ...sharedPlugins,
      html({
        rootDir: "src",
        flattenOutput: false,
        input: [
          "background/index.html",
          "options/index.html",
          "popup/index.html",
        ],
      }),
      manifest({
        name: "Holodex Plus",
        version: pkg.version,
        description: pkg.description,
        urls: ["*://*.holodex.net/*", "*://*.youtube.com/*"],
        rootDir: "src",
        icons: Object.fromEntries(
          [16, 32, 48, 64, 128].map((size) => [size, `icons/${size}.png`])
        ),
      }),
    ],
  },
  /* content */ {
    input: "src/content/index.ts",
    plugins: [...sharedPlugins],
    output: { file: "build/content/index.js", format: "iife" },
  },
];

export default options;
