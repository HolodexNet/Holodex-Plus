import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import html from "@web/rollup-plugin-html";
import manifest from "./scripts/generate-manifest";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import { sync as glob } from "glob";
import path from "path";
import clean from "./scripts/clean";

const sharedPlugins = [
  typescript({ typescript: require("typescript") }),
  // resolve + commonjs cause dependencies to be bundled with the code
  // instead of as external chunks
  resolve(),
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
      manifest({
        name: "Holodex Plus",
        version: pkg.version,
        description: pkg.description,
        content: [
          { matches: ["*://*.holodex.net/*"], path: "content/holodex.inject.js" },
          { matches: ["*://*.youtube.com/embed/*"], path: "content/yt-player.inject.js", allFrames: true },
          { matches: ["*://*.youtube.com/live_chat*"], path: "content/yt-chat.inject.js", allFrames: true },
        ],
        accessible: ["content/yt-player-overrides.inject.js", "content/yt-chat-overrides.inject.js"],
        iconDir: "src/icons",
      }),
    ],
  },
  ...glob("src/content/**/*.inject.ts").map(content),
];

export default options;
