import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest = {
  manifest_version: 3,
  version: "<placeholder>",
  name: "Holodex Plus",
  description: "Holodex companion extension",
  options_ui: {
    page: "src/pages/options/index.html",
    open_in_tab: false,
  },
  background: {
    service_worker: "src/pages/background/index.ts",
    type: "module",
  },
  action: {
    // default_popup: "src/pages/popup/index.html",
    default_icon: {
      "16": "src/icons/16.png",
      "32": "src/icons/32.png",
      "48": "src/icons/48.png",
      "64": "src/icons/64.png",
      "128": "src/icons/128.png"
    },
  },
  icons: {
    "128": "src/icons/128.png",
  },
  permissions: [
    "tabs",
    "storage",
    "contextMenus",
    "webRequest", // unknown if still need.
    "declarativeNetRequestWithHostAccess",
  ],
  host_permissions: ["*://*.youtube.com/*", "*://*.holodex.net/*"],
  content_scripts: [
    // {
    //   matches: ["http://*/*", "https://*/*", "<all_urls>"],
    //   js: ["src/pages/content/index.tsx"],
    //   css: ["contentStyle.css"],
    // },
    {
      matches: ["*://*.youtube.com/live_chat*"],
      js: ["src/pages/content/yt-chat/contentScript.ts"],
      all_frames: true,
      run_at: "document_end",
    },
    {
      matches: ["*://*.youtube.com/*"],
      js: ["src/pages/content/yt-watch/contentScript.ts"],
      css: ["src/pages/content/yt-watch/contentStyle.css"],
      all_frames: true,
      run_at: "document_start",
    },
    {
      matches: ["*://*.youtube.com/embed/*"],
      js: ["src/pages/content/yt-player/contentScript.ts"],
      all_frames: true,
      run_at: "document_start",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["src/pages/content/yt-watch/contentStyle.css"],
      matches: ["*://*.youtube.com/*", "*://*.holodex.net/*"],
    },
  ],
  // "devtools_page": "src/pages/devtools/index.html",
  // "chrome_url_overrides": {
  //   "newtab": "src/pages/newtab/index.html"
  // },
} as const satisfies ManifestV3Export;

export default manifest;