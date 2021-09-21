import { onThemeChange, waitForEl, ipc } from "src/util";
import { mdiThumbUpOutline, mdiThumbUp } from "@mdi/js";

const svg = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="v-icon__svg"><path d="${path}" /></svg>`;

ipc.on("loaded", async () => {
  const container = await waitForEl(".watch-btn-group");
  if (!container) return;

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

  const icon = document.createElement("span");
  icon.className = "v-icon notranslate";
  icon.innerHTML = svg(mdiThumbUpOutline);
  btnContent.appendChild(icon);

  btn.addEventListener("click", () => ipc.send("like"));
  ipc.on("liked", () => (icon.innerHTML = svg(mdiThumbUp)));
});
