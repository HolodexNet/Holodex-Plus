import { Options } from "@src/utils/options";

// Holodex button injected into YT pages
(async () => {
  if (!(await Options.get("holodexButtonInYoutube"))) return;

  let pageUrl: string;
  let pageType: string;
  let shortsPage = false;
  let rendered = false;

  // This fires on both new page (re)load and internal navigation to another page
  // allowing it to clear the rendered flag.
  document.addEventListener("yt-navigate-finish", (evt: any) => {
    console.debug("[Holodex+] yt-navigate-finish event.detail:", evt.detail);
    pageUrl = "https://www.youtube.com" + evt.detail.response.url;
    pageType = evt.detail.pageType;
    shortsPage = pageType === "shorts";
    rendered = false;
  });

  function clickButton() {
    const response = chrome.runtime.sendMessage({
      pageUrl,
      greeting: "ytButton clicked",
    });
    console.debug("[Holodex+] YT Button clicked:", response);
  }

  function nodeNotFoundError(node: string) {
    return new Error("[Holodex+] could not find " + node);
  }

  function render(target: Element) {
    console.debug("[Holodex+] (re)rendering Holodex button within", target);
    const holodexIcon = `
    <svg class="yt-watch-holodex-icon" viewBox="10.646699905395508 4.526976108551025 18.35555076599121 17.86052703857422" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7109 19.1446L13.7109 13.4572L13.7109 7.76991L14.6989 8.36834V13.4572L14.6989 18.5462L13.7109 19.1446ZM14.3575 22.0797C14.8429 22.4335 15.5224 22.5127 16.1107 22.1563L28.2404 14.8093C29.2562 14.1941 29.2562 12.7204 28.2404 12.1051L16.1107 4.75813C15.5224 4.40181 14.8429 4.48096 14.3574 4.8348L25.1328 11.3615C25.2107 11.4087 25.2848 11.4591 25.355 11.5125L27.7285 12.9502C28.1095 13.1809 28.1095 13.7336 27.7285 13.9643L25.3552 15.4018C25.2849 15.4553 25.2108 15.5058 25.1328 15.553L14.3575 22.0797Z"></path>
      <path d="M10.6467 13.4572L10.6467 6.11021C10.6467 5.26342 11.5722 4.74193 12.2965 5.18064L24.4262 12.5276C25.1245 12.9506 25.1245 13.9638 24.4262 14.3868L12.2965 21.7338C11.5722 22.1725 10.6467 21.651 10.6467 20.8042L10.6467 13.4572Z" stroke-width="0.987994"></path>
    </svg>
    `;

    for (const container of document.querySelectorAll("#holodex-button")) {
      container.remove();
    }

    let ytElement = shortsPage
      ? document.getElementById("share-button")
      : target.querySelector("yt-button-view-model");
    if (!ytElement)
      throw nodeNotFoundError(
        shortsPage ? "share-button" : "yt-button-view-model",
      );

    const replaceValues = {
      "<!--css-build:shady-->": "",
      "<ytd-": "<ytd-holodex-",
      "</ytd-": "</ytd-holodex-",
      "<yt-": "<yt-holodex-",
      "</yt-": "</yt-holodex-",
    };

    const container = document.createElement(
      shortsPage ? "div" : "yt-watch-holodex-btn-container",
    );
    container.setAttribute("id", "holodex-button");
    container.className = ytElement.className;
    container.innerHTML = ytElement.innerHTML;
    for (const [searchValue, replaceValue] of Object.entries(replaceValues)) {
      container.innerHTML = container.innerHTML.replaceAll(
        searchValue,
        replaceValue,
      );
    }
    container.addEventListener("click", clickButton);

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

      const ytTooltip = container.querySelector("tp-yt-paper-tooltip");
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

      button.appendChild(label);
    }

    ytButton.replaceWith(button);
    shortsPage
      ? target.insertBefore(container, target.firstChild)
      : target.appendChild(container);
    rendered = true;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    console.log("[Holodex+] yt-watch script loaded");

    const ytdApp = document.querySelector("ytd-app");
    if (!ytdApp) throw nodeNotFoundError("ytd-app");

    // Setup mutation observer to (re)render on Watch and Shorts pages,
    // both for new page (re)load and internal navigation to another page.
    new MutationObserver(() => {
      if (rendered) return;
      if (shortsPage) {
        const ytdReelVideoRenderer = ytdApp.querySelector(
          "ytd-reel-video-renderer[is-active]",
        );
        if (!ytdReelVideoRenderer) return;

        const actions = ytdReelVideoRenderer.querySelector("#actions");
        if (!actions) throw nodeNotFoundError("#actions");
        console.debug("[Holodex+] found #actions:", actions);

        render(actions);
      } else {
        const actions = ytdApp.querySelector("#actions");
        if (!actions) throw nodeNotFoundError("#actions");
        console.debug("[Holodex+] found #actions:", actions);

        // If #actions already contains #top-level-buttons-computed, render immediately.
        // Note: #top-level-buttons-computed is not unique, so not using document.getElementById.
        const target = actions.querySelector("#top-level-buttons-computed");
        if (!target) throw nodeNotFoundError("#top-level-buttons-computed");

        render(target);
      }
    }).observe(ytdApp, { childList: true, subtree: true });
  });
})();
