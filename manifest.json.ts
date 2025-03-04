import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest = {
  manifest_version: 3,
  version: "v1.0.0",
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
      "32": "icon-32.png",
    },
  },
  icons: {
    "16": "icon-16.png",
    "128": "icon-128.png",
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
      matches: ["*://*.holodex.net/*"],
      js: ["src/pages/content/holodex/holodex.ts"],
      all_frames: true,
      run_at: "document_start",
    },
    {
      matches: ["*://*.youtube.com/live_chat*"],
      js: ["src/pages/content/yt-chat/yt-chat.ts"],
      all_frames: true,
      run_at: "document_start",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["contentStyle.css", "icon-128.png", "icon-32.png"],
      matches: ["*://*.youtube.com/*", "*://*.holodex.net/*"],
    },
  ],
  // "devtools_page": "src/pages/devtools/index.html",
  // "chrome_url_overrides": {
  //   "newtab": "src/pages/newtab/index.html"
  // },
} as const satisfies ManifestV3Export;

export default manifest;
