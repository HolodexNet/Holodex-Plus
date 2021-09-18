// Allows all of youtube to be iframed (mainly used for Archive Chat)
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    return {
      responseHeaders: details?.responseHeaders?.filter(header => header.name.toLowerCase() !== 'x-frame-options')
    };
  }, {
    urls: ["*://*.youtube.com/*"]
  }, ["blocking", "responseHeaders"]);
