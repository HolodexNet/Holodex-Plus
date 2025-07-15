import { openHolodexUrl } from "@src/utils";

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

chrome.runtime.onInstalled.addListener(() => {
  let ytVideoPages = [
    "https://*.youtube.com/",
    "https://*.youtube.com/feed/*",
    "https://*.youtube.com/watch?*",
    "https://*.youtube.com/shorts/*",
  ];

  let ytChannelPages = [
    "https://*.youtube.com/channel*",
    "https://*.youtube.com/@*",
  ];

  chrome.contextMenus.create({
    id: "openInHolodex",
    title: "Open in Holodex",
    contexts: ["link", "action"],
    documentUrlPatterns: ["https://*.youtube.com/*"],
    targetUrlPatterns: [...ytVideoPages, ...ytChannelPages],
  });

  chrome.contextMenus.create({
    id: "openInMultiView",
    title: "Open in MultiView",
    contexts: ["link", "action"],
    documentUrlPatterns: ["https://*.youtube.com/*"],
    targetUrlPatterns: ytVideoPages,
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!(tab && tab.url)) return;
  const linkUrl = info.linkUrl || tab.url;
  let isMultiview = false;

  switch (info.menuItemId) {
    case "openInMultiView":
      isMultiview = true;
    case "openInHolodex":
      await openHolodexUrl(linkUrl, tab, isMultiview);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  await openHolodexUrl(tab.url, tab);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.greeting === "ytButton clicked" && request.pageUrl && sender.tab) {
    openHolodexUrl(request.pageUrl, sender.tab);
    sendResponse();
  }
  return true;
});
