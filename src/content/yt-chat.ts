import { inject, Options, validOrigin } from "../util";

(async () => {
  if (!(await Options.get("liveChatMemoryLeakFix"))) return;
  console.log("[Holodex+] Injecting live chat memory leak fix");
  inject("content/yt-chat-overrides.inject.js");
})();

// Re-emit events from wrong origins
window.addEventListener("message", (event) => {
  if(validOrigin(event.origin)) {
    window.postMessage(event.data, "*");
  }
}, false);