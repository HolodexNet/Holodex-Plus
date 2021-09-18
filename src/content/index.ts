import browser from "webextension-polyfill";
import { inject } from "./yt-embed-inject.js";

browser.storage.local
  .get(null)
  .then((data) => console.log("[Holodex Plus] extension local storage data", data)
  );

inject();
