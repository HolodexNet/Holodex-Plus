// @ts-check

import pkg from "../package.json";

const content = [
  { matches: ["*://*.holodex.net/*", "*://*.localhost/*"], path: "content/holodex.js" },
  { matches: ["*://*.youtube.com/embed/*"], path: "content/yt-player.js", allFrames: true },
  { matches: ["*://*.youtube.com/live_chat*"], path: "content/yt-chat.js", allFrames: true },
];

const web_accessible_resources = [
  "content/yt-player-overrides.inject.js",
  "content/yt-chat-overrides.inject.js",
  "content/holodex-flag.inject.js",
];
const permissions = ["storage", "webRequest", "webRequestBlocking"];
const name = "Holodex Plus";

export default ({ icons }) => (
  JSON.stringify(
      {
        manifest_version: 2,
        name,
        version: pkg.version,
        description: pkg.description,
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
        web_accessible_resources,
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
    )
);
