import { onThemeChange, waitForEl, ipc, svg, inject } from "../util";
import { mdiThumbUpOutline, mdiThumbUp } from "@mdi/js";

inject("content/holodex-flag.inject.js");

function injectLikeButton(container: Element) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `v-btn v-btn--icon v-btn--round v-size--default ${
    container.firstElementChild?.classList.contains("theme--dark") ? "theme--dark" : "theme--light"
  }`;
  onThemeChange((theme) => (btn.className = `v-btn v-btn--icon v-btn--round v-size--default ${theme}`));
  container.prepend(btn);

  const btnContent = document.createElement("span");
  btnContent.className = "v-btn__content";
  btn.appendChild(btnContent);

  const icon = svg(mdiThumbUpOutline, "v-icon__svg");
  btnContent.appendChild(icon);

  btn.addEventListener("click", () => ipc.send("like"));
  ipc.on("liked", () => icon.firstElementChild!.setAttributeNS(null, "d", mdiThumbUp));

  console.log("[Holodex+] Like button loaded");
}

ipc.on("loaded", async () => {
  const container = await waitForEl(".watch-btn-group");
  if (container) injectLikeButton(container);

  // await injectArchiveChat();
});
