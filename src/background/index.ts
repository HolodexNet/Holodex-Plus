import { ipc } from "src/util";
import { webRequest, runtime } from "webextension-polyfill";

ipc.setupProxy();

// Allows all of youtube to be iframed (mainly used for Archive Chat)
webRequest.onHeadersReceived.addListener(
  (details) => ({
    responseHeaders: details?.responseHeaders?.filter((header) => header.name.toLowerCase() !== "x-frame-options"),
  }),
  { urls: ["*://*.youtube.com/*"] },
  ["blocking", "responseHeaders"]
);

// Ensure that 'origin' is present for like requests in Firefox.
runtime.getBrowserInfo().then((info) => {
  if (info.name === "Firefox") {
    webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        const headers = details.requestHeaders!;
        const origin = headers.find((h) => h.name === "Origin");
        if (!origin) {
          headers.push({ name: "Origin", value: "https://www.youtube.com" });
        } else if (origin.value !== "https://www.youtube.com") {
          origin.value = "https://www.youtube.com";
        }
        return { requestHeaders: headers };
      },
      { urls: ["https://www.youtube.com/youtubei/v1/like/*"], types: ["xmlhttprequest"] },
      ["blocking", "requestHeaders"]
    );
  }
});
