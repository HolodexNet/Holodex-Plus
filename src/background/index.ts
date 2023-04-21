import { ipc, HOLODEX_URL_REGEX, YOUTUBE_URL_REGEX, VIDEO_URL_REGEX, CHANNEL_URL_REGEX, CANONICAL_URL_REGEX } from "src/util";
import { webRequest, runtime, tabs, windows, browserAction } from "webextension-polyfill";
import type { Runtime, Tabs } from "webextension-polyfill";
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

// Clicking on Holodex extension icon opens Holodex
browserAction.onClicked.addListener(async function(tab) {
  console.debug("Holodex button clicked for active tab:", tab);
  if (tab.id === undefined || tab.id === tabs.TAB_ID_NONE) return;
  const url = await getHolodexUrl(tab.url, tab.id);
  if (url) openUrl(tab, url);
 });

 async function getHolodexUrl(url: string | undefined, tabId: number): Promise<string | null> {
  if (url) {
    if (HOLODEX_URL_REGEX.test(url)) {
      return null;
    }
    const videoMatch = url.match(VIDEO_URL_REGEX);
    if (videoMatch) {
      return `https://holodex.net/watch/${videoMatch[0]}`;
    }
    const channelMatch = url.match(CHANNEL_URL_REGEX);
    if (channelMatch) {
      return `https://holodex.net/channel/${channelMatch[0]}`;
    }
    if (YOUTUBE_URL_REGEX.test(url)) {
      // Get canonical URL from which we can derive video or channel id.
      console.debug("getting canonical URL for", url);
      let canonicalUrl: string | null = null;
      try {
        canonicalUrl = await tabs.sendMessage(tabId, { command: "getCanonicalUrl" });
      } catch (e) {
      }
      // Fallback in case Holodex+ was unloaded or out of date on the page
      // (Chromium-based browsers, unlike Firefox, don't load content scripts upon enabling extensions),
      // or if the content script somehow can't find a canonical URL:
      // Fetch the page again and take the first matched canonical URL.
      if (!canonicalUrl && url) {
        console.debug("(fallback) fetch original page for canonical URL");
        const doc = await (await fetch(url)).text();
        const match = doc.match(CANONICAL_URL_REGEX);
        if (match) {
          canonicalUrl = "https://www.youtube.com" + match[0];
        }
      }
      console.debug("canonical URL:", canonicalUrl);
      if (canonicalUrl) {
        const videoMatch = canonicalUrl.match(VIDEO_URL_REGEX);
        if (videoMatch) {
          return `https://holodex.net/watch/${videoMatch[0]}`;
        }
        const channelMatch = canonicalUrl.match(CHANNEL_URL_REGEX);
        if (channelMatch) {
          return `https://holodex.net/channel/${channelMatch[0]}`;
        }
      }
    }
  }
  return "https://holodex.net";
}

// Opens given URL in either new tab and same tab, depending on openHolodexInNewTab option.
//
// Issue for the openHolodexInNewTab=false case:
// For Chromium-based browsers, chrome.tabs.update doesn't reliably push a new entry onto the tab's session history,
// instead replacing the current state, e.g. if tab has history [A,B] and we're trying to chrome.tabs.update to C,
// this sometimes results in [A,C] rather than [A,B,C].
// Details: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/n3vFlEYueyo
// Firefox doesn't have this problem (and in fact, provides a loadReplace flag to control the behavior),
// but might as well standardize for all browsers.
//
// Workaround: update the tab in the context script context via location.assign (or assigning location.href),
// which does seem to always push a new entry onto the tab's session history.
// This is accomplished with an "openUrl" message that yt-watch.ts handles.
//
// For the openHolodexInNewTab=true case, delegating to the content script is actually convenient,
// since window.open sets tab position, opener, and tab group (for Chromium-based browsers) properly.
async function openUrl(tab: Tabs.Tab, url: string) {
  try {
    const openedNewTab = await tabs.sendMessage(tab.id!, { command: "openUrl", url: url });
    if (openedNewTab !== null) {
      // There's no 100% reliable way to ensure the new tab is the current tab,
      // so don't bother to try fetching that new tab, especially just for debug logging.
      console.debug(openedNewTab ? "new tab created" : "updated tab", "from content script context");
    }
  } catch (e) {
    fallbackOpenUrl(tab, url);
  }
}

// Fallback in case Holodex+ was unloaded or out of date on the page
// (Chromium-based browsers, unlike Firefox, don't load content scripts upon enabling extensions).
// This uses chrome.tabs.update when openHolodexInNewTab=false and thus is susceptible to the issue
// described above, but it's better than nothing.
async function fallbackOpenUrl(tab: Tabs.Tab, url: string) {
  if (await Options.get("openHolodexInNewTab")) {
    const createProps: Tabs.CreateCreatePropertiesType = {
      url,
      index: tab.index + 1,
      openerTabId: tab.id,
    };
    if (tab.windowId !== undefined && tab.windowId !== windows.WINDOW_ID_NONE)
      createProps.windowId = tab.windowId;
    const newTab = await tabs.create(createProps);
    console.debug("(fallback) new tab created:", newTab);
    const tabsGroup = (tabs as any).group;
    if (tabsGroup && newTab.id !== undefined && newTab.id !== tabs.TAB_ID_NONE) {
      const groupId = (tab as any).groupId;
      if (groupId !== undefined && groupId !== -1) { // chrome.tabGroups.TAB_GROUP_ID_NONE is -1
        tabsGroup({
          groupId,
          tabIds: newTab.id,
        }, (groupId: number) => {
          console.debug("(fallback) tab", newTab.id, "moved to group", groupId);
        });
      }
    }
  } else {
    tab = await tabs.update({ url });
    console.debug("(fallback) updated tab:", tab);
  }
}
