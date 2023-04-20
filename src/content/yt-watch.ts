import { Options, searchObject, CANONICAL_URL_REGEX } from "src/util";
import { runtime } from "webextension-polyfill";

// This is an external JS lib without typing (d.ts), so need the @ts-ignore
// @ts-ignore
import Signal from "signal-promise";

// Holodex button injected into YT pages
(async () => {
  if (!(await Options.get("openInHolodexButton"))) return;

  const icon3 = `
  <svg class="yt-watch-holodex-icon" viewBox="10.646699905395508 4.526976108551025 18.35555076599121 17.86052703857422" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7109 19.1446L13.7109 13.4572L13.7109 7.76991L14.6989 8.36834V13.4572L14.6989 18.5462L13.7109 19.1446ZM14.3575 22.0797C14.8429 22.4335 15.5224 22.5127 16.1107 22.1563L28.2404 14.8093C29.2562 14.1941 29.2562 12.7204 28.2404 12.1051L16.1107 4.75813C15.5224 4.40181 14.8429 4.48096 14.3574 4.8348L25.1328 11.3615C25.2107 11.4087 25.2848 11.4591 25.355 11.5125L27.7285 12.9502C28.1095 13.1809 28.1095 13.7336 27.7285 13.9643L25.3552 15.4018C25.2849 15.4553 25.2108 15.5058 25.1328 15.553L14.3575 22.0797Z"></path>
    <path d="M10.6467 13.4572L10.6467 6.11021C10.6467 5.26342 11.5722 4.74193 12.2965 5.18064L24.4262 12.5276C25.1245 12.9506 25.1245 13.9638 24.4262 14.3868L12.2965 21.7338C11.5722 22.1725 10.6467 21.651 10.6467 20.8042L10.6467 13.4572Z" stroke-width="0.987994"></path>
  </svg>
  `;
  
  let served = false;
  
  function openHolodex() {
    const currentUrl = new URL(window.location.href);
    const videoID = currentUrl.searchParams.get("v");
    const t = currentUrl.searchParams.get("t");
    const holodexUrl = `https://holodex.net/watch/${videoID}${t ? `?t=${t}` : ""}`;
    window.open(holodexUrl);
  }
  
  function cleanup() {
    document.querySelectorAll("#yt-watch-holodex-btn-container").forEach((item) => item.remove());
  }
  
  function inject(target: Element) {
    const container = document.createElement("a");
    container.id = "yt-watch-holodex-btn-container";
    container.style.textDecoration = "none";
    container.style.cursor = "pointer";
    container.style.marginLeft = "6px";
    container.title = "Open in Holodex";
    container.addEventListener("click", openHolodex);
  
    container.innerHTML = `
<div class="yt-watch-holodex-btn">
  ${icon3}
  <span class="yt-watch-holodex-label">Holodex</span>
</div>
    `;
  
    target.appendChild(container);
  }

  // Note: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
  // "If you only want the listener to respond to messages of a certain type, you must define the listener as a non-async function,
  // and return a Promise only for the messages the listener is meant to respond to — and otherwise return false or undefined"
  runtime.onMessage.addListener((message) => {
    if (message?.command !== "loaded") return;
    served = false;
    return Promise.resolve();
  });

  const onMutation = (mutations: MutationRecord[]) => {
    if (served) return;

    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      const target = mutation.target as Element;
      if (target.id !== "top-level-buttons-computed") continue;

      // re-render button
      cleanup();
      inject(target);

      served = true;
      break;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver(onMutation);
    observer.observe(document.querySelector("ytd-app")!, { attributes: false, childList: true, subtree: true });
  });
})();

