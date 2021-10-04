import { ipc } from "src/util";
import { webRequest, runtime } from "webextension-polyfill";
import type { Runtime } from "webextension-polyfill";
import { rtc } from "masterchat";

ipc.setupProxy();
// Allows all of youtube to be iframed (mainly used for Archive Chat)
webRequest.onHeadersReceived.addListener(
  (details) => {
    console.log("bg,", details);
    const q = new URL(details.url);
    const videoId = q.searchParams.get("v");
    const channelId = q.searchParams.get("c");
    const continuation = videoId && channelId && rtc({
      videoId,
      channelId,
   });
    console.log(`https://www.youtube.com/live_chat_replay?continuation=${continuation}`);
    return {
      redirectUrl: `https://www.youtube.com/live_chat_replay?continuation=${continuation}`,
    }
  },
  { urls: ["*://*.holodex.net/live_chat_replay?*", "*://localhost/live_chat_replay?*"] },
  ["blocking", "responseHeaders"]
);

webRequest.onHeadersReceived.addListener(
  (details) => {
    return {
      responseHeaders: details?.responseHeaders?.filter((header) => header.name.toLowerCase() !== "x-frame-options"),
    }
  },
  { urls: ["*://*.youtube.com/live_chat_replay?*"] },
  ["blocking", "responseHeaders"]
);

const getBrowserInfo = async (): Promise<Runtime.BrowserInfo> => {
  // @ts-ignore it is not defined in chrome... so much for a polyfill
  if (runtime.getBrowserInfo) return await runtime.getBrowserInfo();
  else return { name: "Unknown", vendor: "Unknown", version: "Unknown", buildID: "Unknown" };
};

// Ensure that 'origin' is present for like requests in Firefox.
getBrowserInfo().then((info) => {
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
