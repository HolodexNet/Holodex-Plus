import { runtime } from "webextension-polyfill";

document.getElementById("options")?.addEventListener("click", () => runtime.openOptionsPage());
