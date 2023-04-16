import { ipc, CHANNEL_URL_REGEX, VIDEO_URL_REGEX, CANONICAL_URL_REGEX } from "src/util";
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

async function getHolodexUrl(url: string | undefined, tabId?: number | undefined): Promise<string> {
  if (url !== undefined) {
    const videoMatch = url.match(VIDEO_URL_REGEX);
    if (videoMatch && videoMatch[2].length === 11) {
      return `https://holodex.net/watch/${videoMatch[2]}`;
    }
    const channelMatch = url.match(CHANNEL_URL_REGEX);
    if (channelMatch && channelMatch[1].length === 24) {
      return `https://holodex.net/channel/${channelMatch[1]}`;
    }
  }
  if (tabId !== undefined) {
    console.debug('getting canonical URL for', url);
    let canonicalUrl;
    try {
      canonicalUrl = await tabs.sendMessage(tabId, { command: "getCanonicalUrl" });
    } catch (e) {
      if (!url) return "";
      // Fallback in case Holodex+ was unloaded or out of date on the page:
      // Fetch the page again and assume first matched URL is the canonical URL.
      console.debug('fetch fallback for canonical URL');
      const doc = await (await fetch(url)).text();
      const match = doc.match(CANONICAL_URL_REGEX);
      if (match) {
        canonicalUrl = 'https://www.youtube.com' + match[0];
      }
    }
    console.debug('canonical URL:', canonicalUrl);
    if (canonicalUrl) {
      return await getHolodexUrl(canonicalUrl);
    }
  }
  return "https://holodex.net";
}

browserAction.onClicked.addListener(async function(activeTab, info)
{
    const openInNewTab = await Options.get("openHolodexInNewTab");
    // Clicking on icon opens holodex
    const url = await getHolodexUrl(activeTab.url, activeTab.id);
    if (!url) return;
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