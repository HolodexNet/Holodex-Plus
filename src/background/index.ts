import { CHANNEL_URL_REGEX, ipc, VIDEO_URL_REGEX } from "src/util";
import { webRequest, runtime, tabs, browserAction } from "webextension-polyfill";
import type { Runtime } from "webextension-polyfill";
import { rrc } from "masterchat";
import { Options } from "src/util";

ipc.setupProxy();
// Allows all of youtube to be iframed (mainly used for Archive Chat)
webRequest.onHeadersReceived.addListener(
  (details) => {
    const q = new URL(details.url);
    const videoId = q.searchParams.get("v");
    const channelId = q.searchParams.get("c");
    const darkTheme = q.searchParams.get("dark_theme");
    const continuation =
      videoId &&
      channelId &&
      rrc({
        videoId,
        channelId,
      });
    const redirect = new URL("https://www.youtube.com/live_chat_replay");
    if(continuation) redirect.searchParams.set("continuation", continuation);
    if(darkTheme) redirect.searchParams.set("dark_theme", darkTheme);
    return {
      redirectUrl: redirect.toString(),
    };
  },
  { urls: ["https://www.youtube.com/redirect_replay_chat?*"] },
  ["blocking", "responseHeaders"]
);

webRequest.onHeadersReceived.addListener(
  (details) => {
    return {
      responseHeaders: details?.responseHeaders?.filter((header) => header.name.toLowerCase() !== "x-frame-options"),
    };
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

tabs.onUpdated.addListener(function (tabId, info, tab) {
  if (tab.url?.startsWith("https://www.youtube.com/watch")) {
    if (info.status === "complete") tabs.sendMessage(tabId, { command: "loaded" });
  }
});


browserAction.onClicked.addListener(async function(activeTab, info)
{
    const openInNewTab = await Options.get("openHolodexInNewTab");
    // Clicking on icon opens holodex
    const videoMatch = activeTab.url?.match(VIDEO_URL_REGEX);
    const channelMatch = activeTab.url?.match(CHANNEL_URL_REGEX);
    let url;
    if (videoMatch && videoMatch?.[2].length === 11) {
      url = `https://holodex.net/watch/${videoMatch?.[2]}`;
    }
    else if (channelMatch && channelMatch[1].length === 24) {
      url = `https://holodex.net/channel/${channelMatch?.[1]}`;
    }
    else {
      url = "https://holodex.net";
    }
    if (openInNewTab) {
      tabs.create({
        url,
        windowId: activeTab.windowId,
        index: activeTab.index + 1,
        openerTabId: activeTab.id,
      });
    } else {
      tabs.update({ url });
    }
});