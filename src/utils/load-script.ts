export default function load(scriptNameInContent: string) {
  var s = document.createElement("script");
  s.src = chrome.runtime.getURL(scriptNameInContent);
  // Remove script after insert
  s.onload = function () {
    // @ts-ignore
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}
