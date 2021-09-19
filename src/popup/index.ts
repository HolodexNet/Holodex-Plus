import browser from "webextension-polyfill";

document.getElementById("options")?.addEventListener("click", () => browser.runtime.openOptionsPage());
