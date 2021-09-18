import "../util";
import browser from "webextension-polyfill";
import { greet } from "./test.js";

console.log(greet("background"));

browser.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id;
  if (!tabId) return;
  browser.tabs.sendMessage(tabId, message);
});

// Allows all of youtube to be iframed (mainly used for Archive Chat)
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    return {
      responseHeaders: details?.responseHeaders?.filter((header) => header.name.toLowerCase() !== "x-frame-options"),
    };
  },
  {
    urls: ["*://*.youtube.com/*"],
  },
  ["blocking", "responseHeaders"]
);
