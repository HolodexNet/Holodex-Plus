import { inject, Options } from "../util";
import browser from "webextension-polyfill";

(async () => {
  if (!(await Options.get("liveChatMemoryLeakFix"))) return;
  inject(browser.runtime.getURL("content/yt-chat-overrides.inject.js"));
})();
