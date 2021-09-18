import path from "path";
import fs from "fs-extra";

/**
 *
 * @typedef Options
 * @property {string} name Name of the extension
 * @property {string} version Extension verson
 * @property {string} description Extension description
 * @property {string[]} urls List of urls which this extension wants to access
 * @property {string} root Root directory from which `icons` are resolved
 * @property {{ [size in 16 | 32 | 48 | 64 | 128]: string }} icons Icons used by the extension
 */

/**
 * @type {(options: Options) => import("rollup").Plugin}
 */
const plugin = ({ name, version, description, urls, root, icons }) => {
  return {
    name: "generate-manifest",
    async generateBundle() {
      await Promise.all(
        Object.entries(icons).map(async ([size, url]) => {
          this.emitFile({
            type: "asset",
            fileName: `icons/${size}.png`,
            source: new Uint8Array(
              (await fs.readFile(path.join(root, url))).buffer
            ),
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
            },
            content_scripts: [
              {
                matches: urls,
                js: ["content/index.js"],
                // Allow acess to inner iframe (like the iframe embed on Holodex)
                all_frames: true,
                run_at: "document_end",
              },
            ],
            permissions: [
              "storage",
              "activeTab",
              "tabs",
              "webRequest",
              "webRequestBlocking",
              ...urls,
            ],
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
