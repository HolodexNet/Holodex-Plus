import { Options, inject, getHolodexUrl, searchObject, CANONICAL_URL_REGEX } from "src/util";
import { runtime } from "webextension-polyfill";

// This is an external JS lib without typing (d.ts), so need the @ts-ignore
// @ts-ignore
import Signal from "signal-promise";

// If openHolodexInNewTab=true, opens given URL in a new focused tab and returns true,
// or null if somehow unsuccessful.
// If openHolodexInNewTab=false, opens given URL in the same tab, preserving the tab's session history,
// and returns false.
async function openUrl(url: string) {
  if (await Options.get("openHolodexInNewTab")) {
    const newWindow = window.open(url);
    if (newWindow) {
      newWindow.focus();
      return true;
    }
    return null;
  } else {
    window.location.assign(url);
    return false;
  }
}

// Holodex button injected into YT pages
(async () => {
  if (!(await Options.get("holodexButtonInYoutube"))) return;

  const holodexIcon = `
  <svg class="yt-watch-holodex-icon" viewBox="10.646699905395508 4.526976108551025 18.35555076599121 17.86052703857422" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7109 19.1446L13.7109 13.4572L13.7109 7.76991L14.6989 8.36834V13.4572L14.6989 18.5462L13.7109 19.1446ZM14.3575 22.0797C14.8429 22.4335 15.5224 22.5127 16.1107 22.1563L28.2404 14.8093C29.2562 14.1941 29.2562 12.7204 28.2404 12.1051L16.1107 4.75813C15.5224 4.40181 14.8429 4.48096 14.3574 4.8348L25.1328 11.3615C25.2107 11.4087 25.2848 11.4591 25.355 11.5125L27.7285 12.9502C28.1095 13.1809 28.1095 13.7336 27.7285 13.9643L25.3552 15.4018C25.2849 15.4553 25.2108 15.5058 25.1328 15.553L14.3575 22.0797Z"></path>
    <path d="M10.6467 13.4572L10.6467 6.11021C10.6467 5.26342 11.5722 4.74193 12.2965 5.18064L24.4262 12.5276C25.1245 12.9506 25.1245 13.9638 24.4262 14.3868L12.2965 21.7338C11.5722 22.1725 10.6467 21.651 10.6467 20.8042L10.6467 13.4572Z" stroke-width="0.987994"></path>
  </svg>
  `;

  let pageType: string;
  let shortsPage = false;

  // This fires on both new page (re)load and internal navigation to another page
  // (yt-page-data-fetched and other events also fire but before navigation finishes),
  // allowing it to clear the rendered flag.
  document.addEventListener("yt-navigate-finish", (evt: any) => {
    console.debug("[Holodex+] yt-navigate-finish event.detail:", evt.detail);
    pageType = evt.detail.pageType;
    shortsPage = (pageType === "shorts");

    if (pageType === "shorts" || pageType === "watch") {
      setTimeout(() => {
        const ytdApp = document.querySelector("ytd-app");
        if (!ytdApp) throw nodeNotFoundError("ytd-app");
    
        let actions, ytdReelVideoRenderer;
        if (shortsPage) {
          ytdReelVideoRenderer = ytdApp.querySelector("ytd-reel-video-renderer[is-active]");
          if (!ytdReelVideoRenderer) throw nodeNotFoundError("ytd-reel-video-renderer");
          console.debug("[Holodex+] found ytd-reel-video-renderer:", ytdReelVideoRenderer);
    
          actions = ytdReelVideoRenderer.querySelector("#actions");
        } else {
          actions = ytdApp.querySelector("#actions");
        }
        if (!actions) throw nodeNotFoundError("#actions");
        console.debug("[Holodex+] found #actions:", actions);

        // If #actions already contains #like-button or #top-level-buttons-computed, render immediately.
        // Note: #top-level-buttons-computed is not unique, so not using document.getElementById.
        const target = actions.querySelector(shortsPage ? "#like-button" : "#top-level-buttons-computed");
        if (!target) throw nodeNotFoundError(shortsPage ? "#like-button" : "#top-level-buttons-computed");

        render(target);
      }, 750);
    }
  });

  async function openHolodex() {
    const currentUrl = new URL(window.location.href);
    const videoId = shortsPage ? currentUrl.pathname.split('/')[2] : currentUrl.searchParams.get("v");
    // TODO: Holodex watch page doesn't actually support the t param yet...
    const t = currentUrl.searchParams.get("t");
    await openUrl(`https://holodex.net/watch/${videoId}${t ? `?t=${t}` : ""}`);
  }

  function render(target: Element) {
    console.debug("[Holodex+] (re)rendering Holodex button within", target);
    for (const container of document.querySelectorAll("#holodex-button")) {
      container.remove();
    }

    let ytElement = shortsPage ? document.getElementById("share-button") : target.querySelector("yt-button-view-model");
    if (!ytElement) throw nodeNotFoundError(shortsPage ? "share-button" : "yt-button-view-model");

    const replaceValues = {
      "<!--css-build:shady-->": "",
      "<ytd-": "<ytd-holodex-",
      "</ytd-": "</ytd-holodex-",
      "<yt-": "<yt-holodex-",
      "</yt-": "</yt-holodex-",
    }

    const container = document.createElement(shortsPage ? "div" : "yt-watch-holodex-btn-container");
    container.setAttribute("id", "holodex-button");
    container.className = ytElement.className;
    container.innerHTML = ytElement.innerHTML;
    for (const [searchValue, replaceValue] of Object.entries(replaceValues)) {
      container.innerHTML = container.innerHTML.replaceAll(searchValue, replaceValue);
    }
    container.addEventListener("click", openHolodex);
    
    const ytButton = container.querySelector("button");
    if (!ytButton) throw nodeNotFoundError("button");
    
    const button = document.createElement("button");
    button.className = ytButton.className;
    button.classList.add("yt-watch-holodex-btn");
    button.setAttribute("arial-label", "Open in Holodex");
    button.innerHTML = `${holodexIcon}`;
    
    const label = document.createElement("span");
    label.textContent = "Holodex";

    if (shortsPage) {
      const ytLabel = container.querySelector("span");
      if (!ytLabel) throw nodeNotFoundError("span");

      label.className = ytLabel.className;

      const ytTooltip  = container.querySelector("tp-yt-paper-tooltip");
      if (!ytTooltip) throw nodeNotFoundError("tp-yt-paper-tooltip");
      const tooltip = ytTooltip.cloneNode() as HTMLElement;
      if (!tooltip) return;
      
      tooltip.textContent = "Open in Holodex";

      ytLabel.replaceWith(label);
      ytTooltip.replaceWith(tooltip);
    } else {
      container.style.marginLeft = "8px";
      button.setAttribute("title", "Open in Holodex");
      label.classList.add("yt-watch-holodex-label");
      label.style.marginLeft = "8px";
      
      button.appendChild(label)
    }

    ytButton.replaceWith(button);
    shortsPage ? target.parentNode?.insertBefore(container, target) : target.appendChild(container);
  }

  function nodeNotFoundError(node: string) {
    return new Error("[Holodex+] could not find " + node);
  }
})();

