import { inject, Options } from "../util";

(async () => {
  if (!(await Options.get("liveChatMemoryLeakFix"))) return;
  console.log("[Holodex+] Injecting live chat memory leak fix");
  inject("content/yt-chat-overrides.inject.js");
})();
