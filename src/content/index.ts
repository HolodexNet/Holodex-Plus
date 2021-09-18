import browser from "webextension-polyfill";
import { injectScript } from "./inject-script.js";
import { ytInject } from "./yt-embed-inject.js";

browser.storage.local
  .get(null)
  .then((data) =>
    console.log("[Holodex-Plus] extension local storage data", data)
  );

injectScript(ytInject);
