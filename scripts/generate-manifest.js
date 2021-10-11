// @ts-check

import pkg from "../package.json";

const content_scripts = [
  { matches: ["*://*.holodex.net/*", "*://*.localhost/*"], js: ["content/holodex.js"] },
  { matches: ["*://*.youtube.com/embed/*"], js: ["content/yt-player.js"], allFrames: true },
  { matches: ["*://*.youtube.com/live_chat*"], js: ["content/yt-chat.js"], allFrames: true },
  { 
    matches: ["*://*.youtube.com/*" ], 
    js: ["content/yt-watch.js"],
    css: ["content/style/yt-watch.css"],
    run_at: "document_idle"
  },
];

const web_accessible_resources = [
  "content/yt-player-overrides.inject.js",
  "content/yt-chat-overrides.inject.js",
  "content/holodex-flag.inject.js",
];
const hosts = ["*://*.youtube.com/*", "*://*.holodex.net/*"];
const permissions = ["storage", "webRequest", "webRequestBlocking", ...hosts];
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
        content_scripts,
        web_accessible_resources,
        permissions,
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
