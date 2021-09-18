import "../util";
import browser from "webextension-polyfill";
import { greet } from "./test.js";

console.log(greet("background"));

browser.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id;
  if (!tabId) return;
  browser.tabs.sendMessage(tabId, message);
});
