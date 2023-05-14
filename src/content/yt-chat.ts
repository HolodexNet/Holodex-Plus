import { inject, validOrigin } from "../util";

inject("content/yt-chat-overrides.inject.js");

// Re-emit events from wrong origins
window.addEventListener("message", (event) => {
  if (validOrigin(event.origin)) {
    window.postMessage(event.data, "*");
  }
});
