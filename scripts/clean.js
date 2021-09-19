// @ts-check

import rimraf from "rimraf";

/**
 * @typedef Options
 * @property {string} dir
 */

/**
 * @type {(options: Options) => import("rollup").Plugin}
 */
const plugin = ({ dir }) => {
  let cleaned = false;
  return {
    name: "clean-build-dir",
    options(options) {
      if (!cleaned) {
        rimraf.sync(dir);
        cleaned = true;
      }
      return options;
    },
  };
};

export default plugin;
