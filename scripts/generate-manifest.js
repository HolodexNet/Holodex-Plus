// @ts-check

import pkg from "../package.json";

const content_scripts = [
  { matches: ["*://*.holodex.net/*"], js: ["content/holodex.js"], run_at: "document_end" },
  { matches: ["*://*.youtube.com/embed/*"], js: ["content/yt-player.js"], all_frames: true, run_at: "document_end" },
  { matches: ["*://*.youtube.com/live_chat*"], js: ["content/yt-chat.js", "content/yt-chat-tlsync.js"], all_frames: true, run_at: "document_end" },
  //{ matches: ["*://*.twitch.tv/embed/*/chat?*"], js: ["content/twitch-chat-tlsync.js"], all_frames: true, run_at: "document_end" },
  {
    matches: ["*://*.youtube.com/*"],
    run_at: "document_start",
    js: ["content/yt-watch.js"],
    css: ["content/style/yt-watch.css"],
  },
  //{ matches: ["*://*.twitcasting.tv/*/embeddedplayer/*"], js: ["content/twitcast-embed-player.js"], all_frames: true, run_at: "document_end" },
  //{ matches: ["*://embed.nicovideo.jp/watch/*"], js: ["content/niconico-embed-player.js"], all_frames: true, run_at: "document_end" },
  //{ matches: ["*://player.bilibili.com/player.html*"], js: ["content/bilibili-embed-player.js"], all_frames: true, run_at: "document_end" },
];

const web_accessible_resources = [
  {
    "resources": [
      "content/yt-watch.inject.js",
      "content/yt-player-overrides.inject.js",
      "content/yt-chat-overrides.inject.js",
      "content/yt-chat-tlsync.inject.js",
      "content/twitch-chat-tlsync.inject.js",
      "content/holodex-flag.inject.js"
    ],
    "matches": ["*://*.youtube.com/*", "*://*.holodex.net/*"]
  }
];

//const host_permissions = ["*://*.youtube.com/*", "*://*.holodex.net/*", "*://*.twitch.tv/*", "*://*.twitcasting.tv/*", "*://embed.nicovideo.jp/*","*://player.bilibili.com/*"];
const host_permissions = ["*://*.youtube.com/*", "*://*.holodex.net/*"];
/** @type {chrome.runtime.ManifestPermissions[]} */
const permissions = ["tabs", "storage", "webRequest", "webRequestBlocking", "contextMenus"];
const name = "Holodex Plus";



export default ({ icons }) => {
  /** @type {chrome.runtime.ManifestV3} */
  const manifest = {
    manifest_version: 3,
    name,
    version: pkg.version,
    description: pkg.description,
    icons,
    background: {
      page: "background/index.ts",
    },
    permissions,
    content_scripts,
    web_accessible_resources,
    host_permissions,
    action: {
      default_icon: { ...icons },
      // default_popup: "popup/index.html",
      default_title: "Open in Holodex",
    },
    options_ui: {
      page: "options/index.html",
      open_in_tab: false,
    },
  };

  JSON.stringify(manifest, null, 2);
}




