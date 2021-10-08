// @ts-check
import generateManifest from "./generate-manifest";
import fs from "fs/promises";
import path from "path";
/**
 * @typedef Options
 * @property {string} iconDir Icons used by the extension
 */

/**
 * @type {(options: Options) => import("rollup").Plugin}
 */
const plugin = ({ iconDir }) => {
  return {
    name: "bundle-extension",
    async generateBundle() {
      /** @type {Record<string, string>} */
      const icons = {};
      [16, 32, 48, 64, 128].forEach((size) => {
        icons[size] = `icons/${size}.png`;
      });

      await Promise.all(
        [16, 32, 48, 64, 128].map(async (size) => {
          this.emitFile({
            type: "asset",
            fileName: icons[size],
            source: new Uint8Array((await fs.readFile(path.join(iconDir, `${size}.png`))).buffer),
          });
        })
      );

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: generateManifest({ icons }),
      });
    },
  };
};

export default plugin;
