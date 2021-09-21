import { ipc } from "src/util";
import { webRequest } from "webextension-polyfill";

ipc.setupProxy();

// Allows all of youtube to be iframed (mainly used for Archive Chat)
webRequest.onHeadersReceived.addListener(
  (details) => ({
    responseHeaders: details?.responseHeaders?.filter((header) => header.name.toLowerCase() !== "x-frame-options"),
  }),
  { urls: ["*://*.youtube.com/*"] },
  ["blocking", "responseHeaders"]
);
