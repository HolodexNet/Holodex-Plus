import { inject, sha1 } from "../util";
import browser from "webextension-polyfill";

const id = window.location.pathname.split("/").slice(-1)[0];
if (id) {
  inject(browser.runtime.getURL("content/yt-player-overrides.inject.js"));
  browser.runtime.sendMessage(browser.runtime.id, { id, type: "loaded" });
}
