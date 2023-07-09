const globals = window as any;

// Broadcast page data for yt-watch's openHolodexUrl usage.
function sendPageData(pageData: any, pageDataLabel: string) {
  pageDataLabel += ":";
  window.postMessage({ pageData, pageDataLabel }, window.location.origin);
}

// This YT custom event fires whenever page data is fetched,
// including both new page (re)load and internal navigation to another page.
// Note: This could be done in the content script context rather than page context,
// but since the yt* global vars fallback requires page context to access,
// might as well implement it here.
let pageData: any = null;
document.addEventListener("yt-page-data-fetched", (evt: any) => {
  console.debug("[Holodex+] yt-page-data-fetched event.detail:", evt.detail);
  pageData = evt.detail?.pageData;
  if (!pageData) {
    console.warn("[Holodex+] yt-page-data-fetched event.detail.pageData unexpectedly", pageData);
    return;
  }
  sendPageData(pageData, "yt-page-data-fetched event.detail.pageData");
});

// Initialize page data from yt* global vars in case above event hasn't fired yet
// by the time yt-watch's openHolodexUrl is received.
// Since not all YT pages have above expected YT globals (including popout live chat and music.youtube.com),
// don't throw errors if the expected global vars aren't found.
function pageDataFromYtGlobals() {
  const page = globals.ytPageType;
  if (!page)
    return console.log("[Holodex+] could not find global ytPageType");
  const response = globals.ytInitialData;
  if (!response)
    return console.log("[Holodex+] could not find global ytInitialData");
  const playerResponse = globals.ytInitialPlayerResponse;
  return {
    page,
    response,
    ...(playerResponse && {playerResponse}) // omit playerResponse if unavailable
  };
}

document.addEventListener("DOMContentLoaded", () => {
  console.debug("[Holodex+] DOMContentLoaded");
  if (pageData) return;
  pageData = pageDataFromYtGlobals();
  if (pageData) sendPageData(pageData, "DOMContentLoaded yt* global vars");
});

console.log("[Holodex+] page script injected");

export {};
