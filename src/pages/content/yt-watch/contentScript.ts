import { Options, loadSVGElement } from "@utils";
import { runtime } from "webextension-polyfill";
import logoRaw from "@assets/img/logo.svg?raw"
import outlineRaw from "@assets/img/outline.svg?raw";

// Holodex button injected into YouTube pages
(async () => {
  if (!(await Options.get("holodexButtonInYoutube"))) return;
  console.log("[Holodex+] yt-watch script loaded");

  const logo = loadSVGElement(logoRaw);
  const outline = loadSVGElement(outlineRaw);

  let pageUrl: string;
  let pageType: string;

  const selectors = {
    shorts: "ytd-reel-video-renderer[is-active] #actions reel-action-bar-view-model",
    watch: "#actions #top-level-buttons-computed",
    buttonID: "#holodex-button",
    tooltip: "yt-tooltip",
    tooltipID: "#holodex-tooltip",
    button: () => { return pageType === "shorts" ? selectors.shorts : selectors.watch; },
    buttonFull: () => { return selectors.button() + " " + selectors.buttonID; },
  }

  // This fires on both new page (re)load and internal navigation to another page
  // allowing it to clear the rendered flag.
  document.addEventListener("yt-navigate-finish", (evt: any) => {
    console.debug("[Holodex+] yt-navigate-finish event.detail:", evt.detail);
    pageUrl = "https://www.youtube.com" + evt.detail.response.url;
    pageType = evt.detail.pageType;
    let counter = 0;

    if (pageType !== "shorts" && pageType !== "watch") return;
    const ytdApp = document.querySelector("ytd-app");
    if (!ytdApp) return;

    render.tooltip(ytdApp.querySelector(selectors.tooltip));
    console.time("[Holodex+] MutationObserver")

    // Setup mutation observer to (re)render on Watch and Shorts pages,
    // both for new page (re)load and internal navigation to another page.
    new MutationObserver((_, observer) => {
      if (pageType !== "shorts" && pageType !== "watch") return;
      const iteration = ++counter;
      setTimeout(async () => {
        if (ytdApp.querySelector(selectors.buttonFull())) return;
        await render.button(ytdApp.querySelector(selectors.button()))

        if (!ytdApp.querySelector(selectors.buttonFull())) return;
        console.timeEnd("[Holodex+] MutationObserver")
        console.log("[Holodex+] MutationObserver Iteration:", iteration)
        observer.disconnect();
      }, 200);
    }).observe(ytdApp, { childList: true, subtree: true });
  });

  const render: { tooltip: Function, button: Function } = {
    tooltip: async (target: Element) => {
      const nodes = document.querySelectorAll(selectors.tooltipID);
      if (nodes.length === 1) return;

      console.debug("[Holodex+] (re)rendering Holodex tooltip within", target);
      const cloneTooltip = target.firstChild?.cloneNode(true) as HTMLElement;
      cloneTooltip.id = "holodex-tooltip";
      target.appendChild(cloneTooltip);

      console.debug("[Holodex+] Holodex tooltip rendered:",
        target.querySelector(selectors.tooltipID));
    },
    button: async (target: Element) => {
      const nodes = target.querySelectorAll(selectors.buttonID)
      for (const node of nodes)
        node.remove();

      console.debug("[Holodex+] (re)rendering Holodex button within", target);
      const container = await createButton(target);
      if (!container) return;

      if (pageType === "shorts") target.insertBefore(container, target.firstChild);
      else target.querySelector("yt-button-view-model")?.after(container)

      console.debug("[Holodex+] Holodex button rendered:",
        target.querySelector(selectors.buttonID));
    },
  }

  function ytButton_Click() {
    const response = runtime.sendMessage({
      pageUrl,
      greeting: "ytButton_Click",
    });
    console.debug("[Holodex+] yt button clicked:", response);
  }

  function ytButton_MouseEnter() {
    const ytPopover = document.getElementById("holodex-tooltip");
    if (!ytPopover) return;

    const ytButton = document.querySelector(selectors.buttonFull() + " button");
    if (!ytButton) return;

    const ytLogo = document.querySelector(selectors.buttonFull() + " svg");
    if (!ytLogo) return;
    ytLogo.outerHTML = logo.outerHTML;

    const rect = ytButton.getBoundingClientRect();
    const leftSide = rect.x + (rect.width - 60) / 2 + window.scrollX;
    const topSide = rect.y + rect.height + 16 + window.scrollY

    ytPopover.classList.add("ytTooltipContainerDefaultTooltipContent", ":popover-open");
    ytPopover.style.inset = `${ topSide }px auto auto ${ leftSide }px`;
    ytPopover.style.boxSizing = "content-box";
    ytPopover.style.display = "block";
    ytPopover.textContent = "Holodex";

    setTimeout(() => {
      ytPopover.classList.remove(":popover-open")
    }, 100);
  }

  function ytButton_MouseLeave() {
    const ytPopover = document.getElementById("holodex-tooltip");
    if (!ytPopover) return;

    const ytLogo = document.querySelector(selectors.buttonFull() + " svg");
    if (!ytLogo) return;
    ytLogo.outerHTML = outline.outerHTML;

    ytPopover.classList.add("ytPopoverComponentHostClosing", ":popover-open");
    setTimeout(() => {
      ytPopover.style.removeProperty("inset");
      ytPopover.style.removeProperty("box-sizing");
      ytPopover.style.removeProperty("display");
      ytPopover.textContent = "";
      ytPopover.classList.remove("ytTooltipContainerDefaultTooltipContent", "ytPopoverComponentHostClosing", ":popover-open")
    }, 50);
  }

  async function createButton(target: Element) {
    const container = target.lastChild?.cloneNode(true) as Element;
    container.id = "holodex-button";
    container.removeAttribute("hidden");
    container.addEventListener("click", ytButton_Click);
    container.addEventListener("focus", ytButton_MouseEnter);
    container.addEventListener("mouseenter", ytButton_MouseEnter);
    container.addEventListener("mouseleave", ytButton_MouseLeave);

    const ytButton = container.querySelector("button");
    if (!ytButton) return;
    ytButton.classList.add("yt-watch-holodex-btn");
    ytButton.setAttribute("aria-label", "Open in Holodex");

    let label = ytButton.nextSibling
    if (!label) {
      const child = ytButton.firstChild;
      if (!child) return;
      label = child.nextSibling;
      if (!label) return;
    }
    label.textContent = "Holodex";

    const holodexIcon = ytButton.querySelector("svg");
    if (!holodexIcon) return;
    holodexIcon.outerHTML = outline.outerHTML;

    return container;
  }
})();
