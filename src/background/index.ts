import browser from "webextension-polyfill";

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

// TODO: communication API (pub-sub) -> when yt-player inject is loaded, notify background script to update yt cookies
const ytCookie = (await browser.cookies.getAll({ domain: "youtube.com" }))
  .map(({ name, value }) => `${name}=${value}`)
  .join("; ");

// Intercept sending likes and modify origin + referer + cookie headers
browser.webRequest.onBeforeSendHeaders.addListener(
  (e) => {
    const id = new URL(e.requestHeaders?.find(({ name }) => name.toLowerCase() === "referer")!.value!).pathname
      .split("/")
      .slice(-1)[0];
    const requestHeaders = [
      ...(e.requestHeaders ?? []).filter(({ name }) => !["origin", "referer", "cookie"].includes(name.toLowerCase())),
      { name: "Origin", value: "https://www.youtube.com" },
      { name: "Referer", value: `https://www.youtube.com/watch?v=${id}` },
      { name: "Cookie", value: ytCookie },
    ];

    return { requestHeaders };
  },
  { urls: ["https://www.youtube.com/youtubei/v1/like/*"], types: ["xmlhttprequest"] },
  ["blocking", "requestHeaders", "extraHeaders"]
);
