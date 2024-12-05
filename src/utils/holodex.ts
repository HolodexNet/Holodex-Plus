import { Options } from "@src/utils/options";

const HOLODEX_URL_HOME = "https://holodex.net";
const HOLODEX_URL_REGEX = /^(?:[^:]+:\/\/)?(?:[^\/]+\.)?holodex.net\b/i;
const YOUTUBE_HOSTNAME_REGEX = /^(?:[^\/]+\.)?youtube.com/i;
const FEED_PATHNAME_REGEX = /^(?:\/?$|\/feed\b)/i; // pathname matches homepage or any feed like subscriptions
const CHANNEL_URL_REGEX = /(?<=[=\/?&#])[A-Za-z0-9\-_]{24}(?=[=\/?&#]|$)/;
const VIDEO_URL_REGEX = /(?<=[=\/?&#])[A-Za-z0-9\-_]{11}(?=[=\/?&#]|$)/;
const CANONICAL_URL_REGEX =
  /\/(?:channel\/[A-Za-z0-9\-_]{24}|(?:shorts\/|watch\?v=)[A-Za-z0-9\-_]{11})\b/;

export async function openHolodexUrl(url: string, tab: chrome.tabs.Tab) {
  const holodexUrl = await getHolodexUrl(url);
  if (!holodexUrl) return;

  const currentTabId = tab.id;
  if (await Options.get("openHolodexInNewTab"))
    await chrome.tabs.create({ url: holodexUrl, index: tab.index + 1 });
  else if (currentTabId)
    await chrome.tabs.update(currentTabId, { url: holodexUrl });
  else
    // fallback behavior
    await chrome.tabs.create({ url: holodexUrl, index: 9999 });
}

/**
 * Returns a promise resolving to the Holodex URL for given URL.
 * Supports returning Holodex channel and watch Holodex URLs,
 * and defaults to Holodex homepage for non-YT URLs and YT homepage & feeds.
 * For other YT URLs, including the new @<channel> URLs, delegates to given handler,
 * which is passed the given URL and returns a promise resolving to a YT canonical URL,
 * from which to derive the Holodex URL from.
 */
export async function getHolodexUrl(url: string | undefined) {
  function matchURL(testUrl: string): string | undefined {
    const videoMatch = testUrl.match(VIDEO_URL_REGEX);
    if (videoMatch) {
      return HOLODEX_URL_HOME.concat(`/watch/${videoMatch[0]}`);
    }
    const channelMatch = testUrl.match(CHANNEL_URL_REGEX);
    if (channelMatch) {
      return HOLODEX_URL_HOME.concat(`/channel/${channelMatch[0]}`);
    }
  }

  if (url) {
    if (HOLODEX_URL_REGEX.test(url)) {
      return null;
    }

    const result = matchURL(url);
    if (result) return result;

    const urlObj = new URL(url);
    if (
      YOUTUBE_HOSTNAME_REGEX.test(urlObj.hostname) &&
      !FEED_PATHNAME_REGEX.test(urlObj.pathname)
    ) {
      const canonicalUrl = await findCanonicalUrl(url);
      if (canonicalUrl) {
        const result = matchURL(canonicalUrl);
        if (result) return result;
      }
    }
  }
  return HOLODEX_URL_HOME;
}

async function findCanonicalUrl(url: string): Promise<string | null> {
  console.debug("(fallback) fetch original page for canonical URL");
  const doc = await (await fetch(url)).text();
  const match = doc.match(CANONICAL_URL_REGEX);
  const canonicalUrl = match ? "https://www.youtube.com" + match[0] : null;
  console.debug("(fallback) found canonical URL:", canonicalUrl);
  return canonicalUrl;
}