// getCanonicalUrl handler
{
  // The canonical URL is available in link[rel="canonical"] and some other element attrs/content,
  // but it does not update when internally navigating to another page,
  // i.e. a user clicks a YT link from within a YT page.
  // If we were in the page context, we could access ytd-app.data to derive the canonical URL.
  // However, that is managed by YT's own script, so it's inaccessible from this content script context.
  // Workaround: we can listen into YT's custom event that fires whenever page data is fetched,
  // including both new page (re)load and internal navigation to another page.
  let pageData: any = null;
  let pageDataLabel: string; // for debug logging
  let pageDataSignal = new Signal(); // actually a condition variable in concurrency parlance
  document.addEventListener("yt-page-data-fetched", (evt: any) => {
    console.debug("[Holodex+] yt-page-data-fetched event.detail:", evt.detail);
    pageData = evt.detail?.pageData;
    if (!pageData) {
      console.warn("[Holodex+] yt-page-data-fetched event.detail.pageData unexpectedly", pageData);
      return;
    }
    pageDataLabel = "yt-page-data-fetched event.detail.pageData:";
    pageDataSignal.notify();
  });

  function getCanonicalUrlFromData(pageData: any) {
    // Note: Not using pageData.url since it can e.g. be live/<video_id> which is not canonical.
    // Following should be compatible with the fallback fetch in the background script,
    // that is, the first canonical URL found on the page.
    let canonicalUrl: string | null = null;
    switch (pageData.page) {
      case "watch":
      case "shorts":
        const video_id = pageData.playerResponse?.videoDetails?.videoId;
        if (video_id) {
          // Technically, shorts canonical URL should /shorts/<video_id> but watch page works.
          canonicalUrl = "https://www.youtube.com/watch?v=" + video_id;
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

  // If yt-page-data-fetched hasn't fired yet when getCanonicalUrl message is received,
  // then ideally we'd access ytInitialData/ytInitialPlayerResponse/ytPageType as a fallback.
  // However, as global vars in the page context, they're inaccessible form this content script context.
  // Instead, we'll search the script elements for these global vars.
  // There's the alternative of injecting a page context script and communicating with it to get these globals
  // (and ytd-app.data for that matter), but that whole approach is a PITA.
  // This doesn't have to be perfectly reliable - there's always the fetch fallback in the background script.
  document.addEventListener("DOMContentLoaded", () => {
    console.debug("[Holodex+] DOMContentLoaded");
    // If yt-page-data-fetched has already fired, pageData should already exist.
    if (pageData) return;
    // Otherwise, fall back to yt* global vars.
    const scripts = [...document.querySelectorAll("script[nonce]")];
    const ytPageType = findGlobalJson(scripts, "ytPageType", true);
    const ytInitialData = findGlobalJson(scripts, "ytInitialData", true);
    const ytInitialPlayerResponse = findGlobalJson(scripts, "ytInitialPlayerResponse", false);
    pageData = {
      page: ytPageType,
      response: ytInitialData,
      playerResponse: ytInitialPlayerResponse,
    };
    if (!pageData.playerResponse) delete pageData.playerResponse;
    pageDataLabel = "yt* global vars:";
    pageDataSignal.notify();
  });

  function findGlobalJson(scripts: Element[], varName: string, required: boolean) {
    for (const script of scripts) {
      const scriptText = script.textContent;
      if (!scriptText) continue;
      const ytInitialData = parseGlobalJson(scriptText, varName);
      if (ytInitialData !== null) {
        console.debug("[Holodex+] found", varName, "global:", ytInitialData, "\nin script:", script);
        return ytInitialData;
      }
    }
    if (required) throw new Error(`[Holodex+] unexpectedly could not find ${varName}`);
    return null;
  }

  // This assumes that the global var declarations follow a certain pattern,
  // including the value being valid JSON (rather than a non-JSON JS literal).
  function parseGlobalJson(text: string, varName: string) {
    const regex = new RegExp(String.raw`\b(?:(?:window\s*\.\s*)?${varName}|window\s*\[\s*['"]${varName}['"]\s*\])\s*=\s*`);
    let match = text.match(regex);
    if (!match) return null;
    text = text.substring(match.index! + match[0].length);
    let term: string;
    switch (text[0]) {
      case "{":
        term = "}"; break;
      case "[":
        term = "]"; break;
      case "'":
      case '"':
        term = text[0]; break;
      default: {
        match = text.match(/^[^;]+/);
        if (!match) return null;
        return JSON.parse(match[0]);
      }
    }
    const termRegex = new RegExp(String.raw`${term}\s*;`);
    let termMatch = termRegex.exec(text);
    while (termMatch) {
      try {
        return JSON.parse(text.substring(0, termMatch.index + 1));
      } catch (e) {
        // Not complete JSON yet - continue to next iteration
        termMatch = termRegex.exec(text);
      }
    }
    return null;
  }

  async function findCanonicalUrl() {
    if (!pageData) {
      console.debug("[Holodex+] waiting for page data to become available...");
      await pageDataSignal.wait(1000);
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

  runtime.onMessage.addListener((message) => {
    if (message?.command !== "getCanonicalUrl") return;
    return Promise.resolve(findCanonicalUrl());
  });
}
