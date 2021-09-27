// @ts-check

import path from "path";
import fs from "fs-extra";

/**
 * @typedef ContentScript
 * @property {string[]} matches List of URLs where this content script should be injected (can use wildcard * symbol)
 * @property {string} path Path to the script file **relative to the build directory**
 * @property {boolean | undefined} allFrames
 *
 * @typedef Options
 * @property {string} name Name of the extension
 * @property {string} version Extension verson
 * @property {string} description Extension description
 * @property {ContentScript[]} content Mapping which determines which `script` is loaded in which `url`
 * @property {string[]} accessible Files which should be accessible from content scripts **relative to build directory**
 * @property {string} iconDir Icons used by the extension
 * @property {string[]} permissions Extra permissions
 */

/**
 * @type {(options: Options) => import("rollup").Plugin}
 */
const plugin = ({ name, version, description, content, accessible, iconDir, permissions }) => {
  return {
    name: "generate-manifest",
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
        source: JSON.stringify(
          {
            manifest_version: 2,
            name,
            description,
            version,
            icons,
            background: {
              page: "background/index.html",
              persistent: true,
            },
            content_scripts: content.map(({ matches, path, allFrames }) => ({
              matches,
              js: [path],
              all_frames: Boolean(allFrames),
              run_at: "document_end",
            })),
            web_accessible_resources: accessible,
            permissions: [...permissions, ...content.map(({ matches }) => matches).flat(Infinity)],
            browser_action: {
              default_icon: { ...icons },
              default_popup: "popup/index.html",
              default_title: name,
            },
            options_ui: {
              browser_style: true,
              page: "options/index.html",
              open_in_tab: true,
            },
          },
          null,
          2
        ),
      });
    },
  };
};

export default plugin;
