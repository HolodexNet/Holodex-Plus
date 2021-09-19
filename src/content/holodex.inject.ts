import browser from "webextension-polyfill";

const id = window.location.pathname.split("/").slice(-1)[0];
browser.runtime.onMessage.addListener((m: any, s: browser.Runtime.MessageSender) => {
  if (m.id !== id) return;
  console.log("[Holodex+]", `Message from player ${id}`, m);
});

console.log("[Holodex+]", "Loaded in Holodex.net");
