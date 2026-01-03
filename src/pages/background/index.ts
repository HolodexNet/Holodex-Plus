import { openHolodexUrl } from "@utils";
import {
  action,
  contextMenus,
  DeclarativeNetRequest,
  declarativeNetRequest,
  runtime,
} from "webextension-polyfill";

console.log("[Holodex+] background script loaded");

runtime.onInstalled.addListener(() => {
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
        initiatorDomains: [ "youtube.com" ],
        resourceTypes: [ "sub_frame", "main_frame" ],
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
        resourceTypes: [ "xmlhttprequest" ],
      },
    },
  ] satisfies DeclarativeNetRequest.Rule[];

  // Clear existing rules and add the new rule
  declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ 1, 2 ],
    addRules: rules,
  });
});

runtime.onInstalled.addListener(() => {
  const ytVideoPages = [
    "https://*.youtube.com/feed/*",
    "https://*.youtube.com/watch?*",
    "https://*.youtube.com/shorts/*",
  ];

  const ytChannelPages = [
    "https://*.youtube.com/channel*",
    "https://*.youtube.com/@*",
  ];

  contextMenus.create({
    id: "openLinkHolodex",
    title: "Open in Holodex",
    contexts: [ "link" ],
    targetUrlPatterns: [ ...ytVideoPages, ...ytChannelPages ],
  });

  contextMenus.create({
    id: "openLinkMultiview",
    title: "Open in Multiview",
    contexts: [ "link" ],
    targetUrlPatterns: ytVideoPages,
  });

  contextMenus.create({
    id: "openPageHolodex",
    title: "Open in Holodex",
    contexts: [ "page" ],
    documentUrlPatterns: [ ...ytVideoPages, ...ytChannelPages ],
  });

  contextMenus.create({
    id: "openPageMultiview",
    title: "Open in Multiview",
    contexts: [ "page" ],
    documentUrlPatterns: ytVideoPages,
  });

});

contextMenus.onClicked.addListener(async (info, tab) => {
  if (!(tab && tab.url)) return;
  const linkUrl = info.linkUrl || tab.url;
  let isMultiview = false;

  const menuItem = info.menuItemId as string;

  if (menuItem.includes("Multiview"))
    isMultiview = true;

  await openHolodexUrl(linkUrl, tab, isMultiview);
});

action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  await openHolodexUrl(tab.url, tab);
});

runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.greeting === "ytButton_Click" && request.pageUrl && sender.tab) {
    openHolodexUrl(request.pageUrl, sender.tab);
    sendResponse();
  }
});
