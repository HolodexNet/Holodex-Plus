import { CANONICAL_URL_REGEX, getHolodexUrl, Options } from "@src/utils";

console.log("[Holodex+] background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  // Define the rule to remove the "X-Frame-Options" header
  const rules = [
    {
      id: 1, // Unique rule ID
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          {
            header: "X-Frame-Options",
            operation: "remove",
          },
        ],
      },
      condition: {
        initiatorDomains: ["youtube.com"],
        resourceTypes: ["sub_frame", "main_frame"],
      },
    },
    {
      id: 2, // Unique ID for this rule
      priority: 1, // Priority for applying the rule
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "Origin",
            operation: "set",
            value: "https://www.youtube.com",
          },
        ],
      },
      condition: {
        urlFilter: "https://www.youtube.com/youtubei/v1/like/*",
        resourceTypes: ["xmlhttprequest"],
      },
    },
  ] satisfies chrome.declarativeNetRequest.Rule[];

  // Clear existing rules and add the new rule
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2],
    addRules: rules,
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  await openHolodexUrl(tab.url);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openInHolodex",
    title: "Open in Holodex",
    contexts: ["link"],
    documentUrlPatterns: ["https://*.youtube.com/*"],
    targetUrlPatterns: [
      "https://*.youtube.com/",
      "https://*.youtube.com/feed/*",
      "https://*.youtube.com/channel*",
      "https://*.youtube.com/watch?*",
      "https://*.youtube.com/shorts/*",
      "https://*.youtube.com/@*",
    ],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openInHolodex" && tab && tab.url) {
    const linkUrl = info.linkUrl || tab.url;
    openHolodexUrl(linkUrl);
  }
});

async function openHolodexUrl(url: string) {
  const holodexUrl = await getHolodexUrl(url, async (url) => {
    console.debug("(fallback) fetch original page for canonical URL");
    const doc = await (await fetch(url)).text();
    const match = doc.match(CANONICAL_URL_REGEX);
    const canonicalUrl = match ? "https://www.youtube.com" + match[0] : null;
    console.debug("(fallback) found canonical URL:", canonicalUrl);
    return canonicalUrl;
  });
  if (!holodexUrl) return;

  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!currentTab) return;
  const currentTabId = currentTab.id;
  const openInNewTab = await Options.get("openHolodexInNewTab");
  if (openInNewTab) {
    chrome.tabs.create({
      url: holodexUrl,
      index: currentTab.index + 1,
    });
  } else if (currentTabId) {
    chrome.tabs.update(currentTabId, { url: holodexUrl });
  } else {
    // fallback behavior
    chrome.tabs.create({
      url: holodexUrl,
      index: 9999,
    });
  }
}