// openHolodexUrl handler
{
  // Note regarding the Promise.resolve below:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
  // "If you only want the listener to respond to messages of a certain type, you must define the listener as a non-async function,
  // and return a Promise only for the messages the listener is meant to respond to — and otherwise return false or undefined"
  runtime.onMessage.addListener((message) => {
    if (message?.command !== "openHolodexUrl") return;
    console.debug("[Holodex+] handling openHolodexUrl message");
    return Promise.resolve(openHolodexUrl());
  });

  async function openHolodexUrl() {
    const url = await getHolodexUrl(window.location.href, findCanonicalUrl)
    if (!url) return null;
    const newTabOpened = await openUrl(url);
    console.debug("[Holodex+]", newTabOpened ? "new tab created:" : "updated tab:", url);
    return { url, newTabOpened };
  }

  // Finds the "canonical URL" for a YT page, from which we can derive the Holodex URL.
  async function findCanonicalUrl() {
    if (!pageData) {
      console.debug("[Holodex+] waiting for page data to become available...");
      await pageDataSignal.wait(3000);
      if (!pageData) {
        console.log("[Holodex+] page data still unavailable - will default to fetch fallback to find canonical URL");
        return null;
      }
    }
    console.debug("[Holodex+] page data from", pageDataLabel, pageData);
    const canonicalUrl = getCanonicalUrlFromData(pageData);
    console.debug("[Holodex+] found canonical URL:", canonicalUrl);
    return canonicalUrl;
  }

  // The canonical URL is available in link[rel="canonical"] and some other element attrs/content,
  // but it does not update when internally navigating to another page,
  // i.e. a user clicks a YT link from within a YT page.
  // We can derive the canonical URL from ytd-app.data, or yt* global vars initially,
  // but those are managed by YT's own scripts and thus inaccessible from the content script context.
  // While we can access both in the page context via an injected page script,
  // it's a PITA to round-trip messages between content script and injected page script.
  // Instead, there are events we can hook into to broadcast data updates to this content script.
  // See yt-watch.inject.ts
  let pageData: any = null;
  let pageDataLabel: string; // for debug logging
  let pageDataSignal = new Signal(); // actually a condition variable in concurrency parlance
  window.addEventListener("message", (evt: MessageEvent) => {
    if (evt.origin !== window.location.origin || evt.source !== window || !evt.data?.pageData) return;
    //console.debug("[Holodex+] received pageData message:", evt.data);
    ({ pageData, pageDataLabel } = evt.data);
    if (pageData) pageDataSignal.notify();
  });
  inject("content/yt-watch.inject.js");

  function getCanonicalUrlFromData(pageData: any) {
    // Note: Not using pageData.url since it can e.g. be live/<videoId> which is not canonical.
    // Following should be compatible with the fallback fetch in the background script,
    // that is, the first canonical URL found on the page.
    let canonicalUrl: string | null = null;
    switch (pageData.page) {
      case "watch":
      case "shorts":
        const videoId = pageData.playerResponse?.videoDetails?.videoId;
        if (videoId) {
          // Technically, shorts canonical URL should /shorts/<videoId> but watch page works.
          canonicalUrl = "https://www.youtube.com/watch?v=" + videoId;
        }
        break;
      case "channel":
        // data.response.microformat.microformatDataRenderer.urlCanonical also works.
        canonicalUrl = pageData.response?.metadata?.channelMetadataRenderer?.channelUrl;
        break;
      case "playlist": // not directly supported due to lack of corresponding Holodex page, so fall-through.
      default:
        // Find the first canonical URL found in data, which should also be the first canonical URL
        // found in the whole page, which is what the fetch fallback in the background script does.
        canonicalUrl = searchObject(pageData, item => {
          if (typeof item.val === "string") {
            const match = item.val.match(CANONICAL_URL_REGEX);
            if (match) return "https://www.youtube.com" + match[0];
          }
          return null;
        });
    }
    return canonicalUrl;
  }
}
