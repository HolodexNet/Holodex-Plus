import { ipc, getHolodexUrl, CANONICAL_URL_REGEX } from "src/util";
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

// Clicking on Holodex extension icon opens Holodex
browserAction.onClicked.addListener(async function(tab) {
  console.debug("Holodex button clicked for active tab:", tab);
  if (tab.id === undefined || tab.id === tabs.TAB_ID_NONE) return;
  openHolodexUrl(tab);
});

// Opens Holodex URL for current URL in either a new tab or the same tab, depending on openHolodexInNewTab option.
//
// This delegates to the context script to work around an issue for the openHolodexInNewTab=false case:
// For Chromium-based browsers, chrome.tabs.update doesn't reliably push a new entry onto the tab's session history,
// instead replacing the current state, e.g. if tab has history [A,B] and we're trying to chrome.tabs.update to C,
// this sometimes results in [A,C] rather than [A,B,C].
// Details: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/n3vFlEYueyo
// Firefox doesn't have this problem (and in fact, provides a loadReplace flag to control the behavior),
// but might as well standardize for all browsers.
// The workaround of updating the tab in the context script context via location.assign
// (or assigning location.href) does seem to always push a new entry onto the tab's session history.
// For the openHolodexInNewTab=true case, delegating to the content script is actually convenient,
// since window.open sets tab position, opener, and tab group (for Chromium-based browsers) properly.
async function openHolodexUrl(tab: Tabs.Tab) {
  try {
    const result = await tabs.sendMessage(tab.id!, { command: "openHolodexUrl" });
    if (result) {
      // There's no 100% reliable way to get the tab id of a newly opened tab created from content/page script,
      // so don't bother to try fetching that new tab just for debug logging.
      console.debug(result.newTabOpened ? "new tab created" : "updated tab", "from content script:", result.url);
    } else {
      console.debug("no new/updated tab for:", tab.url);
    }
  } catch (e) {
    console.debug("(fallback) due to:", e);
    fallbackOpenHolodexUrl(tab);
  }
}

// Fallback in case Holodex+ was unloaded or out of date on the page
// (Chromium-based browsers, unlike Firefox, don't load content scripts upon enabling extensions).
// This uses chrome.tabs.update when openHolodexInNewTab=false and thus is susceptible to the issue
// described above, but it's better than nothing.
// It also uses a simpler canonical URL search by fetching the page again and finding the first match.
async function fallbackOpenHolodexUrl(tab: Tabs.Tab) {
  const url = await getHolodexUrl(tab.url, async (url) => {
    console.debug("(fallback) fetch original page for canonical URL");
    const doc = await (await fetch(url)).text();
    const match = doc.match(CANONICAL_URL_REGEX);
    const canonicalUrl = match ? "https://www.youtube.com" + match[0] : null;
    console.debug("(fallback) found canonical URL:", canonicalUrl);
    return canonicalUrl;
  });
  if (!url) {
    console.debug("(fallback) no new/updated tab for:", tab.url);
    return;
  }
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
