// https://greasyfork.org/en/scripts/422206-workaround-for-youtube-chat-memory-leaks/code

// @ts-ignore
const ytglobal = window.ytglobal;
// @ts-ignore
const ytcfg = window.ytcfg;

/*
 * Currently (2021-02-23), youtube live chat has a bug that never execute some scheduled tasks.
 * Those tasks are scheduled for each time a new message is added to the chat and hold the memory until being executed.
 * This script will let the scheduler to execute those tasks so the memory held by those tasks could be freed.
 */
function fixSchedulerLeak() {
  if (!window.requestAnimationFrame) {
    console.warn("[Holodex+]", "fixSchedulerLeak: window.requestAnimationFrame() is required, but missing");
    return;
  }
  const scheduler = ytglobal && ytglobal.schedulerInstanceInstance_;
  if (!scheduler) {
    console.warn("[Holodex+]", "fixSchedulerLeak: schedulerInstanceInstance_ is missing");
    return;
  }
  const code = "" + scheduler.constructor;
  const p1 = code.match(/this\.(\w+)\s*=\s*!!\w+\.useRaf/);
  const p2 = code.match(/\(\"visibilitychange\",\s*this\.(\w+)\)/);
  if (!p1 || !p2) {
    console.warn("[Holodex+]", "fixSchedulerLeak: unknown code");
    return;
  }
  const useRafProp = p1[1];
  const visChgProp = p2[1];
  if (scheduler[useRafProp]) {
    console.info("[Holodex+]", "fixSchedulerLeak: no work needed");
    return;
  }
  scheduler[useRafProp] = true;
  document.addEventListener("visibilitychange", scheduler[visChgProp]);
  console.info("[Holodex+]", "fixSchedulerLeak: leak fixed");
}

/* Enable the element pool to save memory consumption. */
function enableElementPool() {
  if (!ytcfg) {
    console.warn("[Holodex+]", "enableElementPool: ytcfg is missing");
    return;
  }
  if (ytcfg.get("ELEMENT_POOL_DEFAULT_CAP")) {
    console.info("[Holodex+]", "[Holodex+]", "enableElementPool: no work needed");
    return;
  }
  ytcfg.set("ELEMENT_POOL_DEFAULT_CAP", 75);
  console.info("[Holodex+]", "enableElementPool: element pool enabled");
}

// Re-emit events from wrong origins
window.addEventListener("message", (event) => {
  if(event.origin.match(/(localhost|holodex.net)/)) {
    window.postMessage(event.data, "*");
  }
}, false);

fixSchedulerLeak();
enableElementPool();
